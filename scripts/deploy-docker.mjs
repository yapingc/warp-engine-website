#!/usr/bin/env node
/**
 * deploy-docker.mjs - 直接调用 MCP build_docker 工具部署前端应用
 *
 * 绕过 LLM 中转，直接将 dist 文件通过 HTTP 发送到 MCP 服务器，
 * 解决大文件（如 minified JS）无法通过 Claude Code 传输的问题。
 *
 * 用法:
 *   node scripts/deploy-docker.mjs <app_id> --mcp-url <url> --mcp-key <apiKey> --mcp-email <email> [dist_dir] [--version <version>]
 *
 * 参数由 AI Agent 从已连接的 danqing-develop-mcp 服务配置中读取并传入。
 *
 * 示例:
 *   node scripts/deploy-docker.mjs my-app --mcp-url https://xxx/mcp --mcp-key ak-xxx --mcp-email user@example.com
 *   node scripts/deploy-docker.mjs my-app --mcp-url https://xxx/mcp --mcp-key ak-xxx --mcp-email user@example.com ./dist --version v1.0.0-0326
 */

import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, relative, extname, resolve } from "path";
import { request as httpRequest } from "http";
import { request as httpsRequest } from "https";

// 二进制文件扩展名
const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".ico", ".webp", ".avif", ".bmp",
  ".woff", ".woff2", ".ttf", ".eot", ".otf",
  ".mp4", ".webm", ".mp3", ".ogg", ".wav",
  ".pdf", ".zip", ".gz", ".br",
]);

/**
 * 从命令行参数中获取 MCP 服务器配置
 * Agent 应从已连接的 danqing-develop-mcp 服务配置中读取 url 和 apiKey 并通过参数传入
 */
function loadMcpConfig({ mcpUrl, mcpKey, mcpEmail }) {
  if (!mcpUrl) {
    console.error("错误: 必须通过 --mcp-url 指定 MCP 服务器地址");
    console.error("  Agent 应从已连接的 danqing-develop-mcp 配置中读取 url 并传入");
    process.exit(1);
  }
  if (!mcpKey) {
    console.error("错误: 必须通过 --mcp-key 指定 MCP API Key");
    console.error("  Agent 应从已连接的 danqing-develop-mcp 配置中读取 apiKey 并传入");
    process.exit(1);
  }
  if (!mcpEmail) {
    console.error("错误: 必须通过 --mcp-email 指定用户邮箱");
    console.error("  Agent 应从已连接的 danqing-develop-mcp 配置中读取 options.headers[\"X-User-Email\"] 并传入");
    process.exit(1);
  }
  return { url: mcpUrl, auth: `Bearer ${mcpKey}`, email: mcpEmail };
}

/**
 * 判断文件是否为二进制
 */
function isBinaryFile(filepath) {
  const ext = extname(filepath).toLowerCase();
  if (BINARY_EXTENSIONS.has(ext)) return true;

  // 尝试按 UTF-8 读取前 4KB，检测是否包含 NULL 字节
  try {
    const buf = readFileSync(filepath).subarray(0, 4096);
    for (let i = 0; i < buf.length; i++) {
      if (buf[i] === 0) return true;
    }
    return false;
  } catch {
    return true;
  }
}

/**
 * 递归遍历目录下所有文件
 */
function walkDir(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath));
    } else if (entry.isFile()) {
      results.push(fullPath);
    }
  }
  return results.sort();
}

/**
 * 收集 dist 目录下所有文件
 */
function collectDistFiles(distDir) {
  const absDir = resolve(distDir);
  if (!existsSync(absDir)) {
    console.error(`错误: dist 目录不存在: ${absDir}`);
    process.exit(1);
  }

  const distFiles = {};
  let totalSize = 0;
  const files = walkDir(absDir);

  for (const filepath of files) {
    const relPath = relative(absDir, filepath).replace(/\\/g, "/");
    const fileSize = statSync(filepath).size;
    totalSize += fileSize;

    if (isBinaryFile(filepath)) {
      const content = readFileSync(filepath).toString("base64");
      distFiles[`base64:${relPath}`] = content;
      console.log(`  [bin] ${relPath} (${fileSize.toLocaleString()} bytes)`);
    } else {
      const content = readFileSync(filepath, "utf-8");
      distFiles[relPath] = content;
      console.log(`  [txt] ${relPath} (${fileSize.toLocaleString()} bytes)`);
    }
  }

  console.log(`\n共 ${files.length} 个文件, 总大小 ${totalSize.toLocaleString()} bytes`);
  return distFiles;
}

/**
 * 通过 HTTP 发送 JSON-RPC 请求到 MCP 服务器
 */
