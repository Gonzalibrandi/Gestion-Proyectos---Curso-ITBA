import { Button } from '../../../components/Button'
import { TicketCard } from '../../tickets/components/TicketCard'
import styles from './ColumnView.module.css'

// Columna del tablero (presentacional): encabezado, tickets y alta de ticket
export function ColumnView({ column, onAddTicket, onEditTicket, onDeleteTicket, onDelete }) {
  const tickets = column.tickets ?? []

  return (
    <section className={styles.column} aria-label={`Columna ${column.name}`}>
      <header className={styles.header}>
        <h3 className={styles.title}>{column.name}</h3>
        <span className={styles.count}>{tickets.length}</span>
        <Button variant="ghost" size="sm" onClick={() => onDelete(column)} aria-label={`Eliminar columna ${column.name}`}>
          ×
        </Button>
      </header>

      <div className={styles.ticketList}>
        {tickets.length === 0 && <p className={styles.empty}>Sin tickets</p>}
        {tickets.map((ticket) => (
          <TicketCard key={ticket._id} ticket={ticket} onEdit={onEditTicket} onDelete={onDeleteTicket} />
        ))}
      </div>

      <Button variant="secondary" size="sm" onClick={() => onAddTicket(column)}>
        + Ticket
      </Button>
    </section>
  )
}
