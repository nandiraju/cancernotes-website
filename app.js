(() => {
  // Theme toggle (dark by default, matching moodmeter.cend.in)
  const themeButtons = document.querySelectorAll('.theme-toggle');
  function updateThemeIcons() {
    const isDark = document.documentElement.classList.contains('dark');
    themeButtons.forEach((btn) => {
      btn.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
    });
  }
  updateThemeIcons();

  themeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      try {
        localStorage.setItem('cn-theme', isDark ? 'dark' : 'light');
      } catch (_) {}
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', isDark ? '#0f172a' : '#f8fbff');
      updateThemeIcons();
    });
  });

  // Scroll Reveal Observer (matching moodmeter.cend.in .reveal -> .reveal.active)
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || typeof IntersectionObserver === 'undefined') {
      reveals.forEach((el) => el.classList.add('active'));
    } else {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('active');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
      );
      reveals.forEach((el) => observer.observe(el));
    }
  }

  // Cancer Types Marquee Ticker (matching moodmeter.cend.in Web Animations API ticker)
  const ticker = document.querySelector('[data-ticker]');
  if (ticker && typeof ticker.animate === 'function') {
    const track = ticker.querySelector('.ticker-track');
    const firstSet = track?.querySelector('.ticker-set');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const SPEED = 55;
    let anim = null;
    let userPaused = false;
    let visible = true;
    let resizeTimer = 0;

    function sync() {
      if (!anim) return;
      userPaused || !visible || document.hidden ? anim.pause() : anim.play();
    }

    function clearClones() {
      track?.querySelectorAll('.ticker-set[data-clone]').forEach((el) => el.remove());
    }

    function build() {
      if (!track || !firstSet) return;
      if (anim) {
        anim.cancel();
        anim = null;
      }
      clearClones();
      if (reduced.matches) {
        ticker.setAttribute('data-static', '');
        return;
      }
      ticker.removeAttribute('data-static');
      const distance = firstSet.getBoundingClientRect().width;
      if (!distance) return;
      const sets = Math.ceil(ticker.clientWidth / distance) + 1;
      for (let i = 1; i < sets; i++) {
        const clone = firstSet.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        clone.setAttribute('data-clone', '');
        track.appendChild(clone);
      }
      anim = track.animate(
        [{ transform: 'translate3d(0, 0, 0)' }, { transform: `translate3d(-${distance}px, 0, 0)` }],
        { duration: (distance / SPEED) * 1000, iterations: Infinity, easing: 'linear' }
      );
      sync();
    }

    ticker.addEventListener('mouseenter', () => { userPaused = true; sync(); });
    ticker.addEventListener('mouseleave', () => { userPaused = false; sync(); });
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(build, 150);
    });
    if (typeof IntersectionObserver !== 'undefined') {
      new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
        sync();
      }).observe(ticker);
    }
    build();
  }

  // Mobile menu toggle
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      const isOpen = !mobileMenu.hasAttribute('hidden');
      if (isOpen) {
        mobileMenu.setAttribute('hidden', '');
        menuToggle.setAttribute('aria-expanded', 'false');
      } else {
        mobileMenu.removeAttribute('hidden');
        menuToggle.setAttribute('aria-expanded', 'true');
      }
    });

    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mobileMenu.setAttribute('hidden', '');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Contact form mailto helper
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const topic = document.getElementById('contactTopic')?.value || 'General Inquiry';
      const msg = document.getElementById('contactMessage')?.value || '';
      const subject = encodeURIComponent(`[CancerNotes] ${topic}`);
      const body = encodeURIComponent(msg);
      window.location.href = `mailto:support@cancernotes.app?subject=${subject}&body=${body}`;
    });
  }

  // Hero screen switcher: native Web Animations API cross-fade + 3s autoplay (from moodmeter-website)
  const heroScreenImg = document.getElementById('heroScreenImg');
  const heroPanel = document.getElementById('heroScreenPanel');
  const screenTabs = document.querySelectorAll('.screen-tab');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let swapToken = 0;

  async function swapHeroScreen(nextSrc, nextAlt) {
    if (!heroScreenImg || !nextSrc) return;
    const token = ++swapToken;
    const canAnimate = !prefersReducedMotion.matches && typeof heroScreenImg.animate === 'function';
    try {
      if (canAnimate) {
        heroScreenImg.getAnimations().forEach((a) => a.cancel());
        await heroScreenImg.animate([{ opacity: 1 }, { opacity: 0.25 }], { duration: 140, easing: 'ease-out', fill: 'forwards' }).finished;
      }
      if (token !== swapToken) return;
      heroScreenImg.src = nextSrc;
      heroScreenImg.alt = nextAlt || '';
      if (canAnimate) {
        await heroScreenImg.decode().catch(() => {});
        if (token !== swapToken) return;
        const fadeIn = heroScreenImg.animate([{ opacity: 0.25 }, { opacity: 1 }], { duration: 220, easing: 'ease-out', fill: 'forwards' });
        await fadeIn.finished;
        if (token === swapToken) heroScreenImg.getAnimations().forEach((a) => a.cancel());
      }
    } catch (_) {
      if (token !== swapToken) return;
      heroScreenImg.src = nextSrc;
      heroScreenImg.alt = nextAlt || '';
    }
  }

  function activateScreenTab(tab, moveFocus = false) {
    screenTabs.forEach((t) => {
      const active = t === tab;
      t.setAttribute('aria-selected', active ? 'true' : 'false');
      t.setAttribute('tabindex', active ? '0' : '-1');
    });
    if (heroPanel && tab.id) heroPanel.setAttribute('aria-labelledby', tab.id);
    if (moveFocus) tab.focus();
    swapHeroScreen(tab.dataset.src, tab.dataset.alt);
  }

  if (heroScreenImg && screenTabs.length) {
    screenTabs.forEach((tab, idx) => {
      tab.addEventListener('click', () => activateScreenTab(tab, false));
      tab.addEventListener('keydown', (e) => {
        let nextIdx = -1;
        if (e.key === 'ArrowRight') nextIdx = (idx + 1) % screenTabs.length;
        else if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + screenTabs.length) % screenTabs.length;
        else if (e.key === 'Home') nextIdx = 0;
        else if (e.key === 'End') nextIdx = screenTabs.length - 1;
        if (nextIdx >= 0) {
          e.preventDefault();
          activateScreenTab(screenTabs[nextIdx], true);
        }
      });
    });

    // Hero autoplay: cycles the screen pills every 3 seconds.
    // Pauses while hovered/focused, offscreen, or the tab is hidden; resumes after USER_IDLE ms.
    const INTERVAL = 3000;
    const USER_IDLE = 10000;
    const stage = heroPanel && heroPanel.parentElement;
    if (stage && screenTabs.length >= 2) {
      let timer = 0;
      let hovered = false;
      let focused = false;
      let visible = false;
      let userHoldUntil = 0;
      let preloaded = false;

      function preloadScreens() {
        if (preloaded) return;
        preloaded = true;
        const run = () => screenTabs.forEach((t) => {
          const img = new Image();
          img.decoding = 'async';
          img.src = t.dataset.src;
        });
        const idle = () => ('requestIdleCallback' in window ? requestIdleCallback(run, { timeout: 3000 }) : setTimeout(run, 1200));
        if (document.readyState === 'complete') idle();
        else window.addEventListener('load', idle, { once: true });
      }

      function canRun() {
        return !prefersReducedMotion.matches && visible && !hovered && !focused && !document.hidden;
      }

      function schedule(delay = INTERVAL) {
        clearTimeout(timer);
        timer = 0;
        if (!canRun()) return;
        timer = setTimeout(tick, Math.max(delay, userHoldUntil - Date.now()));
      }

      function tick() {
        timer = 0;
        if (!canRun()) return;
        if (Date.now() < userHoldUntil) { schedule(); return; }
        const tabs = Array.from(screenTabs);
        const current = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
        activateScreenTab(tabs[(current + 1) % tabs.length], false);
        schedule();
      }

      function userTookOver() {
        userHoldUntil = Date.now() + USER_IDLE;
        schedule();
      }

      screenTabs.forEach((tab) => {
        tab.addEventListener('click', (e) => { if (e.isTrusted) userTookOver(); });
        tab.addEventListener('keydown', userTookOver);
      });
      stage.addEventListener('mouseenter', () => { hovered = true; schedule(); });
      stage.addEventListener('mouseleave', () => { hovered = false; schedule(); });
      stage.addEventListener('focusin', (e) => { focused = e.target.matches(':focus-visible'); schedule(); });
      stage.addEventListener('focusout', () => { focused = false; schedule(); });
      document.addEventListener('visibilitychange', () => schedule());
      prefersReducedMotion.addEventListener('change', () => schedule());
      if (typeof IntersectionObserver !== 'undefined') {
        new IntersectionObserver((entries) => {
          visible = entries[0].isIntersecting;
          if (visible) preloadScreens();
          schedule();
        }, { threshold: 0.35 }).observe(stage);
      } else {
        visible = true;
        preloadScreens();
        schedule();
      }
    }
  }

  // Pause infinite decorative animations while off-screen
  if (typeof IntersectionObserver !== 'undefined') {
    const offscreenObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.target.toggleAttribute('data-offscreen', !entry.isIntersecting);
      });
    });
    document.querySelectorAll('.screen-tabs, .store-badge-wrap').forEach((el) => offscreenObs.observe(el));
  }
})();
