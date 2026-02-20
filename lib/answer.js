/**
 * 答案正規化與比對（純文字，無加密）
 * 正規化：trim -> fullwidthToHalfwidth -> toLowerCase -> removeSpaces
 */

/**
 * 正規化使用者輸入
 * - trim 前後空白
 * - 全形英數、標點轉半形
 * - 轉小寫（不區分大小寫）
 * - 移除所有空白字元（方便 2025/10/21 與 2025-10-21 等格式都能比對）
 * @param {string} input
 * @returns {string}
 */
function normalize(input) {
  if (typeof input !== 'string') return '';
  let s = input.trim();
  // 全形英數、標點 -> 半形
  s = s.replace(/[\uff01-\uff5e]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
  );
  s = s.replace(/\u3000/g, ' '); // 全形空白
  s = s.toLowerCase();
  s = s.replace(/\s+/g, ''); // 移除所有空白
  return s;
}

/**
 * 驗證使用者答案是否與「任一」正確答案一致（正規化後比對）
 * @param {string} userAnswer 使用者輸入
 * @param {string[]} acceptedAnswers 可接受的答案陣列
 * @returns {boolean}
 */
function verify(userAnswer, acceptedAnswers) {
  if (!Array.isArray(acceptedAnswers) || acceptedAnswers.length === 0) return false;
  const normalizedUser = normalize(userAnswer);
  return acceptedAnswers.some((ans) => normalize(String(ans)) === normalizedUser);
}

module.exports = { normalize, verify };
