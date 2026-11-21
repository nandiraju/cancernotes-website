(() => {
  // Theme toggle (dark by default, matching moodmeter.cend.in)
  const themeToggle = document.getElementById('themeToggle');
  function updateThemeIcon() {
    if (!themeToggle) return;
    const isDark = document.documentElement.classList.contains('dark');
    themeToggle.textContent = isDark ? '☀️' : '🌙';
    themeToggle.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
  }
  updateThemeIcon();

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      try {
        localStorage.setItem('cn-theme', isDark ? 'dark' : 'light');
      } catch (_) {}
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', isDark ? '#0f172a' : '#f8fbff');
      updateThemeIcon();
    });
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

  // Interactive Phone Mockup (only on index.html)
  const appView = document.getElementById('appView');
  const tabButtons = document.querySelectorAll('.tab-item');
  if (!appView || !tabButtons.length) return;

  const cancerLibrary = [
    { name: 'Breast Cancer', sub: 'New studies and clinical trials for Breast Cancer' },
    { name: 'Prostate Cancer', sub: 'Latest updates, quick tips, and self-test quizzes' },
    { name: 'Lung Cancer', sub: 'Follow research, treatment terms, and news' },
    { name: 'Colorectal Cancer', sub: 'Quick facts, screening terms, and articles' },
    { name: 'Melanoma', sub: 'Recent updates and plain-language tips' },
    { name: 'Adenoid Cystic Carcinoma', sub: 'Rare cancer information, tips, and notes' },
    { name: 'CAR-T', sub: 'Custom keyword added in Settings', custom: true }
  ];

  const tipsData = [
    { title: 'What "Stage" Means', body: 'Staging describes the size of a cancer and whether it has spread. Care teams use it to plan next steps.' },
    { title: 'Questions to Bring', body: 'Writing down 3 questions before an appointment helps you focus when a lot of information is shared at once.' },
    { title: 'Plain-Language Learning', body: 'Every tip card breaks down one concept at a time—swipe through 10 cards per session or shuffle for more.' }
  ];
  let tipIndex = 0;

  function setActiveTab(tabName) {
    tabButtons.forEach((btn) => {
      const match = btn.dataset.tab === tabName;
      btn.classList.toggle('active', match);
      btn.setAttribute('aria-selected', match ? 'true' : 'false');
    });
  }

  function renderCancers(filter = '') {
    setActiveTab('cancers');
    const q = filter.trim().toLowerCase();
    const matches = cancerLibrary.filter((c) => c.name.toLowerCase().includes(q));

    appView.innerHTML = `
      <div class="app-screen-header">
        <h2>Cancers</h2>
        <span class="app-badge">118 types</span>
      </div>
      <div class="app-search-box">
        <span aria-hidden="true">🔍</span>
        <input type="text" id="demoSearch" value="${filter.replace(/"/g, '&quot;')}" placeholder="Search 118 cancer types..." aria-label="Search cancer types in preview">
      </div>
      <div class="app-cards">
        ${matches.length ? matches.map((c) => `
          <div class="app-topic-card">
            <div class="topic-title">${c.name}${c.custom ? ' <span class="custom-tag">Custom</span>' : ''}</div>
            <div class="topic-sub">${c.sub}</div>
            <div class="topic-actions">
              <button type="button" class="chip-btn" data-jump="trending">Trending</button>
              <button type="button" class="chip-btn" data-jump="notes">Notes</button>
              <button type="button" class="chip-btn" data-jump="quizzes">Quiz</button>
              <button type="button" class="chip-btn chip-accent" data-jump="tips">Tips</button>
            </div>
          </div>
        `).join('') : '<div class="app-topic-card"><div class="topic-sub">No matching cancer types in preview. In the app, search all 118 types or add custom keywords in Settings.</div></div>'}
      </div>
    `;

    const searchInput = document.getElementById('demoSearch');
    if (searchInput) {
      searchInput.focus();
      searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
      searchInput.addEventListener('input', (e) => renderCancers(e.target.value));
    }
    bindJumpButtons();
  }

  function renderTips() {
    setActiveTab('cancers');
    const tip = tipsData[tipIndex % tipsData.length];
    appView.innerHTML = `
      <div class="app-screen-header">
        <h2>Quick Tips</h2>
        <button type="button" class="chip-btn" data-jump="cancers">← Back</button>
      </div>
      <div class="tip-deck-card">
        <div class="tip-counter">Tip ${(tipIndex % tipsData.length) + 1} of 10 · AI-generated</div>
        <h3>${tip.title}</h3>
        <p>${tip.body}</p>
        <div class="topic-actions">
          <button type="button" class="chip-btn chip-accent" id="nextTipBtn">Next Tip →</button>
          <button type="button" class="chip-btn" data-jump="quizzes">Take Quiz</button>
        </div>
      </div>
      <p class="topic-sub" style="margin-top:10px;">Content is for learning only; always check with your care team.</p>
    `;
    document.getElementById('nextTipBtn')?.addEventListener('click', () => {
      tipIndex += 1;
      renderTips();
    });
    bindJumpButtons();
  }

  function renderNotes() {
    setActiveTab('notes');
    appView.innerHTML = `
      <div class="app-screen-header">
        <h2>Notes</h2>
        <span class="app-badge">On this device</span>
      </div>
      <div class="app-cards">
        <div class="app-topic-card">
          <div class="topic-title">Questions for Oncology Visit</div>
          <div class="topic-sub">3 days ago · Breast Cancer</div>
          <p style="font-size:0.78rem;color:#cbd5e1;">1. What are the next steps after imaging? 2. Who do I call with side-effect questions?</p>
        </div>
        <div class="app-topic-card">
          <div class="topic-title">Voice-friendly dictation</div>
          <div class="topic-sub">Tap your keyboard microphone anytime to speak notes instead of typing.</div>
        </div>
      </div>
    `;
  }

  function renderTrending() {
    setActiveTab('trending');
    appView.innerHTML = `
      <div class="app-screen-header">
        <h2>Trending</h2>
        <span class="app-badge">Past month</span>
      </div>
      <div class="app-cards">
        <div class="app-topic-card">
          <div class="topic-title">New clinical trial updates in immunotherapy</div>
          <div class="topic-sub">2 hours ago · Third-party publisher</div>
          <div class="topic-actions">
            <button type="button" class="chip-btn" data-jump="saved">🔖 Save</button>
            <button type="button" class="chip-btn">↗ Share</button>
          </div>
        </div>
        <div class="app-topic-card">
          <div class="topic-title">Understanding biomarker testing results</div>
          <div class="topic-sub">1 day ago · Third-party publisher</div>
          <div class="topic-actions">
            <button type="button" class="chip-btn" data-jump="saved">🔖 Save</button>
            <button type="button" class="chip-btn">↗ Share</button>
          </div>
        </div>
      </div>
    `;
    bindJumpButtons();
  }

  function renderSaved() {
    setActiveTab('saved');
    appView.innerHTML = `
      <div class="app-screen-header">
        <h2>Saved</h2>
        <span class="app-badge">2 saved articles</span>
      </div>
      <div class="app-cards">
        <div class="app-topic-card">
          <div class="topic-title">Understanding biomarker testing results</div>
          <div class="topic-sub">Stored on your phone · Available offline</div>
        </div>
        <div class="app-topic-card">
          <div class="topic-title">Questions to ask before starting treatment</div>
          <div class="topic-sub">Stored on your phone · Available offline</div>
        </div>
      </div>
    `;
  }

  function renderQuizzes() {
    setActiveTab('quizzes');
    appView.innerHTML = `
      <div class="app-screen-header">
        <h2>Quiz · Easy</h2>
        <span class="app-badge">Question 1 of 10</span>
      </div>
      <div class="tip-deck-card">
        <h3>True or False: Notes saved in CancerNotes stay on your phone without an account.</h3>
        <button type="button" class="quiz-option" data-correct="true">True — stored on your device only</button>
        <button type="button" class="quiz-option" data-correct="false">False — requires cloud sign-in</button>
        <div id="quizFeedback"></div>
      </div>
    `;

    appView.querySelectorAll('.quiz-option').forEach((opt) => {
      opt.addEventListener('click', () => {
        const isCorrect = opt.dataset.correct === 'true';
        appView.querySelectorAll('.quiz-option').forEach((b) => {
          b.classList.remove('correct', 'wrong');
          if (b.dataset.correct === 'true') b.classList.add('correct');
        });
        if (!isCorrect) opt.classList.add('wrong');
        const fb = document.getElementById('quizFeedback');
        if (fb) {
          fb.innerHTML = `<div class="quiz-explanation"><strong>${isCorrect ? 'Correct!' : 'Not quite.'}</strong> CancerNotes requires no account, and your notes, saved articles, and quiz history stay on your device.</div>`;
        }
      });
    });
  }

  function bindJumpButtons() {
    appView.querySelectorAll('[data-jump]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.jump;
        if (target === 'cancers') renderCancers();
        else if (target === 'notes') renderNotes();
        else if (target === 'trending') renderTrending();
        else if (target === 'saved') renderSaved();
        else if (target === 'quizzes') renderQuizzes();
        else if (target === 'tips') renderTips();
      });
    });
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const t = btn.dataset.tab;
      if (t === 'cancers') renderCancers();
      else if (t === 'notes') renderNotes();
      else if (t === 'trending') renderTrending();
      else if (t === 'saved') renderSaved();
      else if (t === 'quizzes') renderQuizzes();
    });
  });

  document.getElementById('demoSearch')?.addEventListener('input', (e) => renderCancers(e.target.value));
  bindJumpButtons();
})();
