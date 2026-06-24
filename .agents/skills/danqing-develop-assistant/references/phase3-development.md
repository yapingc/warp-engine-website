# Phase 3: 开发功能

## 编码规范（NON-NEGOTIABLE）

开始编写代码前，**必须先读取项目中的编码规范文件**（如项目根目录或 `.claude/rules`、`.cursor/rules`、`CONVENTIONS.md`、`.editorconfig`、`eslint.config.*`、`.prettierrc` 等），并在整个开发过程中严格遵守。

如果项目中没有找到任何规范文件，则遵循项目已有代码的风格保持一致。

**额外硬性要求**：
- **单个组件文件不得超过 400 行**。如果组件逻辑复杂，必须拆分为多个子组件或提取 hooks/utils
- 拆分时保持单一职责原则，每个文件只做一件事

页面预览成功后，向用户介绍可用能力：

## 引导用户

从项目中查询以下信息（读取 `package.json`、`src/` 目录结构），用用户能理解的方式介绍：

- 项目内置了哪些**现成的功能组件**（如导航栏、表单、列表等）
- 支持**数据存储**（用户的数据会自动保存在独立的数据库中，互不干扰）
- 支持**用户登录信息获取**（可以知道当前是谁在使用）

然后提示：

> 您现在可以告诉我您需要什么功能了，比如：
> - "我要一个任务管理页面，可以添加、编辑和删除任务"
> - "帮我做一个投票页面"
> - "我需要一个数据展示的仪表盘"
>
> 小提示：您可以按 **Alt + V** 直接把图片粘贴到输入框发给我——比如设计稿截图、参考页面、手绘草图等，我能看懂图片并据此帮您还原页面。
>
> 开发完成后，您只需要说"帮我发布上线"就可以了。
> 如果想把代码保存到云端，可以说"帮我保存代码"。

## 数据库操作（agent 内部参考）

**app_id 来源（NON-NEGOTIABLE）**：所有数据库操作的 `app_id` 参数，以及前端代码中拼接 schema 名（`app_{app_id}`）时，**必须使用注册时的 app_id**，不能用当前文件夹名、目录名或其他推测值。app_id 的可靠来源优先级：
1. 项目 `package.json` 中的 `name` 或 `appId` 字段
2. `.env` / `.env.local` 中的 `VITE_APP_ID`
3. `init_project` 或 `register_app` 时用户确认的值

文件夹名与 app_id 经常不一致（如文件夹叫 `my-project` 但 app_id 是 `cool-app`），用错会导致 schema 不存在、数据读写失败。

当开发功能涉及数据存储时，使用以下工具（不向用户暴露工具名称）：

| 工具 | 用途 |
|------|------|
| `db_execute_sql` | 执行数据查询/修改（自动隔离到应用专属空间） |
| `db_apply_migration` | 创建或修改数据表结构 |
| `db_list_tables` | 查看当前数据表（verbose=true 看列详情） |
| `db_list_migrations` | 查看数据表变更历史 |
| `db_generate_types` | 生成 TypeScript 类型定义 |
| `db_get_advisors` | 获取安全/性能建议 |
| `db_get_logs` | 查看数据库运行日志 |

### 数据库问题处理

- **数据存不进去或查不到**：可能是权限问题，尝试授权或清除缓存，不要修改 schema 名称。向用户说"数据服务遇到了一点小问题，我正在修复"
- **首次使用**：数据空间会自动创建，无需用户操作

---

## Worker 后台服务（Node.js 后台进程）

当用户需要**后台运行逻辑**时使用 — 定时任务、POPO 消息通知、后台数据库读写、轮询巡检、健康检查等。

**触发关键词**：用户说"定时执行"、"每隔 X 分钟"、"轮询"、"巡检"、"监控"、"发 POPO 消息"、"发通知"、"告警推送"、"后台写数据库"、"服务端脚本"、"跑批"。

**不适用**：纯前端功能、需要对外暴露 HTTP 接口、前端直接能完成的操作。

### 架构说明

```
Worker (Node.js)          Supabase DB           Web (React)
┌──────────────┐         ┌──────────┐         ┌──────────┐
│ scheduler    │──write──→│          │←──read──│          │
│ notifier     │         │  tables  │         │  pages   │
│ db           │←──read──│          │         │          │
└──────────────┘         └──────────┘         └──────────┘
```

**铁律：Worker 与 Web 仅通过数据库交互，禁止 HTTP 直连。Worker 禁止对外暴露任何端口。**

Worker 是运行在部署容器内的 Node.js 进程。当 `dist/worker/index.js` 存在时，容器自动启动它。

### 能力矩阵 — 按需组合，只生成用户需要的部分

