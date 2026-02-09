/**
 * 生日解鎖卡片 - Express 後端
 * 提供靜態檔、/api/config、/api/verify，可部署至 Render
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const { verify } = require('./lib/answer');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');

app.use(express.json());
app.use(express.static(PUBLIC_DIR));

// 讀取 JSON 設定（啟動時載入，可改為即時讀取以支援熱更新）
function loadJSON(filename) {
  const filepath = path.join(DATA_DIR, filename);
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
  } catch (e) {
    console.warn('loadJSON failed:', filepath, e.message);
    return null;
  }
}

/**
 * GET /api/config
 * 回傳標題、祝福文字、題目清單（不含答案與 answer_hash_env）
 */
app.get('/api/config', (req, res) => {
  const siteConfig = loadJSON('site-config.json') || {
    title: 'Happy Birthday',
    blessing: '祝你生日快樂，願這份小驚喜帶給你笑容。',
  };
  const questions = loadJSON('questions.json') || [];
  const safeQuestions = questions.map(({ id, question, hint, photo }) => ({
    id,
    question,
    hint,
    photo,
  }));
  res.json({
    title: siteConfig.title,
    blessing: siteConfig.blessing,
    questions: safeQuestions,
  });
});

/**
 * POST /api/verify
 * body: { questionId: number, answer: string }
 * 回傳: { correct: boolean, unlockedUpTo?: number }
 *
 * 解鎖狀態預設由前端 localStorage 維護；
 * 若改為 server-side session，可在此根據 session 計算 unlockedUpTo 並回傳。
 */
app.post('/api/verify', (req, res) => {
  const { questionId, answer } = req.body || {};
  const questions = loadJSON('questions.json') || [];
  const q = questions.find((item) => item.id === Number(questionId));
  if (!q || !q.answer_hash_env) {
    return res.status(400).json({ correct: false });
  }

  const correct = verify(answer, q.answer_hash_env);

  // 擴充點：若使用 server-side session，可在此更新 session 的已解鎖題目，
  // 並計算 unlockedUpTo（例如已解鎖題目的最大 id）一併回傳。
  // const unlockedUpTo = getUnlockedUpToFromSession(req);

  if (correct) {
    const unlockedUpTo = q.id; // 目前解鎖到這一題的 id
    return res.json({ correct: true, unlockedUpTo });
  }
  res.json({ correct: false });
});

// SPA 友善：非 API 且非靜態檔時回傳 index.html（可選）
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  const filepath = path.join(PUBLIC_DIR, req.path);
  if (fs.existsSync(filepath) && fs.statSync(filepath).isFile()) return next();
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Birthday Unlock Card running at http://localhost:${PORT}`);
});
