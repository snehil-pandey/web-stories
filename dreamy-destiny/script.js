/**
 * ============================================================================
 * Dreamy Destiny — Story Manifest & Application Engine
 * Palette: Muted Rose & Petals
 * Utilizes shared LiteraryReader and LiteraryStorage architecture.
 * ============================================================================
 */

(function () {
  'use strict';

  // Chapter Manifest Definitions
  const CHAPTERS = [
    { id: 1, file: 'dreamy_destiny_01.md', defaultTitle: 'Chapter 1: The Girl in the Apartment' },
    { id: 2, file: 'dreamy_destiny_02.md', defaultTitle: 'Chapter 2: Two Weeks' },
    { id: 3, file: 'dreamy_destiny_03.md', defaultTitle: 'Chapter 3: The Other Side of the Table' },
    { id: 4, file: 'dreamy_destiny_04.md', defaultTitle: 'Chapter 4: Domestic Debugging' },
    { id: 5, file: 'dreamy_destiny_05.md', defaultTitle: 'Chapter 5: Things She Notices' }
  ];

  document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Shared Theme Manager
    window.LiteraryTheme.init({
      storageKey: 'dreamy_destiny_theme',
      toggleSelector: '#themeToggle'
    });

    // 2. Initialize Shared Reader Engine
    window.readerEngine = new window.LiteraryReader({
      chapters: CHAPTERS,
      storageKey: 'dreamy_destiny_progress',
      dbName: 'DreamyDestinyDB',
      dbVersion: 2,
      storyTitle: 'Dreamy Destiny',
      atmosphere: 'petals',
      hasDrawer: true
    });
  });
})();
