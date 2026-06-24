# Figma 构建约束模板

仅填写本项目特有且后续需要代理遵循的约束；保持精炼，留空表示无要求。

## 技术栈与依赖

- **主要框架 / 运行时**：React 18 + React Router DOM 6，入口 `ConfigProvider`/`RouterProvider` 驱动（`packages/mainsite/src/App.tsx`），构建工具为 Vite 5（`packages/mainsite/vite.config.js`）。
- **第三方 UI 组件库**（含版本、使用方式）：`@fuxi/eevee-ui` 提供 `ConfigProvider` 与主题 token，`antd` 生态组件及 `@ant-design/icons`（`packages/mainsite/src/App.tsx`、`packages/mainsite/package.json`）。
- **样式体系**（如 Tailwind、CSS Modules、设计 Token 位置）：全局 Less 入口 `src/styles/index.less`，局部组件普遍采用 `*.module.less/.css`（示例 `packages/mainsite/src/components/AuthorTag/index.tsx`）。Ant Design 主题 token 定义在 `src/styles/antd-theme/{light,dark}.ts` 并通过 `antThemeToCssVars` 写入 CSS 变量。
- **状态 / 数据工具**（Zustand、TanStack Query 等）：Redux Toolkit store（`packages/mainsite/src/store/index.ts`）配合 `Provider` 注入，`jotai` 管理主题 atom（`packages/mainsite/src/App.tsx`），自研 hooks `@fuxi/eevee-hooks` 处理登录/请求（`packages/mainsite/src/layout/NewLayout/index.tsx`）。
- **不得引入的依赖或特殊注意**：未知：仓库未声明禁止依赖策略。

## Monorepo 与目录约定

- **Monorepo 工作区标识/路径**（如 `packages/ui`、`apps/portal`）：`pnpm-workspace.yaml` 匹配 `packages/**`，所有前端/服务子包位于该目录。
- **共享布局所在目录**（全局 Layout）：`packages/mainsite/src/layout`，其中 `index.tsx` 处理登录权限，`NewLayout/` 渲染全局框架（`packages/mainsite/src/layout/index.tsx`、`packages/mainsite/src/layout/NewLayout/index.tsx`）。
- **共享组件所在目录**（设计系统或 UI 库）：站点组件集中在 `packages/mainsite/src/components`，跨项目复用件位于 `packages/common` 并通过 `@common/*` 引用（见 `packages/mainsite/src/layout/index.tsx`）。
- **当前项目布局入口文件 / 目录**：`packages/mainsite/src/layout/index.tsx`（被 `packages/mainsite/src/router/index.tsx` 挂载）。
- **当前项目已有组件目录**（局部/页面级）：页面模块统一置于 `packages/mainsite/src/pages/<feature>` 并通过 `lazyRetry` 懒加载（`packages/mainsite/src/router/index.tsx`）。
- **公用色值 / Design Token 存放文件与命名约定**：Ant Design token 在 `packages/mainsite/src/styles/antd-theme/light.ts`、`dark.ts` 中导出 `LightTheme`/`DarkTheme`，基础主题色常量 `themePrimaryColors` 位于 `packages/mainsite/src/constants/color.ts` 并在 `ConfigProvider` 组件配置中复用（`packages/mainsite/src/App.tsx`）。
- **新建共享布局的存放路径与命名规则**：`packages/mainsite/src/layout/<LayoutName>/index.tsx(+index.module.less)`，再由 `src/layout/index.tsx` 引入，遵循 `NewLayout` 结构。
- **新建共享组件的存放路径与命名规则**：`packages/mainsite/src/components/<ComponentName>/index.tsx` + `index.module.less`，通过 `@/components/<ComponentName>` 引入。
- **新建页面/模块内部组件的存放路径与命名规则**：对应 `packages/mainsite/src/pages/<feature>/` 目录内创建文件/子目录，并在 `src/router/index.tsx` 中以 `lazyRetry(() => import('@/pages/<feature>'))` 注册。

## Figma 标注约定

- **布局标签约定**（仅生成页面时使用）：
  - `use-layout-internal` → 对应代码位置：未知：未从仓库文档获取。
  - `create-layout-share` → 新布局目标目录：未知：未从仓库文档获取。
  - `create-layout-nearby` → 插入位置说明：未知：未从仓库文档获取。
  - 其他自定义标签与含义：未知：缺少标注说明。
- **组件标签约定**：
  - `use-component-share-<name>` → 对应共享组件路径：未知：缺少标注说明。
  - `use-component-third-<package>` → 使用范围与限制：未知：缺少标注说明。
  - `create-component-share` → 新共享组件目录：未知：缺少标注说明。
  - `create-component-nearby` → 本地组件目录：未知：缺少标注说明。
  - 其他自定义标签与含义：未知：缺少标注说明。
- **标注书写规范补充**（隐藏 Text 节点命名、额外要求等）：未知：仓库未提供 Figma 标注规则。

## 其他约束

- **需要复用的现有页面 / 组件示例**：`packages/mainsite/src/layout/NewLayout/index.tsx` 复用 `SiderMenu`、`NewHeader`、`ContactBox`、`BrowserUpdateModal` 等，可作为统一交互参考。
- **需要同步修改的文档 / 测试目录或其他共享资源**：未知：未在仓库文档中发现额外要求。
- **提交前必须执行的脚本**：未知：README 未声明强制脚本，可依赖 `pnpm --filter mainsite run eslint/tsc` 自检。
- **开放问题 / 仍需澄清的项**：缺少 Figma 标签/目录映射文档；Design Token 若需同步其它系统需另行确认。

