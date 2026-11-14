(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const app = $('#app');
document.documentElement.lang = 'he'; document.documentElement.dir = 'rtl';
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TOUCH = matchMedia('(pointer: coarse)').matches; // phones and tablets: lighter rendering, viewport-height changes ignored
const fmt = (v, n = 1) => { const s = v.toFixed(n); return +s === 0 ? (0).toFixed(n) : s; };
const show = (v, n = 1) => fmt(v, n).replace('-', '−');                       // for people: a real minus sign
const pct = v => (v > 0 && Math.round(v) !== 0 ? '+' : '') + show(v, 0) + '%';
const big = n => Math.round(n).toLocaleString('en-US');
const LABEL = '#f5f5f7', L2 = 'rgba(235,235,245,.7)', L3 = 'rgba(235,235,245,.44)', CP = '#2389e2', CI = '#b38f18', CD = '#d44996', CAI = '#34c26b', WARN = '#ff9f0a';
const UI = 'system-ui, -apple-system, "Heebo", "Segoe UI", Arial, sans-serif', MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';
let REM = 16;
let viaKey = false; // true while a key press is being handled: what a key opens appears at once, the transitions are for the pointer

/* ================= stations ================= */
// shot: [azimuth°, elevation°, distance, x offset, y offset, explode, stand, twin, dim, spin, swarm]
// need: how many world units have to fit in the part of the screen the text leaves free
const ST = [
  { name: 'פתיחה', sec: 15, shot: [28, 12, 7.4, -.2, -.03, 0, 0, 0, 0, 1, 0],
    say: 'מי ניסה פעם לאזן מטאטא על כף היד? רחפן עושה את זה כל הזמן, עם ארבעה מנועים, ובלי להתעייף.', act: '״התחילו״ מפעיל את השעון ועובר לתחנה 1. ↓ ↑ עוברים תחנה, ← → בין הכפתורים, רווח בוחר. ? מציג את כל המקשים.' },
  { name: 'האתגר', sec: 30, need: 6.8, shot: [12, 8, 7.6, -.23, .03, 0, 1, 0, 0, 0, 0],
    say: 'בקשו מתנדב. בני אדם מגיבים בערך ברבע שנייה, וזה איטי מדי. צריך משהו שמודד ומתקן לבד.', act: '״אני מחזיק/ה״ וגוררים את הידית. אחרי הנפילה הבקר חוזר לבד.' },
  { name: 'הלולאה', sec: 20, need: 7.4, shot: [-30, 24, 9.6, -.2, 0, 1, 0, 0, 0, 0, 0],
    say: 'מודדים, מחשבים, מתקנים. כל סיבוב מקטין את השגיאה קצת. הסוד הוא לא החוכמה של כל סיבוב אלא הקצב.', act: 'תנו לסיבוב או שניים לרוץ בהילוך איטי (כשש שניות לסיבוב), ואז ״מהירות אמיתית״ ו״משב רוח״.' },
  { name: 'מעבדת PID', sec: 50, need: 7.2, shot: [12, 8, 7.8, -.25, .03, 0, 1, 0, 0, 0, 0],
    say: 'לפני כל לחיצה שאלו את הכיתה מה יקרה. P לבד מתנדנד. D מרגיע. I סוגר את הפער שנשאר. הגרף מראה מאיפה כל איבר לוקח את המידע: עכשיו, עבר, עתיד.', act: 'לפי הסדר: רק P, ‏P + D, ‏+ מטען, ‏P + I + D, מוגזם. ״משב רוח״ בכל שלב. ״כוונון ידני״ פותח את שלושת המחוונים.' },
  { name: 'מה זו רשת', sec: 20, shot: [12, 8, 7.8, -.25, .03, 0, 1, 0, .96, 0, 0],
    say: 'לפני שנראה רשתות על הרחפן: נוירון כופל כל כניסה במשקל, מחבר, ומחליט כמה חזק להגיב. רשת היא הרבה כאלה בשכבות. אימון הוא הזזת המשקלים עד שהתשובות נכונות. זה הכול.', act: '1 נוירון אחד, 2 רשת, 3 אימון. אפשר לעבור ביניהם עם ← → ורווח.' },
  { name: 'רשת מכווננת', sec: 50, need: 10.6, shot: [8, 10, 11.5, -.24, .03, 0, 1, 1, 0, 0, 0],
    say: 'שתי דרכים לתת לרשת לכוונן PID. מאומנת מראש: אוספים דוגמאות בסימולטור, והרשת לומדת מהן בירידה בגרדיאנט, כמו שמאמנים כל רשת. לומד בטיסה: נוירון אחד שמעדכן את המקדמים בזמן אמת.', act: '״אספו דוגמאות״, ״אמנו את הרשת״, ואז ״מטען בצד״ ו״סוללה חלשה״. הדגישו שהמטען הזה לא היה בדוגמאות והרשת משלימה. אם יש זמן: ״לומד בטיסה״.' },
  { name: 'רשת לומדת', sec: 45, shot: [-16, 36, 58, -.2, -.04, 0, 1, 0, 0, 0, 1],
    say: 'כאן אין תשובה נכונה להעתיק, רק ציון. זו למידת חיזוק: מנסים, מדרגים, ומזיזים את המשקלים לכיוון מי שהצליח. ספרו בקול את ההתרסקויות: זה המחיר, ולכן מאמנים בסימולטור.', act: '״התחילו אימון״, כ-20 שניות. הצביעו על שלושת השלבים ועל הרשת שמשמאל. אחר כך ״רוח צד קבועה״ כדי להראות מה הרשת לא למדה.' },
  { name: 'על הרחפן', sec: 40, shot: [120, 28, 13, 0, 0, 0, 1, 0, .96, 0, 0],
    say: 'רשת בקרה קטנה כמעט לא עולה כלום: היא נכנסת לשבב שכבר יש ברחפן. המחיר מגיע כשהרשת צריכה לראות: מחשב GPU של 10 עד 25 וואט, ומשקל שהמנועים צריכים להרים. המשקל עולה יותר זמן טיסה מהחשמל של המחשב.', act: 'לפי הסדר: PID, רשת בקרה קטנה, רשת ראייה, Orin NX. עצרו על זמן הטיסה.' },
  { name: 'השוואה', sec: 30, shot: [140, 30, 14, 0, 0, 0, 1, 0, .93, 0, 0],
    say: 'אין שיטה שמנצחת בכל שורה. הבחירה תלויה במה שיקר לכם: זמן פיתוח, ביצועים, או היכולת להוכיח שזה בטוח.', act: '״מה נמדד״ מציג את מדידות הריחוף המגנטי. ״הצבעה״: הכיתה מצביעה, ורק אז לוחצים.' },
  { name: 'סיכום', sec: 0, shot: [180, 34, 16, 0, 0, 0, 1, 0, .93, 0, 0],
    say: 'PID כשאפשר, למידה כשחייבים, ולרוב שילוב של השניים.', act: 'המקורות למטה, לשאלות מהקהל.' },
];
const NST = ST.length, secs = ST.map((_, i) => $('#s' + i));
let tops = [], vh = innerHeight, OFF = 0, PHONE = false;
function measure(){ vh = innerHeight; PHONE = matchMedia('(max-width: 860px)').matches; OFF = PHONE ? Math.round(($('#stage').offsetHeight || vh * .46) + 4) : 0; tops = secs.map(s => { const r = s.getBoundingClientRect(); return [r.top + scrollY, r.bottom + scrollY]; }); }
function scrollF(){
  if (PHONE){ // the station under the reading line; the last quarter screen before the next one blends into it
    const y = scrollY + OFF, n = tops.length; if (!n || y <= tops[0][0]) return 0; let i = 0; while (i + 1 < n && tops[i + 1][0] <= y) i++;
    if (i + 1 >= n) return i; const T = vh * .25, d = tops[i + 1][0] - y; return d < T ? i + 1 - d / T : i; }
  const y = scrollY, n = tops.length;
  if (!n || y <= tops[0][0]) return 0;
  for (let i = 0; i < n; i++){
    const a = tops[i][0], b = Math.max(a, tops[i][1] - vh);
    if (y < a) continue;
    if (y <= b) return i;
    if (i + 1 >= n) return i;
    const na = tops[i + 1][0];
    if (y < na) return i + (y - b) / Math.max(1, na - b);
  }
  return n - 1;
}

/* ================= small components ================= */
const segs = [];
function segmented(root, cb){ // a "selected" copy of the labels is clipped to the active segment, so colour and position change together
  const btns = $$(':scope > button', root), hi = document.createElement('div');
  hi.className = 'seg-hi'; hi.setAttribute('aria-hidden', 'true'); hi.innerHTML = btns.map(b => `<span>${b.innerHTML}</span>`).join(''); root.appendChild(hi);
  const api = { i: btns.findIndex(b => b.getAttribute('aria-pressed') === 'true'), btns,
    place(instant){ const b = btns[api.i]; if (instant) hi.style.transition = 'none';
      if (!b) hi.style.clipPath = 'inset(0 50% 0 50% round 999px)';
      else { const t = b.offsetTop, l = b.offsetLeft; hi.style.clipPath = `inset(${t}px ${root.clientWidth - l - b.offsetWidth}px ${root.clientHeight - t - b.offsetHeight}px ${l}px round 999px)`; }
      if (instant){ void hi.offsetWidth; hi.style.transition = ''; } },
    set(i, instant){ api.i = i; btns.forEach((b, j) => b.setAttribute('aria-pressed', j === i)); api.place(instant); } };
  root.addEventListener('click', e => { const b = e.target.closest('button'); if (!b || b.parentNode !== root) return; const i = btns.indexOf(b); api.set(i, e.detail === 0); cb(i, e); });
  segs.push(api); return api;
}
const toggle = (id, fn) => $(id).addEventListener('click', e => { const on = e.currentTarget.getAttribute('aria-pressed') !== 'true'; e.currentTarget.setAttribute('aria-pressed', on); fn(on); });
function fit(cv){ const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); cv.width = Math.max(1, Math.round(r.width * d)); cv.height = Math.max(1, Math.round(r.height * d)); return { w: r.width, h: r.height, d }; }
function chip(c, x, y, ch, color, r = 11){ c.beginPath(); c.arc(x, y, r, 0, 7); c.fillStyle = color; c.fill(); c.fillStyle = '#000'; c.font = `700 ${Math.round(r * 1.2)}px ${UI}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.direction = 'ltr'; c.fillText(ch, x, y + .5); }
function head(c, x0, y0, x1, y1, s, color){ const a = Math.atan2(y1 - y0, x1 - x0); c.beginPath(); c.moveTo(x1 + Math.cos(a) * s * .7, y1 + Math.sin(a) * s * .7); c.lineTo(x1 + Math.cos(a + 2.45) * s, y1 + Math.sin(a + 2.45) * s); c.lineTo(x1 + Math.cos(a - 2.45) * s, y1 + Math.sin(a - 2.45) * s); c.closePath(); c.fillStyle = color; c.fill(); }
function seg2(c, x0, y0, x1, y1){ c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }

/* strip chart: the last few seconds of one or more signals */
class Strip {
  constructor(cv, o){
    this.cv = cv; this.o = o; this.c = cv.getContext('2d'); this.rate = o.rate || 60; this.n = Math.round(o.win * this.rate);
    this.buf = o.series.map(() => new Float32Array(this.n).fill(NaN)); this.h = 0; this.hover = null; this.tip = cv.parentElement.querySelector('.tip');
    cv.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); this.hover = e.clientX - r.left; });
    cv.addEventListener('pointerleave', () => { this.hover = null; if (this.tip) this.tip.hidden = true; });
    this.resize();
  }
  resize(){ const f = fit(this.cv); this.w = f.w; this.hh = f.h; this.d = f.d; }
  push(v){ for (let i = 0; i < v.length; i++) this.buf[i][this.h] = v[i]; this.h = (this.h + 1) % this.n; }
  clear(){ this.buf.forEach(b => b.fill(NaN)); }
  draw(){
    const { c, o, n } = this, W = this.w, H = this.hh; if (W < 20) return;
    c.setTransform(this.d, 0, 0, this.d, 0, 0); c.clearRect(0, 0, W, H);
    const fs = clamp(REM * .78, 11, 16), L = fs * 3, Rm = 6, Tm = 8, B = fs + 10, pw = W - L - Rm, ph = H - Tm - B, y0 = o.yMin, y1 = o.yMax;
    const Y = v => Tm + (1 - (v - y0) / (y1 - y0)) * ph, X = i => L + i / (n - 1) * pw;
    c.font = `${fs}px ${MONO}`; c.lineWidth = 1; c.textBaseline = 'middle'; c.textAlign = 'right'; c.direction = 'ltr';
    for (let t = y0; t <= y1 + 1e-6; t += o.step){ const y = Math.round(Y(t)) + .5; c.strokeStyle = Math.abs(t) < 1e-6 ? 'rgba(255,255,255,.24)' : 'rgba(255,255,255,.09)'; seg2(c, L, y, W - Rm, y); c.fillStyle = L2; c.fillText(show(t, 0) + (o.unit || ''), L - 7, y); }
    c.textBaseline = 'alphabetic';
    for (let s = 0; s <= o.win; s += 4){ const x = L + pw * (1 - s / o.win); c.textAlign = s === 0 ? 'right' : 'center'; c.fillStyle = L2; c.fillText(s === 0 ? 'עכשיו' : `−${s}s`, x, H - 4); }
    c.save(); c.beginPath(); c.rect(L, Tm - 2, pw + 2, ph + 4); c.clip(); c.lineJoin = 'round';
    o.series.forEach((s, k) => { const b = this.buf[k]; c.strokeStyle = s.c; c.lineWidth = s.w || 2; c.setLineDash(s.dash || []); c.beginPath(); let pen = false;
      for (let i = 0; i < n; i++){ const v = b[(this.h + i) % n]; if (v !== v){ pen = false; continue; } const x = X(i), y = Y(clamp(v, y0 - (y1 - y0), y1 + (y1 - y0))); if (pen) c.lineTo(x, y); else { c.moveTo(x, y); pen = true; } }
      if (s.glow){ for (const [k, a] of [[5, .06], [3.2, .09], [2, .12]]){ c.globalAlpha = a; c.lineWidth = (s.w || 2) * k; c.stroke(); } c.globalAlpha = 1; c.lineWidth = s.w || 2; }
      c.stroke(); });
    c.setLineDash([]); c.restore();
    if (this.hover !== null && this.tip){
      const i = Math.round(clamp((this.hover - L) / pw, 0, 1) * (n - 1)), x = X(i); c.strokeStyle = 'rgba(255,255,255,.4)'; seg2(c, x, Tm, x, Tm + ph);
      const parts = []; o.series.forEach((s, k) => { const v = this.buf[k][(this.h + i) % n]; if (v === v) parts.push(`${s.label} ${show(v, 1)}${o.unit || ''}`); });
      this.tip.hidden = !parts.length; this.tip.textContent = `−${fmt((n - 1 - i) / this.rate, 1)}s · ` + parts.join(' · '); this.tip.style.left = clamp(x - 60, 0, Math.max(0, W - 250)) + 'px';
    }
  }
}

/* ================= sims ================= */
let stage = null;
function advance(sim, dt){ sim.acc += dt; let n = 0; while (sim.acc >= DT && n < 14){ sim.step(); sim.acc -= DT; n++; } if (n === 14) sim.acc = 0; }

/* --- station 1: the challenge --- */
const ch = { acc: 0, k: 0, s: makePlant(0), c: makePID(), par: { ...BASE }, g: { kp: 3, ki: 5, kd: .5 }, mode: 'pid', input: 0, u: 0, tAir: 0, best: 0, tGust: 1.2, tFall: 0, rnd: mulberry32(5),
  step(){
    this.k++; let kick = 0; this.tGust -= DT;
    if (this.tGust <= 0 && this.mode !== 'fallen'){ this.tGust = 1.3 + this.rnd() * 1.5; const sg = this.rnd() < .5 ? -1 : 1; kick = sg * (70 + this.rnd() * 60); if (stage) stage.gust(sg); }
    if (this.mode === 'manual'){ this.u = this.input * 35; this.tAir += DT; }
    else if (this.mode === 'fallen'){ this.u = 0; this.tFall -= DT; if (this.tFall <= 0) this.set('pid'); }
    else this.u = pidStep(this.c, this.g, 0, this.s.th, DT).u;
    stepPlant(this.s, this.u, this.par, DT, kick);
    if (this.mode === 'manual' && this.s.hit){ this.best = Math.max(this.best, this.tAir); this.tFall = 1.6; this.set('fallen'); if (stage && stage.bump) stage.bump(Math.sign(this.s.th) || 1); }
  },
  set(m){
    this.mode = m; const go = $('#chGo'), say = $('#chSay');
    if (m === 'manual'){ this.tAir = 0; this.c = makePID(); go.textContent = 'תנו לבקר'; say.innerHTML = '<b>אתם על ההגה.</b> גררו ימינה ושמאלה, או החזיקו את מקשי החצים.'; }
    else if (m === 'fallen'){ go.textContent = 'אני מחזיק/ה'; say.innerHTML = `<b>נפל אחרי <span class="num">${fmt(this.tAir)}</span> שניות.</b> הבקר חוזר לתפקיד.`; }
    else { this.c = makePID(); go.textContent = 'אני מחזיק/ה'; if (this.tAir === 0) say.textContent = 'כרגע בקר PID מחזיק אותו ישר, גם כשהרוח מכה.'; else say.innerHTML = `<b>הבקר מחזיק.</b> הוא מודד ומתקן 240 פעמים בשנייה. אתם החזקתם <span class="num">${fmt(this.tAir)}</span> שניות.`; }
  },
  paint(){ $('#chT').textContent = fmt(this.tAir); $('#chBest').textContent = fmt(this.best); },
};
{
  const pad = $('#pad'), knob = $('#knob'); let drag = false;
  const setIn = v => { ch.input = clamp(v, -1, 1); const half = pad.clientWidth / 2 - knob.offsetWidth / 2 - 4; knob.style.transform = `translateX(${fmt(ch.input * half)}px)`; pad.setAttribute('aria-valuenow', Math.round(ch.input * 100)); };
  const fromEv = e => { const r = pad.getBoundingClientRect(); setIn((e.clientX - (r.left + r.width / 2)) / (r.width / 2 - 30)); };
  pad.addEventListener('pointerdown', e => { if (drag) return; drag = true; pad.setPointerCapture(e.pointerId); pad.classList.add('drag'); if (ch.mode !== 'manual') ch.set('manual'); fromEv(e); });
  pad.addEventListener('pointermove', e => { if (drag) fromEv(e); });
  const end = () => { if (!drag) return; drag = false; pad.classList.remove('drag'); setIn(0); };
  pad.addEventListener('pointerup', end); pad.addEventListener('pointercancel', end);
  pad.addEventListener('keydown', e => { if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return; e.preventDefault(); pad.classList.add('drag'); if (ch.mode !== 'manual') ch.set('manual'); setIn(e.key === 'ArrowRight' ? 1 : -1); });
  pad.addEventListener('keyup', e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight'){ setIn(0); pad.classList.remove('drag'); } });
  $('#chGo').addEventListener('click', () => { if (ch.mode === 'manual') ch.set('pid'); else { ch.set('manual'); pad.focus({ preventScroll: true }); } });
}

/* --- station 2: one lap of the loop, in slow motion --- */
// seconds on screen per step, and how much real time the "correct" step covers. One lap takes 6.4 seconds: long enough to
// read each number and watch the signal travel before the next step begins
const LP_D = [1.9, 1.9, 2.6], LP_CHUNK = .08;
const lpBars = $$('#steps li').map(li => { const b = document.createElement('i'); b.className = 'pg'; b.setAttribute('aria-hidden', 'true'); li.appendChild(b); return b; }); // how far along the current step is
const lp = { s: makePlant(0), c: makePID(), g: { kp: 3, ki: 0, kd: .5 }, real: false, phase: 0, tp: 0, lap: 0, meas: 0, from: 0, e: 0, u: 0, uNow: 0, acc: 0, tGust: 0, sg: 1, cycles: 0, hit: 0,
  ctl(){ this.uNow = pidStep(this.c, this.g, 0, this.s.th, DT).u; return this.uNow; },
  run(t){ this.acc += t; let n = 0; while (this.acc >= DT && n < 30){ stepPlant(this.s, this.ctl(), BASE, DT); this.acc -= DT; n++; } },
  gust(){ this.sg *= -1; stepPlant(this.s, this.uNow, BASE, DT, 150 * this.sg); for (let i = 0; i < 12; i++) stepPlant(this.s, this.ctl(), BASE, DT); if (stage) stage.gust(this.sg); this.lap = 0; this.hit = Math.abs(this.s.th); },
  tick(dt){
    if (this.real){ this.tGust -= dt; if (this.tGust <= 0){ this.tGust = 1.8; this.gust(); } this.run(dt); this.cycles += dt * 240; this.meas = this.s.th; this.e = -this.s.th; this.u = this.uNow; return; }
    this.tp += dt; const D = LP_D[this.phase];
    if (this.phase === 2 && this.tp > D * .3) this.run(dt * LP_CHUNK / (D * .7)); // the motors act once the command has reached them
    if (this.tp < D) return;
    this.tp = 0; this.phase = (this.phase + 1) % 3;
    if (this.phase === 0){ if (Math.abs(this.s.th) < .6) this.gust(); else this.lap++; this.from = this.meas; this.meas = this.s.th; this.text(); }
    else if (this.phase === 1){ this.e = -this.meas; this.u = this.ctl(); }
  },
  text(){
    const say = $('#lpSay');
    if (this.real) say.innerHTML = '<b>במהירות אמיתית</b> אי אפשר לראות את הצעדים. משב הרוח נבלם לפני שהעין קולטת אותו.';
    else if (!this.lap) say.innerHTML = `<b>משב רוח</b> הטה את הרחפן ב-<span class="num">${fmt(this.hit)}°</span>. עכשיו הלולאה מתחילה לעבוד.`;
    else if (Math.abs(this.meas) > Math.abs(this.from) + .04) say.innerHTML = `<b>סיבוב ${this.lap + 1}:</b> השגיאה עוד גדלה, מ-<span class="num">${fmt(Math.abs(this.from))}°</span> ל-<span class="num">${fmt(Math.abs(this.meas))}°</span>. התנופה של המשב עדיין דוחפת, והתיקון רק מתחיל לבלום אותה.`;
    else say.innerHTML = `<b>סיבוב ${this.lap + 1}:</b> השגיאה ירדה מ-<span class="num">${fmt(Math.abs(this.from))}°</span> ל-<span class="num">${fmt(Math.abs(this.meas))}°</span>.`;
  },
  hot(i){ return this.real ? 1 : (i === this.phase ? 1 : 0); },
  paint(){
    $$('#steps li').forEach((li, i) => li.classList.toggle('on', this.real || i === this.phase));
    lpBars.forEach((b, i) => { b.style.transform = `scaleX(${!this.real && i === this.phase ? fmt(clamp(this.tp / LP_D[i], 0, 1), 3) : 0})`; });
    const u = this.real || this.phase === 2 ? this.uNow : this.u;
    $('#lpA').textContent = show(this.meas) + '°'; $('#lpB').textContent = 'e = ' + show(this.e) + '°'; $('#lpC').textContent = `${Math.round(50 + u / 2)}% · ${Math.round(50 - u / 2)}%`;
    if (this.real) $('#lpLead').textContent = `מאז שעברתם למהירות אמיתית הבקר השלים ${big(this.cycles)} סיבובים.`;
  },
};
const lpSeg = segmented($('#lpSeg'), i => { lp.real = i === 1; lp.cycles = 0; lp.tGust = .9; lp.phase = 0; lp.tp = 0; if (!lp.real) $('#lpLead').textContent = 'הבקר חוזר על שלושת הצעדים האלה 240 פעמים בשנייה. כאן הם בהילוך איטי.'; lp.text(); });
$('#lpGust').addEventListener('click', () => { lp.gust(); lp.phase = 0; lp.tp = 0; lp.from = lp.meas; lp.meas = lp.s.th; lp.tGust = 1.8; lp.text(); });

/* --- station 3: the PID lab --- */
const PRESETS = {
  p:    { g: [2, 0, 0],    load: false, say: '<b>רק P:</b> מתקן לפי הפער של עכשיו. הוא חוצה את היעד, חוזר, ושוב. אין מה שיבלום את התנופה, אז הוא לא נרגע.' },
  pd:   { g: [3, 0, .45],  load: false, say: '<b>הוספנו D:</b> הוא מסתכל לאן הזווית הולכת ובולם מראש. הרחפן נרגע מהר, אבל עוצר קצת יותר ממעלה אחרי היעד ונשאר שם.' },
  load: { g: [3, 0, .45],  load: true,  say: '<b>מטען בצד אחד:</b> הפער גדל לכ-4.5°. כדי להחזיק נגד המטען צריך כוח קבוע, ו-P נותן כוח רק כשיש שגיאה.' },
  pid:  { g: [3, 5, .5],   load: true,  say: '<b>הוספנו I:</b> הוא צובר את השטח שבין היעד לזווית ודוחף עד שהפער נעלם. המחיר: חריגה גדולה יותר בדרך.' },
  wild: { g: [7, 0, .05],  load: false, say: '<b>יותר מדי P:</b> המנועים מגיעים לרוויה והרחפן מיטלטל מצד לצד. תיקון חזק מדי גרוע כמו תיקון חלש מדי.' },
};
const lab = { acc: 0, k: 0, s: makePlant(0), c: makePID(), par: { ...BASE, d: 0 }, g: { kp: 2, ki: 0, kd: 0 }, sp: 15, spNext: null, tStep: 0, noise: false, rnd: mulberry32(9), kick: 0, gs: 1,
  out: { u: 0, P: 0, I: 0, D: 0, e: 0, sat: false }, sat: 0,
  step(){
    this.k++;
    if (this.spNext !== null){ this.tStep -= DT; if (this.tStep <= 0){ this.sp = this.spNext; this.spNext = null; } }
    const y = this.s.th + (this.noise ? .3 * gauss(this.rnd) : 0);
    this.out = pidStep(this.c, this.g, this.sp, y, DT);
    stepPlant(this.s, this.out.u, this.par, DT, this.kick); this.kick = 0;
    this.sat += ((Math.abs(this.out.P + this.out.I + this.out.D) > 100 ? 1 : 0) - this.sat) * DT / .12;
    if (this.k % 4 === 0) labPlot.push(this.sp, this.s.th);
  },
  restart(){ this.s = makePlant(0); this.c = makePID(); this.sp = 0; this.spNext = 15; this.tStep = .45; this.sat = 0; labPlot.clear(); $('#spB').setAttribute('aria-pressed', 'true'); },
  paint(){
    const o = this.out, g = this.g;
    $('#vP').textContent = g.kp ? pct(o.P) : 'כבוי'; $('#vI').textContent = g.ki ? pct(o.I) : 'כבוי'; $('#vD').textContent = g.kd ? pct(o.D) : 'כבוי';
    $('#tmP').classList.toggle('off', !g.kp); $('#tmI').classList.toggle('off', !g.ki); $('#tmD').classList.toggle('off', !g.kd);
    labPlot.draw();
  },
};
// the lab's chart puts "now" near the right edge and leaves room for the future, so each term can be drawn where it gets its information
const labPlot = { cv: $('#labChart'), n: 360, sp: new Float32Array(360).fill(NaN), th: new Float32Array(360).fill(NaN), h: 0, w: 0, hh: 0, d: 1,
  resize(){ const f = fit(this.cv); this.w = f.w; this.hh = f.h; this.d = f.d; },
  push(sp, th){ this.sp[this.h] = sp; this.th[this.h] = th; this.h = (this.h + 1) % this.n; },
  clear(){ this.sp.fill(NaN); this.th.fill(NaN); },
  draw(){
    const c = this.cv.getContext('2d'), W = this.w, H = this.hh; if (W < 40) return;
    c.setTransform(this.d, 0, 0, this.d, 0, 0); c.clearRect(0, 0, W, H);
    const fs = clamp(REM * .78, 11, 16), L = fs * 3, Rm = 4, Tm = fs * 1.7, B = fs * 1.8, pw = W - L - Rm, ph = H - Tm - B, PAST = 6, FUT = 1.35, y0 = -10, y1 = 35, n = this.n, last = n - 1;
    const X = t => L + (t + PAST) / (PAST + FUT) * pw, Y = v => Tm + (1 - (v - y0) / (y1 - y0)) * ph, xn = X(0), T = i => -(last - i) / 60, at = (b, i) => b[(this.h + i) % n];
    const spN = at(this.sp, last), thN = at(this.th, last), g = lab.g, live = thN === thN;
    { const fg = c.createLinearGradient(xn, 0, W - Rm, 0); fg.addColorStop(0, 'rgba(255,255,255,.1)'); fg.addColorStop(1, 'rgba(255,255,255,.015)'); c.fillStyle = fg; c.fillRect(xn, Tm, W - Rm - xn, ph); }
    c.font = `${fs}px ${MONO}`; c.lineWidth = 1; c.textBaseline = 'middle'; c.textAlign = 'right'; c.direction = 'ltr';
    for (let v = -10; v <= 30; v += 10){ const y = Math.round(Y(v)) + .5; c.strokeStyle = v === 0 ? 'rgba(255,255,255,.24)' : 'rgba(255,255,255,.09)'; seg2(c, L, y, W - Rm, y); c.fillStyle = L2; c.fillText(show(v, 0) + '°', L - 7, y); }
    c.save(); c.beginPath(); c.rect(L, Tm, pw, ph); c.clip(); c.lineJoin = 'round'; c.lineCap = 'round';
    let first = -1; for (let i = 0; i < n; i++) if (at(this.th, i) === at(this.th, i)){ first = i; break; }
    if (first >= 0){
      if (g.ki > 0){ c.beginPath(); for (let i = first; i <= last; i++){ const x = X(T(i)), y = Y(at(this.th, i)); if (i === first) c.moveTo(x, y); else c.lineTo(x, y); } for (let i = last; i >= first; i--) c.lineTo(X(T(i)), Y(at(this.sp, i))); c.closePath(); c.fillStyle = 'rgba(179,143,24,.42)'; c.fill(); }
      c.strokeStyle = L2; c.lineWidth = 1.5; c.setLineDash([6, 5]); c.beginPath(); for (let i = first; i <= last; i++){ const x = X(T(i)), y = Y(at(this.sp, i)); if (i === first) c.moveTo(x, y); else c.lineTo(x, y); } c.lineTo(X(FUT), Y(spN)); c.stroke(); c.setLineDash([]);
      c.beginPath(); for (let i = first; i <= last; i++){ const x = X(T(i)), y = Y(clamp(at(this.th, i), y0 - 20, y1 + 20)); if (i === first) c.moveTo(x, y); else c.lineTo(x, y); }
      for (const [w, a] of [[15, .035], [10, .05], [6, .07]]){ c.strokeStyle = `rgba(245,245,247,${a})`; c.lineWidth = w; c.stroke(); } c.strokeStyle = LABEL; c.lineWidth = 2.5; c.stroke();
    }
    let dEnd = null;
    if (live && g.kd > 0){ const sl = lab.c.dF; let t1 = FUT * .8; if (sl > 0) t1 = Math.min(t1, (y1 - 1 - thN) / sl); else if (sl < 0) t1 = Math.min(t1, (y0 + 1 - thN) / sl); t1 = Math.max(.04, t1);
      dEnd = [X(t1), Y(thN + sl * t1)]; c.strokeStyle = CD; c.lineWidth = 3; c.setLineDash([7, 6]); seg2(c, xn, Y(thN), dEnd[0], dEnd[1]); c.setLineDash([]); head(c, xn, Y(thN), dEnd[0], dEnd[1], 9, CD); }
    if (live && g.kp > 0){ c.strokeStyle = CP; c.lineWidth = 6; seg2(c, xn, Y(clamp(thN, y0, y1)), xn, Y(spN)); }
    c.restore();
    c.strokeStyle = 'rgba(255,255,255,.38)'; c.lineWidth = 1; seg2(c, Math.round(xn) + .5, Tm, Math.round(xn) + .5, Tm + ph);
    if (live){ for (const [r, a] of [[13, .06], [9.5, .09], [7, .12]]){ c.fillStyle = `rgba(245,245,247,${a})`; c.beginPath(); c.arc(xn, Y(clamp(thN, y0, y1)), r, 0, 7); c.fill(); } c.fillStyle = LABEL; c.beginPath(); c.arc(xn, Y(clamp(thN, y0, y1)), 4.5, 0, 7); c.fill();
      if (g.kp > 0) chip(c, xn - 17, (Y(clamp(thN, y0, y1)) + Y(spN)) / 2, 'P', CP, 10);
      if (g.ki > 0 && first >= 0){ const i = Math.max(first, last - 150); chip(c, X(T(i)), clamp((Y(at(this.th, i)) + Y(at(this.sp, i))) / 2, Tm + 12, Tm + ph - 12), 'I', CI, 10); }
      if (dEnd) chip(c, clamp(dEnd[0] + 4, xn + 14, W - Rm - 11), clamp(dEnd[1] - 16, Tm + 11, Tm + ph - 11), 'D', CD, 10); }
    c.font = `600 ${fs * 1.1}px ${UI}`; c.textBaseline = 'alphabetic'; c.direction = 'rtl'; c.fillStyle = L2;
    c.textAlign = 'left'; c.fillText('עבר', L + 6, Tm - 6); c.textAlign = 'center'; c.fillText('עכשיו', xn, Tm - 6); c.fillText('עתיד', (xn + W - Rm) / 2 + 8, H - 5);
    c.font = `${fs}px ${MONO}`; c.direction = 'ltr'; c.textAlign = 'center'; for (const s of [6, 4, 2]) c.fillText(`−${s}s`, Math.max(X(-s), L + fs * 1.2), H - 5);
  } };
const sliders = { kp: [$('#kp'), $('#kpO'), 1], ki: [$('#ki'), $('#kiO'), 1], kd: [$('#kd'), $('#kdO'), 2] };
function syncSlider(el, out, dec){ const v = +el.value; out.textContent = fmt(v, dec); el.style.setProperty('--pct', ((v - el.min) / (el.max - el.min) * 100) + '%'); }
for (const k in sliders){ const [el, out, dec] = sliders[k]; el.addEventListener('input', () => { lab.g[k] = +el.value; syncSlider(el, out, dec); presetSeg.set(-1); $('#labSay').innerHTML = '<b>כוונון ידני:</b> הזיזו מחוון אחד בכל פעם, ולחצו ״משב רוח״ כדי לראות איך כל איבר מגיב.'; }); }
function setGains(g){ ['kp', 'ki', 'kd'].forEach((k, i) => { lab.g[k] = g[i]; const [el, out, dec] = sliders[k]; el.value = g[i]; syncSlider(el, out, dec); }); }
function setLoad(on){ lab.par.d = on ? 220 : 0; $('#loadB').setAttribute('aria-pressed', on); }
const PNAMES = Object.keys(PRESETS);
function applyPreset(name){ const p = PRESETS[name]; setGains(p.g); setLoad(p.load); lab.noise = false; $('#noiseB').setAttribute('aria-pressed', 'false'); $('#labSay').innerHTML = p.say; lab.restart(); }
const presetSeg = segmented($('#presets'), i => applyPreset(PNAMES[i]));
$('#gustB').addEventListener('click', () => { lab.gs *= -1; lab.kick = 150 * lab.gs; if (stage) stage.gust(lab.gs); });
toggle('#spB', on => { lab.spNext = null; lab.sp = on ? 15 : 0; });
toggle('#loadB', on => setLoad(on));
toggle('#noiseB', on => { lab.noise = on; if (on) $('#labSay').innerHTML = '<b>רעש בחיישן:</b> הביטו בחץ הוורוד. נגזרת מגדילה כל קפיצה קטנה במדידה, והמנועים רועדים. לכן מסננים את D, או מוותרים עליו.'; });
const tune = $('#tune'), tuneB = $('#tuneB');
const byKey = e => viaKey || !!(e && e.detail === 0);
function popSet(el, on, e){ const now = byKey(e); if (now) el.style.transition = 'none'; el.classList.toggle('on', on); if (now){ void el.offsetWidth; el.style.transition = ''; } }
function popFrom(el, btn){ const b = btn.getBoundingClientRect(), p = el.getBoundingClientRect(); el.style.transformOrigin = `${fmt(b.left + b.width / 2 - p.left)}px ${fmt(b.top + b.height / 2 - p.top)}px`; }
function setTune(on, e){ if (on){ const b = tuneB.getBoundingClientRect(), p = tune.getBoundingClientRect(); tune.style.transformOrigin = `${fmt(b.left + b.width / 2 - p.left)}px 100%`; } popSet(tune, on, e); tuneB.setAttribute('aria-expanded', on); }
tuneB.addEventListener('click', e => setTune(!tune.classList.contains('on'), e));
addEventListener('pointerdown', e => { if (tune.classList.contains('on') && !tune.contains(e.target) && !tuneB.contains(e.target)) setTune(false); });

/* --- station 4: fixed gains vs a single neuron that retunes them in flight --- */
const G0 = { kp: 3, ki: 0, kd: .45 };
const adChart = new Strip($('#adChart'), { win: 12, yMin: -5, yMax: 25, step: 10, unit: '°', series: [{ c: L2, dash: [6, 5], w: 1.5, label: 'יעד' }, { c: L2, w: 1.5, label: 'קבוע' }, { c: CAI, w: 3, label: 'לומד', glow: true }] });
const GN = gsBest(0, 1); // the gains an engineer would pick for a full battery and no load
const ad = { acc: 0, k: 0, t: 0, r: 0, sa: makePlant(0), sb: makePlant(0), pid: makePID(), pidB: makePID(), nn: makeNeuron(G0), par: { ...BASE }, ua: 0, ub: 0, ea: 0, eb: 0, last: '', mode: 'pre', rate: 1, gB: { ...GN },
  step(){
    this.k++; this.t += DT; const tgt = (this.t % 4) < 2 ? 15 : 0; this.r += (tgt - this.r) * DT / .15;
    const pre = this.mode === 'pre', a = pidStep(this.pid, pre ? GN : G0, this.r, this.sa.th, DT); stepPlant(this.sa, a.u, this.par, DT);
    const b = pre ? pidStep(this.pidB, this.gB, this.r, this.sb.th, DT) : neuronStep(this.nn, { p: .05 * this.rate, i: 1.5 * this.rate, d: .001 * this.rate }, this.r, this.sb.th, DT); stepPlant(this.sb, b.u, this.par, DT);
    this.ua = a.u; this.ub = b.u; const al = DT / 3;
    this.ea += ((this.r - this.sa.th) ** 2 - this.ea) * al; this.eb += ((this.r - this.sb.th) ** 2 - this.eb) * al;
    if (this.k % 4 === 0) adChart.push([this.r, this.sa.th, this.sb.th]);
  },
  reset(){ this.sa = makePlant(0); this.sb = makePlant(0); this.pid = makePID(); this.pidB = makePID(); this.nn = makeNeuron(G0); this.t = 0; this.r = 0; this.ea = this.eb = 0; adChart.clear(); },
  paint(){
    this.gB = gs.gains(); if (this.mode === 'pre'){ gs.ui(); gs.paint(); return; }
    const n = this.nn;
    $('#wP').setAttribute('stroke-width', fmt(clamp(1 + n.kp * .55, 1, 11), 2)); $('#wI').setAttribute('stroke-width', fmt(clamp(1 + n.ki * 1.1, 1, 11), 2)); $('#wD').setAttribute('stroke-width', fmt(clamp(1 + n.kd * 6, 1, 11), 2));
    $('#tP').textContent = 'Kp ' + fmt(n.kp, 1); $('#tI').textContent = 'Ki ' + fmt(n.ki, 1); $('#tD').textContent = 'Kd ' + fmt(n.kd, 2);
    const load = this.par.d > 0, batt = this.par.eff < 1, key = (load ? 'L' : '') + (batt ? 'B' : '') + fmt(n.kp, 1) + fmt(n.ki, 1);
    if (key !== this.last){ this.last = key; const say = $('#adSay');
      if (load && batt) say.innerHTML = `<b>מטען וסוללה חלשה יחד:</b> הנוירון כבר הגיע ל-<span class="num">Kp ${fmt(n.kp, 1)}</span> ו-<span class="num">Ki ${fmt(n.ki, 1)}</span>. המקדמים הקבועים נשארו כמו שכווננו בבוקר.`;
      else if (load) say.innerHTML = `<b>מטען בצד:</b> הרחפן הקבוע נשאר רחוק מהיעד. הנוירון מגדיל את <span class="num">Ki</span> מאפס ל-<span class="num">${fmt(n.ki, 1)}</span> וסוגר את הפער.`;
      else if (batt) say.innerHTML = `<b>סוללה חלשה:</b> המנועים נותנים 55% מהכוח. הנוירון מעלה את <span class="num">Kp</span> ל-<span class="num">${fmt(n.kp, 1)}</span> כדי לפצות.`;
      else say.innerHTML = '<b>בלי הפרעה</b> שניהם עוקבים אחרי היעד. לחצו ״מטען בצד״ וחכו כמה שניות.'; }
    adChart.draw();
  },
};
toggle('#adLoad', on => { ad.par.d = on ? 400 : 0; gs.ui(); });
toggle('#adBatt', on => { ad.par.eff = on ? .55 : 1; gs.ui(); });
toggle('#adFast', on => { ad.rate = on ? 8 : 1; });
$('#adReset').addEventListener('click', () => { ad.reset(); if (ad.mode === 'pre') gs.reset(); });
const gvSeg = segmented($('#gvSeg'), i => { $('#gvLead').textContent = i ? 'גישה אחרת, בלי אימון מראש: המקדמים הם שלושת המשקלים של נוירון אחד, והוא מעדכן אותם תוך כדי טיסה.' : 'PID שכוונן לסוללה מלאה מתקשה כשהתנאים משתנים. רשת קטנה לומדת איזה מקדמים מתאימים לכל מצב.'; ad.mode = i ? 'online' : 'pre'; $('#gv0').hidden = !!i; $('#gv1').hidden = !i; $('#gsGo').hidden = !!i; $('#adFast').hidden = !i; ad.reset(); ad.last = ''; resizeAll(); });

/* --- station 4, first view: collect examples in the simulator, then train a small network on them by gradient descent --- */
const GS_N = GS_D.length * GS_E.length, GS_EP = 1500;
const gs = { state: 'idle', X: [], Y: [], T: [], i: 0, acc: 0, net: gsNet(), ep: 0, f: null, last: '',
  reset(){ Object.assign(this, { state: 'idle', X: [], Y: [], T: [], i: 0, acc: 0, net: gsNet(), ep: 0 }); this.ui(); },
  go(){ if (this.state === 'idle'){ this.state = 'data'; this.acc = 0; } else if (this.state === 'ready'){ this.state = 'train'; this.acc = 0; } this.ui(); },
  tick(dt){
    if (this.state === 'data'){ this.acc += dt;
      while (this.acc >= .07 && this.i < GS_N){ this.acc -= .07; const d = GS_D[this.i % GS_D.length], e = GS_E[Math.floor(this.i / GS_D.length)], g = gsBest(d, e); this.T.push(g); this.X.push(gsIn(d, e)); this.Y.push([g.kp / GS_MAX.kp, g.ki / GS_MAX.ki, g.kd / GS_MAX.kd]); this.i++; }
      if (this.i >= GS_N){ this.state = 'train'; this.acc = 0; } this.ui(); }
    else if (this.state === 'train'){ this.acc += dt * 330; let n = 0;
      while (this.acc >= 1 && this.ep < GS_EP && n < 40){ this.acc -= 1; gsEpoch(this.net, this.X, this.Y); this.ep++; n++; }
      if (this.ep >= GS_EP){ this.state = 'done'; if (stage && stage.pulse) stage.pulse(1, 0x34c26b); } this.ui(); }
  },
  trained(){ return this.state === 'train' || this.state === 'done'; },
  gains(){ return this.trained() ? gsOut(gsFwd(this.net, gsIn(ad.par.d, ad.par.eff)).y) : { ...GN }; },
  ui(){
    const st = this.state, idx = { idle: -1, data: 0, ready: 1, train: 1, done: 2 }[st], go = $('#gsGo');
    $$('#gsSteps li').forEach((li, j) => { li.classList.toggle('on', j === idx && st !== 'done' || (st === 'done' && j === 2)); li.classList.toggle('done', j < idx || (st === 'ready' && j === 0)); });
    go.textContent = { idle: 'אספו דוגמאות ואמנו', data: 'אוספים דוגמאות…', ready: 'אמנו את הרשת', train: 'מאמנים…', done: 'הרשת מאומנת' }[st];
    go.disabled = st === 'data' || st === 'train' || st === 'done'; go.classList.toggle('primary', st === 'idle' || st === 'ready'); go.classList.toggle('nudge', (st === 'idle' || st === 'ready') && (ad.par.d > 0 || ad.par.eff < 1));
    $('#gsO0').textContent = `${this.i} / ${GS_N}`;
    $('#gsO1').textContent = this.ep ? `${show(Math.sqrt(this.net.loss) * 100, 1)}%` : '–';
    const g = ad.gB, load = ad.par.d > 0, batt = ad.par.eff < 1;
    $('#gsO2').textContent = st === 'done' ? `Kp ${fmt(g.kp, 1)} · Ki ${fmt(g.ki, 1)} · Kd ${fmt(g.kd, 2)}` : '–';
    const key = st + (load ? 'L' : '') + (batt ? 'B' : ''); if (key === this.last) return; this.last = key; const say = $('#gsSay');
    const same = '<b>כרגע שני הרחפנים זהים:</b> הרשת עוד לא אומנה, אז היא נותנת בדיוק את המקדמים הקבועים, ושניהם סוטים באותה מידה. ';
    if (st === 'idle' && (load || batt)) say.innerHTML = same + 'לחצו ״אספו דוגמאות ואמנו״, ותוך כמה שניות ההבדל יופיע.';
    else if (st === 'idle') say.innerHTML = 'בשני הרחפנים אותו PID. לאחד מקדמים קבועים שכוונו לסוללה מלאה ובלי מטען. לשני הרשת תבחר מקדמים, אחרי שנאמן אותה.';
    else if (st === 'data') say.innerHTML = '<b>שלב 1, אוספים דוגמאות:</b> לכל שילוב של מטען וסוללה הסימולטור מנסה מקדמים שונים ושומר את הטובים. זו העבודה שמהנדס עושה ביד, מצב אחרי מצב.';
    else if (st === 'ready') say.innerHTML = `<b>${GS_N} דוגמאות מוכנות.</b> עכשיו רשת של 8 נוירונים ו-51 משקלים תלמד לחקות אותן.` + (load || batt ? ' עד אז שני הרחפנים עדיין זהים.' : '');
    else if (st === 'train') say.innerHTML = '<b>שלב 2, אימון:</b> בכל סבב הרשת מנחשת את כל התשובות, מחשבת כמה טעתה, ומזיזה כל משקל קצת בכיוון שמקטין את הטעות. זו ירידה בגרדיאנט, אותו עיקרון שמאמן גם רשתות ענק.';
    else if (!load && !batt) say.innerHTML = '<b>הרשת מאומנת.</b> בלי הפרעה שניהם טובים, כי המקדמים הקבועים כוונו בדיוק למצב הזה. עכשיו לחצו ״מטען בצד״.';
    else if (load && !batt) say.innerHTML = '<b>מטען בצד:</b> המקדמים הקבועים כוונו בלי מטען, אין להם איבר I, ולכן הרחפן הקבוע נשאר נטוי ולא מגיע ליעד. הרשת מזהה את המצב, מעלה את <span class="num">Ki</span> וסוגרת את הפער. עכשיו נסו גם ״סוללה חלשה״.';
    else if (!load && batt) say.innerHTML = '<b>סוללה חלשה:</b> המנועים נותנים רק 55% מהכוח. הרשת מעלה את <span class="num">Kp</span> ו-<span class="num">Kd</span> כדי לפצות. לבד זה עוד הבדל קטן, אבל נסו להוסיף ״מטען בצד״.';
    else say.innerHTML = '<b>מטען וסוללה חלשה יחד:</b> מצב שלא היה בדיוק בדוגמאות. הקבוע, שכוונן לבוקר עם סוללה מלאה, סוטה בכמה מעלות. הרשת משלימה בין הדוגמאות ומחזיקה אותו קרוב ליעד.';
  },
  resize(){ this.f = fit($('#gsMap')); },
  paint(){
    const f = this.f, cv = $('#gsMap'); if (!f || f.w < 60) return; const c = cv.getContext('2d'), W = f.w, H = f.h, nc = GS_D.length, nr = GS_E.length;
    c.setTransform(f.d, 0, 0, f.d, 0, 0); c.clearRect(0, 0, W, H);
    const fs = clamp(REM * .8, 11, 16), top = fs * 2, gap = fs * 1.2, cs = Math.min((W - 2 * gap) / 3 / nc, (H - top - 2) / nr), pw = cs * nc, x0 = (W - 3 * pw - 2 * gap) / 2;
    const keys = ['kp', 'ki', 'kd'], cols = [[35, 137, 226], [179, 143, 24], [212, 73, 150]], names = ['Kp', 'Ki', 'Kd'], live = this.trained(), cur = ad.gB;
    const pred = live ? this.X.map(x => gsOut(gsFwd(this.net, x).y)) : null;
    const rr = (x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
    keys.forEach((k, q) => {
      const px = x0 + q * (pw + gap), [R, G, B] = cols[q], fill = v => `rgba(${R},${G},${B},${fmt(.1 + .9 * clamp(v / GS_MAX[k], 0, 1), 3)})`;
      chip(c, px + fs * .7, fs * .8, names[q][1].toUpperCase(), `rgb(${R},${G},${B})`, fs * .7);
      c.font = `600 ${fs}px ${MONO}`; c.fillStyle = LABEL; c.textAlign = 'left'; c.textBaseline = 'middle'; c.direction = 'ltr'; c.fillText(names[q] + (this.state === 'done' ? ' ' + fmt(cur[k], k === 'kd' ? 2 : 1) : ''), px + fs * 1.7, fs * .8);
      for (let r = 0; r < nr; r++) for (let j = 0; j < nc; j++){
        const n = r * nc + j, x = px + j * cs, y = top + r * cs;
        rr(x + 1.5, y + 1.5, cs - 3, cs - 3, 3); c.fillStyle = n < this.i ? fill(this.T[n][k]) : 'rgba(120,120,128,.12)'; c.fill();
        if (pred){ c.beginPath(); c.arc(x + cs / 2, y + cs / 2, cs * .24, 0, 7); c.fillStyle = '#000'; c.fill(); c.beginPath(); c.arc(x + cs / 2, y + cs / 2, cs * .24, 0, 7); c.fillStyle = fill(pred[n][k]); c.fill(); }
      }
      const cx = px + (ad.par.d / 80 + .5) * cs, cy = top + ((1 - ad.par.eff) / .1 + .5) * cs; c.strokeStyle = LABEL; c.lineWidth = 1.5;
      seg2(c, cx - cs * .5, cy, cx - cs * .2, cy); seg2(c, cx + cs * .2, cy, cx + cs * .5, cy); seg2(c, cx, cy - cs * .5, cx, cy - cs * .2); seg2(c, cx, cy + cs * .2, cx, cy + cs * .5);
    });
  },
};
$('#gsGo').addEventListener('click', () => gs.go());

/* --- station 5: a field of drones learns by trial and error, all at once --- */
const SWN = 240, SWL = { cols: 15, rows: 16, dx: 2.3, dz: 2.5, s: .55 }; // narrow and deep, so the field stays left of the text
const swPos = (() => { const px = new Float32Array(SWN), pz = new Float32Array(SWN), slots = Array.from({ length: SWN }, (_, i) => i), rnd = mulberry32(11);
  for (let i = SWN - 1; i > 0; i--){ const j = Math.floor(rnd() * (i + 1)); [slots[i], slots[j]] = [slots[j], slots[i]]; }
  for (let a = 0; a < SWN; a++){ px[a] = (slots[a] % SWL.cols - SWL.cols / 2) * SWL.dx; pz[a] = (Math.floor(slots[a] / SWL.cols) - SWL.rows / 2) * SWL.dz; }
  return { px, pz }; })();
const sw = { pop: null, state: 'idle', acc: 0, tSel: 0, tDone: 99, par: { ...BASE }, kicks: new Float64Array(SWN), wave: null, waved: new Uint8Array(SWN), air: 0, lean: 0, wv: new Float32Array(NPAR), bars: null, net: null,
  init(){ this.pop = makePop(SWN, 1); this.pop.alpha = .1; this.pop.sigma = .15; for (let a = 0; a < SWN; a++) this.pop.th[a] = 0; this.state = 'idle'; this.acc = 0; this.par.d = 0; this.wave = null; this.air = 0; $('#swWind').setAttribute('aria-pressed', 'false'); this.ui(); },
  tick(dt){
    const p = this.pop;
    if (this.state === 'run'){
      this.acc += dt * 2; let n = 0;
      while (this.acc >= DT && n < 40){ this.acc -= DT; n++; if (popStep(p, BASE)){ popEnd(p); this.state = 'select'; this.tSel = .8; this.acc = 0; this.ui(); break; } }
      if (n === 40) this.acc = 0;
    } else if (this.state === 'select'){
      this.tSel -= dt;
      if (this.tSel <= 0){ const h = p.hist, g = h.length; if ((g >= 2 && h[g - 1] >= .99 && h[g - 2] >= .99) || g >= 24){ p.explore = false; popReset(p); this.state = 'done'; this.tDone = 0; } else { popReset(p); this.state = 'run'; } this.ui(); }
    } else if (this.state === 'done'){
      this.tDone += dt; this.acc += dt; let n = 0;
      while (this.acc >= DT && n < 14){ this.acc -= DT; n++; const K = this.kicks; K.fill(0);
        if (Math.random() < .12) K[Math.floor(Math.random() * SWN)] = (Math.random() < .5 ? -1 : 1) * (40 + Math.random() * 50);   // light, uneven air so the field never looks frozen
        if (this.wave){ const w = this.wave; w.x += 46 * DT; let left = 0; for (let a = 0; a < SWN; a++){ if (this.waved[a]) continue; if (swPos.px[a] < w.x){ K[a] = w.sg * (120 + Math.random() * 40); this.waved[a] = 1; } else left++; } if (!left) this.wave = null; }
        popStep(p, this.par, K, true); }
      if (n === 14) this.acc = 0;
    }
    let air = 0, lean = 0; for (let a = 0; a < SWN; a++){ air += p.alive[a]; lean += p.th[a]; } this.air = air / SWN; this.lean += (lean / SWN - this.lean) * Math.min(1, dt * 4);
  },
  gust(){ if (this.state !== 'done') return; this.waved.fill(0); this.wave = { x: -SWL.cols / 2 * SWL.dx - 3, sg: this.wave ? -this.wave.sg : 1 }; this.lastSg = -(this.lastSg || -1); this.wave.sg = this.lastSg; },
  ui(){
    const p = this.pop, go = $('#swGo'), done = this.state === 'done', idle = this.state === 'idle', hold = this.state === 'hold', say = $('#swSay'), g = p.hist.length;
    go.textContent = done ? 'האימון הסתיים' : hold ? 'המשיכו אימון' : idle ? 'התחילו אימון' : 'עצרו'; go.disabled = done; go.classList.toggle('primary', !done);
    $('#swGust').disabled = !done; $('#swWind').disabled = !done;
    if (done){ $('#cmpCr').textContent = big(p.crashes);
      if (this.par.d) say.innerHTML = '<b>רוח צד שלא הייתה באימון:</b> כל השדה נוטה ונשאר נטוי. לרשת אין זיכרון של שגיאה שנצברת. ל-PID יש את I בדיוק בשביל זה.';
      else say.innerHTML = `<b>כולם באוויר אחרי ${g} דורות</b> ו-<span class="num">${big(p.crashes)}</span> התרסקויות. על חומרה אמיתית אלה ${big(p.crashes)} רחפנים שבורים, ולכן מאמנים בסימולטור.`; }
    else if (idle) say.textContent = 'לפני האימון המשקלים אקראיים. הרשת לא מכירה פיזיקה ולא נוסחה: היא מקבלת זווית וקצב סיבוב, ומחזירה פקודה למנועים.';
    else say.innerHTML = `<b>דור ${Math.max(1, this.state === 'run' ? g + 1 : g)}:</b> כל רחפן מנסה גרסה קצת אחרת של המשקלים. אדום: התרסק. לבן: הגרסאות שהדור הבא ילמד מהן.`;
  },
  paint(dt){
    const p = this.pop, g = p.hist.length, run = this.state === 'run';
    $('#swGen').textContent = this.state === 'idle' ? '0' : String(run ? g + 1 : g);
    $('#swSurv').textContent = this.state === 'idle' ? '–' : Math.round((this.state === 'select' ? p.hist[g - 1] : this.air) * 100) + '%';
    $('#swCr').textContent = big(p.crashes);
    if (this.state === 'done' && this.par.d){ const v = $('#swSurv'); v.textContent = show(Math.abs(this.lean), 1) + '°'; v.nextElementSibling.textContent = 'נטייה מהיעד'; } else $('#swSurv').nextElementSibling.textContent = 'נשארו באוויר';
    const k = 1 - Math.exp(-dt * 6); for (let j = 0; j < NPAR; j++) this.wv[j] += (p.w[j] - this.wv[j]) * k;
    const ls = this.state === 'run' ? 0 : this.state === 'select' ? (this.tSel > .4 ? 1 : 2) : -1;
    if (ls !== this.ls){ this.ls = ls; $$('#swSteps li').forEach((li, j) => li.classList.toggle('on', j === ls)); }
    this.drawBars(); this.drawNet();
  },
  resize(){ this.bars = fit($('#swBars')); this.net = fit($('#swNet')); },
  drawBars(){
    const f = this.bars, cv = $('#swBars'); if (!f || f.w < 40) return; const c = cv.getContext('2d'), W = f.w, H = f.h, p = this.pop, h = p.hist, run = this.state === 'run';
    c.setTransform(f.d, 0, 0, f.d, 0, 0); c.clearRect(0, 0, W, H);
    const fs = clamp(REM * .78, 11, 16), L = fs * 3.2, Tm = fs * 1.5, B = fs * 1.6, pw = W - L - 4, ph = H - Tm - B, slots = Math.max(12, h.length + (run ? 1 : 0)), bw = pw / slots, Y = v => Tm + (1 - v) * ph;
    c.font = `${fs}px ${MONO}`; c.textAlign = 'right'; c.textBaseline = 'middle'; c.direction = 'ltr'; c.lineWidth = 1;
    for (const v of [0, .5, 1]){ const y = Math.round(Y(v)) + .5; c.strokeStyle = v ? 'rgba(255,255,255,.09)' : 'rgba(255,255,255,.24)'; seg2(c, L, y, W - 4, y); c.fillStyle = L2; c.fillText(Math.round(v * 100) + '%', L - 7, y); }
    const bar = (i, v, live) => { const x = L + i * bw + bw * .16, w = bw * .68, y = Y(v), hh = Math.max(2, Y(0) - y), r = Math.min(4, w / 2, hh); c.beginPath(); c.moveTo(x, Y(0)); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r); c.lineTo(x + w, Y(0)); c.closePath(); const bgr = c.createLinearGradient(0, y, 0, Y(0)); bgr.addColorStop(0, live ? 'rgba(75,224,133,.6)' : '#4be085'); bgr.addColorStop(1, live ? 'rgba(52,194,107,.12)' : 'rgba(52,194,107,.38)'); c.fillStyle = bgr; c.fill(); };
    h.forEach((v, i) => bar(i, v, false)); if (run) bar(h.length, this.air, true);
    c.textBaseline = 'alphabetic'; c.textAlign = 'center'; c.fillStyle = L2; const every = slots > 16 ? 4 : slots > 12 ? 2 : 1; for (let i = 0; i < slots; i += every) c.fillText(String(i + 1), L + (i + .5) * bw, H - 4);
    const li = h.length - 1; if (li >= 0 && !run){ c.fillStyle = LABEL; c.font = `600 ${fs * 1.05}px ${UI}`; c.fillText(Math.round(h[li] * 100) + '%', clamp(L + (li + .5) * bw, L + 18, W - 22), Y(h[li]) - 6); }
  },
  drawNet(){ // the shared network, with the signal of one flying drone passing through it right now
    const f = this.net, cv = $('#swNet'); if (!f || f.w < 40) return; const c = cv.getContext('2d'), W = f.w, H = f.h, w = this.wv, p = this.pop;
    c.setTransform(f.d, 0, 0, f.d, 0, 0); c.clearRect(0, 0, W, H);
    let a = 0; for (let i = 0; i < SWN; i++) if (p.alive[i]){ a = i; break; }
    const th = p.th[a], om = p.om[a], ia = -th / 30, ib = om / 150, hv = new Float32Array(NH); let o = w[NPAR - 1];
    for (let h = 0; h < NH; h++){ hv[h] = Math.tanh(w[h] * ia + w[NH + h] * ib + w[2 * NH + h]); o += w[3 * NH + h] * hv[h]; }
    const u = 100 * Math.tanh(o);
    const fs = clamp(REM * .74, 11, 15), xi = fs * 4.6, xo = W - fs * 4.8, xh = (xi + xo) / 2, yi = [H * .3, H * .7], yh = i => H * (.08 + .84 * i / (NH - 1)), yo = H / 2;
    const ln = (x0, y0, x1, y1, v, sig) => { const k = clamp(Math.abs(sig), 0, 1); c.strokeStyle = `rgba(${v >= 0 ? '245,245,247' : '150,150,158'},${fmt(.18 + .7 * k, 2)})`; c.lineWidth = .6 + 4 * Math.min(1, Math.abs(v) / 1.1); seg2(c, x0, y0, x1, y1); };
    c.lineCap = 'round';
    for (let h = 0; h < NH; h++){ ln(xi, yi[0], xh, yh(h), w[h], w[h] * ia); ln(xi, yi[1], xh, yh(h), w[NH + h], w[NH + h] * ib); ln(xh, yh(h), xo, yo, w[3 * NH + h], w[3 * NH + h] * hv[h]); }
    const node = (x, y, r, v) => { c.beginPath(); c.arc(x, y, r, 0, 7); c.fillStyle = '#000'; c.fill(); c.beginPath(); c.arc(x, y, r, 0, 7); c.fillStyle = v >= 0 ? `rgba(52,194,107,${fmt(Math.min(1, Math.abs(v)), 2)})` : `rgba(235,235,245,${fmt(.8 * Math.min(1, Math.abs(v)), 2)})`; c.fill(); c.strokeStyle = L2; c.lineWidth = 1.5; c.stroke(); };
    node(xi, yi[0], 6, ia); node(xi, yi[1], 6, ib); for (let h = 0; h < NH; h++) node(xh, yh(h), 5, hv[h]); node(xo, yo, 7.5, u / 100);
    c.textBaseline = 'middle'; c.direction = 'rtl'; c.textAlign = 'right';
    c.font = `500 ${fs}px ${UI}`; c.fillStyle = L2; c.fillText('זווית', xi - 10, yi[0] - fs * .6); c.fillText('קצב', xi - 10, yi[1] - fs * .6);
    c.font = `600 ${fs}px ${MONO}`; c.fillStyle = LABEL; c.direction = 'ltr'; c.fillText(show(th, 0) + '°', xi - 10, yi[0] + fs * .6); c.fillText(show(om, 0) + '°/s', xi - 10, yi[1] + fs * .6);
    c.direction = 'rtl'; c.textAlign = 'left'; c.font = `500 ${fs}px ${UI}`; c.fillStyle = L2; c.fillText('מנועים', xo + 12, yo - fs * .6);
    c.direction = 'ltr'; c.font = `600 ${fs}px ${MONO}`; c.fillStyle = LABEL; c.fillText((u > 0 ? '+' : '') + show(u, 0) + '%', xo + 12, yo + fs * .6);
  },
};
$('#swGo').addEventListener('click', () => { if (sw.state === 'idle' || sw.state === 'hold') sw.state = 'run'; else if (sw.state === 'run' || sw.state === 'select'){ if (sw.state === 'select'){ popReset(sw.pop); } sw.state = 'hold'; } sw.ui(); });
$('#swReset').addEventListener('click', () => sw.init());
$('#swGust').addEventListener('click', () => sw.gust());
toggle('#swWind', on => { sw.par.d = on ? -600 : 0; sw.ui(); });

/* the chips, drawn as chips: packages at real scale, and inside the big modules a die layout with cell rows,
   memory macros, two metal layers and a copper clock tree. Static art is drawn once per size; the selected chip
   gets a glow, a light running around its edge, and signals moving along its wires. All units below are millimetres. */
const LYR = { m2: '176,146,255', m3: '84,196,214', cell: '126,160,142', cu: '227,154,98' };
const seeded = s => () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
function dieData(seed){
  const r = seeded(seed), M = [{ x: .12, y: .14, w: .28, h: .2 }, { x: .6, y: .62, w: .27, h: .25 }], hit = (x, y, w, h) => M.some(m => x + w > m.x - .015 && x < m.x + m.w + .015 && y + h > m.y - .015 && y < m.y + m.h + .015);
  const rows = []; for (let y = .08; y + .04 <= .92; y += .04){ const cells = []; let x = .08; while (x < .92){ const w = .012 + Math.floor(r() * 5) * .009; if (x + w <= .92 && !hit(x, y, w, .04) && r() > .14) cells.push([x, w]); x += w + .005; } rows.push([y, cells]); }
  const sp = () => Math.round((.12 + r() * .76) * 50) / 50, nets = [];
  while (nets.length < 28){ const n = { sx: sp(), sy: sp(), ex: sp(), ey: sp(), dur: 1.3 + r() * 2.2, ph: r() }; if (Math.abs(n.sx - n.ex) > .1 && Math.abs(n.sy - n.ey) > .1) nets.push(n); }
  const clock = [], h = (cx, cy, l, d) => { if (d > 2) return; clock.push({ cx, cy, l, d }); for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) h(cx + a * l, cy + b * l, l / 2, d + 1); }; h(.5, .5, .17, 0);
  return { M, rows, nets, clock };
}
const rrect = (c, x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
// px: the size of one screen pixel in the current units, so hairlines stay one pixel wide at any scale
function dieArt(c, D, x, y, s, px){
  c.save(); c.translate(x, y); c.scale(s, s); const u = px / s;
  const bg = c.createRadialGradient(.5, .42, 0, .5, .5, .75); bg.addColorStop(0, '#1b1d24'); bg.addColorStop(1, '#0a0b0e'); c.fillStyle = bg; c.fillRect(0, 0, 1, 1);
  c.strokeStyle = '#3a3e47'; c.lineWidth = u * 1.2; c.strokeRect(.015, .015, .97, .97); c.strokeStyle = '#23262d'; c.strokeRect(.04, .04, .92, .92);
  const fine = s / px > 70; // cell outlines only when the die is big enough on screen to show them
  c.fillStyle = `rgba(${LYR.cell},${fine ? .14 : .2})`; c.strokeStyle = `rgba(${LYR.cell},.5)`; c.lineWidth = u * .5;
  for (const [ry, cells] of D.rows) for (const [cx, cw] of cells){ c.fillRect(cx, ry + .006, cw, .028); if (fine) c.strokeRect(cx, ry + .006, cw, .028); }
  D.M.forEach((m, i) => { c.save(); c.beginPath(); c.rect(m.x, m.y, m.w, m.h); c.clip(); c.strokeStyle = `rgba(${LYR.m2},.32)`; c.lineWidth = u * 1.1; c.beginPath(); for (let d = -m.h; d < m.w; d += .022){ c.moveTo(m.x + d, m.y + m.h); c.lineTo(m.x + d + m.h, m.y); } c.stroke(); c.restore();
    c.strokeStyle = `rgba(${LYR.m2},.75)`; c.lineWidth = u; c.strokeRect(m.x, m.y, m.w, m.h);
    if (fine){ c.fillStyle = 'rgba(160,165,175,.8)'; c.font = `600 ${(.045).toFixed(3)}px ${MONO}`; c.textAlign = 'left'; c.textBaseline = 'top'; c.fillText('SRAM_' + i, m.x + .02, m.y + .02); } });
  c.lineWidth = u * 1.1; c.lineCap = 'square';
  c.strokeStyle = `rgba(${LYR.m2},.85)`; c.beginPath(); for (const n of D.nets){ c.moveTo(n.sx, n.sy); c.lineTo(n.sx, n.ey); } c.stroke();
  c.strokeStyle = `rgba(${LYR.m3},.9)`; c.beginPath(); for (const n of D.nets){ c.moveTo(n.sx, n.ey); c.lineTo(n.ex, n.ey); } c.stroke();
  c.fillStyle = 'rgba(233,234,236,.9)'; for (const n of D.nets) c.fillRect(n.sx - u * 1.6, n.ey - u * 1.6, u * 3.2, u * 3.2);
  c.strokeStyle = `rgb(${LYR.cu})`; c.shadowColor = `rgba(${LYR.cu},.7)`; c.shadowBlur = 5; c.lineCap = 'round';
  for (const b of D.clock){ c.lineWidth = u * [2.2, 1.6, 1.1][b.d]; c.beginPath(); c.moveTo(b.cx - b.l, b.cy); c.lineTo(b.cx + b.l, b.cy); for (const sx of [-1, 1]){ c.moveTo(b.cx + sx * b.l, b.cy - b.l); c.lineTo(b.cx + sx * b.l, b.cy + b.l); } c.stroke(); }
  c.restore();
}
// moving signals: a clock wave from the root of the tree to its leaves, and short streaks running along the wires
function dieLive(c, D, x, y, s, px, t, a){
  c.save(); c.translate(x, y); c.scale(s, s); const u = px / s; c.lineCap = 'round';
  const wave = (t / 1.4) % 1; c.shadowColor = 'rgba(255,217,184,.9)'; c.shadowBlur = 8;
  for (const b of D.clock){ const k = Math.max(0, 1 - Math.abs(wave * 3.4 - b.d - .2) * 1.4) * a; if (k <= 0) continue; c.strokeStyle = `rgba(255,217,184,${(k * .9).toFixed(3)})`; c.lineWidth = u * [3, 2.2, 1.6][b.d]; c.beginPath(); c.moveTo(b.cx - b.l, b.cy); c.lineTo(b.cx + b.l, b.cy); for (const sx of [-1, 1]){ c.moveTo(b.cx + sx * b.l, b.cy - b.l); c.lineTo(b.cx + sx * b.l, b.cy + b.l); } c.stroke(); }
  c.strokeStyle = `rgba(255,255,255,${(.95 * a).toFixed(3)})`; c.shadowColor = 'rgba(255,255,255,.8)'; c.shadowBlur = 6; c.lineWidth = u * 1.8; c.beginPath();
  for (const n of D.nets){ const lv = Math.abs(n.ey - n.sy), lh = Math.abs(n.ex - n.sx), head = ((t / n.dur + n.ph) % 1) * (lv + lh), tail = Math.max(0, head - .05);
    const at = d => d <= lv ? [n.sx, n.sy + Math.sign(n.ey - n.sy) * d] : [n.sx + Math.sign(n.ex - n.sx) * (d - lv), n.ey];
    const [tx, ty] = at(tail), [hx, hy] = at(head); c.moveTo(tx, ty); if (tail < lv && head > lv) c.lineTo(n.sx, n.ey); c.lineTo(hx, hy); }
  c.stroke(); c.restore();
}
function chipPart(c, x, y, w, h, px, label){ // a moulded package: memory, PMIC
  const g = c.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, '#26282e'); g.addColorStop(1, '#0d0e11'); rrect(c, x, y, w, h, Math.min(w, h) * .06); c.fillStyle = g; c.fill();
  c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = px; c.stroke();
  c.fillStyle = 'rgba(255,255,255,.16)'; c.beginPath(); c.arc(x + w * .12, y + h * .16, Math.min(w, h) * .05, 0, 7); c.fill();
  if (label && w / px > 40){ c.fillStyle = 'rgba(220,222,228,.42)'; c.font = `600 ${(h * .14).toFixed(3)}px ${MONO}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(label, x + w / 2, y + h * .58); }
}
function passives(c, seed, x0, y0, x1, y1, n, px){ const r = seeded(seed); for (let i = 0; i < n; i++){ const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), v = r() > .5, w = v ? .6 : 1.1, h = v ? 1.1 : .6;
  c.fillStyle = r() > .4 ? '#b9875a' : '#2a2c31'; c.fillRect(x, y, w, h); c.fillStyle = '#cfd2d8'; if (v){ c.fillRect(x, y, w, .22); c.fillRect(x, y + h - .22, w, .22); } else { c.fillRect(x, y, .22, h); c.fillRect(x + w - .22, y, .22, h); } } }
