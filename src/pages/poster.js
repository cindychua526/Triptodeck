/* Travel poster, editorial style: 1440×2560 JPG.
   hero photo → numbers → the journey (from your own departure point) → moments → stamps → tastes */
import { api } from "../lib/api.js";
import { esc, shortDate, addDays, today } from "../lib/util.js";
import { openSheet, setSheet, closeSheet, toast, bind } from "../lib/ui.js";
import { sfx } from "../lib/sound.js";
import { placeStamp, citySeal } from "../data/stamps.js";
import { guideFor } from "../data/guides.js";
import { posterStamp, stampArt } from "../data/posterstamp.js";
import { doodle, doodleFor } from "../data/doodles.js";
import { tripDays } from "./trip.js";
import { applyLook } from "../lib/look.js";
import { foodArt } from "../data/foodart.js";
import { walletItems } from "./tickets.js";
import { tr } from "../lib/i18n.js";

const W = 1440, H = 2560, INK = "#15110d", CREAM = "#f4ecda", GOLD = "#d9b878", MUTE = "rgba(244,236,218,.62)";
const svgImg = svg => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ')); });
const urlImg = u => new Promise(res => { if (!u) return res(null); const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => res(i); i.onerror = () => res(null); i.src = u; });
function cover(ctx, img, x, y, w, h) { const s = Math.max(w / img.width, h / img.height), iw = img.width * s, ih = img.height * s; ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih); ctx.restore(); }
function grain(ctx, a = 12) { const g = document.createElement("canvas"); g.width = g.height = 256; const c = g.getContext("2d"), d = c.createImageData(256, 256); for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = a; } c.putImageData(d, 0, 0); ctx.fillStyle = ctx.createPattern(g, "repeat"); ctx.fillRect(0, 0, W, H); }
const fit = (ctx, t, max) => { while (t.length > 1 && ctx.measureText(t).width > max) t = t.slice(0, -1); return t; };
const label = (ctx, t, x, y) => { ctx.fillStyle = GOLD; ctx.font = '600 26px "Cormorant Garamond", serif'; ctx.letterSpacing = "8px"; ctx.fillText(t, x, y); ctx.letterSpacing = "0px"; ctx.fillStyle = "rgba(217,184,120,.35)"; ctx.fillRect(x + ctx.measureText(t).width + 30, y - 9, W - 120 - (x + ctx.measureText(t).width + 30), 1.5); };

