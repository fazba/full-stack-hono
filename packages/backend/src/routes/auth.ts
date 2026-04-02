import type { Context } from "hono"
import { Hono } from "hono"
import { deleteCookie, getCookie, setCookie } from "hono/cookie"
import { jsonError, jsonSuccess } from "../api"
import { cookieSecure } from "../dev"
import type { HonoEnv } from "../env"
import {
  buildGoogleAuthorizeUrl,
  consumeOAuthState,
  exchangeGoogleCode,
  fetchGoogleUserInfo,
  putOAuthState,
} from "../auth/google-oauth"
import { hashPassword, verifyPassword } from "../auth/password"
import {
  clearLoginFailures,
  isLoginBlocked,
  recordLoginFailure,
} from "../auth/rate-limit"
import {
  createSession,
  getSessionUserId,
  revokeSession,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "../auth/session"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_RE = /^[a-zA-Z0-9_]{3,32}$/

function clientKey(c: Context<HonoEnv>) {
  return (
    c.req.header("cf-connecting-ip") ??
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  )
}

function redirectUri(c: Context<HonoEnv>) {
  const base = c.env.APP_URL.replace(/\/$/, "")
  return `${base}/api/auth/google/callback`
}

async function pickUsername(db: D1Database, base: string): Promise<string> {
  const cleaned = base.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 28) || "user"
  let u = cleaned
  for (let i = 0; i < 6; i++) {
    const exists = await db
      .prepare("SELECT 1 AS x FROM users WHERE username = ? COLLATE NOCASE")
      .bind(u)
      .first<{ x: number }>()
    if (!exists) return u
    u = `${cleaned.slice(0, 20)}_${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`
  }
  return `u_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`
}

async function findUserByLogin(
  db: D1Database,
  login: string,
): Promise<{ id: number; password_hash: string | null } | null> {
  const byEmail = await db
    .prepare(
      "SELECT id, password_hash FROM users WHERE email = ? COLLATE NOCASE LIMIT 1",
    )
    .bind(login)
    .first<{ id: number; password_hash: string | null }>()
  if (byEmail) return byEmail
  return await db
    .prepare(
      "SELECT id, password_hash FROM users WHERE username IS NOT NULL AND username = ? COLLATE NOCASE LIMIT 1",
    )
    .bind(login)
    .first<{ id: number; password_hash: string | null }>()
}

async function findOrCreateGoogleUser(
  db: D1Database,
  sub: string,
  email: string,
): Promise<number> {
  const linked = await db
    .prepare(
      "SELECT user_id FROM oauth_accounts WHERE provider = ? AND provider_account_id = ? LIMIT 1",
    )
    .bind("google", sub)
    .first<{ user_id: number }>()
  if (linked) return linked.user_id

  const byEmail = await db
    .prepare("SELECT id FROM users WHERE email = ? COLLATE NOCASE LIMIT 1")
    .bind(email)
    .first<{ id: number }>()
  if (byEmail) {
    await db
      .prepare(
        "INSERT INTO oauth_accounts (user_id, provider, provider_account_id) VALUES (?, ?, ?)",
      )
      .bind(byEmail.id, "google", sub)
      .run()
    return byEmail.id
  }

  const baseName = email.split("@")[0] ?? "user"
  const username = await pickUsername(db, baseName)
  const row = await db
    .prepare(
      `INSERT INTO users (email, username, password_hash, email_verified)
       VALUES (?, ?, NULL, 1) RETURNING id`,
    )
    .bind(email, username)
    .first<{ id: number }>()
  if (!row?.id) throw new Error("insert_user_failed")
  await db
    .prepare(
      "INSERT INTO oauth_accounts (user_id, provider, provider_account_id) VALUES (?, ?, ?)",
    )
    .bind(row.id, "google", sub)
    .run()
  return row.id
}

function publicUser(row: {
  id: number
  email: string
  username: string | null
  email_verified: number
  created_at: string
}) {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    emailVerified: row.email_verified === 1,
    createdAt: row.created_at,
  }
}

export const authRoutes = new Hono<HonoEnv>()

authRoutes.post("/register", async c => {
  let body: { email?: string; username?: string; password?: string }
  try {
    body = (await c.req.json()) as typeof body
  } catch {
    return jsonError(c, "无效的 JSON 请求体", null, 400)
  }
  const email = body.email?.trim()
  const username = body.username?.trim()
  const password = body.password
  if (!email || !EMAIL_RE.test(email)) {
    return jsonError(c, "请提供有效邮箱", null, 400)
  }
  if (!password || password.length < 8) {
    return jsonError(c, "密码长度至少 8 位", null, 400)
  }
  if (username !== undefined && username !== "") {
    if (!USERNAME_RE.test(username)) {
      return jsonError(c, "用户名需为 3–32 位字母、数字或下划线", null, 400)
    }
  }
  const hash = await hashPassword(password, c.env)
  try {
    await c.env.DB.prepare(
      `INSERT INTO users (email, username, password_hash)
       VALUES (?, ?, ?)`,
    )
      .bind(email, username && username !== "" ? username : null, hash)
      .run()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes("UNIQUE") || msg.toLowerCase().includes("unique")) {
      return jsonError(c, "该邮箱或用户名已被注册", null, 409)
    }
    throw e
  }
  const row = await c.env.DB.prepare(
    "SELECT id, email, username, email_verified, created_at FROM users WHERE email = ? COLLATE NOCASE LIMIT 1",
  )
    .bind(email)
    .first<{
      id: number
      email: string
      username: string | null
      email_verified: number
      created_at: string
    }>()
  if (!row) return jsonError(c, "注册后读取用户失败", null, 500)
  const token = await createSession(c.env, row.id)
  const sec = cookieSecure(c)
  setCookie(c, SESSION_COOKIE_NAME, token, sessionCookieOptions(sec))
  return jsonSuccess(c, { user: publicUser(row), token }, "registered", 201)
})

