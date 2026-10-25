import { toast } from 'sonner'

// Toast de error para un ApiError (requerimientos.md §8).
// handledStatuses: códigos que la pantalla ya muestra en el formulario (por ejemplo, [400]).
// El 401 nunca se muestra acá: lo maneja AuthProvider (aviso y vuelta a /login).
export function toastApiError(error, handledStatuses = []) {
  if (error.status === 401 || handledStatuses.includes(error.status)) return
  toast.error(error.message)
}
