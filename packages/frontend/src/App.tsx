import { Button } from "antd"
import { useEffect, useState } from "react"
import { fetchApi } from "./utils/fetch"
import "./App.css"

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    import.meta.hot!.data.hmrCount = (import.meta.hot!.data.hmrCount ?? 0) + 1
    document.getElementById("hmr-count")!.textContent =
      import.meta.hot!.data.hmrCount.toString()
  })
}

type ApiPayload = {
  message: string
  runtime: string
}

type ApiJson = {
  code: number
  data: ApiPayload
  message: string
  success: boolean
}

export default function App() {
  const [hello, setHello] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchApi("/api/")
      .then(res => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
        return res.json() as Promise<ApiJson>
      })
      .then(body => {
        if (!cancelled) setHello(body.data.message)
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
        {error !== null ? `错误：${error}` : hello !== null ? hello : "加载中…"}
      </p>
      <p>
        <Button
          type="primary"
          onClick={() => {
            import.meta.hot!.send("hmr:increment")
          }}
          disabled={!import.meta.hot}
        >
          触发一次热更新
        </Button>
      </p>
      <p>
        热更新次数：
        <span id="hmr-count">0</span>
      </p>
    </div>
  )
}
