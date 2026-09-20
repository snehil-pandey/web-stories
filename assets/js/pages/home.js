/**
 * ============================================================================
 * The Literary Room — Homepage Story Catalog Micro-Engine
 * File: assets/js/pages/home.js
 * Search and category filtering with fluid card transitions.
 * ============================================================================
 */

(function (window) {
  'use strict';

  function initHomeCatalog() {
    const filterPills = document.querySelectorAll('.filter-pill');
    const searchInput = document.getElementById('storySearch');
    const cards = document.querySelectorAll('.story-card');
    const noResultsMsg = document.getElementById('noResultsMsg');

    if (!cards.length) return;

    let activeFilter = 'all';
    let searchQuery = '';

    function applyFilters() {
      let visibleCount = 0;

      cards.forEach((card) => {
        const matchesCategory =
          activeFilter === 'all' ||
          (activeFilter === 'completed' && card.dataset.status === 'completed') ||
          (activeFilter === 'ongoing' && card.dataset.status === 'ongoing') ||
          (activeFilter === 'romance' && (card.dataset.genre || '').includes('romance')) ||
          (activeFilter === 'mystery' && (card.dataset.genre || '').includes('mystery'));

        const searchableText = (card.dataset.search || '').toLowerCase();
        const matchesSearch = !searchQuery || searchableText.includes(searchQuery);

        if (matchesCategory && matchesSearch) {
          card.style.display = 'grid';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });

      if (noResultsMsg) {
        noResultsMsg.style.display = visibleCount === 0 ? 'block' : 'none';
      }

      if (window.LiteraryMotion && window.LiteraryMotion.animateFilteredCards) {
        window.LiteraryMotion.animateFilteredCards(cards);
      }
    }

    filterPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        filterPills.forEach((p) => {
          p.classList.remove('active');
          p.setAttribute('aria-selected', 'false');
        });
        pill.classList.add('active');
        pill.setAttribute('aria-selected', 'true');

        activeFilter = pill.getAttribute('data-filter') || 'all';
        applyFilters();
      });
    });

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        applyFilters();
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Dynamic copyright year
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Initialize navigation
    if (window.LiteraryNav) {
      window.LiteraryNav.init();
    }

    // Initialize catalog filtering
    initHomeCatalog();

    // Initialize motion engine
    if (window.LiteraryMotion) {
      window.LiteraryMotion.init();
    }
  });

})(window);
