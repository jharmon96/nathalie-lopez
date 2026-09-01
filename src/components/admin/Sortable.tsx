import type { ReactNode } from 'react'
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

/** Grip handle — drag the item by this, not by its inputs. */
export function DragHandle() {
  return (
    <span
      className="cursor-grab select-none text-ink/30 transition-colors hover:text-ink/60 active:cursor-grabbing"
      aria-hidden="true"
      title="Drag to reorder"
    >
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor">
        <circle cx="5" cy="3" r="1.4" />
        <circle cx="11" cy="3" r="1.4" />
        <circle cx="5" cy="8" r="1.4" />
        <circle cx="11" cy="8" r="1.4" />
        <circle cx="5" cy="13" r="1.4" />
        <circle cx="11" cy="13" r="1.4" />
      </svg>
    </span>
  )
}

interface SortableItemProps {
  id: number
  children: ReactNode
}

/** Wrap each row; provides the drag handle and lift/drop styling. */
export function SortableItem({ id, children }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style: React.CSSProperties = {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.85 : 1,
    boxShadow: isDragging ? '0 4px 16px rgba(0,0,0,0.15)' : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} className="touch-none">
      <div className="flex items-start gap-3">
        <button type="button" className="mt-3 cursor-grab active:cursor-grabbing" {...attributes} {...listeners} aria-label="Drag to reorder">
          <DragHandle />
        </button>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  )
}

interface SortableListProps<T extends { id: number }> {
  items: T[]
  onReorder: (ids: number[]) => void
  renderItem: (item: T) => ReactNode
  keyOf?: (item: T) => number
}

/** Vertical drag-to-reorder list. onReorder receives the new id order. */
export function SortableList<T extends { id: number }>({ items, onReorder, renderItem, keyOf = (item) => item.id }: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ordered = items.map(keyOf)
    const oldIndex = ordered.indexOf(Number(active.id))
    const newIndex = ordered.indexOf(Number(over.id))
    if (oldIndex === -1 || newIndex === -1) return
    onReorder(arrayMove(ordered, oldIndex, newIndex))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map(keyOf)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <SortableItem key={item.id} id={item.id}>
              {renderItem(item)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
