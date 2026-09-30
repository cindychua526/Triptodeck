/* 点亮灰章: a stamp that came out grey (土地公失控) can be brought back to colour.
   Group trip: you ask, a buddy holds the stamp and breathes on it until the ink comes back.
   Solo trip: you do it yourself. It's all kept in the skill log (LIGHTREQ / LIGHT), so no database change. */
import { api, nameOf } from "./api.js";
import { toast } from "./ui.js";
import { esc, buzz, today } from "./util.js";
import { placeStamp, citySeal, waxSeal } from "../data/stamps.js";
import { t as T } from "./i18n.js";
import { mus, sfx } from "./sound.js";
const svgOf = s => s.kind === "city" ? citySeal(s.city || s.name, s.date) : s.kind === "experience" ? waxSeal(s.name, s.city, s.date) : placeStamp(s.name, s.city, s.date, { special: s.kind === "special" });
const infoOf = s => ({ stamp: s.id, name: s.name, city: s.city, date: s.date, kind: s.kind, owner: s.user_id || (api.me && api.me.id) });
export async function requestLight(st) {
  const buddies = api.members.filter(m => m.id !== api.me.id);
  if (!buddies.length || api.mode === "local") return openLighter(infoOf(st));   // single-device mode: buddies live on this phone, so you light it here
  try { await api.addLog(st.date, null, "LIGHTREQ", T(`${api.me.name} 想请你帮忙点亮「${st.name}」`, `${api.me.name} asks you to relight "${st.name}"`), infoOf(st)); toast(T("已经请旅伴帮忙了，TA 会收到通知", "Asked your buddies — they'll get a notice")); mus.chime(4, .03); }
  catch (e) { toast(T("没能发出去", "Couldn't send")); }
}
export function openLighter(info, done) {
  document.querySelector(".rl")?.remove();
  const own = !info.owner || info.owner === api.me.id;
  const ov = document.createElement("div"); ov.className = "rl"; ov.setAttribute("role", "dialog");
  ov.innerHTML = `<div class="rl-in"><button class="sc-x" aria-label="${T("关闭", "Close")}">×</button><small>${T("点亮灰章", "RELIGHT")}</small>
    <b>${esc(info.name)}</b><p>${own ? T("按住印章，对它哈一口气——墨色会慢慢回来", "Hold the stamp and breathe on it — the ink comes back") : T(`${nameOf(info.owner)} 的章被土地公弄灰了。按住它，帮 TA 把颜色找回来`, `${nameOf(info.owner)}'s stamp went grey. Hold it to bring the colour back`)}</p>
    <div class="rl-st" id="rlSt" style="--p:0">${svgOf(info)}<i class="rl-fog"></i></div><div class="rl-bar"><i id="rlBar"></i></div><em id="rlHint">${T("按住不放", "Press and hold")}</em></div>`;
  document.body.appendChild(ov); requestAnimationFrame(() => ov.classList.add("on")); sfx.paper();
  const st = ov.querySelector("#rlSt"), bar = ov.querySelector("#rlBar"), hint = ov.querySelector("#rlHint");
  let p = 0, hold = false, raf = 0, last = 0, fin = false;
  const close = () => { cancelAnimationFrame(raf); removeEventListener("pointerup", stop); removeEventListener("pointercancel", stop); ov.classList.remove("on"); setTimeout(() => ov.remove(), 300); };
  const tick = ts => { const dt = last ? Math.min(60, ts - last) : 16; last = ts;
    p = Math.max(0, Math.min(1, p + (hold ? dt / 2600 : -dt / 1800)));
    st.style.setProperty("--p", p.toFixed(3)); bar.style.width = (p * 100).toFixed(1) + "%";
    if (hold && Math.random() < .08) buzz(6);
    if (p >= 1 && !fin) return finish();
    if (p > 0 || hold) raf = requestAnimationFrame(tick); else last = 0; };
  const start = e => { e.preventDefault(); if (fin) return; hold = true; hint.textContent = T("继续…", "Keep going…"); mus.pluck(3, .02); cancelAnimationFrame(raf); last = 0; raf = requestAnimationFrame(tick); };
  const stop = () => { hold = false; if (!fin) hint.textContent = p > 0 ? T("别松手呀", "Don't let go") : T("按住不放", "Press and hold"); };
  st.addEventListener("pointerdown", start); addEventListener("pointerup", stop); addEventListener("pointercancel", stop); st.addEventListener("pointerleave", stop);
  async function finish() {
    fin = true; hold = false; st.classList.add("lit"); hint.textContent = T("亮了！", "It's back!"); buzz([20, 40, 60]);
    [0, 2, 4, 7].forEach((n, i) => mus.chime(n, .035, i * .09));
    try { await api.addLog(info.date || today(), null, "LIGHT", own ? T(`${api.me.name} 自己点亮了「${info.name}」`, `${api.me.name} relit "${info.name}"`) : T(`${api.me.name} 帮 ${nameOf(info.owner)} 点亮了「${info.name}」`, `${api.me.name} relit ${nameOf(info.owner)}'s "${info.name}"`), { ...info, by: api.me.id }); }
    catch (e) { toast(T("没能保存", "Couldn't save")); }
    done && done(); setTimeout(close, 1500);
  }
  ov.querySelector(".sc-x").onclick = close;
}
