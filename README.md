# 生日解鎖卡片網站

答題解鎖照片的生日卡片網站，前後端一體，可一鍵本地啟動，並可直接部署到 [Render](https://render.com)。

## 專案結構

```
gooddog/
├── package.json
├── render.yaml           # Render Blueprint 設定
├── server.js             # Express 後端（API + 靜態檔）
├── lib/
│   └── answer.js         # 答案正規化與比對（純文字）
├── data/
│   ├── site-config.json  # 標題、祝福文字
│   └── questions.json    # 題目、提示、對應照片、正確答案（明文）
├── public/
│   ├── index.html
│   ├── css/style.css
│   ├── js/app.js
│   └── photos/           # 照片：photo1.jpg, photo2.jpg ...（請自行放入）
├── .env.example
└── README.md
```

## 本地開發

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定答案

編輯 `data/questions.json`，把每題的 `answer` 欄位改成正確答案（例如 `"答案1"` 改成 `"星巴克"`）。比對時會自動正規化（去空白、全形轉半形、不區分大小寫），無需加密或環境變數。

### 3. 放入照片（可選）

在 `public/photos/` 放入 `photo1.jpg`、`photo2.jpg` … 與 `data/questions.json` 中的 `photo` 欄位對應。未放圖時前端仍可運作，僅顯示預設背景。

### 4. 啟動

```bash
npm run dev
# 或
npm start
```

瀏覽器開啟 `http://localhost:3000`。

---

## 部署到 Render

### 方式一：用 Blueprint（render.yaml）

1. 將專案推上 GitHub（或 GitLab），並確認有 `render.yaml`。
2. 登入 [Render](https://render.com) → **Dashboard** → **New** → **Blueprint**。
3. 連接到你的 repo，Render 會依 `render.yaml` 建立 Web Service。
4. 儲存後會自動建置並部署（答案已在 `data/questions.json`，無需額外環境變數）。

### 方式二：手動建立 Web Service

1. **New** → **Web Service**，連接你的 repo。
2. 設定：
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Node 版本**：建議 18+（可在 **Environment** 加 `NODE_VERSION=18`，或專案根目錄加 `.node-version` / `nvmrc`）
3. 建立並部署。

### 部署後

- 網址為 `https://<你的服務名>.onrender.com`。
- 若為免費方案，冷啟動可能需數十秒，屬正常現象。

---

## API 規格

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET  | `/api/config` | 回傳標題、祝福文字、題目清單（不含答案） |
| POST | `/api/verify` | body: `{ questionId, answer }`，回傳 `{ correct, unlockedUpTo? }` |

解鎖狀態預設由前端用 **localStorage** 記錄；若要改為 **server-side session**，可在 `server.js` 的 `POST /api/verify` 註解處擴充 session 並回傳 `unlockedUpTo`。

---

## 可設定內容

- **標題與祝福**：編輯 `data/site-config.json`。
- **題目、提示、照片檔名、正確答案**：編輯 `data/questions.json`。每題的 `answer` 為正確答案（明文），僅供後端驗證，不會透過 API 傳給前端。

擴充題目時，在 `questions.json` 新增一筆（含 `id`、`question`、`hint`、`photo`、`answer`）即可。

---

## 技術摘要

- **後端**：Node.js 18+、Express，靜態檔來自 `public/`。
- **前端**：純 HTML / CSS / JS，手機優先、繁中。
- **答案**：純文字存於 `data/questions.json`，正規化後比對，無加密。
- **解鎖**：答對第 k 題可看第 k 張照片，狀態存於 localStorage（可擴充為 session）。

祝你有個溫馨的生日解鎖體驗！