function hole(c, x, y, r){ c.fillStyle = '#c9a24e'; c.beginPath(); c.arc(x, y, r * 1.6, 0, 7); c.fill(); c.fillStyle = '#050607'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
const STM_PINS = (() => { const p = []; for (let s = 0; s < 4; s++) for (let i = 0; i < 16; i++){ const t = 2.25 + i * .5; p.push(s === 0 ? [t - .11, 0, .22, 1.05] : s === 1 ? [10.95, t - .11, 1.05, .22] : s === 2 ? [12 - t - .11, 10.95, .22, 1.05] : [0, 12 - t - .11, 1.05, .22]); } return p; })();
const ART = [
  { fw: 12, fh: 12, draw(c, px){ // STM32F405 in an LQFP-64: 10 mm body, 64 gull-wing pins
    c.fillStyle = '#9ea2ab'; for (const [x, y, w, h] of STM_PINS) c.fillRect(x, y, w, h);
    const g = c.createLinearGradient(1, 1, 11, 11); g.addColorStop(0, '#2a2c32'); g.addColorStop(1, '#0c0d10'); rrect(c, 1, 1, 10, 10, .35); c.fillStyle = g; c.fill(); c.strokeStyle = 'rgba(255,255,255,.16)'; c.lineWidth = px; c.stroke();
    rrect(c, 1.5, 1.5, 9, 9, .2); c.strokeStyle = 'rgba(255,255,255,.05)'; c.stroke();
    c.fillStyle = 'rgba(0,0,0,.6)'; c.beginPath(); c.arc(2.6, 2.6, .5, 0, 7); c.fill(); c.strokeStyle = 'rgba(255,255,255,.12)'; c.stroke();
    if (10 / px > 50){ c.fillStyle = 'rgba(222,224,230,.6)'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `700 1.35px ${UI}`; c.fillText('STM32', 6, 5.1); c.font = `600 .95px ${MONO}`; c.fillText('F405RGT6', 6, 6.6); c.font = `500 .7px ${MONO}`; c.fillStyle = 'rgba(222,224,230,.38)'; c.fillText('ARM · 168 MHz', 6, 8.1); } },
    live(c, px, t, a){ for (let i = 0; i < 64; i++){ const k = Math.max(0, Math.sin(t * 6 + i * 2.39) * Math.sin(t * 2.3 + i * .7)) * a; if (k < .2) continue; const [x, y, w, h] = STM_PINS[i]; c.fillStyle = `rgba(255,236,200,${(k * .95).toFixed(3)})`; c.fillRect(x, y, w, h); } } },
  { fw: 87, fh: 50, die: dieData(11), draw(c, px){ // Jetson TX2: the module under its thermal plate, SoC, memory and eMMC
    const g = c.createLinearGradient(0, 0, 87, 50); g.addColorStop(0, '#24262c'); g.addColorStop(1, '#0c0d10'); rrect(c, 0, 0, 87, 50, 2.5); c.fillStyle = g; c.fill(); c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = px; c.stroke();
    c.save(); rrect(c, 2, 2, 83, 46, 1.6); c.clip(); c.strokeStyle = 'rgba(255,255,255,.028)'; c.beginPath(); for (let y = 2; y < 48; y += .6){ c.moveTo(2, y); c.lineTo(85, y); } c.stroke(); c.restore();
    for (const [x, y] of [[4, 4], [83, 4], [4, 46], [83, 46]]) hole(c, x, y, 1.1);
    rrect(c, 8, 8, 32, 32, 1.2); c.fillStyle = '#121a17'; c.fill(); c.strokeStyle = 'rgba(255,255,255,.12)'; c.stroke(); passives(c, 3, 9, 9, 38.5, 11, 18, px); passives(c, 4, 9, 37, 38.5, 38.8, 14, px);
    dieArt(c, this.die, 13, 13, 22, px);
    chipPart(c, 45, 8, 12, 10, px, 'LPDDR4'); chipPart(c, 59, 8, 12, 10, px, 'LPDDR4'); chipPart(c, 45, 20, 12, 10, px, 'LPDDR4'); chipPart(c, 59, 20, 12, 10, px, 'LPDDR4'); chipPart(c, 73, 9, 9, 12, px, 'eMMC'); chipPart(c, 74, 24, 7, 7, px, 'PMIC');
    passives(c, 5, 44, 31, 82, 33.5, 22, px);
    c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = 'rgba(235,235,245,.72)'; c.font = `800 3.2px ${UI}`; c.fillText('JETSON TX2', 45, 41); c.fillStyle = 'rgba(235,235,245,.4)'; c.font = `600 1.9px ${MONO}`; c.fillText('NVIDIA · 256 CUDA CORES', 45, 45); },
    live(c, px, t, a){ dieLive(c, this.die, 13, 13, 22, px, t, a); } },
  { fw: 69.6, fh: 45, die: dieData(23), draw(c, px){ // Jetson Orin NX: a SO-DIMM board, gold edge fingers with the key notch
    const g = c.createLinearGradient(0, 0, 69.6, 45); g.addColorStop(0, '#11302a'); g.addColorStop(1, '#071512'); c.beginPath(); c.moveTo(2, 0); c.lineTo(67.6, 0); c.arcTo(69.6, 0, 69.6, 2, 2); c.lineTo(69.6, 45); c.lineTo(0, 45); c.lineTo(0, 2); c.arcTo(0, 0, 2, 0, 2); c.closePath(); c.fillStyle = g; c.fill(); c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = px; c.stroke();
    c.save(); c.beginPath(); c.rect(0, 0, 69.6, 45); c.clip(); c.strokeStyle = 'rgba(80,190,150,.12)'; c.lineWidth = px * .8; const r = seeded(9); c.beginPath(); for (let i = 0; i < 40; i++){ let x = r() * 69.6, y = 3 + r() * 36; c.moveTo(x, y); x += (r() - .5) * 30; c.lineTo(x, y); y += (r() - .5) * 20; c.lineTo(x, y); } c.stroke(); c.restore();
    for (let x = 3.2; x < 66.6; x += .5){ if (x > 37.6 && x < 39.2) continue; c.fillStyle = '#d6ad55'; c.fillRect(x, 41.4, .3, 3.6); }
    c.fillStyle = '#050607'; c.fillRect(37.9, 42.2, 1, 2.8); c.beginPath(); c.arc(38.4, 42.2, .5, Math.PI, 0); c.fill();
    hole(c, 3.5, 4, 1.1); hole(c, 66.1, 4, 1.1);
    rrect(c, 5, 6, 30, 30, 1.2); c.fillStyle = '#0f1513'; c.fill(); c.strokeStyle = 'rgba(255,255,255,.12)'; c.stroke(); passives(c, 13, 6, 6.5, 34.5, 8.6, 16, px); passives(c, 14, 6, 33.2, 34.5, 35.4, 16, px);
    dieArt(c, this.die, 9.5, 10.5, 21, px);
    chipPart(c, 38, 6, 13, 14, px, 'LPDDR5'); chipPart(c, 53, 6, 13, 14, px, 'LPDDR5'); chipPart(c, 38, 23, 7, 7, px, 'PMIC'); passives(c, 15, 47, 23, 66, 30, 14, px);
    c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = 'rgba(235,235,245,.72)'; c.font = `800 2.7px ${UI}`; c.fillText('JETSON ORIN NX', 38, 35); c.fillStyle = 'rgba(235,235,245,.4)'; c.font = `600 1.7px ${MONO}`; c.fillText('NVIDIA · 1024 CUDA CORES', 38, 38.6); },
    live(c, px, t, a){ dieLive(c, this.die, 9.5, 10.5, 21, px, t, a); } },
];

/* --- station 4: what a neural network is, at its most basic. One neuron, then a network, then training --- */
const NN_SAY = [
  '<b>נוירון אחד</b> מקבל מספרים, כאן הזווית וקצב הסיבוב. הוא כופל כל אחד ב<b>משקל</b>, מחבר הכול, ומחליט כמה חזק להגיב. המשקלים קובעים מה הוא יעשה.',
  '<b>רשת</b> היא הרבה נוירונים בשכבות. כל קו הוא משקל אחד, וכל נוירון מעביר את התשובה שלו לשכבה הבאה. ככה הרשת יכולה לתאר התנהגויות שנוסחה פשוטה לא מתארת.',
  '<b>אימון:</b> בהתחלה המשקלים אקראיים והתשובות גרועות. משווים לתשובה הנכונה, ומזיזים כל משקל קצת בכיוון שמקטין את הטעות. אחרי מאות סבבים הרשת עונה טוב, בלי שמישהו כתב לה את הנוסחה.',
];
const NN_L = [2, 5, 5, 1];
const nnW = (() => { const r = mulberry32(21), W = []; for (let l = 0; l < NN_L.length - 1; l++){ const m = []; for (let j = 0; j < NN_L[l + 1]; j++){ const row = []; for (let i = 0; i < NN_L[l]; i++) row.push(gauss(r) * .9); m.push(row); } W.push(m); } return W; })();
const nnW0 = nnW.map(m => m.map(row => row.map(() => 0)).map((row, j) => row)); // filled below with the random starting weights
{ const r = mulberry32(77); nnW.forEach((m, l) => m.forEach((row, j) => row.forEach((_, i) => { nnW0[l][j][i] = gauss(r) * .9; }))); }
function nnFwd(W, x){ const acts = [x]; let a = x; W.forEach((m, l) => { a = m.map(row => { let s = 0; row.forEach((w, i) => { s += w * a[i]; }); return l === W.length - 1 ? Math.tanh(s * .8) : Math.tanh(s); }); acts.push(a); }); return acts; }
const nn = { v: 0, t: 0, f: null, ep: 0,
  set(i){ this.v = i; this.ep = 0; $('#nnSay').innerHTML = NN_SAY[i]; $$('#nnSteps li').forEach((li, j) => { li.classList.toggle('on', j === i); li.classList.toggle('done', j < i); }); },
  resize(){ this.f = fit($('#nnFig')); },
  paint(dt){
    const f = this.f, cv = $('#nnFig'); if (!f || f.w < 60) return; const c = cv.getContext('2d'), W = f.w, H = f.h;
    if (!paused && !RM) this.t += dt; const t = this.t;
    c.setTransform(f.d, 0, 0, f.d, 0, 0); c.clearRect(0, 0, W, H); c.direction = 'rtl';
    const fs = clamp(REM * .85, 12, 17), ang = 14 * Math.sin(t * .9), rate = 40 * Math.cos(t * .9);
    const iso = v => '\u2066' + v + '\u2069', pulse = (x0, y0, x1, y1, u, r, col) => { const px = x0 + (x1 - x0) * u, py = y0 + (y1 - y0) * u; c.beginPath(); c.arc(px, py, r * 2.7, 0, 7); c.fillStyle = 'rgba(255,255,255,.12)'; c.fill(); c.beginPath(); c.arc(px, py, r, 0, 7); c.fillStyle = col; c.fill(); };
    if (this.v === 0){ // one neuron, with real numbers
      const w1 = .8, w2 = .25, xi = W * .14, xn = W * .5, xo = W * .9 - fs * 1.6, y1 = H * .3, y2 = H * .72, yn = H * .5, R = Math.min(H * .2, W * .1);
      const s = w1 * ang + w2 * rate, out = Math.tanh(s / 12), u = (t * .9) % 1;
      [[y1, w1, 'זווית', show(ang, 0) + '°', ang], [y2, w2, 'קצב סיבוב', show(rate, 0) + '°/s', rate]].forEach(([y, w, name, val, x]) => {
        c.strokeStyle = 'rgba(245,245,247,.55)'; c.lineWidth = 1.5 + w * 7; c.beginPath(); c.moveTo(xi + fs * 2.2, y); c.lineTo(xn - R, yn); c.stroke();
        pulse(xi + fs * 2.2, y, xn - R, yn, u, 3 + Math.min(6, Math.abs(x) * w / 4), '#fff');
        c.beginPath(); c.arc(xi, y, fs * 2, 0, 7); c.fillStyle = '#000'; c.fill(); c.strokeStyle = L3; c.lineWidth = 1.5; c.stroke();
        text(c, iso(val), xi, y, `600 ${fs * .95}px ${MONO}`, LABEL); text(c, name, xi, y + fs * 2.9, `600 ${fs}px ${UI}`, L2);
        const mx = xi + fs * 2.2 + (xn - R - xi - fs * 2.2) * .22, my = y + (yn - y) * .22 - fs * 1.3; text(c, iso(`× ${fmt(w, 2)}`), mx, my, `600 ${fs}px ${MONO}`, CAI);
      });
      { const hg = c.createRadialGradient(xn, yn, R * .9, xn, yn, R * 2.1); hg.addColorStop(0, `rgba(52,194,107,${fmt(.16 + .14 * Math.abs(out), 3)})`); hg.addColorStop(1, 'rgba(52,194,107,0)'); c.fillStyle = hg; c.beginPath(); c.arc(xn, yn, R * 2.1, 0, 7); c.fill(); }
      c.beginPath(); c.arc(xn, yn, R, 0, 7); c.fillStyle = '#0b0d0c'; c.fill(); c.strokeStyle = CAI; c.lineWidth = 2.5; c.stroke();
      text(c, 'Σ', xn, yn - R * .18, `700 ${R * .7}px ${UI}`, LABEL); text(c, iso(show(s, 1)), xn, yn + R * .42, `500 ${fs * .9}px ${MONO}`, L2);
      text(c, 'נוירון', xn, yn - R - fs * 1.1, `700 ${fs * 1.05}px ${UI}`, CAI);
      c.strokeStyle = 'rgba(52,194,107,.7)'; c.lineWidth = 3; c.beginPath(); c.moveTo(xn + R, yn); c.lineTo(xo - fs * 1.4, yn); c.stroke(); pulse(xn + R, yn, xo - fs * 1.4, yn, u, 5, CAI);
      const bh = H * .5, by = yn - bh / 2, bx = xo, bw = fs * 1.6; c.fillStyle = 'rgba(120,120,128,.25)'; c.fillRect(bx, by, bw, bh); c.fillStyle = CAI; const hh = out * bh / 2; c.fillRect(bx, yn - Math.max(0, hh), bw, Math.abs(hh));
      c.fillStyle = L3; c.fillRect(bx - 3, yn - .5, bw + 6, 1);
      text(c, 'פקודה', bx + bw / 2, by - fs * 1.2, `600 ${fs}px ${UI}`, L2); text(c, iso(pct(out * 100)), bx + bw / 2, by + bh + fs * 1.1, `600 ${fs * .95}px ${MONO}`, LABEL);
      return;
    }
    // a network: 2 inputs, two hidden layers of 5, one output. Line width is the size of each weight
    const train = this.v === 2; if (train && !paused) this.ep += dt * 60; const prog = train ? 1 - Math.exp(-this.ep / 160) : 1, cyc = train && this.ep > 900;
    if (cyc) this.ep = 0;
    const Wt = nnW.map((m, l) => m.map((row, j) => row.map((w, i) => { const w0 = nnW0[l][j][i]; return w0 + (w - w0) * prog + (train ? Math.sin(t * 7 + i + j * 2 + l) * .08 * (1 - prog) : 0); })));
    const x = [ang / 14, rate / 40], acts = nnFwd(Wt, x), right = Math.tanh(.9 * x[0] + .35 * x[1]);
    const L = NN_L.length, padX = Math.max(W * .13, fs * 4.6), top = train ? Math.max(H * .14, W < 560 ? fs * 4.2 : 0) : H * .08, bot = H * .92, X = l => padX + (W - 2 * padX) * l / (L - 1), Y = (l, j) => { const n = NN_L[l], gap = Math.min((bot - top) / Math.max(n, 2), fs * 3.6); return (top + bot) / 2 + (j - (n - 1) / 2) * gap; };
    const u = (t * .7) % 1, hop = Math.floor(u * (L - 1)), uu = u * (L - 1) - hop;
    for (let l = 0; l < L - 1; l++) for (let j = 0; j < NN_L[l + 1]; j++) for (let i = 0; i < NN_L[l]; i++){
      const w = Wt[l][j][i], x0 = X(l), y0 = Y(l, i), x1 = X(l + 1), y1 = Y(l + 1, j);
      c.strokeStyle = w > 0 ? `rgba(245,245,247,${fmt(.18 + .5 * Math.min(1, Math.abs(w)), 3)})` : `rgba(52,194,107,${fmt(.18 + .5 * Math.min(1, Math.abs(w)), 3)})`; c.lineWidth = .6 + Math.min(5, Math.abs(w) * 3);
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
      if (l === hop && Math.abs(acts[l][i]) > .15) pulse(x0, y0, x1, y1, uu, 1.5 + Math.abs(acts[l][i]) * 2.5, 'rgba(255,255,255,.9)');
    }
    for (let l = 0; l < L; l++) for (let j = 0; j < NN_L[l]; j++){
      const a = acts[l][j], r = l === 0 || l === L - 1 ? fs * 1.15 : fs * .8; c.beginPath(); c.arc(X(l), Y(l, j), r, 0, 7); c.fillStyle = '#000'; c.fill();
      c.beginPath(); c.arc(X(l), Y(l, j), r, 0, 7); c.fillStyle = `rgba(52,194,107,${fmt(Math.abs(a) * .85, 3)})`; c.fill(); c.strokeStyle = l === L - 1 ? CAI : L3; c.lineWidth = 1.5; c.stroke();
    }
    text(c, 'זווית', X(0) - fs * 1.6, Y(0, 0), `600 ${fs}px ${UI}`, L2, 'right'); text(c, 'קצב', X(0) - fs * 1.6, Y(0, 1), `600 ${fs}px ${UI}`, L2, 'right');
    text(c, 'פקודה', X(L - 1) + fs * 1.6, Y(L - 1, 0), `600 ${fs}px ${UI}`, CAI, 'left');
    text(c, 'כניסות', X(0), bot + fs * .2, `500 ${fs * .85}px ${UI}`, L3); text(c, 'שכבות נסתרות', (X(1) + X(2)) / 2, bot + fs * .2, `500 ${fs * .85}px ${UI}`, L3); text(c, 'יציאה', X(L - 1), bot + fs * .2, `500 ${fs * .85}px ${UI}`, L3);
    if (train){ // how far the network's answer is from the right one, shrinking round after round
      const err = Math.abs(acts[L - 1][0] - right), shown = Math.max(err, (1 - prog) * .6);
      text(c, `סבב אימון ${iso(Math.round(this.ep))}`, W - padX, fs * .9, `600 ${fs}px ${UI}`, LABEL, 'right');
      const two = W < 560, bx = padX, bw = two ? W - 2 * padX - fs * 5.5 : W * .34, by = two ? fs * 2.1 : fs * .55; c.fillStyle = 'rgba(120,120,128,.25)'; c.fillRect(bx, by, bw, fs * .7); c.fillStyle = WARN; c.fillRect(bx + bw * (1 - Math.min(1, shown)), by, bw * Math.min(1, shown), fs * .7);
      text(c, `טעות ${iso(Math.round(Math.min(1, shown) * 100) + '%')}`, bx + bw + fs * .6, by + fs * .35, `600 ${fs * .9}px ${UI}`, L2, 'left');
    }
  },
};
const nnSeg = segmented($('#nnSeg'), i => nn.set(i));

/* --- station 6: what a network costs on board: chip, watts, grams, minutes --- */
// hover power from momentum theory: P = (mg)^1.5 / sqrt(2 rho A) / (figure of merit x motor efficiency)
const HWM = { m0: .72, A: 4 * Math.PI * .0635 ** 2, eta: .45, Wh: 22.2 * .8, Tmax: 35, fc: .29 };
const hover = m => (m * 9.81) ** 1.5 / Math.sqrt(2 * 1.225 * HWM.A) / HWM.eta;
const CHIPS = [{ n: 'STM32F405', w: 10, h: 10, p: '0.3 W' }, { n: 'Jetson TX2', w: 87, h: 50, p: '7.5–15 W' }, { n: 'Jetson Orin NX', w: 69.6, h: 45, p: '10–25 W' }];
const HW = [
  { n: 'PID', chip: 0, P: 0, m: 0, say: '<b>PID על בקר הטיסה.</b> כ-10 פעולות חשבון לכל החלטה, על שבב STM32F405 של 168 MHz שצורך כ-0.3 W. זה השבב שכבר נמצא ברוב רחפני המירוץ.' },
  { n: 'רשת בקרה קטנה', chip: 0, P: 0, m: 0, say: '<b>רשת בקרה של שתי שכבות, 64 נוירונים בכל אחת</b> (Hwangbo ועמיתיו, 2017). כ-5,500 הכפלות לכל החלטה: 7 מיקרו-שניות במעבד שולחני, ולפי הערכה שלנו עשרות מיקרו-שניות בבקר טיסה. אותו שבב, כמעט בלי חשמל נוסף.' },
  { n: 'רשת ראייה, TX2', chip: 1, P: 10, m: 150, say: '<b>רשת שרואה, כמו Swift.</b> רשת קונבולוציה מזהה את השערים בתמונה, ורק אחריה רשת הבקרה מחליטה. זה דרש מחשב Jetson TX2, ומעבר אחד ברשת לקח 40 ms. בהשוואה ההוגנת, לרחפנים של הטייסים האנושיים הוסיפו משקולת במקום המחשב.' },
  { n: 'Orin NX', chip: 2, P: 20, m: 150, say: '<b>מחשב AI חדש יותר, Jetson Orin NX.</b> מריץ רשתות גדולות בהרבה, וצורך 10 עד 25 W. כאן הנחנו 20 W.' },
];
const hwFly = o => { const m = HWM.m0 + o.m / 1000, Pm = hover(m), Pc = HWM.fc + o.P; return { m, Pm, Pc, t: HWM.Wh / (Pm + Pc) * 60, hov: m * 9.81 / HWM.Tmax }; };
const hw = { i: 0, f: null, a: [1, 0, 0], tmax: hwFly(HW[0]).t,
  set(i){ this.i = i; const o = HW[i], r = hwFly(o), b = hwFly(HW[0]);
    $('#hwT').textContent = fmt(r.t, 1); $('#hwM').textContent = Math.round(r.Pm); $('#hwC').textContent = r.Pc < 1 ? fmt(r.Pc, 1) : Math.round(r.Pc); $('#hwH').textContent = Math.round(r.hov * 100) + '%';
    let extra = ''; if (o.m){ const lost = b.t - r.t, massOnly = HWM.Wh / (r.Pm + HWM.fc) * 60, byMass = b.t - massOnly; extra = ` <b>${fmt(lost, 1)} דקות טיסה פחות.</b> ${fmt(byMass, 1)} מהן בגלל ${o.m} הגרם שהמנועים מרימים, ורק ${fmt(lost - byMass, 1)} בגלל החשמל של המחשב.`; }
    $('#hwSay').innerHTML = o.say + extra;
    $$('#hwBars > div').forEach((d, j) => d.classList.toggle('on', j === i)); },
  build(){ $('#hwBars').innerHTML = HW.map(o => { const r = hwFly(o); return `<div><span>${o.n}</span><i style="--v:${fmt(r.t / this.tmax, 3)}"></i><b>${fmt(r.t, 1)} דק׳</b></div>`; }).join(''); this.set(0); },
  resize(){ this.f = fit($('#hwChips')); this.L = null; },
  // where each chip goes at the current size, and its static art drawn once into its own canvas
  layout(W, H, d){
    const fs = clamp(REM * .8, 11, 15), lab = fs * 4.2, gapmm = W < 500 ? 9 : 14, tot = ART.reduce((t, q) => t + q.fw, 0) + gapmm * 2, side = fs * 4.2, sc = Math.min((W - side * 2) / tot, (H - lab - 6) / 50), y0 = Math.max(4, (H - lab - 50 * sc) / 2) + 50 * sc;
    let x = Math.max(side, (W - tot * sc) / 2); const pad = 24;
    const items = ART.map(q => { const it = { q, x, y: y0 - q.fh * sc, w: q.fw * sc, h: q.fh * sc }; x += it.w + gapmm * sc;
      const cv = document.createElement('canvas'); cv.width = Math.ceil((it.w + pad * 2) * d); cv.height = Math.ceil((it.h + pad * 2) * d); const g = cv.getContext('2d');
      g.setTransform(d * sc, 0, 0, d * sc, pad * d, pad * d); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 14 * d; g.shadowOffsetY = 6 * d; rrect(g, 0, 0, q.fw, q.fh, Math.min(2.5, q.fw * .04)); g.fillStyle = '#0b0c0f'; g.fill(); g.shadowColor = 'transparent';
      q.draw(g, 1 / sc); it.img = cv; return it; });
    // a magnifier over the tiny STM32, so its pins and marking can be read
    const s = items[0], mr = clamp(Math.min((y0 - 12 * sc - 10) / 2 - 4, (s.w + gapmm * sc) * .95), 26, 120), zoom = mr * 1.45 / 12;
    const m = { x: s.x + s.w / 2, y: s.y - 10 - mr, r: mr, zoom }; if (m.y - mr < 2) m.y = mr + 2;
    const cv = document.createElement('canvas'); cv.width = cv.height = Math.ceil(mr * 2 * d); const g = cv.getContext('2d'); g.setTransform(d * zoom, 0, 0, d * zoom, (mr - 6 * zoom) * d, (mr - 6 * zoom) * d); ART[0].draw(g, 1 / zoom); m.img = cv;
    return { fs, lab, sc, y0, items, m };
  },
  paint(dt){
    const f = this.f, cv = $('#hwChips'); if (!f || f.w < 60) return; const c = cv.getContext('2d'), W = f.w, H = f.h, on = HW[this.i].chip, k = 1 - Math.exp(-dt * 8);
    if (!this.L || this.L.W !== W || this.L.H !== H){ this.L = Object.assign(this.layout(W, H, f.d), { W, H }); }
    if (!RM) this.t = (this.t || 0) + dt;
    for (let j = 0; j < 3; j++) this.a[j] += ((j === on ? 1 : 0) - this.a[j]) * k;
    const L = this.L, t = this.t || 0; c.setTransform(f.d, 0, 0, f.d, 0, 0); c.clearRect(0, 0, W, H);
    L.items.forEach((it, j) => { const a = this.a[j], cx = it.x + it.w / 2, cy = it.y + it.h / 2;
      if (a > .01){ const R = Math.max(it.w, it.h) * .85 + 30, g = c.createRadialGradient(cx, cy, 0, cx, cy, R); g.addColorStop(0, `rgba(${LYR.m2},${(.3 * a).toFixed(3)})`); g.addColorStop(.45, `rgba(${LYR.m3},${(.12 * a).toFixed(3)})`); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(cx - R, cy - R, R * 2, R * 2); }
      c.globalAlpha = .42 + .58 * a; c.drawImage(it.img, it.x - 24, it.y - 24, it.img.width / f.d, it.img.height / f.d); c.globalAlpha = 1;
      if (a > .02){ c.save(); c.translate(it.x, it.y); c.scale(L.sc, L.sc); it.q.live(c, 1 / L.sc, t, a); c.restore();
        if (c.createConicGradient){ const g = c.createConicGradient(t * 1.6, cx, cy); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.06, `rgba(255,255,255,${(.85 * a).toFixed(3)})`); g.addColorStop(.12, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,0)'); g.addColorStop(.56, `rgba(${LYR.m3},${(.6 * a).toFixed(3)})`); g.addColorStop(.62, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,0)');
          rrect(c, it.x - .5, it.y - .5, it.w + 1, it.h + 1, Math.min(2.5, it.q.fw * .04) * L.sc); c.strokeStyle = g; c.lineWidth = 1.5; c.stroke(); } }
      const fs = L.fs; c.textAlign = 'center'; c.textBaseline = 'top'; c.direction = 'ltr'; c.globalAlpha = .55 + .45 * a;
      c.font = `700 ${fs}px ${UI}`; c.fillStyle = LABEL; c.fillText(CHIPS[j].n, cx, L.y0 + fs * .7);
      c.font = `500 ${fs * .88}px ${MONO}`; c.fillStyle = L2; c.fillText(`${CHIPS[j].w}×${CHIPS[j].h} mm`, cx, L.y0 + fs * 2); c.fillText(CHIPS[j].p, cx, L.y0 + fs * 3.2); c.globalAlpha = 1; });
    // the magnifier, with a leader down to the chip
    const m = L.m, s = L.items[0], a = this.a[0];
    c.strokeStyle = 'rgba(245,245,247,.35)'; c.lineWidth = 1; c.setLineDash([3, 3]); c.beginPath(); c.moveTo(m.x, m.y + m.r); c.lineTo(s.x + s.w / 2, s.y - 2); c.stroke(); c.setLineDash([]);
    c.save(); c.beginPath(); c.arc(m.x, m.y, m.r, 0, 7); c.fillStyle = '#08090b'; c.fill(); c.clip();
    if (a > .01){ const g = c.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r); g.addColorStop(0, `rgba(${LYR.m2},${(.35 * a).toFixed(3)})`); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(m.x - m.r, m.y - m.r, m.r * 2, m.r * 2); }
    c.globalAlpha = .5 + .5 * a; c.drawImage(m.img, m.x - m.r, m.y - m.r, m.r * 2, m.r * 2); c.globalAlpha = 1;
    if (a > .02){ c.translate(m.x - 6 * m.zoom, m.y - 6 * m.zoom); c.scale(m.zoom, m.zoom); ART[0].live(c, 1 / m.zoom, t, a); }
    c.restore();
    const rg = c.createLinearGradient(m.x - m.r, m.y - m.r, m.x + m.r, m.y + m.r); rg.addColorStop(0, 'rgba(255,255,255,.7)'); rg.addColorStop(.5, 'rgba(255,255,255,.15)'); rg.addColorStop(1, 'rgba(255,255,255,.5)');
    c.beginPath(); c.arc(m.x, m.y, m.r, 0, 7); c.strokeStyle = rg; c.lineWidth = 2; c.stroke();
    c.font = `600 ${Math.round(L.fs * .8)}px ${MONO}`; c.fillStyle = L2; c.textAlign = 'right'; c.textBaseline = 'middle'; c.fillText(`×${Math.round(m.zoom / L.sc)}`, m.x - m.r * .72 - 4, m.y + m.r * .72);
  },
};
const hwSeg = segmented($('#hwSeg'), i => hw.set(i));

