import type { Context, MiddlewareHandler } from "hono"
import type { ContentfulStatusCode } from "hono/utils/http-status"

/**
 * 禁止浏览器跨源脚本读取 API 响应：不下发 Access-Control-Allow-Origin。
 * 预检 OPTIONS 仅返回 204，不授予跨域权限。
 * Cross-Origin-Resource-Policy 限制跨源嵌入（如 iframe）。
 */
const API_DENY_CROSS_ORIGIN_HEADERS = {
  "Cross-Origin-Resource-Policy": "same-origin",
} as const

/** 允许的 HTTP 方法（不含 OPTIONS；OPTIONS 由预检单独处理） */
const API_ALLOWED_METHODS = ["GET", "POST"] as const

/** 处理 API 预检：无 CORS 放行，跨域前端无法通过预检发起实际请求 */
function handleApiPreflight(c: Context): Response | undefined {
  if (c.req.method !== "OPTIONS") return undefined
  return c.body(null, 204, { ...API_DENY_CROSS_ORIGIN_HEADERS })
}

/**
 * 挂载在 /api/* 上：统一 OPTIONS 与响应头，禁止跨域访问 API；仅允许 GET、POST。
 */
export const apiRouteMiddleware: MiddlewareHandler = async (c, next) => {
  const preflight = handleApiPreflight(c)
  if (preflight) return preflight
  const method = c.req.method
  if (method !== "GET" && method !== "POST") {
    c.header("Allow", API_ALLOWED_METHODS.join(", "))
    return jsonError(c, `不允许的请求方法: ${method}`, null, 405)
  }
  await next()
  for (const [k, v] of Object.entries(API_DENY_CROSS_ORIGIN_HEADERS)) {
    c.res.headers.set(k, v)
  }
}

/** 统一 JSON 响应结构 */
export type ApiJsonBody<T = unknown> = {
  code: 0 | -1
  data: T
  message: string
  success: boolean
}

export function jsonSuccess<T>(
  c: Context,
  data: T,
  message = "ok",
  status: ContentfulStatusCode = 200,
) {
  const body: ApiJsonBody<T> = {
    code: 0,
    data,
    message,
    success: true,
  }
  return c.json(body, status)
}

export function jsonError<T = unknown>(
  c: Context,
  message: string,
  data: T = null as T,
  status: ContentfulStatusCode = 400,
) {
  const body: ApiJsonBody<T | null> = {
    code: -1,
    data,
    message,
    success: false,
  }
  return c.json(body, status)
}
