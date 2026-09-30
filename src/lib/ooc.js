/* 失控仪式: the first time you open the app on a day when yesterday's card was never used,
   the card falls in, trembles, cracks, and a red seal slams down — then it tells you what the guardian wants today. */
import { api, on } from "./api.js";
import { esc, today, yesterday, buzz, REDUCE, wait } from "./util.js";
import { sfx, mus } from "./sound.js";
import { CARD } from "../data/skills.js";
import { sheetOpen } from "./ui.js";

const seenKey = id => "td-ooc-seen:" + id;
let busy = false, queue = [];
export async function checkOOC() {
  if (!api.trip || busy) return;
  if (sheetOpen() || document.querySelector(".mo, .dz, .fb")) { setTimeout(checkOOC, 2500); return; }   // wait until nothing else is on screen
  try { await api.settleDay(yesterday()); } catch (e) {}
  let E = []; try { E = (await api.effects()).filter(e => e.target_date === today() && !e.resolved && e.card !== "X" && CARD[e.card]); } catch (e) { return; }
  queue = E.filter(e => { try { return !localStorage.getItem(seenKey(e.id)); } catch (er) { return false; } });
  if (queue.length >= 2) multiIntro(queue.slice(), next); else next();
}
/* 双重失控: two or more guardians lost control on the same day — the cards crash into each other before each one speaks */
async function multiIntro(E, then) {
  busy = true; const D = await import("../pages/deck.js"), n = E.length, NUM = ["", "", "双重", "三重", "四重", "五重"];
  const ov = document.createElement("div"); ov.className = "ooc2"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", "多重失控");
  ov.innerHTML = `<div class="ooc-noise"></div><div class="ooc2-flash"></div><div class="ooc2-cards">${E.map((e, i) => `<div class="ooc2-c" style="--i:${i};--n:${n};--acc:${CARD[e.card].accent}">${D.cardHTML(e.card, { cls: "mini" })}</div>`).join("")}</div>
    <div class="ooc2-t"><small>OUT OF CONTROL × ${n}</small><b>${NUM[n] || n + " 重"}失控</b><p>${E.map(e => esc(CARD[e.card].myth)).join(" · ")}<br>今天同时失控了</p></div><button class="ooc-skip" data-skip>继续 ›</button>`;
  document.body.appendChild(ov); requestAnimationFrame(() => ov.classList.add("on"));
  let gone = false; const go = () => { if (gone) return; gone = true; ov.classList.add("out"); setTimeout(() => { ov.remove(); busy = false; then(); }, 420); };
  ov.querySelector("[data-skip]").onclick = go;
  await wait(REDUCE ? 0 : 700); ov.classList.add("hit"); sfx.chaos(); buzz([40, 30, 80, 30, 120]);
  await wait(REDUCE ? 0 : 500); ov.classList.add("t"); try { sfx.stamp(); } catch (er) {}
  setTimeout(go, REDUCE ? 1200 : 3000);
}
function next() { const e = queue.shift(); if (e) ceremony(e, next); }

