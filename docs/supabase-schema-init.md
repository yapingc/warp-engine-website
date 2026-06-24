# Supabase 自定义 Schema 初始化指南

> 本文是用户向导。完整方案的设计与原理见 [PostgREST Schema 暴露方案](./postgrest-schema-exposure.md)。

## ⚠️ 强制要求：可访问性自测

**以下两个时机必须通过 REST API 自测可访问性，不通过必须当场排查解决，严禁让用户在前端页面才发现报错：**

| 时机 | 自测对象 | 详见 |
|---|---|---|
| 1. 初始化 schema（执行 `init-schema.sql` 后） | 用任意表（或 schema 根 OpenAPI）验证 schema 已被 PostgREST 暴露 | [初始化后可访问性验证](#初始化后可访问性验证) |
| 2. 新建任何表（含表结构变更涉及新表）后 | 验证该表能通过 REST API 读到数据（哪怕空数组） | [建表后可访问性验证](#建表后可访问性验证) |

**判定标准**：HTTP 200 才算通过。任何 4xx/5xx，或返回 `PGRST106`、`PGRST205` 等错误码，都必须按下方「如果验证失败」章节排查到解决，**不允许带病交付**。

---

## 背景

项目使用 `VITE_APP_ID` 作为 Supabase 的默认数据库 schema，实现多项目数据隔离。schema 名称格式为 `app_<appId>`，其中连字符会转换为下划线（与 MCP gateway 的 `db_execute_sql` 保持一致）。

**本项目的 schema 名为：`app_warp_speed`**（由 `VITE_APP_ID=warp-speed` → `app_warp_speed`）

## 客户端 Schema 命名规则

`src/services/supabase.ts` 中的转换逻辑：

```typescript
export const appSchema = `app_${(import.meta.env.VITE_APP_ID as string).replaceAll('-', '_')}`;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  db: { schema: appSchema },
});
```

**示例**：`VITE_APP_ID=warp-speed` → 实际 schema 名为 `app_warp_speed`

## 初始化 SQL

项目首次接入 Supabase 时，必须执行初始化 migration。Schema 由平台（`db_apply_migration`）自动创建，本脚本只负责授权、注册到 PostgREST、并强制其重连。

直接执行 `sql/init-schema.sql`，或参照下方内容：

```sql
-- ==================================================
-- Supabase 自定义 Schema 初始化
-- Schema: app_warp_speed
-- ==================================================

-- 1. 授予 Schema 访问权限
GRANT USAGE ON SCHEMA app_warp_speed TO anon, authenticated;

-- 2. 当前已有表的 CRUD 权限
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA app_warp_speed TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA app_warp_speed TO anon, authenticated;

-- 3. 未来新建表/序列的默认权限
ALTER DEFAULT PRIVILEGES IN SCHEMA app_warp_speed
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA app_warp_speed
  GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated;

-- 4. 将 Schema 追加到 PostgREST 暴露列表（不覆盖其他应用已注册的 schema）
DO $$
DECLARE
  current_value text;
  schemas text[];
  target_schema text := 'app_warp_speed';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticator') THEN
    RAISE NOTICE 'authenticator role 不存在，跳过';
    RETURN;
  END IF;

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

  SELECT array_agg(btrim(x)) INTO schemas
  FROM unnest(string_to_array(current_value, ',')) AS x
  WHERE btrim(x) <> '';

  IF schemas IS NULL OR NOT (target_schema = ANY(schemas)) THEN
    schemas := array_append(COALESCE(schemas, ARRAY[]::text[]), target_schema);
    EXECUTE format('ALTER ROLE authenticator SET pgrst.db_schemas TO %L',
                   array_to_string(schemas, ', '));
  END IF;
END
$$;

-- 5. 强制 PostgREST 重新连接以加载新配置
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';

SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE usename = 'authenticator'
  AND state = 'idle';
```

## 各步骤说明

| 步骤 | 作用 | 缺失后果 |
|------|------|----------|
| GRANT USAGE | 允许 PostgREST 角色访问该 schema | 502 Bad Gateway |
| GRANT ... ON ALL TABLES/SEQUENCES | 对已有表和序列授予 CRUD 权限 | 已有表查询报 permission denied |
| ALTER DEFAULT PRIVILEGES | 自动为**未来**新建的表/序列授予权限 | 建表后查询报 permission denied |
| 追加 pgrst.db_schemas | 将 schema 加入 PostgREST 暴露列表，不覆盖其他应用 | 客户端报 `PGRST106 Invalid schema` |
| NOTIFY pgrst | 触发 PostgREST 热重载（兜底通道） | 单独依赖时常常无效，依赖下方步骤 |
| **pg_terminate_backend (idle)** | **关键**：强制 PostgREST 重建连接池、加载新配置 | 仅 NOTIFY 不生效时永远读不到新 schema |

> ⚠️ `pg_terminate_backend` 只杀 `state = 'idle'` 的连接，不影响正在处理 REST 请求的 worker，业务无感。

## 初始化后可访问性验证

> 这是顶部「⚠️ 强制要求」中的第 1 个时机，**执行 `init-schema.sql` 后必做**。未通过严禁交付。

完整执行后通过 REST API 验证：

```bash
curl -s -w "\nHTTP_CODE: %{http_code}" \
  -H "apikey: <SUPABASE_ANON_KEY>" \
  -H "Accept-Profile: app_warp_speed" \
  "<SUPABASE_URL>/rest/v1/<table_name>?limit=1"
```

- **HTTP 200 + 数据**→ 验证通过
- **HTTP 200 + 空数组** → schema 暴露成功，但表可能启用了 RLS 没放行
- **`PGRST106 Invalid schema`** → schema 还没暴露成功，按下方排查

## 如果验证失败

主流程已经 `pg_terminate_backend` 强制重连，正常情况下不应失败。仍失败时按以下顺序排查：

### 排查 1：确认 ALTER ROLE 写入成功

```sql
SELECT s.setdatabase, d.datname, s.setconfig
FROM pg_db_role_setting s
JOIN pg_roles r ON s.setrole = r.oid
LEFT JOIN pg_database d ON s.setdatabase = d.oid
WHERE r.rolname = 'authenticator';
```

`setconfig` 中应能看到 `pgrst.db_schemas=public, ..., app_warp_speed`。看不到说明 step 4 的 DO 块没执行（可能权限不足）。

### 排查 2：确认 PostgREST 实际加载的列表

如果能从 PostgREST 已建立的连接执行（一般要 admin 权限）：

```sql
SHOW pgrst.db_schemas;
```

输出与排查 1 一致 → 链路通了。不一致 → PostgREST 没重连，重新执行 step 5：

```sql
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE usename = 'authenticator'
  AND state = 'idle';
```

### 排查 3：通过 Admin API 重载（零数据库影响）

PostgREST 开启 admin 端口（`admin-server-port`）时可绕过数据库直接重载：

```bash
curl -X POST http://<POSTGREST_HOST>:<ADMIN_PORT>/admin/reload
```

### 排查 4：环境变量覆盖

如果部署用 `PGRST_DB_SCHEMAS` 环境变量配置，会覆盖角色设置。需要去改 docker-compose / k8s manifest，仅靠 SQL 改不动。

## 建表示例

初始化完成后，在该 schema 下建表：

```sql
CREATE TABLE app_warp_speed.my_table (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 如果表在 ALTER DEFAULT PRIVILEGES 之前已存在，需手动授权：
GRANT SELECT, INSERT, UPDATE, DELETE ON app_warp_speed.my_table TO anon, authenticated;
```

### 建表后可访问性验证（强制）

> 这是顶部「⚠️ 强制要求」中的第 2 个时机，**每次新建表后必做**。

```bash
curl -s -w "\nHTTP_CODE: %{http_code}" \
  -H "apikey: <SUPABASE_ANON_KEY>" \
  -H "Accept-Profile: app_warp_speed" \
  "<SUPABASE_URL>/rest/v1/my_table?limit=1"
```

| 返回 | 含义 | 处理 |
|---|---|---|
| `HTTP_CODE: 200` + 数据/空数组 | ✅ 通过 | 可交付 |
| `HTTP_CODE: 200` + `[]` 但你确认数据库里有数据 | RLS 启用了但没 POLICY | 加 policy（见下方常见问题） |
| `PGRST205` / `relation does not exist` | PostgREST schema 缓存还没刷到该表 | 重发 `NOTIFY pgrst, 'reload schema'`；或重跑 `init-schema.sql` 的 step 5（terminate idle 连接） |
| `PGRST106 Invalid schema` | schema 还没暴露成功 | 回到「初始化后可访问性验证」+「如果验证失败」排查 |
| `permission denied` | 表的 GRANT 漏了 | 手动执行 `GRANT SELECT, INSERT, UPDATE, DELETE ON app_warp_speed.<table> TO anon, authenticated;` |
| `502 Bad Gateway` | schema USAGE 权限缺失 | 重跑 `init-schema.sql` 的 step 1 |

**未通过严禁交付**——把对应处理跑一遍，再次 curl 确认到 200 才算完。

## 常见问题

### Q: 查询报 `PGRST106 Invalid schema`
PostgREST 未加载新 schema。先按「如果验证失败」章节排查；多数情况是 step 5 的 `pg_terminate_backend` 没执行成功。

### Q: 查询返回 200 但数据为空
表启用了 RLS（Row Level Security）但没有 POLICY。给表加 policy：

```sql
ALTER TABLE app_warp_speed.<table_name> ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_access" ON app_warp_speed.<table_name>
  FOR ALL USING (true) WITH CHECK (true);
```

### Q: 查询报 502 Bad Gateway
权限不足。检查是否执行了 `GRANT USAGE ON SCHEMA`。

### Q: 建表后查询报 permission denied
`ALTER DEFAULT PRIVILEGES` 只对之后新建的表生效。对已存在的表需要手动执行：

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA app_warp_speed TO anon, authenticated;
```

### Q: 客户端调用没生效
非 `public` 的 schema 不能直接 `GET /tablename`。要么用 `supabase.schema('app_warp_speed').from('<table>').select()`，要么 REST 请求带上 `Accept-Profile: app_warp_speed` header。本项目 `supabase.ts` 已经在 client 初始化时配置了默认 schema，使用 `supabase.from(...)` 即可。

### Q: Schema 名包含连字符（如 my-app）
PostgreSQL 要求带连字符的标识符用双引号包裹（`"my-app"`），但 PostgREST 对此支持不佳。**必须使用下划线命名**，客户端 `supabase.ts` 已自动做了 `app_` 前缀拼接和 `replaceAll('-', '_')` 转换。

---

## 项目组鉴权（RLS）

当需要按项目组隔离数据时（如：不同项目组只能看到各自的数据），使用 Row Level Security (RLS) 实现表级鉴权。

### 安全架构

```
服务端签发 JWT（含 app_metadata.groups）→ Supabase RLS 通过 auth.jwt() 验证 → 数据行级过滤
```

JWT 由服务端签发，包含用户真实的项目组信息（`app_metadata.groups` = groupId 数组），**前端无法伪造**。

### 快速上手

1. 确保表包含 `group_id INTEGER` 列
2. 执行 `sql/enable-group-rls.sql`（替换 `<table_name>` 为实际表名）
3. 验证：不同项目组的用户只能看到各自数据

### 详细文档

- **实施规则**：`rules/permission-auth.md`（RLS + 前端权限控制完整指引）
- **SQL 模板**：`sql/enable-group-rls.sql`（可直接使用的 RLS 策略 SQL）
- **前端工具**：`src/hooks/usePermission.ts` + `src/components/PermissionGuard.tsx`