function sendRequest(url, auth, email, payload) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === "https:";
    const doRequest = isHttps ? httpsRequest : httpRequest;

    const payloadStr = JSON.stringify(payload);
    const payloadBytes = Buffer.from(payloadStr, "utf-8");

    console.log(`\n请求大小: ${payloadBytes.length.toLocaleString()} bytes (${(payloadBytes.length / 1024 / 1024).toFixed(1)} MB)`);
    console.log(`发送请求到 ${url} ...`);

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": payloadBytes.length,
      },
      timeout: 660000, // 11 minutes
    };

    if (auth) {
      options.headers["Authorization"] = auth;
    }
    if (email) {
      options.headers["X-User-Email"] = email;
    }

    const req = doRequest(options, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf-8");
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error(`响应解析失败: ${body.substring(0, 500)}`));
        }
      });
    });

    req.on("error", (e) => reject(new Error(`连接错误: ${e.message}\n请检查 MCP 服务器是否正在运行。`)));
    req.on("timeout", () => { req.destroy(); reject(new Error("请求超时 (11分钟)")); });

    req.write(payloadBytes);
    req.end();
  });
}

/**
 * 调用 MCP build_docker 工具
 */
async function callBuildDocker(url, auth, email, appId, distFiles, version) {
  const arguments_ = { app_id: appId, dist_files: distFiles };
  if (version) arguments_.version = version;

  const payload = {
    jsonrpc: "2.0",
    method: "tools/call",
    params: {
      name: "build_docker",
      arguments: arguments_,
    },
    id: "deploy-1",
  };

  const result = await sendRequest(url, auth, email, payload);

  // 解析 MCP JSON-RPC 响应
  if (result.error) {
    return `错误: ${result.error.message ?? "未知错误"}`;
  }

  const content = result.result?.content ?? [];
  return content
    .filter((c) => c.type === "text")
    .map((c) => c.text)
    .join("\n");
}

// ---- 解析命令行参数 ----

function parseArgs() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    console.log(`用法: node scripts/deploy-docker.mjs <app_id> --mcp-url <url> --mcp-key <apiKey> --mcp-email <email> [dist_dir] [options]

参数:
  app_id          应用 ID (如 my-app)，只允许字母、数字和短横线
  dist_dir        dist 目录路径 (默认 ./dist)

必填选项:
  --mcp-url       MCP 服务器地址（Agent 从 danqing-develop-mcp 配置中读取）
  --mcp-key       MCP API Key（Agent 从 danqing-develop-mcp 配置中读取）
  --mcp-email     用户邮箱（Agent 从 danqing-develop-mcp 配置中读取 options.headers["X-User-Email"]）

可选:
  --version, -v   镜像版本号 (默认自动生成 v1.0.0-MMdd)
  --help, -h      显示帮助信息

示例:
  node scripts/deploy-docker.mjs my-app --mcp-url https://xxx/mcp --mcp-key ak-xxx --mcp-email user@example.com
  node scripts/deploy-docker.mjs my-app --mcp-url https://xxx/mcp --mcp-key ak-xxx --mcp-email user@example.com ./dist --version v1.0.0-0326`);
    process.exit(0);
  }

  const parsed = { appId: "", distDir: "./dist", version: "", mcpUrl: "", mcpKey: "", mcpEmail: "" };
  const positional = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--version" || args[i] === "-v") {
      parsed.version = args[++i] ?? "";
    } else if (args[i] === "--mcp-url") {
      parsed.mcpUrl = args[++i] ?? "";
    } else if (args[i] === "--mcp-key") {
      parsed.mcpKey = args[++i] ?? "";
    } else if (args[i] === "--mcp-email") {
      parsed.mcpEmail = args[++i] ?? "";
    } else if (!args[i].startsWith("-")) {
      positional.push(args[i]);
    }
  }

  parsed.appId = positional[0] ?? "";
  if (positional[1]) parsed.distDir = positional[1];

  if (!parsed.appId) {
    console.error("错误: 必须指定 app_id");
    process.exit(1);
  }

  return parsed;
}

// ---- 主流程 ----

async function main() {
  const args = parseArgs();

  console.log(`=== 部署前端应用: ${args.appId} ===\n`);

  // 1. 读取 MCP 配置（由 Agent 通过命令行参数传入）
  const { url, auth, email } = loadMcpConfig(args);
  console.log(`MCP 服务器: ${url}`);

  // 2. 收集 dist 文件
  console.log(`\n收集文件: ${resolve(args.distDir)}`);
  const distFiles = collectDistFiles(args.distDir);

  if (Object.keys(distFiles).length === 0) {
    console.error("错误: dist 目录为空，请先执行前端构建");
    process.exit(1);
  }

  // 3. 调用 build_docker
  try {
    const result = await callBuildDocker(url, auth, email, args.appId, distFiles, args.version);
    console.log(`\n${"=".repeat(50)}`);
    console.log(result);
  } catch (e) {
    console.error(`\n部署失败: ${e.message}`);
    process.exit(1);
  }
}

main();
