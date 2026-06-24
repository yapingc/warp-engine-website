# 前端工程规则

本文档用于约束**由模板创建的新前端项目**的代码风格与工程实践，目标是让人类与 AI（Cursor / Claude Code / Codex 等）在**不额外口头说明**的情况下，也能持续产出一致、可维护的代码。

## 技术栈（默认基线）

- **框架**: React 18+
- **构建工具**: Vite 5+
- **UI 组件库**: Ant Design 5+（如项目不使用 AntD，可替换，但仍需遵守本文档的工程/风格约束）
- **样式系统**:
  - 推荐：原子化 CSS（UnoCSS）+ CSS Modules（`.module.css` / `.module.less`）
  - 不推荐：新增全局样式与零散的 Less 文件（除非模板本身已集成且有明确边界）
- **状态管理**: 推荐 Jotai（如项目选用其他方案，也需保持“最小全局状态、边界清晰、可测试、可追踪”的原则）
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

## 依赖与脚本（通用约束）

### 包管理工具

**必须使用 pnpm**，项目根目录的 `package.json` 中配置了 `preinstall` 脚本强制使用 pnpm：

```json
"preinstall": "npx only-allow pnpm"
```

**工作区配置（如是 monorepo）**：通过 `pnpm-workspace.yaml` 管理多个包；否则忽略本条。

**安装依赖**：
- 根目录安装：`pnpm install`
- 特定包安装：`pnpm --filter <package-name> add <dependency>`
- 开发依赖：`pnpm --filter <package-name> add -D <dependency>`

### UI 组件库（如使用）

以 **Ant Design 5+** 为例：

- 使用 Ant Design 的组件时，优先使用官方文档推荐的用法
- 主题/Token 定制应集中管理（CSS 变量 / UnoCSS shortcuts / antd token），避免散落在业务组件里硬编码
- 图标使用 `@ant-design/icons` 包

### 全局数据流管理（推荐）

- 推荐使用 **Jotai**：用 atom 组织局部/全局状态，避免“单一巨大 store”。
- 推荐用自定义 hooks 封装 atom 的读写（例如 `useUserState()`），避免在组件内散落 `useAtom` 细节。
- 若项目使用 Redux/Zustand 等替代方案：也要遵守“最小化全局状态、边界清晰、可测试、可追踪”的原则；禁止在组件中随意创建全局单例状态。

### HTTP 客户端

**Axios** 是统一的 HTTP 客户端。

#### 配置方式

每个项目必须有**统一的 Axios 实例封装**（例如 `src/service/common.ts`），至少包含：

- **baseURL/timeout** 的集中配置
- **请求拦截器**：注入 token / trace id / source 等通用参数（按项目需要）
- **响应拦截器**：统一处理错误（登录过期、权限、网络错误、后端错误码等）
- **类型化**：请求/响应尽量写出明确类型，避免 `any`

#### 使用示例

```typescript
import axiosInstance from '@/service/common';

const response = await axiosInstance.post('/api/endpoint', { data: 'value' });
```

## 编码规范

### Lint / 格式化

#### ESLint

- 以模板内 `eslint.config.cjs` 为准（并与 `tsconfig.json` / `tsconfig.node.json` 保持一致）

**主要规则**：
- 最大行数：400（警告）
- 最大嵌套深度：3（警告）
- React 组件必须自闭合
- lodash 相关限制由上游 `@fuxi/eslint-config-fuxi` 管理，当前项目未额外禁止，如需收紧可在本地 eslint 配置中单独约束

#### Stylelint（如启用）

- 若项目启用 stylelint：必须确保样式变更通过检查

#### Prettier

- 配置文件以模板内 `.prettierrc` 为准
- 使用 `@trivago/prettier-plugin-sort-imports` 自动排序导入
- 主要配置：
  - tabWidth: 2
  - semi: true
  - singleQuote: true
  - printWidth: 150
  - importOrder: 以模板配置为准（保持导入分组稳定、可预测）

#### Commitlint（如启用）

- 使用 `@commitlint/config-conventional` 规范提交信息
- 若项目启用 commitlint：提交信息必须符合约定，否则 CI 可拒绝

