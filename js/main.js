/* =========================================================
   Dronacharya's Training — site interactions
   ========================================================= */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const page = document.body.dataset.page;

  /* ---------------- toast ---------------- */
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  /* ---------------- nav ---------------- */
  const nav = $('#nav');
  const navLinks = $('#navLinks');
  const toggle = $('#navToggle');
  function setMenu(open) {
    navLinks.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  toggle.addEventListener('click', () => setMenu(!navLinks.classList.contains('open')));
  navLinks.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('click', (e) => {
    if (navLinks.classList.contains('open') && !e.target.closest('.nav')) setMenu(false);
  });

  // active link highlighting (home page)
  const spyLinks = $$('[data-spy]');
  if (spyLinks.length) {
    const map = new Map(spyLinks.map((a) => [a.dataset.spy, a]));
    const spyMap = { 'gurukul-world': 'home', 'birds-eye': 'story', guru: 'research', path: 'simulator', progress: 'simulator' };
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const id = map.has(en.target.id) ? en.target.id : spyMap[en.target.id];
        spyLinks.forEach((a) => a.classList.toggle('active', a.dataset.spy === id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach((s) => spy.observe(s));
  }

  /* ---------------- scroll: progress bar, nav state, parallax ---------------- */
  const bar = $('.scroll-progress');
  const parallax = $$('[data-parallax]').map((el) => ({ el, speed: parseFloat(el.dataset.parallax), host: el.closest('section') }));
  const parallaxEls = $$('[data-parallax-el]').map((el) => ({ el, speed: parseFloat(el.dataset.parallaxEl), host: el.closest('section') }));
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      const vh = window.innerHeight;
      const max = document.documentElement.scrollHeight - vh;
      bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
      nav.classList.toggle('scrolled', y > 40);
      if (!reduceMotion) {
        [...parallax, ...parallaxEls].forEach(({ el, speed, host }) => {
          const r = host.getBoundingClientRect();
          if (r.bottom < -100 || r.top > vh + 100) return;
          const offset = (r.top + r.height / 2 - vh / 2) * -speed;
          el.style.setProperty('--py', offset.toFixed(1) + 'px');
        });
      }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------------- reveal on scroll ---------------- */
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); revealObs.unobserve(en.target); }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  $$('[data-reveal]').forEach((el) => revealObs.observe(el));

  const viewObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      en.target.classList.toggle('in-view', en.isIntersecting);
      if (en.isIntersecting) { en.target.classList.add('seen'); en.target.dispatchEvent(new CustomEvent('enter')); }
    });
  }, { threshold: 0.2 });
  $$('section').forEach((s) => viewObs.observe(s));

  /* ---------------- hero embers ---------------- */
  $$('.embers').forEach((cv) => {
    if (reduceMotion) return;
    const c = cv.getContext('2d');
    let w, h, parts = [], visible = true;
    const resize = () => { w = cv.width = cv.offsetWidth; h = cv.height = cv.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    const spawn = () => ({ x: Math.random() * w, y: h + Math.random() * h * .5, r: Math.random() * 1.8 + .4, vy: Math.random() * 30 + 15, vx: Math.random() * 16 - 8, life: 0, max: Math.random() * 6 + 5, ph: Math.random() * 6 });
    parts = Array.from({ length: 46 }, spawn).map((p) => ({ ...p, y: Math.random() * h }));
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(cv);
    let last = performance.now();
    (function frame(t) {
      requestAnimationFrame(frame);
      const dt = Math.min(.05, (t - last) / 1000); last = t;
      if (!visible) return;
      c.clearRect(0, 0, w, h);
      parts.forEach((p, i) => {
        p.life += dt; p.y -= p.vy * dt; p.x += (p.vx + Math.sin(p.life * 2 + p.ph) * 12) * dt;
        const a = Math.max(0, Math.sin(Math.PI * Math.min(1, p.life / p.max)));
        c.beginPath(); c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        c.fillStyle = `rgba(255, ${170 + Math.floor(p.ph * 10)}, 90, ${a * .8})`;
        c.shadowColor = 'rgba(255,170,80,.9)'; c.shadowBlur = 8; c.fill();
        if (p.life > p.max || p.y < -10) parts[i] = spawn();
      });
    })(last);
  });

  /* =========================================================
     MODAL CONTENT
     ========================================================= */
  const IMG = { gate: 'assets/img/gurukul-gate.jpg', guru: 'assets/img/guru-teaching.jpg', range: 'assets/img/archery-range.jpg' };
  const startBtn = (label = 'Start Training', mode = 'assessment') => `<button class="btn btn-gold btn-sm" data-arena="${mode}">${label} <svg class="ic"><use href="#i-arrow"/></svg></button>`;
  const CONTENT = {
    story: {
      img: IMG.guru, pos: '75% 30%', eyebrow: 'The Mahabharata', title: 'The Story of Dronacharya', sanskrit: 'द्रोणाचार्य',
      body: `<p>Drona was born to the sage Bharadwaja and grew into a master of the science of arms, <em>dhanurveda</em>. He learned the celestial weapons from Parashurama, yet lived for years in poverty. That changed when the young Kuru princes lost their ball down a well and he drew it out with a chain of grass blades, each arrow piercing the one before.</p>
        <p>Bhishma, seeing his skill, appointed him <strong>guru to the Kauravas and the Pandavas</strong>. In his gurukul Drona did not teach every prince the same way. He watched each one closely and shaped the training to their nature:</p>
        <ul><li><strong>Arjuna</strong> had unmatched focus, so Drona made him an archer without equal.</li><li><strong>Bhima</strong> and <strong>Duryodhana</strong> had strength, so they trained in the mace.</li><li><strong>Yudhishthira</strong> excelled with the spear and in steadiness of mind.</li><li><strong>Nakula and Sahadeva</strong> mastered the sword.</li></ul>
        <h5>The Bird's-Eye Test</h5>
        <p>To test his students, Drona placed a wooden bird high in a tree and asked each prince what he saw. They described the sky, the tree, the branches and their brothers. Only Arjuna answered, "I see only the eye of the bird." Drona told him to shoot, and the arrow struck true.</p>
        <div class="apply">The lesson for modern learning: <strong>observe each learner, personalize the path, and train focus on a clear goal.</strong></div>
        <p style="font-size:.82rem;color:var(--muted)">Drona's story also has hard moments, such as his demand of Ekalavya's thumb. Those moments remind us that teaching must be fair as well as effective. That is why <em>Niti &amp; Dharma</em> is one of our principles.</p>`,
      actions: startBtn('Begin Your Training'),
    },
    'char-drona': { img: IMG.guru, pos: '74% 25%', eyebrow: 'The Guru', title: 'Dronacharya', sanskrit: 'द्रोणाचार्य', body: `<p>Royal preceptor of the Kuru princes and master of <em>dhanurveda</em>. Drona's genius was in <strong>observation</strong>. He studied each student's temperament and gave each one the discipline that suited them.</p><div class="apply">In the simulator: the Guru is your adaptive coach. He watches every shot, explains your mistakes and adjusts your next challenge.</div>` },
    'char-arjuna': { img: IMG.guru, pos: '99% 45%', eyebrow: 'The Focused Learner', title: 'Arjuna', sanskrit: 'अर्जुन', body: `<p>The third Pandava and Drona's finest archer. Arjuna practised even in darkness after noticing that he could eat without light, since his hand knew the way. He embodies <strong>Ekagrata</strong> (single-pointed focus) and <strong>Abhyasa</strong> (relentless practice).</p><div class="apply">Learner trait: deep focus and self-driven practice. The path for this learner is progressively harder precision challenges.</div>`, actions: startBtn("Take Arjuna's Test", 'focus') },
    'char-bhima': { img: IMG.guru, pos: '43% 55%', eyebrow: 'The Strong Learner', title: 'Bhima', sanskrit: 'भीम', body: `<p>The second Pandava, famed for immense strength and appetite. Drona recognised that Bhima's power suited the <strong>mace (gada)</strong>, not the bow, and trained him accordingly.</p><div class="apply">Learner trait: physical and kinesthetic. Personalization means playing to strengths instead of forcing one curriculum on everyone. This is <em>Svadharma</em>.</div>` },
    'char-duryodhana': { img: IMG.range, pos: '90% 80%', eyebrow: 'The Rival Learner', title: 'Duryodhana', sanskrit: 'दुर्योधन', body: `<p>Eldest of the Kauravas and a formidable mace fighter, later refined further under Balarama. Skilled and ambitious, but his rivalry and envy shaped his choices.</p><div class="apply">Learner trait: competitive. A reminder that skill without values is incomplete. Good training develops character as well as ability.</div>` },

    'problem-abilities': { eyebrow: 'The Modern Problem', title: 'Different Abilities', body: `<p>No two learners are alike. One grasps concepts visually, another through practice. One is quick but careless, another slow but precise. A single pace and a single path leave many learners either bored or lost.</p><div class="apply">Our approach: an initial <strong>assessment</strong> measures accuracy, reaction time and consistency, so training starts where <em>you</em> are.</div>`, actions: startBtn('Take the Assessment') },
    'problem-personal': { eyebrow: 'The Modern Problem', title: 'Limited Personalization', body: `<p>Classrooms of 40+ learners make individual attention nearly impossible. Most "adaptive" tools only change the order of content, not the difficulty and the way it is taught.</p><div class="apply">Our approach: the difficulty itself adapts. Target size, movement, wind and time windows are re-tuned after every challenge.</div>` },
    'problem-feedback': { eyebrow: 'The Modern Problem', title: 'Delayed Feedback', body: `<p>Assignments are graded days later. By then the learner has moved on, and the mistake has often become a habit.</p><div class="apply">Our approach: <strong>instant feedback</strong> after every arrow. "You released before a full draw." "The wind pushed you left." You learn exactly why, right away.</div>` },
    'problem-difficulty': { eyebrow: 'The Modern Problem', title: 'Measuring Mastery', body: `<p>Marks show what you got right, not how consistently, how quickly or how reliably. Mastery is many skills at once.</p><div class="apply">Our approach: a five-dimension skill profile (Accuracy, Speed, Consistency, Focus and Decision-making) tracked over time.</div>` },

    'p-svadharma': { img: IMG.gate, pos: '50% 40%', eyebrow: 'Core Principle', title: 'Svadharma', sanskrit: 'स्वधर्म', body: `<p><em>One's own nature and duty.</em> The Bhagavad Gita teaches that it is better to follow your own path imperfectly than another's perfectly. Drona trained Arjuna in the bow and Bhima in the mace because each had a different nature.</p><div class="apply">In the simulator: your assessment reveals your strengths, and your learning path is built around them.</div>`, actions: startBtn('Discover Your Strengths') },
    'p-abhyasa': { img: IMG.range, pos: '40% 50%', eyebrow: 'Core Principle', title: 'Abhyasa', sanskrit: 'अभ्यास', body: `<p><em>Consistent, dedicated practice.</em> "The restless mind is restrained by abhyasa and vairagya" (Gita 6.35). Arjuna practised archery even in the dark of night.</p><div class="apply">In the simulator: 20 progressive challenges, with consistency measured as its own skill.</div>`, actions: startBtn('Practise Now', 'archery') },
    'p-ekagrata': { img: IMG.gate, pos: '60% 15%', eyebrow: 'Core Principle', title: 'Ekagrata', sanskrit: 'एकाग्रता', body: `<p><em>Single-pointed concentration.</em> When Arjuna saw only the bird's eye, he showed the mind fully gathered on one goal, without distraction.</p><div class="apply">In the simulator: the Bird's-Eye Focus challenge trains you to strike only the target and ignore distractions.</div>`, actions: startBtn("Try the Bird's-Eye Test", 'focus') },
    'p-guru': { img: IMG.guru, pos: '70% 35%', eyebrow: 'Core Principle', title: 'Guru–Shishya', sanskrit: 'गुरु–शिष्य परम्परा', body: `<p><em>The teacher–student tradition.</em> Knowledge passed through a personal relationship, where the guru observes, corrects and guides each shishya individually.</p><div class="apply">In the simulator: a virtual Guru explains every result in plain words. The system is transparent and never a black box.</div>` },
    'p-niti': { img: IMG.gate, pos: '85% 60%', eyebrow: 'Core Principle', title: 'Niti & Dharma', sanskrit: 'नीति एवं धर्म', body: `<p><em>Ethics and righteous conduct.</em> The Mahabharata shows that skill without dharma leads to ruin. Even a great teacher is judged by his fairness, as Ekalavya's story reminds us.</p><div class="apply">In the simulator: your data stays on your device, there are no hidden rankings, and every adaptation is explained.</div>` },

    'r-platforms': { eyebrow: 'Existing Solutions', title: 'Personalized Learning Platforms', body: `<p>Platforms like <strong>Khan Academy</strong> and <strong>Duolingo</strong> use mastery-based progression, spaced repetition and streaks to keep learners engaged at scale.</p><h5>Strengths</h5><ul><li>Huge content libraries and self-paced learning</li><li>Gamification that drives daily habits</li></ul><h5>Limitations</h5><ul><li>Adaptation is mostly sequencing, not true difficulty tuning</li><li>Little narrative or cultural context</li></ul>` },
    'r-its': { eyebrow: 'Existing Solutions', title: 'Intelligent Tutoring Systems', body: `<p>ITS model what a learner knows (e.g. Bayesian Knowledge Tracing) and give targeted hints. Research has found that well-designed tutors can approach the effectiveness of human tutoring in some domains.</p><h5>Strengths</h5><ul><li>Fine-grained learner modelling</li><li>Step-by-step targeted feedback</li></ul><h5>Limitations</h5><ul><li>Expensive to build per domain</li><li>Decisions are often unexplained to the learner</li></ul>` },
    'r-sim': { eyebrow: 'Existing Solutions', title: 'Simulation-based Training', body: `<p>Flight simulators, surgical VR and sports-analytics tools let learners practise in realistic environments with performance metrics.</p><h5>Strengths</h5><ul><li>Safe, repeatable practice with measurable outcomes</li><li>Strong transfer for motor and decision skills</li></ul><h5>Limitations</h5><ul><li>High hardware cost</li><li>Rarely personalize difficulty in real time</li></ul>` },
    research: {
      img: IMG.range, pos: '50% 35%', eyebrow: 'Research Summary', title: 'Bridging the Gap',
      body: `<p>Existing tools each solve part of the problem: platforms engage, tutors model knowledge, simulations build skill. Five gaps remain:</p>
        <ul><li><strong>Fragmented experience:</strong> assessment, practice and feedback live in separate tools.</li><li><strong>Limited explainability:</strong> learners rarely know <em>why</em> difficulty changed.</li><li><strong>Weak story connection:</strong> content lacks meaning and cultural roots that motivate.</li><li><strong>Insufficient adaptation:</strong> changes are coarse (next lesson) rather than continuous (this target, this wind).</li><li><strong>Limited transparency:</strong> data use and scoring are hidden.</li></ul>
        <h5>Our Proposal</h5>
        <p>A single, story-driven simulator built on the Guru–Shishya model: <strong>Assess → Personalize → Train → Feedback → Track</strong>, with every adaptation explained in plain language by the Guru.</p>
        <div class="apply">Adaptive rule (transparent): score ≥ 75% moves you up a level, score &lt; 45% moves you down, otherwise you consolidate at your current level.</div>`,
      actions: startBtn('Try the Simulator'),
    },

    'step-assess': { eyebrow: 'Simulator · Step 1', title: 'Assessment', body: `<p>Five arrows at a slow-moving target. We measure <strong>accuracy</strong>, <strong>reaction time</strong> and <strong>steadiness</strong> to place you at Beginner, Intermediate or Advanced.</p>`, actions: startBtn('Begin Assessment') },
    'step-path': { eyebrow: 'Simulator · Step 2', title: 'Personalized Path', body: `<p>Your level sets the target size, its movement, wind strength and focus time-windows. Four levels: Beginner → Intermediate → Advanced → Master.</p>`, actions: `<a href="#path" class="btn btn-outline btn-sm" data-close>See Your Path</a> ${startBtn()}` },
    'step-train': { eyebrow: 'Simulator · Step 3', title: 'Interactive Training', body: `<p><strong>Archery:</strong> press and hold to draw, release to loose. A full draw steadies your aim, and holding too long makes it tremble.<br><strong>Bird's-Eye Focus:</strong> strike only the golden bird's eye and let the crows pass.</p>`, actions: `${startBtn('Archery', 'archery')} ${startBtn("Bird's-Eye", 'focus')}` },
    'step-feedback': { eyebrow: 'Simulator · Step 4', title: 'Instant Feedback', body: `<p>After every arrow the Guru tells you what happened and how to fix it: early release, wind drift, aiming high, leading a moving target, or a distraction.</p>`, actions: startBtn() },
    'step-track': { eyebrow: 'Simulator · Step 5', title: 'Progress Tracking', body: `<p>Every challenge is saved on your device. Track accuracy, reaction time, challenges completed and your five-skill radar over time.</p>`, actions: `<a href="#progress" class="btn btn-outline btn-sm" data-close>View Progress</a> ${startBtn()}` },

    'impact-effective': { eyebrow: 'Impact', title: 'More Effective Learning', body: `<p>When challenge matches ability, learners stay in the "zone of proximal development": not bored, not overwhelmed. Personalized difficulty can mean faster skill gains for the same practice time.</p>` },
    'impact-engagement': { eyebrow: 'Impact', title: 'Higher Engagement', body: `<p>Story gives practice meaning. Training "in Dronacharya's gurukul" turns repetition into a journey, and instant feedback creates a satisfying loop of try, learn and improve.</p>` },
    'impact-growth': { eyebrow: 'Impact', title: 'Measurable Growth', body: `<p>Five skill dimensions tracked across sessions make progress visible to learners, teachers and parents. Mastery becomes something you can see.</p>`, actions: `<a href="index.html#progress" class="btn btn-outline btn-sm" data-close>See Progress Tracking</a>` },
    'impact-ethical': { eyebrow: 'Impact', title: 'Ethical & Responsible Technology', body: `<p>Guided by <em>Niti &amp; Dharma</em>: data stays local to your browser, every adaptation is explained, there are no dark patterns or hidden rankings, and the human teacher stays at the centre.</p>` },

    about: {
      img: IMG.gate, pos: '50% 50%', eyebrow: 'About the Project', title: "Dronacharya's Training",
      body: `<p><strong>Dronacharya's Training</strong> is a personalized skill-development concept that brings the Guru–Shishya tradition of the Mahabharata into modern learning technology.</p>
        <p>It combines an interactive archery and focus simulator, an adaptive difficulty engine and transparent progress tracking, all built around principles from Indian Knowledge Systems: Svadharma, Abhyasa, Ekagrata, Guru–Shishya, and Niti &amp; Dharma.</p>
        <ul><li>Runs fully in your browser. No account needed.</li><li>Progress is stored locally on your device.</li><li>Built with HTML, CSS and JavaScript.</li></ul>`,
      actions: `<a href="gurukul.html" class="btn btn-gold btn-sm">Enter the Gurukul <svg class="ic"><use href="#i-arrow"/></svg></a>`,
    },
    contact: {
      eyebrow: 'Get in touch', title: 'Send a Message',
      body: `<p>Questions, feedback or ideas for the gurukul? Write to us and your email app will open with the message ready to send.</p>
        <form class="modal-form" id="contactForm"><label>Your name<input name="name" required autocomplete="name"></label><label>Message<textarea name="msg" rows="4" required></textarea></label><button class="btn btn-gold btn-sm" type="submit">Compose Email <svg class="ic"><use href="#i-arrow"/></svg></button></form>`,
    },
  };

  /* ---------------- modal ---------------- */
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.innerHTML = `<div class="modal-backdrop" data-close></div><div class="modal-box"><button class="modal-close" data-close aria-label="Close"><svg><use href="#i-close"/></svg></button><div class="modal-inner"></div></div>`;
  document.body.appendChild(modal);
  let lastFocus = null;

  function openModal(html) {
    lastFocus = document.activeElement;
    $('.modal-inner', modal).innerHTML = html;
    $('.modal-box', modal).scrollTop = 0;
    modal.classList.add('open');
    document.body.classList.add('locked');
    setTimeout(() => $('.modal-close', modal).focus(), 50);
  }
  function openContent(key) {
    const c = CONTENT[key];
    if (!c) return;
    openModal(`${c.img ? `<div class="modal-media" style="background-image:url(${c.img});background-position:${c.pos || 'center'}"></div>` : ''}
      <div class="modal-content">
        <div class="modal-eyebrow">${c.eyebrow || ''}</div>
        <h3>${c.title}</h3>
        ${c.sanskrit ? `<div class="modal-sanskrit">${c.sanskrit}</div>` : '<div style="height:12px"></div>'}
        ${c.body}
        ${c.actions ? `<div class="modal-actions">${c.actions}</div>` : ''}
      </div>`);
  }
  function closeModal() {
    if (!modal.classList.contains('open')) return;
    modal.classList.remove('open');
    if (!$('#arena.open')) document.body.classList.remove('locked');
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  modal.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) {
      const link = e.target.closest('a[href]');
      closeModal();
      if (link && link.getAttribute('href').startsWith('#')) {
        e.preventDefault();
        const t = $(link.getAttribute('href'));
        t && setTimeout(() => t.scrollIntoView({ behavior: 'smooth' }), 200);
      }
    }
  });
  modal.addEventListener('submit', (e) => {
    if (e.target.id !== 'contactForm') return;
    e.preventDefault();
    const f = new FormData(e.target);
    const subject = encodeURIComponent("Dronacharya's Training: message from " + f.get('name'));
    const body = encodeURIComponent(f.get('msg'));
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    closeModal();
    toast('Opening your email app…');
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  /* ---------------- global click delegation ---------------- */
  document.addEventListener('click', (e) => {
    const m = e.target.closest('[data-modal]');
    if (m) { e.preventDefault(); openContent(m.dataset.modal); return; }
    const a = e.target.closest('[data-arena]');
    if (a) { e.preventDefault(); closeModal(); Arena.open(a.dataset.arena); return; }
    const sh = e.target.closest('[data-share]');
    if (sh) { e.preventDefault(); share(); }
  });

  async function share() {
    const data = { title: document.title, text: 'Ancient wisdom. Individual learning. Train in Dronacharya\'s gurukul.', url: location.href };
    if (navigator.share) { try { await navigator.share(data); } catch (_) { /* cancelled */ } return; }
    try { await navigator.clipboard.writeText(location.href); toast('Link copied to clipboard'); }
    catch (_) { toast('Copy this link: ' + location.href); }
  }

  $$('#year').forEach((y) => { y.textContent = new Date().getFullYear(); });

  /* =========================================================
     HOME PAGE
     ========================================================= */
  // Bird's-eye quiz
  const quiz = $('#birdQuiz');
  if (quiz) {
    const answers = { tree: 'the tree', leaves: 'the leaves', bird: 'the bird' };
    quiz.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = (new FormData(quiz)).get('see');
      const out = $('#quizResult');
      if (!v) { out.innerHTML = 'Choose what you see first.'; out.classList.add('show'); return; }
      $$('.opt', quiz).forEach((o) => {
        const val = $('input', o).value;
        o.classList.toggle('correct', val === 'eye');
        o.classList.toggle('wrong', val === v && v !== 'eye');
      });
      out.innerHTML = v === 'eye'
        ? `<strong style="color:var(--gold-2)">Exactly.</strong> Like Arjuna, you see only your goal. That is <em>Ekagrata</em>.<br><button type="button" class="link-btn" data-arena="focus">Prove it in the Focus Challenge <svg><use href="#i-arrow"/></svg></button>`
        : `Like the other princes, you saw <em>${answers[v]}</em>. Arjuna saw <strong style="color:var(--gold-2)">only the bird's eye</strong>, and his arrow struck true.<br><button type="button" class="link-btn" data-arena="focus">Train your focus <svg><use href="#i-arrow"/></svg></button>`;
      out.classList.add('show');
      $('button[type="submit"]', quiz).textContent = 'Try Again';
      quiz.dataset.revealed = '1';
    });
    quiz.addEventListener('change', () => {
      if (!quiz.dataset.revealed) return;
      delete quiz.dataset.revealed;
      $$('.opt', quiz).forEach((o) => o.classList.remove('correct', 'wrong'));
      $('#quizResult').classList.remove('show');
      $('button[type="submit"]', quiz).textContent = 'Reveal Answer';
    });
  }

  // classroom illustration: identical students, one different
  const studentsG = $('.classroom .students');
  if (studentsG) {
    let html = '';
    const rows = 3, cols = 6;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = 52 + c * 63 + (r % 2 ? 10 : 0), y = 128 + r * 54, scale = 1 - r * -0.06;
        const unique = r === 1 && c === 3;
        html += `<g class="student${unique ? ' unique' : ''}" transform="translate(${x} ${y}) scale(${scale})">
          <circle class="head" cx="0" cy="-16" r="8"/><path class="body" d="M-13 10 C-13 -4 13 -4 13 10Z"/><rect class="desk" x="-20" y="8" width="40" height="8" rx="2"/></g>`;
      }
    }
    studentsG.innerHTML = html;
  }

  /* ---------------- progress (charts) ---------------- */
  const SAMPLE = { scores: [38, 45, 43, 55, 61, 58, 70, 74, 85], acc: 85, react: 1.2, completed: 12, level: 1, radar: { Focus: 78, Speed: 70, Consistency: 66, 'Decision making': 72, Accuracy: 85 } };

  function computeProgress() {
    const st = Store.load();
    if (!st.sessions.length) return { sample: true, ...SAMPLE };
    const s = st.sessions;
    const recent = (type) => s.filter((x) => x.type === type).slice(-6);
    const avgOf = (arr, k) => arr.length ? arr.reduce((a, x) => a + (x[k] || 0), 0) / arr.length : null;
    const arch = recent('archery'), foc = recent('focus');
    const reacts = s.slice(-8).map((x) => x.reaction).filter((x) => x != null);
    const react = reacts.reduce((a, b) => a + b, 0) / reacts.length;
    const accSrc = arch.length ? arch : foc;
    const speed = Math.max(0, Math.min(100, Math.round((2.6 - react) / 2.2 * 100)));
    return {
      sample: false,
      scores: s.slice(-10).map((x) => x.score),
      acc: Math.round(avgOf(accSrc.slice(-3), 'accuracy')),
      react, completed: st.completed, level: st.level,
      radar: {
        Focus: foc.length ? Math.round(avgOf(foc, 'accuracy')) : 0,
        Speed: speed,
        Consistency: arch.length ? Math.round(avgOf(arch, 'consistency')) : 0,
        'Decision making': foc.length ? Math.round(avgOf(foc, 'decision')) : 0,
        Accuracy: arch.length ? Math.round(avgOf(arch, 'accuracy')) : 0,
      },
    };
  }

  function drawLine(svg, data) {
    const W = 420, H = 210, pl = 30, pr = 12, pt = 16, pb = 26;
    const n = data.length;
    const xs = (i) => pl + (n === 1 ? (W - pl - pr) / 2 : i * (W - pl - pr) / (n - 1));
    const ys = (v) => pt + (1 - v / 100) * (H - pt - pb);
    let grid = '';
    [0, 25, 50, 75, 100].forEach((v) => { grid += `<line class="grid" x1="${pl}" x2="${W - pr}" y1="${ys(v)}" y2="${ys(v)}"/><text class="axis" x="${pl - 6}" y="${ys(v) + 3}" text-anchor="end">${v}</text>`; });
    data.forEach((_, i) => { grid += `<text class="axis" x="${xs(i)}" y="${H - 8}" text-anchor="middle">S${i + 1}</text>`; });
    const pts = data.map((v, i) => `${xs(i).toFixed(1)},${ys(v).toFixed(1)}`);
    const area = `M${xs(0)},${ys(0)} L${pts.join(' L')} L${xs(n - 1)},${ys(0)} Z`;
    svg.innerHTML = `<defs><linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2cc7a" stop-opacity=".28"/><stop offset="1" stop-color="#f2cc7a" stop-opacity="0"/></linearGradient></defs>
      ${grid}<path class="area" d="${area}" opacity="0"/><polyline class="line" points="${pts.join(' ')}"/>
      ${data.map((v, i) => `<circle class="pt" cx="${xs(i)}" cy="${ys(v)}" r="4" data-v="${v}" data-i="${i + 1}"><title>Session ${i + 1}: ${v}%</title></circle>`).join('')}
      <text class="tip" id="lineTip" x="0" y="0" opacity="0"></text>`;
    const line = $('.line', svg);
    const len = line.getTotalLength ? line.getTotalLength() : 600;
    line.style.strokeDasharray = len;
    line.style.strokeDashoffset = len;
    $$('.pt', svg).forEach((p) => { p.style.opacity = 0; });
    const animate = () => {
      line.style.transition = 'stroke-dashoffset 1.8s cubic-bezier(.2,.7,.2,1)';
      line.style.strokeDashoffset = 0;
      $('.area', svg).style.transition = 'opacity 1.2s .8s'; $('.area', svg).setAttribute('opacity', 1);
      $$('.pt', svg).forEach((p, i) => { p.style.transition = `opacity .4s ${0.3 + i * 1.5 / n}s`; p.style.opacity = 1; });
    };
    svg.closest('.chart-card').classList.contains('in') ? requestAnimationFrame(animate) : (svg._animate = animate);
    const tip = $('#lineTip', svg);
    $$('.pt', svg).forEach((p) => {
      p.addEventListener('mouseenter', () => { tip.textContent = `${p.dataset.v}%`; tip.setAttribute('x', +p.getAttribute('cx') + 8); tip.setAttribute('y', +p.getAttribute('cy') - 8); tip.setAttribute('opacity', 1); });
      p.addEventListener('mouseleave', () => tip.setAttribute('opacity', 0));
    });
  }

  function drawRadar(svg, radar) {
    const cx = 160, cy = 145, R = 92;
    const keys = ['Focus', 'Speed', 'Consistency', 'Decision making', 'Accuracy'];
    const ang = (i) => -Math.PI / 2 + i * 2 * Math.PI / keys.length;
    const pt = (i, r) => [cx + Math.cos(ang(i)) * r, cy + Math.sin(ang(i)) * r];
    let s = '';
    [.25, .5, .75, 1].forEach((k) => { s += `<polygon class="ring" points="${keys.map((_, i) => pt(i, R * k).join(',')).join(' ')}"/>`; });
    keys.forEach((_, i) => { const [x, y] = pt(i, R); s += `<line class="spoke" x1="${cx}" y1="${cy}" x2="${x}" y2="${y}"/>`; });
    s += `<polygon class="shape" points="${keys.map((k, i) => pt(i, R * Math.max(.04, (radar[k] || 0) / 100)).join(',')).join(' ')}"/>`;
    keys.forEach((k, i) => {
      const [x, y] = pt(i, R + 22);
      const anchor = Math.abs(x - cx) < 10 ? 'middle' : x > cx ? 'start' : 'end';
      const parts = k === 'Decision making' ? ['Decision', 'making'] : [k];
      s += `<text class="lbl" x="${x}" y="${y}" text-anchor="${anchor}">${parts.map((p, j) => `<tspan x="${x}" dy="${j ? 12 : 0}">${p}</tspan>`).join('')}</text>`;
      s += `<text class="val" x="${x}" y="${y + (parts.length > 1 ? 25 : 13)}" text-anchor="${anchor}">${radar[k] || '—'}</text>`;
    });
    svg.innerHTML = s;
  }

  function animateNumber(el, to, fmt, dur = 1200) {
    if (reduceMotion) { el.textContent = fmt(to); return; }
    const start = performance.now();
    (function step(t) {
      const p = Math.min(1, (t - start) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(to * e);
      if (p < 1) requestAnimationFrame(step);
    })(start);
  }

  function renderProgress() {
    const line = $('#lineChart');
    if (!line) return;
    const d = computeProgress();
    drawLine(line, d.scores);
    drawRadar($('#radarChart'), d.radar);
    const go = () => {
      animateNumber($('#stAcc'), d.acc, (v) => Math.round(v) + '%');
      animateNumber($('#stReact'), d.react, (v) => v.toFixed(1) + 's');
      animateNumber($('#stChal'), Math.min(20, d.completed), (v) => Math.round(v) + '/20');
      $('#stLevel').textContent = Store.LEVELS[d.level];
    };
    const panel = $('.stat-panel');
    panel.classList.contains('in') ? go() : (panel._go = go);
    $('#progSource').textContent = d.sample ? 'Sample data. Finish a challenge to see your own results.' : `Your results from ${Store.load().sessions.length} session${Store.load().sessions.length > 1 ? 's' : ''}, saved on this device.`;
    $('.prog-note').classList.toggle('live', !d.sample);
    renderPath();
  }

  // run deferred chart animations when they scroll into view
  const chartObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      setTimeout(() => {
        const svg = $('svg', el);
        if (svg && svg._animate) { svg._animate(); svg._animate = null; }
        if (el._go) { el._go(); el._go = null; }
      }, 250);
    });
  }, { threshold: .3 });
  $$('.chart-card, .stat-panel').forEach((el) => chartObs.observe(el));

  const reset = $('#resetProgress');
  if (reset) reset.addEventListener('click', () => {
    if (!Store.load().sessions.length) { toast('Nothing to reset yet. Start a challenge first.'); return; }
    if (confirm('Reset all your training progress on this device?')) { Store.reset(); toast('Progress reset'); }
  });
  document.addEventListener('progress:update', renderProgress);

  /* ---------------- learning path ---------------- */
  const STAGES = [
    { title: 'Assessment', text: 'Five arrows at a slow-moving target reveal your accuracy, reaction time and steadiness. This is your starting point.', cta: 'assessment', label: 'Take Assessment' },
    { title: 'Beginner Challenges', text: 'A large, still target with no wind. Master the draw: hold until the ring is full, then release.', cta: 'archery', label: 'Train' },
    { title: 'Guided Practice', text: 'Intermediate level. The target begins to move and a light wind appears. The Guru coaches you to lead your aim.', cta: 'archery', label: 'Train' },
    { title: 'Advanced Challenges', text: 'Smaller targets moving in two directions, stronger wind, and shorter focus windows in the Bird\'s-Eye test.', cta: 'archery', label: 'Train' },
    { title: 'Mastery', text: 'Master level. The smallest, fastest targets with gusting wind. Reach it by scoring 75%+ at Advanced.', cta: 'archery', label: 'Train' },
  ];
  let selectedStage = null;
  function currentStage() {
    const st = Store.load();
    return st.assessed ? st.level + 1 : 0;
  }
  function renderPath() {
    const nodes = $$('.path-node');
    if (!nodes.length) return;
    const cur = currentStage();
    const sel = selectedStage == null ? cur : selectedStage;
    nodes.forEach((n, i) => {
      n.classList.toggle('done', i < cur);
      n.classList.toggle('current', i === cur);
      n.classList.toggle('selected', i === sel);
      n.setAttribute('aria-pressed', String(i === sel));
    });
    const fill = $('#pathFill');
    const fillTo = () => { fill.style.width = (cur / (STAGES.length - 1) * 100) + '%'; };
    $('.path-track').classList.contains('in') ? fillTo() : setTimeout(fillTo, 900);
    const s = STAGES[sel];
    const locked = sel > cur;
    const status = sel < cur ? 'Completed' : sel === cur ? 'You are here' : 'Locked';
    $('#pathDetail').innerHTML = `<div><h4>${s.title}<span class="tag">${status}</span></h4><p>${s.text}${locked ? ' Keep training to unlock this stage.' : ''}</p></div>
      <button class="btn ${locked ? 'btn-outline' : 'btn-gold'} btn-sm" data-arena="${sel === 0 ? 'assessment' : locked ? 'assessment' : s.cta}">${locked ? 'Continue Your Path' : sel === 0 && cur > 0 ? 'Retake Assessment' : s.label} <svg class="ic"><use href="#i-arrow"/></svg></button>`;
  }
  $$('.path-node').forEach((n) => n.addEventListener('click', () => { selectedStage = +n.dataset.stage; renderPath(); $('#pathDetail').classList.add('show'); }));

  renderProgress();

  /* =========================================================
     GURUKUL PAGE
     ========================================================= */
  const SCENES = [
    { img: IMG.range, pos: '60% 50%', name: 'Archery Grounds', desc: 'A peaceful yet rigorous place where young warriors trained their mind, body and character. The gurukul was more than a school. It was a way of life.' },
    { img: IMG.gate, pos: '50% 60%', name: 'The Gurukul Gate', desc: 'Every shishya entered through these stone pillars. The sacred fire burned day and night, a reminder that learning is a lifelong flame.' },
    { img: IMG.guru, pos: '70% 40%', name: 'Teaching Pavilion', desc: 'Seated in a circle beneath the trees, students listened, questioned and debated. The guru knew each one by name, nature and need.' },
    { img: IMG.gate, pos: '52% 38%', zoom: 1.6, name: 'Temple Courtyard', desc: 'At dawn, students gathered in the courtyard for meditation and chanting. Ekagrata was trained before the bow was ever lifted.' },
    { img: IMG.range, pos: '20% 50%', zoom: 1.5, name: 'Banyan Grove', desc: 'Ancient banyan roots shaded the practice paths. Here students learned patience, because the tree grows slowly but stands for centuries.' },
  ];
  const thumbs = $('#envThumbs');
  if (thumbs) {
    const bgWrap = $('.env-bgs');
    let idx = 0;
    thumbs.innerHTML = SCENES.map((s, i) => `<button class="thumb${i === 0 ? ' active' : ''}" data-i="${i}" aria-label="${s.name}" style="background-image:url(${s.img});background-position:${s.pos};background-size:${s.zoom ? s.zoom * 100 + '%' : 'cover'}"><span>${s.name}</span></button>`).join('');
    function setScene(i) {
      idx = (i + SCENES.length) % SCENES.length;
      const s = SCENES[idx];
      const layer = document.createElement('div');
      layer.className = 'env-bg';
      layer.style.cssText = `background-image:url(${s.img});background-position:${s.pos};${s.zoom ? `background-size:${s.zoom * 100}% auto;` : ''}`;
      bgWrap.appendChild(layer);
      requestAnimationFrame(() => requestAnimationFrame(() => layer.classList.add('active')));
      const old = $$('.env-bg', bgWrap).slice(0, -1);
      setTimeout(() => old.forEach((o) => o.remove()), 1300);
      $$('.thumb', thumbs).forEach((t, k) => t.classList.toggle('active', k === idx));
      const desc = $('#envDesc'), cap = $('#envCaption');
      desc.style.opacity = 0; cap.style.opacity = 0;
      setTimeout(() => { desc.textContent = s.desc; cap.textContent = s.name; desc.style.opacity = 1; cap.style.opacity = 1; }, 300);
      desc.style.transition = cap.style.transition = 'opacity .3s';
    }
    thumbs.addEventListener('click', (e) => { const t = e.target.closest('.thumb'); if (t) { setScene(+t.dataset.i); restartAuto(); } });
    $('#envPrev').addEventListener('click', () => { setScene(idx - 1); restartAuto(); });
    $('#envNext').addEventListener('click', () => { setScene(idx + 1); restartAuto(); });
    let auto;
    const env = $('#environment');
    function restartAuto() { clearInterval(auto); auto = setInterval(() => { if (env.classList.contains('in-view') && !document.hidden) setScene(idx + 1); }, 7000); }
    restartAuto();

    // lightbox gallery
    function lightbox(i) {
      let k = i;
      const render = () => {
        const s = SCENES[k];
        $('.modal-inner', modal).innerHTML = `<div class="modal-content"><div class="modal-eyebrow">The Gurukul Environment · ${k + 1} / ${SCENES.length}</div><h3>${s.name}</h3><div style="height:12px"></div>
          <div class="lightbox-img" style="background-image:url(${s.img});background-position:${s.pos};background-size:${s.zoom ? s.zoom * 100 + '% auto' : 'cover'}"></div>
          <p>${s.desc}</p>
          <div class="lightbox-nav"><button class="btn btn-outline btn-sm" data-lb="-1"><svg class="ic"><use href="#i-chev-left"/></svg> Previous</button><button class="btn btn-outline btn-sm" data-lb="1">Next <svg class="ic"><use href="#i-chev-right"/></svg></button></div></div>`;
      };
      openModal('');
      render();
      modal.onclick = (e) => { const b = e.target.closest('[data-lb]'); if (b) { k = (k + +b.dataset.lb + SCENES.length) % SCENES.length; render(); setScene(k); } };
    }
    $('#exploreEnv').addEventListener('click', () => lightbox(idx));
    document.addEventListener('keydown', (e) => {
      if (!modal.classList.contains('open') || !$('[data-lb]', modal)) return;
      if (e.key === 'ArrowRight') $('[data-lb="1"]', modal).click();
      if (e.key === 'ArrowLeft') $('[data-lb="-1"]', modal).click();
    });
  }

  // quotes
  const QUOTES = [
    'True learning begins when you understand your own strengths and limitations.',
    'Do not look at the tree, the leaves or the sky. Look only at your goal.',
    'Practice in the light, and practise again in the dark, until the hand knows what the eye intends.',
    'A teacher shows the path. The student must walk it, one disciplined step at a time.',
    'Steady the breath, steady the mind, and the arrow will follow.',
  ];
  const qBtn = $('#quoteNext');
  if (qBtn) {
    let qi = 0;
    const span = $('#quoteText span');
    const next = () => {
      qi = (qi + 1) % QUOTES.length;
      span.classList.add('swap');
      setTimeout(() => { span.textContent = QUOTES[qi]; span.classList.remove('swap'); }, 350);
    };
    qBtn.addEventListener('click', next);
    setInterval(() => { if ($('#meet-guru').classList.contains('in-view') && !document.hidden) next(); }, 9000);
  }

  // guided orientation: tour the four features, then scroll to the environment
  const orient = $('#beginOrientation');
  if (orient) {
    orient.addEventListener('click', () => {
      const feats = $$('[data-orient]');
      const msgs = ['Discover the gurukul and its daily life', 'Meet your guru, Dronacharya', 'Experience training in the arena', 'Begin your personalized path'];
      feats.forEach((f, i) => setTimeout(() => {
        feats.forEach((x) => x.classList.remove('orient'));
        f.classList.add('orient');
        toast(`${i + 1}/4 · ${msgs[i]}`);
      }, i * 1100));
      setTimeout(() => {
        feats.forEach((x) => x.classList.remove('orient'));
        $('#environment').scrollIntoView({ behavior: 'smooth' });
      }, feats.length * 1100 + 200);
    });
  }

  // arriving with a hash on the home page (e.g. from gurukul page) — let layout settle first
  if (location.hash && page === 'home') {
    const t = document.getElementById(location.hash.slice(1));
    if (t) setTimeout(() => t.scrollIntoView({ behavior: 'auto' }), 60);
  }
})();
