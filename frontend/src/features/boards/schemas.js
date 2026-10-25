import { z } from 'zod'

export const boardSchema = z.object({
  name: z.string().trim().min(1, 'El nombre del tablero es obligatorio'),
  description: z.string().trim().optional(),
})
