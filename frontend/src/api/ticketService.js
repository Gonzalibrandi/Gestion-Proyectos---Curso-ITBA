import { httpClient } from './httpClient'

const ticketsPath = (boardId, columnId) =>
  `/boards/${encodeURIComponent(boardId)}/columns/${encodeURIComponent(columnId)}/tickets`

export const ticketService = {
  // POST .../tickets -> ticket creado (priority por defecto: 'medium')
  async createTicket(boardId, columnId, { title, description, priority }) {
    const { data } = await httpClient.post(ticketsPath(boardId, columnId), { title, description, priority })
    return data
  },

  // PATCH .../tickets/:ticketId -> ticket actualizado.
  // Para mover un ticket, columnId es la columna de ORIGEN y newColumnId va en `changes`.
  async updateTicket(boardId, columnId, ticketId, changes) {
    const { data } = await httpClient.patch(`${ticketsPath(boardId, columnId)}/${encodeURIComponent(ticketId)}`, changes)
    return data
  },

  // DELETE .../tickets/:ticketId -> 204
  async deleteTicket(boardId, columnId, ticketId) {
    await httpClient.delete(`${ticketsPath(boardId, columnId)}/${encodeURIComponent(ticketId)}`)
  },
}
