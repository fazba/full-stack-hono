import { Layout, Space, Typography } from "antd"
import { Link, Outlet } from "react-router-dom"

import "./AppLayout.css"

const { Header, Content } = Layout
const { Text } = Typography

export function AppLayout() {
  return (
    <Layout className="app-shell">
      <Header className="app-shell__header">
        <Link to="/" className="app-shell__brand">
          Frontend
        </Link>
        <Space size="middle" wrap>
          <Link to="/login">登录</Link>
          <Link to="/register">注册</Link>
          <Link to="/account">账户</Link>
        </Space>
      </Header>
      <Content className="app-shell__content">
        <Outlet />
      </Content>
      <footer className="app-shell__footer">
        <Text type="secondary">Vite · React · Ant Design</Text>
      </footer>
    </Layout>
  )
}
