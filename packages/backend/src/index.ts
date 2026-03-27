import { Hono } from "hono"
import { jsonSuccess } from "./api-response.js"
import { documentHtml } from "./html"

const app = new Hono()

app.get("/", c => c.html(documentHtml(c.req.query("dev") === "true")))

app.get("/api/", c =>
  jsonSuccess(
    c,
    {
      message: "Hello from Hono on Cloudflare Workers",
      runtime: "cloudflare-workers",
    },
    "ok",
  ),
)

app.get("/api/health", c => c.text("ok"))

export default app
