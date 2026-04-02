import type { Context } from "hono"
import { Hono } from "hono"
import { apiRouteMiddleware, jsonSuccess } from "./api"
import { documentHtml } from "./html"

type Bindings = {
  DEV: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use("/api/*", apiRouteMiddleware)

function isServerDevMode(c: Context<{ Bindings: Bindings }>) {
  if (c.env.DEV === "true") return true
  const host = new URL(c.req.url).hostname
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]"
}

app.get("/", c =>
  c.html(documentHtml(c.req.query("dev") === "true" || isServerDevMode(c))),
)

app.get("/api/", c =>
  jsonSuccess(
    c,
    {
      message: "Hello from Hono on Cloudflare Workers",
      runtime: "cloudflare-workers",
      mode: isServerDevMode(c) ? "dev" : "prod",
    },
    "ok",
  ),
)

app.get("/api/health", c => c.text("ok"))

export default app
