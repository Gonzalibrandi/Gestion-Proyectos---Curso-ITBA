import { useCallback, useEffect, useMemo, useState } from 'react'
import { ThemeContext } from './ThemeContext'

// Debe coincidir con la clave del script anti-parpadeo de index.html
const STORAGE_KEY = 'kanban.theme'
const DARK_CLASS = 'dark'

const getSystemQuery = () => window.matchMedia('(prefers-color-scheme: dark)')

// Elección manual guardada: 'light' | 'dark', o null si el usuario nunca eligió
const readStoredTheme = () => {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

export function ThemeProvider({ children }) {
  const [storedTheme, setStoredTheme] = useState(readStoredTheme)
  const [systemTheme, setSystemTheme] = useState(() => (getSystemQuery().matches ? 'dark' : 'light'))

  // La elección manual tiene prioridad; si no hay, se sigue al sistema operativo
  const theme = storedTheme ?? systemTheme

  // Sigue los cambios de tema del sistema (solo se notan mientras no haya elección manual)
  useEffect(() => {
    const query = getSystemQuery()
    const handleChange = (event) => setSystemTheme(event.matches ? 'dark' : 'light')
    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [])

  // Sincroniza la clase .dark de <html> con el tema actual
  useEffect(() => {
    document.documentElement.classList.toggle(DARK_CLASS, theme === 'dark')
  }, [theme])

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    try {
      localStorage.setItem(STORAGE_KEY, nextTheme)
    } catch {
      // Sin acceso a localStorage: el cambio aplica solo a esta sesión
    }
    setStoredTheme(nextTheme)
  }, [theme])

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme])

  return <ThemeContext value={value}>{children}</ThemeContext>
}