export async function ceremony(e, after) {
  if (!e || !CARD[e.card]) return; busy = true;
  try { localStorage.setItem(seenKey(e.id), "1"); } catch (er) {}
  const D = await import("../pages/deck.js"), s = CARD[e.card], line = D.oocLine(e.card), [fk, label] = D.fxAction(e);
  document.querySelector(".ooc")?.remove();
  const ov = document.createElement("div"); ov.className = "ooc"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", "失控");
  ov.style.setProperty("--acc", s.accent); ov.style.setProperty("--bgc", s.bg);
  const shards = Array.from({ length: 14 }, (_, i) => `<i style="--a:${(i * 360 / 14 + Math.random() * 18) | 0}deg;--d:${(60 + Math.random() * 120) | 0}px;--r:${((Math.random() - .5) * 240) | 0}deg"></i>`).join("");
  ov.innerHTML = `<div class="ooc-noise"></div><div class="ooc-vig"></div>
    <div class="ooc-top"><small>OUT OF CONTROL · ${e.target_date.slice(5).replace("-", ".")}</small><b>昨天抽到的牌，没有人发动</b></div>
    <div class="ooc-stage"><div class="ooc-card">${D.cardHTML(e.card, { cls: "hero" })}<svg class="ooc-crack" viewBox="0 0 100 148" aria-hidden="true"><path pathLength="1" d="M58 0L50 34L62 52L44 80L56 104L46 148"/><path pathLength="1" d="M50 34L28 46L14 44M62 52L86 62M44 80L18 94M56 104L80 122L92 120"/><path pathLength="1" d="M28 46L22 62M86 62L90 80M18 94L8 108"/></svg><div class="ooc-shards">${shards}</div></div>
      <div class="ooc-seal"><span>失控</span><small>${esc(s.myth)}</small></div></div>
    <p class="ooc-line" id="oocLine"></p>
    <div class="ooc-panel"><small>今天 · ${esc(s.key)} · ${esc(s.name)}</small><p>${esc(D.oocText(e))}${e.detail ? `<br><b>${esc(e.detail)}</b>` : ""}</p>
      <div class="ooc-btns"><button class="btn ink full" data-go>${esc(label)}</button><button class="linkbtn" data-later>晚点再处理 · 牌组页可以找到它</button></div></div>
    <button class="ooc-skip" data-skip>跳过 ›</button>`;
  document.body.appendChild(ov);
  const done = (cont = true) => { ov.classList.add("out"); setTimeout(() => { ov.remove(); busy = false; if (cont) after && after(); else queue = []; }, 450); };
  ov.querySelector("[data-go]").onclick = () => { done(fk === "ok"); if (fk === "ok") D.handleFx(e, "ok"); else setTimeout(() => { if (!document.getElementById("pg-deck").classList.contains("on")) window.tdGo && window.tdGo("deck"); setTimeout(() => D.handleFx(e, fk), 500); }, 300); };
  ov.querySelector("[data-later]").onclick = () => done();
  let skipped = false; ov.querySelector("[data-skip]").onclick = () => { skipped = true; ov.classList.add("s1", "s2", "s3", "s4", "s5"); ov.querySelector("#oocLine").textContent = line; };
  const step = async (cls, ms) => { if (skipped) return; ov.classList.add(cls); await wait(REDUCE ? 0 : ms); };
  requestAnimationFrame(() => ov.classList.add("on"));
  await wait(REDUCE ? 0 : 350);
  await step("s1", 900); if (!skipped) { sfx.flip(); buzz(10); }                          // card falls in, face up
  await step("s2", 1100); if (!skipped) { sfx.chaos(); buzz([30, 40, 30, 40, 60]); }       // it trembles and glitches
  await step("s3", 900); if (!skipped) { sfx.tear(); buzz([60]); }                         // it cracks
  if (!skipped) { ov.classList.add("s4"); sfx.stamp(); try { mus.pop(); } catch (er) {} buzz([90, 30, 40]); await wait(REDUCE ? 0 : 700); }   // the seal slams down
  if (!skipped) { const el = ov.querySelector("#oocLine"); for (let i = 1; i <= line.length && !skipped; i++) { el.textContent = line.slice(0, i); if (i % 3 === 0) sfx.tap(); await wait(REDUCE ? 0 : 55); } }
  ov.classList.add("s5");
}
on("trip", () => setTimeout(checkOOC, 1500));
on("skill_effects", () => setTimeout(checkOOC, 800));
document.addEventListener("click", ev => { const b = ev.target.closest && ev.target.closest(".ooc-banner"); if (!b) return; api.effects().then(E => { const e = E.find(x => x.target_date === today() && !x.resolved && x.card !== "X"); if (e) ceremony(e); }).catch(() => {}); });
