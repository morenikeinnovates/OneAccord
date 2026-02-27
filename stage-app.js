// stage-app.js — powers dating.html, engaged.html, married.html
// Requires shared.js to be loaded first

// ── VIEW ROUTER ──────────────────────────────────────────
// Views: library | session-picker | session-deep | session-flash | declarations | progress | couple | profile
let currentView = 'library';
let selectedCatKey = null;
let selectedSessionId = null;
let selectedMode = null; // 'deep' | 'flash'

// Deep session state (no globals, no recursion)
let deepState = {
  sections: [],
  idx: 0,
  answers: { my:[], your:[], middle:[] }
};

// Flash state
let flashState = {
  cards: [], idx: 0, flipped: false, declShowing: false
};

function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
  const el = document.getElementById('view-'+name);
  if (el) { el.style.display = 'flex'; el.style.flexDirection = 'column'; }
  currentView = name;
  window.scrollTo(0,0);
  updateMobNav(name);
  // Refresh on-demand views
  if (name === 'library')      renderLibrary();
  if (name === 'declarations') renderDeclarations();
  if (name === 'progress')     renderProgress();
  if (name === 'couple')       renderCouple();
  if (name === 'profile')      renderProfile();
}

function updateMobNav(view) {
  const map = { library:'sessions', declarations:'archive', progress:'progress' };
  const active = map[view];
  document.querySelectorAll('.mob-nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.tab === active);
  });
  const mobNav = document.getElementById('mob-nav');
  if (mobNav) {
    const showNav = ['library','declarations','progress'].includes(view);
    mobNav.style.display = showNav ? 'grid' : 'none';
  }
}

// ── LIBRARY ──────────────────────────────────────────────
function renderLibrary() {
  const stage = S.stage || CURRENT_STAGE;
  const path = STAGE_PATHS[stage] || [];
  const cats = CATS.filter(c => path.includes(c.key));
  const completed = S.completedSessions;

  // Stage pill
  const pill = document.getElementById('stage-pill');
  if (pill) pill.textContent = STAGE_LABELS[stage] || '';

  // Couple banner
  const banner = document.getElementById('couple-banner');
  const connectCta = document.getElementById('connect-cta');
  if (banner && connectCta) {
    if (S.coupleSpaceId && S.partnerName) {
      banner.style.display = 'flex';
      banner.querySelector('.cb-name').textContent = S.partnerName;
      connectCta.style.display = 'none';
    } else if (S.email) {
      banner.style.display = 'none';
      connectCta.style.display = 'flex';
    } else {
      banner.style.display = 'none';
      connectCta.style.display = 'none';
    }
  }

  // Recommended path
  const recPath = document.getElementById('rec-path');
  if (recPath) {
    recPath.innerHTML = path.slice(0,5).map(key => {
      const cat = CATS.find(c=>c.key===key);
      if (!cat) return '';
      const done = cat.sessions.every(s => completed[s.id]);
      return `<div class="rec-step ${done?'done':''}" onclick="openCategory('${key}')">${cat.emoji} ${cat.name}${done?' ✓':''}</div>`;
    }).join('');
  }

  // All cats grid
  const grid = document.getElementById('cat-grid');
  if (!grid) return;
  grid.innerHTML = cats.map(cat => {
    const doneCount = cat.sessions.filter(s=>completed[s.id]).length;
    const pct = cat.sessions.length ? Math.round(doneCount/cat.sessions.length*100) : 0;
    const allDone = doneCount === cat.sessions.length && cat.sessions.length > 0;
    return `
      <div class="cat-card" onclick="openCategory('${cat.key}')">
        ${allDone ? '<span class="cat-done-badge">✓</span>' : ''}
        <span class="cat-emoji">${cat.emoji}</span>
        <div class="cat-name">${cat.name}</div>
        <div class="cat-count">${cat.sessions.length} session${cat.sessions.length!==1?'s':''}</div>
        <div class="cat-bar"><div class="cat-bar-fill" style="width:${pct}%"></div></div>
      </div>`;
  }).join('');
}

