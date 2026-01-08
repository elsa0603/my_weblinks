import { isValidUrl, isYouTubeUrl, extractYouTubeId, getYouTubeThumbnail } from './validation'

export interface ThumbnailData {
  thumbnail: string | null
  title: string
  type: 'website' | 'youtube'
}

/**
 * 從網站獲取 Open Graph 圖片和標題
 */
async function fetchWebsiteMetadata(url: string): Promise<{ thumbnail: string | null; title: string }> {
  const domain = (() => {
    try {
      return new URL(url).hostname
    } catch {
      return url
    }
  })()

  // 嘗試多個 CORS proxy，添加超時控制
  const proxies = [
    `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
  ]

  // 創建帶超時的 fetch 函數
  const fetchWithTimeout = async (url: string, timeout = 5000): Promise<Response> => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  for (const proxyUrl of proxies) {
    try {
      const response = await fetchWithTimeout(proxyUrl, 5000)
      
      let htmlContent: string
      if (proxyUrl.includes('allorigins.win')) {
        const data = await response.json()
        if (!data.contents) continue
        htmlContent = data.contents
      } else {
        htmlContent = await response.text()
      }
      
      if (!htmlContent || htmlContent.length < 100) continue
      
      const parser = new DOMParser()
      const doc = parser.parseFromString(htmlContent, 'text/html')
      
      // 多種方式獲取標題（按優先順序）
      const titleSources = [
        doc.querySelector('meta[property="og:title"]')?.getAttribute('content'),
        doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content'),
        doc.querySelector('title')?.textContent?.trim(),
        doc.querySelector('h1')?.textContent?.trim(),
        doc.querySelector('meta[name="title"]')?.getAttribute('content'),
      ]
      
      const title = titleSources.find(t => t && t.length > 0) || domain.replace('www.', '')
      
      // 獲取縮圖（多種方式）
      const thumbnailSources = [
        doc.querySelector('meta[property="og:image"]')?.getAttribute('content'),
        doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content'),
        doc.querySelector('meta[name="twitter:image:src"]')?.getAttribute('content'),
        doc.querySelector('link[rel="image_src"]')?.getAttribute('href'),
      ]
      
      const thumbnail = thumbnailSources.find(t => t && t.startsWith('http')) || null
      
      return { thumbnail, title: title.trim() }
    } catch (error) {
      console.error('Error with proxy:', proxyUrl, error)
      continue
    }
  }
  
  // 所有 proxy 都失敗，使用後備方案
  return {
    thumbnail: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    title: domain.replace('www.', ''),
  }
}

/**
 * 獲取 YouTube 影片標題和縮圖
 */
async function fetchYouTubeMetadata(url: string): Promise<{ thumbnail: string | null; title: string }> {
  const videoId = extractYouTubeId(url)
  
  if (!videoId) {
    throw new Error('Invalid YouTube URL')
  }
  
  // 方法1: 使用 YouTube oEmbed API，添加超時
  try {
    const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    const response = await fetch(oEmbedUrl, { signal: controller.signal })
    clearTimeout(timeoutId)
    
    if (response.ok) {
      const data = await response.json()
      if (data.title && data.title.trim()) {
        return {
          thumbnail: getYouTubeThumbnail(videoId),
          title: data.title.trim(),
        }
      }
    }
  } catch (error) {
    console.error('Error with oEmbed API:', error)
  }
  
  // 方法2: 嘗試從頁面獲取（使用 CORS proxy），添加超時
  try {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    const response = await fetch(proxyUrl, { signal: controller.signal })
    clearTimeout(timeoutId)
    const data = await response.json()
    
    if (data.contents) {
      const parser = new DOMParser()
      const doc = parser.parseFromString(data.contents, 'text/html')
      const title = doc.querySelector('title')?.textContent
      
      if (title && !title.includes('YouTube')) {
        // 移除 " - YouTube" 後綴
        const cleanTitle = title.replace(/\s*-\s*YouTube\s*$/, '').trim()
        if (cleanTitle) {
          return {
            thumbnail: getYouTubeThumbnail(videoId),
            title: cleanTitle,
          }
        }
      }
    }
  } catch (error) {
    console.error('Error fetching YouTube page:', error)
  }
  
  // 後備方案
  return {
    thumbnail: getYouTubeThumbnail(videoId),
    title: `YouTube Video ${videoId}`,
  }
}

/**
 * 獲取 URL 的縮圖和標題
 */
export async function fetchThumbnailAndTitle(url: string): Promise<ThumbnailData> {
  if (!isValidUrl(url)) {
    throw new Error('Invalid URL')
  }
  
  if (isYouTubeUrl(url)) {
    const { thumbnail, title } = await fetchYouTubeMetadata(url)
    return {
      thumbnail,
      title: title, // 保存完整標題
      type: 'youtube',
    }
  } else {
    const { thumbnail, title } = await fetchWebsiteMetadata(url)
    return {
      thumbnail,
      title: title, // 保存完整標題
      type: 'website',
    }
  }
}
