import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import Cookies from 'js-cookie';
import { LoginInfoContextProvider } from '@fuxi/eevee-hooks';
import { Spin } from '@fuxi/eevee-ui';

import App from './App';
import { SDKProvider } from './config/sdk';
import { initDanqingAnalytics } from './utils/danqing-analytics';

import 'virtual:uno.css';
import '@fuxi/danqing-components/dist/style.css';

initDanqingAnalytics();

window.addEventListener('message', (event) => {
  if (event.data.type === 'DANQING_AUTH_TOKEN') {
    const { token, user } = event.data;
    Cookies.set('RBAC_TOKEN', token);
    Cookies.set('RBAC_USER', user);
  }
});

// 全局接口拦截：当任意请求返回 401 / AUTH_ERROR 时，统一跳转到登录页
window.addEventListener('unhandledrejection', (event) => {
  const reason: any = event.reason;

  const code = reason?.code;
  const status = reason?.statusCode ?? reason?.status ?? reason?.response?.status;
  const is401 = code === 'AUTH_ERROR' || status === 401;

  if (is401 && window.location.pathname !== '/login') {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/login?next=${next}`;
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LoginInfoContextProvider>
      <SDKProvider>
        <Suspense
          fallback={
            <div className="loading-container">
              <Spin size="large" tip="加载中..." />
            </div>
          }>
          <App />
        </Suspense>
      </SDKProvider>
    </LoginInfoContextProvider>
  </React.StrictMode>,
);
