---
description: Danqing SDK API 使用规则 — 在涉及 AI 生图、视频生成、3D 模型、上传、鉴权等功能时自动生效
---

# Danqing SDK 使用规则

## 核心原则（NON-NEGOTIABLE）

本项目已集成 `@fuxi/danqing-sdk`，**禁止重复实现 SDK 已有的功能**。

在实现以下任何功能之前，**必须先读取 `docs/api-catalog.md`**，确认 SDK 是否已提供对应能力：
- AI 图像生成（文生图、图生图、风格迁移、超分辨率、擦除、扩图等）
- AI 视频生成（文生视频、图生视频等）
- 3D 模型生成（文字/图片/多视图生成 3D 模型等）
- 图片上传、历史管理、图片信息查询
- 用户鉴权、积分查询、埋点

## 文档位置

| 文档 | 路径 | 内容 |
|---|---|---|
| **API 总览（必读）** | `docs/api-catalog.md` | 所有 API 的参数、返回值、调用示例 |
| **SDK 使用指南** | `docs/sdk-usage.md` | 初始化、Provider、基础用法 |

> `api-catalog.md` 由 SDK 的 postinstall 脚本自动同步，执行 `pnpm update @fuxi/danqing-sdk` 后会自动更新。

## 调用方式

```tsx
import { useSDK } from '@/config/sdk';

function MyComponent() {
  const sdk = useSDK();

  // 所有 AI API 通过 sdk.api.<service>.<method>() 调用
  // 具体参数和返回值请查阅 docs/api-catalog.md
  const result = await sdk.api.banana.generate({ prompt: '...', size: '1:1' });
}
```

## 禁止行为

- ❌ 禁止手动封装 HTTP 请求调用 AI 生图/生视频/生模型接口
- ❌ 禁止在 `src/services/` 中重复实现 SDK 已有的 API 封装
- ❌ 禁止硬编码 AI 服务的轮询逻辑（SDK 内置了 createTask + pollForResult 状态机）
- ❌ 禁止假设 API 参数，必须以 `docs/api-catalog.md` 中的 Interface 定义为准
