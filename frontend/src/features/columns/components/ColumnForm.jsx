import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormActions } from '../../../components/Form'
import { Input } from '../../../components/Input'
import { useServerError } from '../../../hooks/useServerError'
import { columnSchema } from '../schemas'

// Formulario de alta de columnas. El 400 del backend se muestra en el nombre (§8).
export function ColumnForm({ onSubmit, onCancel, isSubmitting, serverError }) {
  const { register, handleSubmit, setError, formState: { errors } } = useForm({
    resolver: zodResolver(columnSchema),
    defaultValues: { name: '' },
  })

  useServerError(serverError, setError, 'name')

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <Input label="Nombre" autoFocus {...register('name')} error={errors.name?.message} />
      <FormActions submitLabel="Crear columna" onCancel={onCancel} isSubmitting={isSubmitting} />
    </Form>
  )
}
