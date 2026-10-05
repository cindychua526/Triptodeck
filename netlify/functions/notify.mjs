/* Sends a notification to everyone else in a room, even when their app is closed.
   The app calls POST /api/notify with the person's login token; we check they really are in that room first.
   Netlify environment variables needed:
     SUPABASE_SERVICE_ROLE_KEY            (Supabase → Project Settings → API → service_role; keep it secret)
     VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY  (the notification keys; see 通知钥匙.txt)
     VAPID_SUBJECT                        (optional, e.g. mailto:you@example.com)
   plus the VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY you already have. */
import webpush from "web-push";
const J = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json" } });
export default async (req) => {
  if(req.method !== "POST") return J({ ok:true });
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL, anon = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const pub = process.env.VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY;
  if(!url || !anon || !key || !pub || !priv) return J({ error:"not configured" }, 500);
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, ""); if(!token) return J({ error:"no token" }, 401);
  const me = await (await fetch(`${url}/auth/v1/user`, { headers:{ apikey:anon, Authorization:`Bearer ${token}` } })).json().catch(() => ({}));
  if(!me || !me.id) return J({ error:"bad token" }, 401);
  let body = {}; try{ body = await req.json(); }catch(e){}
  const trip = String(body.trip_id || ""), title = String(body.title || "旅行手账").slice(0, 60), text = String(body.body || "").slice(0, 160), tag = String(body.tag || "td").slice(0, 30);
  if(!/^[0-9a-f-]{36}$/i.test(trip) || !text) return J({ error:"bad request" }, 400);
  const H = { apikey:key, Authorization:`Bearer ${key}` }, q = async p => (await fetch(`${url}/rest/v1/${p}`, { headers:H })).json();
  const members = await q(`trip_members?trip_id=eq.${trip}&select=user_id`);
  if(!Array.isArray(members) || !members.some(m => m.user_id === me.id)) return J({ error:"not in this room" }, 403);
  const others = members.map(m => m.user_id).filter(id => id !== me.id); if(!others.length) return J({ sent:0 });
  const subs = await q(`push_subs?user_id=in.(${others.join(",")})&select=id,endpoint,p256dh,auth`);
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:tripdeck@example.com", pub, priv);
  const payload = JSON.stringify({ title, body:text, tag, url:"/" }); let sent = 0;
  await Promise.all((Array.isArray(subs) ? subs : []).map(async s => { try{ await webpush.sendNotification({ endpoint:s.endpoint, keys:{ p256dh:s.p256dh, auth:s.auth } }, payload); sent++; }
    catch(e){ if(e.statusCode === 404 || e.statusCode === 410) await fetch(`${url}/rest/v1/push_subs?id=eq.${s.id}`, { method:"DELETE", headers:H }); } }));
  return J({ sent });
};
