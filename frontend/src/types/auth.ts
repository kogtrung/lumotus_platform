export type UserRole = 'USER' | 'ADMIN'

export interface User {
  id: string
  username: string
  email: string
  role: UserRole
  xp: number
  streak: number
  avatarUrl: string | null
}

export interface AuthResponse {
  accessToken: string
  tokenType: string
  user: User
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  username: string
  email: string
  password: string
}
