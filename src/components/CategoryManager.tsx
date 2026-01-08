import { useState } from 'react'
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
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ColorPicker } from './ColorPicker'
import './CategoryManager.css'

interface Category {
  name: string
  color: string
}

interface CategoryManagerProps {
  categories: Category[]
  onChange: (categories: Category[]) => void
  selectedCategory?: string
  onSelectCategory?: (category: string | null) => void
}

function SortableCategoryItem({
  category,
  index,
  editingIndex,
  editingName,
  editingColor,
  selectedCategory,
  onSelectCategory,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onEditingNameChange,
  onEditingColorChange,
}: {
  category: Category
  index: number
  editingIndex: number | null
  editingName: string
  editingColor: string
  selectedCategory?: string
  onSelectCategory?: (category: string | null) => void
  onStartEdit: (index: number) => void
  onSaveEdit: (index: number) => void
  onCancelEdit: () => void
  onDelete: (index: number) => void
  onEditingNameChange: (name: string) => void
  onEditingColorChange: (color: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: `category-${index}`,
    disabled: editingIndex === index,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, backgroundColor: editingIndex === index ? editingColor : category.color }}
      className="category-manager-item"
      {...attributes}
      {...(editingIndex === index ? {} : listeners)}
    >
      {editingIndex === index ? (
        <>
          <input
            type="text"
            className="category-manager-edit-input"
            value={editingName}
            onChange={(e) => onEditingNameChange(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                onSaveEdit(index)
              } else if (e.key === 'Escape') {
                onCancelEdit()
              }
            }}
            autoFocus
          />
          <ColorPicker
            value={editingColor}
            onChange={onEditingColorChange}
          />
          <button
            className="category-manager-save-btn"
            onClick={() => onSaveEdit(index)}
          >
            ✓
          </button>
          <button
            className="category-manager-cancel-btn"
            onClick={onCancelEdit}
          >
            ✕
          </button>
        </>
      ) : (
        <>
          <span
            className={`category-manager-name ${selectedCategory === category.name ? 'selected' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              onSelectCategory?.(selectedCategory === category.name ? null : category.name)
            }}
            onMouseDown={(e) => {
              // 阻止拖放監聽器攔截點擊事件
              e.stopPropagation()
            }}
            onPointerDown={(e) => {
              // 阻止拖放監聽器攔截點擊事件
              e.stopPropagation()
            }}
            style={{ cursor: 'pointer' }}
          >
            {category.name}
          </span>
          <button
            className="category-manager-edit-btn"
            onClick={(e) => {
              e.stopPropagation()
              onStartEdit(index)
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="編輯分類"
            title="編輯"
          >
            ✏️
          </button>
          <button
            className="category-manager-delete-btn"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(index)
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="刪除分類"
            title="刪除"
          >
            🗑️
          </button>
        </>
      )}
    </div>
  )
}

export function CategoryManager({ categories, onChange, selectedCategory, onSelectCategory }: CategoryManagerProps) {
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#4ECDC4')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingColor, setEditingColor] = useState('#4ECDC4')

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

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return
    
    const trimmedName = newCategoryName.trim()
    if (categories.some((cat) => cat.name === trimmedName)) {
      alert('此分類已存在')
      return
    }

    onChange([...categories, { name: trimmedName, color: newCategoryColor }])
    setNewCategoryName('')
    setNewCategoryColor('#4ECDC4')
  }

  const handleDeleteCategory = (index: number) => {
    if (confirm('確定要刪除此分類嗎？')) {
      onChange(categories.filter((_, i) => i !== index))
    }
  }

  const handleStartEdit = (index: number) => {
    const category = categories[index]
    setEditingIndex(index)
    setEditingName(category.name)
    setEditingColor(category.color)
  }

  const handleSaveEdit = (index: number) => {
    if (!editingName.trim()) {
      alert('分類名稱不能為空')
      return
    }

    const trimmedName = editingName.trim()
    // 檢查是否有重複（排除當前編輯的分類）
    if (categories.some((cat, i) => i !== index && cat.name === trimmedName)) {
      alert('此分類名稱已存在')
      return
    }

    const updated = categories.map((cat, i) =>
      i === index ? { name: trimmedName, color: editingColor } : cat
    )
    onChange(updated)
    setEditingIndex(null)
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
    setEditingName('')
    setEditingColor('#4ECDC4')
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex((_, i) => `category-${i}` === active.id)
      const newIndex = categories.findIndex((_, i) => `category-${i}` === over.id)
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newCategories = arrayMove(categories, oldIndex, newIndex)
        onChange(newCategories)
      }
    }
  }

  return (
    <div className="category-manager">
      <h2 className="category-manager-title">分類管理</h2>
      
      <div className="category-manager-add">
        <input
          type="text"
          className="category-manager-input"
          placeholder="新分類名稱"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
        />
        <ColorPicker value={newCategoryColor} onChange={setNewCategoryColor} />
        <button
          className="category-manager-add-btn"
          onClick={handleAddCategory}
        >
          新增
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={categories.map((_, index) => `category-${index}`)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="category-manager-list">
            {categories.map((category, index) => (
              <SortableCategoryItem
                key={`category-${index}`}
                category={category}
                index={index}
                editingIndex={editingIndex}
                editingName={editingName}
                editingColor={editingColor}
                selectedCategory={selectedCategory}
                onSelectCategory={onSelectCategory}
                onStartEdit={handleStartEdit}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={handleCancelEdit}
                onDelete={handleDeleteCategory}
                onEditingNameChange={setEditingName}
                onEditingColorChange={setEditingColor}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
