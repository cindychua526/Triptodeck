/* 离线: the synced (cloud) version keeps working with no signal.
   - every read keeps its last good answer on this phone, and gives it back when the network is gone
   - writes made offline wait in a queue, show on screen straight away, and are sent (in order) when the network is back
   - photos taken offline are kept in IndexedDB (not in the queue), and uploaded before the write that uses them
   - things made offline get a temporary id; editing or deleting them later is matched up to the real row when sent
   The single-device (local) version never needs this. */
const QKEY = "td-offline-queue", CKEY = "td-cache:";
export const isNetErr = e => (typeof navigator !== "undefined" && navigator.onLine === false) || /Failed to fetch|NetworkError|Load failed|network|fetch|timed? ?out|ERR_INTERNET|ECONN/i.test(String((e && (e.message || e)) || ""));
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
const lsSet = (k, v) => { try { const s = JSON.stringify(v); if (s.length > 1800000) return false; localStorage.setItem(k, s); return true; } catch (e) { return false; } };
export const cacheGet = (k, d = null) => lsGet(CKEY + k, d);
export const cacheSet = (k, v) => lsSet(CKEY + k, v);
export const queue = () => lsGet(QKEY, []);
const ping = n => { try { document.dispatchEvent(new CustomEvent("td-queue", { detail: n })); } catch (e) {} };
const setQueue = q => { const ok = lsSet(QKEY, q); ping(q.length); if (!ok) { try { document.dispatchEvent(new CustomEvent("td-queue-full")); } catch (e) {} } return ok; };

