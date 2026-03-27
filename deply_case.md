# Cloudflare 部署方案（前后端分离）

## 目标

- 后端单独部署到 Cloudflare Workers
- 前端单独在云端构建，并通过 Cloudflare CDN 分发

## 推荐架构

- 后端：`packages/backend` -> Cloudflare Workers
- 前端：`packages/frontend` -> Cloudflare Pages（连接 Git 自动构建）

## 后端部署（Workers）

在 `packages/backend` 下执行：

```bash
pnpm install
pnpm deploy
```

说明：
- 当前项目已具备 `wrangler.toml` 和 `deploy` 脚本
- 成功后会得到一个 `*.workers.dev` 的后端地址

## 前端部署（Pages + 云端构建 + CDN）

在 Cloudflare Dashboard 中创建 Pages 项目并连接 Git 仓库，配置如下：

- Root directory: `packages/frontend`
- Build command: `pnpm install --frozen-lockfile && pnpm build`
- Build output directory: `dist`

说明：
- 每次 push 会触发云端构建
- 构建产物自动发布到 Cloudflare 全球 CDN

## 前后端分离时的关键配置

### 1) 前端 API 基础地址

当前前端使用 `fetchApi("/api/")`（同域写法）。分离部署后建议使用环境变量：

- 变量名：`VITE_API_BASE_URL`
- 值示例：`https://your-backend.workers.dev`

并在前端请求层统一拼接该地址。

### 2) 后端 CORS

由于前后端是不同域名，后端需要启用 CORS，允许前端 Pages 域名访问。

建议：
- 仅允许你的前端域名（不要在生产环境宽泛放开）
- 按需放行请求方法和请求头

## 发布流程建议

- 发布后端：`pnpm --filter @full-stack-hono/backend deploy`
- 发布前端：push 代码到 Git，Cloudflare Pages 自动构建并刷新 CDN

