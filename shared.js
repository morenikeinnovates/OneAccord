// ── STATE ──────────────────────────────────────────────
const S = {
  get email()    { return localStorage.getItem('oa_email')   || null; },
  get userName() { return localStorage.getItem('oa_name')    || null; },
  get stage()    { return localStorage.getItem('oa_stage')   || null; },
  get coupleSpaceId()  { return localStorage.getItem('oa_couple')        || null; },
  get partnerName()    { return localStorage.getItem('oa_partner_name')  || null; },
  get partnerEmail()   { return localStorage.getItem('oa_partner_email') || null; },
  get declarations()   { try{ return JSON.parse(localStorage.getItem('oa_decls')||'[]'); }catch(e){return[];} },
  get attempts()       { try{ return JSON.parse(localStorage.getItem('oa_attempts')||'[]'); }catch(e){return[];} },
  get completedSessions() { try{ return JSON.parse(localStorage.getItem('oa_completed')||'{}'); }catch(e){return{};} },

  setEmail(v)    { v ? localStorage.setItem('oa_email',v)   : localStorage.removeItem('oa_email'); },
  setName(v)     { v ? localStorage.setItem('oa_name',v)    : localStorage.removeItem('oa_name'); },
  setStage(v)    { v ? localStorage.setItem('oa_stage',v)   : localStorage.removeItem('oa_stage'); },
  setCouple(id,pName,pEmail) {
    id     ? localStorage.setItem('oa_couple',id)            : localStorage.removeItem('oa_couple');
    pName  ? localStorage.setItem('oa_partner_name',pName)   : localStorage.removeItem('oa_partner_name');
    pEmail ? localStorage.setItem('oa_partner_email',pEmail) : localStorage.removeItem('oa_partner_email');
  },
  addDeclaration(d) {
    const arr = this.declarations; arr.push(d);
    localStorage.setItem('oa_decls', JSON.stringify(arr));
  },
  addAttempt(a) {
    const arr = this.attempts; arr.push(a);
    localStorage.setItem('oa_attempts', JSON.stringify(arr));
  },
  markComplete(sessionId) {
    const obj = this.completedSessions; obj[sessionId] = true;
    localStorage.setItem('oa_completed', JSON.stringify(obj));
  },
  signOut() {
    ['oa_email','oa_name'].forEach(k => localStorage.removeItem(k));
  }
};

