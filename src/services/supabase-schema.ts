import type { JsonRpcResponse, McpToolResult, MigrationInfo, TableInfo } from '@/types/schema';

import { appSchema } from './supabase';

let rpcId = 0;

/** 调用 Supabase MCP 工具（JSON-RPC 2.0） */
async function callMcpTool(toolName: string, args: Record<string, unknown> = {}): Promise<McpToolResult> {
  const response = await fetch('/supabase/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: ++rpcId,
      method: 'tools/call',
      params: { name: toolName, arguments: args },
    }),
  });

  if (!response.ok) {
    throw new Error(`MCP 请求失败: ${response.status} ${response.statusText}`);
  }

  const rpc: JsonRpcResponse<McpToolResult> = await response.json();

  if (rpc.error) {
    throw new Error(`MCP 错误 [${rpc.error.code}]: ${rpc.error.message}`);
  }

  if (!rpc.result) {
    throw new Error('MCP 返回空结果');
  }

  if (rpc.result.isError) {
    const text = rpc.result.content.map((c) => c.text).join('\n');
    throw new Error(`MCP 工具错误: ${text}`);
  }

  return rpc.result;
}

/** 解析 MCP 返回的 text content 为 JSON */
function parseTextContent<T>(result: McpToolResult): T {
  const text = result.content
    .filter((c) => c.type === 'text')
    .map((c) => c.text)
    .join('');
  return JSON.parse(text) as T;
}

/** 获取原始 text content */
function getRawText(result: McpToolResult): string {
  return result.content
    .filter((c) => c.type === 'text')
    .map((c) => c.text)
    .join('');
}

/** 列出所有表 */
export async function listTables(verbose = true): Promise<TableInfo[]> {
  const result = await callMcpTool('list_tables', { schemas: [appSchema], verbose });
  return parseTextContent<TableInfo[]>(result);
}

/** 应用 DDL 迁移（建表、改表等） */
export async function applyMigration(name: string, sql: string): Promise<string> {
  const result = await callMcpTool('apply_migration', { name, query: sql });
  return getRawText(result);
}

/** 执行 SQL（非 DDL） */
export async function executeSql(query: string): Promise<unknown> {
  const result = await callMcpTool('execute_sql', { query });
  try {
    return parseTextContent(result);
  } catch {
    return getRawText(result);
  }
}

/** 生成 TypeScript 类型定义 */
export async function generateTypes(): Promise<string> {
  const result = await callMcpTool('generate_typescript_types', {});
  return getRawText(result);
}

/** 列出迁移历史 */
export async function listMigrations(): Promise<MigrationInfo[]> {
  const result = await callMcpTool('list_migrations', {});
  return parseTextContent<MigrationInfo[]>(result);
}
