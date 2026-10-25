import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ticketService } from '../../../api/ticketService'
import { boardKeys } from '../../boards/queryKeys'

// Petición estándar (§9.2): se espera la respuesta y se invalida el tablero.
// Los IDs de columna y ticket llegan en las variables de mutate().
const useInvalidateBoard = (boardId) => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: boardKeys.detail(boardId) })
}

export function useCreateTicket(boardId) {
  const invalidateBoard = useInvalidateBoard(boardId)
  return useMutation({
    mutationFn: ({ columnId, ...data }) => ticketService.createTicket(boardId, columnId, data),
    onSuccess: invalidateBoard,
  })
}

export function useUpdateTicket(boardId) {
  const invalidateBoard = useInvalidateBoard(boardId)
  return useMutation({
    mutationFn: ({ columnId, ticketId, changes }) => ticketService.updateTicket(boardId, columnId, ticketId, changes),
    onSuccess: invalidateBoard,
  })
}

export function useDeleteTicket(boardId) {
  const invalidateBoard = useInvalidateBoard(boardId)
  return useMutation({
    mutationFn: ({ columnId, ticketId }) => ticketService.deleteTicket(boardId, columnId, ticketId),
    onSuccess: invalidateBoard,
  })
}
