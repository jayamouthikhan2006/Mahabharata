/* =========================================================
   Progress store + Training Arena (archery & focus simulator)
   ========================================================= */
const Store = (() => {
  const KEY = 'dronacharya_training_v1';
  const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Master'];
  const fresh = () => ({ level: 0, assessed: false, completed: 0, sessions: [] });
  let mem = null;

  function load() {
    if (mem) return mem;
    try { mem = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY)) || {}); }
    catch (e) { mem = fresh(); }
    return mem;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* storage blocked: keep in memory */ }
    document.dispatchEvent(new CustomEvent('progress:update'));
  }
  function record(session, newLevel, assessed) {
    load();
    mem.sessions.push(session);
    if (mem.sessions.length > 40) mem.sessions.shift();
    mem.completed += 1;
    mem.level = newLevel;
    if (assessed) mem.assessed = true;
    save();
  }
  function reset() { mem = fresh(); save(); }
  // set by the Parva skill assessment
  function setLevel(level) { load(); mem.level = level; mem.assessed = true; save(); }
  return { load, record, reset, setLevel, LEVELS };
})();

const Arena = (() => {
  const W = 960, H = 540;
  const LEVELS = Store.LEVELS;
  // Difficulty per level. r = target radius, move/vmove = target travel, sway = aim wobble, wind = max drift
  const CFG = [
    { r: 74, move: 0, vmove: 0, speed: 0, sway: 5, wind: 0, window: 2300, birdScale: 1.15 },
    { r: 60, move: 120, vmove: 0, speed: .9, sway: 8, wind: .7, window: 1750, birdScale: 1 },
    { r: 48, move: 170, vmove: 50, speed: 1.25, sway: 11, wind: 1.3, window: 1350, birdScale: .86 },
    { r: 38, move: 220, vmove: 70, speed: 1.7, sway: 14, wind: 2, window: 1000, birdScale: .74 },
  ];
  const ASSESS = { r: 66, move: 70, vmove: 0, speed: .7, sway: 7, wind: .4 };

  let root, canvas, ctx, stage, stageMsg, raf = 0, last = 0, game = null, isOpen = false;
  const bgImg = new Image();
  let bgCache = null;
  bgImg.onload = () => {
    bgCache = document.createElement('canvas');
    bgCache.width = W; bgCache.height = H;
    const b = bgCache.getContext('2d');
    const s = Math.max(W / bgImg.width, H / bgImg.height);
    const iw = bgImg.width * s, ih = bgImg.height * s;
    b.filter = 'blur(3px) brightness(0.55) saturate(0.9)';
    b.drawImage(bgImg, (W - iw) / 2, (H - ih) / 2, iw, ih);
    b.filter = 'none';
    const g = b.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(10,6,2,.15)'); g.addColorStop(1, 'rgba(10,6,2,.55)');
    b.fillStyle = g; b.fillRect(0, 0, W, H);
  };
  bgImg.src = 'assets/img/archery-range.jpg';

  const $ = (sel) => root.querySelector(sel);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const avg = (a) => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
  const std = (a) => { const m = avg(a); return Math.sqrt(avg(a.map((x) => (x - m) ** 2))); };

  /* ---------------- DOM ---------------- */
  function build() {
    if (root) return;
    root = document.createElement('div');
    root.className = 'arena';
    root.id = 'arena';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Training Arena');
    root.innerHTML = `
      <div class="arena-bg"></div>
      <div class="arena-shell">
        <header class="arena-head">
          <div class="arena-title"><svg><use href="#i-bow"/></svg><div><p class="eyebrow">Training Arena</p><h3 id="arenaTitle">Dronacharya's Gurukul</h3></div></div>
          <ol class="arena-steps">
            <li>Assessment</li><li>Personalized Path</li><li>Interactive Training</li><li>Instant Feedback</li><li>Progress Tracking</li>
          </ol>
          <div class="arena-level">Level <strong id="arenaLevel">Beginner</strong></div>
          <button class="arena-close" data-act="exit" aria-label="Close training arena"><svg><use href="#i-close"/></svg></button>
        </header>
        <div class="arena-body">
          <section class="arena-screen" data-screen="intro"></section>
          <section class="arena-screen" data-screen="game">
            <div class="hud" id="hud"></div>
            <div class="stage">
              <canvas width="${W}" height="${H}" aria-label="Training canvas"></canvas>
              <div class="stage-msg" id="stageMsg"></div>
            </div>
            <div class="feedback-bar"><div class="guru-avatar crop-drona-face"></div><div class="guru-bubble" id="guruSay">Breathe. Look only at your goal.</div></div>
          </section>
          <section class="arena-screen" data-screen="result"></section>
        </div>
      </div>`;
    document.body.appendChild(root);
    canvas = root.querySelector('canvas');
    ctx = canvas.getContext('2d');
    stage = root.querySelector('.stage');
    stageMsg = $('#stageMsg');

    root.addEventListener('click', onClick);
    const pos = (e) => {
      const r = canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) };
    };
    canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); try { canvas.setPointerCapture(e.pointerId); } catch (_) {} game && game.down(pos(e)); });
    canvas.addEventListener('pointermove', (e) => { game && game.move(pos(e)); });
    canvas.addEventListener('pointerup', (e) => { game && game.up(pos(e)); });
    canvas.addEventListener('pointercancel', () => { game && game.up(null); });
    stageMsg.addEventListener('click', () => { if (game && !game.started) beginGame(); });
    document.addEventListener('keydown', onKey);
    document.addEventListener('keyup', (e) => { if (isOpen && e.code === 'Space' && game && game.started) { e.preventDefault(); game.up(null); } });
  }

  function onKey(e) {
    if (!isOpen) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.code === 'Space' && game && currentScreen() === 'game') {
      e.preventDefault();
      if (e.repeat) return;
      if (!game.started) beginGame(); else game.down(null);
    }
  }

  function currentScreen() { const s = root.querySelector('.arena-screen.active'); return s && s.dataset.screen; }
  function show(name) {
    root.querySelectorAll('.arena-screen').forEach((s) => s.classList.toggle('active', s.dataset.screen === name));
    if (name === 'game') startLoop(); else stopLoop();
  }
  function setStep(active, doneUpTo = active - 1) {
    root.querySelectorAll('.arena-steps li').forEach((li, i) => {
      li.classList.toggle('active', i === active);
      li.classList.toggle('done', i <= doneUpTo && i !== active);
    });
  }
  function updateLevelBadge() { $('#arenaLevel').textContent = LEVELS[Store.load().level]; }

  function onClick(e) {
    const start = e.target.closest('[data-start]');
    if (start) { startChallenge(start.dataset.start); return; }
    const act = e.target.closest('[data-act]');
    if (!act) return;
    const a = act.dataset.act;
    if (a === 'exit') close();
    else if (a === 'intro') renderIntro();
    else if (a === 'progress') {
      close();
      const target = document.getElementById('progress');
      if (target) setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 350);
      else window.location.href = 'index.html#progress';
    }
  }

  /* ---------------- screens ---------------- */
  function renderIntro(recommend) {
    const st = Store.load();
    const lastType = st.sessions.length ? st.sessions[st.sessions.length - 1].type : null;
    const rec = recommend || (!st.assessed ? 'assessment' : lastType === 'archery' ? 'focus' : 'archery');
    const msg = !st.assessed
      ? 'Before I can guide you, I must know what you have learned. Take the <b>skill assessment</b>: questions from the Parvas of the Mahabharata. Make a mistake and I will take you straight back to that moment in the story.'
      : `Welcome back. You train at the <b>${LEVELS[st.level]}</b> level. Each challenge adapts to how you perform. Excel and the target grows harder; struggle and I will slow the pace.`;
    $('[data-screen="intro"]').innerHTML = `
      <div class="intro-wrap">
        <div><p class="eyebrow">Pranam, shishya</p><h2 class="title">${st.assessed ? 'Return to the Range' : 'Begin Your Training'}</h2></div>
        <div class="guru-line"><div class="guru-avatar crop-drona-face"></div><div class="guru-bubble">${msg}</div></div>
        <div class="mode-cards">
          <button class="mode-card glass ${rec === 'assessment' ? 'recommended' : ''}" data-start="assessment">
            <svg><use href="#i-assess"/></svg><strong>Skill Assessment</strong>
            <small>Questions from the 18 Parvas. One wrong answer stops the test and takes you to that moment in the timeline to learn it, then you continue. Your score sets your starting level.</small>
            <span class="go">${st.assessed ? 'Retake assessment' : 'Begin assessment'} <svg><use href="#i-arrow"/></svg></span>
          </button>
          <button class="mode-card glass ${rec === 'archery' ? 'recommended' : ''}" data-start="archery">
            <svg><use href="#i-target"/></svg><strong>Archery Training</strong>
            <small>Press and hold to draw the bow, release to shoot. Watch for wind and moving targets at higher levels.</small>
            <span class="go">Train at ${LEVELS[st.level]} <svg><use href="#i-arrow"/></svg></span>
          </button>
          <button class="mode-card glass ${rec === 'focus' ? 'recommended' : ''}" data-start="focus">
            <svg><use href="#i-focus"/></svg><strong>Bird's-Eye Focus</strong>
            <small>Arjuna's test. Strike only the golden bird's eye as it appears among the leaves, and let the crows pass.</small>
            <span class="go">Test your focus <svg><use href="#i-arrow"/></svg></span>
          </button>
        </div>
        <div class="intro-foot">
          <span>Current level: <b style="color:var(--gold-2);font-weight:500">${LEVELS[st.level]}</b></span>
          <span>Challenges completed: ${Math.min(st.completed, 20)}/20</span>
          <button class="link-btn" data-act="progress">View my progress <svg><use href="#i-arrow"/></svg></button>
        </div>
      </div>`;
    setStep(st.assessed ? 1 : 0, st.assessed ? 0 : -1);
    updateLevelBadge();
    show('intro');
  }

  function startChallenge(kind) {
    if (kind === 'assessment') { window.location.href = 'parvas.html?assess=1'; return; }
    const st = Store.load();
    const assessment = kind === 'assessment';
    const level = assessment ? 0 : st.level;
    game = kind === 'focus' ? Focus(level) : Archery(level, assessment);
    game.kind = kind;
    $('#arenaTitle').textContent = assessment ? 'Skill Assessment' : kind === 'focus' ? "Bird's-Eye Focus" : 'Archery Training';
    setStep(assessment ? 0 : 2, assessment ? -1 : 1);
    stageMsg.innerHTML = game.instructions;
    stageMsg.classList.remove('hidden');
    say(game.intro, '');
    game.renderHud();
    show('game');
  }

  function beginGame() {
    stageMsg.classList.add('hidden');
    game.start();
  }

  function say(html, mood) {
    const b = $('#guruSay');
    b.innerHTML = html;
    b.className = 'guru-bubble' + (mood ? ' ' + mood : '');
  }

  function pop(text, x, y) {
    const el = document.createElement('div');
    el.className = 'shot-pop';
    el.textContent = text;
    el.style.left = (x / W * 100) + '%';
    el.style.top = (y / H * 100) + '%';
    stage.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }

  function finish(m) {
    const st = Store.load();
    const prev = st.level;
    let next = prev;
    const assessment = game.kind === 'assessment';
    if (assessment) next = m.accuracy >= 75 ? 2 : m.accuracy >= 50 ? 1 : 0;
    else {
      const p = m.score / 100;
      if (p >= .75 && prev < 3) next = prev + 1;
      else if (p < .45 && prev > 0) next = prev - 1;
    }
    Store.record({ t: Date.now(), type: m.type, level: game.level, accuracy: m.accuracy, reaction: m.reaction, consistency: m.consistency, decision: m.decision, score: m.score }, next, assessment);
    renderResult(m, prev, next, assessment);
  }

  function renderResult(m, prev, next, assessment) {
    const st = Store.load();
    const up = next > prev, down = next < prev;
    const verdict = assessment
      ? `Your assessment is complete. I place you at <b>${LEVELS[next]}</b>. This is not a judgement. It is where your path begins.`
      : up ? `Excellent. You have outgrown this level. Your next challenge rises to <b>${LEVELS[next]}</b>.`
        : down ? `Do not be discouraged. Even Arjuna practised in the dark. We return to <b>${LEVELS[next]}</b> to strengthen your foundation.`
          : m.score >= 60 ? `Good, steady work. Stay at <b>${LEVELS[next]}</b> a little longer and make your excellence consistent.`
            : `You are learning. We stay at <b>${LEVELS[next]}</b>. Abhyasa, consistent practice, will carry you forward.`;
    const third = m.type === 'archery'
      ? { label: 'Consistency', val: m.consistency + '%', pct: m.consistency }
      : { label: 'Decision making', val: m.decision + '%', pct: m.decision };
    const reactPct = clamp(Math.round((2.6 - m.reaction) / 2.2 * 100), 0, 100);
    const shots = m.type === 'archery'
      ? m.shots.map((s) => `<i class="${s >= 8 ? 'hi' : s <= 3 ? 'lo' : ''}">${s || 'Miss'}</i>`).join('')
      : m.shots.map((s) => `<i class="${s.cls}">${s.label}</i>`).join('');
    const tips = [];
    if (m.type === 'archery') {
      if (m.early > 0) tips.push(`${m.early} arrow${m.early > 1 ? 's' : ''} released before a full draw. Wait for the ring to close.`);
      if (m.consistency < 55) tips.push('Your groupings are scattered. Use the same rhythm for every arrow: breathe, draw, hold, release.');
      if (m.reaction > 2.2) tips.push('You take long to shoot. Hesitation tires the arm. Trust your aim sooner.');
      if (m.accuracy >= 80) tips.push('Your accuracy is strong. Moving targets and wind will now test it.');
    } else {
      if (m.decision < 70) tips.push('You struck at things that were not your goal. See the crow, recognise it, let it pass.');
      if (m.accuracy < 50) tips.push('You saw the bird but not its eye. Narrow your attention to the smallest point.');
      if (m.reaction > 1.2) tips.push('The bird does not wait. Keep your gaze ready before it appears.');
      if (m.accuracy >= 80) tips.push('Your focus is sharp, worthy of the bird\'s-eye lesson.');
    }
    if (!tips.length) tips.push('Balanced performance. Keep practising to build mastery.');
    const nextKind = m.type === 'archery' ? 'focus' : 'archery';

    $('[data-screen="result"]').innerHTML = `
      <div class="result-wrap">
        <div>
          <p class="eyebrow">${assessment ? 'Step 1 complete' : 'Challenge complete'}</p>
          <h2 class="title">${assessment ? 'Your Starting Point' : m.type === 'archery' ? 'Archery Results' : 'Focus Results'}</h2>
          <div class="guru-line"><div class="guru-avatar crop-drona-face"></div><div class="guru-bubble">${verdict}</div></div>
          <div class="result-stats">
            <div class="result-stat glass"><span>Accuracy</span><strong>${m.accuracy}%</strong><div class="bar"><i data-w="${m.accuracy}"></i></div></div>
            <div class="result-stat glass"><span>Avg. reaction</span><strong>${m.reaction.toFixed(2)}s</strong><div class="bar"><i data-w="${reactPct}"></i></div></div>
            <div class="result-stat glass"><span>${third.label}</span><strong>${third.val}</strong><div class="bar"><i data-w="${third.pct}"></i></div></div>
            <div class="result-stat glass"><span>Overall score</span><strong>${m.score}</strong><div class="bar"><i data-w="${m.score}"></i></div></div>
          </div>
          <div class="shot-list">${shots}</div>
        </div>
        <aside class="adapt-card glass">
          <h4>${assessment ? 'Your Personalized Path' : 'Your Next Challenge Adapts'}</h4>
          <div class="shift"><span>${assessment ? 'Assessment' : LEVELS[prev]}</span><svg><use href="#i-arrow"/></svg><span style="color:var(--gold-2)">${LEVELS[next]}</span></div>
          <p style="font-size:.86rem;margin:0">${assessment ? 'Challenges are now tuned to your level: target size, movement, wind and time windows.' : 'Target size, movement, wind and reaction windows have been re-tuned to your performance.'}</p>
          <ul>${tips.map((t) => `<li>${t}</li>`).join('')}</ul>
          <p style="font-size:.78rem;color:var(--muted);margin:10px 0 16px">Challenges completed: ${Math.min(st.completed, 20)}/20</p>
          <div class="btn-row">
            <button class="btn btn-gold btn-sm" data-start="${assessment ? 'archery' : m.type}">${assessment ? 'Start Training' : 'Next Challenge'} <svg class="ic"><use href="#i-arrow"/></svg></button>
            <button class="btn btn-outline btn-sm" data-start="${nextKind}">${nextKind === 'focus' ? "Try Bird's-Eye Focus" : 'Try Archery'}</button>
          </div>
          <div class="btn-row" style="margin-top:12px">
            <button class="link-btn" data-act="progress">View my progress <svg><use href="#i-arrow"/></svg></button>
            <button class="link-btn" data-act="intro">All challenges</button>
          </div>
        </aside>
      </div>`;
    setStep(assessment ? 1 : 4, assessment ? 0 : 3);
    updateLevelBadge();
    show('result');
    requestAnimationFrame(() => setTimeout(() => {
      root.querySelectorAll('.result-stat .bar i').forEach((i) => { i.style.width = i.dataset.w + '%'; });
    }, 60));
  }

  /* ---------------- loop ---------------- */
  function startLoop() {
    if (raf) return;
    last = performance.now();
    const tick = (t) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(.05, (t - last) / 1000);
      last = t;
      if (game) { game.update(dt); game.draw(ctx); }
    };
    raf = requestAnimationFrame(tick);
  }
  function stopLoop() { cancelAnimationFrame(raf); raf = 0; }

  function drawSceneBg(c) {
    if (bgCache) c.drawImage(bgCache, 0, 0);
    else {
      const g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#3a2814'); g.addColorStop(.6, '#22180d'); g.addColorStop(1, '#120c06');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
    }
  }

  /* =========================================================
     ARCHERY CHALLENGE
     ========================================================= */
  function Archery(level, assessment) {
    const c = assessment ? ASSESS : CFG[level];
    const base = { x: W / 2, y: H * .42 };
    const randWind = () => c.wind ? (Math.random() < .5 ? -1 : 1) * c.wind * rand(.55, 1) : 0;
    const g = {
      level, total: 5, shot: 0, scores: [], reacts: [], early: 0,
      stuck: [], misses: [], fly: null, drawing: false, holdStart: 0, roundStart: 0,
      ptr: { x: W / 2, y: H * .45 }, aim: { x: W / 2, y: H * .45 },
      wind: randWind(), time: 0, started: false, done: false, ph: rand(0, 100), waitUntil: 0,
      intro: assessment ? 'Show me your natural skill. Do not rush, and do not hesitate.' : `Level: <b>${LEVELS[level]}</b>. ${level === 0 ? 'A still target. Master your draw.' : level === 1 ? 'The target moves and the wind stirs. Lead your aim.' : 'Fast targets and strong wind. Only true focus will do.'}`,
      instructions: `<div><h3>${assessment ? 'Skill Assessment' : 'Archery · ' + LEVELS[level]}</h3>
        <p>Aim with your mouse or finger. <b>Press and hold</b> to draw the bow, and <b>release</b> to shoot.<br>A full draw steadies your aim, but hold too long and your arm will tremble.</p>
        <div class="keys"><span><b>Hold</b> to draw</span><span><b>Release</b> to loose</span><span><b>Space</b> works too</span><span><b>5</b> arrows</span></div>
        <span class="btn btn-gold btn-sm">Click to Begin <svg class="ic"><use href="#i-arrow"/></svg></span></div>`,
    };
    const targetPos = (t) => ({
      x: base.x + Math.sin(t * c.speed + g.ph) * c.move,
      y: base.y + Math.sin(t * c.speed * 1.37 + g.ph * .7) * c.vmove,
    });

    g.renderHud = () => {
      $('#hud').innerHTML = `
        <div class="hud-item"><span>Challenge</span><strong>${assessment ? 'Assessment' : 'Archery'}</strong></div>
        <div class="hud-item"><span>Quiver</span><div class="quiver">${Array.from({ length: g.total }, (_, i) => `<i class="${i < g.shot ? 'used' : ''}"></i>`).join('')}</div></div>
        <div class="hud-item"><span>Score</span><strong>${g.scores.reduce((a, b) => a + b, 0)} / ${g.total * 10}</strong></div>
        <div class="hud-item"><span>Wind</span><strong>${g.wind ? (g.wind > 0 ? '→ ' : '← ') + Math.abs(g.wind).toFixed(1) : 'Calm'}</strong></div>
        <div class="hud-item grow"><span>Level</span><strong>${assessment ? 'Calibrating' : LEVELS[level]}</strong></div>`;
    };
    g.start = () => { g.started = true; g.roundStart = g.time; };
    g.move = (p) => { if (p) { g.ptr.x = p.x; g.ptr.y = p.y; } };
    g.down = (p) => {
      if (p) g.move(p);
      if (!g.started || g.fly || g.done || g.time < g.waitUntil || g.drawing) return;
      g.drawing = true; g.holdStart = g.time;
    };
    g.up = () => {
      if (!g.drawing) return;
      g.drawing = false;
      const hold = g.time - g.holdStart;
      const power = clamp(hold / .7, 0, 1);
      if (power < .85) g.early++;
      g.reacts.push(g.time - g.roundStart);
      g.fly = { to: { x: g.aim.x + g.wind * 26, y: g.aim.y + (1 - power) * 95 }, start: g.time, dur: .36, power, hold };
    };

    function resolve() {
      const f = g.fly; g.fly = null;
      const tp = targetPos(g.time);
      const dx = f.to.x - tp.x, dy = f.to.y - tp.y, d = Math.hypot(dx, dy);
      const score = d <= c.r ? Math.max(1, 10 - Math.floor(d / (c.r / 10))) : 0;
      if (score > 0) g.stuck.push({ dx, dy }); else g.misses.push({ x: f.to.x, y: clamp(f.to.y, 0, H - 20), t: g.time });
      g.scores.push(score);
      g.shot++;
      pop(score ? (score === 10 ? '10 ✦' : String(score)) : 'Miss', f.to.x, f.to.y);
      feedback(score, dx, dy, f);
      g.renderHud();
      if (g.shot >= g.total) {
        g.done = true;
        setTimeout(() => {
          const acc = Math.round(g.scores.reduce((a, b) => a + b, 0) / (g.total * 10) * 100);
          finish({
            type: 'archery', accuracy: acc, reaction: avg(g.reacts),
            consistency: clamp(Math.round(100 - std(g.scores) * 12), 0, 100),
            decision: null, score: acc, shots: g.scores.slice(), early: g.early,
          });
        }, 1300);
      } else {
        g.waitUntil = g.time + .9;
        if (c.wind && Math.random() < .5) { g.wind = randWind(); g.renderHud(); }
      }
    }

    function feedback(score, dx, dy, f) {
      let msg, mood = '';
      if (score >= 9) { msg = pick(['Bullseye! Your eye and your arrow became one.', 'Perfect. That is the focus of Arjuna.', 'Excellent. Calm mind, true arrow.']); mood = 'good'; }
      else if (f.power < .85) { msg = 'You released before a full draw, so the arrow dropped. Hold until the ring around your sight is <b>complete</b>.'; mood = 'bad'; }
      else if (f.hold > 2.6) { msg = 'You held too long and your arm trembled. Release at the moment of stillness.'; mood = 'bad'; }
      else if (!score && c.move && Math.abs(dx) > Math.abs(dy)) { msg = 'The target moved on. Lead it: aim where it <b>will</b> be, not where it is.'; mood = 'bad'; }
      else if (g.wind && Math.sign(dx) === Math.sign(g.wind) && Math.abs(dx) > c.r * .3) { msg = `The wind pushed your arrow ${g.wind > 0 ? 'right' : 'left'}. Aim slightly <b>into</b> the wind.`; }
      else {
        const dir = Math.abs(dy) > Math.abs(dx) ? (dy < 0 ? 'high' : 'low') : (dx < 0 ? 'left' : 'right');
        msg = `${score >= 6 ? 'Close.' : score ? 'On the target.' : 'A miss.'} Your arrow landed ${dir} of the centre. ${dir === 'high' || dir === 'low' ? 'Steady your breath before release.' : 'Keep your sight level as you release.'}`;
        mood = score >= 6 ? 'good' : '';
      }
      say(msg, mood);
    }

    g.update = (dt) => {
      if (!g.started) return;
      g.time += dt;
      if (g.time >= g.waitUntil && g.waitUntil && !g.fly && !g.drawing && !g.done && g.roundStart < g.waitUntil) g.roundStart = g.waitUntil;
      const hold = g.drawing ? g.time - g.holdStart : 0;
      const prog = clamp(hold / .7, 0, 1);
      let amp = c.sway * (g.drawing ? 1 - prog * .75 : 1);
      if (hold > 2.6) amp += (hold - 2.6) * c.sway * 1.2 + 5;
      const t = g.time;
      g.aim.x = g.ptr.x + amp * (Math.sin(t * 1.9 + g.ph) * .6 + Math.sin(t * 3.7 + g.ph * 2) * .4);
      g.aim.y = g.ptr.y + amp * (Math.sin(t * 2.3 + g.ph * 1.3) * .6 + Math.sin(t * 4.1 + g.ph) * .4);
      if (hold > 2.6) { g.aim.x += rand(-1, 1) * (hold - 2.6) * 6; g.aim.y += rand(-1, 1) * (hold - 2.6) * 6; }
      if (g.fly && g.time - g.fly.start >= g.fly.dur) resolve();
    };

    g.draw = (x) => {
      drawSceneBg(x);
      const tp = targetPos(g.time);
      // stand + shadow
      x.fillStyle = 'rgba(0,0,0,.35)';
      x.beginPath(); x.ellipse(tp.x, tp.y + c.r * 2.05, c.r * 1.1, c.r * .18, 0, 0, Math.PI * 2); x.fill();
      x.strokeStyle = '#4a2f17'; x.lineWidth = 7; x.lineCap = 'round';
      x.beginPath(); x.moveTo(tp.x - c.r * .55, tp.y); x.lineTo(tp.x - c.r * .9, tp.y + c.r * 2); x.moveTo(tp.x + c.r * .55, tp.y); x.lineTo(tp.x + c.r * .9, tp.y + c.r * 2); x.moveTo(tp.x, tp.y); x.lineTo(tp.x, tp.y + c.r * 2.05); x.stroke();
      // rings: white, black, blue, red, gold (outer → inner)
      const cols = ['#f1c232', '#c8402f', '#3d7fc1', '#2a2622', '#efe7d6'];
      for (let i = 10; i >= 1; i--) {
        x.beginPath(); x.arc(tp.x, tp.y, c.r * i / 10, 0, Math.PI * 2);
        x.fillStyle = cols[Math.floor((i - 1) / 2)]; x.fill();
        x.lineWidth = 1; x.strokeStyle = i > 6 && i <= 8 ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.25)'; x.stroke();
      }
      x.beginPath(); x.arc(tp.x, tp.y, c.r + 3, 0, Math.PI * 2); x.lineWidth = 5; x.strokeStyle = '#6b4520'; x.stroke();
      x.fillStyle = 'rgba(0,0,0,.45)'; x.beginPath(); x.arc(tp.x, tp.y, 1.6, 0, Math.PI * 2); x.fill();
      // stuck arrows
      g.stuck.forEach((s) => drawStuck(x, tp.x + s.dx, tp.y + s.dy, 1));
      g.misses = g.misses.filter((m) => g.time - m.t < 2.5);
      g.misses.forEach((m) => { x.globalAlpha = clamp(1 - (g.time - m.t) / 2.5, 0, 1); drawStuck(x, m.x, m.y, .8); x.globalAlpha = 1; });
      // flying arrow
      if (g.fly) {
        const p = clamp((g.time - g.fly.start) / g.fly.dur, 0, 1);
        const e = 1 - Math.pow(1 - p, 2);
        const from = { x: W / 2, y: H + 30 };
        const px = from.x + (g.fly.to.x - from.x) * e;
        const py = from.y + (g.fly.to.y - from.y) * e - Math.sin(p * Math.PI) * 30;
        const ang = Math.atan2(g.fly.to.y - from.y, g.fly.to.x - from.x);
        const len = 90 * (1 - p * .8);
        x.strokeStyle = '#d9b27a'; x.lineWidth = 3 * (1 - p * .6);
        x.beginPath(); x.moveTo(px, py); x.lineTo(px - Math.cos(ang) * len, py - Math.sin(ang) * len); x.stroke();
      }
      // nocked arrow while drawing
      const hold = g.drawing ? g.time - g.holdStart : 0;
      const prog = clamp(hold / .7, 0, 1);
      if (g.started && !g.fly && !g.done && g.time >= g.waitUntil) {
        const bx = W / 2, by = H + 10;
        const ang = Math.atan2(g.aim.y - by, g.aim.x - bx);
        const pull = 40 + prog * 50;
        x.strokeStyle = 'rgba(217,178,122,.85)'; x.lineWidth = 4;
        x.beginPath(); x.moveTo(bx + Math.cos(ang) * (pull + 40), by + Math.sin(ang) * (pull + 40)); x.lineTo(bx + Math.cos(ang) * 10, by + Math.sin(ang) * 10); x.stroke();
        x.fillStyle = '#c8c0b0';
        x.beginPath(); x.arc(bx + Math.cos(ang) * (pull + 42), by + Math.sin(ang) * (pull + 42), 3.5, 0, Math.PI * 2); x.fill();
      }
      // wind flag
      if (c.wind) {
        x.save(); x.translate(40, 40);
        x.strokeStyle = '#e8d6b0'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, -14); x.lineTo(0, 30); x.stroke();
        const wv = Math.sin(g.time * 6) * 3;
        x.fillStyle = '#b8402c'; x.beginPath(); x.moveTo(0, -14);
        x.quadraticCurveTo(g.wind * 10, -10 + wv, g.wind * 18, -6); x.lineTo(0, 2); x.fill();
        x.fillStyle = '#f4e7cb'; x.font = '13px Inter, sans-serif'; x.fillText(`Wind ${g.wind > 0 ? '→' : '←'} ${Math.abs(g.wind).toFixed(1)}`, 12, 26);
        x.restore();
      }
      // crosshair
      if (g.started && !g.done) {
        const trem = hold > 2.6;
        x.save(); x.translate(g.aim.x, g.aim.y);
        x.strokeStyle = trem ? '#ff8a5c' : 'rgba(255,240,205,.95)'; x.lineWidth = 1.5;
        x.beginPath(); x.arc(0, 0, 14, 0, Math.PI * 2); x.stroke();
        x.beginPath(); x.moveTo(-24, 0); x.lineTo(-8, 0); x.moveTo(8, 0); x.lineTo(24, 0); x.moveTo(0, -24); x.lineTo(0, -8); x.moveTo(0, 8); x.lineTo(0, 24); x.stroke();
        x.fillStyle = '#fff'; x.beginPath(); x.arc(0, 0, 1.6, 0, Math.PI * 2); x.fill();
        if (g.drawing) {
          x.strokeStyle = trem ? '#ff8a5c' : prog >= 1 ? '#f2cc7a' : 'rgba(242,204,122,.75)'; x.lineWidth = 3;
          x.beginPath(); x.arc(0, 0, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * prog); x.stroke();
        }
        x.restore();
      }
      if (g.started && !g.done && g.time < g.waitUntil) {
        x.fillStyle = 'rgba(244,231,203,.85)'; x.font = '15px Inter, sans-serif'; x.textAlign = 'center';
        x.fillText('Nock the next arrow…', W / 2, H - 24); x.textAlign = 'left';
      }
    };
    return g;
  }

  function drawStuck(x, px, py, s) {
    x.save(); x.translate(px, py);
    x.strokeStyle = '#3b2412'; x.lineWidth = 3 * s; x.lineCap = 'round';
    x.beginPath(); x.moveTo(0, 0); x.lineTo(12 * s, 18 * s); x.stroke();
    x.fillStyle = '#b8402c';
    x.beginPath(); x.moveTo(10 * s, 15 * s); x.lineTo(18 * s, 17 * s); x.lineTo(13 * s, 22 * s); x.fill();
    x.beginPath(); x.moveTo(10 * s, 15 * s); x.lineTo(9 * s, 24 * s); x.lineTo(14 * s, 21 * s); x.fill();
    x.fillStyle = 'rgba(0,0,0,.6)'; x.beginPath(); x.arc(0, 0, 2.2 * s, 0, Math.PI * 2); x.fill();
    x.restore();
  }

  /* =========================================================
     BIRD'S-EYE FOCUS CHALLENGE
     ========================================================= */
  function Focus(level) {
    const c = CFG[level];
    const ROUNDS = 8;
    const crowCount = level === 0 ? 1 : 2;
    const types = Array.from({ length: ROUNDS }, (_, i) => (i < crowCount ? 'crow' : 'bird'));
    for (let i = types.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [types[i], types[j]] = [types[j], types[i]]; }
    if (types[0] === 'crow') { const k = types.indexOf('bird'); [types[0], types[k]] = [types[k], types[0]]; }
    const leafCols = ['#2f4a1c', '#3d5a22', '#4f6b2a', '#5e6f2b', '#6d7a30', '#7a6a2a', '#8a5a22'];
    const leaves = Array.from({ length: 170 }, () => ({
      x: rand(-20, W + 20), y: rand(-20, H + 20), rx: rand(10, 22), ry: rand(4, 8), rot: rand(0, Math.PI), col: pick(leafCols), ph: rand(0, 6), a: rand(.55, 1),
    }));
    const branches = Array.from({ length: 5 }, (_, i) => ({ y0: rand(60, H - 60), y1: rand(60, H - 60), cy: rand(0, H), w: rand(8, 16), side: i % 2 }));
    const falling = Array.from({ length: 16 }, () => ({ x: rand(0, W), y: rand(-H, H), vx: rand(-15, 15), vy: rand(20, 45), r: rand(0, 6), s: rand(5, 9), col: pick(leafCols) }));
    const g = {
      level, idx: 0, phase: 'wait', phaseEnd: 0, bird: null, results: [], falseClicks: 0, time: 0, started: false, done: false, ptr: { x: W / 2, y: H / 2 },
      intro: `Arjuna saw only the eye. Strike the <b>golden bird's eye</b>. Ignore the <b>crows</b>.`,
      instructions: `<div><h3>Bird's-Eye Focus · ${LEVELS[level]}</h3>
        <p>A <b>golden bird</b> will appear among the leaves for a moment. Click its <b>eye</b> for full marks, or its body for half.<br>If a <b>black crow</b> appears, do not click. Let it pass. Clicking while nothing is there breaks your focus.</p>
        <div class="keys"><span><b>Eye</b> = 10</span><span><b>Body</b> = 5</span><span><b>Crow</b> = let it go</span><span><b>${ROUNDS}</b> rounds</span></div>
        <span class="btn btn-gold btn-sm">Click to Begin <svg class="ic"><use href="#i-arrow"/></svg></span></div>`,
    };
    const s = c.birdScale;

    g.renderHud = () => {
      const pts = g.results.reduce((a, r) => a + (r.points || 0), 0);
      $('#hud').innerHTML = `
        <div class="hud-item"><span>Challenge</span><strong>Bird's-Eye</strong></div>
        <div class="hud-item"><span>Round</span><strong>${Math.min(g.idx + 1, ROUNDS)} / ${ROUNDS}</strong></div>
        <div class="hud-item"><span>Points</span><strong>${pts}</strong></div>
        <div class="hud-item"><span>Window</span><strong>${(c.window / 1000).toFixed(1)}s</strong></div>
        <div class="hud-item grow"><span>Rule</span><strong>Golden bird's eye only. Let crows pass.</strong></div>`;
    };
    g.start = () => { g.started = true; g.phase = 'wait'; g.phaseEnd = g.time + rand(.8, 1.6); };
    g.move = (p) => { if (p) g.ptr = p; };
    g.up = () => {};
    g.down = (p) => {
      if (!p) p = g.ptr; else g.ptr = p;
      if (!g.started || g.done) return;
      if (g.phase === 'wait') { g.falseClicks++; say('Patience. Your arrow flew at nothing. Wait until the goal appears.', 'bad'); pop('✕', p.x, p.y); return; }
      if (g.phase !== 'show') return;
      const b = g.bird;
      const eye = { x: b.x + 26 * s, y: b.y - 17 * s };
      const head = { x: b.x + 22 * s, y: b.y - 13 * s };
      const de = Math.hypot(p.x - eye.x, p.y - eye.y);
      const dh = Math.hypot(p.x - head.x, p.y - head.y);
      const inBody = ((p.x - b.x) / (34 * s)) ** 2 + ((p.y - b.y) / (20 * s)) ** 2 <= 1;
      const hit = de <= 7 * s + 5 ? 'eye' : (dh <= 15 * s || inBody) ? 'body' : null;
      if (!hit) { g.falseClicks++; pop('✕', p.x, p.y); say('Your arrow missed. Look closer, at the smallest point.', 'bad'); return; }
      resolve(hit, g.time - b.shownAt, p);
    };

    function spawn() {
      g.bird = { type: types[g.idx], x: rand(140, W - 160), y: rand(110, H - 90), shownAt: g.time, expire: g.time + c.window / 1000, flyFrom: null };
      g.phase = 'show';
    }

    function resolve(hit, react, p) {
      const b = g.bird;
      let r;
      if (b.type === 'bird') {
        if (hit === 'eye') { r = { type: 'bird', points: 10, react, correct: true, cls: 'hi', label: 'Eye' }; say(pick(['You saw only the eye. Just like Arjuna.', 'Perfect focus. The eye, and nothing else.']), 'good'); pop('10 ✦', p.x, p.y); }
        else if (hit === 'body') { r = { type: 'bird', points: 5, react, correct: true, cls: '', label: 'Body' }; say('You saw the bird, but not its eye. Narrow your gaze.', ''); pop('5', p.x, p.y); }
        else { r = { type: 'bird', points: 0, react: null, correct: false, cls: 'lo', label: 'Missed' }; say('Too slow. The bird flew away. Keep your gaze ready.', 'bad'); }
      } else {
        if (hit) { r = { type: 'crow', points: 0, react, correct: false, cls: 'lo', label: 'Crow hit' }; say('That was a crow, not your goal. Discipline your eye.', 'bad'); pop('✕', p.x, p.y); }
        else { r = { type: 'crow', points: 0, react: null, correct: true, cls: 'hi', label: 'Ignored' }; say('Well judged. You let the crow pass and kept your aim for the true goal.', 'good'); }
      }
      g.results.push(r);
      b.flyFrom = g.time;
      g.phase = 'gap'; g.phaseEnd = g.time + 1;
      g.renderHud();
    }

    function done() {
      g.done = true;
      const birds = g.results.filter((r) => r.type === 'bird');
      const pts = birds.reduce((a, r) => a + r.points, 0);
      const accuracy = Math.round(pts / Math.max(1, birds.length * 10) * 100);
      const reacts = birds.filter((r) => r.react != null).map((r) => r.react);
      const decision = clamp(Math.round(g.results.filter((r) => r.correct).length / ROUNDS * 100 - g.falseClicks * 5), 0, 100);
      setTimeout(() => finish({
        type: 'focus', accuracy, reaction: reacts.length ? avg(reacts) : c.window / 1000,
        consistency: null, decision, score: Math.round(accuracy * .6 + decision * .4), shots: g.results,
      }), 900);
    }

    g.update = (dt) => {
      falling.forEach((f) => { f.x += (f.vx + Math.sin(g.time + f.r) * 20) * dt; f.y += f.vy * dt; f.r += dt * 2; if (f.y > H + 20) { f.y = -20; f.x = rand(0, W); } });
      if (!g.started || g.done) { g.time += dt; return; }
      g.time += dt;
      if (g.phase === 'wait' && g.time >= g.phaseEnd) spawn();
      else if (g.phase === 'show' && g.time >= g.bird.expire) resolve(null, null, null);
      else if (g.phase === 'gap' && g.time >= g.phaseEnd) {
        g.idx++;
        if (g.idx >= ROUNDS) { g.bird = null; done(); }
        else { g.bird = null; g.phase = 'wait'; g.phaseEnd = g.time + rand(.6, 1.5); g.renderHud(); }
      }
    };

    g.draw = (x) => {
      const bg = x.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#2b3a1a'); bg.addColorStop(1, '#0d1408');
      x.fillStyle = bg; x.fillRect(0, 0, W, H);
      const sun = x.createRadialGradient(W * .82, 40, 10, W * .82, 40, 420);
      sun.addColorStop(0, 'rgba(255,214,140,.55)'); sun.addColorStop(1, 'rgba(255,214,140,0)');
      x.fillStyle = sun; x.fillRect(0, 0, W, H);
      x.strokeStyle = '#1e140b'; x.lineCap = 'round';
      branches.forEach((b) => { x.lineWidth = b.w; x.beginPath(); x.moveTo(b.side ? W + 10 : -10, b.y0); x.quadraticCurveTo(W / 2, b.cy, b.side ? -10 : W + 10, b.y1); x.stroke(); });
      leaves.forEach((l) => {
        x.globalAlpha = l.a; x.fillStyle = l.col;
        x.beginPath(); x.ellipse(l.x + Math.sin(g.time * 1.3 + l.ph) * 2, l.y, l.rx, l.ry, l.rot + Math.sin(g.time * 1.1 + l.ph) * .12, 0, Math.PI * 2); x.fill();
      });
      x.globalAlpha = 1;
      if (g.bird) {
        const b = g.bird;
        let alpha = clamp((g.time - b.shownAt) / .12, 0, 1), bx = b.x, by = b.y;
        if (b.flyFrom != null) { const k = g.time - b.flyFrom; bx += k * 520; by -= k * 340; alpha = clamp(1 - k * 1.4, 0, 1); }
        drawBird(x, bx, by, s, b.type, alpha, g.time);
        if (g.phase === 'show') {
          const left = clamp((b.expire - g.time) / (c.window / 1000), 0, 1);
          x.fillStyle = 'rgba(0,0,0,.4)'; x.fillRect(0, 0, W, 5);
          x.fillStyle = left > .35 ? '#f2cc7a' : '#e0703c'; x.fillRect(0, 0, W * left, 5);
        }
      }
      falling.forEach((f) => { x.save(); x.translate(f.x, f.y); x.rotate(f.r); x.fillStyle = f.col; x.beginPath(); x.ellipse(0, 0, f.s, f.s * .4, 0, 0, Math.PI * 2); x.fill(); x.restore(); });
      if (g.started && !g.done) {
        x.strokeStyle = 'rgba(255,240,205,.9)'; x.lineWidth = 1.4;
        x.beginPath(); x.arc(g.ptr.x, g.ptr.y, 10, 0, Math.PI * 2); x.moveTo(g.ptr.x - 18, g.ptr.y); x.lineTo(g.ptr.x - 6, g.ptr.y); x.moveTo(g.ptr.x + 6, g.ptr.y); x.lineTo(g.ptr.x + 18, g.ptr.y); x.moveTo(g.ptr.x, g.ptr.y - 18); x.lineTo(g.ptr.x, g.ptr.y - 6); x.moveTo(g.ptr.x, g.ptr.y + 6); x.lineTo(g.ptr.x, g.ptr.y + 18); x.stroke();
      }
    };
    return g;
  }

  function drawBird(x, bx, by, s, type, alpha, t) {
    x.save(); x.globalAlpha = alpha; x.translate(bx, by); x.scale(s, s);
    const crow = type === 'crow';
    // branch perch
    x.strokeStyle = '#2a1b0e'; x.lineWidth = 6; x.beginPath(); x.moveTo(-50, 24); x.lineTo(50, 18); x.stroke();
    // tail
    x.fillStyle = crow ? '#0e0e10' : '#5a3a1c';
    x.beginPath(); x.moveTo(-26, 2); x.lineTo(-56, 16); x.lineTo(-50, 4); x.lineTo(-58, 2); x.closePath(); x.fill();
    // body
    const bodyG = x.createLinearGradient(-30, -20, 30, 20);
    if (crow) { bodyG.addColorStop(0, '#3a3d44'); bodyG.addColorStop(1, '#08080a'); }
    else { bodyG.addColorStop(0, '#f6cf7a'); bodyG.addColorStop(.5, '#b47c38'); bodyG.addColorStop(1, '#5b3818'); }
    x.fillStyle = bodyG;
    x.beginPath(); x.ellipse(0, 0, 34, 20, -.2, 0, Math.PI * 2); x.fill();
    // wing
    x.fillStyle = crow ? 'rgba(80,90,110,.4)' : 'rgba(110,70,30,.75)';
    x.beginPath(); x.moveTo(-18, -4); x.quadraticCurveTo(4, -18 + Math.sin(t * 8) * 2, 22, -4); x.quadraticCurveTo(4, 6, -18, -4); x.fill();
    // head
    x.fillStyle = bodyG; x.beginPath(); x.arc(22, -13, 14, 0, Math.PI * 2); x.fill();
    // beak
    x.fillStyle = crow ? '#3c3c3c' : '#d9962e';
    x.beginPath(); x.moveTo(34, -15); x.lineTo(48, -11); x.lineTo(34, -8); x.fill();
    // eye
    if (!crow) {
      const glow = x.createRadialGradient(26, -17, 0, 26, -17, 12);
      glow.addColorStop(0, 'rgba(255,236,170,.75)'); glow.addColorStop(1, 'rgba(255,236,170,0)');
      x.fillStyle = glow; x.beginPath(); x.arc(26, -17, 12, 0, Math.PI * 2); x.fill();
    }
    x.fillStyle = crow ? '#8a1f1f' : '#fff6dc'; x.beginPath(); x.arc(26, -17, 4, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#100804'; x.beginPath(); x.arc(26.8, -17, 2, 0, Math.PI * 2); x.fill();
    // legs
    x.strokeStyle = '#2a1a0c'; x.lineWidth = 2; x.beginPath(); x.moveTo(-4, 18); x.lineTo(-6, 22); x.moveTo(8, 17); x.lineTo(7, 21); x.stroke();
    x.restore();
  }

  /* ---------------- public ---------------- */
  function open(mode) {
    if (mode === 'assessment') { window.location.href = 'parvas.html?assess=1'; return; }
    build();
    isOpen = true;
    root.classList.add('open');
    document.body.classList.add('locked');
    const rec = mode === 'focus' ? 'focus' : mode === 'archery' ? 'archery' : undefined;
    renderIntro(rec);
    setTimeout(() => { const f = root.querySelector('.mode-card.recommended') || root.querySelector('.mode-card'); f && f.focus({ preventScroll: true }); }, 450);
  }
  function close() {
    if (!root) return;
    isOpen = false;
    root.classList.remove('open');
    document.body.classList.remove('locked');
    stopLoop();
    game = null;
  }
  return { open, close, LEVELS };
})();