### 类型优先策略

- **所有新增功能必须类型优先**：设计 API/数据流时先定义接口类型，再实现逻辑
- 通用/跨模块复用的类型应集中管理（单包项目可放 `src/types/` 或 `src/shared/types/`；monorepo 可放 shared 包）
- 各业务模块应在 `src/types/` 下维护本模块专属类型；引用前需先确认 common 或模块内是否已有定义
- 禁止随意使用 `any`，必要时使用 `unknown`、`Record<string, T>` 等更精确的类型，并辅以注释说明原因
- 提交前需自查 TypeScript 报错，确保没有隐式 `any`、类型推断失败等警告

### JSX / 组件约束

- JSX 需要保持 return 结构简洁：逻辑、数据处理提前在组件顶部算好，避免在 JSX 中写函数/复杂表达式
- 组件内不要在 JSX 里声明内联函数；统一在组件体内提前定义（`const handleClick = () => {}`）再透出，必要时用 `useCallback` 保持稳定引用
- 控制组件 props 数量（建议 ≤ 6 个）；超出时需改为传入对象或拆分子组件，防止组件膨胀
- Hook 的返回值数量同样要受控（建议 ≤ 5 个成员），优先返回对象并按用途分组
- 当组件或 Hook 逻辑变复杂时，拆分成更小的职责单元（子组件/子 hook），并补充类型定义与注释
- `useEffect`、`useLayoutEffect` 等副作用 Hook 统一放在组件体的**底部**，确保读组件时先关注渲染逻辑、再看副作用；多个 effect 时按执行顺序/依赖关系自上而下排列
- 纯常量、枚举、工具函数、或与组件内部状态无耦合的逻辑，尽量放在组件外部文件作用域（或抽成独立 util），减少组件函数体的复杂度与重复定义

### 渐进式重构原则

- 新功能 / 新模块一律按本文档与 lint 配置实现；触达旧代码时遵循“小步、可回滚”的渐进式重构
- 触达历史代码时，遵循“小步、可回滚”的渐进式重构：在不影响交付节奏的前提下，顺手清理明显的坏味道（如重复逻辑、过深嵌套）
- 对于复杂的遗留逻辑，优先通过“旁路重写 + 灰度切换”的方式替代，而不是一次性大重构

### 样式编写 (NON-NEGOTIABLE)

**核心原则**（适用于所有通过模板创建的新项目）：

1. **禁止直接使用具体值（硬编码值）**：
   - ❌ 禁止在代码中直接使用硬编码的颜色值（如 `#1890ff`、`#999`）、间距值（如 `24px`、`16px`）、尺寸值（如 `220px`）
   - ✅ 必须使用 CSS 变量（如 `var(--primary-color)`、`var(--margin-lg)`）或 UnoCSS 类名（如 `text-primary`、`p-lg`、`m-md`）
   - ✅ 特殊场景允许：百分比值（如 `width: 100%`）、视口单位（如 `100vh`、`100vw`）、业务数据中的尺寸（如图片尺寸 `512x512`）

2. **优先使用 UnoCSS 类名**：
   - ✅ 常用样式（间距、颜色、字体大小、文本对齐等）优先直接在 JSX 中使用 UnoCSS 原子类名（如 `className="p-lg m-md text-primary text-center"`）
   - ✅ UnoCSS 类名直接在 JSX 的 `className` 属性中使用，无需在 `.module.css` 文件中定义
   - ✅ 通过项目的 UnoCSS 配置（如 `uno.config.ts`）扩展 `rules` / `shortcuts`，将全局 CSS 变量映射为 UnoCSS 类名

3. **CSS Modules 仅用于复杂样式**：
   - ✅ 仅在以下场景使用 `.module.css` 文件：动画、伪元素、复杂布局
   - ❌ 禁止在 `.module.css` 中重复定义可用 UnoCSS 类名实现的简单样式（如间距、颜色、字体大小）
   - ✅ `.module.css` 文件内部必须使用 CSS 变量（如 `color: var(--primary-color)`），禁止使用硬编码值

