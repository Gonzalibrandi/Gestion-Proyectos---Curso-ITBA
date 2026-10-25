import { Button } from './Button'
import styles from './Form.module.css'

// Contenedor de formulario: layout común y error general (por ejemplo, el 401 del login)
export function Form({ onSubmit, error, children }) {
  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      {error && (
        <p role="alert" className={styles.formError}>
          {error}
        </p>
      )}
      {children}
    </form>
  )
}

// Botones de un formulario: el de envío se deshabilita y muestra un Spinner mientras se envía
export function FormActions({ submitLabel = 'Guardar', onCancel, isSubmitting = false }) {
  return (
    <div className={styles.actions}>
      {onCancel && (
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
      )}
      <Button type="submit" isLoading={isSubmitting}>
        {submitLabel}
      </Button>
    </div>
  )
}
