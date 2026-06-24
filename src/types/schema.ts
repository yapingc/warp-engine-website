/** JSON-RPC 2.0 响应 */
export interface JsonRpcResponse<T = unknown> {
  jsonrpc: '2.0';
  id: number;
  result?: T;
  error?: { code: number; message: string; data?: unknown };
}

/** MCP tools/call 返回值 */
export interface McpToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

/** 表信息 */
export interface TableInfo {
  table_name: string;
  schema: string;
  columns?: ColumnInfo[];
}

/** 字段信息 */
export interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: boolean;
  column_default: string | null;
  is_primary_key: boolean;
  foreign_key?: {
    foreign_table_name: string;
    foreign_column_name: string;
  } | null;
}

/** 迁移记录 */
export interface MigrationInfo {
  id: string;
  name: string;
  executed_at: string;
}