// ── CATEGORY / PICKER ────────────────────────────────────
function openCategory(key) {
  selectedCatKey = key;
  selectedSessionId = null;
  selectedMode = null;
  renderPicker();
  showView('session-picker');
}

function renderPicker() {
  const cat = CATS.find(c=>c.key===selectedCatKey);
  if (!cat) return;
  const completed = S.completedSessions;
  const attempts = S.attempts;

  document.getElementById('pick-cat-emoji').textContent = cat.emoji;
  document.getElementById('pick-cat-name').textContent = cat.name;
  document.getElementById('pick-cat-desc').textContent = cat.desc;

  // Session list
  const list = document.getElementById('sess-list');
  list.innerHTML = cat.sessions.map(sess => {
    const isDone = completed[sess.id];
    const sessAttempts = attempts.filter(a=>a.sessionId===sess.id);
    const statusBadge = isDone
      ? '<span class="badge badge-lime">✓ Completed</span>'
      : '<span class="badge badge-gray">Not started</span>';
    const attemptsText = sessAttempts.length > 0
      ? `<span class="attempts-link" onclick="toggleAttempts('${sess.id}',event)">${sessAttempts.length} attempt${sessAttempts.length!==1?'s':''}</span>`
      : '';
    const doAgain = isDone
      ? `<button class="do-again-btn" onclick="selectSession('${sess.id}',event)">+ Do again</button>`
      : '';
    return `
      <div class="sess-item ${selectedSessionId===sess.id?'selected':''}" id="si-${sess.id}" onclick="selectSession('${sess.id}')">
        <div class="sess-item-top">
          <div>
            <div class="sess-title">${sess.title}</div>
            <div class="sess-sub">${sess.sub}</div>
          </div>
        </div>
        <div class="sess-item-meta">
          ${statusBadge} ${attemptsText} ${doAgain}
        </div>
        <div class="attempts-panel" id="ap-${sess.id}" style="display:none"></div>
      </div>`;
  }).join('');

  updateBeginBtn();
}

function selectSession(id, e) {
  if (e) e.stopPropagation();
  selectedSessionId = id;
  document.querySelectorAll('.sess-item').forEach(el => el.classList.remove('selected'));
  const el = document.getElementById('si-'+id);
  if (el) el.classList.add('selected');
  updateBeginBtn();
}

function selectMode(mode, el) {
  selectedMode = mode;
  document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  updateBeginBtn();
}

function updateBeginBtn() {
  const btn = document.getElementById('begin-btn');
  if (!btn) return;
  const ready = selectedSessionId && selectedMode;
  btn.style.opacity = ready ? '1' : '.35';
  btn.style.pointerEvents = ready ? 'auto' : 'none';
}

function toggleAttempts(sessId, e) {
  if (e) e.stopPropagation();
  const panel = document.getElementById('ap-'+sessId);
  if (!panel) return;
  if (panel.style.display !== 'none') { panel.style.display = 'none'; return; }
  const attempts = S.attempts.filter(a=>a.sessionId===sessId);
  panel.innerHTML = attempts.length
    ? attempts.map(a=>`
        <div class="attempt-item">
          <div class="attempt-meta">
            <span class="attempt-date">${a.date}</span>
            <span class="badge badge-gray">${a.stage}</span>
            <span class="attempt-mode">${a.mode==='flash'?'⚡ Flash':'📖 Deep'}</span>
          </div>
          <div class="attempt-decl">${a.declaration}</div>
        </div>`).join('')
    : '<div style="padding:12px;font-size:13px;color:var(--muted)">No attempts yet.</div>';
  panel.style.display = 'block';
}

function beginSession() {
  if (!selectedSessionId || !selectedMode) return;
  const found = getSessionById(selectedSessionId);
  if (!found) return;
  if (selectedMode === 'deep') startDeep(found.cat, found.sess);
  else startFlash(found.cat, found.sess);
}

