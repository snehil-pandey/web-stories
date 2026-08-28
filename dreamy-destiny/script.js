/* ==========================================================================
   Dreamy Destiny — Application Logic & Persistence Engine
   ========================================================================== */

// Chapter Manifest Definitions (First 2 Chapters)
const CHAPTERS = [
  { id: 1, file: 'dreamy_destiny_01.md', defaultTitle: 'Chapter 1: The Girl in the Apartment' },
  { id: 2, file: 'dreamy_destiny_02.md', defaultTitle: 'Chapter 2: Two Weeks' }
];

// State Variables
let currentChapterIndex = 0;
let restoreScrollPercent = 0;
const chapterCache = {};
let scrollSaveTimeout = null;

// IndexedDB Storage Manager for Persistent Chapter Cache
const DB_NAME = 'DreamyDestinyDB';
const DB_VERSION = 2;
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
  } catch (err) {
    // Ignore storage quota errors
  }
}

async function clearDBStore() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
  } catch (err) {}
}

// Remove custom marked renderer override
// Relying on clean native parsing

// DOM Initialization
document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const btnStartReading = document.getElementById('btnStartReading');
  const btnContinueReading = document.getElementById('btnContinueReading');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const btnToggleDrawer = document.getElementById('btnToggleDrawer');
  const btnPrevChap = document.getElementById('btnPrevChap');
  const btnNextChap = document.getElementById('btnNextChap');
  const readingArea = document.getElementById('readingArea');

  // Settings Elements
  const btnOpenSettings = document.getElementById('btnOpenSettings');
  const btnCloseSettings = document.getElementById('btnCloseSettings');
  const btnSetPin = document.getElementById('btnSetPin');
  const btnRemovePin = document.getElementById('btnRemovePin');
  const btnClearCache = document.getElementById('btnClearCache');
  const btnClearProgress = document.getElementById('btnClearProgress');

  // PIN Auth Elements
  const btnVerifyPin = document.getElementById('btnVerifyPin');
  const btnCancelPinAuth = document.getElementById('btnCancelPinAuth');

  // Event Listeners
  if (btnStartReading) btnStartReading.addEventListener('click', () => startReadingFromBeginning());
  if (btnContinueReading) btnContinueReading.addEventListener('click', () => handleContinueReading());
  if (btnCloseModal) btnCloseModal.addEventListener('click', closeReaderModal);
  if (btnToggleDrawer) btnToggleDrawer.addEventListener('click', toggleDrawer);
  if (btnPrevChap) btnPrevChap.addEventListener('click', () => navigateChapter(-1));
  if (btnNextChap) btnNextChap.addEventListener('click', () => navigateChapter(1));
  if (readingArea) readingArea.addEventListener('scroll', handleThrottledScroll);

  // Settings & PIN Events
  if (btnOpenSettings) btnOpenSettings.addEventListener('click', openSettingsModal);
  if (btnCloseSettings) btnCloseSettings.addEventListener('click', closeSettingsModal);
  if (btnSetPin) btnSetPin.addEventListener('click', handleSetPin);
  if (btnRemovePin) btnRemovePin.addEventListener('click', handleRemovePin);
  if (btnClearCache) btnClearCache.addEventListener('click', handleClearCache);
  if (btnClearProgress) btnClearProgress.addEventListener('click', handleClearProgress);
  if (btnVerifyPin) btnVerifyPin.addEventListener('click', handleVerifyPinAuth);
  if (btnCancelPinAuth) btnCancelPinAuth.addEventListener('click', () => closePinAuthModal());

  // Global Shortcuts
  document.addEventListener('keydown', handleGlobalKeydown);

  // Check Returning Reader Progress
  checkSavedProgress();
});

// Returning Reader State Management
function checkSavedProgress() {
  const savedState = getSavedState();
  const continueBox = document.getElementById('continueReadingBox');
  const progressPill = document.getElementById('continueProgressPill');
  const startBtnLabel = document.getElementById('startBtnLabel');

  if (savedState && savedState.index >= 0 && savedState.index < CHAPTERS.length) {
    if (continueBox) continueBox.style.display = 'flex';
    const chap = CHAPTERS[savedState.index];
    const scrollPct = Math.round((savedState.scrollPercent || 0) * 100);
    if (progressPill) {
      progressPill.innerText = `${chap.isSpecial ? 'Special' : 'Chapter ' + (savedState.index + 1)} • ${scrollPct}% read`;
    }
    if (startBtnLabel) startBtnLabel.innerText = 'Start From Beginning';
  } else {
    if (continueBox) continueBox.style.display = 'none';
    if (startBtnLabel) startBtnLabel.innerText = 'Start Reading';
  }

  updatePinStatusUI();
}

