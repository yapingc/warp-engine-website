---
description: 在项目中配置和安装 @fuxi/eslint-config-fuxi (v2.x.x flat config)，包括移除旧依赖、安装新依赖、创建配置文件，并针对 Monorepo 项目自动收集所有 tsconfig 路径。
---

## 用户输入

```text
$ARGUMENTS
```

用户输入（如果有）可指定目标项目路径、特殊配置需求或其他约束。

## 前置条件

- 项目必须使用 TypeScript v5.x.x 或以上版本（内置的 typescript 解析器需要 v5+）。
- 确认项目使用的包管理工具（npm、yarn、pnpm）。
- 如果是 Monorepo 项目，需确认所有子包路径以收集 tsconfig 配置。

## 目标

将项目从旧的 ESLint 配置迁移到 `@fuxi/eslint-config-fuxi` v2.x.x（基于 flat config），包括清理旧依赖、安装新依赖、创建新的配置文件，并确保 Monorepo 项目正确配置所有子包的 TypeScript 配置路径。

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
- 检查 TypeScript 版本，确保为 v5.x.x 或以上：
  ```bash
  # 读取 package.json 中的 typescript 版本
  # 如果版本低于 5.0.0，警告用户需要升级
  ```
- 识别当前使用的包管理工具：
  - 检查是否存在 `pnpm-lock.yaml` → 使用 pnpm
  - 检查是否存在 `yarn.lock` → 使用 yarn  
  - 检查是否存在 `package-lock.json` → 使用 npm
  - 都不存在时默认使用 npm
- 检测是否为 Monorepo 项目：
  - 检查根目录 `package.json` 中是否有 `workspaces` 字段
  - 检查是否存在 `pnpm-workspace.yaml` 文件
  - 检查是否存在 `lerna.json` 文件
- 如果是 Monorepo，扫描并记录所有子包路径（用于后续收集 tsconfig）。

### 3) 检测并移除旧的 ESLint 依赖

扫描 `package.json` 中的 `dependencies` 和 `devDependencies`，识别需要移除的旧 ESLint 相关依赖：

**需要移除的依赖列表：**
```json
[
  "@typescript-eslint/eslint-plugin",
  "@typescript-eslint/parser",
  "eslint-config-react-app",
  "eslint-plugin-flowtype",
  "eslint-plugin-import",
  "eslint-plugin-jsx-a11y",
  "eslint-plugin-react",
  "eslint-plugin-react-func",
  "eslint-plugin-react-hooks",
  "eslint-plugin-testing-library",
  "eslint-plugin-unused-imports"
]
```

**检测逻辑：**
- 遍历 `package.json` 的依赖字段，匹配上述依赖名称。
- 列出找到的所有旧依赖及其版本。
- 询问用户确认是否移除这些依赖。

**移除命令：**

```bash
# npm
npm uninstall <dep1> <dep2> ... --save-dev

# yarn  
yarn remove <dep1> <dep2> ...

# pnpm
pnpm remove <dep1> <dep2> ...
```

**对于 Monorepo：**
- 需要在每个子包中检查并移除相应依赖
- 如果依赖安装在根目录，使用对应的 workspace 命令移除

### 4) 删除旧的 ESLint 配置文件

扫描并删除项目根目录（以及 Monorepo 子包目录）中的旧配置文件：

**需要删除的配置文件：**
- `.eslintrc`
- `.eslintrc.js`
- `.eslintrc.cjs`
- `.eslintrc.json`
- `.eslintrc.yaml`
- `.eslintrc.yml`
- `package.json` 中的 `eslintConfig` 字段（如果存在）

**实施步骤：**
1. 列出发现的所有旧配置文件。
2. 询问用户确认是否删除。
3. 删除确认的文件。
4. 如果 `package.json` 中有 `eslintConfig` 字段，提示用户并删除该字段。

### 5) 安装新依赖

根据检测到的包管理工具和项目类型安装 `@fuxi/eslint-config-fuxi`：

**普通项目：**

