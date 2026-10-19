// Persistencia de la sesión simulada (requerimientos.md §6): { _id, name, email } en localStorage.
// La usa httpClient para enviar X-User-Id y, desde la Fase 4, AuthProvider para login y logout.
const SESSION_KEY = 'kanban.session'

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveSession(user) {
  // Solo se guardan los datos públicos del usuario
  const session = { _id: user._id, name: user.name, email: user.email }
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    // Sin acceso a localStorage: la sesión no persiste entre recargas
  }
  return session
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // Sin acceso a localStorage: no hay nada que borrar
  }
}
