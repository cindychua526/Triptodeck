/* Refined travel stamps: postmarks, consular ovals, deco frames, postage stamps and Chinese seals. */
import { ICON, CITY } from "./world.js";
import { kindIcon } from "./fujian.js";
import { hash, esc } from "../lib/util.js";
import { guideFor } from "./guides.js";
import { sceneFor, drawScene, isNightScene, EXACT_SCENES, cloud } from "./scenery.js";
/* which province / country to print on a stamp (it used to always say 福建) */
const PROV = { "厦门": "福建", "泉州": "福建", "漳州": "福建", "福州": "福建", "平潭": "福建", "武夷山": "福建", "潮汕": "广东", "潮州": "广东", "汕头": "广东", "广州": "广东", "深圳": "广东", "长沙": "湖南", "张家界": "湖南", "杭州": "浙江", "大理": "云南", "丽江": "云南", "哈尔滨": "黑龙江", "成都": "四川", "西安": "陕西", "苏州": "江苏", "南京": "江苏" };
const regionOf = city => { if (PROV[city]) return PROV[city]; const g = guideFor(city); if (g && g.name && PROV[g.name]) return PROV[g.name]; return g && g.country && g.country !== "中国" ? g.country : ["北京", "上海", "重庆", "天津"].includes(city) ? city : "旅途"; };
const REGION_EN = { "福建": "FUJIAN", "广东": "GUANGDONG", "湖南": "HUNAN", "浙江": "ZHEJIANG", "云南": "YUNNAN", "黑龙江": "HEILONGJIANG", "四川": "SICHUAN", "陕西": "SHAANXI", "江苏": "JIANGSU", "北京": "BEIJING", "上海": "SHANGHAI", "重庆": "CHONGQING", "天津": "TIANJIN", "马来西亚": "MALAYSIA", "新加坡": "SINGAPORE", "泰国": "THAILAND", "韩国": "KOREA", "日本": "JAPAN", "台湾": "TAIWAN", "越南": "VIETNAM", "新西兰": "NEW ZEALAND" };
const countryOf = city => { const g = guideFor(city); return g && g.country ? g.country : "中国"; };

const INK = { "厦门": "#2d4f7c", "泉州": "#a3402d", "漳州": "#3d6f57", "福州": "#6b3f6e", "平潭": "#2f6f7e" };
/* passport-office inks: every place gets its own (it used to be one colour per city, so a whole city came out red) */
const PAL = ["#2d4f9c", "#a3402d", "#2f6f4f", "#6a3f8a", "#1f5f6a", "#8a3b4a", "#2a2d3a", "#9a5a1f", "#3a5fb0", "#5c7a2a", "#b04a6a", "#4a3a8a"];
const EN = Object.fromEntries(Object.values(CITY).map(c => [c.name, c.en]));
const MON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
/* "Chaozhou & Shantou" is too long to fit round a stamp — keep the first place, at most 14 letters */
const shortEn = city => String(EN[city] || (guideFor(city) || {}).en || city || "TRAVEL").replace(/ & .*/, "").toUpperCase().slice(0, 14);
const fdate = iso => { if (!iso) return ""; const [y, m, d] = iso.split("-"); return `${d} ${MON[+m - 1]} ${y}`; };
const short = n => n.replace(/（.*?）|\(.*?\)/g, "").replace(/ · .*/, "").replace(/^CHECK IN /, "").trim();
const inkOf = (city, name) => PAL[hash((name || "") + "·" + (city || "")) % PAL.length];
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
      <text font-size="12"><textPath href="#${u}pt" startOffset="50%" text-anchor="middle">${esc((en + (o.regionEn || "")).length > 16 ? en : en + " · " + (o.regionEn || "TRAVEL"))}</textPath></text>
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
      <text x="110" y="50" font-size="10.5">${esc(en)} · ${esc(o.region || "旅途")}</text><text x="110" y="178" font-size="10.5">${dt}</text>
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
      <text x="176" y="54" font-size="7.5" text-anchor="end" letter-spacing="1.4">${esc(en).toUpperCase()} · ${dt.slice(-4)}</text>
      <text x="44" y="160" font-size="${fsFor(nm, 18)}" font-family="Noto Serif SC, Songti SC, serif" font-weight="700" letter-spacing="2">${esc(nm)}</text>
      <text x="44" y="176" font-size="9" letter-spacing="3">${esc(o.country || "中国")}${o.region && o.region !== o.country ? " · " + esc(o.region) : ""}</text></g></g>
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
/* I. 风景印 · scenery stamp: a little inked picture of the place itself (bridge, temple, arcade street, city gate, hills, sea, garden),
   printed in two inks inside a round / arched / scalloped frame, with the name on a band — like the stamps at scenic spots. */
