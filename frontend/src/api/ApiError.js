// Error uniforme de la capa API (requerimientos.md §7.1).
// status: código HTTP, o 0 si no hubo respuesta (falla de red o timeout).
// message: el campo `error` que devuelve el backend, listo para mostrar en la UI.
export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}
