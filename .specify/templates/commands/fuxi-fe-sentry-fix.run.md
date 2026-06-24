---
description: Sentry 问题分析与修复指令，通过 Sentry MCP 工具分析错误，定位问题代码，并提供修复方案和代码修改建议。
---

## 用户输入

```text
$ARGUMENTS
```

根据用户的输入，使用 Sentry MCP 工具分析 Sentry issue，定位问题代码，分析错误原因，并提供具体的修复方案和代码修改建议。

## 执行步骤

### 第一步：解析用户输入

根据用户输入，识别并提取以下信息：
- **Sentry Issue ID 或 URL**：用户提供的 Sentry issue ID（数字）或完整的 issue URL
- **项目标识**（可选）：如果用户提供了项目 slug，使用该值
- **修复范围**（可选）：用户是否指定了特定的文件或目录范围

如果用户未提供完整信息，询问用户补充：
- "请提供 Sentry issue ID 或完整的 issue URL"

### 第二步：获取 Issue 详情和堆栈跟踪

1. **获取 Issue 基本信息**
   - 使用 `mcp_sentry-selfhosted-mcp_get_sentry_issue` 获取 issue 详情
   - 参数：
     - `issue_id_or_url`: 用户提供的 issue ID 或 URL
     - `include_latest_event`: `true`
     - `max_stack_frames`: `50`

2. **提取堆栈跟踪**
   - 使用 `mcp_sentry-selfhosted-mcp_get_stack_frames` 获取结构化的堆栈跟踪
   - 参数：
     - `project_slug`: 从 issue 详情中获取
     - `event_id`: 从最新事件中获取
     - `in_app_only`: `true`（重点关注应用代码）
     - `max_frames`: `50`

3. **获取事件详情**
   - 使用 `mcp_sentry-selfhosted-mcp_get_sentry_event_details` 获取最新事件的详细信息
   - 重点关注异常信息、请求参数、用户上下文

### 第三步：定位问题代码

1. **分析堆栈跟踪**
   - 识别应用代码中的错误位置（`in_app: true`）
   - 提取错误发生的文件路径和行号
   - 分析调用链，理解错误的传播路径

2. **读取相关代码文件**
   - 根据堆栈跟踪中的文件路径，读取对应的源代码文件
   - 读取错误发生位置附近的代码（前后各 20-30 行）
   - 如果涉及多个文件，读取所有相关文件

3. **分析错误上下文**
   - 检查错误发生位置的代码逻辑
   - 分析可能导致错误的输入数据
   - 查看相关的类型定义和接口

### 第四步：分析错误原因

基于收集的信息，分析错误的根本原因：

1. **错误类型分析**
   - TypeError: 访问 undefined/null 的属性
   - ReferenceError: 引用不存在的变量
   - RangeError: 数组越界或数值超出范围
   - 其他类型错误

2. **数据流分析**
   - 追踪数据从请求到错误位置的传递路径
   - 识别数据验证缺失的位置
   - 检查边界条件处理

3. **代码逻辑分析**
   - 检查条件判断是否完整
   - 验证异步操作的错误处理
   - 检查类型转换和类型检查

### 第五步：制定修复方案

1. **确定修复策略**
   - 防御性编程：添加空值检查和默认值
   - 数据验证：在数据入口处添加验证
   - 错误处理：添加 try-catch 或错误边界
   - 类型安全：改进类型定义和类型检查

2. **设计修复代码**
   - 编写修复后的代码片段
   - 确保修复不会引入新的问题
   - 考虑向后兼容性

3. **识别相关修改点**
   - 如果问题涉及多个文件，列出所有需要修改的位置
   - 如果问题涉及类型定义，更新类型文件
   - 如果问题涉及测试，更新或添加测试用例

### 第六步：实施修复

1. **修改代码文件**
   - 根据修复方案修改源代码
   - 使用 `search_replace` 工具进行精确修改
   - 保持代码风格一致性

2. **添加必要的注释**
   - 在修复位置添加注释说明修复原因
   - 如果涉及复杂逻辑，添加详细说明