/* --- station 7: the price of each approach --- */
const tvSeg = segmented($('#tvSeg'), i => { [0, 1, 2].forEach(j => { $('#tv' + j).hidden = j !== i; }); measure(); });
const OPT = ['PID', 'PID + נוירון', 'רשת לומדת'];
const QUIZ = [
  ['רחפן צילום מסחרי. צריך ריחוף יציב, מעבד זול והתנהגות צפויה.', 0, 'זה הסטנדרט בטייסים האוטומטיים הפתוחים: בקר זווית, ומתחתיו PID על קצב הסיבוב.'],
  ['זרוע רובוטית עם שרירים פנאומטיים. לא-ליניארית, והעומס משתנה.', 1, 'Thanh ו-Ahn ‏(2006): נוירון שמכוונן את מקדמי ה-PID תוך כדי תנועה.'],
  ['מרוץ רחפנים מול אלופי עולם, על קצה היכולת הפיזיקלית.', 2, 'Swift ‏(Nature, 2023) אומנה בסימולציה וניצחה 15 מתוך 25 מרוצים.'],
  ['פלזמה בכור היתוך. 19 סלילים מגנטיים שמשפיעים זה על זה.', 2, 'DeepMind ו-EPFL ‏(Nature, 2022): רשת אחת לכל 19 הסלילים של TCV.'],
];
let qi = 0;
function showQ(){ const q = QUIZ[qi]; $('#qzN').textContent = `תרחיש ${qi + 1} מתוך ${QUIZ.length}`; $('#qzQ').textContent = q[0]; $('#qzA').textContent = ''; $('#qzO').innerHTML = OPT.map((o, j) => `<button class="btn" type="button" data-a="${j}">${o}</button>`).join(''); const nx = $('#qzNext'); nx.disabled = true; nx.textContent = qi === QUIZ.length - 1 ? 'מההתחלה' : 'התרחיש הבא'; }
$('#qzO').addEventListener('click', e => { const b = e.target.closest('button'); if (!b || b.disabled) return; const q = QUIZ[qi], pick = +b.dataset.a; $$('#qzO button').forEach((x, j) => { x.classList.toggle('right', j === q[1]); x.disabled = true; }); $('#qzA').innerHTML = `<b>${pick === q[1] ? 'כך עשו בפועל.' : 'בפועל: ' + OPT[q[1]] + '.'}</b> ${q[2]}`; $('#qzNext').disabled = false; });
$('#qzNext').addEventListener('click', () => { qi = (qi + 1) % QUIZ.length; showQ(); });

