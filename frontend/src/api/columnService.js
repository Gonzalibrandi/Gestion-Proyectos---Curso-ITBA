import { httpClient } from './httpClient'

const columnsPath = (boardId) => `/boards/${encodeURIComponent(boardId)}/columns`

export const columnService = {
  // POST /boards/:boardId/columns -> columna creada
  async createColumn(boardId, { name }) {
    const { data } = await httpClient.post(columnsPath(boardId), { name })
    return data
  },

  // DELETE /boards/:boardId/columns/:columnId -> 204 (borra en cascada sus tickets)
  async deleteColumn(boardId, columnId) {
    await httpClient.delete(`${columnsPath(boardId)}/${encodeURIComponent(columnId)}`)
  },
}
