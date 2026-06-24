---
description: 交互式收集项目的 Figma 构建约束并填充 fe-figma-gen 模板。
---


## 用户输入

```text
$ARGUMENTS
```

将用户输入视为默认偏好或已有答案（例如 "共享组件在 packages/ui/src/components"、"UI 库使用 Ant Design 5"）。

## 目标

引导用户填写 `.specify/templates/fe-figma-gen-template.md` 中仅与其项目相关的约束信息，并输出到 `.specify/memory/fe-figma-gen.md`，以供后续页面/组件构建命令使用。

## 操作约束

- 非破坏：除 `.specify/memory/fe-figma-gen.md` 外不写入其他文件。
- 幂等：重复运行会覆盖同一输出文件。
- 控制交互次数：最多询问 10 个问题，优先合并可选项。

## 执行步骤

1) **加载模板**
   - 确认 `.specify/templates/fe-figma-gen-template.md` 存在；缺失时输出错误："缺少模板：.specify/templates/fe-figma-gen-template.md"。

2) **解析默认上下文**
   - 读取 `.specify/memory/fe-rule.md`（若存在）以推断框架/样式等默认值。
   - 解析用户输入中的键值（形如 `key=...` 或自然语言描述），用于预填答案。

3) **收集答案**
   - 下面是所有的问题和提供的选项要求用户一个一个回答直到全部回答完毕，且允许用户自定义输入。
   - 问题建议：
     1. 主要框架 & UI 组件库（含版本）
     2. 样式体系 / Design Token 来源（至少指明公用色值文件路径与命名约定）
     3. Monorepo 工作区或包名
     4. 共享布局目录
     5. 共享组件目录
     6. 当前项目布局入口
     7. 当前项目已有组件目录
     8. 新建共享布局/组件的落盘路径与命名规则
     9. Figma 标注中布局 / 组件标签对应的代码位置
     10. 其他必须遵守的约束或禁止事项
   - 若信息充足，可跳过部分问题；对未知项在模板中写 `未知：待确认`。

4) **填充模板**
   - 将答案合成到模板的对应章节，确保共享色值/Design Token 字段包含路径、命名空间或导出变量说明。
   - 确保所有路径为绝对路径或可被 Monorepo 工作区解析的相对路径（必要时向用户确认）。

5) **写入输出**
   - 将完成的内容写入 `.specify/memory/fe-figma-gen.md`（覆盖写入）。

6) **报告完成**
   - 总结关键约束（UI 库、共享目录、公用色值 Token、标注规则、需强调的额外限制）。
   - 提醒用户后续可运行 `/speckit.fe-figma-gen.run` 执行页面/组件生成，用户也可以不生成
