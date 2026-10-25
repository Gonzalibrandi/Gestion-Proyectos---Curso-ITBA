import { Button } from '../components/Button'
import { Spinner } from '../components/Spinner'
import { StateMessage } from '../components/StateMessage'
import { BoardCard } from '../features/boards/components/BoardCard'
import { useBoards } from '../features/boards/hooks/useBoards'
import styles from './BoardsListPage.module.css'

export default function BoardsListPage() {
  const boardsQuery = useBoards()

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>Mis tableros</h1>
      </header>

      {boardsQuery.isPending && (
        <div className={styles.center}>
          <Spinner />
        </div>
      )}

      {boardsQuery.isError && (
        <StateMessage tone="error" title="No se pudieron cargar los tableros" message={boardsQuery.error.message}>
          <Button variant="secondary" onClick={() => boardsQuery.refetch()}>
            Reintentar
          </Button>
        </StateMessage>
      )}

      {boardsQuery.isSuccess && boardsQuery.data.length === 0 && (
        <StateMessage title="Todavía no tenés tableros" message="Creá tu primer tablero para empezar a organizar tickets." />
      )}

      {boardsQuery.isSuccess && boardsQuery.data.length > 0 && (
        <div className={styles.grid}>
          {boardsQuery.data.map((board) => (
            <BoardCard key={board._id} board={board} to={`/boards/${board._id}`} />
          ))}
        </div>
      )}
    </>
  )
}
