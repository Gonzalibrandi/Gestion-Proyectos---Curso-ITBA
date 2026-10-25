import { useQuery } from '@tanstack/react-query'
import { boardService } from '../../../api/boardService'
import { boardKeys } from '../queryKeys'

// Tablero con sus columnas y tickets anidados (GET /boards/:boardId)
export function useBoard(boardId) {
  return useQuery({
    queryKey: boardKeys.detail(boardId),
    queryFn: () => boardService.getBoardById(boardId),
  })
}
