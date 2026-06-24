<!-- BUILD_DEPLOY_RULES_START -->
# build_docker 构建部署流程

前端构建部署使用 `scripts/deploy-docker.mjs` 脚本，直接通过 HTTP 调用 MCP 服务器，
绕过 LLM 中转，解决大文件（minified JS 等）无法传输的问题。零额外依赖，仅用 Node.js 内置模块。

1. **安装依赖**：在项目目录执行 `pnpm install`
2. **构建产物**：执行 `pnpm run build`，生成 dist/ 目录
3. **执行部署**：运行 `node scripts/deploy-docker.mjs <app_id> --mcp-url <url> --mcp-key <apiKey> [dist_dir] [--version <version>]`

`--mcp-url` 和 `--mcp-key` 必须由 Agent 从已连接的 **danqing-develop-mcp** 服务配置中读取并传入。

示例：
```bash
pnpm install && pnpm run build
node scripts/deploy-docker.mjs my-app --mcp-url https://xxx/mcp --mcp-key ak-xxx
node scripts/deploy-docker.mjs my-app --mcp-url https://xxx/mcp --mcp-key ak-xxx ./dist --version v1.0.0-0326
```

脚本收集 dist/ 下所有文件（文本直接传输，二进制自动 base64 编码），
通过 HTTP 直接发送到 MCP 服务器执行 docker build + push。

**注意**：不要再用 Read 工具读取 dist 文件后调用 MCP build_docker 工具，大文件会超出限制。
<!-- BUILD_DEPLOY_RULES_END -->

<!-- DANQING_SDK_RULES_START -->
# Danqing SDK 使用规则

## 核心原则（NON-NEGOTIABLE）

本项目已集成 `@fuxi/danqing-sdk`，**禁止重复实现 SDK 已有的功能**。

在实现以下任何功能之前，**必须先读取 `docs/api-catalog.md`**，确认 SDK 是否已提供对应能力：
- AI 图像生成（文生图、图生图、风格迁移、超分辨率、擦除、扩图等）
- AI 视频生成（文生视频、图生视频等）
- 3D 模型生成（文字/图片/多视图生成 3D 模型等）
- 图片上传、历史管理、图片信息查询
- 用户鉴权、积分查询、埋点

## 文档位置

| 文档 | 路径 | 内容 |
|---|---|---|
| **API 总览（必读）** | `docs/api-catalog.md` | 所有 API 的参数、返回值、调用示例 |
| **SDK 使用指南** | `docs/sdk-usage.md` | 初始化、Provider、基础用法 |

> `api-catalog.md` 由 SDK 的 postinstall 脚本自动同步，执行 `pnpm update @fuxi/danqing-sdk` 后会自动更新。

## 调用方式

```tsx
import { useSDK } from '@/config/sdk';

function MyComponent() {
  const sdk = useSDK();

  // 所有 AI API 通过 sdk.api.<service>.<method>() 调用
  // 具体参数和返回值请查阅 docs/api-catalog.md
  const result = await sdk.api.banana.generate({ prompt: '...', size: '1:1' });
}
```

## 禁止行为

- ❌ 禁止手动封装 HTTP 请求调用 AI 生图/生视频/生模型接口
- ❌ 禁止在 `src/services/` 中重复实现 SDK 已有的 API 封装
- ❌ 禁止硬编码 AI 服务的轮询逻辑（SDK 内置了 createTask + pollForResult 状态机）
- ❌ 禁止假设 API 参数，必须以 `docs/api-catalog.md` 中的 Interface 定义为准
<!-- DANQING_SDK_RULES_END -->

<!-- FE_RULE_RULES_START -->
# 前端工程规则

## 技术栈（默认基线）

- **框架**: React 18+
- **构建工具**: Vite 5+
- **UI 组件库**: Ant Design 5+（如项目不使用 AntD，可替换，但仍需遵守本文档的工程/风格约束）
- **样式系统**:
  - 推荐：原子化 CSS（UnoCSS）+ CSS Modules（`.module.css` / `.module.less`）
  - 不推荐：新增全局样式与零散的 Less 文件（除非模板本身已集成且有明确边界）
