/* 账本: shared spending is split evenly between the people who took part; personal spending (shopping…) is yours only.
   Budget is per person. Prepaid (flights, hotels) comes off the budget first, the rest is spread over the days. */
import { ic } from "../lib/icons.js";
import { shrinkImage, dataUrlToBlob } from "../lib/util.js";
import { cityOf } from "./trip.js";
import { CURS, LOCAL_BY_CC, BASE, rateToBase, toBase, fromBase, sym, homeCur, fmt, fmtIn, setRate } from "../lib/money.js";
import { guideFor } from "../data/guides.js";
import { t as T } from "../lib/i18n.js";
import { api, on, nameOf } from "../lib/api.js";
import { $, esc, today, shortDate, weekday } from "../lib/util.js";
import { openSheet, closeSheet, toast, bind, askConfirm, askText } from "../lib/ui.js";
import { sfx } from "../lib/sound.js";
import { tripDays } from "./trip.js";
import { HOTEL_COSTS } from "../data/fujian.js";
import { cashHTML } from "../data/notes.js";

export const CATS = [["Lodging", "住宿", ic("bed")], ["Flight", "机票", ic("airplane-tilt")], ["Food", "餐饮", ic("bowl-food")], ["Transport", "交通", ic("taxi")], ["Activities", "门票", ic("ticket")], ["Experience", "特色体验", ic("sparkle")], ["Shopping", "购物", ic("shopping-bag")], ["Coffee", "咖啡茶饮", ic("coffee")], ["Other", "其他", ic("plus")], ["Pool", "公费", ic("wallet")]];
const catOf = k => CATS.find(c => c[0] === k) || CATS[CATS.length - 1];
export let exps = [];
export async function loadBudget() { if (!api.trip) { exps = []; return render(); } try { exps = await api.expenses(); } catch (e) {} render(); }
on("expenses", loadBudget); on("budget", () => render());
const cfg = () => api.membership || { total_budget: 3000, budget_mode: "strict", currency: "MYR", cny_rate: .6 };
export const money = n => fmt(n, cfg());
const localCurOf = date => { const g = guideFor(cityOf(date)); return LOCAL_BY_CC[(g && g.w && g.w.cc) || (g && g.cc)] || BASE; };
const group = () => api.trip && api.trip.kind !== "solo" && api.members.length > 1;
const partsOf = e => (e.participants && e.participants.length ? e.participants : api.members.map(m => m.id));
/* how much of an expense is mine */
export const payerOf = e => e.payer_id || e.user_id;
export const myShare = e => { if (isPool(e)) return 0; if (e.split_n > 0 && e.shared !== false) return +e.amount_base / e.split_n; if (e.shared === false) return e.user_id === api.me.id ? +e.amount_base : 0; const p = partsOf(e); return p.includes(api.me.id) ? +e.amount_base / p.length : 0; };
const isPool = e => e.category === "Pool";
export const spend = () => exps.filter(e => !isPool(e));
const daily = () => spend().filter(e => !e.prepaid);
const prepaid = () => spend().filter(e => e.prepaid);
const prepaidMine = () => prepaid().reduce((s, e) => s + myShare(e), 0);
const spentOn = d => daily().filter(e => e.date === d).reduce((s, e) => s + myShare(e), 0);
const base = () => { const n = tripDays().length || 1; return Math.max(0, cfg().total_budget - prepaidMine()) / n; };
function available(d) { const b = base(); if (cfg().budget_mode === "strict") return b; const days = tripDays(), i = days.indexOf(d); if (i <= 0) return b; let a = b; for (let k = 0; k < i; k++) a += b - spentOn(days[k]); return a; }
/* the three layers: pool contributions, shared spending (paid by me or from the pool), personal spending */
export function pool() { const put = {}, paidIn = exps.filter(isPool); api.members.forEach(m => put[m.id] = 0); paidIn.forEach(e => put[payerOf(e)] = (put[payerOf(e)] || 0) + +e.amount_base);
  const inTotal = Object.values(put).reduce((q, v) => q + v, 0), out = spend().filter(e => e.shared !== false && e.paid_from === "pool").reduce((q, e) => q + +e.amount_base, 0); return { put, inTotal, out, left: inTotal - out }; }
