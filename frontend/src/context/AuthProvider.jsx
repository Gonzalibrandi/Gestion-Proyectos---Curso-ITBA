import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { setUnauthorizedHandler } from '../api/httpClient'
import { clearSession, getSession, saveSession } from '../api/session'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState(getSession)

  // Recibe el usuario que devolvió authService.login y lo guarda como sesión
  const login = useCallback((loggedUser) => {
    setUser(saveSession(loggedUser))
  }, [])

  // Cerrar sesión: se borra la sesión y la caché para no mostrar datos de otra sesión (§9.1).
  // Al quedar sin usuario, ProtectedRoute redirige a /login.
  const logout = useCallback(() => {
    clearSession()
    queryClient.clear()
    setUser(null)
  }, [queryClient])

  // 401 fuera del login: httpClient ya borró la sesión; acá se limpia el estado y se avisa (§6)
  useEffect(() => {
    setUnauthorizedHandler(() => {
      queryClient.clear()
      setUser(null)
      toast.error('Tu sesión ya no es válida. Iniciá sesión de nuevo.')
    })
    return () => setUnauthorizedHandler(null)
  }, [queryClient])

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout])

  return <AuthContext value={value}>{children}</AuthContext>
}
