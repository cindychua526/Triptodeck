/* 每日小报 · THE TRIP DAILY: one newspaper page per day, written from what actually happened —
   check-ins, food tickets, dice & skills, what people wrote, money, tomorrow's plan. Save / share as an image. */
import { api, nameOf } from "../lib/api.js";
import { esc, shortDate, weekday, today, addDays, hash } from "../lib/util.js";
import { toast } from "../lib/ui.js";
import { sfx, mus } from "../lib/sound.js";
import { t as T } from "../lib/i18n.js";
import { tripDays, dayActs, cityOf } from "./trip.js";
import { myStamps, stampFor } from "./collection.js";
import { foodArt } from "../data/foodart.js";
import { CARD } from "../data/skills.js";
import { tripAwards } from "../lib/awards.js";

const wxOf = d => { try { return JSON.parse(localStorage.getItem(`td-wx:${api.trip.id}:${d}`) || "null"); } catch (e) { return null; } };
const wxIcon = t => /雷/.test(t) ? "⚡" : /雨/.test(t) ? "☂" : /雪/.test(t) ? "❄" : /阴|雾/.test(t) ? "☁" : /云/.test(t) ? "⛅" : "☀";
const dayOf = ts => { const d = new Date(ts); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const nm = s => String(s || "").replace(/（.*?）|\(.*?\)/g, "").trim();
const foodName = w => nm((w.spot_id || "").split(":").pop());

async function gather(d) {
  const G = { d };
  const safe = async (f, dflt) => { try { return (await f()) || dflt; } catch (e) { return dflt; } };
  const [cks, logs, mine, buddy, exps, lines, moments, shared, effects] = await Promise.all([
    safe(() => api.checkins(), []), safe(() => api.log(), []), safe(() => api.wallet(), []), safe(() => api.buddyWallet(), []), safe(() => api.expenses(), []),
    safe(() => api.dayLines(d), []), safe(() => api.momentsOn(d), []), safe(() => api.sharedPhotos(), []), safe(() => api.effects(), [])]);
  G.cks = cks.filter(c => (c.date || dayOf(c.created_at)) === d && c.status !== "rejected");
  G.stamps = myStamps().filter(s => s.date === d && (!s.trip_id || s.trip_id === api.trip.id));
  G.foods = [...mine.filter(w => w.trip_id === api.trip.id && w.date === d).map(w => ({ ...w, user_id: api.me.id })), ...buddy.filter(w => w.date === d)];
  G.logs = logs.filter(l => l.date === d);
  G.spent = exps.filter(e => e.date === d && e.category !== "Pool" && !e.prepaid).reduce((s, e) => s + (+e.amount_base || 0), 0);
  G.lines = lines.filter(l => l.text); G.moments = moments;
  G.photos = [...shared.filter(p => p.date === d).map(p => ({ ...p, src: "s" })), ...G.cks.filter(c => c.photo_path).map(c => ({ ...c, src: "c" }))];
  G.ooc = effects.filter(e => e.target_date === d);
  G.acts = dayActs(d); G.tomorrow = dayActs(addDays(d, 1)).filter(a => a.status !== "removed").slice(0, 3);
  G.city = cityOf(d); G.wx = wxOf(d);
  const days = tripDays(); G.no = days.indexOf(d) + 1; G.last = d === days[days.length - 1];
  if (G.last) G.awards = await safe(() => tripAwards(), []);
  return G;
}
function headline(G) {
  const who = n => n || T("有人", "someone");
  if (G.ooc.length) { const c = CARD[G.ooc[0].card]; return [T(`${c ? c.name : "技能"}失控！`, `${c ? c.en : "A skill"} goes rogue!`), T("旅伴们被迫执行了昨天没用掉的技能", "Yesterday's unused skill came back to bite")]; }
  const light = G.logs.find(l => l.action === "LIGHT"); if (light) return [T("灰章重获颜色", "Grey stamp regains its colour"), light.effect || ""];
  if (G.cks.length >= 4) return [T(`一天打卡 ${G.cks.length} 处，${G.city}被我们走遍了`, `${G.cks.length} check-ins in a day — ${G.city} conquered`), G.cks.slice(0, 3).map(c => nm(c.name)).join(" · ")];
  if (G.foods.length >= 3) return [T(`${G.city}美食战报：一天吃了 ${G.foods.length} 样`, `${G.city} food report: ${G.foods.length} dishes in one day`), G.foods.slice(0, 4).map(foodName).join(" · ")];
  const act = G.logs.find(l => l.action === "ACTIVATED"); if (act) { const c = CARD[act.card]; return [T(`${who(nameOf(act.user_id))}发动「${c ? c.name : act.card}」`, `${nameOf(act.user_id)} plays ${c ? c.en : act.card}`), act.effect || ""]; }
  const dice = G.logs.find(l => l.action === "DICE" || l.action === "PLAY"); if (dice) return [T("命运交给了骰子", "Fate left to the dice"), dice.effect || ""];
  if (G.cks.length) return [T(`今日${G.city}：${nm(G.cks[0].name)}`, `Today in ${G.city}: ${nm(G.cks[0].name)}`), G.cks.length > 1 ? T(`还有另外 ${G.cks.length - 1} 处`, `and ${G.cks.length - 1} more`) : ""];
  if (d0(G)) return [T("本报讯：今天风平浪静", "Quiet day on the road"), T("有时候什么都不做，也是旅行的一部分", "Doing nothing is part of the trip too")];
  return [T(`${G.city}的一天`, `A day in ${G.city}`), ""];
}
const d0 = G => !G.cks.length && !G.foods.length && !G.logs.length;

function html(G) {
  const [h1, h2] = headline(G), t = api.trip;
  const lead = G.photos[0], price = ["¥0.5", "RM1", "$0.50"][hash(G.d) % 3];
  const wx = G.wx ? `${wxIcon(G.wx.t)} ${esc(G.wx.t || "")}${G.wx.hi != null ? ` ${Math.round(G.wx.lo)}–${Math.round(G.wx.hi)}°` : ""}` : "";
  const col = (k, title, body) => body ? `<section class="np-c np-${k}"><h4>${title}</h4>${body}</section>` : "";
  const list = a => `<ul>${a.join("")}</ul>`;
  const stamps = G.stamps.slice(0, 3).map(s => `<i>${stampFor(s)}</i>`).join("");
  return `<div class="np" id="npPaper" data-noi18n>
    <div class="np-mast"><div class="np-ear"><small>${T("第", "No.")} ${G.no || "·"} ${T("期", "")}</small><small>${price}</small></div>
      <h2>${T("旅途小报", "The Trip Daily")}</h2><div class="np-sub"><span>${esc(t.name)}</span><span>${shortDate(G.d).replace(".", "月")}${T("日", "")} ${weekday(G.d)}</span><span>${esc(G.city || "")}</span>${wx ? `<span>${wx}</span>` : ""}</div></div>
    <article class="np-lead"><h1>${esc(h1)}</h1>${h2 ? `<p class="np-deck">${esc(h2)}</p>` : ""}
      ${lead ? `<figure class="np-ph"><i data-p="${esc(lead.photo_path)}" data-k="${lead.src}"></i><figcaption>${esc(lead.caption || lead.name || "")} · ${T("摄", "photo")} ${esc(nameOf(lead.user_id))}</figcaption></figure>` : ""}
      ${stamps ? `<div class="np-stamps">${stamps}</div>` : ""}</article>
    <div class="np-cols">
      ${col("ck", T("今日打卡", "Checked in"), G.cks.length ? list(G.cks.slice(0, 6).map(c => `<li><b>${esc(nm(c.name))}</b><span>${esc(nameOf(c.user_id))}</span></li>`)) : "")}
      ${col("food", T("吃了什么", "On the menu"), G.foods.length ? `<div class="np-foods">${G.foods.slice(0, 6).map(w => `<span>${foodArt(foodName(w))}<b>${esc(foodName(w))}</b></span>`).join("")}</div>` : "")}
      ${col("play", T("骰子与技能", "Dice & skills"), G.logs.filter(l => /ACTIVATED|DICE|PLAY|LIGHT/.test(l.action)).length ? list(G.logs.filter(l => /ACTIVATED|DICE|PLAY|LIGHT/.test(l.action)).slice(0, 5).map(l => `<li>${esc(l.effect || (CARD[l.card] || {}).name || "")}<span>${esc(nameOf(l.user_id))}</span></li>`)) : "")}
      ${col("quote", T("旅伴语录", "Quotes of the day"), G.lines.length ? G.lines.slice(0, 3).map(l => `<blockquote>「${esc(l.text)}」<cite>—— ${esc(nameOf(l.user_id))}${l.mood ? " " + esc(l.mood) : ""}</cite></blockquote>`).join("") : "")}
      ${col("mom", T("路边小记", "Roadside notes"), G.moments.length ? list(G.moments.slice(0, 4).map(m => `<li>${esc(m.note || "")}</li>`)) : "")}
      ${col("money", T("账本角", "Ledger corner"), G.spent ? `<p class="np-big">${Math.round(G.spent)}</p><small>${T("今天大家一共花了（基准币）", "Spent today (base currency)")}</small>` : "")}
      ${col("plan", G.last ? T("终刊语", "Final word") : T("明日预告", "Tomorrow"), G.last ? `<p>${T("旅行结束了，小报也停刊了。下一段旅程见。", "The trip is over and so is the paper. See you on the next one.")}</p>` : G.tomorrow.length ? list(G.tomorrow.map(a => `<li><b>${esc(a.time || "")}</b> ${esc(a.title)}</li>`)) : `<p>${T("明天还没安排，留给惊喜。", "Nothing planned — room for surprises.")}</p>`)}
    </div>
    ${G.awards && G.awards.length ? `<section class="np-mvp"><h4>${T("本次旅行 · 旅伴奖项", "Trip awards")}</h4><div>${G.awards.map(a => `<span><em>${a.icon}</em><b>${esc(a.title)}</b><i>${esc(a.name)}</i><small>${esc(a.why)}</small></span>`).join("")}</div></section>` : ""}
    <div class="np-foot">${T("本报由旅途牌组自动排版 · 所有新闻均为真实发生", "Typeset by The Trip Deck · every story actually happened")}</div></div>`;
}
export async function openPaper(d) {
  if (!api.trip) return;
  const days = tripDays(); d = d || (days.includes(today()) ? today() : days[days.length - 1] < today() ? days[days.length - 1] : days[0]);
  document.querySelector(".npo")?.remove();
  const ov = document.createElement("div"); ov.className = "npo"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", T("每日小报", "Daily paper"));
  ov.innerHTML = `<button class="sc-x" aria-label="${T("关闭", "Close")}">×</button><div class="npo-days">${days.map((x, i) => `<button data-d="${x}" class="${x === d ? "on" : ""}" ${x > today() ? "disabled" : ""}>D${i + 1}</button>`).join("")}</div><div class="npo-scroll"><p class="npo-load">${T("正在排版…", "Typesetting…")}</p></div>
    <div class="npo-btns"><button class="btn ink" id="npSave">${T("保存 / 分享", "Save / share")}</button></div>`;
  document.body.appendChild(ov); requestAnimationFrame(() => ov.classList.add("on")); sfx.paper();
  const close = () => { ov.classList.remove("on"); setTimeout(() => ov.remove(), 300); };
  ov.querySelector(".sc-x").onclick = close;
  const draw = async day => {
    d = day; ov.querySelectorAll(".npo-days button").forEach(b => b.classList.toggle("on", b.dataset.d === d));
    const G = await gather(d); if (!ov.isConnected) return;
    const sc = ov.querySelector(".npo-scroll"); sc.innerHTML = html(G);
    const ph = sc.querySelector("[data-p]"); if (ph) { const u = await (ph.dataset.k === "s" ? api.sharedUrl(ph.dataset.p) : api.photoUrl(ph.dataset.p)).catch(() => null); if (u) ph.style.backgroundImage = `url("${u}")`; }
    const p = sc.querySelector(".np"); p.animate([{ transform: "translateY(24px) rotate(-1.5deg)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 480, easing: "cubic-bezier(.2,1.2,.4,1)" }); mus.chime(3, .02);
    try { localStorage.setItem(`td-paper:${api.trip.id}:${d}`, "1"); } catch (e) {}
  };
  ov.querySelectorAll(".npo-days button").forEach(b => b.onclick = () => { sfx.tap(); draw(b.dataset.d); });
  ov.querySelector("#npSave").onclick = async () => {
    const el = ov.querySelector("#npPaper"); if (!el) return;
    try { toast(T("正在印刷…", "Printing…")); const { toBlob } = await import("html-to-image"); const blob = await toBlob(el, { pixelRatio: 2, backgroundColor: "#f4efe2", cacheBust: true });
      const f = new File([blob], `${api.trip.name}-${d}-小报.png`, { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [f] })) await navigator.share({ files: [f], title: T("旅途小报", "The Trip Daily") });
      else { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = f.name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
    } catch (e) { if (e && e.name !== "AbortError") toast(T("没能保存图片", "Couldn't save the image")); }
  };
  draw(d);
}
/* evening edition: after 8pm, once per day, a banner says today's paper is out */
export function paperReady(d = today()) { try { return !localStorage.getItem(`td-paper:${api.trip.id}:${d}`); } catch (e) { return false; } }
