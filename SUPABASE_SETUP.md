# Supabase 設置指南

## 步驟 1: 建立資料表

在 Supabase Dashboard 的 SQL Editor 中執行以下 SQL：

```sql
-- 建立 links 資料表
CREATE TABLE links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  thumbnail TEXT,
  category TEXT NOT NULL,
  color TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  type TEXT NOT NULL CHECK (type IN ('website', 'youtube'))
);

-- 設置 Row Level Security (RLS)
ALTER TABLE links ENABLE ROW LEVEL SECURITY;

-- 允許所有操作（因為無身份驗證）
CREATE POLICY "Allow all operations" ON links
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 建立索引以提升查詢效能
CREATE INDEX idx_links_order ON links("order");
CREATE INDEX idx_links_category ON links(category);
```

## 步驟 2: 取得 API 憑證

1. 前往 [Supabase Dashboard](https://app.supabase.com/)
2. 選擇您的專案（或建立新專案）
3. 進入 **Settings** > **API**
4. 複製以下資訊：
   - **Project URL** → 這將是 `VITE_SUPABASE_URL`
   - **anon/public key** → 這將是 `VITE_SUPABASE_ANON_KEY`

## 步驟 3: 設置環境變數

在專案根目錄建立 `.env.local` 檔案：

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**重要**：`.env.local` 檔案已加入 `.gitignore`，不會被提交到 Git。

## 步驟 4: 驗證設置

執行以下命令啟動開發伺服器：

```bash
npm run dev
```

如果設置正確，應用程式應該可以正常運作。如果出現 Supabase 相關錯誤，請檢查：

1. 環境變數是否正確設置
2. Supabase 專案是否正常運作
3. 資料表是否已建立
4. RLS 政策是否正確設置

## 疑難排解

### 錯誤：Missing Supabase environment variables

- 確認 `.env.local` 檔案存在且包含正確的環境變數
- 確認環境變數名稱正確（`VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`）
- 重新啟動開發伺服器

### 錯誤：Failed to load links

- 確認資料表已建立
- 確認 RLS 政策已設置為允許所有操作
- 檢查 Supabase Dashboard 的 Logs 查看詳細錯誤訊息

### 錯誤：CORS 問題

- Supabase 預設允許所有來源，如果遇到 CORS 問題，請檢查 Supabase 專案設置
