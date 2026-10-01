// Trip Deck 配置：把 Supabase 项目的地址和 anon key 填进来，留空就只存在手机里
window.TD_CONFIG = {
  supabaseUrl: "",          // 例如 https://xxxx.supabase.co
  supabaseAnonKey: "",      // Supabase → Settings → API → anon public
  roomName: "旅行手账",       // Supabase 里房间（trips 表）的名字，行程本身在 App 里导入
  weather: true             // 用 Netlify 函数拿真实天气（/api/weather）
};
