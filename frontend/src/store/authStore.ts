import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { User } from '@/types/auth'

interface AuthState {
  accessToken: string | null
  user: User | null
  isInitialized: boolean
  setAuth: (accessToken: string, user: User) => void
  clearAuth: () => void
  setInitialized: (value: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      isInitialized: false,
      setAuth: (accessToken, user) => set({ accessToken, user }),
      clearAuth: () => set({ accessToken: null, user: null }),
      setInitialized: (isInitialized) => set({ isInitialized }),
    }),
    {
      name: 'lumotus-auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ accessToken: state.accessToken, user: state.user }),
    },
  ),
)
