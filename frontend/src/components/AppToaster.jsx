import { Toaster } from 'sonner'
import { useTheme } from '../hooks/useTheme'

// Único <Toaster /> de la app (requerimientos.md §2). Sigue el tema actual:
// sin esto, sonner usa su tema claro y los avisos se ven blancos en modo oscuro.
export function AppToaster() {
  const { theme } = useTheme()
  return <Toaster position="top-right" theme={theme} />
}
