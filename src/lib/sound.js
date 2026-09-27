/* Tiny Web Audio sound kit.
   iOS note: the ring/silent switch mutes Web Audio unless the page's audio session is "playback".
   We set navigator.audioSession (Safari 17+) and also play a silent <audio> once (older iOS). */
let on = true; try { on = localStorage.getItem("td-sound") !== "off"; } catch (e) {}
let AC = null, unlocked = false;
const listeners = new Set();
export const soundOn = () => on;
export function onSoundChange(f) { listeners.add(f); return () => listeners.delete(f); }
export function setSound(v) { on = v; try { localStorage.setItem("td-sound", v ? "on" : "off"); } catch (e) {} listeners.forEach(f => f(v)); if (v) { unlock(); sfx.click(); } }

const SILENT = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
function ctx() { try { if (!AC) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; AC = new C(); } } catch (e) { return null; } return AC; }
let keep = null;
function keepAlive() {
  try { if (!keep) { keep = new Audio(SILENT); keep.setAttribute("playsinline", ""); keep.loop = true; keep.volume = .01; }
    if (keep.paused) keep.play().catch(() => {}); } catch (e) {}
}
export function unlock() {
  try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {}
  const c = ctx(); if (!c) return;
  if (c.state !== "running") c.resume().catch(() => {});
  keepAlive();
  if (!unlocked) { unlocked = true; try { const b = c.createBuffer(1, 1, 22050), s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0); } catch (e) {} }
}
/* iOS hands the audio session back after a lock screen, a phone call or a notification: take it again */
addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") setTimeout(unlock, 50); });
addEventListener("pageshow", () => setTimeout(unlock, 50));
addEventListener("focus", () => setTimeout(unlock, 50));
["pointerdown", "touchend", "keydown"].forEach(ev => addEventListener(ev, unlock, { passive: true }));

function ready() { if (!on) return null; const c = ctx(); if (!c) return null; if (c.state !== "running") c.resume().catch(() => {}); return c; }
function tone(f, dur, type = "sine", g = .06, when = 0, slide) {
  const c = ready(); if (!c) return; const t = c.currentTime + when, o = c.createOscillator(), v = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
  v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(g, t + .01); v.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(v).connect(c.destination); o.start(t); o.stop(t + dur + .05);
}
function noise(dur, g = .05, when = 0, freq = 2500, q = 1, sweepTo) {
  const c = ready(); if (!c) return; const t = c.currentTime + when, n = Math.max(1, Math.floor(c.sampleRate * dur)), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 1.5);
  const s = c.createBufferSource(); s.buffer = b; const f = c.createBiquadFilter(); f.type = "bandpass"; f.Q.value = q; f.frequency.setValueAtTime(freq, t);
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
  const v = c.createGain(); v.gain.value = g; s.connect(f).connect(v).connect(c.destination); s.start(t);
}
/* metallic ping: inharmonic partials like a struck bronze coin */
function metal(base, g = .05, when = 0, dur = 1.2) { [1, 2.76, 5.4, 8.93].forEach((m, i) => tone(base * m, dur / (1 + i * .6), "sine", g / (1 + i * 1.3), when)); }

export const sfx = {
  click() { noise(.03, .05, 0, 3200, 2); tone(1700, .05, "triangle", .02); },
  tap() { noise(.02, .04, 0, 4200, 3); },
  flip() { noise(.09, .06, 0, 1800, .8, 5200); },
  shuffle() { for (let i = 0; i < 9; i++) noise(.025, .05, i * .045 + Math.random() * .01, 2600 + Math.random() * 1400, 3); },
  charge(p) { tone(220 + p * 500, .09, "sine", .025); },
  reveal() { [392, 523, 659, 784, 1046].forEach((f, i) => tone(f, .9, "sine", .035, i * .06)); noise(.5, .02, 0, 6000, .5, 1500); },
  transform() { noise(.7, .05, 0, 300, .7, 6000); [523, 784, 1046, 1568].forEach((f, i) => { tone(f, .8, "triangle", .03, .35 + i * .07); tone(f * 1.01, .8, "sine", .02, .35 + i * .07); }); },
  claim() { tone(660, .3, "sine", .05, .02); tone(990, .4, "sine", .04, .1); tone(1320, .6, "sine", .03, .18); },
  activate() { [523, 659, 784, 1046].forEach((f, i) => tone(f, .45, "triangle", .045, i * .07)); },
  mirror() { [880, 1108, 1318, 1760].forEach((f, i) => { tone(f, .7, "sine", .025, i * .06); tone(f * 1.012, .7, "sine", .025, i * .06); }); },
  chaos() { tone(320, .55, "sawtooth", .035, 0, 110); tone(333, .55, "square", .016, 0, 95); noise(.3, .03, .05, 600); },
  tear() { noise(.28, .09, 0, 1200, .6, 4200); noise(.12, .05, .2, 3000, 1); },
  stamp() { noise(.08, .09, 0, 380, .8); tone(120, .14, "sine", .07); },
  paper() { noise(.18, .04, 0, 2200, .5, 900); },
  toss() { metal(2300, .035); noise(.05, .03, 0, 6000, 2); },
  clink(g = 1) { metal(1750 + Math.random() * 200, .05 * g, 0, .6); },
  settle() { for (let i = 0; i < 6; i++) metal(1850, .03 * (1 - i / 7), i * (.11 - i * .012), .25); },
  success() { [659, 880, 1175].forEach((f, i) => tone(f, .5, "triangle", .045, i * .09)); },
  fail() { tone(330, .3, "triangle", .04, 0, 250); tone(262, .45, "triangle", .04, .18, 196); },
  bell() { metal(880, .05, 0, 1.6); }
};

