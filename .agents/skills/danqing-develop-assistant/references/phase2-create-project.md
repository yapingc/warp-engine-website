# Phase 2: 创建项目

服务连接成功后，用大白话向用户介绍流程：

> 丹青约开发工具已就绪！整个流程非常简单：
> 1. 给您的应用起个名字，我来帮您创建项目
> 2. 等待项目准备就绪
> 3. 打开浏览器预览模板页面
> 4. 告诉我您需要什么功能，我来帮您实现
> 5. 开发完成后，一句话即可发布上线
>
> 准备好了吗？先给您的应用起个名字吧！

## 确定应用名称

应用名称（内部为 app_id）的规则：只能用英文字母、数字和短横线。

- 如果用户直接给了名称：校验格式后用 `register_app(action="check")` 检查是否可用
- 如果用户不知道起什么名：让用户描述应用内容，推荐若干候选名称（确保每个都通过查重）
- 可推荐当前目录名作为默认建议
- 名称不可用时，向用户说明"这个名字已被占用，换一个试试"

## 执行初始化

调用 `init_project(app_id="xxx")`，返回的命令**逐条自动执行**，不可跳过。执行过程中向用户简要说明进展：

> 正在为您创建项目，这可能需要几分钟...

## 写入项目级 CLAUDE.md（NON-NEGOTIABLE）

`init_project` 执行完成后，**必须在项目根目录创建或追加 `CLAUDE.md` 和 `AGENTS.md`**，写入以下内容（确保每次新会话启动时自动触发 skill 自检）：

```markdown
# 丹青约项目

本项目是丹青约 Web 应用。每次新会话启动时，必须对 `danqing-develop-assistant` skill 进行版本更新检查和 `danqing-develop-mcp` 服务连接自检，无需等待用户指示。
```

如果项目已存在 `CLAUDE.md`，将上述内容追加到文件开头（不覆盖已有内容）。

同样，如果项目支持其他 Agent 的指令文件（如 `.cursor/rules`、`GEMINI.md`），也写入等效的自检触发指令。

## 已有项目迁移

如果用户已有一个现成的应用，希望搬到丹青约平台：

1. **先创建新项目**：正常执行 `init_project`，确保新项目可运行
2. **分析原项目**：读取用户原项目的核心文件，理解其功能和结构
3. **迁移代码**：将用户代码融入新项目中，遵循新项目的代码规范和目录结构
   - 使用新项目的目录结构（`src/pages/`、`src/components/` 等）
   - 使用新项目的路由方式和入口配置
   - 安装原项目需要的额外依赖
   - 保持原项目的接口调用逻辑不变
   - **图片上传**优先使用丹青约 SDK 的 upload 能力，而非第三方图床或本地文件引用
4. **自动验证与修复**：迁移完成后启动页面，逐页检查：
   - 所有页面是否可正常访问
   - 核心交互是否正常（提交、加载、弹窗、跳转等）
   - 样式是否还原（布局、颜色、字体、间距等），发现偏差时主动修复
   - 控制台是否有报错，有则自行修复
   - 能自行修复的问题不要留给用户
5. **交由用户检查**：
   > 迁移已完成，我已经检查并修复了发现的问题。请您浏览各个页面确认效果。
   > 如果有还原不到位的地方，截图发给我，我会继续调整。
6. **整理项目结构**：确认无误后，以整合后的新项目为主体重新整理目录，原项目文件移入根目录下的 `old/` 文件夹保留备份，并在 `.gitignore` 中添加 `old/`

> 迁移原则：以新项目为基座融入用户代码，而非覆盖新项目结构。

## 域名配置

初始化后需要将本地域名 `danqing-local.danlu.netease.com` 指向本机，agent 应**自动尝试执行**。

如果因权限不足无法自动完成，根据平台引导用户：

- **Mac/Linux**：
  > 需要您在终端中执行一条命令来配置访问地址（需要输入电脑密码）：
  > `sudo sh -c 'echo "127.0.0.1 danqing-local.danlu.netease.com" >> /etc/hosts'`
  > 执行成功后告诉我，我继续下一步。

- **Windows**：
  > 需要您手动添加一行配置：
  > 1. 以管理员身份打开记事本
  > 2. 打开文件 `C:\Windows\System32\drivers\etc\hosts`
  > 3. 在最后一行添加：`127.0.0.1 danqing-local.danlu.netease.com`
  > 4. 保存后告诉我，我继续下一步。