/* ================= 3D stage ================= */
const Y0 = .46, FLOOR = -2.6, HB = Y0 + .06; // the body sits above the pivot, like an inverted pendulum
function makeStage(){
  const T = window.THREE, cv = $('#stage'); if (!T) return null;
  let R; try { R = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, powerPreference: 'high-performance' }); } catch (e) { return null; }
  R.setPixelRatio(Math.min(TOUCH ? 1.5 : 2, devicePixelRatio || 1)); R.outputEncoding = T.sRGBEncoding; R.toneMapping = T.ACESFilmicToneMapping; R.toneMappingExposure = 1.2; R.setClearColor(0x000000, 0);
  R.shadowMap.enabled = true; R.shadowMap.type = T.PCFSoftShadowMap;
  const col = h => new T.Color(h).convertSRGBToLinear();
  const scene = new T.Scene(); scene.fog = new T.Fog(0x000000, 42, 135);
  const cam = new T.PerspectiveCamera(32, 1, .1, 260);
  try { // a small softbox studio, baked once into an environment map for reflections
    const es = new T.Scene(); es.add(new T.Mesh(new T.BoxGeometry(24, 24, 24), new T.MeshBasicMaterial({ color: 0x030304, side: T.BackSide })));
    const box = (c, k, p, s) => { const m = new T.Mesh(new T.BoxGeometry(1, 1, 1), new T.MeshBasicMaterial({ color: new T.Color(c).multiplyScalar(k) })); m.position.set(p[0], p[1], p[2]); m.scale.set(s[0], s[1], s[2]); es.add(m); };
    // two long strips overhead draw the long, clean highlights of a product shot along the canopy and the motor bells;
    // a cool wall on one side, a warm one on the other, and a thin cool strip behind that catches every edge
    box(0xffffff, 6.5, [-3.4, 10, 1], [1.4, .2, 14]); box(0xffffff, 6.5, [3.4, 10, -1], [1.4, .2, 14]); box(0xffffff, 1.5, [0, 10.6, 0], [10, .2, 10]);
    box(0xbdd3ff, 5, [-10, 2, 3], [.2, 6, 7]); box(0xffd0a6, 3.6, [10, 1, -3], [.2, 5, 6]); box(0xffffff, 1.6, [0, 3, 11], [10, 3, .2]); box(0x9fc0ff, 1.1, [0, 2.4, -11], [13, 1.1, .2]);
    const pm = new T.PMREMGenerator(R); scene.environment = pm.fromScene(es, .04).texture; pm.dispose();
  } catch (e) { /* lights alone still work */ }
  scene.add(new T.HemisphereLight(0xffffff, 0x060608, .3));
  const key = new T.DirectionalLight(0xfff5ea, 1.55); key.position.set(3.5, 7, 5); key.castShadow = true; key.shadow.mapSize.set(TOUCH ? 1024 : 2048, TOUCH ? 1024 : 2048);
  Object.assign(key.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 24 }); key.shadow.camera.updateProjectionMatrix(); key.shadow.bias = -.0006; key.shadow.radius = 4; scene.add(key);
  // the two back lights carry the colour of the story: cool steel and a warm kick for the classic controller, green once a network is flying
  const cRim = col(0x9dbcff), cRimAI = col(0x8fe9c0), cWarm = col(0xffa870), cWarmAI = col(0x3fe08a);
  const rim = new T.DirectionalLight(0x9dbcff, 1.5); rim.position.set(-6, 3.2, -5.5); scene.add(rim);
  const warm = new T.PointLight(0xffa870, .95, 30); warm.position.set(6, 1.5, -3); scene.add(warm);
  const floor = new T.Mesh(new T.CircleGeometry(120, 64), new T.MeshStandardMaterial({ color: col(0x0d0d10), roughness: .8, metalness: .2, envMapIntensity: .25 })); floor.rotation.x = -Math.PI / 2; floor.position.y = FLOOR; floor.receiveShadow = true; scene.add(floor);
  const gc = document.createElement('canvas'); gc.width = gc.height = 256; { const g2 = gc.getContext('2d'), gr = g2.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, '#fff'); gr.addColorStop(.3, '#8a8a8a'); gr.addColorStop(.62, '#222'); gr.addColorStop(1, '#000'); g2.fillStyle = gr; g2.fillRect(0, 0, 256, 256); }
  const pool = new T.Mesh(new T.CircleGeometry(17, 64), new T.MeshStandardMaterial({ color: col(0x25262e), roughness: .5, metalness: .35, envMapIntensity: .45, transparent: true, alphaMap: new T.CanvasTexture(gc), depthWrite: false })); pool.rotation.x = -Math.PI / 2; pool.position.y = FLOOR + .004; pool.receiveShadow = true; scene.add(pool);
  // dust in the light: two slow, sparse clouds turning against each other, so the air has depth without drawing the eye
  const dotC = document.createElement('canvas'); dotC.width = dotC.height = 64; { const g2 = dotC.getContext('2d'), gr = g2.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g2.fillStyle = gr; g2.fillRect(0, 0, 64, 64); }
  const dotMap = new T.CanvasTexture(dotC), dustM = new T.PointsMaterial({ size: .055, map: dotMap, color: 0xcfdcff, transparent: true, opacity: .42, depthWrite: false, blending: T.AdditiveBlending, sizeAttenuation: true });
  const dust = [0, 1].map(k => { const n = TOUCH ? 40 : 90, p = new Float32Array(n * 3), r = mulberry32(31 + k); for (let i = 0; i < n; i++){ p[i * 3] = (r() - .5) * 15; p[i * 3 + 1] = FLOOR + .3 + r() * 6.4; p[i * 3 + 2] = (r() - .5) * 11 - 1; }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(p, 3)); const o = new T.Points(g, dustM); o.frustumCulled = false; scene.add(o); return o; });
  // a measuring ring on the floor under each drone, like the turntable of a test rig
  const ringMap = (() => { const c = document.createElement('canvas'); c.width = c.height = 1024; const g = c.getContext('2d'); g.translate(512, 512); g.strokeStyle = '#fff'; g.lineCap = 'butt';
    g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 470, 0, 7); g.stroke(); g.lineWidth = 1.5; g.globalAlpha = .7; g.beginPath(); g.arc(0, 0, 330, 0, 7); g.stroke(); g.globalAlpha = 1;
    for (let i = 0; i < 72; i++){ const a = i * Math.PI / 36, long = i % 6 === 0, r0 = long ? 430 : 450; g.lineWidth = long ? 3 : 1.5; g.globalAlpha = long ? 1 : .6; g.beginPath(); g.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); g.lineTo(Math.cos(a) * 470, Math.sin(a) * 470); g.stroke(); }
    const t = new T.CanvasTexture(c); t.anisotropy = Math.min(8, R.capabilities.getMaxAnisotropy ? R.capabilities.getMaxAnisotropy() : 1); return t; })();
  const ringM = new T.MeshBasicMaterial({ map: ringMap, color: 0xdfe6ff, transparent: true, opacity: .2, depthWrite: false, toneMapped: false }), ringG = new T.CircleGeometry(2.15, 64);

  /* ---- the drone model: a 5-inch quad built from real shapes (extruded carbon plates, lathed motors, twisted tri-blade props) ---- */
  const seedR = s => () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const aniso = Math.min(8, R.capabilities.getMaxAnisotropy ? R.capabilities.getMaxAnisotropy() : 1);
  const tex = (w, h, draw, srgb = true) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); if (srgb) t.encoding = T.sRGBEncoding; t.anisotropy = aniso; return t; };
  const tile = (t, n) => { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(n, n); return t; };
  // 2x2 twill carbon weave: each cell is a tow of fibres catching the light along its length
  const weave = (g, w) => { const n = 8, s = w / n; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++){ const hz = ((x - y + 64) % 4) < 2, gr = hz ? g.createLinearGradient(0, y * s, 0, y * s + s) : g.createLinearGradient(x * s, 0, x * s + s, 0);
    gr.addColorStop(0, '#0c0c0e'); gr.addColorStop(.5, hz ? '#34343b' : '#26262c'); gr.addColorStop(1, '#0c0c0e'); g.fillStyle = gr; g.fillRect(x * s, y * s, s, s); } };
  const carbonMap = tile(tex(128, 128, weave), 7);
  const pcbMap = tex(256, 256, (g, w) => { const r = seedR(7); g.fillStyle = '#0b2c25'; g.fillRect(0, 0, w, w);
    g.strokeStyle = 'rgba(60,170,130,.45)'; g.lineWidth = 2; g.lineCap = 'round';
    for (let i = 0; i < 46; i++){ let x = 20 + r() * 216, y = 20 + r() * 216; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 3; k++){ if (k % 2) y += (r() - .5) * 120; else x += (r() - .5) * 120; x = Math.max(14, Math.min(242, x)); y = Math.max(14, Math.min(242, y)); g.lineTo(x, y); } g.stroke(); }
    g.fillStyle = '#c8a24e'; for (const [x, y] of [[22, 22], [234, 22], [22, 234], [234, 234]]){ g.beginPath(); g.arc(x, y, 13, 0, 7); g.fill(); g.fillStyle = '#05100d'; g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill(); g.fillStyle = '#c8a24e'; }
    for (let i = 0; i < 40; i++){ g.fillRect(40 + (i % 10) * 18, i < 10 ? 34 : i < 20 ? 214 : 0, 7, 9); }
    g.fillStyle = 'rgba(240,240,236,.85)'; g.font = '700 22px ui-monospace,monospace'; g.textAlign = 'center'; g.fillText('F405', 128, 198); g.font = '600 13px ui-monospace,monospace'; g.fillText('IMU', 74, 168); });
  pcbMap.repeat.set(1 / .38, 1 / .38); pcbMap.offset.set(.5, .5);
  const labelMap = tex(512, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#2a2a30'); gr.addColorStop(1, '#17171b'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#e8e8ec'; g.fillRect(0, 0, 18, h); g.font = '800 54px system-ui,Arial,sans-serif'; g.textBaseline = 'middle'; g.fillText('1500', 44, 56); g.font = '600 26px system-ui,Arial,sans-serif'; g.fillStyle = 'rgba(232,232,236,.7)'; g.fillText('mAh  4S  14.8V  120C', 46, 100);
    g.font = '800 34px system-ui,Arial,sans-serif'; g.fillStyle = '#e8e8ec'; g.textAlign = 'right'; g.fillText('LiPo', w - 24, 58); });
  const blurMap = tex(256, 256, (g, w) => { const c = w / 2, gr = g.createRadialGradient(c, c, 0, c, c, c); gr.addColorStop(0, '#000'); gr.addColorStop(.12, '#000'); gr.addColorStop(.2, '#777'); gr.addColorStop(.55, '#fff'); gr.addColorStop(.82, '#bbb'); gr.addColorStop(.94, '#fff'); gr.addColorStop(1, '#000'); g.fillStyle = gr; g.fillRect(0, 0, w, w); }, false);

  const M = {
    carbon: new T.MeshPhysicalMaterial({ map: carbonMap, color: 0xffffff, metalness: .25, roughness: .42, clearcoat: 1, clearcoatRoughness: .14, envMapIntensity: .7 }),
    shell: new T.MeshPhysicalMaterial({ color: col(0x2a2b31), metalness: .2, roughness: .3, clearcoat: 1, clearcoatRoughness: .06 }),
    metal: new T.MeshStandardMaterial({ color: col(0xc4c7cf), metalness: 1, roughness: .24 }),
    anod: new T.MeshPhysicalMaterial({ color: col(0x3b3d45), metalness: .9, roughness: .3, clearcoat: .6, clearcoatRoughness: .2 }),
    bell: new T.MeshPhysicalMaterial({ color: col(0x9aa0ab), metalness: 1, roughness: .2, clearcoat: .8, clearcoatRoughness: .1 }),
    copper: new T.MeshStandardMaterial({ color: col(0xc9783e), metalness: 1, roughness: .32 }),
    dark: new T.MeshStandardMaterial({ color: col(0x0d0d10), metalness: .4, roughness: .5 }),
    rubber: new T.MeshStandardMaterial({ color: col(0x141416), metalness: 0, roughness: .85 }),
    chip: new T.MeshStandardMaterial({ color: col(0x16171b), metalness: .3, roughness: .35 }),
    gold: new T.MeshStandardMaterial({ color: col(0xd6ad55), metalness: 1, roughness: .3 }),
    pcb: new T.MeshStandardMaterial({ map: pcbMap, color: 0xffffff, metalness: .15, roughness: .45 }),
    esc: new T.MeshStandardMaterial({ color: col(0x101215), metalness: .2, roughness: .5 }),
    batt: new T.MeshPhysicalMaterial({ color: col(0x202024), metalness: .2, roughness: .45, clearcoat: .6 }),
    label: new T.MeshStandardMaterial({ map: labelMap, metalness: .1, roughness: .5 }),
    band: new T.MeshStandardMaterial({ color: col(0xd9d9de), metalness: 0, roughness: .8 }),
    red: new T.MeshStandardMaterial({ color: col(0xb3261e), metalness: .1, roughness: .45 }),
    yellow: new T.MeshStandardMaterial({ color: col(0xe0b21f), metalness: .1, roughness: .5 }),
    glass: new T.MeshPhysicalMaterial({ color: col(0x0a1220), metalness: .1, roughness: .02, clearcoat: 1, clearcoatRoughness: 0, envMapIntensity: 2 }),
    crate: new T.MeshPhysicalMaterial({ color: col(0x4d505b), metalness: .05, roughness: .7, clearcoat: .15 }),
    blade: new T.MeshPhysicalMaterial({ color: col(0x5d6470), metalness: 0, roughness: .2, clearcoat: 1, transparent: true, opacity: .82, side: T.DoubleSide }),
    disc: new T.MeshBasicMaterial({ color: 0xffffff, alphaMap: blurMap, transparent: true, opacity: .1, depthWrite: false, side: T.DoubleSide }),
    stand: new T.MeshStandardMaterial({ color: col(0x4a4a50), metalness: .9, roughness: .34 }),
  };

  /* geometry helpers: rounded outlines extruded into plates, merged where one material repeats */
  const rr = (p, cx, cy, w, h, r) => { const x = cx - w / 2, y = cy - h / 2; p.moveTo(x + r, y); p.lineTo(x + w - r, y); p.quadraticCurveTo(x + w, y, x + w, y + r); p.lineTo(x + w, y + h - r); p.quadraticCurveTo(x + w, y + h, x + w - r, y + h); p.lineTo(x + r, y + h); p.quadraticCurveTo(x, y + h, x, y + h - r); p.lineTo(x, y + r); p.quadraticCurveTo(x, y, x + r, y); return p; };
  const hole = (cx, cy, r) => { const p = new T.Path(); p.absarc(cx, cy, r, 0, Math.PI * 2, true); return p; };
  const slot = (cx, cy, w, h) => { const p = new T.Path(), r = Math.min(w, h) / 2, x = cx - w / 2, y = cy - h / 2; p.moveTo(x + r, y); p.lineTo(x + w - r, y); p.quadraticCurveTo(x + w, y, x + w, y + r); p.lineTo(x + w, y + h - r); p.quadraticCurveTo(x + w, y + h, x + w - r, y + h); p.lineTo(x + r, y + h); p.quadraticCurveTo(x, y + h, x, y + h - r); p.lineTo(x, y + r); p.quadraticCurveTo(x, y, x + r, y); return p; };
  const ext = (shape, depth, bev = .006, seg = 10) => { const g = new T.ExtrudeGeometry(shape, { depth: Math.max(.001, depth - 2 * bev), bevelEnabled: bev > 0, bevelThickness: bev, bevelSize: bev, bevelSegments: 2, curveSegments: seg }); g.translate(0, 0, -(depth - 2 * bev) / 2); g.rotateX(-Math.PI / 2); return g; };
  const rbox = (w, h, d, r) => ext(rr(new T.Shape(), 0, 0, w - 2 * r * .5, d - 2 * r * .5, r * .5), h, r * .5, 6);
  const tf = (g, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => { g.applyMatrix4(new T.Matrix4().compose(new T.Vector3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(rx, ry, rz)), new T.Vector3(1, 1, 1))); return g; };
  const mergeG = list => { const qs = list.map(g => g.index ? g.toNonIndexed() : g); let n = 0; for (const q of qs) n += q.attributes.position.count;
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2); let o = 0;
    for (const q of qs){ pos.set(q.attributes.position.array, o * 3); nor.set(q.attributes.normal.array, o * 3); if (q.attributes.uv) uv.set(q.attributes.uv.array, o * 2); o += q.attributes.position.count; }
    const out = new T.BufferGeometry(); out.setAttribute('position', new T.BufferAttribute(pos, 3)); out.setAttribute('normal', new T.BufferAttribute(nor, 3)); out.setAttribute('uv', new T.BufferAttribute(uv, 2)); return out; };

  const G = {};
  { // bottom plate with lightening slots, and a thinner top plate
    const b = rr(new T.Shape(), 0, 0, 1.1, .68, .12); b.holes.push(slot(-.3, 0, .26, .1), slot(.3, 0, .26, .1), hole(0, .23, .035), hole(0, -.23, .035)); G.plateB = ext(b, .05, .008);
    const t = rr(new T.Shape(), 0, 0, .86, .5, .1); t.holes.push(slot(0, .14, .4, .07), slot(0, -.14, .4, .07)); for (const [x, y] of [[-.33, -.19], [.33, -.19], [-.33, .19], [.33, .19]]) t.holes.push(hole(x, y, .018)); G.plateT = ext(t, .035, .006);
  }
  { // one arm: a tapered beam ending in a round motor pad with mounting holes
    const L = 1.4, s = new T.Shape(); s.moveTo(0, -.08); s.lineTo(L - .2, -.062); s.quadraticCurveTo(L - .12, -.15, L, -.15); s.absarc(L, 0, .15, -Math.PI / 2, Math.PI / 2, false); s.quadraticCurveTo(L - .12, .15, L - .2, .062); s.lineTo(0, .08); s.lineTo(0, -.08);
    s.holes.push(hole(L, 0, .038), slot(.55, 0, .5, .05)); for (let k = 0; k < 4; k++){ const a = k * Math.PI / 2 + Math.PI / 4; s.holes.push(hole(L + Math.cos(a) * .085, Math.sin(a) * .085, .013)); }
    G.arm = ext(s, .055, .008, 14); G.armL = L;
  }
  G.standoff = new T.CylinderGeometry(.016, .016, .14, 6); G.screw = new T.CylinderGeometry(.022, .022, .012, 6);
  { // flight controller: chamfered board, MCU with pins, IMU, connectors
    const s = new T.Shape(), h = .19, c = .035; s.moveTo(-h + c, -h); s.lineTo(h - c, -h); s.lineTo(h, -h + c); s.lineTo(h, h - c); s.lineTo(h - c, h); s.lineTo(-h + c, h); s.lineTo(-h, h - c); s.lineTo(-h, -h + c); s.lineTo(-h + c, -h);
    for (const [x, y] of [[-.153, -.153], [.153, -.153], [-.153, .153], [.153, .153]]) s.holes.push(hole(x, y, .016));
    G.fcb = ext(s, .016, .002, 6); G.escb = ext(s, .018, .002, 6);
    G.mcu = rbox(.12, .022, .12, .008);
    const pins = []; for (let side = 0; side < 4; side++) for (let i = 0; i < 9; i++){ const t = -.048 + i * .012, p = new T.BoxGeometry(.005, .006, .02); if (side < 2) tf(p, t, 0, side ? .068 : -.068); else tf(p, side === 2 ? .068 : -.068, 0, t, 0, Math.PI / 2, 0); pins.push(p); }
    G.pins = mergeG(pins); G.imu = rbox(.06, .016, .06, .006);
    G.plug = mergeG([0, 1, 2, 3].map(i => tf(new T.BoxGeometry(.05, .03, .025), -.09 + i * .06, 0, 0)));
    G.fet = mergeG([[-.1, -.1], [-.1, .1], [.1, -.1], [.1, .1], [-.04, -.1], [.04, .1]].map(([x, z]) => tf(new T.BoxGeometry(.05, .014, .05), x, 0, z)));
    G.cap = new T.CylinderGeometry(.035, .035, .1, 20);
  }
  { // canopy: a smooth pod, lower at the nose
    const g = new T.SphereGeometry(.5, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), p = g.attributes.position;
    for (let i = 0; i < p.count; i++){ const x = p.getX(i), y = p.getY(i), z = p.getZ(i); p.setXYZ(i, x * .82, y * .42 * (1 - .28 * Math.max(0, z / .5)), z * .56); }
    g.computeVertexNormals(); G.canopy = g;
  }
  { // motor: stator base, copper windings, bell with vents, shaft and nut (all lathed)
    const lathe = (pts, n = 40) => new T.LatheGeometry(pts.map(([r, y]) => new T.Vector2(r, y)), n);
    G.base = lathe([[0, 0], [.15, 0], [.165, .012], [.165, .038], [.14, .05], [0, .05]]);
    G.wind = lathe([[.06, .05], [.135, .05], [.138, .07], [.135, .09], [.06, .09]], 36);
    G.bell = lathe([[.148, .085], [.156, .09], [.158, .2], [.15, .214], [.11, .222], [.04, .224], [.02, .232], [0, .232]], 48);
    G.vents = mergeG([0, 1, 2, 3, 4, 5].map(i => tf(new T.BoxGeometry(.04, .016, .02), Math.cos(i * Math.PI / 3) * .09, .222, Math.sin(i * Math.PI / 3) * .09, 0, -i * Math.PI / 3, 0)));
    G.slits = mergeG(Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return tf(new T.BoxGeometry(.006, .07, .03), Math.cos(a) * .156, .15, Math.sin(a) * .156, 0, -a, 0); }));
    G.shaft = new T.CylinderGeometry(.014, .014, .07, 12); G.nut = new T.CylinderGeometry(.032, .032, .028, 6);
    G.ring = new T.TorusGeometry(.172, .011, 8, 48);
  }
  { // tri-blade prop: a curved planform, twisted from 26° at the root to 8° at the tip
    const N = 16, R0 = .05, R1 = .5, le = [], te = [];
    for (let i = 0; i <= N; i++){ const t = i / N, r = R0 + (R1 - R0) * t, c = .028 + .085 * Math.sin(Math.PI * (.12 + .78 * t)), sw = .035 * t * t; le.push([r, c * .38 + sw]); te.push([r, -c * .62 + sw]); }
    const s = new T.Shape(); s.moveTo(te[0][0], te[0][1]); s.lineTo(le[0][0], le[0][1]); for (let i = 1; i <= N; i++) s.lineTo(le[i][0], le[i][1]);
    s.quadraticCurveTo(R1 + .03, (le[N][1] + te[N][1]) / 2, te[N][0], te[N][1]); for (let i = N - 1; i >= 0; i--) s.lineTo(te[i][0], te[i][1]);
    const one = ext(s, .009, .003, 6), p = one.attributes.position;
    for (let i = 0; i < p.count; i++){ const x = p.getX(i), y = p.getY(i), z = p.getZ(i), t = clamp((x - R0) / (R1 - R0), 0, 1), a = .46 - .32 * t, cy = y + .012 * Math.sin(Math.PI * t); p.setXYZ(i, x, cy * Math.cos(a) - z * Math.sin(a), cy * Math.sin(a) + z * Math.cos(a)); }
    one.computeVertexNormals();
    G.blades = mergeG([0, 1, 2].map(k => tf(k ? one.clone() : one, 0, 0, 0, 0, k * Math.PI * 2 / 3, 0)));
    G.hub = new T.CylinderGeometry(.055, .06, .045, 24); G.disc = new T.CircleGeometry(.53, 64);
  }
  { // battery, straps, leads with an XT60 plug
    G.batt = rbox(.86, .22, .4, .05); G.band = rbox(.07, .245, .425, .012); G.buckle = new T.BoxGeometry(.075, .02, .06); G.label = new T.PlaneGeometry(.62, .155); G.pad = new T.BoxGeometry(.6, .015, .3);
    const lead = (x0, z0) => new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(-.43, .05, z0), new T.Vector3(-.55, .09, z0 * 1.4), new T.Vector3(-.6, .2, z0), new T.Vector3(-.5, .3, x0)]), 24, .016, 8);
    G.leadR = lead(.025, .045); G.leadB = lead(-.025, -.045); G.xt60 = rbox(.07, .06, .12, .01);
  }
  { // FPV camera: rounded body, stepped lens barrel, glass, side mounts
    G.cam = rbox(.19, .19, .16, .035);
    G.lens = new T.LatheGeometry([[.0, .0], [.07, .0], [.07, .04], [.062, .045], [.062, .1], [.052, .105], [.05, .12], [0, .12]].map(([r, y]) => new T.Vector2(r, y)), 32); G.lens.rotateX(Math.PI / 2);
    G.glass = new T.SphereGeometry(.047, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2.4); G.glass.rotateX(Math.PI / 2);
    const m = rr(new T.Shape(), 0, 0, .2, .22, .05); m.holes.push(hole(0, 0, .02)); G.mount = ext(m, .02, .004); G.mount.rotateZ(Math.PI / 2);
  }
  { // VTX antenna on the tail, and two thin receiver whips
    G.ant = new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(0, 0, 0), new T.Vector3(0, .1, -.04), new T.Vector3(0, .26, -.16), new T.Vector3(0, .36, -.3)]), 20, .014, 8);
    G.antTip = new T.SphereGeometry(.05, 20, 12); G.antTip.scale(1, .7, 1);
    G.whip = new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(0, 0, 0), new T.Vector3(0, .02, -.12), new T.Vector3(0, .04, -.3)]), 10, .005, 5);
  }
  { // landing legs: one bent tube per side
    const leg = sx => new T.TubeGeometry(new T.CatmullRomCurve3([[.28, .02, -.25], [.36, -.2, -.31], [.42, -.42, -.3], [.43, -.48, -.15], [.43, -.48, .15], [.42, -.42, .3], [.36, -.2, .31], [.28, .02, .25]].map(([x, y, z]) => new T.Vector3(x * sx, y, z)), false, 'catmullrom', .3), 48, .018, 8);
    G.legL = leg(-1); G.legR = leg(1); G.foot = new T.SphereGeometry(.03, 12, 8);
  }
  G.crate = rbox(.34, .3, .34, .04); G.cord = new T.CylinderGeometry(.008, .008, .3, 6);
  G.sbase = new T.LatheGeometry([[0, 0], [.88, 0], [.9, .02], [.86, .07], [.62, .1], [.1, .11], [0, .11]].map(([r, y]) => new T.Vector2(r, y)), 64);
  G.pole = new T.CylinderGeometry(.04, .06, 2.6, 24); G.pole.translate(0, 1.3, 0); G.joint = new T.SphereGeometry(.085, 24, 16);
  G.streak = new T.BoxGeometry(1.4, .014, .014);

  const mesh = (g, m) => { const o = new T.Mesh(g, m); o.castShadow = true; o.receiveShadow = true; return o; };
  const ledBase = col(0xe6ecf8), ledAI = col(0x34c26b), glow = col(0x9cc8ff);

  const WN = TOUCH ? 12 : 26, WL = 1.5; // prop wash: motes per propeller, and how far below it they travel
  let rigN = 0;
  function buildRig(){
    const root = new T.Group(), tilt = new T.Group(); root.add(tilt); scene.add(root);
    const parts = [], props = [], leds = [], skids = [], r = {}, rnd = seedR(41 + 17 * rigN++);
    const wash = { n: 4 * WN, p: new Float32Array(12 * WN), c: new Float32Array(12 * WN), life: new Float32Array(4 * WN), ang: new Float32Array(4 * WN), rad: new Float32Array(4 * WN), mx: [], mz: [], sx: [] };
    // every piece keeps a home position and an exploded offset; t is when, along the explosion, it starts to move
    const part = (o, px, py, pz, dx, dy, dz, t) => { o.position.set(px, py + Y0, pz); tilt.add(o); parts.push({ o, h: o.position.clone(), d: new T.Vector3(dx, dy, dz), t }); return o; };
    const grp = (...kids) => { const g = new T.Group(); for (const [geo, mat, x = 0, y = 0, z = 0] of kids){ const m = mesh(geo, mat); m.position.set(x, y, z); g.add(m); } return g; };

    part(mesh(G.plateB, M.carbon), 0, -.07, 0, 0, -.28, 0, .1);
    const so = new T.Group(); for (const [x, z] of [[-.33, -.19], [.33, -.19], [-.33, .19], [.33, .19]]){ const m = mesh(G.standoff, M.anod); m.position.set(x, 0, z); so.add(m); const sc = mesh(G.screw, M.metal); sc.position.set(x, .076, z); so.add(sc); }
    part(so, 0, .01, 0, 0, .6, 0, .06);
    part(grp([G.escb, M.esc], [G.fet, M.chip, 0, .016, 0], [G.cap, M.dark, -.25, .0, .1]), 0, -.025, 0, 0, .1, 0, .05);
    const pcbM = M.pcb.clone(), imuM = M.chip.clone(); pcbM.emissive = glow.clone(); pcbM.emissiveIntensity = 0; imuM.emissive = glow.clone(); imuM.emissiveIntensity = 0;
    const fc = grp([G.mcu, M.chip, .045, .019, .02], [G.pins, M.metal, .045, .011, .02], [G.plug, M.band, 0, .023, -.165]); const fcb = mesh(G.fcb, pcbM); fc.add(fcb); part(fc, 0, .03, 0, 0, .38, 0, .05);
    const imu = part(mesh(G.imu, imuM), -.09, .048, -.07, -.32, .82, 0, 0);
    part(mesh(G.plateT, M.carbon), 0, .085, 0, 0, 1.12, 0, .12);
    part(mesh(G.canopy, M.shell), 0, .1, -.02, 0, 1.62, 0, .2);
    const ant = grp([G.ant, M.dark], [G.antTip, M.shell, 0, .36, -.3], [G.whip, M.dark, .2, -.02, .05], [G.whip, M.dark, -.2, -.02, .05]); ant.children[3].rotation.y = .5; ant.children[2].rotation.y = -.5;
    part(ant, 0, .1, -.3, 0, .9, -.8, .22);
    const bat = grp([G.batt, M.batt], [G.band, M.band, -.22, 0, 0], [G.band, M.band, .22, 0, 0], [G.buckle, M.dark, -.22, -.125, 0], [G.buckle, M.dark, .22, -.125, 0], [G.leadR, M.red], [G.leadB, M.dark], [G.xt60, M.yellow, -.5, .3, 0], [G.pad, M.rubber, 0, .115, 0]);
    for (const zs of [1, -1]){ const lb = mesh(G.label, M.label); lb.position.set(0, -.005, zs * .2025); if (zs < 0) lb.rotation.y = Math.PI; bat.add(lb); }
    part(bat, 0, -.24, 0, 0, -.82, 0, .15);
    const cg = grp([G.cam, M.dark], [G.lens, M.anod, 0, 0, .08], [G.glass, M.glass, 0, 0, .2], [G.mount, M.rubber, -.11, 0, 0], [G.mount, M.rubber, .11, 0, 0]); cg.rotation.x = -.28;
    part(cg, 0, .0, .44, 0, -.15, .95, .18);
    for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]){
      const dx = sx * Math.SQRT1_2, dz = sz * Math.SQRT1_2, mx = sx * 1.12, mz = sz * 1.12, rad = 1.584 - G.armL;
      const arm = mesh(G.arm, M.carbon); arm.rotation.y = -Math.atan2(sz, sx); part(arm, dx * rad, -.015, dz * rad, dx * .3, 0, dz * .3, .08);
      const mg = grp([G.base, M.anod], [G.wind, M.copper], [G.bell, M.bell], [G.slits, M.dark], [G.vents, M.dark], [G.shaft, M.metal, 0, .26, 0]);
      const lm = new T.MeshBasicMaterial({ color: ledBase.clone() }), ring = new T.Mesh(G.ring, lm); ring.rotation.x = Math.PI / 2; ring.position.y = .006; mg.add(ring); leds.push({ m: lm, sx });
      part(mg, mx, .013, mz, dx * .85, .12, dz * .85, .14);
      const pg = new T.Group(), bl = mesh(G.blades, M.blade); if (sx * sz < 0) bl.scale.z = -1; pg.add(bl); pg.add(mesh(G.hub, M.dark)); const nut = mesh(G.nut, M.metal); nut.position.y = .035; pg.add(nut);
      const disc = new T.Mesh(G.disc, M.disc); disc.rotation.x = -Math.PI / 2; disc.position.y = .004; pg.add(disc); pg.rotation.y = Math.random() * 3;
      part(pg, mx, .29, mz, dx * .85, .72, dz * .85, .22); props.push({ o: pg, dir: sx * sz, sx });
      if (sz > 0){ if (sx < 0){ r.motorL = mg; r.propL = pg; } else { r.motorR = mg; r.propR = pg; } }
      wash.mx.push(mx); wash.mz.push(mz); wash.sx.push(sx);
    }
    // prop wash: motes of light drawn down through each propeller. They fall faster and burn brighter under a motor that works harder,
    // so the difference between the two sides can be seen in the air itself
    for (let j = 0; j < wash.n; j++){ wash.life[j] = rnd(); wash.ang[j] = rnd() * 6.283; wash.rad[j] = .08 + .4 * Math.sqrt(rnd()); }
    // each mote is a bright head (a point) with a tail above it (a line that fades to nothing), so the air reads as moving down even in a still frame
    const wg = new T.BufferGeometry(); wg.setAttribute('position', new T.BufferAttribute(wash.p, 3)); wg.setAttribute('color', new T.BufferAttribute(wash.c, 3));
    wash.lp = new Float32Array(24 * WN); wash.lc = new Float32Array(24 * WN); const lg = new T.BufferGeometry(); lg.setAttribute('position', new T.BufferAttribute(wash.lp, 3)); lg.setAttribute('color', new T.BufferAttribute(wash.lc, 3));
    wash.o = new T.Group(); wash.pts = new T.Points(wg, new T.PointsMaterial({ size: .05, map: dotMap, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending, sizeAttenuation: true }));
    wash.lines = new T.LineSegments(lg, new T.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
    wash.pts.frustumCulled = wash.lines.frustumCulled = false; wash.o.add(wash.pts, wash.lines); wash.o.visible = false; tilt.add(wash.o);
    for (const sx of [-1, 1]){ const sg = new T.Group(); sg.add(mesh(sx < 0 ? G.legL : G.legR, M.carbon)); for (const z of [-.15, .15]){ const f = mesh(G.foot, M.rubber); f.position.set(sx * .43, -.48, z); sg.add(f); } part(sg, 0, -.1, 0, sx * .28, -1.0, 0, .25); skids.push(sg); }
    const crate = grp([G.crate, M.crate], [G.cord, M.dark, 0, .3, 0]); crate.position.set(1.12, Y0 - .45, 1.12); crate.scale.setScalar(.001); tilt.add(crate);
    const stand = new T.Group(); const base = mesh(G.sbase, M.stand); stand.add(base); stand.add(mesh(G.pole, M.stand)); const j = mesh(G.joint, M.metal); j.position.y = 2.6; stand.add(j); stand.position.set(0, FLOOR, 0); scene.add(stand);
    const ring = new T.Mesh(ringG, ringM); ring.rotation.x = -Math.PI / 2; ring.position.y = FLOOR + .012; ring.renderOrder = 1; scene.add(ring);
    // the opening: every piece also knows where it flies in from, how it tumbles on the way, and when it sets off. The core arrives
    // first and the canopy last, the order the drone would be built in. er is a small twist each piece makes while the drone comes apart
    for (const p of parts){ const dl = p.d.length(), dir = dl > .05 ? p.d.clone().multiplyScalar(1 / dl) : new T.Vector3(rnd() - .5, rnd() - .5, rnd() - .5).normalize();
      dir.x += (rnd() - .5) * .5; dir.y += (rnd() - .5) * .3; dir.z += (rnd() - .5) * .5; p.iv = dir.multiplyScalar(5.5 + rnd() * 3.5);
      p.ir = new T.Vector3((rnd() - .5) * 5, (rnd() - .5) * 5, (rnd() - .5) * 5); p.er = new T.Vector3((rnd() - .5) * .45, (rnd() - .5) * .7, (rnd() - .5) * .45);
      p.it = Math.min(.4, dl * .24) + rnd() * .06; p.r0 = p.o.rotation.clone(); p.spin = props.some(q => q.o === p.o); }
    return Object.assign(r, { root, tilt, parts, props, leds, skids, crate, stand, ring, imu, fc, pcbM, imuM, wash, fl: 0, th: 0, u: 0, mix: 0, load: 0, weak: 0, x: 0, y: 0, s: 1 });
  }
  const A = buildRig(), B = buildRig();
  const streaks = []; const sm = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
  for (let i = 0; i < 14; i++){ const s = new T.Mesh(G.streak, sm.clone()); s.visible = false; scene.add(s); streaks.push({ o: s, v: 0, life: 0 }); }

  /* the field: every drone is one instance of three shared meshes */
  const mat4 = (x, y, z, rx, ry, sx, sy, sz) => new T.Matrix4().compose(new T.Vector3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(rx, ry, 0)), new T.Vector3(sx, sy, sz));
  const merge = list => { let n = 0; const ps = list.map(([g, m]) => { const q = g.toNonIndexed(); q.applyMatrix4(m); n += q.attributes.position.array.length; return q; }); const pos = new Float32Array(n), nor = new Float32Array(n); let o = 0;
    for (const q of ps){ pos.set(q.attributes.position.array, o); nor.set(q.attributes.normal.array, o); o += q.attributes.position.array.length; q.dispose(); }
    const out = new T.BufferGeometry(); out.setAttribute('position', new T.BufferAttribute(pos, 3)); out.setAttribute('normal', new T.BufferAttribute(nor, 3)); return out; };
  const corners = [[-1, 1], [1, 1], [-1, -1], [1, -1]];
  const gBody = merge([[new T.BoxGeometry(3.3, .07, .15), mat4(0, Y0, 0, 0, Math.PI / 4, 1, 1, 1)], [new T.BoxGeometry(3.3, .07, .15), mat4(0, Y0, 0, 0, -Math.PI / 4, 1, 1, 1)], [new T.BoxGeometry(.95, .2, .6), mat4(0, Y0 + .02, 0, 0, 0, 1, 1, 1)],
    [new T.SphereGeometry(.46, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2), mat4(0, Y0 + .1, 0, 0, 0, 1.05, .6, .72)], ...corners.map(([sx, sz]) => [new T.CylinderGeometry(.17, .19, .24, 10), mat4(sx * 1.12, Y0 + .1, sz * 1.12, 0, 0, 1, 1, 1)])]);
  const gDisc = merge(corners.map(([sx, sz]) => [new T.CircleGeometry(.54, 18), mat4(sx * 1.12, Y0 + .3, sz * 1.12, -Math.PI / 2, 0, 1, 1, 1)]));
  const gStand = merge([[new T.CylinderGeometry(.05, .07, 2.6, 8), mat4(0, -1.3, 0, 0, 0, 1, 1, 1)], [new T.CylinderGeometry(.5, .62, .1, 16), mat4(0, -2.55, 0, 0, 0, 1, 1, 1)]]);
  const mBody = new T.MeshStandardMaterial({ color: 0xffffff, metalness: .55, roughness: .42, transparent: true }), mDisc = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .6, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending, toneMapped: false }), mStand = new T.MeshStandardMaterial({ color: col(0x55555c), metalness: .85, roughness: .4, transparent: true });
  const iBody = new T.InstancedMesh(gBody, mBody, SWN), iDisc = new T.InstancedMesh(gDisc, mDisc, SWN), iStand = new T.InstancedMesh(gStand, mStand, SWN), swG = new T.Group(); swG.add(iStand, iBody, iDisc); swG.visible = false; scene.add(swG);
  for (const m of [iBody, iDisc, iStand]) m.frustumCulled = false;
  iDisc.instanceMatrix = iBody.instanceMatrix; iDisc.renderOrder = 2;
  iBody.instanceColor = new T.InstancedBufferAttribute(new Float32Array(SWN * 3).fill(.8), 3); iDisc.instanceColor = new T.InstancedBufferAttribute(new Float32Array(SWN * 3).fill(.15), 3);
  const PIV = FLOOR + 2.6 * SWL.s, vth = new Float32Array(SWN);
  { const m = new T.Matrix4(); for (let a = 0; a < SWN; a++){ m.makeScale(SWL.s, SWL.s, SWL.s); m.setPosition(swPos.px[a], PIV, swPos.pz[a]); iStand.setMatrixAt(a, m); } iStand.instanceMatrix.needsUpdate = true; }

  /* the finishing pass: the brightest parts of the frame bleed light, the way a lens does. The finished frame is copied
     off the screen, so the scene itself is still drawn directly, with the browser's own antialiasing, and nothing is lost
     if this fails. Seven small passes at a quarter and an eighth of the resolution. A phone that cannot keep up gives it back. */
  const post = (() => {
    const none = { on: false, k: 1, size(){}, run(){}, pace(){} };
    try {
      const cam2 = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1), sc2 = new T.Scene(), quad = new T.Mesh(new T.PlaneGeometry(2, 2)); quad.frustumCulled = false; sc2.add(quad);
      const rt = () => new T.WebGLRenderTarget(4, 4, { minFilter: T.LinearFilter, magFilter: T.LinearFilter, depthBuffer: false, stencilBuffer: false });
      const a4 = rt(), b4 = rt(), a8 = rt(), b8 = rt(), zero = new T.Vector2(), sz = new T.Vector2(); let fb = null, lag = 0, fade = 1;
      const VS = 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
      const mat = (fs, u, o) => new T.ShaderMaterial(Object.assign({ vertexShader: VS, fragmentShader: fs, uniforms: u, depthTest: false, depthWrite: false, blending: T.NoBlending }, o));
      const mCut = mat('uniform sampler2D t;uniform vec2 px;varying vec2 vUv;void main(){vec3 c=(texture2D(t,vUv+px*vec2(-1.,-1.)).rgb+texture2D(t,vUv+px*vec2(1.,-1.)).rgb+texture2D(t,vUv+px*vec2(-1.,1.)).rgb+texture2D(t,vUv+px).rgb)*.25;float l=max(c.r,max(c.g,c.b));gl_FragColor=vec4(c*smoothstep(.62,.98,l),1.);}', { t: { value: null }, px: { value: new T.Vector2() } });
      const mBlur = mat('uniform sampler2D t;uniform vec2 d;varying vec2 vUv;void main(){vec3 c=texture2D(t,vUv).rgb*.227027;c+=(texture2D(t,vUv+d*1.384615).rgb+texture2D(t,vUv-d*1.384615).rgb)*.316216;c+=(texture2D(t,vUv+d*3.230769).rgb+texture2D(t,vUv-d*3.230769).rgb)*.07027;gl_FragColor=vec4(c,1.);}', { t: { value: null }, d: { value: new T.Vector2() } });
      const mAdd = mat('uniform sampler2D a;uniform sampler2D b;uniform float k;varying vec2 vUv;void main(){vec3 g=(texture2D(a,vUv).rgb*.55+texture2D(b,vUv).rgb*.85)*k;gl_FragColor=vec4(g,max(g.r,max(g.g,g.b)));}', { a: { value: a4.texture }, b: { value: a8.texture }, k: { value: 1 } },
        { blending: T.CustomBlending, blendEquation: T.AddEquation, blendSrc: T.OneFactor, blendDst: T.OneFactor, transparent: true });
      const pass = (m, target) => { quad.material = m; R.setRenderTarget(target); R.render(sc2, cam2); };
      const blur = (src, tmp, dst, sx, sy) => { mBlur.uniforms.t.value = src.texture; mBlur.uniforms.d.value.set(sx / src.width, 0); pass(mBlur, tmp); mBlur.uniforms.t.value = tmp.texture; mBlur.uniforms.d.value.set(0, sy / tmp.height); pass(mBlur, dst); };
      return { on: true, k: 1,
        size(){ R.getDrawingBufferSize(sz); const w = Math.max(8, sz.x), h = Math.max(8, sz.y); if (fb) fb.dispose(); fb = new T.DataTexture(null, w, h, T.RGBAFormat); fb.minFilter = fb.magFilter = T.LinearFilter;
          mCut.uniforms.px.value.set(1 / w, 1 / h); a4.setSize(w >> 2, h >> 2); b4.setSize(w >> 2, h >> 2); a8.setSize(w >> 3, h >> 3); b8.setSize(w >> 3, h >> 3); },
        run(){ if (!fb) this.size();
          R.copyFramebufferToTexture(zero, fb); mCut.uniforms.t.value = fb; pass(mCut, a4);
          blur(a4, b4, a4, 1, 1); blur(a4, b8, a8, 2, 1); blur(a8, b8, a8, 1.6, 1.6);
          mAdd.uniforms.k.value = this.k * fade; R.autoClear = false; pass(mAdd, null); R.autoClear = true; },
        pace(dt){ // only phones: two seconds below 25 frames a second, and the glow fades out for good
          if (!TOUCH || !this.on) return; if (fade < 1){ fade -= dt * 2.5; if (fade <= 0) this.on = false; return; }
          lag = dt > .04 ? lag + dt : Math.max(0, lag - dt); if (lag > 2) fade = .99; } };
    } catch (e) { return none; }
  })();
  // on a desk the camera leans a little toward the pointer, so the scene feels like an object and not a picture
  // While a button is held the camera stays where it is, so nothing moves under a drag.
  let ptx = 0, pty = 0, plx = 0, ply = 0, aiK = 0, held = false;
  if (!TOUCH && !RM){ const o = { passive: true }, up = () => { held = false; };
    addEventListener('pointermove', e => { if (held) return; ptx = e.clientX / innerWidth * 2 - 1; pty = e.clientY / innerHeight * 2 - 1; }, o);
    addEventListener('pointerdown', () => { held = true; }, o); addEventListener('pointerup', up, o); addEventListener('pointercancel', up, o); }
  let W = 1, H = 1, narrow = false, tt = 0, yaw = 0, SH = ST.map(s => s.shot);
  /* the moments that are staged rather than simulated. intro: the opening, in which the drone builds itself out of the dark while the
     camera swings around it. fl (per drone): its lights coming on. sweep: a light that crosses the drone each time a station opens, so the
     highlights slide along the canopy and the motor bells. shake: the camera takes a gust too. All of it is off under reduced motion. */
  const INTRO = 3.1, IGN = .88, FOV = 32;
  let intro = RM ? 1 : 0, ignited = RM, sweep = 1, shake = 0, shSg = 1, fov = FOV;
  const sweepL = new T.PointLight(0xe4edff, 0, 8); scene.add(sweepL); // short reach: it lights the drone and fades before the floor
  const cSweep = col(0xe4edff), cSweepAI = col(0x9ff0c8), fwd = new T.Vector3();
  // a ring of light that opens around a drone at the moments that deserve one: the lights coming on, a network finishing its training
  const haloMap = tex(256, 256, (g, w) => { const c = w / 2, gr = g.createRadialGradient(c, c, 0, c, c, c); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.55, 'rgba(255,255,255,0)'); gr.addColorStop(.86, 'rgba(255,255,255,.2)'); gr.addColorStop(.93, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); }, false);
  const halos = [0, 1].map(() => { const m = new T.Mesh(new T.PlaneGeometry(2, 2), new T.MeshBasicMaterial({ map: haloMap, color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, toneMapped: false })); m.rotation.x = -Math.PI / 2; m.visible = false; m.renderOrder = 3; scene.add(m); return { o: m, t: 1, d: 0 }; });
  const pulse = (r, hex) => { if (RM) return; halos.forEach((h, i) => { h.t = 0; h.d = i * .16; h.o.material.color.set(hex); h.o.position.set(r.x, r.y + (Y0 + .1) * r.s, 0); h.s = r.s; }); r.fl = Math.max(r.fl, .7); };
  const was = new Uint8Array(SWN).fill(1); // which drones of the field were still flying a frame ago
  const NS = 11, cur = ST[0].shot.slice(); if (RM){ cur[2] = 15; cur[0] = 62; } else { cur[0] = 150; cur[1] = 2; cur[2] = 14; } // the opening starts behind the drone, low and far, and swings round to the front
  const tgt = cur.slice(), v3 = new T.Vector3(), rt = new T.Vector3(), up = new T.Vector3(), ctr = new T.Vector3(), shade = $('#shade');
  let lastSt = -1;
  const proj = (x, y, z) => { v3.set(x, y, z).project(cam); return [(v3.x * .5 + .5) * W, (-v3.y * .5 + .5) * H]; };
  const projO = o => { o.getWorldPosition(v3); return proj(v3.x, v3.y, v3.z); };
  // iu runs from 0 to 1 while the drone assembles itself at the opening, and stays at 1 afterwards
  function poseRig(r, ex, stand, twinX, vis, sc, inp, dt, paused, hlW, hl, iu = 1){
    r.root.visible = vis > .02; r.stand.visible = vis > .02 && stand > .02; r.x = twinX; r.s = Math.max(.001, vis * sc); r.ring.visible = r.root.visible; if (!r.root.visible) return;
    r.ring.position.x = twinX; r.ring.scale.setScalar(r.s);
    const bob = (RM || paused) ? 0 : Math.sin(tt * 1.3) * .07;
    r.y = (1 - stand) * (.6 + bob + ex * .35) - 2.6 * (1 - sc) * stand;
    r.root.position.set(twinX, r.y, 0); r.root.scale.setScalar(r.s); r.stand.position.x = twinX; r.stand.scale.set(r.s, Math.max(.001, stand * r.s), r.s);
    const a = 1 - Math.exp(-dt * 30), sway = (RM || paused) ? 0 : Math.sin(tt * .9) * 1.6 * (1 - stand);
    r.th += ((inp.th === undefined ? sway : inp.th) - r.th) * a; r.u += ((inp.u || 0) - r.u) * a; r.tilt.rotation.z = -r.th * Math.PI / 180;
    r.mix += ((inp.ai ? 1 : 0) - r.mix) * (1 - Math.exp(-dt * 5)); r.load += ((inp.load ? 1 : 0) - r.load) * (1 - Math.exp(-dt * 12)); r.weak += ((inp.weak ? 1 : 0) - r.weak) * (1 - Math.exp(-dt * 6)); r.crate.scale.setScalar(Math.max(.001, r.load));
    for (const p of r.parts){ const t = clamp((ex - p.t) / .75, 0, 1), e = t * t * (3 - 2 * t), tw = RM ? 0 : Math.sin(Math.PI * e); let x = p.h.x + p.d.x * e, y = p.h.y + p.d.y * e, z = p.h.z + p.d.z * e, k = 0;
      if (iu < 1){ const u = clamp((iu - p.it) / .52, 0, 1); k = Math.pow(2, -9 * u) * (1 - u); p.o.visible = u > 0; x += p.iv.x * k; y += p.iv.y * k; z += p.iv.z * k; } else p.o.visible = true;
      p.o.position.set(x, y, z); p.o.rotation.x = p.r0.x + p.ir.x * k + p.er.x * tw; p.o.rotation.z = p.r0.z + p.ir.z * k + p.er.z * tw; if (!p.spin) p.o.rotation.y = p.r0.y + p.ir.y * k + p.er.y * tw; }
    for (const s of r.skids) s.scale.setScalar(Math.max(.001, 1 - stand));
    // the motors wake up as the last pieces lock in: the propellers spin up, then the lights come on with a flash
    const all = hl === 3, su = clamp((iu - .5) / .5, 0, 1), spin = su * su * (3 - 2 * su), lit = iu < IGN ? .03 : 1 + 3 * r.fl;
    for (const l of r.leds){ const th = clamp(.5 - l.sx * r.u / 200, 0, 1); l.m.color.copy(ledBase).lerp(ledAI, r.mix).multiplyScalar((.3 + 1.7 * th + (hl === 2 || all ? hlW * 1.5 : 0)) * (1 - .6 * r.weak) * lit); }
    if (!paused) for (const p of r.props){ const th = clamp(.5 - p.sx * r.u / 200, 0, 1); p.o.rotation.y += dt * p.dir * (26 + 44 * th) * (1 - .4 * r.weak) * spin; }
    r.imuM.emissiveIntensity = hlW * (hl === 0 || all ? 2.4 : .15); r.pcbM.emissiveIntensity = hlW * (hl === 1 || all ? 1.8 : .1);
    const w = r.wash, wk = RM ? 0 : clamp(1 - ex * 2.5, 0, 1) * spin * clamp(vis * 2 - 1, 0, 1); w.o.visible = wk > .02;
    if (w.o.visible){ const P = w.p, C = w.c, LP = w.lp, LC = w.lc, cr = ledBase.r + (ledAI.r - ledBase.r) * r.mix, cg = ledBase.g + (ledAI.g - ledBase.g) * r.mix, cb = ledBase.b + (ledAI.b - ledBase.b) * r.mix, top = Y0 + .25;
      for (let j = 0; j < w.n; j++){ const q = (j / WN) | 0, th = clamp(.5 - w.sx[q] * r.u / 200, 0, 1) * (1 - .4 * r.weak); let l = w.life[j];
        if (!paused){ l += dt * (.45 + 1.9 * th); if (l >= 1){ l -= Math.floor(l); w.ang[j] = Math.random() * 6.283; w.rad[j] = .08 + .4 * Math.sqrt(Math.random()); } w.life[j] = l; }
        const rd = w.rad[j] * (1 - .3 * l), o = j * 3, o2 = j * 6, b = Math.sin(Math.PI * l) * (.1 + .9 * th) * wk, x = w.mx[q] + Math.cos(w.ang[j] + l * 2.2) * rd, y = top - l * WL, z = w.mz[q] + Math.sin(w.ang[j] + l * 2.2) * rd;
        P[o] = x; P[o + 1] = y; P[o + 2] = z; C[o] = cr * b; C[o + 1] = cg * b; C[o + 2] = cb * b;
        LP[o2] = x; LP[o2 + 1] = y; LP[o2 + 2] = z; LP[o2 + 3] = x; LP[o2 + 4] = y + .06 + .2 * th; LP[o2 + 5] = z; LC[o2] = cr * b * .8; LC[o2 + 1] = cg * b * .8; LC[o2 + 2] = cb * b * .8; } // the tail's upper end stays black
      for (const g of [w.pts.geometry, w.lines.geometry]){ g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true; } }
  }
  return {
    flat: false, snap: false, hl: -1, live: false, rig: [A, B], proj, k: [0, 0, 0, 0],
    resize(){ W = cv.clientWidth || innerWidth; H = cv.clientHeight || innerHeight; R.setSize(W, H, false); cam.aspect = W / H; cam.updateProjectionMatrix(); narrow = W < 860; if (post.on) post.size();
      // keep each rig, and what is drawn around it, inside the part of the screen the text leaves free
      const colEl = $('#s1 .col'), cw = colEl ? colEl.getBoundingClientRect().width : W * .4, free = clamp(1 - (cw + 40) / W, .3, .75), k = 2 * Math.tan(FOV * Math.PI / 360) * cam.aspect;
      SH = ST.map(s => { const sh = s.shot.slice(); if (!narrow && s.need){ sh[3] = free / 2 - .5; sh[2] = Math.max(sh[2], s.need / (free * k)); } return sh; }); },
    gust(sg){ if (RM || !this.live) return; shake = 1; shSg = sg; for (const s of streaks){ s.life = .55 + Math.random() * .2; s.v = sg * (13 + Math.random() * 8); s.o.position.set(-sg * (3.5 + Math.random() * 3.5), -.6 + Math.random() * 2.2, -1.6 + Math.random() * 3.2); s.o.visible = true; } },
    bump(sg){ if (RM || !this.live) return; shake = 1.5; shSg = sg; },                       // a crash is felt in the camera
    pulse(i, hex){ if (this.live) pulse(i ? B : A, hex); },
    parts(){ // screen positions of the pieces the loop station points at, and a unit "up" at each front propeller for the thrust arrows
      const o = { imu: projO(A.imu), fc: projO(A.fc), mL: projO(A.motorL), mR: projO(A.motorR) }, t = A.th * Math.PI / 180, ux = Math.sin(t) * A.s, uy = Math.cos(t) * A.s;
      for (const [k, p] of [['tL', A.propL], ['tR', A.propR]]){ p.getWorldPosition(v3); const bx = v3.x + ux * .16, by = v3.y + uy * .16, bz = v3.z; o[k] = [proj(bx, by, bz), proj(bx + ux, by + uy, bz)]; }
      return o; },
    update(dt, f, st, inA, inB, paused, swm){
      if (!paused) tt += dt;
      const i0 = Math.min(NST - 1, Math.floor(f)), i1 = Math.min(NST - 1, i0 + 1); let t = clamp((f - i0 - .15) / .7, 0, 1); t = t * t * (3 - 2 * t);
      const S0 = RM ? SH[st] : SH[i0], S1 = RM ? S0 : SH[i1];
      for (let k = 0; k < NS; k++) tgt[k] = S0[k] + (S1[k] - S0[k]) * t;
      if (narrow){ tgt[3] = 0; tgt[4] = .06; tgt[2] *= Math.max(1.12, 1.15 / cam.aspect) * (1 + .42 * tgt[7]); }
      if (RM && st !== lastSt && lastSt >= 0){ cv.classList.add('cut'); cv.style.opacity = '0'; setTimeout(() => { cv.style.opacity = '1'; }, 120); }
      if (lastSt < 0 && f > .3){ intro = 1; this.snap = true; } // opened half way down the page (a reload): no opening, and the camera starts on its shot
      if (!RM && st !== lastSt && lastSt >= 0 && SH[st][8] < .5) sweep = 0; // a station with a drone opens: the light crosses it
      lastSt = st;
      // the opening plays once, at the top of the page. Leaving the first station, or arriving anywhere else, finishes it quickly
      if (intro < 1){ if (this.snap) intro = 1; else intro = Math.min(1, intro + dt / INTRO * (f > .3 ? 6 : 1)); }
      if (!ignited && intro >= IGN){ ignited = true; if (!RM && f < .5){ sweep = 0; pulse(A, 0xffffff); A.fl = 1; } }
      A.fl *= Math.exp(-dt * 2.6); B.fl *= Math.exp(-dt * 2.6);
      // the lens opens a little while the camera travels and closes as it arrives, so a move between stations has some speed in it
      const mv = RM ? 0 : clamp(Math.abs(tgt[0] - cur[0]) / 70 + Math.abs(tgt[1] - cur[1]) / 36 + Math.abs(tgt[2] - cur[2]) / 7, 0, 1);
      fov += (FOV + 7 * mv - fov) * (1 - Math.exp(-dt * 5)); if (Math.abs(fov - cam.fov) > .005){ cam.fov = fov; cam.updateProjectionMatrix(); }
      const a = (this.snap || RM) ? 1 : 1 - Math.exp(-dt * (intro < 1 ? 1.35 + 2.85 * intro * intro : 4.2)); this.snap = false;
      for (let k = 0; k < NS; k++) cur[k] += (tgt[k] - cur[k]) * a;
      const [az0, el, dist, ox, oy, ex, stand, twin, dim, spin, swp] = cur, az = az0 + (RM ? 0 : Math.sin(tt * .33) * 4 * ex); // over the opened-up drone the camera drifts a few degrees, so its layers slide past each other
      if (!RM && !paused && spin > .02) yaw += dt * .32 * spin; else if (spin <= .02){ const yt = Math.round(yaw / (Math.PI * 2)) * Math.PI * 2; yaw += (yt - yaw) * (1 - Math.exp(-dt * 5)); }
      const w = i => clamp(1 - Math.abs(f - i) * 2.6, 0, 1); this.k[0] = w(1); this.k[1] = w(2) * ex; this.k[2] = w(3); this.k[3] = w(5) * twin;
      const sc = 1 - (1 - SWL.s) * swp; // on the way to the field the hero drone shrinks into one of the many
      poseRig(A, ex, stand, -1.95 * twin, swp > .93 ? 0 : 1, sc, inA, dt, paused, this.k[1], this.hl, intro); A.root.rotation.y = yaw;
      poseRig(B, 0, stand, 1.95 * twin, twin, sc, inB, dt, paused, 0, -1);
      const kp = 1 - Math.exp(-dt * 2.6); plx += (ptx - plx) * kp; ply += (pty - ply) * kp;
      ctr.set(0, .62 + ex * .5 + (1 - stand) * .5 - 1.9 * swp, 0); const ar = (az + plx * 3.2) * Math.PI / 180, er = (el - ply * 1.5) * Math.PI / 180;
      aiK += ((st === 5 || st === 6 ? 1 : 0) - aiK) * (1 - Math.exp(-dt * 2)); rim.color.copy(cRim).lerp(cRimAI, aiK * .7); warm.color.copy(cWarm).lerp(cWarmAI, aiK);
      if (!paused && !RM){ dust[0].rotation.y = tt * .017; dust[1].rotation.y = -tt * .011; dust[0].position.y = Math.sin(tt * .13) * .3; dust[1].position.y = Math.cos(tt * .09) * .3; }
      dustM.opacity = .42 * (1 - swp); ringM.opacity = .22 * (1 - swp) * (1 - .6 * ex); warm.intensity = (narrow ? .55 : .95) * (1 - .85 * swp);
      cam.position.set(ctr.x + dist * Math.sin(ar) * Math.cos(er), ctr.y + dist * Math.sin(er), ctr.z + dist * Math.cos(ar) * Math.cos(er)); cam.lookAt(ctr); cam.updateMatrixWorld();
      const hh = 2 * dist * Math.tan(cam.fov * Math.PI / 360), e = cam.matrixWorld.elements; rt.set(e[0], e[1], e[2]); up.set(e[4], e[5], e[6]);
      fwd.copy(cam.position).sub(ctr).normalize();
      cam.position.addScaledVector(rt, -ox * hh * cam.aspect).addScaledVector(up, -oy * hh);
      if (shake > .01){ shake *= Math.exp(-dt * 6.5); const s = shake * shake * dist / 8; cam.position.addScaledVector(rt, (Math.sin(tt * 53) * .045 + shSg * .05) * s).addScaledVector(up, Math.sin(tt * 67 + 1) * .03 * s); }
      cam.updateMatrixWorld();
      if (sweep < 1){ sweep = Math.min(1, sweep + dt / 1.5); const s = Math.sin(Math.PI * sweep); sweepL.intensity = 5 * s * s * (1 - swp); sweepL.color.copy(cSweep).lerp(cSweepAI, aiK);
        sweepL.position.copy(ctr).addScaledVector(rt, (sweep - .5) * 11).addScaledVector(up, 2.3).addScaledVector(fwd, 3.2); } else sweepL.intensity = 0;
      for (const h of halos){ if (h.t >= 1){ h.o.visible = false; continue; } if (h.d > 0){ h.d -= dt; continue; } h.t = Math.min(1, h.t + dt / 1.15); const e = 1 - Math.pow(1 - h.t, 3); h.o.visible = true; h.o.scale.setScalar((.5 + 6.5 * e) * h.s); h.o.material.opacity = .85 * (1 - h.t) * (1 - h.t); }
      scene.fog.near = dist * 1.3; scene.fog.far = dist * 4 + 8; // the floor fades out before its edge, so there is no horizon line
      for (const s of streaks){ if (!s.o.visible) continue; s.life -= dt; s.o.position.x += s.v * dt; s.o.material.opacity = clamp(s.life * 1.2, 0, .32); if (s.life <= 0) s.o.visible = false; }
      swG.visible = swp > .03; floor.visible = swG.visible; pool.material.opacity = 1 - .55 * swp; // the wide floor only under the swarm: elsewhere its far edge read as a horizon line
      if (swG.visible){
        const p = swm.pop, kt = 1 - Math.exp(-dt * 26), kc = 1 - Math.exp(-dt * 11), Mx = iBody.instanceMatrix.array, cb = iBody.instanceColor.array, cd = iDisc.instanceColor.array, s = SWL.s, idle = swm.state === 'idle', sel = swm.state === 'select';
        // when the training is over a wave of light runs out from the middle of the field, and each drone rises a little as it passes
        const wave = swm.state === 'done' && swm.tDone < 3.4, wr = swm.tDone * 21 - 4;
        for (let i = 0; i < SWN; i++){
          vth[i] += (p.th[i] - vth[i]) * kt; const q = -vth[i] * Math.PI / 180, c = Math.cos(q) * s, sn = Math.sin(q) * s, o = i * 16, j = i * 3;
          let wk = 0; if (wave){ const d = (Math.hypot(swPos.px[i], swPos.pz[i]) - wr) / 3.4; wk = Math.exp(-d * d); }
          Mx[o] = c; Mx[o + 1] = sn; Mx[o + 4] = -sn; Mx[o + 5] = c; Mx[o + 10] = s; Mx[o + 12] = swPos.px[i]; Mx[o + 13] = PIV + (RM ? 0 : wk * .45); Mx[o + 14] = swPos.pz[i]; Mx[o + 15] = 1;
          let br = .36, bg = .38, bb = .43, dr = .1, dg = .78, db = .36;
          if (idle){ dr = .16; dg = .17; db = .2; } else if (!p.alive[i]){ br = .34; bg = .09; bb = .08; dr = 1; dg = .13; db = .09; } else if (sel && p.elite[i]){ br = bg = bb = 1.3; dr = dg = db = 1; }
          if (was[i] && !p.alive[i] && !idle){ cb[j] = 2.6; cb[j + 1] = 1.3; cb[j + 2] = .5; cd[j] = 3.4; cd[j + 1] = 1.8; cd[j + 2] = .6; } was[i] = p.alive[i]; // a crash is a spark before it is a red light
          br += wk * 1.5; bg += wk * 1.9; bb += wk * 1.6; dr += wk * 1.2; dg += wk * 1.6; db += wk * 1.3;
          cb[j] += (br - cb[j]) * kc; cb[j + 1] += (bg - cb[j + 1]) * kc; cb[j + 2] += (bb - cb[j + 2]) * kc; cd[j] += (dr - cd[j]) * kc; cd[j + 1] += (dg - cd[j + 1]) * kc; cd[j + 2] += (db - cd[j + 2]) * kc;
        }
        iBody.instanceMatrix.needsUpdate = true; iBody.instanceColor.needsUpdate = true; iDisc.instanceColor.needsUpdate = true;
        const op = clamp((swp - .2) / .6, 0, 1); mBody.opacity = op; mStand.opacity = op; mDisc.opacity = .62 * op;
      }
      shade.style.opacity = fmt(dim, 3);
      if (dim < .95 || !this.drewDim){ R.setRenderTarget(null); R.render(scene, cam); if (post.on){ post.k = (1 - .35 * swp) * (1 + Math.max(A.fl, B.fl) + .4 * Math.sin(Math.PI * sweep)); post.run(); if (dim < .95) post.pace(dt); } this.drewDim = dim >= .95; }
    },
  };
}
/* without WebGL the same scenes are drawn flat, so every demonstration still works */
function makeFlat(){
  const mk = () => ({ th: 0, u: 0, x: 0, y: 0, s: 1, on: true, load: 0, mix: 0 }), A = mk(), B = mk(); let W = 1, H = 1, S = 60, cx = 0, cy = 0, narrow = false;
  const proj = (x, y) => [cx + x * S, cy - y * S];
  return { flat: true, snap: false, hl: -1, live: false, rig: [A, B], proj, k: [0, 0, 0, 0], sw: 0, st: 0,
    resize(){ W = innerWidth; H = innerHeight; narrow = W < 860; },
    gust(){},
    parts(){ const p = (lx, ly) => { const t = A.th * Math.PI / 180, c = Math.cos(t), s = Math.sin(t); return proj(A.x + lx * c + ly * s, A.y - lx * s + ly * c); }; return { imu: p(-.1, HB + .2), fc: p(.1, HB), mL: p(-1.12, HB), mR: p(1.12, HB), tL: [p(-1.12, HB + .3), p(-1.12, HB + 1.3)], tR: [p(1.12, HB + .3), p(1.12, HB + 1.3)] }; },
    update(dt, f, st, inA, inB){
      const colEl = $('#s1 .col'), cw = colEl ? colEl.getBoundingClientRect().width : W * .4, free = narrow ? 1 : clamp(1 - (cw + 40) / W, .3, .75), twin = st === 5 ? 1 : 0, w = i => clamp(1 - Math.abs(f - i) * 2.6, 0, 1);
      S = Math.min(free * W / (twin ? 10.6 : 7.2), H / (narrow ? 14 : 8)); cx = free * W / 2; cy = narrow ? H * .26 : H * .5; this.st = st; this.sw = w(6);
      this.k[0] = w(1); this.k[1] = w(2); this.k[2] = w(3); this.k[3] = w(5);
      const a = 1 - Math.exp(-dt * 30); A.x = -1.95 * twin; B.x = 1.95 * twin; B.on = twin > 0; A.on = st >= 1 && st <= 5 && st !== 4;
      A.th += ((inA.th || 0) - A.th) * a; B.th += ((inB.th || 0) - B.th) * a; A.u = inA.u || 0; B.u = inB.u || 0; A.load = inA.load ? 1 : 0; B.load = inB.load ? 1 : 0; A.mix = inA.ai ? 1 : 0; B.mix = inB.ai ? 1 : 0;
      $('#shade').style.opacity = st >= 7 || st === 4 ? '.9' : '0';
    } };
}
try { stage = makeStage(); } catch (e) { stage = null; }
if (!stage){ app.classList.add('no3d'); stage = makeFlat(); }

