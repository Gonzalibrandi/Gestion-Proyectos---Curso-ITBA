import { Link } from 'react-router-dom'
import styles from './NotFoundPage.module.css'

export default function NotFoundPage() {
  return (
    <div className={styles.page}>
      <p className={styles.code}>404</p>
      <h1 className={styles.title}>Página no encontrada</h1>
      {/* Navegación pura: acá sí corresponde <Link> (requerimientos.md §5) */}
      <Link to="/boards" className={styles.link}>
        Volver a tableros
      </Link>
    </div>
  )
}
