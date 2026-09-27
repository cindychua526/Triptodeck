import { api, on, nameOf } from "../lib/api.js";
import { ic } from "../lib/icons.js";
import { $, esc, today, wait, buzz, REDUCE, whenTxt } from "../lib/util.js";
import { toast } from "../lib/ui.js";
import { sfx } from "../lib/sound.js";
import { COIN_RULES } from "../data/skills.js";

/* 旅途通宝 — a square-holed cash coin. 字面 (inscription) = 正面 / heads. */
const MODES = [
  { id: "yesno", label: "要不要", heads: "要", tails: "不要" },
  { id: "lr", label: "左还是右", heads: "左", tails: "右" },
  { id: "eat", label: "吃不吃", heads: "吃", tails: "不吃" },
  { id: "enter", label: "进不进", heads: "进", tails: "不进" }
];
let mode = "yesno", tossing = false, pending = null, rewrite = null, decisions = [], rest = 0;
export const goCoin = () => window.dispatchEvent(new CustomEvent("td-go", { detail: "coin" }));
export function startRewrite(d) { rewrite = d; mode = d.mode || "yesno"; goCoin(); setTimeout(render, 50); }

export function face(heads) {
  const u = (heads ? "h" : "t") + Math.random().toString(36).slice(2, 7);
  const defs = `<defs>
    <radialGradient id="br${u}" cx="36%" cy="30%" r="78%"><stop offset="0" stop-color="#c9a56e"/><stop offset=".45" stop-color="#8e6a3c"/><stop offset=".85" stop-color="#5a4024"/><stop offset="1" stop-color="#34240f"/></radialGradient>
    <filter id="pat${u}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="3" seed="${heads ? 3 : 8}"/><feColorMatrix values="0 0 0 0 .30  0 0 0 0 .46  0 0 0 0 .38  0 0 0 2.6 -1.35"/><feComposite in2="SourceGraphic" operator="in"/></filter>
    <filter id="grit${u}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="5"/><feColorMatrix values="0 0 0 0 .2  0 0 0 0 .14  0 0 0 0 .06  0 0 0 1.6 -.7"/><feComposite in2="SourceGraphic" operator="in"/></filter>
    <filter id="emb${u}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur in="SourceAlpha" stdDeviation="1.1" result="b"/>
      <feSpecularLighting in="b" surfaceScale="3.2" specularConstant="1" specularExponent="16" lighting-color="#fff2cc" result="s"><feDistantLight azimuth="225" elevation="42"/></feSpecularLighting>
      <feComposite in="s" in2="SourceAlpha" operator="in" result="s2"/><feOffset in="SourceAlpha" dx="1.2" dy="1.6" result="o"/><feFlood flood-color="#3b2a12" flood-opacity=".55"/><feComposite in2="o" operator="in" result="sh"/>
      <feMerge><feMergeNode in="sh"/><feMergeNode in="SourceGraphic"/><feMergeNode in="s2"/></feMerge></filter>
    <mask id="hole${u}"><rect width="200" height="200" fill="#fff"/><rect x="80" y="80" width="40" height="40" fill="#000"/></mask></defs>`;
  const relief = heads
    ? `<g font-family="Noto Serif SC, Songti SC, serif" font-weight="600" font-size="36" text-anchor="middle" fill="#6a4e2c"><text x="100" y="66">旅</text><text x="100" y="164">途</text><text x="151" y="114">通</text><text x="49" y="114">宝</text></g>`
    : `<path d="M100 36a15 15 0 1 0 0 30a19 19 0 0 1 0-30z" fill="#6a4e2c" transform="translate(-8 0)"/><circle cx="100" cy="150" r="6" fill="#6a4e2c"/><g font-family="Noto Serif SC, serif" font-weight="700" font-size="24" fill="#6a4e2c" text-anchor="middle"><text x="152" y="108">闽</text><text x="48" y="108">行</text></g>`;
  return `<svg viewBox="0 0 200 200">${defs}<g mask="url(#hole${u})">
    <circle cx="100" cy="100" r="97" fill="url(#br${u})"/><circle cx="100" cy="100" r="97" filter="url(#pat${u})" opacity=".8"/><circle cx="100" cy="100" r="97" filter="url(#grit${u})" opacity=".5"/>
    <g filter="url(#emb${u})"><path d="M100 3a97 97 0 1 0 .1 0zM100 15a85 85 0 1 1-.1 0z" fill-rule="evenodd" fill="#8a6a3c"/><path d="M72 72h56v56H72zM80 80v40h40V80z" fill-rule="evenodd" fill="#8a6a3c"/>${relief}</g>
    <path d="M40 150l18-12M136 44l14-6M60 40l8 9" stroke="#fff4d6" stroke-width=".6" opacity=".35"/></g></svg>`;
}
function sealHTML(res, label) {
  const heads = res === "heads";
  return `<div class="seal ${heads ? "h" : "t"}" id="coinSeal"><span>${esc(label)}</span><small>${heads ? "正" : "反"}</small></div>`;
}
const modeObj = () => MODES.find(m => m.id === mode);

