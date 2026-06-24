---
description: Sentry 问题分析指令，通过 Sentry MCP 工具获取 Sentry issue 详情、堆栈跟踪、事件信息等，帮助开发者快速定位和了解错误原因。
---

## 用户输入

```text
$ARGUMENTS
```

根据用户的输入，使用 Sentry MCP 工具分析 Sentry issue，获取详细的错误信息、堆栈跟踪和相关上下文。

## 执行步骤

### 第一步：解析用户输入

根据用户输入，识别并提取以下信息：
- **Sentry Issue ID 或 URL**：用户提供的 Sentry issue ID（数字）或完整的 issue URL
- **项目标识**（可选）：如果用户提供了项目 slug，使用该值；否则需要从 issue 信息中获取

如果用户未提供完整信息，询问用户补充：
- "请提供 Sentry issue ID 或完整的 issue URL"

### 第二步：获取 Issue 详情

1. **调用 Sentry MCP 获取 Issue 信息**
   - 使用 `mcp_sentry-selfhosted-mcp_get_sentry_issue` 获取 issue 详情
   - 参数：
     - `issue_id_or_url`: 用户提供的 issue ID 或 URL
     - `include_latest_event`: `true`（包含最新事件详情）
     - `include_fields`: 可选，根据需要包含特定字段
     - `max_stack_frames`: `50`（限制堆栈帧数量）

2. **提取关键信息**
   - Issue ID
   - Issue 标题
   - Issue 状态（resolved/unresolved/ignored）
   - 项目 slug
   - 首次出现时间
   - 最后出现时间
   - 事件数量
   - 受影响用户数

### 第三步：获取堆栈跟踪信息

1. **提取堆栈帧**
   - 使用 `mcp_sentry-selfhosted-mcp_get_stack_frames` 获取结构化的堆栈跟踪
   - 参数：
     - `project_slug`: 从 issue 详情中获取的项目 slug
     - `event_id`: 从最新事件中获取的 event ID
     - `in_app_only`: `false`（包含所有帧，包括系统库）
     - `max_frames`: `50`

2. **分析堆栈跟踪**
   - 识别应用代码中的错误位置（`in_app: true`）
   - 标记系统库和第三方库的调用
   - 找出错误的调用链

### 第四步：获取最新事件详情

1. **获取事件详细信息**
   - 使用 `mcp_sentry-selfhosted-mcp_get_sentry_event_details` 获取最新事件的详细信息
   - 参数：
     - `project_slug`: 项目 slug
     - `event_id`: 最新事件的 event ID
     - `limit`: `10`（限制返回的条目数量）
     - `entry_type`: 根据需要过滤（如 'exception', 'breadcrumbs', 'request'）

2. **提取关键信息**
   - 异常类型和消息
   - 用户操作路径（breadcrumbs）
   - 请求信息（URL、方法、headers、body）
   - 用户上下文信息
   - 设备/浏览器信息

### 第五步：检查调试符号状态（如适用）

如果是 iOS/macOS 项目：

1. **检查 dSYM 状态**
   - 使用 `mcp_sentry-selfhosted-mcp_check_dsym_status` 检查调试符号
   - 参数：
     - `project_slug`: 项目 slug
     - `event_id`: 可选，特定事件的 event ID

2. **报告缺失的符号**
   - 如果缺少 dSYM 文件，提醒用户上传

### 第六步：生成分析报告

整理并展示完整的分析结果：

```
🔍 Sentry Issue 分析报告

📋 Issue 基本信息：
  - Issue ID: {issue_id}
  - 标题: {title}
  - 状态: {status}
  - 项目: {project_slug}
  - 首次出现: {first_seen}
  - 最后出现: {last_seen}
  - 事件数: {count}
  - 受影响用户: {user_count}

❌ 错误信息：
  - 异常类型: {exception_type}
  - 错误消息: {error_message}
  - 错误位置: {file}:{line}

📚 堆栈跟踪：
{显示堆栈跟踪，重点标记应用代码中的错误位置}

🔗 调用链：
{显示从用户操作到错误的完整调用链}

🌐 请求信息（如适用）：
  - URL: {url}
  - 方法: {method}
  - Headers: {headers}
  - Body: {body}

👤 用户上下文：
  - User ID: {user_id}
  - IP: {ip}
  - User Agent: {user_agent}
  - 设备信息: {device_info}

📝 用户操作路径（Breadcrumbs）：
{显示用户操作的时间线}

⚠️ 调试符号状态：
{如果缺少 dSYM，显示警告信息}

💡 分析建议：
  - 错误可能的原因分析
  - 建议的修复方向
  - 相关代码位置提示
```

## 错误处理

1. **Issue ID 无效**
   - 提示用户检查 issue ID 或 URL 是否正确
   - 询问用户是否要列出项目中的所有 issues

2. **项目不存在**
   - 使用 `mcp_sentry-selfhosted-mcp_list_sentry_projects` 列出所有可用项目
   - 让用户选择正确的项目

3. **事件信息获取失败**
   - 尝试使用 `mcp_sentry-selfhosted-mcp_raw_sentry_api` 作为备选方案
   - 使用 `grep_pattern` 参数过滤响应内容

4. **网络或权限问题**
   - 检查 Sentry 服务器连接状态
   - 验证 API token 权限

## 注意事项

1. **数据量控制**
   - 对于大型事件，始终使用 `limit` 参数限制返回的数据量
   - 使用 `grep_pattern` 过滤不需要的信息

2. **堆栈跟踪分析**
   - 重点关注 `in_app: true` 的帧，这些是应用代码中的错误
   - 系统库的帧通常只提供上下文信息

3. **Breadcrumbs 分析**
   - Breadcrumbs 显示用户操作的时间线，有助于重现错误
   - 关注错误发生前的最后几个操作

4. **请求信息**
   - 检查请求参数和 headers，可能包含导致错误的输入
   - 注意敏感信息（如 token）的脱敏处理

5. **调试符号**
   - iOS/macOS 项目需要上传 dSYM 文件才能看到完整的堆栈跟踪
   - 缺少符号时，堆栈跟踪会显示内存地址而非函数名

## 输出示例

```
🔍 Sentry Issue 分析报告

📋 Issue 基本信息：
  - Issue ID: 123456
  - 标题: TypeError: Cannot read property 'name' of undefined
  - 状态: unresolved
  - 项目: my-web-app
  - 首次出现: 2024-01-15 10:30:00
  - 最后出现: 2024-01-15 14:20:00
  - 事件数: 42
  - 受影响用户: 15

❌ 错误信息：
  - 异常类型: TypeError
  - 错误消息: Cannot read property 'name' of undefined
  - 错误位置: src/components/UserProfile.tsx:45

📚 堆栈跟踪：
  at UserProfile.render (src/components/UserProfile.tsx:45:12) ⭐ 应用代码
  at React.createElement (node_modules/react/index.js:...)
  at Dashboard.render (src/pages/Dashboard.tsx:23:8) ⭐ 应用代码
  ...

💡 分析建议：
  - 错误发生在 UserProfile 组件中，尝试访问 undefined 对象的 'name' 属性
  - 建议检查 props 传递和默认值处理
  - 相关文件: src/components/UserProfile.tsx:45
```

