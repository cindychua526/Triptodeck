export const $ = id => document.getElementById(id);
export const pad = n => String(n).padStart(2, "0");
export const dstr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const wait = ms => new Promise(r => setTimeout(r, ms));
export const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const buzz = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };
export const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
export const toMin = t => { const [h, m] = String(t || "0:0").split(":").map(Number); return h * 60 + (m || 0); };
export const fmtMin = m => `${pad(Math.floor((((m % 1440) + 1440) % 1440) / 60))}:${pad(((m % 60) + 60) % 60)}`;
export const hm = ts => { const d = new Date(ts); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
export const uid = (p = "x") => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
export const pick = a => a[Math.floor(Math.random() * a.length)];
export function hash(s) { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
export function seeded(seed) { let x = hash(seed) || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }

/* "today" can be simulated (rehearsal mode) so the trip can be tried before it starts */
export function simOffset() { try { return +localStorage.getItem("td-sim-offset") || 0; } catch (e) { return 0; } }
export function setSimDate(iso) { try { if (!iso) localStorage.removeItem("td-sim-offset"); else { const real = new Date(); real.setHours(0, 0, 0, 0); const t = new Date(iso + "T00:00:00"); localStorage.setItem("td-sim-offset", String(Math.round((t - real) / 86400000))); } } catch (e) {} }
export function now() { const d = new Date(); d.setDate(d.getDate() + simOffset()); return d; }
export const today = () => dstr(now());
export const addDays = (iso, n) => { const d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + n); return dstr(d); };
export const tomorrow = () => addDays(today(), 1);
export const yesterday = () => addDays(today(), -1);
export const shortDate = iso => iso ? iso.slice(5).replace("-", ".") : "";
export const WEEK = "日一二三四五六";
export const weekday = iso => "周" + WEEK[new Date(iso + "T00:00:00").getDay()];
export const whenTxt = ts => { const d = new Date(ts), s = dstr(d); return (s === dstr(new Date()) ? "今天" : shortDate(s)) + " " + hm(ts); };

/* downscale an image file to a JPEG data URL (for upload + AI check) */
export function shrinkImage(file, max = 1280, q = .82) {
  return new Promise((res, rej) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas"); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      res(c.toDataURL("image/jpeg", q));
    };
    img.onerror = e => { URL.revokeObjectURL(url); rej(e); };
    img.src = url;
  });
}
export const dataUrlToBlob = u => { const [h, b] = u.split(","), m = h.match(/:(.*?);/)[1], bin = atob(b), a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return new Blob([a], { type: m }); };
