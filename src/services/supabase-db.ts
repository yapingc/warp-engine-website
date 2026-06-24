import { supabase } from './supabase';

/**
 * 通用数据库 CRUD 帮助函数
 *
 * 当前 Database 类型为空占位。在 AI Agent 建表后，
 * 通过 /schema 页面「生成类型」更新 src/types/supabase.ts 即可获得完整类型安全。
 */

/** 查询所有行 */
export async function fetchAll<T = Record<string, unknown>>(
  table: string,
  options?: {
    columns?: string;
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
  },
): Promise<T[]> {
  let query = supabase.from(table).select(options?.columns ?? '*');

  if (options?.orderBy) {
    query = query.order(options.orderBy.column, {
      ascending: options.orderBy.ascending ?? true,
    });
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as T[];
}

/** 按 ID 查询单行 */
export async function fetchById<T = Record<string, unknown>>(table: string, id: string): Promise<T | null> {
  const { data, error } = await supabase.from(table).select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as T | null;
}

/** 插入一行或多行 */
export async function insertRows<T = Record<string, unknown>>(
  table: string,
  rows: Record<string, unknown> | Record<string, unknown>[],
): Promise<T[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from(table) as any).insert(rows).select();
  if (error) throw error;
  return (data ?? []) as T[];
}

/** 按 ID 更新 */
export async function updateById<T = Record<string, unknown>>(
  table: string,
  id: string,
  updates: Record<string, unknown>,
): Promise<T | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from(table) as any).update(updates).eq('id', id).select().maybeSingle();
  if (error) throw error;
  return data as T | null;
}

/** 按 ID 删除 */
export async function deleteById(table: string, id: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from(table) as any).delete().eq('id', id);
  if (error) throw error;
}
