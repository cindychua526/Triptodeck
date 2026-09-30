/* 旅途骰子: three ways to let the dice decide — a challenge, who's up, how far to wander.
   Results go into the room's log so buddies see them in 动态. */
import { api } from "../lib/api.js";
import { esc, today, buzz, REDUCE, wait } from "../lib/util.js";
import { sfx, mus } from "../lib/sound.js";

const PIPS = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
const FACE_ROT = { 1: [0, 0], 6: [0, 180], 3: [0, -90], 4: [0, 90], 2: [-90, 0], 5: [90, 0] };
const face = (n, cls) => `<div class="dz-f ${cls}">${Array.from({ length: 9 }, (_, i) => `<i${PIPS[n].includes(i + 1) ? ` class="on${n === 1 ? " red" : ""}"` : ""}></i>`).join("")}</div>`;
const cube = id => `<div class="dz-die" id="${id}"><div class="dz-cube">${face(1, "f1")}${face(6, "f6")}${face(3, "f3")}${face(4, "f4")}${face(2, "f2")}${face(5, "f5")}</div><span class="dz-shadow"></span></div>`;

/* challenge dice: every face is a kind of thing, the challenge inside it is random */
const CH = {
  1: ["吃", "EAT", ["下一家小吃店，点菜单上第三样", "买一样从没吃过的水果，全员分着吃", "找一家本地人排队的店，跟着排", "下一杯饮料选最奇怪的口味", "这一餐必须有一道「看不懂名字」的菜", "请店家推荐一样招牌，照点"]],
  2: ["拍", "SHOOT", ["和一只猫或狗合影（征得同意）", "拍一张全员只露出脚的照片", "找到一扇最好看的门，站在前面拍", "用倒影拍一张（水、玻璃、墨镜都算）", "拍一张像电影海报的合照", "拍下今天看到的最可爱的招牌"]],
  3: ["走", "WALK", ["下一个路口往右，走 5 分钟看看", "找一条最窄的巷子穿过去", "爬到附近最高的地方看一眼", "下一段路不许看地图", "走到看到第一座寺庙或祠堂为止", "沿着河或海走 10 分钟"]],
  4: ["问", "ASK", ["问店家：这条街最好吃的是哪家？", "用当地话学一句「好吃」，说给老板听", "问一位路人：这里有什么是游客不知道的？", "请陌生人帮全员拍一张合照", "问阿姨这道菜怎么做", "问一位本地人他小时候常去哪里玩"]],
  5: ["买", "BUY", ["每人花不超过 10 块，买一样送给旅伴的小礼物", "买一张当地的明信片，写给未来的自己", "买一样只有这里才有的零食", "去菜市场买一样叫不出名字的东西", "买一朵花或捡一片叶子夹进手账", "买一瓶当地牌子的饮料，大家打分"]],
  6: ["玩", "PLAY", ["接下来 10 分钟全员只能用气声说话", "下一站前，每人讲一个自己的糗事", "猜拳输的人今晚负责讲睡前故事", "下一张照片全员摆同一个奇怪姿势", "30 分钟内谁说「好累」谁请喝饮料", "每人给今天打分，最低分的人决定宵夜"]]
};
const WHO = ["今天请喝饮料", "帮大家拿东西 30 分钟", "决定下一餐吃什么", "下一个景点当导游", "给大家拍一张好看的照片", "今晚写日记的第一句", "去问路", "唱一句歌"];

