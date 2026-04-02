/**
 * Worker 绑定类型：敏感项通过 wrangler secret / Dashboard 注入，禁止在仓库中硬编码真实值。
 */
export type Bindings = {
  DB: D1Database
  SESSIONS: KVNamespace
  /** 与现有 index 逻辑一致：'true' 表示开发模式 */
  DEV: string
  APP_ENV: string
  APP_NAME: string
  APP_VERSION: string
  /** 应用对外 URL，用于 OAuth redirect_uri */
  APP_URL: string
  /**
   * Google OAuth（通过 wrangler secret / Dashboard 注入，勿硬编码）
   * 本地可写入 packages/backend/.dev.vars
   */
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
  /** 可选：密码哈希额外 pepper（Secret） */
  SESSION_PEPPER?: string
}

export type HonoEnv = { Bindings: Bindings }