// ── DEEP SESSION ─────────────────────────────────────────
function buildSections(cat, sess) {
  const secs = [];
  secs.push({ type:'prayer', phase:'Opening Prayer', content:sess.openPrayer });
  secs.push({ type:'why', phase:'Why This Matters', content:sess.why, scripture:sess.scripture });
  secs.push({ type:'questions', phase:'My Story', questions:sess.myStory, key:'my' });
  secs.push({ type:'questions', phase:'Your Story', questions:sess.yourStory, key:'your' });
  secs.push({ type:'middle', phase:'Find Our Middle', questions:sess.middle });
  secs.push({ type:'declaration', phase:'Our Declaration' });
  secs.push({ type:'prayer', phase:'Closing Prayer', content:sess.closePrayer });
  return secs;
}

function startDeep(cat, sess) {
  deepState = { sections: buildSections(cat, sess), idx: 0, catKey: cat.key, sess, answers:{ my:[], your:[], middle:[] } };
  renderDeepSection();
  showView('session-deep');
}

function renderDeepSection() {
  const { sections, idx, sess } = deepState;
  const sec = sections[idx];
  const total = sections.length;

  // Progress bar
  const progEl = document.getElementById('deep-prog');
  if (progEl) {
    progEl.innerHTML = sections.map((_,i)=>
      `<div class="seg ${i<idx?'done':i===idx?'active':''}"></div>`
    ).join('');
  }
  document.getElementById('deep-step-label').textContent = `${idx+1} / ${total}`;
  document.getElementById('deep-cat-label').textContent = CATS.find(c=>c.key===deepState.catKey)?.name || '';

  const body = document.getElementById('deep-body');
  body.innerHTML = '';
  body.appendChild(buildSectionEl(sec, idx, total));

  // Scroll to top of body
  body.scrollTop = 0;
  window.scrollTo(0,0);
}

function buildSectionEl(sec, idx, total) {
  const wrap = document.createElement('div');
  wrap.className = 'sess-body fade-up';

  const isFirst = idx === 0;
  const isLast = idx === total - 1;
  const isDecl = sec.type === 'declaration';

  if (sec.type === 'prayer') {
    wrap.innerHTML = `
      <div class="page-eyebrow">${sec.phase}</div>
      <div class="prayer-block">
        <div class="prayer-text">${sec.content}</div>
        <div class="prayer-cue">Pray together before continuing.</div>
      </div>`;
  }
  else if (sec.type === 'why') {
    const paras = sec.content.split('\n\n').map(p=>`<p class="why-para">${p}</p>`).join('');
    const scrip = sec.scripture ? `
      <div class="scripture">
        <div class="scripture-verse">${sec.scripture.text}</div>
        <div class="scripture-ref">${sec.scripture.ref}</div>
      </div>` : '';
    wrap.innerHTML = `
      <div class="page-eyebrow">${sec.phase}</div>
      <h2 class="sec-title">Why this matters.</h2>
      ${paras}${scrip}`;
  }
  else if (sec.type === 'questions') {
    const qHtml = sec.questions.map((q,i)=>`
      <div class="q-block">
        <div class="q-num">Question ${i+1}</div>
        <div class="q-text">${q}</div>
        <textarea class="field" placeholder="Write your answer…" data-key="${sec.key}" data-idx="${i}"
          oninput="saveAnswer('${sec.key}',${i},this.value)">${deepState.answers[sec.key][i]||''}</textarea>
      </div>`).join('');
    wrap.innerHTML = `
      <div class="page-eyebrow">${sec.phase}</div>
      <div class="q-stack">${qHtml}</div>`;
  }
  else if (sec.type === 'middle') {
    const midHtml = sec.questions.map((q,i)=>`
      <div class="mid-item">
        <div class="mid-n">${i+1}</div>
        <div class="mid-content">
          <div class="mid-prompt">${q}</div>
          <textarea class="field" placeholder="Discuss and write together…" data-key="middle" data-idx="${i}"
            oninput="saveAnswer('middle',${i},this.value)">${deepState.answers.middle[i]||''}</textarea>
        </div>
      </div>`).join('');
    wrap.innerHTML = `
      <div class="page-eyebrow">${sec.phase}</div>
      <h2 class="sec-title">Find your shared position.</h2>
      <p style="font-size:15px;color:var(--muted);margin-bottom:20px;line-height:1.6;">Discuss together and write your shared answers below.</p>
      <div class="mid-stack">${midHtml}</div>`;
  }
  else if (sec.type === 'declaration') {
    const coupleSyncNote = S.coupleSpaceId
      ? `<div class="couple-sync-note">🔗 <strong>Couple Sync active</strong> — Both partners should complete their session before sealing the declaration together.</div>`
      : '';
    wrap.innerHTML = `
      <div class="page-eyebrow">${sec.phase}</div>
      <h2 class="sec-title">Seal your conviction.</h2>
      ${coupleSyncNote}
      <div class="decl-block">
        <span class="decl-preamble">We agree that…</span>
        <textarea class="decl-field" id="decl-input" placeholder="…write your shared declaration here. Or leave blank and we'll craft one from your answers."></textarea>
        <p class="decl-hint">Take your time. This is sealed permanently into your shared archive.</p>
      </div>`;
  }

  // Nav buttons
  const nav = document.createElement('div');
  nav.className = 'sess-nav';

  if (!isFirst) {
    const back = document.createElement('button');
    back.className = 'btn-ghost';
    back.textContent = '← Back';
    back.onclick = () => { deepState.idx--; renderDeepSection(); };
    nav.appendChild(back);
  } else {
    nav.appendChild(document.createElement('span'));
  }

  if (isDecl) {
    const seal = document.createElement('button');
    seal.className = 'btn-lime';
    seal.innerHTML = 'Seal Declaration ✦';
    seal.onclick = () => sealDeepDeclaration();
    nav.appendChild(seal);
  } else if (isLast) {
    const done = document.createElement('button');
    done.className = 'btn-dark';
    done.textContent = 'Finish →';
    done.onclick = () => showView('library');
    nav.appendChild(done);
  } else {
    const next = document.createElement('button');
    next.className = 'btn-dark';
    next.textContent = 'Continue →';
    next.onclick = () => { deepState.idx++; renderDeepSection(); };
    nav.appendChild(next);
  }

  wrap.appendChild(nav);
  return wrap;
}

