import { App, Button, Form, Input, Typography } from "antd"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { login, parseAuthJson } from "../api/auth"
import type { AuthUserToken } from "../types/api"

type LoginForm = {
  login: string
  password: string
}

export function LoginPage() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const onFinish = async (values: LoginForm) => {
    setLoading(true)
    try {
      const res = await login({
        login: values.login.trim(),
        password: values.password,
      })
      const body = await parseAuthJson<AuthUserToken>(res)
      if (!res.ok || !body.success) {
        const hint =
          body.message + (body.code !== undefined ? `（${body.code}）` : "")
        message.error(hint || `请求失败 ${res.status}`)
        return
      }
      message.success("登录成功")
      navigate("/account", { replace: true })
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : "网络错误")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Typography.Title level={2} style={{ marginTop: 0 }}>
        登录
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        使用邮箱或用户名与密码登录。
      </Typography.Paragraph>
      <Form<LoginForm>
        layout="vertical"
        onFinish={onFinish}
        style={{ maxWidth: 400 }}
      >
        <Form.Item
          label="邮箱或用户名"
          name="login"
          rules={[{ required: true, message: "请输入邮箱或用户名" }]}
        >
          <Input autoComplete="username" />
        </Form.Item>
        <Form.Item
          label="密码"
          name="password"
          rules={[{ required: true, message: "请输入密码" }]}
        >
          <Input.Password autoComplete="current-password" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            登录
          </Button>
        </Form.Item>
      </Form>
      <Typography.Text type="secondary">
        没有账号？<Link to="/register">去注册</Link>
      </Typography.Text>
    </div>
  )
}
