import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import type { Link } from '../utils/supabase'

export function useLinks() {
  const [links, setLinks] = useState<Link[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 載入所有連結
  useEffect(() => {
    loadLinks()
  }, [])

  async function loadLinks() {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('links')
        .select('*')
        .order('order', { ascending: true })

      if (fetchError) throw fetchError
      setLinks(data || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load links')
      console.error('Error loading links:', err)
    } finally {
      setLoading(false)
    }
  }

  // 新增連結
  async function addLink(linkData: Omit<Link, 'id' | 'created_at'>) {
    try {
      const { data, error: insertError } = await supabase
        .from('links')
        .insert([linkData])
        .select()
        .single()

      if (insertError) throw insertError
      
      if (data) {
        setLinks((prev) => [...prev, data].sort((a, b) => a.order - b.order))
      }
      
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add link'
      setError(errorMessage)
      throw err
    }
  }

  // 更新連結
  async function updateLink(id: string, updates: Partial<Link>) {
    try {
      const { data, error: updateError } = await supabase
        .from('links')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError
      
      if (data) {
        setLinks((prev) =>
          prev.map((link) => (link.id === id ? data : link)).sort((a, b) => a.order - b.order)
        )
      }
      
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update link'
      setError(errorMessage)
      throw err
    }
  }

  // 刪除連結
  async function deleteLink(id: string) {
    try {
      const { error: deleteError } = await supabase.from('links').delete().eq('id', id)

      if (deleteError) throw deleteError
      
      setLinks((prev) => prev.filter((link) => link.id !== id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete link'
      setError(errorMessage)
      throw err
    }
  }

  // 更新排序 - 優化為批量更新
  async function updateOrder(linkIds: string[]) {
    try {
      // 先更新本地狀態，提供即時反饋
      setLinks((prev) => {
        const linkMap = new Map(prev.map((link) => [link.id, link]))
        return linkIds.map((id) => linkMap.get(id)!).filter(Boolean)
      })

      // 批量更新數據庫
      const updates = linkIds.map((id, index) => ({
        id,
        order: index,
      }))

      // 使用 Promise.all 並行更新，但限制並發數以避免過載
      const batchSize = 10
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize)
        await Promise.all(
          batch.map((update) =>
            supabase
              .from('links')
              .update({ order: update.order })
              .eq('id', update.id)
          )
        )
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update order'
      setError(errorMessage)
      // 發生錯誤時重新載入以保持同步
      loadLinks()
      throw err
    }
  }

  return {
    links,
    loading,
    error,
    addLink,
    updateLink,
    deleteLink,
    updateOrder,
    refresh: loadLinks,
  }
}
