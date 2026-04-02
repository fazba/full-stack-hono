import type { Bindings } from "../env"

const PREFIX = "rl:login:"
const MAX_FAIL = 8
const WINDOW_SEC = 15 * 60

export async function isLoginBlocked(
  env: Bindings,
  clientKey: string,
): Promise<boolean> {
  const raw = await env.SESSIONS.get(`${PREFIX}${clientKey}`)
  const n = raw ? Number.parseInt(raw, 10) : 0
  return Number.isFinite(n) && n >= MAX_FAIL
}

export async function recordLoginFailure(env: Bindings, clientKey: string) {
  const raw = await env.SESSIONS.get(`${PREFIX}${clientKey}`)
  const prev = raw ? Number.parseInt(raw, 10) : 0
  const n = Number.isFinite(prev) ? prev + 1 : 1
  await env.SESSIONS.put(`${PREFIX}${clientKey}`, String(n), {
    expirationTtl: WINDOW_SEC,
  })
}

export async function clearLoginFailures(env: Bindings, clientKey: string) {
  await env.SESSIONS.delete(`${PREFIX}${clientKey}`)
}