const SCENE_PAL = [["#2d4f9c", "#e0703a"], ["#2f6f4f", "#d8453a"], ["#6a3f8a", "#d9a03a"], ["#1f5f6a", "#e86a5a"], ["#8a3b2a", "#3f8a6a"], ["#23305c", "#e8779a"], ["#3a5fb0", "#e8b43a"], ["#5c7a2a", "#c8472f"], ["#b0362a", "#2d4f9c"]];
/* the pictures themselves live in scenery.js (one per kind of place, plus an exact one for every place in the guides) */
export const sceneOf = (n, h = 0, city) => sceneFor(n, city, h);
function scenery(o, name) {
  const { u, h, nm, en, dt } = o, [c, a] = SCENE_PAL[(h >>> 2) % SCENE_PAL.length], scene = sceneFor(name, o.city, h), shape = (h >>> 5) % 4, night = isNightScene(name, scene);
  const scal = Array.from({ length: 28 }, (_, i) => { const t = i / 28 * Math.PI * 2, t2 = (i + .5) / 28 * Math.PI * 2; return `${i ? "" : "M"}${(110 + Math.cos(t) * 88).toFixed(1)} ${(106 + Math.sin(t) * 88).toFixed(1)}Q${(110 + Math.cos(t2) * 97).toFixed(1)} ${(106 + Math.sin(t2) * 97).toFixed(1)} `; }).join("") + "198 106Z";
  const F = [
    [`<circle cx="110" cy="106" r="80"/>`, `<circle cx="110" cy="106" r="88" stroke-width="3"/><circle cx="110" cy="106" r="81" stroke-width="1"/>`],
    [`<rect x="30" y="24" width="160" height="164" rx="22"/>`, `<rect x="24" y="18" width="172" height="176" rx="26" stroke-width="3"/><rect x="30" y="24" width="160" height="164" rx="21" stroke-width="1"/>`],
    [`<path d="M36 190V100a74 74 0 0 1 148 0V190Z"/>`, `<path d="M28 196V100a82 82 0 0 1 164 0V196Z" stroke-width="3"/><path d="M36 190V100a74 74 0 0 1 148 0V190Z" stroke-width="1"/>`],
    [`<circle cx="110" cy="106" r="80"/>`, `<path d="${scal}" stroke-width="2.6"/><circle cx="110" cy="106" r="81" stroke-width="1"/>`]
  ][shape];
  /* the band only fits a few characters: "国家体育场 Bukit Jalil" → 国家体育场 */
  const band = /[\u4e00-\u9fff]/.test(nm) ? nm.replace(/\s+[A-Za-z0-9][A-Za-z0-9\s.'&-]*$/, "").replace(/^[A-Za-z0-9\s.'&-]+\s+(?=[\u4e00-\u9fff])/, "") : nm, fs = fsFor(band, 17);
  return `<defs><clipPath id="${u}k">${F[0]}</clipPath></defs><g filter="url(#${u}f)">
    <g clip-path="url(#${u}k)" stroke-linecap="round" stroke-linejoin="round"><rect x="0" y="0" width="220" height="220" fill="${a}" fill-opacity=".08"/>
      ${night ? `<rect width="220" height="150" fill="${c}" fill-opacity=".22"/><circle cx="${150 - (h % 3) * 40}" cy="52" r="12" fill="${a}"/><circle cx="${156 - (h % 3) * 40}" cy="48" r="11" fill="#f3ead8"/>${[[40, 44], [70, 36], [132, 40], [176, 56], [96, 50]].map(([x, y]) => `<path d="M${x} ${y - 3}v6M${x - 3} ${y}h6" stroke="${a}" stroke-width="1.3"/>`).join("")}`
        : `<circle cx="${150 - (h % 3) * 40}" cy="54" r="13" fill="${a}"/>${cloud(40 + (h % 2) * 90, 50, c)}`}${drawScene(scene, c, a)}
      <path d="M40 150H180l-6 12 6 12H40l6-12z" fill="${c}"/><text x="110" y="168" text-anchor="middle" font-family="Noto Serif SC, Songti SC, serif" font-weight="700" font-size="${fs}" letter-spacing="2" fill="#fbf6ea">${esc(band)}</text>
</g>
    <g fill="none" stroke="${c}">${F[1]}</g>
    <g transform="translate(${shape === 2 ? 150 : 158} ${shape === 1 ? 30 : 34}) rotate(8)"><rect width="20" height="20" rx="2" fill="${a}"/><text x="10" y="15" text-anchor="middle" font-family="Noto Serif SC, serif" font-weight="700" font-size="13" fill="#fbf6ea">景</text></g>
    <text x="110" y="${shape === 3 ? 216 : 210}" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-weight="600" font-size="10" letter-spacing="2.2" fill="${c}">${dt} · ${esc(en)}</text></g>`;
}

