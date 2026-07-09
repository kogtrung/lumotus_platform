import axiosClient from '@/api/axiosClient'
import type { AuthResponse, LoginPayload, RegisterPayload, User } from '@/types/auth'

export const authApi = {
  register: (payload: RegisterPayload) =>
    axiosClient.post<AuthResponse>('/auth/register', payload),

  login: (payload: LoginPayload) => axiosClient.post<AuthResponse>('/auth/login', payload),

  googleLogin: (payload: { idToken: string }) =>
    axiosClient.post<AuthResponse>('/auth/google', payload),

  refresh: () => axiosClient.post<AuthResponse>('/auth/refresh'),

  logout: () => axiosClient.post('/auth/logout'),

  me: () => axiosClient.get<User>('/auth/me'),

  updateProfile: (payload: { username?: string; avatarUrl?: string }) =>
    axiosClient.put<User>('/auth/me', payload),

  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    axiosClient.put('/auth/me/password', payload),
}
