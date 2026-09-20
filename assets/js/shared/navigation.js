/**
 * ============================================================================
 * The Literary Room — Navigation Menu Controller
 * File: assets/js/shared/navigation.js
 * Mobile navigation toggle, outside click dismissal, and keyboard accessibility.
 * ============================================================================
 */

(function (window) {
  'use strict';

  function initNavigation(options = {}) {
    const toggleBtn = document.querySelector(options.toggleBtnSelector || '#navToggleBtn');
    const navMenu = document.querySelector(options.navMenuSelector || '#primaryNav');

    if (!toggleBtn || !navMenu) return;

    function closeNav() {
      if (navMenu.classList.contains('open')) {
        navMenu.classList.remove('open');
        toggleBtn.setAttribute('aria-expanded', 'false');
        const icon = toggleBtn.querySelector('i');
        if (icon) icon.className = 'fa-solid fa-bars menu-icon';
      }
    }

    function toggleNav() {
      const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
      toggleBtn.setAttribute('aria-expanded', String(!isExpanded));
      navMenu.classList.toggle('open');
      const icon = toggleBtn.querySelector('i');
      if (icon) {
        icon.className = !isExpanded ? 'fa-solid fa-xmark menu-icon' : 'fa-solid fa-bars menu-icon';
      }
    }

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleNav();
    });

    // Close when a link inside the nav is clicked
    navMenu.querySelectorAll('.nav-link').forEach((link) => {
      link.addEventListener('click', () => closeNav());
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMenu.classList.contains('open')) {
        closeNav();
        toggleBtn.focus();
      }
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (navMenu.classList.contains('open') && !navMenu.contains(e.target) && !toggleBtn.contains(e.target)) {
        closeNav();
      }
    });
  }

  window.LiteraryNav = {
    init: initNavigation
  };

})(window);
