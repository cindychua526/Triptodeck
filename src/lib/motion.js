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
  /* 工夫茶 — 关公巡城：一只杯一只杯轮着倒，倒满三杯请大家喝 */
  tea: { bg: "#efe3cc", caption: () => T("关公巡城，韩信点兵。\n三杯倒满，请喝茶。", "Round the cups, drop by drop.\nThree full cups — have some tea."), hint: () => T("点一下，倒一轮茶", "Tap to pour a round"),
    init(s) { s.fill = [0, 0, 0]; s.n = 0; s.pour = 0; s.tgt = 0; s.done = 0; s.steam = []; },
    tap(s) { if (s.done) { s.fill = [0, 0, 0]; s.n = 0; s.done = 0; mus.clink(1); return; } s.tgt = s.n % 3; s.n++; s.pour = .7; mus.drip(3 + s.tgt); buzz(5); },
    frame(s, x, w, h, t, dt) {
      const cy = h * .66, cw = w * .14, gap = w * .22, cx0 = w / 2 - gap;
      x.fillStyle = "#6b3a1e"; x.beginPath(); x.ellipse(w / 2, cy + cw * .55, w * .42, h * .06, 0, 0, 7); x.fill();
      x.strokeStyle = "rgba(255,230,190,.35)"; x.lineWidth = 1; for (let i = -3; i <= 3; i++) { x.beginPath(); x.moveTo(w / 2 + i * w * .1, cy + cw * .2); x.lineTo(w / 2 + i * w * .11, cy + cw * .9); x.stroke(); }
      s.fill.forEach((f, i) => { const cx = cx0 + i * gap; x.fillStyle = "#fbf8f1"; x.beginPath(); x.moveTo(cx - cw / 2, cy - cw * .45); x.lineTo(cx + cw / 2, cy - cw * .45); x.lineTo(cx + cw * .3, cy + cw * .35); x.lineTo(cx - cw * .3, cy + cw * .35); x.closePath(); x.fill(); x.strokeStyle = "#2a3a6a"; x.lineWidth = 1.2; x.stroke();
        if (f > 0) { const top = cy + cw * .35 - (cw * .75) * Math.min(1, f); x.save(); x.beginPath(); x.moveTo(cx - cw / 2, cy - cw * .45); x.lineTo(cx + cw / 2, cy - cw * .45); x.lineTo(cx + cw * .3, cy + cw * .35); x.lineTo(cx - cw * .3, cy + cw * .35); x.closePath(); x.clip(); x.fillStyle = "#b9712a"; x.fillRect(cx - cw, top, cw * 2, cw * 2); x.restore(); }
        x.strokeStyle = "#2a3a6a"; x.lineWidth = .8; x.beginPath(); x.moveTo(cx - cw * .2, cy - cw * .1); x.quadraticCurveTo(cx, cy - cw * .25, cx + cw * .2, cy - cw * .1); x.stroke();
        if (f >= 1 && Math.random() < dt * 3) s.steam.push({ x: cx + rnd(-cw * .2, cw * .2), y: cy - cw * .5, a: 1, ph: rnd(0, 6) }); });
      const tx = cx0 + s.tgt * gap, pot = s.pour > 0 ? 1 : 0, px = pot ? tx + w * .12 : w * .7, py = h * .3; s.px = (s.px ?? px) + (px - (s.px ?? px)) * Math.min(1, dt * 8);
      x.save(); x.translate(s.px, py); x.rotate(pot ? -.55 : 0); x.fillStyle = "#8a4a2a"; x.beginPath(); x.ellipse(0, 0, w * .09, w * .075, 0, 0, 7); x.fill(); x.fillRect(-w * .03, -w * .1, w * .06, w * .03); x.beginPath(); x.moveTo(-w * .08, -w * .01); x.quadraticCurveTo(-w * .16, -w * .04, -w * .17, -w * .08); x.lineWidth = w * .02; x.strokeStyle = "#8a4a2a"; x.stroke(); x.beginPath(); x.arc(w * .1, 0, w * .04, -1.4, 1.4); x.lineWidth = w * .012; x.stroke(); x.restore();
      if (s.pour > 0) { s.pour -= dt; s.fill[s.tgt] = Math.min(1, s.fill[s.tgt] + dt * .75); x.strokeStyle = "#b9712a"; x.lineWidth = 2.2; x.beginPath(); x.moveTo(s.px - w * .1, py - w * .05); x.quadraticCurveTo(tx - 4, py + (cy - py) * .3, tx, cy - cw * .45); x.stroke(); if (Math.random() < dt * 14) mus.drip(Math.floor(Math.random() * 3) + 4); }
      if (!s.done && s.fill.every(f => f >= .99)) { s.done = 1; mus.harp(2, 6, .07); buzz([10, 40, 10]); }
      s.steam = s.steam.filter(p => { p.y -= dt * 22; p.a -= dt * .45; x.strokeStyle = `rgba(120,90,60,${Math.max(0, p.a) * .5})`; x.lineWidth = 1.2; x.beginPath(); x.moveTo(p.x, p.y); x.quadraticCurveTo(p.x + Math.sin(t * 2 + p.ph) * 6, p.y - 8, p.x, p.y - 16); x.stroke(); return p.a > 0; });
      if (s.done) { x.fillStyle = "#6b3a1e"; x.font = `600 ${w * .06}px "Noto Serif SC", serif`; x.textAlign = "center"; x.fillText(T("请喝茶", "Tea's ready"), w / 2, h * .47); x.font = `${w * .032}px "Special Elite", monospace`; x.fillText(T("再点一下，重新泡一泡", "tap again for a fresh brew"), w / 2, h * .51); x.textAlign = "left"; }
    } },
  /* 放河灯 — 点一下放一盏灯，许一个愿 */
  lantern: { bg: "#10152a", dark: true, caption: () => T("把今天想说的，\n交给一盏灯。", "Give what you want to say today\nto a little lantern."), hint: () => T("点一下，放一盏灯", "Tap to let a lantern go"),
    init(s, w, h) { s.L = []; s.st = Array.from({ length: 70 }, () => ({ x: Math.random() * w, y: Math.random() * h * .6, r: rnd(.4, 1.3), ph: rnd(0, 6) })); s.W = T("平安到家|下次还一起来|吃遍整条街|天气一直好|不迷路|拍到最美的一张|大家都不吵架|钱包还有钱|遇到好人|睡个好觉|明天也很开心|想念的人也好", "home safe|come back together|eat the whole street|good weather|never get lost|the best photo|no fights|money left|kind strangers|good sleep|happy tomorrow|love to those far away").split("|"); },
    tap(s, px, py, w, h) { s.L.push({ x: px, y: h * .86, vx: rnd(-8, 8), ph: rnd(0, 6), w: s.W[Math.floor(Math.random() * s.W.length)], a: 0 }); mus.chime(Math.floor(Math.random() * 7), .025); buzz(6); if (s.L.length > 18) s.L.shift(); },
    frame(s, x, w, h, t, dt) {
      s.st.forEach(p => { x.fillStyle = `rgba(255,250,230,${.3 + Math.sin(t * 2 + p.ph) * .25})`; x.beginPath(); x.arc(p.x, p.y, p.r, 0, 7); x.fill(); });
      x.fillStyle = "#1a2342"; x.fillRect(0, h * .8, w, h * .2); x.fillStyle = "#0a0e1c"; x.beginPath(); x.moveTo(0, h * .8); for (let X = 0; X <= w; X += w / 14) x.lineTo(X, h * .8 - (Math.sin(X * 1.7) * .5 + .5) * h * .05 - ((X / w * 14 | 0) % 3 ? 0 : h * .03)); x.lineTo(w, h * .8); x.fill();
      s.L.forEach(l => { l.y -= dt * (26 + Math.sin(t + l.ph) * 6); l.x += (l.vx + Math.sin(t * .8 + l.ph) * 6) * dt; l.a = Math.min(1, l.a + dt);
        const g = x.createRadialGradient(l.x, l.y, 0, l.x, l.y, 46); g.addColorStop(0, "rgba(255,190,90,.55)"); g.addColorStop(1, "rgba(255,190,90,0)"); x.fillStyle = g; x.beginPath(); x.arc(l.x, l.y, 46, 0, 7); x.fill();
        x.fillStyle = "#f2a23a"; x.beginPath(); x.moveTo(l.x - 11, l.y - 14); x.lineTo(l.x + 11, l.y - 14); x.lineTo(l.x + 8, l.y + 12); x.lineTo(l.x - 8, l.y + 12); x.closePath(); x.fill(); x.fillStyle = "#ffe7a8"; x.fillRect(l.x - 3, l.y - 2, 6, 10);
        x.fillStyle = "rgba(255,225,170,.35)"; x.beginPath(); x.ellipse(l.x, h * .8 + (h * .8 - l.y) * .06, 6, 2, 0, 0, 7); x.fill();
        if (l.y > h * .35) { x.fillStyle = `rgba(255,236,200,${Math.min(1, l.a) * (l.y - h * .35) / (h * .5)})`; x.font = `${w * .034}px "Noto Serif SC", serif`; x.textAlign = "center"; x.fillText(l.w, l.x, l.y + 30); x.textAlign = "left"; } });
      s.L = s.L.filter(l => l.y > -40);
    } },
  /* 仙女棒 — 用手指在夜里写一个字 */
  sparkler: { bg: "#0b0912", dark: true, caption: () => T("用仙女棒写一个字，\n留给今天。", "Write one word with a sparkler,\nleave it to today."), hint: () => T("按住拖动，写一个字", "Hold and drag to write"),
    init(s) { s.tr = []; s.sp = []; s.down = false; },
    tap(s, px, py) { s.down = true; s.lx = px; s.ly = py; mus.fizz(.3); },
    move(s, px, py) { if (!s.down) return; s.tr.push({ x: px, y: py, a: 1, x0: s.lx, y0: s.ly }); s.lx = px; s.ly = py; for (let i = 0; i < 4; i++) { const a = rnd(0, 6.28), v = rnd(40, 160); s.sp.push({ x: px, y: py, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: rnd(.3, .7), c: Math.random() < .5 ? "#ffe9a8" : "#fff" }); } if (Math.random() < .25) mus.fizz(.12); },
    up(s) { s.down = false; },
    frame(s, x, w, h, t, dt) {
      x.lineCap = "round"; s.tr.forEach(p => { p.a -= dt * .08; x.strokeStyle = `rgba(255,214,140,${Math.max(0, p.a)})`; x.shadowColor = "rgba(255,190,90,.9)"; x.shadowBlur = 10; x.lineWidth = 3; x.beginPath(); x.moveTo(p.x0, p.y0); x.lineTo(p.x, p.y); x.stroke(); }); x.shadowBlur = 0;
      s.tr = s.tr.filter(p => p.a > 0);
      s.sp = s.sp.filter(p => { p.l -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * dt; x.fillStyle = p.c; x.globalAlpha = Math.max(0, p.l * 1.6); x.fillRect(p.x, p.y, 1.6, 1.6); x.globalAlpha = 1; return p.l > 0; });
      if (s.down && s.lx != null) { const g = x.createRadialGradient(s.lx, s.ly, 0, s.lx, s.ly, 22); g.addColorStop(0, "rgba(255,255,230,.95)"); g.addColorStop(1, "rgba(255,200,120,0)"); x.fillStyle = g; x.beginPath(); x.arc(s.lx, s.ly, 22, 0, 7); x.fill(); }
      if (!s.tr.length && !s.down) { x.fillStyle = "rgba(255,236,200,.18)"; x.font = `${w * .2}px "Long Cang", "Noto Serif SC", serif`; x.textAlign = "center"; x.fillText(T("好", "hi"), w / 2, h * .56); x.textAlign = "left"; }
    } },
  /* 求签 — 摇三下签筒，掉出一支旅行签 */
  qian: { bg: "#a8321f", dark: true, caption: () => T("心里想着接下来的旅程，\n摇一摇签筒。", "Think of the road ahead\nand shake the tube."), hint: () => T("点三下，摇签筒", "Tap three times to shake"),
    init(s) { s.sh = 0; s.wob = 0; s.out = null; s.k = 0;
      s.Q = T("上上|风过桥头，灯亮一半。慢慢走，好吃的在下一个路口。;上吉|今日宜迷路。转错的那条巷子，会有你最喜欢的一张照片。;中吉|钱包会瘦一点，笑会多一点。点那道没吃过的。;大吉|同行的人今天特别可爱，记得夸一句。;上吉|雨来不必躲，屋檐下正好喝一杯茶。;中平|今天适合坐下来，什么也不做，看路人十五分钟。;上上|老店的阿姨会多给你一勺。说谢谢要大声。;吉|别赶。错过的那班车，是留给你看日落的。;上吉|吃第二碗之前，先拍第一碗。;大吉|今天抽到的技能牌，发动了会有好事。;中吉|问一位本地人，照着他说的走，一定不亏。;上上|回头看一眼走过的路，这一趟你已经赚到了。", "Best|Wind on the bridge, lamps half lit. The good food is at the next corner.;Great|Get lost today — the wrong alley holds your favourite photo.;Good|The wallet gets thinner, the smiles get wider. Order the dish you've never had.;Great|Your travel buddies are extra lovely today. Tell one of them.;Great|Don't run from the rain — have tea under the eaves.;Fair|Sit down and watch people for fifteen minutes.;Best|The old auntie will give you an extra spoon. Thank her loudly.;Good|The bus you missed was waiting to show you the sunset.;Great|Photo the first bowl before the second.;Great|Activate today's skill card — something good follows.;Good|Ask a local and follow their advice.;Best|Look back once — this trip has already paid off.").split(";").map(q => q.split("|")); },
    tap(s) { if (s.out) { s.init2 = 1; s.out = null; s.sh = 0; s.k = 0; return; } s.sh++; s.wob = 1; sfx.shuffle(); buzz(12); if (s.sh >= 3) { const i = Math.floor(Math.random() * s.Q.length); s.out = { no: i + 1 + (Math.floor(Math.random() * 8) * 12), lv: s.Q[i][0], txt: s.Q[i][1] }; s.k = 0; setTimeout(() => { sfx.flip(); mus.harp(3, 5, .06); }, 500); } },
    frame(s, x, w, h, t, dt) {
      s.wob = Math.max(0, s.wob - dt * 2.4); const r = Math.sin(t * 30) * .18 * s.wob, cx = w / 2, by = h * .74, tw = w * .26, th = h * .28;
      x.save(); x.translate(cx, by); x.rotate(r);
      for (let i = 0; i < 9; i++) { x.fillStyle = i % 3 ? "#e8c77a" : "#d4a85a"; x.fillRect(-tw * .38 + i * tw * .09, -th - h * .06 - (i % 4) * 8, tw * .05, h * .1); }
      x.fillStyle = "#6b2a16"; x.fillRect(-tw / 2, -th, tw, th); x.fillStyle = "#8a3a1e"; x.fillRect(-tw / 2, -th, tw * .18, th); x.fillStyle = "#e8c77a"; x.fillRect(-tw / 2, -th * .72, tw, 3); x.fillRect(-tw / 2, -th * .22, tw, 3);
      x.fillStyle = "#f3dfb0"; x.font = `600 ${w * .07}px "Noto Serif SC", serif`; x.textAlign = "center"; x.fillText(T("签", "签"), 0, -th * .4); x.restore();
      if (s.out) { s.k = Math.min(1, s.k + dt * 1.6); const e = 1 - Math.pow(1 - s.k, 3), sx = cx, sy = by - th - h * .08 - e * h * .04;
        x.save(); x.translate(sx, sy); x.rotate(-.2 + e * .2); x.fillStyle = "#f1d58e"; x.fillRect(-w * .03, -h * .08, w * .06, h * .16); x.fillStyle = "#b3341e"; x.font = `600 ${w * .03}px "Noto Serif SC", serif`; x.textAlign = "center"; x.fillText(T("第", "No"), 0, -h * .045); x.fillText(String(s.out.no), 0, -h * .015); x.fillText(s.out.lv[0] || "", 0, h * .02); x.fillText(s.out.lv[1] || "", 0, h * .05); x.restore();
        if (s.k >= 1) { const bx = w * .08, bw = w * .84, byy = h * .09; x.fillStyle = "rgba(251,243,227,.95)"; x.fillRect(bx, byy, bw, h * .17); x.strokeStyle = "#b3341e"; x.lineWidth = 1; x.strokeRect(bx + 5, byy + 5, bw - 10, h * .17 - 10);
          x.fillStyle = "#b3341e"; x.font = `600 ${w * .045}px "Noto Serif SC", serif`; x.textAlign = "center"; x.fillText(T(`第 ${s.out.no} 签 · ${s.out.lv}`, `No. ${s.out.no} · ${s.out.lv}`), w / 2, byy + h * .05);
          x.fillStyle = "#3a2c1f"; x.font = `${w * .036}px "Noto Serif SC", serif`; const words = s.out.txt, lines = []; let ln = ""; for (const ch of (/[a-z]/i.test(words) ? words.split(" ").map(q => q + " ") : words.split(""))) { if (x.measureText(ln + ch).width > bw - 36) { lines.push(ln); ln = ch; } else ln += ch; } lines.push(ln); lines.slice(0, 4).forEach((l, i) => x.fillText(l.trim(), w / 2, byy + h * .09 + i * w * .05)); x.textAlign = "left"; } }
      else { x.fillStyle = "rgba(251,243,227,.8)"; x.font = `${w * .04}px "Special Elite", monospace`; x.textAlign = "center"; x.fillText("● ".repeat(s.sh) + "○ ".repeat(3 - s.sh), w / 2, h * .9); x.textAlign = "left"; }
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
  const loop = now => { if (!run) return; const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt; x.globalAlpha = 1; x.shadowBlur = 0; x.fillStyle = P.bg; x.fillRect(0, 0, w, h); P.frame(s, x, w, h, t, REDUCE ? 0 : dt); x.globalAlpha = 1; requestAnimationFrame(loop); }; requestAnimationFrame(loop);
  cv.addEventListener("pointerdown", e => { const r = cv.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top; if (kind === "rain") s.hold = true; P.tap && P.tap(s, px, py, w, h); });
  const up = () => { s.hold = false; P.up && P.up(s); }; cv.addEventListener("pointerup", up); cv.addEventListener("pointerleave", up); cv.addEventListener("pointercancel", up);
  if (P.move) { cv.style.touchAction = "none"; cv.addEventListener("pointermove", e => { const r = cv.getBoundingClientRect(); P.move(s, e.clientX - r.left, e.clientY - r.top, w, h); }); }
  const close = () => { run = false; clearInterval(type); ov.classList.remove("on"); setTimeout(() => ov.remove(), 400); o.onClose && o.onClose(); };
  ov.querySelector(".sc-x").onclick = close; if (P.auto) setTimeout(() => { if (ov.isConnected) ov.classList.add("done"); }, P.auto);
  return close;
}
/* which piece fits the weather right now */
export function weatherMotion(v) { const hr = new Date().getHours(), txt = (v && v.text) || ""; if (hr >= 20 || hr < 5) return "stars"; if (/雨|hujan|rain|雷/i.test(txt)) return "rain"; if (v && (v.temp >= 31 || v.hi >= 32)) return "melon"; if (/云|阴|雾|cloud/i.test(txt)) return "puffs"; return v && v.temp >= 28 ? "melon" : "puffs"; }
/* the little games you can open any time from 玩法 */
export const GAMES = [["tea", "冲一泡工夫茶", "关公巡城，三杯倒满"], ["qian", "求一支旅行签", "摇三下，看今天的签"], ["lantern", "放一盏河灯", "每盏灯带一个愿望"], ["sparkler", "仙女棒写字", "用手指在夜里写一个字"], ["melon", "西瓜冰", "点一下加一块冰"], ["rain", "落一场雨", "按住云朵"], ["puffs", "放空 15 秒", "点亮光团"], ["stars", "星空灯", "睡前点月亮"]];
if (typeof window !== "undefined") window.tdMotion = playMotion;