function saveAnswer(key, idx, val) {
  if (!deepState.answers[key]) deepState.answers[key] = [];
  deepState.answers[key][idx] = val;
}

async function sealDeepDeclaration() {
  const raw = (document.getElementById('decl-input')?.value || '').trim();

  const doSave = (text) => {
    const full = text.startsWith('We agree') ? text : 'We agree that ' + text;
    saveSessionDeclaration(full);
  };

  if (raw && raw.length > 10) { doSave(raw); return; }

  // AI generation
  const inp = document.getElementById('decl-input');
  if (inp) { inp.value = ''; inp.placeholder = 'Generating declaration…'; inp.disabled = true; }

  try {
    const ai = await aiDeclaration({
      title: deepState.sess?.title || '',
      stage: S.stage || CURRENT_STAGE,
      myAnswers: deepState.answers.my || [],
      partnerAnswers: deepState.answers.your || [],
      middleAnswers: deepState.answers.middle || []
    });
    const text = ai && ai.length > 10 ? ai : "We agree that we are committed to this journey and to each other.";
    if (inp) { inp.value = text; inp.disabled = false; }
    doSave(text);
  } catch(e) {
    if (inp) inp.disabled = false;
    doSave("We agree that we are committed to this journey and to each other.");
  }
}

function saveSessionDeclaration(text) {
  const cat = CATS.find(c=>c.key===deepState.catKey);
  const sess = deepState.sess;
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});

  const attempt = {
    id: Date.now(),
    sessionId: sess?.id || '',
    sessionTitle: sess?.title || '',
    category: cat?.name || '',
    categoryEmoji: cat?.emoji || '',
    mode: 'deep',
    stage: S.stage || CURRENT_STAGE,
    declaration: text,
    date: dateStr,
    dateMs: now.getTime(),
    partners: S.coupleSpaceId ? [S.userName||S.email, S.partnerName] : null
  };
  S.addAttempt(attempt);
  S.addDeclaration({ text, sessionTitle:sess?.title||'', date:dateStr, category:cat?.name||'' });
  if (sess?.id) S.markComplete(sess.id);

  renderConfirm(text);
  showView('confirm');
}

