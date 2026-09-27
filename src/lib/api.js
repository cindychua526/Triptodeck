/* One data API, two backends:
   - cloud: Supabase (trips are rooms; shared rows are scoped to a trip; private rows are yours only)
   - local: localStorage (single-device demo when no Supabase keys are set) */
import { createClient } from "@supabase/supabase-js";
import { uid } from "./util.js";
import { DAYS, CHECKLIST_SEED, TRIP_SEED } from "../data/fujian.js";

const URL_ = import.meta.env.VITE_SUPABASE_URL, KEY_ = import.meta.env.VITE_SUPABASE_ANON_KEY;
const listeners = {};
const emit = t => (listeners[t] || []).forEach(f => { try { f(); } catch (e) { console.error(e); } });
export function on(table, f) { (listeners[table] = listeners[table] || []).push(f); return () => { listeners[table] = listeners[table].filter(x => x !== f); }; }
const TRIP_EVENTS = ["trip", "checkins", "food_photos", "day_lines", "moments", "letters", "activities", "checklist_items", "decisions", "skill_log", "skill_effects", "trip_members", "custom_items", "expenses", "budget"];
const emitAll = () => TRIP_EVENTS.forEach(emit);

const GENERIC_CHECKLIST = [
  { cat: "证件", items: ["护照 / 身份证", "机票或车票", "酒店预订确认"] },
  { cat: "手机 & 钱", items: ["当地支付方式", "流量卡或漫游", "一点现金"] },
  { cat: "行李", items: ["充电宝", "转换插头", "舒服的鞋"] }
];
export function seedRows(template) {
  const acts = [];
  if (template === "fujian") DAYS.forEach(d => d.items.forEach(it => acts.push({ date: d.date, time: it.t, title: it.title, city: d.city, kind: it.kind, dur: it.dur, note: it.note || null, spots: it.spots || [], is_main: !!it.main })));
  const src = template === "fujian" ? CHECKLIST_SEED : GENERIC_CHECKLIST, checks = [];
  src.forEach((c, ci) => c.items.forEach((l, i) => checks.push({ category: c.cat, label: l, sort: ci * 100 + i })));
  return { acts, checks };
}
export const FUJIAN_TEMPLATE = { name: TRIP_SEED.name, start: TRIP_SEED.start, end: TRIP_SEED.end, budget: TRIP_SEED.totalBudget, cities: ["xm", "qz"], template: "fujian", kind: "group" };

