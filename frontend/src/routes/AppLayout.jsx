import { Outlet } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import styles from './AppLayout.module.css'

// Layout de las rutas protegidas: conecta sesión y tema con el header presentacional
export function AppLayout() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className={styles.layout}>
      <AppHeader userName={user.name} theme={theme} onToggleTheme={toggleTheme} onLogout={logout} />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
