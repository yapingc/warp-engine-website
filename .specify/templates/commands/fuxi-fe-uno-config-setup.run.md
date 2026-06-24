---
description: 在项目中配置和安装 fuxi-uno-config，支持 Vite 和 Next.js 两种构建工具，包括依赖安装、构建工具配置（Vite 插件或 PostCSS）、UnoCSS 配置文件创建以及样式引入。
---

## 用户输入

```text
$ARGUMENTS
```

用户输入（如果有）可指定目标项目路径、特殊配置需求或其他约束。

## 前置条件

- 项目必须使用 Vite 或 Next.js 作为构建工具。
- 确认项目使用的包管理工具（npm、yarn、pnpm）。
- 如果是 Monorepo 项目，需确认目标子包/应用路径。

## 目标

在项目中完整配置 `@fuxi/uno-config`，使其能够正常使用 UnoCSS 原子化 CSS 框架，并确保 VSCode 插件能够识别内置规则以支持自动补全。

## 执行步骤

### 1) 确保私服配置

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

**配置逻辑：**

- 如果 `.npmrc` 不存在 → 直接创建并写入上述内容
- 如果 `.npmrc` 已存在：
  - 检查 `registry` 字段是否为 `http://apps-hp.danlu.netease.com:41842/repository/npm-group-prod/`
  - 如果 registry 不匹配 → 备份原文件为 `.npmrc.backup`，然后写入新配置
  - 如果 registry 已正确配置 → 跳过此步骤
- 对于 Monorepo 项目，只需要在根目录配置 `.npmrc` 即可

**注意事项：**
- `.npmrc` 配置是全局生效的，所有包管理器（npm、yarn、pnpm）都会读取此配置
- 私服配置确保从正确的镜像源安装 `@fuxi/*` 系列包
- 备份原配置文件避免覆盖用户的自定义配置

### 2) 环境检测

- 检测项目根目录是否存在 `package.json`。
- **识别构建工具类型**（按优先级检测）：
  - 检查是否存在 `next.config.js`、`next.config.mjs` 或 `next.config.ts` → **Next.js 项目**
  - 检查 `package.json` 的 `dependencies` 或 `devDependencies` 中是否有 `next` → **Next.js 项目**
  - 检查是否存在 `vite.config.ts`、`vite.config.js` 或 `vite.config.mjs` → **Vite 项目**
  - 检查 `package.json` 中是否有 `vite` 依赖 → **Vite 项目**
  - 如果都不存在，提示用户项目类型无法识别，需要手动指定
- 识别当前使用的包管理工具：
  - 检查是否存在 `pnpm-lock.yaml` → 使用 pnpm
  - 检查是否存在 `yarn.lock` → 使用 yarn
  - 检查是否存在 `package-lock.json` → 使用 npm
  - 都不存在时默认使用 npm
- 检测是否为 Monorepo 项目：
  - 检查根目录 `package.json` 中是否有 `workspaces` 字段
  - 检查是否存在 `pnpm-workspace.yaml` 文件
  - 检查是否存在 `lerna.json` 文件
- 如果是 Monorepo，确认目标子包路径（从用户输入或提示用户选择）。

### 3) 安装依赖

根据检测到的构建工具类型和包管理工具执行相应的安装命令：

#### Vite 项目 - 普通项目

```bash
# npm
npm install unocss @fuxi/uno-config

# yarn
yarn add unocss @fuxi/uno-config

# pnpm
pnpm add unocss @fuxi/uno-config
```

#### Next.js 项目 - 普通项目

Next.js 项目使用 PostCSS 方式集成 UnoCSS：

```bash
# npm
npm install @unocss/postcss @fuxi/uno-config

# yarn
yarn add @unocss/postcss @fuxi/uno-config

# pnpm
pnpm add @unocss/postcss @fuxi/uno-config
```

#### Vite 项目 - Monorepo 项目

对于 Monorepo 项目，需要在目标子包中安装依赖：

```bash
# pnpm workspace
pnpm add unocss @fuxi/uno-config --filter <target-package>

# yarn workspace
yarn workspace <target-package> add unocss @fuxi/uno-config

# npm workspace (npm 7+)
npm install unocss @fuxi/uno-config --workspace=<target-package>

# lerna
lerna add unocss --scope=<target-package>
lerna add @fuxi/uno-config --scope=<target-package>
```

