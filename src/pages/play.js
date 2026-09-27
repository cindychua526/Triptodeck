import { api } from "../lib/api.js";
import { CARD } from "../data/skills.js";
import { esc } from "../lib/util.js";
import { $ } from "../lib/util.js";
import { cardHTML } from "./deck.js";
import { face } from "./coin.js";
import { foodArt } from "../data/foodart.js";
import { doodle } from "../data/doodles.js";
export function renderPlay(go) {
  const root = $("playRoot");
  root.innerHTML = `<div class="ph"><small class="ph-k">THE PLAYBOOK</small><h2>玩法</h2><p>让行程慢下来，多一点记忆点。</p></div>
    <div id="playLive"></div>
    <div class="hub2">
      <button class="hub-t" data-go="deck"><span class="ht-frame"></span><div class="ht-art fan">${["K", "Q", "10"].map(k => cardHTML(k, { cls: "mini" })).join("")}</div>
        <div class="ht-txt"><small>SKILL ACTIVATION</small><b>旅行技能牌</b><span>十位神话守护者，每人每天随机一张。发动的时候，旅伴们都会收到提醒。</span><em>DRAW →</em></div></button>
      <button class="hub-t" data-go="coin"><span class="ht-frame"></span><div class="ht-art"><div class="ht-coin">${face(true)}</div></div>
        <div class="ht-txt"><small>COIN OF THE ROAD</small><b>旅途通宝</b><span>拿不定主意就抛一下。有字的一面是左、吃、进。</span><em>FLIP →</em></div></button>
      <button class="hub-t" data-go="tear"><span class="ht-frame"></span><div class="ht-art"><div class="ht-ticket"><span class="ht-food">${foodArt("沙茶面")}</span><b>美食票</b><i></i></div></div>
        <div class="ht-txt"><small>TEAR A TICKET</small><b>撕美食票</b><span>吃到当地的好东西，就撕下它的票，收进票夹。</span><em>TEAR →</em></div></button>
    </div>`;
  root.querySelectorAll("[data-go]").forEach(b => b.onclick = () => go(b.dataset.go));
  paintLive(); document.addEventListener("notices", paintLive, { once: false });
}

async function paintLive() {
  const el = $("playLive"); if (!el) return;
  const N = await import("../lib/notices.js"), A = await import("../lib/atmos.js");
  let atm = null; try { atm = await A.todaysAtmos(); } catch (e) {}
  const L = N.list().filter(l => l.action !== "DRAWN").slice(0, 8), unread = N.unread();
  el.innerHTML = `${atm ? `<div class="atm-card"><small>今日氛围牌 · 自动出现，不用抽</small><b>${A.ATMOS[atm].name}</b><span>${A.ATMOS[atm].hint}</span></div>` : ""}
    ${N.countdownHTML()}
    ${L.length ? `<div class="notices"><div class="sk-sec-h">LIVE <b>大家在做什么</b>${unread ? `<i class="nb">${unread}</i>` : ""}</div>${L.map(l => `<div class="nt-row${Date.parse(l.created_at) > (+localStorage.getItem("td-seen-log:" + api.trip.id) || 0) ? " new" : ""}"><b>${l.card && CARD[l.card] ? l.card : "·"}</b><span>${esc(N.line(l))}</span><time>${new Date(l.created_at).toTimeString().slice(0, 5)}</time></div>`).join("")}</div>` : ""}`;
  N.markRead();
}