- **状态管理**: 推荐 Jotai（如项目选用其他方案，也需保持"最小全局状态、边界清晰、可测试、可追踪"的原则）
- **HTTP 客户端**: Axios（或等价方案，但需要统一封装与类型化）
- **路由**: React Router 6+
- **TypeScript**: 5+
- **代码检查/格式化**: ESLint + Prettier（如项目启用 Stylelint / Commitlint，按配置执行）

## 代码结构（建议）

### 主要目录职责（可按项目裁剪）

- **src/service/**: HTTP 请求封装与 API 定义（或 `src/services/`，二选一保持一致）
- **src/store/**: 全局状态（如使用 Jotai，可用 `src/store/atoms/` 或 `src/state/`；避免 Redux 模板残留）
- **src/components/**: 可复用组件
- **src/utils/**: 工具函数
- **src/hooks/**: 自定义 React Hooks
- **src/types/**: TypeScript 类型定义
- **src/constants/**: 常量定义

### 命名规范

- 组件文件：PascalCase（如 `UserProfile.tsx`）
- 工具函数：camelCase（如 `formatDate.ts`）
- 类型定义：PascalCase（如 `UserInfo.ts`）
- 常量文件：kebab-case 或 camelCase（如 `api-constants.ts`）

## 依赖与脚本

### 包管理工具

**必须使用 pnpm**，项目根目录的 `package.json` 中配置了 `preinstall` 脚本强制使用 pnpm。

**安装依赖**：
- 根目录安装：`pnpm install`
- 特定包安装：`pnpm --filter <package-name> add <dependency>`
- 开发依赖：`pnpm --filter <package-name> add -D <dependency>`

### UI 组件库（如使用）

以 **Ant Design 5+** 为例：
- 使用 Ant Design 的组件时，优先使用官方文档推荐的用法
- 主题/Token 定制应集中管理（CSS 变量 / UnoCSS shortcuts / antd token），避免散落在业务组件里硬编码
- 图标使用 `@ant-design/icons` 包

### 全局数据流管理

- 推荐使用 **Jotai**：用 atom 组织局部/全局状态，避免"单一巨大 store"
- 推荐用自定义 hooks 封装 atom 的读写（例如 `useUserState()`），避免在组件内散落 `useAtom` 细节
- 若项目使用 Redux/Zustand 等替代方案：也要遵守"最小化全局状态、边界清晰、可测试、可追踪"的原则

### HTTP 客户端

**Axios** 是统一的 HTTP 客户端。每个项目必须有统一的 Axios 实例封装（例如 `src/service/common.ts`），至少包含：
- baseURL/timeout 的集中配置
- 请求拦截器：注入 token / trace id / source 等通用参数
- 响应拦截器：统一处理错误（登录过期、权限、网络错误、后端错误码等）
- 类型化：请求/响应尽量写出明确类型，避免 `any`

## 编码规范

### Lint / 格式化

#### ESLint

- 以模板内 `eslint.config.cjs` 为准（并与 `tsconfig.json` / `tsconfig.node.json` 保持一致）
- 最大行数：400（警告）
- 最大嵌套深度：3（警告）
- React 组件必须自闭合

#### Prettier

- 配置文件以模板内 `.prettierrc` 为准
- 使用 `@trivago/prettier-plugin-sort-imports` 自动排序导入
- tabWidth: 2, semi: true, singleQuote: true, printWidth: 150

#### Commitlint（如启用）

- 使用 `@commitlint/config-conventional` 规范提交信息

### 类型优先策略

- **所有新增功能必须类型优先**：设计 API/数据流时先定义接口类型，再实现逻辑
- 通用/跨模块复用的类型应集中管理（`src/types/`）
- 禁止随意使用 `any`，必要时使用 `unknown`、`Record<string, T>` 等更精确的类型
- 提交前需自查 TypeScript 报错，确保没有隐式 `any`、类型推断失败等警告

### JSX / 组件约束

- JSX 需要保持 return 结构简洁：逻辑、数据处理提前在组件顶部算好
- 组件内不要在 JSX 里声明内联函数；统一在组件体内提前定义再透出，必要时用 `useCallback`
- 控制组件 props 数量（建议 ≤ 6 个）；超出时需改为传入对象或拆分子组件
- Hook 的返回值数量同样要受控（建议 ≤ 5 个成员）
- `useEffect`、`useLayoutEffect` 等副作用 Hook 统一放在组件体的**底部**
- 纯常量、枚举、工具函数放在组件外部文件作用域

### 渐进式重构原则

- 新功能 / 新模块一律按本文档与 lint 配置实现
- 触达历史代码时，遵循"小步、可回滚"的渐进式重构
- 复杂遗留逻辑优先通过"旁路重写 + 灰度切换"替代，而不是一次性大重构

### 样式编写 (NON-NEGOTIABLE)

**核心原则**：

1. **禁止直接使用硬编码值**：
   - 禁止在代码中直接使用硬编码的颜色值（如 `#1890ff`）、间距值（如 `24px`）、尺寸值（如 `220px`）
   - 必须使用 CSS 变量（如 `var(--primary-color)`）或 UnoCSS 类名（如 `text-primary`、`p-lg`）
   - 允许：百分比值、视口单位（`100vh`、`100vw`）、业务数据中的尺寸

2. **优先使用 UnoCSS 类名**：
   - 常用样式优先直接在 JSX 中使用 UnoCSS 原子类名
   - 通过项目的 UnoCSS 配置（`uno.config.ts`）扩展 `rules` / `shortcuts`

3. **CSS Modules 仅用于复杂样式**：
   - 仅在以下场景使用 `.module.css`：动画、伪元素、复杂布局
   - 禁止在 `.module.css` 中重复定义可用 UnoCSS 类名实现的简单样式
   - `.module.css` 文件内部必须使用 CSS 变量，禁止使用硬编码值

4. **CSS Modules 类名使用规范**（NON-NEGOTIABLE）：
   - 必须使用 `cx` 函数：`import cx from './Component.module.css'` + `className={cx('class-name')}`
   - 禁止使用 `styles` 对象方式：禁止 `import styles from './Component.module.css'`

5. **CSS 变量统一管理**：
   - 所有 CSS 变量在全局样式文件中定义（如 `src/styles/variables.css` / `src/styles/global.less`）
   - 需求不满足时在组件级 `.module.css` 中定义局部 CSS 变量

6. **第三方组件样式定制**：
   - 第三方组件的样式定制允许使用 `style` 属性，但必须使用 CSS 变量
   - 业务组件禁止使用内联样式，必须使用 UnoCSS 类名或 CSS Modules

### 样式文件组织

- 组件样式：与组件文件同目录，统一使用 `.module.css`
- 全局样式：仅保留必要的 reset/variables，放在 `src/styles/` 目录
- 主题变量：通过 Less 变量（存量）或 CSS 变量定义

### 使用示例

```typescript
// 正确：使用 UnoCSS 类名
<div className="p-lg m-md text-primary text-center">内容</div>

// 正确：使用 CSS Modules + cx 函数
import cx from './Component.module.css';
<div className={cx('card', 'card-mb')}>内容</div>

// 正确：第三方组件使用 style + CSS 变量
<Button style={{ color: 'var(--primary-color)' }}>按钮</Button>

// 错误：硬编码值
<div style={{ padding: '24px', color: '#1890ff' }}>内容</div>

// 错误：使用 styles 对象方式
import styles from './Component.module.css';
<div className={styles['card-mb']}>内容</div>

// 错误：业务组件使用内联样式
<div style={{ marginBottom: 24 }}>内容</div>
```

### HTTP 客户端请求

```typescript
import axiosInstance from '@/service/common';
import type { AxiosResponse } from 'axios';

// GET 请求
const getUserInfo = async (userId: string) => {
  const response: AxiosResponse<UserInfo> = await axiosInstance.get('/api/user', {
    params: { userId }
  });
  return response.data;
};

// POST 请求
const createProject = async (data: CreateProjectData) => {
  const response = await axiosInstance.post('/api/project', data);
  return response.data;
};
```

### 类型化请求

```typescript
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

const fetchTypedData = async (): Promise<ApiResponse<UserInfo>> => {
  const response = await axiosInstance.get('/api/user');
  return response.data;
};
```
<!-- FE_RULE_RULES_END -->

<!-- PERMISSION_AUTH_RULES_START -->
# 项目组鉴权规则

## 核心安全原则（NON-NEGOTIABLE）

**当页面涉及数据库表的数据时，必须启用表级 RLS 鉴权。仅做前端路由/组件级权限控制是不安全的，绝对禁止。**

- ❌ 禁止只用 `PermissionGuard`/`usePermission` 做前端过滤而不设置 RLS
- ❌ 禁止认为"前端隐藏了按钮/页面"就等于安全
- ✅ 任何按项目组隔离的数据表，**必须**启用 RLS + Policy
- ✅ 前端权限控制只是 UX 优化（隐藏无权操作），**不是安全边界**

**实现鉴权时的正确顺序：**
1. 先做数据库 RLS（安全层）
2. 再做前端权限过滤（体验层）

不允许跳过第 1 步直接做第 2 步。

## 安全模型

本项目采用 **服务端签发 JWT + 数据库 RLS** 的安全模型：

```
用户登录 → RBAC Cookie → 服务端用 cookie 请求权限接口 → 服务端签发含 group_roles 的 JWT → 前端用 JWT 访问 Supabase
```

**关键安全点：**
- JWT 由服务端签发（`/danqing-node/api/vibe-coding/permission/user/info`），前端无法伪造
- 服务端通过转发用户 cookie 到上游权限接口获取真实身份，不信任任何前端传入的身份数据
- 数据库 RLS 通过 `auth.jwt()` 读取 JWT claims 进行行级过滤，安全不依赖前端
- 前端权限控制只是 UX 优化（隐藏无权操作），不是安全边界
- **即使前端没做任何权限判断，只要 RLS 启用，无权用户也无法访问数据——这才是真正的安全**

## JWT Claims 结构

服务端签发的 JWT 包含以下自定义 claims：

```json
{
  "sub": "username",
  "role": "authenticated",
  "iss": "supabase",
  "iat": 1700000000,
  "exp": 1700003600,
  "app_metadata": {
    "groups": [90036, 90057, 90213],
    "group_roles": {
      "90036": "l10",
      "90057": "l36",
      "90213": "fu362"
    }
  }
}
```

| 字段 | 说明 |
|---|---|
| `app_metadata.group_roles` | groupId → roleCode 的映射，**roleCode 是项目组代号**（如 `l36` = 逆水寒手游） |
| `app_metadata.groups` | 用户所属项目组的 groupId 数组（内部使用，开发者无需关心） |

**重要**：开发者通常只知道项目组代号（roleCode），不知道数字 groupId。所有鉴权逻辑统一基于 roleCode，大小写不敏感。

## 表级鉴权（RLS）

### 何时启用 RLS

当表的数据需要按项目组隔离时（如：只有特定项目组的人能查看/编辑该组的数据），必须启用 RLS。

### 实施步骤

#### 1. 表结构：添加 role_code 列

需要按项目组隔离的表必须包含 `role_code TEXT` 列：

```sql
CREATE TABLE <%= appSchema %>.my_table (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_code TEXT NOT NULL,
  -- 其他字段...
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_my_table_role_code ON <%= appSchema %>.my_table(role_code);
```

#### 2. 创建辅助函数

在 schema 中创建提取 JWT roleCodes 的辅助函数（只需执行一次）：

```sql
CREATE OR REPLACE FUNCTION <%= appSchema %>.get_user_role_codes()
RETURNS TEXT[] LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    (SELECT array_agg(lower(val))
     FROM jsonb_each_text(
       auth.jwt() -> 'app_metadata' -> 'group_roles'
     ) AS r(gid, val)),
    ARRAY[]::text[]
  );
$$;
```

#### 3. 启用 RLS 并创建 Policy

```sql
ALTER TABLE <%= appSchema %>.my_table ENABLE ROW LEVEL SECURITY;

-- 大小写不敏感匹配
CREATE POLICY "role_select" ON <%= appSchema %>.my_table
  FOR SELECT USING (
    lower(role_code) = ANY(<%= appSchema %>.get_user_role_codes())
  );

CREATE POLICY "role_insert" ON <%= appSchema %>.my_table
  FOR INSERT WITH CHECK (
    lower(role_code) = ANY(<%= appSchema %>.get_user_role_codes())
  );

CREATE POLICY "role_update" ON <%= appSchema %>.my_table
  FOR UPDATE USING (
    lower(role_code) = ANY(<%= appSchema %>.get_user_role_codes())
  )
  WITH CHECK (
    lower(role_code) = ANY(<%= appSchema %>.get_user_role_codes())
  );

CREATE POLICY "role_delete" ON <%= appSchema %>.my_table
  FOR DELETE USING (
    lower(role_code) = ANY(<%= appSchema %>.get_user_role_codes())
  );
```

#### 4. 完整 SQL 模板

直接使用 `sql/enable-group-rls.sql` 中的模板，替换表名即可。

### RLS 常见模式

| 场景 | Policy USING 条件 |
|---|---|
| 按项目组隔离 | `lower(role_code) = ANY(get_user_role_codes())` |
| 公开读 + 按组写 | SELECT: `true`，INSERT/UPDATE/DELETE: `lower(role_code) = ANY(get_user_role_codes())` |
| 创建者可改 + 同组可读 | SELECT: `lower(role_code) = ANY(get_user_role_codes())`，UPDATE/DELETE: `created_by = auth.jwt()->>'sub'` |
| 多组可见 | 列改为 `role_codes TEXT[]`，条件改为 `role_codes && get_user_role_codes()` |
| Worker 绕过 RLS | `coalesce(auth.jwt()->'app_metadata'->>'worker', '') = 'true'`（见 `rules/worker-service.md`） |

### 注意事项

- **roleCode 大小写不敏感**：接口返回的 roleCode 可能大小写不一致，`get_user_role_codes()` 统一转小写后比较
- **启用 RLS 后必须有 Policy**：没有 Policy 的表会拒绝所有请求（返回空数组）
- **anon 角色不受 authenticated 的 Policy 保护**：如果不需要匿名访问，不要给 anon 角色 GRANT 权限
- **INSERT 使用 WITH CHECK 而非 USING**：INSERT 没有现有行，只能用 WITH CHECK 约束新数据
- **性能**：在 `role_code` 列上建索引，避免全表扫描

## 页面级鉴权（前端）

### 使用 usePermission hook

```tsx
import { usePermission } from '@/hooks/usePermission';

function MyPage() {
  const { hasRole, hasAnyRole, hasPermission } = usePermission();

  // 按 roleCode 检查（大小写不敏感）
  if (!hasRole('l36')) {
    return <div>无权限访问</div>;
  }

  // 检查用户是否拥有特定权限
  if (!hasPermission('interface.admin.manager.permission')) {
    return <div>无管理权限</div>;
  }

  return <div>页面内容</div>;
}
```

### 使用 PermissionGuard 组件

```tsx
import { PermissionGuard } from '@/components/PermissionGuard';

function MyPage() {
  return (
    <div>
      {/* 按 roleCode 控制（大小写不敏感） */}
      <PermissionGuard roleCode="l36" fallback={<span>无权限</span>}>
        <AdminPanel />
      </PermissionGuard>

      {/* 属于任一项目组即可 */}
      <PermissionGuard roleCodes={['l36', 'fu362']}>
        <SharedContent />
      </PermissionGuard>

      {/* 按权限码控制 */}
      <PermissionGuard permissionCode="interface.admin.manager.permission">
        <button>管理按钮</button>
      </PermissionGuard>
    </div>
  );
}
```

### 路由级鉴权

```tsx
import { PermissionGuard } from '@/components/PermissionGuard';

