-- ==================================================
-- 项目组级 RLS（Row Level Security）策略
-- Schema: app_warp_speed
--
-- 使用方法：
--   1. 将下方 SQL 中的 <table_name> 替换为实际表名
--   2. 通过 MCP 工具 db_apply_migration 执行
--   3. 执行后通过 REST API 验证 RLS 生效
--
-- 前置条件：
--   - 已执行 sql/init-schema.sql 完成 schema 初始化
--   - 目标表包含 role_code TEXT 列
--   - 用户的 JWT 中已包含 app_metadata.group_roles（由服务端自动签发）
--
-- 隔离方式：
--   表用 role_code TEXT 列存储项目组代号（如 "l36"、"fu362"），
--   开发者只需知道项目组代号，不需要知道数字 groupId。
--   匹配大小写不敏感。
--
-- 安全说明：
--   JWT 由服务端签发（/danqing-node/api/vibe-coding/permission/user/info），
--   服务端通过转发用户 cookie 到上游权限接口获取真实的 permissionGroupList，
--   将 roleCode 映射写入 app_metadata.group_roles。
--   前端无法伪造此 claim。RLS 通过 auth.jwt() 读取这些 claims，安全性不依赖前端。
--
-- 完整说明见 rules/permission-auth.md
-- ==================================================

-- ─── 步骤 1：创建辅助函数（每个 schema 只需执行一次）─────────────

-- 从 JWT 的 app_metadata.group_roles 中提取用户所有 roleCode（小写）
CREATE OR REPLACE FUNCTION app_warp_speed.get_user_role_codes()
RETURNS TEXT[] LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    (SELECT array_agg(lower(val))
     FROM jsonb_each_text(
       auth.jwt() -> 'app_metadata' -> 'group_roles'
     ) AS r(gid, val)),
    ARRAY[]::text[]
  );
$$;

-- ─── 步骤 2：为目标表启用 RLS ──────────────────────────────────
-- ⚠️ 将下方所有 <table_name> 替换为实际表名后执行

-- 启用 RLS（启用后，没有匹配 Policy 的请求将被拒绝）
ALTER TABLE app_warp_speed.<table_name> ENABLE ROW LEVEL SECURITY;

-- ─── 步骤 3：创建 Policy（大小写不敏感匹配）─────────────────────

-- ▸ SELECT：用户只能查看所属项目组的数据
CREATE POLICY "role_select_policy" ON app_warp_speed.<table_name>
  FOR SELECT
  TO authenticated
  USING (
    lower(role_code) = ANY(app_warp_speed.get_user_role_codes())
  );

-- ▸ INSERT：用户只能插入所属项目组的数据
CREATE POLICY "role_insert_policy" ON app_warp_speed.<table_name>
  FOR INSERT
  TO authenticated
  WITH CHECK (
    lower(role_code) = ANY(app_warp_speed.get_user_role_codes())
  );

-- ▸ UPDATE：用户只能修改所属项目组的数据
CREATE POLICY "role_update_policy" ON app_warp_speed.<table_name>
  FOR UPDATE
  TO authenticated
  USING (
    lower(role_code) = ANY(app_warp_speed.get_user_role_codes())
  )
  WITH CHECK (
    lower(role_code) = ANY(app_warp_speed.get_user_role_codes())
  );

-- ▸ DELETE：用户只能删除所属项目组的数据
CREATE POLICY "role_delete_policy" ON app_warp_speed.<table_name>
  FOR DELETE
  TO authenticated
  USING (
    lower(role_code) = ANY(app_warp_speed.get_user_role_codes())
  );

-- ─── 步骤 4：验证 ──────────────────────────────────────────────
-- 执行后用不同项目组的用户 JWT 调用 REST API，确认：
-- 1. 有权用户能正常 CRUD（HTTP 200 + 对应数据）
-- 2. 无权用户查询返回空数组（HTTP 200 + []），写入被拒绝

-- ─── 可选：允许 Worker 绕过 RLS ─────────────────────────────────
-- 如果 Worker 服务需要写入/读取该表（不受项目组限制），添加此 Policy：
-- Worker Key 的 JWT 中包含 app_metadata.worker = "true"

-- CREATE POLICY "worker_bypass" ON app_warp_speed.<table_name>
--   FOR ALL
--   TO authenticated
--   USING (coalesce(auth.jwt()->'app_metadata'->>'worker', '') = 'true')
--   WITH CHECK (coalesce(auth.jwt()->'app_metadata'->>'worker', '') = 'true');

-- ─── 可选：拒绝 anon 角色访问（推荐）─────────────────────────────
-- 如果不需要匿名访问，revoke anon 角色在该表的权限：
-- REVOKE ALL ON app_warp_speed.<table_name> FROM anon;
