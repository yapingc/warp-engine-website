import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

import { fetchAll } from './supabase-db';
import { appSchema, jwtReady, supabase } from './supabase';

const POLL_INTERVAL_MS = 10_000;
const JWT_WAIT_TIMEOUT_MS = 5_000;

export interface RealtimeChannelOptions<T extends Record<string, unknown> = Record<string, unknown>> {
  /** 要订阅的表名（不含 schema 前缀） */
  table: string;
  /** 监听的事件类型，默认 '*' 全部 */
  event?: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  /** schema，默认使用 appSchema */
  schema?: string;
  /** 收到变更时的回调 */
  onData: (payload: RealtimePostgresChangesPayload<T>) => void;
  /** 订阅状态变更回调 */
  onStatus?: (status: string, err?: Error) => void;
  /** 轮询时的数据拉取函数（不提供则使用内置 fetchAll） */
  fetchData?: () => Promise<T[]>;
  /** 轮询拿到数据后的回调（仅轮询模式触发） */
  onPollData?: (data: T[]) => void;
  /** 轮询间隔，默认 10 秒 */
  pollInterval?: number;
}

export interface RealtimeChannelHandle {
  channel: RealtimeChannel | null;
  cleanup: () => void;
}

/**
 * 一站式创建 Realtime 订阅。自动处理：
 * - 等待 JWT 就绪（解决时序竞争）
 * - 订阅状态回调与轮询 fallback
 * - visibilitychange 时自动刷新
 *
 * 数据库层的 Realtime 授权（PUBLICATION + REPLICA IDENTITY）已在 init-schema 中
 * 通过 schema 级别配置自动完成，无需逐表手动处理。
 */
export function createRealtimeChannel<T extends Record<string, unknown> = Record<string, unknown>>(
  options: RealtimeChannelOptions<T>,
): RealtimeChannelHandle {
  const {
    table,
    event = '*',
    schema = appSchema,
    onData,
    onStatus,
    fetchData,
    onPollData,
    pollInterval = POLL_INTERVAL_MS,
  } = options;

  let channel: RealtimeChannel | null = null;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let destroyed = false;

  const doFetch = fetchData ?? (() => fetchAll<T>(table));

  const startPolling = () => {
    if (pollTimer || destroyed) return;
    pollTimer = setInterval(async () => {
      try {
        const data = await doFetch();
        if (!destroyed && onPollData) onPollData(data);
      } catch (err) {
        console.warn(`[realtime:${table}] polling fetch failed`, err);
      }
    }, pollInterval);
  };

  const stopPolling = () => {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  };

  const subscribe = async () => {
    // 等待 JWT 就绪，最多等 5 秒
    await Promise.race([jwtReady, new Promise((r) => setTimeout(r, JWT_WAIT_TIMEOUT_MS))]);
    if (destroyed) return;

    channel = supabase
      .channel(`${table}_changes`)
      .on('postgres_changes', { event, schema, table } as any, onData as any)
      .subscribe((status, err) => {
        onStatus?.(status, err as Error | undefined);

        if (status === 'SUBSCRIBED') {
          stopPolling();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn(`[realtime:${table}] subscription failed, falling back to polling`, status, err);
          startPolling();
        } else if (status === 'CLOSED') {
          if (!destroyed) startPolling();
        }
      });
  };

  // 启动：先轮询作为 baseline，再异步建立 Realtime
  startPolling();
  void subscribe();

  // tab 切回时刷新一次
  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible' && onPollData) {
      void doFetch().then((data) => {
        if (!destroyed) onPollData(data);
      }).catch(() => {});
    }
  };
  document.addEventListener('visibilitychange', onVisibilityChange);

  const cleanup = () => {
    destroyed = true;
    stopPolling();
    if (channel) {
      supabase.removeChannel(channel);
      channel = null;
    }
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };

  return { channel, cleanup };
}
