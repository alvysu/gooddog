/**
 * 產生題目答案的雜湊值，供寫入環境變數（ANSWER_SALT、Q1_HASH ...）
 * 使用方式：ANSWER_SALT=你的鹽 node scripts/generate-hash.js "答案一" "答案二" ...
 * 或先設定環境變數 ANSWER_SALT，再執行 node scripts/generate-hash.js 答案1 答案2 ...
 */

const { hashAnswer, normalize } = require('../lib/answer');

const salt = process.env.ANSWER_SALT || 'default_salt_change_me';
const answers = process.argv.slice(2);

if (answers.length === 0) {
  console.log('用法：ANSWER_SALT=你的鹽 node scripts/generate-hash.js "答案1" "答案2" ...');
  console.log('範例：ANSWER_SALT=mySecretSalt node scripts/generate-hash.js "星巴克" "手錶"');
  process.exit(1);
}

console.log('請將以下值設定到 Render 環境變數（或 .env）：\n');
answers.forEach((ans, i) => {
  const normalized = normalize(ans);
  const hash = hashAnswer(normalized, salt);
  const envKey = `Q${i + 1}_HASH`;
  console.log(`${envKey}=${hash}`);
});
console.log('\n（正規化後答案會轉小寫、全形轉半形，請以同樣規則設定正確答案）');