function getSavedState() {
  try {
    const raw = localStorage.getItem('dreamy_destiny_progress');
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
    localStorage.setItem('dreamy_destiny_progress', JSON.stringify(payload));
    checkSavedProgress();
  } catch (e) {}
}

function handleContinueReading() {
  const pinHash = localStorage.getItem('dreamy_destiny_pin_hash');
  if (pinHash) {
    openPinAuthModal();
  } else {
    proceedToContinueReading();
  }
}

function proceedToContinueReading() {
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
  
  renderDrawerList();
  loadChapter(currentChapterIndex);
}

function closeReaderModal() {
  const modal = document.getElementById('readerModal');
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';
  closeDrawer();
}

// Drawer Controls
function toggleDrawer() {
  const drawer = document.getElementById('chapterDrawer');
  if (drawer) drawer.classList.toggle('open');
}

function closeDrawer() {
  const drawer = document.getElementById('chapterDrawer');
  if (drawer) drawer.classList.remove('open');
}

function renderDrawerList() {
  const listElem = document.getElementById('drawerChapterList');
  if (!listElem) return;
  listElem.innerHTML = '';

  CHAPTERS.forEach((chap, idx) => {
    if (chap.isSpecial) return;

    const item = document.createElement('div');
    item.className = `drawer-item ${idx === currentChapterIndex ? 'active' : ''}`;
    item.innerText = chap.defaultTitle;
    item.addEventListener('click', () => {
      currentChapterIndex = idx;
      restoreScrollPercent = 0;
      closeDrawer();
      renderDrawerList();
      loadChapter(currentChapterIndex);
    });
    listElem.appendChild(item);
  });
}

// Chapter Loading with Memory + IndexedDB Cache
async function loadChapter(index) {
  if (index < 0 || index >= CHAPTERS.length) return;

  const chapter = CHAPTERS[index];
  const headerTitle = document.getElementById('headerChapTitle');
  const progressText = document.getElementById('progressIndicator');
  const contentElem = document.getElementById('renderedContent');
  const readingArea = document.getElementById('readingArea');

  if (headerTitle) headerTitle.innerText = chapter.defaultTitle;
  
  const totalMainChapters = CHAPTERS.filter(c => !c.isSpecial).length;
  if (progressText) {
    if (chapter.isSpecial) {
      progressText.innerText = 'Special Epilogue';
    } else {
      progressText.innerText = `Chapter ${index + 1} / ${totalMainChapters}`;
    }
  }
  
  const btnPrev = document.getElementById('btnPrevChap');
  const btnNext = document.getElementById('btnNextChap');
  if (btnPrev) btnPrev.disabled = (index === 0);
  if (btnNext) btnNext.disabled = (index === CHAPTERS.length - 1);

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

  // 3. Fetch dynamically via HTTP
  if (contentElem) {
    contentElem.innerHTML = `
      <div class="state-container">
        <div class="loading-spinner"></div>
        <p>Opening chapter...</p>
      </div>
    `;
  }

  try {
    const response = await fetch(`./${chapter.file}`);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const rawMarkdown = await response.text();
    
    chapterCache[chapter.file] = rawMarkdown;
    setCachedChapterDB(chapter.file, rawMarkdown); // Store persistently
    renderMarkdownContent(rawMarkdown);
    restoreReadingScroll();

  } catch (err) {
    if (contentElem) {
      contentElem.innerHTML = `
        <div class="state-container">
          <p style="color: var(--accent-rose); font-weight: 600;">This chapter couldn't be opened right now.</p>
          <p style="font-size: 0.9rem; margin-top: 6px;">Please verify your local server status.</p>
          <button class="btn-retry" onclick="loadChapter(${index})">Try Again</button>
        </div>
      `;
    }
  }
}

