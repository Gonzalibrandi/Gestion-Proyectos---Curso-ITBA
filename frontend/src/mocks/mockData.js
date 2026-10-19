// Datos sintéticos con la MISMA forma que los documentos del backend (requerimientos.md §11.1):
// _id de 24 caracteres hexadecimales, timestamps, __v, owner y priority.
// Son los "documentos" crudos; mocks/db.js los serializa igual que Mongoose (agrega el virtual `id`).

// Credenciales del usuario único de demo (iguales a backend/.env.example)
export const MOCK_USER_PASSWORD = 'demo1234'

const doc = (fields, createdAt, updatedAt = createdAt) => ({ ...fields, createdAt, updatedAt, __v: 0 })

export const mockUser = doc(
  { _id: '66a1f0c2e4b0a1b2c3d4e5f0', name: 'Demo', email: 'demo@kanban.com' },
  '2026-10-01T10:00:00.000Z',
)

const ALPHA = '66a1f0c2e4b0a1b2c3d4e601'
const BETA = '66a1f0c2e4b0a1b2c3d4e602'

export const mockBoards = [
  doc({ _id: ALPHA, name: 'Proyecto Alpha', description: 'Tablero principal del proyecto', owner: mockUser._id }, '2026-10-10T12:00:00.000Z'),
  doc({ _id: BETA, name: 'Proyecto Beta', description: '', owner: mockUser._id }, '2026-10-12T09:30:00.000Z'),
]

const TODO = '66a1f0c2e4b0a1b2c3d4e611'
const DOING = '66a1f0c2e4b0a1b2c3d4e612'
const DONE = '66a1f0c2e4b0a1b2c3d4e613'
const BACKLOG = '66a1f0c2e4b0a1b2c3d4e621'

export const mockColumns = [
  doc({ _id: TODO, name: 'To Do', board: ALPHA }, '2026-10-10T12:01:00.000Z'),
  doc({ _id: DOING, name: 'Doing', board: ALPHA }, '2026-10-10T12:02:00.000Z'),
  doc({ _id: DONE, name: 'Done', board: ALPHA }, '2026-10-10T12:03:00.000Z'),
  doc({ _id: BACKLOG, name: 'Backlog', board: BETA }, '2026-10-12T09:31:00.000Z'),
]

const ticket = (_id, title, description, priority, column, board, createdAt) =>
  doc({ _id, title, description, priority, column, board }, createdAt)

export const mockTickets = [
  ticket('66a1f0c2e4b0a1b2c3d4e631', 'Definir endpoints de la API', 'Contrato REST con rutas anidadas', 'high', TODO, ALPHA, '2026-10-10T12:10:00.000Z'),
  ticket('66a1f0c2e4b0a1b2c3d4e632', 'Configurar tokens del tema', '', 'medium', TODO, ALPHA, '2026-10-10T12:11:00.000Z'),
  ticket('66a1f0c2e4b0a1b2c3d4e633', 'Diseñar TicketCard', 'Componente presentacional con prioridad', 'medium', DOING, ALPHA, '2026-10-10T12:12:00.000Z'),
  ticket('66a1f0c2e4b0a1b2c3d4e634', 'Crear repositorio monorepo', '', 'low', DONE, ALPHA, '2026-10-10T12:13:00.000Z'),
  ticket('66a1f0c2e4b0a1b2c3d4e635', 'Investigar despliegue en Render', 'Plan gratuito y arranque en frío', 'medium', BACKLOG, BETA, '2026-10-12T09:40:00.000Z'),
]
