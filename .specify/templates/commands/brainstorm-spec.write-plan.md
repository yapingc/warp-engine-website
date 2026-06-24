---
description: 将确定的方案转为可执行实现计划，含精确路径、步骤与命令。
---

## 用户输入

```text
$ARGUMENTS
```

可用于指定沟通语言（默认中文）与补充上下文（功能名称、技术栈等）。

## 目标

产出一份对零上下文工程师也可执行的计划：明确文件路径、完整代码片段、验证命令与预期结果，每个步骤 2-5 分钟可完成。计划文件保存到 `docs/plans/YYYY-MM-DD-<feature-name>.md`。

## 执行步骤

1) **开场与语言**
   - 宣告："I'm creating the implementation plan."
   - 沟通语言遵循传入语言；缺省使用中文。

2) **计划头部**
   - 计划开头必须包含：
     ```markdown
     # [Feature Name] Implementation Plan

     **Goal:** [One sentence describing what this builds]

     **Architecture:** [2-3 sentences about approach]

     **Tech Stack:** [Key technologies/libraries]

     ---
     ```

3) **任务划分（Bite-size）**
   - 每个 Task 仅一个组件或子目标。
   - 指定 Files 区域：明确创建/修改/测试文件的精确路径（必要时附行号范围）。
   - 步骤示例（需根据任务替换为实情，但保持粒度与完整性）：
     - 写失败用例（含完整代码片段）。
     - 运行指定测试命令，记录预期失败原因。
     - 编写最小实现代码片段。
     - 再次运行测试，预期 PASS。
   - 所有命令必须写明预期输出/结果。

4) **DRY 与 YAGNI**
   - 复用公共说明，避免重复；去掉无用环节。
   - 不写“补充验证”这类笼统表述，必须给出具体命令和预期。

5) **落盘路径**
   - 文件名采用 `docs/plans/YYYY-MM-DD-<feature-name>.md`。
   - 若有同名冲突，按项目约定处理（如手动调整 feature-name）。

## 注意事项

- 假设执行者对代码库和领域几乎零背景，但具备工程能力。
- 精确文件路径、命令、代码示例缺一不可；禁止用“待定”“N/A”占位。
- 计划只描述步骤，不直接修改代码。
