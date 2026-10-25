import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Modal } from '../components/Modal'
import { useDeleteBoard } from '../features/boards/hooks/useBoardMutations'
import { ColumnForm } from '../features/columns/components/ColumnForm'
import { useCreateColumn, useDeleteColumn } from '../features/columns/hooks/useColumnMutations'
import { TicketForm } from '../features/tickets/components/TicketForm'
import { useCreateTicket, useDeleteTicket, useUpdateTicket } from '../features/tickets/hooks/useTicketMutations'
import { toastApiError } from '../utils/toastApiError'

// Contenedor de los diálogos de BoardDetailPage (formularios y confirmaciones de borrado).
// dialog: { type, column?, ticket? } o null. Cada flujo espera la respuesta exitosa antes de cerrar (§9.2).
export function BoardDetailDialogs({ boardId, dialog, onClose }) {
  const navigate = useNavigate()
  const createColumn = useCreateColumn(boardId)
  const deleteColumn = useDeleteColumn(boardId)
  const createTicket = useCreateTicket(boardId)
  const updateTicket = useUpdateTicket(boardId)
  const deleteTicket = useDeleteTicket(boardId)
  const deleteBoard = useDeleteBoard()

  const mutations = [createColumn, deleteColumn, createTicket, updateTicket, deleteTicket, deleteBoard]
  const isPending = mutations.some((mutation) => mutation.isPending)

  if (!dialog) return null

  const close = () => {
    if (isPending) return
    mutations.forEach((mutation) => mutation.reset())
    onClose()
  }

  // Éxito: Toast y cierre. Error: el 400 de los formularios queda en el input, el resto va a un Toast.
  const callbacks = (successMessage, handledStatuses = []) => ({
    onSuccess: () => {
      toast.success(successMessage)
      mutations.forEach((mutation) => mutation.reset())
      onClose()
    },
    onError: (error) => toastApiError(error, handledStatuses),
  })

  const { type, column, ticket } = dialog

  switch (type) {
    case 'createColumn':
      return (
        <Modal title="Nueva columna" onClose={close}>
          <ColumnForm
            onSubmit={(data) => createColumn.mutate(data, callbacks('Columna creada', [400]))}
            onCancel={close}
            isSubmitting={createColumn.isPending}
            serverError={createColumn.error}
          />
        </Modal>
      )

    case 'createTicket':
      return (
        <Modal title={`Nuevo ticket en "${column.name}"`} onClose={close}>
          <TicketForm
            submitLabel="Crear ticket"
            onSubmit={(data) => createTicket.mutate({ columnId: column._id, ...data }, callbacks('Ticket creado', [400]))}
            onCancel={close}
            isSubmitting={createTicket.isPending}
            serverError={createTicket.error}
          />
        </Modal>
      )

    case 'editTicket':
      return (
        <Modal title="Editar ticket" onClose={close}>
          <TicketForm
            defaultValues={{ title: ticket.title, description: ticket.description, priority: ticket.priority }}
            onSubmit={(changes) =>
              updateTicket.mutate({ columnId: ticket.column, ticketId: ticket._id, changes }, callbacks('Ticket actualizado', [400]))
            }
            onCancel={close}
            isSubmitting={updateTicket.isPending}
            serverError={updateTicket.error}
          />
        </Modal>
      )

    case 'deleteTicket':
      return (
        <ConfirmDialog
          title={`¿Eliminar "${ticket.title}"?`}
          message="El ticket se eliminará definitivamente."
          confirmLabel="Eliminar ticket"
          onConfirm={() => deleteTicket.mutate({ columnId: ticket.column, ticketId: ticket._id }, callbacks('Ticket eliminado'))}
          onCancel={close}
          isPending={deleteTicket.isPending}
        />
      )

    case 'deleteColumn':
      return (
        <ConfirmDialog
          title={`¿Eliminar la columna "${column.name}"?`}
          message={`Se eliminarán en cascada sus ${column.tickets?.length ?? 0} ticket(s). Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar columna"
          onConfirm={() => deleteColumn.mutate(column._id, callbacks('Columna eliminada'))}
          onCancel={close}
          isPending={deleteColumn.isPending}
        />
      )

    case 'deleteBoard':
      return (
        <ConfirmDialog
          title="¿Eliminar este tablero?"
          message="Se eliminarán en cascada todas sus columnas y tickets. Esta acción no se puede deshacer."
          confirmLabel="Eliminar tablero"
          onConfirm={() =>
            deleteBoard.mutate(boardId, {
              // Navegación programática SOLO después de que la mutación fue exitosa (§5)
              onSuccess: () => {
                toast.success('Tablero eliminado')
                navigate('/boards', { replace: true })
              },
              onError: (error) => toastApiError(error),
            })
          }
          onCancel={close}
          isPending={deleteBoard.isPending}
        />
      )

    default:
      return null
  }
}
