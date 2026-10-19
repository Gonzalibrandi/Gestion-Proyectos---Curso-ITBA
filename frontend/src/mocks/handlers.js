import { delay, http, HttpResponse } from 'msw'
import { boardDetailJSON, boardJSON, columnJSON, db, now, objectId, ticketJSON } from './db'
import {
  checkBoard, checkColumn, checkTicket, HttpError, INVALID_PRIORITY, isNonEmptyString,
  isValidObjectId, PRIORITIES, readJson, requireUser,
} from './rules'

// Misma URL base que httpClient: MSW intercepta exactamente las peticiones de la capa API
const API = import.meta.env.VITE_API_URL
const BOARD = `${API}/boards/:boardId`
const TICKETS = `${BOARD}/columns/:columnId/tickets`

// Envuelve cada handler: latencia realista (para ver spinners) y HttpError -> { error } con su status
const route = (resolver) => async (info) => {
  await delay()
  try {
    return await resolver(info)
  } catch (error) {
    if (error instanceof HttpError) return HttpResponse.json({ error: error.message }, { status: error.status })
    throw error
  }
}

const badRequest = (message) => {
  throw new HttpError(400, message)
}

export const handlers = [
  http.get(`${API}/health`, route(() => HttpResponse.json({ status: 'ok' }))),

  http.post(`${API}/auth/login`, route(async ({ request }) => {
    const { email, password } = await readJson(request)
    if (!isNonEmptyString(email) || !isNonEmptyString(password)) badRequest('El email y la contraseña son obligatorios y deben ser texto')
    const user = db.users.find((u) => u.email === email.trim().toLowerCase())
    if (!user || user.password !== password) throw new HttpError(401, 'Email o contraseña incorrectos')
    return HttpResponse.json({ _id: user._id, name: user.name, email: user.email })
  })),

  http.get(`${API}/boards`, route(({ request }) => {
    const user = requireUser(request)
    const boards = db.boards
      .filter((board) => board.owner === user._id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return HttpResponse.json(boards.map(boardJSON))
  })),

  http.post(`${API}/boards`, route(async ({ request }) => {
    const { name, description } = await readJson(request)
    const user = requireUser(request)
    if (!isNonEmptyString(name)) badRequest('El nombre del tablero es obligatorio y debe ser un texto')
    if (description !== undefined && typeof description !== 'string') badRequest('La descripción del tablero debe ser un texto')
    const timestamp = now()
    const board = { _id: objectId(), name, description: description ?? '', owner: user._id, createdAt: timestamp, updatedAt: timestamp, __v: 0 }
    db.boards.push(board)
    return HttpResponse.json(boardJSON(board), { status: 201 })
  })),

  http.get(BOARD, route(({ params }) => HttpResponse.json(boardDetailJSON(checkBoard(params.boardId))))),

  http.delete(BOARD, route(({ params }) => {
    const board = checkBoard(params.boardId)
    // Borrado en cascada: columnas y tickets del tablero
    db.tickets = db.tickets.filter((t) => t.board !== board._id)
    db.columns = db.columns.filter((c) => c.board !== board._id)
    db.boards = db.boards.filter((b) => b._id !== board._id)
    return new HttpResponse(null, { status: 204 })
  })),

  http.post(`${BOARD}/columns`, route(async ({ request, params }) => {
    const { name } = await readJson(request)
    const board = checkBoard(params.boardId)
    if (!isNonEmptyString(name)) badRequest('El nombre de la columna es obligatorio y debe ser un texto')
    const timestamp = now()
    const column = { _id: objectId(), name, board: board._id, createdAt: timestamp, updatedAt: timestamp, __v: 0 }
    db.columns.push(column)
    return HttpResponse.json(columnJSON(column), { status: 201 })
  })),

  http.delete(`${BOARD}/columns/:columnId`, route(({ params }) => {
    checkBoard(params.boardId)
    const column = checkColumn(params.boardId, params.columnId)
    // Borrado en cascada: tickets de la columna
    db.tickets = db.tickets.filter((t) => t.column !== column._id)
    db.columns = db.columns.filter((c) => c._id !== column._id)
    return new HttpResponse(null, { status: 204 })
  })),

  http.post(TICKETS, route(async ({ request, params }) => {
    const { title, description, priority } = await readJson(request)
    checkBoard(params.boardId)
    const column = checkColumn(params.boardId, params.columnId)
    if (!isNonEmptyString(title)) badRequest('El título del ticket es obligatorio y debe ser un texto')
    if (description !== undefined && typeof description !== 'string') badRequest('La descripción del ticket debe ser un texto')
    if (priority !== undefined && !PRIORITIES.includes(priority)) badRequest(INVALID_PRIORITY)
    const timestamp = now()
    const ticket = {
      _id: objectId(), title, description: description ?? '', priority: priority ?? 'medium',
      column: column._id, board: column.board, createdAt: timestamp, updatedAt: timestamp, __v: 0,
    }
    db.tickets.push(ticket)
    return HttpResponse.json(ticketJSON(ticket), { status: 201 })
  })),

  http.patch(`${TICKETS}/:ticketId`, route(async ({ request, params }) => {
    const { title, description, priority, newColumnId } = await readJson(request)
    const { boardId, columnId, ticketId } = params
    checkBoard(boardId)
    checkColumn(boardId, columnId)
    const ticket = checkTicket(boardId, columnId, ticketId, newColumnId)

    if (title !== undefined && !isNonEmptyString(title)) badRequest('El título del ticket no puede estar vacío y debe ser un texto')
    if (description !== undefined && typeof description !== 'string') badRequest('La descripción del ticket debe ser un texto')
    if (priority !== undefined && !PRIORITIES.includes(priority)) badRequest(INVALID_PRIORITY)
    if (newColumnId !== undefined && !isValidObjectId(newColumnId)) badRequest('El ID de la columna destino no tiene un formato válido')

    // Idempotencia: solo se aplican los cambios que difieren del estado actual
    const changes = {}
    if (title !== undefined && title !== ticket.title) changes.title = title
    if (description !== undefined && description !== ticket.description) changes.description = description
    if (priority !== undefined && priority !== ticket.priority) changes.priority = priority
    if (newColumnId && newColumnId !== ticket.column) {
      const newColumn = db.columns.find((c) => c._id === newColumnId)
      if (!newColumn) throw new HttpError(404, 'La nueva columna de destino no existe')
      if (newColumn.board !== boardId) {
        badRequest('Aislamiento de Rutas: No puedes mover un ticket a una columna que pertenece a un tablero distinto')
      }
      changes.column = newColumnId
    }

    if (Object.keys(changes).length > 0) Object.assign(ticket, changes, { updatedAt: now() })
    return HttpResponse.json(ticketJSON(ticket))
  })),

  http.delete(`${TICKETS}/:ticketId`, route(({ params }) => {
    const { boardId, columnId, ticketId } = params
    checkBoard(boardId)
    checkColumn(boardId, columnId)
    const ticket = checkTicket(boardId, columnId, ticketId)
    db.tickets = db.tickets.filter((t) => t._id !== ticket._id)
    return new HttpResponse(null, { status: 204 })
  })),

  // Cualquier otra ruta de la API: 404 igual que el backend
  http.all(`${API}/*`, route(() => {
    throw new HttpError(404, 'Ruta no encontrada')
  })),
]
