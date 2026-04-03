## 任务目标

在 **[packages/frontend/src](packages/frontend/src)** 中，依据后端说明文档 **[agents/backend/auth_system_260402.md](agents/backend/auth_system_260402.md)**，实现**邮箱/密码注册**与**登录**页面，并完成与现有 Vite 开发代理（`/api` → 本地 Worker）的对接。

**不在本次范围（除非另行说明）**：Google OAuth 入口与回调页（后端文档注明 OAuth 回调当前为 JSON 响应，浏览器全页跳转体验需后端或方案配合后再做）。

---

## 已确认的范围（2026-04-03）

| 项 | 结论 |
| --- | --- |
| **Google 登录按钮** | **不包含**。不实现「用 Google 登录」跳转 `GET /api/auth/google`；后续若后端回调改为可浏览器消费的体验，再单开任务。 |
| **受保护路由与 `/me`** | **不强制**。登录成功后的去向（首页或占位「已登录」页）任选其一并保持自洽；若实现占位页，可**选用** `GET /api/auth/me` + Cookie 校验当前用户，但**不要求**全应用受保护路由或必须调用 `/me`。 |

---

## 依赖与约束

- **路由**：使用 **react-router-dom**（v6+），采用 **`createBrowserRouter` + `RouteObject[]` 数组形式**集中定义路由（禁止仅在一处手写零散 `<Routes>` 而无统一路由表）。
- **UI**：沿用现有 **Ant Design**（[packages/frontend/package.json](packages/frontend/package.json) 已含 `antd`）。
- **HTTP**：所有请求经 **[packages/frontend/src/utils/fetch.ts](packages/frontend/src/utils/fetch.ts)** 的 `fetchApi`；对需携带会话 Cookie 的请求必须设置 **`credentials: "include"`**（与后端 `Set-Cookie sid` + HttpOnly 一致）。
- **API 契约**（以前述后端文档为准，勿臆造字段）：
  - `POST /api/auth/register`：JSON `{ email, password, username? }`（`password` ≥8；`username` 若提供为 3–32 位字母数字下划线）；成功 **201**，`data` 含 `user`、`token`。
  - `POST /api/auth/login`：JSON `{ login, password }`（`login` 为邮箱或用户名）；成功时 `data` 含 `user`、`token`。
  - 统一 JSON 外壳：`success`、`code`、`message`、`data`；错误时展示 `message`（及必要时 `code`）。
- **开发环境**：依赖 [packages/frontend/vite.config.ts](packages/frontend/vite.config.ts) 中已有 `server.proxy["/api"]`；无需为同站 Cookie 额外配置 CORS（文档说明 `/api` 未放宽跨域）。

---

## 功能与页面要求

1. **注册页**：表单字段与校验与后端一致；提交成功后给出明确反馈（如成功提示并跳转登录页，或按你选择的 UX，需自洽）。
2. **登录页**：提交成功后给出明确反馈；可选：登录后跳转应用首页或占位「已登录」页（若实现占位页，应用 **GET `/api/auth/me`** + Cookie 校验当前用户）。
3. **导航**：在应用内提供注册/登录入口链接（如 Header 或简单链接区），路由路径命名清晰（如 `/register`、`/login`）。
4. **错误与加载态**：网络错误、4xx/5xx 及业务 `success: false` 时有用户可读提示；提交中禁用按钮或显示 loading。

---

## 代码组织要求

- 新增 **`routes` 配置模块**（例如 `src/routes/index.tsx` 或 `src/routes/config.tsx`）：导出 **`RouteObject[]`**，在入口用 `createBrowserRouter` + `RouterProvider` 挂载（可调整 [packages/frontend/src/main.tsx](packages/frontend/src/main.tsx) / [App.tsx](packages/frontend/src/App.tsx) 结构，避免重复根组件）。
- 页面组件建议放在 **`src/pages/`**（或项目内一致目录），与路由表分离。
- 类型：为 API 响应定义最小 TypeScript 类型，避免滥用 `any`。
- 保持与现有代码风格一致（oxlint / oxfmt、import 风格与 [App.tsx](packages/frontend/src/App.tsx) 对齐）。

---

## 验收标准

- `pnpm` 工作区内前端可 `dev` 启动，注册/登录流程在本地代理下可打通（Worker 与 D1/KV 按后端项目说明已就绪的前提下）。
- 路由由**数组配置**驱动，新增页面主要通过改路由表而非散落的 JSX 路由。
- 无未解释的硬编码 API 根路径；路径与文档一致（`/api/auth/...`）。

---

## 参考文档

- 后端认证与 API 细节：**[agents/backend/auth_system_260402.md](agents/backend/auth_system_260402.md)**（唯一事实来源）。
