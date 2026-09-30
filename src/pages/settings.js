import { api } from "../lib/api.js";
import { buzz, $, esc, setSimDate, simOffset, today, shortDate } from "../lib/util.js";
import { openSheet, closeSheet, toast, bind, askConfirm, askText } from "../lib/ui.js";
import { soundOn, setSound, mus } from "../lib/sound.js";
import { tripDays } from "./trip.js";
import { openTrips } from "./trips.js";
import { askSystemPermission } from "../lib/notify.js";
import { lang, setLang } from "../lib/i18n.js";
export function openSettings() {
  const t = api.trip, ms = api.members, sim = simOffset() !== 0;
  const sh = openSheet(`<div class="as"><small class="as-k">SETTINGS</small><h3>设置</h3>
    <div class="moon-play" id="moonPlay"><svg viewBox="0 0 320 120" id="moonSvg"><g id="moonLines" stroke="#2f3a2e" stroke-width="1" fill="none" opacity=".5"><path d="M20 30 Q160 30 300 30"/><path d="M20 60 Q160 60 300 60"/><path d="M20 90 Q160 90 300 90"/></g><g id="moonG" transform="translate(250 60)"><circle r="30" fill="#f6f1e8" stroke="#2f3a2e" stroke-width="1.2"/><path id="moonShade" d="M0 -30 A30 30 0 0 1 0 30 A16 30 0 0 0 0 -30z" fill="#2f3a2e"/></g><circle cx="70" cy="60" r="3" fill="#b3341e"/></svg><small>拨一拨月亮 · 摸一摸线</small></div>
    <div class="as-sec"><small>你的名字</small><div class="addrow"><input class="inp" id="stName" maxlength="16" value="${esc(api.me.name)}"><button class="btn" data-act="rename">保存</button></div></div>
    <div class="as-sec"><small>导入</small><label class="btn sm">从 Excel 导入行程 / 预付到这趟旅行<input type="file" accept=".xlsx,.xls" hidden id="stXlsx"></label><p class="as-hint">用「行程模板.xlsx」填好再传。会加到现有行程后面，不会删掉已有的。</p></div>
    <div class="as-sec"><small>备份 · 整趟手账存成一个文件</small><div class="row" style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" data-act="exp">导出</button><button class="btn sm" data-act="expPh">导出（含照片）</button><label class="btn sm">从备份导入<input type="file" accept=".json,application/json" hidden id="stBackup"></label></div><p class="as-hint">行程、清单、账本、你的印章、美食票和日记都在里面。导入会新建一趟旅行，不会覆盖现在这趟。</p></div>
    <div class="as-sec"><small>旅伴 · ${api.members.length} 人</small><div class="mem-list">${api.members.map(m => `<span class="mem"><b>${esc(m.name)}</b>${m.id === api.me.id ? "（我）" : ""}${api.mode === "cloud" && api.trip.created_by === api.me.id && m.id !== api.me.id ? `<button data-kick="${m.id}" aria-label="移除">×</button>` : ""}</span>`).join("")}</div>${api.mode === "cloud" ? `<p class="as-hint">${api.trip.created_by === api.me.id ? "重复的人或者已经走了的人，点 × 移除。移除只是从房间里拿掉，他打过的卡和记的账还在。" : "只有建这趟旅行的人能移除旅伴。"}</p>` : ""}</div>
    <div class="as-sec"><small>我的身份码</small><p class="as-hint">换手机、删了 App 重装、清了浏览器数据，都会变成「新的人」。记下这个码，在新的那边输入，就能把自己找回来，所有打卡、账和牌都跟着回来。</p><div class="row"><code class="idcode" id="stCode">……</code><button class="btn sm" data-act="copycode">复制</button></div>
      <div class="addrow" style="margin-top:8px"><input class="inp" id="stReclaim" placeholder="输入旧的身份码，找回自己" maxlength="8" autocapitalize="characters"><button class="btn sm" data-act="reclaim">找回</button></div></div>
    <div class="as-sec"><small>这趟旅行</small><p><b>${esc(t.name)}</b>　${t.kind === "solo" ? "个人旅行，只有你" : "旅行房间"}</p><div class="row" style="display:flex;gap:8px;margin-top:8px"><button class="btn sm" data-act="trips">切换 / 新的旅行</button><button class="btn sm warn" data-act="leave">${t.kind === "solo" ? "删除这趟旅行" : "离开这个房间"}</button></div></div>
    ${api.mode === "cloud" && t.kind !== "solo" ? `<div class="as-sec"><small>邀请旅伴 · 把这个码发给他们</small><div class="code-box"><b>${esc(t.code)}</b><button class="btn sm" data-act="copy">复制</button></div></div>` : api.mode === "local" ? `<div class="as-sec"><small>单机模式</small><p>还没连接 Supabase，数据只存在这台设备。连上以后旅伴就能用邀请码加入。</p></div>` : ""}
    <div class="as-sec"><small>拍照打卡</small><p>${t.kind === "solo" ? "个人旅行：拍完就盖章。" : "打卡照片交给旅伴，任何一位确认后就盖章。"}</p></div>
    <div class="as-sec"><small>通知 · App 关着也收得到</small><p class="as-hint" id="stPushHint">先「添加到主屏幕」，再按这个按钮允许通知。之后旅伴发动技能、等你确认打卡，手机会像短信一样跳出来。</p><button class="btn sm" data-act="push" id="stPushBtn">打开推送通知</button></div>
    <div class="as-sec"><small>通知</small><p>旅伴发动技能、等你确认打卡时，App 里会弹出提醒。开着 App 但在后台时，也可以用系统通知。</p><button class="btn sm" data-act="notif" style="margin-top:8px">打开系统通知</button></div>
    <div class="as-sec"><small>旅伴（${ms.length}）</small><p>${ms.map(m => esc(m.name) + (m.id === api.me.id ? "（你）" : "")).join("、")}</p>
      ${api.mode === "local" ? `<div class="addrow"><input class="inp" id="stComp" maxlength="12" placeholder="加一个旅伴的名字（仅本机）"><button class="btn" data-act="addComp">添加</button></div>` : ""}</div>
    <div class="as-sec"><small>预演模式 · 出发前先试玩</small><p>把「今天」当作行程里的某一天，技能牌、打卡、账本都会按那天来算。</p>
      <select class="inp" id="stSim"><option value="">关闭（用真实日期 ${shortDate(new Date().toISOString().slice(0, 10))}）</option>${tripDays().map((d, i) => `<option value="${d}"${sim && today() === d ? " selected" : ""}>Day ${i + 1} · ${shortDate(d)}</option>`).join("")}</select></div>
    <div class="as-sec"><label class="tog"><input type="checkbox" id="stSnd" ${soundOn() ? "checked" : ""}> 音效（iPhone 静音键打开时也会响）</label></div>
    <div class="as-btns"><button class="btn ink full" data-act="close">完成</button><button class="linkbtn" data-act="out">${api.mode === "cloud" ? "退出登录" : "清空本机数据，重新开始"}</button></div></div>`, { accent: "#3a2c1f" });
  $("stSnd").onchange = e => setSound(e.target.checked);
  const nb = sh.querySelector("[data-act=notif]"); if (nb) nb.onclick = async () => { const r = await askSystemPermission(); toast(r === "granted" ? "系统通知已打开" : r === "unsupported" ? "这个浏览器不支持系统通知" : "没有拿到通知权限，可以在手机设置里打开"); };
  $("stSim").onchange = e => { setSimDate(e.target.value || null); toast(e.target.value ? `预演：今天 = ${shortDate(e.target.value)}` : "已回到真实日期"); setTimeout(() => location.reload(), 700); };
  (() => { const sv = $("moonSvg"); if (!sv) return; const g = $("moonG"), sh = $("moonShade"), lines = [...$("moonLines").querySelectorAll("path")]; let ang = 0, last = null, phase = 0;
    const pt = e => { const r = sv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * 320, (e.clientY - r.top) / r.height * 120]; };
    sv.addEventListener("pointerdown", e => { sv.setPointerCapture(e.pointerId); last = pt(e); });
    sv.addEventListener("pointermove", e => { const [x, y] = pt(e); if (last && Math.hypot(x - 250, y - 60) < 60) { const a0 = Math.atan2(last[1] - 60, last[0] - 250), a1 = Math.atan2(y - 60, x - 250); let d = a1 - a0; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; ang += d * 57.3; phase = (phase + d) % (Math.PI * 2); g.setAttribute("transform", `translate(250 60) rotate(${ang.toFixed(1)})`); const k = Math.cos(phase) * 30; sh.setAttribute("d", `M0 -30 A30 30 0 0 1 0 30 A${Math.abs(k).toFixed(1)} 30 0 0 ${k > 0 ? 0 : 1} 0 -30z`); if (Math.abs(d) > .12) { mus.pluck(Math.floor(((ang % 360) + 360) % 360 / 45), .03); buzz(4); } }
      lines.forEach((p, i) => { const y0 = 30 + i * 30, near = Math.max(0, 1 - Math.abs(y - y0) / 40); p.setAttribute("d", `M20 ${y0} Q${x.toFixed(0)} ${(y0 + (y - y0) * near * .9).toFixed(1)} 300 ${y0}`); });
      if (last) last = [x, y]; });
    const rel = () => { last = null; lines.forEach((p, i) => { const y0 = 30 + i * 30; p.animate([{ d: p.getAttribute("d") }, { d: `path("M20 ${y0} Q160 ${y0} 300 ${y0}")` }], { duration: 500, easing: "cubic-bezier(.2,1.4,.4,1)", fill: "forwards" }); }); };
    sv.addEventListener("pointerup", rel); sv.addEventListener("pointercancel", rel); sv.addEventListener("pointerleave", () => { if (!last) rel(); }); })();
  $("stBackup").onchange = async e => { const f = e.target.files && e.target.files[0]; if (!f) return; try { const { importTrip } = await import("../lib/backup.js"); const t = await importTrip(f); if (t) closeSheet(); } catch (err) { toast("没能导入：" + (err.message || "")); } };
  $("stXlsx").onchange = async e => { const f = e.target.files && e.target.files[0]; if (!f) return; try { const { parseTripXlsx, importInto } = await import("../lib/xlsx-import.js"); const n = await importInto(api, await parseTripXlsx(f)); toast(`导入了 ${n} 条`); closeSheet(); } catch (err) { toast("没能导入：" + err.message); } };
  api.recoveryCode().then(c => { const el = $("stCode"); if (el) el.textContent = c; }).catch(() => {});
  sh.querySelectorAll("[data-kick]").forEach(b => b.onclick = async () => { const m = api.members.find(x => x.id === b.dataset.kick); if (!await askConfirm(`把「${m ? m.name : ""}」从房间移除？`)) return; try { await api.removeMember(b.dataset.kick); toast("已移除"); closeSheet(); } catch (e) { toast("没能移除：" + e.message); } });
  import("../lib/push.js").then(async P => { const b = $("stPushBtn"); if (!b) return; const st = await P.pushState(); if (st === "on") { b.textContent = "推送已打开"; b.disabled = true; } else if (st === "unsupported") { b.textContent = "这台手机不支持（要先添加到主屏幕）"; b.disabled = true; } });
  bind(sh, { push: async () => { try { const P = await import("../lib/push.js"); await P.enablePush(); toast("推送打开了"); $("stPushBtn").textContent = "推送已打开"; $("stPushBtn").disabled = true; } catch (e) { toast(e.message === "DENIED" ? "你拒绝了通知，要去系统设置里打开" : e.message === "NO_KEY" ? "还没配置推送（看部署指南）" : "这台手机不支持：" + e.message); } },
    copycode: async () => { try { await navigator.clipboard.writeText($("stCode").textContent); toast("身份码已复制"); } catch (e) { toast($("stCode").textContent); } },
    reclaim: async () => { const c = ($("stReclaim").value || "").trim(); if (c.length < 6) return toast("身份码是 8 位"); if (!await askConfirm("确定用这个码找回？现在这个「新的人」会被合并进去。")) return; try { await api.reclaim(c); toast("找回来了，重新打开一下"); setTimeout(() => location.reload(), 900); } catch (e) { toast(e.message === "BAD_CODE" ? "这个码不对" : "没能找回：" + e.message); } },
    exp: () => import("../lib/backup.js").then(m => m.exportTrip(false)), expPh: () => import("../lib/backup.js").then(m => m.exportTrip(true)),
    close: closeSheet, trips: () => { closeSheet(); setTimeout(() => openTrips(), 250); },
    leave: async () => { if (!await askConfirm(t.kind === "solo" ? "删除这趟个人旅行的行程、清单和账本？（印章和照片会留在手账里）" : "离开这个旅行房间？你的印章和照片会留在手账里。")) return; try { await api.leaveTrip(); closeSheet(); toast("已离开"); } catch (e) { toast("没能离开：" + e.message); } },
    rename: async () => { const v = $("stName").value.trim(); if (!v) return; try { await api.rename(v); toast("改好了"); } catch (e) { toast("没能保存"); } },
    copy: async () => { try { await navigator.clipboard.writeText(t.code); toast("邀请码已复制"); } catch (e) { toast("邀请码：" + t.code); } },
    addComp: () => { const v = $("stComp").value.trim(); if (!v) return; api.setCompanions([...(api.members.filter(m => m.local).map(m => m.name)), v]); closeSheet(); openSettings(); },
    out: async () => { if (!await askConfirm(api.mode === "cloud" ? "退出后要用同一台设备才能回到这个账号（匿名登录）。确定？" : "会清空这台设备上的所有数据。确定？")) return; await api.signOut(); location.reload(); }
  });
}
