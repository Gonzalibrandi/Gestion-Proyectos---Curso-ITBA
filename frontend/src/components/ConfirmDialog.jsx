import { Button } from './Button'
import { Modal } from './Modal'
import styles from './ConfirmDialog.module.css'

// Confirmación de borrado (requerimientos.md §8): reemplaza a window.confirm
export function ConfirmDialog({ title, message, confirmLabel = 'Eliminar', onConfirm, onCancel, isPending = false }) {
  return (
    <Modal title={title} onClose={isPending ? () => {} : onCancel}>
      <p className={styles.message}>{message}</p>
      <div className={styles.actions}>
        <Button variant="secondary" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={onConfirm} isLoading={isPending}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
