import { useState, useMemo, useCallback } from 'react'
import { fetchThumbnailAndTitle } from '../utils/thumbnail'
import { isValidUrl } from '../utils/validation'
import './LinkForm.css'

interface CategoryInfo {
  name: string
  color: string
}

interface LinkFormProps {
  onSubmit: (data: {
    url: string
    title: string
    thumbnail: string | null
    category: string
    color: string
    type: 'website' | 'youtube'
    order: number
  }) => Promise<void>
  categories: CategoryInfo[]
  defaultColor: string
  maxOrder: number
}

export function LinkForm({ onSubmit, categories, defaultColor, maxOrder }: LinkFormProps) {
  const [url, setUrl] = useState('')
  const [category, setCategory] = useState(categories[0]?.name || '未分類')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // 根據選擇的分類獲取對應的顏色，使用 useMemo 優化
  const categoryColor = useMemo(() => {
    const found = categories.find((cat) => cat.name === category)
    return found ? found.color : defaultColor
  }, [category, categories, defaultColor])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!url.trim()) {
      setError('請輸入網址')
      return
    }

    if (!isValidUrl(url)) {
      setError('請輸入有效的網址')
      return
    }

    try {
      setLoading(true)
      const { thumbnail, title, type } = await fetchThumbnailAndTitle(url)
      
      await onSubmit({
        url: url.trim(),
        title,
        thumbnail,
        category,
        color: categoryColor,
        type,
        order: maxOrder + 1,
      })

      // 重置表單
      setUrl('')
      setCategory(categories[0]?.name || '未分類')
    } catch (err) {
      setError(err instanceof Error ? err.message : '新增連結失敗')
    } finally {
      setLoading(false)
    }
  }, [url, category, categoryColor, maxOrder, categories, onSubmit])

  return (
    <form className="link-form" onSubmit={handleSubmit}>
      <div className="link-form-row">
        <input
          type="url"
          className="link-form-input"
          placeholder="輸入網站或 YouTube 網址..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
        />
        <select
          className="link-form-select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={loading}
        >
          {categories.map((cat) => (
            <option key={cat.name} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>
        <button type="submit" className="link-form-submit" disabled={loading}>
          {loading ? '處理中...' : '新增'}
        </button>
      </div>

      {error && <div className="link-form-error">{error}</div>}
    </form>
  )
}
