import { Link, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { Spinner } from '../components/Spinner'
import { StateMessage } from '../components/StateMessage'
import { BoardColumns } from '../features/boards/components/BoardColumns'
import { BoardHeader } from '../features/boards/components/BoardHeader'
import { useBoard } from '../features/boards/hooks/useBoard'
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
      <BoardHeader board={board} />
      <BoardColumns columns={board.columns} />
    </>
  )
}