// ── DATA ───────────────────────────────────────────────
const CATS = [
  {
    key:'foundation', name:'Foundation', emoji:'🏛️',
    desc:'Who you are and why you are doing this together.',
    stages:['dating','engaged','married'],
    sessions:[
      { id:'f1', title:'Who We Are', sub:'Your individual stories and what shaped you.',
        why:`Every person arrives in a relationship carrying the weight and beauty of their history. The family you grew up in, the experiences that formed you, the wounds you still carry and the strengths you've built — all of these come with you.\n\nBefore you can build something together, you need to understand who each of you actually is. Not the version you present, but the real person shaped by a real story.`,
        scripture:{text:'So then you are no longer strangers and aliens, but you are fellow citizens with the saints and members of the household of God.',ref:'Ephesians 2:19'},
        myStory:['What is one experience from your childhood that shaped how you relate to people you love?','What belief about yourself did you grow up carrying that still influences you today?','What do you most want your partner to understand about who you are and where you came from?'],
        yourStory:['What part of their upbringing do you think has shaped them the most?','What is a belief or value they hold that you want to understand more deeply?','What is one thing about their story that moves or inspires you?'],
        middle:['Where do your backgrounds differ the most?','Where do you already feel a natural alignment in your stories?','What tension might your different histories create?','What principle should guide how you hold each other\'s stories?'],
        openPrayer:'Lord, give us the courage to be seen fully and the grace to fully see each other.',
        closePrayer:'Lord, thank you for the story you gave each of us. Help us to honour what has shaped the person we love.',
        flashCards:['What is one experience from childhood that still shapes how you love?','What belief about yourself did you carry into this relationship?','What do you wish your partner understood more fully about your story?','Where do our backgrounds create beautiful difference between us?','What is one wound from your past you\'re still learning to carry?','What strength did your upbringing give you that you\'re proud of?','What does "home" mean to you — based on where you came from?','What part of your partner\'s story moves you the most?']
      },
      { id:'f2', title:'Why We\'re Doing This', sub:'Clarifying your shared intent and vision.',
        why:`A relationship without a shared sense of purpose drifts. Two people can be deeply in love and still be heading in different directions because they've never articulated what they're building together.\n\nThis session asks a foundational question: Why are we doing this? Not just "because we love each other" — love is the fuel, but what's the destination?`,
        scripture:{text:'Commit your way to the Lord; trust in him, and he will act.',ref:'Psalm 37:5'},
        myStory:['What is the deepest reason you are pursuing this relationship — beyond feelings?','What does a successful marriage look like to you in 10 years?','What are you most afraid of when you think about the future of this relationship?'],
        yourStory:['What do you think motivates your partner most deeply in this relationship?','What vision do you sense your partner has for the life you could build?','What fear do you think your partner carries that they may not always voice?'],
        middle:['Where does your vision for this relationship overlap?','Where do you notice differences in what you each hope for?','What principle should guide your shared purpose as a couple?'],
        openPrayer:'Lord, align our hearts with your purpose for this relationship.',
        closePrayer:'Lord, seal the vision you have placed in us. Let our love be purposeful, not accidental.',
        flashCards:['Why are you really in this relationship — beyond feelings?','What does "a successful marriage" mean to you?','What is the life you imagine building together in 20 years?','What are you most afraid of when you think about the future?','What is one shared dream you haven\'t said out loud yet?']
      }
    ]
  },
  {
    key:'faith', name:'Faith & Spiritual Growth', emoji:'✝️',
    desc:'How faith shapes your individual lives and your life together.',
    stages:['dating','engaged','married'],
    sessions:[
      { id:'fa1', title:'How We Worship', sub:'Your faith backgrounds and spiritual life together.',
        why:`Two Christians can hold the same faith in very different ways. One grew up in a liturgical tradition, another in a charismatic environment. This session invites you to share honestly about your faith life — not the version that sounds most mature, but the actual reality of how you relate to God.`,
        scripture:{text:'And let us consider how to stir up one another to love and good works, not neglecting to meet together.',ref:'Hebrews 10:24–25'},
        myStory:['What did your faith look like growing up — and how has it changed?','What does your personal relationship with God actually look like day to day right now?','What do you need from your partner when it comes to your spiritual life?'],
        yourStory:['How would you describe your partner\'s relationship with God based on what you\'ve observed?','What aspect of their faith do you find most inspiring?','What do you think your partner might need spiritually that they may not always ask for?'],
        middle:['Where do your faith expressions and traditions differ?','Where do you feel spiritually united already?','What would it look like to build a shared spiritual life that honours both of you?'],
        openPrayer:'Lord, be the foundation of everything we build. Make our faith something we share, not just something we carry individually.',
        closePrayer:'Lord, draw us both closer to you.',
        flashCards:['What does your faith actually look like on an ordinary Tuesday?','What spiritual habit do you wish you were more consistent with?','What does worship mean to you — beyond Sunday?','What do you need from your partner spiritually?','What would a spiritually healthy week look like for both of you?']
      },
      { id:'fa2', title:'Leading Our Home Spiritually', sub:'Roles, responsibility and a spiritually healthy home.',
        why:`Questions of spiritual leadership — who leads, how leadership is defined, what happens when one partner is spiritually stronger in a season — are real conversations that need to happen early.\n\nThis session is not about imposing a framework. It is about understanding each other's convictions.`,
        scripture:{text:'But as for me and my house, we will serve the Lord.',ref:'Joshua 24:15'},
        myStory:['What is your understanding of spiritual leadership in a marriage?','What does a spiritually healthy home look like to you practically?','What are you afraid of getting wrong when it comes to spiritual life at home?'],
        yourStory:['How do you think your partner understands their spiritual role?','What spiritual habits or practices do you hope to build together?'],
        middle:['Where do your expectations around spiritual leadership align?','Where do they differ?','What specific practice can you commit to starting as a couple?'],
        openPrayer:'Lord, teach us how to lead each other to you.',
        closePrayer:'Lord, make our home a place of prayer, peace, and your presence.',
        flashCards:['What does spiritual leadership in a marriage mean to you?','What would a spiritually thriving home feel like day to day?','How was prayer handled in the home you grew up in?','What role should the church play in your home life?']
      }
    ]
  },
  {
    key:'communication', name:'Communication', emoji:'💬',
    desc:'How you speak, listen, and understand each other.',
    stages:['dating','engaged','married'],
    sessions:[
      { id:'c1', title:'How We Talk', sub:'Communication styles and what makes you feel truly heard.',
        why:`Most couples believe they communicate well — until they're under pressure and discover they communicate very differently. One person processes out loud; the other needs time alone. This session helps you learn each other's language before frustration does the teaching.`,
        scripture:{text:'Let every person be quick to hear, slow to speak, slow to anger.',ref:'James 1:19'},
        myStory:['How do you naturally process difficult emotions — outwardly or inwardly?','What makes you feel truly heard and understood in a conversation?','What communication habit in yourself do you know needs work?'],
        yourStory:['How does your partner seem to process things when something is difficult?','What do you think your partner needs from you in difficult conversations that you don\'t always give?'],
        middle:['Where do your communication styles differ most clearly?','What pattern tends to break down your conversations?','What one specific communication habit could you both commit to building?'],
        openPrayer:'Lord, help us to listen more than we speak, and to speak more carefully than we feel.',
        closePrayer:'Lord, make us people who build each other up with our words.',
        flashCards:['Are you a process-out-loud or process-alone person?','What makes you feel like someone is really listening to you?','What do you do when you\'re overwhelmed that your partner may not understand?','What does "a good conversation" feel like to you?']
      }
    ]
  },
  {
    key:'conflict', name:'Conflict', emoji:'⚖️',
    desc:'How you navigate disagreement, repair, and forgiveness.',
    stages:['dating','engaged','married'],
    sessions:[
      { id:'co1', title:'How We Fight', sub:'Your conflict patterns and what healthy disagreement looks like.',
        why:`Every couple fights. The question is not whether you'll have conflict — it's whether your conflict will build you or break you.\n\nWhat you learned about conflict growing up is with you right now. This session surfaces that, so your past doesn't silently run your present.`,
        scripture:{text:'Be angry and do not sin; do not let the sun go down on your anger.',ref:'Ephesians 4:26'},
        myStory:['What did conflict look like in your home growing up?','What is your instinctive response when you feel hurt — pursue, withdraw, or escalate?','What do you need from your partner in the middle of a disagreement to feel safe?'],
        yourStory:['How does your partner tend to respond when they\'re in conflict?','What triggers in them have you already noticed?'],
        middle:['Where do your conflict styles clash?','What pattern do you want to intentionally break?','What is always off limits in a fight?'],
        openPrayer:'Lord, make us quick to reconcile and slow to wound.',
        closePrayer:'Lord, let our conflicts produce growth, not damage.',
        flashCards:['What did conflict look like in your home growing up?','Do you tend to pursue, withdraw, or escalate when you\'re hurt?','What is never okay in a fight?','What does "fighting fair" mean to you?']
      },
      { id:'co2', title:'Repair & Forgiveness', sub:'How you come back to each other.',
        why:`How a couple repairs after conflict matters more than how they fight. Forgiveness in a marriage is not a feeling — it is a decision made over and over, often before the feeling catches up.`,
        scripture:{text:'Be kind to one another, tenderhearted, forgiving one another, as God in Christ forgave you.',ref:'Ephesians 4:32'},
        myStory:['What does it cost you to apologise — and what makes it easier or harder?','How do you know when you\'ve truly forgiven someone?','What does repair look like for you?'],
        yourStory:['How does your partner tend to apologise — and does it land for you?','What helps your partner feel forgiven and reconnected?'],
        middle:['Where do your repair styles differ?','What specific repair commitment can you make after a conflict?'],
        openPrayer:'Lord, make forgiveness a reflex in this relationship.',
        closePrayer:'Lord, help us to never let wounds become walls.',
        flashCards:['What makes it hard or easy for you to apologise?','What does a genuine apology look like to you?','How do you know you\'ve truly been forgiven?','What does "letting it go" actually mean to you?']
      }
    ]
  },
  {
    key:'money', name:'Money', emoji:'💰',
    desc:'Your financial values, habits, and how you\'ll steward what God gives you.',
    stages:['engaged','married'],
    sessions:[
      { id:'m1', title:'How We Spend', sub:'Your money personalities and the beliefs behind your financial decisions.',
        why:`Money is one of the most common sources of conflict in marriage — not because money is complicated, but because it is deeply personal. Two people can both be responsible with money and still fight constantly about it because they have different definitions of what "responsible" means.`,
        scripture:{text:'The plans of the diligent lead surely to abundance, but everyone who is hasty comes only to poverty.',ref:'Proverbs 21:5'},
        myStory:['What was the financial climate like in the home you grew up in?','Are you naturally a spender or a saver — and what emotion drives that?','What does financial security mean to you?'],
        yourStory:['How would you describe your partner\'s relationship with money?','What financial tendency in your partner creates anxiety?'],
        middle:['Where do your money personalities differ most clearly?','What principle should govern how you make financial decisions together?'],
        openPrayer:'Lord, let money be a tool in our hands, not a source of fear or division.',
        closePrayer:'Lord, help us to be faithful with what you give us and generous in how we hold it.',
        flashCards:['Are you a spender or a saver by instinct?','What does financial security feel like to you?','What money habit could create tension?','What financial goal matters most to you in the next 5 years?']
      }
    ]
  },
  {
    key:'career', name:'Career & Calling', emoji:'🌟',
    desc:'Supporting each other\'s ambitions and navigating calling together.',
    stages:['engaged','married'],
    sessions:[
      { id:'ca1', title:'Supporting Each Other\'s Calling', sub:'What your ambitions are and how you plan to champion each other.',
        why:`Two whole people with individual callings don't stop having those when they enter a relationship. The question is how two strong callings coexist, support each other, and sometimes yield to each other without resentment.`,
        scripture:{text:'Whatever you do, work heartily, as for the Lord and not for men.',ref:'Colossians 3:23'},
        myStory:['What do you believe you\'re called to do — and how central is that to your sense of identity?','What does success in your career or calling look like to you in 5–10 years?','What do you need from your partner when your work is demanding?'],
        yourStory:['What does your partner believe they are called to?','What support would your partner need from you that you haven\'t fully committed to yet?'],
        middle:['Where do your callings and careers complement each other?','What principle should govern how you prioritise between career and relationship when they conflict?'],
        openPrayer:'Lord, help us to see each other\'s callings as sacred and worthy of support.',
        closePrayer:'Lord, help us to build lives where both of us can flourish.',
        flashCards:['What do you believe you\'re called to do with your life?','How central is your career to your sense of who you are?','What career sacrifice are you willing to make for this relationship?']
      }
    ]
  },
  {
    key:'family', name:'Family & Roles', emoji:'🏡',
    desc:'How you will structure your home, raise children, and navigate extended family.',
    stages:['engaged','married'],
    sessions:[
      { id:'fam1', title:'How We\'ll Do Family', sub:'Roles at home, children, parenting, and extended family.',
        why:`One of the most loaded conversations a couple can have is about family — because it touches everything: roles in the home, whether and when to have children, how to parent, what relationship you'll have with in-laws.`,
        scripture:{text:'Train up a child in the way he should go; even when he is old he will not depart from it.',ref:'Proverbs 22:6'},
        myStory:['What roles did the men and women in your family play?','What is your honest position on having children — timing, number, and the fears?','How close are you to your family of origin?'],
        yourStory:['What domestic roles and expectations do you sense your partner carries?','What is your partner\'s position on children?'],
        middle:['Where are your expectations about family roles most similar?','What extended family dynamic might create friction?'],
        openPrayer:'Lord, help us to honour both families we come from while building a new one that belongs to you.',
        closePrayer:'Lord, give us wisdom to build a home that is full of love, structure, and your presence.',
        flashCards:['Do you want children — and when?','What kind of parent do you want to be?','How close do you want to be to your extended family?','What parenting style do you imagine?']
      }
    ]
  },
  {
    key:'intimacy', name:'Intimacy & Expectations', emoji:'🤝',
    desc:'Emotional closeness, physical expectations, and the vulnerability for real oneness.',
    stages:['engaged','married'],
    sessions:[
      { id:'i1', title:'Expectations We Brought In', sub:'The unspoken expectations about closeness you each carry.',
        why:`Every person enters a relationship with expectations — many of which they are not consciously aware of. When they go unspoken, they become invisible walls — and invisible walls cause real pain.`,
        scripture:{text:'Above all, keep loving one another earnestly, since love covers a multitude of sins.',ref:'1 Peter 4:8'},
        myStory:['What expectations about emotional closeness do you carry?','What do you need physically and emotionally to feel loved and secure?','What expectation have you had that has already been disappointed?'],
        yourStory:['What expectations about intimacy and closeness do you sense your partner holds?','What expectation of theirs do you find most challenging to meet?'],
        middle:['Where are your intimacy needs most similar?','What expectation have you been carrying silently that needs to be spoken today?'],
        openPrayer:'Lord, help us to be honest about what we need and gracious about what we receive.',
        closePrayer:'Lord, help us to love each other as we actually are — not as we imagined each other would be.',
        flashCards:['What do you need most to feel loved on an ordinary day?','What expectation did you bring into this relationship without realising it?','What does emotional intimacy mean to you?']
      }
    ]
  },
  {
    key:'vision', name:'Future Vision', emoji:'🔭',
    desc:'The life you are building together — where you\'re headed.',
    stages:['dating','engaged','married'],
    sessions:[
      { id:'v1', title:'The Life We\'re Building', sub:'Your shared picture of the future.',
        why:`Most couples think about the future in vague terms. This session asks you to paint a more specific picture — where will you live, what lifestyle will you build, what do you want your life to look like when you're sixty?`,
        scripture:{text:'For I know the plans I have for you, declares the Lord, plans for welfare and not for evil, to give you a future and a hope.',ref:'Jeremiah 29:11'},
        myStory:['What does the life you\'re building together look like in 5, 15, 30 years?','What location, lifestyle, and legacy matters most to you?','What is the one thing you absolutely do not want your future to look like?'],
        yourStory:['What does your partner\'s vision of the future look like?','Where does their vision excite you? Where does it create quiet anxiety?'],
        middle:['Where are your future visions most aligned?','Where do they diverge significantly?','What is the shared vision statement that captures where you\'re headed?'],
        openPrayer:'Lord, give us a shared vision that is bigger than either of us could have alone.',
        closePrayer:'Lord, we commit our future to you. Lead us, correct us, and help us to build something worth building.',
        flashCards:['What does your ideal life look like in 10 years?','Where do you want to live?','What legacy do you want to leave?','What would need to be true for you to feel like you lived a good life?']
      }
    ]
  },
  {
    key:'friendship', name:'Friendship & Fun', emoji:'🎉',
    desc:'Making space for joy, laughter, and genuine friendship at the core of your love.',
    stages:['dating','engaged','married'],
    sessions:[
      { id:'fr1', title:'Friends Who Belong', sub:'Your social worlds, shared friendships, and making room for joy.',
        why:`The most enduring marriages are built on genuine friendship. Couples who neglect to protect their joy often find they've built a productive but joyless partnership.`,
        scripture:{text:'A joyful heart is good medicine, but a crushed spirit dries up the bones.',ref:'Proverbs 17:22'},
        myStory:['What does fun look like to you — what genuinely fills you up and makes you come alive?','What role do friendships outside this relationship play in your life?','When do you feel most like friends with your partner?'],
        yourStory:['What makes your partner genuinely light up?','What do you do together that brings out the best version of each of you?'],
        middle:['Where do your ideas of fun and rest align naturally?','What is one specific thing you will commit to doing together regularly?'],
        openPrayer:'Lord, help us never to lose the joy of each other.',
        closePrayer:'Lord, thank you for the gift of genuine friendship in this relationship.',
        flashCards:['What is your idea of a perfect day together?','What makes you laugh the hardest?','What is something fun you\'ve always wanted to try but haven\'t?','What does it mean to be your partner\'s best friend?']
      }
    ]
  }
];

