# AI 编码工具 — 编码规范配置文件全景调研

> 最后更新: 2026-03-17
>
> 覆盖市面上所有主流 AI 编码助手 / Agent 的自定义规则（Custom Rules / Instructions）机制，以及 Hooks（事件驱动自动化）和 CLI vs MCP 工具集成范式。

---

## 一、总览对照表

| AI 工具 | 项目级规则文件 | 全局级规则文件 | 格式 | 自动加载 | 拆分支持 | Hooks |
|---------|--------------|--------------|------|---------|---------|:---:|
| **Cursor** | `.cursorrules` | Settings → Rules | Markdown | ✅ | ✅ `.cursor/rules/*.mdc` | ❌ |
| **Claude Code** | `CLAUDE.md` | `~/.claude/CLAUDE.md` | Markdown | ✅ | ✅ `.claude/rules/*.md` | ✅ 完整 |
| **GitHub Copilot** | `.github/copilot-instructions.md` | VS Code Settings | Markdown | ✅ | ✅ 多文件 + `applyTo` | ❌ |
| **Windsurf (Codeium)** | `.windsurfrules` | Cascade → Global Rules | Markdown | ✅ | ❌ | ❌ |
| **Trae (ByteDance)** | `.trae/rules/*.md` | 设置 → AI Rules | Markdown | ✅ | ✅ 多文件 | ❌ |
| **Cline** | `.clinerules` | 扩展设置 | Markdown | ✅ | ❌ | ❌ |
| **Roo Code** | `.roo/rules/*.md` | 扩展设置 | Markdown | ✅ | ✅ 按模式拆分 | ❌ |
| **Aider** | `.aider.conf.yml` 中 `read` 字段 | `~/.aider.conf.yml` | YAML + Markdown | ⚠️ 半自动 | ❌ | ❌ |
| **Continue** | `.continue/rules/*.yaml` | `~/.continue/config.yaml` | YAML | ✅ | ✅ 多文件 | ❌ |
| **Amazon Q Developer** | — | IDE 设置 | 自然语言 | ✅ | ❌ | ❌ |
| **Tabnine** | — | Team Settings (Web) | 自然语言 | ✅ | ❌ | ❌ |
| **JetBrains AI** | `.junie/guidelines.md` | Settings → AI | Markdown | ✅ | ❌ | ❌ |
| **Augment Code** | `augment-guidelines.md` | — | Markdown | ✅ | ❌ | ❌ |
| **Zed AI** | `.rules` | — | Markdown | ✅ | ❌ | ❌ |
| **Void** | `.void/rules/*.md` | Settings → Rules | Markdown | ✅ | ✅ 多文件 | ❌ |
| **OpenHands** | `.openhands/microagents/*.md` | — | Markdown + Frontmatter | ✅ | ✅ 多 Agent | ❌ |
| **Devin** | `devin.md` | — | Markdown | ✅ | ❌ | ❌ |
| **Codex (OpenAI CLI)** | `AGENTS.md` | `~/.codex/instructions.md` | Markdown | ✅ | ✅ 子目录递归 | ❌ |
| **CodeMaker (NetEase)** | `.codemaker/rules/*.mdc` | 团队Rules（DevCloud） | Markdown + Frontmatter | ✅ | ✅ 多文件 + `globs` | ❌ |
| **Kiro (AWS)** | steering files | — | — | ✅ | — | ✅ 事件驱动 |

---

## 二、各工具详细说明

---

### 2.1 Cursor

**厂商**: Anysphere
**类型**: IDE（VS Code Fork）

#### 规则文件位置

| 层级 | 路径 | 说明 |
|------|------|------|
| 项目级（传统） | `<root>/.cursorrules` | 单文件，打开项目自动加载 |
| 项目级（推荐） | `<root>/.cursor/rules/*.mdc` | 多文件拆分，精细控制 |
| 全局级 | Cursor Settings → General → Rules for AI | 所有项目生效 |

#### `.cursorrules` 格式

纯 Markdown，无特殊语法要求，直接写规范内容即可：

```markdown
# 项目编码规范

## 技术栈
- TypeScript + React
- 使用 pnpm 作为包管理器

## 代码风格
- 使用函数式组件
- 禁止使用 any 类型
```

#### `.cursor/rules/*.mdc` 格式（推荐）

使用 Frontmatter 元数据控制规则的作用范围：

```markdown
---
description: React 组件编写规范
globs: ["src/components/**/*.tsx"]
alwaysApply: false
---

# React 组件规范

- 使用函数式组件 + Hooks
- Props 必须定义 interface
- 文件名使用 PascalCase
```

**Frontmatter 字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `description` | string | 规则描述，AI 据此判断是否引用 |
| `globs` | string[] | 文件匹配模式，仅匹配文件触发时加载 |
| `alwaysApply` | boolean | `true` = 每次对话都加载；`false` = AI 按需引用 |

**加载优先级**: `alwaysApply: true` 的 `.mdc` 文件 → 匹配 `globs` 的 `.mdc` 文件 → `.cursorrules` → 全局 Rules

---

### 2.2 Claude Code (Anthropic)

**厂商**: Anthropic
**类型**: CLI Agent / IDE 扩展

#### 规则文件位置

| 层级 | 路径 | 说明 |
|------|------|------|
| 项目级摘要 | `<root>/CLAUDE.md` | 项目打开时自动加载，放核心规范 |
| 项目级详细 | `<root>/.claude/rules/*.md` | 按主题拆分的详细规范，也自动加载 |
| 用户全局 | `~/.claude/CLAUDE.md` | 用户个人偏好，所有项目生效 |
| 用户全局拆分 | `~/.claude/rules/*.md` | 全局级的拆分规范 |