/* ---------- little instruments for the playable pieces ---------- */
const PENTA = [0, 2, 4, 7, 9];
export const note = (i, base = 523.25) => base * Math.pow(2, (PENTA[((i % 5) + 5) % 5] + 12 * Math.floor(i / 5)) / 12);
function pluckTone(f, g = .05, when = 0, dur = 1.2) {
  const c = ready(); if (!c) return; const t = c.currentTime + when;
  [[1, "triangle", 1], [2, "sine", .35], [3, "sine", .12]].forEach(([m, type, a]) => { const o = c.createOscillator(), v = c.createGain(), lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.setValueAtTime(f * 6, t); lp.frequency.exponentialRampToValueAtTime(f * 1.5, t + dur);
    o.type = type; o.frequency.value = f * m; v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(g * a, t + .004); v.gain.exponentialRampToValueAtTime(.0001, t + dur / m); o.connect(lp).connect(v).connect(c.destination); o.start(t); o.stop(t + dur + .05); });
}
export const mus = {
  pluck(i, g = .05, when = 0) { pluckTone(note(i), g, when); },
  harp(start = 0, n = 6, gap = .07) { for (let k = 0; k < n; k++) pluckTone(note(start + k), .04, k * gap, 1.6); },
  chime(i, g = .03, when = 0) { const f = note(i, 1046.5); tone(f, 1.8, "sine", g, when); tone(f * 2.01, 1.1, "sine", g * .35, when); tone(f * 3.98, .6, "sine", g * .15, when); },
  drip(i) { const f = note(i, 880); tone(f * 1.6, .12, "sine", .035, 0, f * .9); },
  bubble(h = .5) { const f = 300 + h * 500; tone(f, .16, "sine", .045, 0, f * 2.2); },
  fizz(d = .6) { noise(d, .012, 0, 7000, .6, 9000); },
  clink(i = 0) { metal(1600 + i * 180, .04, 0, .9); },
  pop() { noise(.03, .06, 0, 1800, 2); tone(520, .08, "sine", .04, 0, 980); },
  flutter() { for (let k = 0; k < 5; k++) noise(.04, .02, k * .05, 900 + Math.random() * 600, 2); },
  swell(i = 0) { [0, 2, 4].forEach((d, k) => { const c = ready(); if (!c) return; const t = c.currentTime, o = c.createOscillator(), v = c.createGain(); o.type = "sine"; o.frequency.value = note(i + d, 261.6); v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(.018, t + 1.2); v.gain.exponentialRampToValueAtTime(.0001, t + 4.5); o.connect(v).connect(c.destination); o.start(t + k * .15); o.stop(t + 5); }); },
  whoosh() { noise(.5, .03, 0, 500, .7, 3500); },
  meow() { tone(700, .12, "triangle", .04, 0, 950); tone(950, .28, "triangle", .035, .1, 620); tone(1400, .2, "sine", .012, .1, 900); },
  purr(d = 1.2) { const c = ready(); if (!c) return; const t = c.currentTime, o = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(), v = c.createGain(); o.type = "sawtooth"; o.frequency.value = 55; lfo.frequency.value = 24; lg.gain.value = .012; lfo.connect(lg).connect(v.gain); v.gain.value = .012; const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 220; o.connect(lp).connect(v).connect(c.destination); o.start(t); lfo.start(t); v.gain.setTargetAtTime(0, t + d, .2); o.stop(t + d + 1); lfo.stop(t + d + 1); }
};
/* a soft looping melody for the mini-games: returns stop() */
export function bgm(seq = [0, 2, 4, 7, 4, 2], bpm = 96, base = 0) {
  let i = 0; const beat = 60 / bpm * 1000;
  const id = setInterval(() => { const n = seq[i % seq.length]; if (n != null) INST[theme](note(n + base, 392), .022, 0); if (i % 4 === 0) tone(note(base, 98), .5, "sine", .02); i++; }, beat / 2);
  return () => clearInterval(id);
}
export function sizzle(g = .02) { noise(.25, g, 0, 5000 + Math.random() * 2000, .7); }

