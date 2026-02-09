# 生日解鎖卡片網站

答題解鎖照片的生日卡片網站，前後端一體，可一鍵本地啟動，並可直接部署到 [Render](https://render.com)。

## 專案結構

```
gooddog/
├── package.json
├── render.yaml           # Render Blueprint 設定
├── server.js             # Express 後端（API + 靜態檔）
├── lib/
│   └── answer.js         # 答案正規化與雜湊驗證
├── data/
│   ├── site-config.json  # 標題、祝福文字
│   └── questions.json    # 題目、提示、對應照片、答案雜湊用 env 變數名
├── public/
│   ├── index.html
│   ├── css/style.css
│   ├── js/app.js
│   └── photos/           # 照片：photo1.jpg, photo2.jpg ...（請自行放入）
├── scripts/
│   └── generate-hash.js  # 產生答案雜湊，供環境變數使用
├── .env.example
└── README.md
```

## 本地開發

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定環境變數（答案雜湊）

複製 `.env.example` 為 `.env`，並設定：

- `ANSWER_SALT`：自訂一組隨機字串（例如 `myBirthdaySecret2024`）
- `Q1_HASH` ~ `Q5_HASH`：每題正確答案的雜湊值（見下方「產生答案雜湊」）

### 3. 產生答案雜湊

答案會先**正規化**（trim、全形轉半形、小寫）再與 salt 一起做 SHA256。請用專案內腳本產生與 server 一致的雜湊：

```bash
# Windows (PowerShell)
$env:ANSWER_SALT="your_secret_salt"; node scripts/generate-hash.js "答案1" "答案2" "答案3" "答案4" "答案5"

# macOS / Linux
ANSWER_SALT=your_secret_salt node scripts/generate-hash.js "答案1" "答案2" "答案3" "答案4" "答案5"
```

把輸出的 `Q1_HASH=...`、`Q2_HASH=...` 等貼到 `.env`（或 Render 環境變數）。

### 4. 放入照片（可選）

在 `public/photos/` 放入 `photo1.jpg`、`photo2.jpg` … 與 `data/questions.json` 中的 `photo` 欄位對應。未放圖時前端仍可運作，僅顯示預設背景。

### 5. 啟動

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
4. 在該服務的 **Environment** 新增環境變數（見下方「必設環境變數」）。
5. 儲存後會自動建置並部署。

### 方式二：手動建立 Web Service

1. **New** → **Web Service**，連接你的 repo。
2. 設定：
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Node 版本**：建議 18+（可在 **Environment** 加 `NODE_VERSION=18`，或專案根目錄加 `.node-version` / `nvmrc`）
3. 在 **Environment** 新增下方「必設環境變數」。
4. 建立並部署。

### 必設環境變數（Render）

| 變數名稱     | 說明 |
|-------------|------|
| `ANSWER_SALT` | 自訂隨機字串，與產生雜湊時使用的 salt 相同 |
| `Q1_HASH`     | 第 1 題答案的 SHA256 雜湊（用 `scripts/generate-hash.js` 產生） |
| `Q2_HASH`     | 第 2 題答案雜湊 |
| …            | 依題數設定到 `Q5_HASH` 或更多 |

**不要**把真實答案寫在程式碼或前端，只存雜湊即可。

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
- **題目、提示、照片檔名**：編輯 `data/questions.json`。每題的 `answer_hash_env` 對應環境變數名（如 `Q1_HASH`），需在 Render 與 `.env` 中設定對應雜湊。

擴充題目時，在 `questions.json` 新增一筆，並在環境變數加上對應的 `Q6_HASH`、`Q7_HASH` 等即可。

---

## 技術摘要

- **後端**：Node.js 18+、Express，靜態檔來自 `public/`。
- **前端**：純 HTML / CSS / JS，手機優先、繁中。
- **安全**：答案僅以 SHA256(salt + 正規化答案) 存於環境變數，驗證在後端完成。
- **解鎖**：答對第 k 題可看第 k 張照片，狀態存於 localStorage（可擴充為 session）。

祝你有個溫馨的生日解鎖體驗！