4. **CSS Modules 类名使用规范**（NON-NEGOTIABLE）：
   - ✅ **必须使用 `cx` 函数**：`import cx from './Component.module.css'` 和 `className={cx('class-name')}`
   - ❌ **禁止使用 `styles` 对象方式**：禁止 `import styles from './Component.module.css'` 和 `className={styles['class-name']}`
   - ✅ `cx` 函数的优势：语法简洁、支持条件类名和组合类名、支持对象形式、类型安全、与 classnames 库使用习惯一致

5. **CSS 变量统一管理**：
   - ✅ 所有 CSS 变量在全局样式文件中定义（如 `src/styles/variables.css` / `src/styles/global.less`，以项目实际为准）
   - ✅ 当现有 CSS 变量无法满足需求时，应在组件级 `.module.css` 中定义局部 CSS 变量，而非使用硬编码值
   - ✅ 使用 `calc()` 函数引用 CSS 变量进行动态计算

6. **第三方组件样式定制**：
   - ✅ 第三方组件（如 Ant Design、Ant Design Charts）的样式定制允许使用 `style` 属性
   - ✅ 但必须使用 CSS 变量（如 `style={{ color: 'var(--primary-color)' }}`），禁止使用硬编码值
   - ✅ 业务组件（项目自定义组件）禁止使用内联样式，必须使用 UnoCSS 类名或 CSS Modules

#### 项目默认实践（建议）

- 新代码优先用 **UnoCSS 原子类 + CSS Modules** 组合，避免新增全局 `.css`
- 如项目启用了 Less：仅在模板已集成且有明确边界时使用；不要为了图省事新增零散 Less 文件

**样式文件组织**：
- 组件样式：与组件文件同目录，统一使用 `.module.css`
- 全局样式：仅保留必要的 reset/variables，放在 `src/styles/` 目录
- 主题变量：通过 Less 变量（存量）或 CSS 变量定义

**使用示例**：

```typescript
// ✅ 正确：使用 UnoCSS 类名
<div className="p-lg m-md text-primary text-center">内容</div>

// ✅ 正确：使用 CSS Modules + cx 函数
import cx from './Component.module.css';
<div className={cx('card', 'card-mb')}>内容</div>

// ✅ 正确：第三方组件使用 style + CSS 变量
<Button style={{ color: 'var(--primary-color)' }}>按钮</Button>

// ❌ 错误：硬编码值
<div style={{ padding: '24px', color: '#1890ff' }}>内容</div>

// ❌ 错误：使用 styles 对象方式
import styles from './Component.module.css';
<div className={styles['card-mb']}>内容</div>

// ❌ 错误：业务组件使用内联样式
<div style={{ marginBottom: 24 }}>内容</div>
```

### 图标使用

项目图标方案（按选型二选一或组合）：

1. **@ant-design/icons**：Ant Design 官方图标库
   ```typescript
   import { UserOutlined, SettingOutlined } from '@ant-design/icons';
   ```

2. **react-icomoon**：自定义图标字体（如项目采用）
   - 建议通过 `IconFont` 组件封装使用（例如 `src/components/IconFont`）
   ```typescript
   import IconFont from '@/components/IconFont';

   <IconFont type="icon-name" />
   ```

**使用建议**：
- 优先使用 `@ant-design/icons` 中的图标
- 如需自定义图标，使用 `react-icomoon` 的 `IconFont` 组件
- 图标大小和颜色通过 props 或 className 控制

### HTTP 客户端请求

#### 使用示例

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

// 文件上传（FormData）
const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axiosInstance.post('/api/upload', formData);
  return response.data;
};
```

**类型化请求**：

建议为 API 响应定义 TypeScript 类型：

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

**错误处理**：

所有实例都配置了统一的错误处理拦截器，会自动处理常见错误。如需自定义错误处理：

```typescript
try {
  const response = await axiosInstance.get('/api/data');
} catch (error) {
  if (axios.isAxiosError(error)) {
    // 处理 Axios 错误
    console.error('请求失败:', error.message);
  }
}
```