| 能力 | 何时启用 | 关键文件 |
|------|----------|----------|
| **数据库读写** | 需要从 Node.js 读写 Supabase | `src/worker/db.ts` |
| **定时任务** | 需要周期性执行逻辑 | `src/worker/scheduler.ts` |
| **POPO 通知** | 需要发送消息告警 | `src/worker/notifier.ts` |
| **HTTP 请求** | 需要调第三方 API | 直接用 fetch |

### 向用户的说法

> 我可以帮您添加后台服务能力 — 比如定时执行某些任务、自动发消息通知、在后台读写数据库等。这些逻辑会随您的应用一起部署，不需要额外搭建服务器。

### 搭建流程（agent 自动执行）

#### Step 1: 基础设施

| 检查项 | 不存在时的操作 |
|--------|----------------|
| `src/worker/` 目录 | 创建 |
| `scripts/build-worker.mjs` | 创建（见下方） |
| `esbuild` 依赖 | `pnpm add -D esbuild` |
| `@supabase/supabase-js` 依赖 | `pnpm add @supabase/supabase-js`（仅数据库能力） |
| `package.json` scripts 含 worker | 追加 |
| `.gitignore` 含 worker 条目 | 追加 |

**目录结构**：

```
src/worker/
├── .env.example    # 环境变量模板（提交 git）
├── .env            # 实际凭证（不提交）
├── index.ts        # 入口
├── db.ts           # [按需] 数据库
├── scheduler.ts    # [按需] 定时器
└── notifier.ts     # [按需] POPO 通知
```

**构建脚本 `scripts/build-worker.mjs`**：

```javascript
import { existsSync, cpSync } from 'fs';
import { resolve } from 'path';
import { build } from 'esbuild';

const workerDir = resolve(process.cwd(), 'src/worker');
const outDir = resolve(process.cwd(), 'dist/worker');

if (!existsSync(workerDir)) process.exit(0);

const entryPoint = resolve(workerDir, 'index.ts');
if (!existsSync(entryPoint)) process.exit(0);

console.log('[build-worker] 编译 src/worker → dist/worker');

const envBanner = `
import { readFileSync as __readFile } from 'node:fs';
import { dirname as __dirn, join as __joinP } from 'node:path';
import { fileURLToPath as __toPath } from 'node:url';
try {
  const __d = __dirn(__toPath(import.meta.url));
  for (const __l of __readFile(__joinP(__d, '.env'), 'utf-8').split('\\n')) {
    const __t = __l.trim();
    if (!__t || __t.startsWith('#')) continue;
    const __i = __t.indexOf('=');
    if (__i < 0) continue;
    const __k = __t.slice(0, __i).trim();
    const __v = __t.slice(__i + 1).trim();
    if (!(__k in process.env)) process.env[__k] = __v;
  }
} catch {}
`;

await build({
  entryPoints: [entryPoint],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: resolve(outDir, 'index.js'),
  sourcemap: true,
  banner: { js: envBanner },
});

const envFile = resolve(workerDir, '.env');
if (existsSync(envFile)) {
  cpSync(envFile, resolve(outDir, '.env'));
}

console.log('[build-worker] 完成');
```

**修改 package.json scripts**：

```jsonc
{
  "scripts": {
    "build": "<现有构建命令> && node scripts/build-worker.mjs",
    "worker": "node scripts/build-worker.mjs && node dist/worker/index.js"
  }
}
```

**追加 .gitignore**：

```
src/worker/.env
dist/worker/
```

#### Step 2: 获取凭证与环境变量

**平台固定常量（所有丹青约项目相同）**：

| 变量 | 值 | 说明 |
|------|-----|------|
| `SUPABASE_URL` | `http://apps-sl.danlu.netease.com:39943` | 平台统一地址 |
| `APP_SCHEMA` | `app_<app_id>` | app_id 中 `-` 替换为 `_`，前缀 `app_` |

**需要获取的凭证**：

| 变量 | 获取方式 | 何时需要 |
|------|----------|----------|
| `ANON_KEY` | 从项目 `.env` 查找 `VITE_SUPABASE_ANON_KEY` | 数据库 |
| `WORKER_KEY` | MCP 工具 `create_supabase_worker_key { app_id: "xxx" }` | 数据库 |
| `POPO_APP_KEY` | 用户提供 | POPO 通知 |
| `POPO_APP_SECRET` | 用户提供 | POPO 通知 |
| `NOTIFY_RECEIVER` | 用户提供（`xxx@corp.netease.com`） | POPO 通知 |

**生成 .env.example（按需裁剪）**：

