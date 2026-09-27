/* Import a trip from the Excel template (行程 / 预付 / 旅行 sheets). */
import * as XLSX from "xlsx";
import { GUIDES } from "../data/guides.js";
const KIND = { "景点": "sight", "美食": "food", "交通": "transit", "住宿": "lodging", "航班": "flight", "其他": "sight", "体验": "sight" };
const CAT = { "住宿": "Lodging", "机票": "Flight", "门票": "Tickets", "交通": "Transport", "保险": "Other", "其他": "Other", "餐饮": "Food" };
const cityId = n => { n = String(n || "").trim(); const g = GUIDES.find(g => g.id === n || g.name === n || (g.en && g.en.toLowerCase() === n.toLowerCase())); return g ? g.id : null; };
const cityName = n => { const id = cityId(n); const g = id && GUIDES.find(g => g.id === id); return g ? g.name : String(n || "").trim(); };
const dateStr = v => { if (v instanceof Date) return v.toISOString().slice(0, 10); const s = String(v || "").trim().replace(/[./]/g, "-"); const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); return m ? `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}` : ""; };
const timeStr = v => { if (v instanceof Date) return v.toTimeString().slice(0, 5); if (typeof v === "number") { const m = Math.round(v * 24 * 60); return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; } const s = String(v || "").trim(); const m = s.match(/^(\d{1,2})[:：.](\d{2})/); return m ? `${m[1].padStart(2, "0")}:${m[2]}` : ""; };
const yes = v => /^(是|y|yes|true|1|✓)$/i.test(String(v || "").trim());
function rows(wb, name) { const ws = wb.Sheets[name] || wb.Sheets[wb.SheetNames.find(n => n.includes(name)) || ""]; if (!ws) return []; return XLSX.utils.sheet_to_json(ws, { defval: "", raw: true, cellDates: true }); }
const col = (r, ...keys) => { for (const k of keys) { const kk = Object.keys(r).find(x => x.replace(/\s|\*/g, "") === k); if (kk !== undefined && r[kk] !== "") return r[kk]; } return ""; };
export async function parseTripXlsx(file) {
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
  const t = rows(wb, "旅行")[0] || {}, acts = [], prepaid = [];
  const trip = { name: String(col(t, "名称", "旅行名称") || file.name.replace(/\.xlsx?$/i, "")), start: dateStr(col(t, "开始日期", "开始")), end: dateStr(col(t, "结束日期", "结束")), budget: +col(t, "每人预算", "预算") || 3000, currency: String(col(t, "币种") || "MYR"), rate: +col(t, "人民币汇率", "汇率") || .6,
    cities: String(col(t, "城市") || "").split(/[,，、\s]+/).map(cityId).filter(Boolean) };
  rows(wb, "行程").forEach(r => { const date = dateStr(col(r, "日期")), title = String(col(r, "地点", "名称", "标题")).trim(); if (!date || !title) return;
    const spots = String(col(r, "候补", "候补地点") || "").split(/[,，、]/).map(x => x.trim()).filter(Boolean);
    acts.push({ date, time: timeStr(col(r, "时间")) || "09:00", title, city: cityName(col(r, "城市")) || cityName(trip.cities[0]), kind: KIND[String(col(r, "类型")).trim()] || "sight", dur: +col(r, "时长", "时长分钟") || 60, note: String(col(r, "备注") || "").trim() || null, spots, is_main: yes(col(r, "主要", "主要行程")), source: "xlsx" }); });
  rows(wb, "预付").forEach(r => { const name = String(col(r, "名称", "项目")).trim(), amount = +col(r, "金额"); if (!name || !(amount > 0)) return;
    prepaid.push({ note: name, amount, currency: String(col(r, "币种") || trip.currency).toUpperCase().replace("RM", "MYR").replace("¥", "CNY"), category: CAT[String(col(r, "类别")).trim()] || "Other", split_n: +col(r, "分几个人", "人数") || null, paid_from: /公费|池/.test(String(col(r, "付款方式", "谁付"))) ? "pool" : "me", date: dateStr(col(r, "日期")) || trip.start }); });
  if (!trip.start && acts.length) { const ds = acts.map(a => a.date).sort(); trip.start = ds[0]; trip.end = ds[ds.length - 1]; }
  if (!trip.end) trip.end = trip.start;
  return { trip, acts, prepaid };
}
/* push parsed rows into a trip that already exists (the current one) */
export async function importInto(api, data, { withTrip = false } = {}) {
  const rate = (api.membership && api.membership.cny_rate) || data.trip.rate || .6;
  let n = 0;
  for (const a of data.acts) { try { await api.addActivity(a); n++; } catch (e) {} }
  for (const p of data.prepaid) { try { await api.addExpense({ date: p.date, amount: p.amount, currency: p.currency, amount_base: Math.round((p.currency === "CNY" ? p.amount * rate : p.amount) * 100) / 100, category: p.category, note: p.note, prepaid: true, split: 1, shared: true, paid_from: p.paid_from, split_n: p.split_n, payer_id: api.me.id }); n++; } catch (e) {} }
  return n;
}
