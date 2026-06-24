---
name: supabase-storage
type: repo
agent: CodeActAgent
triggers:
  - "supabase"
  - "storage"
  - "bucket"
  - "upload"
  - "file"
  - "文件"
  - "上传"
---

# Supabase Storage 使用规则

当需要使用 Supabase Storage（文件上传、下载等）时，**必须由 agent 预先通过 MCP 工具创建 bucket**，
禁止在 Web 应用运行时动态创建 bucket，因为前端使用的 anon key 没有创建 bucket 的权限。

文件上传策略：
- **图片上传**：优先使用 `@fuxi/danqing-sdk` 的 `sdk.api.upload` 接口，支持压缩、hash 去重、CDN 加速
- **其他类型文件**（文档、音视频、素材包等）：使用 Supabase Storage，通过 `src/services/supabase-storage.ts` 中的方法上传

Bucket 管理：
- **必须由 agent 预先通过 MCP 工具创建 bucket**，禁止在 Web 应用运行时动态创建，前端 anon key 没有创建 bucket 的权限

禁止行为：
- ❌ 禁止使用 Supabase Storage 上传图片（应使用 SDK 的 upload 接口）
- ❌ 禁止在前端代码中调用 `supabase.storage.createBucket()`
- ❌ 禁止在组件挂载或页面加载时尝试创建 bucket
