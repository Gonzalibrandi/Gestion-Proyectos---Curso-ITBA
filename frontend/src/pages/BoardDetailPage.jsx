import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { closestCenter, DndContext, DragOverlay, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { Button } from '../components/Button'
import { Spinner } from '../components/Spinner'
import { StateMessage } from '../components/StateMessage'
import { BoardColumns } from '../features/boards/components/BoardColumns'
import { BoardHeader } from '../features/boards/components/BoardHeader'
import { useBoard } from '../features/boards/hooks/useBoard'
import { TicketCard } from '../features/tickets/components/TicketCard'
import { columnKeyboardCoordinates, dndAccessibility } from '../features/tickets/dnd'
import { useMoveTicket } from '../features/tickets/hooks/useMoveTicket'
import { BoardDetailDialogs } from './BoardDetailDialogs'
import styles from './BoardDetailPage.module.css'

// Mensaje según el error de GET /boards/:boardId (§5: nunca una pantalla en blanco)
const errorTitle = (status) => {
  if (status === 400) return 'La dirección del tablero no es válida'
  if (status === 404) return 'El tablero no existe'
  return 'No se pudo cargar el tablero'
}

export default function BoardDetailPage() {
  const { boardId } = useParams()
  const boardQuery = useBoard(boardId)
  const moveTicket = useMoveTicket(boardId)
  // Diálogo abierto: { type, column?, ticket? } o null
  const [dialog, setDialog] = useState(null)
  // Ticket que se está arrastrando (se muestra en el DragOverlay)
  const [activeTicket, setActiveTicket] = useState(null)

  // Mouse: el arrastre empieza tras 5 px, así los clics en los botones de la tarjeta siguen funcionando
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: columnKeyboardCoordinates }),
  )

  const handleDragEnd = ({ active, over }) => {
    setActiveTicket(null)
    const ticket = active.data.current?.ticket
    // Soltar fuera de una columna o en la misma columna no dispara ninguna petición (§9.3)
    if (!ticket || !over || over.id === ticket.column) return
    moveTicket.mutate({ ticketId: ticket._id, fromColumnId: ticket.column, toColumnId: over.id })
  }

  if (boardQuery.isPending) {
    return (
      <div className={styles.center}>
        <Spinner />
      </div>
    )
  }

  if (boardQuery.isError) {
    const { status, message } = boardQuery.error
    const canRetry = status === 0 || status >= 500
    return (
      <StateMessage tone="error" title={errorTitle(status)} message={message}>
        {canRetry && (
          <Button variant="secondary" onClick={() => boardQuery.refetch()}>
            Reintentar
          </Button>
        )}
        <Link to="/boards">Volver a tableros</Link>
      </StateMessage>
    )
  }

  const board = boardQuery.data

  return (
    <>
      <BoardHeader
        board={board}
        onAddColumn={() => setDialog({ type: 'createColumn' })}
        onDelete={() => setDialog({ type: 'deleteBoard' })}
      />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        accessibility={dndAccessibility}
        onDragStart={({ active }) => setActiveTicket(active.data.current?.ticket ?? null)}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveTicket(null)}
      >
        <BoardColumns
          columns={board.columns}
          onAddTicket={(column) => setDialog({ type: 'createTicket', column })}
          onEditTicket={(ticket) => setDialog({ type: 'editTicket', ticket })}
          onDeleteTicket={(ticket) => setDialog({ type: 'deleteTicket', ticket })}
          onDeleteColumn={(column) => setDialog({ type: 'deleteColumn', column })}
        />
        <DragOverlay>{activeTicket && <TicketCard ticket={activeTicket} />}</DragOverlay>
      </DndContext>
      <BoardDetailDialogs boardId={boardId} dialog={dialog} onClose={() => setDialog(null)} />
    </>
  )
}
