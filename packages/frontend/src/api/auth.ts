import type { ApiEnvelope } from "../types/api"
import { fetchApi } from "../utils/fetch"

const JSON_HEADERS = {
  "Content-Type": "application/json",
} as const

const WITH_COOKIE: RequestInit = {
  credentials: "include",
}

export async function register(body: {
  email: string
  password: string
  username?: string
}): Promise<Response> {
  return fetchApi("/api/auth/register", {
    method: "POST",
    ...WITH_COOKIE,
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  })
}

export async function login(body: {
  login: string
  password: string
}): Promise<Response> {
  return fetchApi("/api/auth/login", {
    method: "POST",
    ...WITH_COOKIE,
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  })
}

export async function logout(): Promise<Response> {
  return fetchApi("/api/auth/logout", {
    method: "POST",
    ...WITH_COOKIE,
  })
}

export async function me(): Promise<Response> {
  return fetchApi("/api/auth/me", {
    method: "GET",
    ...WITH_COOKIE,
  })
}

export async function parseAuthJson<T>(
  res: Response,
): Promise<ApiEnvelope<T>> {
  const text = await res.text()
  let parsed: unknown
  try {
    parsed = text ? JSON.parse(text) : {}
  } catch {
    throw new Error("服务器返回了非 JSON 响应")
  }
  return parsed as ApiEnvelope<T>
}
