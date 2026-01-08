import { useState, useEffect, useMemo, useCallback } from 'react'
import { useLinks } from './hooks/useLinks'
import { LinkForm } from './components/LinkForm'
import { LinkGrid } from './components/LinkGrid'
import { CategoryManager } from './components/CategoryManager'
import { ExportLinks } from './components/ExportLinks'
import './App.css'

interface Category {
  name: string
  color: string
}

function App() {
  const { links, loading, error, addLink, deleteLink, updateOrder, updateLink } = useLinks()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('categories')
    if (saved) {
      return JSON.parse(saved)
    }
    return [
      { name: '未分類', color: '#4ECDC4' },
      { name: '工作', color: '#FF6B6B' },
      { name: '學習', color: '#45B7D1' },
      { name: '娛樂', color: '#F7DC6F' },
    ]
  })

  // 保存分類到 localStorage
  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories))
  }, [categories])

  const handleAddLink = useCallback(async (linkData: Parameters<typeof addLink>[0]) => {
    await addLink(linkData)
  }, [addLink])

  const handleDeleteLink = useCallback(async (id: string) => {
    await deleteLink(id)
  }, [deleteLink])

  const handleReorder = useCallback(async (linkIds: string[]) => {
    await updateOrder(linkIds)
  }, [updateOrder])

  const handleUpdateLink = useCallback(async (id: string, updates: Partial<Parameters<typeof updateLink>[1]>) => {
    await updateLink(id, updates)
  }, [updateLink])

  // 使用 useMemo 優化計算
  const categoryNames = useMemo(() => categories.map((cat) => cat.name), [categories])
  const defaultColor = useMemo(() => categories[0]?.color || '#4ECDC4', [categories])
  const maxOrder = useMemo(() => 
    links.length > 0 ? Math.max(...links.map((l) => l.order)) : -1,
    [links]
  )

  // 根據選中的分類過濾連結，使用 useMemo 優化
  const filteredLinks = useMemo(() => 
    selectedCategory
      ? links.filter((link) => link.category === selectedCategory)
      : links,
    [links, selectedCategory]
  )

  return (
    <div className="app">
      <header className="app-header">
        <h1>我的網站收藏</h1>
        <p className="app-subtitle">收藏和管理您喜愛的網站與 YouTube 影片</p>
      </header>

      <main className="app-main">
        <div className="app-container">
          <CategoryManager 
            categories={categories} 
            onChange={setCategories}
            selectedCategory={selectedCategory || undefined}
            onSelectCategory={setSelectedCategory}
          />
          
          {selectedCategory && (
            <div className="app-filter-info">
              顯示分類：<strong>{selectedCategory}</strong> ({filteredLinks.length} 個連結)
              <button 
                className="app-filter-clear"
                onClick={() => setSelectedCategory(null)}
              >
                清除篩選
              </button>
            </div>
          )}
          
          <LinkForm
            onSubmit={handleAddLink}
            categories={categoryNames}
            defaultColor={defaultColor}
            maxOrder={maxOrder}
          />

          {error && (
            <div className="app-error">
              錯誤：{error}
            </div>
          )}

          {loading && links.length === 0 ? (
            <div className="app-loading">載入中...</div>
          ) : (
            <LinkGrid
              links={filteredLinks}
              onDelete={handleDeleteLink}
              onReorder={handleReorder}
              onUpdate={handleUpdateLink}
              categories={categoryNames}
            />
          )}

          <ExportLinks links={links} categories={categoryNames} />
        </div>
      </main>
    </div>
  )
}

export default App