/* ---------- city sound themes: every note in the app is played by the local instrument ---------- */
const INST = {
  piano(f, g, w = 0) { const c = ready(); if (!c) return; const t = c.currentTime + w; [[1, .9, "triangle"], [2, .35, "sine"], [3, .15, "sine"], [4.01, .06, "sine"]].forEach(([m, a, ty]) => { const o = c.createOscillator(), v = c.createGain(); o.type = ty; o.frequency.value = f * m; v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(g * a, t + .005); v.gain.exponentialRampToValueAtTime(g * a * .3, t + .25); v.gain.exponentialRampToValueAtTime(.0001, t + 1.8 / m); o.connect(v).connect(c.destination); o.start(t); o.stop(t + 2); }); noise(.02, g * .15, w, 2500, 1); },
  angklung(f, g, w = 0) { for (let k = 0; k < 6; k++) { tone(f, .09, "sine", g * (1 - k * .12), w + k * .055); tone(f * 2, .07, "sine", g * .4 * (1 - k * .12), w + k * .055); tone(f * 3.02, .05, "triangle", g * .12, w + k * .055); } },
  ranat(f, g, w = 0) { tone(f, .35, "sine", g, w); tone(f * 3.9, .12, "sine", g * .35, w); tone(f * 9.2, .05, "sine", g * .12, w); noise(.015, g * .3, w, 3500, 3); },
  guzheng(f, g, w = 0) { const c = ready(); if (!c) return; const t = c.currentTime + w, o = c.createOscillator(), v = c.createGain(), lp = c.createBiquadFilter(); o.type = "sawtooth"; o.frequency.setValueAtTime(f * 1.012, t); o.frequency.exponentialRampToValueAtTime(f, t + .08); o.frequency.setValueAtTime(f, t + .5); o.frequency.linearRampToValueAtTime(f * 1.02, t + .7); lp.type = "lowpass"; lp.frequency.setValueAtTime(f * 5, t); lp.frequency.exponentialRampToValueAtTime(f * 1.2, t + 1.2); v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(g * .7, t + .004); v.gain.exponentialRampToValueAtTime(.0001, t + 1.6); o.connect(lp).connect(v).connect(c.destination); o.start(t); o.stop(t + 1.7); },
  bells(f, g, w = 0) { [1, 2.4, 4.1, 5.9].forEach((m, i) => tone(f * .5 * m, 2.4 / (1 + i * .6), "sine", g * .8 / (1 + i), w)); },
  dulcimer(f, g, w = 0) { [0, .006].forEach(d => { tone(f * (1 + d), .9, "triangle", g * .6, w); tone(f * 2 * (1 + d), .5, "sine", g * .2, w); }); noise(.012, g * .4, w, 4000, 2); },
  steelpan(f, g, w = 0) { tone(f, .9, "sine", g, w); tone(f * 2, .6, "sine", g * .45, w); tone(f * 3.01, .3, "sine", g * .2, w); tone(f * 1.5, .4, "sine", g * .1, w + .01); },
  musicbox(f, g, w = 0) { tone(f * 2, .8, "sine", g * .8, w); tone(f * 4.02, .4, "sine", g * .25, w); tone(f * 6.3, .15, "sine", g * .08, w); }
};
const CITY_INST = { seoul: "guzheng", busan: "guzheng", tokyo: "musicbox", osaka: "musicbox", kyoto: "guzheng", tpe: "piano", dali: "guzheng", lijiang: "guzheng", kunming: "bells", jdz: "bells", hrb: "piano", krabi: "ranat", songkhla: "ranat", sapa: "ranat", hcm: "ranat", akl: "steelpan", zqn: "musicbox", xm: "piano", qz: "guzheng", zz: "guzheng", fz: "guzheng", cs2: "guzheng", hz: "guzheng", bj: "bells", xa: "bells", cs: "bells", zjj: "bells", gz: "dulcimer", hk: "dulcimer", mo: "dulcimer", cd: "guzheng", cq: "dulcimer", sh: "piano",
  kl: "angklung", ipoh: "angklung", taiping: "angklung", pen: "angklung", mlk: "angklung", jb: "angklung", cam: "angklung", kk: "angklung", lgk: "angklung", sg: "steelpan", bkk: "ranat", cnx: "ranat", hkt: "ranat", hatyai: "ranat" };
