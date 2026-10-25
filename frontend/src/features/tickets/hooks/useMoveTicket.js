import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ticketService } from '../../../api/ticketService'
import { boardKeys } from '../../boards/queryKeys'

// Copia del tablero con el ticket movido de columna (no se reordena dentro de la columna, §9.3)
function moveTicketInBoard(board, ticketId, fromColumnId, toColumnId) {
  const ticket = board.columns.find((c) => c._id === fromColumnId)?.tickets.find((t) => t._id === ticketId)
  if (!ticket) return board

  return {
    ...board,
    columns: board.columns.map((column) => {
      if (column._id === fromColumnId) return { ...column, tickets: column.tickets.filter((t) => t._id !== ticketId) }
      if (column._id === toColumnId) return { ...column, tickets: [...column.tickets, { ...ticket, column: toColumnId }] }
      return column
    }),
  }
}

// Mover un ticket con actualización optimista (requerimientos.md §9.3)
export function useMoveTicket(boardId) {
  const queryClient = useQueryClient()
  const queryKey = boardKeys.detail(boardId)

  return useMutation({
    // La URL lleva la columna de ORIGEN y newColumnId va en el body (el PATCH es idempotente)
    mutationFn: ({ ticketId, fromColumnId, toColumnId }) =>
      ticketService.updateTicket(boardId, fromColumnId, ticketId, { newColumnId: toColumnId }),

    // 1) Se cancela cualquier refetch, se guarda una copia y se mueve el ticket en la caché
    onMutate: async ({ ticketId, fromColumnId, toColumnId }) => {
      await queryClient.cancelQueries({ queryKey })
      const previousBoard = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, (board) => board && moveTicketInBoard(board, ticketId, fromColumnId, toColumnId))
      return { previousBoard }
    },

    // 2) Si el backend falla (400, 404...), el ticket vuelve a su columna original y se avisa
    onError: (error, _variables, context) => {
      if (context?.previousBoard) queryClient.setQueryData(queryKey, context.previousBoard)
      if (error.status !== 401) toast.error(`No se pudo mover el ticket: ${error.message}`)
    },

    // 3) Siempre se sincroniza con el servidor
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })
}
