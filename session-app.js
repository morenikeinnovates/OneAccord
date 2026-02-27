// ═══════════════════════════════════════════════════════════
//  OneAccord — Session Page Engine
//  Used by: dating.html, engaged.html, married.html
//  Requires: shared.css, shared.js (Supabase), CATS data embedded
// ═══════════════════════════════════════════════════════════

// ── Shared Data (must be defined before this script) ──
// CATS, STAGE_PATHS, STAGE_LABELS defined in each page

// ── App state ─────────────────────────────────────────────
const App = {
  // Set by each page
  stage: null,

  // Supabase client (init in each page)
  sb: null,
  user: null,
  profile: null,
  coupleSpace: null,

  // Session state
  currentCat: null,
  currentSession: null,
  currentMode: null,
  secIdx: 0,
  sections: [],

  // Flash state
  flashIdx: 0,
  flashFlipped: false,

  // Progress (keyed by sessionId)
  progress: {},      // { sessionId: 'completed'|'in_progress' }
  declarations: [],  // all user declarations

  // Temp answers during session
  answers: {},       // { sectionKey: [answer,...] }
};

// ── Init ──────────────────────────────────────────────────
async function appInit(stage, sbClient) {
  App.stage = stage;
  App.sb = sbClient;

  // Auth check
  const { data: { session } } = await sbClient.auth.getSession();
  App.user = session?.user || null;

  if (App.user) {
    // Load profile
    const { data: profile } = await sbClient.from('profiles').select('*').eq('id', App.user.id).single();
    App.profile = profile;

    // Load progress
    const { data: prog } = await sbClient.from('session_progress').select('*').eq('user_id', App.user.id);
    if (prog) prog.forEach(p => { App.progress[p.session_id] = p.status; });

    // Load declarations
    const { data: decls } = await sbClient.from('declarations').select('*').eq('user_id', App.user.id).order('created_at', { ascending: false });
    App.declarations = decls || [];

    // Load couple space
    const { data: cm } = await sbClient.from('couple_members').select('couple_spaces(*)').eq('user_id', App.user.id).single();
    App.coupleSpace = cm?.couple_spaces || null;
  }

  // Build UI
  updateNavUser();
  buildLibrary();
  setupMobileTabs();
  checkOpenPanel();
}

// ── Navigation ────────────────────────────────────────────
function showPanel(name) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  const el = document.getElementById('panel-' + name);
  if (el) el.classList.add('active');
  window.scrollTo(0, 0);
  syncMobTabs(name);
}

function syncMobTabs(panel) {
  const map = { library: 'sessions', declarations: 'archive', progress: 'progress' };
  const active = map[panel];
  document.querySelectorAll('.mob-tab').forEach(t => {
    t.classList.toggle('on', t.dataset.panel === active);
  });
}

function setupMobileTabs() {
  const tabs = document.querySelectorAll('.mob-tab');
  tabs.forEach(t => {
    t.addEventListener('click', () => {
      const target = t.dataset.panel;
      if (target === 'sessions') showPanel('library');
      else if (target === 'archive') { renderDeclarations(); showPanel('declarations'); }
      else if (target === 'progress') { renderProgress(); showPanel('progress'); }
    });
  });
}

// ── Nav user UI ───────────────────────────────────────────
function updateNavUser() {
  const area = document.getElementById('nav-user-area');
  if (!area) return;
  if (App.user) {
    const initial = App.profile?.display_name?.[0]?.toUpperCase() || App.user.email[0].toUpperCase();
    area.innerHTML = `<a class="nav-user-btn" href="profile.html" title="${App.user.email}" style="text-decoration:none">${initial}</a>`;
  } else {
    area.innerHTML = `<button class="btn btn-dark btn-sm btn" onclick="goSignIn()" style="font-size:13px;padding:8px 16px">Sign in</button>`;
  }
}

function goSignIn() {
  sessionStorage.setItem('oa_redirect', window.location.pathname);
  window.location.href = 'signin.html';
}

// ── Library ───────────────────────────────────────────────
function buildLibrary() {
  buildCatGrid();
  buildRecPath();
  updateCoupleBar();
  updateStagePill();
}

function updateStagePill() {
  const el = document.getElementById('stage-pill');
  if (!el) return;
  const labels = { dating: '🌱 Dating', engaged: '💍 Engaged', married: '🕊️ Married' };
  el.textContent = labels[App.stage] || App.stage;
}

function buildCatGrid() {
  const grid = document.getElementById('cat-grid');
  if (!grid) return;
  grid.innerHTML = CATS.map(cat => {
    const total = cat.sessions.length;
    const done = cat.sessions.filter(s => App.progress[s.id] === 'completed').length;
    const pct = total ? Math.round((done/total)*100) : 0;
    return `
      <div class="cat-card" onclick="openCat('${cat.key}')">
        ${done === total && total > 0 ? '<div class="cat-complete-badge">✓ Done</div>' : ''}
        <span class="cat-emoji">${cat.emoji}</span>
        <div class="cat-name">${cat.name}</div>
        <div class="cat-count">${done}/${total} sessions</div>
        <div class="cat-progress-bar"><div class="cat-progress-fill" style="width:${pct}%"></div></div>
      </div>`;
  }).join('');
}

