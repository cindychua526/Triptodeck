/* 打印成相册: the whole journal laid out as A5-ish pages, then the phone's print dialog —
   choose "存储为 PDF / Save as PDF" to keep it, or send the PDF to a photo-book printer. */
import { api } from "../lib/api.js";
import { esc, shortDate, weekday } from "../lib/util.js";
import { toast } from "../lib/ui.js";
import { t as T } from "../lib/i18n.js";
import { tripDays, dayActs, cityOf } from "./trip.js";
import { myStamps, stampFor } from "./collection.js";
import { foodArt } from "../data/foodart.js";
import { guideFor } from "../data/guides.js";
import { getJournal } from "../lib/journal.js";

const nm = s => String(s || "").replace(/（.*?）|\(.*?\)/g, "").trim();
export async function printBook() {
  const t = api.trip; if (!t) return;
  toast(T("正在排版相册，稍等几秒…", "Laying out your book…"));
  const safe = async (f, d) => { try { return (await f()) || d; } catch (e) { return d; } };
  const [cks, wal, shared, J] = await Promise.all([safe(() => api.checkins(), []), safe(() => api.wallet(), []), safe(() => api.sharedPhotos(), []), safe(() => getJournal(), { days: {}, moods: {} })]);
  const days = tripDays(), ss = myStamps().filter(s => s.trip_id === t.id), W = wal.filter(w => w.trip_id === t.id);
  const pages = [];
  pages.push(`<section class="pb-p pb-cover"><small>THE TRIP DECK · ${T("旅行手账", "TRAVEL JOURNAL")}</small><h1>${esc(t.name)}</h1><p>${(t.start_date || "").replace(/-/g, ".")} — ${(t.end_date || "").replace(/-/g, ".")}</p>
    <p class="pb-cities">${(t.cities || []).map(c => esc((guideFor(c) || { name: c }).name)).join(" · ")}</p><div class="pb-cst">${ss.filter(s => s.kind === "city").slice(0, 4).map(s => `<span>${stampFor(s)}</span>`).join("")}</div>
    <p class="pb-by">${esc(api.me ? api.me.name : "")}</p></section>`);
  if (J.summary) pages.push(`<section class="pb-p pb-text"><h2>${T("写在前面", "Foreword")}</h2><p>${esc(J.summary).replace(/\n/g, "<br>")}</p></section>`);
  for (const [i, d] of days.entries()) {
    const P = [...cks.filter(c => c.date === d && c.photo_path && c.status !== "rejected").map(c => ({ p: c.photo_path, k: "c", cap: c.name })), ...shared.filter(p => p.date === d).map(p => ({ p: p.photo_path, k: "s", cap: p.caption || "" }))].slice(0, 6);
    const S = ss.filter(s => s.date === d), F = W.filter(w => w.date === d), A = dayActs(d).filter(a => a.status !== "removed" && a.kind !== "transit"), note = (J.days || {})[d], mood = (J.moods || {})[d];
    if (!P.length && !S.length && !F.length && !A.length && !note) continue;   // nothing happened that day: no blank page
    pages.push(`<section class="pb-p pb-day"><header><small>DAY ${i + 1}</small><b>${shortDate(d)} ${weekday(d)}</b><span>${esc(cityOf(d) || "")}${mood ? ` · ${esc(mood)}` : ""}</span></header>
      ${P.length ? `<div class="pb-ph n${Math.min(P.length, 4)}">${P.map(x => `<figure><i data-p="${esc(x.p)}" data-k="${x.k}"></i>${x.cap ? `<figcaption>${esc(x.cap)}</figcaption>` : ""}</figure>`).join("")}</div>` : ""}
      ${A.length ? `<ol class="pb-plan">${A.map(a => `<li><time>${a.time || ""}</time>${esc(a.title)}</li>`).join("")}</ol>` : ""}
      ${note ? `<p class="pb-note">${esc(note).replace(/\n/g, "<br>")}</p>` : ""}
      ${S.length ? `<div class="pb-st">${S.slice(0, 8).map(s => `<span>${stampFor(s)}</span>`).join("")}</div>` : ""}
      ${F.length ? `<div class="pb-fd">${F.map(w => { const n = nm((w.spot_id || "").split(":").pop()); return `<span>${foodArt(n)}<b>${esc(n)}</b></span>`; }).join("")}</div>` : ""}
      <footer>${i + 1}</footer></section>`);
  }
  pages.push(`<section class="pb-p pb-end"><h2>${T("下次再出发", "Until next time")}</h2><p>${ss.filter(s => s.kind !== "city").length} ${T("枚章", "stamps")} · ${W.length} ${T("样美食", "dishes")} · ${days.length} ${T("天", "days")}</p></section>`);
  document.querySelector(".pbk")?.remove();
  const box = document.createElement("div"); box.className = "pbk"; box.setAttribute("aria-hidden", "true"); box.innerHTML = pages.join(""); document.body.appendChild(box);
  /* wait for photos, then print */
  await Promise.all([...box.querySelectorAll("[data-p]")].map(async el => { try { const u = await (el.dataset.k === "s" ? api.sharedUrl(el.dataset.p) : api.photoUrl(el.dataset.p)); if (!u) return;
    await new Promise(ok => { const im = new Image(); im.onload = im.onerror = ok; im.src = u; setTimeout(ok, 6000); }); el.style.backgroundImage = `url("${u}")`; } catch (e) {} }));
  document.body.classList.add("printing-book");
  const done = () => { document.body.classList.remove("printing-book"); box.remove(); removeEventListener("afterprint", done); };
  addEventListener("afterprint", done);
  setTimeout(() => { try { window.print(); } catch (e) { toast(T("这台手机不能打印，试试电脑", "Printing isn't available here")); done(); } }, 300);
  setTimeout(() => { if (document.body.classList.contains("printing-book")) done(); }, 120000);
}
