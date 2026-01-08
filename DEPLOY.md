# GitHub Pages 部署指南

本專案已配置好自動部署到 GitHub Pages 的流程。

## 快速開始

### 1. 設置 GitHub Secrets

在 GitHub Repository 中設置以下 Secrets：

1. 前往 **Settings** > **Secrets and variables** > **Actions**
2. 點擊 **New repository secret**
3. 新增以下兩個 secrets：

| Secret 名稱 | 說明 | 範例 |
|------------|------|------|
| `VITE_SUPABASE_URL` | Supabase 專案 URL | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase Anon/Public Key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

### 2. 啟用 GitHub Pages

1. 前往 **Settings** > **Pages**
2. 在 **Source** 區塊選擇 **GitHub Actions**
3. 保存設置

### 3. 推送程式碼

```bash
git add .
git commit -m "部署到 GitHub Pages"
git push origin main
```

### 4. 查看部署狀態

1. 前往 **Actions** 標籤頁
2. 查看部署進度
3. 部署完成後，網站將在以下網址可用：
   ```
   https://[您的用戶名].github.io/my_weblinks/
   ```

## 配置說明

### Repository 名稱與 base 路徑

如果您的 repository 名稱不是 `my_weblinks`，請修改 `vite.config.ts`：

```typescript
export default defineConfig({
  plugins: [react()],
  base: '/[您的 repository 名稱]/', // 修改這裡
})
```

例如，如果 repository 名稱是 `my-bookmarks`，則設置為：
```typescript
base: '/my-bookmarks/',
```

### 自訂域名（選用）

如果您有自訂域名，可以：

1. 在 Repository **Settings** > **Pages** > **Custom domain** 中設置
2. 在域名 DNS 設置中添加 CNAME 記錄指向 `[您的用戶名].github.io`

## 故障排除

### 部署失敗

1. 檢查 GitHub Secrets 是否正確設置
2. 檢查 `vite.config.ts` 中的 `base` 路徑是否正確
3. 查看 **Actions** 標籤頁中的錯誤訊息

### 網站無法訪問

1. 確認 GitHub Pages 已啟用
2. 檢查網址是否正確（包含 repository 名稱）
3. 等待幾分鐘讓 DNS 更新

### 環境變數未生效

- 確保 Secrets 名稱完全正確（區分大小寫）
- 確保在 GitHub Actions 中設置，而不是在本地 `.env` 文件

## 手動觸發部署

如果需要手動觸發部署：

1. 前往 **Actions** 標籤頁
2. 選擇 **Deploy to GitHub Pages** workflow
3. 點擊 **Run workflow**
4. 選擇分支（通常是 `main`）
5. 點擊 **Run workflow** 按鈕

## 相關文件

- [GitHub Pages 官方文檔](https://docs.github.com/en/pages)
- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html#github-pages)
