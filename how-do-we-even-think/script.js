/* ==========================================================================
   How Do We Even Think? — Application Logic & Persistence Engine
   Thematic Accent: Midnight Twilight
   IndexedDB Persistent Cache & LocalStorage Progress Tracking
   ========================================================================== */

// Chapter Manifest (Single Standalone Chapter)
const CHAPTERS = [
  { id: 1, file: 'how_do_we_even_think.md', defaultTitle: 'How Do We Even Think?' }
];

// State Variables
let currentChapterIndex = 0;
let restoreScrollPercent = 0;
const chapterCache = {};
let scrollSaveTimeout = null;

// IndexedDB Storage Manager for Persistent Chapter Cache
const DB_NAME = 'HowDoWeEvenThinkDB';
const DB_VERSION = 1;
const STORE_NAME = 'chapter_cache';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'file' });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

async function getCachedChapterDB(filename) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(filename);
      req.onsuccess = () => resolve(req.result ? req.result.content : null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    return null;
  }
}

async function setCachedChapterDB(filename, content) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ file: filename, content: content, timestamp: Date.now() });
  } catch (err) {}
}

async function clearDBStore() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
  } catch (err) {}
}

// DOM Initialization
document.addEventListener('DOMContentLoaded', () => {
  // Reader Elements
  const btnStartReading = document.getElementById('btnStartReading');
  const btnContinueReading = document.getElementById('btnContinueReading');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const readingArea = document.getElementById('readingArea');
  const btnShareStory = document.getElementById('btnShareStory');

  // Settings Elements
  const btnOpenSettings = document.getElementById('btnOpenSettings');
  const btnCloseSettings = document.getElementById('btnCloseSettings');
  const btnClearCache = document.getElementById('btnClearCache');
  const btnClearProgress = document.getElementById('btnClearProgress');

  // Theme Toggle Elements
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleThemeMode);
  }
  initThemeMode();

  // Event Listeners
  if (btnStartReading) btnStartReading.addEventListener('click', () => startReadingFromBeginning());
  if (btnContinueReading) btnContinueReading.addEventListener('click', () => handleContinueReading());
  if (btnCloseModal) btnCloseModal.addEventListener('click', closeReaderModal);
  if (readingArea) readingArea.addEventListener('scroll', handleThrottledScroll);

  // Settings Events
  if (btnOpenSettings) btnOpenSettings.addEventListener('click', openSettingsModal);
  if (btnCloseSettings) btnCloseSettings.addEventListener('click', closeSettingsModal);
  if (btnClearCache) btnClearCache.addEventListener('click', handleClearCache);
  if (btnClearProgress) btnClearProgress.addEventListener('click', handleClearProgress);
  if (btnShareStory) btnShareStory.addEventListener('click', handleShareStory);

  // Global Shortcuts
  document.addEventListener('keydown', handleGlobalKeydown);

  // Check Returning Reader Progress
  checkSavedProgress();

  // Hash-based Deep Linking Support (#reader)
  handleHashRouting();
  window.addEventListener('hashchange', handleHashRouting);
});

function handleHashRouting() {
  const hash = window.location.hash.toLowerCase();
  if (hash === '#reader' || hash === '#read') {
    openReaderModal();
  }
}

// Returning Reader State Management
function checkSavedProgress() {
  const savedState = getSavedState();
  const continueBox = document.getElementById('continueReadingBox');
  const progressPill = document.getElementById('continueProgressPill');
  const startBtnLabel = document.getElementById('startBtnLabel');

  if (savedState && savedState.index >= 0) {
    if (continueBox) continueBox.style.display = 'flex';
    const scrollPct = Math.round((savedState.scrollPercent || 0) * 100);
    if (progressPill) {
      progressPill.innerText = `Reading • ${scrollPct}% completed`;
    }
    if (startBtnLabel) startBtnLabel.innerText = 'Start From Beginning';
  } else {
    if (continueBox) continueBox.style.display = 'none';
    if (startBtnLabel) startBtnLabel.innerText = 'Start Reading';
  }
}

