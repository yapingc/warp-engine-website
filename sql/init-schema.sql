-- ==================================================
-- Supabase 自定义 Schema 初始化
-- Schema: app_warp_speed
-- 由 VITE_APP_ID=warp-speed 转换为 app_<下划线>
--
-- 使用方法：通过 MCP 工具 db_apply_migration 执行（schema 已由平台创建）
--
-- ⚠️ 强制要求：本脚本执行后、以及之后每次新建表后，
--    都必须通过 REST API 自测可访问性（HTTP 200 才算通过）。
--    不通过必须当场排查解决，严禁让用户在前端页面才发现报错。
--    自测命令与排查流程见 docs/supabase-schema-init.md
--
-- 详细方案与原理：docs/postgrest-schema-exposure.md
-- 用户向导：docs/supabase-schema-init.md
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

-- 4. 将 Schema 注册到 PostgREST：在 authenticator 现有 pgrst.db_schemas 列表后追加（不覆盖其他应用已注册的 schema）
DO $$
DECLARE
  current_value text;
  schemas text[];
  target_schema text := 'app_warp_speed';
BEGIN
  -- authenticator 角色不存在则跳过（非 Supabase 环境）
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticator') THEN
    RAISE NOTICE 'authenticator role 不存在，跳过 PostgREST schema 暴露设置';
    RETURN;
  END IF;

  -- 读取 authenticator 当前的 pgrst.db_schemas 设置
  SELECT split_part(s, '=', 2)
  INTO current_value
  FROM pg_db_role_setting r
  CROSS JOIN LATERAL unnest(r.setconfig) AS s
  WHERE r.setrole = (SELECT oid FROM pg_roles WHERE rolname = 'authenticator')
    AND r.setdatabase = 0
    AND s LIKE 'pgrst.db_schemas=%'
  LIMIT 1;

  -- 没有现有配置则以 'public' 起步
  IF current_value IS NULL OR btrim(current_value) = '' THEN
    current_value := 'public';
  END IF;

  -- 拆分 + 去除每段空白；若不含本 schema 则追加
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

-- 5. Realtime：将整个 Schema 加入发布，后续新建的表自动具备实时同步能力
ALTER PUBLICATION supabase_realtime ADD TABLES IN SCHEMA app_warp_speed;

-- 6. Realtime：自动为本 Schema 新建的表设置 REPLICA IDENTITY FULL（DELETE 事件包含完整行数据）
CREATE OR REPLACE FUNCTION app_warp_speed.auto_set_replica_identity_full()
RETURNS event_trigger LANGUAGE plpgsql AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands()
    WHERE command_tag = 'CREATE TABLE'
      AND schema_name = 'app_warp_speed'
  LOOP
    EXECUTE format('ALTER TABLE %s REPLICA IDENTITY FULL', obj.object_identity);
  END LOOP;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_event_trigger WHERE evtname = 'trg_replica_identity_app_warp_speed'
  ) THEN
    CREATE EVENT TRIGGER "trg_replica_identity_app_warp_speed"
      ON ddl_command_end
      WHEN TAG IN ('CREATE TABLE')
      EXECUTE FUNCTION app_warp_speed.auto_set_replica_identity_full();
  END IF;
END
$$;

-- 7. 强制 PostgREST 重新连接以加载新配置
-- 仅 NOTIFY 在丹青约平台不可靠（PostgREST 的 LISTEN 连接不一定响应通知），必须终止
-- authenticator 的空闲连接，触发 PostgREST 自动重建连接池、读取新的 pgrst.db_schemas
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';

SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE usename = 'authenticator'
  AND state = 'idle';
