/* Little motion pieces, each tied to a moment in the app. Canvas 2D, paper grain, tap to play. */
import { sfx, mus } from "./sound.js";
import { buzz, esc, REDUCE } from "./util.js";
import { t as T } from "./i18n.js";

let grain = null;
function grainTex() { if (grain) return grain; const c = document.createElement("canvas"); c.width = c.height = 256; const x = c.getContext("2d"), d = x.createImageData(256, 256); for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = Math.random() < .5 ? 18 : 0; } x.putImageData(d, 0, 0); for (let i = 0; i < 90; i++) { x.fillStyle = `rgba(40,30,20,${Math.random() * .35})`; x.beginPath(); x.arc(Math.random() * 256, Math.random() * 256, Math.random() * 1.3, 0, 7); x.fill(); } return grain = c; }
const rnd = (a, b) => a + Math.random() * (b - a);
function star4(x, cx, cy, r, a = 1) { x.save(); x.globalAlpha = a; x.translate(cx, cy); const g = x.createRadialGradient(0, 0, 0, 0, 0, r * 2.2); g.addColorStop(0, "rgba(255,255,245,.9)"); g.addColorStop(1, "rgba(255,255,245,0)"); x.fillStyle = g; x.beginPath(); x.arc(0, 0, r * 2.2, 0, 7); x.fill(); x.fillStyle = "#fffdf4"; x.beginPath(); x.moveTo(0, -r * 2); x.quadraticCurveTo(r * .18, -r * .18, r * 2, 0); x.quadraticCurveTo(r * .18, r * .18, 0, r * 2); x.quadraticCurveTo(-r * .18, r * .18, -r * 2, 0); x.quadraticCurveTo(-r * .18, -r * .18, 0, -r * 2); x.fill(); x.restore(); }
function drop(x, cx, cy, r, col) { x.fillStyle = col; x.beginPath(); x.moveTo(cx, cy - r * 2.2); x.bezierCurveTo(cx + r * .9, cy - r * .6, cx + r, cy + r * .9, cx, cy + r); x.bezierCurveTo(cx - r, cy + r * .9, cx - r * .9, cy - r * .6, cx, cy - r * 2.2); x.fill(); }

