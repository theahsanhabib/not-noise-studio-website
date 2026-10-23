/**
 * Not Noise - Interactive Behavior & Micro-interactions
 * Handles:
 * - Dynamic 30-ad volume grid generation
 * - Interactive category filtering for Creative Vault
 * - Guarantee interactive tabs
 * - FAQ accordion with accessible ARIA states
 * - Booking modal (Demo vs $500 Pilot) with fallback and escape keys
 * - Scroll-triggered animations and counter micro-interactions
 * - Sticky navigation blur states & mobile drawer
 */

document.addEventListener('DOMContentLoaded', () => {
  const config = window.NOT_NOISE_CONFIG || {
    demoBookingUrl: 'https://cal.com/notnoise/demo',
    pilotBookingUrl: 'https://cal.com/notnoise/pilot-500',
    useModal: true
  };

  // 0. Smooth Scroll (Lenis)
  let lenis = null;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (typeof window.Lenis !== 'undefined' && !prefersReducedMotion) {
    lenis = new window.Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Smooth exponential ease-out
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.5,
      infinite: false
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Smooth scroll for all anchor hash links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href');
        if (!targetId || targetId === '#') return;
        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72;
          lenis.scrollTo(target, { offset: -navH - 12 });
        }
      });
    });
  }

  // 1. Dynamic Volume Grid (30 ads visual representation)
  const volumeGrid = document.getElementById('volume-grid');
  if (volumeGrid) {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 30; i++) {
      const dot = document.createElement('i');
      dot.style.setProperty('--i', i);
      dot.title = `Ad variation #${i + 1}`;
      fragment.appendChild(dot);
    }
    volumeGrid.appendChild(fragment);
  }

  // 2. Sticky Navbar & Mobile Navigation
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('nav-toggle');
  
  if (nav) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        nav.classList.add('is-scrolled');
      } else {
        nav.classList.remove('is-scrolled');
      }
    }, { passive: true });
  }

  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', isOpen);
    });

    // Close menu when tapping any mobile link
    const mobileLinks = document.querySelectorAll('.nav__mobile a');
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // 3. Vault Category Filter
  const filterBtns = document.querySelectorAll('.filters .filter');
  const vaultItems = document.querySelectorAll('.vault-grid .vault-item');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      // Update button state
      filterBtns.forEach(b => {
        b.classList.remove('is-active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-pressed', 'true');

      // Filter items with smooth transition
      vaultItems.forEach(item => {
        const cat = item.dataset.cat;
        if (filter === 'all' || cat === filter) {
          item.classList.remove('is-hidden');
          item.style.opacity = '0';
          item.style.transform = 'translateY(12px)';
          setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'none';
          }, 30);
        } else {
          item.classList.add('is-hidden');
        }
      });
    });
  });

  // 4. Guarantee Interactive Tabs
  const tabs = document.querySelectorAll('.tabs .tab');
  const panels = document.querySelectorAll('.tab-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetPanelId = tab.getAttribute('aria-controls');

      tabs.forEach(t => {
        t.setAttribute('aria-selected', 'false');
        t.setAttribute('tabindex', '-1');
      });
      panels.forEach(p => p.hidden = true);

      tab.setAttribute('aria-selected', 'true');
      tab.removeAttribute('tabindex');
      const targetPanel = document.getElementById(targetPanelId);
      if (targetPanel) {
        targetPanel.hidden = false;
      }
    });

    // Keyboard navigation for tabs
    tab.addEventListener('keydown', (e) => {
      const tabList = Array.from(tabs);
      const index = tabList.indexOf(tab);
      let nextTab = null;

      if (e.key === 'ArrowRight') {
        nextTab = tabList[(index + 1) % tabList.length];
      } else if (e.key === 'ArrowLeft') {
        nextTab = tabList[(index - 1 + tabList.length) % tabList.length];
      }

      if (nextTab) {
        nextTab.focus();
        nextTab.click();
      }
    });
  });

  // 5. FAQ Accordion
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const trigger = item.querySelector('.faq-item__q');
    if (trigger) {
      trigger.addEventListener('click', () => {
        const isOpen = item.classList.contains('is-open');

        // Optional: close siblings
        faqItems.forEach(other => {
          if (other !== item) {
            other.classList.remove('is-open');
            other.querySelector('.faq-item__q')?.setAttribute('aria-expanded', 'false');
          }
        });

        item.classList.toggle('is-open', !isOpen);
        trigger.setAttribute('aria-expanded', !isOpen);
      });
    }
  });

  // 6. Booking Modal Funnel
  const modal = document.getElementById('booking-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalSub = document.getElementById('modal-sub');
  const modalBody = document.getElementById('modal-body');
  const ctaButtons = document.querySelectorAll('[data-cta]');

  function openBooking(type) {
    const isPilot = type === 'pilot';
    const targetUrl = isPilot ? config.pilotBookingUrl : config.demoBookingUrl;

    if (!config.useModal) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    if (!modal || !modalBody) return;

    if (isPilot) {
      modalTitle.textContent = 'Start your $500 Pilot sprint';
      modalSub.textContent = 'Reserve your 48-hour sprint slot & kickoff call with our creative strategists.';
    } else {
      modalTitle.textContent = 'Book a live creative walkthrough';
      modalSub.textContent = 'See our full unreleased ad vault and get a free audit of your current supplement hooks.';
    }

    // Embed iFrame with fallback
    modalBody.innerHTML = `
      <iframe src="${targetUrl}" title="${isPilot ? 'Pilot Kickoff Booking' : 'Demo Booking'}" loading="lazy"></iframe>
      <div class="modal__fallback">
        <p class="muted">Prefer to open directly in a new window or can't see the schedule?</p>
        <div class="modal__steps">
          <a href="${targetUrl}" target="_blank" rel="noopener noreferrer" class="btn btn--primary">
            Open in new tab <svg class="btn__arrow"><use href="#i-arrow"/></svg>
          </a>
        </div>
      </div>
    `;

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (lenis) lenis.stop();
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lenis) lenis.start();
    if (modalBody) {
      modalBody.innerHTML = '';
    }
  }

  ctaButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const type = btn.getAttribute('data-cta') || 'demo';
      openBooking(type);
    });
  });

  document.querySelectorAll('[data-close]').forEach(closer => {
    closer.addEventListener('click', closeModal);
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.classList.contains('is-open')) {
      closeModal();
    }
  });

  // 7. Scroll-triggered Reveal Animations & Counter Micro-interactions
  const reveals = document.querySelectorAll('.reveal');
  const countElements = document.querySelectorAll('[data-count]');

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: '0px 0px -60px 0px',
    threshold: 0.1
  });

  reveals.forEach(el => {
    // If element is already in or near viewport at load time, show immediately
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight + 50) {
      el.classList.add('is-visible');
    } else {
      revealObserver.observe(el);
    }
  });

  // Animate numeric counters when visible
  const countObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10);
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';
        const duration = 1200;
        const start = performance.now();

        function update(now) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          // Ease-out expo
          const current = Math.floor((1 - Math.pow(2, -10 * progress)) * target);
          el.textContent = `${prefix}${current}${suffix}`;

          if (progress < 1) {
            requestAnimationFrame(update);
          } else {
            el.textContent = `${prefix}${target}${suffix}`;
          }
        }
        requestAnimationFrame(update);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  countElements.forEach(el => countObserver.observe(el));

  // Footer current year fallback
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // 11. Pixel Grid Wiggle Hover Effect (Ad Stack) - Smooth Harmonic Wave
  function initPixelWiggle() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const cards = document.querySelectorAll('.creative-stack .creative-card');
    if (!cards.length) return;

    const COLS = 5;
    const ROWS = 8;
    const MAX_X = 16; // Max horizontal displacement in px

    cards.forEach((card, index) => {
      const origImg = card.querySelector('img');
      if (!origImg) return;

      function setupCanvas() {
        if (card.querySelector('.pixel-canvas')) return;

        const canvas = document.createElement('canvas');
        canvas.className = 'pixel-canvas';
        canvas.setAttribute('aria-hidden', 'true');
        origImg.insertAdjacentElement('afterend', canvas);

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        // Precompute fixed row and column phase offsets for organic wave motion
        const cells = [];
        for (let r = 0; r < ROWS; r++) {
          const rowDir = (r % 2 === 0 ? 1 : -0.9);
          const rowPhase = r * 1.15;
          for (let c = 0; c < COLS; c++) {
            cells.push({
              r,
              c,
              rowDir,
              phaseA: rowPhase + c * 0.45,
              phaseB: r * 0.7 + c * 0.9,
              currX: 0
            });
          }
        }

        let isHovered = false;
        let intensity = 0;
        let rafId = null;
        let startTime = null;

        function resize() {
          const rect = card.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return;
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          canvas.width = Math.round(rect.width * dpr);
          canvas.height = Math.round(rect.height * dpr);
        }

        resize();
        window.addEventListener('resize', resize, { passive: true });

        function render(now) {
          if (!startTime) startTime = now;
          const elapsed = (now - startTime) / 1000;

          // Smoothly ramp intensity up on hover, down on leave
          if (isHovered) {
            intensity += (1 - intensity) * 0.08;
          } else {
            intensity += (0 - intensity) * 0.06;
          }

          const w = canvas.width;
          const h = canvas.height;
          if (w === 0 || h === 0) return;

          ctx.clearRect(0, 0, w, h);

          // Calculate aspect-ratio cover crop from origImg
          const nw = origImg.naturalWidth || w;
          const nh = origImg.naturalHeight || h;
          const imgRatio = nw / nh;
          const destRatio = w / h;

          let sw, sh, sx, sy;
          if (imgRatio > destRatio) {
            sh = nh;
            sw = nh * destRatio;
            sx = (nw - sw) / 2;
            sy = 0;
          } else {
            sw = nw;
            sh = nw / destRatio;
            sx = 0;
            sy = (nh - sh) / 2;
          }

          const cellSw = sw / COLS;
          const cellSh = sh / ROWS;
          const cellDw = w / COLS;
          const cellDh = h / ROWS;
          const dpr = canvas.width / (card.clientWidth || 1);

          cells.forEach(cell => {
            // Smooth harmonic wave: compound sine oscillation (slow, fluid, organic)
            const wave = Math.sin(elapsed * 2.6 + cell.phaseA) * 0.75 +
                         Math.sin(elapsed * 1.6 + cell.phaseB) * 0.25;
            const targetX = cell.rowDir * wave * MAX_X * intensity;

            // Continuous fluid interpolation
            cell.currX += (targetX - cell.currX) * 0.2;

            const srcX = sx + cell.c * cellSw;
            const srcY = sy + cell.r * cellSh;
            const dx = cell.c * cellDw + cell.currX * dpr;
            const dy = cell.r * cellDh; // Y is strictly locked to 0 (no vertical distortion)

            ctx.drawImage(
              origImg,
              srcX, srcY, cellSw, cellSh,
              dx, dy, cellDw + 0.5, cellDh + 0.5
            );
          });

          if (isHovered || intensity > 0.005) {
            rafId = requestAnimationFrame(render);
          } else {
            intensity = 0;
            canvas.classList.remove('is-active');
            rafId = null;
            startTime = null;
          }
        }

        function start() {
          if (isHovered) return;
          isHovered = true;
          resize();
          canvas.classList.add('is-active');
          if (!rafId) {
            startTime = performance.now();
            rafId = requestAnimationFrame(render);
          }
        }

        function stop() {
          isHovered = false;
          if (!rafId) {
            startTime = performance.now();
            rafId = requestAnimationFrame(render);
          }
        }

        card.addEventListener('mouseenter', start);
        card.addEventListener('mouseleave', stop);

        // Center front card also responds to creative-stack container hover
        if (index === 2) {
          const stack = card.closest('.creative-stack');
          if (stack) {
            stack.addEventListener('mouseenter', start);
            stack.addEventListener('mouseleave', stop);
          }
        }
      }

      if (origImg.complete) {
        setupCanvas();
      } else {
        origImg.addEventListener('load', setupCanvas, { once: true });
      }
    });
  }

  // Footer social links dynamic sync from config
  if (config.socialLinks) {
    const socialMap = {
      instagram: config.socialLinks.instagram,
      x: config.socialLinks.x,
      linkedin: config.socialLinks.linkedin,
      youtube: config.socialLinks.youtube
    };
    Object.entries(socialMap).forEach(([platform, url]) => {
      if (!url) return;
      const link = document.querySelector(`.footer__social a[aria-label*="${platform}" i]`);
      if (link) {
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
    });
  }

  initPixelWiggle();
});

