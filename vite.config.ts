import path from 'path';

import { visualizer } from 'rollup-plugin-visualizer';
import Unocss from 'unocss/vite';
import classnamesBind from '@fuxi/vite-plugin-classnames-bind';
import react from '@vitejs/plugin-react-swc';
import { defineConfig, loadEnv, PluginOption, UserConfig } from 'vite';

function openBrowserPlugin(hostname: string): PluginOption {
  return {
    name: 'open-browser',
    apply: 'serve',
    configureServer(server) {
      server.httpServer?.once('listening', () => {
        const address = server.httpServer?.address();
        if (address && typeof address !== 'string') {
          const protocol = server.config.server.https ? 'https' : 'http';
          const url = `${protocol}://${hostname}:${address.port}`;
          import('open')
            .then((mod) => (mod.default || mod)(url))
            .catch(() => {
              // Fallback for container/VNC environments where xdg-open fails
              import('child_process').then(({ exec }) => {
                exec(`chromium --no-sandbox "${url}" 2>/dev/null`);
              }).catch(() => {});
            });
        }
      });
    },
  };
}

function createServerConfig(apiBaseUrl: string, env: Record<string, string>): UserConfig['server'] {
  return {
    port: 8011,
    cors: true,
    host: '0.0.0.0',
    // 如果在whistle中使用了其他域名，需要添加到这里保证热更新生效
    allowedHosts: ['danqing-local.danlu.netease.com'],
    proxy: {
      '/_sx': {
        target: 'https://danqing-sx.apps-hp.danlu.netease.com',
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p.replace(/^\/_sx/, ''),
      },
      '/basics': {
        target: apiBaseUrl,
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p.replace(/^\/basics/, ''),
      },
      '/upload': {
        target: 'https://tiangong-shanquan-pre.apps-hp.danlu.netease.com',
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p.replace(/^\/upload/, ''),
      },
      '/urscheck': 'http://rbac.danlu.netease.com:35615',
      '/rbac/login': {
        target: 'http://rbac.danlu.netease.com:35615',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/rbac/, ''),
      },
      '/rbac': {
        target: 'http://rbac.danlu.netease.com:35615',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/rbac/, ''),
      },
      '/fuxi-static': {
        target: 'https://static.fuxi.netease.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/fuxi-static/, ''),
      },
      '/supabase': {
        target: env.VITE_SUPABASE_TARGET || 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/supabase/, ''),
        ws: true,
      },
      '/danqing-node': {
        target: env.VITE_DANQING_NODE_URL || 'https://localhost:8001',
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p.replace(/^\/danqing-node/, ''),
      },
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // 后端网关地址：优先使用环境变量 VITE_API_BASE_URL，默认指向预发布环境
  const apiBaseUrl = env.VITE_API_BASE_URL || 'https://danqing-front-api-pre.apps-cae.danlu.netease.com';

  return {
    plugins: [
      react() as PluginOption,
      classnamesBind(),
      Unocss(),
      visualizer(),
      openBrowserPlugin('danqing-local.danlu.netease.com'),
    ],
    server: createServerConfig(apiBaseUrl, env),
    resolve: {
      alias: [
        {
          find: /^@\//,
          replacement: `${path.resolve(__dirname, 'src')}${path.sep}`,
        },
        {
          find: '@common',
          replacement: path.resolve(__dirname, '../common'),
        },
        { find: /^~/, replacement: '' },
      ],
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        plugins: [visualizer()],
      },
    },
  };
});
