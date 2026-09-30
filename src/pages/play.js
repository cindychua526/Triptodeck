import { api } from "../lib/api.js";
import { ic } from "../lib/icons.js";
import { CARD } from "../data/skills.js";
import { esc } from "../lib/util.js";
import { $ } from "../lib/util.js";
import { cardHTML } from "./deck.js";
import { face } from "./coin.js";
import { foodArt } from "../data/foodart.js";
import { doodle } from "../data/doodles.js";
import { playMotion, GAMES } from "../lib/motion.js";
export function renderPlay(go) {
  const root = $("playRoot");
  root.innerHTML = `<div class="ph ph-row"><div><small class="ph-k">THE PLAYBOOK</small><h2>玩法</h2><p>让行程慢下来，多一点记忆点。</p></div><button class="bell" aria-label="动态">${ic("bell")}<span class="bell-n"></span></button></div>
    <div id="playLive"></div>
    <div class="hub2">
      <button class="hub-t" data-go="deck"><span class="ht-frame"></span><div class="ht-art fan">${["K", "Q", "10"].map(k => cardHTML(k, { cls: "mini" })).join("")}</div>
        <div class="ht-txt"><small>SKILL ACTIVATION</small><b>旅行技能牌</b><span>十一位神话守护者，每人每天随机一张。发动的时候，旅伴们都会收到提醒。</span><em>DRAW →</em></div></button>
      <button class="hub-t" data-go="coin"><span class="ht-frame"></span><div class="ht-art"><div class="ht-coin">${face(true)}</div></div>
        <div class="ht-txt"><small>COIN OF THE ROAD</small><b>旅途通宝</b><span>拿不定主意就抛一下。有字的一面是左、吃、进。</span><em>FLIP →</em></div></button>
      <button class="hub-t" data-dice><span class="ht-frame"></span><div class="ht-art"><div class="ht-dice"><i class="d1"><b></b></i><i class="d2"><b></b><b></b><b></b></i></div></div>
        <div class="ht-txt"><small>TRAVEL DICE</small><b>旅途骰子</b><span>挑战骰、谁来、走几步——让骰子替你们决定，结果大家都看得到。</span><em>ROLL →</em></div></button>
      <button class="hub-t" data-go="tear"><span class="ht-frame"></span><div class="ht-art"><div class="ht-ticket"><span class="ht-food">${foodArt("沙茶面")}</span><b>美食票</b><i></i></div></div>
        <div class="ht-txt"><small>TEAR A TICKET</small><b>撕美食票</b><span>吃到当地的好东西，就撕下它的票，收进票夹。</span><em>TEAR →</em></div></button>
    </div>`;
  root.insertAdjacentHTML("beforeend", `<div class="sk-sec-h">MORE GAMES <b>一起玩</b></div><div class="g2-grid">
    <button class="g2-t" data-g2="bingo"><span class="g2-art bingo">${Array.from({ length: 9 }, (_, i) => `<i class="${[0, 4, 8, 2].includes(i) ? "on" : ""}"></i>`).join("")}</span><span><b>城市宾果</b><small>每人每天一张 3×3 卡，看到就划掉，连线就宾果</small></span></button>
    <button class="g2-t" data-g2="secret"><span class="g2-art secret"><i>密</i></span><span><b>秘密任务</b><small>早上拆一封只有你知道的任务，晚上 8 点揭晓</small></span></button>
    <button class="g2-t" data-paper><span class="g2-art news"><i>报</i></span><span><b>每日小报</b><small>把今天发生的事排成一张报纸，可以保存分享</small></span></button>
    <button class="g2-t" data-g2="guess"><span class="g2-art guess">¥?</span><span><b>猜价格</b><small>付钱前大家先猜，最准的人赢，顺手记进账本</small></span></button></div>`);
  root.insertAdjacentHTML("beforeend", `<div class="sk-sec-h">LITTLE SURPRISES <b>小惊喜 · 随手玩</b></div><div class="sp-grid">${GAMES.map(([k, n, d], i) => `<button class="sp-t" data-game="${k}" style="--i:${i}"><span class="sp-ic sp-${k}"></span><b>${n}</b><small>${d}</small></button>`).join("")}</div><p class="col-note">旅途中也会不经意冒出来：下午茶时间、盖完章、天气变了的时候。</p>`);
  root.querySelectorAll("[data-go]").forEach(b => b.onclick = () => go(b.dataset.go));
  root.querySelectorAll("[data-g2]").forEach(b => b.onclick = () => import("./games2.js").then(m => ({ bingo: m.openBingo, secret: m.openSecret, guess: m.openGuess })[b.dataset.g2]()));
  root.querySelector("[data-paper]").onclick = () => import("./paper.js").then(m => m.openPaper());
  root.querySelector("[data-dice]").onclick = () => import("./dice.js").then(m => m.openDice());
  root.querySelectorAll("[data-game]").forEach(b => b.onclick = () => playMotion(b.dataset.game));
  paintLive(); document.addEventListener("notices", paintLive, { once: false });
}

async function paintLive() {
  const el = $("playLive"); if (!el) return;
  const N = await import("../lib/notices.js"), A = await import("../lib/atmos.js");
  let atm = null; try { atm = await A.todaysAtmos(); } catch (e) {}
  const L = N.list().filter(l => l.action !== "DRAWN").slice(0, 8), unread = N.unread();
  el.innerHTML = `${atm ? `<div class="atm-card"><small>今日氛围牌 · 自动出现，不用抽</small><b>${A.ATMOS[atm].name}</b><span>${A.ATMOS[atm].hint}</span></div>` : ""}
    ${N.countdownHTML()}`;
  N.list && document.dispatchEvent(new CustomEvent("bellpaint"));
}