const routes = [
  {
    path: '/admin',
    element: (
      <PermissionGuard roleCode="l36" fallback={<Navigate to="/" />}>
        <AdminPage />
      </PermissionGuard>
    ),
  },
];
```

### 写入数据时携带 role_code

```tsx
import { usePermission } from '@/hooks/usePermission';

function CreateForm() {
  const { groups } = usePermission();
  const currentRoleCode = groups[0]?.roleCode;

  const handleSubmit = async (data) => {
    await supabase.from('my_table').insert({
      ...data,
      role_code: currentRoleCode,
    });
  };
}
```

## 前后端配合检查清单

实现项目组鉴权时，必须同时完成：

- [ ] 表结构包含 `role_code TEXT` 列
- [ ] 执行 `sql/enable-group-rls.sql` 创建辅助函数 + 启用 RLS + Policy
- [ ] 前端写入数据时携带正确的 `role_code`
- [ ] 前端使用 `usePermission` 或 `PermissionGuard` 隐藏无权操作（UX优化）
- [ ] 通过 REST API 验证 RLS 生效（不同组的用户只能看到各自数据）
<!-- PERMISSION_AUTH_RULES_END -->

<!-- SANDBOX_DEBUGGING_RULES_START -->
# Sandbox 沙箱调试规范

## 你拥有的能力

当用户让你 **调试页面**、**预览效果**、**验证渲染结果** 或 **排查前端问题** 时，
你可以使用项目中集成的 Sandbox 沙箱容器来完成。你不再是"盲人"——你可以真正看到浏览器中的页面。

## 核心架构

```
宿主机 (你的运行环境)          Sandbox 容器 (headful browser)
┌─────────────────┐           ┌─────────────────────────────┐
│  Playwright      │ ── CDP ──→│  Chrome (端口 9222)          │
│  SDK Client      │ ── HTTP ─→│  Nginx 代理 (端口 8080)      │
│  debug-sandbox.ts│           │  noVNC (端口 6080)           │
│                  │           │  Jupyter Lab (端口 8888)     │
└─────────────────┘           └─────────────────────────────┘
```

**关键端口**: 宿主机 `http://localhost:8080` 映射到容器 Nginx 代理

