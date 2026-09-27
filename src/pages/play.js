import { $ } from "../lib/util.js";
import { cardHTML } from "./deck.js";
import { face } from "./coin.js";
import { foodArt } from "../data/foodart.js";
import { doodle } from "../data/doodles.js";
export function renderPlay(go) {
  const root = $("playRoot");
  root.innerHTML = `<div class="ph"><small class="ph-k">THE PLAYBOOK</small><h2>玩法</h2><p>让行程慢下来，多一点记忆点。</p></div>
    <div class="hub2">
      <button class="hub-t" data-go="deck"><span class="ht-frame"></span><div class="ht-art fan">${["K", "Q", "10"].map(k => cardHTML(k, { cls: "mini" })).join("")}</div>
        <div class="ht-txt"><small>SKILL ACTIVATION</small><b>旅行技能牌</b><span>六位神话守护者，每人每天随机一张。发动的时候，旅伴们都会收到提醒。</span><em>DRAW →</em></div></button>
      <button class="hub-t" data-go="coin"><span class="ht-frame"></span><div class="ht-art"><div class="ht-coin">${face(true)}</div></div>
        <div class="ht-txt"><small>COIN OF THE ROAD</small><b>旅途通宝</b><span>拿不定主意就抛一下。有字的一面是左、吃、进。</span><em>FLIP →</em></div></button>
      <button class="hub-t" data-go="tear"><span class="ht-frame"></span><div class="ht-art"><div class="ht-ticket"><span class="ht-food">${foodArt("沙茶面")}</span><b>美食票</b><i></i></div></div>
        <div class="ht-txt"><small>TEAR A TICKET</small><b>撕美食票</b><span>吃到当地的好东西，就撕下它的票，收进票夹。</span><em>TEAR →</em></div></button>
    </div>`;
  root.querySelectorAll("[data-go]").forEach(b => b.onclick = () => go(b.dataset.go));
}
