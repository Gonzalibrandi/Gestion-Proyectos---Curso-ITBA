import { Link } from 'react-router-dom'
import { Button } from '../../../components/Button'
import styles from './BoardHeader.module.css'

// Encabezado del detalle de un tablero (presentacional)
export function BoardHeader({ board, onAddColumn, onDelete }) {
  return (
    <header className={styles.header}>
      <div className={styles.info}>
        <Link to="/boards" className={styles.back}>
          ← Tableros
        </Link>
        <h1 className={styles.title}>{board.name}</h1>
        {board.description && <p className={styles.description}>{board.description}</p>}
      </div>
      <div className={styles.actions}>
        {onDelete && (
          <Button variant="secondary" onClick={onDelete}>
            Eliminar tablero
          </Button>
        )}
        {onAddColumn && <Button onClick={onAddColumn}>+ Columna</Button>}
      </div>
    </header>
  )
}
