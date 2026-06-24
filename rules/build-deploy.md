---
name: build-deploy
description: build_docker 构建部署流程 — 在涉及打包、构建、部署上线时自动生效
agents:
  - claude
---

# build_docker 构建部署流程

前端构建部署使用 `scripts/deploy-docker.mjs` 脚本，直接通过 HTTP 调用 MCP 服务器，
绕过 LLM 中转，解决大文件（minified JS 等）无法传输的问题。零额外依赖，仅用 Node.js 内置模块。

1. **安装依赖**：在项目目录执行 `pnpm install`
2. **构建产物**：执行 `pnpm run build`，生成 dist/ 目录
3. **执行部署**：运行 `node scripts/deploy-docker.mjs <app_id> --mcp-url <url> --mcp-key <apiKey> [dist_dir] [--version <version>]`

`--mcp-url` 和 `--mcp-key` 必须由 Agent 从已连接的 **danqing-develop-mcp** 服务配置中读取并传入。

示例：
```bash
pnpm install && pnpm run build
node scripts/deploy-docker.mjs my-app --mcp-url https://xxx/mcp --mcp-key ak-xxx
node scripts/deploy-docker.mjs my-app --mcp-url https://xxx/mcp --mcp-key ak-xxx ./dist --version v1.0.0-0326
```

脚本收集 dist/ 下所有文件（文本直接传输，二进制自动 base64 编码），
通过 HTTP 直接发送到 MCP 服务器执行 docker build + push。

**注意**：不要再用 Read 工具读取 dist 文件后调用 MCP build_docker 工具，大文件会超出限制。