function buildRecPath() {
  const el = document.getElementById('rec-path');
  if (!el) return;
  const keys = STAGE_PATHS[App.stage] || [];
  el.innerHTML = keys.map(key => {
    const cat = CATS.find(c => c.key === key);
    if (!cat) return '';
    const done = cat.sessions.filter(s => App.progress[s.id] === 'completed').length;
    const isNext = done < cat.sessions.length;
    return `
      <div class="rec-step ${isNext ? 'rec-step-next' : 'rec-step-done'}" onclick="openCat('${key}')">
        ${cat.emoji} ${cat.name}
        ${isNext ? '<span class="rec-step-arrow">→</span>' : '<span style="color:var(--lime)">✓</span>'}
      </div>`;
  }).join('');
}

function updateCoupleBar() {
  const connectedEl = document.getElementById('couple-connected-bar');
  const connectEl = document.getElementById('couple-connect-cta');
  if (!connectedEl || !connectEl) return;

  if (App.coupleSpace?.connected) {
    connectedEl.style.display = 'flex';
    connectEl.style.display = 'none';
  } else if (App.user) {
    connectedEl.style.display = 'none';
    connectEl.style.display = 'flex';
  } else {
    connectedEl.style.display = 'none';
    connectEl.style.display = 'none';
  }
}

// ── Category / Picker ─────────────────────────────────────
function openCat(key) {
  const cat = CATS.find(c => c.key === key);
  if (!cat) return;
  App.currentCat = key;
  App.currentSession = null;
  App.currentMode = null;

  document.getElementById('picker-cat-label').textContent = cat.emoji + ' ' + cat.name;
  document.getElementById('picker-cat-name').textContent = cat.name;
  document.getElementById('picker-cat-desc').textContent = cat.desc;

  // Build session list
  const list = document.getElementById('sess-list');
  list.innerHTML = cat.sessions.map(sess => {
    const status = App.progress[sess.id] || 'not_started';
    const attempts = App.declarations.filter(d => d.session_id === sess.id);
    return `
      <div class="sess-item" id="si-${sess.id}" onclick="selectSession('${sess.id}')">
        <div class="sess-item-main">
          <div>
            <div class="sess-title">${sess.title}</div>
            <div class="sess-sub">${sess.sub}</div>
          </div>
          ${statusBadge(status)}
        </div>
        ${status !== 'not_started' ? `
        <div class="sess-item-meta">
          ${attempts.length ? `<button class="sess-attempts-link" onclick="viewAttempts(event,'${sess.id}')">${attempts.length} attempt${attempts.length>1?'s':''}</button>` : ''}
          ${status === 'completed' ? '<button class="sess-do-again" onclick="doAgain(event,\''+sess.id+'\')">↺ Do again</button>' : ''}
        </div>` : ''}
      </div>`;
  }).join('');

  // Reset mode selection
  document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('begin-btn').disabled = true;
  document.getElementById('attempts-panel-wrap').style.display = 'none';

  showPanel('picker');
}

function statusBadge(status) {
  if (status === 'completed') return '<span class="badge badge-lime">✓ Done</span>';
  if (status === 'in_progress') return '<span class="badge badge-blue">In progress</span>';
  return '<span class="badge badge-gray">Not started</span>';
}

function selectSession(sessionId) {
  document.querySelectorAll('.sess-item').forEach(el => el.classList.remove('selected'));
  const el = document.getElementById('si-'+sessionId);
  if (el) el.classList.add('selected');

  const cat = CATS.find(c => c.key === App.currentCat);
  App.currentSession = cat?.sessions.find(s => s.id === sessionId) || null;

  // Show attempts panel if any
  const attempts = App.declarations.filter(d => d.session_id === sessionId);
  const wrap = document.getElementById('attempts-panel-wrap');
  if (attempts.length) {
    wrap.style.display = 'block';
    wrap.innerHTML = `
      <div class="attempts-panel">
        <div class="attempts-panel-header">📖 Previous Attempts (${attempts.length})</div>
        ${attempts.map(a => `
          <div class="attempt-item">
            <div class="attempt-meta">
              <span class="attempt-date">${fmtDate(a.created_at)}</span>
              <span class="attempt-stage-tag">${a.stage||''}</span>
              <span class="attempt-mode-tag">${a.mode==='flash'?'⚡ Flash':'📖 Deep'}</span>
            </div>
            <div class="attempt-decl">${a.declaration}</div>
          </div>`).join('')}
      </div>`;
  } else {
    wrap.style.display = 'none';
  }

  updateBeginBtn();
}

function selectMode(mode, el) {
  App.currentMode = mode;
  document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  updateBeginBtn();
}

function updateBeginBtn() {
  const btn = document.getElementById('begin-btn');
  btn.disabled = !(App.currentSession && App.currentMode);
}

