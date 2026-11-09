# MyToDoList - 多人即時協作待辦清單

一個專為團隊與多人協同作業打造的現代化待辦清單（To-Do List）網頁應用程式，原生支援 **Google 帳號快速登入** 與基於 **Firebase Firestore** 的即時雙向資料同步。

已預先設定連接至現有的 Firebase 專案：**`my-to-do-list-aab19`**。

---

## ✨ 核心特色

1. **Google 帳號登入 (Google Sign-In)**：
   - 採用 Firebase Authentication，一鍵使用 Google 帳號安全登入，支援自動保持登入狀態。
2. **多人即時協作 (Real-Time Multi-user Sync)**：
   - 任何協作成員新增任務、切換勾選完成、修改內容或指派成員，所有人螢幕上毫秒級即時更新，無需手動重新整理頁面。
3. **靈活的清單共享方式**：
   - **專屬 6 碼分享碼**：每份清單自動生成專屬分享代碼（如 `8K3M9A`），夥伴直接輸入代碼即可加入。
   - **Email 邀請**：直接輸入夥伴的 Google Email 邀請加入。
4. **任務成員指派與追蹤**：
   - 可為每項待辦指派具體負責人，清楚標示「由誰建立」及「已由誰完成」。
5. **分類與優先級管理**：
   - 支援「🔥 高優先」、「⚡ 中優先」、「🌿 低優先」及截止日期設定。
   - 提供「全部」、「進行中」、「已完成」狀態篩選，以及「只看我的任務」與即時搜尋功能。
6. **即時完成度統計**：
   - 視覺化進度條與任務完成百分比統計。
7. **免打包工具、即開即用**：
   - 純原生 ES Modules + Tailwind CSS，不需安裝複雜的 Node.js/Webpack/Vite，透過標準瀏覽器即可直接執行！

---

## 🚀 快速啟動

在終端機中切換至此資料夾，並執行啟動腳本：

```bash
cd /Users/irischao/.gemini/antigravity/scratch/MyToDoList
./start.sh
```

或者使用 Python 直接啟動：

```bash
python3 start.py
```

瀏覽器將會自動開啟 `http://localhost:5173`。

---

## ⚙️ Firebase 專案設定指引 (`my-to-do-list-aab19`)

本應用程式已預設指向您的專案 `my-to-do-list-aab19`，初次使用請在 [Firebase 控制台 (Firebase Console)](https://console.firebase.google.com/project/my-to-do-list-aab19) 完成以下幾項設定：

### 步驟 1：啟用 Google 登入驗證
1. 前往 **Firebase Console** -> **建構 (Build)** -> **Authentication**。
2. 點擊 **Sign-in method** 頁籤，新增提供者選擇 **Google**。
3. 勾選 **啟用**，選擇您的專案支援電子郵件後儲存。
4. 點擊 **設定 (Settings)** 頁籤 -> **已授權網域 (Authorized domains)**，確認已有 `localhost`（通常預設已包含）。

### 步驟 2：啟用 Cloud Firestore 資料庫
1. 前往 **建構 (Build)** -> **Firestore Database**。
2. 點擊 **建立資料庫 (Create database)**，選擇地區（例如 `asia-east1` 台灣或最近節點）。
3. 切換至 **規則 (Rules)** 頁籤，將本專案內的 `firestore.rules` 內容複製貼上並點擊 **發布 (Publish)**。

### 步驟 3：填入 Web API Key
1. 前往 **專案設定 (Project settings)**（右上角齒輪圖示）-> **一般 (General)**。
2. 滾動至下方 **您的應用程式 (Your apps)**，若尚未建立 Web 應用程式，請點擊 `</>` (網頁) 圖示並隨意命名註冊。
3. 複製配置代碼中的 `apiKey` 與 `appId`：
   - **方式 A (介面直接設定)**：開啟網頁應用程式後，點擊右上角「⚙️」設定圖示，直接將 API Key 與 App ID 貼上儲存即可！
   - **方式 B (修改設定檔)**：編輯 `js/firebase-config.js`，將 `YOUR_FIREBASE_API_KEY` 替換為您的 Web API Key。

---

## 📁 專案檔案結構

```
MyToDoList/
├── index.html                 # 應用程式主介面 (包含 Landing 頁面、協作儀表板與 Modals)
├── css/
│   └── style.css              # 自定義樣式、進度動畫與頭像堆疊效果
├── js/
│   ├── firebase-config.js     # Firebase 專案設定與 LocalStorage 快取邏輯
│   ├── auth.js                # Google 登入、登出與登入狀態即時監聽
│   ├── db.js                  # Firestore 即時同步、清單與任務 CRUD、成員管理
│   └── app.js                 # 介面互動邏輯、篩選搜尋、Toast 提示與 Modals
├── firestore.rules            # Firestore 資料庫安全規則
├── firebase.json              # Firebase Hosting 部署設定檔
├── start.py                   # 內建 Python 本地開發伺服器 (包含 CORS & COOP 設定)
├── start.sh                   # 快速啟動 Shell 腳本
└── README.md                  # 專案說明文檔
```

---

## 🌐 部署至 Firebase Hosting (可選)

若未來您希望將應用程式免費部署至公開網址供團隊全天候使用：

```bash
# 1. 安裝 Firebase CLI (若尚未安裝)
npm install -g firebase-tools

# 2. 登入 Firebase
firebase login

# 3. 部署
firebase deploy --only hosting
```

部署完成後即可透過 `https://my-to-do-list-aab19.web.app` 全球訪問！
