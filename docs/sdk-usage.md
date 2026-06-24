## Danqing SDK 使用说明（@fuxi/danqing-sdk）

本项目模板已经预装并在 `src/config/sdk.tsx` 中初始化了 **`@fuxi/danqing-sdk`**，用于：

- 统一封装 API 调用（上传、历史图片、积分、埋点、用户信息等）
- 管理鉴权 token
- 支持 iframe 场景下的父页面通信

> 本文件是针对模板项目的「精简版 SDK 使用指南」，更完整的说明可以在主仓库 `packages/danqing-sdk/docs/usage.md` 中查看。

---

### 一、SDK 初始化与获取

模板中已经封装了一个 `SDKProvider` 和 `useSDK`：

```tsx
// src/config/sdk.tsx
import { DanqingSDK } from '@fuxi/danqing-sdk';
import React, { createContext, useContext, useMemo } from 'react';

const sdk = new DanqingSDK({
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  appId: import.meta.env.VITE_APP_ID,
  iframe: true,
  debug: import.meta.env.VITE_DEBUG === 'true',
});

export const SDKContext = createContext<InstanceType<typeof DanqingSDK> | null>(null);

export const SDKProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
```

在根组件中已包裹：

```tsx
// src/App.tsx（示意）
import { SDKProvider } from './config/sdk';

export function App() {
  return (
    <SDKProvider>
      {/* 你的路由和页面 */}
    </SDKProvider>
  );
}
```

在任意组件中使用：

```tsx
import { useSDK } from '@/config/sdk';

export function MyComponent() {
  const sdk = useSDK();

  // 例如：检查是否已登录
  const authed = sdk.auth.isAuthenticated();

  // 调用任意 API
  // await sdk.api.user.getUserInfo();
}
```

---

### 二、SDKConfig 配置说明

在模板中，`DanqingSDK` 的配置主要来自环境变量：

```ts
new DanqingSDK({
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  appId: import.meta.env.VITE_APP_ID,
  iframe: true,
  timeout: 30000,
  retryCount: 0,
  debug: import.meta.env.VITE_DEBUG === 'true',
});
```

相关环境变量在 `.env` 文件中：

```bash
VITE_API_BASE_URL=https://danqing-front-api-pre.apps-cae.danlu.netease.com
VITE_APP_ID=your-app-id
VITE_DEBUG=false
```

`SDKConfig` 字段：

- **`apiBaseUrl: string`**：后端 API 网关前缀（必填）。
- **`appId: string`**：当前外部服务的 App ID（必填）。
- **`iframe?: boolean`**：是否处于 iframe 中，模板默认开启。
- **`timeout?: number`**：请求超时时间（毫秒），默认 `30000`。
- **`retryCount?: number`**：重试次数，默认 `0`。
- **`debug?: boolean`**：是否输出 SDK 内部调试日志。
- **`userInfoEndpoint?: string`**：用户信息接口路径（相对 `apiBaseUrl`），默认 `'/rbac/api/v1/web/users'`。

---

### 三、上传相关：`sdk.api.upload`

单图上传：

```tsx
const sdk = useSDK();
const file = input.files?.[0];

if (file) {
  const result = await sdk.api.upload.uploadImage(file, {
    limitSize: 10, // 单张限制 10MB
    allowedFormatList: ['jpg', 'jpeg', 'png', 'webp'],
    enableHashCheck: true,
  });

  console.log('上传结果:', result.url, result.width, result.height);
}
```

`UploadImageOptions` 常用字段说明：

- **`limitSize?: number`**：单张图片大小上限（MB，默认 20）。
- **`limitType?: string[]`**：允许的 MIME types。
- **`allowedFormatList?: string[]`**：允许的扩展名。
- **`compress?: boolean`**：是否在上传前压缩图片。
- **`maxImageWidth?: number` / `maxImageHeight?: number`**：压缩后的最大宽高。
- **`maxFileSize?: number`**：压缩后的目标体积（字节）。
- **`quality?: number`**：压缩质量（0–1）。
- **`enableHashCheck?: boolean`**：是否做 hash 去重，默认 `true`。
- **`styleId?: number`**：后端样式 ID，默认 `-1`。
- **`action?: number`**：业务动作枚举。
- **`fileType?: string`**：文件类型（`img` / `video` / `model` 等），默认 `img`。

多图上传（串行）：

