# PostgREST Schema 暴露方案

## 问题背景

在丹青约平台上，每个应用使用独立的数据库 schema（`app_{app_id}`）。通过 `db_apply_migration` 建表后，PostgREST 不会自动识别新 schema，前端 Supabase 客户端访问时会返回 **406 Not Acceptable**，错误码 `PGRST106`：

```
{"code":"PGRST106","message":"Invalid schema: app_xxx"}
```

## 根因

PostgREST 的 `pgrst.db_schemas` 配置存储在 `authenticator` 角色的会话级设置中。即使通过 SQL 成功更新了该设置，PostgREST 已有的数据库连接仍使用旧配置。`NOTIFY pgrst, 'reload config'` 在该平台上不生效，因为 PostgREST 的 LISTEN 连接未响应通知。

## 解决方案

完整流程分为 3 步，必须按顺序执行：

### 第 1 步：授予 Schema 权限

```sql
-- 授予 Schema 访问权限
GRANT USAGE ON SCHEMA app_{app_id} TO anon, authenticated;

-- 当前已有表的 CRUD 权限
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA app_{app_id} TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA app_{app_id} TO anon, authenticated;

-- 未来新建表/序列的默认权限
ALTER DEFAULT PRIVILEGES IN SCHEMA app_{app_id}
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA app_{app_id}
  GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated;
```

### 第 2 步：将 Schema 注册到 PostgREST 配置

```sql
DO $$
DECLARE
  current_value text;
  schemas text[];
  target_schema text := 'app_{app_id}';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticator') THEN
    RAISE NOTICE 'authenticator role 不存在，跳过';
    RETURN;
  END IF;

  -- 读取当前 pgrst.db_schemas 设置
  SELECT split_part(s, '=', 2)
  INTO current_value
  FROM pg_db_role_setting r
  CROSS JOIN LATERAL unnest(r.setconfig) AS s
  WHERE r.setrole = (SELECT oid FROM pg_roles WHERE rolname = 'authenticator')
    AND r.setdatabase = 0
    AND s LIKE 'pgrst.db_schemas=%'
  LIMIT 1;

  IF current_value IS NULL OR btrim(current_value) = '' THEN
    current_value := 'public';
  END IF;

  -- 拆分、去空白，检查是否已包含目标 schema
  SELECT array_agg(btrim(x)) INTO schemas
  FROM unnest(string_to_array(current_value, ',')) AS x
  WHERE btrim(x) <> '';

  IF schemas IS NULL OR NOT (target_schema = ANY(schemas)) THEN
    schemas := array_append(COALESCE(schemas, ARRAY[]::text[]), target_schema);
    -- 使用 ", " 分隔，保持格式一致
    EXECUTE format('ALTER ROLE authenticator SET pgrst.db_schemas TO %L',
                   array_to_string(schemas, ', '));
  END IF;
END
$$;
```

### 第 3 步（关键）：强制 PostgREST 重新连接

仅发 `NOTIFY` 不够，必须终止 PostgREST 的空闲连接，迫使其重新建立连接并读取新配置：

```sql
-- 先尝试标准通知（作为兜底）
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';

-- 终止 authenticator 的空闲连接，强制 PostgREST 重连
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE usename = 'authenticator'
  AND state = 'idle';
```

PostgREST 会自动重建连接池，新连接会读取更新后的 `pgrst.db_schemas`，整个过程对业务透明（活跃查询不受影响，只终止空闲连接）。

## 验证

等待约 3-5 秒后，通过 REST API 验证：

```bash
curl -s -w "\nHTTP_CODE: %{http_code}" \
  -H "apikey: <SUPABASE_ANON_KEY>" \
  -H "Accept-Profile: app_{app_id}" \
  "<SUPABASE_URL>/rest/v1/<table_name>?limit=1"
```

期望返回 `HTTP_CODE: 200`。

## 集成到模板工程

将上述 3 步合并到 `sql/init-schema.sql` 中，在 `db_apply_migration` 建表之后自动执行。注意：

1. **不要包含 `CREATE SCHEMA`**——平台自动管理 schema 创建
2. **第 3 步必须保留**——这是与原模板方案的核心区别，没有这一步 PostgREST 不会刷新
3. 所有 SQL 中的 `app_{app_id}` 需替换为实际的 schema 名（`app_` + app_id 中 `-` 替换为 `_`）

## ⚠️ 交付前强制自测

执行完 `init-schema.sql` 后，以及之后**每一次新建表**后，必须通过 REST API 自测可访问性：

```bash
curl -s -w "\nHTTP_CODE: %{http_code}" \
  -H "apikey: <SUPABASE_ANON_KEY>" \
  -H "Accept-Profile: app_{app_id}" \
  "<SUPABASE_URL>/rest/v1/<table_name>?limit=1"
```

**判定**：HTTP 200 才算通过。其他任何状态码或 `PGRST106 / PGRST205` 等错误都属于未交付状态，必须当场排查到 200 才能交付。

排查策略与命令清单见 [supabase-schema-init.md](./supabase-schema-init.md) 的「如果验证失败」与「建表后可访问性验证」章节。**不允许让用户在前端页面才发现 schema/table 不可访问。**
