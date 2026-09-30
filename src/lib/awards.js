/* 旅伴奖项 (MVP): worked out from what everyone did on the trip — shown on the last day and on the receipt. */
import { api, nameOf } from "./api.js";
import { t as T } from "./i18n.js";
const hourOf = ts => { const d = new Date(ts); return d.getHours() + d.getMinutes() / 60; };
export async function tripAwards() {
  if (!api.trip) return [];
  let cks = [], logs = [], exps = [], mine = [], buddy = [], shared = [];
  try { [cks, logs, exps, mine, buddy, shared] = await Promise.all([api.checkins(), api.log(), api.expenses(), api.wallet(), api.buddyWallet(), api.sharedPhotos()]); } catch (e) {}
  const ids = api.members.map(m => m.id), solo = ids.length < 2;
  const count = (rows, key = r => r.user_id) => { const m = {}; rows.forEach(r => { const k = key(r); if (k) m[k] = (m[k] || 0) + 1; }); return m; };
  const top = m => { const e = Object.entries(m).filter(([k]) => ids.includes(k)).sort((a, b) => b[1] - a[1]); return e.length && e[0][1] > 0 ? { id: e[0][0], n: e[0][1] } : null; };
  const ok = cks.filter(c => c.status !== "rejected");
  const foods = [...mine.filter(w => w.trip_id === api.trip.id).map(w => ({ ...w, user_id: api.me.id })), ...buddy];
  const paid = {}; exps.filter(e => e.category !== "Pool" && e.paid_from !== "pool").forEach(e => { const k = e.payer_id || e.user_id; paid[k] = (paid[k] || 0) + (+e.amount_base || +e.amount || 0); });
  const early = {}, late = {}; ok.forEach(c => { const h = hourOf(c.created_at); if (h >= 4 && h < 9) early[c.user_id] = (early[c.user_id] || 0) + 1; if (h >= 21 || h < 3) late[c.user_id] = (late[c.user_id] || 0) + 1; });
  const A = [];
  const add = (icon, title, w, why) => { if (w) A.push({ icon, title, who: w.id, name: nameOf(w.id), why: why(w.n) }); };
  add("🏅", T("打卡王", "Check-in champ"), top(count(ok)), n => T(`${n} 次打卡`, `${n} check-ins`));
  add("🍜", T("吃货王", "Chief taster"), top(count(foods)), n => T(`撕了 ${n} 张美食票`, `${n} food tickets`));
  add("📷", T("御用摄影师", "Official photographer"), top(count(shared)), n => T(`分享了 ${n} 张照片`, `${n} photos shared`));
  add("🃏", T("技能狂人", "Skill maniac"), top(count(logs.filter(l => l.action === "ACTIVATED"))), n => T(`发动 ${n} 次技能`, `${n} skills used`));
  add("🎲", T("骰子之神", "Dice god"), top(count(logs.filter(l => l.action === "DICE" || l.action === "PLAY"))), n => T(`掷了 ${n} 次`, `${n} rolls`));
  const pw = Object.entries(paid).filter(([k]) => ids.includes(k)).sort((a, b) => b[1] - a[1])[0];
  if (pw && !solo) A.push({ icon: "💰", title: T("金主爸爸", "The sponsor"), who: pw[0], name: nameOf(pw[0]), why: T("先垫钱最多的人", "Paid up front the most") });
  add("🌅", T("早起鸟", "Early bird"), top(early), n => T(`${n} 次 9 点前打卡`, `${n} check-ins before 9am`));
  add("🌙", T("夜猫子", "Night owl"), top(late), n => T(`${n} 次晚上 9 点后打卡`, `${n} check-ins after 9pm`));
  add("✦", T("护章使者", "Stamp guardian"), top(count(logs.filter(l => l.action === "LIGHT"))), n => T(`点亮 ${n} 枚灰章`, `Relit ${n} grey stamps`));
  if (solo) return A.filter(a => a.who === api.me.id).map(a => ({ ...a, title: a.title }));
  /* everyone gets at least one: give the rest a warm one */
  const WARM = [["🧭", T("最佳领路人", "Best navigator"), T("大家跟着走就对了", "Everyone just followed")], ["😂", T("气氛担当", "Mood maker"), T("有 TA 在就不会冷场", "Never a dull moment")], ["🫶", T("最佳旅伴", "Best buddy"), T("下次还要一起出发", "Travel again soon")]];
  ids.filter(id => !A.some(a => a.who === id)).forEach((id, i) => { const w = WARM[i % WARM.length]; A.push({ icon: w[0], title: w[1], who: id, name: nameOf(id), why: w[2] }); });
  return A;
}
