/**
 * 生日解鎖卡片 - 前端邏輯
 * 解鎖狀態存於 localStorage；擴充點可改為依賴 API 回傳的 unlockedUpTo（server-side session）
 */

const STORAGE_KEY = 'birthday_unlock_upTo';

let config = { title: '', blessing: '', questions: [] };
let unlockedUpTo = 0;

const hero = document.getElementById('hero');
const unlockSection = document.getElementById('unlock-section');
const btnStart = document.getElementById('btnStart');
const questionText = document.getElementById('questionText');
const answerInput = document.getElementById('answerInput');
const btnSubmit = document.getElementById('btnSubmit');
const hintMessage = document.getElementById('hintMessage');
const errorMessage = document.getElementById('errorMessage');
const photoGrid = document.getElementById('photoGrid');
const confettiContainer = document.getElementById('confettiContainer');
const photoRevealOverlay = document.getElementById('photoRevealOverlay');
const photoRevealImg = document.getElementById('photoRevealImg');
const photoRevealClose = document.getElementById('photoRevealClose');

function loadUnlockedUpTo() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : 0;
}

function saveUnlockedUpTo(n) {
  unlockedUpTo = Math.max(unlockedUpTo, n);
  localStorage.setItem(STORAGE_KEY, String(unlockedUpTo));
}

function getCurrentQuestionIndex() {
  const next = unlockedUpTo + 1;
  const idx = config.questions.findIndex((q) => q.id === next);
  return idx >= 0 ? idx : -1;
}

function applyConfig() {
  document.querySelector('.hero-title').textContent = config.title;
  document.querySelector('.hero-blessing').textContent = config.blessing;
}

function showHero() {
  hero.classList.remove('hidden');
  unlockSection.classList.add('hidden');
}

function showUnlockSection() {
  hero.classList.add('hidden');
  unlockSection.classList.remove('hidden');
  renderQuestion();
  renderPhotoGrid();
}

function renderQuestion() {
  const idx = getCurrentQuestionIndex();
  hintMessage.classList.add('hidden');
  errorMessage.classList.add('hidden');
  hintMessage.textContent = '';
  errorMessage.textContent = '';
  answerInput.value = '';

  if (idx < 0) {
    questionText.textContent = '恭喜你！所有回憶都解鎖了。';
    answerInput.style.display = 'none';
    btnSubmit.style.display = 'none';
    return;
  }

  const q = config.questions[idx];
  questionText.textContent = q.question;
  answerInput.style.display = '';
  btnSubmit.style.display = '';
  answerInput.focus();
}

function renderPhotoGrid() {
  photoGrid.innerHTML = '';
  if (!config.questions.length) return;

  config.questions.forEach((q, index) => {
    const id = q.id;
    const isUnlocked = id <= unlockedUpTo;
    const item = document.createElement('div');
    item.className = 'photo-item' + (isUnlocked ? '' : ' locked');
    if (isUnlocked) {
      const img = document.createElement('img');
      img.src = `/photos/${q.photo}`;
      img.alt = `解鎖照片 ${id}`;
      img.loading = 'lazy';
      img.onerror = () => {
        img.style.background = 'linear-gradient(135deg, #f0e8e5, #e8a598)';
        img.alt = '等待載入';
      };
      item.appendChild(img);
    } else {
      const img = document.createElement('img');
      img.src = `/photos/${q.photo}`;
      img.alt = '';
      img.loading = 'lazy';
      img.onerror = () => {};
      item.appendChild(img);
      const overlay = document.createElement('div');
      overlay.className = 'lock-overlay';
      overlay.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="11" width="18" height="11" rx="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      `;
      item.appendChild(overlay);
    }
    photoGrid.appendChild(item);
  });
}

