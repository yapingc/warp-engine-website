# POPO 消息发送接口文档（send-text）

## 接口地址

```
POST https://danqing-node.apps-cae.danlu.netease.com/api/vibe-coding/popo/send-text
```

Content-Type: `application/json`

## 请求参数


| 字段 | 类型 | 必填 | 位置 | 说明 |
|------|------|------|------|------|
| `receiver` | String | 是 | RequestBody | 接收方。个人传完整邮箱（如 `zhangsan@corp.netease.com`），群聊直接传群号 |
| `content` | String | 否 | RequestBody | 发送消息内容。与 `message` 不可同时为空 |
| `appKey` | String | 否 | RequestBody | 自定义机器人的 appKey，用于替换默认机器人 |
| `appSecret` | String | 否 | RequestBody | 自定义机器人的 appSecret，与 appKey 配对使用 |
| `message` | Object | 否 | RequestBody | 富消息体，支持 @功能。与 `content` 不可同时为空 |

### message 对象结构

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `content` | String | 是 | 消息正文内容 |
| `atUids` | Array\<String\> | 否 | @指定用户或机器人。用户传邮箱，机器人传 appId |
| `isAtAll` | Boolean | 否 | 是否 @全体成员 |

## 约束规则

- `content`（顶层）和 `message` **不可同时为空**，至少提供其中一个
- **`message` 的优先级高于 `content`**：两者同时传入时，服务端只会使用 `message`，顶层 `content` 会被忽略
- **发送到群并 @人时，必须使用 `message` 字段**（顶层 `content` 不支持 @ 功能，无论是 @ 指定用户还是 @ 全体）
- 如果只需要发纯文本（不 @ 任何人），直接用顶层 `content` 即可
- `appKey` + `appSecret` 成对出现时替换默认机器人身份发送

## 请求示例

### 1. 发送纯文本（最简用法）

```json
{
  "receiver": "zhangsan@corp.netease.com",
  "content": "你好，这是一条测试消息"
}
```

### 2. 发送到群聊

```json
{
  "receiver": "12345678",
  "content": "群公告：明天下午3点开会"
}
```

### 3. 发送消息并 @指定用户

```json
{
  "receiver": "12345678",
  "message": {
    "content": "请审批一下这个需求",
    "atUids": ["zhangsan@corp.netease.com", "lisi@corp.netease.com"]
  }
}
```

### 4. 发送消息并 @全体成员

```json
{
  "receiver": "12345678",
  "message": {
    "content": "重要通知：系统将于今晚22:00进行维护",
    "isAtAll": true
  }
}
```

### 5. 使用自定义机器人发送

```json
{
  "receiver": "zhangsan@corp.netease.com",
  "content": "来自自定义机器人的消息",
  "appKey": "your-app-key",
  "appSecret": "your-app-secret"
}
```

### 6. 自定义机器人 + @人

```json
{
  "receiver": "12345678",
  "appKey": "your-app-key",
  "appSecret": "your-app-secret",
  "message": {
    "content": "CI/CD 构建失败，请检查",
    "atUids": ["devops@corp.netease.com"]
  }
}
```

## 响应

成功：

```json
{
  "code": 200,
  "data": { ... }
}
```

失败：

```json
{
  "code": 500,
  "message": "错误描述"
}
```
