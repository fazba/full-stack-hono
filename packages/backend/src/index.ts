import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) =>
  c.json({
    message: "Hello from Hono on Cloudflare Workers",
    runtime: "cloudflare-workers",
  }),
);

app.get("/health", (c) => c.text("ok"));

export default app;
