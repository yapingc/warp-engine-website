import React from 'react';
import { Link } from 'react-router-dom';
import { Space, Typography } from '@fuxi/eevee-ui';

const { Title, Paragraph } = Typography;

const NotFound: React.FC = () => {
  return (
    <div className="page-container">
      <Title level={2}>404</Title>
      <Paragraph type="secondary">页面不存在</Paragraph>
      <Space>
        <Link to="/">返回首页</Link>
        <Link to="/upload">上传示例</Link>
      </Space>
    </div>
  );
};

export default NotFound;
