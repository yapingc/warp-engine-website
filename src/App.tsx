import { useMemo } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import zhCN from 'antd/locale/zh_CN';
import { useAtom } from 'jotai';
import { App as AntdApp, ConfigProvider, Spin } from '@fuxi/eevee-ui';

import { useAuth } from '@/hooks/useAuth';
import getRouterConfig from '@/router';

import { themeAtom } from './atoms';
import { DarkTheme, LightTheme } from './styles/antd-theme';

import '@/styles/index.less';

const App = ({
  autoFetchInfoWhenTokenNotExisted,
  autoNoAuthRedirect,
}: {
  autoFetchInfoWhenTokenNotExisted?: boolean;
  autoNoAuthRedirect?: boolean;
}) => {
  const [themeValue] = useAtom(themeAtom);
  const { isLoading } = useAuth();

  const router = useMemo(() => createBrowserRouter(getRouterConfig()), []);

  const token = useMemo(() => Object.assign(themeValue === 'light' ? LightTheme : DarkTheme, {}), [themeValue]);

  if (isLoading) {
    return (
      <div className="loading-container">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token,
        cssVar: { prefix: '' },
      }}>
      <AntdApp>
        <RouterProvider router={router} />
      </AntdApp>
    </ConfigProvider>
  );
};

export default App;
