import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import type { Category } from '../utils/supabase'

interface LocalCategory {
  name: string
  color: string
}

const DEFAULT_CATEGORIES: LocalCategory[] = [
  { name: '未分類', color: '#4ECDC4' },
  { name: '工作', color: '#FF6B6B' },
  { name: '學習', color: '#45B7D1' },
  { name: '娛樂', color: '#F7DC6F' },
]

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [migrated, setMigrated] = useState(false)

  // 載入所有分類
  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .order('order', { ascending: true })

      if (fetchError) {
        console.error('Error loading categories from Supabase:', fetchError)
        // 如果是表不存在的錯誤，提供更明確的提示
        if (fetchError.code === 'PGRST116' || fetchError.message?.includes('does not exist')) {
          throw new Error('categories 表不存在，請先在 Supabase 中執行 SQL 創建表（見 SUPABASE_SETUP.md）')
        }
        throw fetchError
      }

      // 如果 Supabase 中有數據，直接使用
      if (data && data.length > 0) {
        setCategories(data)
        setError(null)
        setMigrated(true)
        return
      }

      // 如果 Supabase 為空，執行遷移邏輯
      if (!migrated) {
        await migrateCategories()
      } else {
        setCategories([])
      }
      
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load categories'
      setError(errorMessage)
      console.error('Error loading categories:', err)
      
      // 如果 Supabase 連接失敗，嘗試從 localStorage 讀取（降級方案）
      try {
        const saved = localStorage.getItem('categories')
        if (saved) {
          const localCategories = JSON.parse(saved) as LocalCategory[]
          // 轉換為 Category 格式（沒有 id 和 order，僅用於顯示）
          const fallbackCategories: Category[] = localCategories.map((cat, index) => ({
            id: `local-${index}`,
            name: cat.name,
            color: cat.color,
            order: index,
            created_at: new Date().toISOString(),
          }))
          setCategories(fallbackCategories)
        }
      } catch (localError) {
        console.error('Error reading from localStorage:', localError)
      }
    } finally {
      setLoading(false)
    }
  }

  // 遷移分類數據
  async function migrateCategories() {
    try {
      // 檢查 localStorage 是否有數據
      const saved = localStorage.getItem('categories')
      let categoriesToMigrate: LocalCategory[] = []

      if (saved) {
        try {
          categoriesToMigrate = JSON.parse(saved) as LocalCategory[]
        } catch {
          // localStorage 數據格式錯誤，使用默認分類
          categoriesToMigrate = DEFAULT_CATEGORIES
        }
      } else {
        // localStorage 也沒有數據，使用默認分類
        categoriesToMigrate = DEFAULT_CATEGORIES
      }

      // 將分類保存到 Supabase
      const categoriesWithOrder = categoriesToMigrate.map((cat, index) => ({
        name: cat.name,
        color: cat.color,
        order: index,
      }))

      const { data, error: insertError } = await supabase
        .from('categories')
        .insert(categoriesWithOrder)
        .select()

      if (insertError) throw insertError

      if (data && data.length > 0) {
        setCategories(data)
        // 遷移成功後清除 localStorage
        localStorage.removeItem('categories')
        setMigrated(true)
      }
    } catch (err) {
      console.error('Error migrating categories:', err)
      // 遷移失敗時，使用默認分類
      const fallbackCategories: Category[] = DEFAULT_CATEGORIES.map((cat, index) => ({
        id: `fallback-${index}`,
        name: cat.name,
        color: cat.color,
        order: index,
        created_at: new Date().toISOString(),
      }))
      setCategories(fallbackCategories)
    }
  }

  // 新增分類
  async function addCategory(name: string, color: string) {
    try {
      // 檢查名稱是否已存在
      const existing = categories.find((cat) => cat.name === name)
      if (existing) {
        throw new Error('此分類已存在')
      }

      // 計算新的 order 值
      const maxOrder = categories.length > 0 ? Math.max(...categories.map((c) => c.order)) : -1
      const newOrder = maxOrder + 1

      const { data, error: insertError } = await supabase
        .from('categories')
        .insert([{ name: name.trim(), color, order: newOrder }])
        .select()
        .single()

      if (insertError) {
        // 顯示詳細的 Supabase 錯誤訊息
        console.error('Supabase insert error:', insertError)
        const detailedError = insertError.message || insertError.code || 'Unknown error'
        throw new Error(`新增分類失敗: ${detailedError}`)
      }

      if (data) {
        setCategories((prev) => [...prev, data].sort((a, b) => a.order - b.order))
      }

      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add category'
      setError(errorMessage)
      console.error('Error adding category:', err)
      throw err
    }
  }

  // 更新分類
  async function updateCategory(id: string, updates: Partial<Category>) {
    try {
      // 如果更新名稱，檢查是否與其他分類重複
      if (updates.name) {
        const existing = categories.find((cat) => cat.id !== id && cat.name === updates.name)
        if (existing) {
          throw new Error('此分類名稱已存在')
        }
      }

      const { data, error: updateError } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      if (data) {
        setCategories((prev) =>
          prev.map((cat) => (cat.id === id ? data : cat)).sort((a, b) => a.order - b.order)
        )
      }

      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update category'
      setError(errorMessage)
      throw err
    }
  }

  // 刪除分類
  async function deleteCategory(id: string) {
    try {
      const category = categories.find((cat) => cat.id === id)
      if (!category) {
        throw new Error('分類不存在')
      }

      // 檢查是否有連結使用此分類
      const { data: links, error: linksError } = await supabase
        .from('links')
        .select('id')
        .eq('category', category.name)
        .limit(1)

      if (linksError) throw linksError

      if (links && links.length > 0) {
        throw new Error('無法刪除：仍有連結使用此分類')
      }

      const { error: deleteError } = await supabase.from('categories').delete().eq('id', id)

      if (deleteError) throw deleteError

      setCategories((prev) => prev.filter((cat) => cat.id !== id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete category'
      setError(errorMessage)
      throw err
    }
  }

  // 重新排序分類
  async function reorderCategories(categoryIds: string[]) {
    try {
      // 先更新本地狀態，提供即時反饋
      setCategories((prev) => {
        const categoryMap = new Map(prev.map((cat) => [cat.id, cat]))
        return categoryIds.map((id) => categoryMap.get(id)!).filter(Boolean)
      })

      // 批量更新數據庫
      const updates = categoryIds.map((id, index) => ({
        id,
        order: index,
      }))

      // 使用 Promise.all 並行更新
      const batchSize = 10
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize)
        await Promise.all(
          batch.map((update) =>
            supabase
              .from('categories')
              .update({ order: update.order })
              .eq('id', update.id)
          )
        )
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reorder categories'
      setError(errorMessage)
      // 發生錯誤時重新載入以保持同步
      loadCategories()
      throw err
    }
  }

  return {
    categories,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    refresh: loadCategories,
  }
}
