// Trip Deck 配置：一般不用填。部署在 Netlify 时会自动用你原来设好的环境变量
// VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY（和旧版一样）。只有不在 Netlify 上时才需要手动填这里。
window.TD_CONFIG = {
  supabaseUrl: "",          // 例如 https://xxxx.supabase.co
  supabaseAnonKey: "",      // Supabase → Settings → API → anon public
  roomName: "旅行手账",       // Supabase 里房间（trips 表）的名字，行程本身在 App 里导入
  weather: true             // 用 Netlify 函数拿真实天气（/api/weather）
};
