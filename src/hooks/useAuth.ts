import { useCallback, useEffect, useState } from 'react';

import { useSDK } from '../config/sdk';
import { getUserInfo, isLoggedIn, UserInfo } from '../services/auth';
import { initSupabaseJwt } from '../services/supabase';

interface UseAuthReturn {
  userInfo: UserInfo | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const sdk = useSDK();

  const fetchUserInfo = useCallback(async () => {
    // 先检查 Cookie
    if (!isLoggedIn() && window.location.pathname !== '/login') {
      // Cookie 不存在，跳转到登录页
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      setUserInfo(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const info = await getUserInfo(sdk);
      setUserInfo(info);

      // 等待 Supabase JWT 就绪后再结束 loading，避免页面渲染时 JWT 尚未注入
      await initSupabaseJwt();
    } catch (err) {
      setError(err as Error);
      setUserInfo(null);
    } finally {
      setIsLoading(false);
    }
  }, [sdk]);

  useEffect(() => {
    void fetchUserInfo();
  }, [fetchUserInfo]);

  return {
    userInfo,
    isLoading,
    isLoggedIn: !!userInfo,
    error,
    refetch: fetchUserInfo,
  };
}