#### `CLAUDE.md` 格式

纯 Markdown，无特殊语法。Claude Code 在启动时自动读取项目根目录下的 `CLAUDE.md`：

```markdown
# 项目规范

## 概述
这是一个 TypeScript + Next.js 项目。

## 代码风格
- 使用 ESLint + Prettier
- 缩进 2 空格
- 使用 named export

## 禁止事项
- 不要使用 `var`
- 不要使用 `console.log` 调试
```

#### `.claude/rules/*.md` 格式

支持 Frontmatter 元数据（可选）：

```markdown
---
description: API 路由编写规范
globs: ["src/app/api/**/*.ts"]
---

# API 路由规范

- 所有 API 路由使用 App Router 格式
- 必须做输入验证（使用 zod）
- 错误返回统一格式 { error, code, message }
```

**Frontmatter 字段**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `description` | string | 规则描述 |
| `globs` | string[] | 仅当操作匹配文件时加载此规则 |

若无 Frontmatter，则该规则文件始终加载。

#### 子目录 CLAUDE.md

Claude Code 也支持在子目录放置 `CLAUDE.md`，当 AI 处理该子目录下的文件时自动加载：

```
project/
├── CLAUDE.md              # 项目级
├── packages/
│   ├── frontend/
│   │   └── CLAUDE.md      # 前端子项目特有规范
│   └── backend/
│       └── CLAUDE.md      # 后端子项目特有规范
```

---

### 2.3 GitHub Copilot

**厂商**: GitHub / Microsoft
**类型**: IDE 扩展 + Agent

#### 规则文件位置

| 层级 | 路径 | 说明 |
|------|------|------|
| 项目级（传统） | `<root>/.github/copilot-instructions.md` | 单文件，自动加载 |
| 项目级（推荐） | `<root>/.github/instructions/*.instructions.md` | 多文件拆分，支持 `applyTo` |
| 组织级 | GitHub Organization Settings | 组织管理员配置 |
| 全局级 | VS Code Settings → `github.copilot.chat.codeGeneration.instructions` | JSON 配置 |

#### `.github/copilot-instructions.md` 格式

纯 Markdown：

```markdown
## 编码指南

- 使用 TypeScript strict 模式
- 测试框架使用 Vitest
- API 错误使用自定义 AppError 类
```

#### `.github/instructions/*.instructions.md` 格式

支持 Frontmatter 中 `applyTo` 指定作用范围：

```markdown
---
applyTo: "**/*.ts"
---

# TypeScript 规范

- 启用 strict 模式
- 禁止使用 `any`
- 使用 `interface` 而非 `type` 定义对象形状
```

#### VS Code Settings 配置方式

```json
{
  "github.copilot.chat.codeGeneration.instructions": [
    { "file": ".github/copilot-instructions.md" },
    { "file": "docs/coding-standards.md" },
    { "text": "Always use async/await instead of .then()" }
  ]
}
```

---

### 2.4 Windsurf (Codeium)

**厂商**: Codeium
**类型**: IDE（VS Code Fork）

#### 规则文件位置

| 层级 | 路径 | 说明 |
|------|------|------|
| 项目级 | `<root>/.windsurfrules` | 单文件，打开项目自动加载 |
| 全局级 | Windsurf Settings → Cascade → Global AI Rules | 所有项目生效 |

#### `.windsurfrules` 格式

纯 Markdown：

```markdown
## 规范

- 使用 TypeScript
- React 组件用函数式写法
- 样式使用 Tailwind CSS
- 测试用 Vitest + Testing Library
```

**注意**: Windsurf 目前**不支持**多文件拆分或 glob 匹配，只有单一的 `.windsurfrules` 文件。

---

### 2.5 Trae (ByteDance)

**厂商**: ByteDance
**类型**: IDE（VS Code Fork）

#### 规则文件位置

| 层级 | 路径 | 说明 |
|------|------|------|
| 项目级（推荐） | `<root>/.trae/rules/*.md` | 多文件拆分，打开项目自动加载 |
| 全局级 | 设置 → AI Rules → Project / Global Rules | GUI 配置 |

#### `.trae/rules/*.md` 格式

纯 Markdown，可使用 Frontmatter（可选）：

```markdown
---
description: "后端 API 规范"
globs: ["src/api/**/*.ts"]
alwaysApply: false
---

# API 编写规范

- 路由使用 RESTful 风格
- 响应统一 JSON 格式
```

**Frontmatter 字段**（与 Cursor `.mdc` 类似）:

| 字段 | 类型 | 说明 |
|------|------|------|
| `description` | string | 规则描述 |
| `globs` | string[] | 作用文件范围 |
| `alwaysApply` | boolean | 是否总是加载 |

---

### 2.6 Cline

**厂商**: 社区开源
**类型**: VS Code 扩展（自主 Agent）

#### 规则文件位置

| 层级 | 路径 | 说明 |
|------|------|------|
| 项目级 | `<root>/.clinerules` | 单文件，自动加载 |
| 全局级 | 扩展设置 → Custom Instructions | 文本输入 |

#### `.clinerules` 格式

纯 Markdown / 纯文本：

```markdown
# 项目规范

- 技术栈: Node.js + Express + PostgreSQL
- ORM: Prisma
- 所有数据库操作走 Service 层
- 禁止在 Controller 中直接操作数据库
```

