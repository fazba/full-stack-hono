import { App, Button, Form, Input, Typography } from "antd"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { parseAuthJson, register } from "../api/auth"
import type { AuthUserToken } from "../types/api"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_RE = /^[a-zA-Z0-9_]{3,32}$/

type RegisterForm = {
  email: string
  password: string
  username?: string
}

export function RegisterPage() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const onFinish = async (values: RegisterForm) => {
    setLoading(true)
    try {
      const payload: { email: string; password: string; username?: string } = {
        email: values.email.trim(),
        password: values.password,
      }
      const u = values.username?.trim()
      if (u) payload.username = u

      const res = await register(payload)
      const body = await parseAuthJson<AuthUserToken>(res)
      if (!res.ok || !body.success) {
        const hint =
          body.message + (body.code !== undefined ? `（${body.code}）` : "")
        message.error(hint || `请求失败 ${res.status}`)
        return
      }
      message.success("注册成功，请前往登录")
      navigate("/login", { replace: true })
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : "网络错误")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Typography.Title level={2} style={{ marginTop: 0 }}>
        注册
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        使用邮箱与密码注册；用户名为选填（3–32 位字母、数字或下划线）。
      </Typography.Paragraph>
      <Form<RegisterForm>
        layout="vertical"
        onFinish={onFinish}
        style={{ maxWidth: 400 }}
      >
        <Form.Item
          label="邮箱"
          name="email"
          rules={[
            { required: true, message: "请输入邮箱" },
            {
              validator: async (_, v: string) => {
                const s = v?.trim() ?? ""
                if (!s || !EMAIL_RE.test(s)) {
                  throw new Error("请提供有效邮箱")
                }
              },
            },
          ]}
        >
          <Input autoComplete="email" placeholder="you@example.com" />
        </Form.Item>
        <Form.Item
          label="用户名（可选）"
          name="username"
          rules={[
            {
              validator: async (_, v: string | undefined) => {
                const s = v?.trim() ?? ""
                if (s === "") return
                if (!USERNAME_RE.test(s)) {
                  throw new Error("用户名需为 3–32 位字母、数字或下划线")
                }
              },
            },
          ]}
        >
          <Input autoComplete="username" placeholder="可选" />
        </Form.Item>
        <Form.Item
          label="密码"
          name="password"
          rules={[
            { required: true, message: "请输入密码" },
            { min: 8, message: "密码长度至少 8 位" },
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            注册
          </Button>
        </Form.Item>
      </Form>
      <Typography.Text type="secondary">
        已有账号？<Link to="/login">去登录</Link>
      </Typography.Text>
    </div>
  )
}
