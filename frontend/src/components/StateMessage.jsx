import styles from './StateMessage.module.css'

// Estado vacío o de error de una vista (requerimientos.md §9.1): título, detalle y acciones opcionales
export function StateMessage({ title, message, tone = 'neutral', children }) {
  return (
    <div className={`${styles.state} ${styles[tone]}`} role={tone === 'error' ? 'alert' : undefined}>
      <p className={styles.title}>{title}</p>
      {message && <p className={styles.message}>{message}</p>}
      {children && <div className={styles.actions}>{children}</div>}
    </div>
  )
}