export async function makePoster(trip, stamps, extra = {}) {
  if (!trip) return toast("先选一趟旅行");
  openSheet(`<div class="as"><small class="as-k">POSTER</small><h3>正在排版海报…</h3><div class="spinner"></div></div>`, { accent: "#3a2c1f" });
  try { await Promise.all(['700 80px "Noto Serif SC"', '400 60px "Noto Serif SC"', '400 40px "Long Cang"', 'italic 500 40px "Cormorant Garamond"', '600 40px "Cormorant Garamond"'].map(f => document.fonts.load(f))); } catch (e) {}
  const c = document.createElement("canvas"); c.width = W; c.height = H; const ctx = c.getContext("2d"); const ft = ctx.fillText.bind(ctx); ctx.fillText = (s, a, b, m) => ft(tr(String(s)), a, b, m);
  const g0 = guideFor((trip.cities || [])[0]), accent = g0 ? g0.color : "#5a4632";
  const places = stamps.filter(s => s.kind !== "city"), seals = stamps.filter(s => s.kind === "city"), photos = stamps.filter(s => s.photo_path);
  const pics = []; let fp = [], sp = []; try { [fp, sp] = await Promise.all([api.foodPhotos(), api.sharedPhotos()]); } catch (e) {} fp = fp.filter(x => x.user_id === api.me.id); sp = sp.filter(x => x.user_id === api.me.id);
  const pool = [...photos.map(x => ({ s: { name: x.caption || x.name, date: x.date }, url: () => api.photoUrl(x.photo_path), t: x.created_at || x.date })), ...fp.map(x => ({ s: { name: x.caption || x.food, date: x.date }, url: () => api.sharedUrl(x.photo_path), t: x.created_at })), ...sp.map(x => ({ s: { name: x.caption || "", date: x.date }, url: () => api.sharedUrl(x.photo_path), t: x.created_at }))]
    .sort((a, b) => String(b.t).localeCompare(String(a.t)));
  const capped = pool.filter(m => m.s.name).concat(pool.filter(m => !m.s.name));   // photos you wrote something under come first
  for (const m of capped) { if (pics.length >= 4) break; const img = await urlImg(await m.url()); if (img) pics.push({ img, s: m.s }); }
  let wallet = []; try { wallet = (await api.wallet()).filter(w => w.trip_id === trip.id); } catch (e) {}
  // ---- white paper collage
  ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H);
  const d0 = new Date((trip.start_date || today()) + "T12:00:00"), WD = ["Sun.", "Mon.", "Tue.", "Wed.", "Thu.", "Fri.", "Sat."], days = tripDays().length || 1;
  ctx.fillStyle = "#111"; ctx.font = 'italic 900 210px system-ui, -apple-system, "Helvetica Neue", sans-serif'; ctx.letterSpacing = "-10px"; ctx.fillText(`${d0.getMonth() + 1}/${d0.getDate()}`, 96, 330);
  ctx.font = 'italic 900 120px system-ui, -apple-system, "Helvetica Neue", sans-serif'; ctx.letterSpacing = "-4px"; ctx.fillText(WD[d0.getDay()], 116, 450); ctx.letterSpacing = "0px";
  ctx.font = 'italic 600 80px "Cormorant Garamond", serif'; ctx.textAlign = "right"; ctx.fillText(`Vol.${String(days).padStart(2, "0")}`, W - 100, 250); ctx.textAlign = "left";
  ctx.fillStyle = "#111"; ctx.font = '500 64px "Noto Serif SC", serif'; ctx.letterSpacing = "12px"; ctx.fillText(fit(ctx, trip.name, W - 200), 104, 580); ctx.letterSpacing = "0px";
  ctx.fillStyle = "#8a8a8e"; ctx.font = '400 30px system-ui, sans-serif'; ctx.letterSpacing = "8px"; ctx.fillText(`${(g0 ? g0.en : "").toUpperCase()}   ${(trip.start_date || "").replace(/-/g, ".")} — ${(trip.end_date || "").replace(/-/g, ".")}`, 108, 640); ctx.letterSpacing = "0px";
  const slots = [[110, 760, 520], [780, 700, 560], [140, 1380, 600], [820, 1330, 500], [110, 1900, 420], [560, 1880, 420], [960, 1930, 380]];
  const items = [];
  pics.slice(0, 4).forEach(p => items.push({ kind: "photo", p }));
  const st = places.slice(-3); for (const sx of st) { const img = await svgImg(posterStamp(sx, { cityEn: (guideFor(sx.city) || {}).en, noArt: true })), art = await svgImg(stampArt(sx)); if (img) items.push({ kind: "stamp", img, art }); }
  for (const w of walletItems().slice(-2)) { const art = await svgImg(foodArt(w.name)); if (art) items.push({ kind: "ticket", art, name: w.name }); }
  const dd = await svgImg(doodle(doodleFor(places[0] ? places[0].name : "", "place"), { sketch: true, accent: "#b3341e", seed: 5 })); if (dd) items.push({ kind: "sketch", img: dd });
  items.slice(0, slots.length).forEach((it, i) => { const [x, y, size] = slots[i], r = ((i * 53) % 13 - 6) * Math.PI / 180; ctx.save(); ctx.translate(x + size / 2, y + size / 2); ctx.rotate(r);
    if (it.kind === "photo") { ctx.shadowColor = "rgba(0,0,0,.18)"; ctx.shadowBlur = 40; ctx.shadowOffsetY = 22; ctx.fillStyle = "#fff"; ctx.fillRect(-size / 2 - 22, -size / 2 - 22, size + 44, size + 110); ctx.shadowColor = "transparent"; { const oc = document.createElement("canvas"); oc.width = oc.height = size; const ox = oc.getContext("2d"); cover(ox, it.p.img, 0, 0, size, size); applyLook(ox, 0, 0, size, size); ctx.drawImage(oc, -size / 2, -size / 2); }
      ctx.fillStyle = "#111"; ctx.font = '400 38px "Long Cang", "Noto Serif SC", cursive'; ctx.textAlign = "center"; ctx.fillText(fit(ctx, it.p.s.name || "", size - 20), 0, size / 2 + 62); ctx.textAlign = "left"; }
    else if (it.kind === "stamp") { const w = size * .62, h = w * 1.25; ctx.shadowColor = "rgba(0,0,0,.2)"; ctx.shadowBlur = 30; ctx.shadowOffsetY = 16; ctx.drawImage(it.img, -w / 2, -h / 2, w, h); ctx.shadowColor = "transparent"; if (it.art) ctx.drawImage(it.art, -w / 2 + w * .32, -h / 2 + h * .296, w * .58, w * .58); }
    else if (it.kind === "ticket") { const w = size * .72, h = w * .78; ctx.shadowColor = "rgba(0,0,0,.18)"; ctx.shadowBlur = 24; ctx.shadowOffsetY = 12; ctx.fillStyle = "#fbf8f1"; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.shadowColor = "transparent"; ctx.strokeStyle = "#2f3a2e"; ctx.lineWidth = 3; ctx.strokeRect(-w / 2, -h / 2, w, h); ctx.drawImage(it.art, -w * .3, -h / 2 + 14, w * .6, w * .6); ctx.fillStyle = "#2f3a2e"; ctx.font = '500 30px "Noto Serif SC", serif'; ctx.textAlign = "center"; ctx.fillText(fit(ctx, it.name, w - 30), 0, h / 2 - 22); ctx.textAlign = "left"; }
    else { ctx.drawImage(it.img, -size / 2, -size / 2, size, size); }
    ctx.restore(); });
  if (!pics.length) { ctx.fillStyle = "#b0b0b5"; ctx.font = '400 34px "Noto Serif SC", serif'; ctx.fillText("打卡和美食票拍的照片会贴在这里", 110, 1100); }
  const RY = 2330; ctx.strokeStyle = "#111"; ctx.setLineDash([12, 12]); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(100, RY); ctx.lineTo(W - 100, RY); ctx.stroke(); ctx.setLineDash([]);
  const liked = wallet.filter(w => w.rating === "love").length;
  ctx.fillStyle = "#111"; ctx.font = '400 30px "Special Elite", monospace'; ctx.letterSpacing = "3px";
  ctx.fillText(`${days} DAYS · ${places.length} PLACES · ${seals.length} CITIES · ${wallet.length} TASTES${liked ? ` · ${liked} LOVED` : ""}`, 104, RY + 70);
  ctx.textAlign = "right"; ctx.font = '600 60px "Cormorant Garamond", serif'; ctx.letterSpacing = "0px"; ctx.fillText(`No.${String(places.length + seals.length).padStart(3, "0")}`, W - 100, RY + 80); ctx.textAlign = "left";
  ctx.fillStyle = "#9a9a9e"; ctx.font = '400 24px system-ui, sans-serif'; ctx.letterSpacing = "9px"; ctx.fillText(`TRIP DECK · MY TRAVEL BOOK · ${(api.me && api.me.name) || ""}`, 108, RY + 150); ctx.letterSpacing = "0px";
  try { const { getJournal } = await import("../lib/journal.js"); const JJ = await getJournal(); const wxIcon = t => /雷/.test(t) ? "⚡" : /雨/.test(t) ? "☂" : /雪/.test(t) ? "❄" : /阴|雾/.test(t) ? "☁" : /云/.test(t) ? "⛅" : "☀";
    const wx = tripDays().map(d => { try { const w = JSON.parse(localStorage.getItem(`td-wx:${trip.id}:${d}`) || "null"); return w ? wxIcon(w.t) : "·"; } catch (e) { return "·"; } }).join("  "), md = tripDays().map(d => (JJ.moods || {})[d] || "—").join(" ");
    ctx.fillStyle = "#111"; ctx.font = '400 34px "Noto Serif SC", serif'; ctx.letterSpacing = "6px"; if (wx.replace(/[· ]/g, "")) ctx.fillText(wx, 108, RY + 220); if (md.replace(/[— ]/g, "")) ctx.fillText(md, 108, RY + 270); ctx.letterSpacing = "0px"; } catch (e) {}
  grain(ctx, 5);
  const blob = await new Promise(r => c.toBlob(r, "image/jpeg", .93));
  const url = URL.createObjectURL(blob), file = new File([blob], `${trip.name}-poster.jpg`, { type: "image/jpeg" });
  sfx.success();
  const sh = setSheet(`<div class="as"><small class="as-k">POSTER · 1440 × 2560 JPG</small><h3>${esc(trip.name)}</h3><img class="poster-prev" src="${url}" alt="旅行海报"><div class="as-btns"><div class="row"><button class="btn" data-act="save">保存图片</button><button class="btn ink" data-act="share">分享</button></div><button class="btn full" data-act="close">关闭</button></div></div>`);
  bind(sh, {
    close: () => closeSheet(),
    save: () => { const a = document.createElement("a"); a.href = url; a.download = file.name; a.click(); },
    share: async () => { try { if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], title: trip.name }); else { const a = document.createElement("a"); a.href = url; a.download = file.name; a.click(); } } catch (e) {} }
  });
}
