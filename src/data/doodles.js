/* Hand-drawn doodle kit (our own): wobbly ink outline + offset riso fill. viewBox 0 0 100 100.
   Used by the poster stamps, journal stickers and the travel collection sheet. */
const I = {
  ferry: [["M14 62h72l-9 14H23z", "a"], ["M28 46h42v16H28z", "w"], ["M24 41h50v6H24z", "b"], ["M34 51h6v6h-6zM46 51h6v6h-6zM58 51h6v6h-6z", "c"], ["M54 41V30h8v11", "a"], ["L:M6 86q7-6 14 0t14 0t14 0t14 0t14 0t14 0"]],
  tram: [["M28 26h44v48H28z", "c"], ["M33 32h34v16H33z", "w"], ["M28 56h44", "L"], ["M50 26V12M40 12h20", "L"], ["M38 80a4 4 0 1 0 .1 0M62 80a4 4 0 1 0 .1 0", "ink"], ["M36 62h8v6h-8zM56 62h8v6h-8z", "w"]],
  taxi: [["M14 60q2-14 14-16l9-12h26l9 12q14 2 16 16v10H14z", "c"], ["M40 36h9v10H36zM53 36h9l4 10H53z", "w"], ["M30 76a7 7 0 1 0 .1 0M70 76a7 7 0 1 0 .1 0", "ink"], ["M44 26h12v6H44z", "a"]],
  temple: [["M10 42q40-26 80 0l-6 5Q50 30 16 47z", "a"], ["M24 47h52v28H24z", "w"], ["M44 56h12v19H44z", "a"], ["M18 75h64v7H18z", "b"], ["M50 22v-8", "L"], ["M30 54h8v8h-8zM62 54h8v8h-8z", "c"]],
  pagoda: [["M30 30q20-12 40 0l-4 4H34z", "a"], ["M36 34h28v10H36z", "w"], ["M24 48q26-12 52 0l-4 4H28z", "a"], ["M32 52h36v12H32z", "w"], ["M18 68q32-12 64 0l-4 4H22z", "a"], ["M28 72h44v10H28z", "w"], ["M50 30V14", "L"]],
  lighthouse: [["M40 82l4-52h12l4 52z", "w"], ["M42 58h16l1 12H41zM44 36h12l.6 8H43.4z", "a"], ["M42 22h16v8H42z", "c"], ["M46 14h8l4 8H42z", "a"], ["L:M22 26l14 4M78 26l-14 4M20 36l16-2M80 36l-16-2"]],
  bridge: [["M6 70h88v6H6z", "b"], ["L:M8 70q42-44 84 0M26 70V52M38 70V43M50 70V40M62 70V43M74 70V52"], ["L:M4 86q8-5 16 0t16 0t16 0t16 0t16 0t16 0"]],
  mountain: [["M4 82l30-48 14 20 14-18 34 46z", "b"], ["M34 34l-8 13 6-3 5 5 4-5zM62 36l-7 9 5-2 4 4 4-4z", "w"], ["M70 20a8 8 0 1 0 .1 0", "c"]],
  wave: [["M4 58q11-14 23 0t23 0t23 0t23 0v28H4z", "b"], ["L:M4 72q11-10 23 0t23 0t23 0t23 0"], ["M74 22a9 9 0 1 0 .1 0", "c"]],
  sun: [["M50 32a18 18 0 1 0 .1 0", "c"], ["L:M50 8v12M50 80v12M8 50h12M80 50h12M20 20l9 9M71 71l9 9M80 20l-9 9M29 71l-9 9"], ["L:M43 50q2 3 4 0M53 50q2 3 4 0M44 58q6 5 12 0"]],
  palm: [["L:M52 88q-6-30 2-56"], ["M54 32q-20-10-36 2q18-2 36-2zM54 32q18-12 34 0q-18-2-34 0zM54 32q-6-18-24-22q12 10 24 22zM54 32q6-18 22-22q-10 10-22 22z", "b"], ["M44 88h24", "L"], ["M48 38a4 4 0 1 0 .1 0M58 38a4 4 0 1 0 .1 0", "c"]],
  flower: [["M50 22a10 10 0 1 0 .1 0M30 38a10 10 0 1 0 .1 0M70 38a10 10 0 1 0 .1 0M38 58a10 10 0 1 0 .1 0M62 58a10 10 0 1 0 .1 0", "a"], ["M50 44a9 9 0 1 0 .1 0", "c"], ["L:M50 60v30M50 76q-10-6-16-2M50 80q10-6 16-2"]],
  noodles: [["M12 50h76q-4 30-38 30T12 50z", "w"], ["M12 50h76v5H12z", "a"], ["L:M26 50q4-14 8 0t8 0t8 0t8 0t8 0M36 80h28"], ["L:M60 44L86 14M66 46L92 20"], ["M30 40a4 4 0 1 0 .1 0M66 38a5 5 0 1 0 .1 0", "c"]],
  bowl: [["M14 48h72q-4 30-36 30T14 48z", "b"], ["M22 48q28-14 56 0z", "c"], ["L:M40 36q-4-8 0-14M52 34q-4-8 0-14M64 36q-4-8 0-14"], ["M36 80h28", "L"]],
  drink: [["M32 30h36l-5 52H37z", "c"], ["M30 24h40v7H30z", "w"], ["L:M56 24L66 6"], ["M44 60a3 3 0 1 0 .1 0M52 66a3 3 0 1 0 .1 0M46 72a3 3 0 1 0 .1 0M55 56a3 3 0 1 0 .1 0", "ink"], ["M36 40h28l-1 8H37z", "a"]],
  coffee: [["M24 38h44v32q0 12-22 12T24 70z", "w"], ["M68 46q14 0 12 12t-12 8", "L"], ["M24 38h44v8H24z", "a"], ["L:M36 30q-4-8 2-14M48 30q-4-8 2-14"], ["M18 84h64", "L"]],
  fish: [["M18 50q24-26 54 0q-30 26-54 0z", "b"], ["M72 50l16-12v24z", "a"], ["M30 46a3 3 0 1 0 .1 0", "ink"], ["L:M44 42q6 8 0 16M54 42q6 8 0 16"]],
  lantern: [["M50 24q26 2 26 26T50 76q-26-2-26-26t26-26z", "a"], ["M40 20h20v6H40zM40 74h20v6H40z", "c"], ["L:M50 10v10M50 80v12M44 92h12M40 30q-6 20 0 40M60 30q6 20 0 40"]],
  qilou: [["M14 30h72v52H14z", "w"], ["M14 22h72v8H14z", "a"], ["M20 60q6-10 12 0v22H20zM44 60q6-10 12 0v22H44zM68 60q6-10 12 0v22H68z", "b"], ["M22 38h10v10H22zM45 38h10v10H45zM68 38h10v10H68z", "c"]],
  tower: [["M30 88V30l6-14 6 14v58zM58 88V30l6-14 6 14v58z", "w"], ["M42 50h16v6H42z", "a"], ["L:M30 40h12M30 52h12M30 64h12M30 76h12M58 40h12M58 52h12M58 64h12M58 76h12M36 16V6M64 16V6"], ["M18 88h64", "L"]],
  camera: [["M14 34h72v44H14z", "a"], ["M34 26h18l4 8H30z", "w"], ["M50 44a14 14 0 1 0 .1 0", "w"], ["M50 50a8 8 0 1 0 .1 0", "b"], ["M72 40h8v5h-8z", "c"]],
  plane: [["M10 56l30-6 20-30h8l-8 30 26-4 6-10h6l-4 16 4 16h-6l-6-10-26-4 8 30h-8L40 70l-30-6z", "w"], ["M40 50l20-30h8l-8 30z", "a"]],
  piano: [["M12 40h76v38H12z", "w"], ["L:M22 40v38M32 40v38M42 40v38M52 40v38M62 40v38M72 40v38M82 40v38"], ["M19 40h6v22h-6zM29 40h6v22h-6zM49 40h6v22h-6zM59 40h6v22h-6zM69 40h6v22h-6z", "ink"], ["M12 30h76v10H12z", "a"]],
  market: [["M12 30h76l-6 16H18z", "a"], ["M24 30l-3 16M38 30l-2 16M52 30v16M66 30l2 16", "L"], ["M20 46h60v34H20z", "w"], ["M26 58h14v10H26zM46 58h14v10H46z", "c"], ["M66 58a7 7 0 1 0 .1 0", "b"]],
  boat: [["M16 64h68l-10 14H26z", "b"], ["M50 20v44L24 60z", "w"], ["M52 24v36l22-4z", "a"], ["L:M4 86q8-5 16 0t16 0t16 0t16 0t16 0t16 0"]],
  heart: [["M50 82Q14 58 16 36q2-16 16-16 12 0 18 12 6-12 18-12 14 0 16 16 2 22-34 46z", "a"]],
  star: [["M50 12l10 26 28 2-22 17 8 27-24-15-24 15 8-27-22-17 28-2z", "c"]],
  cat: [["M30 88q-4-30 10-40q-10-10-6-26l10 8q6-2 12 0l10-8q4 16-6 26q14 10 10 40z", "w"], ["M42 34a2.4 2.4 0 1 0 .1 0M58 34a2.4 2.4 0 1 0 .1 0", "ink"], ["L:M48 40l2 2 2-2M70 84q18-4 14-24"], ["M44 58h12v4H44z", "c"]],
  bird: [["M20 56q10-22 34-18l22-10-8 16q10 22-20 28-20 2-28-16z", "b"], ["M68 44l10 2-8 4z", "c"], ["M58 44a2.4 2.4 0 1 0 .1 0", "ink"], ["L:M40 74l-4 12M50 74l2 12"]],
  fruit: [["M50 30q30 0 30 26t-30 26q-30 0-30-26t30-26z", "c"], ["M50 30q2-12 12-16q0 12-12 16z", "b"], ["L:M40 48q-4 8 0 16"]],
  shell: [["M50 80L16 40q34-26 68 0z", "w"], ["L:M50 80L30 32M50 80L50 26M50 80L70 32M50 80L22 42M50 80L78 42"], ["M42 78h16v8H42z", "a"]],
  umbrella: [["M10 50q40-40 80 0q-10-6-20 0q-10-8-20 0q-10-8-20 0q-10-6-20 0z", "a"], ["L:M50 50v30q0 8-8 6"], ["M48 14h4v6h-4z", "c"]],
  bike: [["L:M28 70a14 14 0 1 0 .1 0M74 70a14 14 0 1 0 .1 0M28 70l14-26h24l8 26M42 44l12 26h20M38 38h10M64 36h8"], ["M50 66a4 4 0 1 0 .1 0", "a"]],
  ticket: [["M14 30h72v14a6 6 0 0 0 0 12v14H14V56a6 6 0 0 0 0-12z", "c"], ["L:M62 30v40"], ["M24 42h28v4H24zM24 52h20v4H24z", "a"]],
  tea: [["M22 44h50q0 32-25 32T22 44z", "w"], ["M72 50q12 0 10 10t-12 6", "L"], ["M34 40q4-10 26 0", "b"], ["L:M40 32q-4-8 2-14M52 32q-4-8 2-14M16 84h66"]],
  boots: [["M24 20h22v40l20 8q12 4 12 14H24z", "a"], ["M24 76h54v6H24z", "ink"], ["L:M30 30h10M30 40h10M30 50h10"]]
};
export const DOODLES = Object.keys(I);
const PAL = [["#e8453c", "#2f5fb8", "#f3c43a"], ["#2f8f6a", "#f07a9a", "#f3d45a"], ["#1f4f9a", "#ff8a3d", "#9fd0f0"], ["#e85a8a", "#3a9ad8", "#fbe06a"], ["#6a4ad8", "#f0a02a", "#8fd8b8"], ["#d8543a", "#4a8a5a", "#f2d27a"]];
let uid = 0;
export function doodle(name, o = {}) {
  const parts = I[name] || I.star, p = o.pal || PAL[(o.seed ?? name.length) % PAL.length], ink = o.ink || "#1f2440", id = "dw" + (++uid);
  const col = k => k === "a" ? p[0] : k === "b" ? p[1] : k === "c" ? p[2] : k === "w" ? "#fbf8f0" : k === "ink" ? ink : "none";
  if (o.sketch) { const acc = o.accent || "#5b8def"; const pathsF = parts.filter(x => !x[0].startsWith("L:") && x[1] !== "L").map(([d, k], i) => `<path d="${d}" fill="none" stroke="${k === "a" || k === "c" ? acc : ink}" stroke-width="${k === "a" || k === "c" ? 2.2 : 1.8}" stroke-dasharray="${k === "a" || k === "c" ? "3 4" : "none"}" opacity="${k === "a" || k === "c" ? .9 : 1}"/>`).join("");
    const linesS = parts.map(([d, k]) => d.startsWith("L:") ? `<path d="${d.slice(2)}"/>` : k === "L" ? `<path d="${d}"/>` : "").join("");
    return `<svg viewBox="0 0 100 100" class="doodle sketch" aria-hidden="true"><defs><filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".04" numOctaves="2" seed="${(o.seed || 1) % 50}"/><feDisplacementMap in="SourceGraphic" scale="1.8"/></filter></defs><g filter="url(#${id})" fill="none" stroke-linecap="round" stroke-linejoin="round">${pathsF}<g stroke="${ink}" stroke-width="1.8">${linesS}</g></g></svg>`; }
  const fills = parts.filter(x => !x[0].startsWith("L:") && x[1] !== "L").map(([d, k]) => `<path d="${d}" fill="${col(k)}"/>`).join("");
  const lines = parts.map(([d, k]) => d.startsWith("L:") ? `<path d="${d.slice(2)}"/>` : k === "L" ? `<path d="${d}"/>` : k === "ink" ? "" : `<path d="${d}"/>`).join("");
  return `<svg viewBox="0 0 100 100" class="doodle" aria-hidden="true"><defs><filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="${(o.seed || 1) % 50}"/><feDisplacementMap in="SourceGraphic" scale="${o.wobble ?? 2.6}"/></filter></defs>
    <g filter="url(#${id})"><g transform="translate(2.4 2.6)" opacity=".92">${fills}</g><g fill="none" stroke="${ink}" stroke-width="${o.sw || 2.4}" stroke-linecap="round" stroke-linejoin="round">${lines}</g></g></svg>`;
}
/* pick a doodle for a place or a dish by its name */
export function doodleFor(name = "", kind = "") {
  const n = name; const asia = typeof doodleForAsia === "function" ? doodleForAsia(n, kind) : null; if (asia) return asia;
  if (kind === "food" || /面|粉|饭|汤|粥|锅|包|饼|糕|粿|冻|饺|卤|烤|炒|虾|蟹|蚵|鱼丸|肉/.test(n) && kind !== "place") {
    if (/面|粉/.test(n)) return "noodles"; if (/茶/.test(n)) return "tea"; if (/咖啡|kopi/i.test(n)) return "coffee"; if (/饮|汁|冰|奶|水|椰|酒/.test(n)) return "drink"; if (/鱼|虾|蟹|蚵|海鲜/.test(n)) return "fish"; if (/果|榴莲|芒|莓|橙|柚/.test(n)) return "fruit"; return "bowl"; }
  if (/灯塔/.test(n)) return "lighthouse"; if (/双子|塔楼|KLCC|大厦|Tower/i.test(n)) return "tower"; if (/塔/.test(n)) return "pagoda"; if (/寺|庙|宫|观|祠|殿|教堂/.test(n)) return "temple";
  if (/桥/.test(n)) return "bridge"; if (/钢琴|琴/.test(n)) return "piano"; if (/山|岩|峰|岭|洞/.test(n)) return "mountain"; if (/沙滩|海|湾|岛|滨|港/.test(n)) return "wave";
  if (/渡|轮|码头|船|江|河|湖/.test(n)) return "ferry"; if (/市场|夜市|集|墟/.test(n)) return "market"; if (/街|路|巷|坊|骑楼|老城/.test(n)) return "qilou"; if (/园|花|植物/.test(n)) return "flower";
  if (/馆|博物|美术/.test(n)) return "camera"; if (/机场|航/.test(n)) return "plane"; if (/车站|电车|轻轨|地铁/.test(n)) return "tram"; if (/猫/.test(n)) return "cat"; if (/鸟/.test(n)) return "bird";
  return ["star", "heart", "sun", "palm", "umbrella", "boat"][(n.length * 7 + (n.charCodeAt(0) || 0)) % 6];
}
export { PAL as DOODLE_PALS };
Object.assign(I, {
  cake: [["M22 52h56v30H22z", "w"], ["M22 52q7 10 14 0t14 0t14 0t14 0v-6H22z", "a"], ["M48 26h4v20h-4z", "b"], ["M50 14q6 6 0 12q-6-6 0-12z", "c"], ["M30 66h40", "L"]],
  skewer: [["L:M14 86L86 14"], ["M26 60l14 14-10 10-14-14zM42 44l14 14-10 10-14-14zM58 28l14 14-10 10-14-14z", "a"], ["M34 70l4 4M50 54l4 4M66 38l4 4", "L"]],
  hotpot: [["M12 48h76q-4 32-38 32T12 48z", "w"], ["M16 48q34-10 68 0q-34 10-68 0z", "a"], ["M50 44q10 4 0 8q-10 4 0 8", "L"], ["L:M8 48h-4M92 48h4M36 36q-4-8 2-14M52 34q-4-8 2-14M68 36q-4-8 2-14"]],
  mochi: [["M20 50h60v26H20z", "w"], ["M24 50q26-26 52 0z", "w"], ["L:M28 56l8 16M44 56l8 16M60 56l8 16"], ["M16 78h68v6H16z", "b"]],
  jianbing: [["M14 70q36-50 72 0z", "c"], ["M24 66q26-32 52 0z", "a"], ["L:M34 60l4-8M46 56l2-8M58 56l2-8M68 60l4-6"], ["M20 70h60v10H20z", "w"]]
});
DOODLES.push("cake", "skewer", "hotpot", "mochi", "jianbing");
/* more of Asia, so any stamp anywhere gets a fitting doodle */
Object.assign(I, {
  torii: [["M14 30q36-10 72 0l-2 7q-34-8-68 0z", "a"], ["M22 44h56v6H22z", "a"], ["M28 37h8v49h-8zM64 37h8v49h-8z", "a"], ["M46 44h8v6h-8z", "w"]],
  mosque: [["M30 50q0-22 20-26q20 4 20 26z", "b"], ["M24 50h52v34H24z", "w"], ["M44 64q6-8 12 0v20H44z", "a"], ["L:M50 24v-10M14 84V40M86 84V40M12 40h4M84 40h4"], ["M47 12a3 3 0 1 0 .1 0", "c"]],
  stupa: [["M26 84q0-30 24-38q24 8 24 38z", "c"], ["M44 46h12v-6H44z", "a"], ["M46 40l4-26 4 26z", "c"], ["M18 84h64v6H18z", "b"]],
  volcano: [["M6 84l28-44h32l28 44z", "b"], ["M34 40q16 8 32 0l-4-6H38z", "w"], ["L:M44 30q-4-10 2-18M56 30q4-10-2-18"], ["M40 22a5 5 0 1 0 .1 0", "c"]],
  sakura: [["M50 30q8-16 14 0q16-4 8 12q12 10-4 16q0 18-18 6q-18 12-18-6q-16-6-4-16q-8-16 8-12q6-16 14 0z", "a"], ["M50 44a6 6 0 1 0 .1 0", "c"]],
  tuktuk: [["M18 36h46l14 24v14H18z", "c"], ["M22 42h20v14H22z", "w"], ["M46 42h12l8 14H46z", "w"], ["M30 78a7 7 0 1 0 .1 0M70 78a7 7 0 1 0 .1 0", "ink"], ["M14 30h54v7H14z", "a"]],
  rice: [["M4 84q24-10 46-2t46-4v10H4z", "b"], ["M4 70q24-10 46-2t46-4v8q-22 4-46 2t-46 6z", "c"], ["L:M20 60v-10M30 58v-12M40 60v-10M60 56v-10M70 58v-12M80 56v-10"], ["M72 22a9 9 0 1 0 .1 0", "a"]],
  junk: [["M16 64h68l-10 14H26z", "b"], ["M40 20q16 18 0 40H34q6-20 6-40z", "a"], ["M58 26q14 16 0 34H52q4-16 6-34z", "a"], ["L:M40 26h-6M40 34h-7M40 42h-7M40 50h-7M58 32h-5M58 40h-6M58 48h-6"], ["L:M4 86q8-5 16 0t16 0t16 0t16 0t16 0t16 0"]]
});
DOODLES.push("torii", "mosque", "stupa", "volcano", "sakura", "tuktuk", "rice", "junk");
const _df = doodleFor;
export function doodleForAsia(name = "", kind = "") {
  const n = name;
  if (kind !== "food") {
    if (/神社|鸟居|shrine|torii|jinja/i.test(n)) return "torii";
    if (/清真寺|masjid|mosque/i.test(n)) return "mosque";
    if (/佛塔|舍利|pagoda|stupa|wat |wat$|chedi|borobudur/i.test(n)) return "stupa";
    if (/火山|富士|volcano|bromo|fuji/i.test(n)) return "volcano";
    if (/樱|sakura|cherry blossom/i.test(n)) return "sakura";
    if (/梯田|稻田|rice terrace|paddy/i.test(n)) return "rice";
    if (/帆船|维港|junk|harbour|harbor/i.test(n)) return "junk";
    if (/tuk ?tuk|嘟嘟车/i.test(n)) return "tuktuk";
    if (/temple|pagoda/i.test(n)) return "temple"; if (/beach|bay|island|sea|pantai|pulau|coast/i.test(n)) return "wave"; if (/mountain|hill|peak|bukit|gunung|doi |san$/i.test(n)) return "mountain";
    if (/market|pasar|bazaar|night market/i.test(n)) return "market"; if (/bridge|jambatan/i.test(n)) return "bridge"; if (/street|road|lane|jalan|alley|old town/i.test(n)) return "qilou"; if (/garden|park|flower|taman/i.test(n)) return "flower"; if (/museum|gallery/i.test(n)) return "camera"; if (/tower|menara|skytree/i.test(n)) return "tower"; if (/lighthouse/i.test(n)) return "lighthouse"; if (/lake|river|tasik|sungai/i.test(n)) return "boat";
  } else {
    if (/noodle|ramen|mee|mi |pho|laksa|udon|soba/i.test(n)) return "noodles"; if (/tea|teh|matcha/i.test(n)) return "tea"; if (/coffee|kopi|kaffe/i.test(n)) return "coffee"; if (/juice|ice|drink|soda|boba|cendol/i.test(n)) return "drink"; if (/fish|prawn|crab|seafood|sushi/i.test(n)) return "fish";
  }
  return null;
}
