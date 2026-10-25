import { Button } from './Button'
import { ThemeToggle } from './ThemeToggle'
import styles from './AppHeader.module.css'

// Header de la app (presentacional): nombre del usuario, interruptor de tema y cierre de sesión
export function AppHeader({ userName, theme, onToggleTheme, onLogout }) {
  return (
    <header className={styles.header}>
      <span className={styles.brand}>
        kanban<span className={styles.accent}>/</span>itba
      </span>
      <div className={styles.actions}>
        <span className={styles.user}>{userName}</span>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        <Button variant="secondary" size="sm" onClick={onLogout}>
          Cerrar sesión
        </Button>
      </div>
    </header>
  )
}
