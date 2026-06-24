# Phase 1: 连接丹青约开发服务

## 检测运行环境并自动配置

根据当前 Agent 类型选择正确的配置文件和格式（用户无需了解这些细节）：

| Agent | 配置文件路径 | 格式说明 |
|-------|-------------|---------|
| Claude Code CLI | `~/.claude.json`（用户级）或 项目目录 `.mcp.json` | 标准格式 |
| Claude Desktop (Mac) | `~/Library/Application Support/Claude/claude_desktop_config.json` | 标准格式 |
| Claude Desktop (Win) | `%APPDATA%\Claude\claude_desktop_config.json` | 标准格式 |
| Cursor | 项目目录 `.cursor/mcp.json` | 标准格式 |
| Trae CN (Win) | `%APPDATA%\Trae CN\User\mcp.json` | 标准格式 |
| Trae CN (Mac) | `~/Library/Application Support/Trae CN/User/mcp.json` | 标准格式 |
| OpenClaw | 由 OpenClaw 平台自身声明的配置位置（不要写入 Claude Code 的默认路径） | 标准格式 |
| Codemaker | 项目配置文件 | streamableHttp 格式 |

> **重要**：安装前必须先判断当前 Agent 类型，将配置写入对应的正确位置。不同 Agent 的配置路径完全不同，写错位置会导致服务配置丢失。

## 配置内容（agent 内部使用，不展示给用户）

**标准格式**（Claude Code / Claude Desktop / Cursor 等）：
```json
{
  "mcpServers": {
    "danqing-develop-mcp": {
      "type": "http",
      "url": "http://10.219.250.96:8080/mcp",
      "headers": {
        "Authorization": "Bearer <用户提供的密钥>",
        "X-User-Email": "<用户提供的邮箱>"
      }
    }
  }
}
```

**Codemaker 格式**：
```json
{
  "mcpServers": {
    "danqing-develop-mcp": {
      "type": "streamableHttp",
      "url": "http://10.219.250.96:8080/mcp",
      "headers": {
        "Authorization": "Bearer <用户提供的密钥>",
        "X-User-Email": "<用户提供的邮箱>"
      },
      "timeout": 600,
      "autoApprove": false,
      "disabled": false
    }
  }
}
```

## Chrome 调试服务配置（默认安装）

Chrome 调试服务是丹青约开发的标配工具，**默认安装**，无需询问用户。将以下配置一并写入同一个配置文件：
```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["chrome-devtools-mcp@latest", "--isolated"]
    }
  }
}
```

## 安装引导流程

按以下顺序与用户对话：

1. **获取密钥**：向用户说明——
   > 我需要一个密钥来连接丹青约开发服务。请打开 https://ai.leihuo.netease.com/usercenter ，在页面上找到并复制您的密钥，然后发给我。
   >
   > 如果您没有雷火大模型网关的权限也没关系，可以直接把您当前使用的 AI 的 API Key 发给我，或者随便给我一串唯一的字符串也行——我只用它来识别您的身份，不会调用任何大模型服务。

2. **获取邮箱**：向用户说明——
   > 请告诉我您的完整公司邮箱地址（例如 zhangsan@corp.netease.com），我需要用它来关联您的开发身份。

   邮箱用于写入配置中的 `X-User-Email` header，服务端会将其与 API Key 绑定入库，同时在创建代码仓库时自动将该邮箱添加为项目成员。

3. **安装范围**：询问用户——
   > 您希望这个开发服务对所有项目都可用（推荐），还是只在当前项目中使用？

4. **自动安装页面调试工具**：无需询问用户，直接将 Chrome 调试服务配置写入（见上方"Chrome 调试服务配置"）。简要告知用户：
   > 我会同时为您安装页面调试工具，这样我可以直接看到您的页面效果、帮您检查问题。

5. **配置权限放行**：安装完成后，询问用户是否允许自动放行开发常用操作的权限，避免开发过程中被反复询问：

   > 开发过程中我会频繁执行命令、编辑文件、调试页面等操作。为了不打断您的体验，我可以设置为自动放行这些操作的权限（您随时可以改回来）。可以吗？

   - **用户同意** → 写入权限配置（见下方）
   - **用户拒绝** → 跳过此步骤

   **Claude Code**：在项目根目录创建或更新 `.claude/settings.json`，将开发常用工具加入 `permissions.allow`：
   ```json
   {
     "permissions": {
       "allow": [
         "Read(*)",
         "Write(*)",
         "Edit(*)",
         "Bash(*)",
         "Bash(git *)",
         "Bash(npm *)",
         "Bash(pnpm *)",
         "Bash(npx *)",
         "Bash(node *)",
         "mcp__chrome-devtools__*",
         "mcp__danqing-develop-mcp__*"
       ]
     }
   }
   ```
   如果文件已存在且已有 `permissions.allow` 数组，将上述条目逐一追加（不要覆盖已有条目，跳过已存在的条目）。

   **其他 Agent**（Cursor、Trae CN 等）：如果该 Agent 支持类似的权限白名单机制，同样配置；如果不支持，跳过此步骤。

6. **自动写入配置**：agent 自行完成所有配置文件写入（包括 Chrome 调试服务），不展示配置内容给用户
   - **OpenClaw 环境**：写入 OpenClaw 平台自身声明的 MCP 配置位置，**禁止写入 `~/.claude.json` 或 `.mcp.json`**（那是 Claude Code 的路径，OpenClaw 不会读取）
   - **全局配置**（所有项目可用）：写入 `~/.claude.json` 的顶层 `mcpServers` 字段，或写入 `~/.claude/.mcp.json`（两者均为合法路径，Claude Code 启动时都会读取）
   - **项目级配置**：写入项目根目录的 `.mcp.json`

7. **重启引导**：根据 Agent 类型给出具体操作——
   - Claude Code CLI：提示用户输入 `/quit` 退出后重新启动
   - Claude Desktop：提示用户关闭窗口后重新打开
   - Cursor：提示用户按 `Ctrl+Shift+P`（Mac 为 `Cmd+Shift+P`）搜索"Reload Window"并执行
   - Codemaker：提示用户刷新页面

8. **验证连接**：重启后自动检查服务是否连接成功。失败则排查原因（见下方常见问题）

9. **询问用户是否开始开发**：连接成功后，向用户确认——
   > 丹青约开发服务已连接成功！您现在想开始创建应用吗？如果您已有项目想要部署上线，也可以告诉我。

## 连接常见问题排查

| 用户看到的现象 | 内部原因 | 解决方式 |
|---|---|---|
| 重启后仍无法使用开发工具 | 没有正确重启 | 再次引导重启操作 |
| 提示配置错误 | 写错了配置文件位置 | 检查 Agent 类型是否判断正确，CLI 和 Desktop 的配置文件不同 |
| 提示连接失败 | 密钥错误或网络问题 | 请用户重新复制密钥；检查网络是否可达 |
| 权限不足无法写入 | 系统限制 | 告知用户"需要以管理员身份运行"并指导具体操作 |