#### Next.js 项目 - Monorepo 项目

对于 Next.js Monorepo 项目，使用 PostCSS 方式：

```bash
# pnpm workspace
pnpm add @unocss/postcss @fuxi/uno-config --filter <target-package>

# yarn workspace
yarn workspace <target-package> add @unocss/postcss @fuxi/uno-config

# npm workspace (npm 7+)
npm install @unocss/postcss @fuxi/uno-config --workspace=<target-package>

# lerna
lerna add @unocss/postcss --scope=<target-package>
lerna add @fuxi/uno-config --scope=<target-package>
```

**注意事项：**
- `<target-package>` 替换为实际的包名（package.json 中的 name 字段）
- 如果依赖需要在多个子包中共享，考虑安装到根目录或使用共享依赖方式
- 对于 pnpm，如果需要在根目录安装，使用 `-w` 参数：
  - Vite: `pnpm add -w unocss @fuxi/uno-config`
  - Next.js: `pnpm add -w @unocss/postcss @fuxi/uno-config`

### 4) 构建工具配置

根据检测到的构建工具类型执行不同的配置步骤：

#### 4.1) Vite 项目配置

在目标项目的 `vite.config.ts` 中添加 UnoCSS 插件：

- 定位 `vite.config.ts` 文件（如果不存在，提示用户项目可能不是 Vite 项目）。
- 在文件顶部导入 UnoCSS：
  ```typescript
  import Unocss from 'unocss/vite';
  ```
- 在 `plugins` 数组中添加 `Unocss({})`：
  ```typescript
  export default defineConfig({
    plugins: [
      react(), // 或其他框架插件
      Unocss({}),
      // ... 其他插件
    ]
  })
  ```

**实施注意：**
- 如果已存在 `Unocss` 导入和配置，跳过此步骤并提示用户。
- 保持现有代码格式和注释。
- 确保 `Unocss({})` 插件的顺序合理（建议放在框架插件之后）。

#### 4.2) Next.js 项目配置

Next.js 项目需要配置 PostCSS 来集成 UnoCSS：

##### 配置 postcss.config.js

在项目根目录（或目标子包根目录）创建或修改 `postcss.config.js`（或 `postcss.config.mjs`）：

```javascript
// postcss.config.js
module.exports = {
  plugins: {
    '@unocss/postcss': {},
    // ... 其他 PostCSS 插件（如 autoprefixer）
  }
}
```

或使用 ES Module 格式：

```javascript
// postcss.config.mjs
export default {
  plugins: {
    '@unocss/postcss': {},
    // ... 其他 PostCSS 插件
  }
}
```

**实施注意：**
- 如果 `postcss.config.js` 已存在，在 `plugins` 对象中添加 `'@unocss/postcss': {}`
- 保持现有的 PostCSS 插件配置不变
- 建议将 `@unocss/postcss` 放在插件列表的前面

##### 可选：配置 next.config.js

如果需要自定义配置，可以在 `next.config.js` 中添加：

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... 其他配置
  webpack: (config) => {
    config.cache = false; // 如果遇到样式更新问题，可以禁用缓存
    return config;
  }
}

module.exports = nextConfig
```

**注意：** 大多数情况下不需要修改 `next.config.js`，PostCSS 配置即可。

### 5) 创建 UnoCSS 配置文件

在项目根目录（或 Monorepo 子包根目录）创建 `uno.config.ts`：

```typescript
// uno.config.ts
import { getFuxiBaseConfig } from '@fuxi/uno-config';

export default getFuxiBaseConfig();
```

**目的：**
- 让 [VSCode UnoCSS 插件](https://marketplace.visualstudio.com/items?itemName=antfu.unocss) 能够识别内置的规则。
- 支持编辑器中的自动补全和规则提示。

### 6) 引入样式文件

根据构建工具类型，使用不同的样式引入方式：

#### 6.1) Vite 项目样式引入

在项目入口文件中引入必要的 CSS 文件：

- 定位项目入口文件（常见路径：`src/main.tsx`、`src/main.ts`、`src/index.tsx`、`src/App.tsx`）。
- 在文件顶部添加以下导入语句：
  ```typescript
  import 'uno.css';
  import '@fuxi/uno-config/dist/styles/variables.css';
  ```

**实施注意：**
- 如果已存在这些导入，跳过此步骤。
- 确保导入语句在其他样式导入之前或之后的合理位置。
- 对于多入口应用，确认是否需要在每个入口都添加。

#### 6.2) Next.js 项目样式引入

在 Next.js 项目的全局样式文件中引入 variables.css：

- 定位全局样式文件（常见路径：`app/globals.css`、`styles/globals.css`）
- 在文件顶部添加导入语句：

```css
/* globals.css */
@import '@fuxi/uno-config/dist/styles/variables.css';