/* ================= what is drawn on the stage ================= */
const fx = { cv: $('#fx'), c: $('#fx').getContext('2d'), w: 0, h: 0, d: 1, t: 0,
  resize(){ this.d = Math.min(2, devicePixelRatio || 1); this.w = this.cv.clientWidth || innerWidth; this.h = this.cv.clientHeight || innerHeight; this.cv.width = Math.round(this.w * this.d); this.cv.height = Math.round(this.h * this.d); } };
// a point at angle phi (degrees, positive = right side down) and distance rad from the middle of the drone's body
function ap(r, phi, rad){ const t = r.th * Math.PI / 180, p = phi * Math.PI / 180; return stage.proj(r.x + (HB * Math.sin(t) + rad * Math.cos(p)) * r.s, r.y + (HB * Math.cos(t) - rad * Math.sin(p)) * r.s, 0); }
function arc(c, r, a0, a1, rad, cont){ const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / 2)); for (let i = 0; i <= n; i++){ const [x, y] = ap(r, a0 + (a1 - a0) * i / n, rad); if (i || cont) c.lineTo(x, y); else c.moveTo(x, y); } }
function text(c, s, x, y, font, color, align = 'center'){ c.font = font; c.fillStyle = color; c.textAlign = align; c.textBaseline = 'middle'; c.direction = 'rtl'; c.fillText(s, x, y); }
// the target line, the drone's own line, and the gap between them
function annot(r, sp, R0, RR, RL, a, label){
  const c = fx.c, th = r.th; c.globalAlpha = a;
  c.fillStyle = 'rgba(255,255,255,.16)';
  for (const [sg, R1] of [[1, RR], [-1, RL]]){ c.beginPath(); arc(c, r, sp, th, sg * R0); arc(c, r, th, sp, sg * R1, true); c.closePath(); c.fill(); }
  const e0 = ap(r, sp, -RL - .25), e1 = ap(r, sp, RR + .25);
  c.strokeStyle = 'rgba(235,235,245,.62)'; c.lineWidth = 1.5; c.setLineDash([7, 7]); seg2(c, e0[0], e0[1], e1[0], e1[1]); c.setLineDash([]);
  c.strokeStyle = LABEL; c.lineWidth = 2.5; c.lineCap = 'round';
  for (const [sg, R1] of [[1, RR], [-1, RL]]){ const p0 = ap(r, th, sg * R0), p1 = ap(r, th, sg * (R1 + .2)); seg2(c, p0[0], p0[1], p1[0], p1[1]); }
  if (label){
    text(c, `יעד ${show(sp, 0)}°`, e0[0] - 10, e0[1], `500 ${REM * .95}px ${UI}`, L2, 'right');
    const [lx, ly] = ap(r, Math.max(th, sp) + 9, -(R0 + RL) / 2 - .1);
    text(c, show(Math.abs(sp - th), 1) + '°', lx, ly - REM * .5, `700 ${REM * 1.5}px ${UI}`, LABEL); text(c, 'שגיאה', lx, ly - REM * 1.75, `500 ${REM * .95}px ${UI}`, L2);
  }
  c.globalAlpha = 1;
}
// one term of the controller, drawn as the twist it asks for
function torque(r, val, rad, color, letter, a){
  const c = fx.c, th = r.th, span = clamp(val * .5, -64, 64), p = ap(r, th, rad); c.globalAlpha = a;
  if (Math.abs(span) > 1.5){ c.strokeStyle = color; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); arc(c, r, th, th + span, rad); c.stroke(); const q1 = ap(r, th + span, rad), q0 = ap(r, th + span - Math.sign(span) * 3, rad); head(c, q0[0], q0[1], q1[0], q1[1], 11, color); }
  chip(c, p[0], p[1], letter, color, clamp(REM * .68, 10, 15)); c.globalAlpha = 1;
}
function thrust(P, u, a, warn){
  const c = fx.c; c.globalAlpha = a; c.lineCap = 'round';
  for (const [k, sx] of [['tL', -1], ['tR', 1]]){ const lv = clamp(.5 - sx * u / 200, 0, 1), [b, t1] = P[k], len = .25 + 1.25 * lv, x1 = b[0] + (t1[0] - b[0]) * len, y1 = b[1] + (t1[1] - b[1]) * len, col = warn && (lv > .98 || lv < .02) ? WARN : LABEL;
    c.strokeStyle = col; c.lineWidth = 4; seg2(c, b[0], b[1], x1, y1); head(c, b[0], b[1], x1, y1, 10, col); text(c, Math.round(lv * 100) + '%', x1, y1 - REM * 1.1, `600 ${REM * .95}px ${UI}`, col); }
  c.globalAlpha = 1;
}
function glyph(r){ // the flat stand-in for a drone
  const c = fx.c, P = (lx, ly) => { const t = r.th * Math.PI / 180, co = Math.cos(t), s = Math.sin(t); return stage.proj(r.x + lx * co + ly * s, r.y - lx * s + ly * co); }, a = P(-1.5, HB), b = P(1.5, HB), piv = P(0, 0), fl = stage.proj(r.x, FLOOR);
  c.strokeStyle = 'rgba(235,235,245,.4)'; c.lineWidth = 3; seg2(c, piv[0], piv[1], fl[0], fl[1]); seg2(c, fl[0] - 30, fl[1], fl[0] + 30, fl[1]);
  c.strokeStyle = LABEL; c.lineWidth = 7; c.lineCap = 'round'; seg2(c, a[0], a[1], b[0], b[1]);
  for (const sx of [-1, 1]){ const m = P(sx * 1.25, HB + .16), lv = clamp(.5 - sx * r.u / 200, 0, 1); c.fillStyle = r.mix ? `rgba(52,194,107,${fmt(.35 + .65 * lv, 2)})` : `rgba(245,245,247,${fmt(.3 + .7 * lv, 2)})`; c.beginPath(); c.ellipse(m[0], m[1], 30, 7, -r.th * Math.PI / 180, 0, 7); c.fill(); }
  const body = P(0, HB + .18); c.fillStyle = '#3a3a42'; c.beginPath(); c.arc(body[0], body[1], 15, 0, 7); c.fill();
  if (r.load){ const k = P(1.25, HB - .7); c.fillStyle = '#d8d8dc'; c.fillRect(k[0] - 9, k[1] - 9, 18, 18); }
}
fx.draw = function(f, st, dt){
  const c = this.c; this.t += dt; c.setTransform(this.d, 0, 0, this.d, 0, 0); c.clearRect(0, 0, this.w, this.h);
  const [A, B] = stage.rig, k = stage.k, narrow = this.w < 860;
  if (stage.flat){
    if (stage.sw > .02){ c.globalAlpha = stage.sw; const p = sw.pop, x0 = narrow ? this.w * .06 : this.w * .04, gw = (narrow ? this.w * .88 : this.w * .5) / SWL.cols, y0 = narrow ? this.h * .1 : this.h * .26, gh = (narrow ? this.h * .32 : this.h * .56) / SWL.rows; c.lineCap = 'round'; c.lineWidth = 3;
      for (let a = 0; a < SWN; a++){ const x = x0 + (swPos.px[a] / SWL.dx + SWL.cols / 2 + .5) * gw, y = y0 + (swPos.pz[a] / SWL.dz + SWL.rows / 2 + .5) * gh, t = p.th[a] * Math.PI / 180, l = gw * .34; c.strokeStyle = sw.state === 'idle' ? L3 : !p.alive[a] ? '#ff453a' : (sw.state === 'select' && p.elite[a]) ? '#fff' : CAI; seg2(c, x - Math.cos(t) * l, y - Math.sin(t) * l, x + Math.cos(t) * l, y + Math.sin(t) * l); }
      c.globalAlpha = 1; }
    if (A.on && stage.sw < .5){ glyph(A); if (B.on) glyph(B); }
  }
  if (k[0] > .02) { annot(A, 0, 1.8, 2.9, 2.9, k[0], !narrow); if (ch.mode === 'manual') thrust(stage.parts(), ch.u, k[0], false); }
  if (k[1] > .02){
    const P = stage.parts(), a = k[1], pts = [P.imu, P.fc, P.mL], real = lp.real, ph = lp.phase, tp = lp.tp / LP_D[ph];
    annot(A, 0, 2.55, 3.3, 3.3, a * .8, false);
    c.globalAlpha = a; c.strokeStyle = 'rgba(245,245,247,.34)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(P.imu[0], P.imu[1]); c.lineTo(P.fc[0], P.fc[1]); c.lineTo(P.mL[0], P.mL[1]); c.moveTo(P.fc[0], P.fc[1]); c.lineTo(P.mR[0], P.mR[1]); c.stroke();
    // the part that is working right now sits in a slow-breathing pool of light
    if (!real) for (const p of ph === 2 ? [P.mL, P.mR] : [pts[ph]]){ const R = REM * 2.7, g = c.createRadialGradient(p[0], p[1], 0, p[0], p[1], R); g.addColorStop(0, `rgba(255,255,255,${fmt(.3 + .1 * Math.sin(this.t * 3.4), 3)})`); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.beginPath(); c.arc(p[0], p[1], R, 0, 7); c.fill(); }
    if (!narrow){ const lab2 = (p, dx, dy, s, hot, val) => { const x = p[0] + dx * REM, y = p[1] + dy * REM; c.globalAlpha = a * (.45 + .55 * hot); c.strokeStyle = LABEL; c.lineWidth = 1; seg2(c, p[0], p[1], x, y); c.beginPath(); c.arc(p[0], p[1], 3.5, 0, 7); c.fillStyle = LABEL; c.fill(); text(c, s, x - 6, y, `600 ${REM * 1.05}px ${UI}`, LABEL, 'right');
        if (val) text(c, '⁦' + val + '⁩', x - 6, y + REM * 1.3, `600 ${REM}px ${MONO}`, LABEL, 'right'); }; // each part carries the number it is holding
      lab2(P.imu, -3.2, -2.6, 'חיישן IMU', lp.hot(0), real ? '' : show(lp.meas) + '°'); lab2(P.fc, -5.4, .2, 'בקר טיסה', lp.hot(1), real ? '' : 'e = ' + show(lp.e) + '°'); lab2(P.mL, -2.4, 3.1, 'מנועים', lp.hot(2)); }
    // a signal is a bright head with a short tail behind it, easing out of one part and into the next
    c.globalAlpha = a; const comet = (p, q, u0) => { const u = u0 * u0 * (3 - 2 * u0), at = v => [p[0] + (q[0] - p[0]) * v, p[1] + (q[1] - p[1]) * v], [hx, hy] = at(u), g = c.createRadialGradient(hx, hy, 0, hx, hy, 20); g.addColorStop(0, 'rgba(255,255,255,.42)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.beginPath(); c.arc(hx, hy, 20, 0, 7); c.fill();
        for (let i = 8; i >= 0; i--){ const v = u - i * .04; if (v < 0) continue; const [x, y] = at(v); c.beginPath(); c.arc(x, y, i ? 4.4 - i * .4 : 5.5, 0, 7); c.fillStyle = `rgba(255,255,255,${fmt(i ? .5 * (1 - i / 9) : 1, 3)})`; c.fill(); } },
      ping = (p, u) => { for (const d of [0, .22]){ const v = u - d; if (v <= 0) continue; c.strokeStyle = `rgba(255,255,255,${fmt(.8 * (1 - v) * (1 - v), 3)})`; c.lineWidth = 2; c.beginPath(); c.arc(p[0], p[1], 6 + 34 * (1 - (1 - v) * (1 - v)), 0, 7); c.stroke(); } };
    if (real){ const u = (this.t * 3.2) % 1; if (u < .5) comet(P.imu, P.fc, u * 2); else { comet(P.fc, P.mL, u * 2 - 1); comet(P.fc, P.mR, u * 2 - 1); } }
    else if (ph === 0) ping(P.imu, (tp * 2) % 1);
    else if (ph === 1){ if (tp < .5) comet(P.imu, P.fc, tp * 2); else ping(P.fc, tp * 2 - 1); }
    else if (tp < .3){ comet(P.fc, P.mL, tp / .3); comet(P.fc, P.mR, tp / .3); }
    c.globalAlpha = 1; if (real || ph === 2) thrust(P, lp.uNow, a * (real ? 1 : clamp((tp - .2) / .25, 0, 1)), false);
  }
  if (k[2] > .02){
    const a = k[2], o = lab.out, g = lab.g, r0 = narrow ? 2.05 : 2.42;
    annot(A, lab.sp, 1.8, 2.16, narrow ? 2.16 : 3.05, a, !narrow);
    if (g.kp) torque(A, o.P, r0, CP, 'P', a); if (g.ki) torque(A, o.I, r0 + .27, CI, 'I', a); if (g.kd) torque(A, o.D, r0 + .54, CD, 'D', a);
    if (lab.sat > .3){ const p = stage.proj(A.x, A.y + 3.5 * A.s, 0); c.globalAlpha = a * clamp(lab.sat * 1.6, 0, 1); text(c, 'רוויה: המנועים במקסימום', p[0], p[1], `600 ${REM * 1.1}px ${UI}`, WARN); c.globalAlpha = 1; }
  }
  if (k[3] > .02){
    const a = k[3];
    [[A, narrow ? 'קבועים' : 'מקדמים קבועים', LABEL, ad.ea], [B, ad.mode === 'pre' ? (gs.trained() ? 'רשת מכווננת' : (narrow ? 'לפני אימון' : 'לפני אימון: אותם מקדמים')) : 'נוירון לומד', CAI, ad.eb]].forEach(([r, name, colr, e]) => { annot(r, ad.r, 1.8, 2.45, 2.45, a, false); const p = stage.proj(r.x, r.y + (narrow ? 1.75 : 3.15) * r.s, 0), fs = narrow ? REM * .95 : REM * 1.2; c.globalAlpha = a; text(c, name, p[0], p[1] - fs * 1.1, `700 ${fs}px ${UI}`, colr); if (ad.t > 2) text(c, `${narrow ? 'סטייה' : 'סטייה ממוצעת'} ${show(Math.sqrt(e), 1)}°`, p[0], p[1], `500 ${fs * .85}px ${UI}`, L2); c.globalAlpha = 1; });
  }
};

/* ================= presenter chrome ================= */
const rail = $('#rail');
rail.innerHTML = ST.map((s, i) => `<button type="button" aria-pressed="${i === 0}" aria-label="${i ? 'תחנה ' + i + ': ' : ''}${s.name}"><b>${i}</b><em>${s.name}</em></button>`).join('');
const navSeg = segmented(rail, (i, e) => go(i, e.detail === 0));
const docks = ST.map((_, i) => $('#d' + i));
let active = -1, paused = false;
function go(i, instant){ measure(); if (instant) stage.snap = true;
  // phones: the station's title lands just below the 3D panel, or below the top bar when that station has no drone
  const top = PHONE ? tops[i][0] - (ST[i].shot[8] > .5 ? 24 : OFF - 30) : tops[i][0];
  window.scrollTo({ top: Math.max(0, top), behavior: 'auto' }); }
$('#brand').addEventListener('click', e => go(0, e.detail === 0));
function setActive(st){
  active = st; secs.forEach((s, i) => s.classList.toggle('on', i === st)); navSeg.set(st, RM); app.classList.toggle('nostage', ST[st].shot[8] > .5);
  app.dataset.th = st === 5 || st === 6 ? 'ai' : ''; app.dataset.amb = ['', '', '', '', 'nn', '', '', 'hw', 'duo', 'duo'][st];
  docks.forEach((d, i) => { if (!d) return; d.classList.toggle('on', i === st); d.inert = i !== st; });
  { const f = document.activeElement; if (f && f.closest && f.closest('.docks, #quiz')) f.blur(); }
  setTune(false); if (keysPop && keysPop.classList.contains('on')) keysPaint(); $('#noteSay').textContent = ST[st].say; $('#noteDo').textContent = ST[st].act; clockPaint();
}
const clock = { t: 0, on: false };
function clockPaint(){
  const left = 300 - clock.t, s = Math.abs(left >= 0 ? Math.ceil(left) : Math.floor(left));
  $('#clockT').textContent = (left < 0 ? '+' : '') + Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); $('#clock').classList.toggle('over', left < 0);
  $('#clockI').setAttribute('d', clock.on ? 'M7 5v10M13 5v10' : 'M7 4.5v11l9-5.5z');
  let acc = 0, pace = -1; if (clock.t > 0) for (let i = 0; i < NST - 1; i++){ acc += ST[i].sec; if (clock.t < acc){ pace = i; break; } } if (clock.t >= 300) pace = NST - 2;
  navSeg.btns.forEach((d, i) => d.classList.toggle('pace', i === pace && i !== active));
}
$('#clock').addEventListener('click', () => { clock.on = !clock.on; clockPaint(); });
$('#clockR').addEventListener('click', () => { clock.t = 0; clock.on = false; clockPaint(); });
$('#startB').addEventListener('click', e => { clock.t = 0; clock.on = true; clockPaint(); go(1, e.detail === 0); });
const notes = $('#notes');
function toggleNotes(e){ const on = !notes.classList.contains('on'); if (on) popFrom(notes, $('#notesB')); popSet(notes, on, e); $('#notesB').setAttribute('aria-pressed', on); }
$('#notesB').addEventListener('click', toggleNotes);
function togglePause(){ paused = !paused; const b = $('#pauseB'); b.setAttribute('aria-pressed', paused); b.setAttribute('aria-label', paused ? 'המשיכו את ההדגמות' : 'השהו את ההדגמות'); }
$('#pauseB').addEventListener('click', togglePause);
function fullscreen(){ try { if (document.fullscreenElement) document.exitFullscreen(); else { const p = document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); if (p && p.catch) p.catch(() => {}); } } catch (e) { /* not available here */ } }
$('#fsB').addEventListener('click', fullscreen);
/* ================= keyboard: every control of every station, no mouse needed =================
   Up/down (and space, Page Up/Down) move between stations, and left/right too, except in station 1, where they tilt the drone.
   Digits pick an option of the station's main switch, letters press its buttons. ? opens the list. Keys are read by
   physical position (e.code), so they work with the Hebrew layout too. */