function doAgain(e, sessionId) {
  e.stopPropagation();
  selectSession(sessionId);
}

function viewAttempts(e, sessionId) {
  e.stopPropagation();
  selectSession(sessionId);
  document.getElementById('attempts-panel-wrap')?.scrollIntoView({ behavior: 'smooth' });
}

function beginSession() {
  if (!App.currentSession || !App.currentMode) return;
  App.answers = {};

  if (App.currentMode === 'flash') {
    startFlash();
  } else {
    startDeep();
  }

  // Save progress
  if (App.user) {
    App.sb.from('session_progress').upsert({
      user_id: App.user.id,
      session_id: App.currentSession.id,
      status: 'in_progress',
      stage: App.stage,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,session_id' });
  }
  App.progress[App.currentSession.id] = App.progress[App.currentSession.id] || 'in_progress';
}

// ── Deep Session ──────────────────────────────────────────
function startDeep() {
  const sess = App.currentSession;
  const cat = CATS.find(c => c.key === App.currentCat);

  App.sections = [
    { key:'openPrayer',  label:'Opening Prayer',    type:'prayer',    content:sess.openPrayer },
    { key:'whyMatters',  label:'Why This Matters',   type:'why',       why:sess.why, scripture:sess.scripture },
    { key:'myStory',     label:'My Story',           type:'questions', questions:sess.myStory,   private:true },
    { key:'yourStory',   label:'Your Story',         type:'questions', questions:sess.yourStory, private:false },
    { key:'middle',      label:'Find Our Middle',    type:'middle',    prompts:sess.middle },
    { key:'declaration', label:'Our Declaration',    type:'declaration' },
    { key:'closePrayer', label:'Closing Prayer',     type:'prayer',    content:sess.closePrayer }
  ];
  App.secIdx = 0;

  document.getElementById('sess-cat-label').textContent = cat ? cat.emoji + ' ' + cat.name : '';
  renderDeepSection();
  showPanel('session');
}

function renderDeepSection() {
  const sec = App.sections[App.secIdx];
  const total = App.sections.length;
  const body = document.getElementById('sess-body');

  // Progress bar
  const progEl = document.getElementById('sess-prog');
  progEl.innerHTML = App.sections.map((s,i) => `<div class="sp-seg ${i<App.secIdx?'done':i===App.secIdx?'active':''}"></div>`).join('');
  document.getElementById('sess-step-label').textContent = `${App.secIdx+1} of ${total}`;

  let html = '';
  const isFirst = App.secIdx === 0;
  const isLast  = App.secIdx === total - 1;

  // ── Prayer ──
  if (sec.type === 'prayer') {
    html = `
      <div class="sec-tag">${sec.label}</div>
      <h2 class="sec-title">${sec.key==='openPrayer'?'Open in Prayer':'Close in Prayer'}</h2>
      <div class="prayer-block">
        <div class="prayer-text">${sec.content}</div>
        <div class="prayer-cue">↑ Read this aloud together before continuing.</div>
      </div>`;
  }
  // ── Why ──
  else if (sec.type === 'why') {
    const sc = sec.scripture;
    html = `
      <div class="sec-tag">${sec.label}</div>
      <h2 class="sec-title">Why This Matters</h2>
      <div class="why-text">${sec.why.replace(/\n\n/g,'</p><p class="why-text">').replace(/\n/g,'<br>')}</div>
      ${sc ? `<div class="scripture-block">
        <div class="scripture-verse">"${sc.text}"</div>
        <div class="scripture-ref">— ${sc.ref}</div>
      </div>` : ''}`;
  }
  // ── Questions (My Story / Your Story) ──
  else if (sec.type === 'questions') {
    const isPrivate = sec.private;
    html = `
      <div class="sec-tag">${sec.label}</div>
      <h2 class="sec-title">${sec.key==='myStory'?'Reflect on Your Story':'Understand Their Story'}</h2>
      ${isPrivate ? '<div class="privacy-note">🔒 These reflections are private — yours alone unless you choose to share.</div>' : ''}
      ${App.coupleSpace && sec.key==='yourStory' ? '<div class="couple-sync-notice"><strong>Couple Sync:</strong> Your observations are revealed to your partner only after you both submit.</div>' : ''}
      <div class="q-stack">
        ${sec.questions.map((q,i) => `
          <div class="q-block">
            <div class="q-num">Q${i+1}</div>
            <div class="q-text">${q}</div>
            <textarea class="field-textarea q-field"
              data-section="${sec.key}" data-idx="${i}"
              placeholder="Write your reflection…"
              rows="3"
            >${(App.answers[sec.key]||[])[i]||''}</textarea>
          </div>`).join('')}
      </div>`;
  }
  // ── Middle ──
  else if (sec.type === 'middle') {
    html = `
      <div class="sec-tag">${sec.label}</div>
      <h2 class="sec-title">Find Your Middle</h2>
      <p style="font-size:15px;color:var(--muted);line-height:1.7;margin-bottom:24px">Share your reflections with each other. Then answer these together — building one shared position.</p>
      <div class="middle-stack">
        ${sec.prompts.map((p,i) => `
          <div class="mid-item">
            <div class="mid-n">${i+1}</div>
            <div class="mid-content">
              <div class="mid-prompt">${p}</div>
              <textarea class="field-textarea q-field"
                data-section="middle" data-idx="${i}"
                placeholder="Write your shared answer…"
                rows="2"
              >${(App.answers['middle']||[])[i]||''}</textarea>
            </div>
          </div>`).join('')}
      </div>`;
  }
  // ── Declaration ──
  else if (sec.type === 'declaration') {
    html = `
      <div class="sec-tag">${sec.label}</div>
      <h2 class="sec-title">Write Your Declaration</h2>
      <p style="font-size:15px;color:var(--muted);line-height:1.7;margin-bottom:24px">Based on your full conversation — what do you both agree on? Write it below, or let AI draft a starting point from your answers.</p>
      <div class="decl-wrap">
        <span class="decl-preamble">We agree that…</span>
        <textarea class="decl-field" id="decl-input"
          placeholder="…write your shared declaration here."
        >${App.answers['declaration']||''}</textarea>
        <div class="decl-hint">This will be sealed permanently into your archive.</div>
      </div>
      <button class="btn btn-outline btn-full" id="ai-draft-btn" onclick="aiDraftDeclaration()" style="margin-bottom:12px">
        ✨ Draft with AI
      </button>`;
  }

  // Navigation buttons
  const navHtml = `
    <div class="sess-nav">
      ${!isFirst ? `<button class="btn btn-outline btn-back-sess" onclick="deepNav(-1)">← Back</button>` : '<div></div>'}
      ${isLast
        ? `<button class="btn btn-lime btn-finish-sess" onclick="sealDeclaration()">Seal Declaration ✓</button>`
        : `<button class="btn btn-dark btn-next-sess" onclick="deepNav(1)">Continue →</button>`
      }
    </div>`;

  body.innerHTML = `<div style="animation:fadeUp .35s ease">${html}${navHtml}</div>`;

  // Restore answer listeners
  body.querySelectorAll('.q-field').forEach(field => {
    field.addEventListener('input', () => {
      const sec = field.dataset.section;
      const idx = parseInt(field.dataset.idx);
      if (!App.answers[sec]) App.answers[sec] = [];
      App.answers[sec][idx] = field.value;
    });
  });
  body.querySelectorAll('.decl-field, #decl-input').forEach(f => {
    f.addEventListener('input', () => { App.answers['declaration'] = f.value; });
  });
}

function deepNav(dir) {
  App.secIdx = Math.max(0, Math.min(App.sections.length-1, App.secIdx + dir));
  renderDeepSection();
  window.scrollTo(0,0);
}

async function aiDraftDeclaration() {
  const btn = document.getElementById('ai-draft-btn');
  if (btn) { setBtnLoading(btn, true); }

  try {
    const myAnswers = App.answers['myStory'] || [];
    const partAnswers = App.answers['yourStory'] || [];
    const midAnswers = App.answers['middle'] || [];
    const title = App.currentSession?.title || '';

    const ai = await aiDeclaration({
      sessionTitle: title, stage: App.stage,
      myAnswers, partnerAnswers: partAnswers, middleAnswers: midAnswers
    });

    const input = document.getElementById('decl-input');
    if (input && ai) {
      const text = ai.startsWith('We agree') ? ai : 'We agree that ' + ai;
      input.value = text;
      App.answers['declaration'] = text;
      toast('✨ AI draft ready — edit it to make it yours.');
    }
  } catch(e) {
    toast('AI unavailable. Write your declaration above.');
  } finally {
    if (btn) setBtnLoading(btn, false, '✨ Draft with AI');
  }
}

async function sealDeclaration() {
  const raw = App.answers['declaration'] || document.getElementById('decl-input')?.value?.trim() || '';
  if (!raw || raw.length < 5) {
    toast('Please write your declaration first.');
    return;
  }
  const text = raw.startsWith('We agree') ? raw : 'We agree that ' + raw;
  await saveAndConfirm(text, 'deep');
}

// ── Flash Session ─────────────────────────────────────────
function startFlash() {
  const sess = App.currentSession;
  const cat = CATS.find(c => c.key === App.currentCat);

  App.flashIdx = 0;
  App.flashFlipped = false;

  document.getElementById('flash-cat-label').textContent = cat ? cat.emoji + ' ' + cat.name : '';
  renderFlash();
  showPanel('flash');
}

function renderFlash() {
  const cards = App.currentSession.flashCards || [];
  const idx = App.flashIdx;
  const total = cards.length;

  // Progress segments
  const prog = document.getElementById('flash-progress');
  prog.innerHTML = cards.map((_,i) => `<div class="fp-seg ${i<idx?'done':i===idx?'active':''}"></div>`).join('');
  document.getElementById('flash-counter').textContent = `Card ${idx+1} of ${total}`;

  // Reset flip
  App.flashFlipped = false;
  const card = document.getElementById('flashcard');
  card.classList.remove('flipped');

  document.getElementById('fc-question').textContent = cards[idx] || '';
  document.getElementById('fc-prompt').textContent = cards[idx] || '';

  // Buttons
  const nextBtn = document.getElementById('flash-next-btn');
  const isLast = idx >= total - 1;
  if (isLast) {
    nextBtn.textContent = 'Write Declaration →';
    nextBtn.className = 'flash-btn flash-btn-finish';
    nextBtn.onclick = showFlashDecl;
  } else {
    nextBtn.textContent = 'Next Card →';
    nextBtn.className = 'flash-btn flash-btn-next';
    nextBtn.onclick = flashNext;
  }
}

function flipCard() {
  App.flashFlipped = !App.flashFlipped;
  document.getElementById('flashcard').classList.toggle('flipped', App.flashFlipped);
}

function flashNext() {
  if (App.flashIdx < (App.currentSession.flashCards||[]).length - 1) {
    App.flashIdx++;
    renderFlash();
  }
}

function flashPrev() {
  if (App.flashIdx > 0) {
    App.flashIdx--;
    renderFlash();
  }
}

function showFlashDecl() {
  document.getElementById('flash-decl-section').style.display = 'block';
  document.getElementById('flash-next-btn').style.display = 'none';
  document.querySelector('.flash-btn[onclick="flashPrev()"]').style.display = 'none';
  document.getElementById('flash-decl-section').scrollIntoView({ behavior: 'smooth' });
}

async function saveFlashDeclaration() {
  const raw = document.getElementById('flash-decl-input')?.value?.trim() || '';

  if (!raw || raw.length < 5) {
    // AI-generate
    const btn = document.querySelector('.flash-seal-btn');
    if (btn) setBtnLoading(btn, true);
    try {
      const ai = await aiDeclaration({ sessionTitle: App.currentSession?.title || '', stage: App.stage });
      const text = ai && ai.length > 10 ? (ai.startsWith('We agree') ? ai : 'We agree that ' + ai) : 'We agree that this conversation brought us closer.';
      await saveAndConfirm(text, 'flash');
    } catch(e) {
      await saveAndConfirm('We agree that this conversation brought us closer.', 'flash');
    } finally {
      if (btn) setBtnLoading(btn, false, 'Seal Declaration ✓');
    }
    return;
  }

  const text = raw.startsWith('We agree') ? raw : 'We agree that ' + raw;
  await saveAndConfirm(text, 'flash');
}

// ── Save Declaration ──────────────────────────────────────
async function saveAndConfirm(text, mode) {
  const cat = CATS.find(c => c.key === App.currentCat);
  const now = new Date();
  const record = {
    session_id: App.currentSession?.id || '',
    session_title: App.currentSession?.title || '',
    category: cat?.name || '',
    stage: App.stage,
    mode,
    declaration: text,
    created_at: now.toISOString()
  };

  if (App.user) {
    try {
      record.user_id = App.user.id;
      record.couple_space_id = App.coupleSpace?.id || null;
      const { data } = await App.sb.from('declarations').insert(record).select().single();
      if (data) App.declarations.unshift(data);

      // Update progress
      await App.sb.from('session_progress').upsert({
        user_id: App.user.id,
        session_id: App.currentSession?.id || '',
        status: 'completed',
        stage: App.stage,
        updated_at: now.toISOString()
      }, { onConflict: 'user_id,session_id' });
    } catch(e) {
      console.warn('Save failed:', e.message);
      // Fall through — still show confirm
    }
  } else {
    // Save to localStorage for anonymous users
    const local = JSON.parse(localStorage.getItem('oa_decls') || '[]');
    local.unshift({ ...record, id: Date.now() });
    localStorage.setItem('oa_decls', JSON.stringify(local.slice(0,50)));
    App.declarations.unshift({ ...record, id: Date.now() });
  }

  App.progress[App.currentSession?.id || ''] = 'completed';

  // Show confirm screen
  document.getElementById('confirm-text').textContent = text;
  document.getElementById('confirm-email-capture').style.display = App.user ? 'none' : 'block';
  showPanel('confirm');

  // Rebuild library counts
  buildLibrary();
}

// ── Declarations Tab ──────────────────────────────────────
function renderDeclarations() {
  const list = document.getElementById('decls-list');
  if (!list) return;

  if (!App.declarations.length) {
    list.innerHTML = `
      <div style="text-align:center;padding:60px 20px">
        <div style="font-size:40px;margin-bottom:14px">✦</div>
        <div style="font-size:18px;font-weight:700;margin-bottom:8px">No declarations yet.</div>
        <div style="font-size:14px;color:var(--muted)">Complete your first session to seal your first declaration.</div>
      </div>`;
    return;
  }

  list.innerHTML = App.declarations.map(d => `
    <div class="decl-item">
      <div class="di-cat">${d.category || ''}</div>
      <div class="di-title">${d.session_title || ''}</div>
      <div class="di-text">${d.declaration}</div>
      <div class="di-footer">
        <span class="di-date">${fmtDate(d.created_at)}</span>
        ${d.stage ? `<span class="badge badge-gray">${d.stage}</span>` : ''}
        <span class="badge ${d.mode==='flash'?'badge-amber':'badge-blue'}">${d.mode==='flash'?'⚡ Flash':'📖 Deep'}</span>
        ${d.couple_space_id ? '<span class="badge badge-lime">👫 Couple</span>' : ''}
      </div>
    </div>`).join('');
}

// ── Progress Tab ──────────────────────────────────────────
async function renderProgress() {
  const wrap = document.getElementById('progress-wrap');
  if (!wrap) return;

  const total = CATS.reduce((a,c) => a+c.sessions.length, 0);
  const done  = Object.values(App.progress).filter(s => s==='completed').length;
  const decls = App.declarations.length;

  const catGrid = CATS.map(cat => {
    const catDone = cat.sessions.filter(s => App.progress[s.id]==='completed').length;
    const pct = cat.sessions.length ? Math.round((catDone/cat.sessions.length)*100) : 0;
    return `
      <div class="prog-cat-item">
        <span class="pci-emoji">${cat.emoji}</span>
        <div class="pci-name">${cat.name}</div>
        <div class="pci-count">${catDone}/${cat.sessions.length}</div>
        <div class="pci-bar"><div class="pci-bar-fill" style="width:${pct}%"></div></div>
        ${catDone===cat.sessions.length&&cat.sessions.length>0?'<div class="pci-complete">✓ Complete</div>':''}
      </div>`;
  }).join('');

  const timeline = App.declarations.slice(0, 20).map(d => `
    <div class="timeline-item">
      <div class="timeline-item-icon">${CATS.find(c=>c.name===d.category)?.emoji||'📖'}</div>
      <div class="timeline-item-body">
        <div class="timeline-item-title">${d.session_title}</div>
        <div class="timeline-item-sub">${d.category} · ${d.mode==='flash'?'⚡ Flash':'📖 Deep'}</div>
      </div>
      <div class="timeline-item-date">${fmtDate(d.created_at)}</div>
    </div>`).join('') || '<div style="padding:24px;text-align:center;color:var(--muted);font-size:14px">Complete your first session to see your timeline.</div>';

  wrap.innerHTML = `
    <div style="margin-bottom:28px"><h2 style="font-family:var(--fd);font-size:22px;font-weight:800;letter-spacing:-.5px">Your Progress</h2></div>
    <div id="ai-progress-insight"></div>
    <div class="progress-hero">
      <div class="ph-stat"><div class="ph-num">${done}</div><div class="ph-label">Sessions Done</div></div>
      <div class="ph-stat"><div class="ph-num">${decls}</div><div class="ph-label">Declarations</div></div>
      <div class="ph-stat"><div class="ph-num">${total-done}</div><div class="ph-label">Remaining</div></div>
    </div>
    <div class="section-title-row">Category Overview</div>
    <div class="prog-cat-grid">${catGrid}</div>
    <div class="section-title-row">Session Timeline</div>
    <div class="timeline-list">${timeline}</div>`;

  // AI insight async
  if (done > 0) {
    try {
      const sample = App.declarations.slice(0,3).map(d=>d.declaration).filter(Boolean);
      const prompt = `A Christian couple has completed ${done} of ${total} relationship sessions. Recent declarations: ${JSON.stringify(sample)}. Write 1 warm encouraging sentence (under 25 words). Return only the sentence.`;
      const ai = await callClaude(prompt, 60);
      const insightEl = document.getElementById('ai-progress-insight');
      if (insightEl && ai) {
        insightEl.innerHTML = `<div class="ai-bar" style="margin-bottom:20px"><div class="ai-bar-dots"><div class="ai-bar-dot"></div><div class="ai-bar-dot"></div><div class="ai-bar-dot"></div></div><span>✦ ${ai.trim()}</span></div>`;
      }
    } catch(e) {}
  }
}

// ── Couple Sync ───────────────────────────────────────────
async function buildCouplePanel() {
  const wrap = document.getElementById('couple-wrap');
  if (!wrap) return;

  if (!App.user) {
    wrap.innerHTML = `
      <div class="card-surface" style="text-align:center;padding:36px">
        <div style="font-size:36px;margin-bottom:12px">🔐</div>
        <div style="font-size:16px;font-weight:700;margin-bottom:8px">Sign in to use Couple Sync</div>
        <div style="font-size:13px;color:var(--muted);margin-bottom:20px">Each partner needs an account to link your spaces.</div>
        <button class="btn btn-dark" onclick="goSignIn()">Sign in →</button>
      </div>`;
    return;
  }

  if (App.coupleSpace?.connected) {
    // Show connected partners
    const { data: members } = await App.sb
      .from('couple_members').select('user_id, profiles(display_name,id)')
      .eq('couple_space_id', App.coupleSpace.id);

    const partnerRows = (members||[]).map(m => {
      const isYou = m.user_id === App.user.id;
      const name = m.profiles?.display_name || m.user_id.slice(0,8);
      return `
        <div class="partner-row">
          <div class="partner-avatar ${isYou?'':'partner-b'}">${name[0].toUpperCase()}</div>
          <div class="partner-info">
            <div class="partner-name">${name} ${isYou?'(you)':''}</div>
          </div>
          <span class="badge badge-lime">✓ Connected</span>
        </div>`;
    }).join('');

    wrap.innerHTML = `
      <div class="partner-list">${partnerRows}</div>
      <button class="btn btn-danger btn-full" style="margin-top:20px" onclick="disconnectCouple()">Disconnect Couple Space</button>`;
    return;
  }

  // Generate invite code
  let space = App.coupleSpace;
  if (!space) {
    try {
      const code = Math.random().toString(36).substr(2,6).toUpperCase();
      const { data } = await App.sb.from('couple_spaces').insert({ created_by: App.user.id, invite_code: code }).select().single();
      if (data) {
        await App.sb.from('couple_members').insert({ couple_space_id: data.id, user_id: App.user.id });
        App.coupleSpace = data;
        space = data;
      }
    } catch(e) { console.warn('Space create:', e.message); }
  }

  wrap.innerHTML = `
    <div class="invite-code-box">
      <div class="invite-code-label">Your Invite Code</div>
      <div class="invite-code">${space?.invite_code || '———'}</div>
      <div class="invite-code-expiry">Share this with your partner</div>
      <button class="btn btn-dark btn-sm" onclick="copyCode('${space?.invite_code||''}')">Copy Code</button>
    </div>
    <p style="font-size:13px;color:var(--muted);text-align:center;margin-bottom:16px">Or enter your partner's code below:</p>
    <div class="enter-code-section">
      <input class="field-input" type="text" id="partner-code-input"
        placeholder="ABCDEF" maxlength="6"
        style="text-align:center;letter-spacing:6px;font-size:20px;font-weight:700;text-transform:uppercase;margin-bottom:10px">
      <button class="btn btn-dark btn-full" onclick="joinCoupleSpace()">Link Accounts →</button>
    </div>`;
}

function copyCode(code) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(code).then(() => toast('Invite code copied!'));
  } else {
    const ta = document.createElement('textarea');
    ta.value = code;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    toast('Copied!');
  }
}

