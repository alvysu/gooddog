/**
 * 答案正規化與雜湊驗證
 * 正確答案僅以雜湊存於環境變數，不寫死在前端或程式碼
 */

const crypto = require('crypto');

const SALT_ENV = 'ANSWER_SALT';

/**
 * 正規化使用者輸入：trim、全形轉半形、統一小寫（可依需求改為不區分大小寫）
 * @param {string} input
 * @returns {string}
 */
function normalize(input) {
  if (typeof input !== 'string') return '';
  let s = input.trim();
  // 全形英數 -> 半形
  s = s.replace(/[\uff01-\uff5e]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
  );
  s = s.replace(/\u3000/g, ' '); // 全形空白
  return s.toLowerCase();
}

/**
 * 計算答案雜湊：sha256(normalizedAnswer + salt)
 * @param {string} normalizedAnswer
 * @param {string} salt
 * @returns {string} hex
 */
function hashAnswer(normalizedAnswer, salt) {
  return crypto
    .createHash('sha256')
    .update(normalizedAnswer + salt, 'utf8')
    .digest('hex');
}

/**
 * 驗證答案是否與環境變數中的雜湊一致
 * @param {string} userAnswer 使用者輸入
 * @param {string} expectedHashEnv 存放正確雜湊的環境變數名，例如 'Q1_HASH'
 * @returns {boolean}
 */
function verify(userAnswer, expectedHashEnv) {
  const salt = process.env[SALT_ENV];
  const expectedHash = process.env[expectedHashEnv];
  if (!salt || !expectedHash) return false;
  const normalized = normalize(userAnswer);
  const hash = hashAnswer(normalized, salt);
  return hash === expectedHash.toLowerCase();
}

module.exports = { normalize, hashAnswer, verify, SALT_ENV };
