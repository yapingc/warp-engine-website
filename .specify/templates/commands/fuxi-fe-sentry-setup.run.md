---
description: 在 React + Vite 项目中配置自部署 Sentry 错误监控，包括依赖安装、Vite 插件配置、TypeScript 类型声明和 Sentry 初始化。
---

## 用户输入

```text
$ARGUMENTS
```

用户输入（如果有）应包含在 https://sentry.fuxi.netease.com/ 创建项目后获取的 DSN 链接。

## 前置条件

- 项目必须使用 React + Vite 作为技术栈。
- 用户需要先在 https://sentry.fuxi.netease.com/ 创建项目并获取 DSN 链接。
- 确认项目使用的包管理工具（npm、yarn、pnpm）。

## 目标

在 React + Vite 项目中完整配置自部署的 Sentry 错误监控系统，实现：
- 错误自动上报
- Source Map 自动上传
- 版本追踪
- 环境区分

## 执行步骤

### 1) 获取 Sentry DSN

**检查用户输入：**
- 从用户输入中提取 DSN 链接
- DSN 格式示例：`https://xxxxxxx@sentry.fuxi.netease.com/xxx`
- 如果用户未提供 DSN，**必须**询问用户提供

**如果用户未提供 DSN，提示：**
```
请先在 https://sentry.fuxi.netease.com/ 创建项目，获取 DSN 链接后再运行此命令。
DSN 格式示例：https://1428e05d70fb436794b087880ee01629@sentry.fuxi.netease.com/3
```

### 2) 环境检测

- 检测项目根目录是否存在 `package.json`。
- **确认是 Vite 项目**：
  - 检查是否存在 `vite.config.ts`、`vite.config.js` 或 `vite.config.mts`
  - 检查 `package.json` 中是否有 `vite` 依赖
  - 如果不是 Vite 项目，提示用户此指令仅支持 Vite 项目
- 识别当前使用的包管理工具：
  - 检查是否存在 `pnpm-lock.yaml` → 使用 pnpm
  - 检查是否存在 `yarn.lock` → 使用 yarn
  - 检查是否存在 `package-lock.json` → 使用 npm
  - 都不存在时默认使用 npm
- 读取 `package.json` 获取项目名称（`name` 字段）和版本号（`version` 字段）。
- 检测是否为 Monorepo 项目，如果是，确认目标子包路径。

### 3) 确保私服配置

在开始安装任何依赖之前，必须先确保项目根目录的 `.npmrc` 文件配置了正确的私服地址。

**检查和配置步骤：**

1. 检查项目根目录是否存在 `.npmrc` 文件
2. 如果文件不存在，创建新的 `.npmrc` 文件
3. 如果文件存在，检查 registry 配置是否正确
4. 确保包含以下私服配置内容：

```ini
strict-peer-dependencies=false
package-lock = false
registry=http://apps-hp.danlu.netease.com:41842/repository/npm-group-prod/
always-auth=true
//apps-hp.danlu.netease.com:41842/repository/npm-group-prod/:_authToken="${NPM_TOKEN}"
//apps-hp.danlu.netease.com:41842/repository/npm-hosted-prod/:_authToken="${NPM_HOSTED_TOKEN}"
sass_binary_site=https://npm.taobao.org/mirrors/node-sass/
phantomjs_cdnurl=https://npm.taobao.org/mirrors/phantomjs
electron_mirror=https://npm.taobao.org/mirrors/electron/
```

### 4) 安装依赖

根据检测到的包管理工具安装 Sentry 相关依赖：

```bash
# npm
npm install @sentry/react@^7.24.2 @sentry/vite-plugin@^0.7.2

# yarn
yarn add @sentry/react@^7.24.2 @sentry/vite-plugin@^0.7.2

# pnpm
pnpm add @sentry/react@^7.24.2 @sentry/vite-plugin@^0.7.2
```

**对于 Monorepo 项目：**

```bash
# pnpm workspace
pnpm add @sentry/react@^7.24.2 @sentry/vite-plugin@^0.7.2 --filter <target-package>

# yarn workspace
yarn workspace <target-package> add @sentry/react@^7.24.2 @sentry/vite-plugin@^0.7.2

# npm workspace
npm install @sentry/react@^7.24.2 @sentry/vite-plugin@^0.7.2 --workspace=<target-package>
```

### 5) 配置 vite.config.ts

在 `vite.config.ts`（或 `vite.config.mts`）中添加 Sentry Vite 插件和全局版本变量。

**需要添加的配置：**

1. 在文件顶部添加导入：
```typescript
import { sentryVitePlugin } from '@sentry/vite-plugin';
import packageJson from './package.json';
```