async function joinCoupleSpace() {
  const code = document.getElementById('partner-code-input')?.value?.trim().toUpperCase();
  if (!code || code.length < 4) { toast('Enter a valid invite code.'); return; }

  const btn = document.querySelector('#couple-wrap button[onclick="joinCoupleSpace()"]');
  setBtnLoading(btn, true);

  try {
    const { data: space, error } = await App.sb.from('couple_spaces').select('*').eq('invite_code', code).single();
    if (error || !space) throw new Error('Code not found');

    await App.sb.from('couple_members').insert({ couple_space_id: space.id, user_id: App.user.id });
    await App.sb.from('couple_spaces').update({ connected: true }).eq('id', space.id);
    App.coupleSpace = { ...space, connected: true };

    toast('✓ Couple Space linked!');
    buildCouplePanel();
    updateCoupleBar();
  } catch(e) {
    toast(e.message || 'Failed to join. Please check the code.');
  } finally {
    setBtnLoading(btn, false, 'Link Accounts →');
  }
}

async function disconnectCouple() {
  if (!confirm('Disconnect Couple Space? Your declarations are preserved.')) return;
  if (!App.coupleSpace) return;
  try {
    await App.sb.from('couple_members').delete().eq('couple_space_id', App.coupleSpace.id).eq('user_id', App.user.id);
    App.coupleSpace = null;
    toast('Couple Space disconnected.');
    buildCouplePanel();
    updateCoupleBar();
  } catch(e) { toast('Failed: ' + e.message); }
}

