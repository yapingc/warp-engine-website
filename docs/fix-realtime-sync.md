# Supabase Realtime 实时同步修复方案

## 问题现象

协同页面（如多人任务看板）在多个浏览器窗口/用户之间无法实时同步数据变更。

## 根因分析

### 1. JWT 时序竞争

`useAuth` 中 `initSupabaseJwt()` 是 fire-and-forget 调用：

```typescript
// useAuth.ts — 问题代码
initSupabaseJwt().catch((err) =>
  console.error('[useAuth] Supabase JWT 初始化失败:', err),
);
```

`isLoading` 在 `getUserInfo()` 完成后就变为 `false`，页面立即渲染。此时 Realtime channel 的 `subscribe()` 在 JWT 尚未注入 `supabase.realtime.setAuth()` 之前就执行了，导致 WebSocket 连接缺少认证，订阅静默失败。

### 2. 订阅无容错

原代码 `.subscribe()` 没有传入状态回调，订阅失败后无感知、无重试、无 fallback：

```typescript
// 原代码 — 无状态回调
const channel = supabase
  .channel('art_tasks_changes')
  .on('postgres_changes', { ... }, handleChange)
  .subscribe(); // ← 失败了也不知道
```

### 3. REPLICA IDENTITY 缺失

`art_tasks` 表默认使用 `REPLICA IDENTITY DEFAULT`，DELETE 事件的 `payload.old` 只包含主键，可能导致数据不一致。

---

## 修复方案

### 改动 1：supabase.ts — 暴露 JWT 就绪信号

在 JWT token 管理区域新增 `jwtReady` Promise，供 Realtime 订阅等待：

```typescript
// ---- JWT token 管理 ----
let _jwtToken: string | null = null;
let _refreshTimer: ReturnType<typeof setInterval> | null = null;
let _jwtReadyResolve: (() => void) | null = null;
export const jwtReady: Promise<void> = new Promise((resolve) => {
  _jwtReadyResolve = resolve;
});
```

在 `initSupabaseJwt()` 中，JWT 获取成功后 resolve：

```typescript
export async function initSupabaseJwt(): Promise<void> {
  _jwtToken = await fetchSupabaseJwt();
  supabase.realtime.setAuth(_jwtToken);

  // 通知等待方 JWT 已就绪
  if (_jwtReadyResolve) {
    _jwtReadyResolve();
    _jwtReadyResolve = null;
  }

  // ... 定时刷新逻辑不变
}
```

### 改动 2：useArtTasks.ts — 重写订阅逻辑

核心改动点：

**a) 等待 JWT 就绪后再订阅（最多等 5 秒）：**

```typescript
import { appSchema, jwtReady, supabase } from '@/services/supabase';

const subscribe = async () => {
  await Promise.race([jwtReady, new Promise((r) => setTimeout(r, 5000))]);
  if (unmountedRef.current) return;

  const channel = supabase
    .channel('art_tasks_changes')
    .on('postgres_changes', { event: '*', schema: appSchema, table: 'art_tasks' }, handleChange)
    .subscribe((status, err) => { /* 状态处理 */ });

  channelRef.current = channel;
};
```

**b) 订阅状态回调 + 轮询 fallback：**

```typescript
.subscribe((status, err) => {
  if (status === 'SUBSCRIBED') {
    realtimeActive.current = true;
    stopPolling();  // Realtime 连通，停止轮询
  } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
    console.warn('[useArtTasks] realtime subscription failed, falling back to polling', status, err);
    realtimeActive.current = false;
    startPolling(); // 降级为轮询
  } else if (status === 'CLOSED') {
    realtimeActive.current = false;
    if (!unmountedRef.current) startPolling();
  }
})
```

**c) 默认先启动轮询，Realtime 成功后停止：**

```typescript
useEffect(() => {
  void fetchTasks();

  startPolling();       // 立即启动轮询作为 baseline
  void subscribe();     // 异步建立 Realtime 连接

  // tab 切回时立即刷新一次
  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') void fetchTasks();
  };
  document.addEventListener('visibilitychange', onVisibilityChange);

  return () => { /* cleanup */ };
}, [fetchTasks, isFreshLocalEcho, startPolling, stopPolling]);
```

**d) 轮询间隔：**

```typescript
const POLL_INTERVAL_MS = 10_000; // 10 秒
```

### 改动 3：数据库迁移

需要执行两条 SQL：

```sql
-- 1. 设置 REPLICA IDENTITY FULL，确保 DELETE 事件包含完整行数据
ALTER TABLE <appSchema>.art_tasks REPLICA IDENTITY FULL;

-- 2. 显式授权（防止 DEFAULT PRIVILEGES 未覆盖）
GRANT SELECT, INSERT, UPDATE, DELETE ON <appSchema>.art_tasks TO anon, authenticated;
```

通过 MCP 工具执行：

```
db_apply_migration(app_id, "set_art_tasks_replica_identity_full", "ALTER TABLE <appSchema>.art_tasks REPLICA IDENTITY FULL")
db_apply_migration(app_id, "grant_art_tasks_permissions", "GRANT SELECT, INSERT, UPDATE, DELETE ON <appSchema>.art_tasks TO anon, authenticated")
```

---

## 同步策略总结

```
页面挂载
  ├─ fetchTasks()        ← 首次加载
  ├─ startPolling(10s)   ← 立即启动轮询 baseline
  └─ subscribe()
       ├─ await jwtReady (max 5s)
       └─ channel.subscribe()
            ├─ SUBSCRIBED    → stopPolling()，切换为 Realtime 推送
            ├─ CHANNEL_ERROR → startPolling()，降级为轮询
            └─ CLOSED        → startPolling()，降级为轮询

tab 切回 (visibilitychange)
  └─ fetchTasks()        ← 立即刷新一次，弥补后台期间可能丢失的事件
```

## 涉及文件

| 文件 | 改动 |
|------|------|
| `src/services/supabase.ts` | 新增 `jwtReady` Promise 导出 |
| `src/pages/collab/hooks/useArtTasks.ts` | 重写订阅逻辑，增加轮询 fallback |
| 数据库 | `REPLICA IDENTITY FULL` + 显式 GRANT |
