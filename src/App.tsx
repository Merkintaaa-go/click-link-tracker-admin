
import { useState } from 'react';
import { Layout, Menu, theme, Typography } from 'antd';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BarChartOutlined, LinkOutlined, DatabaseOutlined } from '@ant-design/icons';

// Import components
import ClicksTable from './components/ClicksTable';
import LinksTable from './components/LinksTable';
import LinkForm from './components/LinkForm';

const { Header, Content, Footer, Sider } = Layout;
const { Title } = Typography;

// Create a client
const queryClient = new QueryClient();

// Navigation component
const Navigation = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const items = [
    {
      key: '/',
      icon: <LinkOutlined />,
      label: <Link to="/">Links</Link>,
    },
    {
      key: '/clicks',
      icon: <DatabaseOutlined />,
      label: <Link to="/clicks">Clicks</Link>,
    },
    {
      key: '/create',
      icon: <BarChartOutlined />,
      label: <Link to="/create">Create Link</Link>,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        theme="light"
      >
        <div style={{ height: 32, margin: 16, textAlign: 'center' }}>
          <Title level={5} style={{ color: '#1890ff', margin: 0 }}>Link Tracker</Title>
        </div>
        <Menu 
          theme="light" 
          defaultSelectedKeys={['/']} 
          selectedKeys={[location.pathname]} 
          mode="inline" 
          items={items}
        />
      </Sider>
      <Layout className="site-layout">
        <Header style={{ padding: 0, background: colorBgContainer }} />
        <Content style={{ margin: '0 16px' }}>
          <div style={{ padding: 24, minHeight: 360, background: colorBgContainer }}>
            <Routes>
              <Route path="/" element={<LinksTable />} />
              <Route path="/clicks" element={<ClicksTable />} />
              <Route path="/create" element={<LinkForm />} />
            </Routes>
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>Link Tracker ©{new Date().getFullYear()}</Footer>
      </Layout>
    </Layout>
  );
};

// Main App component
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Navigation />
      </Router>
    </QueryClientProvider>
  );
};

export default App;
