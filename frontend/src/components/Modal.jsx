import { useEffect, useId } from 'react'
import styles from './Modal.module.css'

// Diálogo modal accesible: se cierra con Escape o haciendo clic fuera del panel.
// El efecto solo escucha el teclado (estado visual), no trae datos.
export function Modal({ title, onClose, children }) {
  const titleId = useId()

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleOverlayMouseDown = (event) => {
    if (event.target === event.currentTarget) onClose()
  }

  return (
    <div className={styles.overlay} onMouseDown={handleOverlayMouseDown}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        {children}
      </div>
    </div>
  )
}