// ── Profile ───────────────────────────────────────────────
async function buildProfile() {
  const wrap = document.getElementById('profile-wrap');
  if (!wrap) return;

  if (!App.user) {
    wrap.innerHTML = `
      <div style="text-align:center;padding:40px 0">
        <div style="font-size:40px;margin-bottom:14px">👤</div>
        <div style="font-size:18px;font-weight:700;margin-bottom:8px">Not signed in</div>
        <div style="font-size:14px;color:var(--muted);margin-bottom:24px">Sign in to save progress across devices.</div>
        <button class="btn btn-dark" onclick="goSignIn()">Sign in →</button>
      </div>`;
    return;
  }

  const totalDone = Object.values(App.progress).filter(s=>s==='completed').length;
  const totalSessions = CATS.reduce((a,c)=>a+c.sessions.length,0);
  const displayName = App.profile?.display_name || App.user.email.split('@')[0];
  const initial = displayName[0].toUpperCase();
  const stageLabel = { dating:'🌱 Dating',engaged:'💍 Engaged',married:'🕊️ Married' }[App.stage] || App.stage;

  wrap.innerHTML = `
    <div style="margin-bottom:28px;display:flex;align-items:center;gap:16px">
      <div style="width:60px;height:60px;border-radius:50%;background:var(--ink);color:#fff;font-size:22px;font-weight:800;display:flex;align-items:center;justify-content:center;font-family:var(--fd)">${initial}</div>
      <div>
        <div style="font-size:22px;font-weight:800;font-family:var(--fd);letter-spacing:-.5px">${displayName}</div>
        <div style="font-size:13px;color:var(--muted);margin-top:2px">${App.user.email}</div>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px">
      <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:14px">Account</div>
      <div class="profile-row">
        <div class="profile-row-label">Email</div>
        <div class="profile-row-value">${App.user.email}</div>
      </div>
      <div class="profile-row">
        <div class="profile-row-label">Relationship Stage</div>
        <div class="profile-row-value">${stageLabel}</div>
        <a class="btn btn-ghost btn-sm btn" href="index.html">Change</a>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px">
      <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:14px">Progress</div>
      <div class="profile-row">
        <div class="profile-row-label">Sessions completed</div>
        <div class="profile-row-value">${totalDone} of ${totalSessions}</div>
      </div>
      <div class="profile-row">
        <div class="profile-row-label">Declarations sealed</div>
        <div class="profile-row-value">${App.declarations.length}</div>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px">
      <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:14px">Couple Space</div>
      <div class="profile-row">
        <div class="profile-row-label">Partner</div>
        <div class="profile-row-value">${App.coupleSpace?.connected ? '✓ Connected' : 'Not connected'}</div>
        <button class="btn btn-ghost btn-sm btn" onclick="showPanel('couple');buildCouplePanel()">
          ${App.coupleSpace?.connected ? 'Manage' : 'Connect'}
        </button>
      </div>
    </div>

    <button class="btn btn-danger btn-full btn" onclick="signOutUser()" style="margin-top:8px">Sign out</button>
  `;
}

