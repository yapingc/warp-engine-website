# AI 编码工具 — MCP 服务配置方式全景调研

> 最后更新: 2026-03-09
>
> 核心问题：用户首次安装 AI 编码工具后，如何为各工具配置 MCP 服务连接？本文档调研各工具的 MCP 配置文件位置、格式、支持的传输方式和配置方法。

---

## 一、为什么需要这份文档

### 1.1 冷启动问题

丹青约平台提供了 `install-mcp` 技能（Skill），可以通过对话自动完成 MCP 配置。但这存在一个**鸡生蛋的问题**：

```
用户刚装好 AI 工具
  → 没有 MCP 服务配置
  → AI 无法访问丹青约的 MCP 工具
  → 无法通过对话触发 install-mcp 技能
  → 死循环 ❌
```

因此，**首次 MCP 配置必须由用户手动完成**（复制粘贴一段 JSON 配置）。MCP 连通后，后续的 Skills 触发、功能安装等才能通过对话完成。

### 1.2 本文档的定位

```
首次配置（冷启动）        后续操作（热路径）
┌──────────────────┐     ┌──────────────────┐
│ 用户手动粘贴 JSON  │ ──→ │ AI 对话自动执行    │
│ （参考本文档）      │     │ install-mcp 技能  │
│                    │     │ 升级/修复/重装     │
└──────────────────┘     └──────────────────┘
```

- **本文档** → 解决冷启动问题，提供各工具的手动配置指南
- **`skills/install-mcp/SKILL.md`** → 解决热路径问题，MCP 连通后通过对话自动执行

---

## 二、MCP 传输方式简介

MCP (Model Context Protocol) 支持多种传输方式，目前丹青约支持以下两种：

| 传输方式 | 端点 | 特点 | 推荐场景 |
|---------|------|------|---------|
| **Streamable HTTP** | `https://mcp.danqing.app/mcp` | 无需本地安装，配置简单，双向通信，支持 session 恢复 | 绝大多数工具（推荐） |
| **stdio** | `npx -y @danqing/mcp-server` | 本地运行，需 Node.js，通过标准输入/输出通信 | Claude Desktop 等不支持远程连接的工具 |

> ⚠️ 旧版 SSE 端点 (`/sse`) 已废弃（MCP 2025-03-26），仅作为 fallback 保留。新配置请统一使用 Streamable HTTP (`/mcp`)。

---

## 三、各工具 MCP 配置详情

### 3.1 Cursor

**厂商**: Anysphere
**推荐传输方式**: Streamable HTTP

#### 配置文件位置

| 操作系统 | 路径 |
|---------|------|
| macOS / Linux | `~/.cursor/mcp.json` |
| Windows | `%USERPROFILE%\.cursor\mcp.json` |

> 💡 也可以在项目根目录创建 `.cursor/mcp.json`（项目级配置），仅对该项目生效。

#### 配置内容

```json
{
  "mcpServers": {
    "danqing": {
      "url": "https://mcp.danqing.app/mcp"
    }
  }
}
```

#### 配置步骤

1. 打开文件管理器，导航到上述路径
2. 如果 `mcp.json` 不存在，创建该文件；如果已存在，将 `danqing` 配置追加到 `mcpServers` 中
3. 重启 Cursor（或按 `Ctrl+Shift+P` → `Reload Window`）

#### 备选：GUI 配置

Cursor Settings → MCP → Add new MCP server：
- Name: `danqing`
- Type: `HTTP`
- URL: `https://mcp.danqing.app/mcp`

#### 验证

打开 Cursor 的 Agent 模式对话，输入"丹青约能用吗？"，如果 AI 能调用丹青约的工具，说明配置成功。

---

### 3.2 Claude Code

**厂商**: Anthropic
**推荐传输方式**: Streamable HTTP

#### 配置文件位置

| 操作系统 | 路径 |
|---------|------|
| macOS / Linux | `~/.claude.json` |
| Windows | `%USERPROFILE%\.claude.json` |

#### 配置内容

```json
{
  "mcpServers": {
    "danqing": {
      "url": "https://mcp.danqing.app/mcp"
    }
  }
}
```

#### 配置步骤

