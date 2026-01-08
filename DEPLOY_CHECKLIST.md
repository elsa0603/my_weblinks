# GitHub Pages 部署檢查清單

## ✅ 部署前檢查

### 1. 本地配置檢查

- [ ] `vite.config.ts` 中的 `base` 路徑已設置為 `/my_weblinks/`（或您的 repository 名稱）
- [ ] 本地可以成功執行 `npm run build`
- [ ] 本地可以成功執行 `npm run dev` 並正常運行

### 2. GitHub Repository 設置

- [ ] Repository 已創建
- [ ] 程式碼已推送到 GitHub
- [ ] Repository 設置 > Pages > Source 選擇 **GitHub Actions**

### 3. GitHub Secrets 設置

前往 **Settings** > **Secrets and variables** > **Actions**，確認已設置：

- [ ] `VITE_SUPABASE_URL` - Supabase 專案 URL
- [ ] `VITE_SUPABASE_ANON_KEY` - Supabase Anon/Public Key

### 4. Supabase 設置

- [ ] Supabase 資料表已創建（參考 `README.md` 或 `SUPABASE_SETUP.md`）
- [ ] Row Level Security (RLS) 已正確設置
- [ ] 測試連線正常

## 🚀 部署步驟

1. [ ] 推送程式碼到 `main` 分支
2. [ ] 前往 **Actions** 標籤頁查看部署進度
3. [ ] 等待部署完成（通常 2-5 分鐘）
4. [ ] 訪問 `https://[您的用戶名].github.io/my_weblinks/` 確認網站正常運行

## 🔍 部署後驗證

- [ ] 網站可以正常訪問
- [ ] 可以新增連結
- [ ] 可以查看連結列表
- [ ] 分類功能正常
- [ ] 拖放排序功能正常
- [ ] 刪除功能正常
- [ ] 響應式設計在手機/平板/桌面都正常

## ❌ 常見問題

### 問題：部署失敗，顯示 "Missing environment variables"

**解決方案：**
- 檢查 GitHub Secrets 是否正確設置
- 確認 Secret 名稱完全正確（區分大小寫）

### 問題：網站顯示 404 錯誤

**解決方案：**
- 檢查 `vite.config.ts` 中的 `base` 路徑是否與 repository 名稱一致
- 確認 GitHub Pages 已啟用並選擇 **GitHub Actions** 作為來源

### 問題：網站可以訪問但功能不正常

**解決方案：**
- 檢查瀏覽器控制台是否有錯誤
- 確認 Supabase 連線正常
- 檢查 Supabase RLS 政策是否正確設置

### 問題：圖片無法顯示

**解決方案：**
- 某些網站可能因為 CORS 政策無法獲取縮圖，這是正常現象
- 系統會自動使用 favicon 作為後備方案

## 📝 備註

- 首次部署可能需要較長時間
- 每次推送到 `main` 分支都會自動觸發重新部署
- 可以在 **Actions** 標籤頁中查看部署歷史和日誌
