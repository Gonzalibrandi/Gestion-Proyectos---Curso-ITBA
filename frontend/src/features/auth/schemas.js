import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email('Ingresá un email válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
})
