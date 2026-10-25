// Configuración de drag & drop de tickets entre columnas (@dnd-kit, requerimientos.md §2 y §9.3)

// Teclado: las flechas izquierda y derecha llevan el ticket al centro de la columna vecina
export function columnKeyboardCoordinates(event, { context }) {
  const { collisionRect, droppableRects } = context
  if (!collisionRect || !['ArrowLeft', 'ArrowRight'].includes(event.code)) return undefined

  event.preventDefault()
  const columns = [...droppableRects.values()].sort((a, b) => a.left - b.left)
  const center = collisionRect.left + collisionRect.width / 2
  const currentIndex = columns.findIndex((rect) => center >= rect.left && center <= rect.right)
  const step = event.code === 'ArrowRight' ? 1 : -1
  const target = columns[Math.min(Math.max(currentIndex + step, 0), columns.length - 1)]
  if (!target) return undefined

  return { x: target.left + (target.width - collisionRect.width) / 2, y: collisionRect.top }
}

const columnName = (over) => over?.data.current?.column?.name ?? 'desconocida'

// Mensajes para lectores de pantalla, en español
export const dndAccessibility = {
  screenReaderInstructions: {
    draggable:
      'Para mover el ticket, presioná Espacio o Enter, elegí la columna con las flechas izquierda y derecha y volvé a presionar Espacio o Enter para soltarlo. Escape cancela.',
  },
  announcements: {
    onDragStart: ({ active }) => `Tomaste el ticket "${active.data.current?.ticket?.title}".`,
    onDragOver: ({ over }) => (over ? `Sobre la columna "${columnName(over)}".` : 'Fuera de las columnas.'),
    onDragEnd: ({ over }) => (over ? `Soltaste el ticket en la columna "${columnName(over)}".` : 'Soltaste el ticket fuera de las columnas.'),
    onDragCancel: () => 'Se canceló el movimiento.',
  },
}