```ts
const results = await sdk.api.upload.uploadMultiple(files, {
  limitSize: 5,
});
```

> 模板中的 `ImageUpload` 组件已经封装了用户交互和图片限制，通常推荐优先使用组件；只有在需要完全自定义交互时才直接用 `sdk.api.upload`。

---

### 四、历史图片：`sdk.api.history`

获取上传历史列表：

```ts
const sdk = useSDK();

const { list, hasNext } = await sdk.api.history.getUploadHistory({
  pageIndex: 1,
  pageSize: 20,
});
```

返回：

- **`list: UploadHistoryItem[]`**
  - `imageId: number`：图片 ID。
  - `imageUrl: string`：图片 URL。
  - `thumbnailUrl?: string`：缩略图 URL。
  - `width?: number` / `height?: number`：尺寸。
- **`hasNext: boolean`**：是否有下一页。

删除历史图片：

```ts
await sdk.api.history.deleteHistoryImage(imageId);
```

模板中的 `ImageUpload` 在传入 `sdk` 时，会自动使用这些接口。

---

### 五、埋点：`sdk.api.tracking`

发送单条埋点：

```ts
await sdk.api.tracking.trackEvent({
  eventName: 'page_view',
  params: { path: '/upload' },
  // serviceName: 'your-service', // 不传则默认使用 appId
  immediate: true,
});
```

`TrackEventOptions` 字段：

- **`eventName: string`**：事件名称（必填）。
- **`params?: Record<string, any>`**：事件参数。
- **`serviceName?: string`**：服务名，默认使用 `appId`。
- **`immediate?: boolean`**：是否立即上报，默认 `true`。

批量埋点：

```ts
await sdk.api.tracking.trackEvents([
  { eventName: 'page_view', params: { path: '/' } },
  { eventName: 'click', params: { id: 'upload-button' } },
]);
```

> 埋点失败不会中断业务逻辑，只会在控制台打印告警。

---

### 六、积分：`sdk.api.credit`

单个 API 的积分消耗查询：

```ts
const res = await sdk.api.credit.getCreditConsumption({
  apiName: 'image.generate',
  params: { model: 'v1' },
});

console.log(res.consumption, res.unit);
```

批量查询：

```ts
const list = await sdk.api.credit.getCreditConsumptions(
  ['image.generate', 'image.enhance'],
);
```

> 具体可用的 `apiName` 及计费规则请参考后端/平台文档。

---

### 七、用户信息：`sdk.api.user`

获取当前登录用户：

```ts
const user = await sdk.api.user.getUserInfo();
// user: { name, userEmail?, avatar?, permissionList?, ... }
```

默认调用路径为 `/basics/api/v1/permission/user/info`，可以通过配置 `userInfoEndpoint` 覆盖。

---

### 八、图片信息：`sdk.api.image`

获取图片详情：

```ts
const info = await sdk.api.image.getImageInfo('12345');
// info: { id, url, width, height, size, format, createdAt, updatedAt, ... }
```

删除图片：

```ts
await sdk.api.image.deleteImage('12345');
```

---

### 九、鉴权：`sdk.auth`

检查是否已登录：

```ts
const sdk = useSDK();
if (!sdk.auth.isAuthenticated()) {
  // 视业务需要，可触发平台登录
}
```

iframe 模式下自动向父窗口请求 token：

```ts
try {
  await sdk.auth.login();
} catch (e) {
  console.error('登录失败', e);
}
```

登出：

```ts
await sdk.auth.logout();
```

获取当前用户（基于 token）：

```ts
const user = await sdk.auth.getCurrentUser();
```

---

### 十、常用工具：`validateImage` / Logger / Validator

直接使用图片校验方法：

```ts
import { validateImage } from '@fuxi/danqing-sdk';

const result = await validateImage(fileOrUrl, {
  allowedFormatList: ['jpg', 'jpeg', 'png'],
  limitSize: 5,
  widthRange: [512, 4096],
  heightRange: [512, 4096],
});

if (!result.valid) {
  console.error(result.error);
}
```

日志工具和简单校验工具：

```ts
const sdk = useSDK();

sdk.utils.logger.info('页面打开', { path: location.pathname });

const isEmail = sdk.utils.validator.isEmail('foo@bar.com');
const isUrl = sdk.utils.validator.isUrl('https://example.com');
```

