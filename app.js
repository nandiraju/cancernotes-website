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

  // Hero real-screenshot switcher
  const heroScreenImg = document.getElementById('heroScreenImg');
  const screenTabs = document.querySelectorAll('.screen-tab');
  if (heroScreenImg && screenTabs.length) {
    screenTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        screenTabs.forEach((t) => t.setAttribute('aria-selected', 'false'));
        tab.setAttribute('aria-selected', 'true');
        const nextSrc = tab.dataset.src;
        const nextAlt = tab.dataset.alt || '';
        if (nextSrc && heroScreenImg.getAttribute('src') !== nextSrc) {
          heroScreenImg.style.opacity = '0.35';
          heroScreenImg.src = nextSrc;
          heroScreenImg.alt = nextAlt;
          heroScreenImg.onload = () => {
            heroScreenImg.style.opacity = '1';
          };
          setTimeout(() => { heroScreenImg.style.opacity = '1'; }, 180);
        }
      });
    });
  }
})();
