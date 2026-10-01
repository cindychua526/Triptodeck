/* Trip Deck · 同步层
   1) 先存在这台手机（localStorage + IndexedDB 放照片和语音），断网也能用
   2) config.js 里填了 Supabase 的地址和 anon key 之后，自动匿名登录、进房间、实时同步
   共享的（房间里所有人）：相册、评论、账本、旅行书、动态
   私人的（只有自己）：行李清单、票根、美食票、日记、点赞、设置、技能牌、语音 */
const C = window.TD_CONFIG || {};
const LSK = "td3:";
const st = { k:"off", t:"只存在这台手机（没有连数据库）" };
window.TD_SYNC = { status: st };
function setStatus(k, t){ st.k = k; st.t = t; const el = document.getElementById("syncstat"); if(el){ el.textContent = t; const d = el.parentElement.querySelector(".syncdot"); d && (d.className = "syncdot " + k); } }
const fill = (arr, v) => { if(Array.isArray(v)){ arr.length = 0; arr.push(...v); } };
const isBlob = u => typeof u === "string" && u.startsWith("blob:");
const shared = () => (window.TD_STASH && window.TD_STASH(), { album: ALBUM.filter(a => !isBlob(a[0])), cmts: CMTS, exp: EXP.filter(x => !x.pre), books: BOOKS2, cur: S.curBook, games: S.games, checkins: S.checkins, decisions: S.decisions, feed: FEED.slice(0, 40), names: NAMES, friends: FRIENDS });
const priv = () => ({ privBy: S.privBy, tipsSeen: !!S.tipsSeen, avatar:S.avatar || "", keeps:S.keeps, me:S.me || "", packed:[...S.packed], stubs:S.stubs.filter(s => !isBlob(s.src)), wallet:S.wallet.map(w => ({ ...w, photo: isBlob(w.photo) ? "" : w.photo })), diary: DIARY.map(d => ({ extra:d.extra || "", font:d.font || "" })), dpos:S.dpos || {}, snotes:S.snotes || {}, liked:[...liked], sets:SETS, steps:S.stepCount, ooc:S.oocPending, fx:S.fx, dk:DK, mine:(CHECK.find(c => c.cat === "我自己加的") || {}).items || [], voices: VOICES.filter(v => !isBlob(v.url)), daycfg: DAYCFG.map(d => ({ voice:d.voice, pics:d.pics })) });
function applyShared(o){ if(!o) return; fill(ALBUM, o.album); if(o.exp){ const pre = EXP.filter(x => x.pre); EXP.length = 0; EXP.push(...pre, ...o.exp); } fill(BOOKS2, o.books); if(o.cur) S.curBook = o.cur; if(o.games && window.TD_GAMES) window.TD_GAMES.merge(o.games); fill(S.checkins, o.checkins); fill(S.decisions, o.decisions); fill(FEED, o.feed); if(o.cmts){ Object.keys(CMTS).forEach(k => delete CMTS[k]); Object.assign(CMTS, o.cmts); } if(o.names && !window.TD_MEMBERS){ fill(NAMES, o.names); fill(FRIENDS, o.friends); } }
function applyPriv(o){ if(!o) return; if(o.privBy) S.privBy = o.privBy; if(o.tipsSeen) S.tipsSeen = true; if(o.avatar){ S.avatar = o.avatar; if(FRIENDS[0]) FRIENDS[0][2] = o.avatar; } if(o.keeps) S.keeps = o.keeps; if(o.me){ S.me = o.me; FRIENDS[0][0] = o.me.slice(0, 1); } if(o.packed) S.packed = new Set(o.packed); fill(S.stubs, o.stubs); fill(S.wallet, o.wallet); if(o.diary) o.diary.forEach((d, i) => { if(DIARY[i]){ DIARY[i].extra = d.extra; if(d.font) DIARY[i].font = d.font; } });
  if(o.dpos) S.dpos = o.dpos; if(o.snotes) S.snotes = o.snotes; if(o.liked){ liked.clear(); o.liked.forEach(x => liked.add(x)); } if(o.sets) Object.assign(SETS, o.sets); if(o.steps) S.stepCount = o.steps; if("ooc" in o) S.oocPending = o.ooc; if(o.fx) Object.assign(S.fx, o.fx); if(o.dk) Object.assign(DK, o.dk);
  if(o.mine && o.mine.length){ let g = CHECK.find(c => c.cat === "我自己加的"); if(!g){ g = { cat:"我自己加的", items:[] }; CHECK.push(g); } g.items = o.mine; PACK_TOTAL = CHECK.reduce((n, c) => n + c.items.length, 0); }
  fill(VOICES, o.voices); if(o.daycfg) o.daycfg.forEach((d, i) => { if(DAYCFG[i]){ DAYCFG[i].voice = d.voice || 0; DAYCFG[i].pics = d.pics || DAYCFG[i].pics; } }); }