const STAGE_PATHS = {
  dating:  ['foundation','faith','communication','conflict','vision','friendship'],
  engaged: ['faith','family','money','intimacy','communication','conflict','career'],
  married: ['communication','conflict','money','career','vision','intimacy']
};

const STAGE_LABELS = {
  dating:  '🌱 Dating',
  engaged: '💍 Engaged',
  married: '🕊️ Married'
};

// ── UTILITIES ──────────────────────────────────────────
function toast(msg, ms=2500) {
  document.querySelectorAll('.toast').forEach(e=>e.remove());
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(()=>el.remove(), ms+400);
}

function showAIBar(msg='Thinking…', parentEl=null) {
  hideAIBar();
  const bar = document.createElement('div');
  bar.id = 'ai-bar';
  bar.className = 'ai-bar';
  bar.innerHTML = `<div class="ai-dots"><div class="ai-dot"></div><div class="ai-dot"></div><div class="ai-dot"></div></div><span>${msg}</span>`;
  const target = parentEl || document.querySelector('main, .page-wrap, body');
  if (target) target.prepend(bar);
}

function hideAIBar() {
  const el = document.getElementById('ai-bar');
  if (el) el.remove();
}

function navigate(path) {
  window.location.href = path;
}

function getCatForStage(stage) {
  const path = STAGE_PATHS[stage] || [];
  return CATS.filter(c => path.includes(c.key));
}