/* 其他全局样式 */
```

**实施注意：**
- Next.js 使用 PostCSS 集成时，UnoCSS 样式会自动注入，**无需**手动导入 `uno.css`
- 只需要在全局 CSS 文件中导入 `variables.css` 即可使用预定义的 CSS 变量
- 确保全局样式文件已在应用入口（`app/layout.tsx` 或 `pages/_app.tsx`）中正确导入
- 如果全局样式文件尚未在入口导入，需要添加 `import './globals.css'` 或类似语句

### 7) 验证配置

- 建议用户安装 [UnoCSS VSCode 插件](https://marketplace.visualstudio.com/items?itemName=antfu.unocss)。
- 提示用户重启 VSCode 以使插件生效。
- 在代码中尝试使用 UnoCSS 类名（如 `className="text-red-500 p-4"`）验证是否有自动补全。
- 运行项目开发服务器，检查样式是否正确应用。

### 8) 输出安装报告

生成配置完成报告，包括：
- 检测到的构建工具类型、包管理工具和项目类型
- 已安装的依赖版本
- 修改的文件列表及修改内容摘要
- 配置验证建议
- 下一步操作提示（如安装 VSCode 插件、重启编辑器等）

#### Vite 项目报告示例

```markdown
## fuxi-uno-config 配置完成

### 环境信息
- 构建工具：Vite
- 包管理工具：pnpm
- 项目类型：Monorepo
- 目标包：@myapp/web

### 已完成操作
0. ✅ 私服配置：检查并配置 .npmrc 文件
1. ✅ 安装依赖：unocss@x.x.x, @fuxi/uno-config@x.x.x
2. ✅ 配置 vite.config.ts
3. ✅ 创建 uno.config.ts
4. ✅ 在 src/main.tsx 中引入样式

### 修改文件
- vite.config.ts: 添加 Unocss 插件
- uno.config.ts: 新建配置文件
- src/main.tsx: 引入 uno.css 和 variables.css

### 下一步
1. 安装 VSCode 插件：https://marketplace.visualstudio.com/items?itemName=antfu.unocss
2. 重启 VSCode 以启用插件
3. 运行 `pnpm dev` 启动开发服务器
4. 在代码中尝试使用 UnoCSS 类名验证配置

### 使用示例
\`\`\`tsx
// 在 React 组件中使用
<div className="flex items-center justify-center p-4 bg-blue-500 text-white">
  Hello UnoCSS!
</div>
\`\`\`
```

#### Next.js 项目报告示例

```markdown
## fuxi-uno-config 配置完成

### 环境信息
- 构建工具：Next.js
- 包管理工具：pnpm
- 项目类型：普通项目

### 已完成操作
0. ✅ 私服配置：检查并配置 .npmrc 文件
1. ✅ 安装依赖：@unocss/postcss@x.x.x, @fuxi/uno-config@x.x.x
2. ✅ 配置 postcss.config.js
3. ✅ 创建 uno.config.ts
4. ✅ 在 globals.css 中引入样式

### 修改文件
- postcss.config.js: 添加 @unocss/postcss 插件
- uno.config.ts: 新建配置文件
- app/globals.css (或 styles/globals.css): 引入 variables.css

### 下一步
1. 安装 VSCode 插件：https://marketplace.visualstudio.com/items?itemName=antfu.unocss
2. 重启 VSCode 以启用插件
3. 运行 `pnpm dev` 启动开发服务器
4. 在代码中尝试使用 UnoCSS 类名验证配置

### 使用示例
\`\`\`tsx
// 在 Next.js 组件中使用
export default function Home() {
  return (
    <div className="flex items-center justify-center p-4 bg-blue-500 text-white">
      Hello UnoCSS with Next.js!
    </div>
  )
}
\`\`\`

### 注意事项
- Next.js 使用 PostCSS 集成，样式会在构建时自动生成
- 确保 postcss.config.js 配置正确
- 如果样式未生效，尝试清除 .next 缓存目录并重启开发服务器
```

