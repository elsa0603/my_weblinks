import { useState, useEffect, memo } from 'react'
import type { Link } from '../utils/supabase'
import './LinkCard.css'

interface LinkCardProps {
  link: Link
  onDelete: (id: string) => void
  onUpdate: (id: string, updates: Partial<Link>) => void
  categories: string[]
  onEditingChange?: (isEditing: boolean) => void
}

function LinkCardComponent({ link, onDelete, onUpdate, categories, onEditingChange }: LinkCardProps) {
  const [isEditingCategory, setIsEditingCategory] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(link.category)
  const [editedTitle, setEditedTitle] = useState(link.title)

  // 通知父組件編輯狀態變化
  useEffect(() => {
    onEditingChange?.(isEditingCategory || isEditingTitle)
  }, [isEditingCategory, isEditingTitle, onEditingChange])

  const handleClick = () => {
    if (!isEditingCategory && !isEditingTitle) {
      window.open(link.url, '_blank', 'noopener,noreferrer')
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (confirm('確定要刪除此連結嗎？')) {
      onDelete(link.id)
    }
  }

  const handleEditCategory = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsEditingCategory(true)
  }

  const handleEditTitle = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsEditingTitle(true)
    setEditedTitle(link.title)
  }

  const handleSaveCategory = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (selectedCategory !== link.category) {
      // 獲取新分類的顏色
      const saved = localStorage.getItem('categories')
      if (saved) {
        const categoriesData = JSON.parse(saved)
        const found = categoriesData.find((cat: { name: string; color: string }) => cat.name === selectedCategory)
        const newColor = found ? found.color : link.color
        onUpdate(link.id, { category: selectedCategory, color: newColor })
      } else {
        onUpdate(link.id, { category: selectedCategory })
      }
    }
    setIsEditingCategory(false)
  }

  const handleSaveTitle = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const trimmedTitle = editedTitle.trim()
    if (trimmedTitle && trimmedTitle !== link.title) {
      onUpdate(link.id, { title: trimmedTitle })
    }
    setIsEditingTitle(false)
  }

  const handleCancelCategory = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setSelectedCategory(link.category)
    setIsEditingCategory(false)
  }

  const handleCancelTitle = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setEditedTitle(link.title)
    setIsEditingTitle(false)
  }

  return (
    <div
      className="link-card"
      style={{ borderLeftColor: link.color }}
      onClick={handleClick}
    >
      <div className="link-card-thumbnail">
        {link.thumbnail ? (
          <img 
            src={link.thumbnail} 
            alt={link.title} 
            loading="lazy"
            decoding="async"
            onError={(e) => {
              // 圖片載入失敗時顯示佔位符
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              const parent = target.parentElement
              if (parent) {
                const placeholder = parent.querySelector('.link-card-placeholder-fallback') as HTMLElement
                if (placeholder) {
                  placeholder.style.display = 'flex'
                }
              }
            }}
          />
        ) : null}
        <div 
          className="link-card-placeholder link-card-placeholder-fallback" 
          style={{ display: link.thumbnail ? 'none' : 'flex' }}
        >
          無縮圖
        </div>
      </div>
      <div className="link-card-content">
        <div className="link-card-url" title={link.url}>
          {(() => {
            try {
              const hostname = new URL(link.url).hostname.replace('www.', '')
              return hostname.length > 20 ? hostname.substring(0, 20) + '...' : hostname
            } catch {
              const url = link.url.length > 20 ? link.url.substring(0, 20) + '...' : link.url
              return url
            }
          })()}
        </div>
        {isEditingTitle ? (
          <input
            type="text"
            className="link-card-title-input"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSaveTitle(e as any)
              } else if (e.key === 'Escape') {
                handleCancelTitle(e as any)
              }
            }}
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        ) : (
          <h3 
            className="link-card-title" 
            title={link.title}
            onDoubleClick={handleEditTitle}
            style={{ cursor: 'pointer' }}
          >
            {link.title}
          </h3>
        )}
        {isEditingCategory ? (
          <select
            className="link-card-category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        ) : (
          <p className="link-card-category" style={{ color: link.color }}>
            {link.category}
          </p>
        )}
      </div>
      <div className="link-card-actions">
        {isEditingCategory ? (
          <>
            <button
              type="button"
              className="link-card-save"
              onClick={handleSaveCategory}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label="儲存分類"
              title="儲存分類"
            >
              ✓
            </button>
            <button
              type="button"
              className="link-card-cancel"
              onClick={handleCancelCategory}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label="取消"
              title="取消"
            >
              ✕
            </button>
          </>
        ) : isEditingTitle ? (
          <>
            <button
              type="button"
              className="link-card-save"
              onClick={handleSaveTitle}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label="儲存標題"
              title="儲存標題"
            >
              ✓
            </button>
            <button
              type="button"
              className="link-card-cancel"
              onClick={handleCancelTitle}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label="取消"
              title="取消"
            >
              ✕
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="link-card-edit-title"
              onClick={handleEditTitle}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label="編輯標題"
              title="編輯標題"
            >
              📝
            </button>
            <button
              type="button"
              className="link-card-edit"
              onClick={handleEditCategory}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label="編輯分類"
              title="編輯分類"
            >
              ✏️
            </button>
          </>
        )}
        <button
          type="button"
          className="link-card-delete"
          onClick={handleDelete}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label="刪除連結"
          title="刪除"
        >
          ×
        </button>
      </div>
    </div>
  )
}

// 使用 memo 優化，只在 link 或 categories 變化時重渲染
export const LinkCard = memo(LinkCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.link.id === nextProps.link.id &&
    prevProps.link.title === nextProps.link.title &&
    prevProps.link.url === nextProps.link.url &&
    prevProps.link.thumbnail === nextProps.link.thumbnail &&
    prevProps.link.category === nextProps.link.category &&
    prevProps.link.color === nextProps.link.color &&
    prevProps.link.order === nextProps.link.order &&
    prevProps.categories.length === nextProps.categories.length &&
    prevProps.categories.every((cat, i) => cat === nextProps.categories[i])
  )
})