const KEYMAP = [
  { Enter: ['#startB', 'התחילו'] },
  { Enter: ['#chGo', 'אני מחזיק/ה'], '← →': [null, 'הטיית הרחפן (מחזיקים את המקש)'], 'רווח': [null, 'אני מחזיק/ה'] },
  { seg: '#lpSeg', KeyG: ['#lpGust', 'משב רוח'] },
  { seg: '#presets', KeyG: ['#gustB', 'משב רוח'], KeyT: ['#tuneB', 'כוונון ידני (בפנים: ↑↓ שורה, ← → ערך, Esc סוגר)'], KeyY: ['#spB', 'יעד 15°'], KeyL: ['#loadB', 'מטען בצד'], KeyX: ['#noiseB', 'רעש בחיישן'],
    'Q / A': [null, 'Kp למעלה / למטה'], 'W / S': [null, 'Ki למעלה / למטה'], 'E / D': [null, 'Kd למעלה / למטה'] },
  { seg: '#nnSeg' },
  { seg: '#gvSeg', Enter: ['#gsGo', 'אספו דוגמאות ואמנו'], KeyL: ['#adLoad', 'מטען בצד'], KeyB: ['#adBatt', 'סוללה חלשה'], KeyZ: ['#adFast', 'למידה מהירה פי 8'], KeyR: ['#adReset', 'אפסו'] },
  { Enter: ['#swGo', 'התחילו / עצרו אימון'], KeyG: ['#swGust', 'משב רוח'], KeyW: ['#swWind', 'רוח צד קבועה'], KeyR: ['#swReset', 'אפסו'] },
  { seg: '#hwSeg' },
  { seg: '#tvSeg', 'A / B / C': [null, 'תשובה בהצבעה'], Enter: ['#qzNext', 'התרחיש הבא'] },
  {},
];
const KEYCAP = { Enter: '↵', KeyG: 'G', KeyT: 'T', KeyY: 'Y', KeyL: 'L', KeyX: 'X', KeyB: 'B', KeyZ: 'Z', KeyR: 'R', KeyW: 'W' };
const GAINKEYS = { KeyQ: ['kp', 1], KeyA: ['kp', -1], KeyW: ['ki', 1], KeyS: ['ki', -1], KeyE: ['kd', 1], KeyD: ['kd', -1] };
// a small key cap on every button that has a key, on mouse and trackpad screens only
if (matchMedia('(hover: hover) and (pointer: fine)').matches){
  KEYMAP.forEach(m => { for (const k in m){ const v = m[k]; if (!Array.isArray(v) || !v[0] || !KEYCAP[k]) continue; const b = $(v[0]); if (b) b.insertAdjacentHTML('beforeend', `<kbd class="kc" aria-hidden="true">${KEYCAP[k]}</kbd>`); } });
}
KEYMAP.forEach(m => { for (const k in m){ const v = m[k]; if (Array.isArray(v) && v[0] && KEYCAP[k]){ const b = $(v[0]); if (b) b.setAttribute('aria-keyshortcuts', k.replace('Key', '')); } } });
const usable = el => el && !el.disabled && !el.hidden && el.offsetParent !== null;
const press = el => { if (!usable(el)) return false; el.click(); el.classList.add('kpress'); setTimeout(() => el.classList.remove('kpress'), 140); return true; };
const keysPop = $('#keys');
function keysPaint(){
  const m = KEYMAP[active] || {}, row = (k, t) => `<li><kbd>${k}</kbd><span>${t}</span></li>`; let h = '';
  if (m.seg){ const bs = $$(':scope > button', $(m.seg)); h += row(`1–${bs.length}`, bs.map(b => b.textContent.trim()).join(' · ')); }
  for (const k in m){ if (k === 'seg') continue; h += row(KEYCAP[k] || k, m[k][1]); }
  $('#keysSt').innerHTML = h || row('–', 'אין כאן פקדים. ↓ לתחנה הבאה');
  $('#keysStT').textContent = `בתחנה ${active}: ${ST[active].name}`;
}
function toggleKeys(on = !keysPop.classList.contains('on'), e){ if (on){ keysPaint(); popFrom(keysPop, $('#keysB')); } popSet(keysPop, on, e); $('#keysB').setAttribute('aria-pressed', on); }
$('#keysB').addEventListener('click', e => toggleKeys(undefined, e));
const tiltKey = (type, key) => $('#pad').dispatchEvent(new KeyboardEvent(type, { key }));
/* focus moves through the controls of the current station in reading order: the bottom bar, and in station 7 the vote.
   The bar's DOM order runs right to left on screen, so ← is "next" and → is "previous". */
