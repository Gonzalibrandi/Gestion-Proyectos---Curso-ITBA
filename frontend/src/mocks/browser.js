import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

// Service Worker de MSW: intercepta las peticiones de la capa API en el navegador
export const worker = setupWorker(...handlers)
