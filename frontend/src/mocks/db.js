import { MOCK_USER_PASSWORD, mockBoards, mockColumns, mockTickets, mockUser } from './mockData'

// Estado en memoria del mock, como si fueran las colecciones de MongoDB.
// Es una copia de mockData: se reinicia al recargar la página.
export const db = {
  users: [{ ...structuredClone(mockUser), password: MOCK_USER_PASSWORD }],
  boards: structuredClone(mockBoards),
  columns: structuredClone(mockColumns),
  tickets: structuredClone(mockTickets),
}

// ObjectId válido: 8 caracteres hexadecimales de timestamp + 16 aleatorios
export function objectId() {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0')
  const random = Array.from(crypto.getRandomValues(new Uint8Array(8)), (byte) => byte.toString(16).padStart(2, '0')).join('')
  return timestamp + random
}

export const now = () => new Date().toISOString()

// Serialización igual a la del backend: Mongoose agrega el virtual `id` en Board y Column (no en Ticket)
export const boardJSON = (board) => ({ ...board, id: board._id })
export const columnJSON = (column) => ({ ...column, id: column._id })
export const ticketJSON = (ticket) => ({ ...ticket })

// Equivalente a GET /boards/:boardId con populate de columnas y tickets
export function boardDetailJSON(board) {
  const columns = db.columns
    .filter((column) => column.board === board._id)
    .map((column) => ({
      ...columnJSON(column),
      tickets: db.tickets.filter((ticket) => ticket.column === column._id).map(ticketJSON),
    }))
  return { ...boardJSON(board), columns }
}
