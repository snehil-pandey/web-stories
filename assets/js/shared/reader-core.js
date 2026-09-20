/**
 * ============================================================================
 * The Literary Room — Unified Reading Engine & Reader Architecture
 * File: assets/js/shared/reader-core.js
 * Modal lifecycle, chapter caching, markdown stream rendering, progress persistence,
 * drawer navigation, keyboard shortcuts, and reading comfort controls.
 * ============================================================================
 */

(function (window) {
  'use strict';

  class LiteraryReader {
    constructor(config = {}) {
      this.chapters = config.chapters || [];
      this.storageKey = config.storageKey || 'literary_reading_progress';
      this.dbName = config.dbName || 'LiteraryRoomDB';
      this.dbVersion = config.dbVersion || 1;
      this.storyTitle = config.storyTitle || document.title;
      this.hasDrawer = config.hasDrawer !== false && this.chapters.length > 1;
      this.atmosphere = config.atmosphere || 'petals';
      this.typographyKey = config.typographyKey || 'literary_reader_typography';

      // State
      this.currentIndex = 0;
      this.restoreScrollPercent = 0;
      this.memoryCache = {};
      this.scrollSaveTimeout = null;

      // Persistence services
      this.cacheStore = new window.LiteraryStorage.ChapterCache(this.dbName, this.dbVersion);

      // DOM Elements Cache
      this.elements = {};

      this.init();
    }

    init() {
      this.cacheElements();
      this.bindEvents();
      this.renderDrawerList();
      this.checkSavedProgress();
      this.initTypographyComfort();
      this.handleHashRouting();

      // Deep linking via hash change
      window.addEventListener('hashchange', () => this.handleHashRouting());

      // Initialize literary motion atmosphere
      if (window.LiteraryMotion) {
        window.LiteraryMotion.init({ atmosphere: this.atmosphere });
      }
    }

    cacheElements() {
      const get = (id) => document.getElementById(id);
      this.elements = {
        btnStartReading: get('btnStartReading'),
        btnContinueReading: get('btnContinueReading'),
        btnCloseModal: get('btnCloseModal'),
        readerModal: get('readerModal'),
        readingArea: get('readingArea'),
        renderedContent: get('renderedContent'),
        headerChapTitle: get('headerChapTitle'),
        progressIndicator: get('progressIndicator'),
        btnPrevChap: get('btnPrevChap'),
        btnNextChap: get('btnNextChap'),
        btnToggleDrawer: get('btnToggleDrawer'),
        btnCloseDrawer: get('btnCloseDrawer'),
        drawerBackdrop: get('drawerBackdrop'),
        chapterDrawer: get('chapterDrawer'),
        drawerChapterList: get('drawerChapterList'),
        continueReadingBox: get('continueReadingBox'),
        continueProgressPill: get('continueProgressPill'),
        startBtnLabel: get('startBtnLabel'),
        btnShareStory: get('btnShareStory'),
        btnOpenSettings: get('btnOpenSettings'),
        btnReaderSettings: get('btnReaderSettings'),
        btnCloseSettings: get('btnCloseSettings'),
        settingsModal: get('settingsModal'),
        btnClearCache: get('btnClearCache'),
        btnClearProgress: get('btnClearProgress')
      };

      // Ensure ambient drift layer exists inside .reader-body
      const readerBody = document.querySelector('.reader-body');
      if (readerBody && !readerBody.querySelector('.reader-ambient-drift')) {
        const drift = document.createElement('div');
        drift.className = 'reader-ambient-drift';
        drift.setAttribute('aria-hidden', 'true');
        readerBody.insertBefore(drift, readerBody.firstChild);
      }
    }

    bindEvents() {
      const el = this.elements;

      if (el.btnStartReading) {
        el.btnStartReading.addEventListener('click', () => this.startFromBeginning());
      }
      if (el.btnContinueReading) {
        el.btnContinueReading.addEventListener('click', () => this.continueReading());
      }
      if (el.btnCloseModal) {
        el.btnCloseModal.addEventListener('click', () => this.closeReaderModal());
      }
      if (el.btnToggleDrawer) {
        el.btnToggleDrawer.addEventListener('click', () => this.toggleDrawer());
      }
      if (el.btnCloseDrawer) {
        el.btnCloseDrawer.addEventListener('click', () => this.closeDrawer());
      }
      if (el.drawerBackdrop) {
        el.drawerBackdrop.addEventListener('click', () => this.closeDrawer());
      }
      if (el.btnPrevChap) {
        el.btnPrevChap.addEventListener('click', () => this.navigateChapter(-1));
      }
      if (el.btnNextChap) {
        el.btnNextChap.addEventListener('click', () => this.navigateChapter(1));
      }
      if (el.readingArea) {
        el.readingArea.addEventListener('scroll', () => this.handleThrottledScroll());
      }
      if (el.btnShareStory) {
        el.btnShareStory.addEventListener('click', () => this.shareStory());
      }

      // Settings Modal Events
      if (el.btnOpenSettings) {
        el.btnOpenSettings.addEventListener('click', () => this.openSettingsModal());
      }
      if (el.btnReaderSettings) {
        el.btnReaderSettings.addEventListener('click', () => this.openSettingsModal());
      }
      if (el.btnCloseSettings) {
        el.btnCloseSettings.addEventListener('click', () => this.closeSettingsModal());
      }
      if (el.settingsModal) {
        el.settingsModal.addEventListener('click', (e) => {
          if (e.target === el.settingsModal) this.closeSettingsModal();
        });
      }
      if (el.btnClearCache) {
        el.btnClearCache.addEventListener('click', () => this.clearCache());
      }
      if (el.btnClearProgress) {
        el.btnClearProgress.addEventListener('click', () => this.clearProgress());
      }

      // Global Keydown (Escape, Arrow navigation)
      document.addEventListener('keydown', (e) => this.handleKeydown(e));
    }

    startFromBeginning() {
      this.currentIndex = 0;
      this.restoreScrollPercent = 0;
      this.openReaderModal();
    }

    continueReading() {
      const saved = window.LiteraryStorage.ProgressStorage.get(this.storageKey);
      if (saved && saved.index >= 0 && saved.index < this.chapters.length) {
        this.currentIndex = saved.index;
        this.restoreScrollPercent = saved.scrollPercent || 0;
      } else {
        this.currentIndex = 0;
        this.restoreScrollPercent = 0;
      }
      this.openReaderModal();
    }

    openReaderModal() {
      if (!this.elements.readerModal) return;
      this.elements.readerModal.classList.add('active');
      document.body.style.overflow = 'hidden';

      // Pause canvas motion while actively reading for maximum battery/frame efficiency
      if (window.LiteraryMotion && window.LiteraryMotion.pauseReadingAtmosphere) {
        window.LiteraryMotion.pauseReadingAtmosphere(true);
      }

      this.loadChapter(this.currentIndex, true);
    }

    closeReaderModal() {
      if (!this.elements.readerModal) return;
      this.elements.readerModal.classList.remove('active');
      document.body.style.overflow = '';
      this.closeDrawer();

      // Resume atmospheric canvas
      if (window.LiteraryMotion && window.LiteraryMotion.pauseReadingAtmosphere) {
        window.LiteraryMotion.pauseReadingAtmosphere(false);
      }

      // Clean hash without causing jump
      if (window.location.hash) {
        history.replaceState(null, document.title, window.location.pathname + window.location.search);
      }

      this.checkSavedProgress();
    }

    async loadChapter(index, shouldRestoreScroll = false) {
      if (index < 0 || index >= this.chapters.length) return;
      this.currentIndex = index;
      const chapter = this.chapters[index];

      // Update Header Title
      if (this.elements.headerChapTitle) {
        this.elements.headerChapTitle.textContent = chapter.defaultTitle || `Chapter ${chapter.id}`;
      }

      // Update Navigation Indicators
      if (this.elements.progressIndicator) {
        if (this.chapters.length === 1) {
          this.elements.progressIndicator.textContent = 'Complete Standalone Tale';
        } else {
          this.elements.progressIndicator.textContent = `${chapter.isSpecial ? 'Special' : 'Chapter ' + (index + 1)} / ${this.chapters.length}`;
        }
      }

      if (this.elements.btnPrevChap) {
        this.elements.btnPrevChap.disabled = (index === 0);
      }
      if (this.elements.btnNextChap) {
        this.elements.btnNextChap.disabled = (index === this.chapters.length - 1);
      }

      // Update Drawer Selection
      if (this.hasDrawer && this.elements.drawerChapterList) {
        const items = this.elements.drawerChapterList.querySelectorAll('.drawer-item');
        items.forEach((item, idx) => {
          item.classList.toggle('active', idx === index);
        });
      }

      // Display Loading State
      if (this.elements.renderedContent) {
        this.elements.renderedContent.innerHTML = `
          <div class="state-container">
            <div class="loading-spinner"></div>
            <p>Loading words...</p>
          </div>
        `;
      }

      try {
        let markdown = this.memoryCache[chapter.file];

        if (!markdown) {
          markdown = await this.cacheStore.get(chapter.file);
          if (markdown) this.memoryCache[chapter.file] = markdown;
        }

        if (!markdown) {
          const res = await fetch(chapter.file);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          markdown = await res.text();

          this.memoryCache[chapter.file] = markdown;
          await this.cacheStore.set(chapter.file, markdown);
        }

        this.renderChapterMarkdown(markdown, shouldRestoreScroll);
      } catch (err) {
        console.error('[LiteraryReader] Failed to load chapter:', err);
        if (this.elements.renderedContent) {
          this.elements.renderedContent.innerHTML = `
            <div class="state-container">
              <p>Unable to load this chapter.</p>
              <button class="btn-retry" id="btnRetryLoad">Retry</button>
            </div>
          `;
          const btnRetry = document.getElementById('btnRetryLoad');
          if (btnRetry) {
            btnRetry.addEventListener('click', () => this.loadChapter(index, shouldRestoreScroll));
          }
        }
      }
    }

    renderChapterMarkdown(markdown, shouldRestoreScroll) {
      if (!this.elements.renderedContent) return;

      if (typeof window.marked !== 'undefined' && window.marked.parse) {
        this.elements.renderedContent.innerHTML = window.marked.parse(markdown);
      } else {
        this.elements.renderedContent.textContent = markdown;
      }

      // Scroll Position Restoration
      requestAnimationFrame(() => {
        if (this.elements.readingArea) {
          if (shouldRestoreScroll && this.restoreScrollPercent > 0) {
            const maxScroll = this.elements.readingArea.scrollHeight - this.elements.readingArea.clientHeight;
            this.elements.readingArea.scrollTop = maxScroll * this.restoreScrollPercent;
            this.restoreScrollPercent = 0;
          } else {
            this.elements.readingArea.scrollTop = 0;
          }
        }
      });
    }

    navigateChapter(delta) {
      const newIdx = this.currentIndex + delta;
      if (newIdx >= 0 && newIdx < this.chapters.length) {
        this.restoreScrollPercent = 0;
        this.loadChapter(newIdx, false);
      }
    }

    handleThrottledScroll() {
      if (this.scrollSaveTimeout) return;

      this.scrollSaveTimeout = setTimeout(() => {
        this.scrollSaveTimeout = null;
        const area = this.elements.readingArea;
        if (!area) return;

        const maxScroll = area.scrollHeight - area.clientHeight;
        const scrollPct = maxScroll > 0 ? area.scrollTop / maxScroll : 0;

        // Persist Progress
        const payload = {
          index: this.currentIndex,
          file: this.chapters[this.currentIndex] ? this.chapters[this.currentIndex].file : '',
          scrollPercent: scrollPct,
          timestamp: Date.now()
        };
        window.LiteraryStorage.ProgressStorage.set(this.storageKey, payload);

        // Update progress pill on landing page
        this.updateProgressPill(this.currentIndex, scrollPct);
      }, 250);
    }

    updateProgressPill(index, scrollPct) {
      if (!this.elements.continueProgressPill) return;
      const pctDisplay = Math.round(scrollPct * 100);
      const chap = this.chapters[index];
      if (chap) {
        if (this.chapters.length === 1) {
          this.elements.continueProgressPill.textContent = `Reading • ${pctDisplay}% completed`;
        } else {
          this.elements.continueProgressPill.textContent = `${chap.isSpecial ? 'Special' : 'Chapter ' + (index + 1)} • ${pctDisplay}% read`;
        }
      }
    }

    checkSavedProgress() {
      const saved = window.LiteraryStorage.ProgressStorage.get(this.storageKey);
      if (saved && saved.index >= 0 && saved.index < this.chapters.length) {
        if (this.elements.continueReadingBox) this.elements.continueReadingBox.style.display = 'flex';
        this.updateProgressPill(saved.index, saved.scrollPercent || 0);
        if (this.elements.startBtnLabel) this.elements.startBtnLabel.textContent = 'Start From Beginning';
      } else {
        if (this.elements.continueReadingBox) this.elements.continueReadingBox.style.display = 'none';
        if (this.elements.startBtnLabel) this.elements.startBtnLabel.textContent = 'Start Reading';
      }
    }

    // Drawer Methods
    toggleDrawer() {
      if (!this.elements.chapterDrawer) return;
      const isOpen = this.elements.chapterDrawer.classList.contains('open');
      if (isOpen) {
        this.closeDrawer();
      } else {
        this.elements.chapterDrawer.classList.add('open');
        if (this.elements.drawerBackdrop) this.elements.drawerBackdrop.classList.add('active');
      }
    }

    closeDrawer() {
      if (this.elements.chapterDrawer) this.elements.chapterDrawer.classList.remove('open');
      if (this.elements.drawerBackdrop) this.elements.drawerBackdrop.classList.remove('active');
    }

    renderDrawerList() {
      if (!this.hasDrawer || !this.elements.drawerChapterList) return;
      this.elements.drawerChapterList.innerHTML = '';

      this.chapters.forEach((chap, idx) => {
        const item = document.createElement('div');
        item.className = `drawer-item ${idx === this.currentIndex ? 'active' : ''}`;
        item.textContent = chap.defaultTitle || `Chapter ${chap.id}`;
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');

        item.addEventListener('click', () => {
          this.restoreScrollPercent = 0;
          this.loadChapter(idx, false);
          this.closeDrawer();
        });

        item.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            item.click();
          }
        });

        this.elements.drawerChapterList.appendChild(item);
      });
    }

    // Settings Modal
    openSettingsModal() {
      if (this.elements.settingsModal) {
        this.elements.settingsModal.classList.add('active');
      }
    }

    closeSettingsModal() {
      if (this.elements.settingsModal) {
        this.elements.settingsModal.classList.remove('active');
      }
    }

    async clearCache() {
      this.memoryCache = {};
      await this.cacheStore.clear();

      if (this.elements.btnClearCache) {
        const orig = this.elements.btnClearCache.innerHTML;
        this.elements.btnClearCache.innerHTML = '<i class="fa-solid fa-check"></i> Cache Cleared';
        setTimeout(() => {
          this.elements.btnClearCache.innerHTML = orig;
        }, 2000);
      }
    }

    clearProgress() {
      window.LiteraryStorage.ProgressStorage.remove(this.storageKey);
      this.checkSavedProgress();

      if (this.elements.btnClearProgress) {
        const orig = this.elements.btnClearProgress.innerHTML;
        this.elements.btnClearProgress.innerHTML = '<i class="fa-solid fa-check"></i> Reset Complete';
        setTimeout(() => {
          this.elements.btnClearProgress.innerHTML = orig;
        }, 2000);
      }
    }

    // Reading Comfort & Typography
    initTypographyComfort() {
      const saved = window.LiteraryStorage.ProgressStorage.get(this.typographyKey) || {
        fontSize: 'default',
        lineHeight: 'standard'
      };

      this.applyTypographySettings(saved.fontSize, saved.lineHeight);

      // Font size pills
      document.querySelectorAll('.btn-option-pill[data-font-size]').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.fontSize === saved.fontSize);
        btn.addEventListener('click', () => {
          document.querySelectorAll('.btn-option-pill[data-font-size]').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          saved.fontSize = btn.dataset.fontSize;
          window.LiteraryStorage.ProgressStorage.set(this.typographyKey, saved);
          this.applyTypographySettings(saved.fontSize, saved.lineHeight);
        });
      });

      // Line height pills
      document.querySelectorAll('.btn-option-pill[data-line-height]').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.lineHeight === saved.lineHeight);
        btn.addEventListener('click', () => {
          document.querySelectorAll('.btn-option-pill[data-line-height]').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          saved.lineHeight = btn.dataset.lineHeight;
          window.LiteraryStorage.ProgressStorage.set(this.typographyKey, saved);
          this.applyTypographySettings(saved.fontSize, saved.lineHeight);
        });
      });
    }

    applyTypographySettings(fontSize, lineHeight) {
      const root = document.documentElement;

      if (fontSize === 'compact') {
        root.style.setProperty('--reader-font-size', 'clamp(1rem, 3.2vw, 1.15rem)');
      } else if (fontSize === 'large') {
        root.style.setProperty('--reader-font-size', 'clamp(1.22rem, 4.2vw, 1.45rem)');
      } else {
        root.style.setProperty('--reader-font-size', 'clamp(1.12rem, 3.6vw, 1.28rem)');
      }

      if (lineHeight === 'relaxed') {
        root.style.setProperty('--reader-line-height', '2.05');
        root.style.setProperty('--reader-paragraph-gap', 'clamp(22px, 4.5vw, 32px)');
      } else {
        root.style.setProperty('--reader-line-height', '1.8');
        root.style.setProperty('--reader-paragraph-gap', 'clamp(18px, 3.5vw, 24px)');
      }
    }

    // Web Share API
    async shareStory() {
      const shareData = {
        title: this.storyTitle,
        text: `Read "${this.storyTitle}" on The Literary Room.`,
        url: window.location.href
      };

      if (navigator.share) {
        try {
          await navigator.share(shareData);
          return;
        } catch (e) {
          // Fall back to clipboard if user dismissed or error
        }
      }

      if (navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(window.location.href);
          this.showToast('Story link copied to clipboard!');
        } catch (e) {
          this.showToast('Unable to copy link.');
        }
      }
    }

    showToast(message) {
      const toast = document.createElement('div');
      toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: #1C2430;
        color: #FFFFFF;
        padding: 10px 20px;
        border-radius: 999px;
        font-family: var(--font-sans, sans-serif);
        font-size: 0.88rem;
        font-weight: 600;
        z-index: 3000;
        box-shadow: 0 6px 20px rgba(0,0,0,0.25);
        opacity: 0;
        transition: opacity 0.25s ease;
      `;
      toast.textContent = message;
      document.body.appendChild(toast);

      requestAnimationFrame(() => { toast.style.opacity = '1'; });
      setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 250);
      }, 2400);
    }

    // Keyboard navigation
    handleKeydown(e) {
      // Escape key closes modals in order of priority
      if (e.key === 'Escape') {
        if (this.elements.settingsModal && this.elements.settingsModal.classList.contains('active')) {
          this.closeSettingsModal();
          return;
        }
        if (this.elements.chapterDrawer && this.elements.chapterDrawer.classList.contains('open')) {
          this.closeDrawer();
          return;
        }
        if (this.elements.readerModal && this.elements.readerModal.classList.contains('active')) {
          this.closeReaderModal();
          return;
        }
      }

      // Arrow navigation when reader modal is active
      if (this.elements.readerModal && this.elements.readerModal.classList.contains('active')) {
        if (e.key === 'ArrowLeft') {
          this.navigateChapter(-1);
        } else if (e.key === 'ArrowRight') {
          this.navigateChapter(1);
        }
      }
    }

    // Hash deep linking
    handleHashRouting() {
      const hash = window.location.hash.toLowerCase();
      if (!hash) return;

      if (hash === '#toc' && this.hasDrawer) {
        this.openReaderModal();
        this.toggleDrawer();
        return;
      }

      if (hash === '#reader' || hash === '#read') {
        this.openReaderModal();
        return;
      }

      const match = hash.match(/^#chapter-(\d+)$/);
      if (match) {
        const chapNum = parseInt(match[1], 10);
        const targetIdx = chapNum - 1;
        if (targetIdx >= 0 && targetIdx < this.chapters.length) {
          this.currentIndex = targetIdx;
          this.restoreScrollPercent = 0;
          this.openReaderModal();
        }
      }
    }
  }

  // Expose global LiteraryReader
  window.LiteraryReader = LiteraryReader;

})(window);
