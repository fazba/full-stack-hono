import type { Bindings } from "../env"

export const SESSION_COOKIE_NAME = "sid"
const SESSION_TTL_SEC = 60 * 60 * 24 * 7

export type SessionPayload = {
  userId: number
  exp: number
}

export async function createSession(
  env: Bindings,
  userId: number,
): Promise<string> {
  const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "")
  const key = `sess:${token}`
  const exp = Date.now() + SESSION_TTL_SEC * 1000
  const payload: SessionPayload = { userId, exp }
  await env.SESSIONS.put(key, JSON.stringify(payload), {
    expirationTtl: SESSION_TTL_SEC,
  })
  return token
}

export async function revokeSession(env: Bindings, token: string | undefined) {
  if (!token) return
  await env.SESSIONS.delete(`sess:${token}`)
}

export async function getSessionUserId(
  env: Bindings,
  token: string | undefined,
): Promise<number | null> {
  if (!token) return null
  const raw = await env.SESSIONS.get(`sess:${token}`)
  if (!raw) return null
  let payload: SessionPayload
  try {
    payload = JSON.parse(raw) as SessionPayload
  } catch {
    return null
  }
  if (typeof payload.userId !== "number" || typeof payload.exp !== "number") {
    return null
  }
  if (Date.now() > payload.exp) {
    await env.SESSIONS.delete(`sess:${token}`)
    return null
  }
  return payload.userId
}

export function sessionCookieOptions(secure: boolean) {
  return {
    path: "/",
    httpOnly: true,
    sameSite: "Lax" as const,
    secure,
    maxAge: SESSION_TTL_SEC,
  }
}