## 工作流程

### 确认容器运行

```bash
podman ps --filter name=sandbox
# 或
docker ps --filter name=sandbox
```

### 使用 CLI 调试工具

项目已集成 `test-sandbox/debug-sandbox.ts` CLI 工具:

```bash
# 截图 - 查看当前页面
npx ts-node test-sandbox/debug-sandbox.ts screenshot

# 截图指定 URL
npx ts-node test-sandbox/debug-sandbox.ts screenshot --url http://localhost:9999

# 导出 DOM 结构
npx ts-node test-sandbox/debug-sandbox.ts dom

# 捕获控制台日志 (持续 5 秒)
npx ts-node test-sandbox/debug-sandbox.ts console --duration 5000

# 执行完整检查 (截图 + DOM + 控制台)
npx ts-node test-sandbox/debug-sandbox.ts full --url http://localhost:9999
```

输出文件保存在 `test-sandbox/output/` 目录:
- `screenshot.png` — 页面截图
- `dom.txt` — DOM 树结构
- `console.txt` — 控制台日志

### Playwright CDP 直连

```typescript
import { chromium } from "playwright";

const browser = await chromium.connectOverCDP("http://localhost:8080/cdp");
const page = browser.contexts()[0].pages()[0];

await page.goto("http://localhost:9999");
await page.screenshot({ path: "test-sandbox/output/screenshot.png" });
await page.click("#submit-btn");
await page.fill("#search-input", "测试文本");

page.on("console", (msg) => console.log(`[${msg.type()}] ${msg.text()}`));
page.on("pageerror", (err) => console.error(`[PAGE ERROR] ${err.message}`));
```

