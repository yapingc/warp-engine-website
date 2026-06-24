import React from 'react';
import { Link } from 'react-router-dom';
import { Alert, Card, Divider, Space, Typography } from '@fuxi/eevee-ui';

const { Title, Paragraph, Text } = Typography;

/**
 * 本页面仅为模板示例，可移除或任意修改。
 */
const Home: React.FC = () => {
  return (
    <div className="page-container">
      <Title level={1}>欢迎使用丹青约</Title>
      <Paragraph type="secondary">
        你的创作工具已经准备好了。下面会带你了解这个项目能做什么、怎么和 AI 助手配合完成你的想法。
      </Paragraph>
      <Alert
        type="info"
        showIcon
        message="本页面只是一个入门引导，你可以让 AI 助手帮你修改或替换成你自己的内容。"
        className="mb-lg"
      />

      <Divider />

      <Title level={2}>你可以这样和 AI 助手对话</Title>
      <Card className="card-spacing-lg card-spacing-bottom">
        <Paragraph>
          整个项目的搭建、修改、发布，都可以通过和 AI 助手<Text strong>用日常语言聊天</Text>来完成。
          你不需要学习任何技术知识，只需要把你的想法告诉它。
        </Paragraph>
        <Paragraph>比如你可以这样说：</Paragraph>
        <ul>
          <li>"帮我把首页的标题改成『我的作品集』"</li>
          <li>"我想加一个页面，展示我的插画作品"</li>
          <li>"帮我在页面上加一个按钮，点击后上传图片"</li>
        </ul>
        <Paragraph>
          AI 助手会帮你完成所有技术细节，你只需要看效果、提意见就好。
        </Paragraph>
      </Card>

      <Divider />

      <Title level={2}>项目已经帮你准备好的能力</Title>
      <Card className="card-spacing-lg card-spacing-bottom">
        <Paragraph>
          你不需要从零开始，项目里已经内置了很多现成的能力：
        </Paragraph>

        <Title level={4}>图片上传</Title>
        <Paragraph>
          支持拖拽、点击选择、从剪贴板粘贴，还能浏览之前上传过的图片。
          <Link to="/upload"> 点这里去体验一下</Link>。
        </Paragraph>

        <Title level={4}>用户登录</Title>
        <Paragraph>
          登录功能已经配好了，打开项目就能用。如果没有登录，会自动跳转到登录页面。
        </Paragraph>

        <Title level={4}>图片处理</Title>
        <Paragraph>
          内置了几十种图片处理效果，比如去除背景、风格转换、图片生成等。
          你可以直接问 AI 助手「项目有哪些图片处理功能」，它会告诉你完整的列表。
        </Paragraph>

        <Title level={4}>现成的界面模块</Title>
        <Paragraph>
          顶部导航栏、图片上传框、进度条这些常见的界面元素都已经准备好了，
          告诉 AI 助手你想在页面上加什么，它会帮你选合适的模块。
        </Paragraph>

        <Alert
          type="success"
          showIcon
          message="想了解更多？直接问 AI 助手项目有什么能力或怎么上传图片就行。"
          className="mt-md"
        />
      </Card>

      <Divider />

      <Title level={2}>保存和管理数据</Title>
      <Card className="card-spacing-lg card-spacing-bottom">
        <Paragraph>
          项目自带了一个数据仓库，可以帮你：
        </Paragraph>
        <ul>
          <li><Text strong>保存信息</Text> —— 比如作品名称、描述、标签等</li>
          <li><Text strong>上传和管理文件</Text> —— 比如图片、素材，还能生成分享链接</li>
          <li><Text strong>管理用户账号</Text> —— 让访客注册、登录</li>
        </ul>
        <Paragraph>
          你只需要描述想保存什么，比如「我想保存每幅画的名字和创作日期」，
          AI 助手会自动完成所有准备工作并帮你实现。
        </Paragraph>
      </Card>

      <Divider />

      <Title level={2}>预览和排查问题</Title>
      <Card className="card-spacing-lg card-spacing-bottom">
        <Paragraph>
          AI 助手每次帮你修改后，浏览器会<Text strong>自动刷新</Text>，你马上就能看到最新的效果。
        </Paragraph>
        <Paragraph>
          如果页面显示不对或者功能不正常，直接告诉 AI 助手哪里有问题，比如：
        </Paragraph>
        <ul>
          <li>"页面上的图片显示不出来"</li>
          <li>"点了按钮没有反应"</li>
          <li>"这个位置的颜色不对，我想要蓝色"</li>
        </ul>
        <Paragraph>
          AI 助手会帮你找到原因并修复。如果页面上弹出了红色的错误提示，
          把内容截图或者复制文字发给它就行。
        </Paragraph>
      </Card>

      <Divider />

      <Title level={2}>发布上线</Title>
      <Card className="card-spacing-lg card-spacing-bottom">
        <Paragraph>
          当你觉得作品准备好了，想让别人也能访问，只需要告诉 AI 助手：
        </Paragraph>
        <Paragraph>
          <Text strong>"帮我发布上线"</Text>
        </Paragraph>
        <Paragraph>
          它会自动完成打包和发布的全部流程。发布完成后，你会得到一个网址，
          把这个网址分享给别人，他们就能看到你的作品了。
        </Paragraph>
      </Card>

      <Divider />

      <Title level={2}>更多内容</Title>
      <Card className="card-spacing-lg card-spacing-bottom">
        <Paragraph>
          你可以随时问 AI 助手以下问题，它都能帮你解答：
        </Paragraph>
        <ul>
          <li>"项目有哪些图片处理功能？"</li>
          <li>"怎么在页面上加一个图片上传的地方？"</li>
          <li>"怎么保存用户填写的表单信息？"</li>
          <li>"帮我加一个新页面"</li>
          <li>"帮我发布上线"</li>
        </ul>
        <Paragraph>
          也可以看看现有的示例页面：
        </Paragraph>
        <Space size="middle">
          <Link to="/upload">图片上传示例</Link>
          <Link to="/about">更多功能介绍</Link>
        </Space>
      </Card>
    </div>
  );
};

export default Home;
