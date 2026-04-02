import { env } from "cloudflare:test"
import { describe, expect, it } from "vitest"
import { hashPassword, verifyPassword } from "../src/auth/password"

describe("password (PBKDF2)", () => {
  it("hash 与 verify 可往返", async () => {
    const stored = await hashPassword("correct horse battery staple", env)
    expect(stored.startsWith("pbkdf2_sha256$")).toBe(true)
    expect(await verifyPassword("correct horse battery staple", stored, env)).toBe(
      true,
    )
    expect(await verifyPassword("wrong", stored, env)).toBe(false)
  })

  it("错误格式存储串校验失败", async () => {
    expect(await verifyPassword("x", "not$valid$format", env)).toBe(false)
  })
})
