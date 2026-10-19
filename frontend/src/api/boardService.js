import { httpClient } from './httpClient'

const boardPath = (boardId) => `/boards/${encodeURIComponent(boardId)}`

export const boardService = {
  // GET /boards -> tableros del usuario actual (X-User-Id), del más reciente al más antiguo
  async getBoards() {
    const { data } = await httpClient.get('/boards')
    return data
  },

  // POST /boards -> tablero creado (su dueño es el usuario actual)
  async createBoard({ name, description }) {
    const { data } = await httpClient.post('/boards', { name, description })
    return data
  },

  // GET /boards/:boardId -> tablero con columns[] y, en cada columna, tickets[]
  async getBoardById(boardId) {
    const { data } = await httpClient.get(boardPath(boardId))
    return data
  },

  // DELETE /boards/:boardId -> 204 (borra en cascada columnas y tickets)
  async deleteBoard(boardId) {
    await httpClient.delete(boardPath(boardId))
  },
}
