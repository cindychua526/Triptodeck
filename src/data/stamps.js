/* Refined travel stamps: postmarks, consular ovals, deco frames, postage stamps and Chinese seals. */
import { ICON, CITY } from "./world.js";
import { kindIcon } from "./fujian.js";
import { hash, esc } from "../lib/util.js";

const INK = { "厦门": "#2d4f7c", "泉州": "#a3402d", "漳州": "#3d6f57", "福州": "#6b3f6e", "平潭": "#2f6f7e" };
const PAL = ["#2d4f7c", "#a3402d", "#3d6f57", "#7a5a2c", "#6b3f6e", "#8a3b4a"];
const EN = Object.fromEntries(Object.values(CITY).map(c => [c.name, c.en]));
const MON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const fdate = iso => { if (!iso) return ""; const [y, m, d] = iso.split("-"); return `${d} ${MON[+m - 1]} ${y}`; };
const short = n => n.replace(/（.*?）|\(.*?\)/g, "").replace(/ · .*/, "").replace(/^CHECK IN /, "").trim();
const inkOf = (city, name) => INK[city] || PAL[hash(city || name) % PAL.length];
const fsFor = (t, base) => t.length <= 3 ? base : t.length <= 5 ? base * .82 : t.length <= 7 ? base * .64 : base * .52;
function defs(u, h, rough = 1) {
  return `<defs><path id="${u}t" d="M40 110a70 70 0 1 1 140 0"/><path id="${u}b" d="M34 110a76 76 0 0 0 152 0"/>
    <filter id="${u}f" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="${h % 50}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="${1.3 * rough}" result="d"/><feTurbulence type="fractalNoise" baseFrequency="2.2" numOctaves="1" seed="${(h >> 4) % 50}" result="w"/><feColorMatrix in="w" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.4 1.85" result="m"/><feComposite in="d" in2="m" operator="in"/></filter></defs>`;
}
const motif = (name, kind, x, y, s, col, w = 3.4) => `<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${ICON[kindIcon(name, kind)] || ICON.compass}</g>`;

