## 公共组件使用说明（@fuxi/danqing-components）

本项目模板已经预装并配置了 **`@fuxi/danqing-components`**，主要包含以下对外组件：

- `Header`
- `ImageUpload`
- `AutoProgress`

> 提示：本文件是从内部文档裁剪后生成的「项目内使用指南」，如果需要查看完整的组件说明，请参考主仓库 `packages/common/docs/usage.md`。

---

### 安装与引入

模板项目的 `package.json` 已经包含：

```json
{
  "dependencies": {
    "@fuxi/danqing-components": "latest"
  }
}
```

直接在代码中引入即可：

```tsx
import { Header, ImageUpload } from '@fuxi/danqing-components';
import AutoProgress from '@fuxi/danqing-components/dist/AutoProgress';
```

---

### Header

顶部通用导航栏组件，适合嵌在 iframe 应用顶部。

#### 示例

```tsx
import { Header } from '@fuxi/danqing-components';

export function LayoutHeader() {
  return (
    <Header
      logo="我的外部服务"
      userInfo={{
        name: '张三',
        userEmail: 'zhangsan@example.com',
        avatar: 'https://example.com/avatar.png',
      }}
      isLoading={false}
      onLoginClick={() => {
        // 打开登录页 / 触发平台统一登录
      }}
    />
  );
}
```

#### Props：`HeaderProps`

- **`logo?: string`**
  - 左侧 Logo 文本，默认 `"我的应用"`。
- **`userInfo?: { name: string; userEmail?: string; avatar?: string; [key: string]: any }`**
  - 当前登录用户信息：
    - `name`：用户姓名（必填）。
    - `userEmail?`：用户邮箱（可选）。
    - `avatar?`：头像 URL（可选）。
  - 存在时显示头像 + 名称 + 只读下拉信息；不存在时显示“请登录”按钮。
- **`isLoading?: boolean`**
  - 是否处于“加载中”状态。
  - 为 `true` 时只显示「加载中…」，不展示用户信息/登录按钮。
- **`onLoginClick?: () => void`**
  - 未登录时，“请登录”按钮的点击回调。
  - 未提供时默认刷新页面。

---

### ImageUpload

用于支持拖拽/点击上传图片、查看上传历史，并对图片尺寸/大小/格式进行校验。

#### 基础示例（结合 SDK 历史记录）

```tsx
import { ImageUpload } from '@fuxi/danqing-components';
import { useSDK } from '../config/sdk';

export function UploadSection() {
  const sdk = useSDK();

  return (
    <ImageUpload
      sdk={sdk}
      enableHistory
      limitOptions={{
        maxFileNum: 9,
        limitSizeMB: 10,
        allowedFormatList: ['jpg', 'jpeg', 'png', 'webp'],
        widthRange: [512, 4096],
        heightRange: [512, 4096],
        minRatio: 0.5,
        maxRatio: 2,
      }}
      onChange={(urls) => {
        console.log('当前图片 URL 列表: ', urls);
      }}
    />
  );
}
```

#### 仅使用本地历史图片示例

```tsx
import { ImageUpload } from '@fuxi/danqing-components';

const historyImages = [
  'https://example.com/image1.png',
  'https://example.com/image2.png',
];

export function LocalHistoryUpload() {
  return (
    <ImageUpload
      enableHistory
      historyImages={historyImages}
      historyMaxSelect={5}
      limitOptions={{
        limitSizeMB: 5,
      }}
    />
  );
}
```

#### 类型与 Props（关键字段）

**受控值：**

- **`value?: string | string[]`**
  - 当前图片 URL 列表（单选/多选均支持）。
- **`onChange?: (urls: string[]) => void`**
  - 图片列表变化回调。

**图片限制：**

- **`limitOptions?: ImageLimitOptions`**
  - `maxFileNum?: number`：最大上传数量（默认 9）。
  - `limitSizeMB?: number`：单张大小上限（MB，默认 20）。
  - `limitType?: string[]`：允许的 MIME types，如 `['image/jpeg','image/png']`。
  - `allowedFormatList?: string[]`：允许的扩展名，如 `['jpg','jpeg','png','webp']`。
  - `widthRange?: [number?, number?]`：宽度范围（px）。
  - `heightRange?: [number?, number?]`：高度范围（px）。
  - `minRatio?: number` / `maxRatio?: number`：宽高比范围。

**历史图片相关：**

- **`enableHistory?: boolean`**
  - 是否启用 “上传历史” 功能，默认 `true`。
- **`historyImages?: string[]`**
  - 本地静态历史图片 URL 列表（未传 `sdk` 时使用）。
- **`historyMaxSelect?: number`**
  - 历史区域单次最大可选数量。
- **`historyEmptyImg?: string`**
  - 历史为空时的占位图。
- **`sdk?: any`**
  - 推荐传入 `DanqingSDK` 实例：
    - 自动调用 `sdk.api.history.getUploadHistory` 获取历史列表；
    - 调用 `sdk.api.history.deleteHistoryImage` 删除历史图片。

**交互与展示：**

- **`enablePaste?: boolean`**
  - 是否开启“在组件上粘贴图片上传”的功能，默认 `true`。
- **`width?: string | number`**
  - 组件宽度，默认 `'100%'`。
- **`uploadDraggerProps?: React.ComponentProps<typeof import('@fuxi/eevee-ui').Upload.Dragger>`**
  - 透传给底层 `Upload.Dragger` 的所有 props。

组件内部使用 `@fuxi/danqing-sdk` 的 `validateImage` 做图片校验，超过限制时会在卡片上显示“上传失败”状态。

---

### AutoProgress

根据时间自动推进的进度条组件，常用于无法实时获取进度的「排队/处理」场景。

#### 示例

```tsx
import AutoProgress from '@fuxi/danqing-components/dist/AutoProgress';

export function ProcessingBar({ processing }: { processing: boolean }) {
  return (
    <AutoProgress
      isProcessing={processing}
      roughUpperLimitTime={120}
      isFinished={!processing}
      isQuickProgress={false}
      className="w-40"
      strokeColor={{
        from: '#579AFF',
        to: '#C669FF',
      }}
    />
  );
}
```

#### Props：在 `ProgressProps` 基础上的扩展

- **`roughUpperLimitTime?: number`**
  - 粗略预估完成时间上限（秒），默认 `120`，到达时进度会走到 100%。
- **`isProcessing: boolean`**
  - 是否处于“进行中”状态，控制内部定时器启停。
- **`isFinished?: boolean`**
  - 任务完成时置为 `true`，进度会立刻拉满到 100%，随后在短暂延时后归零。
- **`isQuickProgress?: boolean`**
  - 完成非常快的场景下设为 `true`，进度会更快刷新，视觉更连贯。
- 其他属性（如 `strokeColor`、`className`）直接透传给 `@fuxi/eevee-ui` 的 `Progress`。

