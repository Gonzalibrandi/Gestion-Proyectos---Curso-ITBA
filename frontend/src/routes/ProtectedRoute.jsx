import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

// Ruta de layout protegida (requerimientos.md §5): sin sesión redirige a /login
// y guarda la ruta original en location.state.from para volver después del login
export function ProtectedRoute() {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />

  return <Outlet />
}
