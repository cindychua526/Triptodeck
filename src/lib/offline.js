/* 离线: the synced (cloud) version keeps working with no signal.
   - every read keeps its last good answer on this phone, and gives it back when the network is gone
   - writes made offline wait in a queue (with your photos as data), are shown straight away, and are sent when you're back online
   The single-device (local) version never needs this. */
const QKEY = "td-offline-queue", CKEY = "td-cache:";
export const isNetErr = e => (typeof navigator !== "undefined" && navigator.onLine === false) || /Failed to fetch|NetworkError|Load failed|network|fetch|timed? ?out|ERR_INTERNET|ECONN/i.test(String((e && (e.message || e)) || ""));
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
const lsSet = (k, v) => { try { const s = JSON.stringify(v); if (s.length < 900000) localStorage.setItem(k, s); } catch (e) {} };
export const cacheGet = (k, d = null) => lsGet(CKEY + k, d);
export const cacheSet = (k, v) => lsSet(CKEY + k, v);
export const queue = () => lsGet(QKEY, []);
const setQueue = q => { lsSet(QKEY, q); try { document.dispatchEvent(new CustomEvent("td-queue", { detail: q.length })); } catch (e) {} };

const READS = ["activities", "checklist", "customItems", "expenses", "departures", "wallet", "stamps", "checkins", "sharedPhotos", "buddyWallet", "letters", "foodPhotos", "journal", "getFortune", "decisions", "deckTable", "myDraw", "effects", "log", "dayLines", "momentsOn"];
const WRITES = ["addActivity", "updateActivity", "deleteActivity", "addCheck", "setCheck", "deleteCheck", "renameCheck", "setCheckPrivate", "addCustom", "deleteCustom", "updateCustom",
  "addExpense", "updateExpense", "deleteExpense", "updateBudget", "putWallet", "removeWallet", "addLog", "saveDayLine", "addMoment", "addDecision", "updateDecision", "resolveEffect",
  "addFoodPhoto", "addSharedPhoto", "setCaption", "saveJournal", "savePet", "setDeparture", "submitCheckin", "addStamp", "sendLetter"];
const tmpId = () => "off-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
/* what a queued write looks like right away in the cached lists, so the screen doesn't jump back */
function patchCache(o, tid, m, a, meId) {
  const K = n => `${tid}:${n}:[]`, upd = (n, f) => { const v = cacheGet(K(n)); if (Array.isArray(v)) cacheSet(K(n), f(v)); };
  const now = new Date().toISOString();
  if (m === "addActivity") upd("activities", L => [...L, { status: "planned", extra_min: 0, spots: [], ...a[0], id: tmpId(), trip_id: tid }]);
  if (m === "updateActivity") upd("activities", L => L.map(x => x.id === a[0] ? { ...x, ...a[1] } : x));
  if (m === "deleteActivity") upd("activities", L => L.filter(x => x.id !== a[0]));
  if (m === "addCheck") upd("checklist", L => [...L, { id: tmpId(), trip_id: tid, category: a[0], label: a[1], sort: a[2], private: !!a[3], created_by: meId, done: false }]);
  if (m === "setCheck") upd("checklist", L => L.map(x => x.id === a[0] ? { ...x, done: a[1], done_by: a[1] ? meId : null, done_at: a[1] ? now : null } : x));
  if (m === "deleteCheck") upd("checklist", L => L.filter(x => x.id !== a[0]));
  if (m === "renameCheck") upd("checklist", L => L.map(x => x.id === a[0] ? { ...x, label: a[1] } : x));
  if (m === "addExpense") upd("expenses", L => [{ user_id: meId, shared: true, ...a[0], id: tmpId(), trip_id: tid, created_at: now }, ...L]);
  if (m === "updateExpense") upd("expenses", L => L.map(x => x.id === a[0] ? { ...x, ...a[1] } : x));
  if (m === "deleteExpense") upd("expenses", L => L.filter(x => x.id !== a[0]));
  if (m === "putWallet") upd("wallet", L => [...L.filter(x => x.spot_id !== a[0].spot_id), { ...a[0], trip_id: tid, created_at: now }]);
  if (m === "removeWallet") upd("wallet", L => L.filter(x => x.spot_id !== a[0]));
  if (m === "addLog") upd("log", L => [{ id: tmpId(), trip_id: tid, date: a[0], user_id: meId, card: a[1], action: a[2], effect: a[3], meta: a[4] || {}, created_at: now }, ...L]);
  if (m === "addCustom") upd("customItems", L => [...L, { ...a[0], id: tmpId(), trip_id: tid, created_by: meId, created_at: now }]);
  if (m === "resolveEffect") upd("effects", L => L.map(x => x.id === a[0] ? { ...x, resolved: true, detail: a[1] } : x));
  if (m === "submitCheckin") upd("checkins", L => [{ ...a[0], id: tmpId(), trip_id: tid, user_id: meId, status: "pending", created_at: now }, ...L]);
}
const TABLE = { addActivity: "activities", updateActivity: "activities", deleteActivity: "activities", addCheck: "checklist_items", setCheck: "checklist_items", deleteCheck: "checklist_items", renameCheck: "checklist_items", setCheckPrivate: "checklist_items",
  addCustom: "custom_items", deleteCustom: "custom_items", updateCustom: "custom_items", addExpense: "expenses", updateExpense: "expenses", deleteExpense: "expenses", updateBudget: "budget", putWallet: "wallet", removeWallet: "wallet",
  addLog: "skill_log", saveDayLine: "day_lines", addMoment: "moments", addDecision: "decisions", updateDecision: "decisions", resolveEffect: "skill_effects", addFoodPhoto: "food_photos", addSharedPhoto: "shared_photos",
  setCaption: "stamps", setDeparture: "departures", submitCheckin: "checkins", addStamp: "stamps", sendLetter: "letters" };