export const THEME_NAME = { piano: ["钢琴", "Piano"], angklung: ["竹筒琴", "Angklung"], ranat: ["木琴", "Ranat"], guzheng: ["古筝", "Guzheng"], bells: ["编钟", "Bells"], dulcimer: ["扬琴", "Dulcimer"], steelpan: ["钢鼓", "Steel pan"], musicbox: ["八音盒", "Music box"] };
let theme = "musicbox";
export function setSoundTheme(cityId) { theme = CITY_INST[cityId] || "musicbox"; return theme; }
export const soundTheme = () => theme;
export function play(i, g = .05, when = 0) { INST[theme](note(i), g, when); }
/* route the shared instruments + key app sounds through the local instrument */
mus.pluck = (i, g = .05, when = 0) => INST[theme](note(i), g * .9, when);
mus.harp = (start = 0, n = 6, gap = .07) => { for (let k = 0; k < n; k++) INST[theme](note(start + k), .035, k * gap); };
mus.chime = (i, g = .03, when = 0) => INST[theme](note(i, 1046.5), g, when);
sfx.success = () => [0, 2, 4].forEach((d, k) => INST[theme](note(4 + d), .04, k * .09));
sfx.claim = () => [2, 4, 7].forEach((d, k) => INST[theme](note(5 + d), .04, k * .08));
sfx.activate = () => [0, 2, 4, 7].forEach((d, k) => INST[theme](note(2 + d), .04, k * .07));
sfx.reveal = () => { for (let k = 0; k < 6; k++) INST[theme](note(3 + k), .03, k * .06); };
sfx.bell = () => INST[theme](note(7), .045, 0);
sfx.fail = () => { INST[theme](note(4), .035); INST[theme](note(1), .035, .16); };

/* one big sound per card, for when a skill fires (yours or someone else's) */
export function cardFx(k) {
  const c = ready(); if (!c) return;
  switch (String(k)) {
    case "K": [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 1.2, "sine", .04, i * .05)); [1046, 784, 659, 523].forEach((f, i) => tone(f, .9, "sine", .03, .5 + i * .07)); break;                 // mirror: up, then back
    case "Q": for (let i = 0; i < 6; i++) { noise(.03, .05, i * .18, 2600, 3); tone(880, .05, "square", .02, i * .18); } tone(220, 1.6, "sine", .05, 1.1, 110); break;                                   // clock ticks, then time slows
    case "J": [392, 523, 659].forEach((f, i) => tone(f, .7, "triangle", .05, i * .08)); tone(880, 1.4, "sine", .04, .4, 440); noise(.6, .02, .4, 900, .6, 3000); break;                                    // a red string plucked
    case "10": [523, 659, 784].forEach((f, i) => tone(f, .35, "triangle", .06, i * .12)); [1046, 1318].forEach((f, i) => tone(f, 1.1, "triangle", .05, .45 + i * .15)); metal(1568, .03, .9, 1.6); break;   // fanfare
    case "9": tone(200, .5, "sine", .06, 0, 1600); noise(.5, .04, 0, 1200, .8, 6000); tone(1600, .4, "sine", .03, .45, 200); break;                                                                      // portal whoosh
    case "8": [261, 329, 392, 523].forEach((f, i) => tone(f * (1 + Math.sin(i) * .01), 2.2, "sine", .03, i * .3)); noise(2, .015, 0, 400, 1.5); break;                                                    // a dream, out of tune
    case "7": noise(.18, .06, 0, 3000, 2, 800); tone(1200, .18, "sine", .04, 0, 300); tone(90, .6, "sine", .09, .22); noise(.25, .05, .22, 200, 1.5); break;                                                // arrow flies, hits
    case "6": noise(1.6, .12, 0, 120, 2.5, 60); tone(55, 1.8, "sine", .1, .05, 30); [0, .35, .7].forEach(w => noise(.12, .05, w, 3000, 3)); break;                                                          // thunder
    case "4": metal(660, .05, 0, 2.2); metal(495, .04, .5, 2.2); metal(330, .05, 1, 3); break;                                                                                                            // temple bell, three strikes
    case "X": noise(1.4, .04, 0, 600, 1.2, 2400); [440, 415, 466, 440].forEach((f, i) => tone(f, .5, "sine", .03, i * .3)); break;                                                                          // wind, a wavering note
    default: sfx.success();
  }
}
