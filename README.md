# 奈美聊天 - Nami Chat

🌟 **中英文口語練習APP** - 讓您輕鬆提升英語對話能力

## ✨ 功能特色

### 🤖 AI平台整合
- **DeepSeek** - 高性價比AI模型
- **Gemini** - Google先進AI
- **ChatGPT** - OpenAI經典模型  
- **Grok** - X平台AI助手

### 🎯 核心功能
- **奈美說說** - 隨機英語聊天話題，提升聽力理解
- **口語練習** - 中文輸入→英文翻譯→發音評分
- **難度選擇** - 簡單/中等/高級三種級別
- **發音評分** - 專業語音評估與改進建議

### 🎨 設計特色
- **法式高級UI** - 優雅配色與現代設計
- **響應式佈局** - 完美適配各種螢幕尺寸
- **PWA支援** - 可安裝的網頁應用
- **奈美角色** - 友善的日本女孩AI助手

## 🚀 快速開始

### 本地開發
```bash
# 安裝依賴
npm install

# 啟動開發服務器
npm run dev

# 打開瀏覽器訪問
http://localhost:3000
```

### 建置部署
```bash
# 建置生產版本
npm run build

# 啟動生產服務器
npm start
```

## 📱 使用指南

### 1. 設置AI平台
1. 選擇您喜歡的AI平台
2. 點擊「獲取API Key」前往官方網站申請
3. 輸入API Key並驗證

### 2. 奈美說說
1. 選擇難度級別
2. 點擊「開始聊天」
3. 聽取AI生成的英語對話內容
4. 可隨時暫停或停止

### 3. 口語練習
1. 點擊「開始練習」
2. 系統生成練習句子並播放
3. 用中文說出您的表達
4. AI翻譯成英文並提供例句
5. 跟讀練習並獲得發音評分

## 🔧 技術架構

### 前端技術
- **Next.js 14** - React全端框架
- **TypeScript** - 類型安全
- **Tailwind CSS** - 現代CSS框架
- **shadcn/ui** - 高品質UI組件

### 語音技術
- **Web Speech API** - 瀏覽器原生語音功能
- **語音識別** - 中文/英文語音轉文字
- **語音合成** - 文字轉語音播放
- **發音評分** - 模擬評分系統

### 狀態管理
- **Zustand** - 輕量級狀態管理
- **本地存儲** - API Key和會話記錄

## 🌐 部署

### Netlify部署 (推薦)
1. 將代碼推送到GitHub
2. 連接Netlify帳戶
3. 選擇GitHub倉庫
4. 設置建置命令：`npm run build`
5. 設置發布目錄：`out`
6. 部署完成！

### 其他平台
- **Vercel** - 一鍵部署
- **GitHub Pages** - 靜態網站
- **自建服務器** - Docker容器

## 📋 系統需求

### 瀏覽器支援
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### 設備要求
- 麥克風權限 (語音識別)
- 網路連接 (AI API調用)
- 現代瀏覽器 (PWA支援)

## 🔒 隱私安全

- API Key本地存儲，不上傳服務器
- 語音數據即時處理，不保存記錄
- 支援HTTPS加密傳輸
- 用戶數據完全本地化

## 🤝 貢獻指南

1. Fork 專案
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📄 授權

本專案採用 MIT 授權條款 - 查看 [LICENSE](LICENSE) 檔案了解詳情

## 🙏 致謝

- [Next.js](https://nextjs.org/) - 全端React框架
- [Tailwind CSS](https://tailwindcss.com/) - 實用CSS框架
- [shadcn/ui](https://ui.shadcn.com/) - 美觀UI組件
- [Lucide Icons](https://lucide.dev/) - 精美圖標庫

---

**🌸 奈美聊天 - 讓英語學習更自然、更有趣！**
