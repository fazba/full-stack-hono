import { Button, Typography } from "antd"
import { useEffect, useState } from "react"

import type { ApiEnvelope } from "../types/api"
import { fetchApi } from "../utils/fetch"

import "../App.css"

type HelloData = {
  message: string
  runtime: string
  mode: string
}

export function HomePage() {
  const [hello, setHello] = useState<string | null>(null)
  const [mode, setMode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [count, setCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetchApi("/api/")
      .then(res => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
        return res.json() as Promise<ApiEnvelope<HelloData>>
      })
      .then(body => {
        if (!cancelled && body.success) {
          setHello(body.data.message)
          setMode(body.data.mode)
        } else if (!cancelled) {
          setError(body.message ?? "请求失败")
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "请求失败")
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="app">
      <Typography.Title level={2} style={{ marginTop: 0 }}>
        首页
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        Vite 8 · React · TypeScript · oxlint · oxfmt
      </Typography.Paragraph>
      <Typography.Paragraph>
        Backend-Hello:{" "}
        {error !== null ? (
          `错误：${error}`
        ) : hello !== null ? (
          <>
            {hello} —— 当前服务端环境：{mode}
          </>
        ) : (
          "加载中…"
        )}
      </Typography.Paragraph>
      <p>
        <Button
          type="primary"
          onClick={() => {
            setCount(count + 1)
          }}
          disabled={!import.meta.hot}
        >
          点击OK
        </Button>
      </p>
      <p>次数：{count}</p>
      <p>当前前端环境：{import.meta.env.MODE}</p>
    </div>
  )
}