**注意**: Cline 不支持文件拆分或 glob 匹配。`.clinerules` 在每次 Agent 任务开始时作为 System Prompt 的一部分注入。

---

### 2.7 Roo Code (原 Roo Cline)

**厂商**: 社区开源（Cline Fork）
**类型**: VS Code 扩展（自主 Agent，多模式）

#### 规则文件位置

| 层级 | 路径 | 说明 |
|------|------|------|
| 项目级（通用） | `<root>/.roo/rules/rules.md` | 所有模式共享 |
| 项目级（按模式） | `<root>/.roo/rules/rules-{mode}.md` | 特定模式专属 |
| 全局级 | 扩展设置 → Custom Instructions (per mode) | 按模式配置 |

#### 模式系统

Roo Code 有多种内置模式，每种模式可以有独立的规则：

| 模式 | 规则文件 | 用途 |
|------|---------|------|
| Code | `.roo/rules/rules-code.md` | 编码任务 |
| Architect | `.roo/rules/rules-architect.md` | 架构设计 |
| Ask | `.roo/rules/rules-ask.md` | 问答 |
| Debug | `.roo/rules/rules-debug.md` | 调试 |
| 自定义模式 | `.roo/rules/rules-{slug}.md` | 用户自定义模式 |
| 全局 | `.roo/rules/rules.md` | 所有模式共享 |

#### `.roomodes` 自定义模式文件

```json
{
  "customModes": [
    {
      "slug": "designer",
      "name": "Designer",
      "roleDefinition": "你是一个 UI/UX 设计专家...",
      "customInstructions": "使用 Tailwind CSS...",
      "groups": ["read", "edit", "browser"]
    }
  ]
}
```

---

### 2.8 Aider

**厂商**: 社区开源
**类型**: CLI 工具（终端 AI 编程）

#### 规则文件位置

| 层级 | 路径 | 说明 |
|------|------|------|
| 项目级 | `<root>/.aider.conf.yml` | YAML 配置文件 |
| 全局级 | `~/.aider.conf.yml` | 用户全局配置 |
| 约定文件 | `<root>/CONVENTIONS.md` | 编码规范文件（需在配置中声明） |

#### 配置方式

Aider 没有"自动加载"的规则文件，而是通过 `read` 字段将规范文件加入上下文：

```yaml
# .aider.conf.yml
read:
  - CONVENTIONS.md
  - docs/coding-standards.md

lint-cmd: "npx eslint --fix"
auto-commits: true
```

或通过命令行参数：

```bash
aider --read CONVENTIONS.md
```

#### `CONVENTIONS.md` 格式

纯 Markdown，社区约定命名（非强制）：

```markdown
# 编码约定

## 命名规则
- 变量: camelCase
- 类: PascalCase
- 常量: UPPER_SNAKE_CASE

## 文件组织
- 每个文件只导出一个主要内容
```

---

### 2.9 Continue

**厂商**: 社区开源
**类型**: VS Code / JetBrains 扩展

#### 规则文件位置

| 层级 | 路径 | 说明 |
|------|------|------|
| 项目级 | `<root>/.continue/rules/*.yaml` | 多文件拆分 |
| 项目级 | `<root>/.continuerules` | 简化单文件模式 |
| 全局级 | `~/.continue/config.yaml` → `rules` 字段 | 全局规则配置 |

#### `.continue/rules/*.yaml` 格式

```yaml
name: TypeScript 规范
globs: ["**/*.ts", "**/*.tsx"]
rule: |
  - 使用 strict 模式
  - 禁止 any 类型
  - 使用 interface 定义 Props
  - 错误处理使用自定义 Result 类型
```

#### 全局配置 `config.yaml`

```yaml
rules:
  - name: 通用规范
    rule: "始终使用 async/await，不使用 .then() 链"
  - name: 安全规范
    rule: "永远不要硬编码密钥或密码"
    globs: ["**/*.ts"]
```

---

### 2.10 Amazon Q Developer

**厂商**: AWS
**类型**: IDE 扩展

#### 规则文件位置

Amazon Q Developer 暂**不支持项目级规则文件**，仅支持：

| 层级 | 路径 | 说明 |
|------|------|------|
| 全局级 | IDE Settings → Amazon Q → Instructions | 文本输入 |
| 组织级 | AWS Console → Q Developer Settings | 管理员配置 |

在 IDE 设置中以自然语言描述规范：

```
Always use TypeScript strict mode.
Follow AWS best practices for Lambda functions.
Use DynamoDB DocumentClient v3 syntax.
```

---

### 2.11 Tabnine

**厂商**: Tabnine
**类型**: IDE 扩展

#### 规则文件位置

Tabnine **不支持项目级规则文件**，使用 Web 管理后台配置：

| 层级 | 路径 | 说明 |
|------|------|------|
| 团队级 | Tabnine Web → Team Settings → Coding Standards | 管理后台 |
| 个人级 | Tabnine Web → Personal Preferences | 管理后台 |

配置通过 Web UI 输入自然语言指令，例如：

```
Use React functional components with TypeScript.
Always handle errors with try-catch.
Prefer named exports over default exports.
```

---

### 2.12 JetBrains AI Assistant / Junie

**厂商**: JetBrains
**类型**: IDE 内置 / Agent

#### 规则文件位置

| 层级 | 路径 | 说明 |
|------|------|------|
| 项目级（Junie） | `<root>/.junie/guidelines.md` | Junie Agent 自动加载 |
| 项目级（AI Assistant） | 通过 Prompt Library 配置 | 项目级 Prompt |
| 全局级 | Settings → AI Assistant → Prompt Library | 全局 Prompt |

