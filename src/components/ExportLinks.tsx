import { useState } from 'react'
import type { Link } from '../utils/supabase'
import './ExportLinks.css'

interface ExportLinksProps {
  links: Link[]
  categories: string[]
}

export function ExportLinks({ links, categories }: ExportLinksProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [customTitle, setCustomTitle] = useState<string>('')

  const handleExport = () => {
    if (!selectedCategory) {
      alert('請選擇要匯出的分類')
      return
    }

    // 篩選出指定分類的連結
    const categoryLinks = links
      .filter((link) => link.category === selectedCategory)
      .sort((a, b) => a.order - b.order)

    if (categoryLinks.length === 0) {
      alert('該分類沒有連結可匯出')
      return
    }

    const title = customTitle.trim() || selectedCategory
    generateHTML(title, categoryLinks)
  }

  const generateHTML = (title: string, categoryLinks: Link[]) => {
    const dateString = new Date().toISOString().split('T')[0]

    // 生成連結列表 HTML
    const linksHTML = categoryLinks
      .map((link, index) => {
        const thumbnailImg = link.thumbnail 
          ? `<img src="${escapeHtml(link.thumbnail)}" alt="${escapeHtml(link.title)}" class="thumbnail" />`
          : '<div class="thumbnail placeholder">無縮圖</div>'
        
        return `
      <div class="link-item">
        <div class="link-number">${index + 1}</div>
        <div class="link-thumbnail">${thumbnailImg}</div>
        <div class="link-content">
          <div class="link-title">${escapeHtml(link.title)}</div>
          <div class="link-url"><a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.url)}</a></div>
        </div>
      </div>
    `
      })
      .join('')

    // 完整的 HTML 內容
    const htmlContent = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, "Microsoft JhengHei", "微軟正黑體", sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      padding: 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    h1 {
      color: #000;
      margin-bottom: 20px;
      font-size: 28px;
      border-bottom: 3px solid #4ECDC4;
      padding-bottom: 10px;
    }
    .export-info {
      color: #666;
      font-size: 14px;
      margin-bottom: 30px;
      padding: 15px;
      background: #f9f9f9;
      border-radius: 5px;
    }
    .export-info div {
      margin-bottom: 5px;
    }
    hr {
      border: none;
      border-top: 2px solid #ddd;
      margin: 30px 0;
    }
    .link-item {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
      padding: 15px;
      background: #fafafa;
      border-radius: 5px;
      border-left: 4px solid #4ECDC4;
      gap: 15px;
    }
    .link-number {
      font-size: 18px;
      font-weight: bold;
      color: #4ECDC4;
      min-width: 30px;
      text-align: center;
    }
    .link-thumbnail {
      flex-shrink: 0;
    }
    .thumbnail {
      width: 60px;
      height: 60px;
      object-fit: cover;
      border-radius: 4px;
      display: block;
    }
    .thumbnail.placeholder {
      width: 60px;
      height: 60px;
      background: #e0e0e0;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: #999;
    }
    .link-content {
      flex: 1;
      min-width: 0;
    }
    .link-title {
      font-size: 16px;
      font-weight: bold;
      color: #000;
      margin-bottom: 5px;
      word-break: break-word;
    }
    .link-url {
      font-size: 12px;
    }
    .link-url a {
      color: #0066cc;
      text-decoration: underline;
      word-break: break-all;
    }
    .link-url a:hover {
      color: #004499;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${escapeHtml(title)}</h1>
    <div class="export-info">
      <div><strong>共 ${categoryLinks.length} 個連結</strong></div>
    </div>
    <hr>
    ${linksHTML}
  </div>
</body>
</html>`

    // 下載 HTML 檔案
    // 清理檔名，移除不允許的字符
    const sanitizedTitle = title.replace(/[<>:"/\\|?*]/g, '_').trim() || dateString
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${sanitizedTitle}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const escapeHtml = (text: string): string => {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  return (
    <div className="export-links">
      <h2 className="export-links-title">匯出連結</h2>
      <div className="export-links-controls">
        <select
          className="export-links-select"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">選擇分類</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat} ({links.filter((l) => l.category === cat).length} 個連結)
            </option>
          ))}
        </select>
        <input
          type="text"
          className="export-links-title-input"
          placeholder="自訂 HTML 標題（選填）"
          value={customTitle}
          onChange={(e) => setCustomTitle(e.target.value)}
        />
        <button
          className="export-links-button"
          onClick={handleExport}
          disabled={!selectedCategory}
        >
          📥 匯出為 HTML
        </button>
      </div>
    </div>
  )
}