// Scroll Restoration
function restoreReadingScroll() {
  const readingArea = document.getElementById('readingArea');
  if (!readingArea) return;

  requestAnimationFrame(() => {
    setTimeout(() => {
      if (restoreScrollPercent > 0) {
        const targetScroll = (readingArea.scrollHeight - readingArea.clientHeight) * restoreScrollPercent;
        readingArea.scrollTop = targetScroll;
        restoreScrollPercent = 0; // reset once restored
      } else {
        readingArea.scrollTop = 0;
      }
    }, 50);
  });
}

// Throttled Scroll Progress Persistence
function handleThrottledScroll() {
  if (scrollSaveTimeout) clearTimeout(scrollSaveTimeout);
  
  scrollSaveTimeout = setTimeout(() => {
    const readingArea = document.getElementById('readingArea');
    if (!readingArea) return;

    const maxScroll = readingArea.scrollHeight - readingArea.clientHeight;
    if (maxScroll <= 0) return;

    const currentScroll = readingArea.scrollTop;
    const scrollPercent = Math.min(1, Math.max(0, currentScroll / maxScroll));

    saveState(currentChapterIndex, scrollPercent);
  }, 400);
}

// Clean Native Markdown-to-HTML Converter
function parseMarkdownToHTML(mdText) {
  const lines = mdText.split('\n');
  let html = '';
  let inBlockquote = false;
  let blockquoteLines = [];

  function flushBlockquote() {
    if (blockquoteLines.length > 0) {
      let bqContent = blockquoteLines.map(l => {
        let text = l.substring(2).trim();
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*([^\*]+)\*/g, '<em class="thought">$1</em>');
        return text;
      }).join('<br>');
      html += `<blockquote>${bqContent}</blockquote>`;
      blockquoteLines = [];
    }
  }

  lines.forEach(l => {
    let s = l.trim();
    if (!s) {
      flushBlockquote();
      return;
    }

    if (s.startsWith('# ')) {
      flushBlockquote();
      html += `<h1>${s.substring(2)}</h1>`;
    } else if (s.startsWith('> ')) {
      blockquoteLines.push(s);
    } else if (s === '---') {
      flushBlockquote();
      html += `<hr>`;
    } else {
      flushBlockquote();
      const isChat = s.startsWith('**Sylvia:**') || s.startsWith('**Me:**') || s.startsWith('**Muse:**');
      
      // Replace bold **text** -> <strong>text</strong>
      s = s.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      if (isChat) {
        // Chat message text remains primary color (black)
        s = s.replace(/\*([^\*]+)\*/g, '<em class="chat-text">$1</em>');
        html += `<p class="chat-msg">${s}</p>`;
      } else {
        // Inner thoughts use --thought-text (gray)
        s = s.replace(/\*([^\*]+)\*/g, '<em class="thought">$1</em>');
        html += `<p>${s}</p>`;
      }
    }
  });

  flushBlockquote();
  return html;
}

// Markdown Parser & HTML Injection
function renderMarkdownContent(mdText) {
  const contentElem = document.getElementById('renderedContent');
  if (!contentElem) return;

  let parsedHtml = parseMarkdownToHTML(mdText);

  // Append Special Epilogue Button at end of Chapter 17 (Five Years Earlier)
  if (currentChapterIndex === 16) {
    parsedHtml += `
      <hr style="margin: 40px 0;">
      <div style="background: var(--accent-soft); border: 1px solid #F8D7DA; border-radius: 16px; padding: 28px; text-align: center; margin-top: 30px;">
        <h3 style="font-family: var(--font-serif); font-size: 1.6rem; color: var(--accent-rose); margin-bottom: 8px;">Special Epilogue</h3>
        <p style="font-size: 0.92rem; color: var(--text-muted); margin-bottom: 16px;">You have reached the end of the main 17-chapter story. Would you like to read the special epilogue?</p>
        <button class="nav-btn" onclick="currentChapterIndex=17; restoreScrollPercent=0; renderDrawerList(); loadChapter(17);" style="background: var(--accent-rose); color: white; border: none; padding: 12px 28px; border-radius: 30px; font-weight: 600; cursor: pointer;">
          <i class="fa-solid fa-sparkles"></i> Read Special: A Glimpse of Tomorrow
        </button>
      </div>
    `;
  }

  contentElem.innerHTML = parsedHtml;
}

