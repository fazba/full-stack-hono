import { Button } from "antd"
import { useEffect, useState } from "react"
import { fetchApi } from "./utils/fetch"
import "./App.css"

type ApiJson = {
  code: number
  data: Record<string, string>
  message: string
  success: boolean
}

export default function App() {
  const [hello, setHello] = useState<string | null>(null)
  const [mode, setMode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [count, setCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetchApi("/api/")
      .then(res => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
        return res.json() as Promise<ApiJson>
      })
      .then(body => {
        if (!cancelled) {
          setHello(body.data.message)
          setMode(body.data.mode)
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
      <h1>Frontend</h1>
      <p>Vite 8 · React · TypeScript · oxlint · oxfmt</p>
      <p>
        Backend-Hello:{" "}
        {error !== null ? (
          `错误：${error}`
        ) : hello !== null ? (
          <p>
            {hello} —— 当前服务端环境：{mode}
          </p>
        ) : (
          "加载中…"
        )}
      </p>
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
