#!/usr/bin/env node

/**
 * sync-supabase-types.mjs
 *
 * 调用丹青 MCP Gateway 的 db_generate_types 工具，
 * 自动将数据库表结构同步为 TypeScript 类型定义，写入 src/types/supabase.ts。
 *
 * 用法:
 *   node scripts/sync-supabase-types.mjs --mcp-url <url> --mcp-key <apiKey>
 *
 * 参数由 AI Agent 从已连接的 danqing-develop-mcp 服务配置中读取并传入。
 * VITE_APP_ID 从 .env 文件读取。
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'src/types/supabase.ts');

// ─── 解析命令行参数 ─────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = { mcpUrl: '', mcpKey: '' };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--mcp-url') {
      parsed.mcpUrl = args[++i] ?? '';
    } else if (args[i] === '--mcp-key') {
      parsed.mcpKey = args[++i] ?? '';
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`用法: node scripts/sync-supabase-types.mjs --mcp-url <url> --mcp-key <apiKey>

必填选项:
  --mcp-url   MCP 服务器地址（Agent 从 danqing-develop-mcp 配置中读取）
  --mcp-key   MCP API Key（Agent 从 danqing-develop-mcp 配置中读取）

VITE_APP_ID 从项目 .env 文件自动读取。`);
      process.exit(0);
    }
  }

  if (!parsed.mcpUrl) {
    console.error('错误: 必须通过 --mcp-url 指定 MCP 服务器地址');
    console.error('  Agent 应从已连接的 danqing-develop-mcp 配置中读取 url 并传入');
    process.exit(1);
  }
  if (!parsed.mcpKey) {
    console.error('错误: 必须通过 --mcp-key 指定 MCP API Key');
    console.error('  Agent 应从已连接的 danqing-develop-mcp 配置中读取 apiKey 并传入');
    process.exit(1);
  }

  return parsed;
}

// ─── 读取 .env 获取 APP_ID ──────────────────────────────────────────────────

function loadEnv() {
  const envPath = path.join(PROJECT_ROOT, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ 未找到 .env 文件，请确认项目已初始化');
    process.exit(1);
  }
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const vars = {};
  for (const line of envContent.split('\n')) {
    const match = line.match(/^\s*([\w]+)\s*=\s*(.*)$/);
    if (match) {
      vars[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
    }
  }
  return vars;
}

// ─── 调用 MCP Gateway ─────────────────────────────────────────────────────────

async function generateTypes(appId, mcpUrl, mcpKey) {
  console.log(`📡 正在从数据库生成类型定义 (app_id: ${appId})...`);

  const resp = await fetch(mcpUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Authorization': `Bearer ${mcpKey}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'db_generate_types',
        arguments: { app_id: appId },
      },
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    console.error(`❌ MCP 请求失败: ${resp.status} ${resp.statusText}`);
    console.error(text);
    process.exit(1);
  }

  const rpc = await resp.json();

  if (rpc.error) {
    console.error(`❌ MCP 错误 [${rpc.error.code}]: ${rpc.error.message}`);
    process.exit(1);
  }

  if (!rpc.result) {
    console.error('❌ MCP 返回空结果');
    process.exit(1);
  }

  if (rpc.result.isError) {
    const text = rpc.result.content.map((c) => c.text).join('\n');
    console.error(`❌ MCP 工具错误: ${text}`);
    process.exit(1);
  }

  // 提取 text content
  return rpc.result.content
    .filter((c) => c.type === 'text')
    .map((c) => c.text)
    .join('');
}

// ─── 构造输出文件 ──────────────────────────────────────────────────────────────

function buildOutputContent(rawTypes) {
  const header = `/**
 * Supabase Database 类型定义
 *
 * ⚠️ 此文件由 sync-supabase-types.mjs 自动生成，请勿手动修改。
 * 每次通过 MCP 工具建表 / 改表后，由 Agent 运行以下命令同步：
 *
 *   node scripts/sync-supabase-types.mjs --mcp-url <url> --mcp-key <apiKey>
 *
 * 生成时间: ${new Date().toISOString()}
 */

`;

  // rawTypes 可能是纯 TS 代码字符串，也可能包含额外包装
  let tsContent = typeof rawTypes === 'string' ? rawTypes : JSON.stringify(rawTypes, null, 2);

  // 确保文件包含 Database 接口导出
  if (!tsContent.includes('export')) {
    tsContent = `export ${tsContent}`;
  }

  const footer = `

/** 默认 schema 的类型别名，方便提取表类型 */
type DefaultSchema = Database[keyof Database] extends infer S
  ? S extends { Tables: Record<string, unknown> }
    ? S
    : never
  : never;

/** 提取指定表的行类型（如果表不存在则回退到 Record<string, unknown>） */
export type TableRow<T extends string> = T extends keyof DefaultSchema['Tables']
  ? DefaultSchema['Tables'][T] extends { Row: infer R }
    ? R
    : Record<string, unknown>
  : Record<string, unknown>;

/** 提取指定表的插入类型 */
export type TableInsert<T extends string> = T extends keyof DefaultSchema['Tables']
  ? DefaultSchema['Tables'][T] extends { Insert: infer I }
    ? I
    : Record<string, unknown>
  : Record<string, unknown>;

/** 提取指定表的更新类型 */
export type TableUpdate<T extends string> = T extends keyof DefaultSchema['Tables']
  ? DefaultSchema['Tables'][T] extends { Update: infer U }
    ? U
    : Record<string, unknown>
  : Record<string, unknown>;
`;

  return header + tsContent + footer;
}

// ─── 主流程 ──────────────────────────────────────────────────────────────────

async function main() {
  const { mcpUrl, mcpKey } = parseArgs();
  const env = loadEnv();
  const appId = env.VITE_APP_ID;

  if (!appId) {
    console.error('❌ .env 中未找到 VITE_APP_ID');
    process.exit(1);
  }

  try {
    const rawTypes = await generateTypes(appId, mcpUrl, mcpKey);

    // 确保目录存在
    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
    const content = buildOutputContent(rawTypes);
    fs.writeFileSync(OUTPUT_FILE, content, 'utf-8');

    console.log(`✅ 类型定义已写入: src/types/supabase.ts`);
    console.log('   请重启 TS 语言服务或重新打开编辑器以刷新类型。');
  } catch (err) {
    console.error('❌ 同步类型失败:', err.message);
    process.exit(1);
  }
}

main();