/* A. postmark with cancellation waves */
function postmark(o) {
  const { u, col, nm, en, dt } = o, X = 92;
  return `<defs><path id="${u}pt" d="M${X - 58} 110a58 58 0 1 1 116 0"/><path id="${u}pb" d="M${X - 67} 110a67 67 0 0 0 134 0"/></defs><g filter="url(#${u}f)" fill="none" stroke="${col}">
    <g stroke-width="1.6" opacity=".85">${[0, 1, 2, 3, 4].map(i => `<path d="M176 ${88 + i * 11}q8-5 16 0t16 0" />`).join("")}</g>
    <circle cx="${X}" cy="110" r="80" stroke-width="2.2"/><circle cx="${X}" cy="110" r="73" stroke-width=".8"/>
    <circle cx="${X}" cy="110" r="44" stroke-width=".8" stroke-dasharray="1.5 3"/>
    <g fill="${col}" stroke="none" font-family="Cormorant Garamond, Georgia, serif" font-weight="600" letter-spacing="3">
      <text font-size="12"><textPath href="#${u}pt" startOffset="50%" text-anchor="middle">${esc(en)} · FUJIAN</textPath></text>
      <text font-size="11"><textPath href="#${u}pb" startOffset="50%" text-anchor="middle">${dt}</textPath></text>
      <text x="${X - 62}" y="114" font-size="9" text-anchor="middle">✦</text><text x="${X + 62}" y="114" font-size="9" text-anchor="middle">✦</text>
      <text x="${X}" y="136" font-size="${fsFor(nm, 17)}" text-anchor="middle" font-family="Noto Serif SC, Songti SC, serif" font-weight="700" letter-spacing="2">${esc(nm)}</text>
    </g>${motif(nm, o.kind, X - 24, 76, .4, col)}</g>`;
}
/* B. consular oval with a knock-out band */
function oval(o) {
  const { u, col, nm, en, dt } = o;
  return `<g filter="url(#${u}f)" fill="none" stroke="${col}">
    <ellipse cx="110" cy="110" rx="96" ry="66" stroke-width="2.4"/><ellipse cx="110" cy="110" rx="88" ry="58" stroke-width=".8"/>
    <rect x="22" y="96" width="176" height="30" fill="${col}" stroke="none"/>
    <g font-family="Cormorant Garamond, Georgia, serif" font-weight="600" text-anchor="middle" letter-spacing="3" fill="${col}" stroke="none">
      <text x="110" y="70" font-size="11">ARRIVED · 已抵达</text><text x="110" y="148" font-size="11">${dt}</text><text x="110" y="162" font-size="9" letter-spacing="4">${esc(en)}</text>
      <text x="110" y="117" font-size="${fsFor(nm, 17)}" fill="#f4ecda" font-family="Noto Serif SC, Songti SC, serif" font-weight="700" letter-spacing="3">${esc(nm)}</text>
      <text x="42" y="116" font-size="10" fill="#f4ecda">★</text><text x="178" y="116" font-size="10" fill="#f4ecda">★</text>
    </g>${motif(nm, o.kind, 94, 72, .27, col, 4.2)}</g>`;
}
/* C. art-deco chamfered frame */
function deco(o) {
  const { u, col, nm, en, dt } = o, c = "M46 22H174L198 46V174L174 198H46L22 174V46Z", c2 = "M52 32H168L188 52V168L168 188H52L32 168V52Z";
  return `<g filter="url(#${u}f)" fill="none" stroke="${col}">
    <path d="${c}" stroke-width="2.4"/><path d="${c2}" stroke-width=".8"/>
    <path d="M32 60H188M32 160H188" stroke-width=".8"/><path d="M104 60l6-6 6 6M104 160l6 6 6-6" stroke-width="1"/>
    <g fill="${col}" stroke="none" font-family="Cormorant Garamond, Georgia, serif" font-weight="600" text-anchor="middle" letter-spacing="3.4">
      <text x="110" y="50" font-size="10.5">${esc(en)} · 福建</text><text x="110" y="178" font-size="10.5">${dt}</text>
      <text x="110" y="148" font-size="${fsFor(nm, 18)}" font-family="Noto Serif SC, Songti SC, serif" font-weight="700" letter-spacing="2">${esc(nm)}</text>
    </g>${motif(nm, o.kind, 80, 70, .5, col, 3)}</g>`;
}
/* D. postage stamp (printed in colour, perforated edge) */
function postage(o) {
  const { u, col, nm, en, dt, h } = o;
  const per = []; for (let i = 0; i <= 14; i++) { const t = 26 + i * 12; per.push(`<circle cx="${t}" cy="22" r="4"/><circle cx="${t}" cy="198" r="4"/><circle cx="22" cy="${t}" r="4"/><circle cx="198" cy="${t}" r="4"/>`); }
  const val = [8, 10, 20, 50][h % 4];
  return `<mask id="${u}m"><rect width="220" height="220" fill="#fff"/><g fill="#000">${per.join("")}</g></mask>
    <g mask="url(#${u}m)"><rect x="22" y="22" width="176" height="176" fill="#f7f0e1" stroke="rgba(0,0,0,.08)"/>
    <rect x="34" y="34" width="152" height="152" fill="${col}"/>
    <g opacity=".22" stroke="#f7f0e1" fill="none">${[0, 1, 2, 3, 4, 5].map(i => `<circle cx="160" cy="62" r="${10 + i * 12}"/>`).join("")}</g>
    ${motif(nm, o.kind, 70, 52, .67, "#f7f0e1", 2.4)}
    <g fill="#f7f0e1" font-family="Cormorant Garamond, Georgia, serif" font-weight="600">
      <text x="44" y="56" font-size="20">${val}<tspan font-size="10" dx="2">分</tspan></text>
      <text x="176" y="54" font-size="9" text-anchor="end" letter-spacing="2.4">${esc(en).toUpperCase()} · ${dt.slice(-4)}</text>
      <text x="44" y="160" font-size="${fsFor(nm, 18)}" font-family="Noto Serif SC, Songti SC, serif" font-weight="700" letter-spacing="2">${esc(nm)}</text>
      <text x="44" y="176" font-size="9" letter-spacing="3">中国 · 福建</text></g></g>
    <g filter="url(#${u}f)" opacity=".55" fill="none" stroke="#2b2118" stroke-width="1.6"><path d="M120 150q12-7 24 0t24 0t24 0M120 162q12-7 24 0t24 0t24 0"/><circle cx="182" cy="126" r="24" stroke-width="1.2"/></g>`;
}
/* E. serendipity (计划外) — twelve-point star rosette */
function special(o) {
  const { u, col, nm, dt } = o, P = (r, a) => [110 + r * Math.cos(a), 110 + r * Math.sin(a)].map(v => v.toFixed(1)).join(" ");
  let d = ""; for (let i = 0; i < 24; i++) d += (i ? "L" : "M") + P(i % 2 ? 80 : 96, i / 24 * Math.PI * 2 - Math.PI / 2);
  return `<g filter="url(#${u}f)" fill="none" stroke="${col}"><path d="${d}Z" stroke-width="2"/><circle cx="110" cy="110" r="70" stroke-width="1"/><circle cx="110" cy="110" r="64" stroke-width=".6"/>
    <g fill="${col}" stroke="none" font-family="Cormorant Garamond, Georgia, serif" font-weight="600" text-anchor="middle" letter-spacing="3.2">
      <text font-size="11"><textPath href="#${u}t" startOffset="50%" text-anchor="middle">SERENDIPITY · 计划外</textPath></text>
      <text x="110" y="162" font-size="10">${dt}</text>
      <text x="110" y="134" font-size="${fsFor(nm, 18)}" font-family="Noto Serif SC, Songti SC, serif" font-weight="700" letter-spacing="2">${esc(nm)}</text></g>
    <path d="M110 70l4 12 12 4-12 4-4 12-4-12-12-4 12-4z" fill="${col}" stroke="none"/></g>`;
}
export function placeStamp(name, city, date, opt = {}) {
  const nm = short(name), h = hash(name + (city || "")), u = "s" + Math.random().toString(36).slice(2, 8);
  const o = { u, h, col: inkOf(city, name), nm, en: (EN[city] || city || "TRAVEL").toUpperCase(), dt: fdate(date), kind: opt.kind };
  const body = opt.special ? special(o) : [postmark, oval, deco, postage][h % 4](o);
  return `<svg viewBox="0 0 220 220" class="stamp-svg" aria-label="${esc(nm)}印章">${defs(u, h)}${body}</svg>`;
}
/* F. Chinese seal for city stamps: four characters read top-right → bottom-left */
export function citySeal(cityName, date) {
  const n = cityName || "旅行", chars = (n.length >= 4 ? n.slice(0, 4) : n.length === 3 ? n + "印" : n + "之印").split("");
  const h = hash(n), u = "c" + Math.random().toString(36).slice(2, 8), col = "#b0362a";
  const pos = [[140, 88], [140, 152], [80, 88], [80, 152]];
  return `<svg viewBox="0 0 220 220" class="stamp-svg seal-svg" aria-label="${esc(n)}印">${defs(u, h, 1.6)}
    <g filter="url(#${u}f)"><rect x="40" y="40" width="140" height="140" rx="10" fill="${col}"/>
      <rect x="48" y="48" width="124" height="124" rx="6" fill="none" stroke="#f4ecda" stroke-width="2.4"/><path d="M110 52V168M52 110H168" stroke="#f4ecda" stroke-width=".8" opacity=".35"/>
      <g fill="#f4ecda" font-family="Ma Shan Zheng, STKaiti, Noto Serif SC, serif" font-size="52" text-anchor="middle">${chars.map((c, i) => `<text x="${pos[i][0]}" y="${pos[i][1] + 18}">${esc(c)}</text>`).join("")}</g></g>
    <text x="110" y="206" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-weight="600" font-size="12" letter-spacing="3" fill="${col}" opacity=".8">${fdate(date)}</text></svg>`;
}

