/* 新玩法: the first time someone opens the app after an update, one short page about what's new (once per version) */
import { api } from "./api.js";
import { openSheet, closeSheet, bind, sheetOpen } from "./ui.js";
import { t as T } from "./i18n.js";
const VER = "2026-10", KEY = "td-new-seen";
const ITEMS = [
  ["报", T("每日小报", "Daily paper"), T("把今天的打卡、美食、骰子和语录排成一张报纸。晚上 8 点会提醒你。", "Today's check-ins, food and dice as a newspaper. Out at 8pm."), "paper"],
  ["✦", T("点亮灰章", "Relight grey stamps"), T("被土地公弄灰的章，请旅伴按住它就能找回颜色。", "A buddy can hold a grey stamp to bring its colour back."), null],
  ["勋", T("城市勋章", "City medals"), T("同一座城市盖满 5 枚章，护照那页会多一枚金色勋章。", "5 stamps in one city unlocks a gold medal in your passport."), "passport"],
  ["♥", T("相册点赞评论", "Likes & comments"), T("大家的相册里，双击照片点赞，还能写一句评论。", "Double-tap a shared photo to like it, or leave a comment."), "shared"],
  ["☁", T("没信号也能用", "Works offline"), T("改动先存在手机里，有网自动同步。设置里还能备份整趟手账。", "Changes wait on your phone and sync later. Back up the whole trip in Settings."), null]
];
export function maybeShowNew(go, firstRun) {
  let seen = null; try { seen = localStorage.getItem(KEY); } catch (e) { return; }
  if (seen === VER || !api.trip) return;
  try { localStorage.setItem(KEY, VER); } catch (e) {}
  if (firstRun) return;   // brand-new users just had the onboarding
  const show = () => { if (sheetOpen() || document.querySelector(".shelf.on, .ooc, .ooc2, .mo")) return setTimeout(show, 2500);
    const sh = openSheet(`<div class="as wn"><small class="as-k">WHAT'S NEW</small><h3>${T("新玩法", "What's new")}</h3>
      <ul class="wn-l">${ITEMS.map(([ic, n, d, go], i) => `<li><i>${ic}</i><div><b>${n}</b><p>${d}</p>${go ? `<button class="linkbtn" data-wn="${go}">${T("去看看", "Try it")} ›</button>` : ""}</div></li>`).join("")}</ul>
      <div class="as-btns"><button class="btn ink full" data-act="close">${T("知道了", "Got it")}</button></div></div>`);
    bind(sh, { close: closeSheet });
    sh.querySelectorAll("[data-wn]").forEach(b => b.onclick = () => { closeSheet(); const k = b.dataset.wn;
      setTimeout(() => { if (k === "paper") import("../pages/paper.js").then(m => m.openPaper()); else { go("collect"); setTimeout(() => { if (k === "shared") import("../pages/shared.js").then(m => m.openShared()); else import("../pages/collection.js").then(m => m.openBookPart(k)); }, 350); } }, 300); });
  };
  setTimeout(show, 3500);
}
