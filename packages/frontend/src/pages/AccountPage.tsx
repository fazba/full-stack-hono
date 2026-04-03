import { App, Button, Descriptions, Spin, Typography } from "antd"
import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { logout, me, parseAuthJson } from "../api/auth"
import type { MeData, PublicUser } from "../types/api"

export function AccountPage() {
  const { message } = App.useApp()
  const [user, setUser] = useState<PublicUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [logoutLoading, setLogoutLoading] = useState(false)

  const loadMe = useCallback(async () => {
    setLoading(true)
    try {
      const res = await me()
      const body = await parseAuthJson<MeData>(res)
      if (!res.ok || !body.success) {
        setUser(null)
        if (res.status !== 401) {
          message.error(
            body.message + (body.code !== undefined ? `（${body.code}）` : ""),
          )
        }
        return
      }
      setUser(body.data.user)
    } catch (e: unknown) {
      setUser(null)
      message.error(e instanceof Error ? e.message : "网络错误")
    } finally {
      setLoading(false)
    }
  }, [message])

  useEffect(() => {
    void loadMe()
  }, [loadMe])

  const onLogout = async () => {
    setLogoutLoading(true)
    try {
      const res = await logout()
      const body = await parseAuthJson<{ loggedOut: boolean }>(res)
      if (!res.ok || !body.success) {
        message.error(
          body.message + (body.code !== undefined ? `（${body.code}）` : ""),
        )
        return
      }
      message.success("已退出登录")
      setUser(null)
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : "网络错误")
    } finally {
      setLogoutLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 48 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!user) {
    return (
      <div>
        <Typography.Title level={2} style={{ marginTop: 0 }}>
          账户
        </Typography.Title>
        <Typography.Paragraph>当前未登录（或会话已过期）。</Typography.Paragraph>
        <Link to="/login">去登录</Link>
        {" · "}
        <Link to="/register">去注册</Link>
      </div>
    )
  }

  return (
    <div>
      <Typography.Title level={2} style={{ marginTop: 0 }}>
        已登录
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        以下信息来自 <Typography.Text code>GET /api/auth/me</Typography.Text>{" "}
       （HttpOnly Cookie）。
      </Typography.Paragraph>
      <Descriptions bordered column={1} size="small" style={{ marginBottom: 16 }}>
        <Descriptions.Item label="用户 ID">{user.id}</Descriptions.Item>
        <Descriptions.Item label="邮箱">{user.email}</Descriptions.Item>
        <Descriptions.Item label="用户名">
          {user.username ?? "—"}
        </Descriptions.Item>
        <Descriptions.Item label="邮箱已验证">
          {user.emailVerified ? "是" : "否"}
        </Descriptions.Item>
        <Descriptions.Item label="注册时间">{user.createdAt}</Descriptions.Item>
      </Descriptions>
      <Button danger loading={logoutLoading} onClick={() => void onLogout()}>
        退出登录
      </Button>
    </div>
  )
}