export function myBill() { const sh = spend().filter(e => e.shared !== false).reduce((q, e) => q + myShare(e), 0), pv = spend().filter(e => e.shared === false && payerOf(e) === api.me.id).reduce((q, e) => q + +e.amount_base, 0); return { shared: sh, personal: pv, total: sh + pv }; }
/* who owes whom: everyone's (pool money + shared they paid themselves) minus their share of all shared spending */
export function settlement() {
  const bal = {}; api.members.forEach(m => bal[m.id] = 0); const P = pool();
  Object.entries(P.put).forEach(([id, v]) => bal[id] = (bal[id] || 0) + v);
  spend().filter(e => e.shared !== false).forEach(e => { const p = partsOf(e), n = e.split_n > 0 ? e.split_n : p.length, sh = +e.amount_base / n; if (e.paid_from !== "pool") bal[payerOf(e)] = (bal[payerOf(e)] || 0) + +e.amount_base; p.forEach(id => bal[id] = (bal[id] || 0) - sh); });
  const cr = Object.entries(bal).filter(([, v]) => v > .5).sort((a, b) => b[1] - a[1]).map(x => [...x]), db = Object.entries(bal).filter(([, v]) => v < -.5).sort((a, b) => a[1] - b[1]).map(x => [...x]);
  const out = []; let i = 0, j = 0;
  while (i < db.length && j < cr.length) { const x = Math.min(-db[i][1], cr[j][1]); out.push({ from: db[i][0], to: cr[j][0], amount: x }); db[i][1] += x; cr[j][1] -= x; if (db[i][1] > -.5) i++; if (cr[j][1] < .5) j++; }
  const refunds = cr.slice(j).filter(([, v]) => v > .5).map(([id, v]) => ({ to: id, amount: v }));
  return { bal, out, refunds, pool: P };
}
export const budgetSummary = () => { const mine = spend().reduce((s, e) => s + myShare(e), 0), cats = CATS.map(([k, n, i]) => ({ k, n, i, v: spend().filter(e => e.category === k).reduce((s, e) => s + myShare(e), 0) })).filter(c => c.v > 0); return { mine, cats, budget: cfg().total_budget, groupTotal: exps.filter(e => e.shared !== false).reduce((s, e) => s + +e.amount_base, 0), settle: settlement(), exps }; };