## 重要注意事项

1. **不要使用 SDK 的 `browserPage` 高级 API**（如 `client.browserPage.navigate()`），当前版本返回 404
2. **端口 8888 被 Jupyter Lab 占用**，应用测试请使用其他端口（推荐 9999）
3. **CDP 连接地址**固定为 `http://localhost:8080/cdp`
4. **VNC 可视化**地址: `http://localhost:8080/vnc/index.html`
5. **每次截图前**确保页面加载完成

## 何时应该使用 Sandbox

- 用户说"帮我看看页面效果"、"预览一下"、"这个页面对不对"
- 用户遇到前端渲染问题需要诊断
- 用户要求验证样式/布局变更
- 用户要求做 UI 自动化测试
- 修改了 HTML/CSS/JS 后想确认效果

## 何时不需要 Sandbox

- 纯后端 API 开发
- 配置文件修改
- 代码 review 或架构讨论
<!-- SANDBOX_DEBUGGING_RULES_END -->

<!-- SUPABASE_STORAGE_RULES_START -->
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
<!-- SUPABASE_STORAGE_RULES_END -->

<!-- WORKER_SERVICE_RULES_START -->
# Worker 服务规则

## 什么是 Worker

`src/worker/` 目录用于编写**线上运行的 Node.js 脚本**。这些脚本在部署后由容器自动启动（当 `dist/worker/index.js` 存在时）。