// Chapter Step Navigation
function navigateChapter(direction) {
  const newIndex = currentChapterIndex + direction;
  if (newIndex >= 0 && newIndex < CHAPTERS.length) {
    currentChapterIndex = newIndex;
    restoreScrollPercent = 0;
    renderDrawerList();
    loadChapter(currentChapterIndex);
    saveState(currentChapterIndex, 0);
  }
}

// Settings Modal Controls
function openSettingsModal() {
  const modal = document.getElementById('settingsModal');
  if (modal) modal.classList.add('active');
  updatePinStatusUI();
}

function closeSettingsModal() {
  const modal = document.getElementById('settingsModal');
  if (modal) modal.classList.remove('active');
}

// Local PIN Protection (Web Crypto Salted Hashing)
async function hashPin(pin, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({
    name: 'PBKDF2',
    salt: encoder.encode(salt),
    iterations: 10000,
    hash: 'SHA-256'
  }, keyMaterial, 256);
  return btoa(String.fromCharCode(...new Uint8Array(bits)));
}

async function handleSetPin() {
  const input = document.getElementById('inputPinCode');
  const val = input ? input.value.trim() : '';

  if (!val || val.length < 4) {
    alert('Please enter a 4 to 6 digit PIN.');
    return;
  }

  const salt = 'dreamy_' + Math.random().toString(36).substring(2);
  const hash = await hashPin(val, salt);

  localStorage.setItem('dreamy_destiny_pin_salt', salt);
  localStorage.setItem('dreamy_destiny_pin_hash', hash);

  if (input) input.value = '';
  updatePinStatusUI();
  alert('Reader PIN has been set successfully.');
}

function handleRemovePin() {
  localStorage.removeItem('dreamy_destiny_pin_salt');
  localStorage.removeItem('dreamy_destiny_pin_hash');
  updatePinStatusUI();
  alert('Reader PIN has been removed.');
}

function updatePinStatusUI() {
  const statusElem = document.getElementById('pinStatusText');
  const btnRemove = document.getElementById('btnRemovePin');
  const pinHash = localStorage.getItem('dreamy_destiny_pin_hash');

  if (pinHash) {
    if (statusElem) statusElem.innerHTML = 'Status: <span style="color: #38A169;">PIN Protected</span>';
    if (btnRemove) btnRemove.style.display = 'inline-block';
  } else {
    if (statusElem) statusElem.innerHTML = 'Status: <span style="color: var(--text-muted);">No PIN Set</span>';
    if (btnRemove) btnRemove.style.display = 'none';
  }
}

// PIN Verification Modal
function openPinAuthModal() {
  const modal = document.getElementById('pinAuthModal');
  const input = document.getElementById('inputAuthPin');
  const err = document.getElementById('pinAuthError');
  if (input) input.value = '';
  if (err) err.style.display = 'none';
  if (modal) modal.classList.add('active');
}

function closePinAuthModal() {
  const modal = document.getElementById('pinAuthModal');
  if (modal) modal.classList.remove('active');
}

async function handleVerifyPinAuth() {
  const input = document.getElementById('inputAuthPin');
  const err = document.getElementById('pinAuthError');
  const val = input ? input.value.trim() : '';

  const salt = localStorage.getItem('dreamy_destiny_pin_salt');
  const hash = localStorage.getItem('dreamy_destiny_pin_hash');

  if (!salt || !hash) {
    closePinAuthModal();
    proceedToContinueReading();
    return;
  }

  const inputHash = await hashPin(val, salt);
  if (inputHash === hash) {
    closePinAuthModal();
    proceedToContinueReading();
  } else {
    if (err) {
      err.innerText = 'Incorrect PIN. Please try again.';
      err.style.display = 'block';
    }
  }
}

// Storage Management Controls
async function handleClearCache() {
  await clearDBStore();
  for (const key in chapterCache) delete chapterCache[key];
  alert('Cached chapters have been cleared.');
}

function handleClearProgress() {
  if (confirm('Are you sure you want to reset your reading progress?')) {
    localStorage.removeItem('dreamy_destiny_progress');
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
  } else if (e.key === 'ArrowLeft') {
    navigateChapter(-1);
  } else if (e.key === 'ArrowRight') {
    navigateChapter(1);
  }
}
