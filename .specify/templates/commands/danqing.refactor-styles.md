---
description: 样式重构标准化流程，支持直接进入 plan 和 task 阶段，或跳过 plan 直接进入 task。
---

## 用户输入

```text
$ARGUMENTS
```

在继续前，若输入非空，必须先审视用户输入。

## 概览

本命令用于对指定目录下的样式进行标准化重构，使其符合项目 CSS 规范。基于 `003-refactor-analytics-styles` 的重构经验，提供标准化的样式重构流程。

**命令特点**：
- 支持直接进入 plan 和 task 阶段（跳过 spec 阶段）
- 支持跳过 plan 直接进入 task（因为约束相同，可复用）
- 适用于所有模块的样式规范和重构
- 基于成熟的重构模板和经验

## 执行模式

### 模式 1：完整流程（推荐首次使用）

执行完整流程：spec → plan → tasks → implement

**触发方式**：`/speckit.danqing.refactor-styles <目标目录>`

**执行步骤**：
1. 创建功能规格（spec.md）
2. 生成实施计划（plan.md）
3. 生成任务清单（tasks.md）
4. 执行实施（implement）

### 模式 2：跳过 spec，直接进入 plan

适用于已了解需求，直接进入规划阶段。

**触发方式**：`/speckit.danqing.refactor-styles <目标目录> --skip-spec`

**执行步骤**：
1. 基于模板快速生成 spec.md（使用默认模板）
2. 生成实施计划（plan.md）
3. 生成任务清单（tasks.md）
4. 执行实施（implement）

### 模式 3：跳过 spec 和 plan，直接进入 tasks

适用于约束相同，直接生成任务清单。

**触发方式**：`/speckit.danqing.refactor-styles <目标目录> --skip-spec --skip-plan` 或 `/speckit.danqing.refactor-styles <目标目录> --quick`

**执行步骤**：
1. 创建功能分支和目录结构
2. 直接基于模板生成任务清单（tasks.md），跳过 spec.md 和 plan.md
3. 执行实施（implement）

## 执行流程

### 步骤 1：解析用户输入

从用户输入中提取：
- **目标目录**：需要重构的目录路径（必需）
- **执行模式**：`--skip-spec`、`--skip-plan`、`--quick`（可选）

**示例输入**：
- `/speckit.danqing.refactor-styles packages/manager/src/pages/pipeline/analytics`
- `/speckit.danqing.refactor-styles packages/manager/src/pages/dashboard --quick`
- `/speckit.danqing.refactor-styles packages/manager/src/pages/settings --skip-spec`

### 步骤 2：验证目标目录

1. **检查目录存在性**：验证目标目录是否存在
2. **扫描组件文件**：识别所有 `.tsx` 和 `.ts` 文件
3. **分析样式使用**：扫描内联样式、硬编码值、CSS Modules 使用情况
4. **生成分析报告**：
   - 组件文件数量
   - 内联样式数量
   - 硬编码值数量
   - CSS Modules 文件数量

### 步骤 3：根据模式执行

#### 模式 1：完整流程

1. **创建功能规格**：
   - 运行脚本创建功能分支和 spec.md：
     - **Bash**：`.specify/scripts/bash/create-new-feature.sh --json --short-name "refactor-styles-<模块名>"`
     - **PowerShell**：`.specify/scripts/powershell/create-new-feature.ps1 -Json -ShortName "refactor-styles-<模块名>"`
   - 解析 JSON 输出获取 `BRANCH_NAME` 和 `SPEC_FILE`
   - 使用模板填充 spec.md，基于目标目录自动填充：
     - 用户故事：移除内联样式、使用 CSS 变量、优先使用 UnoCSS
     - 功能需求：基于扫描结果生成
     - 成功标准：可量化的验证指标
   - 获取当前日期并填充到 spec.md