1. 打开终端，编辑 `~/.claude.json`（或 Windows 下 `%USERPROFILE%\.claude.json`）
2. 如果文件不存在，创建并写入上述完整 JSON
3. 如果文件已存在，将 `danqing` 配置追加到 `mcpServers` 对象中
4. Claude Code 会自动检测配置变更，通常无需重启

#### 备选：命令行配置

```bash
claude mcp add danqing --transport http --url https://mcp.danqing.app/mcp
```

#### 验证

在 Claude Code 中输入"列出可用的丹青约工具"，如果返回工具列表，说明配置成功。

---

### 3.3 Claude Desktop

**厂商**: Anthropic
**推荐传输方式**: stdio（Claude Desktop 对远程 HTTP 支持有限）

#### 配置文件位置

| 操作系统 | 路径 |
|---------|------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |

#### 配置内容

```json
{
  "mcpServers": {
    "danqing": {
      "command": "npx",
      "args": ["-y", "@danqing/mcp-server"]
    }
  }
}
```

> ⚠️ Claude Desktop 的 stdio 模式需要本机安装 Node.js (≥18)。如果没有安装，请先从 https://nodejs.org 下载安装。

#### 配置步骤

1. 打开 Claude Desktop → Settings (⚙️) → Developer → Edit Config
2. 或手动打开上述路径的 JSON 文件
3. 将 `danqing` 配置追加到 `mcpServers` 中
4. 完全退出并重新打开 Claude Desktop

#### 验证

在 Claude Desktop 中查看左侧工具列表是否出现丹青约相关工具。

---

### 3.4 Windsurf

**厂商**: Codeium
**推荐传输方式**: Streamable HTTP

#### 配置文件位置

| 操作系统 | 路径 |
|---------|------|
| macOS / Linux | `~/.codeium/windsurf/mcp_config.json` |
| Windows | `%USERPROFILE%\.codeium\windsurf\mcp_config.json` |

#### 配置内容

```json
{
  "mcpServers": {
    "danqing": {
      "url": "https://mcp.danqing.app/mcp"
    }
  }
}
```

#### 配置步骤

1. 打开文件管理器，导航到上述路径
2. 如果配置文件不存在，创建目录和文件
3. 将 `danqing` 配置追加到 `mcpServers` 中
4. 重启 Windsurf

#### 备选：GUI 配置

Windsurf Settings → Cascade → MCP → Add Server

#### 验证

在 Windsurf 的 Cascade 对话中输入"丹青约能用吗？"，如果 AI 能调用丹青约工具，说明配置成功。

---

### 3.5 Trae

**厂商**: ByteDance
**推荐传输方式**: Streamable HTTP

#### 配置文件位置

| 操作系统 | 路径 |
|---------|------|
| macOS / Linux | `~/.trae/mcp.json` |
| Windows | `%USERPROFILE%\.trae\mcp.json` |

#### 配置内容

```json
{
  "mcpServers": {
    "danqing": {
      "url": "https://mcp.danqing.app/mcp"
    }
  }
}
```

#### 配置步骤

1. 打开文件管理器，导航到上述路径
2. 如果 `mcp.json` 不存在，创建文件
3. 将 `danqing` 配置追加到 `mcpServers` 中
4. 重启 Trae

#### 备选：GUI 配置

Trae Settings → MCP Tools → 添加 MCP Server

#### 验证

在 Trae 的 Builder 模式对话中输入"丹青约能用吗？"

---

### 3.6 VS Code + Copilot

**厂商**: GitHub / Microsoft
**推荐传输方式**: Streamable HTTP

#### 配置文件位置

| 操作系统 | 路径 |
|---------|------|
| macOS / Linux | `~/.vscode/mcp.json` |
| Windows | `%USERPROFILE%\.vscode\mcp.json` |

> 💡 也可以放在项目级 `.vscode/mcp.json` 中。

#### 配置内容

VS Code Copilot 使用 `servers` 键名（非 `mcpServers`），且需要 `type` 字段：

```json
{
  "servers": {
    "danqing": {
      "type": "http",
      "url": "https://mcp.danqing.app/mcp"
    }
  }
}
```

> ⚠️ 注意 VS Code Copilot 的 MCP 配置格式与其他工具略有不同：使用 `servers` 而非 `mcpServers`，且需要 `type` 字段。

#### 配置步骤

