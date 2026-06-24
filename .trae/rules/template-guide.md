---
description: 查询丹青模板提供的 SDK API、组件用法、配置模式等能力。当用户询问"模板有什么能力"、"SDK有哪些API"、"组件怎么用"时使用。
globs:
alwaysApply: false
---

## 概览

本技能用于查询丹青模板为用户项目提供的能力。信息来源为项目 `docs/` 目录下由包管理器自动同步的文档，确保查询结果始终与已安装版本一致。

**核心原则**：不硬编码任何 API 或组件列表，每次都从实际文档文件中读取。

## 文档来源

以下文档由对应包的 postinstall 脚本自动同步到用户项目：

| 文件 | 来源包 | 内容 |
|------|--------|------|
| `docs/api-catalog.md` | `@fuxi/danqing-sdk` | SDK 全量 API 目录，含参数、返回值、示例 |
| `docs/components-usage.md` | `@fuxi/danqing-components` | 组件库使用文档，含 Props、示例 |
| `docs/sdk-usage.md` | 模板生成 | SDK 初始化与常用模块用法指南 |

## 执行流程

### 步骤 1：定位文档文件

从当前项目根目录查找以下文件（按优先级）：

1. `docs/api-catalog.md` — SDK API 目录（由 SDK 包自动更新）
2. `docs/components-usage.md` — 组件文档（由组件包自动更新）
3. `docs/sdk-usage.md` — SDK 使用指南（模板生成）

如果文件不存在，提示用户重新安装对应包以触发 postinstall。

降级方案：尝试从 `node_modules/@fuxi/danqing-sdk/docs/` 和 `node_modules/@fuxi/danqing-components/docs/` 读取。

### 步骤 2：解析用户意图

根据用户输入判断查询范围：

| 用户意图 | 读取文件 | 回答方式 |
|----------|----------|----------|
| 无输入 / "有哪些能力" | 全部 | 分类概览：SDK API 分类数量 + 组件列表 + 配置模式 |
| "SDK" / "API" / 具体 API 名 | `api-catalog.md` | 列出分类或定位具体 API 的参数与示例 |
| 组件名（如 "ImageUpload"） | `components-usage.md` | 该组件的 Props 表格 + 用法示例 |
| "怎么初始化" / "怎么配置" | `sdk-usage.md` | SDK 初始化模式与配置项 |
| "上传" / "历史" 等功能词 | 全部 | 跨文档搜索相关内容 |

### 步骤 3：读取并回答

1. 读取对应的文档文件
2. 从文档内容中提取与用户问题相关的部分
3. 以结构化方式回答，包含：
   - 功能说明
   - 参数/Props 表格（如适用）
   - 代码示例（直接引用文档中的示例）
4. 如果文档中信息不足，补充提示用户可以查看源文件路径

### 步骤 4：版本提示

回答末尾附加当前文档版本信息（从 `api-catalog.md` 头部提取版本号和生成日期），提醒用户该信息对应的包版本。

## 回答格式示例

### 概览模式（无具体问题时）

```markdown
## 丹青模板能力概览

### SDK API（v{version}，共 {count} 个）
- 基础服务：upload、image、history、tracking、credit、user
- 图片生成：{count} 个
- 视频生成：{count} 个
- 3D 模型：{count} 个

### UI 组件
- Header — 顶部导航栏
- ImageUpload — 图片上传（支持拖拽/粘贴/历史）
- AutoProgress — 自动进度条

### 配置模式
- SDK 初始化（SDKProvider + useSDK）
- Vite 代理配置
- 认证集成（RBAC + Supabase）
- 主题定制（亮/暗色）
```

### 具体查询模式

直接给出相关内容，不做多余展开。

## 注意事项

1. **始终从文件读取**：禁止凭记忆回答 API 列表或组件 Props，必须每次读取文档文件
2. **版本感知**：`api-catalog.md` 头部包含版本号和 API 数量，应在回答中体现
3. **不修改文件**：本技能为只读查询，不创建或修改任何文件
4. **按需读取**：用户问具体 API 时，只读取对应文件并定位相关段落
