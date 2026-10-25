import { StateMessage } from '../../../components/StateMessage'
import { ColumnView } from '../../columns/components/ColumnView'
import styles from './BoardColumns.module.css'

// Columnas de un tablero con sus tickets (presentacional)
export function BoardColumns({ columns, onAddTicket, onEditTicket, onDeleteTicket, onDeleteColumn }) {
  if (columns.length === 0) {
    return <StateMessage title="Este tablero todavía no tiene columnas" message="Agregá una columna para empezar a cargar tickets." />
  }

  return (
    <div className={styles.board}>
      {columns.map((column) => (
        <ColumnView
          key={column._id}
          column={column}
          onAddTicket={onAddTicket}
          onEditTicket={onEditTicket}
          onDeleteTicket={onDeleteTicket}
          onDelete={onDeleteColumn}
        />
      ))}
    </div>
  )
}
