import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormActions } from '../../../components/Form'
import { Input } from '../../../components/Input'
import { useServerError } from '../../../hooks/useServerError'
import { loginSchema } from '../schemas'

// El 401 (credenciales incorrectas) se muestra como error general del formulario (§8)
const CREDENTIAL_ERRORS = [401]

export function LoginForm({ onSubmit, isSubmitting, serverError }) {
  const { register, handleSubmit, setError, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  useServerError(serverError, setError, 'root.server', CREDENTIAL_ERRORS)

  return (
    <Form onSubmit={handleSubmit(onSubmit)} error={errors.root?.server?.message}>
      <Input label="Email" type="email" autoComplete="username" autoFocus {...register('email')} error={errors.email?.message} />
      <Input label="Contraseña" type="password" autoComplete="current-password" {...register('password')} error={errors.password?.message} />
      <FormActions submitLabel="Ingresar" isSubmitting={isSubmitting} />
    </Form>
  )
}