export function placeStamp(name, city, date, opt = {}) {
  const nm = short(name), h = hash(name + (city || "")), u = "s" + Math.random().toString(36).slice(2, 8);
  const o = { u, h, col: inkOf(city, name), nm, en: shortEn(city), dt: fdate(date), kind: opt.kind, region: regionOf(city), regionEn: REGION_EN[regionOf(city)] || "TRAVEL", country: countryOf(city) };
  /* most place stamps are now 风景印 (a picture of the place); a few keep the classic postmark looks for variety */
  const exact = !!(EXACT_SCENES[name] || EXACT_SCENES[nm]);
  const body = opt.special ? special(o) : opt.classic || (!exact && h % 6 === 5) ? [postmark, oval, deco, postage][(h >>> 4) % 4](o) : scenery({ ...o, city }, name);
  return `<svg viewBox="0 0 220 220" class="stamp-svg" aria-label="${esc(nm)}印章">${defs(u, h)}${body}</svg>`;
}
/* F. entry stamps (入境章): real passport-control shapes in real passport inks — a different one for every city.
   Rectangle · oval · round airport stamp · octagon · triangle · and the old Chinese seal as one of them. */
const ENTRY_INK = ["#2d4f9c", "#2f6f4f", "#6a3f8a", "#b0362a", "#1f5f6a", "#2a2d3a", "#9a5a1f", "#b04a6a"];
const PLANE = `<path d="M0 -12l2.6 7.5 9.4 4.5v2.6l-9.4-2.2-.8 7 3.2 2.4v1.9l-5-1.4-5 1.4v-1.9l3.2-2.4-.8-7-9.4 2.2v-2.6l9.4-4.5z"/>`;
export function citySeal(cityName, date) {
  const n = cityName || "旅行", h = hash(n), u = "c" + Math.random().toString(36).slice(2, 8), col = ENTRY_INK[(h >>> 3) % ENTRY_INK.length];
  const g = guideFor(n), en = ((EN[n] || (g && g.en) || n) + "").toUpperCase().replace(/ & .*/, "").slice(0, 14), dt = fdate(date), cc = (countryOf(n) === "中国" ? "CHINA" : (g && g.cc) || "TRAVEL"), no = String(h % 900 + 100);
  const nm = n.slice(0, 4), fs = fsFor(nm, 30), T = (x, y, t, sz, o = "") => `<text x="${x}" y="${y}" font-size="${sz}" ${o}>${t}</text>`;
  const F = `font-family="Cormorant Garamond, Georgia, serif" font-weight="600" text-anchor="middle" letter-spacing="2.4" fill="${col}" stroke="none"`, ZH = `font-family="Noto Serif SC, Songti SC, serif" font-weight="700"`;
  const V = [
    /* rectangle, double rule, date band */
    () => `<g filter="url(#${u}f)" fill="none" stroke="${col}"><rect x="26" y="52" width="168" height="116" rx="8" stroke-width="3"/><rect x="33" y="59" width="154" height="102" rx="4" stroke-width="1"/><path d="M33 122H187M33 142H187" stroke-width="1"/>
      <g ${F}>${T(110, 78, "ARRIVAL · 入境", 12)}<text x="110" y="112" font-size="${fs}" ${ZH} letter-spacing="3">${esc(nm)}</text>${T(110, 137, dt, 13)}${T(110, 156, `${esc(en)} · ${cc}`, 9)}</g>
      <g transform="translate(176 76) scale(.7)" fill="${col}" stroke="none">${PLANE}</g></g>`,
    /* oval immigration stamp with arc text */
    () => `<defs><path id="${u}ot" d="M36 110a74 52 0 1 1 148 0"/><path id="${u}ob" d="M30 110a80 58 0 0 0 160 0"/></defs><g filter="url(#${u}f)" fill="none" stroke="${col}"><ellipse cx="110" cy="110" rx="88" ry="66" stroke-width="3"/><ellipse cx="110" cy="110" rx="80" ry="58" stroke-width="1"/><path d="M52 100H168M52 124H168" stroke-width=".9"/>
      <g ${F}><text font-size="11"><textPath href="#${u}ot" startOffset="50%">IMMIGRATION · 入境检查</textPath></text><text font-size="11"><textPath href="#${u}ob" startOffset="50%">★ ADMITTED · ${cc} ★</textPath></text>
      <text x="110" y="95" font-size="${fsFor(nm, 22)}" ${ZH} letter-spacing="3">${esc(nm)}</text>${T(110, 117, dt, 14)}${T(110, 140, esc(en), 10)}</g></g>`,
    /* round airport stamp with a plane */
    () => `<g filter="url(#${u}f)" fill="none" stroke="${col}"><circle cx="110" cy="110" r="84" stroke-width="3"/><circle cx="110" cy="110" r="62" stroke-width="1.2"/>${Array.from({ length: 24 }, (_, i) => `<path d="M110 30v5" transform="rotate(${i * 15} 110 110)" stroke-width="1.2"/>`).join("")}
      <g ${F}><text font-size="12"><textPath href="#${u}t" startOffset="50%">${esc(en)} · ARRIVED</textPath></text><text font-size="12"><textPath href="#${u}b" startOffset="50%">${dt}</textPath></text>
      <text x="110" y="140" font-size="${fsFor(nm, 22)}" ${ZH} letter-spacing="2">${esc(nm)}</text></g><g transform="translate(110 98) scale(1.5) rotate(-35)" fill="${col}" stroke="none">${PLANE}</g></g>`,
    /* octagon entry stamp */
    () => `<g filter="url(#${u}f)" fill="none" stroke="${col}"><path d="M78 30H142L190 78V142L142 190H78L30 142V78Z" stroke-width="3"/><path d="M82 40H138L180 82V138L138 180H82L40 138V82Z" stroke-width="1"/>
      <g ${F}>${T(110, 66, "ENTRY 入境", 13)}<text x="110" y="112" font-size="${fs}" ${ZH} letter-spacing="3">${esc(nm)}</text>${T(110, 138, dt, 13)}${T(110, 162, `No.${no} · ${cc}`, 9)}</g><path d="M62 122H158" stroke-width="1"/></g>`,
    /* triangle departure-style stamp */
    () => `<g filter="url(#${u}f)" fill="none" stroke="${col}"><path d="M110 22L200 184H20Z" stroke-width="3" stroke-linejoin="round"/><path d="M110 40L184 174H36Z" stroke-width="1" stroke-linejoin="round"/>
      <g ${F}>${T(110, 92, "✦ 入境 ✦", 12)}<text x="110" y="130" font-size="${fsFor(nm, 24)}" ${ZH} letter-spacing="2">${esc(nm)}</text>${T(110, 152, dt, 11)}${T(110, 168, esc(en), 8)}</g></g>`,
    /* the Chinese seal, now in a random passport ink */
    () => { const chars = (n.length >= 4 ? n.slice(0, 4) : n.length === 3 ? n + "印" : n + "之印").split(""), pos = [[140, 88], [140, 152], [80, 88], [80, 152]];
      return `<g filter="url(#${u}f)"><rect x="40" y="40" width="140" height="140" rx="10" fill="${col}"/><rect x="48" y="48" width="124" height="124" rx="6" fill="none" stroke="#f4ecda" stroke-width="2.4"/><path d="M110 52V168M52 110H168" stroke="#f4ecda" stroke-width=".8" opacity=".35"/>
        <g fill="#f4ecda" font-family="Ma Shan Zheng, STKaiti, Noto Serif SC, serif" font-size="52" text-anchor="middle">${chars.map((c, i) => `<text x="${pos[i][0]}" y="${pos[i][1] + 18}">${esc(c)}</text>`).join("")}</g></g>
        <text x="110" y="206" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-weight="600" font-size="12" letter-spacing="3" fill="${col}" opacity=".8">${dt}</text>`; }
  ];
  return `<svg viewBox="0 0 220 220" class="stamp-svg seal-svg entry-svg" aria-label="${esc(n)}入境章">${defs(u, h, 1.4)}${V[h % V.length]()}</svg>`;
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
  const o = { u, h, col, nm, en: shortEn(city), dt: fdate(date), kind, region: regionOf(city), regionEn: REGION_EN[regionOf(city)] || "TRAVEL", country: countryOf(city) };
  const pm = postmark({ ...o, col: "#2b2118", u: u + "m" }).replace('<g filter', `<g opacity=".62" transform="translate(96 -34) scale(.62) rotate(-14 110 110)"><g filter`) + "</g>";
  return `<svg viewBox="0 0 220 220" class="stamp-svg post-svg" aria-label="${esc(nm)}邮票">${defs(u, h)}${defs(u + "m", h)}${postage(o)}${pm}</svg>`;
}