function getSavedState() {
  try {
    const raw = localStorage.getItem('how_do_we_even_think_progress');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveState(index, scrollPercent) {
  try {
    const payload = {
      index: index,
      file: CHAPTERS[index].file,
      scrollPercent: scrollPercent,
      timestamp: Date.now()
    };
    localStorage.setItem('how_do_we_even_think_progress', JSON.stringify(payload));
    checkSavedProgress();
  } catch (e) {}
}

function handleContinueReading() {
  const saved = getSavedState();
  if (saved) {
    currentChapterIndex = saved.index;
    restoreScrollPercent = saved.scrollPercent || 0;
  } else {
    currentChapterIndex = 0;
    restoreScrollPercent = 0;
  }
  openReaderModal();
}

function startReadingFromBeginning() {
  currentChapterIndex = 0;
  restoreScrollPercent = 0;
  saveState(0, 0);
  openReaderModal();
}

// Modal Controls
function openReaderModal() {
  const modal = document.getElementById('readerModal');
  if (!modal) return;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  loadChapter(currentChapterIndex);
}

function closeReaderModal() {
  const modal = document.getElementById('readerModal');
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

// Chapter Loading with Memory + IndexedDB Cache
async function loadChapter(index) {
  if (index < 0 || index >= CHAPTERS.length) return;

  const chapter = CHAPTERS[index];
  const headerTitle = document.getElementById('headerChapTitle');
  const progressText = document.getElementById('progressIndicator');
  const contentElem = document.getElementById('renderedContent');

  if (headerTitle) headerTitle.innerText = chapter.defaultTitle;
  if (progressText) progressText.innerText = 'Complete Standalone Tale';

  // 1. Check Memory Cache
  if (chapterCache[chapter.file]) {
    renderMarkdownContent(chapterCache[chapter.file]);
    restoreReadingScroll();
    return;
  }

  // 2. Check IndexedDB Persistent Cache
  const dbCachedText = await getCachedChapterDB(chapter.file);
  if (dbCachedText) {
    chapterCache[chapter.file] = dbCachedText;
    renderMarkdownContent(dbCachedText);
    restoreReadingScroll();
    return;
  }

  // 3. Fallback Fetch from Network
  renderLoadingState();
  try {
    const response = await fetch(chapter.file);
    if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
    const rawMarkdown = await response.text();

    // Cache locally
    chapterCache[chapter.file] = rawMarkdown;
    await setCachedChapterDB(chapter.file, rawMarkdown);

    renderMarkdownContent(rawMarkdown);
    restoreReadingScroll();
  } catch (err) {
    renderErrorState();
  }
}

function renderMarkdownContent(rawMarkdown) {
  const contentElem = document.getElementById('renderedContent');
  if (!contentElem) return;

  if (typeof marked !== 'undefined') {
    let parsedHTML = marked.parse(rawMarkdown);
    contentElem.innerHTML = parsedHTML;
  } else {
    contentElem.innerHTML = `<pre style="white-space: pre-wrap; font-family: inherit;">${rawMarkdown}</pre>`;
  }
}

function renderLoadingState() {
  const contentElem = document.getElementById('renderedContent');
  if (contentElem) {
    contentElem.innerHTML = `
      <div class="state-container">
        <div class="loading-spinner"></div>
        <p>Loading narrative into memory...</p>
      </div>
    `;
  }
}

function renderErrorState() {
  const contentElem = document.getElementById('renderedContent');
  if (contentElem) {
    contentElem.innerHTML = `
      <div class="state-container">
        <p style="color: var(--accent-midnight); font-size: 1.1rem; font-weight: 600;">Unable to load narrative file.</p>
        <button class="btn-retry" onclick="loadChapter(currentChapterIndex)">Retry Loading</button>
      </div>
    `;
  }
}

function restoreReadingScroll() {
  const readingArea = document.getElementById('readingArea');
  if (!readingArea) return;

  setTimeout(() => {
    if (restoreScrollPercent > 0) {
      const targetY = (readingArea.scrollHeight - readingArea.clientHeight) * restoreScrollPercent;
      readingArea.scrollTop = targetY;
    } else {
      readingArea.scrollTop = 0;
    }
  }, 60);
}

function handleThrottledScroll() {
  if (scrollSaveTimeout) clearTimeout(scrollSaveTimeout);

  scrollSaveTimeout = setTimeout(() => {
    const readingArea = document.getElementById('readingArea');
    if (!readingArea) return;

    const maxScroll = readingArea.scrollHeight - readingArea.clientHeight;
    const currentScroll = readingArea.scrollTop;
    const percent = maxScroll > 0 ? (currentScroll / maxScroll) : 0;

    saveState(currentChapterIndex, percent);
  }, 300);
}

// Settings Modal Controls
function openSettingsModal() {
  const modal = document.getElementById('settingsModal');
  if (modal) modal.classList.add('active');
}

function closeSettingsModal() {
  const modal = document.getElementById('settingsModal');
  if (modal) modal.classList.remove('active');
}

async function handleClearCache() {
  await clearDBStore();
  for (const key in chapterCache) delete chapterCache[key];
  alert('Local chapter cache cleared.');
}

function handleClearProgress() {
  if (confirm('Are you sure you want to reset your reading position?')) {
    localStorage.removeItem('how_do_we_even_think_progress');
    currentChapterIndex = 0;
    restoreScrollPercent = 0;
    checkSavedProgress();
    closeSettingsModal();
  }
}

// Global Shortcuts
function handleGlobalKeydown(e) {
  const modal = document.getElementById('readerModal');
  if (!modal || !modal.classList.contains('active')) return;

  if (e.key === 'Escape') {
    closeReaderModal();
  }
}

// Theme Switcher (Dark / Light Mood Mode)
function initThemeMode() {
  const saved = localStorage.getItem('how_do_we_even_think_theme');
  if (saved === 'dark') {
    document.documentElement.classList.add('dark-mode');
    document.body.classList.add('dark-mode');
  } else {
    document.documentElement.classList.remove('dark-mode');
    document.body.classList.remove('dark-mode');
  }
  const isDark = saved === 'dark';
  const toggleBtn = document.getElementById('themeToggle');
  if (toggleBtn) {
    const icon = toggleBtn.querySelector('i');
    const span = toggleBtn.querySelector('span');
    if (icon) icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    if (span) span.textContent = isDark ? 'Light Mode' : 'Dark Mode';
  }
}

function toggleThemeMode() {
  const isCurrentlyDark = document.body.classList.contains('dark-mode');
  if (isCurrentlyDark) {
    document.documentElement.classList.remove('dark-mode');
    document.body.classList.remove('dark-mode');
    localStorage.setItem('how_do_we_even_think_theme', 'light');
  } else {
    document.documentElement.classList.add('dark-mode');
    document.body.classList.add('dark-mode');
    localStorage.setItem('how_do_we_even_think_theme', 'dark');
  }
  const isDark = !isCurrentlyDark;
  const toggleBtn = document.getElementById('themeToggle');
  if (toggleBtn) {
    const icon = toggleBtn.querySelector('i');
    const span = toggleBtn.querySelector('span');
    if (icon) icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    if (span) span.textContent = isDark ? 'Light Mode' : 'Dark Mode';
  }
}

// Share Story Handler
function handleShareStory() {
  const shareData = {
    title: 'How Do We Even Think? — Snehil Pandey',
    text: '“Some thoughts arrive without a sound. And some never leave.” Read this short mysterious tale by Snehil Pandey.',
    url: window.location.href
  };

  if (navigator.share) {
    navigator.share(shareData).catch(() => {});
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert('Link copied to clipboard!');
    });
  }
}
