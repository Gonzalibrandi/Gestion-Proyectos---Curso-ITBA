import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormActions } from '../../../components/Form'
import { Input } from '../../../components/Input'
import { useServerError } from '../../../hooks/useServerError'
import { boardSchema } from '../schemas'

// Formulario de alta de tableros. El 400 del backend se muestra en el nombre (§8).
export function BoardForm({ onSubmit, onCancel, isSubmitting, serverError }) {
  const { register, handleSubmit, setError, formState: { errors } } = useForm({
    resolver: zodResolver(boardSchema),
    defaultValues: { name: '', description: '' },
  })

  useServerError(serverError, setError, 'name')

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <Input label="Nombre" autoFocus {...register('name')} error={errors.name?.message} />
      <Input as="textarea" rows={3} label="Descripción (opcional)" {...register('description')} error={errors.description?.message} />
      <FormActions submitLabel="Crear tablero" onCancel={onCancel} isSubmitting={isSubmitting} />
    </Form>
  )
}
