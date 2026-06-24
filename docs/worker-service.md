# Worker 后台服务

## 概述

`src/worker/` 目录用于编写线上运行的 Node.js 脚本。部署后，如果 `dist/worker/index.js` 存在，容器会自动启动 Node 进程。

典型用途：
- 定时抓取第三方接口/网站数据，写入数据库
- 调用外部 API
- 后台数据处理、聚合

## 核心约束

**Worker 与 Web 页面的唯一交互方式是数据库。**

```
Worker → 写入数据库 → Web 页面读取展示
Web 页面 → 写入数据库 → Worker 读取执行
```

- Worker **不对外暴露任何 HTTP 端口**
- Web 页面**不直接调用** Worker
- 两者通过数据库数据间接影响

## 快速开始

### 1. 获取 Worker Key

调用 MCP 工具生成数据库访问凭证：

```
MCP 工具: create-supabase-worker-key
```

### 2. 配置环境变量

```bash
cp src/worker/.env.example src/worker/.env
# 编辑 .env，填入 WORKER_KEY
```

### 3. 创建 Worker 入口

创建 `src/worker/index.ts`：

```typescript
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.WORKER_KEY!,
  {
    db: { schema: process.env.APP_SCHEMA as any },
    global: {
      headers: { Authorization: `Bearer ${process.env.WORKER_KEY}` },
    },
    auth: { persistSession: false, autoRefreshToken: false },
  },
);

async function main() {
  console.log('[worker] 启动');

  // 示例：每 5 分钟抓取数据
  setInterval(async () => {
    const resp = await fetch('https://api.example.com/data');
    const items = await resp.json();
    await supabase.from('my_table').upsert(
      items.map((item: any) => ({ ...item, role_code: 'fu362' })),
    );
  }, 5 * 60 * 1000);
}

main().catch((err) => {
  console.error('[worker] 失败:', err);
  process.exit(1);
});
```

### 4. 开发与构建

```bash
# 本地开发
npx tsx src/worker/index.ts

# 构建（自动检测 src/worker/index.ts，打包到 dist/worker/）
npm run build

# 部署后容器自动运行 dist/worker/index.js
```

## RLS 配合

如果目标表启用了项目组 RLS，需要额外添加 worker bypass policy：

```sql
CREATE POLICY "worker_bypass" ON app_warp_speed.my_table
  FOR ALL TO authenticated
  USING (coalesce(auth.jwt()->'app_metadata'->>'worker', '') = 'true')
  WITH CHECK (coalesce(auth.jwt()->'app_metadata'->>'worker', '') = 'true');
```

Worker 写入 RLS 表时**必须带 `role_code`**，否则 Web 端用户看不到数据。

## 注意事项

- `src/worker/.env` 包含凭证，**已在 .gitignore 中排除**
- Worker 代码不要引用 `src/` 下的前端模块（React 组件、hooks 等）
- Worker 使用独立的 `tsconfig.worker.json`（Node.js 目标）
- 模板默认不含 `src/worker/index.ts`，只有需要时才创建