1. 确保 VS Code 版本 ≥ 1.99（MCP 支持从此版本开始）
2. 确保已安装 GitHub Copilot 扩展
3. 打开上述路径的 `mcp.json` 文件（不存在则创建）
4. 写入配置内容
5. 重启 VS Code（或 `Ctrl+Shift+P` → `Reload Window`）

#### 备选：Settings 配置

VS Code Settings (`settings.json`) 中添加：

```json
{
  "github.copilot.chat.mcp.servers": {
    "danqing": {
      "type": "http",
      "url": "https://mcp.danqing.app/mcp"
    }
  }
}
```

#### 验证

在 VS Code 的 Copilot Chat 中使用 Agent 模式（`@`），查看是否出现丹青约相关工具。

---

### 3.7 Cline

**厂商**: 社区开源
**推荐传输方式**: Streamable HTTP

#### 配置方式

Cline 的 MCP 配置嵌入在 VS Code 的 `settings.json` 中：

| 操作系统 | 路径 |
|---------|------|
| macOS | `~/Library/Application Support/Code/User/settings.json` |
| Windows | `%APPDATA%\Code\User\settings.json` |
| Linux | `~/.config/Code/User/settings.json` |

#### 配置内容

在 `settings.json` 中追加：

```json
{
  "cline.mcpServers": {
    "danqing": {
      "url": "https://mcp.danqing.app/mcp"
    }
  }
}
```

#### 备选：GUI 配置

VS Code → Cline 扩展面板 → Settings (⚙️) → MCP Servers → Add Server

#### 配置步骤

1. 确保已安装 Cline 扩展（`saoudrizwan.claude-dev`）
2. 打开 VS Code Settings (`Ctrl+,`)，搜索 `cline.mcpServers`
3. 点击 "Edit in settings.json"
4. 追加上述配置
5. 重启 VS Code 或在 Cline 面板中点击 Refresh

#### 验证

在 Cline 对话中输入"丹青约能用吗？"

---

### 3.8 CodeMaker

**厂商**: 网易 (NetEase)
**推荐传输方式**: Streamable HTTP

