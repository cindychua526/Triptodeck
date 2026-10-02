/* Trip Deck · sync layer (v4: every book is its own room)
   - Works fully offline: everything is kept on this phone (localStorage + IndexedDB for photos and voice).
   - With Supabase (read automatically from Netlify's VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY):
     your bookshelf = every room you belong to; each book's shared data lives in that room's trip_state,
     your private data for that book lives in member_state. Changes from travel buddies are merged, not overwritten. */
const C = window.TD_CONFIG || {};
const LSK = "td3:";
const st = { k:"off", t:"只存在这台手机（没有连数据库）" };
let readyRes = null; window.TD_SYNC = { status: st, ready: new Promise(r => { readyRes = r; }) };
function setStatus(k, t){ st.k = k; st.t = t; const el = document.getElementById("syncstat"); if(el){ el.textContent = t; const d = el.parentElement.querySelector(".syncdot"); d && (d.className = "syncdot " + k); } }
const fill = (arr, v) => { if(Array.isArray(v)){ arr.length = 0; arr.push(...v); } };
const rid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const clone = o => JSON.parse(JSON.stringify(o));
const idb = { db:null, open(){ return this.db || (this.db = new Promise((res, rej) => { const r = indexedDB.open("td3", 1); r.onupgradeneeded = () => r.result.createObjectStore("blobs"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); })); },
  async put(k, b){ const d = await this.open(); return new Promise((res, rej) => { const t = d.transaction("blobs", "readwrite"); t.objectStore("blobs").put(b, k); t.oncomplete = res; t.onerror = () => rej(t.error); }); },
  async get(k){ const d = await this.open(); return new Promise((res, rej) => { const r = d.transaction("blobs").objectStore("blobs").get(k); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); } };

/* ---- photos & voice: blob: urls are made durable (IndexedDB locally, Storage when a room exists) ---- */
const REF = {};            // blob url -> durable ref ("idb:key" or https url)
const LIVE = {};           // durable "idb:key" -> blob url (for showing)
const isBlob = u => typeof u === "string" && u.startsWith("blob:");
function walk(v, fn, d = 0){ if(d > 14 || v == null) return v; if(typeof v === "string") return fn(v); if(Array.isArray(v)){ for(let i = 0; i < v.length; i++) v[i] = walk(v[i], fn, d + 1); return v; } if(typeof v === "object" && !(v instanceof Set)){ for(const k of Object.keys(v)) v[k] = walk(v[k], fn, d + 1); } return v; }
const toDurable = o => walk(clone(o), s => isBlob(s) ? (REF[s] || "") : s);
async function toLive(o){ const keys = new Set(); walk(o, s => { if(typeof s === "string" && s.startsWith("idb:") && !LIVE[s]) keys.add(s); return s; });
  for(const k of keys){ try{ const b = await idb.get(k.slice(4)); if(b){ const u = URL.createObjectURL(b); LIVE[k] = u; REF[u] = k; } }catch(e){} }
  return walk(o, s => typeof s === "string" && s.startsWith("idb:") ? (LIVE[s] || s) : s); }
async function storeBlob(url, room){ const blob = await (await fetch(url)).blob(); const ext = ((blob.type.split("/")[1] || "bin").replace("jpeg", "jpg").split(";")[0]);
  if(remote && room){ const path = `${room}/${remote.uid}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`; const r = await remote.sb.storage.from("media").upload(path, blob, { contentType: blob.type, upsert:false }); if(!r.error) return remote.sb.storage.from("media").getPublicUrl(path).data.publicUrl; }
  const key = `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; await idb.put(key, blob); LIVE["idb:" + key] = url; return "idb:" + key; }
async function flushBlobs(obj, room){ const urls = new Set(); walk(obj, s => { if(isBlob(s) && !REF[s]) urls.add(s); return s; }); for(const u of urls){ try{ REF[u] = await storeBlob(u, room); }catch(e){} } }
async function upgradeIdbRefs(book){ if(!remote || !book.room) return; const st = book.state; if(!st) return; const refs = new Set(); walk(st, s => { if(typeof s === "string" && s.startsWith("idb:")) refs.add(s); return s; }); }

/* ---- the bookshelf as data ---- */
const needsPush = (remoteB, merged) => { const k = x => JSON.stringify([(x.state && x.state.exp || []).map(e => e.id || e.t).sort(), (x.state && x.state.checkins || []).map(c => c.id || c.title).sort(), (x.state && x.state.album || []).map(a => a[0]).sort(), (x.state && x.state.del || []).slice().sort()]); return k(remoteB) !== k(merged); };
const djb = s => { let h = 5381; for(let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36); };
function serBook(b){ const o = { ...b }; delete o.cur; delete o._fresh; return toDurable(o); }
function privData(){ return { privBy: S.privBy, me:S.me || "", avatar:S.avatar || "", keeps:S.keeps, tipsSeen: !!S.tipsSeen, fortune:S.fortune, secretDone:S.secretDone, stepsByDay:S.steps, sets:SETS }; }
function applyPrivData(o){ if(!o) return; if(window.TD_SAFE) window.TD_SAFE(o); if(o.privBy) S.privBy = { ...(S.privBy || {}), ...o.privBy }; if(o.me && !S.me) S.me = o.me; if(o.avatar){ S.avatar = o.avatar; if(FRIENDS[0]) FRIENDS[0][2] = o.avatar; } if(o.keeps) S.keeps = o.keeps; if(o.tipsSeen) S.tipsSeen = true; if(o.fortune) S.fortune = o.fortune; if(o.secretDone) S.secretDone = o.secretDone; if(o.stepsByDay) S.steps = { ...(S.steps || {}), ...o.stepsByDay }; if(o.sets) Object.assign(SETS, o.sets); }
/* merge a book from the room with the one on this phone: lists are combined, nothing a buddy added is lost */
const keyOf = { album: r => Array.isArray(r) ? r[0] : r, checkins: c => c.id || [c.title, c.date, c.at].join("|"), exp: e => e.id || [e.t, e.at, e.rm, e.who].join("|"), decisions: d => [d.q, d.at, d.who, d.r].join("|"), feed: f => [f.t, f.s].join("|") };
function mergeList(a = [], b = [], key, del = []){ const out = [], seen = new Map(); const dead = new Set(del);
  for(const x of [...a, ...b]){ const k = key(x); if(!k || dead.has(k)) continue; if(!seen.has(k)){ seen.set(k, out.length); out.push(x); } else { const i = seen.get(k), y = out[i]; if((x && x.u || 0) > (y && y.u || 0)) out[i] = x; } } return out; }
function mergeBook(remoteB, localB){ if(!remoteB) return localB; if(!localB) return remoteB;
  const newer = (remoteB.rev || 0) > (localB.rev || 0) ? remoteB : localB, m = { ...newer, room: localB.room || remoteB.room, cur: localB.cur };
  const a = remoteB.state || {}, b = localB.state || {}, del = [...new Set([...(a.del || []), ...(b.del || [])])];
  m.state = { ...a, ...b, del,
    album: mergeList(b.album, a.album, keyOf.album), checkins: mergeList(b.checkins, a.checkins, keyOf.checkins, del), exp: mergeList(b.exp, a.exp, keyOf.exp, del),
    decisions: mergeList(b.decisions, a.decisions, keyOf.decisions), feed: mergeList(b.feed, a.feed, keyOf.feed).slice(0, 60),
    cmts: (() => { const o = { ...(a.cmts || {}) }; for(const [k, L] of Object.entries(b.cmts || {})) o[k] = mergeList(L, o[k] || [], c => c.join("|")); return o; })(),
    games: typeof mergeGames === "function" ? mergeGames(a.games, b.games) : (b.games || a.games) };
  m.rev = Math.max(remoteB.rev || 0, localB.rev || 0); return m; }
/* ---- local save ---- */
let timer = 0, saving = false, lastLocal = "";
function stashCur(){ if(window.TD_STASH) window.TD_STASH(); }
function saveLocal(){ if(window.TD_RESTORING) return; stashCur(); const data = JSON.stringify({ v:4, cur:S.curBook || null, books: BOOKS2.map(serBook) }); if(data !== lastLocal){ try{ localStorage.setItem(LSK + "books", data); localStorage.setItem(LSK + "priv", JSON.stringify(toDurable(privData()))); lastLocal = data; }catch(e){ console.warn("local save", e); } } }
async function save(){ if(saving || window.TD_RESTORING) return; saving = true;
  try{ stashCur(); for(const b of BOOKS2) await flushBlobs(b, b.room); await flushBlobs(privData(), null); saveLocal(); if(remote) await pushRooms(); }
  catch(e){ console.warn(e); setStatus(remote ? "err" : "off", remote ? "同步失败，先存在手机里：" + (e.message || e) : st.t); }
  saving = false; }
function schedule(){ clearTimeout(timer); timer = setTimeout(save, 900); }
["click", "change", "input", "keyup", "pointerup"].forEach(ev => document.addEventListener(ev, schedule, true));
window.addEventListener("pagehide", () => { try{ saveLocal(); }catch(e){} });
/* ---- load from this phone (also upgrades data saved by earlier versions) ---- */
async function loadLocal(){ try{
    let data = JSON.parse(localStorage.getItem(LSK + "books") || "null"); const pv = JSON.parse(localStorage.getItem(LSK + "priv") || "null");
    if(!data){ const old = JSON.parse(localStorage.getItem(LSK + "shared") || "null"); if(old && old.books){ data = { v:4, cur:old.cur, books:old.books }; const cb = data.books.find(b => b.id === old.cur) || data.books[0];
        if(cb && !cb.state) cb.state = { album:old.album || [], cmts:old.cmts || {}, exp:old.exp || [], checkins:old.checkins || [], decisions:old.decisions || [], games:old.games, feed:old.feed || [] }; } }
    if(pv) applyPrivData(await toLive(pv));
    if(data && data.books){ const books = await toLive(data.books); if(window.TD_SAFE) window.TD_SAFE(books); fill(BOOKS2, books); if(data.cur) S.curBook = data.cur; }
    lastLocal = ""; bootTrip(); }catch(e){ console.warn("local load", e); bootTrip(); } }

/* ---- Supabase ---- */
let remote = null, chan = null;
const pushedHash = {};
async function pushRooms(){ const sb = remote.sb, uid = remote.uid;
  for(const b of BOOKS2){
    if(!b.room){ const T = b.trip || {}; const r = await sb.rpc("create_trip", { p_name: (T.name || b.t || "旅行手账").slice(0, 60), p_start: T.start || null, p_end: T.end || null, p_budget: T.budget || 4000, p_kind:"group", p_cities: [], p_template:null });
      if(r.error){ setStatus("err", "建房间失败：" + r.error.message); continue; } b.room = r.data.id; b.code = r.data.code; if(b.cur) setRoom(r.data); }
    const ser = serBook(b), h = djb(JSON.stringify(ser)); if(pushedHash[b.id] === h) continue;
    const cur = await sb.from("trip_state").select("state").eq("trip_id", b.room).maybeSingle();
    let out = ser; if(cur.data && cur.data.state && cur.data.state.book){ const rb = await toLive(cur.data.state.book); if(window.TD_SAFE) window.TD_SAFE(rb); const merged = mergeBook(rb, b); Object.assign(b, merged); out = serBook(b); if(b.cur && window.TD_REFRESH_CUR) window.TD_REFRESH_CUR(); }
    const w = await sb.from("trip_state").upsert({ trip_id: b.room, state: { v:4, book: out }, updated_by: uid, updated_at: new Date().toISOString() }); if(w.error) throw w.error;
    const back = await sb.from("trip_state").select("state, updated_by").eq("trip_id", b.room).maybeSingle();
    if(back.data && back.data.updated_by !== uid && back.data.state && back.data.state.book){ const rb2 = await toLive(back.data.state.book); if(window.TD_SAFE) window.TD_SAFE(rb2); Object.assign(b, mergeBook(rb2, b)); pushedHash[b.id] = null; if(b.cur && window.TD_REFRESH_CUR) window.TD_REFRESH_CUR(); schedule(); continue; }
    pushedHash[b.id] = djb(JSON.stringify(out)); }
  const cb = BOOKS2.find(b => b.cur);
  if(cb && cb.room){ const pv = toDurable(privData()); const w = await sb.from("member_state").upsert({ trip_id: cb.room, user_id: uid, state: pv, updated_at: new Date().toISOString() }); if(w.error) console.warn(w.error); }
  if(cb && cb.room) setStatus("on", `已同步 · 房间 ${cb.code || window.ROOM_CODE || ""}`); }
function setRoom(t){ remote.trip = t; window.ROOM_CODE = t.code; window.ROOM_ID = t.id; }
async function loadMembers(roomId){ const sb = remote.sb; const m = await sb.from("trip_members").select("user_id, joined_at").eq("trip_id", roomId).order("joined_at"); if(m.error || !m.data) return;
  const ids = m.data.map(x => x.user_id), p = ids.length ? await sb.from("profiles").select("id, display_name").in("id", ids) : { data:[] }, nm = {}; (p.data || []).forEach(x => nm[x.id] = x.display_name);
  const others = m.data.filter(x => x.user_id !== remote.uid), cols = ["#E2B77A", "#9FB8D8", "#B7C9A8", "#E8A7B7", "#C9B2E8", "#F2C46A", "#9BD0C8"];
  const names = ["你", ...others.map(o => nm[o.user_id] || "旅伴")]; if(window.TD_SAFE) window.TD_SAFE(names);
  fill(NAMES, names); fill(FRIENDS, [[(S.me || "我").slice(0, 1), cols[0], S.avatar || undefined], ...others.map((o, i) => [(names[i + 1] || "旅").slice(0, 1), cols[(i + 1) % cols.length]])]); window.TD_MEMBERS = true; remote.memberIds = m.data.map(x => x.user_id); }
function bookFromRoom(t){ return { id:"r" + t.id.slice(0, 8), room:t.id, code:t.code, t:(t.name || "旅行").slice(0, 6), sub:"还没有行程", start:t.start_date || TDATE(), end:t.end_date || t.start_date || TDATE(), ph:"sea", st:"房间里还没有行程", look:{ c:"sky", p:"plain", m:"star", rib:true, win:true, pin:false, arch:false }, trip:{ name:t.name || "旅行", start:t.start_date || TDATE(), end:t.end_date || t.start_date || TDATE(), cities:[], days:[], prepaid:[], checklist:[], source:"room" }, state:{}, rev:0 }; }
async function roomToBook(t, stRow){ const sb = remote.sb;
  if(stRow && stRow.state && stRow.state.book){ const b = await toLive(stRow.state.book); if(window.TD_SAFE) window.TD_SAFE(b); b.room = t.id; b.code = t.code; return b; }
  if(stRow && stRow.state && stRow.state.books){ const old = stRow.state, b0 = old.books.find(x => x.room === t.id) || old.books.find(x => x.id === old.cur) || old.books[0];
    if(b0){ const b = await toLive(clone(b0)); b.room = t.id; b.code = t.code; if(!b.state) b.state = { album:old.album || [], cmts:old.cmts || {}, exp:old.exp || [], checkins:old.checkins || [], decisions:old.decisions || [], games:old.games, feed:old.feed || [] }; return b; } }
  try{ const mem = await sb.from("trip_members").select("user_id, joined_at").eq("trip_id", t.id).order("joined_at"); const ids = (mem.data || []).map(x => x.user_id); const p = ids.length ? await sb.from("profiles").select("id, display_name").in("id", ids) : { data:[] };
    const rows = (mem.data || []).map(x => ({ ...x, profiles:{ display_name:((p.data || []).find(y => y.id === x.user_id) || {}).display_name || "" } }));
    const L = await importLegacy(sb, t, remote.uid, rows); if(L){ if(window.TD_SAFE) window.TD_SAFE(L); const b = bookFromTrip(L.T); b.room = t.id; b.code = t.code; b.state = L.st; b.rev = Date.now(); S.privBy[b.id] = L.pv; return b; } }catch(e){ console.warn("legacy", e); }
  if((t.name || "") === "旅行手账" && !t.start_date) return null;     // an empty room an earlier version made automatically
  return bookFromRoom(t); }
async function loadShelf(){ const sb = remote.sb;
  const mine = await sb.from("trip_members").select("trip_id, joined_at, trips(*)").eq("user_id", remote.uid).order("joined_at"); if(mine.error) throw mine.error;
  const rooms = (mine.data || []).map(x => x.trips).filter(Boolean), ids = rooms.map(t => t.id);
  const sts = ids.length ? await sb.from("trip_state").select("trip_id, state").in("trip_id", ids) : { data:[] }; const byId = {}; (sts.data || []).forEach(r => byId[r.trip_id] = r);
  for(const t of rooms){ const rb = await roomToBook(t, byId[t.id]); if(!rb) continue; const i = BOOKS2.findIndex(b => b.room === t.id || b.id === rb.id); if(i >= 0){ const m = mergeBook(rb, BOOKS2[i]); BOOKS2[i] = m; if(needsPush(rb, m)) pushedHash[m.id] = null; } else { BOOKS2.push(rb); pushedHash[rb.id] = djb(JSON.stringify(serBook(rb))); } }
  if(Object.values(pushedHash).some(v => v === null)) schedule();
  const myRooms = new Set(ids); for(let i = BOOKS2.length - 1; i >= 0; i--){ const b = BOOKS2[i]; if(b.room && !myRooms.has(b.room) && !b.keepLocal) BOOKS2.splice(i, 1); } }
async function enterBook(b){ if(!remote || !b) return; if(!b.room){ schedule(); setStatus("off", "正在为这本书开房间…"); return; }
  const t = { id:b.room, code:b.code }; if(!t.code){ const r = await remote.sb.from("trips").select("id, code, name").eq("id", b.room).maybeSingle(); if(r.data){ t.code = r.data.code; b.code = r.data.code; } }
  setRoom(t); await loadMembers(b.room);
  const ms = await remote.sb.from("member_state").select("state").eq("trip_id", b.room).eq("user_id", remote.uid).maybeSingle(); if(ms.data && ms.data.state) applyPrivData(await toLive(ms.data.state));
  if(chan) try{ remote.sb.removeChannel(chan); }catch(e){}
  chan = remote.sb.channel("td4-" + b.room).on("postgres_changes", { event:"*", schema:"public", table:"trip_state", filter:`trip_id=eq.${b.room}` }, async p => { if(!p.new || p.new.updated_by === remote.uid || !p.new.state || !p.new.state.book) return; const rb = await toLive(p.new.state.book); if(window.TD_SAFE) window.TD_SAFE(rb); stashCur(); const i = BOOKS2.findIndex(x => x.room === b.room); if(i < 0) return; const m = mergeBook(rb, BOOKS2[i]); BOOKS2[i] = m; if(needsPush(rb, m)){ pushedHash[m.id] = null; schedule(); } if(m.cur && window.TD_REFRESH_CUR) window.TD_REFRESH_CUR(); }).subscribe();
  setStatus("on", `已连接 · 房间 ${t.code || ""}`); if(window.TD_REFRESH_CUR) window.TD_REFRESH_CUR(); }
async function connect(){
  if(!C.supabaseUrl || !C.supabaseAnonKey){ try{ const r = await fetch("/api/config", { cache:"no-store" }); if(r.ok){ const j = await r.json(); if(j.supabaseUrl && j.supabaseAnonKey){ C.supabaseUrl = j.supabaseUrl; C.supabaseAnonKey = j.supabaseAnonKey; } } }catch(e){} }
  if(!C.supabaseUrl || !C.supabaseAnonKey){ readyRes && readyRes(false); return; } setStatus("off", "正在连接…");
  const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
  const sb = createClient(C.supabaseUrl, C.supabaseAnonKey);
  let { data:{ session } } = await sb.auth.getSession(); if(!session){ const r = await sb.auth.signInAnonymously(); if(r.error) throw new Error(/nonymous/.test(r.error.message) ? "Supabase 里要先打开 Anonymous sign-ins" : r.error.message); session = r.data.session; }
  const uid = session.user.id; window.TD_UID = uid; remote = { sb, uid, trip:null };
  await sb.from("profiles").upsert({ id: uid }, { onConflict:"id", ignoreDuplicates:true }); if(S.me) await sb.from("profiles").update({ display_name: S.me }).eq("id", uid);
  const code = await sb.rpc("ensure_recovery_code"); if(!code.error && code.data){ MYCODE = code.data; try{ localStorage.setItem(LSK + "code", code.data); }catch(e){} }
  window.TD_SYNC.setName = async name => { await sb.from("profiles").update({ display_name: name }).eq("id", uid); };
  window.TD_SYNC.reclaim = async c => { const r = await sb.rpc("reclaim_identity", { p_code: c }); if(r.error) return toast(r.error.message === "BAD_CODE" ? "身份码不对" : r.error.message); toast("找回来了，正在重新加载"); setTimeout(() => location.reload(), 800); };
  window.TD_SYNC.join = async c => { const r = await sb.rpc("join_trip", { p_code: c }); if(r.error){ const m = r.error.message || ""; return toast(/TRIP_NOT_FOUND/.test(m) ? `没有 ${c} 这个房间，检查一下房间号` : /PRIVATE/.test(m) ? "这是个人旅行，别人不能加入" : "加入失败：" + m); }
    if(S.me) await sb.from("profiles").update({ display_name: S.me }).eq("id", uid);
    const sr = await sb.from("trip_state").select("trip_id, state").eq("trip_id", r.data.id).maybeSingle(); const b = await roomToBook(r.data, sr.data) || bookFromRoom(r.data);
    const i = BOOKS2.findIndex(x => x.room === r.data.id); if(i >= 0) BOOKS2[i] = mergeBook(b, BOOKS2[i]); else BOOKS2.push(b);
    const st0 = document.getElementById("start"); st0 && st0.remove(); useBook(BOOKS2.find(x => x.room === r.data.id).id); toast(`加入了「${r.data.name}」`); };
  window.TD_SYNC.leave = async roomId => { if(!roomId) return; await sb.from("trip_members").delete().eq("trip_id", roomId).eq("user_id", uid); };
  window.TD_SYNC.onSwitch = b => enterBook(b);
  window.TD_SYNC.pull = async () => { stashCur(); await loadShelf(); const cb = BOOKS2.find(b => b.cur) || BOOKS2[0]; if(cb){ await enterBook(cb); } if(window.TD_REFRESH_CUR) window.TD_REFRESH_CUR(); };
  window.TD_SYNC.ensureRoom = async () => { await save(); return remote.trip; };
  readyRes && readyRes(true);
  stashCur(); await loadShelf();
  const cb = BOOKS2.find(b => b.id === S.curBook) || BOOKS2.find(b => b.trip);
  if(cb){ S.curBook = cb.id; bootTrip(); await enterBook(cb); } else { bootTrip(); setStatus("off", "已连上 · 还没有房间（开一本旅行书或输入旅伴的房间号）"); }
  schedule(); }
const LCAT = { Lodging:["住宿","bed","#E8A864"], Flight:["交通","bus","#7FA7D6"], Food:["餐饮","bowl","#EE6A3C"], Transport:["交通","bus","#7FA7D6"], Activities:["门票","pin","#A9B7A1"], Experience:["门票","pin","#A9B7A1"], Shopping:["购物","tag","#C79BD8"], Coffee:["餐饮","bowl","#EE6A3C"], Other:["其他","tag","#9FB49A"], Pool:["其他","tag","#9FB49A"] };
async function copyPhoto(sb, trip, uid, path){ try{ if(!path) return ""; if(path.startsWith("data:")) return path; let bucket = "checkins", p = path; if(path.startsWith("trip:")){ bucket = "trip-photos"; p = path.slice(5); }
  const r = await sb.storage.from(bucket).download(p); if(r.error || !r.data) return ""; const np = `${trip.id}/${uid}/legacy-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}.jpg`;
  const u = await sb.storage.from("media").upload(np, r.data, { contentType: r.data.type || "image/jpeg" }); if(u.error) return ""; return sb.storage.from("media").getPublicUrl(np).data.publicUrl; }catch(e){ return ""; } }
async function importLegacy(sb, trip, uid, members){
  const q = async (t, f) => { try{ const r = await (f ? f(sb.from(t).select("*").eq("trip_id", trip.id)) : sb.from(t).select("*").eq("trip_id", trip.id)); return r.error ? [] : (r.data || []); }catch(e){ return []; } };
  const [acts, exps, cl, cks, shp, fps, decs, jr] = await Promise.all([q("activities", x => x.order("date").order("time")), q("expenses"), q("checklist_items", x => x.order("sort")), q("checkins"), q("shared_photos"), q("food_photos"), q("decisions"), q("journals")]);
  if(!acts.length && !exps.length && !cks.length && !shp.length) return null;
  const others = members.filter(x => x.user_id !== uid), idx = id => id === uid ? 0 : Math.max(0, others.findIndex(o => o.user_id === id) + 1), nm = id => id === uid ? "你" : ((others.find(o => o.user_id === id) || {}).profiles || {}).display_name || "旅伴";
  const mine = members.find(x => x.user_id === uid) || {}, home = mine.currency || "MYR", rate = +(mine.cny_rate || trip.cny_rate || .6), G = window.ORIG && window.ORIG.guideFor;
  const byDate = {}; acts.filter(a => a.status !== "removed").forEach(a => { (byDate[a.date] = byDate[a.date] || { date:a.date, city:a.city || (trip.cities || [])[0] || trip.name, title:"", items:[] }).items.push({ t:(a.time || "09:00").slice(0, 5), title:a.title, kind:a.kind || "sight", dur:a.dur || 60, main:!!a.is_main, note:a.note || "", spots:a.spots || [], legacyId:a.id }); });
  const days = Object.values(byDate).sort((x, y) => x.date.localeCompare(y.date)); days.forEach(d => { d.title = (d.items.find(i => i.main) || d.items[0] || {}).title || ""; });
  const start = trip.start_date || (days[0] || {}).date, end = trip.end_date || (days[days.length - 1] || {}).date || start;
  const cats = {}; cl.filter(c => !c.private || c.created_by === uid).forEach(c => (cats[c.category] = cats[c.category] || []).push(c)); const checklist = Object.entries(cats).map(([cat, L]) => ({ cat, items:L.map(c => c.label) }));
  const packed = []; checklist.forEach((g, gi) => cats[g.cat].forEach((c, i) => { if(c.done) packed.push(gi + ":" + i); }));
  const T = { name:trip.name, start, end, budget:+(mine.total_budget || trip.total_budget || 4000), currency:home, home, rate, cities:(trip.cities || []).map(n => G && G(n) ? G(n).id : null).filter(Boolean), days, prepaid:[], checklist, source:"legacy" };
  const dIdx = date => Math.max(0, days.findIndex(d => d.date === date)), allIdx = [0, ...others.map((_, i) => i + 1)];
  const exp = exps.sort((x, y) => (y.date || "").localeCompare(x.date || "")).map(e => { const c = LCAT[e.category] || LCAT.Other, payer = idx(e.payer_id || e.user_id), split = !e.shared ? [idx(e.user_id)] : (e.participants && e.participants.length ? e.participants.map(idx) : allIdx);
    const base = { t:e.note || (e.category === "Pool" ? "交公费" : c[0]), c:c[0], ic:c[1], col:c[2], rm:+(e.amount_base || 0), cny: e.currency && e.currency !== home ? +e.amount : null, who:nm(e.payer_id || e.user_id), payer, split:[...new Set(split)].sort(), d:`${+String(e.date).slice(5, 7)}/${+String(e.date).slice(8, 10)}`, at:e.date, wasPre:!!e.prepaid, reviewed:true };
    if((e.split_n || 0) > base.split.length) base.splitN = e.split_n; return base; });
  const photoJobs = [], cut = []; const job = (path, set) => { if(path && photoJobs.length < 80) photoJobs.push([path, set]); };
  const checkins = cks.filter(k => k.status !== "rejected").map(k => { const di = dIdx(k.date), ii = Math.max(0, (days[di] || { items:[] }).items.findIndex(it => it.title === k.name || it.legacyId === k.activity_id)), o = { di, ii, title:k.name, city:k.city || (days[di] || {}).city || "", date:k.date, at:String(k.created_at || "").slice(11, 16), photo:"", mood:0 }; job(k.photo_path, u => o.photo = u); return o; });
  const album = shp.map(p => { const row = ["", idx(p.user_id), 0, p.caption || "", dIdx(p.date)]; job("trip:" + p.photo_path.replace(/^trip:/, ""), u => row[0] = u); return row; });
  const wallet = fps.filter(f => f.user_id === uid).map((f, i) => { const w = { c: (G && G(f.city || "") ? G(f.city).id : (T.cities[0] || "c0")), f:f.food, r:"love", no:i + 1, d:String(f.date).replace(/-/g, "."), photo:"" }; job(f.photo_path, u => w.photo = u); return w; });
  setStatus("off", `正在搬照片（${photoJobs.length} 张）…`);
  for(let i = 0; i < photoJobs.length; i += 4) await Promise.all(photoJobs.slice(i, i + 4).map(async ([p, set]) => set(await copyPhoto(sb, trip, uid, p))));
  const decisions = decs.map(d => ({ q:d.question, r: d.result === "heads" ? "正" : d.result === "tails" ? "反" : d.result, who:nm(d.user_id), at:d.date }));
  const myj = jr.find(j => j.user_id === uid), diary = days.map((d, i) => ({ extra: i === days.length - 1 && myj ? myj.content : "", font:"" }));
  return { T, st:{ album: album.filter(a => a[0]), cmts:{}, exp, checkins, decisions, games:{ bingo:{}, guess:{ round:null, history:[] } }, feed:[] }, pv:{ packed, wallet, stubs:[], diary, voices:[], liked:[] } }; }
/* ---- weather from the Netlify function, when it is there ---- */
async function weather(){ if(!C.weather || !DAYCFG[TODAY]) return; try{ const c = DAYCFG[TODAY]; const r = await fetch(`/api/weather?cc=CN&name=${encodeURIComponent(c.city)}`); if(!r.ok) return; const j = await r.json(); if(j && j.temp != null){ c.temp = Math.round(j.temp); if(j.text) c.desc = j.text; if(S.tab === "home") render(); } }catch(e){} }

(async () => { await loadLocal(); try{ await connect(); }catch(e){ console.warn("supabase", e); readyRes && readyRes(false); setStatus("err", "没连上数据库，先存在手机里：" + (e.message || e)); } weather(); })();
