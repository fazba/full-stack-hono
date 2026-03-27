import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

/** 统一 JSON 响应结构 */
export type ApiJsonBody<T = unknown> = {
  code: 0 | -1;
  data: T;
  message: string;
  success: boolean;
};

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
  };
  return c.json(body, status);
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
  };
  return c.json(body, status);
}
