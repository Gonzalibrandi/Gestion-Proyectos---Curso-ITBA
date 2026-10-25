import { z } from 'zod'
import { PRIORITIES } from './priorities'

export const ticketSchema = z.object({
  title: z.string().trim().min(1, 'El título es obligatorio'),
  description: z.string().trim().optional(),
  priority: z.enum(PRIORITIES, { message: 'Elegí una prioridad válida' }),
})
