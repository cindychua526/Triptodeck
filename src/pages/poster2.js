/* 海报工作室: you choose the photos and the layout; the more photos, the more posters. 1440 × 2560 JPG each.
   Layouts: 拼贴 (4 photos a poster) · 时间线 (3 days a poster, in order) · 单日 (one day, up to 6 photos). */
import { api } from "../lib/api.js";
import { esc, shortDate, weekday } from "../lib/util.js";
import { openSheet, setSheet, closeSheet, toast, bind } from "../lib/ui.js";
import { sfx, mus } from "../lib/sound.js";
import { guideFor } from "../data/guides.js";
import { tripDays, cityOf } from "./trip.js";
import { departuresOf } from "./arrive.js";
import { applyLook, lookChips, bindLookChips } from "../lib/look.js";
import { getJournal } from "../lib/journal.js";

const W = 1440, H = 2560, PAPER = "#f7f3ea", INK = "#2a2420", MUTE = "#8a7e6c", SEAL = "#b3341e";
const WD = ["Sun.", "Mon.", "Tue.", "Wed.", "Thu.", "Fri.", "Sat."];
const urlImg = u => new Promise(res => { if (!u) return res(null); const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => res(i); i.onerror = () => res(null); i.src = u; });
const fit = (ctx, t, max) => { t = String(t || ""); while (t.length > 1 && ctx.measureText(t).width > max) t = t.slice(0, -1); return t; };
function wrap(ctx, text, max, lines = 2) { const out = []; let cur = ""; for (const ch of String(text || "")) { if (ctx.measureText(cur + ch).width > max) { out.push(cur); cur = ch; if (out.length === lines) break; } else cur += ch; } if (out.length < lines && cur) out.push(cur); if (out.length === lines && (out.join("").length < String(text).length)) out[lines - 1] = out[lines - 1].slice(0, -1) + "…"; return out; }

