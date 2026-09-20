/**
 * ============================================================================
 * The Literary Room — Advanced Animation & Motion Design System
 * File: assets/motion/motion.js
 * 
 * Cinematic, performant, accessible motion architecture for literary reading.
 * Responsive motion profiles, lifecycle management, and reading-first comfort.
 * 
 * Attributions & Licenses:
 * - GreenSock GSAP 3 & ScrollTrigger: Standard GreenSock Web License.
 *   CDN: cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js
 * - 2.5D Canvas Particle Kinematics: MIT License.
 *   Inspired by classical harmonic motion & leaf/petal dynamics (Colin Horn / Hakim El Hattab).
 * - Core Animation System: Pure Vanilla JS / GPU-accelerated CSS.
 * ============================================================================
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.LiteraryMotion = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Check user preferences & hardware profiles
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isTouchDevice = window.matchMedia('(hover: none) or (pointer: coarse)').matches;

  function getMotionProfile() {
    if (prefersReducedMotion.matches) return 'reduced';
    const width = window.innerWidth;
    const isLowPower = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
    if (width < 640) return isLowPower ? 'mobile-minimal' : 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  // ==========================================================================
  // 1. Atmospheric Canvas Engine (Drifting Petals & Twilight Stars)
  // ==========================================================================
  class AtmosphereEngine {
    constructor() {
      this.canvas = null;
      this.ctx = null;
      this.particles = [];
      this.theme = 'none';
      this.isRunning = false;
      this.isPausedForReading = false;
      this.rafId = null;
      this.lastTime = 0;
      this.width = 0;
      this.height = 0;
      this.customRenderers = {};

      this.handleResize = this.handleResize.bind(this);
      this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
      this.tick = this.tick.bind(this);
    }

    init(defaultTheme = 'none') {
      if (prefersReducedMotion.matches) return;

      this.theme = defaultTheme;
      if (this.theme === 'none') return;

      this.createCanvas();
      this.handleResize();
      this.initParticles();

      window.addEventListener('resize', this.handleResize, { passive: true });
      document.addEventListener('visibilitychange', this.handleVisibilityChange);

      this.start();
    }

    createCanvas() {
      if (document.getElementById('atmosphereCanvas')) {
        this.canvas = document.getElementById('atmosphereCanvas');
      } else {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'atmosphereCanvas';
        this.canvas.className = 'atmosphere-canvas';
        this.canvas.setAttribute('aria-hidden', 'true');
        document.body.prepend(this.canvas);
      }
      this.ctx = this.canvas.getContext('2d');
    }

    handleResize() {
      if (!this.canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.canvas.width = this.width * dpr;
      this.canvas.height = this.height * dpr;
      this.canvas.style.width = `${this.width}px`;
      this.canvas.style.height = `${this.height}px`;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Re-profile particles if viewport changed significantly
      if (this.isRunning) {
        this.initParticles();
      }
    }

    handleVisibilityChange() {
      if (document.hidden) {
        this.stop();
      } else if (!this.isPausedForReading && this.theme !== 'none') {
        this.start();
      }
    }

    registerRenderer(themeName, particleFactory, updateDrawFn) {
      this.customRenderers[themeName] = { factory: particleFactory, render: updateDrawFn };
    }

    setTheme(newTheme) {
      if (prefersReducedMotion.matches) return;
      this.theme = newTheme;
      if (newTheme === 'none') {
        this.stop();
        if (this.canvas) {
          this.canvas.classList.add('hidden');
          if (this.ctx) this.ctx.clearRect(0, 0, this.width, this.height);
        }
      } else {
        if (!this.canvas) this.createCanvas();
        this.canvas.classList.remove('hidden');
        this.handleResize();
        this.initParticles();
        this.start();
      }
    }

    initParticles() {
      this.particles = [];
      const profile = getMotionProfile();
      if (profile === 'reduced' || profile === 'mobile-minimal') return;

      if (this.theme === 'petals') {
        // Dynamic counts based on responsive profile: 16 (desktop) -> 10 (tablet) -> 6 (mobile)
        let count = 16;
        if (profile === 'tablet') count = 10;
        else if (profile === 'mobile') count = 6;

        for (let i = 0; i < count; i++) {
          this.particles.push({
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            size: 10 + Math.random() * 8,
            speedY: 0.45 + Math.random() * 0.65,
            speedX: -0.2 + Math.random() * 0.4,
            swayAmp: 20 + Math.random() * 30,
            swayFreq: 0.0012 + Math.random() * 0.0014,
            phase: Math.random() * Math.PI * 2,
            rotZ: Math.random() * Math.PI * 2,
            rotZSpeed: (Math.random() - 0.5) * 0.01,
            tilt: Math.random() * Math.PI,
            tiltSpeed: 0.014 + Math.random() * 0.018,
            color: Math.random() > 0.4 ? 'rgba(228, 142, 150, ' : 'rgba(214, 122, 131, ',
            alpha: 0.32 + Math.random() * 0.24
          });
        }
      } else if (this.theme === 'twilight') {
        // Dynamic starlight counts: 24 (desktop) -> 16 (tablet) -> 8 (mobile)
        let count = 24;
        if (profile === 'tablet') count = 16;
        else if (profile === 'mobile') count = 8;

        for (let i = 0; i < count; i++) {
          this.particles.push({
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            radius: 0.8 + Math.random() * 1.4,
            baseAlpha: 0.2 + Math.random() * 0.32,
            pulseFreq: 0.0015 + Math.random() * 0.0022,
            phase: Math.random() * Math.PI * 2,
            driftX: (Math.random() - 0.5) * 0.1,
            driftY: (Math.random() - 0.5) * 0.06,
            colorType: Math.random() > 0.3 ? 'starlight' : 'gold'
          });
        }
      } else if (this.customRenderers[this.theme]) {
        this.particles = this.customRenderers[this.theme].factory(this.width, this.height, profile);
      }
    }

    start() {
      if (this.isRunning || prefersReducedMotion.matches || this.theme === 'none') return;
      this.isRunning = true;
      this.lastTime = performance.now();
      this.rafId = requestAnimationFrame(this.tick);
    }

    stop() {
      this.isRunning = false;
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    }

    pauseForReading() {
      this.isPausedForReading = true;
      this.stop();
      if (this.canvas) {
        this.canvas.classList.add('dimmed');
        if (this.ctx) {
          this.ctx.clearRect(0, 0, this.width, this.height);
        }
      }
    }

    resumeFromReading() {
      this.isPausedForReading = false;
      if (this.canvas) {
        this.canvas.classList.remove('dimmed');
      }
      if (this.theme !== 'none') {
        this.start();
      }
    }

    destroy() {
      this.stop();
      window.removeEventListener('resize', this.handleResize);
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      if (this.canvas && this.canvas.parentNode) {
        this.canvas.parentNode.removeChild(this.canvas);
      }
      this.particles = [];
      this.canvas = null;
      this.ctx = null;
    }

    tick(now) {
      if (!this.isRunning) return;

      const dt = Math.min(now - this.lastTime, 40);
      this.lastTime = now;

      this.ctx.clearRect(0, 0, this.width, this.height);

      if (this.theme === 'petals') {
        this.renderPetals(now);
      } else if (this.theme === 'twilight') {
        this.renderTwilight(now);
      } else if (this.customRenderers[this.theme]) {
        this.customRenderers[this.theme].render(this.ctx, this.particles, now, dt, this.width, this.height);
      }

      this.rafId = requestAnimationFrame(this.tick);
    }

    renderPetals(now) {
      const ctx = this.ctx;
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];

        p.y += p.speedY;
        p.x += Math.sin(now * p.swayFreq + p.phase) * 0.65 + p.speedX;
        p.rotZ += p.rotZSpeed;
        p.tilt += p.tiltSpeed;

        if (p.y > this.height + 25) {
          p.y = -20;
          p.x = Math.random() * this.width;
        }
        if (p.x < -30) p.x = this.width + 20;
        if (p.x > this.width + 30) p.x = -20;

        const scaleX = Math.cos(p.tilt);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotZ);
        ctx.scale(Math.abs(scaleX), 1);

        ctx.fillStyle = `${p.color}${p.alpha})`;
        ctx.beginPath();
        ctx.moveTo(0, -p.size * 0.5);
        ctx.bezierCurveTo(p.size * 0.45, -p.size * 0.4, p.size * 0.5, p.size * 0.3, 0, p.size * 0.5);
        ctx.bezierCurveTo(-p.size * 0.5, p.size * 0.3, -p.size * 0.45, -p.size * 0.4, 0, -p.size * 0.5);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }
    }

    renderTwilight(now) {
      const ctx = this.ctx;
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];

        p.x += p.driftX;
        p.y += p.driftY;

        if (p.x < 0) p.x = this.width;
        if (p.x > this.width) p.x = 0;
        if (p.y < 0) p.y = this.height;
        if (p.y > this.height) p.y = 0;

        const alpha = Math.max(0.08, Math.min(0.85, p.baseAlpha + Math.sin(now * p.pulseFreq + p.phase) * 0.28));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        if (p.colorType === 'gold') {
          ctx.fillStyle = `rgba(240, 220, 175, ${alpha})`;
        } else {
          ctx.fillStyle = `rgba(185, 205, 250, ${alpha})`;
        }
        ctx.fill();
      }
    }
  }

  // ==========================================================================
  // 2. Signature Literary Homepage Hero Motion
  // ==========================================================================
  class HeroMotion {
    static init() {
      if (prefersReducedMotion.matches) return;

      HeroMotion.initHeadlineReveal();
      HeroMotion.initHeroElements();
      HeroMotion.initBookPerspective();
    }

    static initHeadlineReveal() {
      const headline = document.querySelector('[data-motion-hero-headline]');
      if (!headline) return;

      let wordIndex = 0;
      function processNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent;
          const words = text.split(/(\s+)/);
          const fragment = document.createDocumentFragment();
          words.forEach(word => {
            if (!word) return;
            if (/^\s+$/.test(word)) {
              fragment.appendChild(document.createTextNode(word));
            } else {
              const wrap = document.createElement('span');
              wrap.className = 'reveal-word';
              const inner = document.createElement('span');
              inner.className = 'reveal-word-inner';
              inner.textContent = word;
              inner.style.transitionDelay = `${wordIndex * 50 + 80}ms`;
              wordIndex++;
              wrap.appendChild(inner);
              fragment.appendChild(wrap);
            }
          });
          return fragment;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const clone = node.cloneNode(false);
          Array.from(node.childNodes).forEach(child => {
            const processed = processNode(child);
            if (processed) clone.appendChild(processed);
          });
          return clone;
        }
        return node.cloneNode(true);
      }

      const fragment = document.createDocumentFragment();
      Array.from(headline.childNodes).forEach(child => {
        const res = processNode(child);
        if (res) fragment.appendChild(res);
      });
      headline.innerHTML = '';
      headline.appendChild(fragment);
      headline.classList.add('hero-headline');

      requestAnimationFrame(() => {
        headline.classList.add('revealed');
      });
    }

    static initHeroElements() {
      const badge = document.querySelector('.hero-badge');
      if (badge) {
        badge.classList.add('hero-badge-animated');
        requestAnimationFrame(() => badge.classList.add('revealed'));
      }

      const sub = document.querySelector('.hero-subheading');
      if (sub) {
        sub.classList.add('hero-subheading-animated');
        requestAnimationFrame(() => sub.classList.add('revealed'));
      }

      const actions = document.querySelector('.hero-actions');
      if (actions) {
        actions.classList.add('hero-actions-animated');
        requestAnimationFrame(() => actions.classList.add('revealed'));
      }
    }

    static initBookPerspective() {
      if (isTouchDevice || prefersReducedMotion.matches || window.innerWidth < 768) return;

      const tiltTargets = document.querySelectorAll('[data-motion-book-tilt]');
      tiltTargets.forEach(card => {
        card.classList.add('book-tilt-target');

        const onMouseMove = (e) => {
          const rect = card.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width - 0.5;
          const y = (e.clientY - rect.top) / rect.height - 0.5;

          const rotateX = -y * 8;
          const rotateY = x * 10;

          card.style.transform = `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.015, 1.015, 1.015)`;
        };

        const onMouseLeave = () => {
          card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        };

        card.addEventListener('mousemove', onMouseMove);
        card.addEventListener('mouseleave', onMouseLeave);
      });
    }
  }

  // ==========================================================================
  // 3. Scroll-Triggered Reveals & Stagger Cascades
  // ==========================================================================
  class ScrollRevealEngine {
    static init() {
      if (prefersReducedMotion.matches) {
        document.querySelectorAll('[data-motion="reveal"], [data-motion-stagger] > *').forEach(el => {
          el.classList.add('is-revealed');
        });
        return;
      }

      // Check for GSAP and ScrollTrigger, else use robust native IntersectionObserver
      if (window.gsap && window.ScrollTrigger) {
        ScrollRevealEngine.initGSAP();
      } else {
        ScrollRevealEngine.initIntersectionObserver();
      }
    }

    static initGSAP() {
      gsap.registerPlugin(ScrollTrigger);

      gsap.utils.toArray('[data-motion="reveal"]').forEach(elem => {
        gsap.fromTo(elem, 
          { opacity: 0, y: 22 },
          {
            opacity: 1,
            y: 0,
            duration: 0.75,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: elem,
              start: 'top 90%',
              once: true
            }
          }
        );
      });

      document.querySelectorAll('[data-motion-stagger]').forEach(container => {
        const children = container.children;
        if (!children.length) return;

        gsap.fromTo(children,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.65,
            stagger: 0.07,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: container,
              start: 'top 88%',
              once: true
            }
          }
        );
      });
    }

    static initIntersectionObserver() {
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            obs.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -30px 0px'
      });

      document.querySelectorAll('[data-motion="reveal"]').forEach(el => observer.observe(el));

      const staggerObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const children = Array.from(entry.target.children);
            children.forEach((child, idx) => {
              setTimeout(() => {
                child.style.opacity = '1';
                child.style.transform = 'translate3d(0, 0, 0)';
              }, idx * 60);
            });
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08 });

      document.querySelectorAll('[data-motion-stagger]').forEach(el => staggerObserver.observe(el));
    }
  }

  // ==========================================================================
  // 4. Refined Chapter Opening Transitions & Decorative Flourish
  // ==========================================================================
  class ChapterTransitionEngine {
    static formatChapterHeader(titleText, chapterNumberText) {
      const numberLabel = chapterNumberText || 'Chapter Narrative';
      return `
        <div class="chapter-opening-header" aria-hidden="true">
          <span class="chapter-number-badge">${numberLabel}</span>
          <h1 class="chapter-title-serif">${titleText}</h1>
          <div class="ornamental-divider">
            <span class="divider-line"></span>
            <span class="divider-glyph">✦</span>
            <span class="divider-line"></span>
          </div>
        </div>
      `;
    }

    static triggerChapterReveal(contentElement) {
      if (!contentElement || prefersReducedMotion.matches) return;
      const readingArea = document.getElementById('readingArea');
      if (readingArea && readingArea.scrollTop > 0) {
        readingArea.scrollTop = 0;
      }
    }
  }

  // ==========================================================================
  // 5. Reusable Micro-Interactions & Reading Comfort Controls
  // ==========================================================================
  class MicroInteractions {
    static init() {
      MicroInteractions.initButtonSheen();
      MicroInteractions.initSmoothAccordions();
      MicroInteractions.initReadingComfort();
    }

    static initButtonSheen() {
      const primaryButtons = document.querySelectorAll('.btn-primary, .cta-btn, .btn-start, .btn-start-reading, [data-motion-sheen]');
      primaryButtons.forEach(btn => btn.classList.add('btn-sheen'));
    }

    static initSmoothAccordions() {
      const accordions = document.querySelectorAll('.story-details-accordion');
      accordions.forEach(details => {
        const summary = details.querySelector('summary');
        const content = details.querySelector('.details-content');
        if (!summary || !content) return;

        let isAnimating = false;

        summary.addEventListener('click', (e) => {
          if (prefersReducedMotion.matches) return;

          e.preventDefault();
          if (isAnimating) return;

          if (details.open) {
            isAnimating = true;
            const startHeight = content.offsetHeight;
            const animation = content.animate([
              { height: `${startHeight}px`, opacity: 1 },
              { height: '0px', opacity: 0 }
            ], {
              duration: 280,
              easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
            });

            animation.onfinish = () => {
              details.open = false;
              isAnimating = false;
            };
          } else {
            isAnimating = true;
            details.open = true;
            const endHeight = content.offsetHeight;
            const animation = content.animate([
              { height: '0px', opacity: 0 },
              { height: `${endHeight}px`, opacity: 1 }
            ], {
              duration: 320,
              easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
            });

            animation.onfinish = () => {
              isAnimating = false;
            };
          }
        });
      });
    }

    static triggerBookmarkPulse(element) {
      if (!element || prefersReducedMotion.matches) return;
      element.classList.remove('progress-pill-pulse');
      void element.offsetWidth;
      element.classList.add('progress-pill-pulse');
    }

    static initReadingComfort() {
      // Font size presets with clear visual contrast
      const fontSizeMap = {
        'compact': 'clamp(0.98rem, 3.2vw, 1.12rem)',
        'default': 'clamp(1.15rem, 3.8vw, 1.30rem)',
        'large': 'clamp(1.36rem, 4.6vw, 1.58rem)'
      };

      // Line height presets with unmistakable difference
      const lineHeightMap = {
        'standard': '1.75',
        'relaxed': '2.30'
      };

      // Paragraph spacing presets (gap between paragraphs opens up noticeably)
      const paragraphGapMap = {
        'standard': 'clamp(18px, 3.5vw, 24px)',
        'relaxed': 'clamp(32px, 5.5vw, 44px)'
      };

      const savedSize = localStorage.getItem('literature_reader_font_size') || 'default';
      const savedHeight = localStorage.getItem('literature_reader_line_height') || 'standard';

      function applyTypography(sizeKey, heightKey) {
        const fontSizeVal = fontSizeMap[sizeKey] || fontSizeMap['default'];
        const lineHeightVal = lineHeightMap[heightKey] || lineHeightMap['standard'];
        const paragraphGapVal = paragraphGapMap[heightKey] || paragraphGapMap['standard'];

        // 1. Set global CSS variables
        document.documentElement.style.setProperty('--reader-font-size', fontSizeVal);
        document.documentElement.style.setProperty('--reader-line-height', lineHeightVal);
        document.documentElement.style.setProperty('--reader-paragraph-gap', paragraphGapVal);

        // 2. Set direct inline styles on active reading content for immediate, guaranteed visual response
        const readingContents = document.querySelectorAll('.reading-content');
        readingContents.forEach(el => {
          el.style.setProperty('font-size', fontSizeVal, 'important');
          el.style.setProperty('line-height', lineHeightVal, 'important');
        });

        const paragraphs = document.querySelectorAll('.reading-content p, .reading-content .chat-msg');
        paragraphs.forEach(p => {
          p.style.setProperty('margin-bottom', paragraphGapVal, 'important');
          p.style.setProperty('line-height', lineHeightVal, 'important');
        });

        // 3. Update active UI pills in settings modal
        document.querySelectorAll('[data-font-size]').forEach(btn => {
          btn.classList.toggle('active', btn.getAttribute('data-font-size') === sizeKey);
        });
        document.querySelectorAll('[data-line-height]').forEach(btn => {
          btn.classList.toggle('active', btn.getAttribute('data-line-height') === heightKey);
        });
      }

      applyTypography(savedSize, savedHeight);

      // Re-apply whenever a chapter is dynamically loaded/injected into the DOM
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            const currentSize = localStorage.getItem('literature_reader_font_size') || 'default';
            const currentHeight = localStorage.getItem('literature_reader_line_height') || 'standard';
            applyTypography(currentSize, currentHeight);
            break;
          }
        }
      });

      const readingArea = document.getElementById('readingArea');
      if (readingArea) {
        observer.observe(readingArea, { childList: true, subtree: true });
      }

      // Event delegation for typography control pills
      document.addEventListener('click', (e) => {
        const sizeBtn = e.target.closest('[data-font-size]');
        if (sizeBtn) {
          const newSize = sizeBtn.getAttribute('data-font-size');
          localStorage.setItem('literature_reader_font_size', newSize);
          applyTypography(newSize, localStorage.getItem('literature_reader_line_height') || 'standard');
          return;
        }

        const heightBtn = e.target.closest('[data-line-height]');
        if (heightBtn) {
          const newHeight = heightBtn.getAttribute('data-line-height');
          localStorage.setItem('literature_reader_line_height', newHeight);
          applyTypography(localStorage.getItem('literature_reader_font_size') || 'default', newHeight);
          return;
        }
      });
    }
  }

  // ==========================================================================
  // 6. Public API & Lifecycle Initializer
  // ==========================================================================
  const atmosphere = new AtmosphereEngine();
  let isInitialized = false;

  return {
    atmosphere,
    hero: HeroMotion,
    scroll: ScrollRevealEngine,
    chapter: ChapterTransitionEngine,
    micro: MicroInteractions,
    getMotionProfile,

    init(options = {}) {
      if (isInitialized) return;
      isInitialized = true;

      // 1. Immediately signal motion readiness to avoid FOUC or hidden content
      document.documentElement.classList.add('js-motion-ready');
      if (prefersReducedMotion.matches) {
        document.documentElement.classList.add('reduced-motion');
      }

      // 2. Detect and initialize atmosphere preference
      const bodyAtmosphere = document.body.dataset.atmosphere || options.atmosphere || 'none';
      atmosphere.init(bodyAtmosphere);

      // 3. Initialize Hero Motion
      HeroMotion.init();

      // 4. Initialize Scroll Reveals
      ScrollRevealEngine.init();

      // 5. Initialize Micro-Interactions & Reading Comfort
      MicroInteractions.init();
    },

    destroy() {
      atmosphere.destroy();
      document.documentElement.classList.remove('js-motion-ready');
      isInitialized = false;
    },

    setAtmosphere(theme) {
      atmosphere.setTheme(theme);
    },

    pauseAtmosphere() {
      atmosphere.pauseForReading();
    },

    resumeAtmosphere() {
      atmosphere.resumeFromReading();
    },

    formatChapterHeader(title, number) {
      return ChapterTransitionEngine.formatChapterHeader(title, number);
    },

    triggerChapterReveal(elem) {
      ChapterTransitionEngine.triggerChapterReveal(elem);
    },

    triggerBookmarkPulse(elem) {
      MicroInteractions.triggerBookmarkPulse(elem);
    },

    animateFilteredCards(cards) {
      if (prefersReducedMotion.matches) return;
      let visibleIdx = 0;
      cards.forEach(card => {
        if (card.style.display !== 'none') {
          card.style.opacity = '0';
          card.style.transform = 'translate3d(0, 14px, 0)';
          card.style.transition = 'opacity 350ms cubic-bezier(0.16, 1, 0.3, 1), transform 350ms cubic-bezier(0.16, 1, 0.3, 1)';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translate3d(0, 0, 0)';
          }, visibleIdx * 40);
          visibleIdx++;
        }
      });
    }
  };
}));