function barItems(){
  const d = docks[active], list = d ? $$('button', d).filter(usable) : [];
  if (active === 8 && !$('#tv2').hidden) list.push(...$$('#qzO button, #qzNext').filter(usable));
  return list;
}
const focusEl = el => { if (el){ el.focus({ preventScroll: true }); } return !!el; };
// the manual-tuning popover is a vertical menu: three gain sliders, then a row of buttons
function tuneRows(){ return [[$('#kp')], [$('#ki')], [$('#kd')], $$('#tune .row button, #tune button:not(.gain button)').filter((b, i, a) => usable(b) && a.indexOf(b) === i)].filter(r => r.length && usable(r[0])); }
function tuneKey(e){
  const k = e.key, rows = tuneRows(), a = document.activeElement; let ri = rows.findIndex(r => r.includes(a)); const ci = ri >= 0 ? rows[ri].indexOf(a) : 0;
  if (k === 'ArrowUp' || k === 'ArrowDown'){ ri = ri < 0 ? 0 : clamp(ri + (k === 'ArrowDown' ? 1 : -1), 0, rows.length - 1); return focusEl(rows[ri][0]); }
  if (k === 'ArrowLeft' || k === 'ArrowRight'){
    if (ri < 0) return focusEl(rows[0][0]);
    if (a.type === 'range'){ // the track fills from the right, so ← raises the value
      if (k === 'ArrowLeft') a.stepUp(e.shiftKey ? 10 : 2); else a.stepDown(e.shiftKey ? 10 : 2); a.dispatchEvent(new Event('input', { bubbles: true })); return true; }
    return focusEl(rows[ri][clamp(ci + (k === 'ArrowLeft' ? 1 : -1), 0, rows[ri].length - 1)]);
  }
  if (k === ' ' || k === 'Enter'){ if (a && a.tagName === 'BUTTON' && tune.contains(a)) press(a); else if (ri < 0) focusEl(rows[0][0]); return true; }
  if (k === 'Escape' || e.code === 'KeyT'){ setTune(false); focusEl(tuneB); return true; }
  return false;
}
let navTo = 0, navAt = 0;
const onKey = e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return; const t = e.target, k = e.key, c = e.code; if (t && (t.tagName === 'TEXTAREA' || t.isContentEditable || (t.tagName === 'INPUT' && t.type !== 'range'))) return;
  const m = KEYMAP[active] || {};
  if (t && t.closest && t.closest('[role="slider"]') && (k === 'ArrowLeft' || k === 'ArrowRight')) return; // the tilt handle reads these itself
  // an open tuning menu takes the arrows, space and Esc until it closes
  if (active === 3 && tune.classList.contains('on') && (k.startsWith('Arrow') || k === ' ' || k === 'Enter' || k === 'Escape' || c === 'KeyT')){ if (tuneKey(e)) e.preventDefault(); return; }
  // station 1: left/right hold the drone, as if dragging the handle; space is "I'm holding"
  if (active === 1 && (k === 'ArrowLeft' || k === 'ArrowRight')){ e.preventDefault(); if (!e.repeat) tiltKey('keydown', k); return; }
  if (active === 1 && k === ' '){ e.preventDefault(); press($('#chGo')); return; }
  // left/right: move between the controls of this station; space: choose the one in focus
  if (k === 'ArrowLeft' || k === 'ArrowRight'){
    e.preventDefault(); const items = barItems(); if (!items.length) return; const i = items.indexOf(document.activeElement);
    if (i < 0) focusEl(items.find(b => b.getAttribute('aria-pressed') === 'true' && b.parentNode.classList.contains('seg')) || items[0]);
    else focusEl(items[clamp(i + (k === 'ArrowLeft' ? 1 : -1), 0, items.length - 1)]);
    return;
  }
  if (k === ' '){
    e.preventDefault(); const items = barItems(), a = document.activeElement;
    if (items.includes(a)){ press(a); if (a === tuneB && tune.classList.contains('on')) focusEl($('#kp')); if (!usable(a)) focusEl(barItems()[0]); }
    else focusEl(items.find(b => b.getAttribute('aria-pressed') === 'true' && b.parentNode.classList.contains('seg')) || items[0]);
    return;
  }
  // up/down: the previous or next station. Quick repeated presses keep counting from the last target
  const step = d => { const from = performance.now() - navAt < 700 ? navTo : active; navTo = clamp(from + d, 0, NST - 1); navAt = performance.now(); go(navTo); };
  if (k === 'ArrowDown' || k === 'PageDown'){ e.preventDefault(); step(1); return; }
  if (k === 'ArrowUp' || k === 'PageUp'){ e.preventDefault(); step(-1); return; }
  if (k === 'Home'){ e.preventDefault(); go(0); return; }
  if (k === 'End'){ e.preventDefault(); go(NST - 1); return; }
  const dig = /^(?:Digit|Numpad)([0-9])$/.exec(c);
  if (dig && e.shiftKey){ e.preventDefault(); go(Math.min(NST - 1, +dig[1]), true); return; } // Shift + digit jumps to a station
  if (dig){ const bs = m.seg ? $$(':scope > button', $(m.seg)) : [], b = bs[+dig[1] - 1]; if (b){ e.preventDefault(); press(b); } return; }
  if (active === 8 && !$('#tv2').hidden && /^Key[ABC]$/.test(c)){ e.preventDefault(); press($$('#qzO button')[c.charCodeAt(3) - 65]); return; }
  if (active === 3 && GAINKEYS[c]){ e.preventDefault(); const [g, d] = GAINKEYS[c], el = sliders[g][0]; if (d > 0) el.stepUp(5); else el.stepDown(5); el.dispatchEvent(new Event('input', { bubbles: true })); if (!tune.classList.contains('on')) setTune(true); return; }
  if (c === 'KeyT' && active === 3){ e.preventDefault(); press(tuneB); if (tune.classList.contains('on')) focusEl($('#kp')); return; }
  if (m[c] && m[c][0] && (c !== 'Enter' || !(t && t.closest && t.closest('button')))){ if (press($(m[c][0]))) e.preventDefault(); return; }
  if (c === 'KeyN') toggleNotes();
  else if (c === 'KeyP') togglePause();
  else if (c === 'KeyF') fullscreen();
  else if (c === 'KeyK'){ if (e.shiftKey) $('#clockR').click(); else $('#clock').click(); }
  else if (k === '?' || c === 'KeyH' || c === 'Slash'){ e.preventDefault(); toggleKeys(); }
  else if (k === 'Escape'){ setTune(false); toggleKeys(false); }
};
addEventListener('keydown', e => { viaKey = true; try { onKey(e); } finally { viaKey = false; } });
addEventListener('keyup', e => { if (active === 1 && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) tiltKey('keyup', e.key); });

