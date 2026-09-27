/* 大家的相册: photos anyone in the room shares, plus everyone's food photos. */
import { api, on, nameOf } from "../lib/api.js";
import { esc, shrinkImage, dataUrlToBlob, today, shortDate } from "../lib/util.js";
import { toast } from "../lib/ui.js";
import { mus, sfx } from "../lib/sound.js";
export async function openShared() {
  document.querySelector(".shp")?.remove();
  const ov = document.createElement("div"); ov.className = "shp"; ov.setAttribute("role", "dialog");
  const draw = async () => {
    let S = [], F = []; try { [S, F] = await Promise.all([api.sharedPhotos(), api.foodPhotos()]); } catch (e) {}
    const all = [...S.map(p => ({ ...p, k: "s" })), ...F.map(p => ({ ...p, k: "f", caption: p.food }))].sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.created_at).localeCompare(String(a.created_at)));
    const byDay = {}; all.forEach(p => (byDay[p.date] = byDay[p.date] || []).push(p));
    ov.innerHTML = `<button class="sc-x" aria-label="关闭">×</button><div class="shp-in"><small class="as-k">SHARED ALBUM</small><h2>大家的相册</h2><p class="as-hint">房间里每个人上传的照片都在这里，美食票里拍的也会自动进来。</p>
      <label class="btn ink shp-up">＋ 上传照片（可以一次选很多张）<input type="file" accept="image/*" multiple hidden id="shpIn"></label>
      ${Object.keys(byDay).sort().reverse().map(d => `<div class="shp-day"><b>${shortDate(d)}</b><div class="shp-grid">${byDay[d].map(p => `<button class="shp-ph" data-id="${p.id}" data-k="${p.k}" data-p="${esc(p.photo_path)}"><i></i><span>${esc(nameOf(p.user_id))}${p.caption ? " · " + esc(p.caption) : ""}</span></button>`).join("")}</div></div>`).join("") || `<p class="empty">还没有人分享。第一张会是谁？</p>`}</div>`;
    for (const b of ov.querySelectorAll(".shp-ph")) { const u = await api.sharedUrl(b.dataset.p); if (u && b.isConnected) b.querySelector("i").style.backgroundImage = `url("${u}")`; }
    ov.querySelector(".sc-x").onclick = close;
    ov.querySelector("#shpIn").onchange = async e => { const fs = [...(e.target.files || [])]; if (!fs.length) return; toast(`上传 ${fs.length} 张…`); let n = 0; for (const f of fs) { try { const small = await shrinkImage(f, api.mode === "local" ? 700 : 1600, .82); const path = api.mode === "local" ? small : await api.uploadShared(dataUrlToBlob(small)); await api.addSharedPhoto(path, null, today()); n++; } catch (err) {} } mus.harp(2, 5, .06); toast(`上传好了 ${n} 张，大家都看得到`); draw(); };
    ov.querySelectorAll(".shp-ph").forEach(b => b.onclick = () => view(all, all.findIndex(p => p.id === b.dataset.id)));
  };
  const view = async (all, i) => {
    const p = all[i]; if (!p) return; const u = await api.sharedUrl(p.photo_path); const mine = p.user_id === api.me.id;
    const v = document.createElement("div"); v.className = "shp-view"; v.innerHTML = `<img src="${u}" alt=""><div class="shp-bar"><span>${esc(nameOf(p.user_id))} · ${shortDate(p.date)}${p.caption ? " · " + esc(p.caption) : ""}</span><div>${mine && p.k === "s" ? `<button data-a="del">删除</button>` : ""}<button data-a="save">存到手机</button><button data-a="x">关闭</button></div></div>`;
    ov.appendChild(v); sfx.flip();
    v.querySelector("[data-a=x]").onclick = () => v.remove(); v.querySelector("img").onclick = () => v.remove();
    v.querySelector("[data-a=save]").onclick = async () => { try { const blob = await (await fetch(u)).blob(), f = new File([blob], `trip-${p.date}.jpg`, { type: blob.type || "image/jpeg" }); if (navigator.canShare && navigator.canShare({ files: [f] })) await navigator.share({ files: [f] }); else { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = f.name; a.click(); } } catch (e) {} };
    const d = v.querySelector("[data-a=del]"); if (d) d.onclick = async () => { if (!confirm("删掉这张？大家都会看不到。")) return; try { await api.removeSharedPhoto(p.id); v.remove(); draw(); } catch (e) { toast("没能删"); } };
  };
  const close = () => { ov.classList.remove("on"); setTimeout(() => ov.remove(), 300); off && off(); };
  document.body.appendChild(ov); requestAnimationFrame(() => ov.classList.add("on")); sfx.paper(); await draw();
  const off = on("shared_photos", () => { if (ov.isConnected && !ov.querySelector(".shp-view")) draw(); });
}
