---
description: 自动扫描现有仓库，推断 Figma 构建约束并填充 fe-figma-gen 模板。
---


## 用户输入

```text
$ARGUMENTS
```

可通过参数限制扫描范围（例如 `--target apps/portal`、`--ui-lib=antd`）或声明已知信息（如特定目录别名），用于覆盖或补充自动分析结果。

## 目标

在不修改业务代码的前提下，根据仓库结构、依赖与已有文档，自动生成 `.specify/memory/fe-figma-gen.md`，为后续页面/组件生成命令提供默认约束。无法确定的项以 `未知：[原因]` 表示，便于后续通过向导补充。

## 操作约束

- 非破坏：仅写入 `.specify/memory/fe-figma-gen.md`。
- 幂等：重复运行会覆盖输出文件。
- 证据优先：所有结论需引用具体文件（绝对路径）或依赖；若缺乏证据必须标注未知。

## 执行步骤

1) **加载模板**
   - 确认 `.specify/templates/fe-figma-gen-template.md` 存在；缺少则报错："缺少模板：.specify/templates/fe-figma-gen-template.md"。

2) **收集上下文**
   - 若 `.specify/memory/fe-rule.md` 存在，解析其中的框架、UI 库、样式和目录约束作为初始默认值。
   - 识别 Monorepo：检查 `pnpm-workspace.yaml`、`turbo.json`、`nx.json` 等；确定工作区根目录、packages/apps 列表。
   - 根据用户输入解析 `--target`、`--ui-lib`、`--layout-dir` 等覆盖项。

3) **自动检测关键约束**
   - **框架 & UI 库**：检查 `package.json` 及目标工作区依赖，识别 Next.js、React Router、Ant Design、MUI、Chakra、shadcn/ui、Tailwind、CSS Modules 等。
   - **样式体系**：查找 `tailwind.config.*`、`postcss.config.*`、`global.css`、`styled-components`、`emotion` 等证据。
   - **色值 Token**：扫描 `tokens/`、`styles/`、`design-tokens/`、`theme/` 等目录下的颜色定义文件（如 `colors.ts`、`colors.json`、`_colors.scss`），确认命名空间、导出方式与引用模式。
   - **共享目录**：
     - 在 `packages/`、`libs/`、`src/components/`、`src/layouts/`、`src/ui/` 等目录中定位可能的共享组件与布局路径。
     - 针对 Next.js `app/` 结构，识别 `app/(.*)/layout.tsx`、`app/layout.tsx` 作为布局入口。
     - 若存在 Storybook 或设计系统包（例如 `packages/ui`、`packages/design-system`），将其记录为共享组件目录。
   - **本项目目录**：基于 `--target` 或默认应用目录，确定页面/模块组件存放位置（`app/`、`src/pages/`、`src/features/` 等）。
   - **命名与路径规则**：尝试从现有文件命名模式（如 `*.layout.tsx`、`*.view.tsx`、`*.test.tsx`）推断命名约定。

4) **构建模板内容**
   - 将检测到的信息映射到模板对应字段：
     - 未找到的项写 `未知：[原因或建议路径]`。
     - 多个候选路径时，标注优先级并提供理由（例如 "候选：packages/ui/src/components（依据 index.ts 导出）"）。
     - 公用色值文件需指明具体路径、导出对象或变量前缀，以及是否需要同步更新 Design Token 管道。
   - 保证所有路径使用基于 git 仓库根目录的相对路径。

5) **写入输出**
   - 将填充后的内容写入 `.specify/memory/fe-figma-gen.md`，覆盖已有文件。

6) **报告完成**
   - 输出关键发现摘要：框架/UI 库、共享布局/组件目录、公用色值 Token 来源、命名约定与潜在待补充项。
   - 提示用户如需人工补充，可运行 `/speckit.fe-figma-gen.wizard` 进行增补。
