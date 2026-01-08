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

import type { Category } from '../utils/supabase'

interface CategoryManagerProps {
  categories: Category[]
  selectedCategory?: string
  onSelectCategory?: (category: string | null) => void
  onAddCategory: (name: string, color: string) => Promise<void>
  onUpdateCategory: (id: string, updates: Partial<Category>) => Promise<void>
  onDeleteCategory: (id: string) => Promise<void>
  onReorderCategories: (categoryIds: string[]) => Promise<void>
}

function SortableCategoryItem({
  category,
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
  editingIndex: string | null
  editingName: string
  editingColor: string
  selectedCategory?: string
  onSelectCategory?: (category: string | null) => void
  onStartEdit: (id: string) => void
  onSaveEdit: (id: string, name: string, color: string) => Promise<void>
  onCancelEdit: () => void
  onDelete: (id: string) => Promise<void>
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
    id: category.id,
    disabled: editingIndex === category.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, backgroundColor: editingIndex === category.id ? editingColor : category.color }}
      className="category-manager-item"
      {...attributes}
      {...(editingIndex === category.id ? {} : listeners)}
    >
      {editingIndex === category.id ? (
        <>
          <input
            type="text"
            className="category-manager-edit-input"
            value={editingName}
            onChange={(e) => onEditingNameChange(e.target.value)}
            onKeyPress={async (e) => {
              if (e.key === 'Enter') {
                await onSaveEdit(category.id, editingName, editingColor)
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
            onClick={async () => await onSaveEdit(category.id, editingName, editingColor)}
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
              onStartEdit(category.id)
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
              onDelete(category.id)
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

export function CategoryManager({ 
  categories, 
  selectedCategory, 
  onSelectCategory,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onReorderCategories,
}: CategoryManagerProps) {
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#4ECDC4')
  const [editingId, setEditingId] = useState<string | null>(null)
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

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return
    
    const trimmedName = newCategoryName.trim()
    if (categories.some((cat) => cat.name === trimmedName)) {
      alert('此分類已存在')
      return
    }

    try {
      await onAddCategory(trimmedName, newCategoryColor)
      setNewCategoryName('')
      setNewCategoryColor('#4ECDC4')
    } catch (err) {
      // 錯誤已在 App.tsx 中處理
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (confirm('確定要刪除此分類嗎？')) {
      try {
        await onDeleteCategory(id)
      } catch (err) {
        // 錯誤已在 App.tsx 中處理
      }
    }
  }

  const handleStartEdit = (id: string) => {
    const category = categories.find((cat) => cat.id === id)
    if (category) {
      setEditingId(id)
      setEditingName(category.name)
      setEditingColor(category.color)
    }
  }

  const handleSaveEdit = async (id: string, name: string, color: string) => {
    if (!name.trim()) {
      alert('分類名稱不能為空')
      return
    }

    const trimmedName = name.trim()
    // 檢查是否有重複（排除當前編輯的分類）
    if (categories.some((cat) => cat.id !== id && cat.name === trimmedName)) {
      alert('此分類名稱已存在')
      return
    }

    try {
      await onUpdateCategory(id, { name: trimmedName, color })
      setEditingId(null)
      setEditingName('')
      setEditingColor('#4ECDC4')
    } catch (err) {
      // 錯誤已在 App.tsx 中處理
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingName('')
    setEditingColor('#4ECDC4')
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex((cat) => cat.id === active.id)
      const newIndex = categories.findIndex((cat) => cat.id === over.id)
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newCategories = arrayMove(categories, oldIndex, newIndex)
        const categoryIds = newCategories.map((cat) => cat.id)
        try {
          await onReorderCategories(categoryIds)
        } catch (err) {
          // 錯誤已在 App.tsx 中處理
        }
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
          items={categories.map((cat) => cat.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="category-manager-list">
            {categories.map((category) => (
              <SortableCategoryItem
                key={category.id}
                category={category}
                editingIndex={editingId}
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
