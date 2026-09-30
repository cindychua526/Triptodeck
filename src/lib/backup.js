/* 备份: the whole trip as one .json file — itinerary, checklist, ledger, your stamps, food tickets and journal.
   Keep it as a backup, or import it to bring the trip back (as a new trip) on another phone / account. */
import { api } from "./api.js";
import { toast } from "./ui.js";
const VER = 1;
const strip = (o, drop = []) => { const r = { ...o }; ["id", "trip_id", "created_at", "updated_at", ...drop].forEach(k => delete r[k]); return r; };
const toData = async u => { const b = await (await fetch(u)).blob(); return new Promise((ok, no) => { const f = new FileReader(); f.onload = () => ok(f.result); f.onerror = no; f.readAsDataURL(b); }); };
export async function exportTrip(withPhotos) {
  const t = api.trip; if (!t) return;
  toast(withPhotos ? "正在打包（含照片，会慢一点）…" : "正在打包…");
  const g = async (f, d = []) => { try { return (await f()) || d; } catch (e) { return d; } };
  const [acts, checks, exps, stamps, wallet, journal, customs] = await Promise.all([g(() => api.activities()), g(() => api.checklist()), g(() => api.expenses()), g(() => api.stamps()), g(() => api.wallet()), g(() => api.journal(), null), g(() => api.customItems())]);
  const mine = stamps.filter(s => s.trip_id === t.id);
  if (withPhotos) for (const s of mine) if (s.photo_path && !/^data:/.test(s.photo_path)) { try { s.photo_path = await toData(await api.photoUrl(s.photo_path)); } catch (e) {} }
  const out = { app: "trip-deck", v: VER, at: new Date().toISOString(), me: api.me && api.me.name, meId: api.me && api.me.id,
    trip: { name: t.name, start: t.start_date, end: t.end_date, budget: t.total_budget, kind: t.kind, cities: t.cities || [], budget_mode: t.budget_mode },
    activities: acts, checklist: checks, expenses: exps, stamps: mine,
    wallet: wallet.filter(w => w.trip_id === t.id), journal: journal ? { content: journal.content, mood: journal.mood } : null, custom: customs };
  if (!withPhotos) out.stamps = out.stamps.map(s => /^data:/.test(s.photo_path || "") ? s : { ...s, photo_path: null, _photo: !!s.photo_path });
  const blob = new Blob([JSON.stringify(out)], { type: "application/json" }), name = `${t.name}-手账备份-${new Date().toISOString().slice(0, 10)}.json`;
  const f = new File([blob], name, { type: "application/json" });
  try { if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: t.name }); return; } } catch (e) { if (e.name === "AbortError") return; }
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  toast(`导出了 ${out.activities.length} 个行程 · ${out.stamps.length} 枚章 · ${out.expenses.length} 笔账`);
}
export async function importTrip(file) {
  let d; try { d = JSON.parse(await file.text()); } catch (e) { return toast("这不是手账备份文件"); }
  if (!d || d.app !== "trip-deck" || !d.trip) return toast("这不是手账备份文件");
  toast("正在导入…");
  const T = d.trip, t = await api.createTrip({ name: T.name + "（导入）", start: T.start, end: T.end, budget: T.budget, kind: T.kind === "solo" ? "solo" : "group", cities: T.cities, template: "none" });
  /* the new trip gets a starter checklist: remove it when the backup has its own */
  if ((d.checklist || []).length) { try { for (const c of await api.checklist()) await api.deleteCheck(c.id); } catch (e) {} }
  let n = 0; const tryDo = async f => { try { await f(); n++; } catch (e) { console.warn(e); } };
  for (const a of d.activities || []) await tryDo(() => api.addActivity(strip(a, ["done_by"])));
  for (const c of d.checklist || []) await tryDo(async () => { await api.addCheck(c.category, c.label, c.sort || 0, !!c.private); });
  for (const e of (d.expenses || []).filter(e => !d.meId || (e.payer_id || e.user_id) === d.meId)) await tryDo(() => api.addExpense({ ...strip(e, ["participants", "payer_id", "user_id"]), ...(api.mode === "local" ? { user_id: api.me.id } : {}) }));
  for (const w of d.wallet || []) await tryDo(() => api.putWallet(strip(w, ["user_id"])));
  for (const c of d.custom || []) await tryDo(() => api.addCustom(strip(c, ["created_by"])));
  for (const s of d.stamps || []) await tryDo(async () => { const r = strip(s, ["user_id", "_photo", "reviewed_by"]); if (api.mode === "cloud" && /^data:/.test(r.photo_path || "")) { try { const b = await (await fetch(r.photo_path)).blob(); r.photo_path = await api.uploadPhoto(b); } catch (e) {} } await api.addStamp(r); });
  if (d.journal && d.journal.content) await tryDo(() => api.saveJournal(d.journal.content, d.journal.mood, t.id));
  if (T.budget_mode) { try { await api.updateBudget({ budget_mode: T.budget_mode }); } catch (e) {} }
  toast(`导入好了：${n} 条记录，已经切换到「${T.name}（导入）」`);
  return t;
}
