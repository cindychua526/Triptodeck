/* Called by a Supabase Database Webhook on INSERT into skill_log (and checkins). Sends a push to everyone in the trip except the actor.
   Env: SUPABASE_URL (or VITE_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:you@example.com), PUSH_SECRET */
import webpush from "web-push";
const NAMES = { K: "镜界", Q: "时间暂停", J: "命运改写", "10": "主角光环", "9": "传送门", "8": "虚假世界", "7": "射日", "6": "催雨", "4": "借路", X: "无常" };
export default async (req) => {
  if (req.method !== "POST") return new Response("ok");
  const secret = process.env.PUSH_SECRET; if (secret && req.headers.get("x-push-secret") !== secret) return new Response("forbidden", { status: 403 });
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !process.env.VAPID_PRIVATE_KEY) return new Response("not configured", { status: 500 });
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:tripdeck@example.com", process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  const body = await req.json(); const rec = body.record || {}; const table = body.table;
  if (!rec.trip_id) return new Response("skip");
  const H = { apikey: key, Authorization: `Bearer ${key}` };
  const q = async (path) => (await fetch(`${url}/rest/v1/${path}`, { headers: H })).json();
  const prof = rec.user_id ? (await q(`profiles?id=eq.${rec.user_id}&select=display_name`))[0] : null, who = prof ? prof.display_name : "旅伴";
  let title = "旅行手账", text = "", tag = table;
  if (table === "skill_log") { if (rec.action === "DRAWN") return new Response("skip"); text = rec.action === "ACTIVATED" ? `${who} 发动了 ${rec.card} · ${NAMES[rec.card] || ""}${rec.effect ? "：" + rec.effect : ""}` : rec.action === "DECIDED" ? `${who}${rec.effect || " 定了一件事"}` : rec.effect || rec.action; title = rec.action === "ACTIVATED" ? "技能发动" : "旅行手账"; }
  else if (table === "checkins") { if (rec.status !== "pending") return new Response("skip"); text = `${who} 在「${rec.name}」打卡了，等你确认`; title = "等你确认"; }
  else return new Response("skip");
  const subs = await q(`push_subs?trip_id=eq.${rec.trip_id}&select=endpoint,p256dh,auth,user_id`);
  const targets = subs.filter(s => s.user_id !== rec.user_id);
  const payload = JSON.stringify({ title, body: text, tag, url: "/" });
  let sent = 0; await Promise.all(targets.map(async s => { try { await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload); sent++; } catch (e) { if (e.statusCode === 404 || e.statusCode === 410) await fetch(`${url}/rest/v1/push_subs?endpoint=eq.${encodeURIComponent(s.endpoint)}`, { method: "DELETE", headers: H }); } }));
  return new Response(JSON.stringify({ sent }), { headers: { "content-type": "application/json" } });
};
