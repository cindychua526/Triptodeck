import { api } from "../lib/api.js";
import { today, addDays, $, esc } from "../lib/util.js";
import { sfx } from "../lib/sound.js";
import { toast } from "../lib/ui.js";
import { FUJIAN_TEMPLATE } from "../lib/api.js";
import { newTripForm } from "./trips.js";
/* first launch: name → create the Fujian trip or join with a code */
export function onboard() {
  return new Promise(resolve => {
    const el = $("onboard"); el.className = "onboard on";
    let step = "name", name = "";
    const draw = (err) => {
      el.innerHTML = `<div class="ob-card">
        <div class="ob-folder"><i class="obf-pass">BOARDING · HOME → TRIP</i><span class="obf-label"><small>Archive</small><em>No. Travel - 001</em><b>MY NEXT JOURNEY</b></span><i class="obf-tape"></i></div>
        <small>THE TRIP DECK · TRAVEL ARCHIVE</small><h1>旅行档案</h1>
        ${step === "name" ? `<p>先告诉旅伴你是谁。</p><input class="inp big" id="obName" maxlength="16" placeholder="你的名字" value="${esc(name)}" autofocus><button class="btn ink full" id="obNext">下一步</button>`
        : `<p>你好，<b>${esc(name)}</b>。</p>
           <button class="btn full" id="obNew">开一本新的（自己填行程）</button><div class="ob-login"><button class="linkbtn" id="obMail">我以前用过，用邮箱登录</button><button class="linkbtn" id="obReclaim">用身份码找回</button></div>
           <label class="btn ink full" id="obXlsx">从 Excel 导入行程<input type="file" accept=".xlsx,.xls" hidden></label>
           ${api.mode === "cloud" ? `<div class="ob-or">或者用旅伴给你的邀请码加入</div><div class="addrow"><input class="inp" id="obCode" maxlength="8" placeholder="邀请码" style="text-transform:uppercase"><button class="btn" id="obJoin">加入</button></div>` : `<p class="as-hint">现在是单机模式（没连接 Supabase），数据只存在这台设备。</p>`}`}
        ${err ? `<p class="ob-err">${esc(err)}</p>` : ""}</div>`;
      if (step === "name") {
        const go = async () => { name = $("obName").value.trim(); if (!name) return; sfx.click(); $("obNext").disabled = true;
          try { await api.signIn(name); step = "trip"; draw(); } catch (e) { draw(String(e.message) === "ANON_DISABLED" ? "Supabase 还没开启匿名登录（Authentication → Anonymous sign-ins）" : "连不上服务器，请检查网络后再试"); } };
        $("obNext").onclick = go; $("obName").onkeydown = e => { if (e.key === "Enter") go(); };
      } else {
        $("obXlsx").querySelector("input").onchange = async e => { const f = e.target.files && e.target.files[0]; if (!f) return; sfx.click(); try { const { parseTripXlsx, importInto } = await import("../lib/xlsx-import.js"); const data = await parseTripXlsx(f); if (!data.trip.start) throw new Error("表里没有日期"); await api.createTrip({ name: data.trip.name, start: data.trip.start, end: data.trip.end, budget: data.trip.budget, cities: data.trip.cities.length ? data.trip.cities : ["xm"], template: null, kind: "group" }); await importInto(api, data); done(); } catch (err) { toast("没能导入：" + err.message); } };
        $("obMail").onclick = async () => { const em = prompt("你绑定过的邮箱"); if (!em) return; try { await api.emailStart(em.trim()); const code = prompt("邮件里的 6 位数字码（也看看垃圾邮件）"); if (!code) return; await api.emailVerify(em.trim(), code.trim(), null); done(); setTimeout(() => location.reload(), 600); } catch (e) { toast(e.message === "CODE_WRONG" ? "码不对或者过期了" : "没能登录：" + e.message); } };
        $("obReclaim").onclick = async () => { const c = prompt("输入你的 8 位身份码（在旧手机的设置里）"); if (!c) return; try { await api.reclaim(c.trim()); done(); setTimeout(() => location.reload(), 600); } catch (e) { toast(e.message === "BAD_CODE" ? "这个码不对" : "没能找回：" + e.message); } };
        $("obNew").onclick = () => { sfx.click(); el.classList.remove("on"); newTripForm({ after: done }); const watch = setInterval(() => { if (!document.querySelector(".usheet.on") && !api.trip) { clearInterval(watch); el.classList.add("on"); } else if (api.trip) clearInterval(watch); }, 500); };
        const j = $("obJoin"); if (j) j.onclick = async () => { const c = $("obCode").value.trim(); if (!c) return; try { await api.joinTrip(c); done(); } catch (e) { draw(String(e.message).includes("TRIP_NOT_FOUND") ? "找不到这个邀请码" : "没能加入：" + e.message); } };
      }
    };
    const done = () => { el.classList.remove("on"); setTimeout(() => { el.innerHTML = ""; }, 400); resolve(); };
    draw();
  });
}