```bash
# === 数据库（按需） ===
SUPABASE_URL=http://apps-sl.danlu.netease.com:39943
ANON_KEY=
WORKER_KEY=
APP_SCHEMA=app_<app_id_underscored>

# === POPO 通知（按需） ===
POPO_APP_KEY=
POPO_APP_SECRET=
NOTIFY_RECEIVER=
```

#### Step 3: 按需生成模块

**数据库模块 — `src/worker/db.ts`**：

```typescript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const ANON_KEY = process.env.ANON_KEY;
const WORKER_KEY = process.env.WORKER_KEY;
const APP_SCHEMA = process.env.APP_SCHEMA;

if (!SUPABASE_URL) throw new Error('[worker] 缺少 SUPABASE_URL');
if (!ANON_KEY) throw new Error('[worker] 缺少 ANON_KEY');
if (!WORKER_KEY) throw new Error('[worker] 缺少 WORKER_KEY — 通过 MCP create_supabase_worker_key 获取');
if (!APP_SCHEMA) throw new Error('[worker] 缺少 APP_SCHEMA');

class NoopWebSocket { close() {} }

export const supabase = createClient(SUPABASE_URL, ANON_KEY, {
  db: { schema: APP_SCHEMA as any },
  global: {
    headers: { Authorization: `Bearer ${WORKER_KEY}` },
  },
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: NoopWebSocket as any },
});
```

**RLS 注意事项**：如果目标表启用了 RLS，必须为每张需要 Worker 访问的表执行 bypass policy：

```sql
CREATE POLICY "worker_bypass" ON <schema>.<table_name>
  FOR ALL TO authenticated
  USING (coalesce(auth.jwt()->'app_metadata'->>'worker', '') = 'true')
  WITH CHECK (coalesce(auth.jwt()->'app_metadata'->>'worker', '') = 'true');
```

通过 MCP 执行 `db_apply_migration { app_id, name: "worker_bypass_<table>", query: "<SQL>" }`。每张 RLS 表单独执行。

**POPO 通知模块 — `src/worker/notifier.ts`**：

> ⚠️ **强烈建议用户使用自己的 POPO 机器人**：只需提供 App Key 和 App Secret 即可。平台默认机器人仅能向雷火同学发送消息，且可能被限流。向用户说明时：
>
> "建议您使用自己的 POPO 机器人来发消息，这样不会受到限制。您只需要提供机器人的 App Key 和 App Secret 就行。如果没有，可以在 POPO 开放平台申请一个。平台自带的机器人只能给雷火的同学发消息，而且消息量大时可能会被限流。"

**API 说明**：
- 接口地址：`POST https://danqing-node.apps-cae.danlu.netease.com/api/vibe-coding/popo/send-text`
- `receiver`：个人传完整邮箱（如 `zhangsan@corp.netease.com`），群聊直接传群号
- `content`（顶层）和 `message` 至少提供一个，`message` 优先级高于 `content`
- **发送到群并 @人时，必须使用 `message` 字段**（顶层 `content` 不支持 @ 功能）
- `message` 对象结构：`{ content: string, atUids?: string[], isAtAll?: boolean }`
- `appKey` + `appSecret` 成对出现时替换默认机器人身份

```typescript
const POPO_URL = 'https://danqing-node.apps-cae.danlu.netease.com/api/vibe-coding/popo/send-text';
const POPO_APP_KEY = process.env.POPO_APP_KEY || '';
const POPO_APP_SECRET = process.env.POPO_APP_SECRET || '';
const NOTIFY_RECEIVER = process.env.NOTIFY_RECEIVER || '';

interface PopoMessage {
  content: string;
  atUids?: string[];
  isAtAll?: boolean;
}

interface PopoOptions {
  receiver?: string;
  message?: PopoMessage;
}

export async function sendPopo(content: string, receiver?: string): Promise<boolean>;
export async function sendPopo(options: PopoOptions): Promise<boolean>;
export async function sendPopo(
  contentOrOptions: string | PopoOptions,
  receiver?: string,
): Promise<boolean> {
  const isOptions = typeof contentOrOptions === 'object';
  const to = (isOptions ? contentOrOptions.receiver : receiver) || NOTIFY_RECEIVER;
  if (!to) { console.warn('[notifier] 无接收人，跳过'); return false; }

  try {
    const body: Record<string, unknown> = { receiver: to };

    if (isOptions && contentOrOptions.message) {
      body.message = contentOrOptions.message;
    } else {
      body.content = isOptions ? contentOrOptions.message?.content : contentOrOptions;
    }

    if (POPO_APP_KEY) body.appKey = POPO_APP_KEY;
    if (POPO_APP_SECRET) body.appSecret = POPO_APP_SECRET;

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15_000);

    const res = await fetch(POPO_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    clearTimeout(timer);

    const data = await res.json();
    const ok = res.ok && data?.code === 200;
    console.log(`[notifier] → ${to} ${ok ? '✓' : '✗'} (${res.status})`);
    return ok;
  } catch (err: unknown) {
    console.error(`[notifier] 发送失败: ${err instanceof Error ? err.message : err}`);
    return false;
  }
}
```

