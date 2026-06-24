# warp-speed-init

Danqing 外部服务项目

## 项目说明

这是一个基于 Danqing SDK 的外部服务项目，支持：
- ✅ 平台统一登录认证
- ✅ SDK API 调用
- ✅ UI 组件复用
- ✅ iframe 嵌入主平台

## 环境配置

项目使用环境变量配置，请确保 `.env` 文件已正确配置：

```bash
VITE_API_BASE_URL=https://danqing-front-api-pre.apps-cae.danlu.netease.com
VITE_APP_ID=warp-speed
VITE_DEBUG=false
```

## 开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm run dev

# 构建生产版本
pnpm run build
```

### 本地开发前置：whistle 代理配置（推荐）

为了在本地模拟真实线上环境（域名为 `*.danlu.netease.com`，并且复用平台 Cookie / 登录态），建议在本地开发时通过 **whistle** 把本地端口映射到一个 `xxx.danlu.netease.com` 域名下。

1. **安装 whistle（全局）**

```bash
pnpm add -g whistle
# 或
npm install -g whistle
```

2. **启动 whistle**

```bash
w2 start        # 启动
w2 status       # 查看状态
```

3. **打开 whistle 管理界面并安装 HTTPS 证书**

- 在浏览器访问：`http://127.0.0.1:8899`
- 点击顶部 `HTTPS` 选项，按提示下载并双击安装根证书（不同操作系统略有差异，需要信任该证书）

4. **在浏览器中配置代理 / 安装 whistle 插件**

- 推荐安装浏览器代理插件（如 Chrome 的 SwitchyOmega 或官方 whistle 插件），将 HTTP/HTTPS 代理指向：  
  - 代理地址：`127.0.0.1`  
  - 端口：`8899`
  - 协议：HTTP / HTTPS

也可以在操作系统层面直接配置全局代理为 `127.0.0.1:8899`。

5. **在 whistle 中添加规则，将本地服务映射到 danlu 域名**

假设本项目本地开发端口为 `3001`，并且你希望用 `danqing-local.danlu.netease.com` 访问，在Rules页面添加：

```text
danqing-local.danlu.netease.com 127.0.0.1:3001
```

保存后，在浏览器中访问：

```text
https://danqing-local.danlu.netease.com
```

此时：

- 浏览器实际走的是 `whistle` 代理；
- `whistle` 将该域名的请求转发到本机 `3001` 端口；
- 你的应用以 `*.danlu.netease.com` 域名运行，可以复用平台在 `danlu.netease.com` 下写入的 Cookie（RBAC 登录态等）。

> 如果你的服务端 API 也需要通过 danlu 域名访问（如 `xxx-api.danlu.netease.com`），可以在 whistle 中继续添加对应的域名转发规则到本地或测试环境地址。

## 项目结构

```
src/
├── config/
│   └── sdk.ts          # SDK 配置和 Provider
├── pages/
│   ├── Home.tsx        # 首页（/）
│   ├── UploadDemo.tsx  # 上传示例（/upload）
│   ├── About.tsx       # 说明页（/about）
│   └── NotFound.tsx    # 404
├── components/         # 自定义组件
├── App.tsx             # 根组件
├── main.tsx            # 入口文件
└── index.css           # 全局样式
```

## 路由（react-router-dom）

模板已内置 `react-router-dom`（BrowserRouter + Routes），默认路由：
- `/`：首页
- `/upload`：上传示例
- `/about`：SDK/Router 说明

## SDK 使用

### 初始化

SDK 已在 `src/config/sdk.ts` 中配置，通过 `SDKProvider` 包裹应用：

```tsx
import { SDKProvider } from './config/sdk';

function App() {
  return (
    <SDKProvider>
      {/* 你的应用 */}
    </SDKProvider>
  );
}
```

### 使用 SDK

```tsx
import { useSDK } from './config/sdk';

function MyComponent() {
  const sdk = useSDK();
  
  // 检查认证
  if (sdk.auth.isAuthenticated()) {
    // 调用 API
    const result = await sdk.api.upload.uploadImage(file);
  }
}
```

### Banana 生图服务

```tsx
import { useSDK } from './config/sdk';

function BananaDemo() {
  const sdk = useSDK();

  const handleGenerate = async () => {
    const result = await sdk.api.banana.generate({
      prompt: '一只在月球上的猫',
      size: '1:1',
      resolution: '2K',
    });

    console.log(result.imageUrl);
  };

  return (
    <button type="button" onClick={handleGenerate}>
      生成图片
    </button>
  );
}
```

## 认证流程

1. 应用启动时自动检查登录状态
2. 未登录时自动触发登录流程
3. 登录成功后可以正常使用 SDK API

## 部署

构建完成后，将 `dist` 目录部署到你的服务器，确保：
1. 服务器支持 HTTPS（生产环境）
2. 配置 CORS 允许主平台域名访问
3. 配置 X-Frame-Options 允许 iframe 嵌入

## 更多文档

- [SDK API 总览](./docs/api-catalog.md) — 所有 API 的参数、返回值、调用示例（升级 SDK 后自动更新）
- [SDK 使用指南](./docs/sdk-usage.md) — 初始化、Provider、基础用法
- [组件文档](./docs/components-usage.md)
- [Supabase Schema 初始化](./docs/supabase-schema-init.md)

### Supabase 初始化

项目使用 `warp-speed` 对应的 schema `app_warp_speed` 进行数据隔离。Schema 本身由丹青约平台（`db_apply_migration`）自动创建，初始化脚本只负责授权、注册到 PostgREST 并强制其重连：

```bash
# 通过 MCP 工具 db_apply_migration 执行 sql/init-schema.sql 即可
```

详见 [Supabase Schema 初始化指南](./docs/supabase-schema-init.md)；方案设计原理见 [PostgREST Schema 暴露方案](./docs/postgrest-schema-exposure.md)。