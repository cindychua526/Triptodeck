/* 大家的相册: photos anyone in the room shares, plus everyone's food photos. */
import { api, on, nameOf } from "../lib/api.js";
import { esc, shrinkImage, dataUrlToBlob, today, shortDate } from "../lib/util.js";
import { toast, askConfirm, askText } from "../lib/ui.js";
import { mus, sfx } from "../lib/sound.js";
import { lookChips, bindLookChips } from "../lib/look.js";
/* 点赞 · 评论: kept in the trip log (LIKE / UNLIKE / COMMENT with the photo id), so everyone in the room sees them */
let social = { like: {}, cmts: {} };
function buildSocial(logs) {
  const out = { like: {}, cmts: {} };
  logs.slice().sort((a, b) => String(a.created_at).localeCompare(String(b.created_at))).forEach(l => { const id = l.meta && l.meta.photo; if (!id) return;
    if (l.action === "LIKE") (out.like[id] = out.like[id] || new Set()).add(l.user_id);
    if (l.action === "UNLIKE") out.like[id] && out.like[id].delete(l.user_id);
    if (l.action === "COMMENT") (out.cmts[id] = out.cmts[id] || []).push(l); });
  return out;
}
const likesOf = id => social.like[id] || new Set();
const soc = id => { const n = likesOf(id).size, c = (social.cmts[id] || []).length; return n || c ? `<b class="shp-soc-n">${n ? "♥ " + n : ""}${n && c ? " · " : ""}${c ? "💬 " + c : ""}</b>` : ""; };
export async function openShared() {
  document.querySelector(".shp")?.remove();
  const ov = document.createElement("div"); ov.className = "shp"; ov.setAttribute("role", "dialog");
  const draw = async () => {
    let S = [], F = [], LG = []; try { [S, F, LG] = await Promise.all([api.sharedPhotos(), api.foodPhotos(), api.log().catch(() => [])]); } catch (e) {}
    social = buildSocial(LG);
    const all = [...S.map(p => ({ ...p, k: "s" })), ...F.map(p => ({ ...p, k: "f", label: p.food }))].sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.created_at).localeCompare(String(a.created_at)));
    const byDay = {}; all.forEach(p => (byDay[p.date] = byDay[p.date] || []).push(p));
    ov.innerHTML = `<button class="sc-x" aria-label="关闭">×</button><div class="shp-in"><small class="as-k">SHARED ALBUM</small><h2>大家的相册</h2><p class="as-hint">房间里每个人上传的照片都在这里，美食票里拍的也会自动进来。</p>
      <label class="btn ink shp-up">＋ 上传照片（可以一次选很多张）<input type="file" accept="image/*" multiple hidden id="shpIn"></label>${lookChips()}
      ${all.length ? "" : `<div class="empty-art"><svg viewBox="0 0 160 110" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M22 34l58-16 58 16v52l-58 16-58-16z" stroke-dasharray="4 4"/><rect x="48" y="38" width="34" height="30" rx="2" transform="rotate(-8 65 53)"/><rect x="80" y="40" width="34" height="30" rx="2" transform="rotate(7 97 55)"/><circle cx="97" cy="52" r="6"/><path d="M84 66l9-8 7 5 6-5 6 7"/><path d="M130 22l4-8M136 28l8-3M124 18l1-9"/></svg><b>还没有照片</b><p>试试：上传今天的第一张合照 · 去美食票拍一张吃的 · 打卡时顺手拍一张</p></div>`}
      ${Object.keys(byDay).sort().reverse().map(d => `<div class="shp-day"><b>${shortDate(d)}</b><div class="shp-grid">${byDay[d].map(p => `<button class="shp-ph pola" data-id="${p.id}" data-k="${p.k}" data-p="${esc(p.photo_path)}" style="--r:${(p.id.charCodeAt(p.id.length - 1) % 7) - 3}deg"><i></i><em>${esc(p.caption || p.label || "")}</em><span>${esc(nameOf(p.user_id))}</span>${soc(p.id)}</button>`).join("")}</div></div>`).join("") || `<p class="empty">还没有人分享。第一张会是谁？</p>`}</div>`;
    for (const b of ov.querySelectorAll(".shp-ph")) { const u = await api.sharedUrl(b.dataset.p); if (u && b.isConnected) b.querySelector("i").style.backgroundImage = `url("${u}")`; }
    ov.querySelector(".sc-x").onclick = close; bindLookChips(ov);
    ov.querySelector("#shpIn").onchange = async e => { const fs = [...(e.target.files || [])]; if (!fs.length) return; toast(`上传 ${fs.length} 张…`); let n = 0; for (const f of fs) { try { const small = await shrinkImage(f, api.mode === "local" ? 700 : 1600, .82); const path = api.mode === "local" ? small : await api.uploadShared(dataUrlToBlob(small)); await api.addSharedPhoto(path, null, today()); n++; } catch (err) {} } mus.harp(2, 5, .06); toast(`上传好了 ${n} 张，大家都看得到`); draw(); };
    ov.querySelectorAll(".shp-ph").forEach(b => b.onclick = () => view(all, all.findIndex(p => p.id === b.dataset.id)));
  };
  const view = async (all, i) => {
    const p = all[i]; if (!p) return; const u = await api.sharedUrl(p.photo_path); const mine = p.user_id === api.me.id;
    const v = document.createElement("div"); v.className = "shp-view"; v.innerHTML = `<img src="${u}" alt=""><div class="shp-bar"><span><b class="shp-cap">${esc(p.caption || p.label || "")}</b>${esc(nameOf(p.user_id))} · ${shortDate(p.date)}</span><div>${mine ? `<button data-a="cap">写一句</button>` : ""}${mine && p.k === "s" ? `<button data-a="del">删除</button>` : ""}<button data-a="save">存到手机</button><button data-a="x">关闭</button></div></div>
      <div class="shp-soc"><button class="shp-like" data-a="like" aria-pressed="false">♡ <span></span></button><div class="shp-cmts"></div><button class="shp-cmt-add" data-a="cmt">💬 写评论</button></div>`;
    ov.appendChild(v); sfx.flip();
    v.querySelector("[data-a=x]").onclick = () => v.remove();
    const paintSoc = () => { const L = likesOf(p.id), me = L.has(api.me.id), lb = v.querySelector("[data-a=like]"); lb.setAttribute("aria-pressed", me); lb.firstChild.textContent = me ? "♥ " : "♡ ";
      lb.querySelector("span").textContent = L.size ? `${L.size} · ${[...L].map(nameOf).join("、")}` : "赞一下";
      v.querySelector(".shp-cmts").innerHTML = (social.cmts[p.id] || []).map(c => `<p><b>${esc(nameOf(c.user_id))}</b>${esc(c.effect)}</p>`).join(""); };
    const like = async (force) => { const on = likesOf(p.id).has(api.me.id); if (force && on) return; const next = !on; try { await api.addLog(p.date || today(), null, next ? "LIKE" : "UNLIKE", "", { photo: p.id, owner: p.user_id }); } catch (e) { return toast("没能点赞"); }
      (social.like[p.id] = social.like[p.id] || new Set())[next ? "add" : "delete"](api.me.id); paintSoc(); if (next) { mus.chime(6, .03); heart(); } };
    const heart = () => { const h = document.createElement("i"); h.className = "shp-heart"; h.textContent = "♥"; v.appendChild(h); setTimeout(() => h.remove(), 900); };
    v.querySelector("[data-a=like]").onclick = () => like();
    v.querySelector("[data-a=cmt]").onclick = async () => { const t = await askText("写一句评论", ""); if (!t || !t.trim()) return; const row = { user_id: api.me.id, effect: t.trim().slice(0, 140) };
      try { await api.addLog(p.date || today(), null, "COMMENT", row.effect, { photo: p.id, owner: p.user_id }); (social.cmts[p.id] = social.cmts[p.id] || []).push(row); paintSoc(); mus.pluck(4, .03); } catch (e) { toast("没能发出去"); } };
    /* tap closes, double-tap likes */
    let tapT = 0; v.querySelector("img").onclick = () => { if (tapT) { clearTimeout(tapT); tapT = 0; like(true); return; } tapT = setTimeout(() => { tapT = 0; v.remove(); }, 280); };
    paintSoc();
    v.querySelector("[data-a=save]").onclick = async () => { try { const blob = await (await fetch(u)).blob(), f = new File([blob], `trip-${p.date}.jpg`, { type: blob.type || "image/jpeg" }); if (navigator.canShare && navigator.canShare({ files: [f] })) await navigator.share({ files: [f] }); else { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = f.name; a.click(); } } catch (e) {} };
    const cb = v.querySelector("[data-a=cap]"); if (cb) cb.onclick = async () => { const t = await askText("在这张照片下面写一句", p.caption || ""); if (t === null) return; try { await api.setCaption(p.k === "s" ? "shared" : "food", p.id, t.trim()); p.caption = t.trim(); v.querySelector(".shp-cap").textContent = p.caption || p.label || ""; mus.chime(4, .02); } catch (e) { toast("没能保存"); } };
    const d = v.querySelector("[data-a=del]"); if (d) d.onclick = async () => { if (!await askConfirm("删掉这张？大家都会看不到。")) return; try { await api.removeSharedPhoto(p.id); v.remove(); draw(); } catch (e) { toast("没能删"); } };
  };
  const close = () => { ov.classList.remove("on"); setTimeout(() => ov.remove(), 300); off && off(); };
  document.body.appendChild(ov); requestAnimationFrame(() => ov.classList.add("on")); sfx.paper(); await draw();
  const off = on("shared_photos", () => { if (ov.isConnected && !ov.querySelector(".shp-view")) draw(); });
}
