/* A small page-turning book: pages turn from the right edge like paper. */
import { sfx } from "../lib/sound.js";
import { buzz } from "../lib/util.js";
export function openFlipbook({ pages, theme = "paper", title = "", onClose, after } = {}) {
  document.querySelector(".fb")?.remove();
  const ov = document.createElement("div"); ov.className = `fb fb-${theme}`; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", title || "翻页");
  ov.innerHTML = `<button class="sc-x fb-x" aria-label="关闭">×</button><div class="fb-stage"><div class="fb-book">${pages.map((p, i) => `<div class="fb-page" style="z-index:${pages.length - i}"><div class="fb-front">${p}</div><div class="fb-back"></div></div>`).join("")}</div></div>
    <div class="sc-nav fb-nav"><button class="sc-a" data-d="-1" aria-label="上一页">‹</button><span class="fb-idx"></span><button class="sc-a" data-d="1" aria-label="下一页">›</button></div>`;
  document.body.appendChild(ov); requestAnimationFrame(() => ov.classList.add("on")); sfx.paper();
  const els = [...ov.querySelectorAll(".fb-page")]; let cur = 0;
  const sync = () => { els.forEach((el, i) => { el.classList.toggle("turned", i < cur); el.style.zIndex = i < cur ? i + 1 : pages.length - i + pages.length; }); ov.querySelector(".fb-idx").textContent = `${cur + 1} / ${pages.length}`; };
  const go = d => { const n = cur + d; if (n < 0 || n > pages.length - 1) { buzz(4); return; } cur = n; sfx.paper(); buzz(6); sync(); };
  ov.querySelectorAll(".sc-a").forEach(b => b.onclick = () => go(+b.dataset.d));
  let x0 = null; const st = ov.querySelector(".fb-stage");
  st.addEventListener("pointerdown", e => { if (e.target.closest("textarea,input,button,select")) return; x0 = e.clientX; });
  st.addEventListener("pointerup", e => { if (x0 == null) return; const dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); else if (!e.target.closest("[data-nofl]")) { const r = st.getBoundingClientRect(); go(e.clientX > r.left + r.width * .5 ? 1 : -1); } });
  const close = () => { ov.classList.remove("on"); setTimeout(() => ov.remove(), 350); onClose && onClose(); };
  ov.querySelector(".fb-x").onclick = close;
  ov.tabIndex = -1; ov.focus(); ov.addEventListener("keydown", e => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); if (e.key === "Escape") close(); });
  sync(); after && after(ov);
  return { el: ov, close, go };
}
