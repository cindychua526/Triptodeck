/* 滤镜: one look per trip, applied to both albums, the poster and the tickets' photos. */
import { api } from "./api.js";
export const LOOKS = [
  ["none", "原图", ""],
  ["film", "复古胶片", "sepia(.32) contrast(1.08) saturate(.85) brightness(1.04)"],
  ["fuji", "富士", "saturate(1.18) contrast(1.06) hue-rotate(-10deg) brightness(1.03)"],
  ["luxe", "高级灰", "saturate(.62) contrast(1.14) brightness(.98)"],
  ["noir", "黑白", "grayscale(1) contrast(1.22) brightness(1.02)"],
  ["warm", "暖阳", "sepia(.18) saturate(1.2) brightness(1.06) contrast(1.02)"]
];
const key = () => "td-look:" + (api.trip ? api.trip.id : "");
export const getLook = () => { try { return localStorage.getItem(key()) || "none"; } catch (e) { return "none"; } };
export function setLook(k) { try { localStorage.setItem(key(), k); } catch (e) {} document.documentElement.dataset.look = k; document.dispatchEvent(new CustomEvent("look")); }
export const lookCSS = k => (LOOKS.find(x => x[0] === k) || LOOKS[0])[2];
export const lookChips = (cur = getLook()) => `<div class="look-row">${LOOKS.map(([k, n]) => `<button class="look${k === cur ? " on" : ""}" data-look="${k}"><i class="lk-${k}"></i>${n}</button>`).join("")}</div>`;
export function bindLookChips(root, after) { root.querySelectorAll("[data-look]").forEach(b => b.onclick = () => { setLook(b.dataset.look); root.querySelectorAll("[data-look]").forEach(x => x.classList.toggle("on", x === b)); after && after(b.dataset.look); }); }
/* canvas: Safari can't do ctx.filter, so apply the look to the pixels */
export function applyLook(ctx, x, y, w, h, k = getLook()) {
  if (k === "none") return; let d; try { d = ctx.getImageData(x, y, w, h); } catch (e) { return; } const a = d.data;
  for (let i = 0; i < a.length; i += 4) {
    let r = a[i], g = a[i + 1], b = a[i + 2]; const l = .299 * r + .587 * g + .114 * b;
    if (k === "noir") { const v = (l - 128) * 1.22 + 130; r = g = b = v; }
    else if (k === "luxe") { r = l + (r - l) * .62; g = l + (g - l) * .62; b = l + (b - l) * .62; r = (r - 128) * 1.14 + 126; g = (g - 128) * 1.14 + 126; b = (b - 128) * 1.14 + 126; }
    else if (k === "film") { const sr = .393 * r + .769 * g + .189 * b, sg = .349 * r + .686 * g + .168 * b, sb = .272 * r + .534 * g + .131 * b; r = r * .68 + sr * .32; g = g * .68 + sg * .32; b = b * .68 + sb * .32; r = (r - 128) * 1.08 + 134; g = (g - 128) * 1.08 + 132; b = (b - 128) * 1.08 + 128; }
    else if (k === "fuji") { r = l + (r - l) * 1.18; g = l + (g - l) * 1.22; b = l + (b - l) * 1.1; r = (r - 128) * 1.06 + 128; g = (g - 128) * 1.06 + 132; b = (b - 128) * 1.06 + 131; }
    else if (k === "warm") { r = l + (r - l) * 1.2 + 14; g = l + (g - l) * 1.2 + 6; b = l + (b - l) * 1.2 - 8; }
    a[i] = r < 0 ? 0 : r > 255 ? 255 : r; a[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g; a[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
  }
  ctx.putImageData(d, x, y);
}
if (typeof document !== "undefined") setTimeout(() => { document.documentElement.dataset.look = getLook(); }, 600);