export function render() {
  const root = $("budgetRoot"); if (!root || !api.trip) return;
  const days = tripDays(), d = days.includes(today()) ? today() : days[0], c = cfg(), G = group();
  const av = available(d), sp = spentOn(d), rem = av - sp, mine = spend().reduce((s, e) => s + myShare(e), 0), bill = myBill(), P = pool();
  const pct = av > 0 ? Math.min(1, sp / av) : 1, R = 52, C = 2 * Math.PI * R;
  const cat = CATS.filter(x => x[0] !== "Pool").map(([k, n, i]) => ({ k, n, i, v: spend().filter(e => e.category === k).reduce((s, e) => s + myShare(e), 0) }));
  const max = Math.max(1, ...cat.map(x => x.v));
  const byDate = {}; daily().forEach(e => (byDate[e.date] = byDate[e.date] || []).push(e));
  const st = settlement();
  const tag = e => e.shared === false ? `<em class="xt personal">个人</em>` : G ? `<em class="xt">共同 · ${partsOf(e).length} 人平分</em>` : "";
  root.innerHTML = `<div class="tp-top"><div><small>${esc(api.trip.name)} · ${G ? `共同开销大家都看得到，个人开销只有你看得到` : "只有你看得到"}</small><h2>账本</h2></div><button class="icon-btn" data-act="cfg" aria-label="预算设置">⚙︎</button></div>
    <div class="bg-hero kraft">
      <svg class="ring" viewBox="0 0 120 120"><circle cx="60" cy="60" r="${R}" class="bg"/><circle cx="60" cy="60" r="${R}" class="fg${rem < 0 ? " over" : ""}" style="stroke-dasharray:${C};stroke-dashoffset:${C * (1 - pct)}"/></svg>
      <div class="bg-num"><small>${d === today() ? "今天" : "Day 1"} · ${shortDate(d)} 你还可以花</small><b>${money(rem)}</b><span>今日可用 ${money(av)} · 你已花 ${money(sp)}</span></div>
    </div>
    <div class="seg" style="margin:12px 18px 0"><button class="${c.budget_mode === "strict" ? "on" : ""}" data-mode="strict">严格：每天重置</button><button class="${c.budget_mode === "flexible" ? "on" : ""}" data-mode="flexible">弹性：省下的留到明天</button></div>
    <div class="bg-total"><div><small>${G ? "每人预算" : "整趟预算"}</small><b>${money(c.total_budget)}</b></div><div><small>你的花费</small><b>${money(mine)}</b></div><div><small>剩下</small><b class="${mine > c.total_budget ? "over" : ""}">${money(c.total_budget - mine)}</b></div></div>
    <div class="bar"><i class="pre" style="width:${Math.min(100, prepaidMine() / c.total_budget * 100)}%"></i><i style="width:${Math.min(100, (mine - prepaidMine()) / c.total_budget * 100)}%"></i></div>
    <p class="col-note">每日可用 = （预算 − 你的预付 ${money(prepaidMine())}）÷ ${days.length} 天 = ${money(base())}</p>
    ${true ? `<div class="sk-sec-h">POOL <b>公费池</b></div><div class="pool"><div class="pool-top"><div><small>${T("池子里还剩", "Left in the pool")}</small><b>${money(P.left)}</b></div><div><small>${T("大家投入", "Put in")}</small><b>${money(P.inTotal)}</b></div><div><small>${T("从池子付了", "Paid from pool")}</small><b>${money(P.out)}</b></div></div>
      <div class="pool-ppl">${api.members.map(m => `<span>${esc(m.name)} <i>${money(P.put[m.id] || 0)}</i></span>`).join("")}</div>${exps.filter(e => e.category === "Pool").length ? `<div class="pool-log">${exps.filter(e => e.category === "Pool").map(e => `<div class="bg-row"><span><b>${esc(nameOf(payerOf(e)))} 投入</b><small>${e.date.slice(5).replace("-", ".")}${e.note ? " · " + esc(e.note) : ""}</small></span><em>${money(+e.amount_base)}</em><button class="ed" data-edit="${e.id}">改</button><button class="rowhit" data-edit="${e.id}" aria-label="改"></button></div>`).join("")}</div>` : ""}
      <button class="btn sm" data-act="poolin">${ic("plus")} ${T("我投入公费", "Put money in")}</button>${G ? "" : `<p class="as-hint">${T("现在是单人旅行。邀请旅伴进房间后，大家投的钱都会记在这里。", "Solo trip for now. Invite buddies and everyone shows up here.")}</p>`}</div>
    <div class="sk-sec-h">MY BILL <b>我的账单</b></div><div class="bill"><div><small>${T("共同 · 我的份额", "Shared · my part")}</small><b>${money(bill.shared)}</b></div><span>+</span><div><small>${T("私人", "Personal")}</small><b>${money(bill.personal)}</b></div><span>=</span><div class="tot"><small>${T("一共", "Total")}</small><b>${money(bill.total)}</b></div></div>
    <div class="sk-sec-h">SETTLE UP <b>结算</b></div><div class="settle">${st.out.length || st.refunds.length ? st.out.map(t => `<div class="st-row"><b>${esc(nameOf(t.from))}</b><span>→</span><b>${esc(nameOf(t.to))}</b><em>${money(t.amount)}</em></div>`).join("") + st.refunds.map(r => `<div class="st-row"><b>${T("公费池", "Pool")}</b><span>→</span><b>${esc(nameOf(r.to))}</b><em>${money(r.amount)}</em></div>`).join("") : `<p class="as-hint">${T("现在谁也不欠谁。", "Nobody owes anybody right now.")}</p>`}
      <div class="st-bal">${api.members.map(m => { const v = st.bal[m.id] || 0; return `<span>${esc(m.name)} <i class="${v >= 0 ? "pos" : "neg"}">${v >= 0 ? "+" : ""}${Math.round(v)}</i></span>`; }).join("")}</div><small class="as-hint">${T("正数 = 投入公费和垫付的比应分的多，要收回；负数 = 要补上。零头算在这里，不用现场除。", "Positive = paid more than your share, gets it back; negative = pays.")}</small></div>` : ""}
    <div class="sk-sec-h">PREPAID <b>预付 · 机票住宿</b></div>
    <div class="bg-pre">${prepaid().map(e => `<div class="bg-row"><button class="rowhit" data-edit="${e.id}" aria-label="改"></button><span class="ci">${catOf(e.category)[2]}</span><span><b>${esc(e.note || "")}</b><small>${fmtIn(e.amount, e.currency || BASE)} ${e.paid_from === "pool" ? " · 公费支付" : e.user_id === api.me.id ? " · 你垫付" : ` · ${esc(nameOf(e.user_id))}垫付`} · 你的份额 ${money(myShare(e))} ${tag(e)}</small></span><button class="x" data-del="${e.id}" aria-label="删除">×</button></div>`).join("")}
      ${api.trip.template === "fujian" && !prepaid().some(e => e.category === "Lodging") ? `<div class="bg-import"><p>行程表里有 3 笔住宿费用：</p>${HOTEL_COSTS.map(hc => `<div class="bg-imp-row"><span>${esc(hc.name)}<small>${hc.nights}</small></span><b>${hc.amount}</b></div>`).join("")}<button class="btn ink full" data-act="import">导入住宿费用</button></div>` : ""}
      <button class="btn full" data-act="addPre">＋ 加一笔预付（机票、酒店、保险…）</button></div>
    <div class="sk-sec-h">DAYS <b>每天</b></div>
    <div class="bg-days">${days.map((x, i) => { const s = spentOn(x), a = available(x); return `<div class="bg-day${x === d ? " on" : ""}${s > a ? " over" : ""}"><small>D${i + 1} ${shortDate(x)}</small><b>${Math.round(s)}</b><i style="height:${Math.min(100, a > 0 ? s / a * 100 : 0)}%"></i></div>`; }).join("")}</div>
    <div class="sk-sec-h">OVERVIEW <b>花钱的样子</b></div>
    <div class="viz">${(() => { const tot = cat.reduce((q, c) => q + c.v, 0) || 1, cols = ["#2f3a2e", "#b3341e", "#7c5b3a", "#8a917f", "#b89a5a", "#5c6a58", "#c8b89a", "#d8c7a8", "#e6d7a8"]; let acc = 0; const R = 42, C = 2 * Math.PI * R;
      const arcs = cat.filter(c => c.v > 0).map((c, i) => { const f = c.v / tot, o = acc; acc += f; return `<circle r="${R}" cx="60" cy="60" fill="none" stroke="${cols[i % cols.length]}" stroke-width="14" stroke-dasharray="${(f * C).toFixed(2)} ${C.toFixed(2)}" stroke-dashoffset="${(-o * C).toFixed(2)}" transform="rotate(-90 60 60)"/>`; }).join("");
      const maxD = Math.max(1, ...days.map(x => spentOn(x)), av);
      const bars = days.map((x, i) => { const sp = spentOn(x), h = sp / maxD * 60, over = sp > available(x); return `<g transform="translate(${i * (200 / days.length)} 0)"><rect x="2" y="${(64 - h).toFixed(1)}" width="${(200 / days.length - 4).toFixed(1)}" height="${h.toFixed(1)}" fill="${over ? "#b3341e" : x === d ? "#2f3a2e" : "#c8c1b0"}"/><text x="${(100 / days.length).toFixed(1)}" y="74" text-anchor="middle" font-size="6.5" fill="#8a917f">${i + 1}</text></g>`; }).join("");
      return `<div class="viz-donut"><svg viewBox="0 0 120 120"><circle r="${R}" cx="60" cy="60" fill="none" stroke="#e6e0d2" stroke-width="14"/>${arcs}<text x="60" y="57" text-anchor="middle" font-size="9" fill="#8a917f" letter-spacing="1">花了</text><text x="60" y="72" text-anchor="middle" font-family="Special Elite,monospace" font-size="12" fill="#2f3a2e">${money(mine).replace(/^[^\d-]+\s?/, "")}</text></svg><div class="viz-leg">${cat.filter(c => c.v > 0).slice(0, 5).map((c, i) => `<span><i style="background:${cols[i % cols.length]}"></i>${c.n} <b>${Math.round(c.v / tot * 100)}%</b></span>`).join("") || `<span class="as-hint">${T("还没花钱", "Nothing yet")}</span>`}</div></div>
      <div class="viz-days"><small>${T("每天花了多少 · 红色是超过当天可用", "Per day · red = over the day's budget")}</small><svg viewBox="0 0 200 78">${bars}<line x1="0" x2="200" y1="${(64 - av / maxD * 60).toFixed(1)}" y2="${(64 - av / maxD * 60).toFixed(1)}" stroke="#b3341e" stroke-width=".6" stroke-dasharray="2 2"/></svg></div>`; })()}</div>
    <div class="sk-sec-h">CATEGORIES <b>你的钱花在哪里</b></div>
    <div class="bg-cats">${cat.map(x => `<div class="bg-cat"><span>${x.i} ${x.n}</span><i><em style="width:${x.v / max * 100}%"></em></i><b>${Math.round(x.v)}</b></div>`).join("")}</div>
    <div class="sk-sec-h">HISTORY <b>记录</b></div>
    <div class="bg-list">${Object.keys(byDate).sort().reverse().map(dd => `<div class="log-day">${shortDate(dd)} ${weekday(dd)} · 你 ${money(spentOn(dd))}</div>${byDate[dd].map(e => `<div class="bg-row"><span class="ci">${catOf(e.category)[2]}</span><span class="bg-main"><b>${esc(e.note || catOf(e.category)[1])}</b>${e.currency && e.currency !== homeCur(cfg()) ? `<small>${fmtIn(e.amount, e.currency)} → ${money(+e.amount_base)}</small>` : ""}${G && e.shared !== false ? `<small>${esc(nameOf(e.payer_id || e.user_id))} 付的 · 你的份额 ${money(myShare(e))}</small>` : ""}${tag(e) ? `<small>${tag(e)}</small>` : ""}</span><em class="bg-amt">${money(+e.amount_base)}</em><button class="ed" data-edit="${e.id}">改</button><button class="x" data-del="${e.id}" aria-label="删除">×</button><button class="rowhit" data-edit="${e.id}" aria-label="改"></button></div>`).join("")}`).join("") || `<p class="log-empty">还没有记账。花了钱就点下面的按钮。</p>`}</div>
    <button class="fab" data-act="add" aria-label="记一笔">＋ 记一笔</button>`;
  splitTabs(root);
  const pb = root.querySelector("[data-act=poolin]"); if (pb) pb.onclick = () => openAdd({ category: "Pool" });
  root.querySelectorAll("[data-mode]").forEach(b => b.onclick = async () => { sfx.tap(); try { await api.updateBudget({ budget_mode: b.dataset.mode }); } catch (e) { toast("没能保存"); } render(); });
  root.querySelectorAll("[data-edit]").forEach(b => b.onclick = () => { const e = exps.find(x => x.id === b.dataset.edit); if (e) openAdd({ edit: e }); });
  root.querySelectorAll("[data-del]").forEach(b => b.onclick = async () => { if (!await askConfirm("删除这一笔？")) return; try { await api.deleteExpense(b.dataset.del); } catch (e) { toast("没能删除"); } });
  bind(root, { add: () => openAdd({ date: d }), cfg: openCfg, addPre: () => openAdd({ date: d, pre: true }), import: openImport });
}
/* 今天 / 结算 / 全部: the ledger is long, so it is shown one part at a time */
let bTab = (() => { try { return sessionStorage.getItem("td-btab") || "today"; } catch (e) { return "today"; } })();
function splitTabs(root) {
  let cur = "today";
  for (const el of [...root.children]) {
    if (el.classList.contains("tp-top") || el.classList.contains("fab")) continue;
    if (el.classList.contains("sk-sec-h")) { const k = el.textContent; cur = /POOL|MY BILL|SETTLE/.test(k) ? "settle" : /PREPAID|OVERVIEW|CATEGORIES/.test(k) ? "all" : "today"; }
    el.dataset.bt = cur;
  }
  const bar = document.createElement("div"); bar.className = "bg-tabs"; bar.setAttribute("role", "tablist");
  bar.innerHTML = [["today", T("今天", "Today")], ["settle", T("结算", "Settle")], ["all", T("全部", "Overview")]].map(([k, n]) => `<button role="tab" data-bt-k="${k}" aria-selected="${k === bTab}">${n}</button>`).join("");
  const top = root.querySelector(".tp-top"); top ? top.after(bar) : root.prepend(bar);
  const set = k => { bTab = k; try { sessionStorage.setItem("td-btab", k); } catch (e) {} root.dataset.tab = k; bar.querySelectorAll("button").forEach(b => b.setAttribute("aria-selected", b.dataset.btK === k)); };
  bar.querySelectorAll("button").forEach(b => b.onclick = () => { sfx.tap(); set(b.dataset.btK); root.scrollIntoView({ block: "start" }); });
  set(bTab);
}
/* opts: { date, pre, category, note, amount, shared, onSaved } */
export function openAdd(opts = {}) {
  const days = tripDays(), c = cfg(), G = group();
  const E = opts.edit || null; if (E) { opts.pre = !!E.prepaid; opts.category = E.category; opts.note = E.note || ""; opts.date = E.date; opts.shared = E.shared !== false; }
  const curOpts = [...new Set([localCurOf(opts.date || (E && E.date) || days[0]), homeCur(c), BASE])];
  let cur = E ? (E.currency || BASE) : opts.pre ? homeCur(c) : curOpts[0], catK = opts.category || (opts.pre ? "Flight" : "Food"), shared = opts.shared != null ? opts.shared : (G && !["Shopping"].includes(catK)), parts = E && E.participants ? E.participants : api.members.map(m => m.id);
  const isPoolIn = catK === "Pool"; let paidFrom = E ? (E.paid_from || "me") : opts.pre ? "pool" : "me", photo = null, payer = E ? (E.payer_id || E.user_id) : api.me.id;
  const sh = openSheet(`<div class="as"><small class="as-k">${opts.pre ? "PREPAID" : isPoolIn ? "POOL" : "NEW EXPENSE"}</small><h3>${E ? "改这一笔" : opts.pre ? "加一笔预付" : isPoolIn ? T("投入公费池", "Put money in the pool") : "记一笔"}</h3>
    ${isPoolIn ? `<p class="as-hint">${T("投进池子的钱不算你的花费，结算时会算回来。", "Money in the pool isn't spending; it comes back at settle-up.")}</p>` : ""}
    ${G && !isPoolIn ? `<div class="seg" id="exShare"><button class="${shared ? "on" : ""}" data-sh="1">共同 · 平分</button><button class="${!shared ? "on" : ""}" data-sh="0">个人（只有我）</button></div>
      <div id="exParts" ${shared ? "" : "hidden"}><div class="lbl">谁一起分</div><div class="chips-wrap">${api.members.map(m => `<button class="chip sm on" data-p="${m.id}" style="--c:#5f8a80">${esc(m.name)}</button>`).join("")}</div></div>` : ""}
    <div class="amt"><div class="seg" id="exCur">${curOpts.map(k => `<button class="${cur === k ? "on" : ""}" data-cur="${k}">${sym(k)} ${CURS[k].name}</button>`).join("")}</div><input class="inp big" id="exAmt" inputmode="decimal" placeholder="0" value="${opts.amount || ""}" autofocus><small id="exConv"></small></div>
    <div id="exCash"></div>
    ${isPoolIn ? "" : `<div class="chips-wrap">${CATS.filter(x => x[0] !== "Pool").map(([k, n, i]) => `<button class="chip sm${k === catK ? " on" : ""}" data-cat="${k}" style="--c:#3a2c1f">${i} ${n}</button>`).join("")}</div>`}
    ${G && api.members.length > 1 ? `<label class="lbl">${isPoolIn ? T("谁投的", "Who put it in") : T("谁付的钱", "Who paid")}<select class="inp" id="exPayer">${api.members.map(m => `<option value="${m.id}"${m.id === payer ? " selected" : ""}>${esc(m.name)}${m.id === api.me.id ? T("（我）", " (me)") : ""}</option>`).join("")}</select></label>` : ""}
    ${opts.pre || (G && shared) ? `<label class="lbl">${T("分给几个人（留空 = 房间里所有人）", "Split among how many (blank = everyone)")}<input class="inp" id="exSplitN" type="number" inputmode="numeric" min="1" placeholder="${api.members.length}" value="${E && E.split_n ? E.split_n : ""}"></label>` : ""}
    ${!isPoolIn ? `<div class="seg" id="exPaid"><button class="${paidFrom === "me" ? "on" : ""}" data-pf="me">${T("我垫付", "I paid")}</button><button class="${paidFrom === "pool" ? "on" : ""}" data-pf="pool">${T("从公费池付", "Paid from pool")}</button></div>` : ""}
    ${!isPoolIn && !opts.pre ? `<label class="ex-photo" id="exPhoto"><input type="file" accept="image/*" hidden><span>${ic("camera")} ${T("拍一张（大家在美食票里都能看到）", "Add a photo (everyone sees it on the food ticket)")}</span></label>` : ""}
    <div class="addrow"${opts.pre ? " hidden" : ""}><select class="inp" id="exDate">${days.map((x, i) => `<option value="${x}"${x === (opts.date || days[0]) ? " selected" : ""}>Day ${i + 1} · ${shortDate(x)}</option>`).join("")}</select><input class="inp" id="exNote" maxlength="30" placeholder="备注，比如：沙茶面" value="${esc(opts.note || "")}"></div>
    ${opts.pre ? `<input class="inp" id="exNote2" maxlength="30" placeholder="备注，比如：PEN → 厦门 机票" style="margin-top:10px">` : ""}
    <div class="as-btns">${E ? `<button class="btn" data-act="delete" style="color:var(--seal);border-color:var(--seal)">删除这一笔</button>` : ""}<button class="btn" data-act="cancel">${E ? "不改了" : "先不记"}</button><button class="btn ink" data-act="save" style="flex:1.6">${E ? "保存" : "记下"}</button></div></div>`, { accent: "#3a2c1f" });
  if (E) { $("exAmt").value = E.amount; if ($("exNote2")) $("exNote2").value = E.note || ""; }
  const val = () => parseFloat($("exAmt").value) || 0;
  const conv = () => { const v = val(), b = toBase(v, cur, c), n = shared ? parts.length : 1; $("exConv").textContent = (cur !== homeCur(c) ? `≈ ${fmt(b, c)}（1 ${cur} = ${rateToBase(cur, c)} MYR）` : "") + (G && shared && n > 1 ? `　每人 ${fmt(b / n, c)}` : ""); $("exCash").innerHTML = cashHTML(v, cur); };
  sh.querySelectorAll("[data-cur]").forEach(b => b.onclick = () => { cur = b.dataset.cur; sh.querySelectorAll("[data-cur]").forEach(x => x.classList.toggle("on", x === b)); conv(); });
  sh.querySelectorAll("[data-cat]").forEach(b => b.onclick = () => { catK = b.dataset.cat; sh.querySelectorAll("[data-cat]").forEach(x => x.classList.toggle("on", x === b)); if (G && catK === "Shopping" && shared) { shared = false; syncShare(); toast("购物默认记成个人开销"); } });
  const syncShare = () => { sh.querySelectorAll("[data-sh]").forEach(x => x.classList.toggle("on", (x.dataset.sh === "1") === shared)); const p = $("exParts"); if (p) p.hidden = !shared; conv(); };
  sh.querySelectorAll("[data-sh]").forEach(b => b.onclick = () => { shared = b.dataset.sh === "1"; syncShare(); });
  sh.querySelectorAll("[data-p]").forEach(b => b.onclick = () => { const id = b.dataset.p; parts = parts.includes(id) ? parts.filter(x => x !== id) : [...parts, id]; if (!parts.length) parts = [api.me.id]; sh.querySelectorAll("[data-p]").forEach(x => x.classList.toggle("on", parts.includes(x.dataset.p))); conv(); });
  const py = $("exPayer"); if (py) py.onchange = () => { payer = py.value; };
  sh.querySelectorAll("[data-pf]").forEach(b => b.onclick = () => { paidFrom = b.dataset.pf; sh.querySelectorAll("[data-pf]").forEach(x => x.classList.toggle("on", x === b)); });
  const ph = $("exPhoto"); if (ph) { ph.querySelector("input").onchange = async e => { const f = e.target.files && e.target.files[0]; if (!f) return; photo = await shrinkImage(f, api.mode === "local" ? 600 : 1280, .8); ph.querySelector("span").innerHTML = `<img src="${photo}" alt=""> ${T("已选好，记下时一起存", "Ready — saved with the expense")}`; }; }
  $("exAmt").oninput = conv; conv();
  bind(sh, { cancel: () => closeSheet(), delete: async () => { if (!await askConfirm("删除这一笔？")) return; try { await api.deleteExpense(E.id); closeSheet(); opts.onSaved && opts.onSaved(); } catch (e) { toast("没能删：" + e.message); } }, save: async () => { const v = val(); if (!(v > 0)) return toast("写上金额"); const b = toBase(v, cur, c);
    const note = (($("exNote2") || {}).value || $("exNote").value || "").trim() || (opts.pre ? catOf(catK)[1] : null);
    try { const rec = { date: opts.pre ? (E ? E.date : days[0]) : $("exDate").value, amount: v, currency: cur, amount_base: Math.round(b * 100) / 100, category: catK, note, prepaid: !!opts.pre, split: 1, shared: isPoolIn ? true : (G ? shared : true), participants: G && shared && parts.length !== api.members.length ? parts : null, paid_from: !isPoolIn && shared !== false ? paidFrom : "me", payer_id: payer, split_n: $("exSplitN") && +$("exSplitN").value > 0 ? +$("exSplitN").value : null };
      if (E) await api.updateExpense(E.id, rec); else await api.addExpense(rec);
      if (photo) { try { const path = api.mode === "local" ? photo : await api.uploadShared(dataUrlToBlob(photo)); await api.addFoodPhoto({ food: note || catOf(catK)[1], city: cityOf($("exDate").value), date: $("exDate").value, photo_path: path }); } catch (e) {} }
      sfx.clink(1); setTimeout(() => sfx.clink(.6), 120); closeSheet(); opts.onSaved && opts.onSaved(); } catch (e) { toast("没能保存：" + e.message); } } });
}
function openCfg() {
  const c = cfg();
  const sh = openSheet(`<div class="as"><small class="as-k">BUDGET</small><h3>预算设置</h3>
    <label class="lbl">我看账用的货币（home currency）<select class="inp" id="bgH">${Object.entries(CURS).map(([k, v]) => `<option value="${k}"${k === homeCur(c) ? " selected" : ""}>${v.sym} ${v.name} ${k}</option>`).join("")}</select></label>
    <label class="lbl">${group() ? "每人预算" : "整趟预算"}（${sym(homeCur(c))}）<input class="inp" id="bgT" inputmode="decimal" value="${Math.round(fromBase(c.total_budget, homeCur(c), c))}"></label>
    <label class="lbl">当地货币 ${localCurOf(today())} 的汇率（1 ${localCurOf(today())} = ? MYR，按实际改）<input class="inp" id="bgR" inputmode="decimal" value="${rateToBase(localCurOf(today()), c)}"></label>
    <p class="as-hint">所有账在后台统一按马币记，每个人用自己的货币看。旅伴从新加坡来就选新币，账本整页会变成 S$。</p>
    <p class="as-hint">每日基础预算 = （预算 − 你的预付）÷ ${tripDays().length} 天</p>
    <div class="as-btns"><button class="btn ink full" data-act="save">保存</button></div></div>`, { accent: "#3a2c1f" });
  $("bgH").onchange = () => { const h = $("bgH").value; $("bgT").value = Math.round(fromBase(c.total_budget, h, { ...c, currency: h })); sh.querySelector("label.lbl:nth-of-type(2)") && (sh.querySelectorAll("label.lbl")[1].firstChild.textContent = `${group() ? "每人预算" : "整趟预算"}（${sym(h)}）`); };
  bind(sh, { save: async () => { const h = $("bgH").value, t = parseFloat($("bgT").value), r = parseFloat($("bgR").value), L = localCurOf(today()); if (!(t > 0) || !(r > 0)) return toast("请输入正确的数字"); try { const patch = { total_budget: Math.round(toBase(t, h, { ...c, currency: h }) * 100) / 100, currency: h }; if (L === "CNY") patch.cny_rate = r; else setRate(L, r); await api.updateBudget(patch); closeSheet(); render(); } catch (e) { toast("没能保存"); } } });
}
function openImport() {
  const c = cfg(); let cur = "CNY";
  const sh = openSheet(`<div class="as"><small class="as-k">IMPORT</small><h3>导入住宿费用</h3>
    <p class="as-hint" style="margin-top:0">行程表里的价格没有写货币，看起来像人民币房价；如果其实是马币就切换一下。${group() ? "会记成共同开销，大家平分。" : ""}</p>
    <div class="seg"><button class="on" data-cur="CNY">¥ 人民币</button><button data-cur="MYR">RM 马币</button></div>
    <div id="imPrev" class="bg-import" style="margin-top:10px"></div>
    <div class="as-btns"><button class="btn ink full" data-act="go">导入</button></div></div>`, { accent: "#3a2c1f" });
  const n = group() ? api.members.length : 1;
  const prev = () => { $("imPrev").innerHTML = HOTEL_COSTS.map(h => { const b = cur === "CNY" ? h.amount * c.cny_rate : h.amount; return `<div class="bg-imp-row"><span>${esc(h.name)}<small>${cur === "CNY" ? "¥" : "RM "}${h.amount}${n > 1 ? ` · 每人 RM ${(b / n).toFixed(0)}` : ""}</small></span><b>RM ${b.toFixed(0)}</b></div>`; }).join(""); };
  sh.querySelectorAll("[data-cur]").forEach(b => b.onclick = () => { cur = b.dataset.cur; sh.querySelectorAll("[data-cur]").forEach(x => x.classList.toggle("on", x === b)); prev(); });
  prev();
  bind(sh, { go: async () => { const d0 = tripDays()[0]; try { for (const h of HOTEL_COSTS) await api.addExpense({ date: d0, amount: h.amount, currency: cur, amount_base: Math.round((cur === "CNY" ? h.amount * c.cny_rate : h.amount) * 100) / 100, category: "Lodging", note: h.name, prepaid: true, split: 1, shared: true, paid_from: "pool" }); sfx.clink(1); closeSheet(); toast("住宿费用已导入（记为公费支付），每日预算已经重新计算"); } catch (e) { toast("没能导入：" + e.message); } } });
}
