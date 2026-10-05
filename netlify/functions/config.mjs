// Gives the app the same Supabase settings the original version used (Netlify → Site settings → Environment variables).
// The anon key is public by design; row-level security protects the data.
export default async () => {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
  const vapid = process.env.VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY || "";
  return new Response(JSON.stringify({ supabaseUrl: url, supabaseAnonKey: key, vapidPublicKey: vapid }), { headers: { "content-type": "application/json", "cache-control": "no-store" } });
};
