import { useEffect } from 'react'

const VALIDATION_ERRORS = [400]

// Muestra en un campo del formulario el mensaje de error del backend (requerimientos.md §8).
// serverError es el ApiError de la mutación (o null). Se usa el objeto y no el mensaje
// para que dos fallos seguidos con el mismo texto vuelvan a mostrarse.
// statuses debe ser una constante de módulo (por ejemplo, [401] en el login).
export function useServerError(serverError, setError, field, statuses = VALIDATION_ERRORS) {
  useEffect(() => {
    if (serverError && statuses.includes(serverError.status)) {
      setError(field, { type: 'server', message: serverError.message })
    }
  }, [serverError, setError, field, statuses])
}
