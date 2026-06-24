# Figma 构建约束模板

仅填写本项目特有且后续需要代理遵循的约束；保持精炼，留空表示无要求。

## 技术栈与依赖

- **主要框架 / 运行时**：
- **第三方 UI 组件库**（含版本、使用方式）：
- **样式体系**（如 Tailwind、CSS Modules、设计 Token 位置）：
- **状态 / 数据工具**（Zustand、TanStack Query 等）：
- **不得引入的依赖或特殊注意**：

## Monorepo 与目录约定

- **Monorepo 工作区标识/路径**（如 `packages/ui`、`apps/portal`）：
- **共享布局所在目录**（全局 Layout）：
- **共享组件所在目录**（设计系统或 UI 库）：
- **当前项目布局入口文件 / 目录**：
- **当前项目已有组件目录**（局部/页面级）：
- **公用色值 / Design Token 存放文件与命名约定**（如 `styles/tokens/colors.ts`、`design-tokens/colors.json`，需说明命名空间或导出方式）：
- **新建共享布局的存放路径与命名规则**：
- **新建共享组件的存放路径与命名规则**：
- **新建页面/模块内部组件的存放路径与命名规则**：

## Figma 标注约定

- **布局标签约定**（仅生成页面时使用）：
  - `use-layout-internal` → 对应代码位置：
  - `create-layout-share` → 新布局目标目录：
  - `create-layout-nearby` → 插入位置说明：
  - 其他自定义标签与含义：
- **组件标签约定**：
  - `use-component-share-<name>` → 对应共享组件路径：
  - `use-component-third-<package>` → 使用范围与限制：
  - `create-component-share` → 新共享组件目录：
  - `create-component-nearby` → 本地组件目录：
  - 其他自定义标签与含义：
- **标注书写规范补充**（隐藏 Text 节点命名、额外要求等）：

## 其他约束

- **需要复用的现有页面 / 组件示例**：
- **需要同步修改的文档 / 测试目录或其他共享资源**：
- **提交前必须执行的脚本**：
- **开放问题 / 仍需澄清的项**：