// ── FLASH SESSION ─────────────────────────────────────────
function startFlash(cat, sess) {
  flashState = { catKey:cat.key, sess, cards:sess.flashCards||[], idx:0, flipped:false, declShowing:false };
  renderFlashCard();
  showView('session-flash');
}

function renderFlashCard() {
  const { cards, idx, flipped } = flashState;
  const total = cards.length;

  // Progress segs
  const progEl = document.getElementById('flash-prog');
  if (progEl) progEl.innerHTML = cards.map((_,i)=>`<div class="seg ${i<idx?'done':i===idx?'active':''}"></div>`).join('');
  document.getElementById('flash-counter').textContent = `Card ${idx+1} of ${total}`;

  const fc = document.getElementById('flashcard');
  if (!fc) return;
  fc.classList.remove('flipped');
  flashState.flipped = false;

  document.getElementById('fc-question').textContent = cards[idx] || '';
  document.getElementById('fc-prompt').textContent = cards[idx] || '';

  const isLast = idx >= total - 1;
  const nextBtn = document.getElementById('flash-next-btn');
  if (nextBtn) {
    nextBtn.textContent = isLast ? 'Write Declaration →' : 'Next Card →';
    nextBtn.className = isLast ? 'btn-lime' : 'btn-dark';
    nextBtn.onclick = isLast ? showFlashDecl : flashNext;
  }
}

function flipCard() {
  const fc = document.getElementById('flashcard');
  if (!fc) return;
  flashState.flipped = !flashState.flipped;
  fc.classList.toggle('flipped', flashState.flipped);
}

function flashPrev() {
  if (flashState.idx > 0) { flashState.idx--; renderFlashCard(); }
}

function flashNext() {
  if (flashState.idx < flashState.cards.length - 1) { flashState.idx++; renderFlashCard(); }
  else showFlashDecl();
}

function showFlashDecl() {
  document.getElementById('flash-decl-section').style.display = 'block';
  document.getElementById('flash-decl-section').scrollIntoView({behavior:'smooth'});
}

async function sealFlashDeclaration() {
  const inp = document.getElementById('flash-decl-input');
  const raw = (inp?.value||'').trim();

  const doSave = (text) => {
    const full = text.startsWith('We agree') ? text : 'We agree that ' + text;
    const cat = CATS.find(c=>c.key===flashState.catKey);
    const sess = flashState.sess;
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
    S.addAttempt({ id:Date.now(), sessionId:sess?.id||'', sessionTitle:sess?.title||'', category:cat?.name||'', categoryEmoji:cat?.emoji||'', mode:'flash', stage:S.stage||CURRENT_STAGE, declaration:full, date:dateStr, dateMs:now.getTime(), partners: S.coupleSpaceId?[S.userName||S.email,S.partnerName]:null });
    S.addDeclaration({ text:full, sessionTitle:sess?.title||'', date:dateStr, category:cat?.name||'' });
    if (sess?.id) S.markComplete(sess.id);
    renderConfirm(full);
    showView('confirm');
  };

  if (raw && raw.length > 10) { doSave(raw); return; }

  if (inp) { inp.placeholder='Generating…'; inp.disabled=true; }
  try {
    const ai = await aiDeclaration({ title:flashState.sess?.title||'', stage:S.stage||CURRENT_STAGE });
    const text = ai && ai.length > 10 ? ai : "We agree that this conversation brought us closer.";
    if (inp) { inp.value=text; inp.disabled=false; }
    doSave(text);
  } catch(e) {
    if (inp) inp.disabled=false;
    doSave("We agree that this conversation brought us closer.");
  }
}

