import { html } from "hono/html"
import type { FC } from "hono/jsx"

const DEV_REFRESH_SNIPPET = `
        import RefreshRuntime from 'http://localhost:5173/@react-refresh'

        RefreshRuntime.injectIntoGlobalHook(window)
        window.$RefreshReg$ = () => {
        }
        window.$RefreshSig$ = () => (type) => type
        window.__vite_plugin_react_preamble_installed__ = true
    `

const DevScripts: FC = () => (
  <>
    <script type="module" src="http://localhost:5173/@vite/client" />
    <script
      type="module"
      dangerouslySetInnerHTML={{ __html: DEV_REFRESH_SNIPPET }}
    />
    <script type="module" src="http://localhost:5173/src/main.tsx" />
  </>
)

const hostname = "full-stack-hono.pages.dev"

const ProdScripts: FC = () => (
  <script
    type="module"
    crossorigin="anonymous"
    src={`https://${hostname}/assets/main.js`}
  />
)
const ProdStyles: FC = () => (
  <link
    rel="stylesheet"
    crossorigin="anonymous"
    href={`https://${hostname}/assets/main.css`}
  />
)

export function documentHtml(dev: boolean) {
  return html`<!DOCTYPE html>${(
      <html lang="zh-CN">
        <head>
          <meta charset="UTF-8" />
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <title>full-stack-hono</title>
          {dev ? null : <ProdStyles />}
        </head>
        <body>
          <div id="root" />
          {dev ? <DevScripts /> : <ProdScripts />}
        </body>
      </html>
    )}`
}