**使用示例**：

```typescript
// 纯文本（最简用法）
await sendPopo('你好，这是一条测试消息');

// 指定接收人
await sendPopo('通知内容', 'zhangsan@corp.netease.com');

// 发送到群并 @指定用户
await sendPopo({
  receiver: '12345678',
  message: {
    content: '请审批一下这个需求',
    atUids: ['zhangsan@corp.netease.com', 'lisi@corp.netease.com'],
  },
});

// @全体成员
await sendPopo({
  receiver: '12345678',
  message: { content: '重要通知：系统将于今晚22:00进行维护', isAtAll: true },
});
```

**定时调度模块 — `src/worker/scheduler.ts`**：

```typescript
interface ScheduleOptions {
  runImmediately?: boolean;
  onError?: (err: Error) => void;
}

export function schedule(
  name: string,
  intervalMs: number,
  fn: () => Promise<void>,
  options: ScheduleOptions = {},
): void {
  const { runImmediately = true, onError } = options;

  const run = async () => {
    const start = Date.now();
    try {
      await fn();
      console.log(`[scheduler] ${name} ✓ (${Date.now() - start}ms)`);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error(`[scheduler] ${name} ✗ (${Date.now() - start}ms): ${error.message}`);
      if (onError) onError(error);
    }
  };

  if (runImmediately) run();
  setInterval(run, intervalMs);
  console.log(`[scheduler] ${name} 已注册 — 间隔 ${intervalMs / 1000}s`);
}

process.on('SIGINT', () => { console.log('[scheduler] 停止'); process.exit(0); });
process.on('SIGTERM', () => { console.log('[scheduler] 停止'); process.exit(0); });
```

#### Step 4: 组装入口 `src/worker/index.ts`

**只导入用户需要的模块。**

模式 A — 单次执行：

```typescript
import { supabase } from './db';
import { sendPopo } from './notifier';

async function main(): Promise<void> {
  // 业务逻辑...
}

main()
  .then(() => process.exit(0))
  .catch((err) => { console.error('[worker] 失败:', err); process.exit(1); });
```

模式 B — 常驻进程 + 定时循环：

```typescript
import { supabase } from './db';
import { sendPopo } from './notifier';
import { schedule } from './scheduler';

async function myTask(): Promise<void> {
  // 业务逻辑...
}

console.log('[worker] 启动');
schedule('my-task', 15 * 60_000, myTask);
```

#### Step 5: 本地测试

```bash
pnpm run worker
```

#### Step 6: 部署

`pnpm run build` 自动调用 `build-worker.mjs`。部署后容器检测到 `dist/worker/index.js` 自动启动 Node 进程。

### Bootstrap Checklist

从零搭建（agent 严格按序执行）：

1. `pnpm add -D esbuild`
2. [如需数据库] `pnpm add @supabase/supabase-js`
3. 创建 `src/worker/` 目录
4. 创建 `scripts/build-worker.mjs`
5. 修改 `package.json` scripts
6. 追加 `.gitignore`
7. [如需数据库] MCP `create_supabase_worker_key` 获取 WORKER_KEY
8. [如需数据库] 从项目 `.env` 获取 ANON_KEY
9. [如需数据库] 确定 APP_SCHEMA（`app_` + app_id 中 `-` 换 `_`）
10. 创建 `src/worker/.env.example` + `.env`
11. 按需生成模块（db.ts / notifier.ts / scheduler.ts）
12. 生成 `src/worker/index.ts`
13. [如需数据库且 RLS] 为每张表执行 worker_bypass policy
14. `pnpm run worker` 验证

### 常见错误

| 错误 | 正确做法 |
|------|----------|
| 忘记装 esbuild | `pnpm add -D esbuild` |
| 忘记装 @supabase/supabase-js | 数据库能力需要 `pnpm add @supabase/supabase-js` |
| Worker 开 HTTP 端口 | 禁止，通过数据库交互 |
| Worker 引用前端代码 | 只引用 `src/worker/` 内部模块 |
| 忘记 RLS 表的 worker_bypass | 每张表单独执行 |
| .env 提交到 git | 只提交 .env.example |
| 全量生成所有模块 | 只生成用户需要的 |
| ANON_KEY 找不到 | 从项目 `.env` 搜 `VITE_SUPABASE_ANON_KEY` |
| APP_SCHEMA 格式错 | `app_` 前缀 + app_id（`-` 换 `_`） |