2. 在 `plugins` 数组中添加 `sentryVitePlugin`：
```typescript
sentryVitePlugin({
  url: 'https://sentry.fuxi.netease.com/',
  org: 'fuxi',
  project: '<项目名称>', // 使用 package.json 的 name 字段
  include: './dist',
  release: packageJson.version,
  urlPrefix: '~/<base 路径>/', // 根据项目的 base 配置决定
}),
```

3. 在 `define` 配置中添加全局版本变量：
```typescript
define: {
  __WEB_VERSION__: `"${packageJson.version}"`,
},
```

**完整配置示例：**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import packageJson from './package.json';

export default defineConfig(({ mode }) => {
  return {
    base: '/', // 根据实际项目配置
    plugins: [
      react(),
      sentryVitePlugin({
        url: 'https://sentry.fuxi.netease.com/',
        org: 'fuxi',
        project: packageJson.name, // 或自定义项目名称
        include: './dist',
        release: packageJson.version,
        urlPrefix: '~/', // 根据 base 配置调整，如 base 为 '/mark/'，则为 '~/mark/'
      }),
    ],
    define: {
      __WEB_VERSION__: `"${packageJson.version}"`,
    },
    build: {
      sourcemap: true, // 确保生成 sourcemap
    },
  };
});
```

**实施注意：**
- 根据项目的 `base` 配置决定 `urlPrefix`，规则为 `~/<base值>/`
- 如果 `base: '/'`，则 `urlPrefix: '~/'`
- 如果 `base: '/mark/'`，则 `urlPrefix: '~/mark/'`
- 确保 `build.sourcemap` 设置为 `true`，否则无法上传 sourcemap
- 保持现有的插件配置不变，将 sentryVitePlugin 添加到 plugins 数组末尾

### 6) 配置 TypeScript 类型声明

确保全局声明的 `__WEB_VERSION__` 变量有正确的类型定义。

**检查和创建 global.d.ts：**

1. 检查项目中是否存在 `global.d.ts`、`src/global.d.ts` 或类似的全局类型声明文件
2. 如果不存在，在项目根目录创建 `global.d.ts`

**global.d.ts 内容：**

```typescript
declare const __WEB_VERSION__: string;
```

**如果文件已存在：**
- 检查是否已包含 `__WEB_VERSION__` 声明
- 如果没有，在文件末尾添加声明

**确保 tsconfig.json 引用了类型声明文件：**

检查 `tsconfig.json` 的 `include` 字段是否包含类型声明文件路径：

```json
{
  "compilerOptions": {
    // ...
  },
  "include": [
    "src",
    "global.d.ts" // 确保包含
  ]
}
```

### 7) 创建 Sentry 初始化工具函数

在项目的公共 utils 目录中创建 Sentry 初始化函数。

**定位 utils 目录：**
- 常见路径：`src/utils/`、`src/lib/`、`src/helpers/`
- 如果不存在，在 `src/utils/` 下创建

**创建 sentry.ts 文件：**

```typescript
// src/utils/sentry.ts
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/browser';

/**
 * 初始化 Sentry 错误监控
 *
 * 在生产环境下启用采样率控制，降低上报量
 *
 * @param envPrefix - 环境前缀，用于区分不同渠道/产品
 */
const initSentry = (envPrefix: string) =>
  Sentry.init({
    dsn: '<用户提供的 DSN>',
    release: envPrefix + '_' + __WEB_VERSION__,
    environment: envPrefix + '_' + (window.EEVEE_ENV || 'local'),
    initialScope: {
      tags: { channel: envPrefix },
    },
    ...(window.EEVEE_ENV === 'prod'
      ? {
          sampleRate: 0.4,
          tracesSampleRate: 0.4,
          integrations: [new BrowserTracing()],
        }
      : null),
  });

export default initSentry;
```

**注意：** 将 `<用户提供的DSN>` 替换为用户实际提供的 DSN 链接。

### 8) 补充 window.EEVEE_ENV 类型声明

在 `global.d.ts` 中补充 `window.EEVEE_ENV` 的类型声明：

```typescript
declare const __WEB_VERSION__: string;

interface Window {
  EEVEE_ENV?: 'local' | 'dev' | 'test' | 'prod';
}
```

### 9) 在项目入口初始化 Sentry

在项目入口文件中调用 Sentry 初始化函数。

**定位入口文件：**
- 常见路径：`src/index.tsx`、`src/main.tsx`、`src/App.tsx`

**在入口文件顶部添加初始化代码：**

```typescript
// src/index.tsx 或 src/main.tsx
import initSentry from './utils/sentry';

// 初始化 Sentry，传入环境前缀
initSentry('<项目前缀>');

// ... 其他代码
```

**环境前缀说明：**
- 用于区分不同的产品或渠道
- 示例：`'zhongbao'`、`'mark'`、`'youling'`
- 建议使用项目名称或产品标识

### 10) 配置丹炉环境变量

**重要提醒：** 用户需要在丹炉平台配置 `EEVEE_ENV` 环境变量。

**告知用户：**

```markdown
## 丹炉环境变量配置

