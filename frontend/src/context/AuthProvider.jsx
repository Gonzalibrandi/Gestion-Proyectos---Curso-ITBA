import { useCallback, useMemo, useState } from 'react'
import { clearSession, getSession, saveSession } from '../api/session'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getSession)

  // Recibe el usuario que devolvió authService.login y lo guarda como sesión
  const login = useCallback((loggedUser) => {
    setUser(saveSession(loggedUser))
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout])

  return <AuthContext value={value}>{children}</AuthContext>
}