## 注意事项

### 通用注意事项
- 确保项目使用的是 Vite 或 Next.js 构建工具，其他构建工具（如单独的 Webpack）需要不同的配置方式。
- 对于 Monorepo 项目，务必明确目标子包，避免在错误的位置安装依赖。
- 如果项目已有其他 CSS 方案（如 Tailwind CSS），需要评估兼容性或迁移策略。
- 配置完成后建议清除构建缓存，确保新配置生效。
- 根目录的 `uno.config.ts` 主要用于编辑器支持。

### Vite 项目特殊注意
- 实际编译配置在 `vite.config.ts` 中的 `Unocss({})` 参数。
- Vite 项目需要手动在入口文件中导入 `uno.css`。
- 确保 UnoCSS 插件在 Vite 配置中的位置合理。

### Next.js 项目特殊注意
- Next.js 使用 PostCSS 方式集成，通过 `@unocss/postcss` 插件。
- **不需要**手动导入 `uno.css`，样式会自动注入。
- 只需要在全局样式文件（如 `globals.css`）中使用 `@import` 导入 `variables.css`。
- PostCSS 配置文件（`postcss.config.js`）是关键，确保配置正确。
- 确保全局样式文件已在应用入口文件（`app/layout.tsx` 或 `pages/_app.tsx`）中导入。
- 遇到样式问题时，尝试：
  - 删除 `.next` 缓存目录
  - 重启开发服务器
  - 检查 PostCSS 配置是否正确加载
- Next.js 14+ 默认使用 Turbopack，可能需要额外配置或回退到 Webpack 模式（`next dev --turbo=false`）。

## 错误处理

### 通用错误处理
- 如果无法识别构建工具类型，提示用户手动指定（Vite 或 Next.js）。
- 如果安装依赖失败，提供详细的错误信息和可能的解决方案（网络问题、权限问题、包管理器版本等）。
- 对于 Monorepo 项目，如果无法自动确定目标包，交互式提示用户选择。

### Vite 项目错误处理
- 如果检测不到 `vite.config.ts`，提示用户项目可能不是 Vite 项目或配置文件位置不标准。
- 如果无法确定入口文件，列出可能的路径（`src/main.tsx`、`src/main.ts`、`src/index.tsx`）让用户选择或手动指定。
- 如果 Vite 配置文件解析失败，提供手动配置指引。

### Next.js 项目错误处理
- 如果检测不到 Next.js 配置文件，但 package.json 中有 `next` 依赖，提示可能是非标准项目结构。
- 如果 `postcss.config.js` 已存在但格式不兼容（如使用了复杂的函数式配置），提示用户手动合并配置。
- 如果无法定位全局样式文件：
  - 检查常见路径：`app/globals.css`、`styles/globals.css`、`src/styles/globals.css`
  - 如果找不到，提示用户手动指定全局样式文件路径
  - 确认全局样式文件已在入口文件中导入
- 如果样式未生效：
  - 检查 PostCSS 配置是否正确加载
  - 检查全局样式文件是否正确导入 variables.css
  - 检查全局样式文件是否在应用入口中导入
  - 提示清除 `.next` 缓存并重启
- 对于 Turbopack 相关问题，提供回退到 Webpack 的说明。

### 常见问题排查
1. **依赖安装失败**：
   - 检查网络连接
   - 尝试清除包管理器缓存（`npm cache clean --force`、`pnpm store prune`、`yarn cache clean`）
   - 检查 Node.js 版本兼容性

2. **配置文件修改失败**：
   - 检查文件是否被占用或只读
   - 确认有足够的文件系统权限
   - 备份现有配置后重试

3. **样式不生效**：
   - Vite：检查是否正确导入 `uno.css`
   - Next.js：检查 PostCSS 配置和全局样式导入
   - 清除构建缓存后重试
   - 检查浏览器开发者工具确认样式是否被加载

4. **编辑器自动补全不工作**：
   - 确认已安装 UnoCSS VSCode 插件
   - 检查 `uno.config.ts` 文件是否存在且位置正确
   - 重启 VSCode
   - 检查 VSCode 输出面板中的 UnoCSS 插件日志