#### `.junie/guidelines.md` 格式

纯 Markdown：

```markdown
# 项目指南

## 技术栈
- Kotlin + Spring Boot
- Gradle 构建

## 规范
- 使用 data class 而非普通 class
- Repository 层使用 Spring Data JPA
- 所有 API 端点需要写集成测试
```

---

### 2.13 Augment Code

**厂商**: Augment
**类型**: IDE 扩展

#### 规则文件位置

| 层级 | 路径 | 说明 |
|------|------|------|
| 项目级 | `<root>/augment-guidelines.md` | 自动加载 |
| 全局级 | 扩展设置 → Instructions | 文本输入 |

#### `augment-guidelines.md` 格式

纯 Markdown：

```markdown
# Augment 编码指南

- 使用 Python 3.12+
- Type hints 必须完整
- 使用 Pydantic v2 做数据验证
- 异步代码使用 asyncio
```

---

### 2.14 Zed AI

**厂商**: Zed Industries
**类型**: 编辑器内置 AI

#### 规则文件位置

| 层级 | 路径 | 说明 |
|------|------|------|
| 项目级 | `<root>/.rules` | 自动加载 |
| 全局级 | Zed Settings (`settings.json`) → `assistant.rules` | JSON 配置 |

#### `.rules` 格式

纯文本 / Markdown：

```markdown
- Use Rust idiomatic patterns
- Prefer iterators over manual loops
- Use `thiserror` for error types
- All public functions must have doc comments
```

#### Zed Settings 配置

```json
{
  "assistant": {
    "default_model": {
      "provider": "anthropic",
      "model": "claude-sonnet-4-20250514"
    },
    "rules": {
      "content": "Always write idiomatic Rust code."
    }
  }
}
```

---

### 2.15 Void

**厂商**: 社区开源
**类型**: IDE（VS Code Fork，开源）

#### 规则文件位置

| 层级 | 路径 | 说明 |
|------|------|------|
| 项目级 | `<root>/.void/rules/*.md` | 多文件拆分 |
| 全局级 | Void Settings → Rules | 文本输入 |

#### `.void/rules/*.md` 格式

纯 Markdown，每个文件一个主题：

```markdown
# API 规范

- RESTful 风格
- 版本化路由 /api/v1/...
- 统一错误格式
```

---

### 2.16 OpenHands (原 OpenDevin)

**厂商**: 社区开源
**类型**: 自主 Agent 平台

#### 规则文件位置

| 层级 | 路径 | 说明 |
|------|------|------|
| 项目级 | `<root>/.openhands/microagents/*.md` | 按任务拆分的 Micro Agent |

#### Micro Agent 格式

使用 Frontmatter 定义触发条件：

```markdown
---
name: frontend-guidelines
type: repo
agent: CodeActAgent
triggers:
  - "react"
  - "component"
  - "frontend"
---

# 前端开发指南

## 组件规范
- 使用 React 函数式组件
- Props 使用 TypeScript interface 定义
- 样式使用 CSS Modules

## 测试
- 每个组件必须有对应的测试文件
- 使用 React Testing Library
```

**Frontmatter 字段**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | Agent 标识名 |
| `type` | `"repo"` \| `"knowledge"` | 仓库级 or 知识级 |
| `agent` | string | 使用的 Agent 类型 |
| `triggers` | string[] | 关键词触发，匹配用户消息 |

---

### 2.17 Devin

**厂商**: Cognition
**类型**: 自主 Agent（云端）

#### 规则文件位置

| 层级 | 路径 | 说明 |
|------|------|------|
| 项目级 | `<root>/devin.md` | 仓库根目录，自动加载 |
| 全局级 | Devin Web → Knowledge → Playbooks | 管理后台 |

#### `devin.md` 格式

纯 Markdown：

```markdown
# Devin 项目指引

## 环境
- Node.js 20
- pnpm

## 构建
- 运行 `pnpm build` 构建
- 运行 `pnpm test` 测试

## 规范
- 使用 TypeScript strict
- Commit message 使用 Conventional Commits
```

---

### 2.18 CodeMaker (NetEase)

**厂商**: 网易（NetEase）
**类型**: IDE 扩展（仓库智聊 / Code Chat）

#### 规则文件位置

| 层级 | 路径 | 说明 |
|------|------|------|
| 项目级（本地 Rules） | `<root>/.codemaker/rules/*.mdc` | 多文件拆分，打开项目自动加载 |
| 团队级（Team Rules） | DevCloud → 项目知识集 → Team Rules | 云端管理，团队共享，按仓库路径自动匹配 |

#### `.codemaker/rules/*.mdc` 格式

使用 Frontmatter 元数据控制规则的作用范围（与 Cursor `.mdc` 高度一致）：

```markdown
---
description: RPC 服务样板
alwaysApply: false
globs:
  - "backend/services/**/*.service.ts"
---
<rule>
# RPC 服务定义规范
- 定义服务时必须使用我们内部的 RPC 模式。
- 服务名称始终使用 snake_case 命名。
- 必须包含健康检查端点。
@service-template.ts
</rule>
```

**Frontmatter 字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `description` | string | 规则的简短描述（可选） |
| `alwaysApply` | boolean | `true` = 始终生效；`false` = 按需生效 |
| `globs` | string[] | 文件匹配模式，仅当上下文中引用匹配文件时加载 |

#### 三种生效方式