/* ======================= cloud ======================= */
function cloud() {
  const sb = createClient(URL_, KEY_, { auth: { persistSession: true, autoRefreshToken: true } });
  let me = null, trip = null, membership = null, channel = null, members = [], trips = [];
  const need = r => { if (r.error) { const e = new Error(r.error.message); e.code = r.error.code; throw e; } return r.data; };
  async function loadMembers() {
    const rows = need(await sb.from("trip_members").select("user_id, joined_at").eq("trip_id", trip.id).order("joined_at"));
    const ids = rows.map(r => r.user_id);
    const ps = ids.length ? need(await sb.from("profiles").select("id, display_name").in("id", ids)) : [];
    members = ids.map(id => ({ id, name: (ps.find(p => p.id === id) || {}).display_name || "旅伴" }));
    membership = need(await sb.from("trip_members").select("*").eq("trip_id", trip.id).eq("user_id", me.id).single());
  }
  function subscribe() {
    if (channel) sb.removeChannel(channel);
    channel = sb.channel("trip-" + trip.id);
    ["activities", "checklist_items", "decisions", "skill_log", "skill_effects", "trip_members", "custom_items", "expenses", "departures", "checkins", "food_photos", "day_lines", "moments", "letters"].forEach(t =>
      channel.on("postgres_changes", { event: "*", schema: "public", table: t, filter: `trip_id=eq.${trip.id}` }, async () => { if (t === "trip_members") await loadMembers(); emit(t); }));
    channel.subscribe();
  }
  async function refreshTrips() { const rows = need(await sb.from("trip_members").select("trip_id, trips(*)").eq("user_id", me.id)); trips = rows.map(r => r.trips).filter(Boolean).sort((a, b) => String(b.start_date).localeCompare(String(a.start_date))); return trips; }
  async function useTrip(t) { trip = t; try { localStorage.setItem("td-trip", t.id); } catch (e) {} await loadMembers(); subscribe(); emitAll(); }
  return {
    mode: "cloud",
    get me() { return me; }, get trip() { return trip; }, get members() { return members; }, get trips() { return trips; },
    get membership() { return trip ? { total_budget: +(trip.total_budget ?? (membership && membership.total_budget) ?? 3000), budget_mode: trip.budget_mode || "strict", currency: "MYR", cny_rate: +(trip.cny_rate ?? 0.6) } : null; },
    async init() {
      const { data: { session } } = await sb.auth.getSession(); if (!session) return null;
      const p = await sb.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
      me = { id: session.user.id, name: (p.data && p.data.display_name) || "我" };
      await refreshTrips();
      let tid = null; try { tid = localStorage.getItem("td-trip"); } catch (e) {}
      const t = trips.find(x => x.id === tid) || trips[0]; if (t) await useTrip(t);
      return { me, trip };
    },
    async signIn(name) {
      let { data: { session } } = await sb.auth.getSession();
      if (!session) { const r = await sb.auth.signInAnonymously(); if (r.error) throw new Error(/nonymous/.test(r.error.message) ? "ANON_DISABLED" : r.error.message); session = r.data.session; }
      need(await sb.from("profiles").upsert({ id: session.user.id, display_name: name }));
      me = { id: session.user.id, name }; await refreshTrips(); return me;
    },
    async rename(name) { need(await sb.from("profiles").update({ display_name: name }).eq("id", me.id)); me.name = name; if (trip) await loadMembers(); emit("trip_members"); },
    listTrips: refreshTrips,
    async createTrip(o) {
      const t = need(await sb.rpc("create_trip", { p_name: o.name, p_start: o.start, p_end: o.end, p_budget: o.budget || 3000, p_kind: o.kind || "group", p_cities: o.cities || [], p_template: o.template || null }));
      const { acts, checks } = seedRows(o.template);
      if (acts.length) need(await sb.from("activities").insert(acts.map(a => ({ ...a, trip_id: t.id }))));
      if (checks.length) need(await sb.from("checklist_items").insert(checks.map(c => ({ ...c, trip_id: t.id }))));
      await refreshTrips(); await useTrip(t); return t;
    },
    async joinTrip(code) { const t = need(await sb.rpc("join_trip", { p_code: code })); await refreshTrips(); await useTrip(t); return t; },
    async switchTrip(id) { const t = trips.find(x => x.id === id); if (t) await useTrip(t); },
    async updateTrip(patch) { need(await sb.from("trips").update(patch).eq("id", trip.id)); Object.assign(trip, patch); await refreshTrips(); emit("trip"); },
    async leaveTrip() { need(await sb.from("trip_members").delete().eq("trip_id", trip.id).eq("user_id", me.id)); await refreshTrips(); trip = null; if (trips[0]) await useTrip(trips[0]); else emitAll(); },
    async signOut() { if (channel) sb.removeChannel(channel); await sb.auth.signOut(); try { localStorage.removeItem("td-trip"); } catch (e) {} },
    async activities() { return need(await sb.from("activities").select("*").eq("trip_id", trip.id).order("date").order("time")); },
    async addActivity(a) { const r = need(await sb.from("activities").insert({ ...a, trip_id: trip.id }).select().single()); emit("activities"); return r; },
    async updateActivity(id, patch) { need(await sb.from("activities").update(patch).eq("id", id)); emit("activities"); },
    async deleteActivity(id) { need(await sb.from("activities").delete().eq("id", id)); emit("activities"); },
    async checklist() { return need(await sb.from("checklist_items").select("*").eq("trip_id", trip.id).order("sort").order("created_at")); },
    async addCheck(category, label, sort) { need(await sb.from("checklist_items").insert({ trip_id: trip.id, category, label, sort })); emit("checklist_items"); },
    async setCheck(id, done) { need(await sb.from("checklist_items").update({ done, done_by: done ? me.id : null, done_at: done ? new Date().toISOString() : null }).eq("id", id)); emit("checklist_items"); },
    async deleteCheck(id) { need(await sb.from("checklist_items").delete().eq("id", id)); emit("checklist_items"); },
    async customItems() { return need(await sb.from("custom_items").select("*").eq("trip_id", trip.id).order("created_at")); },
    async addCustom(it) { need(await sb.from("custom_items").insert({ ...it, trip_id: trip.id })); emit("custom_items"); },
    async deleteCustom(id) { need(await sb.from("custom_items").delete().eq("id", id)); emit("custom_items"); },
    async expenses() { return need(await sb.from("expenses").select("*").eq("trip_id", trip.id).order("created_at", { ascending: false })); },
    async addExpense(e) { need(await sb.from("expenses").insert({ ...e, trip_id: trip.id })); emit("expenses"); },
    async deleteExpense(id) { need(await sb.from("expenses").delete().eq("id", id)); emit("expenses"); },
    async updateExpense(id, patch) { need(await sb.from("expenses").update(patch).eq("id", id)); emit("expenses"); },
    async updateBudget(patch) { need(await sb.from("trips").update(patch).eq("id", trip.id)); Object.assign(trip, patch); emit("budget"); },
    async departures() { return need(await sb.from("departures").select("*").eq("trip_id", trip.id)); },
    async setDeparture(d) { need(await sb.from("departures").upsert({ ...d, trip_id: trip.id, user_id: me.id })); emit("departures"); },
    async uploadShared(blob) { const path = `${trip.id}/${me.id}/${Date.now()}.jpg`; need(await sb.storage.from("trip-photos").upload(path, blob, { contentType: "image/jpeg" })); return path; },
    async sharedUrl(path) { if (!path) return null; if (path.startsWith("data:")) return path; const r = await sb.storage.from("trip-photos").createSignedUrl(path, 3600); return r.data && r.data.signedUrl; },
    async wallet() { return need(await sb.from("wallet_items").select("*").order("created_at")); },
    async putWallet(w) { need(await sb.from("wallet_items").upsert({ ...w, trip_id: w.trip_id || (trip && trip.id) })); emit("wallet"); },
    async removeWallet(id) { need(await sb.from("wallet_items").delete().eq("spot_id", id)); emit("wallet"); },
    async stamps() { return need(await sb.from("stamps").select("*").order("created_at")); },
    async addStamp(s) { const r = need(await sb.from("stamps").insert({ ...s, trip_id: trip && trip.id }).select().single()); emit("stamps"); return r; },
    async uploadPhoto(blob) { const path = `${me.id}/${Date.now()}.jpg`; need(await sb.storage.from("checkins").upload(path, blob, { contentType: "image/jpeg" })); return path; },
    async photoUrl(path) { if (!path) return null; if (path.startsWith("data:")) return path; if (path.startsWith("trip:")) return this.sharedUrl(path.slice(5)); const r = await sb.storage.from("checkins").createSignedUrl(path, 3600); return r.data && r.data.signedUrl; },
    async uploadCheckinPhoto(blob) { return "trip:" + await this.uploadShared(blob); },
    async checkins() { return need(await sb.from("checkins").select("*").eq("trip_id", trip.id).order("created_at", { ascending: false }).limit(200)); },
    async submitCheckin(c) { const r = need(await sb.from("checkins").insert({ ...c, trip_id: trip.id }).select().single()); emit("checkins"); if (trip.kind === "solo" || members.length < 2) { await this.reviewCheckin(r.id, true); r.status = "approved"; } return r; },
    async reviewCheckin(id, ok, note) { const r = need(await sb.rpc("review_checkin", { p_id: id, p_ok: ok, p_note: note || null })); emit("checkins"); emit("stamps"); return r; },
    async guaranteeCheckin(id) { const r = need(await sb.rpc("guarantee_checkin", { p_id: id })); emit("checkins"); emit("stamps"); return r; },
    async dayLines(date) { return need(await sb.from("day_lines").select("*").eq("trip_id", trip.id).eq("date", date)); },
    async saveDayLine(date, text, mood) { need(await sb.from("day_lines").upsert({ trip_id: trip.id, user_id: me.id, date, text, mood }, { onConflict: "trip_id,user_id,date" })); emit("day_lines"); },
    async moments(date) { return need(await sb.from("day_lines").select("*").eq("trip_id", trip.id).eq("date", date)); },
    async addMoment(date, note, lat, lng) { need(await sb.from("moments").insert({ trip_id: trip.id, date, note, lat, lng })); emit("moments"); },
    async momentsOn(date) { return need(await sb.from("moments").select("*").eq("trip_id", trip.id).eq("date", date).order("created_at")); },
    async letters() { return need(await sb.from("letters").select("*").eq("trip_id", trip.id)); },
    async sendLetter(to, body, openAt) { need(await sb.from("letters").insert({ trip_id: trip.id, to_id: to, body, open_at: openAt })); emit("letters"); },
    async withdrawCheckin(id) { need(await sb.from("checkins").delete().eq("id", id)); emit("checkins"); },
    async foodPhotos() { return need(await sb.from("food_photos").select("*").eq("trip_id", trip.id).order("created_at")); },
    async addFoodPhoto(f) { need(await sb.from("food_photos").insert({ ...f, trip_id: trip.id })); emit("food_photos"); },
    async removeFoodPhoto(id) { need(await sb.from("food_photos").delete().eq("id", id)); emit("food_photos"); },
    async savePet(p) { need(await sb.from("pets").upsert({ ...p, trip_id: trip.id, user_id: me.id, updated_at: new Date().toISOString() })); },
    async journal(tid) { const r = need(await sb.from("journals").select("*").eq("trip_id", tid || trip.id).maybeSingle()); return r; },
    async saveJournal(content, mood, tid) { need(await sb.from("journals").upsert({ user_id: me.id, trip_id: tid || trip.id, content, mood: mood || null, updated_at: new Date().toISOString() })); },
    async getFortune(date) { const r = need(await sb.from("fortunes").select("data").eq("date", date).maybeSingle()); return r ? r.data : null; },
    async saveFortune(date, data) { need(await sb.from("fortunes").upsert({ user_id: me.id, date, data })); },
    async decisions() { return need(await sb.from("decisions").select("*").eq("trip_id", trip.id).order("created_at", { ascending: false }).limit(40)); },
    async addDecision(d) { const r = need(await sb.from("decisions").insert({ ...d, trip_id: trip.id }).select().single()); emit("decisions"); return r; },
    async updateDecision(id, patch) { need(await sb.from("decisions").update(patch).eq("id", id)); emit("decisions"); },
    async deckTable(date) { return need(await sb.rpc("deck_table", { t: trip.id, d: date })); },
    async myDraw(date) { return need(await sb.from("skill_draws").select("*").eq("trip_id", trip.id).eq("date", date).maybeSingle()); },
    async drawCard(date) { const r = need(await sb.rpc("draw_card", { t: trip.id, d: date })); emit("skill_log"); return r; },
    async activateCard(id, activation, copied) { return need(await sb.rpc("activate_card", { p_id: id, p_activation: activation, p_copied: copied || null })); },
    async settleDay(date) { try { const n = need(await sb.rpc("settle_day", { t: trip.id, d: date })); if (n) emit("skill_effects"); } catch (e) {} },
    async effects() { return need(await sb.from("skill_effects").select("*").eq("trip_id", trip.id).order("created_at")); },
    async resolveEffect(id, detail) { need(await sb.from("skill_effects").update({ resolved: true, detail }).eq("id", id)); emit("skill_effects"); },
    async log() { return need(await sb.from("skill_log").select("*").eq("trip_id", trip.id).order("created_at", { ascending: false }).limit(80)); },
    async addLog(date, card, action, effect, meta) { need(await sb.from("skill_log").insert({ trip_id: trip.id, date, card, action, effect, meta: meta || {} })); emit("skill_log"); },
    accessToken: async () => (await sb.auth.getSession()).data.session?.access_token
  };
}

