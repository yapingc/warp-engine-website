import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Divider, Space, Typography } from '@fuxi/eevee-ui';

import { useSDK } from '../config/sdk';

const { Title, Paragraph, Text } = Typography;

const About: React.FC = () => {
  const sdk = useSDK();

  return (
    <div className="page-container">
      <Space size="middle">
        <Link to="/">首页</Link>
        <Link to="/upload">上传示例</Link>
      </Space>

      <Divider />

      <Title level={2}>关于（/about）</Title>
      <Paragraph>
        本模板已接入 <Text code>react-router-dom</Text>（BrowserRouter + Routes）。
      </Paragraph>

      <Card title="SDK 基本用法" className="card-spacing">
        <Paragraph>
          SDK 实例由 <Text code>SDKProvider</Text> 创建并通过 <Text code>useSDK()</Text> 获取。
        </Paragraph>
        <pre className="code-block">
{`import { useSDK } from '../config/sdk';

const sdk = useSDK();

// 埋点（默认绑定 appId 为 serviceName）
await sdk.api.tracking.trackEvent({
  eventName: 'page_view',
  params: { page: 'about' },
});

// 查询积分消耗量（传 apiName）
const res = await sdk.api.credit.getCreditConsumption({
  apiName: '/api/v1/image/generate',
});
console.log(res.consumption);`}
        </pre>

        <Paragraph type="secondary" className="text-spacing">
          当前 appId：<Text code>{sdk.config.appId}</Text>
        </Paragraph>
      </Card>
    </div>
  );
};

export default About;
