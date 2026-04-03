import { App as AntdApp, ConfigProvider } from "antd"
import zhCN from "antd/locale/zh_CN"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router-dom"

import { routes } from "./routes"
import "./index.css"

const router = createBrowserRouter(routes)

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConfigProvider locale={zhCN}>
      <AntdApp>
        <RouterProvider router={router} />
      </AntdApp>
    </ConfigProvider>
  </StrictMode>,
)
