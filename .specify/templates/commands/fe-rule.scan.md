---
description: 分析仓库并生成前端工程规则文档，并填充 fe-rule 模板。
---


## 用户输入

```text
$ARGUMENTS
```

在生成规则时，必须考虑用户输入（如果提供）作为额外的约束或偏好（例如，首选的 HTTP 客户端、状态库、CSS 方法）。

## 目标

基于当前仓库生成一份全面的前端工程规则文档，填充 `.specify/templates/fe-rule-template.md` 中定义的结构，并将最终输出写入 `.specify/memory/fe-rule.md`。

## 操作约束

- **非破坏性：** 不要修改应用程序代码。仅写入/更新 `.specify/memory/fe-rule.md` 处的文档文件。
- **幂等性：** 重新运行此命令应更新相同的输出文件，而不是创建重复项。
- **确定性：** 优先使用仓库中的证据而不是假设。如果无法确定某些内容，请明确说明"未知"并附上简要原因。
- **路径必须是绝对路径：** 在分析过程中内部引用文件时，路径必须是绝对路径。

## 执行步骤

### 1) 加载模板

- 加载 `.specify/templates/fe-rule-template.md`。
- 如果模板缺失，报错："缺少模板：.specify/templates/fe-rule-template.md" 并停止。

### 2) 仓库扫描（基于证据）

从文件和配置中收集具体信号。优先查看顶级文件，然后是应用特定文件夹。

- **包管理器：** 通过锁文件（`pnpm-lock.yaml`、`yarn.lock`、`package-lock.json`）和 `package.json` 中的 `packageManager` 字段检测。
- **框架/运行时：**
  - 检测框架：Next.js（`next` 依赖、`next.config.*`、`app/` 或 `pages/`）、Vite（`vite`）、Nuxt（`nuxt`）、CRA（`react-scripts`）、Astro、SvelteKit 等。
  - 检测运行时/平台提示：Node 版本、edge/runtime 配置。
- **UI/样式：**
  - CSS 框架：Tailwind（`tailwind.config.*`、`postcss.config.*`）、UnoCSS/WindiCSS。
  - CSS-in-JS：styled-components、Emotion、Stitches、Linaria、Vanilla Extract。
  - 组件库：Ant Design、MUI、Chakra、Mantine、Radix UI、shadcn/ui。
- **代码检查/格式化：**
  - ESLint（`eslint.*`、`package.json` 中的 `eslintConfig`）、Stylelint、Prettier（`prettier.*`）、Commitlint（`commitlint.*`）。
- **图标：**
  - 库如 `lucide-react`、`@heroicons/react`、`@ant-design/icons`、`react-icons`、`@iconify/react`。
- **HTTP/请求：**
  - `axios`、`ky`、`ofetch`、`@tanstack/query`、`swr` 或原生 `fetch` 包装器。
- **状态/数据：**
  - 全局状态：Redux Toolkit、Zustand、Jotai、Recoil、MobX、XState、Context API。
  - 服务器状态：TanStack Query、SWR。
- **单体仓库/结构：**
  - 检测单体仓库（例如 `pnpm-workspace.yaml`、`turbo.json`、`nx.json`）。
  - 总结关键包/应用和顶级目录职责。

### 3) 合成内容到模板部分

使用检测到的事实填充模板的每个部分。使用简洁、可操作的规则。对于未知内容，写"未知：[原因]"。

- **项目技术栈：** 框架、UI 库、样式系统、构建工具、测试库（如果检测到）。
- **代码结构：** 高级布局（应用/包）、主要文件夹用途、命名模式。
- **依赖相关：** 关键运行时依赖（框架、UI、HTTP、状态）和值得注意的开发依赖（检查/格式化/测试）。
- **包管理工具：** pnpm/yarn/npm 和工作区使用说明。
- **编码规范：** ESLint/Prettier 配置、提交约定、TypeScript 使用。
- **lint 配置：** ESLint 预设/插件、Stylelint（如果有）、Prettier 规则入口点。
- **样式编写：** Tailwind/CSS-in-JS/CSS 模块指南；文件组织。
- **图标使用：** 首选图标库、导入模式、大小/颜色约定。
- **Axios 请求：** 如果存在 axios，推荐基础实例、拦截器、错误处理、类型化。如果 axios 不存在，为检测到的客户端提供指导（例如 fetch + 包装器、ky、ofetch）使用类似的结构。
- **全局数据流管理：** 选择的状态库（Redux/Zustand/Jotai/Recoil 等）和存储组织、类型化、副作用的模式；如果存在服务器状态工具。

### 4) 写入输出

- 将填充的内容渲染为完整的 markdown 文档并写入 `.specify/memory/fe-rule.md`。
- 如果文件已存在，请完全替换其内容（不要追加）。保留模板部分的顺序和标题。

### 5) 报告完成

- **成功时，报告：** `成功：生成了 .specify/memory/fe-rule.md` 并包含检测到的技术栈和工具的简短要点摘要。
- **失败时（例如，缺少模板），** 报告错误并说明具体原因。

## 操作原则

- **证据优先：** 在断言规则时简要引用检测到的文件/配置（基于仓库根目录的相对路径、键）。
- **不要过度扩展：** 不要规定不存在的工具，除非用户明确在输入中要求；在最终的"建议"说明中提供可选建议。
- **清晰：** 优先选择简短、精确的规则而不是冗长的散文。
