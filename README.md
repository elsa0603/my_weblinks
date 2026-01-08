# 網站收藏管理系統

一個使用 React + Supabase 建立的網站收藏管理系統，支援分類、拖放排序、縮圖顯示，並可部署到 GitHub Pages。

## 功能特色

- 📌 收藏網站或 YouTube 影片網址
- 🎨 自訂分類，不同類別以顏色區分
- 📱 響應式設計 (RWD)，支援各種裝置
- 🖼️ 自動獲取網站縮圖與標題（前10個字）
- 🔄 拖放排序功能
- 🗑️ 刪除連結功能
- 💾 資料儲存於 Supabase

## 技術棧

- **前端框架**: React 19 + TypeScript
- **建置工具**: Vite
- **後端服務**: Supabase
- **拖放功能**: @dnd-kit
- **部署**: GitHub Pages

## 設置步驟

### 1. 安裝依賴

```bash
npm install
```

### 2. Supabase 設置

#### 2.1 建立資料表

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

#### 2.2 取得 Supabase 憑證

1. 前往 [Supabase Dashboard](https://app.supabase.com/)
2. 選擇您的專案
3. 進入 Settings > API
4. 複製以下資訊：
   - Project URL → `VITE_SUPABASE_URL`
   - anon/public key → `VITE_SUPABASE_ANON_KEY`

#### 2.3 設置環境變數

複製 `.env.example` 為 `.env.local`：

```bash
cp .env.example .env.local
```

編輯 `.env.local`，填入您的 Supabase 憑證：

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. 本地開發

```bash
npm run dev
```

應用程式將在 `http://localhost:5173` 啟動。

### 4. 建置專案

```bash
npm run build
```

建置後的檔案將位於 `dist` 目錄。

## 部署到 GitHub Pages

### 使用 GitHub Actions（推薦）

專案已配置好 GitHub Actions 自動部署流程。

#### 步驟 1：設置 GitHub Secrets

1. 前往您的 GitHub Repository
2. 點擊 **Settings** > **Secrets and variables** > **Actions**
3. 點擊 **New repository secret**，新增以下兩個 secrets：
   - **Name**: `VITE_SUPABASE_URL`
     **Value**: 您的 Supabase Project URL（例如：`https://xxxxx.supabase.co`）
   
   - **Name**: `VITE_SUPABASE_ANON_KEY`
     **Value**: 您的 Supabase Anon/Public Key

#### 步驟 2：啟用 GitHub Pages

1. 前往 Repository **Settings** > **Pages**
2. 在 **Source** 區塊：
   - 選擇 **GitHub Actions** 作為來源
3. 保存設置

#### 步驟 3：推送程式碼

1. 將程式碼推送到 `main` 分支：

```bash
git add .
git commit -m "準備部署到 GitHub Pages"
git push origin main
```

2. GitHub Actions 會自動觸發部署流程
3. 前往 **Actions** 標籤頁查看部署進度
4. 部署完成後，您的網站將在以下網址可用：
   ```
   https://[您的用戶名].github.io/my_weblinks/
   ```

#### 注意事項

- 確保 `vite.config.ts` 中的 `base` 設定為 `/my_weblinks/`（與您的 repository 名稱一致）
- 如果您的 repository 名稱不同，請修改 `vite.config.ts` 中的 `base` 值
- 首次部署可能需要幾分鐘時間
- 之後每次推送到 `main` 分支都會自動重新部署

## 專案結構

```
my_weblinks/
├── public/              # 靜態資源
├── src/
│   ├── components/      # React 組件
│   │   ├── LinkCard.tsx
│   │   ├── LinkForm.tsx
│   │   ├── CategoryManager.tsx
│   │   ├── LinkGrid.tsx
│   │   └── ColorPicker.tsx
│   ├── hooks/          # 自訂 Hooks
│   │   └── useLinks.ts
│   ├── utils/          # 工具函數
│   │   ├── supabase.ts
│   │   ├── thumbnail.ts
│   │   └── validation.ts
│   ├── App.tsx         # 主應用組件
│   └── main.tsx        # 入口文件
├── .env.example        # 環境變數範例
├── vite.config.ts      # Vite 配置
└── README.md           # 說明文件
```

## 使用說明

1. **新增連結**：在上方表單輸入網站或 YouTube 網址，選擇分類和顏色，點擊「新增」
2. **管理分類**：在「分類管理」區塊新增、編輯或刪除分類
3. **排序連結**：直接拖動連結卡片來改變順序
4. **刪除連結**：點擊卡片右上角的 × 按鈕

## 注意事項

- 縮圖獲取使用第三方服務，某些網站可能無法獲取縮圖
- YouTube 影片會自動識別並使用 YouTube 縮圖
- 分類資料儲存在瀏覽器的 localStorage
- 連結資料儲存在 Supabase 資料庫

## 授權

MIT License
