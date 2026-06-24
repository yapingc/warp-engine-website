import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { reportDanqingPageView } from '@/utils/danqing-analytics';
import Layout from '@/layout';

const Home = React.lazy(() => import('@/pages/Home'));
const UploadDemo = React.lazy(() => import('@/pages/UploadDemo'));
const About = React.lazy(() => import('@/pages/About'));
const NotFound = React.lazy(() => import('@/pages/NotFound'));
const Login = React.lazy(() => import('@/pages/login'));

export interface IRouterExtra {
  path: string;
  name?: string;
  icon?: string;
  group?: string;
  children?: IRouterExtra[];
  noAuth?: boolean;
  hideFooter?: boolean;
}

function DanqingAnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    reportDanqingPageView();
  }, [location.pathname]);

  return null;
}

const getRouterConfig = () => {
  return [
    {
      element: (
        <>
          <DanqingAnalyticsTracker />
          <Outlet />
        </>
      ),
      children: [
        {
          path: '/',
          element: <Layout />,
          children: [
            {
              path: '',
              element: <Home />,
            },
          ],
        },
        {
          path: '/login',
          element: <Login />,
        },
        {
          path: '/upload',
          element: <Layout />,
          children: [
            {
              path: '',
              element: <UploadDemo />,
            },
          ],
        },
        {
          path: '/about',
          element: <Layout />,
          children: [
            {
              path: '',
              element: <About />,
            },
          ],
        },
        {
          path: '/home',
          element: <Navigate to="/" replace />,
        },
        {
          path: '*',
          element: <NotFound />,
        },
      ],
    },
  ];
};

export default getRouterConfig;
