import React from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Link } from '../utils/supabase'
import { LinkCard } from './LinkCard'
import './LinkGrid.css'

interface CategoryInfo {
  name: string
  color: string
}

interface LinkGridProps {
  links: Link[]
  onDelete: (id: string) => void
  onReorder: (linkIds: string[]) => void
  onUpdate: (id: string, updates: Partial<Link>) => void
  categories: CategoryInfo[]
}

function SortableLinkCard({ 
  link, 
  onDelete, 
  onUpdate, 
  categories 
}: { 
  link: Link
  onDelete: (id: string) => void
  onUpdate: (id: string, updates: Partial<Link>) => void
  categories: CategoryInfo[]
}) {
  const [isEditing, setIsEditing] = React.useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: link.id,
    disabled: isEditing,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...(!isEditing ? listeners : {})}
      onClick={(e) => {
        // 如果點擊的是按鈕或可編輯元素，不阻止事件冒泡
        const target = e.target as HTMLElement
        if (target.closest('button, input, select, .link-card-actions')) {
          e.stopPropagation()
        }
      }}
    >
      <LinkCard 
        link={link} 
        onDelete={onDelete} 
        onUpdate={onUpdate} 
        categories={categories}
        onEditingChange={setIsEditing}
      />
    </div>
  )
}

export function LinkGrid({ links, onDelete, onReorder, onUpdate, categories }: LinkGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 需要移動 8px 才開始拖動，避免攔截點擊
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = links.findIndex((link) => link.id === active.id)
      const newIndex = links.findIndex((link) => link.id === over.id)
      const newLinks = arrayMove(links, oldIndex, newIndex)
      onReorder(newLinks.map((link) => link.id))
    }
  }

  if (links.length === 0) {
    return (
      <div className="link-grid-empty">
        <p>還沒有收藏任何連結</p>
        <p className="link-grid-empty-hint">使用上方表單新增連結</p>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={links.map((link) => link.id)} strategy={rectSortingStrategy}>
        <div className="link-grid">
          {links.map((link) => (
            <SortableLinkCard 
              key={link.id} 
              link={link} 
              onDelete={onDelete}
              onUpdate={onUpdate}
              categories={categories}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