/* ======================= local (demo) ======================= */
function local() {
  const KEY = "td-local-db-v2";
  let db; try { db = JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { db = null; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { console.warn("storage full", e); } };
  if (db && !db.trips) { // migrate the single-trip demo database
    db.trips = db.trip ? [{ ...db.trip, kind: "group", cities: ["xm", "qz"], template: "fujian" }] : []; db.cur = db.trip ? db.trip.id : null;
    db.memberships = db.trip ? { [db.trip.id]: db.membership } : {}; db.companionsBy = db.trip ? { [db.trip.id]: db.companions || [] } : {};
    ["activities", "checklist", "expenses", "decisions", "draws", "effects", "log"].forEach(n => (db[n] || []).forEach(r => { r.trip_id = r.trip_id || db.cur; }));
    (db.stamps || []).forEach(s => { s.trip_id = s.trip_id || db.cur; }); (db.wallet || []).forEach(w => { w.trip_id = w.trip_id || db.cur; });
    delete db.trip; delete db.membership; delete db.companions; save();
  }
  if (db && db.draws) db.draws = db.draws.filter(d => d.card !== "JOKER");
  const A = n => (db[n] = db[n] || []);
  const T = n => A(n).filter(r => r.trip_id === db.cur);
  const cur = () => db && db.trips && db.trips.find(t => t.id === db.cur) || null;
  const now = () => new Date().toISOString();
  const CARDS = ["K", "Q", "J", "10", "9", "8", "7", "6", "4", "X"];
  const self = {
    mode: "local",
    get me() { return db && db.me; }, get trip() { return cur(); }, get trips() { return db ? db.trips || [] : []; },
    get members() { if (!db || !db.me) return []; const t = cur(); return [{ id: db.me.id, name: db.me.name }, ...(t && t.kind !== "solo" ? (db.companionsBy[db.cur] || []) : []).map(n => ({ id: "c:" + n, name: n, local: true }))]; },
    get membership() { const t = cur(); if (!t) return null; const m = (db.memberships || {})[db.cur] || {}; return { total_budget: +(t.total_budget ?? m.total_budget ?? 3000), budget_mode: t.budget_mode || m.budget_mode || "strict", currency: "MYR", cny_rate: +(t.cny_rate ?? m.cny_rate ?? .6) }; },
    async init() { return db && db.me && cur() ? { me: db.me, trip: cur() } : null; },
    async signIn(name) { db = db || { trips: [], memberships: {}, companionsBy: {} }; db.me = db.me || { id: "me" }; db.me.name = name; save(); return db.me; },
    async rename(name) { db.me.name = name; save(); emit("trip_members"); },
    async listTrips() { return db.trips; },
    async createTrip(o) {
      const t = { id: uid("t"), name: o.name, code: "LOCAL", start_date: o.start, end_date: o.end, kind: o.kind || "group", cities: o.cities || [], template: o.template || null, total_budget: o.budget || 3000, budget_mode: "strict", cny_rate: TRIP_SEED.cnyRate };
      db.trips.push(t); db.cur = t.id; db.memberships[t.id] = { total_budget: o.budget || 3000, budget_mode: "strict", currency: "MYR", cny_rate: TRIP_SEED.cnyRate }; db.companionsBy[t.id] = [];
      const { acts, checks } = seedRows(o.template);
      acts.forEach(a => A("activities").push({ ...a, id: uid("a"), trip_id: t.id, status: "planned", extra_min: 0, source: "plan", created_at: now() }));
      checks.forEach(c => A("checklist").push({ ...c, id: uid("c"), trip_id: t.id, done: false }));
      save(); emitAll(); return t;
    },
    async joinTrip() { throw new Error("LOCAL_MODE"); },
    async switchTrip(id) { db.cur = id; save(); emitAll(); },
    async updateTrip(patch) { Object.assign(cur(), patch); save(); emit("trip"); },
    async leaveTrip() { const id = db.cur; db.trips = db.trips.filter(t => t.id !== id); ["activities", "checklist", "expenses", "decisions", "draws", "effects", "log", "custom"].forEach(n => db[n] = A(n).filter(r => r.trip_id !== id)); db.cur = db.trips[0] ? db.trips[0].id : null; save(); emitAll(); },
    async signOut() { localStorage.removeItem(KEY); db = null; },
    setCompanions(list) { db.companionsBy[db.cur] = list; save(); emit("trip_members"); },
    async activities() { return T("activities").sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)); },
    async addActivity(a) { const r = { status: "planned", extra_min: 0, spots: [], ...a, id: uid("a"), trip_id: db.cur, created_at: now() }; A("activities").push(r); save(); emit("activities"); return r; },
    async updateActivity(id, patch) { const r = A("activities").find(x => x.id === id); if (r) Object.assign(r, patch); save(); emit("activities"); },
    async deleteActivity(id) { db.activities = A("activities").filter(x => x.id !== id); save(); emit("activities"); },
    async checklist() { return T("checklist").sort((a, b) => a.sort - b.sort); },
    async addCheck(category, label, sort) { A("checklist").push({ id: uid("c"), trip_id: db.cur, category, label, sort, done: false }); save(); emit("checklist_items"); },
    async setCheck(id, done) { const r = A("checklist").find(x => x.id === id); Object.assign(r, { done, done_by: done ? db.me.id : null, done_at: done ? now() : null }); save(); emit("checklist_items"); },
    async deleteCheck(id) { db.checklist = A("checklist").filter(x => x.id !== id); save(); emit("checklist_items"); },
    async customItems() { return T("custom"); },
    async addCustom(it) { A("custom").push({ ...it, id: uid("u"), trip_id: db.cur, created_by: db.me.id, created_at: now() }); save(); emit("custom_items"); },
    async deleteCustom(id) { db.custom = A("custom").filter(x => x.id !== id); save(); emit("custom_items"); },
    async expenses() { return T("expenses").sort((a, b) => b.created_at.localeCompare(a.created_at)); },
    async addExpense(e) { A("expenses").push({ user_id: db.me.id, shared: true, ...e, id: uid("e"), trip_id: db.cur, created_at: now() }); save(); emit("expenses"); },
    async updateExpense(id, patch) { Object.assign(A("expenses").find(x => x.id === id), patch); save(); emit("expenses"); },
    async deleteExpense(id) { db.expenses = A("expenses").filter(x => x.id !== id); save(); emit("expenses"); },
    async updateBudget(patch) { Object.assign(cur(), patch); save(); emit("budget"); },
    async departures() { return T("departures"); },
    async setDeparture(d) { db.departures = A("departures").filter(x => !(x.trip_id === db.cur && x.user_id === db.me.id)).concat({ ...d, trip_id: db.cur, user_id: db.me.id, created_at: now() }); save(); emit("departures"); },
    async uploadShared(blob, dataUrl) { return dataUrl; },
    async sharedUrl(path) { return path; },
    async wallet() { return A("wallet"); },
    async putWallet(w) { db.wallet = A("wallet").filter(x => x.spot_id !== w.spot_id).concat({ trip_id: db.cur, created_at: now(), ...w }); save(); emit("wallet"); },
    async removeWallet(id) { db.wallet = A("wallet").filter(x => x.spot_id !== id); save(); emit("wallet"); },
    async stamps() { return A("stamps"); },
    async addStamp(s) { const r = { ...s, id: uid("s"), trip_id: db.cur, created_at: now() }; A("stamps").push(r); save(); emit("stamps"); return r; },
    async uploadPhoto(blob, dataUrl) { return dataUrl; },
    async photoUrl(path) { return path && path.startsWith("trip:") ? path.slice(5) : path; },
    async uploadCheckinPhoto(blob, dataUrl) { return "trip:" + dataUrl; },
    async checkins() { return T("checkins").sort((a, b) => b.created_at.localeCompare(a.created_at)); },
    async submitCheckin(c) { const r = { ...c, id: uid("ck"), trip_id: db.cur, user_id: db.me.id, status: "pending", created_at: now() }; A("checkins").push(r); save(); emit("checkins"); if (cur().kind === "solo" || !(db.companionsBy[db.cur] || []).length) { await self.reviewCheckin(r.id, true, null, true); } return r; },
    async guaranteeCheckin(id) { return this.reviewCheckin(id, true, "土地公担保", true); },
    async dayLines(date) { return T("day_lines").filter(x => x.date === date); },
    async saveDayLine(date, text, mood) { const L = A("day_lines"); const i = L.findIndex(x => x.trip_id === db.cur && x.user_id === db.me.id && x.date === date); const row = { trip_id: db.cur, user_id: db.me.id, date, text, mood, id: i >= 0 ? L[i].id : uid("dl") }; if (i >= 0) L[i] = row; else L.push(row); save(); emit("day_lines"); },
    async addMoment(date, note, lat, lng) { A("moments").push({ id: uid("mo"), trip_id: db.cur, user_id: db.me.id, date, note, lat, lng, created_at: now() }); save(); emit("moments"); },
    async momentsOn(date) { return T("moments").filter(x => x.date === date); },
    async letters() { return T("letters"); },
    async sendLetter(to, body, openAt) { A("letters").push({ id: uid("lt"), trip_id: db.cur, from_id: db.me.id, to_id: to, body, open_at: openAt, created_at: now() }); save(); emit("letters"); },
    async reviewCheckin(id, ok, note, selfOk) { const r = A("checkins").find(x => x.id === id); if (!r || r.status !== "pending") throw new Error("ALREADY_REVIEWED"); const by = selfOk ? null : ((db.companionsBy[db.cur] || [])[0] || "旅伴");
      Object.assign(r, { status: ok ? "approved" : "rejected", reviewed_by: by ? "c:" + by : db.me.id, reviewed_at: now(), note: note || null });
      if (ok) { A("stamps").push({ id: uid("s"), user_id: db.me.id, trip_id: r.trip_id, kind: r.kind, key: r.name, name: r.name, city: r.city, date: r.date, mission: r.mission, photo_path: r.photo_path, verified: true, verify_note: by ? `由 ${by} 确认` : "自己确认", created_at: now() }); const a = A("activities").find(x => x.id === r.activity_id); if (a) Object.assign(a, { status: "done", done_by: db.me.id, done_at: now() }); }
      save(); emit("checkins"); emit("stamps"); emit("activities"); return r; },
    async withdrawCheckin(id) { db.checkins = A("checkins").filter(x => x.id !== id); save(); emit("checkins"); },
    async foodPhotos() { return T("food_photos").sort((a, b) => a.created_at.localeCompare(b.created_at)); },
    async addFoodPhoto(f) { A("food_photos").push({ ...f, id: uid("fp"), trip_id: db.cur, user_id: db.me.id, created_at: now() }); save(); emit("food_photos"); },
    async removeFoodPhoto(id) { db.food_photos = A("food_photos").filter(x => x.id !== id); save(); emit("food_photos"); },
    async savePet(p) { db.pets = A("pets").filter(x => !(x.trip_id === db.cur && x.user_id === db.me.id)).concat({ ...p, trip_id: db.cur, user_id: db.me.id, updated_at: now() }); save(); },
    async journal(tid) { return (db.journals || {})[tid || db.cur] || null; },
    async saveJournal(content, mood, tid) { db.journals = db.journals || {}; db.journals[tid || db.cur] = { content, mood, updated_at: now() }; save(); },
    async getFortune(date) { return (db.fortunes || {})[date] || null; },
    async saveFortune(date, data) { db.fortunes = { [date]: data }; save(); },
    async decisions() { return T("decisions").sort((a, b) => b.created_at.localeCompare(a.created_at)); },
    async addDecision(d) { const r = { user_id: db.me.id, reversed: false, ...d, id: uid("d"), trip_id: db.cur, created_at: now() }; A("decisions").push(r); save(); emit("decisions"); return r; },
    async updateDecision(id, patch) { Object.assign(A("decisions").find(x => x.id === id), patch); save(); emit("decisions"); },
    async deckTable(date) { return T("draws").filter(x => x.date === date).map(x => ({ ...x, revealed: true })); },
    async myDraw(date) { return T("draws").find(x => x.date === date && x.user_id === db.me.id) || null; },
    async drawCard(date) {
      const have = await self.myDraw(date); if (have) return have;
      const used = T("draws").filter(x => x.date === date).map(x => x.card), left = CARDS.filter(c => !used.includes(c)); if (!left.length) throw new Error("DECK_EMPTY");
      const r = { id: uid("dr"), trip_id: db.cur, date, user_id: db.me.id, card: left[Math.floor(Math.random() * left.length)], status: "drawn", drawn_at: now() };
      A("draws").push(r); A("log").push({ id: uid("l"), trip_id: db.cur, date, user_id: db.me.id, action: "DRAWN", effect: "抽了一张牌", created_at: now() }); save(); emit("skill_log"); return r;
    },
    async activateCard(id, activation, copied) { const d = A("draws").find(x => x.id === id); if (d.status === "activated") throw new Error("ALREADY_ACTIVATED"); Object.assign(d, { status: "activated", activated_at: now(), activation, copied: copied || null }); save(); return d; },
    async settleDay(date) {
      let n = 0; T("draws").filter(x => x.date === date && x.status === "drawn").forEach(x => {
        if (T("effects").some(e => e.target_date === addDay(date) && e.card === x.card && e.source === "unexecuted")) return;
        const last = T("draws").filter(y => y.date === date && y.status === "activated" && y.card !== "K").sort((a, b) => b.activated_at.localeCompare(a.activated_at))[0];
        const ms = self.members, detail = x.card === "K" ? (last ? "明天自动生效：" + (last.copied || last.card) : "今天没有人发动技能，镜界没有可以复制的") : x.card === "10" ? "第一站由 " + ms[Math.floor(Math.random() * ms.length)].name + " 决定" : null;
        A("effects").push({ id: uid("f"), trip_id: db.cur, target_date: addDay(date), card: x.card, source: "unexecuted", description: OOC[x.card] || "昨天抽到的牌没有发动，今天要补做一次", detail, resolved: false, created_at: now() }); n++;
      }); if (n) { save(); emit("skill_effects"); }
    },
    async effects() { return T("effects"); },
    async resolveEffect(id, detail) { Object.assign(A("effects").find(x => x.id === id), { resolved: true, detail }); save(); emit("skill_effects"); },
    async log() { return T("log").sort((a, b) => b.created_at.localeCompare(a.created_at)); },
    async addLog(date, card, action, effect, meta) { A("log").push({ id: uid("l"), trip_id: db.cur, date, user_id: db.me.id, card, action, effect, meta, created_at: now() }); save(); emit("skill_log"); },
    accessToken: async () => null
  };
  return self;
}
const OOC = { K: "复制今天最后一个发动的技能，明天自动生效", Q: "明天必须比原计划晚出门30分钟", J: "明天第一个决定，自动反转", "10": "明天随机指定一个人，拥有第一站决定权", "9": "明天必须新增一个，原本没计划的地点", "8": "明天必须删掉一个，原本计划的地点" };
function addDay(iso) { const d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }

export const api = URL_ && KEY_ ? cloud() : local();
export const nameOf = id => { const m = api.members.find(x => x.id === id); return m ? m.name : "一位旅伴"; };
