import type { Bindings } from "../env"

const PBKDF2_ITERATIONS = 110_000
const SALT_BYTES = 16
const DK_LEN = 32

function toHex(u8: Uint8Array): string {
  return [...u8].map(b => b.toString(16).padStart(2, "0")).join("")
}

function fromHex(s: string): Uint8Array {
  const out = new Uint8Array(s.length / 2)
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16)
  }
  return out
}

function getPepper(env: Bindings): string {
  return env.SESSION_PEPPER ?? ""
}

/**
 * 使用 Web Crypto PBKDF2-SHA256 存储密码（Workers 原生能力，无额外依赖）。
 * 格式：pbkdf2_sha256$<iter>$<salt_hex>$<hash_hex>
 */
export async function hashPassword(
  password: string,
  env: Bindings,
): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const material = new TextEncoder().encode(getPepper(env) + password)
  const key = await crypto.subtle.importKey(
    "raw",
    material,
    "PBKDF2",
    false,
    ["deriveBits"],
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations: PBKDF2_ITERATIONS,
    },
    key,
    DK_LEN * 8,
  )
  const hash = new Uint8Array(bits)
  return `pbkdf2_sha256$${PBKDF2_ITERATIONS}$${toHex(salt)}$${toHex(hash)}`
}

export async function verifyPassword(
  password: string,
  stored: string,
  env: Bindings,
): Promise<boolean> {
  const parts = stored.split("$")
  if (parts.length !== 4 || parts[0] !== "pbkdf2_sha256") return false
  const iterations = Number(parts[1])
  if (!Number.isFinite(iterations) || iterations < 1) return false
  const salt = fromHex(parts[2])
  const expected = fromHex(parts[3])
  const material = new TextEncoder().encode(getPepper(env) + password)
  const key = await crypto.subtle.importKey(
    "raw",
    material,
    "PBKDF2",
    false,
    ["deriveBits"],
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations,
    },
    key,
    expected.length * 8,
  )
  const actual = new Uint8Array(bits)
  if (actual.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < actual.length; i++) {
    diff |= actual[i]! ^ expected[i]!
  }
  return diff === 0
}