// ── CONFIRM ───────────────────────────────────────────────
function renderConfirm(text) {
  const el = document.getElementById('confirm-text');
  if (el) el.textContent = text;
  const emailCapture = document.getElementById('confirm-email-capture');
  if (emailCapture) emailCapture.style.display = S.email ? 'none' : 'block';
}

// ── DECLARATIONS ─────────────────────────────────────────
function renderDeclarations() {
  const list = document.getElementById('decls-list');
  if (!list) return;
  const decls = S.declarations.slice().reverse();
  if (!decls.length) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">✦</div><div class="empty-title">No declarations yet</div><div class="empty-sub">Complete your first session to seal your first declaration.</div></div>';
    return;
  }
  list.innerHTML = decls.map(d=>`
    <div class="decl-item">
      <div class="di-cat">${d.category||'OneAccord'}</div>
      <div class="di-title">${d.sessionTitle||'Declaration'}</div>
      <div class="di-text">"${d.text}"</div>
      <div class="di-footer">
        <span class="di-date">${d.date||''}</span>
      </div>
    </div>`).join('');
}

// ── PROGRESS ─────────────────────────────────────────────
async function renderProgress() {
  const stage = S.stage || CURRENT_STAGE;
  const path = STAGE_PATHS[stage] || [];
  const cats = CATS.filter(c=>path.includes(c.key));
  const completed = S.completedSessions;
  const attempts = S.attempts;
  const completedCount = Object.keys(completed).filter(k=>completed[k]).length;
  const totalCount = CATS.reduce((a,c)=>a+c.sessions.length,0);

  const wrap = document.getElementById('progress-wrap');
  if (!wrap) return;

  // AI encouragement (non-blocking)
  let insightHtml = '';
  if (completedCount > 0) {
    aiProgressInsight(completedCount, totalCount, S.declarations).then(msg => {
      if (msg) {
        const insightEl = document.getElementById('prog-insight');
        if (insightEl) insightEl.innerHTML = '✦ ' + msg.trim();
      }
    }).catch(()=>{});
  }

  const catGrid = cats.map(cat=>{
    const done = cat.sessions.filter(s=>completed[s.id]).length;
    const pct = cat.sessions.length ? Math.round(done/cat.sessions.length*100) : 0;
    return `<div class="prog-cat-item">
      <span class="pci-emoji">${cat.emoji}</span>
      <div class="pci-name">${cat.name}</div>
      <div class="pci-count">${done}/${cat.sessions.length} sessions</div>
      <div class="pci-bar"><div class="pci-bar-fill" style="width:${pct}%"></div></div>
      ${pct===100?'<div class="pci-complete">✓ Complete</div>':''}
    </div>`;
  }).join('');

  const timeline = attempts.length
    ? attempts.slice().reverse().map(a=>`
      <div class="timeline-item">
        <div class="tl-icon">${a.categoryEmoji||'📖'}</div>
        <div class="tl-body">
          <div class="tl-title">${a.sessionTitle}</div>
          <div class="tl-sub">${a.category} · ${a.mode==='flash'?'⚡ Flash':'📖 Deep'}</div>
        </div>
        <div class="tl-date">${a.date}</div>
      </div>`).join('')
    : '<div style="padding:32px;text-align:center;color:var(--muted);font-size:14px;">Complete your first session to see your timeline.</div>';

  wrap.innerHTML = `
    <div class="lib-top" style="margin-bottom:24px">
      <h2 style="font-size:24px;font-weight:800;letter-spacing:-.5px">Your Progress</h2>
    </div>
    ${completedCount>0?`<div id="prog-insight" style="background:var(--lime-bg);border:1px solid #c8e87a;border-radius:12px;padding:14px 18px;margin-bottom:20px;font-size:14px;color:#4a6b1a;line-height:1.6;font-style:italic;min-height:44px;"></div>`:''}
    <div class="prog-hero">
      <div class="ph-stat"><div class="ph-num">${completedCount}</div><div class="ph-label">Sessions Completed</div></div>
      <div class="ph-stat"><div class="ph-num">${S.declarations.length}</div><div class="ph-label">Declarations</div></div>
      <div class="ph-stat"><div class="ph-num">${attempts.length}</div><div class="ph-label">Total Attempts</div></div>
    </div>
    <div class="prog-section-title">Category Overview</div>
    <div class="prog-cat-grid">${catGrid}</div>
    <div class="prog-section-title">Session Timeline</div>
    <div class="timeline-list">${timeline}</div>`;
}

