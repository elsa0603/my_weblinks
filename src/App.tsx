import { useState, useMemo, useCallback } from 'react'
import { useLinks } from './hooks/useLinks'
import { useCategories } from './hooks/useCategories'
import { LinkForm } from './components/LinkForm'
import { LinkGrid } from './components/LinkGrid'
import { CategoryManager } from './components/CategoryManager'
import { ExportLinks } from './components/ExportLinks'
import type { Category } from './utils/supabase'
import './App.css'

function App() {
  const { links, loading, error, addLink, deleteLink, updateOrder, updateLink } = useLinks()
  const { 
    categories, 
    loading: categoriesLoading, 
    error: categoriesError,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
  } = useCategories()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

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

  // 處理新增分類
  const handleAddCategory = useCallback(async (name: string, color: string) => {
    try {
      await addCategory(name, color)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '新增分類失敗'
      console.error('Failed to add category:', err)
      alert(errorMessage)
    }
  }, [addCategory])

  // 處理更新分類
  const handleUpdateCategory = useCallback(async (id: string, updates: Partial<Category>) => {
    try {
      await updateCategory(id, updates)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新分類失敗'
      alert(errorMessage)
    }
  }, [updateCategory])

  // 處理刪除分類
  const handleDeleteCategory = useCallback(async (id: string) => {
    try {
      await deleteCategory(id)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '刪除分類失敗'
      alert(errorMessage)
    }
  }, [deleteCategory])

  // 處理重新排序
  const handleReorderCategories = useCallback(async (categoryIds: string[]) => {
    try {
      await reorderCategories(categoryIds)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '重新排序失敗'
      alert(errorMessage)
    }
  }, [reorderCategories])

  // 使用 useMemo 優化計算
  const categoryNames = useMemo(() => categories.map((cat) => cat.name), [categories])
  const defaultColor = useMemo(() => categories[0]?.color || '#4ECDC4', [categories])
  
  // 為 LinkForm 準備分類信息（包含顏色）
  const categoriesForForm = useMemo(() => 
    categories.map((cat) => ({ name: cat.name, color: cat.color })),
    [categories]
  )
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
            selectedCategory={selectedCategory || undefined}
            onSelectCategory={setSelectedCategory}
            onAddCategory={handleAddCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
            onReorderCategories={handleReorderCategories}
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
            categories={categoriesForForm}
            defaultColor={defaultColor}
            maxOrder={maxOrder}
          />

          {(error || categoriesError) && (
            <div className="app-error">
              錯誤：{error || categoriesError}
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
              categories={categoriesForForm}
            />
          )}

          <ExportLinks links={links} categories={categoryNames} />
        </div>
      </main>
    </div>
  )
}

export default App