## 启动并预览

域名配置完成后，启动开发服务器。

### 启动规则（NON-NEGOTIABLE）

1. **必须前台启动**：使用 `pnpm dev` 或 `npm run dev`，**禁止**使用 `&`、`nohup`、`disown` 等后台模式启动。后台启动会导致无法读取实际输出、无法确认真实端口
2. **必须从启动输出中提取实际端口号**：dev server 启动后会在终端输出类似 `Local: http://localhost:5173/` 的日志，**必须从该输出中读取实际端口号**，不能假设端口是 5173 或任何固定值
3. **端口冲突处理**：如果默认端口（如 5173）被占用，Vite 会自动换用其他端口（如 5174、5175 等），输出日志中会体现真实端口。必须以最后一次成功启动的输出为准
4. **向用户展示的访问地址**必须使用从终端输出中提取的实际端口号拼接：
   > 项目已启动！请在浏览器中打开 http://danqing-local.danlu.netease.com:【实际端口号】 查看页面。
5. **如果启动失败后重试**：以最后一次成功启动的终端输出为准，之前失败的输出中的端口号作废

### 检查 Vite 配置中的自动打开浏览器逻辑

启动前，检查项目的 Vite 配置文件（`vite.config.ts` 或 `vite.config.js`）中 `server.open` 字段：

- 如果已配置 `open: 'http://danqing-local.danlu.netease.com:端口'` 或类似的自动打开逻辑，则 Vite 启动后会自动在系统默认浏览器中打开页面。**但这不是受控浏览器**，agent 无法通过 chrome-devtools 访问该页面
- 如果未配置 `server.open`，不需要主动添加——我们使用 chrome-devtools 受控浏览器来替代

### 使用 chrome-devtools 打开受控浏览器调试（NON-NEGOTIABLE）

开发服务器启动成功后，**必须使用 chrome-devtools 工具在受控浏览器中打开页面**，以便 agent 能够实时查看、截图和调试页面：

**启动前清理残留锁文件**：chrome-devtools 使用 `--isolated` 模式时会创建临时 profile，如果上次会话异常退出，可能残留 `SingletonLock` 文件导致新实例无法启动。在调用 chrome-devtools 工具之前，先执行清理：
- **Windows**：`Remove-Item "$env:USERPROFILE\.cache\chrome-devtools-mcp\chrome-profile\SingletonLock" -ErrorAction SilentlyContinue`
- **Mac/Linux**：`rm -f ~/.cache/chrome-devtools-mcp/chrome-profile/SingletonLock`

删除锁文件不会影响任何正在运行的 Chrome 进程，可以安全执行。

**严禁杀死用户的 Chrome 进程**：如果 chrome-devtools 启动时遇到端口冲突、实例冲突或其他错误，**绝对不能**执行 `taskkill`、`kill`、`Stop-Process` 等命令来关闭用户正在使用的 Chrome 浏览器。用户的 Chrome 中可能有未保存的工作。正确的做法是：只清理锁文件后重试，如果仍然失败，告知用户具体错误并让用户自行决定如何处理。

1. 使用 `navigate_page` 工具打开 `http://danqing-local.danlu.netease.com:【实际端口号】`
2. 等待页面加载完成后，使用 `take_screenshot` 或 `take_snapshot` 确认页面正常渲染
3. 如果页面加载异常（空白、报错、样式错乱），使用 `list_console_messages` 查看控制台错误，自行排查修复

**注意**：
- 受控浏览器中的域名 `danqing-local.danlu.netease.com` 需要能正确解析到 `127.0.0.1`，这依赖于本阶段已完成的域名配置
- 后续开发过程中，每次修改代码后应主动在受控浏览器中刷新页面（`navigate_page` type=reload）并截图确认效果
- **OpenClaw 环境**：OpenClaw 的浏览器默认启用 SSRF 防护策略，会阻止访问 `localhost`、`127.0.0.1` 及内网域名。如果页面无法加载，需要在 chrome-devtools 配置中添加 `"dangerouslyAllowPrivateNetwork": true` 并将 `danqing-local.danlu.netease.com`、`localhost`、`127.0.0.1` 加入允许列表
