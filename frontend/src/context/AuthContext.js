import { createContext } from 'react'

// Sesión simulada: { user, login, logout }. La provee <AuthProvider> y se consume con useAuth().
export const AuthContext = createContext(null)