2. **生成实施计划**：
   - 运行 `/speckit.plan` 命令
   - 基于 spec.md 和 constitution.md 生成 plan.md
   - 自动填充技术背景、宪章检查、研究阶段

3. **生成任务清单**：
   - 运行 `/speckit.tasks` 命令
   - 基于 spec.md 和 plan.md 生成 tasks.md
   - 任务包括：环境搭建、基础设施、三个用户故事、打磨阶段

4. **执行实施**：
   - 运行 `/speckit.implement` 命令
   - 按照 tasks.md 执行重构任务

#### 模式 2：跳过 spec

1. **快速生成 spec.md**：
   - 运行脚本创建功能分支和 spec.md：
     - **Bash**：`.specify/scripts/bash/create-new-feature.sh --json --short-name "refactor-styles-<模块名>"`
     - **PowerShell**：`.specify/scripts/powershell/create-new-feature.ps1 -Json -ShortName "refactor-styles-<模块名>"`
   - 解析 JSON 输出获取 `BRANCH_NAME` 和 `SPEC_FILE`
   - 使用 `specs/feature/003-refactor-analytics-styles/spec.md` 作为模板，替换：
     - 目标目录路径
     - 组件文件列表
     - 扫描结果数据
   - 获取当前日期并填充

2. **生成实施计划**：
   - 运行 `/speckit.plan` 命令
   - 基于生成的 spec.md 和 constitution.md 生成 plan.md

3. **生成任务清单**：
   - 运行 `/speckit.tasks` 命令
   - 基于 spec.md 和 plan.md 生成 tasks.md

4. **执行实施**：
   - 运行 `/speckit.implement` 命令

#### 模式 3：跳过 spec 和 plan（快速模式）

1. **创建功能分支**：
   - 运行脚本创建功能分支和目录结构：
     - **Bash**：`.specify/scripts/bash/create-new-feature.sh --json --short-name "refactor-styles-<模块名>"`
     - **PowerShell**：`.specify/scripts/powershell/create-new-feature.ps1 -Json -ShortName "refactor-styles-<模块名>"`

2. **直接基于模板生成任务清单**：
   - 复制 `specs/feature/003-refactor-analytics-styles/tasks.md` 作为模板
   - 替换模板中的目标目录路径为实际目录
   - 更新组件文件列表（基于扫描结果）
   - 更新任务描述中的文件路径
   - 获取当前日期并填充（如有日期字段）
   - 保存为 `specs/feature/<分支名>/tasks.md`

3. **执行实施**：
   - 运行 `/speckit.implement` 命令
   - 按照 tasks.md 执行重构任务

### 步骤 4：样式重构核心任务

无论使用哪种模式，最终都会执行以下核心重构任务：

#### 阶段 1：环境搭建
- 验证 UnoCSS 配置
- 验证 CSS 变量定义
- 验证 Stylelint 配置

#### 阶段 2：基础设施
- 扩展 UnoCSS `rules` 配置（如需要）
- 确认/新增全局 CSS 变量（如需要）
- 创建样式映射参考文档

#### 阶段 3：用户故事 1 - 移除内联样式
- 扫描所有组件文件，识别内联样式
- 移除业务组件内联样式，使用 UnoCSS 类名或 CSS Modules
- 验证所有 CSS Modules 使用 `cx` 函数（禁止使用 `styles` 对象）
- 第三方组件允许使用 `style` 属性，但必须使用 CSS 变量

#### 阶段 4：用户故事 2 - 使用 CSS 变量
- 扫描所有组件和样式文件，识别硬编码值
- 替换所有硬编码颜色值为 UnoCSS 类名或 CSS 变量
- 替换所有硬编码间距值为 UnoCSS 类名或 CSS 变量
- 替换所有硬编码尺寸值为 UnoCSS 类名或 CSS 变量

#### 阶段 5：用户故事 3 - 优先使用 UnoCSS
- 优化所有组件，优先使用 UnoCSS 类名
- 减少 `.module.css` 文件中的样式定义
- 仅在复杂样式场景（动画、伪元素、复杂布局）使用 CSS Modules