function showConfetti() {
  const colors = ['#e8a598', '#c97b6e', '#f5d0c8', '#6b5b58'];
  for (let i = 0; i < 30; i++) {
    const dot = document.createElement('div');
    dot.className = 'confetti-dot';
    dot.style.left = Math.random() * 100 + '%';
    dot.style.background = colors[Math.floor(Math.random() * colors.length)];
    dot.style.animationDelay = Math.random() * 0.3 + 's';
    dot.style.animationDuration = 0.8 + Math.random() * 0.6 + 's';
    confettiContainer.appendChild(dot);
    setTimeout(() => dot.remove(), 1500);
  }
}

/**
 * 答對後彈出該張解鎖照片，點「繼續」後執行 onClose
 * @param {string} photoPath 照片檔名，例如 photo1.jpg
 * @param {function} onClose 關閉彈窗後要執行的 callback
 */
function showPhotoReveal(photoPath, onClose) {
  if (!photoRevealOverlay || !photoRevealImg) return;
  photoRevealImg.src = '/photos/' + (photoPath || '');
  photoRevealImg.alt = '解鎖的照片';
  photoRevealOverlay.classList.remove('hidden');
  photoRevealOverlay.setAttribute('aria-hidden', 'false');

  const close = () => {
    photoRevealOverlay.classList.add('hidden');
    photoRevealOverlay.setAttribute('aria-hidden', 'true');
    photoRevealClose.removeEventListener('click', close);
    photoRevealOverlay.removeEventListener('click', handleOverlayClick);
    if (typeof onClose === 'function') onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === photoRevealOverlay) close();
  };

  photoRevealClose.addEventListener('click', close);
  photoRevealOverlay.addEventListener('click', handleOverlayClick);
}

function showHint(hint) {
  hintMessage.textContent = '💡 ' + (hint || '再想想～');
  hintMessage.classList.remove('hidden');
  errorMessage.classList.add('hidden');
}

function showError(msg) {
  errorMessage.textContent = msg || '答案不正確，再試一次～';
  errorMessage.classList.remove('hidden');
  hintMessage.classList.add('hidden');
}

async function submitAnswer() {
  const idx = getCurrentQuestionIndex();
  if (idx < 0) return;
  const q = config.questions[idx];
  const answer = answerInput.value.trim();
  if (!answer) {
    showError('請輸入答案');
    return;
  }

  btnSubmit.disabled = true;
  hintMessage.classList.add('hidden');
  errorMessage.classList.add('hidden');

  try {
    const res = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: q.id, answer }),
    });
    const data = await res.json().catch(() => ({}));

    if (data.correct) {
      const newUpTo = data.unlockedUpTo != null ? data.unlockedUpTo : q.id;
      saveUnlockedUpTo(newUpTo);
      showConfetti();
      // 彈出「這一張」解鎖照片，答對一題就出現一張
      showPhotoReveal(q.photo, () => {
        renderPhotoGrid();
        const newlyUnlocked = photoGrid.querySelector(`.photo-item:nth-child(${idx + 1})`);
        if (newlyUnlocked) newlyUnlocked.classList.add('unlock-pop');
        renderQuestion();
      });
    } else {
      showHint(q.hint);
    }
  } catch (e) {
    showError('網路錯誤，請稍後再試');
  } finally {
    btnSubmit.disabled = false;
  }
}

async function init() {
  try {
    const res = await fetch('/api/config');
    const data = await res.json();
    config = {
      title: data.title || 'Happy Birthday',
      blessing: data.blessing || '祝你生日快樂。',
      questions: Array.isArray(data.questions) ? data.questions : [],
    };
    applyConfig();
  } catch (e) {
    config = { title: 'Happy Birthday', blessing: '祝你生日快樂。', questions: [] };
    applyConfig();
  }

  unlockedUpTo = loadUnlockedUpTo();

  btnStart.addEventListener('click', () => {
    showUnlockSection();
  });

  btnSubmit.addEventListener('click', submitAnswer);
  answerInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitAnswer();
  });

  if (unlockedUpTo > 0 || getCurrentQuestionIndex() >= 0) {
    showUnlockSection();
  }
}

init();
