import styles from './Spinner.module.css'

// Indicador de carga. Toma el color del texto que lo rodea (currentColor)
export function Spinner({ size = 'md', label = 'Cargando' }) {
  return <span className={`${styles.spinner} ${styles[size]}`} role="status" aria-label={label} />
}