```bash
# npm
npm install @fuxi/eslint-config-fuxi -D

# yarn
yarn add @fuxi/eslint-config-fuxi -D

# pnpm
pnpm add @fuxi/eslint-config-fuxi -D
```

**Monorepo 项目：**

根据项目结构决定安装位置：
- 如果 ESLint 配置统一管理在根目录，安装到根目录
- 如果各子包独立配置，分别在子包中安装

```bash
# pnpm - 安装到根目录
pnpm add @fuxi/eslint-config-fuxi -D -w

# pnpm - 安装到特定子包
pnpm add @fuxi/eslint-config-fuxi -D --filter <package-name>

# yarn workspace - 安装到根目录
yarn add @fuxi/eslint-config-fuxi -D -W

# yarn workspace - 安装到特定子包
yarn workspace <package-name> add @fuxi/eslint-config-fuxi -D

# npm workspace - 安装到根目录
npm install @fuxi/eslint-config-fuxi -D -w

# lerna
lerna add @fuxi/eslint-config-fuxi --scope=<package-name> --dev
```

**注意：** 
- 确保同时确认 `eslint` 本身已安装（通常为 v8 或 v9）
- 如果 `eslint` 未安装或版本过低，一并安装/升级

### 6) 收集所有 tsconfig 路径（关键步骤）

这是 Monorepo 项目配置的核心步骤，需要自动收集所有子包的 `tsconfig.json` 路径。

**收集逻辑：**

1. 从根目录的 `tsconfig.json` 开始
2. 如果是 Monorepo，遍历所有子包目录
3. 在每个子包中查找 `tsconfig.json` 文件
4. 记录所有找到的 tsconfig 文件的相对于根目录的路径

**示例扫描路径：**
- `./tsconfig.json`（根目录）
- `./packages/app1/tsconfig.json`
- `./packages/app2/tsconfig.json`
- `./apps/web/tsconfig.json`
- `./apps/admin/tsconfig.json`

**对于 pnpm workspace：**
```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
```
需要根据 glob 模式展开并扫描每个匹配的目录。

**对于 yarn/npm workspace：**
```json
// package.json
{
  "workspaces": [
    "packages/*",
    "apps/*"
  ]
}
```
同样需要展开 glob 模式并扫描。

**收集结果示例：**
```javascript
[
  `${process.cwd()}/tsconfig.json`,
  `${process.cwd()}/packages/app1/tsconfig.json`,
  `${process.cwd()}/packages/app2/tsconfig.json`,
  `${process.cwd()}/apps/web/tsconfig.json`
]
```

### 7) 创建新的 eslint.config.cjs

在项目根目录（或 Monorepo 根目录）创建 `eslint.config.cjs` 文件。

**基础配置模板（非 Monorepo）：**

```javascript
// eslint.config.cjs
module.exports = require('@fuxi/eslint-config-fuxi/react')({
  tsconfig: [`${process.cwd()}/tsconfig.json`],
  root: process.cwd(),
  globalIgnores: [],
});
```

**Monorepo 配置模板（包含所有子包）：**

```javascript
// eslint.config.cjs
module.exports = require('@fuxi/eslint-config-fuxi/react')({
  // Monorepo 项目需要包含所有子包的 tsconfig
  tsconfig: [
    `${process.cwd()}/tsconfig.json`,
    `${process.cwd()}/packages/app1/tsconfig.json`,
    `${process.cwd()}/packages/app2/tsconfig.json`,
    `${process.cwd()}/apps/web/tsconfig.json`,
    // ... 所有子包的 tsconfig 路径
  ],
  root: process.cwd(),
  globalIgnores: [],
});
```

**配置说明：**
- `tsconfig`: 数组，包含所有需要检查的 TypeScript 配置文件路径（**Monorepo 项目必须包含所有子包**）
- `root`: 项目根目录路径
- `globalIgnores`: 可选，额外需要忽略的文件或目录