/* ---- photos: IndexedDB, so a few pictures can't fill up the queue ---- */
let dbp = null;
const idb = () => dbp || (dbp = new Promise((ok, no) => { try { const r = indexedDB.open("td-offline", 1); r.onupgradeneeded = () => r.result.createObjectStore("blobs"); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); } catch (e) { no(e); } }));
const idbDo = (mode, f) => idb().then(db => new Promise((ok, no) => { const tx = db.transaction("blobs", mode), st = tx.objectStore("blobs"), r = f(st); tx.oncomplete = () => ok(r && r.result); tx.onerror = () => no(tx.error); }));
const putBlob = async data => { const k = "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); try { await idbDo("readwrite", st => st.put(data, k)); return "idb:" + k; } catch (e) { return data; } };
const getBlob = k => idbDo("readonly", st => st.get(k.slice(4)));
const delBlob = k => idbDo("readwrite", st => st.delete(k.slice(4))).catch(() => {});

const READS = ["activities", "checklist", "customItems", "expenses", "departures", "wallet", "stamps", "checkins", "sharedPhotos", "buddyWallet", "letters", "foodPhotos", "journal", "getFortune", "decisions", "deckTable", "myDraw", "effects", "log", "dayLines", "momentsOn", "photoSocial"];
const WRITES = ["addActivity", "updateActivity", "deleteActivity", "addCheck", "setCheck", "deleteCheck", "renameCheck", "setCheckPrivate", "addCustom", "deleteCustom", "updateCustom",
  "addExpense", "updateExpense", "deleteExpense", "updateBudget", "putWallet", "removeWallet", "addLog", "saveDayLine", "addMoment", "addDecision", "updateDecision", "resolveEffect",
  "addFoodPhoto", "addSharedPhoto", "setCaption", "saveJournal", "savePet", "setDeparture", "submitCheckin", "guaranteeCheckin", "addStamp", "sendLetter", "setLike", "addComment"];
/* adders whose new row gets a temporary id until it reaches the server */
const ADDS = new Set(["addActivity", "addCheck", "addCustom", "addExpense", "addDecision", "addStamp", "submitCheckin", "addLog"]);
const DELS = new Set(["deleteActivity", "deleteCheck", "deleteCustom", "deleteExpense"]);
/* where each write keeps its photo: read / write the path */
const PHOTO = {
  submitCheckin: [a => a[0] && a[0].photo_path, (a, v) => { a[0].photo_path = v; }, true],
  addFoodPhoto: [a => a[0] && a[0].photo_path, (a, v) => { a[0].photo_path = v; }],
  setDeparture: [a => a[0] && a[0].photo_path, (a, v) => { a[0].photo_path = v; }],
  addSharedPhoto: [a => a[0], (a, v) => { a[0] = v; }]
};
const tmpId = () => "off-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const isTmp = v => typeof v === "string" && v.startsWith("off-");

/* what a queued write looks like right away in the cached lists, so the screen doesn't jump back (safe to run twice) */
function patchCache(tid, it, meId) {
  const { m, args: a, tmp } = it, now = new Date(it.t || Date.now()).toISOString();
  const K = (n, args = []) => `${tid}:${n}:${JSON.stringify(args)}`;
  const upd = (n, f, args) => { const k = K(n, args), v = cacheGet(k); if (Array.isArray(v)) cacheSet(k, f(v)); };
  const add = (n, row, front, args) => upd(n, L => { const rest = L.filter(x => x.id !== row.id); return front ? [row, ...rest] : [...rest, row]; }, args);
  const photo = PHOTO[m] ? PHOTO[m][0](a) : null, shown = photo && photo.startsWith("idb:") ? it.preview || null : photo;
  if (m === "addActivity") add("activities", { status: "planned", extra_min: 0, spots: [], ...a[0], id: tmp, trip_id: tid });
  if (m === "updateActivity") upd("activities", L => L.map(x => x.id === a[0] ? { ...x, ...a[1] } : x));
  if (m === "deleteActivity") upd("activities", L => L.filter(x => x.id !== a[0]));
  if (m === "addCheck") add("checklist", { id: tmp, trip_id: tid, category: a[0], label: a[1], sort: a[2], private: !!a[3], created_by: meId, done: false, created_at: now });
  if (m === "setCheck") upd("checklist", L => L.map(x => x.id === a[0] ? { ...x, done: a[1], done_by: a[1] ? meId : null, done_at: a[1] ? now : null } : x));
  if (m === "deleteCheck") upd("checklist", L => L.filter(x => x.id !== a[0]));
  if (m === "renameCheck") upd("checklist", L => L.map(x => x.id === a[0] ? { ...x, label: a[1] } : x));
  if (m === "setCheckPrivate") upd("checklist", L => L.map(x => x.id === a[0] ? { ...x, private: !!a[1] } : x));
  if (m === "addExpense") add("expenses", { user_id: meId, shared: true, ...a[0], id: tmp, trip_id: tid, created_at: now }, true);
  if (m === "updateExpense") upd("expenses", L => L.map(x => x.id === a[0] ? { ...x, ...a[1] } : x));
  if (m === "deleteExpense") upd("expenses", L => L.filter(x => x.id !== a[0]));
  if (m === "addCustom") add("customItems", { ...a[0], id: tmp, trip_id: tid, created_by: meId, created_at: now });
  if (m === "updateCustom") upd("customItems", L => L.map(x => x.id === a[0] ? { ...x, ...a[1] } : x));
  if (m === "deleteCustom") upd("customItems", L => L.filter(x => x.id !== a[0]));
  if (m === "putWallet") upd("wallet", L => [...L.filter(x => x.spot_id !== a[0].spot_id), { ...a[0], user_id: meId, trip_id: tid, created_at: now }]);
  if (m === "removeWallet") upd("wallet", L => L.filter(x => x.spot_id !== a[0]));
  if (m === "addLog") add("log", { id: tmp, trip_id: tid, date: a[0], user_id: meId, card: a[1], action: a[2], effect: a[3], meta: a[4] || {}, created_at: now }, true);
  if (m === "resolveEffect") upd("effects", L => L.map(x => x.id === a[0] ? { ...x, resolved: true, detail: a[1] } : x));
  if (m === "submitCheckin") add("checkins", { ...a[0], photo_path: shown, id: tmp, trip_id: tid, user_id: meId, status: "pending", created_at: now }, true);
  if (m === "submitCheckin" && it.solo) add("stamps", { id: tmp + "s", kind: a[0].kind || "place", key: a[0].name, name: a[0].name, city: a[0].city, date: a[0].date, photo_path: shown, verified: true, user_id: meId, trip_id: tid, created_at: now });
  if (m === "guaranteeCheckin") upd("checkins", L => L.map(x => x.id === a[0] ? { ...x, status: "approved" } : x));
  if (m === "addStamp") add("stamps", { ...a[0], id: tmp, user_id: meId, trip_id: tid, created_at: now });
  if (m === "addSharedPhoto") add("sharedPhotos", { id: tmp, trip_id: tid, user_id: meId, photo_path: shown, caption: a[1] || null, date: a[2] || now.slice(0, 10), created_at: now }, true);
  if (m === "addFoodPhoto") add("foodPhotos", { ...a[0], photo_path: shown, id: tmp, trip_id: tid, user_id: meId, created_at: now });
  if (m === "setDeparture") upd("departures", L => [...L.filter(x => x.user_id !== meId), { ...a[0], photo_path: shown, trip_id: tid, user_id: meId }]);
  if (m === "saveDayLine") upd("dayLines", L => [...L.filter(x => x.user_id !== meId), { trip_id: tid, user_id: meId, date: a[0], text: a[1], mood: a[2] }], [a[0]]);
  if (m === "addMoment") add("momentsOn", { id: tmp, trip_id: tid, date: a[0], note: a[1], lat: a[2], lng: a[3], created_at: now }, false, [a[0]]);
  if (m === "addDecision") add("decisions", { ...a[0], id: tmp, trip_id: tid, created_at: now }, true);
  if (m === "updateDecision") upd("decisions", L => L.map(x => x.id === a[0] ? { ...x, ...a[1] } : x));
  if (m === "setLike") upd("photoSocial", L => { const rest = L.filter(x => !(x.photo_id === a[0] && x.user_id === meId && x.kind === "like")); return a[2] ? [...rest, { id: it.id, trip_id: tid, photo_id: a[0], owner_id: a[1], user_id: meId, kind: "like", created_at: now }] : rest; });
  if (m === "addComment") add("photoSocial", { id: it.id, trip_id: tid, photo_id: a[0], owner_id: a[1], user_id: meId, kind: "comment", body: a[2], created_at: now });
  if (m === "saveJournal") { const t2 = a[2] || tid, row = { trip_id: t2, user_id: meId, content: a[0], mood: a[1] || null, updated_at: now };
    [[], [t2], [null]].forEach(args => cacheSet(K("journal", args), { ...(cacheGet(K("journal", args)) || {}), ...row })); }
}
const TABLE = { addActivity: "activities", updateActivity: "activities", deleteActivity: "activities", addCheck: "checklist_items", setCheck: "checklist_items", deleteCheck: "checklist_items", renameCheck: "checklist_items", setCheckPrivate: "checklist_items",
  addCustom: "custom_items", deleteCustom: "custom_items", updateCustom: "custom_items", addExpense: "expenses", updateExpense: "expenses", deleteExpense: "expenses", updateBudget: "budget", putWallet: "wallet", removeWallet: "wallet",
  addLog: "skill_log", saveDayLine: "day_lines", addMoment: "moments", addDecision: "decisions", updateDecision: "decisions", resolveEffect: "skill_effects", addFoodPhoto: "food_photos", addSharedPhoto: "shared_photos",
  setCaption: "stamps", setLike: "photo_social", addComment: "photo_social", setDeparture: "departures", submitCheckin: "checkins", guaranteeCheckin: "checkins", addStamp: "stamps", sendLetter: "letters" };
const toDataUrl = blob => new Promise((ok, no) => { try { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = no; r.readAsDataURL(blob); } catch (e) { no(e); } });
const offlineNow = () => typeof navigator !== "undefined" && navigator.onLine === false;

export function offlineWrap(o, ctx) {
  const tid = () => (ctx.trip() || {}).id || "none", meId = () => ctx.me() && ctx.me().id;
  const ORIG = {}; WRITES.forEach(m => { if (typeof o[m] === "function") ORIG[m] = o[m]; });
  const UP = { uploadShared: o.uploadShared, uploadPhoto: o.uploadPhoto }, refresh0 = o.refresh;
  const mine = () => queue().filter(it => it.trip === tid());
  READS.forEach(m => { const f = o[m]; if (typeof f !== "function") return;
    o[m] = async function (...args) { const key = `${tid()}:${m}:${JSON.stringify(args)}`;
      try { const r = await f.apply(o, args); cacheSet(key, r ?? null);
        /* still waiting to send something? show it on top of what the server said */
        const q = mine(); if (q.length && r != null) { q.forEach(it => patchCache(tid(), it, meId())); const v = cacheGet(key); if (v != null) return v; }
        return r; }
      catch (e) { if (!isNetErr(e)) throw e; const hit = cacheGet(key); if (hit !== null) return hit;
        return /^(journal|getFortune|myDraw)$/.test(m) ? null : []; } };
  });
  /* an upload that fails for lack of signal hands back the photo as data, so the write can wait in the queue */
  Object.keys(UP).forEach(m => { const f = UP[m]; if (typeof f !== "function") return;
    o[m] = async function (blob) { if (offlineNow()) return toDataUrl(blob); try { return await f.call(o, blob); } catch (e) { if (isNetErr(e)) return toDataUrl(blob); throw e; } }; });
  o.uploadCheckinPhoto = async function (blob) { const p = await o.uploadShared(blob); return /^data:/.test(p) ? p : "trip:" + p; };
  /* photo still on the phone (data: or idb:)? upload it now; throws a network error if there's still no signal */
  async function uploadPhotoOf(m, a) {
    const P = PHOTO[m]; if (!P) return; const v = P[0](a); if (typeof v !== "string" || !/^(data|idb):/.test(v)) return;
    const data = v.startsWith("idb:") ? await getBlob(v) : v; if (!data) { P[1](a, null); return; }
    const path = await UP.uploadShared.call(o, await (await fetch(data)).blob());
    P[1](a, P[2] ? "trip:" + path : path); if (v.startsWith("idb:")) delBlob(v);
  }
  WRITES.forEach(m => { const f = ORIG[m]; if (!f) return;
    o[m] = async function (...args) {
      /* no signal, a temporary id, or older writes still waiting: go through the queue so everything is sent in order */
      if (offlineNow() || isTmp(args[0]) || mine().length) { const r = await enqueue(m, args); if (!offlineNow()) setTimeout(() => o.flushQueue(), 60); return r; }
      try { await uploadPhotoOf(m, args); return await f.apply(o, args); }
      catch (e) { if (isNetErr(e)) return enqueue(m, args); throw e; } };
  });
  async function enqueue(m, args) {
    let q = queue(); const t = tid();
    /* deleting something that was only ever made offline: just forget it (and everything queued for it) */
    if (DELS.has(m) && isTmp(args[0])) { const gone = q.filter(it => it.tmp === args[0] || it.args[0] === args[0]); q = q.filter(it => !gone.includes(it)); setQueue(q);
      patchCache(t, { m, args, t: Date.now() }, meId()); if (TABLE[m]) ctx.emit(TABLE[m]); return { offline: true }; }
    const it = { id: tmpId(), m, args, trip: t, t: Date.now(), tmp: ADDS.has(m) ? tmpId() : null };
    if (m === "submitCheckin") { const tr = ctx.trip() || {}; it.solo = tr.kind === "solo" || (ctx.members ? ctx.members().length < 2 : false); }
    const P = PHOTO[m], ph = P && P[0](args);
    if (typeof ph === "string" && ph.startsWith("data:")) { it.preview = ph.length < 200000 ? ph : null; P[1](it.args, await putBlob(ph)); }
    q = queue(); q.push(it); setQueue(q);
    patchCache(t, it, meId()); if (TABLE[m]) ctx.emit(TABLE[m]);
    if (m === "submitCheckin") return { ...args[0], id: it.tmp, status: it.solo ? "approved" : "pending", offline: true };
    if (it.tmp) return { ...(typeof args[0] === "object" ? args[0] : {}), id: it.tmp, offline: true };
    return { offline: true };
  }
  let flushing = false;
  o.pending = () => queue().length;
  o.flushQueue = async function () {
    if (flushing || offlineNow() || !mine().length) return 0;
    flushing = true; let sent = 0;
    try {
      for (;;) {
        const it = mine()[0]; if (!it) break;
        const a = it.args; let res, drop = false;
        try { await uploadPhotoOf(it.m, a); res = await ORIG[it.m].apply(o, a); sent++; }
        catch (e) { if (isNetErr(e)) break; drop = true; console.warn("offline write dropped", it.m, e); }
        /* take it off the queue (re-read: new writes may have arrived meanwhile) and swap its temporary id for the real one */
        const realId = !drop && it.tmp && res && typeof res === "object" && res.id ? res.id : null;
        const q = queue().filter(x => x.id !== it.id).map(x => { if (!it.tmp || x.trip !== it.trip) return x;
          if (drop) return x.args[0] === it.tmp ? null : x;
          if (realId && x.args[0] === it.tmp) return { ...x, args: [realId, ...x.args.slice(1)] }; return x; }).filter(Boolean);
        setQueue(q);
      }
    } finally { flushing = false; }
    if (sent && refresh0) { try { await refresh0.call(o); } catch (e) {} }
    return sent;
  };
  o.refresh = async function (...a) { const r = refresh0 ? await refresh0.apply(o, a) : undefined; o.flushQueue(); return r; };
  if (typeof window !== "undefined") {
    window.addEventListener("online", () => setTimeout(() => o.flushQueue(), 800));
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") setTimeout(() => o.flushQueue(), 600); });
    setInterval(() => { if (queue().length) o.flushQueue(); }, 45000);
    setTimeout(() => o.flushQueue(), 4000);
  }
  return o;
}
