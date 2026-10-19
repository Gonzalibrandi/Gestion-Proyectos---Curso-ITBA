import { ThemeToggle } from './components/ThemeToggle'
import { useTheme } from './hooks/useTheme'
import styles from './App.module.css'

// Pantalla PROVISORIA de la Fase 1 (Scaffold): permite validar el tema y los tokens.
// En la Fase 4 se reemplaza por el router (src/routes/router.jsx).
export default function App() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <span className={styles.brand}>
          kanban<span className={styles.accent}>/</span>itba
        </span>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </header>

      <main className={styles.main}>
        <section className={styles.card}>
          <p className={styles.meta}>fase 1 · scaffold</p>
          <h1 className={styles.title}>Kanban ITBA</h1>
          <p className={styles.text}>
            Proyecto base listo: Vite + React, tokens del tema &quot;Minimalismo Developer&quot; e
            interruptor light/dark persistente.
          </p>
          <p className={styles.meta}>
            tema actual: <span className={styles.accent}>{theme}</span>
          </p>
        </section>
      </main>
    </div>
  )
}
