import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const WORKER_KEY = process.env.WORKER_KEY;
const APP_SCHEMA = process.env.APP_SCHEMA;

class NoopWebSocket {
  close() {}
}

if (!SUPABASE_URL) {
  throw new Error('缺少 SUPABASE_URL 环境变量');
}
if (!WORKER_KEY) {
  throw new Error('缺少 WORKER_KEY 环境变量，请通过 MCP create-supabase-worker-key 获取');
}
if (!APP_SCHEMA) {
  throw new Error('缺少 APP_SCHEMA 环境变量');
}

export const supabase = createClient(SUPABASE_URL, WORKER_KEY, {
  db: { schema: APP_SCHEMA as any },
  global: {
    headers: { Authorization: `Bearer ${WORKER_KEY}` },
  },
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    transport: NoopWebSocket as any,
  },
});
