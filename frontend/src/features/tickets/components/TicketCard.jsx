import { Button } from '../../../components/Button'
import { PRIORITY_LABELS } from '../priorities'
import styles from './TicketCard.module.css'

// Tarjeta de ticket (presentacional): sin useEffect ni llamadas a la API.
// dragHandle: manija opcional que agrega DraggableTicket para mover el ticket con el teclado.
export function TicketCard({ ticket, onEdit, onDelete, dragHandle }) {
  const priority = PRIORITY_LABELS[ticket.priority] ? ticket.priority : 'medium'

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        {dragHandle}
        <h4 className={styles.title}>{ticket.title}</h4>
        <span className={`${styles.priority} ${styles[priority]}`}>{PRIORITY_LABELS[priority]}</span>
      </header>

      {ticket.description && <p className={styles.description}>{ticket.description}</p>}

      <footer className={styles.footer}>
        <code className={styles.id}>#{ticket._id.slice(-6)}</code>
        <div className={styles.actions}>
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={() => onEdit(ticket)} aria-label={`Editar ${ticket.title}`}>
              Editar
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="sm" onClick={() => onDelete(ticket)} aria-label={`Eliminar ${ticket.title}`}>
              Eliminar
            </Button>
          )}
        </div>
      </footer>
    </article>
  )
}
