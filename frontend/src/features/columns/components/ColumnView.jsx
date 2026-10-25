import { useDroppable } from '@dnd-kit/core'
import { Button } from '../../../components/Button'
import { DraggableTicket } from '../../tickets/components/DraggableTicket'
import styles from './ColumnView.module.css'

// Columna del tablero (presentacional): encabezado, tickets arrastrables y alta de ticket.
// Es una zona de drop: se resalta cuando un ticket pasa por encima.
export function ColumnView({ column, onAddTicket, onEditTicket, onDeleteTicket, onDelete }) {
  const tickets = column.tickets ?? []
  const { setNodeRef, isOver } = useDroppable({ id: column._id, data: { column } })

  return (
    <section ref={setNodeRef} className={`${styles.column} ${isOver ? styles.over : ''}`} aria-label={`Columna ${column.name}`}>
      <header className={styles.header}>
        <h3 className={styles.title}>{column.name}</h3>
        <span className={styles.count}>{tickets.length}</span>
        {onDelete && (
          <Button variant="ghost" size="sm" onClick={() => onDelete(column)} aria-label={`Eliminar columna ${column.name}`}>
            ×
          </Button>
        )}
      </header>

      <div className={styles.ticketList}>
        {tickets.length === 0 && <p className={styles.empty}>Sin tickets</p>}
        {tickets.map((ticket) => (
          <DraggableTicket key={ticket._id} ticket={ticket} onEdit={onEditTicket} onDelete={onDeleteTicket} />
        ))}
      </div>

      {onAddTicket && (
        <Button variant="secondary" size="sm" onClick={() => onAddTicket(column)}>
          + Ticket
        </Button>
      )}
    </section>
  )
}
