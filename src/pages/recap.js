/* 回忆放映: the whole trip as a little slideshow with music — cover, one slide per day
   (photos, stamps, food), the numbers, the awards, the end. Tap right = next, left = back, hold = pause. */
import { api, nameOf } from "../lib/api.js";
import { esc, shortDate, weekday } from "../lib/util.js";
import { t as T } from "../lib/i18n.js";
import { bgm, mus, sfx } from "../lib/sound.js";
import { tripDays, dayActs, cityOf } from "./trip.js";
import { myStamps, stampFor } from "./collection.js";
import { foodArt } from "../data/foodart.js";
import { guideFor } from "../data/guides.js";
import { tripAwards } from "../lib/awards.js";

const nm = s => String(s || "").replace(/（.*?）|\(.*?\)/g, "").trim();
export async function openRecap() {
  const t = api.trip; if (!t) return;
  const safe = async (f, d) => { try { return (await f()) || d; } catch (e) { return d; } };
  const [cks, wal, shared, lines, awards] = await Promise.all([safe(() => api.checkins(), []), safe(() => api.wallet(), []), safe(() => api.sharedPhotos(), []), Promise.resolve(null), safe(() => tripAwards(), [])]);
  const days = tripDays(), ss = myStamps().filter(s => s.trip_id === t.id), W = wal.filter(w => w.trip_id === t.id);
  const photosOn = d => [...cks.filter(c => (c.date === d) && c.photo_path && c.status !== "rejected").map(c => ({ p: c.photo_path, k: "c", cap: c.name })), ...shared.filter(p => p.date === d).map(p => ({ p: p.photo_path, k: "s", cap: p.caption }))];
  const g = guideFor((t.cities || [])[0]);
  const slides = [];
  slides.push(`<div class="rc-s rc-cover"><small>${T("回忆放映", "TRIP REPLAY")}</small><h1>${esc(t.name)}</h1><p>${(t.start_date || "").replace(/-/g, ".")} — ${(t.end_date || "").replace(/-/g, ".")}</p><em>${(t.cities || []).map(c => esc((guideFor(c) || { name: c }).name)).join(" · ")}</em><i class="rc-seal">${esc((g && g.name || t.name).slice(0, 2))}</i></div>`);
  days.forEach((d, i) => {
    const P = photosOn(d).slice(0, 4), S = ss.filter(s => s.date === d).slice(0, 3), F = W.filter(w => w.date === d).slice(0, 4), A = dayActs(d).filter(a => a.status !== "removed" && a.kind !== "transit").slice(0, 4);
    if (!P.length && !S.length && !F.length && !A.length) return;
    slides.push(`<div class="rc-s rc-day"><small>DAY ${i + 1} · ${shortDate(d)} ${weekday(d)}</small><h2>${esc(cityOf(d) || "")}</h2>
      ${P.length ? `<div class="rc-ph n${P.length}">${P.map((x, k) => `<i data-p="${esc(x.p)}" data-k="${x.k}" style="--r:${(k % 2 ? 3 : -3) + k}deg"></i>`).join("")}</div>` : A.length ? `<ol class="rc-plan">${A.map(a => `<li><time>${a.time || ""}</time>${esc(a.title)}</li>`).join("")}</ol>` : ""}
      ${S.length ? `<div class="rc-st">${S.map(s => `<span>${stampFor(s)}</span>`).join("")}</div>` : ""}
      ${F.length ? `<div class="rc-fd">${F.map(w => { const n = nm((w.spot_id || "").split(":").pop()); return `<span>${foodArt(n)}<b>${esc(n)}</b></span>`; }).join("")}</div>` : ""}</div>`);
  });
  const places = ss.filter(s => s.kind !== "city").length, seals = ss.filter(s => s.kind === "city").length;
  slides.push(`<div class="rc-s rc-num"><small>${T("这一趟", "THIS TRIP")}</small><div class="rc-nums"><div><b>${days.length}</b><span>${T("天", "days")}</span></div><div><b>${places}</b><span>${T("枚章", "stamps")}</span></div><div><b>${W.length}</b><span>${T("样美食", "dishes")}</span></div><div><b>${seals || (t.cities || []).length}</b><span>${T("座城市", "cities")}</span></div></div></div>`);
  if (awards.length) slides.push(`<div class="rc-s rc-aw"><small>${T("旅伴奖项", "AWARDS")}</small><div class="rc-awl">${awards.slice(0, 6).map(a => `<div><em>${a.icon}</em><b>${esc(a.title)}</b><i>${esc(a.name)}</i></div>`).join("")}</div></div>`);
  slides.push(`<div class="rc-s rc-end"><h2>${T("下次再出发", "Until next time")}</h2><p>${esc(t.name)}</p><small>THE TRIP DECK</small></div>`);

  document.querySelector(".rc")?.remove();
  const ov = document.createElement("div"); ov.className = "rc"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", T("回忆放映", "Trip replay"));
  ov.innerHTML = `<div class="rc-bars">${slides.map(() => `<i><b></b></i>`).join("")}</div><button class="sc-x" aria-label="${T("关闭", "Close")}">×</button><div class="rc-stage">${slides.map((s, i) => s.replace('class="rc-s', `data-i="${i}" class="rc-s`)).join("")}</div><p class="rc-tip">${T("点右边下一张 · 点左边上一张 · 按住暂停", "Tap right: next · left: back · hold: pause")}</p>`;
  document.body.appendChild(ov); requestAnimationFrame(() => ov.classList.add("on"));
  for (const el of ov.querySelectorAll("[data-p]")) { const u = await (el.dataset.k === "s" ? api.sharedUrl(el.dataset.p) : api.photoUrl(el.dataset.p)).catch(() => null); if (u) el.style.backgroundImage = `url("${u}")`; }
  const DUR = 4200; let i = 0, t0 = performance.now(), paused = false, pausedAt = 0, raf = 0, stopMusic = bgm([0, 4, 7, 9, 7, 4, 2, 4], 84, 0);
  const bars = [...ov.querySelectorAll(".rc-bars b")], S = [...ov.querySelectorAll(".rc-s")];
  const show = k => { i = Math.max(0, Math.min(S.length - 1, k)); S.forEach((s, j) => s.classList.toggle("on", j === i)); bars.forEach((b, j) => b.style.width = j < i ? "100%" : "0%"); t0 = performance.now(); mus.chime(i % 7, .02); };
  const tick = now => { raf = requestAnimationFrame(tick); if (paused) return; const p = (now - t0) / DUR; if (bars[i]) bars[i].style.width = Math.min(100, p * 100) + "%"; if (p >= 1) { if (i < S.length - 1) show(i + 1); else { paused = true; } } };
  const close = () => { cancelAnimationFrame(raf); stopMusic && stopMusic(); ov.classList.remove("on"); setTimeout(() => ov.remove(), 350); };
  ov.querySelector(".sc-x").onclick = e => { e.stopPropagation(); close(); };
  let downAt = 0; const st = ov.querySelector(".rc-stage");
  st.addEventListener("pointerdown", () => { downAt = performance.now(); paused = true; pausedAt = downAt; });
  st.addEventListener("pointerup", e => { const held = performance.now() - downAt > 350; t0 += performance.now() - pausedAt; paused = false; if (held) return;
    const r = st.getBoundingClientRect(); sfx.tap(); if (e.clientX - r.left < r.width * .33) show(i - 1); else if (i < S.length - 1) show(i + 1); else close(); });
  addEventListener("keydown", function k(e) { if (!ov.isConnected) return removeEventListener("keydown", k); if (e.key === "ArrowRight") show(i + 1); if (e.key === "ArrowLeft") show(i - 1); if (e.key === "Escape") close(); });
  show(0); raf = requestAnimationFrame(tick);
}