**实施注意：**
- 如果文件已存在，备份原文件为 `eslint.config.cjs.backup`
- 使用上一步收集的所有 tsconfig 路径填充配置
- 确保路径使用 `process.cwd()` 拼接，保持一致性

### 8) 扩展配置（可选）

如果项目需要自定义规则或插件，可以扩展配置：

**带自定义插件和规则的示例：**

```javascript
// eslint.config.cjs
const pluginCustom = require('eslint-plugin-custom');

module.exports = require('@fuxi/eslint-config-fuxi/react')({
  tsconfig: [
    `${process.cwd()}/tsconfig.json`,
    // ... Monorepo 所有子包的 tsconfig
  ],
  root: process.cwd(),
  plugins: {
    custom: pluginCustom,
  },
  rules: {
    'custom/some-rule': 'error',
  },
  globalIgnores: ['dist', 'build', 'coverage'],
});
```

### 9) 验证配置

- 运行 ESLint 检查，确认配置正确：
  ```bash
  # npm
  npm run lint
  # 或直接运行
  npx eslint .
  
  # yarn
  yarn lint
  # 或
  yarn eslint .
  
  # pnpm
  pnpm lint
  # 或
  pnpm eslint .
  ```

- 对于 Monorepo，确认所有子包都能正确被检查：
  ```bash
  # pnpm
  pnpm -r lint
  
  # lerna
  lerna run lint
  ```

- 如果发现错误，确认：
  - TypeScript 版本是否为 v5+
  - 所有 tsconfig 路径是否正确
  - ESLint 版本是否兼容（v8 或 v9）

### 10) 更新 package.json 脚本（可选）

如果项目中没有 `lint` 脚本，建议添加：

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  }
}
```

对于 Monorepo，可以在根目录添加：

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "lint:all": "pnpm -r lint"
  }
}
```

### 11) 输出配置报告

生成详细的配置完成报告：

**报告示例结构：**

```markdown
## @fuxi/eslint-config-fuxi 配置完成

### 环境信息
- 包管理工具：pnpm
- 项目类型：Monorepo (pnpm workspace)
- TypeScript 版本：5.3.2 ✅
- ESLint 版本：9.0.0

### 已完成操作

#### 1. 私服配置
- ✅ 检查并配置 .npmrc 文件
- ✅ 确保私服地址正确：http://apps-hp.danlu.netease.com:41842/repository/npm-group-prod/

#### 2. 移除旧依赖
已从 package.json 移除以下依赖：
- @typescript-eslint/eslint-plugin@5.59.11
- @typescript-eslint/parser@5.59.11
- eslint-config-react-app@7.0.1
- eslint-plugin-import@2.27.5
- eslint-plugin-react@7.32.2
- eslint-plugin-react-func@0.1.18
- eslint-plugin-unused-imports@2.0.0

#### 3. 删除旧配置文件
- ✅ 删除 .eslintrc.js
- ✅ 删除 .eslintrc (已备份至 .eslintrc.backup)

#### 4. 安装新依赖
- ✅ @fuxi/eslint-config-fuxi@2.1.0

#### 5. 创建配置文件
- ✅ 创建 eslint.config.cjs

#### 6. Monorepo tsconfig 配置
检测到 4 个子包，已自动添加所有 tsconfig 路径：
- ./tsconfig.json (根目录)
- ./packages/app1/tsconfig.json
- ./packages/app2/tsconfig.json
- ./apps/web/tsconfig.json

### 配置文件内容

\`\`\`javascript
// eslint.config.cjs
module.exports = require('@fuxi/eslint-config-fuxi/react')({
  tsconfig: [
    `${process.cwd()}/tsconfig.json`,
    `${process.cwd()}/packages/app1/tsconfig.json`,
    `${process.cwd()}/packages/app2/tsconfig.json`,
    `${process.cwd()}/apps/web/tsconfig.json`,
  ],
  root: process.cwd(),
  globalIgnores: [],
});
\`\`\`

### 验证结果
✅ ESLint 配置验证通过
✅ 所有子包都能正确检查

### 下一步
1. 运行 \`pnpm lint\` 检查代码
2. 运行 \`pnpm lint:fix\` 自动修复可修复的问题
3. 对于 Monorepo，运行 \`pnpm -r lint\` 检查所有子包
4. 提交代码前确保通过 lint 检查

### 使用示例

\`\`\`bash
# 检查所有文件
pnpm lint

# 自动修复
pnpm lint:fix

# Monorepo - 检查所有子包
pnpm -r lint

# 检查特定文件
pnpm eslint src/components/**/*.tsx
\`\`\`

### 注意事项
- ESLint 配置基于 flat config（eslint.config.cjs）
- 如果编辑器未识别新配置，请重启编辑器
- 对于复杂的自定义规则，可以扩展配置文件中的 plugins 和 rules
```