| 生效方式 | 描述 | 配置方式 |
|---------|------|---------|
| **始终生效** | Rules 始终包含在模型上下文中 | `alwaysApply: true` |
| **手动指定** | 仅在使用 `@Rules文件名` 明确提及时生效 | `alwaysApply: false` 且不提供 `globs` |
| **指定文件** | 当上下文中引用了匹配 glob 模式的文件时自动生效 | `alwaysApply: false` 并添加 `globs` |

#### 团队 Rules（Team Rules）

团队 Rules 在 DevCloud 的**项目知识集**中管理：
- 纯文本格式，无需 Frontmatter
- 支持定义仓库路径，打开对应仓库时自动生效
- 在 Rules 管理面板中标识来源，方便识别

#### 兼容性

CodeMaker 兼容 Cursor Rules：
- `.cursor/rules/` 目录下的规则可在 CodeMaker 中直接显示和使用
- 原先为 `Apply Intelligently`（智能生效）的规则会自动调整为「手动生效」

---

### 2.19 Codex (OpenAI CLI Agent)

**厂商**: OpenAI
**类型**: CLI Agent

#### 规则文件位置

| 层级 | 路径 | 说明 |
|------|------|------|
| 项目/目录级 | `<root>/AGENTS.md` 及子目录 `*/AGENTS.md` | 自动递归加载 |
| 用户全局 | `~/.codex/instructions.md` | 所有项目生效 |

#### `AGENTS.md` 格式

纯 Markdown。**核心特点：支持子目录递归**，Codex 在处理某个文件时，会自动加载从项目根到该文件所在目录路径上所有 `AGENTS.md`：

```
project/
├── AGENTS.md                    # 全局规范
├── src/
│   ├── AGENTS.md                # src 通用规范
│   ├── api/
│   │   └── AGENTS.md            # API 专属规范
│   └── components/
│       └── AGENTS.md            # 组件专属规范
```

当 Codex 编辑 `src/api/users.ts` 时，自动加载：
1. `project/AGENTS.md`
2. `project/src/AGENTS.md`
3. `project/src/api/AGENTS.md`

```markdown
# AGENTS.md

## 构建和测试
- 构建: `npm run build`
- 测试全部: `npm test`
- 测试单个: `npm test -- path/to/file`

## 代码风格
- 修改后运行 `npm run lint --fix`
- TypeScript strict 模式
- 使用 named exports
```

---

## 三、格式特征对比

### 3.1 文件格式分类

| 格式类型 | 工具 | 特点 |
|---------|------|------|
| **纯 Markdown** | Cursor, Claude Code, Windsurf, Cline, Devin, Augment, Zed, Codex | 最主流，直接写规范内容 |
| **Markdown + Frontmatter** | Cursor (.mdc), Claude Code (.claude/rules), Trae, GitHub Copilot, OpenHands, CodeMaker (.mdc) | 支持元数据控制作用范围 |
| **YAML** | Continue, Aider | 结构化配置 |
| **JSON** | (Trae 旧版 .traerc) | 少数工具 |
| **Web UI / Settings** | Amazon Q, Tabnine | 无项目文件，GUI 配置 |

### 3.2 Frontmatter 字段统一性

多数支持 Frontmatter 的工具使用了类似的字段名：

| 字段 | Cursor `.mdc` | Claude `.claude/rules` | Trae | Copilot | OpenHands | CodeMaker `.mdc` |
|------|:---:|:---:|:---:|:---:|:---:|:---:|
| `description` | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| `globs` | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| `alwaysApply` | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ |
| `applyTo` | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `triggers` | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |

### 3.3 规则作用范围能力

| 能力 | 支持的工具 |
|------|-----------|
| **全局（所有文件）** | 所有工具 |
| **按 Glob 匹配文件** | Cursor, Claude Code, Trae, Copilot, Continue, CodeMaker |
| **按子目录继承** | Claude Code (子目录 CLAUDE.md), Codex (子目录 AGENTS.md) |
| **按 Agent 模式** | Roo Code (Code/Architect/Debug 等模式) |
| **按关键词触发** | OpenHands (triggers) |

---

## 四、加载机制分类

### 4.1 完全自动加载（零配置）

以下工具只要规则文件存在于正确路径，即自动生效：

```
Cursor (.cursorrules / .cursor/rules/)
Claude Code (CLAUDE.md / .claude/rules/)
Windsurf (.windsurfrules)
Trae (.trae/rules/)
Cline (.clinerules)
Roo Code (.roo/rules/)
GitHub Copilot (.github/copilot-instructions.md)
CodeMaker (.codemaker/rules/)
JetBrains Junie (.junie/guidelines.md)
Augment (augment-guidelines.md)
Zed (.rules)
Devin (devin.md)
Codex (AGENTS.md)
```

### 4.2 需要配置声明

以下工具需要在配置文件中显式引用规范文件：

```
Aider → .aider.conf.yml 中 read 字段
Continue → .continue/config.yaml 中 rules 字段
```

### 4.3 仅 GUI / Web 配置

以下工具不支持项目级文件，仅通过设置界面配置：

```
Amazon Q Developer → IDE Settings
Tabnine → Web 管理后台
```

---

## 五、规范文件大小建议

基于社区实践和 AI 模型上下文窗口限制的经验数据：

| 规模 | 行数 | 大小 | AI 遵循效果 | 建议 |
|------|------|------|-----------|------|
| 精简 | < 50 行 | < 1.5 KB | ⭐⭐⭐⭐⭐ 最佳 | 核心规则，高频遵循 |
| 标准 | 50-150 行 | 1.5-5 KB | ⭐⭐⭐⭐ 良好 | 推荐范围 |
| 详细 | 150-300 行 | 5-10 KB | ⭐⭐⭐ 可接受 | 建议拆分 |
| 过长 | > 300 行 | > 10 KB | ⭐⭐ 下降 | 必须拆分 + MCP 补充 |

