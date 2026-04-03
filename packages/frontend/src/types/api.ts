/** 与后端 jsonSuccess / jsonError 一致的最小外壳 */
export type ApiEnvelope<T> = {
  success: boolean
  code: number
  message: string
  data: T
}

export type PublicUser = {
  id: number
  email: string
  username: string | null
  emailVerified: boolean
  createdAt: string
}

export type AuthUserToken = {
  user: PublicUser
  token: string
}

export type MeData = {
  user: PublicUser
}

export type LogoutData = {
  loggedOut: boolean
}
