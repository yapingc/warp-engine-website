# Worker 后台服务搭建指南

本文档描述如何为丹青约项目配置 Worker 后台服务，包括生成 Worker Key、创建环境变量文件等完整流程。

---

## 1. 什么是 Worker

Worker 是运行在部署容器内的 Node.js 后台进程。当 `dist/worker/index.js` 存在时，容器会自动启动它。适用于定时任务、POPO 消息通知、后台数据库读写、轮询巡检等场景。

**架构约束**：Worker 与 Web 前端仅通过数据库交互，禁止 HTTP 直连，Worker 禁止对外暴露任何端口。

---

## 2. 生成 Worker Key

Worker Key 是平台签发的长期有效 JWT，用于后台服务访问 Supabase 数据库，无需用户登录。

### 通过 MCP 工具生成

调用 `create_supabase_worker_key` 工具：

```
create_supabase_worker_key({ app_id: "你的应用ID" })
```

参数说明：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `app_id` | string | 是 | 应用 ID，用于标识 JWT 所属应用 |
| `expires_in_days` | integer | 否 | 有效期（天），默认不限时，最大 3650 天 |

生成的 Worker Key 的 JWT claims 包含 `app_metadata.worker: true`，可配合数据库 RLS 的 worker_bypass policy 跳过项目组隔离限制。

---

## 3. 创建环境变量文件

### 3.1 `.env.example`（提交到 git，作为模板）

```bash
# Supabase 服务地址（与 Web 端相同）
SUPABASE_URL=http://apps-sl.danlu.netease.com:39943

# Worker Key — 通过 MCP create_supabase_worker_key 工具生成
WORKER_KEY=

# App schema 名（app_id 中的 - 替换为 _，加 app_ 前缀）
APP_SCHEMA=app_<app_id_underscored>

# Supabase Anon Key（从项目 .env 的 VITE_SUPABASE_ANON_KEY 获取）
ANON_KEY=

# === POPO 通知（按需配置） ===
# 自定义机器人 appKey / appSecret（可选，不填则使用平台默认机器人）
POPO_APP_KEY=
POPO_APP_SECRET=
# 默认通知接收人邮箱
NOTIFY_RECEIVER=
```

### 3.2 `.env`（不提交 git，填入实际凭证）

复制 `.env.example` 为 `.env`，填入真实值：

1. **SUPABASE_URL**：固定值 `http://apps-sl.danlu.netease.com:39943`
2. **WORKER_KEY**：通过 `create_supabase_worker_key` 生成（见第 2 节）
3. **APP_SCHEMA**：格式为 `app_<app_id>`，其中 app_id 的 `-` 替换为 `_`。例如 app_id 为 `my-app`，则填 `app_my_app`
4. **ANON_KEY**：从项目根目录 `.env` 或 `.env.local` 的 `VITE_SUPABASE_ANON_KEY` 字段复制
5. **POPO 相关**：按需填写，不使用通知功能可留空

### 3.3 确保 `.env` 不被提交

在 `.gitignore` 中添加：

```
src/worker/.env
dist/worker/
```

---

## 4. RLS 权限配置

如果目标表启用了 RLS（Row Level Security），需要为每张 Worker 需要访问的表添加 bypass policy：

```sql
CREATE POLICY "worker_bypass" ON <schema>.<table_name>
  FOR ALL TO authenticated
  USING (coalesce(auth.jwt()->'app_metadata'->>'worker', '') = 'true')
  WITH CHECK (coalesce(auth.jwt()->'app_metadata'->>'worker', '') = 'true');
```

通过 MCP 执行：

```
db_apply_migration({
  app_id: "你的应用ID",
  name: "worker_bypass_<table_name>",
  query: "<上面的 SQL>"
})
```

每张 RLS 表需单独执行。

---

## 5. 环境变量读取方式

### ⚠️ 禁止使用 dotenv，必须通过 `process.env` 直接读取

构建脚本 `build-worker.mjs` 已在打包产物顶部注入了 `.env` 文件的解析逻辑（banner），运行时会自动将 `dist/worker/.env` 中的变量注入到 `process.env`。因此 Worker 代码中**直接使用 `process.env.XXX` 即可**，无需引入任何额外依赖。

**常见错误**：部分用户在代码中 `import 'dotenv/config'` 或 `require('dotenv').config()`，但没有将 `dotenv` 添加到项目依赖中，导致线上部署后报错 `Cannot find module 'dotenv'`。即使添加了依赖也是多余的，因为构建脚本已经处理了环境变量加载。

**正确做法**（参考 `db.ts`）：

```typescript
// 直接从 process.env 获取，不需要 import dotenv
const SUPABASE_URL = process.env.SUPABASE_URL;
const WORKER_KEY = process.env.WORKER_KEY;
const APP_SCHEMA = process.env.APP_SCHEMA;
```

**错误做法**：

```typescript
// ❌ 不要这样做！线上没有 dotenv 依赖会直接报错
import 'dotenv/config';

// ❌ 也不要这样
import dotenv from 'dotenv';
dotenv.config();
```

### 关于 `Dynamic require of "fs" is not supported`

如果误引入了 `dotenv` 或其它 CommonJS 包，过去会在运行时报这个错：

```
Error: Dynamic require of "fs" is not supported
  at node_modules/dotenv/lib/main.js
```

原因是：worker 被 esbuild 打成 ESM 产物，而 CommonJS 包内部的 `require()` 在 ESM 环境下默认拿不到 `require`，于是抛错。

`build-worker.mjs` 现已在 banner 中注入 `createRequire` 垫片对这类包做了兼容，**该报错不会再出现**。但仍建议遵循上面的写法删掉无用依赖——更干净、产物更小。

---

## 6. 数据库连接（db.ts）

Worker 通过 `@supabase/supabase-js` 连接数据库，使用 Worker Key 作为认证凭证：

```typescript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const WORKER_KEY = process.env.WORKER_KEY;
const APP_SCHEMA = process.env.APP_SCHEMA;

class NoopWebSocket {
  close() {}
}

if (!SUPABASE_URL) throw new Error('缺少 SUPABASE_URL 环境变量');
if (!WORKER_KEY) throw new Error('缺少 WORKER_KEY 环境变量，请通过 MCP create-supabase-worker-key 获取');
if (!APP_SCHEMA) throw new Error('缺少 APP_SCHEMA 环境变量');

export const supabase = createClient(SUPABASE_URL, WORKER_KEY, {
  db: { schema: APP_SCHEMA as any },
  global: {
    headers: { Authorization: `Bearer ${WORKER_KEY}` },
  },
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: NoopWebSocket as any },
});
```

---

## 7. 构建与运行

### package.json scripts

```jsonc
{
  "scripts": {
    "build": "<现有构建命令> && node scripts/build-worker.mjs",
    "worker": "node scripts/build-worker.mjs && node dist/worker/index.js"
  }
}
```

### 本地运行

```bash
pnpm worker
```

### 部署

发布上线时，`dist/worker/index.js` 会随应用一起部署，容器检测到该文件后自动启动 Worker 进程。

---

## 8. 快速检查清单

- [ ] 已通过 `create_supabase_worker_key` 生成 Worker Key
- [ ] 已创建 `src/worker/.env` 并填入所有必要凭证
- [ ] `.gitignore` 已包含 `src/worker/.env` 和 `dist/worker/`
- [ ] 需要访问的 RLS 表已添加 `worker_bypass` policy
- [ ] `package.json` 已添加 `worker` 和更新 `build` 脚本
- [ ] 本地 `pnpm worker` 可正常运行
