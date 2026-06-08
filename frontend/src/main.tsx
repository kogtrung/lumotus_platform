import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Toaster } from 'react-hot-toast'
import { initializeAuth, setupAxiosInterceptors } from '@/api/setupInterceptors'
import App from './App'
import './index.css'

setupAxiosInterceptors()

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

function Bootstrap() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    initializeAuth().finally(() => setReady(true))
  }, [])

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[var(--color-text-muted)]">
        Đang tải...
      </div>
    )
  }

  return <App />
}

function AppTree() {
  const tree = (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <Bootstrap />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#FFFFFF',
              color: '#1A2332',
              border: '1px solid #E8EDF4',
            },
          }}
        />
      </QueryClientProvider>
    </BrowserRouter>
  )

  if (!googleClientId) {
    return tree
  }

  return <GoogleOAuthProvider clientId={googleClientId}>{tree}</GoogleOAuthProvider>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppTree />
  </StrictMode>,
)