async function signOutUser() {
  if (!confirm('Sign out?')) return;
  try {
    await App.sb.auth.signOut();
    window.location.href = 'signin.html';
  } catch(e) { toast('Sign out failed.'); }
}

// ── Confirm screen ────────────────────────────────────────
async function saveEmailFromConfirm() {
  const email = document.getElementById('confirm-email-input')?.value?.trim();
  if (!email || !email.includes('@')) { toast('Please enter a valid email.'); return; }
  sessionStorage.setItem('oa_redirect', window.location.pathname);
  sessionStorage.setItem('oa_prefill_email', email);
  window.location.href = 'signin.html?pre=' + encodeURIComponent(email);
}

// ── Utilities ─────────────────────────────────────────────
function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
  } catch(e) { return iso || ''; }
}

function toast(msg, ms=2600) {
  document.querySelectorAll('.toast-msg').forEach(e=>e.remove());
  const el = document.createElement('div');
  el.className = 'toast-msg'; el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(()=>el.remove(), ms+400);
}

function setBtnLoading(btn, loading, originalText) {
  if (!btn) return;
  btn.disabled = loading;
  btn.innerHTML = loading ? '<span class="spinner"></span>' : (originalText || btn.textContent);
}

async function aiDeclaration(ctx) {
  const { sessionTitle='', myAnswers=[], partnerAnswers=[], middleAnswers=[], stage='', q1='', q2='' } = ctx;
  let prompt;
  if (q1 || q2) {
    prompt = `A Christian couple is writing their first relationship declaration.\nReflection: "${q1||'faith'}"\nPartner view: "${q2||'similar values'}"\nWrite ONE declaration starting with "We agree that" — warm, personal, 1-2 sentences. Return ONLY the text.`;
  } else {
    prompt = `Help a Christian couple (${stage}) seal their session: "${sessionTitle}".\nMy Story: ${myAnswers.filter(Boolean).join(' | ')||'(not provided)'}\nYour Story: ${partnerAnswers.filter(Boolean).join(' | ')||'(not provided)'}\nMiddle: ${middleAnswers.filter(Boolean).join(' | ')||'(not provided)'}\nWrite ONE declaration starting with "We agree that" — specific, personal. 1-2 sentences. Return ONLY the text.`;
  }
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:100, messages:[{role:'user',content:prompt}] })
  });
  if(!r.ok) throw new Error('API '+r.status);
  const d = await r.json();
  return (d.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('').trim();
}

async function callClaude(prompt, maxTokens=300) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:maxTokens, messages:[{role:'user',content:prompt}] })
  });
  if(!r.ok) throw new Error('API '+r.status);
  const d = await r.json();
  return (d.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('').trim();
}

// ── Handle deep-link panel from sessionStorage ──────────────
// Called at end of appInit to check if a panel was requested externally
function checkOpenPanel() {
  const panel = sessionStorage.getItem('oa_open_panel');
  if (!panel) return;
  sessionStorage.removeItem('oa_open_panel');
  if (panel === 'couple')       { showPanel('couple');       buildCouplePanel();    return; }
  if (panel === 'declarations') { renderDeclarations();      showPanel('declarations'); return; }
  if (panel === 'progress')     { renderProgress();          showPanel('progress'); return; }
  if (panel === 'profile')      { buildProfile();            showPanel('profile');  return; }
}
