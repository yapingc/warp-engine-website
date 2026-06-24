const SUPABASE_URL = import.meta.env.VITE_SUPABASE_TARGET;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const appId = import.meta.env.VITE_APP_ID;

let danqingIsNewVisitorToday = false;

export function initDanqingAnalytics() {
  const today = new Date().toDateString();
  const storageKey = `_danqing_uv_${appId}_${today}`;
  danqingIsNewVisitorToday = !localStorage.getItem(storageKey);
  if (danqingIsNewVisitorToday) localStorage.setItem(storageKey, '1');
}

export function reportDanqingPageView() {
  if (!SUPABASE_URL || !SUPABASE_KEY || !appId) return;

  fetch(`${SUPABASE_URL}/rest/v1/rpc/report_page_view`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      p_app_id: appId,
      p_is_new_visitor: danqingIsNewVisitorToday,
    }),
    keepalive: true,
  });
  danqingIsNewVisitorToday = false;
}