请在丹炉平台为不同环境配置 `EEVEE_ENV` 环境变量：

| 环境     | EEVEE_ENV 值 |
| -------- | ------------ |
| 开发环境 | dev          |
| 测试环境 | test         |
| 生产环境 | prod         |

配置路径：丹炉控制台 → 应用管理 → 环境变量 → 添加 EEVEE_ENV
```

### 11) 配置 .dockerignore 排除 sourcemap 文件

为防止 sourcemap 文件被打包到 Docker 镜像中部署到线上，需要在 `.dockerignore` 文件中添加排除规则。

**检查和配置步骤：**

1. 检查项目根目录是否存在 `.dockerignore` 文件
2. 如果文件不存在，创建新的 `.dockerignore` 文件
3. 如果文件已存在，检查是否已包含 `**/*.map` 规则

**创建或更新 .dockerignore：**

如果文件不存在，创建 `.dockerignore` 并写入以下内容：

```
# Node modules
node_modules

# Source maps - 不应部署到生产环境
**/*.map
```

如果文件已存在，在文件末尾添加：

```
# Source maps - 不应部署到生产环境
**/*.map
```

**重要性说明：**
- Sourcemap 文件包含原始源代码信息，部署到线上会有安全风险
- Sentry 插件会在构建时自动上传 sourcemap 到 Sentry 服务器
- 通过 `.dockerignore` 排除可确保 sourcemap 不会被打包到 Docker 镜像中

### 12) 验证配置

- 运行项目开发服务器，确认没有编译错误
- 检查控制台是否有 Sentry 初始化相关输出
- 运行 `pnpm build`（或对应的构建命令），确认：
  - 构建成功
  - 生成了 sourcemap 文件
  - Sentry 插件成功上传了 sourcemap（构建日志中会有相关输出）

### 13) 输出配置报告

**报告示例：**

```markdown
## Sentry 配置完成

### 环境信息
- 构建工具：Vite
- 包管理工具：pnpm
- 项目名称：<项目名称>
- 项目版本：<版本号>

### 已完成操作

#### 1. 私服配置
- ✅ 检查并配置 .npmrc 文件

#### 2. 安装依赖
- ✅ @sentry/react@^7.24.2
- ✅ @sentry/vite-plugin@^0.7.2

#### 3. Vite 配置
- ✅ 添加 sentryVitePlugin 插件
- ✅ 配置 __WEB_VERSION__ 全局变量
- ✅ 启用 sourcemap 生成

#### 4. TypeScript 类型
- ✅ 创建/更新 global.d.ts
- ✅ 添加 __WEB_VERSION__ 类型声明
- ✅ 添加 window.EEVEE_ENV 类型声明

#### 5. Sentry 初始化
- ✅ 创建 src/utils/sentry.ts
- ✅ 在入口文件中初始化 Sentry

#### 6. Docker 配置
- ✅ 创建/更新 .dockerignore 排除 sourcemap 文件

### 修改文件列表
- `.npmrc` - 私服配置（如需要）
- `.dockerignore` - 排除 sourcemap 文件
- `vite.config.ts` - 添加 Sentry 插件和版本变量
- `global.d.ts` - 添加类型声明
- `tsconfig.json` - 确保引用类型声明文件
- `src/utils/sentry.ts` - 新建 Sentry 初始化工具
- `src/index.tsx` - 添加 Sentry 初始化调用

### Sentry 配置信息
- Sentry 平台：https://sentry.fuxi.netease.com/
- 组织：fuxi
- 项目：<项目名称>
- DSN：<用户提供的 DSN>

### ⚠️ 待办事项

**请在丹炉平台配置环境变量：**

| 环境     | EEVEE_ENV 值 |
| -------- | ------------ |
| 开发环境 | dev          |
| 测试环境 | test         |
| 生产环境 | prod         |

### 下一步
1. 在丹炉平台配置 `EEVEE_ENV` 环境变量
2. 运行 `pnpm build` 验证 sourcemap 上传
3. 部署到测试环境验证错误上报
4. 在 https://sentry.fuxi.netease.com/ 查看错误信息

### 使用示例

```typescript
// 手动上报错误
import * as Sentry from '@sentry/react';

try {
  // 可能出错的代码
} catch (error) {
  Sentry.captureException(error);
}

// 添加上下文信息
Sentry.setUser({ id: 'user123', email: 'user@example.com' });
Sentry.setTag('feature', 'checkout');
```

### 注意事项
- 确保生产环境构建时 `sourcemap: true` 已启用
- sourcemap 文件会自动上传到 Sentry，不会部署到线上
- 本地开发时 `EEVEE_ENV` 默认为 `undefined`，会使用 `'local'` 作为环境标识
- 生产环境下采样率为 40%，避免上报量过大
