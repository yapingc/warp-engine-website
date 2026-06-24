import React, { useEffect } from 'react';
import { Outlet, useSearchParams } from 'react-router-dom';
import { Base64 } from 'js-base64';
import cookie from 'js-cookie';
import { Header } from '@fuxi/danqing-components';

import { useAuth } from '@/hooks/useAuth';
import { ETracker } from '@/utils/tracker';

interface LayoutProps {
  theme?: 'light' | 'dark' | 'transparent';
  hideFooter?: boolean;
}

const themeClass: Record<string, string> = {
  light: 'bg-white',
  dark: 'bg-black',
  transparent: 'bg-transparent',
};

const Layout: React.FC<LayoutProps> = ({ theme = 'light' }) => {
  const { userInfo, isLoading } = useAuth();
  const [search, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (userInfo) {
      ETracker.setConfig({
        uid: userInfo.userEmail,
        username: userInfo.name,
      });
    }
  }, [userInfo]);

  useEffect(() => {
    if (search.get('next')) {
      try {
        const next = Base64.decode(search.get('next')!);
        search.delete('next');
        setSearchParams(search);
        window.location.href = next;
      } catch (_) {}
    }

    if (search.get('RBAC_TOKEN') && search.get('RBAC_USER')) {
      search.get('RBAC_TOKEN') && cookie.set('RBAC_TOKEN', search.get('RBAC_TOKEN')!, { domain: '.danlu.netease.com', expires: 1 });
      search.get('RBAC_USER') && cookie.set('RBAC_USER', search.get('RBAC_USER')!, { domain: '.danlu.netease.com', expires: 1 });
      search.get('RBAC_TOKEN') && cookie.set('RBAC_TOKEN', search.get('RBAC_TOKEN')!, { domain: 'danqing.163.com', expires: 1 });
      search.get('RBAC_USER') && cookie.set('RBAC_USER', search.get('RBAC_USER')!, { domain: 'danqing.163.com', expires: 1 });

      search.delete('RBAC_TOKEN');
      search.delete('RBAC_USER');
      setSearchParams(search);
    }
  }, []);

  return (
    <>
      {isLoading ? null : (
        <div className={`min-h-screen flex flex-col ${themeClass[theme]}`}>
          <Header
            logo="丹青约 UGC 服务"
            userInfo={userInfo || undefined}
            isLoading={isLoading}
          />
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      )}
    </>
  );
};

export default Layout;
