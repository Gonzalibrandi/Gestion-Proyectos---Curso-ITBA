import { useMutation } from '@tanstack/react-query'
import { authService } from '../../../api/authService'

// POST /auth/login como mutación de TanStack Query (estado isPending y error incluidos)
export function useLogin() {
  return useMutation({
    mutationFn: authService.login,
  })
}