function getSessionById(id) {
  for (const cat of CATS) {
    const sess = cat.sessions.find(s => s.id === id);
    if (sess) return { cat, sess };
  }
  return null;
}

// ── CLAUDE API ─────────────────────────────────────────
async function callClaude(prompt, maxTokens=300) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  if (!res.ok) throw new Error('API ' + res.status);
  const d = await res.json();
  return (d.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('').trim();
}

async function aiDeclaration(context) {
  const { title='', stage='', myAnswers=[], partnerAnswers=[], middleAnswers=[], q1='', q2='' } = context;
  let prompt;
  if (q1 || q2) {
    prompt = `You are helping a Christian couple write their first relationship declaration in OneAccord.\n\nPerson's answer about what they want the relationship defined by: "${q1||'faith and intentionality'}"\nTheir perception of what their partner wants: "${q2||'similar values'}"\n\nWrite ONE declaration starting exactly with "We agree that" — warm, personal, grounded in Christian values. 1-2 sentences max. Return ONLY the declaration text, no quotes, no explanation.`;
  } else {
    const parts = [];
    if (myAnswers.filter(Boolean).length) parts.push(`My Story: ${myAnswers.filter(Boolean).join(' | ')}`);
    if (partnerAnswers.filter(Boolean).length) parts.push(`Your Story observations: ${partnerAnswers.filter(Boolean).join(' | ')}`);
    if (middleAnswers.filter(Boolean).length) parts.push(`Finding Our Middle: ${middleAnswers.filter(Boolean).join(' | ')}`);
    prompt = `You are helping a Christian couple write a declaration to seal their session: "${title}".\nRelationship stage: ${stage}\n${parts.join('\n')}\n\nWrite ONE declaration starting exactly with "We agree that" — specific, personal, spiritually grounded. 1-2 sentences. Return ONLY the declaration text, no quotes, no explanation.`;
  }
  return await callClaude(prompt, 120);
}

async function aiProgressInsight(completedCount, total, declarations) {
  const sample = declarations.slice(0,3).map(d=>d.text||'').filter(Boolean);
  const prompt = `A Christian couple has completed ${completedCount} of ${total} sessions in OneAccord.${sample.length ? `\nSome declarations: ${JSON.stringify(sample)}` : ''}\n\nWrite 1 short sentence of warm encouragement. Under 25 words. Return ONLY the sentence.`;
  return await callClaude(prompt, 60);
}

// ── NAV HELPERS ────────────────────────────────────────
function initNav() {
  const initial = S.userName ? S.userName.charAt(0).toUpperCase() : (S.email ? S.email.charAt(0).toUpperCase() : '?');
  document.querySelectorAll('.nav-profile-btn').forEach(el => { el.textContent = initial; });
  document.querySelectorAll('.nav-user-name').forEach(el => { el.textContent = S.userName || S.email || ''; });
  const stageEl = document.querySelector('.stage-pill');
  if (stageEl && S.stage) stageEl.textContent = STAGE_LABELS[S.stage] || '';
}