3. **更新相关文件**
   - 如果修改了类型定义，更新类型文件
   - 如果修改了接口，更新相关文档

### 第七步：验证修复

1. **代码检查**
   - 运行 linter 检查代码质量
   - 确保没有引入语法错误
   - 检查类型错误

2. **逻辑验证**
   - 验证修复后的代码逻辑正确性
   - 确保边界条件得到正确处理
   - 检查是否覆盖了所有相关场景

3. **生成修复说明**
   - 总结修复内容
   - 说明修复的原因和方法
   - 提供测试建议

### 第八步：更新 Sentry Issue 状态（可选）

如果用户要求更新 Sentry issue 状态：

1. **添加注释**
   - 使用 `mcp_sentry-selfhosted-mcp_create_sentry_issue_comment` 添加修复说明
   - 包含修复的代码位置和修复方法

2. **更新状态**
   - 使用 `mcp_sentry-selfhosted-mcp_update_sentry_issue_status` 将状态更新为 `resolved`
   - 或根据实际情况设置为其他状态

### 第九步：输出修复报告

展示完整的分析和修复结果：

```
✅ Sentry Issue 分析与修复完成

📋 Issue 基本信息：
  - Issue ID: {issue_id}
  - 标题: {title}
  - 状态: {status}
  - 项目: {project_slug}

❌ 错误分析：
  - 错误类型: {error_type}
  - 错误位置: {file}:{line}
  - 错误原因: {root_cause}

🔍 问题定位：
  - 问题文件: {file_path}
  - 问题代码:
    {显示问题代码片段}
  - 问题分析: {详细分析}

💡 修复方案：
  - 修复策略: {fix_strategy}
  - 修复方法: {fix_method}
  - 修复代码:
    {显示修复后的代码片段}

📝 修改内容：
  - 修改文件: {modified_files}
  - 修改说明: {modification_details}

✅ 修复验证：
  - 代码检查: 通过
  - 逻辑验证: 通过
  - 测试建议: {test_suggestions}

📌 Sentry 状态：
  - Issue 状态: {updated_status}
  - 已添加注释: {comment_added}
```

## 错误处理

1. **代码文件不存在**
   - 检查文件路径是否正确
   - 如果文件已移动或删除，提示用户
   - 询问是否需要创建新文件或更新路径

2. **无法定位问题代码**
   - 使用更详细的堆栈跟踪信息
   - 检查 source map 配置
   - 询问用户提供更多上下文信息

3. **修复方案不明确**
   - 提供多个可能的修复方案
   - 询问用户偏好
   - 建议添加更完善的错误处理

4. **代码修改失败**
   - 检查文件权限
   - 验证修改的代码片段是否匹配
   - 提供手动修改的建议

## 注意事项

1. **代码修改原则**
   - 最小化修改范围，只修改必要的部分
   - 保持代码风格一致性
   - 不破坏现有功能

2. **错误处理策略**
   - 优先使用防御性编程
   - 添加适当的错误提示
   - 考虑用户体验

3. **类型安全**
   - 充分利用 TypeScript 类型系统
   - 添加必要的类型检查
   - 更新类型定义

4. **测试覆盖**
   - 建议添加或更新测试用例
   - 覆盖错误场景和边界条件
   - 确保修复不会引入回归

5. **向后兼容**
   - 确保修复不会破坏现有功能
   - 考虑 API 变更的影响
   - 必要时添加兼容性处理

## 修复示例

### 示例 1: TypeError - 访问 undefined 属性

**问题代码：**
```typescript
const userName = user.profile.name;
```

**修复后：**
```typescript
const userName = user?.profile?.name ?? 'Unknown';
```

### 示例 2: 数组越界

**问题代码：**
```typescript
const firstItem = items[0].value;
```

**修复后：**
```typescript
const firstItem = items.length > 0 ? items[0].value : null;
```

### 示例 3: 异步操作错误处理

**问题代码：**
```typescript
const data = await fetchData();
processData(data);
```

**修复后：**
```typescript
try {
  const data = await fetchData();
  if (data) {
    processData(data);
  }
} catch (error) {
  console.error('Failed to fetch data:', error);
  // 处理错误情况
}
```

