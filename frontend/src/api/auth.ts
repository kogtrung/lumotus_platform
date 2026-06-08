import axiosClient from '@/api/axiosClient'
import type { AuthResponse, LoginPayload, RegisterPayload, User } from '@/types/auth'

export const authApi = {
  register: (payload: RegisterPayload) =>
    axiosClient.post<AuthResponse>('/auth/register', payload),

  login: (payload: LoginPayload) => axiosClient.post<AuthResponse>('/auth/login', payload),

  refresh: () => axiosClient.post<AuthResponse>('/auth/refresh'),

  logout: () => axiosClient.post('/auth/logout'),

  me: () => axiosClient.get<User>('/auth/me'),
}