const toDataUrl = blob => new Promise((ok, no) => { try { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = no; r.readAsDataURL(blob); } catch (e) { no(e); } });
const offlineNow = () => typeof navigator !== "undefined" && navigator.onLine === false;
export function offlineWrap(o, ctx) {
  const tid = () => (ctx.trip() || {}).id || "none";
  const ORIG = {}; WRITES.forEach(m => { if (typeof o[m] === "function") ORIG[m] = o[m]; });
  const UP = {}; ["uploadShared", "uploadPhoto"].forEach(m => { UP[m] = o[m]; });
  READS.forEach(m => { const f = o[m]; if (typeof f !== "function") return;
    o[m] = async function (...args) { const key = `${tid()}:${m}:${JSON.stringify(args)}`;
      try { const r = await f.apply(o, args); cacheSet(key, r ?? null); return r; }
      catch (e) { if (!isNetErr(e)) throw e; const hit = cacheGet(key); if (hit !== null) return hit;
        return /^(journal|getFortune|myDraw)$/.test(m) ? null : []; } };
  });
  WRITES.forEach(m => { const f = ORIG[m]; if (!f) return;
    o[m] = async function (...args) {
      if (offlineNow()) return enqueue(m, args);
      try { return await f.apply(o, args); } catch (e) { if (isNetErr(e)) return enqueue(m, args); throw e; } };
  });
  /* photos taken offline stay on the phone as data, and are uploaded when the queue is sent */
  Object.keys(UP).forEach(m => { const f = UP[m]; if (typeof f !== "function") return;
    o[m] = async function (blob) { if (offlineNow()) return toDataUrl(blob); try { return await f.call(o, blob); } catch (e) { if (isNetErr(e)) return toDataUrl(blob); throw e; } }; });
  o.uploadCheckinPhoto = async function (blob) { const p = await o.uploadShared(blob); return /^data:/.test(p) ? p : "trip:" + p; };
  function enqueue(m, args) {
    const q = queue(); q.push({ m, args, trip: tid(), t: Date.now() }); setQueue(q);
    patchCache(o, tid(), m, args, ctx.me() && ctx.me().id);
    if (TABLE[m]) ctx.emit(TABLE[m]);
    if (m === "submitCheckin") return { ...args[0], id: tmpId(), status: "pending", offline: true };
    if (m === "addActivity" || m === "addStamp" || m === "addDecision") return { ...args[0], id: tmpId(), offline: true };
    return { offline: true };
  }
  const upData = async src => { const b = await (await fetch(src)).blob(); return UP.uploadShared.call(o, b); };
  let flushing = false;
  o.pending = () => queue().length;
  o.flushQueue = async function () {
    if (flushing || offlineNow()) return 0; const q = queue(); if (!q.length) return 0;
    flushing = true; const left = []; let sent = 0, stop = false;
    for (const it of q) {
      if (stop || it.trip !== tid()) { left.push(it); continue; }   // another trip's writes wait until that trip is open
      try {
        const a = it.args;
        if (it.m === "submitCheckin" && a[0] && /^data:/.test(a[0].photo_path || "")) a[0].photo_path = "trip:" + await upData(a[0].photo_path);
        if (it.m === "addFoodPhoto" && a[0] && /^data:/.test(a[0].photo_path || "")) a[0].photo_path = await upData(a[0].photo_path);
        if (it.m === "addSharedPhoto" && /^data:/.test(a[0] || "")) a[0] = await upData(a[0]);
        await ORIG[it.m].apply(o, a); sent++;
      } catch (e) { if (isNetErr(e)) { left.push(it); stop = true; } else console.warn("offline write dropped", it.m, e); }
    }
    setQueue(left); flushing = false;
    if (sent) { try { await o.refresh(); } catch (e) {} }
    return sent;
  };
  if (typeof window !== "undefined") { window.addEventListener("online", () => setTimeout(() => o.flushQueue(), 800)); setTimeout(() => o.flushQueue(), 4000); }
  return o;
}