> 参考: [CodeMaker MCP Server 配置文档](https://sa.nie.netease.com/docs/dep305/%E8%BF%90%E7%BB%B4%E6%94%AF%E6%92%91/CodeMaker/06-%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C/03-%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8D%97/02-Code%20Chat%20%E4%BB%A3%E7%A0%81%E6%99%BA%E8%83%BD%E6%93%8D%E4%BD%9C/03-%E4%BB%93%E5%BA%93%E6%99%BA%E8%81%8A/07-MCP%20Server.md)

#### 配置方式

CodeMaker 的 MCP 配置通过扩展内置的 **GUI 设置面板**管理，不使用独立的 JSON 配置文件。用户需要在面板中手动粘贴 JSON 配置。

#### 配置内容（供粘贴）

```json
{
  "danqing": {
    "url": "https://mcp.danqing.app/mcp",
    "headers": {
      "Authorization": "Bearer <你的API Key>"
    }
  }
}
```

#### 配置步骤

1. 打开 VS Code，确保已安装 CodeMaker 扩展
2. 打开命令面板 (`Ctrl+Shift+P`)
3. 搜索并执行 `CodeMaker: MCP Settings`
4. 在打开的 MCP 设置面板中，将上述 JSON 配置粘贴到对应位置
5. 保存并刷新

> ⚠️ CodeMaker 不支持通过对话指令自动安装 MCP 配置（配置由扩展 GUI 管理，非文件系统），但手动粘贴 JSON 的体验已经足够简单。

#### 验证

在 CodeMaker 的对话中输入"丹青约能用吗？"

---

## 四、总览对照表

| AI 工具 | 配置文件路径 (macOS/Linux) | 配置文件路径 (Windows) | 推荐传输方式 | 键名 | 配置后需重启 |
|---------|--------------------------|----------------------|-------------|------|------------|
| **Cursor** | `~/.cursor/mcp.json` | `%USERPROFILE%\.cursor\mcp.json` | Streamable HTTP | `mcpServers` | ⚠️ 需 Reload Window |
| **Claude Code** | `~/.claude.json` | `%USERPROFILE%\.claude.json` | Streamable HTTP | `mcpServers` | ❌ 自动检测，无需重启 |
| **Claude Desktop** | `~/Library/.../claude_desktop_config.json` | `%APPDATA%\Claude\claude_desktop_config.json` | stdio | `mcpServers` | ✅ 需完全退出并重新打开 |
| **Windsurf** | `~/.codeium/windsurf/mcp_config.json` | `%USERPROFILE%\.codeium\windsurf\mcp_config.json` | Streamable HTTP | `mcpServers` | ⚠️ 需 Reload Window |
| **Trae** | `~/.trae/mcp.json` | `%USERPROFILE%\.trae\mcp.json` | Streamable HTTP | `mcpServers` | ✅ 需重启应用 |
| **VS Code Copilot** | `~/.vscode/mcp.json` | `%USERPROFILE%\.vscode\mcp.json` | Streamable HTTP | `servers` ⚠️ | ⚠️ 需 Reload Window |
| **Cline** | VS Code `settings.json` | VS Code `settings.json` | Streamable HTTP | `cline.mcpServers` | ⚠️ 需 Reload Window 或面板 Refresh |
| **CodeMaker** | 扩展设置 GUI | 扩展设置 GUI | Streamable HTTP | — | ❌ 保存后立即生效 |

> 💡 **关于"重启"的说明**：
> - **❌ 无需重启**：Claude Code 和 CodeMaker 会自动检测配置变更，保存后立即生效
> - **⚠️ Reload Window**：Cursor、Windsurf、VS Code Copilot、Cline 不需要完全退出应用，只需按 `Ctrl+Shift+P` → `Developer: Reload Window` 即可生效
> - **✅ 需完全重启**：Claude Desktop 和 Trae 需要完全退出应用并重新打开
> - **通用建议**：如果不确定，直接重启 AI 工具即可，重启不会有副作用

---

## 五、MCP 服务重启与客户端重连

> 当远端 MCP 服务端发生重启（例如版本升级、滚动更新、故障恢复）时，客户端（AI 工具内置的 MCP Client）的行为取决于所使用的传输协议。

### 5.1 Streamable HTTP 模式（推荐）

Streamable HTTP 是丹青约推荐的远程传输方式，其核心优势之一就是**对服务端重启友好**：

| 场景 | 客户端行为 | 用户感知 |
|------|-----------|---------|
| **无状态模式**（服务端不返回 `Mcp-Session-Id`） | ✅ **完全无感** — 每次请求都是独立的 HTTP 请求，服务端重启对客户端透明 | 无需任何操作 |
| **有状态模式**（服务端返回了 `Mcp-Session-Id`） | ⚠️ **自动重连** — 服务端重启后 session 丢失，客户端收到 `HTTP 404`，MCP Client 应自动重新发送 `initialize` 请求 | 可能有短暂中断，但自动恢复 |

**有状态模式下的重连流程**：

```
服务端重启前：
  Client ──── POST /mcp (Mcp-Session-Id: abc123) ────▶ Server ✅ 正常响应

服务端重启后 session 丢失：
  Client ──── POST /mcp (Mcp-Session-Id: abc123) ────▶ Server
  Server ──── HTTP 404 (session not found) ────────────▶ Client

  Client 检测到 404，自动重新握手：
  Client ──── POST /mcp { method: "initialize" } ─────▶ Server
  Server ──── 200 + Mcp-Session-Id: xyz789 ───────────▶ Client ✅ 恢复正常
```

> 💡 **丹青约的设计建议**：MCP Gateway 应尽量设计为**无状态模式**（不返回 `Mcp-Session-Id`），这样服务端重启、扩缩容、滚动更新对客户端完全透明。如果确实需要有状态（如跟踪长时间运行的任务），建议将 session 状态存储在 Redis 等外部存储中。

### 5.2 stdio 模式

stdio 模式下 MCP Server 是在用户本地以子进程方式运行的，没有"远端服务重启"的概念。如果本地进程异常退出，AI 工具（如 Claude Desktop）通常会自动重启子进程。

### 5.3 Legacy SSE 模式（已废弃）

旧版 SSE 模式依赖长连接（Server-Sent Events），服务端重启会导致连接断开。与 Streamable HTTP 的对比：

| | Legacy SSE | Streamable HTTP |
|---|-----------|-----------------|
| 服务端重启后 | ❌ 长连接断开，需完全重连，部分工具可能需要用户手动 Reload | ✅ 无状态模式完全无感；有状态模式自动重新 initialize |
| 网络抖动 | ❌ 连接丢失，需重建 | ✅ 基于独立 HTTP 请求，天然容错 |
| 滚动更新 | ❌ 所有连接中断 | ✅ 请求级别，逐步切换 |

### 5.4 各工具在服务端重启后的表现

| AI 工具 | 传输方式 | 服务端重启后行为 | 用户操作 |
|---------|---------|-----------------|---------|
| **Claude Code** | Streamable HTTP | MCP Client 自动重连 | 无需操作 |
| **Cursor** | Streamable HTTP | MCP Client 自动重连；若长时间无响应可 Reload Window | 通常无需操作 |
| **Windsurf** | Streamable HTTP | 类似 Cursor | 通常无需操作 |
| **Trae** | Streamable HTTP | MCP Client 自动重连 | 通常无需操作 |
| **VS Code Copilot** | Streamable HTTP | MCP Client 自动重连 | 通常无需操作 |
| **CodeMaker** | Streamable HTTP | MCP Client 自动重连 | 通常无需操作 |
| **Claude Desktop** | stdio (本地) | 进程崩溃时自动重启子进程 | 无需操作 |
| **Cline** | Streamable HTTP | MCP Client 自动重连 | 通常无需操作 |

> ⚠️ **兜底建议**：如果遇到 MCP 连接异常且自动恢复失败，重启 AI 工具即可恢复连接。

---

## 六、通用注意事项

### 6.1 增量合并

如果你的配置文件中已有其他 MCP 服务的配置，**只需追加 `danqing` 键即可**，不要覆盖已有配置：

```json
{
  "mcpServers": {
    "existing-service": { "...": "..." },
    "danqing": {
      "url": "https://mcp.danqing.app/mcp"
    }
  }
}
```

### 6.2 配置后的后续操作

MCP 配置成功后，你就打通了"冷启动"关卡。后续的所有操作都可以通过自然语言对话完成：

```
MCP 配置完成（手动）
  ↓
"帮我安装沙箱环境"        → AI 执行 sandbox-setup 技能
"帮我创建一个作品集网站"    → AI 执行 init-project 技能
"升级 MCP 配置"            → AI 执行 install-mcp 技能（自动检测+升级）
```

### 6.3 故障排查

| 问题 | 可能原因 | 解决方案 |
|------|---------|---------|
| AI 没有调用丹青约工具 | 配置文件路径错误 | 确认文件路径与操作系统匹配 |
| 连接超时 | 网络问题 | 检查是否能访问 `https://mcp.danqing.app` |
| JSON 解析错误 | 配置文件格式损坏 | 用 JSON 校验器检查格式（注意逗号和引号） |
| 工具无 MCP 功能 | 版本过低 | 更新 AI 工具到最新版本 |
| stdio 模式报错 | 缺少 Node.js | 安装 Node.js ≥ 18 |

---

## 七、参考链接

| 资源 | 链接 |
|------|------|
| MCP 协议官方规范 | https://modelcontextprotocol.io |
| Cursor MCP 配置文档 | https://docs.cursor.com/context/model-context-protocol |
| Claude Code MCP 文档 | https://docs.anthropic.com/en/docs/claude-code/mcp |
| Claude Desktop MCP 配置 | https://modelcontextprotocol.io/quickstart/user |
| Windsurf MCP 文档 | https://docs.codeium.com/windsurf/mcp |
| VS Code MCP 支持 | https://code.visualstudio.com/docs/copilot/chat/mcp-servers |
| Cline MCP 配置 | https://github.com/cline/cline#mcp-servers |

---

## 八、与项目其他文档的关系

| 文档 | 用途 | 与本文档的关系 |
|------|------|--------------|
| `skills/install-mcp/SKILL.md` | AI 自动执行 MCP 安装/升级/重装 | 本文档解决冷启动，该 Skill 解决后续自动化 |
| `docs/research/ai-tools-rules-spec.md` | 各工具的编码规范配置文件调研 | 姊妹文档：Rules 是规范注入，本文档是 MCP 连接 |
| `docs/research/ai-tools-skill-recognition.md` | 各工具对 Skills 规范的支持调研 | 姊妹文档：Skills 需要 MCP 连通后才能被有效触发 |
| `docs/user-guides/artist-workflow.md` | 面向美术用户的入门指南 | 引用本文档作为首次配置的参考 |

