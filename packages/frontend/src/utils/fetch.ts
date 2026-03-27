/**
 * 全局请求入口：所有 HTTP 调用应通过 fetchApi，便于统一处理（头、鉴权、错误、日志等）。
 */
export function fetchApi(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers)
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json")
  }

  return fetch(input, {
    ...init,
    headers,
  })
}
