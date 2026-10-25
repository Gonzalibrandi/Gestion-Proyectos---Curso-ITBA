import { Spinner } from './Spinner'
import styles from './Button.module.css'

// Botón base. type="button" por defecto para no enviar formularios sin querer.
// isLoading: deshabilita el botón y muestra un Spinner mientras la petición está en curso (requerimientos.md §8).
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  isLoading = false,
  disabled = false,
  className = '',
  ...props
}) {
  const classes = [styles.btn, styles[variant], styles[size], className].filter(Boolean).join(' ')

  return (
    <button type={type} className={classes} disabled={disabled || isLoading} aria-busy={isLoading || undefined} {...props}>
      {isLoading && <Spinner size="sm" label="Procesando" />}
      {children}
    </button>
  )
}