export async function loadCoin() { try { decisions = await api.decisions(); } catch (e) {} renderList(); }
on("decisions", loadCoin);

export function render() {
  const root = $("coinRoot"); if (!root) return;
  root.innerHTML = `<div class="sk-top"><button class="icon-btn" data-back aria-label="返回">${ic("arrow-left")} 返回</button><button class="icon-btn snd" aria-label="音效">🔊</button></div>
    <div class="dk-title"><small>COIN OF THE ROAD</small><h2>旅途通宝</h2><p>拿不定主意，就交给这枚老铜钱。<span>有字的一面是正面：${COIN_RULES.heads}　背面：${COIN_RULES.tails}</span></p></div>
    <div class="modes">${MODES.map(m => `<button class="chip sm${m.id === mode ? " on" : ""}" data-mode="${m.id}" style="--c:#7a5a2c">${m.label}</button>`).join("")}</div>
    <div class="coin-q"><input class="inp" id="coinQ" maxlength="40" placeholder="要决定什么？比如：要不要进这家店" value="${esc(rewrite ? rewrite.question : "")}" aria-label="要决定的事"></div>
    ${rewrite ? `<div class="banner warn"><b>J · 命运改写</b>　重新决定「${esc(rewrite.question)}」，原来是 ${rewrite.result === "heads" ? "正面" : "反面"}</div>` : ""}
    <div class="banner" id="coinFx" hidden></div>
    <div class="coin-stage" id="coinStage"><div class="coin-shadow" id="coinShadow"></div>
      <div class="coin-tilt"><div class="coin3d" id="coin" role="button" tabindex="0" aria-label="抛硬币" style="transform:rotateX(${rest}deg)">
        ${Array.from({ length: 18 }, (_, i) => `<div class="coin-edge" style="transform:translateZ(${-(i + 1) * .9}px);--l:${(i / 17).toFixed(2)}"></div>`).join("")}
        <div class="coin-face heads" style="transform:translateZ(0)">${face(true)}<i class="coin-glint"></i></div><div class="coin-face tails">${face(false)}<i class="coin-glint"></i></div></div></div></div>
    <div class="coin-hint" id="coinHint">点一下铜钱，或者按住它快速往上一甩</div>
    <div class="coin-res" id="coinRes" aria-live="polite"></div>
    <div class="sk-sec-h">DECISIONS <b>大家最近的决定</b></div><div class="dec-list" id="decList"></div>`;
  root.querySelectorAll("[data-mode]").forEach(b => b.onclick = () => { mode = b.dataset.mode; sfx.tap(); root.querySelectorAll("[data-mode]").forEach(x => x.classList.toggle("on", x === b)); });
  const c = $("coin"); let fl = null;
  c.onpointerdown = e => { fl = { y: e.clientY, t: performance.now() }; c.setPointerCapture(e.pointerId); };
  c.onpointerup = e => { if (!fl) return; const dy = fl.y - e.clientY, dt = Math.max(1, performance.now() - fl.t); fl = null; toss(dy > 20 ? Math.min(1.6, .6 + dy / dt) : 1); };
  c.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toss(1); } };
  renderList(); checkFx();
}
async function checkFx() {
  const el = $("coinFx"); if (!el) return;
  try {
    const fx = await api.effects();
    const j = fx.find(e => e.card === "J" && e.target_date === today() && !e.resolved);
    if (j) { el.hidden = false; el.className = "banner warn"; el.innerHTML = `<b>${ic("warning")} 命运改写（失控）</b>　今天第一个决定会自动反转`; el.dataset.fx = j.id; }
  } catch (e) {}
}
async function toss(power = 1) {
  if (tossing) return; tossing = true; pending = null; $("coinRes").innerHTML = ""; $("coinHint").textContent = "……";
  sfx.toss(); buzz(10);
  const res = Math.random() < .5 ? "heads" : "tails", c = $("coin"), sh = $("coinShadow");
  const turns = 5 + Math.round(power * 3), end = turns * 360 + (res === "tails" ? 180 : 0), h = Math.round(150 + power * 110), dur = 1300 + power * 380;
  const fin = () => { rest = res === "tails" ? 180 : 0; c.style.transform = `rotateX(${rest}deg)`; landed(res); };
  if (REDUCE) { await c.animate([{ opacity: 1 }, { opacity: .2 }, { opacity: 1 }], { duration: 500 }).finished; return fin(); }
  const spinZ = (Math.random() - .5) * 40;
  c.animate([
    { transform: `translateY(0) rotateX(${rest}deg) rotateZ(0deg) scale(1)`, easing: "cubic-bezier(.15,.65,.35,1)" },
    { transform: `translateY(-${h}px) rotateX(${rest + end * .55}deg) rotateZ(${spinZ}deg) scale(1.15)`, offset: .46, easing: "cubic-bezier(.6,0,.85,.4)" },
    { transform: `translateY(0) rotateX(${end}deg) rotateZ(${spinZ * .3}deg) scale(1)`, offset: .78 },
    { transform: `translateY(-16px) rotateX(${end + 24}deg) rotateZ(0deg)`, offset: .84 },
    { transform: `translateY(0) rotateX(${end - 14}deg)`, offset: .9 },
    { transform: `translateY(-3px) rotateX(${end + 7}deg)`, offset: .95 },
    { transform: `translateY(0) rotateX(${end}deg)` }
  ], { duration: dur, fill: "forwards" }).finished.then(() => { c.getAnimations().forEach(a => a.cancel()); fin(); });
  sh.animate([{ transform: "scale(1)", opacity: 1 }, { transform: "scale(.4)", opacity: .3, offset: .46 }, { transform: "scale(1)", opacity: 1, offset: .78 }, { transform: "scale(.85)", offset: .84 }, { transform: "scale(1)" }], { duration: dur });
  setTimeout(() => sfx.clink(1), dur * .78); setTimeout(() => sfx.settle(), dur * .84);
}
async function landed(res) {
  tossing = false; buzz(res === "heads" ? [15, 30, 15] : [25]);
  const fx = $("coinFx"), fxId = fx && fx.dataset.fx;
  const firstToday = !decisions.some(d => d.date === today());
  let reversed = false;
  if (fxId && firstToday && !rewrite) { // J 失控: the first decision of the day flips itself
    await wait(500); sfx.chaos(); buzz([40, 30, 40]);
    const c = $("coin"); c.classList.add("glitch"); await c.animate([{ transform: `rotateX(${rest}deg)` }, { transform: `translateY(-40px) rotateX(${rest + 90}deg)` }, { transform: `rotateX(${rest + 180}deg)` }], { duration: 650, easing: "cubic-bezier(.3,1.4,.5,1)" }).finished;
    c.classList.remove("glitch"); rest = (rest + 180) % 360; c.style.transform = `rotateX(${rest}deg)`;
    res = res === "heads" ? "tails" : "heads"; reversed = true;
  }
  const m = modeObj(), label = res === "heads" ? m.heads : m.tails, q = $("coinQ").value.trim() || (rewrite && rewrite.question) || "";
  pending = { res, q, reversed, fxId: reversed ? fxId : null };
  $("coinRes").innerHTML = `${sealHTML(res, label)}<p class="res-txt">${q ? `「${esc(q)}」` : ""}${reversed ? "命运改写失控，结果被反转了！" : ""}铜钱说：<b>${esc(label)}</b></p>
    <div class="coin-btns"><button class="btn" id="coinAgain">再抛一次</button><button class="btn ink" id="coinKeep">${rewrite ? "就按这次改写" : "就这么定了"}</button></div>`;
  setTimeout(() => { const s = $("coinSeal"); s && s.classList.add("on"); sfx.stamp(); }, 150);
  $("coinHint").textContent = reversed ? "失控效果已生效" : "满意就定下来，不满意就再抛";
  $("coinAgain").onclick = () => toss(1); $("coinKeep").onclick = keep;
}
async function keep() {
  if (!pending) return; const p = pending; pending = null;
  try {
    if (rewrite) { await api.updateDecision(rewrite.id, { result: p.res, rewritten: { from: rewrite.result, at: new Date().toISOString() } }); toast("命运已改写"); rewrite = null; }
    else { await api.addDecision({ date: today(), question: p.q || "一个小决定", mode, result: p.res, reversed: p.reversed }); toast("决定已记下"); }
    if (p.fxId) api.resolveEffect(p.fxId, "第一个决定已被反转").catch(() => {});
    sfx.success(); $("coinRes").innerHTML = `<p class="res-txt">✓ 已记下</p>`; $("coinQ").value = "";
    checkFx();
  } catch (e) { pending = p; toast("没能保存，请再试一次"); }
}
function renderList() {
  const el = $("decList"); if (!el) return;
  if (!decisions.length) { el.innerHTML = `<p class="log-empty">还没有决定过什么</p>`; return; }
  el.innerHTML = decisions.slice(0, 15).map(d => { const m = MODES.find(x => x.id === d.mode) || MODES[0]; return `<div class="dec"><span class="yn ${d.result}">${esc(d.result === "heads" ? m.heads : m.tails)}</span><span>${esc(d.question)}${d.reversed ? "<em>失控反转</em>" : ""}${d.rewritten ? "<em>已改写</em>" : ""}<small>${esc(nameOf(d.user_id))}</small></span><small>${whenTxt(d.created_at)}</small></div>`; }).join("");
}
