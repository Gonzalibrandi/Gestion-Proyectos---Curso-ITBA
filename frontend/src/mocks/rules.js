import { db } from './db'

// Reglas del backend replicadas en el mock: mismos códigos, mismo orden de validación y mismos mensajes
// (backend/middlewares y backend/controllers). Si el backend cambia un mensaje, hay que cambiarlo acá.

export const PRIORITIES = ['low', 'medium', 'high']
export const INVALID_PRIORITY = `La prioridad del ticket debe ser una de: ${PRIORITIES.join(', ')}`

export const isValidObjectId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)
export const isNonEmptyString = (value) => typeof value === 'string' && value.trim() !== ''

// Error que corta el handler y se responde como { error } con su status
export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

// Equivale a express.json(): body vacío -> {}, JSON malformado -> 400
export async function readJson(request) {
  const text = await request.text()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    throw new HttpError(400, 'El cuerpo de la petición no es un JSON válido')
  }
}

// Equivale al middleware requireUser (header X-User-Id)
export function requireUser(request) {
  const userId = request.headers.get('X-User-Id')
  if (!userId) throw new HttpError(401, 'Falta el header X-User-Id: es necesario iniciar sesión')
  if (!isValidObjectId(userId)) throw new HttpError(400, 'El header X-User-Id no tiene un formato de ID válido')
  const user = db.users.find((u) => u._id === userId)
  if (!user) throw new HttpError(401, 'El usuario indicado en X-User-Id no existe')
  return user
}

// Equivalen a checkBoard, checkColumn y checkTicket (formato -> existencia -> pertenencia)
export function checkBoard(boardId) {
  if (!isValidObjectId(boardId)) throw new HttpError(400, 'El ID del Tablero proporcionado no tiene un formato válido')
  const board = db.boards.find((b) => b._id === boardId)
  if (!board) throw new HttpError(404, 'El Tablero (Board) solicitado no existe (Parent Check fallido)')
  return board
}

export function checkColumn(boardId, columnId) {
  if (!isValidObjectId(columnId)) throw new HttpError(400, 'El ID de la Columna proporcionado no tiene un formato válido')
  const column = db.columns.find((c) => c._id === columnId)
  if (!column) throw new HttpError(404, 'La Columna solicitada no existe')
  if (column.board !== boardId) {
    throw new HttpError(400, 'Aislamiento de Rutas: La columna solicitada existe pero NO pertenece al tablero especificado en la URL')
  }
  return column
}

// retriedMoveTo: newColumnId de un PATCH (un reintento de movimiento no es error de aislamiento)
export function checkTicket(boardId, columnId, ticketId, retriedMoveTo) {
  if (!isValidObjectId(ticketId)) throw new HttpError(400, 'El ID del Ticket proporcionado no tiene un formato válido')
  const ticket = db.tickets.find((t) => t._id === ticketId)
  if (!ticket) throw new HttpError(404, 'El Ticket solicitado no existe')
  if (ticket.board !== boardId) {
    throw new HttpError(400, 'Aislamiento de Rutas: El ticket solicitado existe pero NO pertenece al tablero especificado en la URL')
  }
  const isRetriedMove = retriedMoveTo !== undefined && retriedMoveTo === ticket.column
  if (ticket.column !== columnId && !isRetriedMove) {
    throw new HttpError(400, 'Aislamiento de Rutas: El ticket solicitado existe pero NO pertenece a la columna especificada en la URL')
  }
  return ticket
}