/* ================= loop ================= */
function resizeAll(){ REM = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16; measure(); adChart.resize(); labPlot.resize(); sw.resize(); gs.resize(); hw.resize(); nn.resize(); fx.resize(); stage.resize(); segs.forEach(s => s.place(true)); }
let lastW = innerWidth;
addEventListener('resize', () => { if (TOUCH && innerWidth === lastW){ measure(); return; } lastW = innerWidth; resizeAll(); });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(resizeAll);
let last = performance.now(), secAcc = 0;
document.addEventListener('visibilitychange', () => { last = performance.now(); });
function frame(now){
  const dt = Math.min(.05, Math.max(0, (now - last) / 1000)); last = now;
  const f = scrollF(), st = clamp(Math.round(f), 0, NST - 1);
  if (st !== active) setActive(st);
  if (clock.on){ clock.t += dt; secAcc += dt; if (secAcc > .25){ secAcc = 0; clockPaint(); } }
  if (!paused){ if (st === 1) advance(ch, dt); else if (st === 2) lp.tick(dt); else if (st === 3) advance(lab, dt); else if (st === 5){ advance(ad, dt); gs.tick(dt); } else if (st === 6) sw.tick(dt); }
  if (st === 1) ch.paint(); else if (st === 2) lp.paint(); else if (st === 3) lab.paint(); else if (st === 4) nn.paint(dt); else if (st === 5) ad.paint(); else if (st === 6) sw.paint(dt); else if (st === 7) hw.paint(dt);
  let a = {}, b = {};
  if (st === 1) a = { th: ch.s.th, u: ch.u };
  else if (st === 2){ a = { th: lp.s.th, u: lp.real || (lp.phase === 2 && lp.tp > LP_D[2] * .3) ? lp.uNow : 0 }; stage.hl = lp.real ? 3 : lp.phase; }
  else if (st === 3) a = { th: lab.s.th, u: lab.out.u, load: lab.par.d > 0 };
  else if (st === 5){ a = { th: ad.sa.th, u: ad.ua, load: ad.par.d > 0, weak: ad.par.eff < 1 }; b = { th: ad.sb.th, u: ad.ub, load: ad.par.d > 0, weak: ad.par.eff < 1, ai: true }; }
  else if (st === 6) a = { th: 0, ai: true };
  stage.update(dt, f, st, a, b, paused, sw);
  fx.draw(f, st, dt);
  requestAnimationFrame(frame);
}
// a trace of film grain: one small tile of noise, made once and laid over the page. It never changes, so it is never redrawn
if (!TOUCH){ const c = document.createElement('canvas'), g = c.getContext('2d'); c.width = c.height = 180; const im = g.createImageData(180, 180), d = im.data, r = mulberry32(99);
  for (let i = 0; i < d.length; i += 4){ const v = r() < .5 ? 0 : 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = r() * (v ? 6 : 11); }
  g.putImageData(im, 0, 0); const el = document.createElement('div'); el.className = 'grain'; el.setAttribute('aria-hidden', 'true'); el.style.backgroundImage = `url(${c.toDataURL()})`; app.appendChild(el); }
// every station headline is cut into words, so each word can rise out of its own mask (the opening headline is already cut in the markup)
$$('.st h2').forEach(h => { const ws = h.textContent.trim().split(/\s+/); h.textContent = ''; h.classList.add('split');
  ws.forEach((w, i) => { const o = document.createElement('span'), n = document.createElement('span'); o.className = 'w'; n.className = 'wi'; n.style.setProperty('--i', i); n.textContent = w; o.appendChild(n); if (i) h.appendChild(document.createTextNode(' ')); h.appendChild(o); }); });
// initial state
presetSeg.set(0, true); applyPreset('p'); nn.set(0); sw.init(); showQ(); gs.ui(); hw.build(); lp.gust(); lp.meas = lp.s.th; lp.text(); resizeAll();
for (let i = 0; i < 480; i++){ lab.step(); ch.step(); ad.step(); } // two seconds of history so the charts are not empty at rest
ch.paint(); lp.paint(); lab.paint(); ad.paint(); sw.paint(0);
stage.live = true; app.classList.add('anim');
if (matchMedia('(max-width: 860px)').matches && 'IntersectionObserver' in window){
  app.classList.add('reveal');
  const io = new IntersectionObserver(es => { for (const en of es) if (en.isIntersecting){ en.target.classList.add('seen'); io.unobserve(en.target); } }, { rootMargin: '0px 0px -8% 0px' });
  $$('.st .col > *').forEach(el => io.observe(el));
}
const hs = /^#s([0-9])$/.exec(location.hash || ''); if (hs) go(+hs[1], true);
requestAnimationFrame(frame);
})();