const PIECES = {
  /* 用指尖落一场雨 — rainy weather */
  rain: { bg: "#d9d2bf", caption: () => T("雨下过了，叶子湿了，\n小路亮晶晶的。", "The rain has passed, the leaves are wet,\nthe little road is shining."), hint: () => T("按住云朵，落一场雨", "Hold the cloud to make it rain"),
    init(s) { s.blocks = [["#9fb3c4", .0, .19, .52, .12], ["#e8b8b0", .66, .34, .34, .16], ["#e3d56a", .0, .6, .56, .15], ["#b8c4b0", .56, .82, .3, .14], ["#c8bfa8", .36, .36, .32, .26]]; s.th = Array.from({ length: 12 }, (_, i) => ({ x: i / 11, len: rnd(20, 60), ph: rnd(0, 6), drops: Array.from({ length: 30 }, () => ["#3b5ea8", "#6f90c0", "#a8c0d8", "#ffffff", "#ffffff", "#2a3f8a", "#d9533f"][Math.floor(Math.random() * (Math.random() < .08 ? 7 : 6))]) })); s.hold = false; },
    frame(s, x, w, h, t, dt) {
      s.blocks.forEach(([c, a, b, cw, ch]) => { x.fillStyle = c; x.globalAlpha = .55; x.fillRect(a * w, b * h, cw * w, ch * h); }); x.globalAlpha = 1;
      x.font = `${w * .045}px "Special Elite", monospace`; x.fillStyle = "#3b5ea8"; [["R", .15, .3], ["a", .78, .5], ["n", .22, .54], ["i", .18, .72], ["y", .68, .86]].forEach(([c, a, b]) => x.fillText(c, a * w, b * h));
      const cx = w / 2, cy = h * .3, R = w * .1;
      x.fillStyle = "#1f3f98"; x.beginPath(); [[-1.4, .3, .9], [-.6, -.25, 1.1], [.4, -.35, 1.2], [1.3, .2, .95], [0, .45, 1.2]].forEach(([dx, dy, r]) => { x.moveTo(cx + dx * R + r * R, cy + dy * R); x.arc(cx + dx * R, cy + dy * R, r * R, 0, 7); }); x.fill();
      if (s.hold) { s.dt = (s.dt || 0) + dt; if (s.dt > .11) { s.dt = 0; mus.drip(Math.floor(Math.random() * 8)); } }
      s.th.forEach((th, i) => { if (s.hold) th.len = Math.min(h * .72, th.len + dt * rnd(80, 160)); else th.len = Math.max(30, th.len - dt * 20);
        const x0 = cx - R * 1.9 + th.x * R * 3.8, y0 = cy + R * .9; x.strokeStyle = "rgba(90,70,50,.6)"; x.lineWidth = .7; x.beginPath(); x.moveTo(x0, y0);
        const sway = k => Math.sin(t * 1.3 + th.ph + k * .015) * k * .02; x.quadraticCurveTo(x0 + sway(th.len / 2), y0 + th.len / 2, x0 + sway(th.len), y0 + th.len); x.stroke();
        for (let k = 0, n = Math.floor(th.len / 32); k <= n; k++) { const yy = y0 + 20 + k * 32; if (yy > y0 + th.len) break; drop(x, x0 + sway(yy - y0), yy, 5 + (k % 3), th.drops[k % 30]); } });
    } },
  /* 西瓜冰 — hot weather */
  melon: { bg: "#8fd6cc", caption: (o) => T(`今天 ${o.temp || "32"}°，来一杯西瓜冰。`, `${o.temp || "32"}° today — have a watermelon ice.`), hint: () => T("点一下，加一块冰", "Tap to drop in some ice"),
    init(s, w, h) { s.ice = Array.from({ length: 7 }, (_, i) => ({ x: w * (.35 + (i % 4) * .15), y: h * (.58 + Math.floor(i / 4) * .1), r: rnd(-.4, .4), vy: 0, float: true })); s.bub = []; },
    tap(s, px, py, w, h) { s.ice.push({ x: px, y: py, r: rnd(-.6, .6), vy: 0, float: false }); for (let i = 0; i < 6; i++) s.bub.push({ x: px + rnd(-30, 30), y: py + rnd(0, 40), r: rnd(3, 9), v: rnd(20, 50) }); mus.clink(Math.floor(Math.random() * 4)); setTimeout(() => { mus.fizz(.8); mus.bubble(Math.random()); }, 260); },
    frame(s, x, w, h, t, dt) {
      x.save(); x.beginPath(); x.moveTo(-w * .1, h * .22); x.lineTo(w * 1.1, h * .44); x.lineTo(w * 1.1, h); x.lineTo(-w * .1, h); x.closePath(); x.clip();
      x.beginPath(); x.arc(w * .5, h * .12, h * .88, 0, Math.PI); x.fillStyle = "#1f5a3a"; x.fill(); x.beginPath(); x.arc(w * .5, h * .12, h * .86, 0, Math.PI);
      const g = x.createRadialGradient(w * .5, h * .12, h * .2, w * .5, h * .12, h * .86); g.addColorStop(0, "#e95d5d"); g.addColorStop(.78, "#ee6a62"); g.addColorStop(.9, "#f2c46a"); g.addColorStop(1, "#c8e07a"); x.fillStyle = g; x.fill(); x.restore();
      const surf = xx => h * .22 + (xx + w * .1) / (w * 1.2) * h * .22;
      s.ice.forEach(c => { if (!c.float) { c.vy += 600 * dt; c.y += c.vy * dt; if (c.y > surf(c.x) + 40) { c.float = true; c.vy = 0; } } else { c.y += Math.sin(t * 1.5 + c.x) * .15; c.r += Math.sin(t + c.x) * .002; }
        x.save(); x.translate(c.x, c.y); x.rotate(c.r); x.strokeStyle = "rgba(255,255,255,.95)"; x.lineWidth = 1.6; const S = w * .1, rr = S * .28; x.beginPath(); x.roundRect ? x.roundRect(-S / 2, -S / 2, S, S, rr) : x.rect(-S / 2, -S / 2, S, S); x.stroke(); x.restore(); });
      s.bub = s.bub.filter(b => { b.y -= b.v * dt; x.strokeStyle = "rgba(255,255,255,.8)"; x.lineWidth = 1; x.beginPath(); x.arc(b.x, b.y, b.r, 0, 7); x.stroke(); return b.y > surf(b.x); });
      if (Math.random() < dt * 2) s.bub.push({ x: rnd(w * .3, w * .9), y: h * .8, r: rnd(2, 6), v: rnd(15, 35) });
    } },
  /* 打开星空灯 — night */
  stars: { bg: "#08070d", dark: true, caption: () => T("你可以向繁星说说今天，\n然后它陪你入梦。晚安。", "Tell the stars about today,\nthen let them walk you into sleep. Good night."), hint: () => T("点月亮，点亮星空灯", "Tap the moon to light the lamp"),
    init(s) { mus.swell(0); s.lit = 0; s.st = Array.from({ length: 26 }, (_, i) => ({ dx: rnd(-.8, .8), len: rnd(.12, .5), ph: rnd(0, 6), r: rnd(2, 5), blue: i === 5 })); },
    tap(s) { s.lit = Math.min(3, s.lit + 1); mus.harp(s.lit * 2, 7, .06); buzz(8); },
    frame(s, x, w, h, t, dt) {
      const cx = w * .5, cy = h * .32, R = w * .18; s.lv = (s.lv || 0) + ((s.lit / 3) - (s.lv || 0)) * dt * 2;
      const halo = x.createRadialGradient(cx, cy, R * .5, cx, cy, R * 2.2); halo.addColorStop(0, "rgba(255,250,235,.12)"); halo.addColorStop(1, "rgba(255,250,235,0)"); x.fillStyle = halo; x.fillRect(0, 0, w, h);
      if (!s.moon || s.moonR !== R) { const c = document.createElement("canvas"); c.width = c.height = Math.ceil(R * 2 + 4); const m = c.getContext("2d"); m.fillStyle = "#f3f0e4"; m.beginPath(); m.arc(R + 2, R + 2, R, 0, 7); m.fill(); m.globalCompositeOperation = "destination-out"; m.beginPath(); m.arc(R + 2 - R * .38, R + 2 - R * .3, R * .86, 0, 7); m.fill(); s.moon = c; s.moonR = R; } x.drawImage(s.moon, cx - R - 2, cy - R - 2);
      x.strokeStyle = "#2a3ad8"; x.lineWidth = 2; x.beginPath(); x.moveTo(cx - R * .7, cy + R * .6); x.bezierCurveTo(cx - R * .3, cy + R * .2, cx, cy + R * .9, cx + R * .4, cy + R * .5); x.bezierCurveTo(cx + R * .8, cy + R * .1, cx + R * .9, cy - R * .3, cx + R * .6, cy - R * .7); x.stroke();
      s.st.forEach(p => { const x0 = cx + p.dx * R, y0 = cy + Math.sqrt(Math.max(0, 1 - p.dx * p.dx)) * R * .9, L = h * p.len * (.35 + s.lv * .9); x.strokeStyle = p.blue ? "#2a3ad8" : "rgba(255,255,245,.55)"; x.lineWidth = p.blue ? 1.4 : .6;
        const sw = Math.sin(t * .8 + p.ph) * 4; x.beginPath(); x.moveTo(x0, y0); x.quadraticCurveTo(x0 + sw, y0 + L / 2, x0 + sw * .5, y0 + L); x.stroke();
        if (!p.blue && Math.random() < dt * .08) mus.chime(Math.floor(Math.random() * 6), .012); if (p.blue) drop(x, x0 + sw * .5, y0 + L + 10, 6, "#2a3ad8"); else star4(x, x0 + sw * .5, y0 + L, p.r * (.6 + s.lv * .6), .45 + s.lv * .55 + Math.sin(t * 3 + p.ph) * .1); });
    } },
  /* 放空 15 秒 — cloudy weather / a rest */
  puffs: { bg: "#3c8fb0", caption: () => T("让日子轻轻地，\n像叶尖上的露水。", "Let the days be light,\nlike dew on the tip of a leaf."), hint: () => T("放空 15 秒 · 点一下光团", "Breathe for 15 seconds · tap a light"),
    init(s, w, h) { mus.swell(2); s.p = Array.from({ length: 16 }, () => ({ x: rnd(.12, .88) * w, top: rnd(.28, .85) * h, g: 0, sp: rnd(.2, .5), r: rnd(10, 22), y: Math.random() < .4, pop: 0 })); s.start = performance.now(); },
    tap(s, px, py) { const q = s.p.find(p => Math.hypot(p.x - px, p.cur - py) < p.r * 2); if (q) { q.pop = 1; mus.pop(); mus.pluck(Math.floor((1 - q.cur / 900) * 9), .04); buzz(6); } },
    frame(s, x, w, h, t, dt) {
      [["#5fb0cc", .38], ["#3f95b8", .52], ["#2c7fa4", .7]].forEach(([c, y], i) => { x.fillStyle = c; x.beginPath(); x.moveTo(0, h); for (let X = 0; X <= w; X += 10) x.lineTo(X, h * y + Math.sin(X / w * 3 + i * 1.7) * h * .05); x.lineTo(w, h); x.fill(); });
      s.p.forEach(p => { p.g = Math.min(1, p.g + dt * p.sp); const y = h - (h - p.top) * p.g; p.cur = y; x.strokeStyle = "rgba(20,40,60,.55)"; x.lineWidth = .8; x.beginPath(); x.moveTo(p.x, h); x.quadraticCurveTo(p.x + Math.sin(t + p.x) * 6, (h + y) / 2, p.x + Math.sin(t * .7 + p.x) * 3, y); x.stroke();
        if (p.pop) { p.pop += dt * 2; x.strokeStyle = `rgba(220,240,255,${1 - p.pop / 2})`; for (let k = 0; k < 16; k++) { const a = k / 16 * 7, r1 = p.r * p.pop, r2 = p.r * p.pop * 1.8; x.beginPath(); x.moveTo(p.x + Math.cos(a) * r1, y + Math.sin(a) * r1); x.lineTo(p.x + Math.cos(a) * r2, y + Math.sin(a) * r2); x.stroke(); } if (p.pop > 2) { p.pop = 0; p.g = 0; p.top = rnd(.28, .85) * h; } return; }
        const gl = x.createRadialGradient(p.x, y, 0, p.x, y, p.r * 2.4); gl.addColorStop(0, "rgba(255,255,255,.55)"); gl.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = gl; x.beginPath(); x.arc(p.x, y, p.r * 2.4, 0, 7); x.fill();
        x.fillStyle = "#fbfbf6"; x.beginPath(); for (let k = 0; k < 14; k++) { const a = k / 14 * 7, rr = p.r * p.g * (1 + Math.sin(k * 3.1) * .08); x.lineTo(p.x + Math.cos(a) * rr, y + Math.sin(a) * rr); } x.fill(); if (p.y) { x.fillStyle = "#f3ea6a"; x.beginPath(); x.arc(p.x, y, p.r * p.g * .45, 0, 7); x.fill(); } });
      const left = Math.max(0, 15 - (performance.now() - s.start) / 1000); x.fillStyle = "rgba(255,255,240,.85)"; x.font = `${w * .04}px "Special Elite", monospace`; x.fillText(left > 0 ? `${Math.ceil(left)}″` : T("好了，继续出发", "Okay — let's go"), w * .08, h * .12);
    } },
  /* 穿针 — a buddy joins / 月老·红线 */
  needle: { bg: "#1d2854", dark: true, caption: (o) => o.text || T("红线系上了。", "The red thread is tied."), auto: 4200,
    init(s) { s.k = 0; mus.whoosh(); },
    frame(s, x, w, h, t, dt) {
      s.k = Math.min(1, s.k + dt / 2.2); const k = s.k, pass = k > .55;
      if (pass) { const g = x.createRadialGradient(w * .5, h * .5, 0, w * .5, h * .5, w * .9); g.addColorStop(0, `rgba(210,40,90,${(k - .55) * 1.8})`); g.addColorStop(1, `rgba(110,120,210,${(k - .55) * 1.6})`); x.fillStyle = g; x.fillRect(0, 0, w, h); }
      const ex = w * .5, ey = h * .48;
      x.save(); x.translate(ex, ey); x.rotate(-.33); const ng = x.createLinearGradient(0, -30, 0, h * .6); ng.addColorStop(0, "#fff"); ng.addColorStop(1, "#8a8ea8"); x.fillStyle = ng; x.beginPath(); x.moveTo(-9, 0); x.quadraticCurveTo(-10, -26, 0, -30); x.quadraticCurveTo(10, -26, 9, 0); x.lineTo(3, h * .7); x.lineTo(-3, h * .7); x.closePath(); x.fill();
      x.fillStyle = pass ? "rgba(200,60,110,.9)" : "#1d2854"; x.beginPath(); x.ellipse(0, -12, 3.2, 12, 0, 0, 7); x.fill(); x.restore();
      x.strokeStyle = "#fff"; x.lineWidth = 1.4; x.beginPath(); const tipx = -w * .1 + (ex + 6 + w * .1) * Math.min(1, k / .55), tipy = ey - 12 + (1 - Math.min(1, k / .55)) * h * .12; x.moveTo(-10, h * .62); x.quadraticCurveTo(w * .15, h * .7, tipx, tipy); x.stroke();
      if (pass && !s.rang) { s.rang = 1; mus.harp(3, 9, .05); mus.chime(7, .03, .45); }
      if (pass) { const cols = ["#6fe0f0", "#f06aa8", "#f0b04a", "#8aa8ff", "#ffffff", "#5fd0c8"]; for (let i = 0; i < 18; i++) { const a = -1.1 + i / 17 * 1.5, L = w * (.5 + (i % 3) * .12) * Math.min(1, (k - .55) * 2.4); x.strokeStyle = cols[i % 6]; x.globalAlpha = .75; x.lineWidth = .9; x.beginPath(); x.moveTo(ex + 6, ey - 12); x.quadraticCurveTo(ex + 6 + Math.cos(a) * L * .5, ey - 12 + Math.sin(a) * L * .45, ex + 6 + Math.cos(a) * L, ey - 12 + Math.sin(a) * L); x.stroke(); } x.globalAlpha = 1;
        star4(x, w * .77, h * .3, 5, (k - .55) * 2); star4(x, w * .68, h * .6, 3, (k - .55) * 2); }
    } },
  /* 庄周梦蝶 — cracks and butterflies */
  dream: { bg: "#e6e8e8", caption: () => T("不知周之梦为胡蝶与，\n胡蝶之梦为周与。", "Was it Zhou dreaming of a butterfly,\nor a butterfly dreaming of Zhou?"), auto: 5200,
    init(s, w, h) { s.k = 0; const cr = []; const grow = (x0, y0, a, len, d) => { if (d > 3) return; let px = x0, py = y0; const seg = []; for (let i = 0; i < len; i++) { a += rnd(-.5, .5); px += Math.cos(a) * 9; py += Math.sin(a) * 9; seg.push([px, py]); } cr.push(seg); if (Math.random() < .8) grow(px, py, a + rnd(-1, 1), len * .6, d + 1); if (Math.random() < .5) grow(px, py, a + rnd(-1.4, 1.4), len * .5, d + 1); };
      for (let i = 0; i < 6; i++) grow(w / 2, h * .48, i / 6 * Math.PI * 2 + rnd(-.3, .3), 8, 1); s.cr = cr; s.bf = Array.from({ length: 11 }, () => ({ x: w / 2 + rnd(-40, 40), y: h * .5 + rnd(-30, 40), tx: rnd(.15, .85) * w, ty: rnd(.12, .5) * h, ph: rnd(0, 6), s: rnd(.7, 1.3) })); },
    frame(s, x, w, h, t, dt) {
      s.k = Math.min(1, s.k + dt / 3); const k = s.k, show = Math.min(1, k / .4);
      x.strokeStyle = "#1a1a1a"; x.lineWidth = 1.2; s.cr.forEach(seg => { const n = Math.floor(seg.length * show); x.beginPath(); x.moveTo(w / 2, h * .48); for (let i = 0; i < n; i++) x.lineTo(seg[i][0], seg[i][1]); x.stroke(); });
      x.fillStyle = "#1c1c1a"; x.beginPath(); const R = w * .13 * show; for (let i = 0; i < 18; i++) { const a = i / 18 * 7, r = R * (1 + Math.sin(i * 2.3) * .28); x.lineTo(w / 2 + Math.cos(a) * r * .8, h * .5 + Math.sin(a) * r * 1.1); } x.fill();
      if (k > .12 && !s.cr1) { s.cr1 = 1; sfx.tear(); }
      if (k > .38 && !s.fl) { s.fl = 1; mus.flutter(); mus.harp(9, 7, .09); }
      if (k > .38) { const b = Math.min(1, (k - .38) / .6); if (Math.random() < dt * 1.2) mus.flutter(); s.bf.forEach(f => { const bx = f.x + (f.tx - f.x) * b + Math.sin(t * 2 + f.ph) * 8, by = f.y + (f.ty - f.y) * b + Math.cos(t * 1.7 + f.ph) * 6;
          x.strokeStyle = "rgba(210,40,40,.55)"; x.lineWidth = .7; x.beginPath(); x.moveTo(w / 2, h * .58); x.quadraticCurveTo((w / 2 + bx) / 2 + 20, h * .7, bx, by); x.stroke();
          const fl = Math.abs(Math.sin(t * 9 + f.ph)) * .7 + .3; x.save(); x.translate(bx, by); x.scale(f.s, f.s); x.fillStyle = "#1f3fe0"; [-1, 1].forEach(sd => { x.beginPath(); x.ellipse(sd * 8 * fl, -4, 9 * fl, 11, sd * .5, 0, 7); x.fill(); x.beginPath(); x.ellipse(sd * 6 * fl, 7, 6 * fl, 7, -sd * .4, 0, 7); x.fill(); }); x.fillStyle = "#111"; x.fillRect(-1, -9, 2, 18); x.restore(); }); }
    } }
};
export function playMotion(kind, o = {}) {
  const P = PIECES[kind]; if (!P) return; document.querySelector(".mo")?.remove();
  const ov = document.createElement("div"); ov.className = "mo" + (P.dark ? " dark" : ""); ov.setAttribute("role", "dialog");
  ov.innerHTML = `<canvas></canvas><div class="mo-grain"></div><button class="sc-x" aria-label="${T("关闭", "Close")}">×</button><p class="mo-cap"></p>${P.hint ? `<small class="mo-hint">${esc(P.hint(o))}</small>` : ""}`;
  document.body.appendChild(ov); requestAnimationFrame(() => ov.classList.add("on"));
  const cv = ov.querySelector("canvas"), x = cv.getContext("2d"), dpr = Math.min(2, devicePixelRatio || 1), s = {};
  let w, h; const size = () => { w = ov.clientWidth; h = ov.clientHeight; cv.width = w * dpr; cv.height = h * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); }; size(); P.init && P.init(s, w, h);
  const cap = ov.querySelector(".mo-cap"), full = P.caption(o); let ci = 0; const type = setInterval(() => { ci++; cap.textContent = full.slice(0, ci); if (ci % 2) sfx.tap && ci < full.length && Math.random() < .5 && sfx.tap(); if (ci >= full.length) clearInterval(type); }, 70);
  let run = true, last = performance.now(), t = 0;
  const loop = now => { if (!run) return; const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt; x.fillStyle = P.bg; x.fillRect(0, 0, w, h); P.frame(s, x, w, h, t, REDUCE ? 0 : dt); x.globalAlpha = 1; requestAnimationFrame(loop); }; requestAnimationFrame(loop);
  cv.addEventListener("pointerdown", e => { const r = cv.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top; if (kind === "rain") s.hold = true; P.tap && P.tap(s, px, py, w, h); });
  const up = () => { s.hold = false; }; cv.addEventListener("pointerup", up); cv.addEventListener("pointerleave", up);
  const close = () => { run = false; clearInterval(type); ov.classList.remove("on"); setTimeout(() => ov.remove(), 400); o.onClose && o.onClose(); };
  ov.querySelector(".sc-x").onclick = close; if (P.auto) setTimeout(() => { if (ov.isConnected) ov.classList.add("done"); }, P.auto);
  return close;
}
/* which piece fits the weather right now */
export function weatherMotion(v) { const hr = new Date().getHours(), txt = (v && v.text) || ""; if (hr >= 20 || hr < 5) return "stars"; if (/雨|hujan|rain|雷/i.test(txt)) return "rain"; if (v && (v.temp >= 31 || v.hi >= 32)) return "melon"; if (/云|阴|雾|cloud/i.test(txt)) return "puffs"; return v && v.temp >= 28 ? "melon" : "puffs"; }
if (typeof window !== "undefined") window.tdMotion = playMotion;
