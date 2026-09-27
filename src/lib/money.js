/* Money: every amount is stored in the trip's base currency (MYR). Each person sees it in their home currency.
   The local currency is sensed from the city (CN → CNY, TH → THB …). Rates are defaults you can correct in 预算设置. */
export const CURS = {
  MYR: { sym: "RM", name: "马币", toMYR: 1 }, CNY: { sym: "¥", name: "人民币", toMYR: .6 }, SGD: { sym: "S$", name: "新币", toMYR: 3.3 }, THB: { sym: "฿", name: "泰铢", toMYR: .13 },
  KRW: { sym: "₩", name: "韩元", toMYR: .0032 }, JPY: { sym: "¥", name: "日元", toMYR: .029 }, VND: { sym: "₫", name: "越南盾", toMYR: .00018 }, TWD: { sym: "NT$", name: "新台币", toMYR: .14 },
  NZD: { sym: "NZ$", name: "纽币", toMYR: 2.6 }, HKD: { sym: "HK$", name: "港币", toMYR: .56 }, USD: { sym: "$", name: "美元", toMYR: 4.4 }, IDR: { sym: "Rp", name: "印尼盾", toMYR: .00028 }
};
export const LOCAL_BY_CC = { CN: "CNY", MY: "MYR", SG: "SGD", TH: "THB", KR: "KRW", JP: "JPY", VN: "VND", TW: "TWD", NZ: "NZD", HK: "HKD", MO: "HKD", ID: "IDR" };
export const BASE = "MYR";
const custom = () => { try { return JSON.parse(localStorage.getItem("td-rates") || "{}"); } catch (e) { return {}; } };
export function setRate(cur, toMYR) { const c = custom(); c[cur] = toMYR; localStorage.setItem("td-rates", JSON.stringify(c)); }
/* rate: 1 unit of cur = ? MYR (cfg.cny_rate keeps the old CNY field working) */
export function rateToBase(cur, cfg) { if (cur === BASE) return 1; if (cur === "CNY" && cfg && cfg.cny_rate > 0) return +cfg.cny_rate; const c = custom(); if (c[cur] > 0) return +c[cur]; return (CURS[cur] || CURS.MYR).toMYR; }
export const toBase = (v, cur, cfg) => v * rateToBase(cur, cfg);
export const fromBase = (b, cur, cfg) => b / rateToBase(cur, cfg);
export const sym = cur => (CURS[cur] || { sym: cur }).sym;
export const homeCur = cfg => (cfg && CURS[cfg.currency] ? cfg.currency : BASE);
/* format a base amount in the person's home currency */
export function fmt(base, cfg) { const h = homeCur(cfg), v = fromBase(base, h, cfg), big = ["KRW", "JPY", "VND", "IDR"].includes(h); return (v < 0 ? "-" : "") + sym(h) + " " + Math.abs(v).toLocaleString("en-MY", { maximumFractionDigits: big ? 0 : 0 }); }
export function fmtIn(v, cur) { const big = ["KRW", "JPY", "VND", "IDR"].includes(cur); return sym(cur) + " " + (+v).toLocaleString("en-MY", { maximumFractionDigits: big ? 0 : 2 }); }
