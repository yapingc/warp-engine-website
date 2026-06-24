import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ImageUpload } from '@fuxi/danqing-components';
import { Card, Divider, Space, Typography } from '@fuxi/eevee-ui';

import { useSDK } from '../config/sdk';

const { Title, Paragraph, Text } = Typography;

const UploadDemo: React.FC = () => {
  const sdk = useSDK();
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  return (
    <div className="page-container">
      <Space size="middle">
        <Link to="/">返回首页</Link>
        <Link to="/about">SDK/Router 说明</Link>
      </Space>

      <Divider />

      <Title level={2}>上传示例页（/upload）</Title>
      <Paragraph type="secondary">
        该页面用于演示 <Text code>react-router</Text> 基础路由与 <Text code>ImageUpload</Text> 组件结合使用。
      </Paragraph>

      <Card title="ImageUpload" className="card-spacing">
        <ImageUpload
          sdk={sdk}
          value={imageUrls}
          onChange={setImageUrls}
          enableHistory
          limitOptions={{
            maxFileNum: 5,
            limitSizeMB: 10,
          }}
          width={392}
        />
      </Card>

      {imageUrls.length > 0 && (
        <Card title="当前选择结果" className="card-spacing">
          <ul className="url-list">
            {imageUrls.map((url, idx) => (
              <li key={idx}>{url}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
};

export default UploadDemo;
