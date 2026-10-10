/* =========================================================
   18 Parvas page: timeline rendering, scroll-linked timeline
   animation, and the MCQ assessment with recovery navigation.
   ========================================================= */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const IMG = PARVA_IMG;
  const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII'];
  const parvaOf = (n) => PARVAS[n - 1];
  const phaseOf = (n) => PHASES.find((ph) => n >= ph.range[0] && n <= ph.range[1]);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* =========================================================
     RENDER
     ========================================================= */
  const totalEvents = PARVAS.reduce((a, p) => a + p.events.length, 0);
  $('#statEvents').textContent = totalEvents;

  $('#phaseCards').innerHTML = PHASES.map((ph, i) => `
    <a href="#phase-${ph.id}" class="phase-card" data-reveal style="--d:${0.1 + i * 0.12}s">
      <span class="pc-img"><img src="${IMG + ph.thumb}" alt="" loading="lazy"></span>
      <span class="pc-body">
        <span class="pc-tag">Phase ${ph.id} · Parvas ${ph.range[0]}–${ph.range[1]}</span>
        <strong>${ph.title}</strong>
        <small>${ph.text}</small>
        <span class="pc-list">${PARVAS.slice(ph.range[0] - 1, ph.range[1]).map((p) => p.name.replace(' Parva', '')).join(' · ')}</span>
      </span>
    </a>`).join('');

  $('#railTrack').innerHTML = PARVAS.map((p) => `
    <a href="#parva-${p.n}" class="rail-chip" data-n="${p.n}" title="${esc(p.name)}"><b>${p.n}</b><span>${p.name.replace(' Parva', '')}</span></a>`).join('');

  let tl = '';
  PARVAS.forEach((p) => {
    const ph = phaseOf(p.n);
    if (ph.range[0] === p.n) {
      tl += `
      <section class="section tl-phase" id="phase-${ph.id}">
        <div class="sec-bg" data-parallax="0.25" style="background-image:url(${ph.bg});background-position:${ph.pos}"></div>
        <div class="shade-impact"></div>
        <div class="container center">
          <p class="eyebrow" data-reveal>Phase ${ph.id}</p>
          <h2 class="title" data-reveal style="--d:.1s">${ph.title}</h2>
          <p class="phase-text" data-reveal style="--d:.2s">${ph.text}</p>
          <span class="phase-range" data-reveal style="--d:.3s">Parvas ${ROMAN[ph.range[0]]} – ${ROMAN[ph.range[1]]}</span>
        </div>
      </section>`;
    }
    const odd = p.n % 2 === 1;
    tl += `
    <section class="parva${odd ? '' : ' flip'}" id="parva-${p.n}" data-n="${p.n}">
      <div class="container">
        <header class="parva-head">
          <figure class="parva-cover" data-reveal="${odd ? 'left' : 'right'}">
            <img src="${IMG + p.cover}" alt="${esc(p.name)}: ${esc(p.sub)}" loading="lazy">
            <figcaption>Parva ${ROMAN[p.n]}</figcaption>
          </figure>
          <div class="parva-intro" data-reveal="${odd ? 'right' : 'left'}" style="--d:.1s">
            <span class="parva-num" aria-hidden="true">${String(p.n).padStart(2, '0')}</span>
            <p class="eyebrow">Parva ${ROMAN[p.n]} · Phase ${ph.id}</p>
            <h2 class="parva-title">${p.name}</h2>
            <p class="parva-sub">${p.sub}</p>
            <p class="parva-theme"><b>Main theme:</b> ${p.theme}</p>
            <span class="parva-count">${p.events.length} events</span>
          </div>
        </header>
        <div class="tl-events">
          <div class="tl-spine" aria-hidden="true"><i class="tl-fill"></i></div>
          ${p.events.map((ev, i) => `
          <div class="tl-event ${i % 2 ? 'right' : 'left'}" id="p${p.n}-e${i + 1}">
            <span class="tl-dot" aria-hidden="true"><b>${i + 1}</b></span>
            <article class="tl-card" data-reveal="${i % 2 ? 'right' : 'left'}">
              ${ev.img ? `<div class="tl-img"><img src="${IMG + ev.img}" alt="${esc(ev.t)}" loading="lazy"></div>` : ''}
              <div class="tl-body">
                <span class="tl-step">${p.name.replace(' Parva', '')} · Event ${i + 1}</span>
                <h3>${ev.t}</h3>
                <p>${ev.d}</p>
                ${ev.c && ev.c.length ? `<div class="tl-chars">${ev.c.map((c) => `<span>${c}</span>`).join('')}</div>` : ''}
                <div class="tl-learn" hidden></div>
              </div>
            </article>
          </div>`).join('')}
        </div>
        <div class="parva-why" data-reveal>
          <svg><use href="#i-spark"/></svg>
          <div><b>Why it matters</b><p>${p.why}</p></div>
        </div>
      </div>
    </section>`;
  });
  tl += `
    <section class="section tl-finale" id="finale">
      <div class="sec-bg" data-parallax="0.2" style="background-image:url(assets/img/home/impact.webp);background-position:40% 60%"></div>
      <div class="shade-impact"></div>
      <div class="container center">
        <p class="eyebrow" data-reveal>The story is complete</p>
        <h2 class="title" data-reveal style="--d:.1s">You Have Walked<br>the Eighteen Parvas</h2>
        <p class="finale-text" data-reveal style="--d:.2s">From Bhishma's vow to Yudhishthira's ascent. Now Dronacharya will test what you remember. Get a question wrong and he will bring you back to the exact moment to learn it again.</p>
        <div class="finale-read" data-reveal style="--d:.25s"><div class="fr-bar"><i id="finaleBar"></i></div><span id="finaleRead">0 of 18 Parvas read</span></div>
        <div class="btn-row finale-btns" data-reveal style="--d:.3s">
          <button class="btn btn-gold" data-quiz="go">Begin the Questions <svg class="ic"><use href="#i-arrow"/></svg></button>
          <a href="#reference" class="btn btn-outline">Quick Reference First</a>
        </div>
      </div>
    </section>`;
  $('#timeline').innerHTML = tl;

  $('#refBody').innerHTML = PARVAS.map((p) => `
    <tr data-goto="parva-${p.n}" tabindex="0"><td>${p.n}</td><td>${p.name.replace(' Parva', '')}</td><td>${p.events.slice(0, 3).map((e) => e.t).join(', ')}</td></tr>`).join('');
  $('#refBody').addEventListener('click', (e) => { const r = e.target.closest('tr'); if (r) goTo(r.dataset.goto); });
  $('#refBody').addEventListener('keydown', (e) => { if (e.key === 'Enter') { const r = e.target.closest('tr'); if (r) goTo(r.dataset.goto); } });

  $('#creditList').innerHTML = IMAGE_CREDITS.map(([f, label, src]) => `<li><span>${label}</span><em>${src}</em></li>`).join('');

  function goTo(id, block = 'start') {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block });
  }

  /* =========================================================
     SCROLL-LINKED TIMELINE ANIMATION
     ========================================================= */
  const spines = $$('.tl-events').map((wrap) => ({
    wrap, fill: $('.tl-fill', wrap), events: $$('.tl-event', wrap),
  }));
  const parvaEls = $$('.parva');
  const rail = $('#parvaRail');
  const railTrack = $('#railTrack');
  const railFill = $('#railFill');
  const timeline = $('#timeline');
  let currentParva = 0, ticking = false;

  /* ---------- reading progress: the Parvas come before the questions ---------- */
  const READ_KEY = 'parva_read_v1';
  let cardReady = false; // the assessment card is wired up further down
  const read = new Set((() => { try { return JSON.parse(localStorage.getItem(READ_KEY)) || []; } catch (e) { return []; } })());
  const firstUnread = () => PARVAS.find((p) => !read.has(p.n));
  function renderRead() {
    $$('.rail-chip', railTrack).forEach((c) => c.classList.toggle('read', read.has(+c.dataset.n)));
    const n = read.size;
    $('#finaleRead').textContent = n === 18 ? 'All 18 Parvas read' : `${n} of 18 Parvas read`;
    $('#finaleBar').style.transform = `scaleX(${n / 18})`;
    const rc = $('#readCount');
    if (rc) rc.textContent = `${n}/18`;
    if (cardReady) updateAssessCard();
  }
  function markRead(n) {
    if (read.has(n)) return;
    read.add(n);
    try { localStorage.setItem(READ_KEY, JSON.stringify([...read])); } catch (e) { /* storage unavailable */ }
    renderRead();
  }

  function frame() {
    ticking = false;
    const vh = window.innerHeight;
    const mark = vh * 0.6;
    spines.forEach(({ wrap, fill, events }) => {
      const r = wrap.getBoundingClientRect();
      const prog = clamp((mark - r.top) / r.height, 0, 1);
      fill.style.transform = `scaleY(${prog})`;
      // count it only when the end of the Parva actually scrolls past on screen (not when jumping over it)
      if (prog >= 0.98 && r.bottom > -120) markRead(+wrap.closest('.parva').dataset.n);
      if (r.bottom < -200 || r.top > vh + 200) return;
      const reach = prog * r.height;
      let active = null;
      events.forEach((ev) => {
        const lit = ev.offsetTop + 22 <= reach;
        ev.classList.toggle('lit', lit);
        if (lit) active = ev;
      });
      events.forEach((ev) => ev.classList.toggle('active', ev === active && prog < 1));
    });

    // which Parva are we reading?
    let cur = 0;
    parvaEls.forEach((el) => { if (el.getBoundingClientRect().top < vh * 0.45) cur = +el.dataset.n; });
    if (cur !== currentParva) {
      currentParva = cur;
      $$('.rail-chip', railTrack).forEach((c) => c.classList.toggle('active', +c.dataset.n === cur));
      const chip = $(`.rail-chip[data-n="${cur}"]`, railTrack);
      if (chip) railTrack.scrollTo({ left: chip.offsetLeft - railTrack.clientWidth / 2 + chip.clientWidth / 2, behavior: 'smooth' });
    }
    const tr = timeline.getBoundingClientRect();
    rail.classList.toggle('show', tr.top < 140 && tr.bottom > 200);
    railFill.style.transform = `scaleX(${clamp((vh * 0.45 - tr.top) / tr.height, 0, 1)})`;
  }
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  renderRead();
  frame();

  /* =========================================================
     ASSESSMENT
     ========================================================= */
  const STORE_KEY = 'parva_assessment_v1';
  const RANKS = [
    { min: 90, name: 'Arjuna', title: 'Master of Focus', text: 'Like Arjuna at the bird\'s-eye test, you saw only the goal. Your command of the epic is outstanding.' },
    { min: 75, name: 'Yudhishthira', title: 'Steady in Dharma', text: 'Wise and steady. You know the story well, and a little more review will make it complete.' },
    { min: 55, name: 'Bhima', title: 'Strong Foundations', text: 'You have real strength. Revisit the moments you missed and your next attempt will rise higher.' },
    { min: 0, name: 'Shishya', title: 'The Journey Begins', text: 'Every great warrior began as a student. Walk the timeline again. Abhyasa, steady practice, brings mastery.' },
  ];
  const rankFor = (pct) => RANKS.find((r) => pct >= r.min);
  const pointsFor = (wrong) => (wrong === 0 ? 10 : wrong === 1 ? 5 : 2);
  const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const fmtTime = (ms) => { const s = Math.round(ms / 1000); return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`; };

  function loadRecord() { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || { best: null, bestRank: null, attempts: 0 }; } catch (e) { return { best: null, bestRank: null, attempts: 0 }; } }
  function saveRecord(r) { try { localStorage.setItem(STORE_KEY, JSON.stringify(r)); } catch (e) { /* storage unavailable */ } }

  let S = null; // quiz state
  let quiz, body, reviewBar, reviewTimer = null, autoTimer = null;

  function buildQuiz() {
    quiz = document.createElement('div');
    quiz.className = 'quiz';
    quiz.id = 'quiz';
    quiz.setAttribute('role', 'dialog');
    quiz.setAttribute('aria-modal', 'true');
    quiz.setAttribute('aria-label', 'Parva assessment');
    quiz.innerHTML = `
      <div class="quiz-bg"></div>
      <div class="quiz-shell">
        <header class="quiz-head">
          <div class="arena-title"><svg><use href="#i-assess"/></svg><div><p class="eyebrow">Parva Assessment</p><h3 id="quizTitle">Question 1 of 18</h3></div></div>
          <div class="quiz-hud">
            <div class="hud-item"><span>Score</span><strong id="qScore">0</strong></div>
            <div class="hud-item"><span>First try</span><strong id="qFirst">0/0</strong></div>
            <div class="hud-item"><span>Streak</span><strong id="qStreak">0</strong></div>
          </div>
          <button class="arena-close" data-q="close" aria-label="Close assessment"><svg><use href="#i-close"/></svg></button>
        </header>
        <div class="quiz-progress"><i id="qProg"></i></div>
        <div class="quiz-dots" id="qDots"></div>
        <div class="quiz-body" id="quizBody"></div>
      </div>`;
    document.body.appendChild(quiz);
    body = $('#quizBody', quiz);
    quiz.addEventListener('click', onQuizClick);

    reviewBar = document.createElement('div');
    reviewBar.className = 'review-bar';
    reviewBar.setAttribute('role', 'status');
    reviewBar.innerHTML = `
      <div class="rb-ring"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17"/><circle class="rb-arc" cx="20" cy="20" r="17"/></svg><span id="rbCount">6</span></div>
      <div class="rb-text"><span class="rb-eyebrow">Learning mode</span><strong id="rbTitle"></strong><small id="rbSub"></small></div>
      <div class="rb-actions">
        <button class="link-btn" data-rb="locate">Show me again</button>
        <button class="btn btn-gold btn-sm" data-rb="resume" id="rbResume" disabled>Resume Question <svg class="ic"><use href="#i-arrow"/></svg></button>
      </div>`;
    document.body.appendChild(reviewBar);
    reviewBar.addEventListener('click', (e) => {
      const b = e.target.closest('[data-rb]');
      if (!b) return;
      if (b.dataset.rb === 'locate') locateReview();
      else if (!b.disabled) resumeQuestion();
    });
  }

  function openQuiz() {
    if (!quiz) buildQuiz();
    quiz.classList.add('open');
    document.body.classList.add('locked');
  }
  function closeQuiz() {
    if (!quiz) return;
    quiz.classList.remove('open');
    document.body.classList.remove('locked');
    clearTimeout(autoTimer);
    updateAssessCard();
  }

  function startQuiz() {
    if (S && !S.finished && !S.reviewing) { openQuiz(); renderQuestion(); return; }
    if (S && S.reviewing) { locateReview(); return; }
    const picks = PARVAS.map((p) => shuffle(QUESTIONS.filter((q) => q.p === p.n))[0]);
    S = {
      qs: picks, idx: 0, score: 0, bonus: 0, streak: 0, bestStreak: 0, firstTry: 0,
      res: picks.map(() => ({ wrong: 0, points: 0, done: false })),
      start: performance.now(), finished: false, reviewing: false, answered: false,
    };
    openQuiz();
    renderQuestion();
  }

  function renderHud() {
    const total = S.qs.length;
    $('#quizTitle').textContent = S.finished ? 'Assessment Complete' : `Question ${S.idx + 1} of ${total}`;
    $('#qScore').textContent = S.score;
    const answered = S.res.filter((r) => r.done).length;
    $('#qFirst').textContent = `${S.firstTry}/${answered}`;
    $('#qStreak').textContent = S.streak;
    $('#qProg').style.transform = `scaleX(${answered / total})`;
    $('#qDots').innerHTML = S.res.map((r, i) => {
      const cls = r.done ? (r.wrong ? 'review' : 'first') : i === S.idx && !S.finished ? 'current' : r.wrong ? 'missed' : '';
      return `<i class="${cls}" title="Parva ${i + 1}"></i>`;
    }).join('');
  }

  function renderQuestion() {
    const q = S.qs[S.idx];
    const r = S.res[S.idx];
    const p = parvaOf(q.p);
    S.answered = false;
    S.qStart = performance.now();
    S.order = shuffle(q.opts.map((o, i) => ({ o, correct: i === 0 })));
    body.innerHTML = `
      <div class="q-wrap">
        <div class="q-meta">
          <span class="q-parva"><img src="${IMG + p.cover}" alt="">Parva ${ROMAN[p.n]} · ${p.name}</span>
          <span class="q-worth ${r.wrong ? 'retry' : ''}">${r.wrong ? `Attempt ${r.wrong + 1} · ` : ''}Worth ${pointsFor(r.wrong)} points</span>
        </div>
        <h2 class="q-text">${q.q}</h2>
        <div class="q-opts">
          ${S.order.map((x, i) => `<button class="q-opt" data-i="${i}"><span class="q-key">${'ABCD'[i]}</span><span class="q-label">${x.o}</span></button>`).join('')}
        </div>
        <div class="q-feedback" id="qFeedback" aria-live="polite"></div>
        <p class="q-hint">Press <b>A–D</b> or <b>1–4</b> to answer.</p>
      </div>`;
    renderHud();
    quiz.querySelector('.quiz-body').scrollTop = 0;
  }

  function answer(i) {
    if (!S || S.answered || S.finished) return;
    S.answered = true;
    const choice = S.order[i];
    const q = S.qs[S.idx];
    const r = S.res[S.idx];
    const p = parvaOf(q.p);
    const ev = p.events[q.e - 1];
    const btns = $$('.q-opt', body);
    btns.forEach((b) => { b.disabled = true; });
    const fb = $('#qFeedback', body);
    if (choice.correct) {
      btns[i].classList.add('correct');
      let pts = pointsFor(r.wrong);
      let bonusTxt = '';
      if (r.wrong === 0) {
        S.firstTry++;
        S.streak++;
        S.bestStreak = Math.max(S.bestStreak, S.streak);
        if (S.streak % 3 === 0) { pts += 3; S.bonus += 3; bonusTxt = `<span class="q-bonus">+3 streak bonus</span>`; }
      } else S.streak = 0;
      r.points = pts; r.done = true;
      S.score += pts;
      const last = S.idx === S.qs.length - 1;
      fb.className = 'q-feedback good show';
      fb.innerHTML = `
        <div class="fb-head"><strong>Correct! +${pts}</strong>${bonusTxt}</div>
        <p>${q.learn}</p>
        <button class="btn btn-gold btn-sm" data-q="next">${last ? 'See My Results' : 'Next Question'} <svg class="ic"><use href="#i-arrow"/></svg></button>`;
      $('[data-q="next"]', fb).focus({ preventScroll: true });
    } else {
      // a mistake stops the test right here and goes straight to the moment in the timeline
      btns[i].classList.add('wrong');
      r.wrong++;
      S.streak = 0;
      S.lastWrong = choice.o;
      fb.className = 'q-feedback bad show';
      fb.innerHTML = `
        <div class="fb-head"><strong>Wrong answer. The test stops here.</strong></div>
        <p>Taking you to <b>${ev.t}</b> (${p.name}, event ${q.e}) to learn it…</p>`;
      autoTimer = setTimeout(goReview, 700);
    }
    renderHud();
  }

  function next() {
    if (S.idx >= S.qs.length - 1) return finish();
    S.idx++;
    renderQuestion();
  }

  /* ---------- recovery navigation ---------- */
  function goReview() {
    clearTimeout(autoTimer);
    if (!S || S.reviewing) return;
    const q = S.qs[S.idx];
    const p = parvaOf(q.p);
    const id = `p${q.p}-e${q.e}`;
    S.reviewing = true;
    S.reviewId = id;
    closeQuiz();
    const el = document.getElementById(id);
    el.classList.add('review');
    const learn = $('.tl-learn', el);
    learn.innerHTML = `<b>Where you went wrong</b><span class="tl-yours">Your answer: <s>${esc(S.lastWrong || '')}</s></span>${q.learn}`;
    learn.hidden = false;
    $('#rbTitle').textContent = p.events[q.e - 1].t;
    $('#rbSub').textContent = `You answered "${S.lastWrong}". Read this event in the ${p.name}, then return to the same question.`;
    reviewBar.classList.add('show');
    setTimeout(() => scrollToLearn(el), 120);

    // short reading period before the learner can resume
    const btn = $('#rbResume'), count = $('#rbCount'), arc = $('.rb-arc', reviewBar);
    let left = 6;
    btn.disabled = true;
    count.textContent = left;
    arc.style.strokeDashoffset = 0;
    clearInterval(reviewTimer);
    reviewTimer = setInterval(() => {
      left--;
      count.textContent = Math.max(0, left);
      arc.style.strokeDashoffset = (107 * (6 - left)) / 6;
      if (left <= 0) {
        clearInterval(reviewTimer);
        btn.disabled = false;
        count.textContent = '✓';
        reviewBar.classList.add('rb-ready');
        btn.focus({ preventScroll: true });
      }
    }, 1000);
  }

  // land with the "Where you went wrong" box fully visible above the learning-mode bar
  function scrollToLearn(el) {
    const box = $('.tl-learn', el) || el;
    const r = box.getBoundingClientRect();
    const barSpace = (reviewBar.offsetHeight || 100) + 40;
    const want = Math.max(150, window.innerHeight - barSpace - r.height);
    window.scrollTo({ top: window.scrollY + r.top - want, behavior: 'smooth' });
  }
  function locateReview() {
    const el = S && S.reviewId && document.getElementById(S.reviewId);
    if (el) scrollToLearn(el);
  }

  function endReview() {
    clearInterval(reviewTimer);
    reviewBar.classList.remove('show', 'rb-ready');
    const el = document.getElementById(S.reviewId);
    if (el) { el.classList.remove('review'); const l = $('.tl-learn', el); l.hidden = true; l.innerHTML = ''; }
    S.reviewing = false;
  }

  function resumeQuestion() {
    endReview();
    openQuiz();
    renderQuestion();
  }

  /* ---------- results ---------- */
  function finish() {
    S.finished = true;
    S.time = performance.now() - S.start;
    const total = S.qs.length;
    const max = total * 10 + Math.floor(total / 3) * 3;
    const pct = Math.round((S.score / max) * 100);
    const rank = rankFor(pct);
    const revisited = S.qs.map((q, i) => ({ q, r: S.res[i] })).filter((x) => x.r.wrong > 0);

    const rec = loadRecord();
    const isBest = rec.best == null || S.score > rec.best;
    rec.attempts = (rec.attempts || 0) + 1;
    if (isBest) { rec.best = S.score; rec.bestRank = rank.name; rec.bestPct = pct; }
    rec.last = { score: S.score, pct, date: Date.now() };
    saveRecord(rec);
    if (typeof Store !== 'undefined') Store.setLevel(pct >= 75 ? 2 : pct >= 50 ? 1 : 0);

    const phaseRows = PHASES.map((ph) => {
      const idxs = S.qs.map((q, i) => i).filter((i) => S.qs[i].p >= ph.range[0] && S.qs[i].p <= ph.range[1]);
      const got = idxs.reduce((a, i) => a + Math.min(10, S.res[i].points), 0);
      const pmax = idxs.length * 10;
      return `<div class="ph-row"><span>Phase ${ph.id} · ${ph.title}</span><div class="ph-bar"><i data-w="${Math.round((got / pmax) * 100)}"></i></div><b>${got}/${pmax}</b></div>`;
    }).join('');

    const C = 2 * Math.PI * 84;
    body.innerHTML = `
      <div class="res-wrap">
        <div class="res-top">
          <div class="res-ring">
            <svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="84" class="rr-bg"/><circle cx="100" cy="100" r="84" class="rr-fg" style="stroke-dasharray:${C};stroke-dashoffset:${C}" data-off="${C * (1 - pct / 100)}"/></svg>
            <div class="rr-center"><strong id="resScore">0</strong><span>of ${max} points</span></div>
          </div>
          <div class="res-info">
            <p class="eyebrow">Assessment complete${isBest ? ' · New best score!' : ''}</p>
            <h2 class="title">${rank.name}: ${rank.title}</h2>
            <p>${rank.text}</p>
            <div class="res-stats">
              <div class="glass"><span>Score</span><strong>${pct}%</strong></div>
              <div class="glass"><span>First-try accuracy</span><strong>${S.firstTry}/${total}</strong></div>
              <div class="glass"><span>Moments revisited</span><strong>${revisited.length}</strong></div>
              <div class="glass"><span>Best streak</span><strong>${S.bestStreak}</strong></div>
              <div class="glass"><span>Streak bonus</span><strong>+${S.bonus}</strong></div>
              <div class="glass"><span>Time taken</span><strong>${fmtTime(S.time)}</strong></div>
            </div>
          </div>
        </div>
        <div class="res-cols">
          <div class="glass res-panel">
            <h4>Score by phase</h4>
            ${phaseRows}
            <div class="q-chips">${S.qs.map((q, i) => `<span class="${S.res[i].wrong ? 'rv' : 'ft'}" title="${esc(parvaOf(q.p).name)}">${i + 1}<b>${S.res[i].points}</b></span>`).join('')}</div>
          </div>
          <div class="glass res-panel">
            <h4>${revisited.length ? 'Moments to revisit' : 'A flawless run'}</h4>
            ${revisited.length
              ? `<ul class="res-list">${revisited.map(({ q, r }) => `<li><button data-goto="p${q.p}-e${q.e}"><span>${parvaOf(q.p).name.replace(' Parva', '')}</span><strong>${parvaOf(q.p).events[q.e - 1].t}</strong><em>${r.wrong} review${r.wrong > 1 ? 's' : ''}</em></button></li>`).join('')}</ul>`
              : '<p>You answered every question correctly on the first try. Arjuna would be proud.</p>'}
          </div>
        </div>
        <div class="btn-row res-actions">
          <button class="btn btn-gold" data-q="retake">Retake Assessment <svg class="ic"><use href="#i-reset"/></svg></button>
          <button class="btn btn-outline" data-q="explore">Explore the Timeline</button>
        </div>
      </div>`;
    renderHud();
    requestAnimationFrame(() => setTimeout(() => {
      const fg = $('.rr-fg', body);
      fg.style.strokeDashoffset = fg.dataset.off;
      $$('.ph-bar i', body).forEach((b) => { b.style.width = b.dataset.w + '%'; });
      const el = $('#resScore', body), t0 = performance.now();
      (function step(t) { const k = Math.min(1, (t - t0) / 1400); el.textContent = Math.round(S.score * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); })(t0);
    }, 80));
    updateAssessCard();
  }

  function onQuizClick(e) {
    const opt = e.target.closest('.q-opt');
    if (opt) { answer(+opt.dataset.i); return; }
    const goto = e.target.closest('[data-goto]');
    if (goto) { closeQuiz(); setTimeout(() => goTo(goto.dataset.goto, 'center'), 150); return; }
    const b = e.target.closest('[data-q]');
    if (!b) return;
    const a = b.dataset.q;
    if (a === 'close') closeQuiz();
    else if (a === 'next') next();
    else if (a === 'review') goReview();
    else if (a === 'retake') { S = null; startQuiz(); }
    else if (a === 'explore') { closeQuiz(); setTimeout(() => goTo('phases'), 150); }
  }

  document.addEventListener('keydown', (e) => {
    if (!quiz || !quiz.classList.contains('open')) return;
    if (e.key === 'Escape') { closeQuiz(); return; }
    if (!S || S.finished) return;
    const k = e.key.toLowerCase();
    const map = { a: 0, b: 1, c: 2, d: 3, 1: 0, 2: 1, 3: 2, 4: 3 };
    if (k in map && !S.answered) { e.preventDefault(); answer(map[k]); }
  });

  function updateAssessCard() {
    const rec = loadRecord();
    $('#bestScore').textContent = rec.best == null ? '—' : `${rec.best}${rec.bestPct != null ? ` (${rec.bestPct}%)` : ''}`;
    $('#bestRank').textContent = rec.bestRank || '—';
    $('#attemptCount').textContent = rec.attempts || 0;
    const btn = $('#assessStartBtn'), note = $('#assessNote');
    if (S && S.reviewing) { btn.firstChild.textContent = 'Return to Review '; note.textContent = 'You are in learning mode. Read the highlighted event, then resume your question.'; }
    else if (S && !S.finished) { btn.firstChild.textContent = 'Resume Assessment '; note.textContent = `In progress: question ${S.idx + 1} of ${S.qs.length}, score ${S.score}.`; }
    else if (!rec.attempts && read.size < 18) { btn.firstChild.textContent = read.size ? 'Continue the Parvas ' : 'Begin with the Parvas '; note.textContent = 'Walk the timeline first. The questions open once you have read all 18 Parvas.'; }
    else { btn.firstChild.textContent = rec.attempts ? 'Retake Assessment ' : 'Start the Questions '; note.textContent = 'Takes about 5 to 8 minutes. Your best score is saved on this device.'; }
  }
  cardReady = true;
  updateAssessCard();

  /* ---------- gate: if the Parvas are not finished, guide the learner back to them ---------- */
  let gate = null;
  function closeGate() { if (gate) { gate.classList.remove('open'); document.body.classList.remove('locked'); } }
  function openGate() {
    const next = firstUnread();
    if (!gate) {
      gate = document.createElement('div');
      gate.className = 'modal pv-gate';
      gate.setAttribute('role', 'dialog');
      gate.setAttribute('aria-modal', 'true');
      gate.setAttribute('aria-label', 'Begin with the Parvas');
      document.body.appendChild(gate);
      gate.addEventListener('click', (e) => {
        const a = e.target.closest('[data-gate]');
        if (!a) return;
        const act = a.dataset.gate;
        closeGate();
        if (act === 'continue') { const nx = firstUnread(); setTimeout(() => goTo(nx ? `parva-${nx.n}` : 'finale'), 150); }
        else if (act === 'anyway') { if (S && S.finished) S = null; startQuiz(); }
      });
    }
    gate.innerHTML = `<div class="modal-backdrop" data-gate="close"></div>
      <div class="modal-box"><button class="modal-close" data-gate="close" aria-label="Close"><svg><use href="#i-close"/></svg></button>
        <div class="modal-media" style="background-image:url(${IMG + next.cover});background-position:center"></div>
        <div class="modal-content">
          <div class="modal-eyebrow">The story comes first</div>
          <h3>Begin with the Parvas</h3><div style="height:12px"></div>
          <p>Dronacharya's questions follow the story, so walk the timeline first. You have read <b>${read.size} of 18</b> Parvas. Each one is marked as read once you scroll through all of its events.</p>
          <div class="gate-bar"><i style="transform:scaleX(${read.size / 18})"></i></div>
          <div class="modal-actions">
            <button class="btn btn-gold btn-sm" data-gate="continue">${read.size ? 'Continue with' : 'Begin with'} Parva ${ROMAN[next.n]}: ${next.name.replace(' Parva', '')} <svg class="ic"><use href="#i-arrow"/></svg></button>
            <button class="link-btn" data-gate="anyway">Start the questions anyway</button>
          </div>
        </div>
      </div>`;
    gate.classList.add('open');
    document.body.classList.add('locked');
    setTimeout(() => { const b = $('[data-gate="continue"]', gate); if (b) b.focus({ preventScroll: true }); }, 50);
  }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeGate(); });

  document.addEventListener('click', (e) => {
    const s = e.target.closest('[data-quiz="start"], [data-quiz="go"]');
    if (!s) return;
    e.preventDefault();
    const inProgress = S && !S.finished;
    // "go" is the button at the end of the timeline; everything else checks the reading progress first
    if (s.dataset.quiz === 'start' && !inProgress && !loadRecord().attempts && read.size < 18) { openGate(); return; }
    if (S && S.finished) S = null;
    startQuiz();
  });
  // arriving from a Skill Assessment button anywhere on the site: go straight to the questions
  if (new URLSearchParams(location.search).get('assess') === '1') {
    history.replaceState(null, '', location.pathname + location.hash);
    setTimeout(startQuiz, 400);
  }
})();
