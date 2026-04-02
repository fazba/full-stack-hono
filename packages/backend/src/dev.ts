import type { Context } from "hono"
import type { HonoEnv } from "./env"

export function isServerDevMode(c: Context<HonoEnv>) {
  if (c.env.DEV === "true") return true
  const host = new URL(c.req.url).hostname
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]"
}

export function cookieSecure(c: Context<HonoEnv>) {
  return !isServerDevMode(c)
}