authRoutes.post("/login", async c => {
  const ck = clientKey(c)
  if (await isLoginBlocked(c.env, ck)) {
    return jsonError(c, "登录尝试过多，请稍后再试", null, 429)
  }
  let body: { login?: string; password?: string }
  try {
    body = (await c.req.json()) as typeof body
  } catch {
    return jsonError(c, "无效的 JSON 请求体", null, 400)
  }
  const login = body.login?.trim()
  const password = body.password
  if (!login || !password) {
    return jsonError(c, "请提供登录名与密码", null, 400)
  }
  const user = await findUserByLogin(c.env.DB, login)
  if (!user || !user.password_hash) {
    await recordLoginFailure(c.env, ck)
    return jsonError(c, "邮箱/用户名或密码错误", null, 401)
  }
  const ok = await verifyPassword(password, user.password_hash, c.env)
  if (!ok) {
    await recordLoginFailure(c.env, ck)
    return jsonError(c, "邮箱/用户名或密码错误", null, 401)
  }
  await clearLoginFailures(c.env, ck)
  const row = await c.env.DB.prepare(
    "SELECT id, email, username, email_verified, created_at FROM users WHERE id = ? LIMIT 1",
  )
    .bind(user.id)
    .first<{
      id: number
      email: string
      username: string | null
      email_verified: number
      created_at: string
    }>()
  if (!row) return jsonError(c, "用户不存在", null, 404)
  const token = await createSession(c.env, row.id)
  const sec = cookieSecure(c)
  setCookie(c, SESSION_COOKIE_NAME, token, sessionCookieOptions(sec))
  return jsonSuccess(c, { user: publicUser(row), token }, "ok")
})

authRoutes.post("/logout", async c => {
  const sid = getCookie(c, SESSION_COOKIE_NAME)
  await revokeSession(c.env, sid)
  deleteCookie(c, SESSION_COOKIE_NAME, { path: "/" })
  return jsonSuccess(c, { loggedOut: true }, "ok")
})

authRoutes.get("/me", async c => {
  const sid = getCookie(c, SESSION_COOKIE_NAME)
  const userId = await getSessionUserId(c.env, sid)
  if (!userId) {
    return jsonError(c, "未登录", null, 401)
  }
  const row = await c.env.DB.prepare(
    "SELECT id, email, username, email_verified, created_at FROM users WHERE id = ? LIMIT 1",
  )
    .bind(userId)
    .first<{
      id: number
      email: string
      username: string | null
      email_verified: number
      created_at: string
    }>()
  if (!row) {
    await revokeSession(c.env, sid)
    return jsonError(c, "会话无效", null, 401)
  }
  return jsonSuccess(c, { user: publicUser(row) }, "ok")
})

authRoutes.get("/google", async c => {
  const id = c.env.GOOGLE_CLIENT_ID
  const secret = c.env.GOOGLE_CLIENT_SECRET
  if (!id || !secret) {
    return jsonError(
      c,
      "未配置 Google OAuth（请通过 Secret 注入 GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET）",
      null,
      503,
    )
  }
  const state = crypto.randomUUID() + crypto.randomUUID()
  await putOAuthState(c.env, state)
  const url = buildGoogleAuthorizeUrl(id, redirectUri(c), state)
  return c.redirect(url)
})

authRoutes.get("/google/callback", async c => {
  const id = c.env.GOOGLE_CLIENT_ID
  const secret = c.env.GOOGLE_CLIENT_SECRET
  if (!id || !secret) {
    return jsonError(
      c,
      "未配置 Google OAuth",
      null,
      503,
    )
  }
  const q = c.req.query()
  const err = q.error
  if (err) {
    return jsonError(c, `Google 授权失败: ${err}`, null, 400)
  }
  const code = q.code
  const state = q.state
  if (!(await consumeOAuthState(c.env, state))) {
    return jsonError(c, "无效或已过期的 state（CSRF 校验失败）", null, 400)
  }
  if (!code) {
    return jsonError(c, "缺少授权码", null, 400)
  }
  let tokens: { access_token: string }
  try {
    tokens = await exchangeGoogleCode(id, secret, code, redirectUri(c))
  } catch {
    return jsonError(c, "换取访问令牌失败", null, 502)
  }
  let info: Awaited<ReturnType<typeof fetchGoogleUserInfo>>
  try {
    info = await fetchGoogleUserInfo(tokens.access_token)
  } catch {
    return jsonError(c, "获取 Google 用户信息失败", null, 502)
  }
  const email = info.email?.trim()
  if (!email || !EMAIL_RE.test(email)) {
    return jsonError(c, "无法从 Google 账户获取有效邮箱", null, 400)
  }
  let userId: number
  try {
    userId = await findOrCreateGoogleUser(c.env.DB, info.sub, email)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes("UNIQUE") || msg.toLowerCase().includes("unique")) {
      return jsonError(c, "账号关联冲突，请联系管理员", null, 409)
    }
    throw e
  }
  const token = await createSession(c.env, userId)
  const sec = cookieSecure(c)
  setCookie(c, SESSION_COOKIE_NAME, token, sessionCookieOptions(sec))
  const row = await c.env.DB.prepare(
    "SELECT id, email, username, email_verified, created_at FROM users WHERE id = ? LIMIT 1",
  )
    .bind(userId)
    .first<{
      id: number
      email: string
      username: string | null
      email_verified: number
      created_at: string
    }>()
  if (!row) return jsonError(c, "用户读取失败", null, 500)
  return jsonSuccess(
    c,
    { user: publicUser(row), token },
    "ok",
  )
})
