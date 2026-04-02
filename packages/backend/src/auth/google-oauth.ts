const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth"
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token"
const GOOGLE_USERINFO = "https://www.googleapis.com/oauth2/v3/userinfo"

export function buildGoogleAuthorizeUrl(
  clientId: string,
  redirectUri: string,
  state: string,
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: ["openid", "email", "profile"].join(" "),
    state,
    access_type: "online",
    prompt: "select_account",
  })
  return `${GOOGLE_AUTH}?${params.toString()}`
}

export async function exchangeGoogleCode(
  clientId: string,
  clientSecret: string,
  code: string,
  redirectUri: string,
): Promise<{ access_token: string }> {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  })
  const res = await fetch(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`google_token_error:${res.status}:${t.slice(0, 200)}`)
  }
  return res.json() as Promise<{ access_token: string }>
}

export type GoogleUserInfo = {
  sub: string
  email?: string
  email_verified?: boolean
  name?: string
  picture?: string
}

export async function fetchGoogleUserInfo(
  accessToken: string,
): Promise<GoogleUserInfo> {
  const res = await fetch(GOOGLE_USERINFO, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`google_userinfo_error:${res.status}:${t.slice(0, 200)}`)
  }
  return res.json() as Promise<GoogleUserInfo>
}

export async function putOAuthState(
  env: { SESSIONS: KVNamespace },
  state: string,
) {
  await env.SESSIONS.put(`oauthst:${state}`, "1", { expirationTtl: 600 })
}

export async function consumeOAuthState(
  env: { SESSIONS: KVNamespace },
  state: string | undefined,
): Promise<boolean> {
  if (!state) return false
  const key = `oauthst:${state}`
  const v = await env.SESSIONS.get(key)
  if (v !== "1") return false
  await env.SESSIONS.delete(key)
  return true
}
