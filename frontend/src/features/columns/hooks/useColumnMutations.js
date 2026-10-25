import { useMutation, useQueryClient } from '@tanstack/react-query'
import { columnService } from '../../../api/columnService'
import { boardKeys } from '../../boards/queryKeys'

// Petición estándar (§9.2): se espera la respuesta y se invalida el tablero
export function useCreateColumn(boardId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => columnService.createColumn(boardId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: boardKeys.detail(boardId) }),
  })
}

export function useDeleteColumn(boardId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (columnId) => columnService.deleteColumn(boardId, columnId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: boardKeys.detail(boardId) }),
  })
}
