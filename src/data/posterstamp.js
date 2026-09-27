/* Poster stamps: every collected place gets a one-of-a-kind stamp — layout × palette × doodle × phrase × number. */
import { doodle, doodleFor } from "./doodles.js";
import { lang } from "../lib/i18n.js";
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const hash = s => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const FRAMES = [["#e8342c", "#fbf3e6", "#1f2440", "#f3c43a"], ["#2f5fb8", "#f7f2e8", "#e8453c", "#f7c2d2"], ["#1f8a6a", "#fbf6e8", "#1f2440", "#f3d45a"], ["#f07a9a", "#fff6ee", "#2f5fb8", "#9fd0f0"], ["#1f2440", "#f3eee0", "#f3c43a", "#e8453c"], ["#ff8a3d", "#fff8ec", "#1f4f9a", "#8fd8b8"], ["#6a4ad8", "#f6f2ff", "#f0a02a", "#f7c2d2"], ["#d8543a", "#f7efe2", "#2f8f6a", "#f2d27a"]];
const ZH = ["慢慢走，这里值得。", "今天也很好。", "风很温柔。", "到此一游。", "下次还来。", "你不必一个人扛。", "停一下，看看天。", "好吃的在前面。", "走累了就坐一会儿。", "这一刻，记住了。"];
const EN = ["Take it slow — it's worth it.", "Today was good.", "The wind was kind.", "I was here.", "See you again.", "You don't have to carry it alone.", "Stop. Look up.", "Good food ahead.", "Rest when you need it.", "Remember this one."];
const short = n => (n || "").replace(/（.*?）|\(.*?\)/g, "").replace(/ · .*/, "").trim();
const KIND = { food: ["食令", "#d8703a"], experience: ["习俗", "#2f7f7a"], special: ["物候", "#3a5a8a"], place: ["打卡", "#c8382a"] };
const MUTED = [["#c8382a", "#8fb3c8", "#e8c77a"], ["#5a8f6a", "#e8a0a8", "#e8c77a"], ["#3a5a8a", "#e8955a", "#bcd6e8"], ["#c85a7a", "#6aa0c8", "#f0dc8a"]];
export function stampArt(s) { const h = hash((s.name || "") + (s.city || "") + (s.date || "")), kind = s.kind === "food" ? "food" : "place"; return doodle(doodleFor(s.name, kind), { seed: h % 40, pal: MUTED[h % MUTED.length], sw: 2.2, wobble: 1.8 }); }
export function posterStamp(s, o = {}) {
  const name = short(s.name), h = hash((s.name || "") + (s.city || "") + (s.date || "")), kind = s.kind === "food" ? "food" : s.kind === "experience" ? "experience" : s.kind === "special" ? "special" : "place";
  const [tag, col] = KIND[kind], pal = MUTED[h % MUTED.length], dd = doodleFor(s.name, kind === "food" ? "food" : "place"), no = String(o.no || ((h >>> 7) % 90) + 1).padStart(2, "0");
  const cityEn = (o.cityEn || "").toUpperCase(), date = (s.date || "").replace(/-/g, "."), id = "ps" + h.toString(36) + Math.random().toString(36).slice(2, 5);
  const vert = name.slice(0, 6).split("").map((c, i) => `<text x="34" y="${74 + i * 27}" text-anchor="middle" font-family="Noto Serif SC,Songti SC,serif" font-weight="700" font-size="24" fill="#2a2420">${esc(c)}</text>`).join("");
  const en = (o.en || cityEn || "").slice(0, 18);
  const holes = []; for (let i = 0; i <= 20; i++) holes.push(`<circle cx="${i * 10}" cy="0" r="4"/><circle cx="${i * 10}" cy="250" r="4"/>`); for (let i = 0; i <= 25; i++) holes.push(`<circle cx="0" cy="${i * 10}" r="4"/><circle cx="200" cy="${i * 10}" r="4"/>`);
  return `<svg viewBox="0 0 200 250" class="pstamp" aria-label="${esc(name)}"><defs><mask id="${id}m"><rect width="200" height="250" fill="#fff"/><g fill="#000">${holes.join("")}</g></mask><filter id="${id}g"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" result="n"/><feColorMatrix in="n" values="0 0 0 0 .3 0 0 0 0 .2 0 0 0 0 .1 0 0 0 .08 0"/><feComposite in2="SourceGraphic" operator="in"/><feBlend in="SourceGraphic" mode="multiply"/></filter></defs>
    <g mask="url(#${id}m)"><rect width="200" height="250" fill="#fbf8f1"/><g filter="url(#${id}g)"><rect width="200" height="250" fill="#f8f4ea"/></g>
      <rect x="12" y="12" width="176" height="226" fill="none" stroke="#2a2420" stroke-width=".6" opacity=".55"/>
      <rect x="150" y="20" width="26" height="40" fill="${col}"/><text x="163" y="36" text-anchor="middle" font-family="Noto Serif SC,serif" font-weight="700" font-size="11" fill="#fbf8f1">${tag[0]}</text><text x="163" y="52" text-anchor="middle" font-family="Noto Serif SC,serif" font-weight="700" font-size="11" fill="#fbf8f1">${tag[1]}</text>
      <text x="22" y="30" font-family="Special Elite,monospace" font-size="6.5" letter-spacing="1.2" fill="#6a6058">TRAVEL STAMP · No.${no}</text>
      <rect x="20" y="42" width="30" height="176" fill="none" stroke="#2a2420" stroke-width=".5" opacity=".35"/>${vert}
      ${en ? `<text transform="translate(60 60) rotate(90)" font-family="Cormorant Garamond,serif" font-style="italic" font-size="10" fill="#6a6058" letter-spacing=".5">${esc(en)}</text>` : ""}
      <circle cx="122" cy="132" r="56" fill="#fff" opacity=".65"/>
      ${o.noArt ? "" : `<foreignObject x="64" y="74" width="116" height="116"><div xmlns="http://www.w3.org/1999/xhtml" style="width:100%;height:100%">${doodle(dd, { seed: h % 40, pal, sw: 2.2, wobble: 1.8 })}</div></foreignObject>`}
      <line x1="20" y1="222" x2="180" y2="222" stroke="#2a2420" stroke-width=".6" opacity=".6"/>
      <text x="20" y="233" font-family="Noto Serif SC,serif" font-size="7.5" fill="#2a2420">旅行邮票</text><text x="62" y="233" font-family="Special Elite,monospace" font-size="5.5" fill="#8a8078" letter-spacing="1">${esc(cityEn || "TRAVEL DECK")}</text>
      <text x="180" y="234" text-anchor="end" font-family="Cormorant Garamond,serif" font-weight="600" font-size="16" fill="#2a2420">1.20<tspan font-size="8">元</tspan></text>
      <text x="180" y="72" text-anchor="end" font-family="Special Elite,monospace" font-size="6" fill="#8a8078">${date}</text></g></svg>`;
}
