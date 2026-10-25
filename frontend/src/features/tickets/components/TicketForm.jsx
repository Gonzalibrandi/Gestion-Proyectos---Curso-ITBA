import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormActions } from '../../../components/Form'
import { Input } from '../../../components/Input'
import { useServerError } from '../../../hooks/useServerError'
import { PRIORITIES, PRIORITY_LABELS } from '../priorities'
import { ticketSchema } from '../schemas'

// Formulario de alta y edición de tickets. El 400 del backend se muestra en el título (§8).
export function TicketForm({ defaultValues, onSubmit, onCancel, isSubmitting, serverError, submitLabel = 'Guardar' }) {
  const { register, handleSubmit, setError, formState: { errors } } = useForm({
    resolver: zodResolver(ticketSchema),
    defaultValues: { title: '', description: '', priority: 'medium', ...defaultValues },
  })

  useServerError(serverError, setError, 'title')

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <Input label="Título" autoFocus {...register('title')} error={errors.title?.message} />
      <Input as="textarea" rows={3} label="Descripción (opcional)" {...register('description')} error={errors.description?.message} />
      <Input as="select" label="Prioridad" {...register('priority')} error={errors.priority?.message}>
        {PRIORITIES.map((priority) => (
          <option key={priority} value={priority}>
            {PRIORITY_LABELS[priority]}
          </option>
        ))}
      </Input>
      <FormActions submitLabel={submitLabel} onCancel={onCancel} isSubmitting={isSubmitting} />
    </Form>
  )
}