// ── COUPLE SYNC ───────────────────────────────────────────
function renderCouple() {
  const wrap = document.getElementById('couple-content');
  if (!wrap) return;
  const enterSection = document.getElementById('enter-code-section');

  if (!S.email) {
    wrap.innerHTML = `
      <div class="surface" style="text-align:center;padding:36px 24px;">
        <div style="font-size:36px;margin-bottom:12px;">🔐</div>
        <div style="font-size:16px;font-weight:700;margin-bottom:8px;">Sign in first</div>
        <div style="font-size:13px;color:var(--muted);margin-bottom:20px;line-height:1.5">Couple Sync requires an account so each partner has a verified identity.</div>
        <button class="btn-dark" onclick="navigate('signin.html')">Create Account →</button>
      </div>`;
    if (enterSection) enterSection.style.display = 'none';
    return;
  }

  if (S.coupleSpaceId && S.partnerName) {
    wrap.innerHTML = `
      <div class="partner-list">
        <div class="partner-row">
          <div class="partner-avatar">${(S.userName||'Y').charAt(0).toUpperCase()}</div>
          <div class="partner-info"><div class="partner-name">${S.userName||S.email} (you)</div><div class="partner-email">${S.email}</div></div>
          <span class="badge badge-lime">✓ Connected</span>
        </div>
        <div class="partner-row">
          <div class="partner-avatar partner-b">${(S.partnerName||'P').charAt(0).toUpperCase()}</div>
          <div class="partner-info"><div class="partner-name">${S.partnerName}</div><div class="partner-email">${S.partnerEmail}</div></div>
          <span class="badge badge-lime">✓ Connected</span>
        </div>
      </div>
      <div style="margin-top:24px;text-align:center">
        <button class="btn-ghost" style="color:#cc4444;border-color:#ffd0d0" onclick="disconnectCouple()">Disconnect Couple Space</button>
      </div>`;
    if (enterSection) enterSection.style.display = 'none';
  } else {
    if (!window._genCode) window._genCode = Math.random().toString(36).substr(2,6).toUpperCase();
    wrap.innerHTML = `
      <div class="invite-code-box">
        <div class="icb-label">Your Invite Code</div>
        <div class="icb-code">${window._genCode}</div>
        <div class="icb-expiry">Expires in 48 hours</div>
        <button class="btn-dark" onclick="copyCode()">Copy Code</button>
      </div>
      <p style="font-size:13px;color:var(--muted);text-align:center;margin-top:8px">Share this code with your partner. They enter it below to link your accounts.</p>`;
    if (enterSection) enterSection.style.display = 'block';
  }
}

function copyCode() {
  const code = window._genCode || '';
  if (navigator.clipboard) navigator.clipboard.writeText(code).then(()=>toast('Invite code copied!'));
  else toast('Code: ' + code);
}

function submitInviteCode() {
  const code = (document.getElementById('enter-code-input')?.value||'').trim().toUpperCase();
  if (code.length < 4) { toast('Please enter a valid invite code.'); return; }
  const sec = document.getElementById('enter-code-section');
  if (!sec) return;
  sec.innerHTML = `
    <div class="enter-code-title">Enter your partner's email to confirm</div>
    <div style="display:flex;flex-direction:column;gap:10px">
      <input class="field" type="email" id="partner-email-inp" placeholder="partner@email.com">
      <button class="btn-dark" style="width:100%" onclick="confirmCouple('${code}')">Link Accounts →</button>
      <button onclick="renderCouple()" style="background:none;border:none;font-family:inherit;font-size:13px;color:var(--muted);cursor:pointer;text-align:center;padding:4px 0">← Back</button>
    </div>`;
}

