import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/types/supabase';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** 以 appId 作为默认数据库 schema，拼接 app_ 前缀与 supabase MCP 服务保持一致 */
export const appSchema = `app_${(import.meta.env.VITE_APP_ID as string).replaceAll('-', '_')}`;

// 相对路径（如 /supabase）拼接 origin 构成完整 URL，走 Vite 代理
const supabaseUrl = rawUrl.startsWith('http') ? rawUrl : `${window.location.origin}${rawUrl}`;

// ---- JWT token 管理 ----
let _jwtToken: string | null = null;
let _refreshTimer: ReturnType<typeof setInterval> | null = null;
let _jwtReadyResolve: (() => void) | null = null;

/** JWT 就绪信号，Realtime 订阅应 await 此 Promise 后再 subscribe */
export const jwtReady: Promise<void> = new Promise((resolve) => {
  _jwtReadyResolve = resolve;
});

/** 10 分钟刷新间隔 */
const REFRESH_INTERVAL = 10 * 60 * 1000;

/**
 * 通过自定义 fetch 在每次请求时注入最新的 JWT Authorization 头，
 * 这样 token 刷新后无需重建 client，对业务层完全透明。
 */
const customFetch: typeof fetch = (input, init = {}) => {
  const headers = new Headers((init as RequestInit).headers);
  if (_jwtToken) {
    headers.set('Authorization', `Bearer ${_jwtToken}`);
  }
  return fetch(input, { ...(init as RequestInit), headers, credentials: 'omit' });
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  db: { schema: appSchema as any },
  global: { fetch: customFetch },
});

/**
 * 从后端获取 Supabase JWT
 */
async function fetchSupabaseJwt(): Promise<string> {
  const resp = await fetch('/danqing-node/api/vibe-coding/permission/user/info', { credentials: 'include' });
  if (!resp.ok) throw new Error(`获取 Supabase JWT 失败: ${resp.status}`);
  const json = await resp.json();
  return json.data.token;
}

/**
 * 初始化 Supabase JWT 认证并启动自动刷新。
 * 在用户登录成功后调用一次即可，后续 token 刷新对业务完全无感。
 */
export async function initSupabaseJwt(): Promise<void> {
  _jwtToken = await fetchSupabaseJwt();
  // 同步给 realtime 连接
  supabase.realtime.setAuth(_jwtToken);

  // 通知等待方 JWT 已就绪
  if (_jwtReadyResolve) {
    _jwtReadyResolve();
    _jwtReadyResolve = null;
  }

  // 清理旧定时器
  if (_refreshTimer) clearInterval(_refreshTimer);

  // 每 10 分钟静默刷新
  _refreshTimer = setInterval(async () => {
    try {
      _jwtToken = await fetchSupabaseJwt();
      supabase.realtime.setAuth(_jwtToken);
    } catch (err) {
      console.error('[supabase] JWT 自动刷新失败:', err);
    }
  }, REFRESH_INTERVAL);
}