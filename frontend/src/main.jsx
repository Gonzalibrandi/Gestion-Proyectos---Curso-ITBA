import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import './styles/tokens.css'
import './styles/global.css'
import { ThemeProvider } from './context/ThemeProvider'
import { AuthProvider } from './context/AuthProvider'
import { AppRouter } from './routes/router'

// Solo se reintentan las fallas de red (status 0) y los 5xx; un 4xx no cambia al reintentar
const shouldRetry = (failureCount, error) => (error?.status === 0 || error?.status >= 500) && failureCount < 2

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: shouldRetry, refetchOnWindowFocus: false },
  },
})

// MSW solo en desarrollo y con VITE_USE_MOCKS=true (requerimientos.md §11.1).
// En el build de producción import.meta.env.DEV es false: el import dinámico se elimina y MSW no se incluye.
async function enableMocking() {
  if (!import.meta.env.DEV || import.meta.env.VITE_USE_MOCKS !== 'true') return
  const { worker } = await import('./mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <AppRouter />
            <Toaster position="top-right" />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>,
  )
})
