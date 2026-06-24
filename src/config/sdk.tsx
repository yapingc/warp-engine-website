import { DanqingSDK } from '@fuxi/danqing-sdk';
import React, { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';

// SDK 内部默认使用相对路径请求后端接口，这里不需要再传 apiBaseUrl
// 后端网关地址通过 Vite 代理（/basics -> VITE_API_BASE_URL）配置
const sdk = new DanqingSDK({
  appId: import.meta.env.VITE_APP_ID,
  iframe: true,
  debug: import.meta.env.VITE_DEBUG === 'true',
  apiKey: 'ik-ntH7MNtWV3xaR8WLXggqzFiwVpHv6N6f',
});

export const SDKContext = createContext<InstanceType<typeof DanqingSDK> | null>(null);

interface SDKProviderProps {
  children: ReactNode;
}

export const SDKProvider: React.FC<SDKProviderProps> = ({ children }) => {
  const sdkInstance = useMemo(() => sdk, []);
  return <SDKContext.Provider value={sdkInstance}>{children}</SDKContext.Provider>;
};

export const useSDK = () => {
  const sdkInstance = useContext(SDKContext);
  if (!sdkInstance) {
    throw new Error('SDK not initialized. Please wrap your app with SDKProvider.');
  }
  return sdkInstance;
};