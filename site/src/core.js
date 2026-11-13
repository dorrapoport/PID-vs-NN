// ---- pure simulation core (no DOM) ----
const DT = 1/240;
const BASE = { G: 344, b: 1.2, K: 25, tau: 0.02, umax: 100, stop: 60, J: 1, eff: 1, d: 0 };
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
function mulberry32(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function gauss(r){ let u = 0, v = 0; while (u === 0) u = r(); v = r(); return Math.sqrt(-2*Math.log(u)) * Math.cos(2*Math.PI*v); }
function makePlant(th0 = 0){ return { th: th0, om: 0, m: 0, hit: false }; }
function stepPlant(s, u, par, dt, kick = 0){
  u = clamp(u, -par.umax, par.umax);
  s.m += (u - s.m) * Math.min(1, dt / par.tau);
  const acc = par.G * Math.sin(s.th * Math.PI / 180) + (-par.b * s.om + par.K * par.eff * s.m + par.d) / par.J;
  s.om += acc * dt + kick;
  s.th += s.om * dt;
  s.hit = false;
  if (Math.abs(s.th) >= par.stop){ s.th = Math.sign(s.th) * par.stop; s.om = -0.25 * s.om; s.hit = true; }
}
function makePID(){ return { i: 0, yPrev: null, dF: 0 }; }
function pidStep(c, g, sp, y, dt, umax = 100){
  const e = sp - y;
  const dy = c.yPrev === null ? 0 : (y - c.yPrev) / dt; c.yPrev = y;
  c.dF += (dy - c.dF) * Math.min(1, dt / 0.012);
  const P = g.kp * e, D = -g.kd * c.dF;
  let iNew = c.i + g.ki * e * dt;
  let u = P + iNew + D;
  if ((u > umax && e > 0) || (u < -umax && e < 0)) iNew = c.i; // conditional anti-windup
  c.i = clamp(iNew, -umax, umax);
  u = P + c.i + D;
  return { u: clamp(u, -umax, umax), P, I: c.i, D, e, sat: Math.abs(u) > umax };
}
if (typeof module !== 'undefined') module.exports = { DT, BASE, clamp, mulberry32, gauss, makePlant, stepPlant, makePID, pidStep };
// ---- adaptive single-neuron PID (Thanh & Ahn 2006, as analysed by Bosshart et al. 2021) ----
function makeNeuron(g){ return { kp: g.kp, ki: g.ki, kd: g.kd, ei: 0, ePrev: null, dF: 0 }; }
function neuronStep(n, eta, sp, y, dt, learn = true, umax = 100){
  const Yg = 2 / umax;
  const ep = sp - y;
  const de = n.ePrev === null ? 0 : (ep - n.ePrev) / dt; n.ePrev = ep;
  n.dF += (de - n.dF) * Math.min(1, dt / 0.012);
  n.ei = clamp(n.ei + ep * dt, -40, 40);
  const x = n.kp * ep + n.ki * n.ei + n.kd * n.dF;
  const th = Math.tanh(x * Yg / 2);
  const u = umax * th, fp = 1 - th * th;
  if (learn){
    n.kp += eta.p * fp * ep * ep * dt;            // can only grow (paper: "Kp cannot decrease")
    n.ki = Math.max(0, n.ki + eta.i * fp * ep * n.ei * dt);
    n.kd = Math.max(0, n.kd + eta.d * fp * ep * n.dF * dt);
  }
  return { u, P: n.kp * ep, I: n.ki * n.ei, D: n.kd * n.dF, e: ep };
}
// ---- tiny MLP policy + ARS random search (Mania, Guy, Recht 2018) ----
const NH = 6, NPAR = 2 * NH + NH + NH + 1;
function policy(w, e, om){
  const a = e / 30, b = om / 150; let o = w[NPAR - 1];
  for (let h = 0; h < NH; h++) o += w[3 * NH + h] * Math.tanh(w[h] * a + w[NH + h] * b + w[2 * NH + h]);
  return 100 * Math.tanh(o);
}
function episode(w, par, th0, kickSign){
  const s = makePlant(th0); const T = 2.5, N = Math.round(T / DT); let cost = 0;
  for (let k = 0; k < N; k++){
    const u = policy(w, 0 - s.th, s.om);
    stepPlant(s, u, par, DT, k === 288 ? 110 * kickSign : 0);
    cost += (s.th * s.th) / 225 + 0.02 * (u / 100) * (u / 100);
    if (s.hit) return { r: -(cost / N) - 4 * (1 - k / N), crash: 1 };
  }
  return { r: -(cost / N), crash: 0 };
}
function evalPolicy(w, par){ const a = episode(w, par, 20, -1), b = episode(w, par, -15, 1); return { r: (a.r + b.r) / 2, crash: a.crash + b.crash }; }
function makeTrainer(seed = 3){ const rnd = mulberry32(seed); const w = new Float64Array(NPAR); for (let i = 0; i < NPAR; i++) w[i] = 0.1 * gauss(rnd); return { rnd, w, gen: 0, crashes: 0, hist: [] }; }
function trainGen(t, par, N = 8, sigma = 0.15, alpha = 0.06){
  const dirs = [], res = [];
  for (let i = 0; i < N; i++){
    const d = new Float64Array(NPAR); for (let j = 0; j < NPAR; j++) d[j] = gauss(t.rnd);
    const wp = t.w.map((v, j) => v + sigma * d[j]), wm = t.w.map((v, j) => v - sigma * d[j]);
    const a = evalPolicy(wp, par), b = evalPolicy(wm, par); t.crashes += a.crash + b.crash;
    dirs.push(d); res.push([a.r, b.r]);
  }
  const idx = res.map((r, i) => i).sort((i, j) => Math.max(...res[j]) - Math.max(...res[i])).slice(0, N / 2);
  const all = idx.flatMap(i => res[i]); const mean = all.reduce((a, b) => a + b, 0) / all.length;
  const sd = Math.sqrt(all.reduce((a, b) => a + (b - mean) ** 2, 0) / all.length) || 1;
  for (const i of idx) for (let j = 0; j < NPAR; j++) t.w[j] += alpha / (idx.length * sd) * (res[i][0] - res[i][1]) * dirs[i][j];
  const cur = evalPolicy(t.w, par); t.gen++; t.hist.push(cur.r); return cur;
}
if (typeof module !== 'undefined') Object.assign(module.exports, { makeNeuron, neuronStep, policy, episode, evalPolicy, makeTrainer, trainGen, NPAR });
// ---- population search: every drone on screen is one candidate network ----
const EP_N = Math.round(2.4 / DT), EP_KICK = Math.round(1.0 / DT);
function makePop(n, seed = 1){
  const rnd = mulberry32(seed), w = new Float64Array(NPAR); for (let i = 0; i < NPAR; i++) w[i] = .1 * gauss(rnd);
  const p = { n, rnd, w, W: new Float64Array(n * NPAR), D: new Float64Array(n / 2 * NPAR), th: new Float64Array(n), om: new Float64Array(n), m: new Float64Array(n), u: new Float64Array(n),
    alive: new Uint8Array(n), elite: new Uint8Array(n), cost: new Float64Array(n), tc: new Float64Array(n), kick: new Float64Array(n), k: 0, gen: 0, crashes: 0, trials: 0, hist: [], sigma: .15, alpha: .06, explore: true };
  popReset(p); return p;
}
function popReset(p){
  const h = p.n / 2;
  for (let i = 0; i < h; i++){
    for (let j = 0; j < NPAR; j++){ const d = p.explore ? gauss(p.rnd) : 0; p.D[i * NPAR + j] = d; p.W[2 * i * NPAR + j] = p.w[j] + p.sigma * d; p.W[(2 * i + 1) * NPAR + j] = p.w[j] - p.sigma * d; }
    const th0 = (p.rnd() < .5 ? -1 : 1) * (8 + 14 * p.rnd()), kk = (p.rnd() < .5 ? -1 : 1) * (70 + 50 * p.rnd());
    for (let a = 2 * i; a < 2 * i + 2; a++){ p.th[a] = th0; p.om[a] = 0; p.m[a] = 0; p.u[a] = 0; p.alive[a] = 1; p.elite[a] = 0; p.cost[a] = 0; p.tc[a] = EP_N; p.kick[a] = kk; }
  }
  p.k = 0;
}
function popStep(p, par, kicks = null, free = false){ // one physics step for every drone still flying; true when the episode is over
  // free: flight after training. No episode clock and no scheduled kick, and a fallen drone is stood back up after a second.
  const k = free ? -1 : p.k, N = NPAR;
  for (let a = 0; a < p.n; a++){
    if (!p.alive[a]){ if (free && --p.tc[a] <= 0){ p.th[a] = 0; p.om[a] = 0; p.m[a] = 0; p.alive[a] = 1; } continue; }
    const o = a * N, e = -p.th[a] / 30, b = p.om[a] / 150; let out = p.W[o + N - 1];
    for (let h = 0; h < NH; h++) out += p.W[o + 3 * NH + h] * Math.tanh(p.W[o + h] * e + p.W[o + NH + h] * b + p.W[o + 2 * NH + h]);
    const u = 100 * Math.tanh(out); p.u[a] = u;
    p.m[a] += (u - p.m[a]) * Math.min(1, DT / par.tau);
    const acc = par.G * Math.sin(p.th[a] * Math.PI / 180) + (-par.b * p.om[a] + par.K * par.eff * p.m[a] + par.d) / par.J;
    p.om[a] += acc * DT + (k === EP_KICK ? p.kick[a] : 0) + (kicks ? kicks[a] : 0); p.th[a] += p.om[a] * DT;
    p.cost[a] += p.th[a] * p.th[a] / 225 + .02 * (u / 100) * (u / 100);
    if (Math.abs(p.th[a]) >= par.stop){ p.th[a] = Math.sign(p.th[a]) * par.stop; p.alive[a] = 0; if (free) p.tc[a] = 240; else { p.tc[a] = k; p.crashes++; } }
  }
  if (free) return false;
  p.k++; return p.k >= EP_N;
}
function popEnd(p){ // score everyone, keep the better quarter of directions, move the shared weights that way
  const h = p.n / 2, r = new Float64Array(p.n); let surv = 0;
  for (let a = 0; a < p.n; a++){ r[a] = -(p.cost[a] / EP_N) - (p.alive[a] ? 0 : 4 * (1 - p.tc[a] / EP_N)); surv += p.alive[a]; }
  const idx = Array.from({ length: h }, (_, i) => i).sort((i, j) => Math.max(r[2 * j], r[2 * j + 1]) - Math.max(r[2 * i], r[2 * i + 1])).slice(0, Math.max(4, h >> 2));
  let mean = 0; for (const i of idx) mean += r[2 * i] + r[2 * i + 1]; mean /= idx.length * 2;
  let sd = 0; for (const i of idx) sd += (r[2 * i] - mean) ** 2 + (r[2 * i + 1] - mean) ** 2; sd = Math.sqrt(sd / (idx.length * 2)) || 1;
  if (p.explore) for (const i of idx){ const g = p.alpha / (idx.length * sd) * (r[2 * i] - r[2 * i + 1]); for (let j = 0; j < NPAR; j++) p.w[j] += g * p.D[i * NPAR + j]; p.elite[r[2 * i] > r[2 * i + 1] ? 2 * i : 2 * i + 1] = 1; }
  p.gen++; p.trials += p.n; p.hist.push(surv / p.n); return surv / p.n;
}
if (typeof module !== 'undefined') Object.assign(module.exports, { makePop, popReset, popStep, popEnd, EP_N });
// ---- gain scheduling: find the best PID gains for each condition, then teach a small network the map (supervised, gradient descent) ----
const GS_MAX = { kp: 8, ki: 14, kd: 1.5 }, GS_D = [0, 80, 160, 240, 320, 400], GS_E = [1, .9, .8, .7, .6, .5];
function gsCost(g, d, eff){ // a 15° step, then a gust, under this load and battery. Tracking error plus motor effort.
  const par = { ...BASE, d, eff }, s = makePlant(0), c = makePID(), N = Math.round(3 / DT); let J = 0;
  for (let k = 0; k < N; k++){ const sp = k < 30 ? 0 : 15, o = pidStep(c, g, sp, s.th, DT); stepPlant(s, o.u, par, DT, k === 480 ? 120 : 0); const e = sp - s.th; J += e * e / 225 + 2 * (o.u / 100) ** 2; if (s.hit) return 50; }
  return J / N;
}
function gsBest(d, eff){ // pattern search, the way an engineer would tune each operating point by hand, only faster
  let g = { kp: 3, ki: 2, kd: .45 }, J = gsCost(g, d, eff); const st = { kp: 1, ki: 2, kd: .15 };
  for (let it = 0; it < 7; it++){
    for (const k of ['kp', 'ki', 'kd']) for (const sg of [1, -1]) for (;;){ const h = { ...g }; h[k] = Math.min(GS_MAX[k], Math.max(0, h[k] + sg * st[k])); const Jh = gsCost(h, d, eff); if (Jh < J - 1e-6){ g = h; J = Jh; } else break; }
    for (const k in st) st[k] /= 2;
  }
  return g;
}
const GS_H = 8;
function gsNet(seed = 4){ // 2 inputs (load, battery) -> 8 tanh -> 3 outputs (Kp, Ki, Kd), all scaled to about 0..1
  const r = mulberry32(seed), P = [Array.from({ length: GS_H * 2 }, () => gauss(r) * .8), new Array(GS_H).fill(0), Array.from({ length: 3 * GS_H }, () => gauss(r) * .3), [.5, .3, .5]];
  return { P, m: P.map(a => a.map(() => 0)), v: P.map(a => a.map(() => 0)), t: 0, loss: NaN };
}
function gsFwd(n, x){
  const [W1, b1, W2, b2] = n.P, h = new Array(GS_H);
  for (let k = 0; k < GS_H; k++) h[k] = Math.tanh(W1[k * 2] * x[0] + W1[k * 2 + 1] * x[1] + b1[k]);
  const y = [0, 1, 2].map(o => { let s = b2[o]; for (let k = 0; k < GS_H; k++) s += W2[o * GS_H + k] * h[k]; return s; });
  return { h, y };
}
function gsEpoch(n, X, Y, lr = .02){ // one pass over the examples: guess, compare, and move every weight against its share of the error (Adam)
  const [W1, , W2] = n.P, g = n.P.map(a => a.map(() => 0)); let L = 0;
  for (let i = 0; i < X.length; i++){
    const x = X[i], { h, y } = gsFwd(n, x), dy = y.map((v, o) => { const e = v - Y[i][o]; L += e * e; return 2 * e / X.length; });
    for (let o = 0; o < 3; o++){ g[3][o] += dy[o]; for (let k = 0; k < GS_H; k++) g[2][o * GS_H + k] += dy[o] * h[k]; }
    for (let k = 0; k < GS_H; k++){ let dh = 0; for (let o = 0; o < 3; o++) dh += dy[o] * W2[o * GS_H + k]; dh *= 1 - h[k] * h[k]; g[1][k] += dh; g[0][k * 2] += dh * x[0]; g[0][k * 2 + 1] += dh * x[1]; }
  }
  n.t++;
  n.P.forEach((a, i) => { for (let j = 0; j < a.length; j++){ n.m[i][j] = .9 * n.m[i][j] + .1 * g[i][j]; n.v[i][j] = .999 * n.v[i][j] + .001 * g[i][j] ** 2; a[j] -= lr * (n.m[i][j] / (1 - .9 ** n.t)) / (Math.sqrt(n.v[i][j] / (1 - .999 ** n.t)) + 1e-8); } });
  n.loss = L / X.length; return n.loss;
}
const gsIn = (d, eff) => [d / 400, (1 - eff) / .5];
const gsOut = y => ({ kp: clamp(y[0], 0, 1.2) * GS_MAX.kp, ki: clamp(y[1], 0, 1.2) * GS_MAX.ki, kd: clamp(y[2], 0, 1.2) * GS_MAX.kd });
if (typeof module !== 'undefined') Object.assign(module.exports, { GS_MAX, GS_D, GS_E, gsCost, gsBest, gsNet, gsFwd, gsEpoch, gsIn, gsOut });
