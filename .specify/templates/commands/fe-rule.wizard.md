---
description: 交互式向导，帮助用户为新项目完成 fe-rule-template。
---


## 用户输入

```text
$ARGUMENTS
```

将用户输入（如果有）视为初始偏好。示例："Next.js + Tailwind + shadcn + Zustand + axios + pnpm"。

## 目标

引导用户完成 `.specify/templates/fe-rule-template.md` 并在 `.specify/memory/fe-rule.md` 生成最终的规则文档，供后续命令使用（例如 `/speckit.fe-rule.run`）。

## 操作约束

- 非破坏性：不修改应用程序代码。
- 最小写入：仅写入 `.specify/memory/fe-rule.md`（保持模板完整）。
- 确定性：询问有限的问题集；当用户未决定时使用合理的默认选择。

## 执行步骤

1) 加载模板

- 确保 `.specify/templates/fe-rule-template.md` 存在。
- 如果缺失：错误 "缺少模板：.specify/templates/fe-rule-template.md"。

2) 收集选择（最多询问 10 个问题）

下面是所有的问题和提供的选项要求用户一个一个回答直到全部回答完毕，且允许用户自定义输入。

Q1. 包管理器：A) pnpm（默认）B) yarn C) npm

Q2. 框架：A) Next.js（默认）B) Vite + React C) Nuxt D) Astro E) SvelteKit

Q3. 样式：A) Tailwind CSS（默认）B) CSS Modules C) styled-components D) Emotion E) Vanilla Extract

Q4. UI 组件：A) shadcn/ui (+ Radix)（React 默认）B) Ant Design C) MUI D) Chakra E) 无

Q5. 图标：A) lucide-react（默认）B) @heroicons/react C) @ant-design/icons D) react-icons E) 无

Q6. HTTP 客户端：A) axios（默认）B) fetch + 轻量包装器 C) ky D) ofetch

Q7. 全局状态：A) Zustand（默认）B) Redux Toolkit C) Jotai D) Recoil E) 仅 Context

Q8. 服务器状态：A) TanStack Query（默认）B) SWR C) 无

Q9. 代码结构：A) 功能优先（默认）B) 分层优先 C) 简单 src/app

Q10. 代码检查/格式化/提交：A) ESLint + Prettier + Commitlint（默认）B) ESLint + Prettier C) 无

3) 综合规则

- 将答案合并到模板结构中，用简洁、可操作的规则替换每个部分。
- 如果某部分不适用，省略它（不要留"N/A"）。
- 如果未知，写：`未知：[原因]`。

4) 写入输出

- 将完成的内容写入 `.specify/memory/fe-rule.md`（如果存在则覆盖）。

5) 呈现摘要

- 显示所选技术栈的简短要点摘要（框架、样式、UI、HTTP、状态、包管理器）。
- 确认完成："前端工程规则已配置并保存至 `.specify/memory/fe-rule.md`"

## 格式规则

- 保留模板中的标题。
- 优先使用简短的命令式规则而非散文。
- 命名库时，包含有用的导入模式。