/* G. wax-seal mark for signature experiences (印记) */
const WAX = ["#9c2a2a", "#2d4f7c", "#3d6f57", "#7a4a8a", "#a8642a", "#1f5f6a"];
export function waxSeal(name, city, date) {
  const nm = short(name), h = hash(name), u = "w" + Math.random().toString(36).slice(2, 8), col = WAX[h % WAX.length];
  let blob = ""; for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2, r = 88 + ((h >> (i % 16)) & 7) - 3 + (i % 3 === 0 ? 5 : 0); blob += (i ? "L" : "M") + (110 + Math.cos(a) * r).toFixed(1) + " " + (110 + Math.sin(a) * r).toFixed(1); }
  const ch = nm.slice(0, 1);
  return `<svg viewBox="0 0 220 220" class="stamp-svg wax-svg" aria-label="${esc(nm)}体验印记"><defs>
    <radialGradient id="${u}g" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="${col}" stop-opacity=".75"/><stop offset=".5" stop-color="${col}"/><stop offset="1" stop-color="#1a0e0a"/></radialGradient>
    <filter id="${u}e"><feGaussianBlur in="SourceAlpha" stdDeviation="2"/><feSpecularLighting surfaceScale="4" specularConstant=".9" specularExponent="18" lighting-color="#fff"><feDistantLight azimuth="225" elevation="45"/></feSpecularLighting><feComposite in2="SourceAlpha" operator="in"/><feBlend in="SourceGraphic" mode="screen"/></filter>
    <path id="${u}c" d="M50 110a60 60 0 1 1 120 0a60 60 0 1 1 -120 0"/></defs>
    <path d="${blob}Z" fill="url(#${u}g)"/><path d="${blob}Z" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="2"/>
    <g filter="url(#${u}e)"><circle cx="110" cy="110" r="68" fill="${col}"/><circle cx="110" cy="110" r="68" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="3"/><circle cx="110" cy="110" r="58" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="1.4"/>
      <text font-family="Cormorant Garamond, Georgia, serif" font-weight="600" font-size="11" letter-spacing="3" fill="rgba(255,240,220,.7)"><textPath href="#${u}c" startOffset="0">✦ EXPERIENCE · ${esc((city || "").toUpperCase())} · ${fdate(date)} ✦ 体验印记</textPath></text>
      <text x="110" y="128" text-anchor="middle" font-family="Ma Shan Zheng, STKaiti, serif" font-size="52" fill="rgba(255,236,210,.85)">${esc(ch)}</text></g>
    <text x="110" y="214" text-anchor="middle" font-family="Noto Serif SC, serif" font-weight="700" font-size="14" fill="${col}">${esc(nm)}</text></svg>`;
}
/* H. postage stamp with a postmark struck across its corner (for the stamp archive) */
export function postageStamp(name, city, date, kind) {
  const nm = short(name), h = hash(name + (city || "")), u = "p" + Math.random().toString(36).slice(2, 8), col = inkOf(city, name);
  const o = { u, h, col, nm, en: (EN[city] || city || "TRAVEL").toUpperCase(), dt: fdate(date), kind };
  const pm = postmark({ ...o, col: "#2b2118", u: u + "m" }).replace('<g filter', `<g opacity=".62" transform="translate(96 -34) scale(.62) rotate(-14 110 110)"><g filter`) + "</g>";
  return `<svg viewBox="0 0 220 220" class="stamp-svg post-svg" aria-label="${esc(nm)}邮票">${defs(u, h)}${defs(u + "m", h)}${postage(o)}${pm}</svg>`;
}
