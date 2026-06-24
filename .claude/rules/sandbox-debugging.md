---
description: Sandbox 沙箱调试规范 — 在调试页面、预览效果、验证渲染结果或排查前端问题时自动生效
---

# Sandbox 沙箱调试规范

## 你拥有的能力

当用户让你 **调试页面**、**预览效果**、**验证渲染结果** 或 **排查前端问题** 时，
你可以使用项目中集成的 Sandbox 沙箱容器来完成。你不再是"盲人"——你可以真正看到浏览器中的页面。

## 核心架构

```
宿主机 (你的运行环境)          Sandbox 容器 (headful browser)
┌─────────────────┐           ┌─────────────────────────────┐
│  Playwright      │ ── CDP ──→│  Chrome (端口 9222)          │
│  SDK Client      │ ── HTTP ─→│  Nginx 代理 (端口 8080)      │
│  debug-sandbox.ts│           │  noVNC (端口 6080)           │
│                  │           │  Jupyter Lab (端口 8888)     │
└─────────────────┘           └─────────────────────────────┘
```

**关键端口**: 宿主机 `http://localhost:8080` 映射到容器 Nginx 代理

## 工作流程

### 确认容器运行

```bash
podman ps --filter name=sandbox
# 或
docker ps --filter name=sandbox
```

### 使用 CLI 调试工具

项目已集成 `test-sandbox/debug-sandbox.ts` CLI 工具:

```bash
# 截图 - 查看当前页面
npx ts-node test-sandbox/debug-sandbox.ts screenshot

# 截图指定 URL
npx ts-node test-sandbox/debug-sandbox.ts screenshot --url http://localhost:9999

# 导出 DOM 结构
npx ts-node test-sandbox/debug-sandbox.ts dom

# 捕获控制台日志 (持续 5 秒)
npx ts-node test-sandbox/debug-sandbox.ts console --duration 5000

# 执行完整检查 (截图 + DOM + 控制台)
npx ts-node test-sandbox/debug-sandbox.ts full --url http://localhost:9999
```

输出文件保存在 `test-sandbox/output/` 目录:
- `screenshot.png` — 页面截图
- `dom.txt` — DOM 树结构
- `console.txt` — 控制台日志

### Playwright CDP 直连

```typescript
import { chromium } from "playwright";

const browser = await chromium.connectOverCDP("http://localhost:8080/cdp");
const page = browser.contexts()[0].pages()[0];

await page.goto("http://localhost:9999");
await page.screenshot({ path: "test-sandbox/output/screenshot.png" });
await page.click("#submit-btn");
await page.fill("#search-input", "测试文本");

page.on("console", (msg) => console.log(`[${msg.type()}] ${msg.text()}`));
page.on("pageerror", (err) => console.error(`[PAGE ERROR] ${err.message}`));
```

## 重要注意事项

1. **不要使用 SDK 的 `browserPage` 高级 API**（如 `client.browserPage.navigate()`），当前版本返回 404
2. **端口 8888 被 Jupyter Lab 占用**，应用测试请使用其他端口（推荐 9999）
3. **CDP 连接地址**固定为 `http://localhost:8080/cdp`
4. **VNC 可视化**地址: `http://localhost:8080/vnc/index.html`
5. **每次截图前**确保页面加载完成

## 何时应该使用 Sandbox

- 用户说"帮我看看页面效果"、"预览一下"、"这个页面对不对"
- 用户遇到前端渲染问题需要诊断
- 用户要求验证样式/布局变更
- 用户要求做 UI 自动化测试
- 修改了 HTML/CSS/JS 后想确认效果

## 何时不需要 Sandbox

- 纯后端 API 开发
- 配置文件修改
- 代码 review 或架构讨论