**Worker 能做的：**
- 定时抓取第三方接口/网站数据，写入数据库
- 调用外部 API、CLI 工具
- 后台数据处理、聚合

**Worker 不能做的（NON-NEGOTIABLE）：**
- ❌ 不对外暴露任何 HTTP 端口/接口
- ❌ Web 页面不允许直接调用 Worker（无 HTTP 通信）
- ❌ Worker 不允许直接向 Web 页面推送数据

**Web 与 Worker 的交互方式：仅通过数据库间接影响。**

```
Worker → 写入数据库 → Web 页面读取数据库展示
Web 页面 → 写入数据库 → Worker 读取数据库执行任务
```

## 启用 Worker

模板默认**不包含** `src/worker/index.ts`。只有用户需要时才创建该文件。构建脚本根据 `dist/worker/index.js` 是否存在决定是否启动 Node 进程。

### 步骤 1：获取 Worker Key

调用 MCP 工具 `create-supabase-worker-key` 生成 Worker Key：

```
MCP 工具: create-supabase-worker-key
```

将返回的 key 填入 `src/worker/.env`：

```bash
cp src/worker/.env.example src/worker/.env
# 将 Worker Key 填入 WORKER_KEY 字段
```

### 步骤 2：创建入口文件

创建 `src/worker/index.ts` 作为入口：

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
  // 你的任务逻辑...
}

