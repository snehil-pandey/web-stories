/**
 * ============================================================================
 * How Do We Even Think? — Story Manifest & Application Engine
 * Palette: Midnight Twilight
 * Utilizes shared LiteraryReader and LiteraryStorage architecture.
 * ============================================================================
 */

(function () {
  'use strict';

  // Chapter Manifest (Single Standalone Chapter)
  const CHAPTERS = [
    { id: 1, file: 'how_do_we_even_think.md', defaultTitle: 'How Do We Even Think?' }
  ];

  document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Shared Theme Manager
    window.LiteraryTheme.init({
      storageKey: 'how_do_we_even_think_theme',
      toggleSelector: '#themeToggle'
    });

    // 2. Initialize Shared Reader Engine
    window.readerEngine = new window.LiteraryReader({
      chapters: CHAPTERS,
      storageKey: 'how_do_we_even_think_progress',
      dbName: 'HowDoWeEvenThinkDB',
      dbVersion: 1,
      storyTitle: 'How Do We Even Think?',
      atmosphere: 'twilight',
      hasDrawer: false
    });
  });
})();
