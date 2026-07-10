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
  _clearListeners: Array<() => void>
  onClearAuth: (listener: () => void) => () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      isInitialized: false,
      _clearListeners: [],

      setAuth: (accessToken, user) => set({ accessToken, user }),

      clearAuth: () => {
        set({ accessToken: null, user: null })
        get()._clearListeners.forEach((fn) => fn())
      },

      setInitialized: (isInitialized) => set({ isInitialized }),

      onClearAuth: (listener: () => void) => {
        set((s) => ({ _clearListeners: [...s._clearListeners, listener] }))
        return () => {
          set((s) => ({ _clearListeners: s._clearListeners.filter((l) => l !== listener) }))
        }
      },
    }),
    {
      name: 'lumotus-auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ accessToken: state.accessToken, user: state.user }),
    },
  ),
)
