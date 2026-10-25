import { Link } from 'react-router-dom'
import { Button } from '../../../components/Button'
import styles from './BoardCard.module.css'

const formatDate = (iso) => new Date(iso).toLocaleDateString('es-AR')

// Tarjeta de tablero (presentacional). Abrir el tablero es navegación pura, por eso usa <Link> (§5).
export function BoardCard({ board, to, onDelete }) {
  return (
    <article className={styles.card}>
      <h3 className={styles.title}>
        <Link to={to} className={styles.link}>
          {board.name}
        </Link>
      </h3>
      <p className={styles.description}>{board.description || 'Sin descripción'}</p>
      <footer className={styles.footer}>
        <code className={styles.meta}>creado {formatDate(board.createdAt)}</code>
        <Button variant="ghost" size="sm" onClick={() => onDelete(board)} aria-label={`Eliminar tablero ${board.name}`}>
          Eliminar
        </Button>
      </footer>
    </article>
  )
}