main().catch((err) => {
  console.error('[worker] 失败:', err);
  process.exit(1);
});
```

### 步骤 3：构建与部署

```bash
npm run build
# 如果 src/worker/index.ts 存在，dist/worker/index.js 会被生成
# 部署后容器检测到该文件会自动启动 node 进程
```

## 环境变量

| 变量 | 说明 | 获取方式 |
|---|---|---|
| `SUPABASE_URL` | Supabase 服务地址 | 与 Web 端相同 |
| `WORKER_KEY` | 平台签发的长期 JWT | 调用 MCP `create-supabase-worker-key` |
| `APP_SCHEMA` | 当前 app 的 schema 名 | 与 Web 端 VITE_APP_ID 对应 |

## RLS 与 Worker

Worker Key 的 JWT 中包含 `app_metadata.worker = "true"`。对启用了 RLS 的表，必须按 `sql/worker-bypass-policy.sql.tpl` 模板为每张需要 Worker 访问的表添加 bypass policy：

```sql
-- 参考 sql/worker-bypass-policy.sql.tpl，将 <table_name> 替换为实际表名
CREATE POLICY "worker_bypass" ON schema.<table_name>
  FOR ALL TO authenticated
  USING (coalesce(auth.jwt()->'app_metadata'->>'worker', '') = 'true')
  WITH CHECK (coalesce(auth.jwt()->'app_metadata'->>'worker', '') = 'true');
```

**启用 RLS 的表如果没有执行此 policy，Worker 将无法访问该表数据。**

**⚠️ 注意：此 policy 不会自动应用到新建的表。** 每次新建一张启用 RLS 且需要 Worker 访问的表时，都必须为该表单独执行一次 `worker_bypass` policy，否则 Worker 无法读写该表。

## 数据写入规则

Worker 写入带 RLS 的表时**必须携带 `role_code`**，否则 Web 端用户看不到数据：

```typescript
// ✅ 正确
await supabase.from('my_table').insert({ title, role_code: 'fu362' });

// ❌ 错误：Web 端用户看不到
await supabase.from('my_table').insert({ title });
```

## 项目结构

```
src/worker/
├── .env.example    # 环境变量模板
├── .env            # 实际凭证（gitignore）
└── index.ts        # 入口（用户需要时才创建）
```

构建产物（仅当 index.ts 存在时生成）：
```
dist/worker/
└── index.js        # esbuild 打包的单文件
```

## 检查清单

- [ ] 已通过 MCP `create-supabase-worker-key` 获取 Worker Key 并填入 `.env`
- [ ] Worker 不暴露任何 HTTP 端口
- [ ] Worker 与 Web 仅通过数据库交互，无直接通信
- [ ] 目标表有 RLS 时已添加 `worker_bypass` policy（每张新表都需要单独添加，不会自动继承）
- [ ] 写入 RLS 表时带了 `role_code`
- [ ] Worker 代码只引用 `src/worker/` 内部模块，不引用前端代码
<!-- WORKER_SERVICE_RULES_END -->
