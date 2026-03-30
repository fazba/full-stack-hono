import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // 允许从远程页面（如 Workers ?dev=true）加载 localhost 上的模块，避免 ES module 跨域失败
    cors: true,
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
})
