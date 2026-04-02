import { SELF } from "cloudflare:test"
import { describe, expect, it } from "vitest"

const base = "http://localhost:8787"

type ApiBody<T> = {
  success: boolean
  code: number
  message: string
  data: T
}

async function readJson<T>(res: Response): Promise<ApiBody<T>> {
  return res.json() as Promise<ApiBody<T>>
}

function uniqueEmail() {
  return `u_${crypto.randomUUID()}@test.example`
}

describe("认证 API", () => {
  it("POST /api/auth/register：无效邮箱返回 400", async () => {
    const res = await SELF.fetch(`${base}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "not-an-email",
        password: "password12",
      }),
    })
    expect(res.status).toBe(400)
    const j = await readJson<null>(res)
    expect(j.success).toBe(false)
  })

  it("POST /api/auth/register：密码过短返回 400", async () => {
    const res = await SELF.fetch(`${base}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: uniqueEmail(),
        password: "short",
      }),
    })
    expect(res.status).toBe(400)
  })

  it("POST /api/auth/register：非法用户名返回 400", async () => {
    const res = await SELF.fetch(`${base}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: uniqueEmail(),
        username: "ab",
        password: "password12",
      }),
    })
    expect(res.status).toBe(400)
  })

  it("POST /api/auth/register：成功注册并返回 token 与 Cookie", async () => {
    const email = uniqueEmail()
    const res = await SELF.fetch(`${base}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        username: "testuser",
        password: "password12",
      }),
    })
    expect(res.status).toBe(201)
    const j = await readJson<{
      user: { email: string }
      token: string
    }>(res)
    expect(j.success).toBe(true)
    expect(j.data.user.email.toLowerCase()).toBe(email.toLowerCase())
    expect(j.data.token.length).toBeGreaterThan(10)
    const set = res.headers.get("set-cookie")
    expect(set).toContain("sid=")
  })

  it("POST /api/auth/register：重复邮箱返回 409", async () => {
    const email = uniqueEmail()
    const body = JSON.stringify({ email, password: "password12" })
    const first = await SELF.fetch(`${base}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    })
    expect(first.status).toBe(201)
    const dup = await SELF.fetch(`${base}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    })
    expect(dup.status).toBe(409)
  })

  it("POST /api/auth/login：邮箱登录成功", async () => {
    const email = uniqueEmail()
    const password = "password12"
    const reg = await SELF.fetch(`${base}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    expect(reg.status).toBe(201)

    const res = await SELF.fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login: email, password }),
    })
    expect(res.status).toBe(200)
    const j = await readJson<{ token: string }>(res)
    expect(j.success).toBe(true)
    expect(j.data.token.length).toBeGreaterThan(10)
  })

  it("POST /api/auth/login：错误密码返回 401", async () => {
    const email = uniqueEmail()
    await SELF.fetch(`${base}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "password12" }),
    })
    const res = await SELF.fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login: email, password: "wrong-password" }),
    })
    expect(res.status).toBe(401)
  })

  it("GET /api/auth/me：无 Cookie 返回 401", async () => {
    const res = await SELF.fetch(`${base}/api/auth/me`)
    expect(res.status).toBe(401)
  })

  it("GET /api/auth/me：携带 sid 返回当前用户", async () => {
    const email = uniqueEmail()
    const reg = await SELF.fetch(`${base}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "password12" }),
    })
    const regJson = await readJson<{ token: string }>(reg)
    const token = regJson.data.token

    const me = await SELF.fetch(`${base}/api/auth/me`, {
      headers: { Cookie: `sid=${token}` },
    })
    expect(me.status).toBe(200)
    const meJson = await readJson<{ user: { email: string } }>(me)
    expect(meJson.data.user.email.toLowerCase()).toBe(email.toLowerCase())
  })

  it("POST /api/auth/logout：清除会话", async () => {
    const email = uniqueEmail()
    const reg = await SELF.fetch(`${base}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "password12" }),
    })
    const { data } = await readJson<{ token: string }>(reg)
    const token = data.token

    const out = await SELF.fetch(`${base}/api/auth/logout`, {
      method: "POST",
      headers: { Cookie: `sid=${token}` },
    })
    expect(out.status).toBe(200)

    const me = await SELF.fetch(`${base}/api/auth/me`, {
      headers: { Cookie: `sid=${token}` },
    })
    expect(me.status).toBe(401)
  })

  it("GET /api/auth/google：未配置 OAuth 时返回 503", async () => {
    const res = await SELF.fetch(`${base}/api/auth/google`)
    expect(res.status).toBe(503)
    const j = await readJson<null>(res)
    expect(j.success).toBe(false)
  })

  it("未允许的 HTTP 方法对 /api/auth/me 返回 405", async () => {
    const res = await SELF.fetch(`${base}/api/auth/me`, { method: "DELETE" })
    expect(res.status).toBe(405)
  })
})