function confirmCouple(code) {
  const email = (document.getElementById('partner-email-inp')?.value||'').trim();
  if (!email||!email.includes('@')) { toast('Please enter a valid email.'); return; }
  const raw = email.split('@')[0];
  S.setCouple('cs_'+Date.now(), raw.charAt(0).toUpperCase()+raw.slice(1), email);
  renderCouple();
  toast('✓ Couple Space created! Connected with ' + S.partnerName);
}

function disconnectCouple() {
  if (!confirm('Disconnect your Couple Space? Your individual data is preserved.')) return;
  S.setCouple(null, null, null);
  renderCouple();
  toast('Couple Space disconnected.');
}

// ── PROFILE ───────────────────────────────────────────────
function renderProfile() {
  const wrap = document.getElementById('profile-wrap');
  if (!wrap) return;
  const completedCount = Object.keys(S.completedSessions).filter(k=>S.completedSessions[k]).length;
  const initial = (S.userName||S.email||'?').charAt(0).toUpperCase();
  wrap.innerHTML = `
    <div style="margin-bottom:28px">
      <div style="width:64px;height:64px;border-radius:50%;background:var(--ink);color:#fff;font-size:24px;font-weight:700;display:flex;align-items:center;justify-content:center;margin-bottom:16px">${initial}</div>
      <div style="font-size:24px;font-weight:800;letter-spacing:-.5px">${S.userName||'Anonymous'}</div>
      <div style="font-size:14px;color:var(--muted);margin-top:2px">${S.email||'Not signed in'}</div>
    </div>
    <div class="card" style="margin-bottom:16px">
      <div class="prof-section-title">Account</div>
      <div class="prof-row"><span class="prof-label">Email</span><span class="prof-value">${S.email||'—'}</span></div>
      <div class="prof-row"><span class="prof-label">Stage</span><span class="prof-value">${STAGE_LABELS[S.stage]||'Not set'}</span><button class="btn-ghost" onclick="navigate('onboarding.html')" style="padding:6px 12px;font-size:12px">Change</button></div>
      ${!S.email?`<div class="prof-row"><button class="btn-dark" onclick="navigate('signin.html')" style="font-size:14px;padding:10px 20px">Create Account →</button></div>`:''}
    </div>
    <div class="card" style="margin-bottom:16px">
      <div class="prof-section-title">Couple Space</div>
      <div class="prof-row"><span class="prof-label">Partner</span><span class="prof-value">${S.partnerName||'Not connected'}</span><button class="btn-ghost" onclick="showView('couple')" style="padding:6px 12px;font-size:12px">${S.coupleSpaceId?'Manage':'Connect'}</button></div>
    </div>
    <div class="card" style="margin-bottom:16px">
      <div class="prof-section-title">Progress</div>
      <div class="prof-row"><span class="prof-label">Sessions completed</span><span class="prof-value">${completedCount} of ${CATS.reduce((a,c)=>a+c.sessions.length,0)}</span></div>
      <div class="prof-row"><span class="prof-label">Declarations sealed</span><span class="prof-value">${S.declarations.length}</span></div>
    </div>
    ${S.email?`<button class="btn-ghost" style="width:100%;color:#cc4444;border-color:#ffd0d0;margin-top:8px" onclick="doSignOut()">Sign out</button>`:''}`;
}

function doSignOut() {
  if (!confirm('Sign out? Your progress is saved.')) return;
  S.signOut();
  toast('Signed out.');
  setTimeout(()=>navigate('index.html'), 700);
}

// ── CONFIRM EMAIL CAPTURE ─────────────────────────────────
function saveConfirmEmail() {
  const email = (document.getElementById('confirm-email-inp')?.value||'').trim();
  if (!email||!email.includes('@')) { toast('Please enter a valid email.'); return; }
  S.setEmail(email);
  const name = email.split('@')[0];
  S.setName(name.charAt(0).toUpperCase()+name.slice(1));
  document.getElementById('confirm-email-capture').style.display = 'none';
  toast('✓ Declaration saved to your account!');
}