#### 阶段 6：打磨与验证
- 运行 Stylelint 检查
- 运行 TypeScript 类型检查
- 进行视觉回归测试
- 更新相关文档

## 样式重构规范（基于宪章）

### 核心原则

1. **禁止内联样式**：业务组件禁止使用 `style={{ ... }}`，必须使用 UnoCSS 类名或 CSS Modules
2. **禁止硬编码值**：所有颜色、间距、尺寸必须使用 CSS 变量或 UnoCSS 类名
3. **优先使用 UnoCSS**：常用样式（间距、颜色、字体大小）优先使用 UnoCSS 原子类
4. **CSS Modules 使用 `cx` 函数**：所有 CSS Modules 必须使用 `cx` 函数（`import cx from './Component.module.css'`），禁止使用 `styles` 对象
5. **第三方组件例外**：第三方组件允许使用 `style` 属性，但必须使用 CSS 变量

### UnoCSS 配置规范

1. **通用类名统一定义**：所有通用类名必须在 `uno.config.ts` 的 `rules` 中定义
2. **组合类提前定义**：设计系统级别的、跨模块复用的、高频使用的组合类必须在 `shortcuts` 中定义
3. **CSS 属性名格式**：包含连字符的属性必须使用 kebab-case 字符串（如 `'margin-bottom'`、`'background-color'`）

### 样式映射参考

#### 常用 UnoCSS 类名映射

**颜色类名**：
- `text-primary` → `color: var(--primary-color)`
- `text-gray-1` → `color: var(--text-gray-color-1)`
- `bg-primary` → `background-color: var(--primary-color)`
- `bg-white` → `background-color: var(--white)`

**间距类名**：
- `p-lg` → `padding: var(--padding-lg)` (24px)
- `p-md` → `padding: var(--padding-md)` (16px)
- `m-lg` → `margin: var(--margin-lg)` (24px)
- `m-md` → `margin: var(--margin-md)` (16px)
- `mb-lg` → `margin-bottom: var(--margin-lg)` (24px)
- `mb-md` → `margin-bottom: var(--margin-md)` (16px)
- `mt-lg` → `margin-top: var(--margin-lg)` (24px)
- `mr-8` → `margin-right: var(--margin-xs)` (8px)

**文本对齐类名**：
- `text-center` → `text-align: center`
- `text-left` → `text-align: left`
- `text-right` → `text-align: right`

**尺寸类名**：
- `w-full` → `width: 100%`

**Flex 布局类名**：
- `flex` → `display: flex`
- `items-center` → `align-items: center`
- `justify-between` → `justify-content: space-between`

#### 内联样式 → UnoCSS 类名映射表

| 内联样式 | UnoCSS 类名 | CSS 变量 | 备注 |
|---------|------------|---------|------|
| `padding: '24px'` | `p-lg` | `var(--padding-lg)` | 24px 对应 `--padding-lg` |
| `marginBottom: 24` | `mb-lg` | `var(--margin-lg)` | 24px 对应 `--margin-lg` |
| `marginRight: 8` | `mr-8` | `var(--margin-xs)` | 8px 对应 `--margin-xs` |
| `color: '#1890ff'` | `text-primary` | `var(--primary-color)` | 需要确认颜色对应关系 |
| `textAlign: 'center'` | `text-center` | N/A | 文本对齐无需变量 |
| `width: '100%'` | `w-full` | N/A | 百分比值允许直接使用 |

## 验证标准

### 代码检查

1. **内联样式检查**：
   ```bash
   grep -r "style={{.*}}" <目标目录> --include="*.tsx" --include="*.ts" | grep -v "第三方组件" | wc -l
   ```
   结果应为 0（业务组件无内联样式）

