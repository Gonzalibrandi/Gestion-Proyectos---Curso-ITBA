import { z } from 'zod'

export const columnSchema = z.object({
  name: z.string().trim().min(1, 'El nombre de la columna es obligatorio'),
})