## 注意事项

- **TypeScript 版本要求：** 必须使用 TypeScript v5.x.x 或以上，内置解析器需要此版本支持。
- **Monorepo tsconfig 收集：** 这是关键步骤，必须确保所有子包的 `tsconfig.json` 都被包含在配置中，否则部分代码可能不会被正确检查。
- **配置文件格式：** 使用 `eslint.config.cjs`（flat config），不是旧的 `.eslintrc.*` 格式。
- **备份策略：** 删除旧配置文件前建议备份，防止意外情况。
- **依赖清理：** 确保完全移除旧的 ESLint 相关依赖，避免冲突。
- **ESLint 版本：** 推荐使用 ESLint v8 或 v9，确保与 flat config 兼容。

## Monorepo 特殊处理

### tsconfig 路径收集策略

1. **扫描 workspace 配置：**
   - 读取 `pnpm-workspace.yaml` 或 `package.json` 的 `workspaces` 字段
   - 展开 glob 模式（如 `packages/*`）
   
2. **遍历子包目录：**
   - 进入每个匹配的子包目录
   - 检查是否存在 `tsconfig.json`
   - 如果存在，记录完整路径

3. **验证 tsconfig 有效性：**
   - 确认文件存在且可读
   - 确认为有效的 JSON 格式

4. **生成配置数组：**
   - 使用 `process.cwd()` 拼接相对路径
   - 保持路径格式一致性

### 示例目录结构

```
my-monorepo/
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json (根)
├── packages/
│   ├── app1/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── app2/
│       ├── package.json
│       └── tsconfig.json
└── apps/
    └── web/
        ├── package.json
        └── tsconfig.json
```

对应的 `eslint.config.cjs` 应包含：
```javascript
tsconfig: [
  `${process.cwd()}/tsconfig.json`,
  `${process.cwd()}/packages/app1/tsconfig.json`,
  `${process.cwd()}/packages/app2/tsconfig.json`,
  `${process.cwd()}/apps/web/tsconfig.json`,
]
```

## 错误处理

- **TypeScript 版本过低：** 提示用户升级到 v5.x.x，提供升级命令。
- **无法识别项目类型：** 询问用户手动确认是普通项目还是 Monorepo。
- **tsconfig 文件缺失：** 警告用户并列出缺失的路径，询问是否继续。
- **依赖卸载失败：** 提供手动卸载命令和步骤。
- **配置验证失败：** 输出详细的错误信息，提供常见问题的解决方案。

## 扩展功能（可选）

如果用户需要自定义规则，提供扩展配置的模板和说明：

```javascript
// eslint.config.cjs - 带自定义扩展
const pluginZhongbao = require('eslint-plugin-zhongbao');

module.exports = require('@fuxi/eslint-config-fuxi/react')({
  tsconfig: [
    /* ... 所有 tsconfig 路径 */
  ],
  root: process.cwd(),
  // 自定义插件
  plugins: {
    zhongbao: pluginZhongbao,
  },
  // 自定义规则
  rules: {
    'zhongbao/no-cls-bind-plugin-zhongbao-lowcode-material': 'error',
  },
  // 全局忽略
  globalIgnores: [
    'dist',
    'build',
    'coverage',
    '**/*.min.js',
  ],
});
```