2. **CSS Modules 使用检查**：
   ```bash
   grep -r "import.*styles.*from.*\.module\.css" <目标目录> --include="*.tsx" | wc -l
   ```
   结果应为 0（禁止使用 `styles` 对象）

3. **硬编码颜色值检查**：
   ```bash
   grep -r "#[0-9a-fA-F]\{3,6\}\|rgb\|rgba" <目标目录> --include="*.tsx" --include="*.module.css" | grep -v "var(--" | wc -l
   ```
   结果应为 0（无硬编码颜色值）

4. **硬编码间距值检查**：
   ```bash
   grep -r "[0-9]\+px" <目标目录> --include="*.tsx" --include="*.module.css" | grep -v "var(--" | grep -v "100%" | wc -l
   ```
   结果应为 0（无硬编码间距值，百分比值除外）

### 工具检查

1. **Stylelint 检查**：
   ```bash
   pnpm --filter manager lint:style
   ```
   必须通过所有检查

2. **TypeScript 类型检查**：
   ```bash
   pnpm --filter manager type-check
   ```
   目标目录相关文件无类型错误

### 视觉回归测试

1. 启动开发服务器
2. 访问目标页面
3. 对比重构前后的视觉效果
4. 确保 100% 一致

## 输出文件

执行完成后，会在 `specs/feature/<分支名>/` 目录下生成：

- **模式 1（完整流程）**：
  - `spec.md`：功能规格文档
  - `plan.md`：实施计划文档
  - `research.md`：技术研究文档
  - `data-model.md`：数据模型文档
  - `tasks.md`：任务清单文档
  - `quickstart.md`：快速开始指南（可选）
  - `style-mapping.md`：样式映射参考文档（可选）

- **模式 2（跳过 spec）**：
  - `spec.md`：基于模板快速生成
  - `plan.md`：实施计划文档
  - `research.md`：技术研究文档
  - `data-model.md`：数据模型文档
  - `tasks.md`：任务清单文档

- **模式 3（快速模式）**：
  - `tasks.md`：直接基于模板生成的任务清单文档（不生成 spec.md、plan.md 等）

## 注意事项

1. **脚本环境要求**：
   - 本命令支持 Bash 和 PowerShell 两种脚本
   - **Bash 脚本**（推荐在 Mac/Linux 上使用）：
     - 路径：`.specify/scripts/bash/create-new-feature.sh`
     - 参数格式：`--json --short-name "name"`
   - **PowerShell 脚本**（Windows 或已安装 PowerShell Core 的系统）：
     - 路径：`.specify/scripts/powershell/create-new-feature.ps1`
     - 参数格式：`-Json -ShortName "name"`
     - **Mac 安装 PowerShell**：`brew install --cask powershell`
   - 系统会根据可用性自动选择脚本，或手动指定使用哪种脚本

2. **UnoCSS 配置**：确保 `uno.config.ts` 中已定义所需的类名，包含连字符的属性必须使用 kebab-case 字符串
3. **CSS 变量**：确保全局样式文件中已定义所需的 CSS 变量
4. **第三方组件**：第三方组件的 `style` 属性定制必须使用 CSS 变量
5. **CSS Modules**：所有 CSS Modules 必须使用 `cx` 函数，禁止使用 `styles` 对象
6. **日期获取**：生成文档时必须使用系统当前日期，禁止硬编码

## 示例

### 示例 1：完整流程

```bash
/speckit.danqing.refactor-styles packages/manager/src/pages/dashboard
```

执行完整流程：创建 spec → 生成 plan → 生成 tasks → 执行 implement

### 示例 2：快速模式

```bash
/speckit.danqing.refactor-styles packages/manager/src/pages/settings --quick
```

跳过 spec 和 plan，直接生成 tasks 并执行 implement

### 示例 3：跳过 spec

```bash
/speckit.danqing.refactor-styles packages/manager/src/pages/profile --skip-spec
```

跳过 spec，直接生成 plan → tasks → implement