let mode = "ch", busy = false, pickWho = WHO[0];
export function openDice() {
  document.querySelector(".dz")?.remove(); busy = false;
  const ov = document.createElement("div"); ov.className = "dz"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", "旅途骰子");
  ov.innerHTML = `<button class="sc-x" aria-label="关闭">×</button><div class="dz-in"><small class="as-k">TRAVEL DICE</small><h2>旅途骰子</h2>
    <div class="seg dz-seg"><button data-m="ch">挑战骰</button><button data-m="who">谁来</button><button data-m="walk">走几步</button></div>
    <div id="dzBody"></div></div>`;
  document.body.appendChild(ov); requestAnimationFrame(() => ov.classList.add("on")); sfx.paper();
  ov.querySelector(".sc-x").onclick = () => { ov.classList.remove("on"); setTimeout(() => ov.remove(), 320); };
  ov.querySelectorAll("[data-m]").forEach(b => b.onclick = () => { if (busy) return; mode = b.dataset.m; sfx.tap(); paint(ov); });
  paint(ov);
}
function paint(ov) {
  ov.querySelectorAll("[data-m]").forEach(b => b.classList.toggle("on", b.dataset.m === mode));
  const body = ov.querySelector("#dzBody"), ms = api.members || [];
  if (mode === "ch") body.innerHTML = `<p class="dz-hint">掷一颗骰子，看今天的小挑战：<br>一 吃 · 二 拍 · 三 走 · 四 问 · 五 买 · 六 玩</p><div class="dz-table">${cube("d1")}</div><div class="dz-res" id="dzRes"></div><button class="btn ink full dz-go" data-roll>掷骰子</button>`;
  if (mode === "walk") body.innerHTML = `<p class="dz-hint">两颗骰子加起来是 N：<br>走 N 分钟，然后在路口听骰子的方向。</p><div class="dz-table two">${cube("d1")}${cube("d2")}</div><div class="dz-res" id="dzRes"></div><button class="btn ink full dz-go" data-roll>掷骰子</button>`;
  if (mode === "who") body.innerHTML = `<p class="dz-hint">每人一颗骰子，点数最小的那个人：</p><div class="chips-wrap dz-who">${WHO.map(w => `<button class="chip sm${w === pickWho ? " on" : ""}" data-w="${esc(w)}" style="--c:#3a2c1f">${esc(w)}</button>`).join("")}</div>
    <div class="dz-ppl">${(ms.length ? ms : [{ id: "me", name: "你" }]).map((m, i) => `<div class="dz-p">${cube("p" + i)}<b>${esc(m.name)}</b></div>`).join("")}</div>${ms.length < 2 ? `<p class="as-hint">房间里只有你一个人——邀请旅伴进来，这个玩法才好玩。</p>` : ""}<div class="dz-res" id="dzRes"></div><button class="btn ink full dz-go" data-roll>全员掷骰子</button>`;
  body.querySelectorAll("[data-w]").forEach(b => b.onclick = () => { pickWho = b.dataset.w; sfx.tap(); body.querySelectorAll("[data-w]").forEach(x => x.classList.toggle("on", x === b)); });
  body.querySelector("[data-roll]").onclick = () => roll(ov);
  body.querySelectorAll(".dz-die").forEach(d => d.onclick = () => roll(ov));
}
function spin(el, n, extra = 0) {
  if (!el) return; const [rx, ry] = FACE_ROT[n], c = el.querySelector(".dz-cube"), turns = 2 + Math.floor(Math.random() * 2);
  c.style.transition = "none"; c.style.transform = `rotateX(${Math.random() * 360}deg) rotateY(${Math.random() * 360}deg)`; void c.offsetWidth;
  c.style.transition = `transform ${REDUCE ? .01 : 1.1 + extra}s cubic-bezier(.2,.9,.25,1.1)`; c.style.transform = `rotateX(${rx + 360 * turns}deg) rotateY(${ry + 360 * turns}deg)`;
  el.classList.remove("hop"); void el.offsetWidth; el.classList.add("hop");
}
const d6 = () => 1 + Math.floor(Math.random() * 6);
async function roll(ov) {
  if (busy) return; busy = true; const res = ov.querySelector("#dzRes"); res.classList.remove("on"); res.innerHTML = "";
  sfx.shuffle(); setTimeout(() => sfx.toss && sfx.toss(), 200); buzz([10, 30, 10, 30, 10]);
  let text = "", html = "";
  try {
    if (mode === "ch") { const n = d6(); spin(ov.querySelector("#d1"), n); await wait(REDUCE ? 50 : 1250); const [k, en, L] = CH[n], c = L[Math.floor(Math.random() * L.length)];
      html = `<small>${n} · ${en}</small><b>${k}</b><p>${esc(c)}</p>`; text = `掷出 ${n}「${k}」：${c}`; }
    if (mode === "walk") { const a = d6(), b = d6(); spin(ov.querySelector("#d1"), a); spin(ov.querySelector("#d2"), b, .15); await wait(REDUCE ? 50 : 1400); const n = a + b, dir = n % 2 ? "右" : "左", extra = n >= 11 ? "，走到了就奖励自己一杯饮料" : n <= 3 ? "，就在附近慢慢逛" : "";
      html = `<small>${a} + ${b}</small><b>${n} 分钟</b><p>走 ${n} 分钟，在下一个路口往<strong>${dir}</strong>转${extra}。遇到什么就进去看看。</p>`; text = `掷出 ${a}+${b}：走 ${n} 分钟后往${dir}转`; }
    if (mode === "who") { const ms = api.members && api.members.length ? api.members : [{ id: "me", name: "你" }]; const v = ms.map(() => d6());
      ms.forEach((m, i) => spin(ov.querySelector("#p" + i), v[i], i * .08)); await wait(REDUCE ? 50 : 1300 + ms.length * 80);
      let idx = ms.map((_, i) => i), min = Math.min(...v), low = idx.filter(i => v[i] === min), round = 1;
      while (low.length > 1 && round < 4) { round++; res.innerHTML = `<p>${low.map(i => esc(ms[i].name)).join("、")} 都是 ${min}，加赛一轮！</p>`; res.classList.add("on"); mus.pop(); await wait(900);
        low.forEach(i => { v[i] = d6(); spin(ov.querySelector("#p" + i), v[i]); }); await wait(REDUCE ? 50 : 1300);
        min = Math.min(...low.map(i => v[i])); low = low.filter(i => v[i] === min); }
      const wi = low[0], who = ms[wi]; ov.querySelectorAll(".dz-p").forEach((p, i) => p.classList.toggle("lose", i === wi));
      html = `<small>最小点 ${min}</small><b>${esc(who.name)}</b><p>${esc(pickWho)}</p>`; text = `掷骰子决定：${who.name} ${pickWho}`; }
    res.innerHTML = html; res.classList.add("on"); sfx.stamp(); mus.harp(3, 4, .06); buzz([20, 40, 20]);
    if (api.trip) api.addLog(today(), null, "DICE", text).catch(() => {});
  } finally { busy = false; }
}
