/**
 * ============================================================================
 * The Literary Room — Universal Theme Manager
 * File: assets/js/core/theme.js
 * Dark/Light theme switching, system preference detection, and UI sync.
 * ============================================================================
 */

(function (window) {
  'use strict';

  class ThemeManager {
    constructor(options = {}) {
      this.storageKey = options.storageKey || 'theme_mode';
      this.toggleSelector = options.toggleSelector || '#themeToggle';
      this.init();
    }

    init() {
      const savedTheme = localStorage.getItem(this.storageKey);
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);

      this.applyTheme(isDark, false);

      const toggleBtn = document.querySelector(this.toggleSelector);
      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => this.toggleTheme());
      }

      // Listen for OS system theme changes
      if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
          if (!localStorage.getItem(this.storageKey)) {
            this.applyTheme(e.matches, true);
          }
        });
      }
    }

    isDark() {
      return document.documentElement.classList.contains('dark-mode') ||
             document.body.classList.contains('dark-mode');
    }

    toggleTheme() {
      this.applyTheme(!this.isDark(), true);
    }

    applyTheme(isDark, persist = true) {
      if (isDark) {
        document.documentElement.classList.add('dark-mode');
        document.body.classList.add('dark-mode');
        if (persist) localStorage.setItem(this.storageKey, 'dark');
      } else {
        document.documentElement.classList.remove('dark-mode');
        document.body.classList.remove('dark-mode');
        if (persist) localStorage.setItem(this.storageKey, 'light');
      }

      this.updateToggleUI(isDark);

      // Dispatch custom event for canvas/motion atmosphere re-tinting
      window.dispatchEvent(new CustomEvent('literary:themechange', {
        detail: { isDark }
      }));
    }

    updateToggleUI(isDark) {
      const toggleBtn = document.querySelector(this.toggleSelector);
      if (!toggleBtn) return;

      const icon = toggleBtn.querySelector('i');
      if (icon) {
        icon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
      }

      const textSpan = toggleBtn.querySelector('span');
      if (textSpan) {
        textSpan.textContent = isDark ? 'Light Mode' : 'Dark Mode';
      }

      toggleBtn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    }
  }

  // Expose global ThemeManager
  window.LiteraryTheme = {
    ThemeManager,
    init: (options) => new ThemeManager(options)
  };

})(window);
