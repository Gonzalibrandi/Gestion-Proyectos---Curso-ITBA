import { useDraggable } from '@dnd-kit/core'
import { TicketCard } from './TicketCard'
import styles from './DraggableTicket.module.css'

// Ticket arrastrable (presentacional): con el mouse se arrastra desde cualquier parte de la tarjeta;
// con el teclado, desde la manija (Espacio/Enter para tomarlo, flechas para elegir columna)
export function DraggableTicket({ ticket, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({
    id: ticket._id,
    data: { ticket },
  })

  const handle = (
    <span ref={setActivatorNodeRef} className={styles.handle} {...attributes} aria-label={`Mover ticket "${ticket.title}"`}>
      ⠿
    </span>
  )

  return (
    <div ref={setNodeRef} className={`${styles.draggable} ${isDragging ? styles.dragging : ''}`} {...listeners}>
      <TicketCard ticket={ticket} onEdit={onEdit} onDelete={onDelete} dragHandle={handle} />
    </div>
  )
}
