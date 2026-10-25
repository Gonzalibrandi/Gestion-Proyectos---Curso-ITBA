import { useId } from 'react'
import styles from './Input.module.css'

// Campo de formulario (input, textarea o select) con label y mensaje de error accesibles.
// Funciona con register() de React Hook Form: el ref llega dentro de ...props (React 19).
export function Input({ label, error, as: Field = 'input', id, className = '', children, ...props }) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const errorId = `${fieldId}-error`

  return (
    <div className={styles.container}>
      {label && (
        <label className={styles.label} htmlFor={fieldId}>
          {label}
        </label>
      )}
      <Field
        id={fieldId}
        className={[styles.field, error ? styles.invalid : '', className].filter(Boolean).join(' ')}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        {...props}
      >
        {children}
      </Field>
      {error && (
        <span id={errorId} role="alert" className={styles.errorMessage}>
          {error}
        </span>
      )}
    </div>
  )
}