/* ---- IndexedDB for photos / voice when there is no database ---- */
const idb = { db:null, open(){ return this.db || (this.db = new Promise((res, rej) => { const r = indexedDB.open("td3", 1); r.onupgradeneeded = () => r.result.createObjectStore("blobs"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); })); },
  async put(k, b){ const d = await this.open(); return new Promise((res, rej) => { const t = d.transaction("blobs", "readwrite"); t.objectStore("blobs").put(b, k); t.oncomplete = res; t.onerror = () => rej(t.error); }); },
  async get(k){ const d = await this.open(); return new Promise((res, rej) => { const r = d.transaction("blobs").objectStore("blobs").get(k); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); } };
/* every blob: url the app made (a photo just picked, a voice just recorded) gets stored, and the state keeps a durable reference */
async function storeBlob(url, kind){ const blob = await (await fetch(url)).blob(); const ext = (blob.type.split("/")[1] || "bin").replace("jpeg", "jpg").split(";")[0];
  if(remote){ const path = `${remote.trip.id}/${remote.uid}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`; const { error } = await remote.sb.storage.from("media").upload(path, blob, { contentType: blob.type, upsert: false }); if(error) throw error; return remote.sb.storage.from("media").getPublicUrl(path).data.publicUrl; }
  const key = `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; await idb.put(key, blob); return "idb:" + key; }
async function resolveIdb(){ const fix = async (obj, k) => { const v = obj[k]; if(typeof v === "string" && v.startsWith("idb:")){ const b = await idb.get(v.slice(4)); if(b){ obj[k] = URL.createObjectURL(b); obj["_" + k] = v; } } };
  for(const a of ALBUM) await fix(a, 0); for(const s of S.stubs) await fix(s, "src"); for(const w of S.wallet) await fix(w, "photo"); for(const v of VOICES) await fix(v, "url"); }
/* when saving, put the durable reference back in place of the object url */
async function flushBlobs(){ let n = 0; const go = async (obj, k, kind) => { if(isBlob(obj[k]) && !obj["_" + k]){ try{ const ref = await storeBlob(obj[k], kind); obj["_" + k] = ref; if(!ref.startsWith("idb:")) obj[k] = ref; n++; }catch(e){ console.warn("upload failed", e); } } };
  for(const a of ALBUM) await go(a, 0, "photo"); for(const s of S.stubs) await go(s, "src", "stub"); for(const w of S.wallet) await go(w, "photo", "ticket"); for(const v of VOICES) await go(v, "url", "voice"); return n; }
/* ---- save ---- */
let lastS = "", lastP = "", timer = 0, saving = false;
async function save(){ if(saving || window.TD_RESTORING) return; saving = true; try{ await flushBlobs();
    const sh = JSON.stringify(sharedDurable()), pv = JSON.stringify(privDurable());
    if(sh !== lastS){ localStorage.setItem(LSK + "shared", sh); lastS = sh; if(remote){ const st = JSON.parse(sh); const cur = await remote.sb.from("trip_state").select("state").eq("trip_id", remote.trip.id).maybeSingle(); if(cur.data && cur.data.state && cur.data.state.games && window.TD_GAMES){ window.TD_GAMES.merge(cur.data.state.games); st.games = S.games; } await remote.sb.from("trip_state").upsert({ trip_id: remote.trip.id, state: st, updated_by: remote.uid, updated_at: new Date().toISOString() }); lastS = JSON.stringify(st); } }
    if(pv !== lastP){ localStorage.setItem(LSK + "priv", pv); lastP = pv; if(remote) await remote.sb.from("member_state").upsert({ trip_id: remote.trip.id, user_id: remote.uid, state: JSON.parse(pv), updated_at: new Date().toISOString() }); }
    if(remote) setStatus("on", `已同步 · 房间 ${remote.trip.code}`); }catch(e){ console.warn(e); setStatus(remote ? "err" : "off", remote ? "同步失败，先存在手机里：" + (e.message || e) : st.t); } saving = false; }
function sharedDurable(){ const o = shared(); return { ...o, album: ALBUM.map(a => [a._0 || a[0], a[1], a[2], a[3]]).filter(a => !isBlob(a[0])) }; }
function privDurable(){ const o = priv(); return { ...o, stubs: S.stubs.map(s => ({ ...s, src: s._src || s.src, _src: undefined })).filter(s => !isBlob(s.src)), wallet: S.wallet.map(w => ({ ...w, photo: w._photo || w.photo, _photo: undefined })), voices: VOICES.map(v => ({ day:v.day, sec:v.sec, at:v.at, url: v._url || v.url })).filter(v => !isBlob(v.url)) }; }
function schedule(){ clearTimeout(timer); timer = setTimeout(save, 900); }
["click", "change", "input", "keyup", "pointerup"].forEach(ev => document.addEventListener(ev, schedule, true));
window.addEventListener("pagehide", () => { if(window.TD_RESTORING) return; try{ localStorage.setItem(LSK + "priv", JSON.stringify(privDurable())); localStorage.setItem(LSK + "shared", JSON.stringify(sharedDurable())); }catch(e){} });
/* ---- load local ---- */
async function loadLocal(){ try{ const sh = JSON.parse(localStorage.getItem(LSK + "shared") || "null"), pv = JSON.parse(localStorage.getItem(LSK + "priv") || "null"); if(sh) applyShared(sh); if(pv) applyPriv(pv); await resolveIdb(); lastS = sh ? JSON.stringify(sh) : ""; lastP = pv ? JSON.stringify(pv) : ""; bootTrip(); }catch(e){ console.warn("local load", e); } }
/* ---- Supabase ---- */
let remote = null;
async function connect(){
  if(!C.supabaseUrl || !C.supabaseAnonKey){ try{ const r = await fetch("/api/config", { cache:"no-store" }); if(r.ok){ const j = await r.json(); if(j.supabaseUrl && j.supabaseAnonKey){ C.supabaseUrl = j.supabaseUrl; C.supabaseAnonKey = j.supabaseAnonKey; } } }catch(e){} }
  if(!C.supabaseUrl || !C.supabaseAnonKey) return; setStatus("off", "正在连接…");
  const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
  const sb = createClient(C.supabaseUrl, C.supabaseAnonKey);
  let { data:{ session } } = await sb.auth.getSession(); if(!session){ const r = await sb.auth.signInAnonymously(); if(r.error) throw new Error(/nonymous/.test(r.error.message) ? "Supabase 里要先打开 Anonymous sign-ins" : r.error.message); session = r.data.session; }
  const uid = session.user.id; window.TD_UID = uid; await sb.from("profiles").upsert({ id: uid }, { onConflict:"id", ignoreDuplicates:true });
  const code = await sb.rpc("ensure_recovery_code"); if(!code.error) MYCODE = code.data;
  let trip = null; const tid = localStorage.getItem(LSK + "trip");
  if(tid){ const r = await sb.from("trips").select("*").eq("id", tid).maybeSingle(); trip = r.data; }
  if(!trip){ const r = await sb.from("trip_members").select("trip_id, trips(*)").eq("user_id", uid).order("joined_at", { ascending:false }).limit(1); trip = r.data && r.data[0] && r.data[0].trips; }
  if(!trip){ const r = await sb.rpc("create_trip", { p_name: C.roomName || "旅行手账", p_start: null, p_end: null, p_budget: 4000, p_kind:"group", p_cities: [], p_template:null }); if(r.error) throw r.error; trip = r.data; }
  localStorage.setItem(LSK + "trip", trip.id); window.ROOM_CODE = trip.code; window.ROOM_ID = trip.id; remote = { sb, uid, trip };
  const m = await sb.from("trip_members").select("user_id, joined_at, profiles(display_name)").eq("trip_id", trip.id).order("joined_at");
  if(m.data && m.data.length){ const me = m.data.find(x => x.user_id === uid), others = m.data.filter(x => x.user_id !== uid); const cols = ["#E2B77A", "#9FB8D8", "#B7C9A8", "#E8A7B7", "#C9B2E8", "#F2C46A", "#9BD0C8"];
    fill(NAMES, ["你", ...others.map(o => (o.profiles && o.profiles.display_name) || "旅伴")]); fill(FRIENDS, [["A", cols[0]], ...others.map((o, i) => [((o.profiles && o.profiles.display_name) || "旅").slice(0, 1), cols[(i + 1) % cols.length]])]); window.TD_MEMBERS = true; }
  const ts = await sb.from("trip_state").select("state").eq("trip_id", trip.id).maybeSingle(); if(ts.data) { applyShared(ts.data.state); lastS = JSON.stringify(ts.data.state); }
  const ms = await sb.from("member_state").select("state").eq("trip_id", trip.id).eq("user_id", uid).maybeSingle(); if(ms.data) { applyPriv(ms.data.state); lastP = JSON.stringify(ms.data.state); }
  if(!ts.data && !BOOKS2.some(b => b.room === trip.id)){ setStatus("off", "正在把旧版的资料搬过来…"); try{ const L = await importLegacy(sb, trip, uid, (m.data || [])); if(L && window.TD_ADOPT_LEGACY){ window.TD_ADOPT_LEGACY(L, trip.id); setTimeout(save, 500); } }catch(e){ console.warn("legacy import", e); } }
  await resolveIdb(); bootTrip(); setStatus("on", `已连接 · 房间 ${trip.code}`);
  sb.channel("td3-" + trip.id).on("postgres_changes", { event:"*", schema:"public", table:"trip_state", filter:`trip_id=eq.${trip.id}` }, p => { if(p.new && p.new.updated_by !== uid){ applyShared(p.new.state); lastS = JSON.stringify(p.new.state); const ae = document.activeElement; if(!ae || !/INPUT|TEXTAREA/.test(ae.tagName)) render(); } }).subscribe();
  window.TD_SYNC.pull = async () => { const ts = await sb.from("trip_state").select("state").eq("trip_id", trip.id).maybeSingle(); if(ts.data){ applyShared(ts.data.state); lastS = JSON.stringify(ts.data.state); } const ms = await sb.from("member_state").select("state").eq("trip_id", trip.id).eq("user_id", uid).maybeSingle(); if(ms.data){ applyPriv(ms.data.state); lastP = JSON.stringify(ms.data.state); } await resolveIdb(); bootTrip(); };
  window.TD_SYNC.join = async code => { const r = await sb.rpc("join_trip", { p_code: code }); if(r.error) return toast(r.error.message === "TRIP_NOT_FOUND" ? "没有这个邀请码" : r.error.message); localStorage.setItem(LSK + "trip", r.data.id); localStorage.removeItem(LSK + "shared"); toast(`加入了「${r.data.name}」`); setTimeout(() => location.reload(), 800); };
  window.TD_SYNC.reclaim = async code => { const r = await sb.rpc("reclaim_identity", { p_code: code }); if(r.error) return toast(r.error.message === "BAD_CODE" ? "身份码不对" : r.error.message); localStorage.removeItem(LSK + "trip"); toast("找回来了，正在重新加载"); setTimeout(() => location.reload(), 800); };
  window.TD_SYNC.setName = async name => { await sb.from("profiles").update({ display_name: name }).eq("id", uid); toast("名字改好了"); }; }
/* ---- one-time import from the original app's tables (activities, expenses, checkins, photos …) ---- */
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
(async () => { await loadLocal(); try{ await connect(); }catch(e){ console.warn("supabase", e); setStatus("err", "没连上数据库，先存在手机里：" + (e.message || e)); } weather(); })();
