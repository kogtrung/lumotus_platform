import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { initializeAuth, setupAxiosInterceptors } from '@/api/setupInterceptors'
import App from './App'
import './index.css'

setupAxiosInterceptors()

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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
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
  </StrictMode>,
)
