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
const PUB = "/storage/v1/object/public/media/", SIGN = "/storage/v1/object/sign/media/";
const sbPath = s => { if(typeof s !== "string") return null; if(s.startsWith("sb:media/")) return s.slice(9); let i = s.indexOf(PUB); if(i >= 0) return decodeURIComponent(s.slice(i + PUB.length).split("?")[0]); i = s.indexOf(SIGN); if(i >= 0) return decodeURIComponent(s.slice(i + SIGN.length).split("?")[0]); return null; };
const toDurable = o => walk(clone(o), s => { if(isBlob(s)) return REF[s] || ""; if(typeof s === "string" && s.startsWith("http")){ const p = sbPath(s); if(p) return "sb:media/" + p; } return s; });
/* photos are private to the room: turn stored refs (and old public links) into short-lived signed links */
async function signAll(o){ if(!remote) return o; const paths = new Set(); walk(o, s => { const p = sbPath(s); if(p) paths.add(p); return s; });
  const need = [...paths].filter(p => !LIVE["sb:media/" + p]);
  for(let i = 0; i < need.length; i += 100){ try{ const r = await remote.sb.storage.from("media").createSignedUrls(need.slice(i, i + 100), 604800); (r.data || []).forEach(x => { if(x.signedUrl){ LIVE["sb:media/" + x.path] = x.signedUrl; REF[x.signedUrl] = "sb:media/" + x.path; } }); }catch(e){} }
  return walk(o, s => { const p = sbPath(s); return p && LIVE["sb:media/" + p] ? LIVE["sb:media/" + p] : s; }); }
async function toLive(o){ const keys = new Set(); walk(o, s => { if(typeof s === "string" && s.startsWith("idb:") && !LIVE[s]) keys.add(s); return s; });
  for(const k of keys){ try{ const b = await idb.get(k.slice(4)); if(b){ const u = URL.createObjectURL(b); LIVE[k] = u; REF[u] = k; } }catch(e){} }
  const out = walk(o, s => typeof s === "string" && s.startsWith("idb:") ? (LIVE[s] || s) : s); return remote ? await signAll(out) : out; }
