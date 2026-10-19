import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/global.css'
import { ThemeProvider } from './context/ThemeProvider'
import App from './App'

// Punto de entrada. Los providers de TanStack Query, Auth, el Toaster y MSW
// se agregan en las fases siguientes (requerimientos.md §13).
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