**最佳实践**: 核心规则控制在 100 行以内，详细内容通过拆分文件或按需查询机制补充。

---

## 六、跨工具兼容策略

### 6.1 文件名映射表（编译器适配参考）

```
┌───────────────────────────────────────────────────────────────┐
│  规范源文件                  各工具目标文件                       │
│                                                               │
│                         ┌→ .cursorrules                       │
│                         ├→ .cursor/rules/*.mdc                │
│                         ├→ CLAUDE.md                          │
│                         ├→ .claude/rules/*.md                 │
│  .danqing/rules.md ────├→ .github/copilot-instructions.md    │
│                         ├→ .windsurfrules                     │
│                         ├→ .trae/rules/*.md                   │
│                         ├→ .clinerules                        │
│                         ├→ .roo/rules/rules.md                │
│                         ├→ .junie/guidelines.md               │
│                         ├→ augment-guidelines.md              │
│                         ├→ .rules (Zed)                       │
│                         ├→ devin.md                           │
│                         ├→ AGENTS.md (Codex)                  │
│                         ├→ .codemaker/rules/*.mdc (CodeMaker) │
│                         └→ .ai-rules.md (通用 fallback)       │
└───────────────────────────────────────────────────────────────┘
```

### 6.2 格式转换要点

| 目标工具 | 转换策略 |
|---------|---------|
| Markdown 系（大多数） | 添加自动生成头注释 + 直接输出 |
| Frontmatter 系（Cursor .mdc, Trae, CodeMaker .mdc） | 按 `##` 标题拆分 + 生成对应 Frontmatter |
| YAML 系（Continue） | 将 Markdown 嵌入 YAML 的 `rule` 字段 |
| 子目录继承系（Claude Code, Codex） | 根目录放摘要 + 按目录结构拆分详细规范 |

---

## 七、趋势观察

1. **Markdown 成为事实标准** — 几乎所有工具都以 Markdown 作为规则文件格式
2. **Frontmatter 元数据成为主流** — Cursor、Claude Code、Trae、Copilot 都支持 glob/scope 控制
3. **多文件拆分趋势明显** — 新版工具普遍从单文件走向目录化拆分
4. **子目录继承是高级特性** — 目前只有 Claude Code 和 Codex 支持
5. **Agent 模式分化** — Roo Code 的按模式分规则代表了 Agent 工具的发展方向
6. **零配置为设计目标** — 所有新工具都追求"放对位置即自动生效"
7. **跨工具兼容成为卖点** — CodeMaker 主动兼容 Cursor Rules，降低迁移成本
8. **Hooks 机制崭露头角** — Claude Code 已建立完整的事件驱动 Hooks 体系，Kiro 跟进，其余工具仍依赖静态规则 + 命令白名单
9. **CLI 挑战 MCP 地位** — 2026 年初，业界开始讨论 CLI 在 AI Agent 场景下的优势，Token 效率和训练对齐度是关键论点

---

## 八、Hooks（事件驱动自动化）机制调研

> 补充于: 2026-03-17
>
> Hooks 是 Rules 之外的另一种 AI Agent 行为控制机制。Rules 是**声明式**的（告诉 AI "应该怎么做"），Hooks 是**命令式**的（在特定事件发生时执行确定性操作）。两者互补。

### 8.1 总览对照表

| AI 工具 | Hooks / 事件驱动 | 静态规则文件 | 命令 Allow/Deny | 控制粒度 |
|---------|:---:|:---:|:---:|------|
| **Claude Code** | ✅ 完整（7+ 事件） | `CLAUDE.md` | ✅ | 工具级（可按 matcher 过滤） |
| **Kiro (AWS)** | ✅ 有（event-driven） | steering files | — | 事件级 |
| **Cursor** | ❌ | `.cursor/rules/` | ✅ Auto-Run Allow/Deny | 命令级 |
| **GitHub Copilot** | ❌ | `copilot-instructions.md` | — | — |
| **Windsurf** | ❌ | `.windsurfrules` | ✅ Turbo Allow/Deny | 命令级 |
| **Codex (OpenAI)** | ❌ | `AGENTS.md` | ✅ sandbox 模式 | 沙箱级 |
| **Cline** | ❌ | `.clinerules` | ✅ 自动批准设置 | 命令级 |
| **Roo Code** | ❌ | `.roo/rules/` | ✅ 按模式配权限 | 模式级 |
| **Aider** | ❌ | `.aider.conf.yml` | — | — |

### 8.2 Claude Code Hooks — 最完善的实现

Claude Code 是目前 Hooks 体系最成熟的 AI 编码工具。Hooks 配置在 `.claude/settings.json`（项目级）或 `~/.claude/settings.json`（全局级），也可通过交互式 `/hooks` 命令设置。

#### 支持的事件

| 事件 | 触发时机 | 典型用途 |
|------|---------|---------|
| `PreToolUse` | 工具执行**前** | 验证、拦截危险操作、修改工具输入 |
| `PostToolUse` | 工具执行**后** | 自动格式化、lint、运行测试 |
| `UserPromptSubmit` | 用户提交 prompt 时 | 输入校验、上下文注入 |
| `SessionStart` | 会话开始 | 环境初始化、变量注入 |
| `SessionEnd` | 会话结束 | 清理、日志收集 |
| `Stop` | Agent 完成响应 | 强制继续执行、结果校验 |
| `SubagentStop` | 子 Agent 完成（v1.0.41+） | 多 Agent 协调 |
| `PermissionRequest` | 请求权限时（v2.0.45+） | 自动审批 / 拒绝策略 |
| `Notification` | 发送通知时 | 自定义通知渠道 |