/* everything you photographed on this trip */
async function myPhotos() {
  const t = api.trip; let st = [], fp = [], sp = []; try { [st, fp, sp] = await Promise.all([api.stamps(), api.foodPhotos(), api.sharedPhotos()]); } catch (e) {}
  const me = x => x.user_id === api.me.id, out = [];
  const dep = departuresOf().find(d => d.user_id === api.me.id);
  if (dep && dep.photo_path) out.push({ id: "dep", date: t.start_date, cap: `从${dep.origin || "家"}出发`, url: () => api.photoUrl(dep.photo_path), k: "dep" });
  st.filter(s => s.trip_id === t.id && s.photo_path && me(s)).forEach(s => out.push({ id: "s" + s.id, date: s.date, cap: s.caption || s.name, hasCap: !!s.caption, url: () => api.photoUrl(s.photo_path), k: "stamp" }));
  fp.filter(me).forEach(f => out.push({ id: "f" + f.id, date: f.date, cap: f.caption || f.food, hasCap: !!f.caption, url: () => api.sharedUrl(f.photo_path), k: "food" }));
  sp.filter(me).forEach(f => out.push({ id: "p" + f.id, date: f.date, cap: f.caption || "", hasCap: !!f.caption, url: () => api.sharedUrl(f.photo_path), k: "shared" }));
  return out.sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

export async function openPosterStudio() {
  const t = api.trip; if (!t) return toast("先选一趟旅行");
  const all = await myPhotos();
  if (!all.length) return toast("还没有照片。打卡、撕票、上传照片之后再来做海报。");
  let layout = "collage", pick = new Set(all.filter(p => p.hasCap || p.k === "dep").map(p => p.id)); if (pick.size < 4) all.slice(-8).forEach(p => pick.add(p.id));
  const days = [...new Set(all.map(p => p.date))].sort(); let day = days[days.length - 1];
  const draw = () => {
    const sh = setSheet(`<div class="as ps"><small class="as-k">POSTER STUDIO</small><h3>做海报</h3>
      <div class="lbl">版式</div><div class="seg" id="psLay"><button data-l="collage" class="${layout === "collage" ? "on" : ""}">拼贴</button><button data-l="timeline" class="${layout === "timeline" ? "on" : ""}">时间线</button><button data-l="day" class="${layout === "day" ? "on" : ""}">单日</button></div>
      <p class="as-hint">${layout === "collage" ? "每张海报 4 张照片，选得多就出好几张。" : layout === "timeline" ? "按日期排，每张海报 3 天，每天最多 2 张照片，配上那天写的一句和一个字。" : "选一天，最多 6 张照片，配上那天的日记。"}</p>
      ${layout === "day" ? `<div class="chips-wrap">${days.map(d => `<button class="chip sm${d === day ? " on" : ""}" data-day="${d}">${shortDate(d)}</button>`).join("")}</div>` : ""}
      <div class="lbl" style="margin-top:10px">滤镜</div>${lookChips()}
      <div class="lbl ps-lbl">要放进去的照片 <span id="psN">${pick.size}</span> 张 <button class="linkbtn" data-a="all">全选</button><button class="linkbtn" data-a="none">清空</button></div>
      <div class="ps-grid">${all.filter(p => layout !== "day" || p.date === day).map(p => `<button class="ps-ph${pick.has(p.id) ? " on" : ""}" data-id="${p.id}"><i></i><span>${esc(p.cap || shortDate(p.date))}</span><b>✓</b></button>`).join("")}</div>
      <div class="as-btns"><button class="btn" data-act="close">取消</button><button class="btn ink" data-act="go" style="flex:1.6">生成海报</button></div></div>`);
    bindLookChips(sh);
    sh.querySelectorAll("[data-l]").forEach(b => b.onclick = () => { layout = b.dataset.l; sfx.tap(); draw(); });
    sh.querySelectorAll("[data-day]").forEach(b => b.onclick = () => { day = b.dataset.day; all.filter(p => p.date === day).forEach(p => pick.add(p.id)); sfx.tap(); draw(); });
    sh.querySelectorAll(".ps-ph").forEach(b => b.onclick = () => { const id = b.dataset.id; pick.has(id) ? pick.delete(id) : pick.add(id); b.classList.toggle("on", pick.has(id)); sh.querySelector("#psN").textContent = pick.size; mus.pluck(pick.has(id) ? 4 : 2, .02); });
    sh.querySelector("[data-a=all]").onclick = () => { all.filter(p => layout !== "day" || p.date === day).forEach(p => pick.add(p.id)); draw(); };
    sh.querySelector("[data-a=none]").onclick = () => { pick.clear(); draw(); };
    (async () => { for (const b of sh.querySelectorAll(".ps-ph")) { const p = all.find(x => x.id === b.dataset.id); const u = await p.url(); if (u && b.isConnected) b.querySelector("i").style.backgroundImage = `url("${u}")`; } })();
    bind(sh, { close: () => closeSheet(), go: () => { const chosen = all.filter(p => pick.has(p.id) && (layout !== "day" || p.date === day)); if (!chosen.length) return toast("先选几张照片"); build(layout, chosen, day); } });
  };
  openSheet(`<div class="as"><h3>做海报</h3><div class="spinner"></div></div>`); draw();
}

async function build(layout, chosen, day) {
  const t = api.trip; setSheet(`<div class="as"><small class="as-k">POSTER</small><h3>正在排版…</h3><div class="spinner"></div><p class="as-hint">照片越多越久，大概每张海报两三秒。</p></div>`);
  try { await Promise.all(['700 80px "Noto Serif SC"', '400 60px "Noto Serif SC"', '400 40px "Long Cang"', 'italic 600 40px "Cormorant Garamond"', '400 30px "Special Elite"', '800 40px "Shippori Mincho"'].map(f => document.fonts.load(f))); } catch (e) {}
  const imgs = new Map(); for (const p of chosen) { const im = await urlImg(await p.url()); if (im) imgs.set(p.id, im); }
  const ok = chosen.filter(p => imgs.has(p.id));
  const J = await getJournal().catch(() => ({ days: {}, moods: {} }));
  const pages = [];
  if (layout === "collage") for (let i = 0; i < ok.length; i += 4) pages.push(ok.slice(i, i + 4));
  else if (layout === "timeline") { const byDay = {}; ok.forEach(p => (byDay[p.date] = byDay[p.date] || []).push(p)); const ds = Object.keys(byDay).sort(); for (let i = 0; i < ds.length; i += 3) pages.push(ds.slice(i, i + 3).map(d => ({ d, ph: byDay[d].slice(0, 2) }))); }
  else pages.push(ok.slice(0, 6));
  const blobs = [];
  for (let i = 0; i < pages.length; i++) { const c = document.createElement("canvas"); c.width = W; c.height = H; const ctx = c.getContext("2d");
    paper(ctx); if (layout === "collage") collage(ctx, pages[i], imgs, t, i, pages.length); else if (layout === "timeline") timeline(ctx, pages[i], imgs, t, J, i, pages.length); else oneDay(ctx, pages[i], imgs, t, J, day);
    blobs.push(await new Promise(r => c.toBlob(r, "image/jpeg", .92))); }
  show(blobs, t);
}

/* ---------- drawing ---------- */
function paper(ctx) { ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H); const g = document.createElement("canvas"); g.width = g.height = 256; const gc = g.getContext("2d"), d = gc.createImageData(256, 256); for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 7; } gc.putImageData(d, 0, 0); ctx.fillStyle = ctx.createPattern(g, "repeat"); ctx.fillRect(0, 0, W, H); }
function cover(ctx, img, x, y, w, h) { const s = Math.max(w / img.width, h / img.height), iw = img.width * s, ih = img.height * s; ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih); ctx.restore(); }
function polaroid(ctx, img, cx, cy, size, rot, cap) {
  const pad = Math.round(size * .045), bot = Math.round(size * .2), fw = size + pad * 2, fh = size + pad + bot;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot * Math.PI / 180);
  ctx.shadowColor = "rgba(40,30,20,.22)"; ctx.shadowBlur = 36; ctx.shadowOffsetY = 18; ctx.fillStyle = "#fff"; ctx.fillRect(-fw / 2, -fh / 2, fw, fh); ctx.shadowColor = "transparent";
  const oc = document.createElement("canvas"); oc.width = oc.height = size; const ox = oc.getContext("2d"); cover(ox, img, 0, 0, size, size); applyLook(ox, 0, 0, size, size); ctx.drawImage(oc, -size / 2, -fh / 2 + pad);
  if (cap) { ctx.fillStyle = INK; ctx.font = `400 ${Math.round(size * .075)}px "Long Cang", "Noto Serif SC", cursive`; ctx.textAlign = "center"; ctx.fillText(fit(ctx, cap, size - 20), 0, fh / 2 - bot * .38); ctx.textAlign = "left"; }
  ctx.restore();
}
function head(ctx, t, big, sub, page, pages) {
  const d0 = new Date((t.start_date) + "T12:00:00");
  ctx.fillStyle = INK; ctx.font = 'italic 900 200px system-ui, -apple-system, "Helvetica Neue", sans-serif'; ctx.letterSpacing = "-8px"; ctx.fillText(big || `${d0.getMonth() + 1}/${d0.getDate()}`, 96, 300); ctx.letterSpacing = "0px";
  ctx.font = 'italic 600 70px "Cormorant Garamond", serif'; ctx.textAlign = "right"; ctx.fillText(pages > 1 ? `${String(page + 1).padStart(2, "0")} / ${String(pages).padStart(2, "0")}` : `Vol.${String(tripDays().length).padStart(2, "0")}`, W - 100, 230); ctx.textAlign = "left";
  ctx.font = '500 62px "Shippori Mincho", "Noto Serif SC", serif'; ctx.letterSpacing = "12px"; ctx.fillText(fit(ctx, t.name, W - 220), 104, 420); ctx.letterSpacing = "0px";
  ctx.fillStyle = MUTE; ctx.font = '400 28px "Special Elite", monospace'; ctx.letterSpacing = "6px"; ctx.fillText(sub, 108, 480); ctx.letterSpacing = "0px";
}
function foot(ctx, line2) {
  const Y = 2360; ctx.strokeStyle = INK; ctx.setLineDash([12, 12]); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(100, Y); ctx.lineTo(W - 100, Y); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = INK; ctx.font = '400 30px "Special Elite", monospace'; ctx.letterSpacing = "4px"; if (line2) ctx.fillText(fit(ctx, line2, W - 220), 104, Y + 70);
  ctx.fillStyle = MUTE; ctx.font = '400 22px system-ui, sans-serif'; ctx.letterSpacing = "9px"; ctx.fillText(`TRIP DECK · ${(api.me && api.me.name) || ""}`, 108, Y + 130); ctx.letterSpacing = "0px";
}
const wxIcon = x => /雷/.test(x) ? "⚡" : /雨/.test(x) ? "☂" : /雪/.test(x) ? "❄" : /阴|雾/.test(x) ? "☁" : /云/.test(x) ? "⛅" : "☀";
const wxOf = (t, d) => { try { const w = JSON.parse(localStorage.getItem(`td-wx:${t.id}:${d}`) || "null"); return w ? wxIcon(w.t) : ""; } catch (e) { return ""; } };
function collage(ctx, ph, imgs, t, i, n) {
  const g = guideFor((t.cities || [])[0]);
  head(ctx, t, null, `${(g ? g.en : "").toUpperCase()}   ${t.start_date.replace(/-/g, ".")} — ${t.end_date.replace(/-/g, ".")}`, i, n);
  const S = [[400, 1010, 620, -4], [1060, 950, 560, 5], [420, 1830, 570, 4], [1040, 1760, 610, -4]];
  ph.forEach((p, k) => { const [x, y, s, r] = S[k]; polaroid(ctx, imgs.get(p.id), x, y, s, r, p.cap); });
  foot(ctx, `${tripDays().length} DAYS · ${new Set(ph.map(p => p.date)).size} MOMENTS ON THIS PAGE`);
}
function timeline(ctx, rows, imgs, t, J, i, n) {
  const days = tripDays(); head(ctx, t, "日记", `TIMELINE   ${rows[0].d.replace(/-/g, ".")} — ${rows[rows.length - 1].d.replace(/-/g, ".")}`, i, n);
  const top = 540, gap = 600;
  ctx.strokeStyle = "rgba(42,36,32,.35)"; ctx.lineWidth = 3; ctx.setLineDash([4, 14]); ctx.beginPath(); ctx.moveTo(170, top + 40); ctx.lineTo(170, top + gap * rows.length - 80); ctx.stroke(); ctx.setLineDash([]);
  rows.forEach((r, k) => { const y = top + k * gap, dn = days.indexOf(r.d) + 1, dt = new Date(r.d + "T12:00:00");
    ctx.fillStyle = PAPER; ctx.beginPath(); ctx.arc(170, y + 40, 22, 0, 7); ctx.fill(); ctx.strokeStyle = SEAL; ctx.lineWidth = 5; ctx.stroke();
    ctx.fillStyle = INK; ctx.font = 'italic 700 82px "Cormorant Garamond", serif'; ctx.fillText(`Day ${String(dn || "").padStart(2, "0")}`, 220, y + 66);
    ctx.fillStyle = MUTE; ctx.font = '400 28px "Special Elite", monospace'; ctx.letterSpacing = "4px"; ctx.fillText(`${r.d.slice(5).replace("-", ".")} ${WD[dt.getDay()]}  ${cityOf(r.d) || ""}  ${wxOf(t, r.d)}`, 224, y + 114); ctx.letterSpacing = "0px";
    const mood = (J.moods || {})[r.d]; if (mood) { ctx.save(); ctx.translate(W - 170, y + 60); ctx.rotate(-.12); ctx.strokeStyle = SEAL; ctx.lineWidth = 5; ctx.strokeRect(-56, -56, 112, 112); ctx.fillStyle = SEAL; ctx.font = '800 64px "Shippori Mincho", serif'; ctx.textAlign = "center"; ctx.fillText(mood.slice(0, 1), 0, 22); ctx.restore(); }
    r.ph.forEach((p, j) => polaroid(ctx, imgs.get(p.id), 440 + j * 440, y + 322, 300, j ? 4 : -3, p.cap));
    const line = ((J.days || {})[r.d] || "").split("\n")[0]; if (line) { ctx.fillStyle = INK; ctx.font = '400 44px "Long Cang", "Noto Serif SC", cursive'; wrap(ctx, "「" + line + "」", W - 330, 1).forEach((l, q) => ctx.fillText(l, 224, y + 566 + q * 52)); }
  });
  foot(ctx, rows.map(r => (J.moods || {})[r.d] || "·").join("  "));
}
function oneDay(ctx, ph, imgs, t, J, d) {
  const dt = new Date(d + "T12:00:00"), dn = tripDays().indexOf(d) + 1;
  head(ctx, t, `${dt.getMonth() + 1}/${dt.getDate()}`, `DAY ${String(dn).padStart(2, "0")}   ${WD[dt.getDay()].toUpperCase()}   ${cityOf(d) || ""}   ${wxOf(t, d)}`, 0, 1);
  const n = ph.length, cols = n <= 1 ? 1 : 2, size = n <= 1 ? 900 : n <= 2 ? 560 : n <= 4 ? 540 : 460, rows = Math.ceil(n / cols), rowH = size * 1.32 + 30, y0 = 560 + (1500 - rows * rowH) / 2 + rowH / 2;
  ph.forEach((p, k) => { const c = k % cols, r = Math.floor(k / cols), x = cols === 1 ? W / 2 : W / 2 + (c ? 1 : -1) * (size / 2 + 50); polaroid(ctx, imgs.get(p.id), x, y0 + r * rowH, size, ((k * 37) % 9) - 4, p.cap); });
  const line = ((J.days || {})[d] || ""), mood = (J.moods || {})[d];
  if (line) { ctx.fillStyle = INK; ctx.font = '400 50px "Long Cang", "Noto Serif SC", cursive'; wrap(ctx, line.replace(/\n/g, " "), W - 240, 2).forEach((l, q) => ctx.fillText(l, 110, 2180 + q * 62)); }
  foot(ctx, mood ? `今天一个字 · ${mood}` : "");
}

