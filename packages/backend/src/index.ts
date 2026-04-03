import { Hono } from "hono"
import { apiRouteMiddleware, jsonSuccess } from "./api"
import { isServerDevMode } from "./dev"
import type { HonoEnv } from "./env"
import { documentHtml } from "./html"
import { authRoutes } from "./routes/auth"

const app = new Hono<HonoEnv>()

app.use("/api/*", apiRouteMiddleware)

app.route("/api/auth", authRoutes)

app.get("/", c =>
  c.html(
    documentHtml(
      c.req.query("dev") === "true" || isServerDevMode(c),
      c.req.query("pre"),
    ),
  ),
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