#### 配置示例

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "command": "npx prettier --write $CLAUDE_FILE_PATH"
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "command": "echo '检查命令安全性' && validate-command.sh"
      }
    ],
    "Stop": [
      {
        "command": "npm test -- --bail"
      }
    ]
  }
}
```

#### 控制方式

| 机制 | 说明 |
|------|------|
| **退出码** | `0` = 放行，`2` = 阻止，其他 = 非阻塞错误 |
| **JSON 输出** | 可返回 `{ decision, reason, updatedInput, continue }` 做精细控制 |
| **Matcher** | 正则匹配工具名，如 `"Write\|Edit\|MultiEdit"` |
| **输入修改** | PreToolUse 可通过 `updatedInput` 修改工具参数后再执行（v2.0.10+） |
| **HTTP Hooks** | 支持 HTTP endpoint 作为 hook 目标，适合远程审批流 |
| **环境变量** | `CLAUDE_PROJECT_DIR`、`CLAUDE_CODE_REMOTE`、`CLAUDE_ENV_FILE` 等 |
| **超时** | 默认 60 秒，可逐个 hook 自定义 |

#### 实际应用场景

```
PostToolUse + Write/Edit  → 自动 prettier / eslint --fix
PreToolUse + Bash         → 拦截 rm -rf / git push --force
Stop                      → 每次回答后自动跑测试
SessionStart              → 注入项目环境变量
UserPromptSubmit          → 自动追加上下文模板
PermissionRequest         → 自动审批已知安全操作
```

### 8.3 Kiro (AWS) — Event-Driven Hooks

Kiro 是 AWS 推出的 Agentic IDE，是除 Claude Code 外唯一原生支持事件驱动 Hooks 的工具。

**核心特点：**
- 采用 Spec-Driven Development 模式（需求规格 → 设计文档 → 代码生成）
- Hooks 可绑定到开发生命周期事件
- 配合 Steering Files 实现流程编排
- 侧重 "结构化开发流程" 而非 "自由 Agent 操作"

**与 Claude Code 的差异：**

| 维度 | Claude Code | Kiro |
|------|------------|------|
| 定位 | 通用 CLI Agent | Spec-Driven IDE |
| Hook 粒度 | 工具级（按工具名 matcher） | 流程级（按开发阶段） |
| 配置方式 | JSON settings | IDE GUI + 配置文件 |
| 开放性 | 完全自定义 shell/HTTP | 预定义事件类型 |

### 8.4 其他工具的替代方案

对于不支持 Hooks 的工具，社区和厂商采用以下替代机制实现类似效果：

#### 命令 Allow/Deny 列表

Cursor、Windsurf、Cline 在自动执行模式（Auto-Run / Turbo）下提供命令控制：

```
✅ 允许: npm test, npx prettier, eslint
❌ 拦截: rm -rf, git push, docker rm
```

这是**粗粒度的安全阀门**，不等同于 Hooks 的事件驱动能力 — 无法在工具执行后触发动作，也无法修改工具输入。

#### Git Hooks 间接集成

通过 `.husky/` 或 `.git/hooks/` 实现提交时的自动化：

```bash
# .husky/pre-commit
npx lint-staged
npx prettier --check .
```

这种方式与 AI Agent 无关，但可以兜底保障代码质量。所有支持 Git 的工具都间接受益。

#### Rules 文件中嵌入流程指令

在规则文件中写入"伪 Hooks"指令，依赖 AI 概率性遵循：

```markdown
## 自动化规则
- 每次修改文件后，运行 `npx prettier --write` 格式化
- 每次修改测试文件后，运行 `npm test` 确认通过
- 提交代码前确保 `npm run lint` 无错误
```

⚠️ **注意**：这种方式是**概率性**的（AI 可能遗忘），不如 Hooks 的**确定性**执行可靠。这也是 Hooks 机制存在的核心价值。

### 8.5 对丹青平台的启示

| 策略 | 说明 |
|------|------|
| **优先适配 Claude Code Hooks** | 在 `.claude/settings.json` 中预配置 PostToolUse hooks，确保代码质量（格式化、lint、测试） |
| **Rules 文件兜底** | 对不支持 Hooks 的工具，在规则文件中写入流程指令作为软约束 |
| **Git Hooks 作为通用底线** | `.husky/` 配置 lint-staged，无论用什么 AI 工具都能保底 |
| **Rules Compiler 扩展** | 在现有 Rules Compiler 基础上，增加 Hooks 配置的编译输出（目前仅 Claude Code 需要） |
| **关注 AGENTS.md 标准演进** | Linux Foundation 的 Agentic AI Foundation 可能在跨工具标准中加入 Hooks 规范 |

---

## 九、CLI vs MCP：AI Agent 工具集成范式之争

> 补充于: 2026-03-17
>
> 2026 年初，业界围绕 AI Agent 应使用 MCP 还是 CLI 作为工具集成标准展开了激烈讨论。这一趋势可能影响丹青平台的 MCP 服务架构决策。

### 9.1 争议背景

- 2026 年初，一篇 "MCP is dead. Long live the CLI" 登上 Hacker News 头条
- Perplexity CTO Denis Yarats 在 Ask 2026 大会（3月11日）宣布从 MCP 转向 API + CLI
- 多位实战开发者反馈：在真实系统中使用 MCP 后，悄悄回退到 shell 工具链

### 9.2 CLI 优势论点

| 维度 | 说明 |
|------|------|
| **Token 效率** | MCP Server 需在上下文中注入完整工具 schema。GitHub MCP Server 有 93 个工具，约消耗 55,000 tokens — 接近 GPT-4o 上下文窗口的一半 |
| **训练对齐** | LLM 在海量 shell 命令数据上训练，天然"会用" `pytest`、`cargo test`、`eslint` 等 CLI 工具，无需运行时 schema 发现 |
| **Unix 可组合性** | `generate \| process \| store` 管道模式有 50 年工具链支持，每一步都可观测 |
| **零依赖** | 不需要额外的 MCP Server 进程、不需要 SDK、不需要认证握手 |
| **调试简单** | 命令行可直接手动执行验证，MCP 需要专门的调试工具 |

### 9.3 MCP 仍然有优势的场景

| 场景 | 原因 |
|------|------|
| **企业级平台** | 治理、认证、审计能力是 CLI 难以提供的 |
| **非技术用户** | PM、财务、管理层不会使用终端 |
| **IDE 深度集成** | VS Code、Cursor、Claude Desktop 的 AI 助手通过 MCP 访问编辑器上下文 — 这是 MCP 的甜区 |
| **多模型协作** | 希望 Claude、GPT、Gemini 共用同一套工具时，MCP Server 提供统一接口 |
| **合规敏感环境** | MCP 的结构化协议更容易做安全审计 |

### 9.4 业界共识：混合架构

> "最聪明的团队不选边站，而是构建同时利用 CLI 效率和 MCP 治理能力的混合架构。"

| 环节 | 推荐方式 | 原因 |
|------|---------|------|
| **内循环**（编码/调试） | CLI | 快速、token 省、LLM 天然熟悉 |
| **外循环**（CI/CD/部署/协作） | MCP | 结构化、可审计、跨团队 |
| **开发者工具** | CLI 优先 | 90% 开发场景 CLI 更高效 |
| **客户侧功能** | MCP 优先 | 治理和安全要求更高 |

### 9.5 对丹青平台的影响

| 现有设计 | 建议调整 |
|---------|---------|
| MCP Services 层（`02-mcp-services.md`） | 保持 MCP 作为核心服务层，但评估哪些工具可同时提供 CLI 封装 |
| Spec Injection 依赖 MCP Resources | 继续使用，这是 MCP 的强项（动态上下文注入） |
| Skills 层 | Skills 本身已采用 shell 命令执行，天然符合 CLI 范式 |
| 新增考虑 | 为高频开发操作（scaffold、deploy、lint）提供独立 CLI 命令，不强制走 MCP |

---

## 十、参考链接

| 工具 | 官方文档 |
|------|---------|
| Cursor | https://docs.cursor.com/context/rules |
| Claude Code | https://docs.anthropic.com/en/docs/claude-code |
| Claude Code Hooks | https://code.claude.com/docs/en/hooks |
| GitHub Copilot | https://docs.github.com/en/copilot/customizing-copilot |
| Windsurf | https://docs.codeium.com/windsurf/memories#rules |
| Trae | https://docs.trae.ai/ide/rules-for-ai |
| Cline | https://github.com/cline/cline#custom-instructions |
| Roo Code | https://docs.roocode.com/features/custom-rules |
| Aider | https://aider.chat/docs/config/aider_conf.html |
| Continue | https://docs.continue.dev/customize/deep-dives/rules |
| JetBrains Junie | https://www.jetbrains.com/help/idea/junie.html |
| Augment | https://docs.augmentcode.com/usage/guidelines |
| Zed | https://zed.dev/docs/assistant/configuration |
| OpenHands | https://docs.all-hands.dev/modules/usage/agents |
| Devin | https://docs.devin.ai/onboard-devin/repo-specific-knowledge |
| Codex | https://github.com/openai/codex#agents-md |
| CodeMaker | https://doc.hz.netease.com/pages/viewpage.action?pageId=667829364 |
| AGENTS.md 标准 | https://vibecoding.app/blog/agents-md-guide |

### Hooks & CLI vs MCP 补充参考

| 主题 | 链接 |
|------|------|
| Claude Code Hooks 官方文档 | https://code.claude.com/docs/en/hooks |
| Claude Code Hooks 配置指南 (Anthropic Blog) | https://claude.com/blog/how-to-configure-hooks |
| Claude Code Hooks 实战教程 (DataCamp) | https://www.datacamp.com/tutorial/claude-code-hooks |
| GitButler Hooks 集成 | https://docs.gitbutler.com/features/ai-integration/claude-code-hooks |
| CLI vs MCP 对比分析 | https://jannikreinhard.com/2026/02/22/why-cli-tools-are-beating-mcp-for-ai-agents/ |
| CLI vs MCP 深度讨论 (CircleCI) | https://circleci.com/blog/mcp-vs-cli/ |
| MCP is Dead; Long Live MCP | https://chrlschn.dev/blog/2026/03/mcp-is-dead-long-live-mcp/ |
| Perplexity CTO 转向 API + CLI | https://awesomeagents.ai/news/perplexity-agent-api-mcp-shift/ |
| AI 配置文件全解析 (DeployHQ) | https://www.deployhq.com/blog/ai-coding-config-files-guide |