function show(blobs, t) {
  const urls = blobs.map(b => URL.createObjectURL(b)), files = blobs.map((b, i) => new File([b], `${t.name}-${String(i + 1).padStart(2, "0")}.jpg`, { type: "image/jpeg" }));
  sfx.success();
  const sh = setSheet(`<div class="as"><small class="as-k">POSTER · ${blobs.length} 张 · 1440 × 2560</small><h3>${esc(t.name)}</h3>
    <div class="ps-out">${urls.map((u, i) => `<figure><img src="${u}" alt="海报 ${i + 1}"><figcaption>${i + 1} / ${urls.length}</figcaption></figure>`).join("")}</div>
    ${blobs.length > 1 ? `<p class="as-hint">左右滑看每一张。</p>` : ""}
    <div class="as-btns"><div class="row"><button class="btn" data-act="again">重新选</button><button class="btn ink" data-act="save">${blobs.length > 1 ? "全部存到手机" : "存到手机"}</button></div><button class="btn full" data-act="close">关闭</button></div></div>`);
  bind(sh, { close: () => closeSheet(), again: () => openPosterStudio(),
    save: async () => { try { if (navigator.canShare && navigator.canShare({ files })) await navigator.share({ files, title: t.name }); else files.forEach((f, i) => { const a = document.createElement("a"); a.href = urls[i]; a.download = f.name; a.click(); }); } catch (e) {} } });
}