async function storeBlob(url, room){ const blob = await (await fetch(url)).blob(); const ext = ((blob.type.split("/")[1] || "bin").replace("jpeg", "jpg").split(";")[0]);
  if(remote && room){ const path = `${room}/${remote.uid}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`; const r = await remote.sb.storage.from("media").upload(path, blob, { contentType: blob.type, upsert:false }); if(!r.error){ const ref = "sb:media/" + path; const sg = await remote.sb.storage.from("media").createSignedUrl(path, 604800); if(sg.data && sg.data.signedUrl){ LIVE[ref] = sg.data.signedUrl; REF[sg.data.signedUrl] = ref; } return ref; } }
  const key = `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; await idb.put(key, blob); LIVE["idb:" + key] = url; return "idb:" + key; }
async function flushBlobs(obj, room){ const urls = new Set(); walk(obj, s => { if(isBlob(s) && !REF[s]) urls.add(s); return s; }); for(const u of urls){ try{ REF[u] = await storeBlob(u, room); }catch(e){} } }
async function upgradeIdbRefs(book){ if(!remote || !book.room) return; const st = book.state; if(!st) return; const refs = new Set(); walk(st, s => { if(typeof s === "string" && s.startsWith("idb:")) refs.add(s); return s; }); }

/* ---- the bookshelf as data ---- */
const needsPush = (remoteB, merged) => { const k = x => JSON.stringify([(x.state && x.state.exp || []).map(e => e.id || e.t).sort(), (x.state && x.state.checkins || []).map(c => c.id || c.title).sort(), (x.state && x.state.album || []).map(a => a[0]).sort(), (x.state && x.state.del || []).slice().sort()]); return k(remoteB) !== k(merged); };
window.TD_REF = u => REF[u] || u;
const djb = s => { let h = 5381; for(let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36); };
function serBook(b){ const o = { ...b }; delete o.cur; delete o._fresh; return toDurable(o); }
function privData(){ return { found: S.found || [], suitcase: S.suitcase, pushOn: !!S.pushOn, privBy: S.privBy, me:S.me || "", avatar:S.avatar || "", keeps:S.keeps, tipsSeen: !!S.tipsSeen, fortune:S.fortune, secretDone:S.secretDone, stepsByDay:S.steps, sets:SETS }; }
function applyPrivData(o){ if(!o) return; if(window.TD_SAFE) window.TD_SAFE(o); if(o.pushOn) S.pushOn = true; if(Array.isArray(o.found)) S.found = [...new Set([...(S.found || []), ...o.found])]; if(o.suitcase) S.suitcase = { ...(S.suitcase || {}), ...o.suitcase }; if(o.privBy) S.privBy = { ...(S.privBy || {}), ...o.privBy }; if(o.me && !S.me) S.me = o.me; if(o.avatar){ S.avatar = o.avatar; if(FRIENDS[0]) FRIENDS[0][2] = o.avatar; } if(o.keeps) S.keeps = o.keeps; if(o.tipsSeen) S.tipsSeen = true; if(o.fortune) S.fortune = o.fortune; if(o.secretDone) S.secretDone = o.secretDone; if(o.stepsByDay) S.steps = { ...(S.steps || {}), ...o.stepsByDay }; if(o.sets) Object.assign(SETS, o.sets); }
/* merge a book from the room with the one on this phone: lists are combined, nothing a buddy added is lost */
const keyOf = { album: r => "a:" + (Array.isArray(r) ? (REF[r[0]] || r[0]) : r), checkins: c => c.id || [c.title, c.date, c.at].join("|"), exp: e => e.id || [e.t, e.at, e.rm, e.who].join("|"), decisions: d => [d.q, d.at, d.who, d.r].join("|"), feed: f => [f.t, f.s].join("|") };
function mergeList(a = [], b = [], key, del = []){ const out = [], seen = new Map(); const dead = new Set(del);
  for(const x of [...a, ...b]){ const k = key(x); if(!k || dead.has(k)) continue; if(!seen.has(k)){ seen.set(k, out.length); out.push(x); } else { const i = seen.get(k), y = out[i]; if((x && x.u || 0) > (y && y.u || 0)) out[i] = x; } } return out; }
function mergeBook(remoteB, localB){ if(!remoteB) return localB; if(!localB) return remoteB;
  const newer = (remoteB.rev || 0) > (localB.rev || 0) ? remoteB : localB, m = { ...newer, room: localB.room || remoteB.room, cur: localB.cur };
  const a = remoteB.state || {}, b = localB.state || {}, del = [...new Set([...(a.del || []), ...(b.del || [])])];
  m.state = { ...a, ...b, del,
    album: (() => { const L = mergeList(b.album, a.album, keyOf.album, del), other = new Map((a.album || []).map(r => [keyOf.album(r), r])); return L.map(r => { const o = other.get(keyOf.album(r)); if(!o || o === r) return r; const m2 = r.slice(); const me = S.me || "我"; m2[5] = [...new Set([...(o[5] || []).filter(n => n !== me), ...((r[5] || []).includes(me) ? [me] : [])])]; m2[8] = mergeList(r[8] || [], o[8] || [], c => c.join("|")); return m2; }); })(), checkins: mergeList(b.checkins, a.checkins, keyOf.checkins, del), exp: mergeList(b.exp, a.exp, keyOf.exp, del),
    decisions: mergeList(b.decisions, a.decisions, keyOf.decisions), feed: mergeList(b.feed, a.feed, keyOf.feed).slice(0, 60),
    cmts: (() => { const o = { ...(a.cmts || {}) }; for(const [k, L] of Object.entries(b.cmts || {})) o[k] = mergeList(L, o[k] || [], c => c.join("|")); return o; })(),
    games: typeof mergeGames === "function" ? mergeGames(a.games, b.games) : (b.games || a.games),
    avatars: (() => { const me = window.TD_UID, out = { ...(a.avatars || {}), ...(b.avatars || {}) }; for(const [k, v] of Object.entries(a.avatars || {})) if(k !== me) out[k] = v; return out; })(),
    fx: (() => { const x = a.fx, y = b.fx, d = typeof TDATE === "function" ? TDATE() : ""; if(!x || x.day !== d) return y; if(!y || y.day !== d) return x;
      const added = [...(y.added || [])]; (x.added || []).forEach(t => { if(!added.some(z => z.title === t.title)) added.push(t); });
      return { ...x, ...y, cut:{ ...(x.cut || {}), ...(y.cut || {}) }, added, shift:Math.max(x.shift || 0, y.shift || 0), lost:Math.max(x.lost || 0, y.lost || 0), grey:x.grey || y.grey, banner: y.banner || x.banner }; })() };
  m.rev = Math.max(remoteB.rev || 0, localB.rev || 0); return m; }
/* ---- local save ---- */
let timer = 0, saving = false, lastLocal = "";
function stashCur(){ if(window.TD_STASH) window.TD_STASH(); }
let lastPriv = ""; function saveLocal(){ if(window.TD_RESTORING) return; stashCur(); const data = JSON.stringify({ v:4, cur:S.curBook || null, books: BOOKS2.map(serBook) }), pv = JSON.stringify(toDurable(privData())); try{ if(data !== lastLocal){ localStorage.setItem(LSK + "books", data); lastLocal = data; } if(pv !== lastPriv){ localStorage.setItem(LSK + "priv", pv); lastPriv = pv; } }catch(e){ console.warn("local save", e); } }
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
function setRoom(t){ remote.trip = t; window.ROOM_CODE = t.code; window.ROOM_ID = t.id; window.ROOM_OWNER = t.created_by || window.ROOM_OWNER || null; }
async function loadMembers(roomId){ const sb = remote.sb; const m = await sb.from("trip_members").select("user_id, joined_at").eq("trip_id", roomId).order("joined_at"); if(m.error || !m.data) return;
  const ids = m.data.map(x => x.user_id), p = ids.length ? await sb.from("profiles").select("id, display_name").in("id", ids) : { data:[] }, nm = {}; (p.data || []).forEach(x => nm[x.id] = x.display_name);
  const others = m.data.filter(x => x.user_id !== remote.uid), cols = ["#E2B77A", "#9FB8D8", "#B7C9A8", "#E8A7B7", "#C9B2E8", "#F2C46A", "#9BD0C8"];
  const names = ["你", ...others.map(o => nm[o.user_id] || "旅伴")]; if(window.TD_SAFE) window.TD_SAFE(names);
  fill(NAMES, names); const keepLocal = FRIENDS.filter(f => (f[3] || "").startsWith("n:")).map(f => [f, NAMES[FRIENDS.indexOf(f)]]); fill(FRIENDS, [[(S.me || "我").slice(0, 1), cols[0], S.avatar || undefined, remote.uid], ...others.map((o, i) => [(names[i + 1] || "旅").slice(0, 1), cols[(i + 1) % cols.length], undefined, o.user_id])]); keepLocal.forEach(([f, n]) => { FRIENDS.push(f); names.push(n); }); fill(NAMES, names); window.TD_MEMBERS = true; remote.memberIds = m.data.map(x => x.user_id); const av = S.roomAvatars || {}; FRIENDS.forEach((f, k) => { if(k > 0 && f[3] && av[f[3]]) f[2] = av[f[3]]; }); }
function bookFromRoom(t){ return { id:"r" + t.id.slice(0, 8), room:t.id, code:t.code, t:(t.name || "旅行").slice(0, 6), sub:"还没有行程", start:t.start_date || TDATE(), end:t.end_date || t.start_date || TDATE(), ph:"sea", st:"房间里还没有行程", look:{ c:"sky", p:"plain", m:"star", rib:true, win:true, pin:false, arch:false }, trip:{ name:t.name || "旅行", start:t.start_date || TDATE(), end:t.end_date || t.start_date || TDATE(), cities:[], days:[], prepaid:[], checklist:[], source:"room" }, state:{}, rev:0 }; }
async function roomToBook(t, stRow){
  if(stRow && stRow.state && stRow.state.book){ const b = await toLive(stRow.state.book); if(window.TD_SAFE) window.TD_SAFE(b); b.room = t.id; b.code = t.code; return b; }
  return bookFromRoom(t); }
async function loadShelf(){ const sb = remote.sb;
  const mine = await sb.from("trip_members").select("trip_id, joined_at, trips(*)").eq("user_id", remote.uid).order("joined_at"); if(mine.error) throw mine.error;
  const rooms = (mine.data || []).map(x => x.trips).filter(Boolean), ids = rooms.map(t => t.id);
  const sts = ids.length ? await sb.from("trip_state").select("trip_id, state").in("trip_id", ids) : { data:[] }; const byId = {}; (sts.data || []).forEach(r => byId[r.trip_id] = r);
  for(const t of rooms){ const rb = await roomToBook(t, byId[t.id]); if(!rb) continue; const i = BOOKS2.findIndex(b => b.room === t.id || b.id === rb.id); if(i >= 0){ const m = mergeBook(rb, BOOKS2[i]); BOOKS2[i] = m; if(needsPush(rb, m)) pushedHash[m.id] = null; } else { BOOKS2.push(rb); pushedHash[rb.id] = djb(JSON.stringify(serBook(rb))); } }
  if(Object.values(pushedHash).some(v => v === null)) schedule();
  for(let i = BOOKS2.length - 1; i >= 0; i--){ const b = BOOKS2[i]; if(!b.room) continue; const j = BOOKS2.findIndex(x => x !== b && x.room === b.room); if(j >= 0 && j < i){ BOOKS2[j] = mergeBook(b, BOOKS2[j]); BOOKS2.splice(i, 1); } }
  const myRooms = new Set(ids), gone = []; for(let i = BOOKS2.length - 1; i >= 0; i--){ const b = BOOKS2[i]; if(b.room && !myRooms.has(b.room) && !b.keepLocal){ gone.push(b); BOOKS2.splice(i, 1); } }
  if(gone.length){ const wasCur = gone.some(b => b.cur || b.id === S.curBook); toast(`你被移出了「${gone.map(b => b.t).join("」「")}」`);
    if(wasCur){ S.curBook = null; const next = BOOKS2.find(b => b.trip); if(next){ useBook(next.id); } else { DAYS.length = 0; ALBUM.length = 0; EXP.length = 0; S.checkins.length = 0; try{ closeOv(); closeSheet(); }catch(e){} document.getElementById("view").innerHTML = ""; window.ROOM_CODE = ""; window.ROOM_ID = null; remote.trip = null; openStart(false); } } } }
async function enterBook(b){ if(!remote || !b) return; if(!b.room){ schedule(); setStatus("off", "正在为这本书开房间…"); return; }
  const t = { id:b.room, code:b.code }; window.ROOM_OWNER = null; { const r = await remote.sb.from("trips").select("id, code, name, created_by").eq("id", b.room).maybeSingle(); if(r.data){ t.code = r.data.code; b.code = r.data.code; t.created_by = r.data.created_by; } }
  setRoom(t); await loadMembers(b.room);
  const ms = await remote.sb.from("member_state").select("state").eq("trip_id", b.room).eq("user_id", remote.uid).maybeSingle(); if(ms.data && ms.data.state) applyPrivData(await toLive(ms.data.state));
  if(chan) try{ remote.sb.removeChannel(chan); }catch(e){}
  chan = remote.sb.channel("td4-" + b.room).on("postgres_changes", { event:"*", schema:"public", table:"trip_state", filter:`trip_id=eq.${b.room}` }, async p => { if(!p.new || p.new.updated_by === remote.uid || !p.new.state || !p.new.state.book) return; const rb = await toLive(p.new.state.book); if(window.TD_SAFE) window.TD_SAFE(rb); stashCur(); const i = BOOKS2.findIndex(x => x.room === b.room); if(i < 0) return; const m = mergeBook(rb, BOOKS2[i]); BOOKS2[i] = m; if(needsPush(rb, m)){ pushedHash[m.id] = null; schedule(); } if(m.cur && window.TD_REFRESH_CUR) window.TD_REFRESH_CUR(); }).subscribe();
  setStatus("on", `已连接 · 房间 ${t.code || ""}`); if(window.TD_REFRESH_CUR) window.TD_REFRESH_CUR(); }
async function connect(){
  if(!C.supabaseUrl || !C.supabaseAnonKey){ try{ const r = await fetch("/api/config", { cache:"no-store" }); if(r.ok){ const j = await r.json(); if(j.supabaseUrl && j.supabaseAnonKey){ C.supabaseUrl = j.supabaseUrl; C.supabaseAnonKey = j.supabaseAnonKey; } if(j.vapidPublicKey) C.vapidPublicKey = j.vapidPublicKey; } }catch(e){} }
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
  window.TD_SYNC.kick = async userId => { const r = await sb.rpc("kick_member", { p_trip: remote.trip && remote.trip.id, p_user: userId }); if(r.error){ toast(/NOT_OWNER/.test(r.error.message) ? "只有房主可以把人移出" : /function/.test(r.error.message) ? "数据库还没运行 migration_7.sql" : "移出失败：" + r.error.message); return false; } return true; };
  window.TD_SYNC.leave = async roomId => { if(!roomId) return; await sb.from("trip_members").delete().eq("trip_id", roomId).eq("user_id", uid); };
  /* notifications when the app is closed */
  const b64u = s => { const p = "=".repeat((4 - s.length % 4) % 4), r = atob((s + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from([...r].map(c => c.charCodeAt(0))); };
  window.TD_SYNC.push = {
    supported: () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window && !!C.vapidPublicKey,
    needsHomeScreen: () => /iPhone|iPad|iPod/.test(navigator.userAgent) && !(navigator.standalone || matchMedia("(display-mode: standalone)").matches),
    state: () => ("Notification" in window ? Notification.permission : "unsupported"),
    async enable(){ const perm = await Notification.requestPermission(); if(perm !== "granted") return "denied";
      const reg = await navigator.serviceWorker.ready; let sub = await reg.pushManager.getSubscription(); if(!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly:true, applicationServerKey:b64u(C.vapidPublicKey) });
      const j = sub.toJSON(); const r = await sb.from("push_subs").upsert({ user_id:uid, trip_id: remote.trip ? remote.trip.id : null, endpoint:j.endpoint, p256dh:j.keys.p256dh, auth:j.keys.auth }, { onConflict:"endpoint" }); if(r.error) throw r.error; return "on"; },
    async disable(){ const reg = await navigator.serviceWorker.ready, sub = await reg.pushManager.getSubscription(); if(sub){ await sb.from("push_subs").delete().eq("endpoint", sub.endpoint); await sub.unsubscribe(); } return "off"; },
    async notify(title, body, tag){ if(!remote || !remote.trip) return; try{ const { data:{ session } } = await sb.auth.getSession(); if(!session) return;
      await fetch("/api/notify", { method:"POST", headers:{ "content-type":"application/json", Authorization:`Bearer ${session.access_token}` }, body: JSON.stringify({ trip_id: remote.trip.id, title, body, tag }) }); }catch(e){} } };
  window.TD_SYNC.onSwitch = b => enterBook(b);
  window.TD_SYNC.pull = async () => { stashCur(); await loadShelf(); const cb = BOOKS2.find(b => b.cur); if(cb){ await enterBook(cb); if(window.TD_REFRESH_CUR) window.TD_REFRESH_CUR(); } };
  window.TD_SYNC.ensureRoom = async () => { await save(); return remote.trip; };
  readyRes && readyRes(true);
  let lastSeen = "";
  const poll = async () => { if(document.hidden || !remote || !remote.trip || saving) return; try{ const r = await sb.from("trip_state").select("state, updated_at, updated_by").eq("trip_id", remote.trip.id).maybeSingle();
      if(!r.data || r.data.updated_at === lastSeen) return; lastSeen = r.data.updated_at; if(r.data.updated_by === uid || !r.data.state || !r.data.state.book) return;
      const rb = await toLive(r.data.state.book); if(window.TD_SAFE) window.TD_SAFE(rb); stashCur(); const i = BOOKS2.findIndex(x => x.room === remote.trip.id); if(i < 0) return; const m = mergeBook(rb, BOOKS2[i]); BOOKS2[i] = m; if(needsPush(rb, m)){ pushedHash[m.id] = null; schedule(); } if(m.cur && window.TD_REFRESH_CUR) window.TD_REFRESH_CUR(); }catch(e){} };
  let pollT = 0; const tick = () => { clearTimeout(pollT); pollT = setTimeout(async () => { await poll(); tick(); }, ["guess", "bingo"].includes(window.CUR_PAGE) ? 3500 : 12000); }; tick();
  window.TD_SYNC.pollNow = poll;
  stashCur(); for(let i = 0; i < BOOKS2.length; i++) BOOKS2[i] = await signAll(BOOKS2[i]); if(S.privBy) S.privBy = await signAll(S.privBy); await loadShelf();
  const cb = BOOKS2.find(b => b.id === S.curBook) || BOOKS2.find(b => b.trip);
  if(cb){ S.curBook = cb.id; bootTrip(); await enterBook(cb); } else { bootTrip(); setStatus("off", "已连上 · 还没有房间（开一本旅行书或输入旅伴的房间号）"); }
  schedule(); }
/* ---- weather from the Netlify function, when it is there ---- */
async function weather(){ const c = DAYCFG[TODAY]; if(!c || !c.city) return; try{
    const g = (TRIP.guides || []).find(x => x.name === c.city) || (TRIP.guides || [])[0] || {}, CC = { 中国:"CN", 马来西亚:"MY", 泰国:"TH", 新加坡:"SG", 台湾:"TW", 香港:"HK", 澳门:"MO", 日本:"JP", 韩国:"KR", 越南:"VN", 新西兰:"NZ", 印度尼西亚:"ID" };
    const city = (CITIES || []).find(x => x.name === c.city) || {}, ll = city.ll || g.ll || [], cc = CC[g.country] || "";
    const r = await fetch(`/api/weather?cc=${cc}&name=${encodeURIComponent(c.city)}${ll.length ? `&lat=${ll[0]}&lng=${ll[1]}` : ""}`); if(!r.ok) return; const j = await r.json();
    if(j && j.temp != null){ window.TD_WX = { city:c.city, date:TDATE(), temp:Math.round(j.temp), text:j.text || "" }; c.temp = Math.round(j.temp); if(j.text){ c.wx = j.text; c.desc = j.text; } window.TD_WX_AT = Date.now(); if(S.tab === "home" && !document.querySelector(".mo")){ NOSTAG = true; render(); } } }catch(e){} }
setInterval(() => { if(!document.hidden) weather(); }, 30 * 60e3);
document.addEventListener("visibilitychange", () => { if(!document.hidden && (!window.TD_WX_AT || Date.now() - window.TD_WX_AT > 30 * 60e3)) weather(); });

(async () => { await loadLocal(); try{ await connect(); }catch(e){ console.warn("supabase", e); readyRes && readyRes(false); setStatus("err", "没连上数据库，先存在手机里：" + (e.message || e)); } weather(); })();
