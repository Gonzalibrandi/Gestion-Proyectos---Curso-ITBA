import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '../components/Button'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Modal } from '../components/Modal'
import { Spinner } from '../components/Spinner'
import { StateMessage } from '../components/StateMessage'
import { BoardCard } from '../features/boards/components/BoardCard'
import { BoardForm } from '../features/boards/components/BoardForm'
import { useBoards } from '../features/boards/hooks/useBoards'
import { useCreateBoard, useDeleteBoard } from '../features/boards/hooks/useBoardMutations'
import { toastApiError } from '../utils/toastApiError'
import styles from './BoardsListPage.module.css'

export default function BoardsListPage() {
  const navigate = useNavigate()
  const boardsQuery = useBoards()
  const createBoard = useCreateBoard()
  const deleteBoard = useDeleteBoard()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [boardToDelete, setBoardToDelete] = useState(null)

  const openCreate = () => setIsCreateOpen(true)
  const closeCreate = () => {
    if (createBoard.isPending) return
    createBoard.reset()
    setIsCreateOpen(false)
  }

  const handleCreate = (data) => {
    createBoard.mutate(data, {
      // Navegación programática SOLO después de que la mutación fue exitosa (§5)
      onSuccess: (board) => {
        toast.success('Tablero creado')
        setIsCreateOpen(false)
        navigate(`/boards/${board._id}`)
      },
      onError: (error) => toastApiError(error, [400]),
    })
  }

  const handleDelete = () => {
    deleteBoard.mutate(boardToDelete._id, {
      onSuccess: () => {
        toast.success('Tablero eliminado')
        setBoardToDelete(null)
      },
      onError: (error) => toastApiError(error),
    })
  }

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>Mis tableros</h1>
        <Button onClick={openCreate}>+ Nuevo tablero</Button>
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
        <StateMessage title="Todavía no tenés tableros" message="Creá tu primer tablero para empezar a organizar tickets.">
          <Button onClick={openCreate}>Crear tablero</Button>
        </StateMessage>
      )}

      {boardsQuery.isSuccess && boardsQuery.data.length > 0 && (
        <div className={styles.grid}>
          {boardsQuery.data.map((board) => (
            <BoardCard key={board._id} board={board} to={`/boards/${board._id}`} onDelete={setBoardToDelete} />
          ))}
        </div>
      )}

      {isCreateOpen && (
        <Modal title="Nuevo tablero" onClose={closeCreate}>
          <BoardForm onSubmit={handleCreate} onCancel={closeCreate} isSubmitting={createBoard.isPending} serverError={createBoard.error} />
        </Modal>
      )}

      {boardToDelete && (
        <ConfirmDialog
          title={`¿Eliminar "${boardToDelete.name}"?`}
          message="Se eliminarán en cascada todas sus columnas y tickets. Esta acción no se puede deshacer."
          confirmLabel="Eliminar tablero"
          onConfirm={handleDelete}
          onCancel={() => setBoardToDelete(null)}
          isPending={deleteBoard.isPending}
        />
      )}
    </>
  )
}
