/**
 * Supabase Database 类型定义
 *
 * ⚠️ 建表/改表后请运行以下命令同步类型，避免 TS 报错：
 *
 *   npm run sync:types
 *
 * 也可在 /schema 页面点击「生成类型」按钮手动获取。
 *
 * 注意：默认 schema 为 appId（通过 VITE_APP_ID 环境变量指定），
 * 而非 PostgreSQL 默认的 public。
 */

/**
 * Database 类型使用动态 schema 名（appId）。
 * Supabase 客户端在创建时已通过 db.schema 选项绑定到 appId，
 * 这里用索引签名兼容任意 schema 名称。
 *
 * 当 sync:types 运行后，此接口会被自动生成的精确类型替换。
 */
export interface Database {
  [schema: string]: {
    Tables: Record<string, {
      Row: Record<string, unknown>;
      Insert: Record<string, unknown>;
      Update: Record<string, unknown>;
    }>;
    Views: Record<string, {
      Row: Record<string, unknown>;
    }>;
    Functions: Record<string, unknown>;
    Enums: Record<string, unknown>;
  };
}

/** 默认 schema 的类型别名，方便提取表类型 */
type DefaultSchema = Database[string];

/**
 * 提取指定表的行类型。
 * 类型未同步时回退到 Record<string, unknown>，不会产生编译错误。
 * 同步后会自动推导出精确的字段类型。
 */
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