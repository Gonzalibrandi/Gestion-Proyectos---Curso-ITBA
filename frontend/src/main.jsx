import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/global.css'
import { ThemeProvider } from './context/ThemeProvider'
import App from './App'

// MSW solo en desarrollo y con VITE_USE_MOCKS=true (requerimientos.md §11.1).
// En el build de producción import.meta.env.DEV es false: el import dinámico se elimina y MSW no se incluye.
async function enableMocking() {
  if (!import.meta.env.DEV || import.meta.env.VITE_USE_MOCKS !== 'true') return
  const { worker } = await import('./mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
}

// Punto de entrada. Los providers de TanStack Query, Auth y el Toaster
// se agregan en las fases siguientes (requerimientos.md §13).
enableMocking().then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </StrictMode>,
  )
})
