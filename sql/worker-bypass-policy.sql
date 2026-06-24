-- ==================================================
-- Worker Bypass Policy 模板
-- 允许 Worker Key 绕过项目组 RLS 访问指定表
-- Schema: app_warp_speed
--
-- Worker Key 是平台签发的长期 JWT，claims 中包含：
-- { "role": "authenticated", "app_metadata": { "worker": true } }
--
-- 使用方法：
--   将 <table_name> 替换为实际表名，通过 db_apply_migration 执行
--
-- 安全说明：
--   该 policy 与 role_select_policy 等是 OR 关系（PostgreSQL RLS 默认 permissive）
--   普通用户 JWT 中没有 worker 标记，不会命中此 policy
--   Worker JWT 由平台签发，前端无法伪造
-- ==================================================

-- ⚠️ 将 <table_name> 替换为实际表名

CREATE POLICY "worker_bypass" ON app_warp_speed.<table_name>
  FOR ALL
  TO authenticated
  USING (coalesce(auth.jwt()->'app_metadata'->>'worker', '') = 'true')
  WITH CHECK (coalesce(auth.jwt()->'app_metadata'->>'worker', '') = 'true');
