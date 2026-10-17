// Звуки мебели и техники для режима «Люди»: синтез WebAudio, без звуковых файлов.
// У каждой двери и ящика свой «голос»: высота скрипа и тон удара зависят от seed (id детали).
// sfx(kind, 'start' | 'end', seed, closing): start — когда человек потянул, end — когда дверь или ящик дошли до конца.
let ac = null, out = null, nb = null;
function A() {
  try {
    if (!ac) {
      const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
      ac = new C(); const comp = ac.createDynamicsCompressor(); out = ac.createGain(); out.gain.value = 0.9; out.connect(comp); comp.connect(ac.destination);
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  } catch (e) { return null; }
}
const hash = s => { const x = Math.sin((s + 1) * 12.9898) * 43758.5453; return x - Math.floor(x); };
function noise() {
  if (!nb) { nb = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const s = ac.createBufferSource(); s.buffer = nb; s.loop = true; return s;
}
function env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
// шумовой удар через фильтр
function hit(t, f, q, dur, gain, type = 'bandpass', attack = 0.003) {
  const s = noise(), fl = ac.createBiquadFilter(), g = ac.createGain();
  fl.type = type; fl.frequency.value = f; fl.Q.value = q; env(g, t, attack, gain, dur);
  s.connect(fl); fl.connect(g); g.connect(out); s.start(t, Math.random() * 1.5); s.stop(t + attack + dur + 0.05);
}
const click = (t, f = 3000, g = 0.3) => hit(t, f, 2, 0.015, g, 'bandpass', 0.001);
// тон с глиссандо (удар, звон, писк)
function tone(t, f0, f1, dur, gain, type = 'sine', attack = 0.004) {
  const o = ac.createOscillator(), g = ac.createGain(); o.type = type;
  o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + attack + dur); env(g, t, attack, gain, dur);
  o.connect(g); g.connect(out); o.start(t); o.stop(t + attack + dur + 0.05);
}
// шуршание направляющих: полосовой шум с дребезгом шариков
function slide(t, dur, f, gain, rattle) {
  const s = noise(), fl = ac.createBiquadFilter(), g = ac.createGain(), am = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
  fl.type = 'bandpass'; fl.frequency.value = f; fl.Q.value = 1.1;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(gain, t + 0.08); g.gain.setValueAtTime(gain, t + dur - 0.12); g.gain.linearRampToValueAtTime(0.0001, t + dur);
  lfo.type = 'square'; lfo.frequency.value = rattle; lg.gain.value = 0.35; am.gain.value = 0.65; lfo.connect(lg); lg.connect(am.gain);
  s.connect(fl); fl.connect(am); am.connect(g); g.connect(out);
  s.start(t, Math.random()); s.stop(t + dur + 0.05); lfo.start(t); lfo.stop(t + dur + 0.05);
}
// скрип петли: «прилипание — срыв» — частые щелчки, каждый звенит на своей частоте; частота и темп плавают
function creak(t, dur, f, gain, seed, rate) {
  const sr = ac.sampleRate, n = Math.floor(sr * dur), buf = ac.createBuffer(1, n, sr), d = buf.getChannelData(0);
  const p1 = hash(seed) * 6.28, p2 = hash(seed + 7) * 6.28;
  let ph = 0, peak = 0;
  for (let i = 0; i < n; i++) {
    const x = i / sr, k = x / dur;
    ph += (rate[0] + (rate[1] - rate[0]) * (0.5 + 0.35 * Math.sin(6.9 * x + p1) + 0.15 * Math.sin(23 * x + p2))) / sr;
    if (ph < 1) continue;
    ph -= 1;
    const a = (0.55 + 0.45 * Math.random()) * Math.sin(Math.PI * Math.min(1, k * 1.1)), fr = f * (0.9 + 0.25 * Math.sin(4.1 * x + p2)), len = Math.min(n - i, Math.floor(sr * 0.012));
    for (let j = 0; j < len; j++) { const tt = j / sr, e = Math.exp(-tt * 420); d[i + j] += a * e * (Math.sin(6.283 * fr * tt) + 0.45 * Math.sin(6.283 * fr * 2.31 * tt)); }
  }
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(d[i]));
  if (peak > 0) for (let i = 0; i < n; i++) d[i] /= peak;
  const s = ac.createBufferSource(), g = ac.createGain(), hp = ac.createBiquadFilter();
  s.buffer = buf; g.gain.value = gain; hp.type = 'highpass'; hp.frequency.value = 300;
  s.connect(hp); hp.connect(g); g.connect(out); s.start(t);
}
export function sfx(kind, phase, seed = 1, closing = false) {
  if (!A()) return;
  const t = ac.currentTime + 0.01, h = hash(seed);
  switch (kind) {
    case 'door':   // скрип петель; закрылась — глухой удар и щелчок защёлки
      if (phase === 'start') { if (!closing) click(t, 2600, 0.25); creak(t + 0.03, closing ? 0.55 : 0.8, 650 + h * 1100, 0.32, seed, closing ? [50, 130] : [28, 95]); }
      else if (closing) { tone(t, 115 + h * 40, 50, 0.22, 0.55); hit(t, 500, 0.8, 0.12, 0.5, 'lowpass'); click(t + 0.02, 3200, 0.3); }
      else hit(t, 300, 1, 0.06, 0.15, 'lowpass');
      break;
    case 'lift':   // подъёмник: шипение газлифта, мягкий стук
      if (phase === 'start') { hit(t, 2600 + h * 1500, 0.7, 0.55, 0.12, 'highpass', 0.06); creak(t, 0.4, 1700 + h * 800, 0.12, seed, [40, 80]); }
      else { tone(t, closing ? 140 : 190, 90, 0.12, closing ? 0.45 : 0.2); hit(t, 450, 1, 0.08, closing ? 0.35 : 0.15, 'lowpass'); }
      break;
    case 'drawer':   // ящик: шуршание направляющих; закрылся — хлоп, внутри звякает
      if (phase === 'start') slide(t, closing ? 0.5 : 0.62, 900 + h * 1300, 0.28, 32 + h * 30);
      else if (closing) { tone(t, 150 + h * 60, 60, 0.2, 0.75); hit(t, 900, 0.7, 0.14, 0.65, 'lowpass'); for (let k = 0; k < 4; k++) hit(t + 0.03 + Math.random() * 0.12, 2500 + Math.random() * 2500, 6, 0.03, 0.12); }
      else { hit(t, 1800 + h * 600, 3, 0.04, 0.3); tone(t, 320, 220, 0.05, 0.18); }
      break;
    case 'slideDoor':   // купе: гул роликов и стук в конце
      if (phase === 'start') slide(t, 0.75, 350 + h * 200, 0.3, 22); else { tone(t, 95, 60, 0.16, 0.5); hit(t, 400, 1, 0.1, 0.4, 'lowpass'); }
      break;
    case 'fridge':   // холодильник: чмок уплотнителя, закрылся — «фшух» и звякнули бутылки
      if (phase === 'start') { if (!closing) { hit(t, 320, 0.9, 0.13, 0.7, 'lowpass', 0.015); tone(t, 58, 45, 0.14, 0.3); } else hit(t, 500, 0.6, 0.35, 0.06, 'lowpass', 0.08); }
      else if (closing) { hit(t, 230, 0.8, 0.2, 0.95, 'lowpass'); tone(t, 62, 36, 0.26, 0.7); tone(t + 0.04, 2350, 2350, 0.25, 0.09); tone(t + 0.07, 3170, 3170, 0.2, 0.07); }
      else { tone(t, 2350, 2350, 0.22, 0.06); tone(t + 0.05, 3170, 3170, 0.18, 0.05); }
      break;
    case 'oven': {   // духовка, посудомойка: скрип пружины и металлический лязг
      const clank = (tt, g) => { for (const [f, d] of [[520, 0.5], [1310, 0.35], [2240, 0.25]]) tone(tt, f, f * 0.995, d, g); hit(tt, 2200, 2, 0.04, g * 2); };
      if (phase === 'start') creak(t, 0.7, 2400 + h * 900, 0.16, seed, [18, 42]);
      else if (closing) { clank(t, 0.12); tone(t, 120, 60, 0.15, 0.45); } else clank(t, 0.08);
      break;
    }
    case 'washer':   // люк: щелчок замка
      if (phase === 'start' && !closing) { click(t, 2200, 0.4); tone(t, 230, 140, 0.07, 0.35); }
      else if (phase === 'end' && closing) { tone(t, 200, 120, 0.08, 0.45); click(t + 0.05, 2400, 0.4); click(t + 0.11, 1900, 0.3); }
      break;
    case 'micro':   // СВЧ: щёлк защёлки; закрыли — щёлк и «пик»
      if (phase === 'start' && !closing) { hit(t, 900, 1.5, 0.05, 0.55); tone(t, 170, 110, 0.06, 0.35); }
      else if (phase === 'end' && closing) { hit(t, 800, 1.5, 0.05, 0.6); tone(t, 160, 100, 0.06, 0.4); tone(t + 0.3, 1850, 1850, 0.14, 0.07, 'square'); }
      break;
    case 'lid':   // крышка: пластиковый скрип и щелчок
      if (phase === 'start') creak(t, 0.4, 2600 + h * 900, 0.13, seed, [55, 120]); else if (closing) hit(t, 1400, 1.2, 0.05, 0.6); else click(t, 2500, 0.2);
      break;
    case 'switch': click(t, 3800, 0.45); click(t + 0.035, 2600, 0.35); break;   // выключатель
  }
}
