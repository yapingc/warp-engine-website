const POPO_URL = 'https://danqing-node.apps-cae.danlu.netease.com/api/vibe-coding/popo/send-text';

interface PopoMessage {
  /** 消息正文内容 */
  content: string;
  /** @指定用户或机器人，用户传邮箱，机器人传 appId */
  atUids?: string[];
  /** 是否 @全体成员 */
  isAtAll?: boolean;
}

interface SendPopoMessageOptions {
  /** 接收方。个人传完整邮箱（如 zhangsan@corp.netease.com），群聊直接传群号 */
  receiver: string;
  /** 发送消息内容，与 message 不可同时为空 */
  content?: string;
  /** 富消息体，支持 @功能。优先级高于 content */
  message?: PopoMessage;
  /** 自定义机器人的 appKey */
  appKey?: string;
  /** 自定义机器人的 appSecret，与 appKey 配对使用 */
  appSecret?: string;
}

export async function sendPopoMessage(options: SendPopoMessageOptions): Promise<{ success: boolean; data?: any; error?: string }> {
  const { receiver, content, message, appKey, appSecret } = options;

  if (!content && !message) {
    return { success: false, error: 'content 和 message 不可同时为空' };
  }

  const body: Record<string, any> = { receiver };
  if (message) {
    body.message = message;
  } else {
    body.content = content;
  }
  if (appKey) body.appKey = appKey;
  if (appSecret) body.appSecret = appSecret;

  try {
    const res = await fetch(POPO_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}` };
    }
    return { success: true, data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}