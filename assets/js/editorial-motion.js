/**
 * ============================================================================
 * Minimalist Editorial Cutouts & GSAP Passive Animation Controller
 * Branch: feature/minimalist-editorial
 * ============================================================================
 */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion || typeof gsap === 'undefined') return;

  document.addEventListener('DOMContentLoaded', initEditorialMotion);

  function initEditorialMotion() {
    initPassiveFloat();
    initMouseParallax();
    initMagneticButtons();
    initScrollInteractions();
  }

  function initPassiveFloat() {
    const items = document.querySelectorAll('[data-editorial-float]');
    items.forEach((item, index) => {
      const speed = parseFloat(item.dataset.speed) || (4.5 + (index % 3) * 1.2);
      const dy = parseFloat(item.dataset.dy) || (12 + (index % 2) * 8);
      const rot = parseFloat(item.dataset.rot) || (1.5 + (index % 2) * 2);

      gsap.to(item, {
        y: `+=${dy}`,
        rotation: `+=${rot}`,
        duration: speed,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: index * 0.3
      });
    });
  }

  function initMouseParallax() {
    if (window.innerWidth < 1024) return;

    const sections = document.querySelectorAll('.editorial-hero, .landing-card');
    sections.forEach(sec => {
      const parallaxItems = sec.querySelectorAll('[data-parallax-depth]');
      if (!parallaxItems.length) return;

      const setters = Array.from(parallaxItems).map(el => ({
        x: gsap.quickTo(el, 'x', { duration: 1.4, ease: 'power2.out' }),
        y: gsap.quickTo(el, 'y', { duration: 1.4, ease: 'power2.out' }),
        depth: parseFloat(el.dataset.parallaxDepth) || 20
      }));

      window.addEventListener('mousemove', (e) => {
        const normX = (e.clientX / window.innerWidth - 0.5) * 2;
        const normY = (e.clientY / window.innerHeight - 0.5) * 2;

        setters.forEach(s => {
          s.x(normX * s.depth);
          s.y(normY * s.depth);
        });
      }, { passive: true });
    });
  }

  function initMagneticButtons() {
    const magnetics = document.querySelectorAll('.btn-hero-primary, .btn-hero-secondary, .btn-start-reading, .theme-toggle');
    magnetics.forEach(btn => {
      const xTo = gsap.quickTo(btn, 'x', { duration: 0.35, ease: 'power2.out' });
      const yTo = gsap.quickTo(btn, 'y', { duration: 0.35, ease: 'power2.out' });

      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const relX = e.clientX - (rect.left + rect.width / 2);
        const relY = e.clientY - (rect.top + rect.height / 2);
        xTo(relX * 0.22);
        yTo(relY * 0.22);
      });

      btn.addEventListener('mouseleave', () => {
        xTo(0);
        yTo(0);
      });
    });
  }

  function initScrollInteractions() {
    if (typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    const rotators = document.querySelectorAll('[data-scroll-rotate]');
    rotators.forEach(item => {
      gsap.to(item, {
        scrollTrigger: {
          trigger: item,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.5
        },
        rotation: item.dataset.scrollRotate || 45,
        ease: 'none'
      });
    });
  }

})();
