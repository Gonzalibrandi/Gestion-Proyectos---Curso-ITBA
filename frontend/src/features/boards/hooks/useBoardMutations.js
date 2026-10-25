import { useMutation, useQueryClient } from '@tanstack/react-query'
import { boardService } from '../../../api/boardService'
import { boardKeys } from '../queryKeys'

// Petición estándar (§9.2): se espera la respuesta y se invalida la lista de tableros
export function useCreateBoard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: boardService.createBoard,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: boardKeys.all }),
  })
}

export function useDeleteBoard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: boardService.deleteBoard,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: boardKeys.all }),
  })
}
