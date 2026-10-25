import { useQuery } from '@tanstack/react-query'
import { boardService } from '../../../api/boardService'
import { boardKeys } from '../queryKeys'

// Tableros del usuario actual (GET /boards)
export function useBoards() {
  return useQuery({
    queryKey: boardKeys.all,
    queryFn: boardService.getBoards,
  })
}
