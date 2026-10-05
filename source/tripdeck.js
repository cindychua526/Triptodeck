/* Trip Deck · 旅行手账 — app code (single source)
   Built from the earlier layered files; dead features (voice, steps, email) and replaced copies removed.
   Edit this file directly. Build: python3 assemble.py [deploy] */
/* ================= helpers ================= */
const $ = id => document.getElementById(id);
const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
const ease = t => 1 - Math.pow(1 - t, 3);
function tween(ms, fn, done){ if(REDUCE) ms = Math.min(ms, 100); const t0 = performance.now(); (function f(now){ const t = Math.min(1, (now - t0) / ms); fn(t); if(t < 1) requestAnimationFrame(f); else done && done(); })(t0); }
function toast(m){ if(m == null || m === "") return;  const t = $("toast"); t.textContent = m; t.classList.toggle("top", $("sheet").classList.contains("on") || !!document.querySelector(".vw")); t.classList.add("on"); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove("on"), 2300); }
function buzz(n){ try{ navigator.vibrate && navigator.vibrate(n); }catch(e){} }
const pad = n => String(n).padStart(2, "0");
const WK = ["星期日","星期一","星期二","星期三","星期四","星期五","星期六"];
const dt = s => new Date(s + "T00:00:00");
const md = s => { const d = dt(s); return `${d.getMonth()+1} 月 ${d.getDate()} 日`; };
const mdS = s => { const d = dt(s); return `${d.getMonth()+1}/${d.getDate()}`; };
const wk = s => WK[dt(s).getDay()];
const fmtDur = m => !m ? "" : typeof m === "string" ? m : m >= 60 ? `${+(m/60).toFixed(1)} 小时`.replace(".0 ", " ") : `${m} 分钟`;
const mmss = s => `${pad(Math.floor(s/60))}:${pad(s%60)}`;
const IC = {
  today:'<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  trip:'<path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4Z"/><path d="M9 4v14M15 6v14"/>',
  play:'<rect x="7" y="3.5" width="12" height="17" rx="2.5"/><path d="M4.5 7.5v11a2 2 0 0 0 2 2"/>',
  book:'<path d="M5 4.5h11a3 3 0 0 1 3 3v12H8a3 3 0 0 1-3-3v-12Z"/><path d="M5 16.5a3 3 0 0 1 3-3h11"/>',
  wallet:'<rect x="3.5" y="6" width="17" height="13" rx="3"/><path d="M3.5 10h17M15.5 14.5h2M6 6l9-2.5 1 2.5"/>',
  bell:'<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15L6 16Z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
  arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>', chev:'<path d="m9 6 6 6-6 6"/>', back:'<path d="m15 6-6 6 6 6"/>',
  foot:'<path d="M8 3.5c2 0 3 2.2 3 5s-1 5-3 5-3-2.2-3-5 1-5 3-5Z"/><path d="M16 9c2 0 3 2 3 4.5S18 18 16 18s-3-2-3-4.5S14 9 16 9Z"/>',
  camera:'<rect x="3" y="7" width="18" height="13" rx="3"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8.5 7l1.5-3h4l1.5 3"/>',
  heart:'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>',
  pin:'<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/>',
  plus:'<path d="M12 5v14M5 12h14"/>', check:'<path d="m5 12.5 4.5 4.5L19 7.5"/>', x:'<path d="M6 6l12 12M18 6 6 18"/>',
  bed:'<path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="1.8"/>',
  plane:'<path d="M10.5 13.5 3 11l1.5-1.5 7 1 4-4a2 2 0 0 1 3 3l-4 4 1 7L15 22l-2.5-7.5"/>',
  bus:'<rect x="5" y="3.5" width="14" height="14" rx="3"/><path d="M5 11h14M8 20.5v-3M16 20.5v-3"/><circle cx="8.5" cy="14.5" r=".8"/><circle cx="15.5" cy="14.5" r=".8"/>',
  bowl:'<path d="M3.5 11h17a8.5 8.5 0 0 1-17 0Z"/><path d="M9 7.5c0-1.5 1-1.5 1-3M13 7.5c0-1.5 1-1.5 1-3"/>',
  spark:'<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/>', route:'<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h6a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h6"/>',
  clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', dice:'<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="9" cy="9" r="1.2"/><circle cx="15" cy="15" r="1.2"/><circle cx="15" cy="9" r="1.2"/><circle cx="9" cy="15" r="1.2"/>',
  grid:'<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  tag:'<path d="M3.5 12.5V4.5h8l9 9-8 8-9-9Z"/><circle cx="8" cy="9" r="1.5"/>', share:'<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6"/>',
  speaker:'<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z"/><path d="M15.5 9a4 4 0 0 1 0 6"/>'
};
const I = (n, s = 20, w = 1.8) => `<svg class="ico" width="${s}" height="${s}" style="width:${s}px;height:${s}px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]}</svg>`;
const HEART = `<svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" fill="#fff"/></svg>`;

/* ================= data ================= */
let TODAY = 0, PHASE = "during"; const TRIP = { name:"", start:"", end:"", cities:[], budget:4000, currency:"MYR", rate:.6, cityNames:"", range:"", rangeDot:"", stays:[], guides:[] };
const TDATE = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const DAYCFG = [];
const FOODS = {};
const CITIES = [];

const RATE = { love:"好吃！", ok:"还行", meh:"不爱" };
const FRIENDS = [["我","#E2B77A"]];
const S = { tab:"home", day:TODAY, tday:TODAY, seg:"tix", acity:"xm", archOpen:false, diary:TODAY,
  packed:new Set(), wallet:[], checkins:[], decisions:[] };
let PACK_TOTAL = CHECK.reduce((a, g) => a + g.items.length, 0);

/* ================= tab bar ================= */
const TABS = [["home","today","今日"],["trip","trip","行程"],["play","play","玩法"],["book","book","手账"],["money","wallet","账本"]];

/* ================= 今日 ================= */
function bubbles(){ const L = ALBUM.filter(x => x[4] === S.day).slice(0, 3).map(x => x[0]); return L.map((k, i) => [k, [300,252,318][i], [318,372,392][i], [54,44,40][i]]).map(([k,x,y,s]) => `<span class="bub" aria-hidden="true" style="left:${x}px; top:${y}px; width:${s}px; height:${s}px"><img src="${P[k] || k}" alt=""><i>${HEART}</i></span>`).join(""); }
function home(){
  const d = DAYCFG[S.day], dd = DAYS[S.day], past = S.day <= TODAY;
  const sights = dd.items.filter(i => i.kind === "sight" || i.kind === "food").length, done = S.checkins.filter(c => c.di === S.day).length;
  const pending = dd.items.map((it, k) => [it, k]).filter(([it, k]) => (it.kind === "sight" || it.kind === "food") && !ckDone(S.day, k)); const nextIdx = pending.length ? pending[0][1] : -1, next = nextIdx >= 0 ? dd.items[nextIdx] : (dd.items[0] || { title:"" });
  return `<div class="hero"><img src="${P[d.photo]}" alt="${d.place}"><div class="scrim"></div>
    <div class="htop"><span class="tag glass">DAY ${pad(S.day+1)} / ${pad(DAYS.length)}</span><span style="flex:1"></span>
      <button class="mstack glass" data-act="members" aria-label="旅伴 ${FRIENDS.length} 人">${FRIENDS.slice(0, 3).map(([n, c, av]) => av ? `<i class="cav">${avatarSVG(av)}</i>` : `<i style="background:${c}">${n}</i>`).join("")}<b>${FRIENDS.length}</b></button><button class="rbtn glass" data-act="settings" aria-label="设置">${I("gear")}</button><button class="rbtn glass" data-act="feed" aria-label="动态">${I("bell")}</button><button class="avatar" data-act="shelf" aria-label="我的旅行书架" style="${FRIENDS[0][2] ? "padding:0; overflow:hidden" : ""}">${FRIENDS[0][2] ? avatarSVG(FRIENDS[0][2]) : (S.me || "我").slice(0, 1)}</button></div>
    <div class="temp" data-act="wxplay" role="button" tabindex="0" aria-label="打开跟着天气的小动画：${weatherPick()[1]}">${d.temp !== "—" && d.temp != null && d.temp !== "" ? `<b class="cu">${d.temp}°C</b>` : `<b class="wxi" aria-hidden="true">${periodIcon()}</b>`}<span><span>${d.city} · ${S.day === TODAY ? "现在" : past ? "那天" : "预报"}</span><span>${d.wx && d.wx !== "—" ? d.wx : periodName()}</span></span><i class="wxgo" aria-hidden="true">▶</i></div>
    ${past ? bubbles() : ""}
    <div class="htitle">${PHASE === "before" ? `<small style="display:block; font-size:13px; color:var(--amber); margin-bottom:6px; letter-spacing:.06em">还有 ${dayDiff(TDATE(), TRIP.start)} 天出发</small>` : PHASE === "after" ? `<small style="display:block; font-size:13px; color:var(--mu); margin-bottom:6px">这趟旅行已经结束</small>` : ""}<h1>${d.place}</h1><p>${d.city} · ${md(dd.date)} · ${wk(dd.date)}</p></div></div>
  <div class="stats"><button data-act="tab:money" aria-label="今天花了">${I("wallet",18)}<span class="cu">${HSYM()} ${Math.round(todaySpend())}</span><em>今天</em></button><i></i><button data-act="photos2" aria-label="照片">${I("camera",18)}<span class="cu">${d.pics}</span><em>张</em></button><i></i><button data-act="passport" aria-label="打卡">${I("pin",18)}<span class="cu">${okCheckins().filter(c => c.di === S.day).length}</span><em>打卡</em></button></div>
  ${pendingHTML()}${tipsHTML()}${oocTile()}${fxBanner()}<div class="sec" style="margin-top:20px"><h2>这趟旅行<span>${DAYS.length} 天 · ${TRIP.cityNames}</span></h2></div>
  <div class="days">${DAYCFG.map((c, i) => `<button data-act="day:${i}" aria-label="第 ${i+1} 天 ${c.place}" ${i === S.day ? 'aria-current="date"' : ""} class="${i > TODAY ? "fut" : ""}"><img src="${P[c.photo]}" alt=""><span>D${pad(i+1)}</span></button>`).join("")}</div>
  <button class="capture" data-act="capture"><span class="mic">${I("camera",20,2)}</span><b>记录此刻</b><small>照片 · 笔记</small><span style="flex:1"></span>${I("arrow")}</button>
  <div class="tiles">
    <button class="tile card" data-act="${nextIdx >= 0 ? `place:${S.day}:${nextIdx}` : "tab:trip"}" style="grid-column:1/-1; flex-direction:row; align-items:center; gap:16px"><small>今日打卡</small><b style="font-size:34px; line-height:36px">${sights ? done : "—"}<span style="font-size:15px; color:var(--mu); font-weight:400">${sights ? ` / ${sights} 处` : ""}</span></b>
      <span class="seg5">${Array.from({length: Math.min(sights, 6)}, (_, i) => `<i class="${i < done ? "on" : ""}"></i>`).join("")}</span><small>${nextIdx >= 0 ? `点一下去「${next.title}」打卡` : "今天没有要打卡的地方"}</small></button></div>`;
}

/* ================= 行程 ================= */
const KIND = { sight:["景点","pin"], food:["美食","bowl"], lodging:["住宿","bed"], flight:["航班","plane"], transit:["交通","bus"] };
const PHOTO_OF = t => /鼓浪屿|码头|海|沙坡尾|洛伽/.test(t) ? "sea" : /开元寺|天后宫|关岳庙|古寺|钟楼|南普陀|清水宫/.test(t) ? "pagoda" : /西街|中山|金鱼巷|五店市|梧林|古城|集美/.test(t) ? "lane" : /清源山/.test(t) ? "tea" : /海岸|红塔湾/.test(t) ? "beach" : /夜市|音乐广场|天泉/.test(t) ? "night" : null;
function trip(){
  const dd = DAYS[S.tday], c = DAYCFG[S.tday], pk = S.packed.size;
  return `<div class="ph"><div><h1>行程</h1><p>${TRIP.cityNames} · <button class="chip" data-act="dates" aria-label="改旅行日期" style="height:26px; font-size:12px; padding:0 10px">${TRIP.range} · 改日期</button></p></div><span style="display:flex; gap:6px"><button class="chip" data-act="tools">${I("grid",16)}工具</button><button class="chip" data-act="map">${I("pin",16)}地图</button></span></div>
  ${fxBanner()}<div class="dchips">${DAYS.map((d, i) => `<button data-act="tday:${i}" ${i === S.tday ? 'aria-current="date"' : ""}><b>D${pad(i+1)}</b><small>${mdS(d.date)}</small></button>`).join("")}</div>
  <button class="citycard" data-act="place:${S.tday}:${Math.max(0, dd.items.findIndex(i => i.kind === "sight"))}"><img src="${P[c.photo]}" alt=""><span class="scrim"></span>
    <span class="temp" ${c.temp === "—" ? 'style="display:none"' : ""}><b>${c.temp}°C</b><span><span>${c.city}</span><span>${c.wx}</span></span></span>
    <span class="t"><b>${c.city} · ${c.place}</b><small>第 ${S.tday+1} 天 · ${md(dd.date)} ${wk(dd.date)}</small></span></button>
  ${true ? `<button class="pack card" data-act="pack">${suitMini(pk / PACK_TOTAL)}<span style="flex:1"><b style="font-size:15px">我的行李清单 <span class="privtag">私人</span></b><span style="display:block; font-size:12px; color:var(--mu); margin-top:2px">${pk} / ${PACK_TOTAL} 件装好了 · 只有你看得到</span><span class="bar"><i style="width:${pk / PACK_TOTAL * 100}%"></i></span></span>${I("chev",18)}</button>` : ""}
  <div class="sec" style="margin-top:20px"><h2>${dd.items.filter(i => i.kind !== "transit").length} 个安排<span>橙点 = 主要行程，技能不能动它</span></h2></div>
  <div class="tl" data-day="${S.tday}">${tripItems(S.tday).map((it, ii) => {
    if(it.kind === "transit" && !it.main) return `<div class="tr">${I("bus",14)}${it.title}</div>`;
    const [lab, ic] = KIND[it.kind] || ["安排","pin"], ph = (it.kind === "sight" || it.kind === "food") && PHOTO_OF(it.title);
    const art = it.kind === "food" ? `<span style="color:var(--amber)">${I("bowl",20)}</span>` : ph ? `<img src="${P[ph]}" alt="">` : I(ic, 20);
    const tap = (it.kind === "sight" || it.kind === "food") && !it._added && !it._cut;
    return `<div class="row ${it.main ? "main" : ""}${it._cut ? " cut" : ""}${it._added ? " added" : ""}" data-i="${it._i ?? -1}"><time>${it.t}${it._shift ? `<small class="was">${it._was}</small>` : ""}</time><span class="rail"><i></i></span>
      <${tap ? `button data-act="place:${S.tday}:${it._i ?? ii}"` : "div"} class="it"><span class="k">${art}</span><span style="min-width:0"><b>${it.title}</b><small>${lab}${it.dur ? " · " + fmtDur(it.dur) : ""}</small></span>${it._cut ? `<em class="cutag">${it._cut}</em>` : it._added ? `<em class="addtag">${it._added}</em>` : it.main ? "<em>主要行程</em>" : ""}</${tap ? "button" : "div"}></div>`;
  }).join("")}</div><button class="tladd" data-act="itadd:${S.tday}">${I("plus",16,2)}加一个安排</button>`;
}
function suitMini(r){ const h = 30 * r; return `<svg width="42" height="46" viewBox="0 0 42 46" aria-hidden="true"><path d="M15 8V4.5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2V8" stroke="#8a6238" stroke-width="2.4" fill="none"/><rect x="3" y="8" width="36" height="34" rx="7" fill="#6B4A2C"/><clipPath id="sm"><rect x="3" y="8" width="36" height="34" rx="7"/></clipPath><rect clip-path="url(#sm)" x="3" y="${42 - h}" width="36" height="${h}" fill="#E8A864"/><path d="M14 8v34M28 8v34" stroke="#4A3220" stroke-width="3" opacity=".7"/></svg>`; }

/* ================= 玩法 ================= */
function miniTicket(c, fname, tw, rot){ const cc = cityById(c), f = FOODS[fname];
  return `<div class="tk" style="--tw:${tw}px; --c:${cc.color}; --r:${rot}deg"><div class="tk-main"><div class="tk-top"><span>FOOD TICKET</span><span>No. ????</span></div><div class="tk-name">${fname}</div><div class="tk-en">${cc.name} · ${f.en}</div><div class="tk-foot">吃到了就撕下</div></div><div class="tk-stub"><b>撕下收藏</b><small>TEAR</small></div></div>`; }

/* ================= 手账 ================= */
function frontTicket(w, tw, stampAnim){ const cc = cityById(w.c), f = FOODS[w.f] || { en:"", mean:"" };
  return `<div class="tk" style="--tw:${tw}px; --c:${cc.color}"><div class="tk-main"><div class="tk-top"><span>TASTE OF ${cc.en.toUpperCase()}</span><span>No. ${pad(w.no).padStart(4, "0")}</span></div>
    <div class="tk-name">${w.f}</div><div class="tk-en">${f.en}</div><p class="tk-mean">${f.mean}</p><div class="tk-foot">${w.d}</div><div class="tk-food">${FOODART[w.f] || (O && O.foodArt ? O.foodArt(w.f) : "")}</div></div>
    <div class="tk-stub"><b>尝过了</b><small>${cc.name}</small></div>${w.r ? `<div class="tk-rate r-${w.r}${stampAnim ? " stamp" : ""}">${RATE[w.r]}</div>` : ""}</div>`; }
function stubCol(k){ return ({ sea:"#6A3A2E", tea:"#2E4A3A", night:"#2A3566", pagoda:"#6B3524", lane:"#6E2A22", beach:"#1F4B55" })[k]; }

function vcard(k, zh, en, date, cap){ return `<div class="vcard" style="background:${stubCol(k)}"><div class="h"><small>TRAVEL MEMORY</small><b>${zh}</b><span><span>${en}</span><span>${date}</span></span></div><div class="ph2"><img src="${P[k]}" alt="${zh}"><span style="position:absolute; left:8px; bottom:8px; padding:5px 9px; border-radius:99px; background:rgba(10,12,16,.5); font-size:11px">${cap}</span></div></div>`; }
const ARCH = {};
function perf(w, h, r = 3.2, step = 9){ const nx = Math.max(1, Math.round(w/step)), ny = Math.max(1, Math.round(h/step)), sx = w/nx, sy = h/ny; let d = "M0 0";
  for(let i = 0; i < nx; i++){ const c = sx*(i+.5); d += `L${c-r} 0A${r} ${r} 0 0 0 ${c+r} 0`; } d += `L${w} 0`;
  for(let i = 0; i < ny; i++){ const c = sy*(i+.5); d += `L${w} ${c-r}A${r} ${r} 0 0 0 ${w} ${c+r}`; } d += `L${w} ${h}`;
  for(let i = 0; i < nx; i++){ const c = w - sx*(i+.5); d += `L${c+r} ${h}A${r} ${r} 0 0 0 ${c-r} ${h}`; } d += `L0 ${h}`;
  for(let i = 0; i < ny; i++){ const c = h - sy*(i+.5); d += `L0 ${c+r}A${r} ${r} 0 0 0 0 ${c-r}`; } return d + "Z"; }
let sid = 0;
function stampSVG(k, label, en, pm){ sid++; const w = 108, h = 138, m = 7;
  return `<svg viewBox="0 0 ${w} ${h}" aria-hidden="true"><defs><clipPath id="sc${sid}"><rect x="${m}" y="${m}" width="${w-2*m}" height="${h-2*m-18}" rx="2"/></clipPath></defs><path d="${perf(w, h)}" fill="#F4EFE4"/>
    <image href="${P[k]}" x="${m}" y="${m}" width="${w-2*m}" height="${h-2*m-18}" preserveAspectRatio="xMidYMid slice" clip-path="url(#sc${sid})"/>
    <text x="${m}" y="${h-m-4}" font-family="-apple-system,PingFang SC,sans-serif" font-size="9" font-weight="700" fill="#2B2A28">${label}</text><text x="${w-m}" y="${h-m-4}" text-anchor="end" font-family="-apple-system, PingFang SC, Noto Sans SC, sans-serif" font-size="8" fill="#2B2A28">${en}</text>
    ${pm ? `<g opacity=".6" stroke="#2B2A28" fill="none" stroke-width="1.2"><circle cx="${w-16}" cy="22" r="16"/><circle cx="${w-16}" cy="22" r="12"/><path d="M${w-64} 16 q6-4 12 0 t12 0 t12 0M${w-64} 22 q6-4 12 0 t12 0 t12 0M${w-64} 28 q6-4 12 0 t12 0 t12 0"/></g><text x="${w-16}" y="25" text-anchor="middle" font-family="-apple-system, PingFang SC, Noto Sans SC, sans-serif" font-size="7" fill="#2B2A28" opacity=".75">${pm}</text>` : ""}</svg>`; }
const FAN = [{x:-40,y:14,r:-7},{x:4,y:0,r:2},{x:48,y:12,r:-3},{x:94,y:2,r:6}];
function layoutArch(){ const a = document.querySelector(".arch"); if(!a) return; a.querySelectorAll(".stp").forEach((s, i) => { const f = FAN[i];
  s.style.transform = S.archOpen ? `translate(${f.x}px, ${f.y}px) rotate(${f.r}deg)` : `translate(-30px, 20px) rotate(0deg) scale(.8)`; s.style.transitionDelay = S.archOpen ? `${.15 + i*.07}s` : "0s"; }); }
function book(){
  const seg = (k, l) => `<button role="tab" aria-selected="${S.seg === k}" data-act="seg:${k}">${l}</button>`;
  let body = "";
  if(S.seg === "tix"){
    body = `<div class="sec"><h2>美食票夹<span>${S.wallet.length} 张 · 撕一张就会放进来</span></h2></div>
      <div class="wallet">${S.wallet.length ? "" : emptyBox("还没有美食票", "玩法 → 撕一张美食票，吃到了就撕")}${S.wallet.map((w, i) => [w, i]).reverse().map(([w, i]) => `<button class="tkw" data-act="tkview:${i}" aria-label="放大看这张${w.f}票" style="border:0; background:none; padding:0; flex-shrink:0">${frontTicket(w, 270)}</button>`).join("")}<button class="card" data-act="tear" style="flex-shrink:0; width:120px; height:${Math.round(270*.42)}px; border-radius:12px; display:grid; place-items:center; color:var(--mu); font-size:13px">${I("plus",22)}<span>撕一张</span></button></div>
      <div class="sec" style="margin-top:6px"><h2>照片票根<button class="chip on" data-act="stubnew" style="height:34px">${I("plus",14,2)}做一张</button></h2></div>${S.stubs.map((st, i) => `<div class="stubwrap" data-stub="${i}">${stubHTML(st, i === 0 && S.stubFresh)}<button class="stubdl" data-act="stubdl:${i}" aria-label="把这张票根存成图片">${I("plus",12,2)}存成图片</button></div>`).join("")}
      ${S.stubs.length ? "" : emptyBox("还没有照片票根", "首页「记录此刻」传一张照片，勾上「做成票根」")}${keepsHTML()}`;
  } else if(S.seg === "stamps"){
    const A = ARCH[S.acity] || Object.values(ARCH)[0]; if(!A){ body = emptyBox("还没有邮票", "每打一次卡，就会多一枚邮票"); } else {
    body = `<div class="arch ${S.archOpen ? "open" : ""}">
      ${A.st.map(([k, l], i) => `<button class="stp" data-act="stview:${i}" aria-label="看「${l}」这枚邮票">${stampSVG(k, l, A.en, "")}</button>`).join("")}
      <button class="cover" data-act="arch" aria-expanded="${S.archOpen}" style="background:${A.col}"><span class="blur1" style="left:40px; top:30px; width:90px; height:90px; background:${A.b1}"></span><span class="blur2" style="left:10px; top:90px; width:70px; height:70px; background:${A.b2}"></span>
        <span class="ct"><b>${A.n} · 集章册</b><small>MINI ARCHIVE · ${A.en}</small><i></i><i style="margin-top:4px"></i></span></button>
      <p style="position:absolute; left:0; right:0; bottom:0; margin:0; text-align:center; font-size:12px; color:var(--mu)">${A.have ? (S.archOpen ? "点封面合上" : "点一下打开") : "还没有盖章，去了再来"}</p></div>
      <div class="dots3">${Object.entries(ARCH).map(([k, a]) => `<button data-act="acity:${k}" aria-pressed="${S.acity === k}"><i style="background:${a.col}"></i>${a.n}</button>`).join("")}</div>
      <div class="sec"><div class="card" style="padding:16px; display:flex; gap:14px; align-items:center"><span style="width:54px; height:54px; border-radius:50%; border:2px solid var(--amber); color:var(--amber); display:grid; place-items:center; font-family:var(--serif); font-size:22px; flex-shrink:0">${A.n[0]}</span>
        <span style="flex:1"><span style="display:flex; justify-content:space-between; font-size:14px"><b>${A.n}勋章</b><span style="color:var(--mu)">${A.have} / 5 枚</span></span><span style="display:block; height:6px; border-radius:3px; background:rgba(255,255,255,.1); margin:8px 0"><span style="display:block; height:100%; width:${A.have*20}%; border-radius:3px; background:var(--amber)"></span></span><small style="color:var(--mu); font-size:12px">${A.have >= 5 ? "已解锁金色勋章" : `再盖 ${5 - A.have} 枚，护照里多一枚金色勋章`}</small></span></div></div>`;
  } } else if(S.seg === "cal"){
    const t0 = new Date(TRIP.start + "T12:00:00"), t1 = new Date(TRIP.end + "T12:00:00"), start = new Date(t0); start.setDate(t0.getDate() - t0.getDay()); const ncell = Math.ceil(((t1 - start) / 864e5 + 1) / 7) * 7, cells = [];
    for(let i = 0; i < ncell; i++){ const d = new Date(start); d.setDate(start.getDate() + i); const iso = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`, di = DAYS.findIndex(x => x.date === iso);
      if(di >= 0 && di <= TODAY){ const n = ALBUM.filter(x => x[4] === di).length; cells.push(`<button class="c" data-act="diaryday:${di}" aria-label="${md(iso)}的手账" style="border:0; padding:0"><span class="st" style="transform:rotate(${[-4,3,-2,4,-3][di % 5]}deg)"><img src="${P[DAYCFG[di].photo]}" alt=""></span>${n ? `<b>${n}</b>` : ""}</button>`); }
      else if(di > TODAY) cells.push(`<span class="c" style="box-shadow:inset 0 0 0 1.5px rgba(232,168,100,.5); color:var(--ink)">${d.getDate()}</span>`);
      else cells.push(`<span class="c" style="${d < t0 || d > t1 ? "opacity:.4" : ""}">${d.getDate()}</span>`); }
    body = `<div style="text-align:center; margin-top:14px"><div style="font-family:var(--serif); font-size:32px">${MONTH_EN[t0.getMonth()]}</div><small style="color:var(--mu)">${TRIP.start.slice(0,4)} · ${TRIP.name}</small></div>
      <div class="sec"><div class="card" style="padding:14px 12px"><div class="calg">${"日一二三四五六".split("").map(w => `<span class="w">${w}</span>`).join("")}${cells.join("")}</div></div></div>
      <div class="sec" style="display:grid; grid-template-columns:1.5fr 1fr; gap:12px"><div class="card" style="padding:16px; position:relative; overflow:hidden; height:150px"><small style="color:var(--mu)">到今天为止</small><div style="margin-top:4px"><b style="font-size:40px">${S.stubs.length + S.wallet.length}</b> <small style="color:var(--mu)">张票根</small></div><small style="color:var(--mu)">${Math.min(DAYS.length, TODAY + 1)} 天 · ${CITIES.length} 城 · ${S.wallet.length} 顿美食</small>
        <span style="position:absolute; right:-10px; bottom:-8px; width:86px; height:62px; border-radius:12px; overflow:hidden; border:3px solid #F4EFE4; transform:rotate(-10deg)"><img src="${P.sea}" alt="" style="width:100%; height:100%; object-fit:cover"></span></div>
        <button class="card" data-act="album" style="padding:16px; text-align:left; height:150px; display:flex; flex-direction:column; justify-content:space-between"><span style="display:flex">${["lane","pagoda"].map((k, i) => `<span style="width:52px; height:56px; border:3px solid #F4EFE4; border-radius:6px; overflow:hidden; transform:rotate(${i ? 7 : -8}deg); margin-left:${i ? -14 : 0}px"><img src="${P[k]}" alt="" style="width:100%; height:100%; object-fit:cover"></span>`).join("")}</span><small style="color:var(--mu)">相册 · ${ALBUM.length} 张</small></button></div>`;
  } else body = diary();
  return `<div class="ph"><div><h1>手账</h1><p>这趟旅行留下来的东西，只有你看得到</p></div></div>${keepsakeShelf()}<div class="segs" role="tablist">${seg("tix","票根")}${seg("stamps","邮票册")}${seg("cal","日历")}${seg("diary","日记")}</div>${body}`;
}
const DIARY = [];
function diary(){
  const i = S.diary, D = DIARY[i], c = DAYCFG[i], dd = DAYS[i], wd = ["SUN","MON","TUE","WED","THU","FRI","SAT"][dt(dd.date).getDay()];
  const vb = [10,18,26,14,30,20,12,24,16,8].map(h => `<i style="display:block; width:3px; height:${h}px; border-radius:2px; background:#1F1E1B"></i>`).join("");
  return `<div class="hs" style="padding-top:12px">${DIARY.map((_, k) => `<button class="chip ${k === i ? "on" : ""}" data-act="diaryday:${k}">D${pad(k+1)}</button>`).join("")}<span style="flex:1"></span><button class="chip" data-act="dedit">${I("grid",14)}编辑排版</button></div>
  <div class="paper" aria-label="第 ${i+1} 天的手账">
    <div style="left:20px; top:22px; width:122px; height:122px; border-radius:50%; border:2px dashed #1F1E1B; display:flex; flex-direction:column; align-items:center; justify-content:center; transform:rotate(-4deg)"><span style="font-family:var(--handl); font-size:56px; line-height:48px; color:#E0602F">${pad(i+1)}</span><span style="font-family:var(--mono); font-size:12px; letter-spacing:.3em">${wd}</span></div>
    <span class="washi" style="left:28px; top:14px; width:64px; transform:rotate(-14deg); background:repeating-linear-gradient(90deg, rgba(214,202,176,.9) 0 5px, rgba(255,255,255,.25) 5px 7px)"></span>
    <figure class="pol" style="left:160px; top:30px; width:188px; transform:rotate(3deg)"><img src="${P[D.ph]}" alt="${D.cap}" style="height:170px"><figcaption>${D.cap}</figcaption></figure>
    <span class="washi" style="left:216px; top:18px; width:76px; transform:rotate(4deg)"></span>
    <div style="left:22px; top:172px; font-family:var(--hand); font-size:28px; color:#E0602F; transform:rotate(-4deg)">${D.tag}<svg width="130" height="10" viewBox="0 0 130 10" style="display:block"><path d="M2 6 Q65 0 128 5" stroke="#E0602F" stroke-width="2" fill="none" stroke-linecap="round"/></svg></div>
    <div class="cap" style="left:26px; top:238px; transform:rotate(-6deg)"><div><b>${okCheckins().filter(k => k.di === S.diary).length}</b><small>打卡</small></div></div>
    <div class="cap" style="left:122px; top:262px; transform:rotate(8deg)"><div><b>${c.temp}°</b><small>${c.wx.slice(0,2)}</small></div></div>
    ${false ? `<div style="left:230px; top:300px; width:128px; transform:rotate(-2deg)"><div style="padding:14px 12px; background:#FBFAF6; border-radius:10px; box-shadow:0 10px 20px rgba(0,0,0,.14); display:flex; align-items:center; gap:10px"><button data-act="soon" aria-label="播放语音" style="width:38px; height:38px; border-radius:50%; border:0; background:#1F1E1B; color:#fff; display:grid; place-items:center; padding:0 0 0 2px"><svg width="14" height="14" viewBox="0 0 24 24"><path d="M7 4.5v15l12-7.5-12-7.5Z" fill="#fff"/></svg></button><span style="display:flex; align-items:center; gap:3px">${vb}</span></div><span style="display:block; font-family:var(--hand); font-size:20px; margin:6px 0 0 16px">语音 · ${mmss(c.voice)}</span></div><span class="washi" style="left:262px; top:292px; width:56px; transform:rotate(-8deg)"></span>` : ""}
    <div style="left:222px; top:430px; height:38px; padding:0 14px; background:rgba(176,196,160,.9); display:flex; align-items:center; gap:6px; transform:rotate(-3deg)">${I("pin",16)}<span style="font-family:var(--hand); font-size:20px">${c.city} · ${c.place}</span></div>
    <article class="note" style="left:16px; top:380px; transform:rotate(-1.5deg)"><small>NOTE 01</small><p style="font-family:${fontOf(D.font || "hand")}">${D.note}${D.extra ? "<br>" + D.extra : ""}</p></article>
    <span class="washi" style="left:64px; top:370px; width:76px; transform:rotate(-3deg)"></span>
    <figure class="pol" aria-hidden="true" style="left:236px; top:500px; width:138px; padding:8px 8px 28px; transform:rotate(5deg)"><img src="${P[i % 2 ? "lane" : "night"]}" alt="" style="height:120px"></figure>
    <button data-act="soon" aria-label="添加照片、笔记或贴纸" style="right:18px; bottom:18px; width:58px; height:58px; border-radius:50%; border:0; background:#1F1E1B; color:#fff; display:grid; place-items:center; padding:0; box-shadow:0 12px 24px rgba(0,0,0,.3)">${I("plus",26,2)}</button>
  </div>${diaryVoicesHTML(S.diary)}`;
}

/* ================= 账本 ================= */
let RATE_CNY = 0.6;
const EXP = [];

const VIEWS = { home, trip, play, book, money };

/* ================= overlays ================= */
let curOv = null;

function openPlace(di, ii){ CK.di = di; CK.ii = ii;
  const it = DAYS[di].items[ii], c = DAYCFG[di], key = Object.keys(SPOTS).find(k => it.title.includes(k) || k.includes(it.title.replace(/ · .*/, ""))), sp = key && SPOTS[key];
  const ph = PHOTO_OF(it.title) || c.photo, past = ckDone(di, ii);
  const av = FRIENDS.map(([n, col], k) => `<span style="width:38px; height:38px; border-radius:50%; background:${col}; color:#0B0C10; font-weight:700; font-size:13px; display:grid; place-items:center; border:2px solid #0A0C0E; margin-left:${k ? -10 : 0}px">${n}</span>`).join("");
  $("ov-place").innerHTML = `<div class="pimg"><img src="${P[ph]}" alt="${it.title}"></div>
    <div class="ovtop"><button class="rbtn glass" data-act="close" aria-label="返回">${I("back",22,2)}</button><button class="rbtn glass" data-act="soon" aria-label="收藏">${I("heart")}</button></div>
    ${c.temp !== "—" ? `<div class="pw"><b>${c.temp}°</b><span><strong>${c.wx}</strong>${c.city} · 第 ${di+1} 天</span></div>` : ""}
    <div class="pinfo"><small>${c.city} · ${md(DAYS[di].date)} ${it.t}</small><h1>${it.title}</h1>
      <div class="cols"><div><b>类型</b><span>${(KIND[it.kind] || ["安排"])[0]}</span></div><div><b>停留</b><span>${it.dur ? fmtDur(it.dur) : "约 2 小时"}</span></div><div><b>同行</b><span>${FRIENDS.length} 人</span></div></div>
      <p>${sp ? sp.d : it.note || "到了之后记得拍一张照片，回来就能变成一张票根。"}</p></div>
    <div class="pbot"><span style="display:flex">${av}</span><span style="flex:1"></span><button class="btn ghost" data-act="checkin" style="background:#1E2127">${past ? "已打卡 · 再盖一次" : "盖章打卡"}</button></div>`;
  openOv("ov-place");
}
/* record */

/* packing */
function openPack(){ renderPack(); openOv("ov-pack"); }

/* places carousel */
const PLACES = [];
function openCar(){ if(!PLACES.length) return toast("还没有照片，首页「记录此刻」传一张就有了");
  $("ov-car").innerHTML = `<div class="scr" style="background:#000"><div class="ovtop" style="position:relative; top:auto; left:auto; right:auto; padding:14px 16px 0"><button class="rbtn glass" data-act="close" aria-label="返回">${I("back",22,2)}</button><span></span></div>
    <div class="ph" style="padding-top:4px"><div><h1>我走过的地方</h1><p>左右滑一滑 · 每一张都是你自己拍的</p></div></div>
    <div class="car" id="car">${PLACES.map((p, i) => `<div class="sl"><div class="sk"><img src="${P[p.k]}" alt="${p.z}"></div></div>`).join("")}</div>
    <div class="kcard" id="kcard"></div></div>`;
  openOv("ov-car"); const car = $("car"); car.onscroll = () => { cancelAnimationFrame(car.r); car.r = requestAnimationFrame(syncCar); }; syncCar();
}
function syncCar(){
  const car = $("car"); if(!car) return; const mid = car.scrollLeft + car.clientWidth / 2; let best = 0, bd = 1e9;
  [...car.children].forEach((s, i) => { const c = s.offsetLeft + s.offsetWidth / 2, dd = Math.abs(c - mid), t = Math.min(1, dd / s.offsetWidth); s.firstElementChild.style.transform = `scale(${1 - .12*t}) rotate(${(i % 2 ? 3 : -3) * (1 - t)}deg)`; s.firstElementChild.style.opacity = 1 - .5*t; if(dd < bd){ bd = dd; best = i; } });
  if(car.cur === best) return; car.cur = best; const p = PLACES[best], dots = n => [0,1,2].map(k => `<i style="display:inline-block; width:7px; height:7px; border-radius:50%; background:#2B1C0E; opacity:${k < n ? 1 : .25}; margin-left:3px"></i>`).join("");
  $("kcard").innerHTML = `${grainSVG()}<div style="position:relative"><div style="display:flex; justify-content:space-between; align-items:center"><h2 style="margin:0; font-size:24px; font-weight:600">${p.n}</h2><button data-act="keepplace" aria-label="收进旅行票夹" style="width:36px; height:36px; border-radius:50%; border:1.5px solid #2B1C0E; background:#F4EFE4; color:#2B1C0E; display:grid; place-items:center; padding:0">${I("plus",18,2.2)}</button></div>
    <div style="display:flex; align-items:center; gap:8px; margin-top:8px; font-size:13px; font-weight:700"><i style="width:7px; height:7px; border-radius:50%; background:#2B1C0E"></i><i style="flex:1; height:1px; background:#2B1C0E; opacity:.5"></i>${p.z}</div>
    <div class="row"><span>Date</span><span>${p.d}</span></div><div class="row"><span>With</span><span>${NAMES.slice(1).join(" · ") || "自己"}</span></div><div class="row"><span>Weather</span><span>${p.w}</span></div><div class="row"><span>Steps</span><span>${p.s}</span></div>
    <div style="display:flex; justify-content:space-between; font-size:11px; font-weight:600; border-top:1px solid rgba(43,28,14,.35); margin-top:10px; padding-top:7px"><span>心情<span class="mood">${[1,2,3,4,5].map(v => `<button data-act="mood:${p.ci}:${v}" class="${v <= (p.m || 0) ? "on" : ""}" aria-label="心情 ${v}"></button>`).join("")}</span></span><span>照片 ${p.p}</span></div>
    <div style="display:flex; justify-content:space-between; font-size:10px; letter-spacing:.3em; opacity:.7; border-top:1px solid rgba(43,28,14,.35); margin-top:6px; padding-top:5px"><span>TRIP</span><span>DECK</span><span>旅行票</span></div></div>`;
}
let gid = 0; function grainSVG(){ gid++; return `<svg aria-hidden="true" width="100%" height="100%" style="position:absolute; inset:0"><filter id="g${gid}"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3"/><feColorMatrix values="0 0 0 0 .3  0 0 0 0 .18  0 0 0 0 .08  0 0 0 1.3 -.5"/></filter><rect width="100%" height="100%" filter="url(#g${gid})" opacity=".5"/></svg>`; }

/* ================= 撕美食票 (Three.js) ================= */
let tcity = null, serial = 1, tstate = "idle", trating = null;
const R = 0.62, HT = 1.0, L = 2.38, TAIL = 0.22, FULL = L + TAIL, N = 120;
let renderer, scene, camera, roll, strip, stripGeo, stripTex, rollTex, capTex, len = TAIL, running = false, raf = 0;
function rr(x, X, Y, W, H, r){ x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + W, Y, X + W, Y + H, r); x.arcTo(X + W, Y + H, X, Y + H, r); x.arcTo(X, Y + H, X, Y, r); x.arcTo(X, Y, X + W, Y, r); x.closePath(); }
function drawTicket(cv, cut){
  const W = cv.width, H = cv.height, x = cv.getContext("2d"), fn = tcity.food, f = FOODS[fn], SANS = `-apple-system, "PingFang SC", "Noto Sans SC", sans-serif`;
  x.clearRect(0, 0, W, H); x.save(); if(cut){ rr(x, 0, 0, W, H, 18); x.clip(); }
  x.fillStyle = tcity.color; x.fillRect(0, 0, W, H);
  const rg = (cx, cy, r, c0, c1) => { const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, c0); g.addColorStop(1, c1); x.fillStyle = g; x.fillRect(0, 0, W, H); };
  rg(W*.22, H*.2, W*.55, "rgba(255,255,255,.28)", "rgba(255,255,255,0)"); rg(W*.6, H*.42, W*.34, "rgba(255,236,210,.30)", "rgba(255,236,210,0)"); rg(W*.92, H*1.15, W*.55, "rgba(0,0,0,.28)", "rgba(0,0,0,0)");
  const img = x.getImageData(0, 0, W, H), d = img.data; for(let i = 0; i < d.length; i += 4){ const n = (Math.random() - .5) * 30; d[i] += n; d[i+1] += n; d[i+2] += n; } x.putImageData(img, 0, 0);
  if(cut){ x.restore(); x.save(); rr(x, 0, 0, W, H, 18); x.clip(); }
  x.fillStyle = "#FFF6E6"; x.globalAlpha = .9; x.font = `600 ${H*.07}px -apple-system, BlinkMacSystemFont, "PingFang SC", "Noto Sans SC", sans-serif`; x.fillText("FOOD TICKET", W*.055, H*.17); x.textAlign = "right"; x.fillText("No. ????", W*.70, H*.17); x.textAlign = "left";
  x.globalAlpha = .14; x.font = `700 ${H*.62}px ${SANS}`; x.fillText("食", W*.47, H*.8);
  x.globalAlpha = 1; x.font = `700 ${H*.25}px ${SANS}`; x.fillText(fn, W*.055, H*.5);
  x.globalAlpha = .88; x.font = `500 ${H*.062}px -apple-system, BlinkMacSystemFont, "PingFang SC", "Noto Sans SC", sans-serif`; x.fillText(`${tcity.name} · ${f.en.toUpperCase()}`, W*.058, H*.64);
  x.font = `500 ${H*.062}px ${SANS}`; x.fillText("吃到了就撕下", W*.058, H*.88);
  x.globalAlpha = .6; x.strokeStyle = "#FFF6E6"; x.lineWidth = H*.008; x.setLineDash([H*.03, H*.025]);
  x.beginPath(); x.moveTo(W*.74, H*.1); x.lineTo(W*.74, H*.9); x.stroke(); x.beginPath(); x.moveTo(3, H*.06); x.lineTo(3, H*.94); x.stroke(); x.setLineDash([]);
  x.globalAlpha = 1; x.textAlign = "center"; x.font = `700 ${H*.11}px ${SANS}`; [..."撕下收藏"].forEach((ch, i) => x.fillText(ch, W*.855, H*(.27 + i*.15)));
  x.save(); x.translate(W*.955, H*.5); x.rotate(Math.PI/2); x.globalAlpha = .8; x.font = `600 ${H*.058}px -apple-system, BlinkMacSystemFont, "PingFang SC", "Noto Sans SC", sans-serif`; x.fillText("T E A R", 0, 0); x.restore(); x.restore();
  if(cut){ x.globalCompositeOperation = "destination-out"; [[W*.74, 0], [W*.74, H]].forEach(([cx, cy]) => { x.beginPath(); x.arc(cx, cy, W*.03, 0, Math.PI*2); x.fill(); }); x.globalCompositeOperation = "source-over"; }
}
function tkCanvas(cut){ const cv = document.createElement("canvas"); cv.width = 1024; cv.height = 430; drawTicket(cv, cut); return cv; }
function capCanvas(){ const cv = document.createElement("canvas"); cv.width = cv.height = 512; const x = cv.getContext("2d"), c = new THREE.Color(tcity.color).lerp(new THREE.Color("#FFF1DE"), .28);
  x.fillStyle = "#" + c.getHexString(); x.fillRect(0, 0, 512, 512); for(let r = 60; r < 256; r += 2.2){ x.strokeStyle = `rgba(0,0,0,${.05 + Math.random()*.07})`; x.beginPath(); x.arc(256, 256, r, 0, Math.PI*2); x.stroke(); } return cv; }
function tex(cv, rep){ const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); if(rep){ t.wrapS = THREE.RepeatWrapping; t.repeat.set(rep, 1); } return t; }
const path = s => [s, R + 0.11 * (1 - Math.cos(Math.min(s, 3) * 0.6))];
function fillStrip(geo, s0, s1, uvLen){ const p = geo.attributes.position, uv = geo.attributes.uv;
  for(let r = 0; r < 2; r++) for(let i = 0; i <= N; i++){ const s = s0 + (s1 - s0) * i / N, [px, pz] = path(s), k = r * (N + 1) + i; p.setXYZ(k, px, r === 0 ? HT : 0, pz); uv.setXY(k, 1 - (uvLen - s) / L, r === 0 ? 1 : 0); }
  p.needsUpdate = true; uv.needsUpdate = true; geo.computeVertexNormals(); }
function initGL(){
  const cv = $("gl"); renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.outputEncoding = THREE.sRGBEncoding; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  scene = new THREE.Scene(); camera = new THREE.PerspectiveCamera(34, 1, .1, 60);
  scene.add(new THREE.HemisphereLight(0xffe9d2, 0x2a1a10, .75));
  const key = new THREE.DirectionalLight(0xfff2e0, 1.05); key.position.set(-2.5, 6, 5); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -4, right: 5, top: 4, bottom: -4, near: .5, far: 20 }); scene.add(key);
  const warm = new THREE.PointLight(0xffb070, .7, 7); warm.position.set(1.8, 1.4, 2.6); scene.add(warm);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: .42 })); floor.rotation.x = -Math.PI/2; floor.receiveShadow = true; scene.add(floor);
  roll = new THREE.Group(); scene.add(roll);
  stripTex = tex(tkCanvas(true), 1); rollTex = tex(tkCanvas(false), 2 * Math.PI * R / L); capTex = tex(capCanvas());
  const body = new THREE.Mesh(new THREE.CylinderGeometry(R, R, HT, 128, 1, true), new THREE.MeshStandardMaterial({ map: rollTex, roughness: .62 })); body.position.y = HT/2; body.castShadow = true; roll.add(body);
  const cap = new THREE.Mesh(new THREE.RingGeometry(.17, R, 128, 1), new THREE.MeshStandardMaterial({ map: capTex, roughness: .8 })); cap.rotation.x = -Math.PI/2; cap.position.y = HT + .001; roll.add(cap);
  const core = new THREE.Mesh(new THREE.CylinderGeometry(.17, .17, HT, 64, 1, true), new THREE.MeshStandardMaterial({ color: 0x3a2416, side: THREE.BackSide, roughness: 1 })); core.position.y = HT/2; roll.add(core);
  const card = new THREE.Mesh(new THREE.RingGeometry(.14, .17, 64, 1), new THREE.MeshStandardMaterial({ color: 0x8a5a36, roughness: 1 })); card.rotation.x = -Math.PI/2; card.position.y = HT + .002; roll.add(card);
  stripGeo = new THREE.PlaneGeometry(1, 1, N, 1); strip = new THREE.Mesh(stripGeo, new THREE.MeshStandardMaterial({ map: stripTex, transparent: true, alphaTest: .5, side: THREE.DoubleSide, roughness: .6 })); strip.castShadow = true; scene.add(strip);
  setLen(TAIL); addEventListener("resize", resizeGL); bindDrag(cv);
}
function resizeGL(){ if(!renderer) return; const cv = $("gl"), w = cv.clientWidth, h = cv.clientHeight; if(!w || !h) return; renderer.setSize(w, h, false); const a = w / h; camera.aspect = a; kick(); camera.fov = a < 1 ? 40 : 32; const d = a < 1 ? 6.5 : 5.4; camera.position.set(1.0 + d*.3, 2.7, d); camera.lookAt(1.0, .42, .3); camera.updateProjectionMatrix(); }
function setLen(v){ len = v; if(!stripGeo) return; fillStrip(stripGeo, 0, len, len); roll.rotation.y = (len - TAIL) / R; kick(); }
function loop(){ if(!running) return; renderer.render(scene, camera); }
function kick(){ if(!running || raf) return; raf = requestAnimationFrame(() => { raf = 0; loop(); }); }
function startGL(){ if(!window.THREE){ $("thint").textContent = "3D 纸卷没有加载出来，请刷新页面再试"; return; } if(!renderer) initGL(); running = true; setTimeout(resizeGL, 60); resizeGL(); cancelAnimationFrame(raf); raf = 0; loop(); }
function stopGL(){ running = false; cancelAnimationFrame(raf); raf = 0; }
function animLen(to, ms, done){ const from = len; tween(ms, t => setLen(from + (to - from) * ease(t)), done); }
function pull(){ if(tstate !== "idle") return; tstate = "pulling"; $("thint").style.opacity = 0; renderTctl(); animLen(FULL, 1100, () => { tstate = "ready"; buzz(12); renderTctl(); }); }
function tear(){
  if(tstate !== "ready") return; tstate = "tearing"; buzz([8, 30, 14]); renderTctl();
  const g = new THREE.PlaneGeometry(1, 1, N, 1); fillStrip(g, len - L, len, len);
  const pivot = new THREE.Group(), cx = len - L/2, [, cz] = path(cx); pivot.position.set(cx, HT/2, cz); scene.add(pivot);
  const mat = strip.material.clone(); mat.transparent = true; const torn = new THREE.Mesh(g, mat); torn.position.set(-cx, -HT/2, -cz); pivot.add(torn); setLen(len - L);
  const p0 = pivot.position.clone(), q = camera.position.clone();
  tween(900, t => { const e = ease(t); pivot.position.set(p0.x + (q.x*.35 - p0.x*.3) * e, p0.y + 1.35*e, p0.z + 1.7*e); pivot.rotation.set(-.35*e, .28*e, .06*Math.sin(t*Math.PI)); mat.opacity = t < .6 ? 1 : 1 - (t - .6) / .4; kick(); }, () => { scene.remove(pivot); g.dispose(); mat.dispose(); showTres(); });
}
function curTicket(){ return { c: tcity.id, f: tcity.food, r: trating, no: serial, d: TDATE().replace(/-/g, ".") }; }
function sizeFront(){ return Math.min(340, $("app").clientWidth - 40); }
function showTres(){ tstate = "done"; trating = null; const fr = $("tfront"); fr.outerHTML = frontTicket(curTicket(), sizeFront()).replace('<div class="tk"', '<div class="tk flipin" id="tfront"');
  $("trate").innerHTML = Object.entries(RATE).map(([k, v]) => `<button class="chip" aria-pressed="false" data-act="trate:${k}">${v}</button>`).join(""); $("tres").classList.add("on"); $("gl").style.opacity = .12; renderTctl(); bindTilt(); }
function bindTilt(){ const f = $("tfront"); if(!f) return; f.onpointermove = e => { const r = f.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height; f.style.setProperty("--ry", ((px - .5) * 14) + "deg"); f.style.setProperty("--rx", ((.5 - py) * 12) + "deg"); f.style.setProperty("--gx", px*100 + "%"); f.style.setProperty("--gy", py*100 + "%"); }; f.onpointerleave = () => { f.style.setProperty("--rx", "0deg"); f.style.setProperty("--ry", "0deg"); }; }
function tagain(){ $("tres").classList.remove("on"); $("gl").style.opacity = 1; serial++; tstate = "idle"; setLen(TAIL); $("thint").style.opacity = 1; renderTctl(); }
function renderTctl(){ const a = `<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg>`;
  $("tctl").innerHTML = tstate === "done" ? `<button class="tpill" data-act="tagain">再撕一张${a}</button><button class="tpill solid" data-act="tkeep">收进票夹</button>` : tstate === "ready" ? `<button class="tpill solid" data-act="ttear">撕下来${a}</button>` : `<button class="tpill" data-act="tpull" ${tstate !== "idle" ? "disabled" : ""}>拉出一张${a}</button>`; }
function bindDrag(cv){ let x0 = null, l0 = 0;
  cv.addEventListener("pointerdown", e => { if(tstate !== "idle" && tstate !== "ready") return; x0 = e.clientX; l0 = len; cv.setPointerCapture(e.pointerId); $("thint").style.opacity = 0; });
  cv.addEventListener("pointermove", e => { if(x0 === null) return; const v = Math.max(TAIL, Math.min(FULL + .45, l0 + (e.clientX - x0) / cv.clientWidth * 3.6)); setLen(v); if(tstate === "ready" && v > FULL + .35){ x0 = null; setLen(FULL); tear(); } });
  cv.addEventListener("pointerup", () => { if(x0 === null) return; x0 = null; if(tstate === "ready"){ animLen(FULL, 250); return; }
    if(len > FULL * .55){ tstate = "pulling"; animLen(FULL, 380, () => { tstate = "ready"; buzz(12); renderTctl(); }); } else animLen(TAIL, 320, () => { $("thint").style.opacity = 1; }); }); }

function setTcity(id){ tcity = cityById(id); renderTcities(); if(renderer){ drawTicket(stripTex.image, true); stripTex.needsUpdate = true; drawTicket(rollTex.image, false); rollTex.needsUpdate = true; capTex.image = capCanvas(); capTex.needsUpdate = true; kick(); }
  if(tstate === "done") tagain(); else { tstate = "idle"; animLen(TAIL, 300); renderTctl(); } }
function openTear(){ if(!CITIES.length) return toast("这趟旅行还没有城市资料"); if(!tcity) tcity = CITIES[0]; openOv("ov-tear"); renderTcities(); renderTctl(); setTimeout(startGL, 30); }

/* ================= 今日旅运 ================= */
const FORTUNES = [
  { t:"山高水长", p:"Shan Gao Shui Chang", e:"mountain", m:"去高一点的地方看看，心会变得很宽。" },
  { t:"说走就走", p:"Shuo Zou Jiu Zou", e:"plane", m:"今天适合给自己放个假，哪怕只是去隔壁城市。" },
  { t:"海阔天空", p:"Hai Kuo Tian Kong", e:"beach", m:"去看看海吧，烦恼会被浪花一起带走。" },
  { t:"美景入镜", p:"Mei Jing Ru Jing", e:"camera", m:"随手一拍都是大片，记得多留几张。" },
  { t:"人间烟火", p:"Ren Jian Yan Huo", e:"bowl", m:"街边小摊里，藏着这座城市最好的味道。" },
  { t:"奇遇连连", p:"Qi Yu Lian Lian", e:"balloon", m:"转角可能就是你会爱上的那家小店。" }
];
const YI = ["去海边看日落","逛一条老街","找家本地小馆","爬一座小山","夜市觅食"], PLC = ["山野","老街","海边","夜市","古镇"], GO = ["步行","轮渡","骑行","公交"], DIRS = ["东南","正南","西北","正东"], ITEMS = ["胶片相机","草帽","明信片","帆布包","墨镜"], LV = ["大吉","上吉","中吉"];
const pick = a => a[Math.floor(Math.random() * a.length)];
let fi = 0, fOpen = false, fbusy = false, fcy = 0;
function drawFortune(){ const f = FORTUNES[fi % FORTUNES.length], e = EMB[f.e];
  $("fcard").innerHTML = `<div class="sticker" style="background:${e.bg}">${e.svg}</div><div class="fc-title">${f.t}</div><div class="fc-py">${f.p}</div>
    <div class="fc-cols"><div><b>宜</b>・${pick(YI)}</div><div><b>去处</b>・${pick(PLC)}</div><div><b>出行</b>・${pick(GO)}</div><div><b>方位</b>・${pick(DIRS)}</div></div>
    <div class="fc-lvl">${pick(LV)}</div><p class="fc-msg">${f.m}<span>幸运物 · ${pick(ITEMS)}</span></p>`; }
const setY = (el, y, s = 1) => { el.style.transform = `translateY(${y}px) scale(${s})`; };
function animEl(el, from, to, ms, done){ tween(ms, t => { const e = to.spring ? 1 - Math.pow(1 - t, 3) * Math.cos(t * 5.2) : ease(t); setY(el, from.y + (to.y - from.y) * e, from.s + (to.s - from.s) * e); }, done); }
function openCard(){ const was = fOpen;  const fc = $("fcard"), sl = $("sleeve"); if(fbusy || fOpen) return; fbusy = true; buzz(10); $("fhint").style.opacity = 0;
  animEl(fc, { y: fcy, s: 1 }, { y: -360, s: 1 }, 380, () => { fc.classList.add("front"); sl.style.opacity = .55; animEl(sl, { y: 0, s: 1 }, { y: 60, s: .9 }, 520);
    animEl(fc, { y: -360, s: 1 }, { y: -40, s: 1.04, spring: true }, 720, () => { fbusy = false; fOpen = true; fcy = -40; $("fdone").classList.add("on"); buzz([6, 40, 10]); }); });  if(!was){ setTimeout(() => snd("reveal"), 420); if(!fortuneToday()) S.fortune = { date:TDATE(), fi }; const a = $("fagain"); setTimeout(() => { a && (a.style.display = "none"); }, 900); } }
function closeCard(cb){ const fc = $("fcard"), sl = $("sleeve"); if(fbusy) return; fbusy = true; $("fdone").classList.remove("on");
  if(!fOpen){ animEl(fc, { y: fcy, s: 1 }, { y: 0, s: 1 }, 260, () => { fcy = 0; fbusy = false; cb && cb(); }); return; }
  animEl(fc, { y: fcy, s: 1.04 }, { y: -360, s: 1 }, 380, () => { fc.classList.remove("front"); sl.style.opacity = 1; animEl(sl, { y: 60, s: .9 }, { y: 0, s: 1 }, 380);
    animEl(fc, { y: -360, s: 1 }, { y: 0, s: 1 }, 460, () => { fcy = 0; fOpen = false; fbusy = false; $("fhint").style.opacity = 1; cb && cb(); }); }); }
(function bindPull(){ const st = $("fstage"); let y0 = null;
  st.addEventListener("pointerdown", e => { if(e.target.closest("button") || fbusy || fOpen) return; y0 = e.clientY; st.setPointerCapture(e.pointerId); });
  st.addEventListener("pointermove", e => { if(y0 === null) return; fcy = Math.min(0, Math.max(-300, (e.clientY - y0) * 1.05)); setY($("fcard"), fcy); });
  st.addEventListener("pointerup", () => { if(y0 === null) return; y0 = null; if(fcy < -110 || fcy > -8) openCard(); else animEl($("fcard"), { y: fcy, s: 1 }, { y: 0, s: 1 }, 260, () => fcy = 0); }); })();
$("fagain").onclick = () => closeCard(() => { fi++; drawFortune(); });
$("fkeep").onclick = () => toast("已收进手账 · 今日旅运");
function openFortune(){ openOv("ov-fortune"); }

/* ================= actions ================= */
document.addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if(!b) return; const [a, x, y] = b.dataset.act.split(":");
  switch(a){
    case "tab": closeOv(); closeSheet(); S.tab = x; render(); $("view").scrollTop = 0; break;
    case "day": setDay(+x); break;
    case "tday": setTday(+x); break;
    case "seg": S.seg = x; if(S.tab !== "book"){ S.tab = "book"; } render(); break;
    case "acity": S.acity = x; S.archOpen = false; render(); break;
    case "arch": if(!ARCH[S.acity].have){ toast("还没有盖章，去了再来"); break; } S.archOpen = !S.archOpen; b.closest(".arch").classList.toggle("open", S.archOpen); b.setAttribute("aria-expanded", S.archOpen); layoutArch(); b.parentElement.querySelector("p").textContent = S.archOpen ? "点封面合上" : "点一下打开"; buzz(8); break;
    case "diaryday": S.diary = +x; S.seg = "diary"; render(); break;
    case "place": openPlace(+x, +y); { setTimeout(() => { const o = $("ov-place"); if(!o || o.querySelector(".itedit")) return; const [, di, ii] = b.dataset.act.split(":"); o.insertAdjacentHTML("beforeend", `<button class="chip itedit" data-act="itedit:${di}:${ii}" style="position:absolute; right:18px; top:calc(70px + env(safe-area-inset-top,0px)); z-index:5">${I("grid",14)} 改 / 删</button>`); }, 0); } break;
    case "checkin": openCheckin(); setTimeout(bindCkFile, 0); break;
    
    
    
    case "pack": openPack(); break;
    case "ck": packToggle(x, y, b); break;
    case "car": openCar(); break;
    case "keepplace": toast("已收进旅行票夹"); break;
    case "tear": openTear(); { setTimeout(renderTfoods, 60); } break;
    case "tpull": pull(); break;
    case "ttear": tear(); break;
    case "tagain": tagain(); break;
    case "tkeep": S.wallet.push(curTicket()); toast(`已收进票夹 · ${tcity.name} ${tcity.food}`); tagain(); if(S.tab === "book") render(); break;
    case "trate": trating = x; document.querySelectorAll("#trate .chip").forEach(c => c.setAttribute("aria-pressed", c === b)); { const fr = $("tfront"); fr.outerHTML = frontTicket(curTicket(), sizeFront(), true).replace('<div class="tk"', '<div class="tk" id="tfront"'); bindTilt(); } buzz(15); break;
    case "tcity": setTcity(x); { setTimeout(renderTfoods, 30); } break;
    case "fortune": openFortune(); break;
    case "settle": toast("已记下，等对方确认"); { const row = b.closest(".exp"); if(row){ b.outerHTML = `<span class="okmark">${I("check",14,2.4)}已结清</span>`; row.classList.add("gone"); } break; } break;
    case "close": if(typeof musicStop === "function") musicStop(); if(curOv === "ov-fortune" && fOpen){ closeCard(() => closeOv()); } else closeOv(); break;
    
  }
});

/* ===================== part 2: every feature ===================== */
const X = EXTRA;
const who = k => FRIENDS[k];
const av = (k, s = 40) => avHTML(k, s);

function closeSheet(){ $("sheet").classList.remove("on"); $("backdrop").classList.remove("on"); clearTimeout(CK.t);  if(window.__needRender){ window.__needRender = false; setTimeout(() => { NOSTAG = true; render(); }, 60); } }

const back = (t = "", right = "") => `<div class="ptop"><button class="rbtn glass" data-act="close" aria-label="返回">${I("back",22,2)}</button><h1>${t}</h1>${right}</div>`;
let recapT = 0;
function openOv(id){ const same = curOv === id && $(id).classList.contains("on"); closeOv(true); if(!same && $("sheet").classList.contains("on")) closeSheet(); curOv = id; $(id).classList.add("on"); }

function sealSVG(zh, en, date, col, rot = 0){ sid++; const id = "sp" + sid;
  return `<svg viewBox="0 0 160 160" aria-label="${zh}入境章" style="transform:rotate(${rot}deg)"><defs><path id="${id}" d="M28 80a52 52 0 1 1 104 0a52 52 0 1 1 -104 0"/></defs><g fill="none" stroke="${col}" stroke-width="3" opacity=".88"><circle cx="80" cy="80" r="72"/><circle cx="80" cy="80" r="64" stroke-width="1.2"/><circle cx="80" cy="80" r="40" stroke-width="1.2"/></g>
  <text font-family="-apple-system, PingFang SC, Noto Sans SC, sans-serif" font-size="10" letter-spacing="3" fill="${col}" opacity=".9"><textPath href="#${id}">${en} · ENTRY · ${en} · ENTRY ·</textPath></text>
  <text x="80" y="84" text-anchor="middle" font-family="Noto Serif SC,serif" font-weight="600" font-size="24" fill="${col}">${zh}</text><text x="80" y="102" text-anchor="middle" font-family="-apple-system, PingFang SC, Noto Sans SC, sans-serif" font-size="9" fill="${col}">${date}</text></svg>`; }

/* ---------- 今日 extras: 动态 + 书架 + 设置 ---------- */
const FEED = [];
function openFeed(){ sheet(`<h3>动态</h3><p class="sub">房间 ${ROOMTXT()} · ${FRIENDS.length} 位旅伴</p>
  ${FEED.length ? "" : `<p style="font-size:13px; color:var(--mu); margin:4px 0 12px">还没有动态。旅伴打卡、撕票、发动技能，都会出现在这里。</p>`}${FEED.map((f, i) => `<div class="li"><span style="position:relative">${av(f.a)}<span class="feed-ic">${I(f.ic,11,2)}</span></span><span class="tx"><b>${f.t}</b><small>${f.s}</small></span>${"ok" in f ? (f.ok ? `<span style="font-size:12px; color:var(--amber)">已确认</span>` : `<button class="chip on" data-act="feedok:${i}">确认</button>`) : ""}</div>`).join("")}
  <div class="li"><span class="dot-av" style="background:#EEE8DA; font-family:var(--serif)">报</span><span class="tx"><b>今天的《旅途小报》晚上 8 点出版</b><small>把今天的打卡、美食和骰子排成一张报纸</small></span><button class="chip" data-act="paper">先看</button></div>`); }

let shelfSel = 0;

const SETS = { sound:true, haptic:true, paper:true, buddy:true };

/* ---------- 行程 extras: 地图 + 工具箱 ---------- */
const GEO = [];
let MAPB = { lat0:25.05, lng0:117.95, dlat:.7, dlng:.9 };
function mapBounds(){ const P2 = GEO.length ? GEO : [["", 24.5, 118.1]]; const lats = P2.map(g => g[1]), lngs = P2.map(g => g[2]); let la0 = Math.min(...lats), la1 = Math.max(...lats), ln0 = Math.min(...lngs), ln1 = Math.max(...lngs); let dlat = Math.max(.08, (la1 - la0) * 1.4), dlng = Math.max(.1, (ln1 - ln0) * 1.4); if(dlng / dlat < 360 / 330 * 1.1) dlng = dlat * 360 / 330 * 1.1; else dlat = dlng * 330 / 360 / 1.1; MAPB = { lat0:(la0 + la1) / 2 + dlat / 2, lng0:(ln0 + ln1) / 2 - dlng / 2, dlat, dlng }; }
const pj = (lat, lng) => [((lng - MAPB.lng0) / MAPB.dlng * 360).toFixed(1), ((MAPB.lat0 - lat) / MAPB.dlat * 330).toFixed(1)];
const poly = pts => pts.map(([lng, lat]) => pj(lat, lng).join(",")).join(" ");
const COAST = [[117.9,24.5],[117.98,24.53],[118.03,24.56],[118.06,24.61],[118.12,24.63],[118.18,24.6],[118.24,24.6],[118.3,24.63],[118.38,24.69],[118.44,24.7],[118.5,24.66],[118.58,24.63],[118.64,24.62],[118.7,24.64],[118.76,24.7],[118.76,24.76],[118.7,24.8],[118.66,24.86],[118.68,24.9],[118.74,24.93],[118.82,24.96],[118.9,25],[118.9,25.1],[117.9,25.1]];
const XMI = [[118.065,24.435],[118.12,24.425],[118.19,24.45],[118.205,24.5],[118.17,24.555],[118.1,24.565],[118.066,24.52],[118.075,24.475]];
let mapDay = TODAY;
function openMap(){ mapBounds(); const FJ = TRIP.cities.length && TRIP.cities.every(c => ["xm","qz","zz","fz"].includes(c));
  const route = DAYS.flatMap((d, di) => d.items.map(it => GEO.find(g => g[0] === it.title)).filter(Boolean)).map(g => pj(g[1], g[2]).join(",")).join(" ");
  const inDay = GEO.filter(g => g[3].includes(mapDay)).map(g => pj(g[1], g[2]).map(Number)); let vb = [0, 0, 360, 330];
  if(inDay.length){ const xs = inDay.map(p => p[0]), ys = inDay.map(p => p[1]); let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), w = Math.max(70, (x1 - x0) * 1.6), h = w * 330 / 360; if((y1 - y0) * 1.6 > h){ h = (y1 - y0) * 1.6; w = h * 360 / 330; } vb = [(x0 + x1) / 2 - w / 2, (y0 + y1) / 2 - h / 2, w, h]; }
  const PS = vb[2] / 360; S.mapVB = vb;
  const grid = Array.from({length: 9}, (_, i) => `<path d="M${i*45} 0V330M0 ${i*41} H360" stroke="rgba(255,255,255,.035)"/>`).join("");
  const placed = []; const pins = GEO.map(([n, lat, lng, ds], gi2) => { const [x, y] = pj(lat, lng), on = ds.includes(mapDay), td = ds.includes(TODAY), lab = on && !placed.some(([px, py]) => Math.abs(px - x) < 60 * PS && Math.abs(py - y) < 14 * PS); if(lab) placed.push([+x, +y]);
    return `<g transform="translate(${x} ${y}) scale(${PS.toFixed(3)})" data-act="pin:${gi2}" style="cursor:pointer" opacity="${on ? 1 : .45}"><g class="pinpop" style="animation-delay:${500 + gi2 * 70}ms"><circle r="16" fill="transparent"/>${td ? `<circle r="14" fill="none" stroke="#EE6A3C" stroke-width="1.5"><animate attributeName="r" values="7;18" dur="1.8s" repeatCount="4"/><animate attributeName="opacity" values=".9;0" dur="1.8s" repeatCount="4"/></circle>` : ""}
      <circle r="${on ? 6 : 4}" fill="${on ? "#EE6A3C" : "#F5F4F0"}" stroke="#0C1620" stroke-width="2"/>${lab ? `<text x="9" y="4" font-size="10" font-family="-apple-system,PingFang SC,sans-serif" fill="#F5F4F0" font-weight="600">${n}</text>` : ""}</g></g>`; }).join("");
  const dd = DAYS[mapDay], stops = dd.items.filter(i => i.kind === "sight" || i.kind === "food");
  page(`<div class="scr">${back("地图", `<button class="chip" data-act="tools">${I("grid",16)}工具</button>`)}
    <div class="dchips">${DAYS.map((d, i) => `<button data-act="mapday:${i}" ${i === mapDay ? 'aria-current="date"' : ""}><b>D${pad(i+1)}</b><small>${mdS(d.date)}</small></button>`).join("")}</div>
    <div class="mapw"><svg viewBox="${vb.map(v => v.toFixed(1)).join(" ")}" role="img" aria-label="${TRIP.cityNames} 的行程地图">${grid}
      ${FJ ? `<polygon points="${poly(COAST)}" fill="#171E26" stroke="#2A3440" stroke-width="1.2"/><polygon points="${poly(XMI)}" fill="#1A222B" stroke="#2A3440" stroke-width="1.2"/>` : ""}
      <polyline points="${route}" pathLength="1" class="drawline" fill="none" stroke="#E8A864" stroke-width="4" opacity=".35" stroke-linejoin="round"/>
      <polyline points="${route}" class="dashline" fill="none" stroke="#E8A864" stroke-width="1.6" stroke-dasharray="4 5" stroke-linejoin="round"/>
      ${pins}
      ${CITIES.filter(c => c.ll).map(c => `<text x="${pj(c.ll[0] + .02, c.ll[1])[0]}" y="${pj(c.ll[0] + .02, c.ll[1])[1]}" font-size="${(11 * PS).toFixed(2)}" letter-spacing="${(4 * PS).toFixed(2)}" fill="rgba(245,244,240,.4)" font-family="-apple-system,PingFang SC,sans-serif">${c.name}</text>`).join("")}
      <text x="${(vb[0] + vb[2] - 34 * PS).toFixed(1)}" y="${(vb[1] + vb[3] - 12 * PS).toFixed(1)}" font-size="${(9 * PS).toFixed(2)}" fill="rgba(245,244,240,.35)" font-family="-apple-system, PingFang SC, Noto Sans SC, sans-serif">N ↑</text></svg></div>
    <div class="card mcard"><div style="display:flex; justify-content:space-between; align-items:center"><b style="font-size:15px">D${pad(mapDay+1)} · ${DAYCFG[mapDay].city} · ${stops.length} 个地方</b><button class="chip" data-act="tool:nav">导航</button></div>
      ${stops.map(s => `<div class="li" style="padding:10px 0"><span style="font-size:12px; color:var(--mu); width:40px; font-variant-numeric:tabular-nums">${s.t}</span><span class="tx"><b style="font-size:14px">${s.title}</b></span></div>`).join("")}</div></div>`); }
function openTools(){ const t = (k, ic, col, n, s, wide) => `<button class="tool ${wide ? "wide" : ""}" data-act="tool:${k}"><span class="ti" style="background:${col}22; color:${col}">${I(ic,22)}</span><span><b>${n}</b><small>${s}</small></span></button>`;
  page(`<div class="scr">${back("旅途工具箱")}<div class="pt2" style="padding-top:6px"><p>在街上最常用的几样</p></div><div class="tools">
    ${t("driver","bus","#E8A864","给司机看","大字显示要去的地方", true)}${t("nav","route","#7FA7D6","一键导航","高德 · Apple · Google")}${t("fx","wallet","#A9B7A1","汇率换算","RM 和人民币")}${t("talk","mic","#C79BD8","当地话","点一下读给你听")}${t("sos","bell","#EE6A3C","紧急信息","电话和今晚住哪")}</div></div>`); }
let fx = { v:"", dir:"rm" };
function fxSheet(){ const n = parseFloat(fx.v || "0"), out = fx.dir === "rm" ? n / RATE_CNY : n * RATE_CNY;
  sheet(`<h3>汇率换算</h3><p class="sub">1 ${TRIP.dest} ≈ ${HSYM()} ${RATE_CNY.toFixed(3)} · 设置里可以改</p>
    <div style="text-align:center"><small style="color:var(--mu)">${fx.dir === "rm" ? TRIP.home : TRIP.dest}</small><div class="fx-big">${fx.dir === "rm" ? HSYM() : DSYM()} ${fx.v || "0"}</div>
    <button class="chip" data-act="fxswap" style="margin:6px 0">⇅ 换一下</button><div style="font-size:26px; font-weight:600; color:var(--amber); font-variant-numeric:tabular-nums">${fx.dir === "rm" ? DSYM() : HSYM()} ${out.toFixed(2)}</div></div>
    <div class="keys">${["1","2","3","4","5","6","7","8","9",".","0","⌫"].map(k => `<button data-act="fxk:${k}">${k}</button>`).join("")}</div>`); }

function toolSheet(k){
  if(k === "fx") return fxSheet();
  if(k === "driver") return driverSheet();
  if(k === "nav") return navSheet();
  if(k === "talk") return talkSheet();
  if(k === "sos") return sheet(`<h3>紧急信息</h3><p class="sub">点号码直接拨打</p>${[["110","报警"],["120","急救"],["119","火警"],["122","交通事故"]].map(([n, t]) => `<div class="li"><span class="tx"><b style="font-size:22px; font-variant-numeric:tabular-nums">${n}</b><small>${t}</small></span><a class="chip" href="tel:${n}" style="text-decoration:none">拨打</a></div>`).join("")}
    <div class="li"><span class="tx"><b>今晚住</b><small>陶野集民宿（泉州西街）</small></span><button class="chip" data-act="tool:driver">给司机看</button></div>`);
}

/* ---------- 打卡 flow ---------- */
const CK = { di:0, ii:0, pic:0, step:"pick", t:0 };

const CKPICS = () => ckPics();
function renderCheckin(){
  const it = DAYS[CK.di].items[CK.ii], c = DAYCFG[CK.di], en = cityEn(c.city), pics = CKPICS();
  if(CK.step === "pick") return sheet(`<h3>在「${it.title}」打卡</h3><p class="sub">拍一张照片，交给旅伴确认，就能盖进护照</p>
    <div class="ck-mission"><small>今天的小任务</small><p>在${it.title}拍一张合照，每个人都要比一个不一样的手势。</p></div>
    <div class="ck-pics">${pics.map((k, i) => `<button data-act="ckpic:${i}" aria-pressed="${i === CK.pic}" aria-label="选第 ${i+1} 张照片"><img src="${P[k] || k}" alt=""></button>`).join("")}<label style="display:grid; place-items:center; border:1.5px dashed rgba(255,255,255,.3); border-radius:14px; color:var(--mu); font-size:12px; min-height:80px; cursor:pointer">${I("camera",20)}拍一张<input type="file" accept="image/*" capture="environment" id="ckfile" style="position:absolute; width:1px; height:1px; opacity:0"></label></div>
    <button class="cbtn" data-act="cksend">交给旅伴确认</button>`);
  const stamp = `<svg class="inkstamp ${CK.step === "ok" ? "slam" : ""}" viewBox="0 0 160 160" aria-hidden="true">${sealSVG(it.title.slice(0,4), en, TDATE().replace(/-/g, "."), "#FFB08F").replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "")}</svg>`;
  sheet(`<h3>${CK.step === "ok" ? "盖章成功" : "等旅伴确认"}</h3><p class="sub">${CK.step === "ok" ? (NAMES.length > 1 ? `${NAMES[1]} 确认了你的打卡` : "盖好了") : NAMES.length > 1 ? `已经发给 ${NAMES.slice(1).join(" 和 ")} 了` : "没有旅伴时自己确认"}</p>
    <div class="ck-photo">${pics[CK.pic] ? `<img src="${P[pics[CK.pic]] || pics[CK.pic]}" alt="打卡照片">` : `<div style="height:100%; display:grid; place-items:center; color:var(--mu); font-size:13px">没有照片也能盖章</div>`}${stamp}</div>
    ${CK.step === "ok" ? `<button class="cbtn" data-act="ckkeep">收进护照</button>` : `<div class="waiting"><i></i><i></i><i></i><span>${NAMES[1] || "旅伴"}正在看</span></div>`}`);
  if(CK.step === "wait"){ clearTimeout(CK.t); CK.t = setTimeout(() => { CK.step = "ok"; renderCheckin(); buzz([10, 50, 30]); }, 1800); }
}

/* ---------- 玩法 ---------- */
function play(){
  const m = (act, ic, col, n, s) => `<button class="mini" data-act="${act}"><span style="width:36px; height:36px; border-radius:12px; background:${col}22; color:${col}; display:grid; place-items:center">${I(ic,20)}</span><span><b>${n}</b><br><small>${s}</small></span></button>`;
  return `<div class="ph"><div><h1>玩法</h1><p>让旅行多一点意外</p></div></div>
  <button class="feat wood" data-act="tear"><span style="position:absolute; right:-20px; top:26px; transform:rotate(-8deg)">${CITIES[0] && CITIES[0].food ? miniTicket(CITIES[0].id, CITIES[0].food, 240, 0) : ""}</span><b>撕一张美食票</b><small>吃到了就撕一张，收进票夹</small></button>
  <button class="feat black" data-act="fortune"><span style="position:absolute; right:26px; top:14px; width:104px; height:146px; transform:rotate(6deg)">${SLEEVE}</span><b>今日旅运</b><small>从卡套里抽出今天的运气</small></button>
  <button class="feat photo" data-act="car"><img src="${P.pagoda}" alt=""><b>我走过的地方</b><small>用自己拍的照片，一张张翻</small></button>
  <div class="grid2" style="padding-bottom:10px">
    ${m("skills","play","#D9C38A","技能牌","抽一张，改写今天的行程")}${m("dice","dice","#F5F4F0","旅途骰子","让骰子决定")}
    ${m("bingo","grid","#EE6A3C","城市宾果","连成一条线")}${m("secret","tag","#C79BD8","秘密任务","晚上八点揭晓")}
    ${m("guess","wallet","#A9B7A1","猜价格","付钱前大家先猜")}${m("coin","spark","#E8A864","旅途通宝","抛一下，交给运气")}</div>` + motionTiles();
}
/* skill deck */
let SK = null;

/* dice */
const PIPS = { 1:[5], 2:[1,9], 3:[1,5,9], 4:[1,3,7,9], 5:[1,3,5,7,9], 6:[1,3,4,6,7,9] };
const FACE = { 1:[0,0], 6:[0,180], 3:[0,-90], 4:[0,90], 2:[-90,0], 5:[90,0] };
const FACEPOS = { 1:"translateZ(55px)", 6:"rotateY(180deg) translateZ(55px)", 3:"rotateY(90deg) translateZ(55px)", 4:"rotateY(-90deg) translateZ(55px)", 2:"rotateX(90deg) translateZ(55px)", 5:"rotateX(-90deg) translateZ(55px)" };
const DMODE = { 挑战:["用闽南话点一次单","请旅伴吃一样你没吃过的东西","跟一位阿姨问路","下一顿饭只点你没听过的菜","找到一只猫并拍下来","今天剩下的照片都要竖着拍"],
  谁来:["你","小林","Q","你","小林","Q"], 走多远:["1","2","3","4","5","6"] };
let dmode = "挑战", drot = [-20, 30], dres = null;
function openDice(){ page(`<div class="scr">${back("旅途骰子")}<div class="hs">${Object.keys(DMODE).map(k => `<button class="chip ${k === dmode ? "on" : ""}" data-act="dmode:${k}">${k}</button>`).join("")}</div>
  <div class="dscene"><div class="dwrap" id="dwrap"><div class="cube" id="cube" style="transform:rotateX(${drot[0]}deg) rotateY(${drot[1]}deg)">${[1,2,3,4,5,6].map(n => `<div class="f" style="transform:${FACEPOS[n]}">${Array.from({length:9}, (_, i) => PIPS[n].includes(i+1) ? `<i class="${n === 1 || n === 4 ? "red" : ""}"></i>` : "<span></span>").join("")}</div>`).join("")}</div><span class="dshadow"></span></div></div>
  <div class="dres card" id="dres"><small>${{挑战:"掷出来的就是接下来的挑战", 谁来:"掷出来的人，决定下一站去哪", 走多远:"往前走几个路口再拐弯"}[dmode]}</small><b>${dres || "点下面，掷一次"}</b></div>
  <div style="padding:16px 20px 0"><button class="cbtn" data-act="droll">掷骰子</button></div></div>`); }
function rollDice(){ const n = 1 + Math.floor(Math.random() * 6), [fx0, fy0] = FACE[n], k1 = 2 + Math.floor(Math.random() * 2), k2 = 2 + Math.floor(Math.random() * 2);
  drot = [fx0 - 360 * k1 + (Math.round(drot[0] / 360) * 360), fy0 + 360 * k2 + (Math.round(drot[1] / 360) * 360)];
  const cb = $("cube"); if(!cb) return; cb.style.transform = `rotateX(${drot[0]}deg) rotateY(${drot[1]}deg)`; buzz(10); $("dres").querySelector("b").textContent = "……";
  setTimeout(() => { const v = DMODE[dmode][n - 1]; dres = dmode === "谁来" ? `${v} 决定下一站去哪` : dmode === "走多远" ? `往前走 ${v} 个路口，然后右转` : v; const dr = $("dres"); if(dr) dr.querySelector("b").textContent = `${n} 点 · ${dres}`; buzz([6, 40, 10]); }, 1650); }
/* bingo */
const BTASK = []; const bingo = new Set();
function bingoLines(){ const L = []; for(let r = 0; r < 4; r++) L.push([0,1,2,3].map(c => r*4+c)); for(let c = 0; c < 4; c++) L.push([0,1,2,3].map(r => r*4+c)); L.push([0,5,10,15], [3,6,9,12]); return L.filter(l => l.every(i => bingo.has(i))); }

/* secret */

let sec = 0;

/* guess price */
const GITEMS = [];
let gi = 0, gmine = 25, grev = false;

/* coin */

let cq = 0, cang = 0, cbusy = false, cres = null;

/* ---------- 手账 extras ---------- */
function keepsakeShelf(){
  const o = (act, n, inner, bg) => `<button class="obj" data-act="${act}"><span class="o" style="${bg || ""}">${inner}</span>${n}</button>`;
  return `<div class="shelf">
    ${o("passport","护照",`<span style="width:56px; height:76px; border-radius:4px 10px 10px 4px; background:linear-gradient(135deg,#1F3346,#132230); display:grid; place-items:center; color:#D9C38A; font-family:var(--serif); font-size:12px; letter-spacing:.2em; box-shadow:inset 3px 0 6px rgba(0,0,0,.4)">护照</span>`)}
    ${o("album","大家的相册",`<span style="position:relative; width:64px; height:64px">${["lane","sea"].map((k, i) => `<img src="${P[k]}" alt="" style="position:absolute; width:50px; height:56px; object-fit:cover; border:3px solid #F4EFE4; border-radius:4px; left:${i*12}px; top:${i*6}px; transform:rotate(${i ? 6 : -6}deg)">`).join("")}</span>`)}
    ${o("paper","每日小报",`<span style="width:62px; height:74px; background:#EEE8DA; color:#1A1814; font-family:var(--serif); font-size:10px; padding:6px; text-align:center; border-radius:2px; transform:rotate(-4deg); line-height:1.2"><b style="font-size:13px; display:block; border-bottom:1px solid #1A1814">旅途小报</b><span style="display:block; height:4px; background:#1A1814; opacity:.25; margin:5px 0"></span><span style="display:block; height:26px; background:#8A8274"></span></span>`)}
    ${o("recap","回忆放映",`<span style="position:relative; width:64px; height:64px; border-radius:12px; overflow:hidden"><img src="${P.pagoda}" alt="" style="width:100%; height:100%; object-fit:cover"><span style="position:absolute; inset:0; display:grid; place-items:center; background:rgba(0,0,0,.25)"><svg width="22" height="22" viewBox="0 0 24 24"><path d="M8 5v14l11-7-11-7Z" fill="#fff"/></svg></span></span>`)}
    ${o("receipt","旅行发票",`<span style="width:46px; height:78px; background:#F7F5EF; border-radius:2px; padding:6px 5px; display:flex; flex-direction:column; gap:4px; transform:rotate(5deg)">${[1,.6,.8,.5,.9].map(w => `<i style="display:block; height:3px; width:${w*100}%; background:#1B1A18; opacity:.5"></i>`).join("")}<i style="display:block; margin-top:auto; height:10px; background:repeating-linear-gradient(90deg,#1B1A18 0 1px,transparent 1px 3px)"></i></span>`)}
    ${o("poster","海报",`<span style="position:relative; width:46px; height:80px; border-radius:3px; overflow:hidden; box-shadow:0 6px 12px rgba(0,0,0,.4)"><img src="${P.sea}" alt="" style="width:100%; height:100%; object-fit:cover"><b style="position:absolute; left:4px; bottom:6px; font-size:10px; line-height:1.1">厦门<br>泉州</b></span>`)}
  </div>`; }

const ALBUM = [];
/* likes and comments live on the photo itself (row[5] = who liked, row[8] = comments), so they stay with the photo and the whole room sees them */
const myLikeName = () => S.me || "我";
const liked = { has(i){ const r = ALBUM[i]; return !!r && (r[5] || []).includes(myLikeName()); },
  add(i){ const r = ALBUM[i]; if(!r) return; r[5] = r[5] || []; if(!r[5].includes(myLikeName())) r[5].push(myLikeName()); },
  delete(i){ const r = ALBUM[i]; if(!r || !r[5]) return; r[5] = r[5].filter(n => n !== myLikeName()); },
  clear(){}, forEach(){}, [Symbol.iterator]: function*(){} };
const CMTS = new Proxy({}, { get(t, k){ const i = +k; if(Number.isInteger(i) && ALBUM[i]) return ALBUM[i][8]; return t[k]; },
  set(t, k, v){ const i = +k; if(Number.isInteger(i) && ALBUM[i]){ ALBUM[i][8] = v; return true; } t[k] = v; return true; }, ownKeys(){ return []; }, deleteProperty(){ return true; } });
function openAlbum(){ window.CUR_PAGE = "album";  page(`<div class="scr">${back("大家的相册", `<button class="chip" data-act="aup">${I("plus",16)}上传</button>`)}<div class="pt2" style="padding-top:0"><p>大家拍的都在这里 · 双击照片点赞</p></div>
  ${ALBUM.length ? "" : emptyBox("相册还是空的", "右下角「上传照片」，或者首页「记录此刻」")}<div class="mas">${ALBUM.map(([k, a, n, cap], i) => `<figure data-dbl="${i}"><img loading="lazy" decoding="async" src="${P[k] || k}" alt="${cap}" style="height:${[210,160,240,180,200,150,220,170][i % 8]}px" data-act="aopen:${i}"><figcaption><span class="who" style="background:${(FRIENDS[a] || FRIENDS[0])[1]}">${(FRIENDS[a] || FRIENDS[0])[0]}</span><span style="text-shadow:0 1px 4px rgba(0,0,0,.6)">${cap}</span><button class="lk ${liked.has(i) ? "on" : ""}" data-act="alike:${i}" aria-pressed="${liked.has(i)}" aria-label="点赞">${I("heart",13,2)}${(ALBUM[i][5] || []).length}</button></figcaption></figure>`).join("")}</div></div>`); }
function likeBurst(i){ const f = document.querySelector(`[data-dbl="${i}"]`); if(!f) return; const b = document.createElement("span"); b.className = "burst"; b.innerHTML = `<svg viewBox="0 0 24 24" width="90" height="90"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" fill="#FF6B57"/></svg>`; f.appendChild(b); setTimeout(() => b.remove(), 800); }
function albumSheet(i){ const [k, a, n, cap] = ALBUM[i], cs = CMTS[i] || [];
  sheet(`<div style="height:220px; border-radius:20px; overflow:hidden; margin-bottom:12px"><img src="${P[k] || k}" alt="${cap}" style="width:100%; height:100%; object-fit:cover"></div><h3>${cap}</h3><p class="sub">${NAMES[a] || "旅伴"} 拍的 · <button class="chip" data-act="likers:${i}" style="height:26px; font-size:12px">${(ALBUM[i][5] || []).length} 个赞 · 谁点的</button></p>
    <div class="cmts">${cs.map(([w, t, who]) => `<div class="li">${av(w,32)}<span class="tx"><b>${t}</b><small>${who || NAMES[w] || "旅伴"}</small></span></div>`).join("") || `<p style="font-size:13px; color:var(--mu)">还没有评论，写第一句吧</p>`}</div>
    <div style="display:flex; gap:8px; margin-top:12px"><label for="cmt" style="position:absolute; left:-9999px">写评论</label><input id="cmt" placeholder="说点什么…" style="flex:1; height:46px; border-radius:23px; border:1px solid var(--line); background:rgba(255,255,255,.06); color:var(--ink); padding:0 16px; font:inherit; font-size:15px"><button class="chip on" data-act="csend:${i}" style="height:46px">发送</button></div>`); }

const SLIDES = () => [
  { ph:dayPhoto(0), k:`TRIP DECK · ${TRIP.start.slice(0, 4)}`, b:TRIP.name, p:`${TRIP.rangeCN} · ${FRIENDS.length} 个人` },
  ...DIARY.map((d, i) => ({ ph:d.ph, k:`D${pad(i+1)} · ${DAYCFG[i].city}`, b:DAYCFG[i].place, p:d.note || d.extra || DAYS[i].title || "" })).filter((_, i) => i <= TODAY),
  { nums:true }, { ph:"lane", k:"年度最会吃", b:"小林", p:"撕了 5 张美食票，4 张都打了「好吃！」" },
  { ph:"night", k:"THE END", b:"下一本，去哪儿？", p:"这趟旅行会一直留在书架上" } ];
let ri = 0, rpause = false;
function openRecap(){ ri = 0; const sl = SLIDES();
  page(`<div class="rbars">${sl.map(() => "<i><b></b></i>").join("")}</div>
    ${sl.map((s, i) => s.nums ? `<div class="slide" data-s="${i}" style="background:radial-gradient(120% 70% at 50% 30%, #1E2233, #000)"><div class="st2" style="bottom:auto; top:120px"><small>这趟旅行到今天</small>${[[String(DAYS.length),"天"],[String(ALBUM.length),"张照片"],[String(S.wallet.length),"张美食票"],[String(S.checkins.length),"枚章"]].map(([n, l]) => `<b style="font-size:54px; margin-top:14px; font-variant-numeric:tabular-nums">${n}<span style="font-size:16px; font-weight:400; opacity:.7; margin-left:8px">${l}</span></b>`).join("")}</div></div>`
      : `<div class="slide" data-s="${i}"><img src="${P[s.ph]}" alt=""><span class="sc"></span><div class="st2"><small>${s.k}</small><b>${s.b}</b><p>${s.p}</p></div></div>`).join("")}
    <button class="rtap" style="left:0" data-act="rprev" aria-label="上一张"></button><button class="rtap" style="right:0; width:60%" data-act="rnext" aria-label="下一张"></button>
    <button class="rbtn glass" data-act="close" aria-label="关闭" style="position:absolute; right:14px; top:26px; z-index:6">${I("x",20,2)}</button>`, "#000");
  showSlide(0); clearInterval(recapT); let t0 = performance.now();
  recapT = setInterval(() => { if(rpause) { t0 = performance.now() - (($("ov-x").querySelectorAll(".rbars b")[ri].style.width.replace("%","") || 0) / 100) * 4200; return; } const p = Math.min(1, (performance.now() - t0) / 4200); const bar = $("ov-x").querySelectorAll(".rbars b")[ri]; if(bar) bar.style.width = p * 100 + "%"; if(p >= 1){ if(ri < sl.length - 1){ showSlide(ri + 1); t0 = performance.now(); } else clearInterval(recapT); } }, 50);
  const o = $("ov-x"); o.onpointerdown = () => rpause = true; o.onpointerup = o.onpointercancel = () => rpause = false; o.showSlideReset = () => t0 = performance.now(); }
function showSlide(i){ const o = $("ov-x"), n = o.querySelectorAll(".slide").length; ri = Math.max(0, Math.min(n - 1, i)); o.querySelectorAll(".slide").forEach((s, k) => s.classList.toggle("on", k === ri)); o.querySelectorAll(".rbars b").forEach((b, k) => b.style.width = k < ri ? "100%" : "0%"); o.showSlideReset && o.showSlideReset(); }

let ptpl = "big";

/* ---------- 账本 (live) ---------- */
const CATS = [["住宿",0,"#E8A864","bed"],["交通",0,"#7FA7D6","bus"],["餐饮",0,"#EE6A3C","bowl"],["门票",0,"#A9B7A1","pin"],["购物",0,"#C79BD8","tag"]];

let AE = null;
function openAddExp(){ AE = { v:"", cur: TRIP.dest && TRIP.dest !== TRIP.home ? "cny" : "rm", cat:2, who:0, split:new Set(FRIENDS.map((_, i) => i)), note:"" }; renderAE(); }
function renderAE(){ const n = parseFloat(AE.v || "0"), other = AE.cur === "cny" ? `≈ ${HSYM()} ${(n * RATE_CNY).toFixed(2)}` : `≈ ${DSYM()} ${(n / RATE_CNY).toFixed(2)}`, per = AE.split.size ? (AE.cur === "cny" ? n * RATE_CNY : n) / AE.split.size : 0;
  sheet(`<h3>记一笔</h3>${FRIENDS.length > 1 ? `<div class="aemode"><button data-act="aemode:shared" aria-pressed="${AE.mode !== "mine"}">一起的，大家分</button><button data-act="aemode:mine" aria-pressed="${AE.mode === "mine"}">我自己的</button></div>` : `<p style="font-size:12px; color:var(--mu); margin:-4px 0 8px">现在只有你，记的都算你自己的</p>`}<div class="amtbig">${AE.cur === "cny" ? DSYM() : HSYM()} ${AE.v || "0"}</div><div class="amt-sub">${other} · 每人 ${HSYM()} ${per.toFixed(2)} <button class="chip" data-act="aecur" style="height:28px; margin-left:6px; font-size:12px">换成${AE.cur === "cny" ? " " + TRIP.home : " " + DNAME()}</button></div>
    <div class="lbl">花在哪</div><div class="pick">${CATS.map((c, i) => `<button class="chip ${i === AE.cat ? "on" : ""}" data-act="aecat:${i}">${c[0]}</button>`).join("")}</div>
    <div class="lbl">花在什么上</div><input class="dinput" id="aenote" placeholder="比如：门票、午饭" maxlength="20" value="${AE.note || ""}" style="margin-top:8px">${AE.cur === "cny" && TRIP.dest !== TRIP.home ? `<div class="lbl">实际扣了多少 ${TRIP.home}（刷卡、换汇，可不填）</div><input class="dinput" id="aereal" type="number" inputmode="decimal" placeholder="比如花了 ${DSYM()}10，扣了 ${HSYM()}8 就填 8" value="${AE.real || ""}" style="margin-top:8px">` : ""}<div class="lbl">谁付的</div><div class="pick">${FRIENDS.map(([n, c], i) => `<button class="avt" data-act="aewho:${i}" aria-pressed="${i === AE.who}" style="background:${c}" aria-label="${n}付的">${n}</button>`).join("")}</div>
    <div class="lbl">算谁的（点掉就不算他）</div><div class="pick">${FRIENDS.map(([n, c], i) => `<button class="avt" data-act="aesplit:${i}" aria-pressed="${AE.split.has(i)}" style="background:${c}" aria-label="算${n}的">${n}</button>`).join("")}</div>
    <div class="keys">${["1","2","3","4","5","6","7","8","9",".","0","⌫"].map(k => `<button data-act="aek:${k}">${k}</button>`).join("")}</div>
    <div style="margin-top:12px"><button class="cbtn" data-act="aesave" ${n > 0 && AE.split.size ? "" : "disabled"}>记下来</button></div>`); }

/* ---------- actions (part 2) ---------- */
document.addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if(!b) return; const [a, x, y] = b.dataset.act.split(":");
  switch(a){
    case "feed": openFeed(); { stagger($("sheet").querySelectorAll(".li"), 55); } break;
    case "feedok": FEED[+x].ok = true; toast("已确认 · 小林的章盖上了"); buzz(15); b.outerHTML = `<span class="okmark">${I("check",14,2.4)}已确认</span>`; break;
    case "shelf": openShelf(); break;
    case "book": shelfPick(+x); break;
    
    case "oldbook": toast("这一本已经写完了，可以翻看，不能再改"); break;
    case "settings": openSettings(); break;
    case "sw": SETS[x] = !SETS[x]; b.setAttribute("aria-checked", SETS[x]); buzz(6); break;
    case "copycode": if(!ROOM()){ toast("还没连上数据库，暂时没有房间号"); break; } try{ navigator.clipboard && copyText(ROOM()); }catch(err){} toast(`房间号 ${ROOM()} 已复制`); break;
    
    case "map": openMap(); { if(S.fx.lost > Date.now()){ const w = document.querySelector("#ov-x .mapw"); w && w.insertAdjacentHTML("beforeend", `<div class="lost-fog"><div><b style="font-size:20px">迷失中</b><br><small style="color:var(--mu)">虚假世界：一小时内只能凭感觉走</small></div></div>`); } } break;
    case "mapday": mapDay = +x; openMap(); break;
    case "tools": openTools(); break;
    case "tool": if(x === "talk"){ talkSheet(); break; } toolSheet(x); break;
    case "fxk": fx.v = x === "⌫" ? fx.v.slice(0, -1) : (x === "." && fx.v.includes(".")) || fx.v.length > 8 ? fx.v : (fx.v === "0" && x !== "." ? x : fx.v + x); fxSheet(); break;
    case "fxswap": fx.dir = fx.dir === "rm" ? "cny" : "rm"; fxSheet(); break;
    
    case "ckpic": CK.pic = +x; renderCheckin(); setTimeout(bindCkFile, 0); break;
    case "cksend": CK.step = "wait"; renderCheckin(); buzz(10); break;
    case "ckkeep": addCheckin(); closeSheet(); break;
    case "skills": openSkills(); { document.querySelectorAll("#ov-x .ghostcard").forEach((g, i) => { g.style.animationDelay = i * 120 + "ms"; g.classList.add("deal"); }); { const c = $("scard"); c && c.animate([{ opacity:0, transform:"translateY(140px) rotate(-8deg)" }, { opacity:1, transform:"none" }], { duration:700, delay:260, easing:"cubic-bezier(.3,1.2,.4,1)", fill:"backwards" }); } } break;
    
    case "suse": toast(`已发动 ${SK.key} · ${SK.name}，房间里的人都会收到`); buzz([10, 40, 20]); $("sctl").innerHTML = `<button class="cbtn ghost" disabled>今天已发动</button>`; { const c = $("scard"); if(c){ c.classList.add("used"); c.parentElement.insertAdjacentHTML("beforeend", `<span class="usedtag">已发动</span>`); } confetti(); break; } break;
    case "skeep": toast("收好了，今天之内都可以发动"); break;
    
    case "dice": openDice(); setTimeout(enhanceDice, 30); break;
    case "dmode": dmode = x; dres = null; openDice(); setTimeout(enhanceDice, 30); break;
    case "droll": rollDice(); { const w = $("dwrap"); if(w){ w.classList.remove("roll"); void w.offsetWidth; w.classList.add("roll"); } break; } break;
    case "bingo": openBingo(); break;
    case "bcell": bingoToggle(+x, b); break;
    
    case "secret": openSecret(); break;
    case "envopen": $("env").classList.toggle("open"); $("envh").textContent = $("env").classList.contains("open") ? "别告诉别人" : "点信封，拆开今天的任务"; buzz(8); break;
    
    
    case "guess": grev = false; openGuess(); break;
    
    
    case "coin": cres = null; openCoin(); break;
    
    
    case "passport": openPassport(false); break;
    
    case "album": openAlbum(); { stagger(document.querySelectorAll("#ov-x .mas figure"), 60); } { setTimeout(() => { const o = $("ov-x"); if(o && !o.querySelector(".fab")) o.insertAdjacentHTML("beforeend", `<button class="fab" data-act="aup">${I("camera",20)}上传照片</button>`); }, 0); } break;
    case "alike": { const i = +x; liked.has(i) ? liked.delete(i) : (liked.add(i), likeBurst(i)); b.classList.toggle("on", liked.has(i)); b.setAttribute("aria-pressed", liked.has(i)); b.innerHTML = `${I("heart",13,2)}${(ALBUM[i][5] || []).length}`; buzz(6); break; }
    case "aopen": openViewer(+x); break;
    case "csend": { const inp = $("cmt"), t = inp && inp.value.trim(); if(!t) break; (CMTS[+x] = CMTS[+x] || []).push([0, t, S.me || "你"]); albumSheet(+x); snd("click"); break; }
    case "paper": closeSheet(); openPaper(); break;
    case "recap": openRecap(); { setTimeout(() => { const o = $("ov-x"); if(!o || o.querySelector(".recapmus")) return; o.insertAdjacentHTML("beforeend", `<div class="recapmus"><button data-act="musictoggle">${I("mic",14)}<span id="mustxt">音乐：开</span></button><label>换成我的歌<input type="file" accept="audio/*" id="musfile" style="position:absolute; width:1px; height:1px; opacity:0"></label></div>`); musicStart(); const f = $("musfile"); f.onchange = () => { const file = f.files && f.files[0]; if(!file) return; musicStop(); const au = new Audio(URL.createObjectURL(file)); au.loop = true; au.play().catch(() => {}); window._recapAudio = au; $("mustxt").textContent = "音乐：我的歌"; }; }, 50); } break;
    case "rnext": showSlide(ri + 1); break;
    case "rprev": showSlide(ri - 1); break;
    case "receipt": openReceipt(); break;
    case "rprint": { const rc = $("rcpt"); rc.classList.remove("print"); void rc.offsetWidth; rc.classList.add("print"); { const rb = document.querySelector('#ov-x [data-act="rprint"]'); if(rb) setTimeout(() => { rb.dataset.act = "rtear"; rb.textContent = "撕下来"; }, 2600); } break; }
    case "poster": openPoster(); { const pp = document.querySelector("#ov-x .poster"); pp && bindTiltEl(pp, 10); } break;
    case "ptpl": ptpl = x; openPoster(); { const pp = document.querySelector("#ov-x .poster"); pp && bindTiltEl(pp, 10); } break;
    
    case "addexp": openAddExp(); break;
    case "aek": AE.v = x === "⌫" ? AE.v.slice(0, -1) : (x === "." && AE.v.includes(".")) || AE.v.length > 8 ? AE.v : (AE.v === "0" && x !== "." ? x : AE.v + x); renderAE(); break;
    case "aecur": AE.cur = AE.cur === "cny" ? "rm" : "cny"; renderAE(); break;
    case "aecat": AE.cat = +x; renderAE(); break;
    case "aewho": AE.who = +x; renderAE(); break;
    case "aesplit": { const i = +x; AE.split.has(i) ? AE.split.delete(i) : AE.split.add(i); renderAE(); break; }
    case "aesave": { const n = parseFloat(AE.v), cny = AE.cur === "cny" ? n : n / RATE_CNY, c = CATS[AE.cat], realRM = AE.cur === "cny" && AE.real > 0 ? +AE.real : null, rmv = realRM != null ? realRM : (AE.cur === "cny" ? cny * RATE_CNY : n), mine = AE.split.has(0) ? rmv / AE.split.size : 0; if(!(n > 0)) return toast("先输入金额");
      EXP.unshift({ t:(AE.note || (($("aenote") || {}).value) || "").trim() || `${c[0]} · 刚记的`, c:c[0], ic:c[3], col:c[2], cny: AE.cur === "cny" ? n : null, rm:+rmv.toFixed(2), real: realRM != null, who:NAMES[AE.who] || "你", payer:AE.who, split:[...AE.split].sort(), d:`${+TDATE().slice(5,7)}/${+TDATE().slice(8)} 今天`, at:TDATE() }); closeSheet(); toast(`记下了 · 你这份 ${HSYM()} ${mine.toFixed(2)}`); render(); buzz(10); { const cards = $("view").querySelectorAll(".sec .card"), lastc = cards[cards.length - 1], fe = lastc && lastc.querySelector(".exp"); fe && fe.classList.add("new"); } break; }
  }
});
document.addEventListener("dblclick", e => { const f = e.target.closest("[data-dbl]"); if(!f) return; const i = +f.dataset.dbl; if(!liked.has(i)){ liked.add(i); const bt = f.querySelector(".lk"); bt.classList.add("on"); bt.setAttribute("aria-pressed", "true"); bt.innerHTML = `${I("heart",13,2)}${ALBUM[i][2] + 1}`; } likeBurst(i); buzz(8); });
document.addEventListener("input", e => { if(e.target.dataset.in === "gmine"){ gmine = +e.target.value; const v = $("gv"); if(v) v.textContent = "¥ " + gmine; } });
$("backdrop").addEventListener("click", closeSheet);

/* ===================== part 3: motion & interaction pass ===================== */
let lastTab = null, NOSTAG = false;
function hcenter(el, smooth = true){ const p = el.parentElement, er = el.getBoundingClientRect(), pr = p.getBoundingClientRect(); p.scrollTo({ left: p.scrollLeft + (er.left - pr.left) - p.clientWidth / 2 + er.width / 2, behavior: smooth && !REDUCE ? "smooth" : "auto" }); }
function vcenter(el){ const v = $("view"), r = el.getBoundingClientRect(), vr = v.getBoundingClientRect(); v.scrollTo({ top: v.scrollTop + r.top - vr.top - vr.height / 2 + r.height / 2, behavior: REDUCE ? "auto" : "smooth" }); }
function stagger(els, step = 42, max = 14){ if(REDUCE) return; [...els].forEach((el, i) => { el.classList.remove("rise"); void el.offsetWidth; el.style.animationDelay = Math.min(i, max) * step + "ms"; el.classList.add("rise"); }); }
function countUp(el){ const txt = el.textContent, m = txt.match(/\d[\d,]*\.?\d*/); if(!m || REDUCE) return; const raw = m[0], num = parseFloat(raw.replace(/,/g, "")), dec = (raw.split(".")[1] || "").length, comma = raw.includes(","), pre = txt.slice(0, m.index), post = txt.slice(m.index + raw.length);
  tween(900, t => { const v = num * ease(t); let s = dec ? v.toFixed(dec) : String(Math.round(v)); if(comma) s = Number(s).toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec }); el.textContent = pre + s + post; }); }
function renderTabs(){ $("tabbar").innerHTML = TABS.map(([k, ic, l]) => `<button data-act="tab:${k}" class="${S.tab === k && lastTab !== k ? "justnow" : ""}" ${S.tab === k ? 'aria-current="page"' : `aria-label="${l}"`}>${I(ic, 21, S.tab === k ? 2 : 1.8)}<span>${l}</span></button>`).join(""); lastTab = S.tab; }
function render(){ const v = $("view"); v.onscroll = null; v.innerHTML = VIEWS[S.tab](); renderTabs(); if(S.tab === "book" && S.seg === "stamps") layoutArch(); after(v); }
function after(v){
  const kids = [...v.children].filter(el => !el.classList.contains("hero") && !el.classList.contains("tl"));
  if(!NOSTAG) stagger(kids);
  v.querySelectorAll(".cu").forEach(countUp);
  if(S.tab === "home") bindParallax(v);
  if(S.tab === "trip"){ decorateTimeline(v); if(!NOSTAG) stagger(v.querySelectorAll(".tl .row, .tl .tr"), 32, 20); bindSwipe(v.querySelector(".tl")); const a = v.querySelector('.dchips [aria-current="date"]'); a && hcenter(a, false); }
  if(S.tab === "book"){
    if(S.seg === "tix"){ v.querySelectorAll(".wallet .tk").forEach(t => bindTiltEl(t, 14)); v.querySelectorAll(".stub, .vcard").forEach(el => el.onclick = () => flipSwap(el)); }
    if(S.seg === "cal") v.querySelectorAll(".calg .c").forEach((c, i) => c.style.animationDelay = (i * 16) + "ms");
    if(S.seg === "diary") setupDiary(v);
    if(S.seg === "stamps") stagger(v.querySelectorAll(".dots3 button"), 60);
  }
  if(S.tab === "money") v.querySelectorAll(".pbar i").forEach((b, i) => b.style.animationDelay = (200 + i * 90) + "ms");
  NOSTAG = false;
}
function bindTiltEl(el, amt = 12){ if(REDUCE) return; el.onpointermove = e => { const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    if(el.classList.contains("tk")){ el.style.setProperty("--ry", ((px - .5) * amt) + "deg"); el.style.setProperty("--rx", ((.5 - py) * amt) + "deg"); el.style.setProperty("--gx", px * 100 + "%"); el.style.setProperty("--gy", py * 100 + "%"); }
    else el.style.transform = `perspective(900px) rotateY(${(px - .5) * amt}deg) rotateX(${(.5 - py) * amt}deg)`; };
  el.onpointerleave = () => { if(el.classList.contains("tk")){ el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); } else el.style.transform = ""; }; }
/* 今日: parallax + smooth day switching */
function bindParallax(v){ const hero = v.querySelector(".hero"); if(!hero || REDUCE) return;
  v.onscroll = () => { const y = v.scrollTop; if(y > 700) return; hero.querySelectorAll(":scope > img").forEach(im => im.style.transform = `translateY(${y * .35}px) scale(${1 + y * .0005})`); const t = hero.querySelector(".htitle"); if(t) t.style.opacity = Math.max(0, 1 - y / 280); }; }
function swapEl(a, b, dy = 10){ if(!a || !b) return; if(REDUCE){ a.innerHTML = b.innerHTML; return; }
  a.animate([{ opacity:1, translate:"0 0" }, { opacity:0, translate:`0 ${dy}px` }], { duration:160, easing:"ease-in", fill:"forwards" }).onfinish = () => { a.innerHTML = b.innerHTML;
    a.animate([{ opacity:0, translate:`0 ${-dy}px` }, { opacity:1, translate:"0 0" }], { duration:340, easing:"cubic-bezier(.3,.9,.3,1)", fill:"forwards" }); a.querySelectorAll(".cu").forEach(countUp); }; }
function setDay(i){
  if(S.tab !== "home"){ S.day = i; return render(); } if(i === S.day) return; const dir = i > S.day ? 1 : -1; S.day = i;
  const v = $("view"), hero = v.querySelector(".hero"), tmp = document.createElement("div"); tmp.innerHTML = home();
  const old = hero.querySelector(":scope > img"), nim = tmp.querySelector(".hero > img"); nim.style.transform = old.style.transform; nim.style.opacity = 0; old.after(nim);
  requestAnimationFrame(() => requestAnimationFrame(() => nim.style.opacity = 1)); setTimeout(() => old.remove(), 560);
  swapEl(hero.querySelector(".htitle"), tmp.querySelector(".htitle"), 14 * dir); swapEl(hero.querySelector(".temp"), tmp.querySelector(".temp"), 0);
  hero.querySelector(".htop .tag").textContent = tmp.querySelector(".htop .tag").textContent;
  hero.querySelectorAll(".bub").forEach(b => b.animate([{ opacity:1, scale:1 }, { opacity:0, scale:.5 }], { duration:200, fill:"forwards" }).onfinish = () => b.remove());
  tmp.querySelectorAll(".hero .bub").forEach((b, k) => { b.animate([{ opacity:0, scale:.4 }, { opacity:1, scale:1.08, offset:.7 }, { opacity:1, scale:1 }], { duration:450, delay:220 + k * 90, fill:"backwards", easing:"cubic-bezier(.2,1.4,.4,1)" }); hero.insertBefore(b, hero.querySelector(".htitle")); });
  ["stats", "tiles"].forEach(c => { const a = v.querySelector("." + c), b = tmp.querySelector("." + c); if(a && b){ a.replaceWith(b); b.animate([{ opacity:0, translate:"0 8px" }, { opacity:1, translate:"0 0" }], { duration:360, easing:"cubic-bezier(.3,.9,.3,1)" }); b.querySelectorAll(".cu").forEach(countUp); } });
  const btns = v.querySelectorAll(".days button"); btns.forEach((b, k) => k === i ? b.setAttribute("aria-current", "date") : b.removeAttribute("aria-current"));
  hcenter(btns[i]); buzz(6);
}
/* 行程: now line, swipe days */
function decorateTimeline(v){ const rows = [...v.querySelectorAll(".tl .row")]; if(S.tday < TODAY){ rows.forEach(r => r.classList.add("past")); return; } if(S.tday > TODAY) return;
  const NOW = "11:40"; let ni = -1; rows.forEach((r, k) => { if(r.querySelector("time").textContent <= NOW) ni = k; });
  rows.forEach((r, k) => { if(k < ni) r.classList.add("past"); if(k === ni){ r.classList.add("now"); const it = r.querySelector(".it"), em = it.querySelector("em"), tag = document.createElement("i"); tag.className = "nowtag"; tag.textContent = "进行中"; em ? em.replaceWith(tag) : it.appendChild(tag); } }); }
function setTday(i, dir){ if(i < 0 || i >= DAYS.length || i === S.tday) return; dir = dir || (i > S.tday ? 1 : -1); S.tday = i; NOSTAG = true; render(); const tl = $("view").querySelector(".tl");
  if(tl && !REDUCE){ tl.animate([{ opacity:0, translate:`${dir * 46}px 0` }, { opacity:1, translate:"0 0" }], { duration:380, easing:"cubic-bezier(.3,.9,.3,1)" }); const cc = $("view").querySelector(".citycard"); cc && cc.animate([{ opacity:.3, scale:.97 }, { opacity:1, scale:1 }], { duration:420, easing:"cubic-bezier(.3,.9,.3,1)" }); } buzz(6); }
function bindSwipe(el){ if(!el) return; let x0 = null, y0 = 0, sw = false;
  el.addEventListener("pointerdown", e => { x0 = e.clientX; y0 = e.clientY; sw = false; });
  el.addEventListener("pointerup", e => { if(x0 === null) return; const dx = e.clientX - x0, dy = e.clientY - y0; x0 = null; if(Math.abs(dx) > 60 && Math.abs(dy) < 50){ sw = true; setTday(S.tday + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); } });
  el.addEventListener("click", e => { if(sw){ e.stopPropagation(); e.preventDefault(); sw = false; } }, true); }
/* 行李箱: fill in place, items fly in */
function renderPack(){ const n = S.packed.size, r = n / PACK_TOTAL, full = n === PACK_TOTAL;
  $("ov-pack").innerHTML = `<div class="scr"><div class="ptop"><button class="rbtn glass" data-act="close" aria-label="返回">${I("back",22,2)}</button><h1 id="packtitle">${full ? "都装好了" : "准备好了吗"}</h1></div>
    <div style="position:sticky; top:0; z-index:5; background:linear-gradient(180deg, var(--bg) 82%, rgba(11,12,16,0)); padding:8px 20px 18px; display:flex; align-items:center; gap:16px">
    <svg id="suitsvg" width="150" height="172" viewBox="0 0 210 240" aria-label="行李箱" style="filter:drop-shadow(0 18px 26px rgba(0,0,0,.5))">
      <defs><clipPath id="bd"><rect x="14" y="44" width="182" height="172" rx="22"/></clipPath></defs>
      <path d="M76 44 V20 a10 10 0 0 1 10-10 h38 a10 10 0 0 1 10 10 V44" fill="none" stroke="#4A3220" stroke-width="9"/>
      <rect x="14" y="44" width="182" height="172" rx="22" fill="#6B4A2C"/>
      <g clip-path="url(#bd)"><g id="suitfill" style="transform:translateY(${(1 - r) * 172}px); transition:transform .8s cubic-bezier(.3,1.25,.4,1)"><g class="wavefill"><path d="M-80 48 ${"q22.75 -9 45.5 0 t45.5 0 ".repeat(6)} V270 H-80Z" fill="#E8A864"/><path d="M-80 48 ${"q22.75 -9 45.5 0 t45.5 0 ".repeat(6)}" fill="none" stroke="#F4C88E" stroke-width="3"/></g></g></g>
      <rect x="56" y="44" width="14" height="172" fill="#4A3220" opacity=".85"/><rect x="140" y="44" width="14" height="172" fill="#4A3220" opacity=".85"/>
      <rect x="50" y="98" width="26" height="18" rx="4" fill="#C9A274"/><rect x="134" y="98" width="26" height="18" rx="4" fill="#C9A274"/>
      <rect x="14" y="44" width="182" height="172" rx="22" fill="none" stroke="#3A2716" stroke-width="3"/>
      <circle cx="44" cy="226" r="9" fill="#2A1D12"/><circle cx="166" cy="226" r="9" fill="#2A1D12"/>
      <g id="suitstamp" style="opacity:${full ? 1 : 0}; transform:${full ? "scale(1)" : "scale(1.8)"}"><g transform="translate(105 150) rotate(-14)"><circle r="40" fill="rgba(179,52,30,.88)" stroke="#FBF7EF" stroke-width="2"/><text y="7" text-anchor="middle" font-family="Noto Serif SC,serif" font-size="20" fill="#FBF7EF">装好了</text></g></g>
    </svg>
    <div style="flex:1"><small style="color:var(--amber); font-weight:700; font-size:12px">私人清单 · 只有你看得到</small><div style="margin-top:6px"><b id="packn" style="font-family:var(--dot); font-size:32px; font-weight:400">${n}</b><small style="color:var(--mu)"> / ${PACK_TOTAL} 件</small></div>
      <div style="height:8px; border-radius:4px; background:rgba(255,255,255,.1); margin-top:8px; overflow:hidden"><div id="packbar" style="height:100%; width:${r * 100}%; background:var(--amber); border-radius:4px; transition:width .6s cubic-bezier(.3,1.2,.4,1)"></div></div>
      <small style="display:block; margin-top:8px; color:var(--mu); font-size:12px">打勾的东西会飞进箱子里 · 旅伴看不到</small></div></div>
    ${CHECK.map((g, gi) => `<div class="sec" style="margin-top:6px"><h2>${g.cat}<span>${g.items.filter((_, i) => S.packed.has(gi + ":" + i)).length} / ${g.items.length}</span></h2>
      ${g.items.map((t, i) => { const on = S.packed.has(gi + ":" + i); return `<button class="ck" data-act="ck:${gi}:${i}" aria-pressed="${on}"><i>${I("check",16,2.4)}</i><span style="flex:1; font-size:14px">${t}</span></button>`; }).join("")}</div>`).join("")}
    <div class="sec"><div class="addrow"><label for="packin" style="position:absolute; left:-9999px">加一件东西</label><input id="packin" placeholder="还要带什么？比如：隐形眼镜" maxlength="30"><button class="chip on" data-act="packadd" style="height:46px">加上</button></div></div></div>`;
  stagger($("ov-pack").querySelectorAll(".sec"), 50); }
function packToggle(gi, i, btn){ const k = gi + ":" + i, add = !S.packed.has(k); add ? S.packed.add(k) : S.packed.delete(k); btn.setAttribute("aria-pressed", add); buzz(add ? 10 : 5); S.packDirty = true;
  const o = $("ov-pack"), n = S.packed.size, r = n / PACK_TOTAL, full = n === PACK_TOTAL, g = CHECK[gi];
  o.querySelector("#suitfill").style.transform = `translateY(${(1 - r) * 172}px)`; o.querySelector("#packbar").style.width = r * 100 + "%";
  const pn = o.querySelector("#packn"); pn.textContent = n; pn.animate([{ scale:1.4 }, { scale:1 }], { duration:300, easing:"cubic-bezier(.2,1.5,.4,1)" });
  btn.closest(".sec").querySelector("h2 span").textContent = `${g.items.filter((_, j) => S.packed.has(gi + ":" + j)).length} / ${g.items.length}`;
  o.querySelector("#packtitle").textContent = full ? "都装好了" : "准备好了吗";
  const st = o.querySelector("#suitstamp"); st.style.opacity = full ? 1 : 0; st.style.transform = full ? "scale(1)" : "scale(1.8)";
  if(add) fly(btn.querySelector("span").textContent, btn, o.querySelector("#suitsvg"));
  else { const sv = o.querySelector("#suitsvg"); sv.animate([{ rotate:"0deg" }, { rotate:"-3deg" }, { rotate:"2deg" }, { rotate:"0deg" }], { duration:360 }); }
  if(full){ setTimeout(() => { toast("全部装好了，可以出发"); buzz([10, 60, 20]); confetti(); }, 650); } }
function fly(text, from, to){ if(REDUCE) return; const app = $("app"), a = app.getBoundingClientRect(), f = from.getBoundingClientRect(), t = to.getBoundingClientRect(), el = document.createElement("span");
  el.className = "flyer"; el.textContent = text.length > 9 ? text.slice(0, 9) + "…" : text; app.appendChild(el);
  const x0 = f.left - a.left + 40, y0 = f.top - a.top + 8, x1 = t.left - a.left + t.width / 2 - 34, y1 = t.top - a.top + t.height * .5;
  el.animate([{ transform:`translate(${x0}px,${y0}px) scale(1)`, opacity:1 }, { transform:`translate(${(x0 + x1) / 2}px,${Math.min(y0, y1) - 70}px) scale(.85)`, opacity:1, offset:.5 }, { transform:`translate(${x1}px,${y1}px) scale(.25)`, opacity:0 }], { duration:720, easing:"cubic-bezier(.45,0,.2,1)" })
    .onfinish = () => { el.remove(); to.classList.remove("bump"); void to.getBoundingClientRect(); to.classList.add("bump"); }; }
function confetti(){ if(REDUCE) return; const app = $("app"), W = app.clientWidth, H = app.clientHeight, cols = ["#E8A864","#EE6A3C","#A9B7A1","#9FB8D8","#F5F4F0","#C79BD8"];
  for(let k = 0; k < 40; k++){ const c = document.createElement("i"); c.className = "conf"; c.style.background = cols[k % cols.length]; c.style.left = "0"; c.style.top = "0"; app.appendChild(c);
    const x = W / 2 + (Math.random() - .5) * 80, y = H * .38, dx = (Math.random() - .5) * W, dy = -140 - Math.random() * 240;
    c.animate([{ transform:`translate(${x}px,${y}px) rotate(0)`, opacity:1 }, { transform:`translate(${x + dx * .6}px,${y + dy}px) rotate(${Math.random() * 360}deg)`, opacity:1, offset:.35 }, { transform:`translate(${x + dx}px,${y + 460}px) rotate(${720 * Math.random()}deg)`, opacity:0 }], { duration:1400 + Math.random() * 700, easing:"cubic-bezier(.2,.6,.4,1)" }).onfinish = () => c.remove(); } }
/* 手账: flip stubs, stamp viewer, diary editing */
function flipSwap(el){ if(el._busy) return; el._busy = true; buzz(6);
  el.animate([{ transform:"perspective(900px) rotateY(0)" }, { transform:"perspective(900px) rotateY(90deg)" }], { duration:200, easing:"ease-in" }).onfinish = () => {
    let b = el.querySelector(":scope > .back"); if(b) b.remove(); else { b = document.createElement("div"); b.className = "back"; const cap = (el.querySelector(".p span, .ph2 span") || {}).textContent || "", ttl = (el.querySelector(".s b, .h b") || {}).textContent || "";
      b.innerHTML = `<small>${ttl} · 背面</small><p>${cap}</p><small>小林、Q 同行 · 点一下翻回来</small>`; el.appendChild(b); }
    el.animate([{ transform:"perspective(900px) rotateY(-90deg)" }, { transform:"perspective(900px) rotateY(0)" }], { duration:340, easing:"cubic-bezier(.3,1.3,.4,1)" }).onfinish = () => el._busy = false; }; }
S.snotes = {};
function openStampView(i){ const A = ARCH[S.acity]; if(!A || !A.st[i]) return; const [k, l] = A.st[i], key = S.acity + i, note = S.snotes[key] || "";
  const lines = (note || "还没有写，翻回来给这枚邮票留一句话。").match(/.{1,9}/g).slice(0, 5);
  const backSVG = `<svg viewBox="0 0 108 138" aria-hidden="true"><path d="${perf(108,138)}" fill="#F4EFE4"/><g opacity=".55" stroke="#2B2A28" fill="none" stroke-width="1"><circle cx="82" cy="28" r="15"/><circle cx="82" cy="28" r="11"/><path d="M30 22 q6-4 12 0 t12 0M30 28 q6-4 12 0 t12 0M30 34 q6-4 12 0 t12 0"/></g>
    <text x="82" y="31" text-anchor="middle" font-family="-apple-system, PingFang SC, Noto Sans SC, sans-serif" font-size="6" fill="#2B2A28">11.04</text>${lines.map((t, j) => `<text x="12" y="${62 + j * 13}" font-family="Long Cang,cursive" font-size="11" fill="#2B2A28">${t}</text>`).join("")}<text x="12" y="126" font-family="-apple-system, PingFang SC, Noto Sans SC, sans-serif" font-size="5.5" fill="#6B685F">${A.en} · ${l}</text></svg>`;
  page(`<div class="scr">${back("")}<div style="display:flex; justify-content:center; margin-top:-30px"><span class="chip glass">${l}</span></div>
    <div class="sv"><button class="svc" id="svc" data-act="svflip" aria-label="点一下翻面"><span class="sf">${stampSVG(k, l, A.en, "11.04")}</span><span class="sf sb">${backSVG}</span></button></div>
    <p style="text-align:center; font-size:12px; color:var(--mu); margin:4px 0 0">点邮票翻面 · 按住轻轻倾斜</p>
    <div class="sec"><div style="display:flex; gap:8px"><label for="svin" style="position:absolute; left:-9999px">给这枚邮票写一句</label><input id="svin" value="${note.replace(/"/g, "&quot;")}" placeholder="给这枚邮票写一句…" maxlength="40" style="flex:1; height:48px; border-radius:24px; border:1px solid var(--line); background:rgba(255,255,255,.06); color:var(--ink); padding:0 16px; font:inherit; font-size:15px"><button class="chip on" data-act="svsave:${i}" style="height:48px">写上</button></div></div></div>`, "#0B0C10");
  const c = $("svc"); c.animate([{ opacity:0, transform:"translateY(40px) rotate(-6deg) scale(.8)" }, { opacity:1, transform:"none" }], { duration:600, easing:"cubic-bezier(.2,1.2,.3,1)" });
  if(!REDUCE){ c.onpointermove = e => { const r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5; c.style.transition = "transform .08s"; c.style.transform = `${c.classList.contains("flip") ? "rotateY(180deg)" : ""} rotateY(${px * 22}deg) rotateX(${-py * 16}deg)`; }; c.onpointerleave = () => { c.style.transition = ""; c.style.transform = ""; }; } }
const DUNDO = [];
function setupDiary(v){ const p = v.querySelector(".paper"); if(!p) return; const pos = S.dpos && S.dpos[S.diary] || {};
  [...p.children].forEach((el, i) => { if(el.classList.contains("washi") || el.dataset.act) return; el.dataset.drag = i; const q = pos[i]; if(q) el.style.translate = `${q[0]}px ${q[1]}px`; });
  stagger(p.querySelectorAll("[data-drag], .washi"), 55);
  p.onpointerdown = e => { if(!p.classList.contains("edit")) return; const el = e.target.closest("[data-drag]"); if(!el || !p.contains(el)) return; e.preventDefault(); S.dpos = S.dpos || {};
    const idx = +el.dataset.drag, P0 = (S.dpos[S.diary] = S.dpos[S.diary] || {}), start = P0[idx] || [0, 0], x0 = e.clientX, y0 = e.clientY; el.classList.add("drag"); el.setPointerCapture(e.pointerId);
    const mv = ev => { const dx = start[0] + ev.clientX - x0, dy = start[1] + ev.clientY - y0; el.style.translate = `${dx}px ${dy}px`; P0[idx] = [dx, dy]; };
    const up = () => { el.classList.remove("drag"); el.removeEventListener("pointermove", mv); el.removeEventListener("pointerup", up); DUNDO.push([S.diary, idx, start]); buzz(5); };
    el.addEventListener("pointermove", mv); el.addEventListener("pointerup", up); }; }
function diaryEdit(on){ const p = $("view").querySelector(".paper"); if(!p) return; p.classList.toggle("edit", on); p.querySelector(".ebar")?.remove(); const fab = p.querySelector('[aria-label^="添加"]'); if(fab) fab.style.display = on ? "none" : "";
  if(on){ p.insertAdjacentHTML("beforeend", `<div class="ebar"><button data-act="dundo" style="width:48px" aria-label="撤销">${I("back",18,2)}</button><button data-act="dreset" style="flex:1">复位</button><button class="dk" data-act="ddone" style="flex:1.4">${I("check",16,2.2)}完成</button></div>`); toast("拖动照片、便签和贴纸来重新排版"); } }
/* 桌面游戏: skills shuffle + tilt, dice hop */

/* page & sheet wrappers with entrance motion */
function page(html, bg){ const o = $("ov-x"); openOv("ov-x"); o.style.background = bg || "var(--bg)"; o.innerHTML = html; const sc = o.querySelector(".scr"); if(sc){ sc.scrollTop = 0; if(!NOSTAG) stagger([...sc.children].slice(1), 50); } NOSTAG = false; }
function sheet(html){ const s = $("sheet"), was = s.classList.contains("on"); s.innerHTML = `<div class="grab" aria-hidden="true"></div>${html}`; if(!was){ s.scrollTop = 0; stagger([...s.children].slice(1), 38); } s.classList.add("on"); $("backdrop").classList.add("on"); }
(function sheetDrag(){ const s = $("sheet"); let y0 = null, dy = 0;
  s.addEventListener("pointerdown", e => { const r = s.getBoundingClientRect(); if(e.clientY - r.top > 40 || s.scrollTop > 0) return; y0 = e.clientY; dy = 0; s.style.transition = "none"; });
  s.addEventListener("pointermove", e => { if(y0 === null) return; dy = Math.max(0, e.clientY - y0); s.style.transform = `translateY(${dy}px)`; });
  const end = () => { if(y0 === null) return; y0 = null; s.style.transition = ""; s.style.transform = ""; if(dy > 100) closeSheet(); };
  s.addEventListener("pointerup", end); s.addEventListener("pointercancel", end); })();
function closeOv(){ if(!curOv) return; $(curOv).classList.remove("on"); if(curOv === "ov-tear") stopGL(); if(curOv === "ov-x"){ clearInterval(recapT); recapT = 0; if(window.ORIG_STOP) ORIG_STOP(); }
  curOv = null; if(S.packDirty){ S.packDirty = false; if(S.tab === "trip"){ NOSTAG = true; render(); } } }

/* ---------- actions (part 3) ---------- */
document.addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if(!b) return; const [a, x, y] = b.dataset.act.split(":");
  switch(a){
    
    
    
    
    
    case "pin": { const g = GEO[+x], [px, py] = pj(g[1], g[2]), w = document.querySelector(".mapw"); if(!w) break; w.querySelector(".mtip")?.remove(); const t = document.createElement("span"); t.className = "mtip glass"; const vb = S.mapVB || [0, 0, 360, 330]; t.style.left = ((px - vb[0]) / vb[2] * 100) + "%"; t.style.top = ((py - vb[1]) / vb[3] * 100) + "%"; t.textContent = `${g[0]} · ${g[3].map(d => "D" + pad(d + 1)).join(" / ")}`; w.appendChild(t); buzz(6); break; }
    case "rtear": { const rc = $("rcpt"); if(!rc) break; rc.classList.add("torn"); buzz([6, 20, 6, 20, 30]); setTimeout(() => { rc.classList.remove("torn", "print"); addKeep("receipt"); b.dataset.act = "rprint"; b.textContent = "再打印一张"; }, 900); break; }
    
    
    
    
    
    case "stview": openStampView(+x); break;
    case "svflip": { const c = $("svc"); c.style.transform = ""; c.classList.toggle("flip"); buzz(8); break; }
    case "svsave": { const inp = $("svin"); S.snotes[S.acity + x] = inp.value.trim(); toast("写上了"); NOSTAG = true; openStampView(+x); setTimeout(() => { const c = $("svc"); c && c.classList.add("flip"); }, 120); break; }
    case "dedit": diaryEdit(!$("view").querySelector(".paper.edit")); break;
    case "ddone": diaryEdit(false); toast("排好了"); break;
    case "dundo": { const u = DUNDO.pop(); if(!u) { toast("没有可以撤销的了"); break; } const [d, idx, st] = u; S.dpos[d][idx] = st; const el = $("view").querySelector(`.paper [data-drag="${idx}"]`); if(el){ el.style.transition = "translate .3s"; el.style.translate = `${st[0]}px ${st[1]}px`; setTimeout(() => el.style.transition = "", 320); } break; }
    case "dreset": { if(S.dpos) S.dpos[S.diary] = {}; $("view").querySelectorAll(".paper [data-drag]").forEach(el => { el.style.transition = "translate .4s cubic-bezier(.3,1.2,.4,1)"; el.style.translate = "0 0"; setTimeout(() => el.style.transition = "", 420); }); break; }
    
  }
});

/* ===================== part 4: the originals (cards, coin, motion, sound) ===================== */
const O = window.ORIG || null;
const snd = (k, ...a) => { try{ O && O.sfx && O.sfx[k] && O.sfx[k](...a); }catch(e){} };
addEventListener("pointerdown", () => { try{ O && O.unlock && O.unlock(); }catch(e){} }, { once:true, capture:true });
/* sound for everything you touch */
const SND_OF = { tab:"tap", day:"tap", tday:"tap", seg:"tap", mapday:"tap", dmode:"tap", cq:"tap", ptpl:"tap", acity:"tap", aecat:"tap", aewho:"tap", aesplit:"tap", ckpic:"tap", diaryday:"paper",
  arch:"paper", paper:"paper", receipt:"paper", passport:"paper", ppopen:"paper", poster:"paper", album:"paper", secret:"paper", envopen:"tear", stview:"paper", svflip:"flip", book:"paper", shelf:"paper",
  ck:"click", bcell:"stamp", trate:"stamp", ckkeep:"stamp", cksend:"click", suse:"success", aesave:"success", tkeep:"success", greveal:"reveal", settle:"success", feedok:"stamp", alike:"click",
  ttear:"tear", tpull:"paper", fortune:"paper", close:"click", droll:"shuffle", rtear:"tear", rprint:"paper", sw:"click", map:"paper", tools:"tap", tool:"tap", fxk:"click", aek:"click" };
document.addEventListener("click", e => { const b = e.target.closest("[data-act]"); if(!b) return; const a = b.dataset.act.split(":")[0]; if(SND_OF[a]) snd(SND_OF[a]); }, true);

/* ---------- The Trip Deck (original cards) ---------- */
const FRAME = `<svg class="tc-frame" viewBox="0 0 100 148" aria-hidden="true"><g fill="none" stroke="var(--gold)"><rect x="3.5" y="3.5" width="93" height="141" rx="4" stroke-width=".6"/><rect x="6" y="6" width="88" height="136" rx="2.6" stroke-width=".3"/><path d="M6 16h4a6 6 0 0 0 6-6V6M94 16h-4a6 6 0 0 1-6-6V6M6 132h4a6 6 0 0 1 6 6v4M94 132h-4a6 6 0 0 0-6 6v4" stroke-width=".4"/><path d="M50 3.5l2 2.5-2 2.5-2-2.5zM50 139.5l2 2.5-2 2.5-2-2.5z" fill="var(--gold)" stroke="none"/></g></svg>`;
function cardHTML2(k, o = {}){ const C = O.CARD, s = C[k], st = o.state || "", mn = O.isMinor(k);
  return `<div class="tc ${o.cls || ""} ${st ? "st-" + st : ""}${o.down ? " down" : ""}" style="--gold:${s.accent};--bgc:${s.bg};--bgc2:${s.bg2}" data-card="${k}"><div class="tc-in">
    <div class="tc-face tc-front">${FRAME}<div class="tc-c tl">${mn ? s.numeral : k}${mn ? `<i>${s.name}</i>` : ""}</div><div class="tc-c br">${mn ? s.numeral : k}</div>
      <div class="tc-art char">${mn ? O.emblemSVG(k) : O.characterSVG(k)}<div class="tc-burst"></div></div>
      <div class="tc-plate"><div class="tc-myth">${s.myth}</div><div class="tc-name">${s.name}</div><div class="tc-en">${s.en}</div></div><div class="tc-mark">已发动</div><div class="foil"></div></div>
    <div class="tc-face tc-back">${O.CARD_BACK}</div></div></div>`; }
const backHTML2 = i => `<div class="ocard" style="--i:${i}">${O.CARD_BACK}</div>`;
let DK = { card:null, used:false, busy:false };
const waitMs = ms => new Promise(r => setTimeout(r, REDUCE ? 0 : ms));
function oracleHTML(){ return `<div class="oracle" id="oracle" role="button" tabindex="0" aria-label="按住牌堆抽牌">
    <svg class="astro" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="96"/><circle cx="100" cy="100" r="86" stroke-dasharray="1 5"/>${Array.from({ length: 24 }, (_, i) => `<path d="M100 4v${i % 2 ? 6 : 12}" transform="rotate(${i * 15} 100 100)"/>`).join("")}${["月","日","缘","航","轮","梦"].map((t, i) => `<text x="100" y="27" transform="rotate(${i * 60} 100 100)" text-anchor="middle">${t}</text>`).join("")}</svg>
    <svg class="oring" viewBox="0 0 200 200"><circle cx="100" cy="100" r="90" class="bg"/><circle cx="100" cy="100" r="90" class="fg" id="oringFg"/></svg>
    <div class="odeck">${Array.from({ length: 7 }, (_, i) => backHTML2(i)).join("")}</div></div>
  <p class="o-hint" id="oHint">按住牌堆不放，等圆圈转满（约两秒），心里想着今天的旅程……</p><p class="o-left">牌堆里还剩 ${O.ALL_CARDS.length - 1} 张</p>`; }
function deckActHTML(){ const s = O.CARD[DK.card]; if(DK.used) return `<div class="dk-note"><b>✓ 已发动 · ${s.key} · ${s.name}</b><p>${s.effect}</p></div>`;
  return `<div class="dk-note"><b>${s.key} · ${s.name}</b><p>${s.effect}</p><p class="warn">今天不发动，明天会失控：${s.ooc}</p></div><div style="padding:14px 20px 0"><button class="cbtn" data-act="dkactivate" style="background:linear-gradient(135deg, ${s.accent}, #F5F4F0)">发动技能 · ACTIVATE</button></div>`; }
function openSkills(){ window.CUR_PAGE = "skills";  if(!O) return toast("牌组没有加载出来");
  page(`<div class="scr" style="background:radial-gradient(120% 60% at 50% 18%, #1B1F30, #0B0C10 70%)">${back("")}
    <div class="dk-title"><small>SKILL ACTIVATION · DAY 05 · 11/4 周三</small><h2>The Trip Deck</h2><p>神话里的守护者们，今天只会有一位来找你。</p></div>
    <div class="dk-stage" id="dkStage">${DK.card ? `<div class="my-card" id="myCard">${cardHTML2(DK.card, { state: DK.used ? "done" : "mine", cls:"hero powered" })}</div><p class="o-hint"><b>${O.CARD[DK.card].myth}</b></p>` : oracleHTML()}</div>
    <div id="dkAct">${DK.card ? deckActHTML() : ""}</div>${oocTile()}<div class="sec"><button class="cbtn ghost" data-act="oocdemo">不发动会怎样？看看失控</button></div>
    <div class="sec"><h2>今天的牌桌<span>点牌看看</span></h2><div class="seats">
      <div class="seat" data-act="dkseat:9">${cardHTML2("9", { cls:"mini", state:"done" })}<b>小林</b><small>✓ 已发动</small></div>
      <div class="seat"><div class="tc mini down"><div class="tc-in"><div class="tc-face tc-back">${O.CARD_BACK}</div></div></div><b>Q</b><small>已抽 · 未揭晓</small></div>
      <div class="seat">${DK.card ? cardHTML2(DK.card, { cls:"mini", state: DK.used ? "done" : "" }) : `<div class="tc mini down" style="opacity:.35"><div class="tc-in"><div class="tc-face tc-back">${O.CARD_BACK}</div></div></div>`}<b>你</b><small>${DK.card ? (DK.used ? "✓ 已发动" : "未发动") : "还没抽"}</small></div></div></div></div>`, "#0B0C10");
  wireDeck();  setTimeout(() => { const o = $("ov-x"); const h2 = o && [...o.querySelectorAll(".sec h2")].find(x => x.textContent.includes("今天的牌桌")); if(h2) h2.closest(".sec").outerHTML = deckTableHTML(); }, 0); }
function wireDeck(){ const o = $("oracle"); if(o) holdToDraw(o); const mc = $("myCard"); if(mc){ const c = mc.querySelector(".tc"); mc.onclick = () => { c.classList.remove("poke"); void c.offsetWidth; c.classList.add("poke"); snd("tap"); buzz(6); }; cardTilt(mc, c); } }
function cardTilt(wrap, card){ if(REDUCE) return; wrap.onpointermove = e => { const r = wrap.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; card.style.transform = `rotateY(${x * 18}deg) rotateX(${-y * 14}deg)`; card.style.setProperty("--fx", (50 + x * 90) + "%"); card.style.setProperty("--fy", (50 + y * 90) + "%"); }; wrap.onpointerleave = () => { card.style.transform = ""; }; }
function holdToDraw(el){ const fg = $("oringFg"), C = 2 * Math.PI * 90; fg.style.strokeDasharray = C; fg.style.strokeDashoffset = C; let t0 = 0, raf = 0, holding = false, lastTick = 0; const DUR = 1700;
  const step = ts => { if(!holding) return; const p = Math.min(1, (ts - t0) / DUR); fg.style.strokeDashoffset = C * (1 - p); el.style.setProperty("--p", p); if(ts - lastTick > 110){ lastTick = ts; snd("charge", p); buzz(4); } if(p >= 1){ holding = false; el.classList.remove("charging"); doDraw(el); return; } raf = requestAnimationFrame(step); };
  const start = e => { if(DK.busy) return; e.preventDefault(); holding = true; t0 = performance.now(); el.classList.add("charging"); $("oHint").textContent = "别松手……星图在转动"; snd("shuffle"); raf = requestAnimationFrame(step); };
  const stop = () => { if(!holding) return; holding = false; cancelAnimationFrame(raf); el.classList.remove("charging"); el.style.setProperty("--p", 0); fg.style.transition = "stroke-dashoffset .4s"; fg.style.strokeDashoffset = C; setTimeout(() => fg.style.transition = "", 400); $("oHint").textContent = "再专注一点，按住不放"; };
  el.addEventListener("pointerdown", start); ["pointerup", "pointerleave", "pointercancel"].forEach(ev => el.addEventListener(ev, stop));
  el.addEventListener("keydown", e => { if(e.key === "Enter" || e.key === " "){ e.preventDefault(); doDraw(el); } }); }
async function doDraw(el){ if(DK.busy) return; DK.busy = true; el.classList.add("shuffling"); snd("shuffle"); setTimeout(() => snd("shuffle"), 380); await waitMs(1100);
  const pool = O.ALL_CARDS.map(c => c.key || c).filter(k => k !== "9"); DK.card = pool[Math.floor(Math.random() * pool.length)]; const stage = $("dkStage"), s = O.CARD[DK.card]; if(!stage){ DK.busy = false; return; }
  stage.innerHTML = `<div class="my-card rising" id="myCard">${cardHTML2(DK.card, { state:"mine", cls:"hero flipping", down:true })}</div><p class="o-hint" id="oHint">&nbsp;</p>`;
  const c = stage.querySelector(".tc"); await waitMs(450); if(!c.isConnected){ DK.busy = false; return; } snd("flip"); c.classList.remove("down");
  await waitMs(420); c.classList.add("transforming"); snd("transform"); buzz([20, 40, 30, 40, 60]);
  await waitMs(2300); c.classList.remove("transforming", "flipping"); c.classList.add("powered"); snd("reveal");
  if(!c.isConnected){ DK.busy = false; return; } $("oHint").innerHTML = `<b>${s.myth}</b> 降临 —— 你抽到了 <b>${s.key} · ${s.name}</b>`; DK.busy = false; $("dkAct").innerHTML = deckActHTML(); wireDeck(); }

/* 雷公催雨 / 雪女落雪: the whole app rains or snows */
let atm = null;
function startAtmos(kind){ atmosKind = kind;  stopAtmos(); const app = $("app"), cv = document.createElement("canvas"); cv.className = "atm"; app.appendChild(cv); const x = cv.getContext("2d"), dpr = Math.min(2, devicePixelRatio || 1);
  let w = 0, h = 0; const size = () => { w = app.clientWidth; h = app.clientHeight; cv.width = w * dpr; cv.height = h * dpr; cv.style.width = w + "px"; cv.style.height = h + "px"; x.setTransform(dpr, 0, 0, dpr, 0, 0); }; size();
  const N = REDUCE ? 30 : kind === "snow" ? 90 : 120, P = Array.from({ length: N }, () => ({ x: Math.random() * w, y: Math.random() * h, v: kind === "snow" ? .4 + Math.random() * .9 : 7 + Math.random() * 6, r: 1.2 + Math.random() * 2.2, d: Math.random() * 6.28 }));
  let t = 0, raf = 0, lastA = 0; const loop = (ts = 0) => { raf = requestAnimationFrame(loop); if(document.hidden || ts - lastA < 31) return; lastA = ts; t += .032; x.clearRect(0, 0, w, h);
    if(kind === "snow"){ x.fillStyle = "rgba(255,255,255,.9)"; P.forEach(p => { p.y += p.v * 2; p.x += Math.sin(t + p.d) * .7; if(p.y > h){ p.y = -4; p.x = Math.random() * w; } x.beginPath(); x.arc(p.x, p.y, p.r, 0, 7); x.fill(); }); }
    else { x.strokeStyle = "rgba(190,210,235,.38)"; x.lineWidth = 1.1; P.forEach(p => { p.y += p.v * 2; p.x -= 2.4; if(p.y > h){ p.y = -14; p.x = Math.random() * w + 40; } x.beginPath(); x.moveTo(p.x, p.y); x.lineTo(p.x - 3, p.y + 18); x.stroke(); }); } };
  loop(); try{ O && O.ambient && O.ambient(kind); if(kind === "rain") O.mus && O.mus.whoosh && O.mus.whoosh(); }catch(e){} buzz(kind === "rain" ? [40, 60, 80] : [8, 60, 8]);
  atm = { stop(){ cancelAnimationFrame(raf); cv.remove(); try{ O && O.stopAmbient && O.stopAmbient(); }catch(e){} } };
  DAYCFG[TODAY].wx = kind === "rain" ? "雷公催雨" : "雪女落雪"; }
function stopAtmos(){ if(atm){ atm.stop(); atm = null; } }

/* ---------- 旅途通宝 (original bronze coin) ---------- */
function coinFace(heads) {
  const u = (heads ? "h" : "t") + Math.random().toString(36).slice(2, 7);
  const defs = `<defs>
    <radialGradient id="br${u}" cx="36%" cy="30%" r="78%"><stop offset="0" stop-color="#c9a56e"/><stop offset=".45" stop-color="#8e6a3c"/><stop offset=".85" stop-color="#5a4024"/><stop offset="1" stop-color="#34240f"/></radialGradient>
    <filter id="pat${u}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="3" seed="${heads ? 3 : 8}"/><feColorMatrix values="0 0 0 0 .30  0 0 0 0 .46  0 0 0 0 .38  0 0 0 2.6 -1.35"/><feComposite in2="SourceGraphic" operator="in"/></filter>
    <filter id="grit${u}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="5"/><feColorMatrix values="0 0 0 0 .2  0 0 0 0 .14  0 0 0 0 .06  0 0 0 1.6 -.7"/><feComposite in2="SourceGraphic" operator="in"/></filter>
    <filter id="emb${u}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur in="SourceAlpha" stdDeviation="1.1" result="b"/>
      <feSpecularLighting in="b" surfaceScale="3.2" specularConstant="1" specularExponent="16" lighting-color="#fff2cc" result="s"><feDistantLight azimuth="225" elevation="42"/></feSpecularLighting>
      <feComposite in="s" in2="SourceAlpha" operator="in" result="s2"/><feOffset in="SourceAlpha" dx="1.2" dy="1.6" result="o"/><feFlood flood-color="#3b2a12" flood-opacity=".55"/><feComposite in2="o" operator="in" result="sh"/>
      <feMerge><feMergeNode in="sh"/><feMergeNode in="SourceGraphic"/><feMergeNode in="s2"/></feMerge></filter>
    <mask id="hole${u}"><rect width="200" height="200" fill="#fff"/><rect x="80" y="80" width="40" height="40" fill="#000"/></mask></defs>`;
  const relief = heads
    ? `<g font-family="Noto Serif SC, Songti SC, serif" font-weight="600" font-size="36" text-anchor="middle" fill="#6a4e2c"><text x="100" y="66">旅</text><text x="100" y="164">途</text><text x="151" y="114">通</text><text x="49" y="114">宝</text></g>`
    : `<path d="M100 36a15 15 0 1 0 0 30a19 19 0 0 1 0-30z" fill="#6a4e2c" transform="translate(-8 0)"/><circle cx="100" cy="150" r="6" fill="#6a4e2c"/><g font-family="Noto Serif SC, serif" font-weight="700" font-size="24" fill="#6a4e2c" text-anchor="middle"><text x="152" y="108">闽</text><text x="48" y="108">行</text></g>`;
  return `<svg viewBox="0 0 200 200">${defs}<g mask="url(#hole${u})">
    <circle cx="100" cy="100" r="97" fill="url(#br${u})"/><circle cx="100" cy="100" r="97" filter="url(#pat${u})" opacity=".8"/><circle cx="100" cy="100" r="97" filter="url(#grit${u})" opacity=".5"/>
    <g filter="url(#emb${u})"><path d="M100 3a97 97 0 1 0 .1 0zM100 15a85 85 0 1 1-.1 0z" fill-rule="evenodd" fill="#8a6a3c"/><path d="M72 72h56v56H72zM80 80v40h40V80z" fill-rule="evenodd" fill="#8a6a3c"/>${relief}</g>
    <path d="M40 150l18-12M136 44l14-6M60 40l8 9" stroke="#fff4d6" stroke-width=".6" opacity=".35"/></g></svg>`;
}
const CMODES = [{ id:"yesno", label:"要不要", heads:"要", tails:"不要" }, { id:"lr", label:"左还是右", heads:"左", tails:"右" }, { id:"eat", label:"吃不吃", heads:"吃", tails:"不吃" }, { id:"enter", label:"进不进", heads:"进", tails:"不进" }];
let cmode = "yesno", ctossing = false, crest = 0, cpending = null, CDEC = S.decisions;
function openCoin(){ const R = O ? O.COIN_RULES : { heads:"要", tails:"不要" };
  page(`<div class="scr coinpage">${back("")}<div class="dk-title"><small>COIN OF THE ROAD</small><h2 style="font-family:var(--serif); font-style:normal; font-weight:600">旅途通宝</h2><p>拿不定主意，就交给这枚老铜钱。</p><p style="margin-top:4px; font-size:12px">有字的一面 = ${R.heads}<br>背面 = ${R.tails}</p></div>
    <div class="hs" style="justify-content:center">${CMODES.map(m => `<button class="chip ${m.id === cmode ? "on" : ""}" data-act="cmode:${m.id}">${m.label}</button>`).join("")}</div>
    <div class="coin-q"><label for="coinQ" style="position:absolute; left:-9999px">要决定的事</label><input id="coinQ" maxlength="40" placeholder="要决定什么？比如：要不要进这家店"></div>
    <div class="coin-stage" id="coinStage"><div class="coin-shadow" id="coinShadow"></div><div class="coin-tilt"><div class="coin3d" id="coin" role="button" tabindex="0" aria-label="抛铜钱" style="transform:rotateX(${crest}deg)">
      ${Array.from({ length: 18 }, (_, i) => `<div class="coin-edge" style="transform:translateZ(${-(i + 1) * .9}px);--l:${(i / 17).toFixed(2)}"></div>`).join("")}
      <div class="coin-face heads" style="transform:translateZ(0)">${coinFace(true)}<i class="coin-glint"></i></div><div class="coin-face tails">${coinFace(false)}<i class="coin-glint"></i></div></div></div></div>
    <div class="coin-hint" id="coinHint">点一下铜钱，或者按住它快速往上一甩</div><div class="coin-res" id="coinRes" aria-live="polite"></div>
    <div class="sec"><h2>大家最近的决定</h2><div class="card" style="padding:4px 16px">${CDEC.map(d => `<div class="li"><span class="dot-av" style="width:34px; height:34px; background:${d.r.includes("不") ? "#3A3F4A" : "#E8A864"}; color:${d.r.includes("不") ? "#F5F4F0" : "#1A120C"}; font-family:var(--serif)">${d.r}</span><span class="tx"><b>${d.q}</b><small>${d.who}</small></span></div>`).join("")}</div></div></div>`, "#0B0C10");
  const c = $("coin"); let fl = null; c.onpointerdown = e => { fl = { y: e.clientY, t: performance.now() }; c.setPointerCapture(e.pointerId); };
  c.onpointerup = e => { if(!fl) return; const dy = fl.y - e.clientY, dt = Math.max(1, performance.now() - fl.t); fl = null; toss(dy > 20 ? Math.min(1.6, .6 + dy / dt) : 1); };
  c.onkeydown = e => { if(e.key === "Enter" || e.key === " "){ e.preventDefault(); toss(1); } }; }
function toss(power = 1){ if(ctossing) return; ctossing = true; cpending = null; if(!$("coinRes")){ ctossing = false; return; } $("coinRes").innerHTML = ""; $("coinHint").textContent = "……"; snd("toss"); buzz(10);
  const res = Math.random() < .5 ? "heads" : "tails", c = $("coin"), sh = $("coinShadow"), turns = 5 + Math.round(power * 3), end = turns * 360 + (res === "tails" ? 180 : 0), h = Math.round(150 + power * 110), dur = 1300 + power * 380;
  const fin = () => { crest = res === "tails" ? 180 : 0; c.style.transform = `rotateX(${crest}deg)`; landed(res); };
  if(REDUCE){ c.animate([{ transform:"rotateX(0deg)" }, { transform:`rotateX(${360 + (res === "tails" ? 180 : 0)}deg)` }], { duration:700 }).finished.then(fin); return; }
  const spinZ = (Math.random() - .5) * 40;
  c.animate([{ transform:`translateY(0) rotateX(${crest}deg) rotateZ(0deg) scale(1)`, easing:"cubic-bezier(.15,.65,.35,1)" }, { transform:`translateY(-${h}px) rotateX(${crest + end * .55}deg) rotateZ(${spinZ}deg) scale(1.15)`, offset:.46, easing:"cubic-bezier(.6,0,.85,.4)" },
    { transform:`translateY(0) rotateX(${end}deg) rotateZ(${spinZ * .3}deg) scale(1)`, offset:.78 }, { transform:`translateY(-16px) rotateX(${end + 24}deg) rotateZ(0deg)`, offset:.84 }, { transform:`translateY(0) rotateX(${end - 14}deg)`, offset:.9 }, { transform:`translateY(-3px) rotateX(${end + 7}deg)`, offset:.95 }, { transform:`translateY(0) rotateX(${end}deg)` }],
    { duration:dur, fill:"forwards" }).finished.then(() => { c.getAnimations().forEach(a => a.cancel()); fin(); });
  sh.animate([{ transform:"scale(1)", opacity:1 }, { transform:"scale(.4)", opacity:.3, offset:.46 }, { transform:"scale(1)", opacity:1, offset:.78 }, { transform:"scale(.85)", offset:.84 }, { transform:"scale(1)" }], { duration:dur });
  setTimeout(() => snd("clink", 1), dur * .78); setTimeout(() => snd("settle"), dur * .84); }
function landed2(res, reversed){ ctossing = false; if(!$("coinRes")) return; buzz(res === "heads" ? [15, 30, 15] : [25]); const m = CMODES.find(x => x.id === cmode), label = res === "heads" ? m.heads : m.tails, q = ($("coinQ") || {}).value || ""; cpending = { res, q:q.trim(), label };
  $("coinRes").innerHTML = `<div class="cseal ${res === "heads" ? "h" : "t"}" id="coinSeal"><span>${label}</span><small>${res === "heads" ? "正" : "反"}</small></div><p class="res-txt" style="margin:0; font-size:15px">${q.trim() ? `「${q.trim()}」` : ""}${reversed ? "命运改写失控，结果被反转了！" : ""}铜钱说：<b>${label}</b></p>
    <div style="display:flex; gap:10px; width:100%"><button class="cbtn ghost" data-act="cagain">再抛一次</button><button class="cbtn" data-act="ckeep">就这么定了</button></div>`;
  setTimeout(() => { const s = $("coinSeal"); s && s.classList.add("on"); snd("stamp"); }, 150); $("coinHint").textContent = "满意就定下来，不满意就再抛";  showCoinRes(); }

/* ---------- 小动画 (original motion pieces) ---------- */
const MOTION_LOOK = { tea:["#E9D9B9","#8A5A2B"], qian:["#E8C7A8","#B3341E"], lantern:["#1F2A44","#F2B25C"], sparkler:["#141726","#FFD58A"], melon:["#8fd6cc","#e95d5d"], rain:["#d9d2bf","#1f3f98"], puffs:["#E6E1F2","#7C6CC4"], stars:["#0F1733","#F6E7A6"] };
const MOTION_ICON = { tea:'<path d="M12 30h30v6a12 12 0 0 1-12 12h-6a12 12 0 0 1-12-12Z"/><path d="M42 32h4a5 5 0 0 1 0 10h-5"/><path d="M22 22c0-4 4-4 4-8M30 22c0-4 4-4 4-8"/>', qian:'<rect x="16" y="18" width="24" height="32" rx="3"/><path d="M22 18V8M28 18V5M34 18V9"/>', lantern:'<ellipse cx="28" cy="30" rx="14" ry="16"/><path d="M22 14h12M22 46h12M28 46v8"/>', sparkler:'<path d="M14 46 38 18"/><path d="M40 10v6M46 16h-6M44 12l-4 4M36 14l2 2"/>', melon:'<path d="M8 22a20 20 0 0 0 40 0Z"/><path d="M12 22a16 16 0 0 0 32 0"/><circle cx="22" cy="30" r="1.5"/><circle cx="30" cy="33" r="1.5"/><circle cx="36" cy="28" r="1.5"/>', rain:'<path d="M14 26a8 8 0 0 1 8-8 10 10 0 0 1 19 3 6 6 0 0 1 0 12H18a6 6 0 0 1-4-7Z"/><path d="M20 40l-3 6M28 40l-3 6M36 40l-3 6"/>', puffs:'<circle cx="20" cy="30" r="8"/><circle cx="34" cy="24" r="10"/><circle cx="36" cy="40" r="6"/>', stars:'<path d="M36 12a16 16 0 1 0 8 26 14 14 0 0 1-8-26Z"/><path d="M14 14v4M12 16h4M44 44v4M42 46h4"/>' };
function motionTiles(){ if(!O) return ""; const L = [...Object.entries(MY_PIECES).map(([k, p]) => [k, p.name, p.sub]), ...O.GAMES].filter(([k]) => !WEATHER_ONLY.includes(k)), left = WEATHER_ONLY.filter(k => !(S.found || []).includes(k)).length;
  return `<div class="sec" style="margin-top:22px"><h2>小动画<span>${left ? `还有 ${left} 个藏在首页的天气里` : `天气里的 ${WEATHER_ONLY.length} 个惊喜都找到了`}</span></h2></div><div class="motion-grid">${L.map(([k, n, s], idx) => { const [bg, fg] = (MY_PIECES[k] && MY_PIECES[k].tile) || MOTION_LOOK[k] || ["#E6E1D6","#1B1A18"], dark = ["lantern","sparkler","stars"].includes(k) || !!(MY_PIECES[k] && MY_PIECES[k].dark);
  return `<button class="mtile${idx === 0 && L.length % 2 ? " wide" : ""}" data-act="motion:${k}" style="background:${bg}; color:${dark ? "#F5F4F0" : "#1B1A18"}"><svg viewBox="0 0 56 56" fill="none" stroke="${fg}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${(MY_PIECES[k] && MY_PIECES[k].icon) || MOTION_ICON[k] || ""}</svg><b>${n}</b><small>${s}</small></button>`; }).join("")}</div>`; }
function weatherPiece(){ const wx = DAYCFG[S.day].wx; return /雨/.test(wx) ? "rain" : /雪/.test(wx) ? "stars" : /雾|云|阴/.test(wx) ? "puffs" : DAYCFG[S.day].temp >= 28 ? "melon" : "puffs"; }

/* ---------- actions (part 4) ---------- */
document.addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if(!b) return; const [a, x] = b.dataset.act.split(":");
  switch(a){
    case "dkactivate": activateCard(); break;
    case "dkseat": { const k = x, s = O.CARD[k]; snd("flip"); sheet(`<div class="my-card" style="display:flex; justify-content:center; padding:6px 0 12px">${cardHTML2(k, { cls:"hero powered" })}</div><h3>${k} · ${s.name}</h3><p class="sub">${s.myth} · 小林发动了</p><p style="font-size:14px; line-height:1.6">${s.effect}</p><p style="font-size:12px; color:#FFB08F">失控：${s.ooc}</p>`); break; }
    case "cmode": cmode = x; document.querySelectorAll('#ov-x [data-act^="cmode:"]').forEach(c => c.classList.toggle("on", c === b)); break;
    case "cagain": toss(1); break;
    case "ckeep": if(cpending){ CDEC.unshift({ q: cpending.q || "一个小决定", r: cpending.label, who:"你", at: TDATE() }); snd("success"); toast("决定已记下"); NOSTAG = true; openCoin(); } break;
    case "motion": playPiece(x === "auto" ? weatherPiece() : x); break;
  }
});
window.ORIG_STOP = () => {};

/* ===================== part 5: real skill effects, steps, shake, private list ===================== */
S.fx = { shift:0, cut:{}, added:[], banner:null, grey:false, reverse:false, free:false, lost:0, rewrite:false };
S.oocPending = null;
const NOWT = (() => { const d = new Date(); return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; })();
const addMin = (t, m) => { const [h, mm] = t.split(":").map(Number), x = h * 60 + mm + m; return `${pad(Math.floor(x / 60) % 24)}:${pad(x % 60)}`; };
function tripItems(di){ const base = DAYS[di].items; if(di !== TODAY) return base;
  const L = base.map((it, i) => { const o = { ...it, _i:i }; if(S.fx.shift && it.t > NOWT){ o._was = it.t; o.t = addMin(it.t, S.fx.shift); o._shift = true; } if(it.cut || S.fx.cut[i]) o._cut = it.cut || S.fx.cut[i]; return o; })
    .concat(S.fx.added.map(a => ({ ...a, _added:a.tag })));
  return L.sort((a, b) => a.t < b.t ? -1 : a.t > b.t ? 1 : 0); }
const OOC_LINE = { K:"月镜没被照亮。嫦娥把昨天最后一道光，留到了今天。", Q:"羲和的马车晚出发了——今天的太阳，会晚半小时升起。", J:"红线松了。今天的第一个决定，会被悄悄系反。", "10":"妈祖的灯没人接，今天她自己挑一个人掌舵。", "9":"风火轮没转起来，今天它要硬拉你们多去一个地方。", "8":"蝴蝶飞走了。梦里多出来的一站，今天要醒过来划掉。", "7":"箭没射出去。今天，会有一个太阳自己掉下来。", "6":"雷公的鼓还没停，雨要一直下到中午。", "5":"雪女在门外等了一夜，今天整天都在飘雪。", "4":"土地公记下了。今天他盖的章，只有灰色。", X:"无常路过，把昨天别人的一张牌，塞进了你的口袋。" };
const chipK = k => { const s = O.CARD[k]; return `<span class="k" style="background:linear-gradient(160deg, ${s.bg}, ${s.bg2}); color:${s.accent}">${k}</span>`; };
function setBanner(k, title, sub, until = 0, calm = false){ S.fx.banner = { k, title, sub, until, calm }; if(until) cdStart(); }
function fxBanner(){ const b = S.fx.banner; if(!b || !O) return ""; if(b.until && b.until < Date.now()){ S.fx.banner = null; return ""; }
  return `<div class="fxb ${b.calm ? "calm" : ""}" role="status">${chipK(b.k)}<span><b>${b.title}</b><small>${b.sub}</small></span>${b.until ? `<span class="cd" data-until="${b.until}"></span>` : ""}</div>`; }
let cdT = 0; function cdStart(){ if(!cdT) cdT = setInterval(cdTick, 1000); }
function cdTick(){ const all = document.querySelectorAll(".fxb .cd"); if(!all.length && !(S.fx.banner && S.fx.banner.until)){ clearInterval(cdT); cdT = 0; return; } all.forEach(c => { const ms = +c.dataset.until - Date.now(); if(ms <= 0){ c.closest(".fxb").remove(); S.fx.banner = null; return; } c.textContent = `${pad(Math.floor(ms / 60000))}:${pad(Math.floor(ms / 1000) % 60)}`; }); }
function oocTile(){ const k = S.oocPending; if(!k || !O) return ""; const s = O.CARD[k];
  return `<button class="ooct" data-act="ooc:${k}">${cardHTML2(k, { cls:"mini" })}<span><b>昨天的 ${k} · ${s.name} 没有发动</b><small>它今天失控了，点开看看会发生什么</small></span>${I("chev",18)}</button>`; }
function goTrip(){ closeOv(); closeSheet(); S.tab = "trip"; S.tday = TODAY; render(); setTimeout(() => { const tl = $("view").querySelector(".tl"); tl && $("view").scrollTo({ top: tl.offsetTop - 140, behavior: "smooth" }); }, 250); }
function goHome(){ closeOv(); closeSheet(); S.tab = "home"; render(); }
function eligible(){ return DAYS[TODAY].items.map((it, i) => ({ it, i })).filter(({ it, i }) => it.kind !== "transit" && !it.main && !S.fx.cut[i] && !it.cut && it.kind !== "lodging"); }
function shootRow(i, tag, done){ const row = $("view").querySelector(`.tl .row[data-i="${i}"]`), app = $("app");
  const finish = () => { S.fx.cut[i] = tag; const it0 = DAYS[TODAY].items[i]; if(it0){ it0.cut = tag; it0.cutBy = S.me || "我"; } if(typeof tripBack === "function") tripBack(); NOSTAG = true; render(); done && done(); };
  if(!row || REDUCE) return finish(); vcenter(row);
  setTimeout(() => { const a = app.getBoundingClientRect(), r = row.getBoundingClientRect(), y = r.top - a.top + r.height / 2, el = document.createElement("span"); el.className = "arrow-fly"; app.appendChild(el); snd("toss");
    el.animate([{ transform:`translate(-140px, ${y - 60}px) rotate(12deg)` }, { transform:`translate(${r.left - a.left + r.width * .45}px, ${y}px) rotate(0deg)` }], { duration:420, easing:"cubic-bezier(.3,0,.2,1)" }).onfinish = () => {
      el.remove(); snd("tear"); buzz([30, 20, 50]); row.classList.add("shot", "cut"); setTimeout(finish, 520); }; }, 420); }
function cutPick(tag, k, title, sub){ const L = eligible(); if(!L.length) return toast("今天没有可以动的安排了");
  sheet(`<h3>${title}</h3><p class="sub">${sub}：选一项</p>${L.map(({ it, i }) => `<button class="li" data-act="cutgo:${i}" data-tag="${tag}" data-k="${k}" data-title="${title}" style="width:100%; background:none; border-left:0; border-right:0; border-bottom:0; text-align:left"><span style="width:44px; font-size:13px; color:var(--mu)">${it.t}</span><span class="tx"><b>${it.title}</b></span>${I("chev",16)}</button>`).join("")}`); }
function shootRandom(k, title){ const L = eligible(); if(!L.length) return; const { it, i } = L[Math.floor(Math.random() * L.length)]; setBanner(k, title, `后羿射掉了「${it.title}」`); goTrip(); setTimeout(() => shootRow(i, "被射掉了"), 450); }
const EXTRA_PLACES = [];
function addPlace(tag, k, title, sub){ if(!EXTRA_PLACES.length) return toast("这个城市没有多余的候补地点"); sheet(`<h3>${title}</h3><p class="sub">${sub}：选一个加进今天</p>${EXTRA_PLACES.map(([n, d], j) => `<button class="li" data-act="addgo:${j}" data-tag="${tag}" data-k="${k}" data-title="${title}" style="width:100%; background:none; border-left:0; border-right:0; border-bottom:0; text-align:left"><span class="tx"><b>${n}</b><small>${d}</small></span>${I("plus",18)}</button>`).join("")}`); }
function skipNow(){ const L = DAYS[TODAY].items.map((it, i) => ({ it, i })).filter(({ it, i }) => it.kind !== "transit" && it.t <= NOWT && !S.fx.cut[i]); const cur = L[L.length - 1];
  if(!cur) return; setBanner("9", "传送门", `跳过了「${cur.it.title}」，直接去下一站`, 0, true); goTrip(); setTimeout(() => shootRow(cur.i, "传送门跳过"), 450); }
function pickPerson(cb){ sheet(`<h3>谁来掌舵？</h3><p class="sub">妈祖在挑人……</p><div class="picker">${FRIENDS.map(([n, c]) => `<span style="background:${c}">${n}</span>`).join("")}</div><p id="pickres" style="text-align:center; font-size:15px; min-height:24px"></p>`);
  const sp = $("sheet").querySelectorAll(".picker span"), N = FRIENDS.length, win = Math.floor(Math.random() * N), steps = 14 + win; let i = 0;
  const tick = () => { if(!$("pickres")) return; sp.forEach((s, k) => s.classList.toggle("on", k === i % N)); snd("tap"); buzz(4); if(i >= steps){ const name = NAMES[win]; $("pickres").textContent = `${name} 被选中了`; snd("reveal"); buzz([10, 40, 20]); setTimeout(() => { closeSheet(); cb(name); goHome(); }, 1100); return; } i++; setTimeout(tick, 60 + i * i * 1.6); }; tick(); }
function copyPick(){ const L = O.SKILLS.filter(s => s.key !== "K" && s.key !== "X"); sheet(`<h3>镜界 · 复制一张</h3><p class="sub">选一张技能，马上用它的效果（只能复制 1 次）</p>${L.map(s => `<button class="li" data-act="copygo:${s.key}" style="width:100%; background:none; border-left:0; border-right:0; border-bottom:0; text-align:left">${chipK(s.key).replace('class="k"', 'class="k" style="width:30px; height:42px; border-radius:5px; display:grid; place-items:center; font-family:var(--serif); background:linear-gradient(160deg,' + s.bg + ',' + s.bg2 + '); color:' + s.accent + '"')}<span class="tx"><b>${s.key} · ${s.name}</b><small>${s.effect}</small></span></button>`).join("")}`); }
const OOC_FX = {
  Q: () => { S.fx.shift += 30; setBanner("Q", "时间暂停 · 失控", "今天之后的安排全部晚 30 分钟"); goTrip(); },
  J: () => { S.fx.reverse = true; setBanner("J", "命运改写 · 失控", "今天第一个决定会自动反转，去抛一次铜钱试试"); openCoin(); },
  "10": () => pickPerson(n => setBanner("10", "主角光环 · 失控", `${n} 拿到今天第一站的决定权`)),
  "9": () => addPlace("传送门加的", "9", "传送门 · 失控", "今天必须多去一个计划外的地方"),
  "8": () => cutPick("梦里划掉了", "8", "虚假世界 · 失控", "今天必须删掉一个原本计划的地点"),
  "7": () => shootRandom("7", "射日 · 失控"),
  "6": () => { startAtmos("rain"); setBanner("6", "催雨 · 失控", "雨会一直下到中午"); goHome(); },
  "5": () => { startAtmos("snow"); setBanner("5", "落雪 · 失控", "今天整天都在飘雪"); goHome(); },
  "4": () => { S.fx.grey = true; document.body.classList.add("fx-grey"); setBanner("4", "借路 · 失控", "今天的章都是灰的，按住一枚两秒就能找回颜色"); closeOv(); S.tab = "book"; S.seg = "stamps"; S.archOpen = true; render(); },
  K: () => OOC_FX.Q(), X: () => OOC_FX["9"]()
};
const ACT_FX = {
  "7": () => cutPick("射日射掉了", "7", "射日", "从今天的行程里射掉一项，不用商量"),
  "9": () => skipNow(),
  Q: () => { S.fx.shift += 60; setBanner("Q", "时间暂停", "接下来的安排都往后推 1 小时", 0, true); goTrip(); },
  "8": () => { S.fx.lost = Date.now() + 3600e3; setBanner("8", "虚假世界", "1 小时内迷失在这一片，地图和导航都关掉了", S.fx.lost, true); goTrip(); },
  "10": () => pickPerson(n => setBanner("10", "主角光环", `接下来 30 分钟由 ${n} 带大家逛`, Date.now() + 1800e3, true)),
  J: () => { S.fx.rewrite = true; setBanner("J", "命运改写", "可以把一个决定重新抛一次", 0, true); openCoin(); },
  K: () => copyPick(),
  X: () => { const ks = ["7", "9", "Q", "10"], k = ks[Math.floor(Math.random() * ks.length)]; toast(`无常复制了 ${k} · ${O.CARD[k].name}`); setTimeout(() => ACT_FX[k](), 700); },
  "4": () => { S.fx.free = true; setBanner("4", "借路", "下一次打卡不用拍照，也不用等旅伴确认", 0, true); },
  "6": () => setBanner("6", "催雨", "今天全房间下雨", 0, true), "5": () => setBanner("5", "落雪", "今天全房间下雪", 0, true)
};
function activateCard(){ const k = DK.card, s = O.CARD[k], c = document.querySelector("#myCard .tc"); snd("activate"); try{ O.cardFx && O.cardFx(k); }catch(e){} buzz([10, 30, 10]);
  if(c){ c.classList.remove("casting"); void c.offsetWidth; c.classList.add("casting"); setTimeout(() => { c.classList.remove("casting"); c.classList.add("st-done"); }, 1300); }
  DK.used = true; setTimeout(() => { const da = $("dkAct"); if(da){ da.innerHTML = deckActHTML(); stagger(da.children); } }, 700);
  if(k === "6") startAtmos("rain"); else if(k === "5") startAtmos("snow");
  toast(`${s.key} · ${s.name} 发动了`); setTimeout(() => (ACT_FX[k] || (() => confetti()))(), 1400); }
function openOoc(k){ const s = O.CARD[k], line = OOC_LINE[k] || "", txt = (s.ooc || "").replace(/明天/g, "今天");
  page(`<div class="scr" style="background:radial-gradient(100% 55% at 50% 22%, rgba(179,52,30,.28), #0B0C10 72%)">${back("")}
    <div class="dk-title"><small>OUT OF CONTROL · 失控</small><h2 style="font-family:var(--serif); font-style:normal; font-weight:600; font-size:30px">昨天的牌没有发动</h2><p>${s.myth} 今天来讨了</p></div>
    <div class="ooc-stage"><div class="ooc-card my-card">${cardHTML2(k, { cls:"hero powered" })}<svg class="ooc-crack" viewBox="0 0 100 148" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M58 0L50 34L62 52L44 80L56 104L46 148M50 34L30 44M62 52L84 60M44 80L20 92M56 104L78 120" fill="none" stroke="#fff" stroke-width="1.1" stroke-linejoin="bevel"/></svg><span class="ooc-seal">失控</span></div></div>
    <p class="ooc-line" id="oocl" aria-live="polite"></p>
    <div class="dk-note" style="margin-top:8px"><b>今天会发生</b><p>${txt}</p></div>
    <div style="padding:16px 20px 0"><button class="cbtn" data-act="oocgo:${k}" style="background:#EE6A3C; color:#fff">接受失控，看看会怎样</button></div>
    <div class="sec"><h2>换一张看看失控<span>演示</span></h2><div class="pick">${Object.keys(OOC_FX).filter(x => O.CARD[x]).map(x => `<button class="chip ${x === k ? "on" : ""}" data-act="ooc:${x}">${x} · ${O.CARD[x].name}</button>`).join("")}</div></div></div>`, "#0B0C10");
  const tc = document.querySelector("#ov-x .ooc-card .tc"); tc && setTimeout(() => tc.classList.add("shake"), 50);
  setTimeout(() => { snd("chaos"); buzz([40, 30, 40]); }, 700); setTimeout(() => { snd("stamp"); buzz(25); }, 1550);
  const el = $("oocl"); let i = 0; const ty = setInterval(() => { if(!el.isConnected) return clearInterval(ty); el.textContent = line.slice(0, ++i); if(i % 3 === 0) snd("tap"); if(i >= line.length) clearInterval(ty); }, 70); }
/* coin: J 失控 flips the first decision by itself */
function landed(res){ const c = $("coin"); if(!c) return; if(S.fx.reverse){ S.fx.reverse = false; ctossing = true; setTimeout(() => { snd("chaos"); buzz([40, 30, 40]); c.classList.add("glitch");
    c.animate([{ transform:`rotateX(${crest}deg)` }, { transform:`translateY(-40px) rotateX(${crest + 90}deg)` }, { transform:`rotateX(${crest + 180}deg)` }], { duration:650, easing:"cubic-bezier(.3,1.4,.5,1)" }).finished.then(() => {
      c.classList.remove("glitch"); crest = (crest + 180) % 360; c.style.transform = `rotateX(${crest}deg)`; S.fx.banner = null; landed2(res === "heads" ? "tails" : "heads", true); }); }, 500); return; }
  landed2(res, false); }
/* check-in: 借路 skips the photo and the wait */
function openCheckin(){ if(S.fx.free){ S.fx.free = false; S.fx.banner = null; CK.step = "ok"; CK.pic = 0; renderCheckin(); toast("借路：这次不用拍照，也不用等确认"); snd("stamp"); buzz([10, 50, 30]); return; } CK.step = "pick"; CK.pic = -1; renderCheckin(); }
/* grey stamps: hold one to bring its colour back */
(function relight(){ let t = null, el = null, ring = null, suppress = false;
  document.addEventListener("pointerdown", e => { if(!document.body.classList.contains("fx-grey")) return; el = e.target.closest(".stp, .mini-st"); if(!el || el.classList.contains("lit")) return el = null;
    ring = document.createElement("span"); ring.className = "relight"; el.style.position = el.style.position || ""; el.appendChild(ring); snd("charge", .3);
    t = setTimeout(() => { el.classList.add("lit"); ring.remove(); ring = null; suppress = true; snd("reveal"); buzz([10, 40, 20]); toast("找回颜色了"); const r = el.getBoundingClientRect(); if(!REDUCE) confetti(); el = null; }, 1600); });
  const cancel = () => { clearTimeout(t); ring && ring.remove(); ring = null; el = null; };
  document.addEventListener("pointerup", cancel); document.addEventListener("pointercancel", cancel);
  document.addEventListener("click", e => { if(suppress){ suppress = false; e.stopPropagation(); e.preventDefault(); } }, true); })();
/* steps: the phone's motion sensor while the app is open */

function onMotion(cb){ let got = false; const h = e => { const a = e.accelerationIncludingGravity || e.acceleration; if(!a || a.x == null) return; got = true; cb(a); }; addEventListener("devicemotion", h); return { stop(){ removeEventListener("devicemotion", h); }, got:() => got }; }

 S.stepCount = 6400;
const stepTxt = v => v >= 1000 ? (v / 1000).toFixed(1) + "K" : String(v);

/* dice you can throw yourself: fling the die or shake the phone */
let shakeH = null;
window.ORIG_STOP = () => { if(shakeH){ shakeH.stop(); shakeH = null; } };
function rollNow(power = 1){ const w = $("dwrap"); if(!w) return; rollDice(); w.classList.remove("roll"); void w.offsetWidth; w.classList.add("roll"); snd("shuffle"); }
function enhanceDice(){ const sc = document.querySelector("#ov-x .dscene"), cube = $("cube"); if(!sc || !cube) return;
  let f = null; cube.style.cursor = "grab"; cube.style.touchAction = "none";
  cube.onpointerdown = e => { f = { x: e.clientX, y: e.clientY, t: performance.now() }; cube.setPointerCapture(e.pointerId); };
  cube.onpointerup = e => { if(!f) return; const d = Math.hypot(e.clientX - f.x, e.clientY - f.y), dt = Math.max(1, performance.now() - f.t); f = null; rollNow(Math.min(1.8, .8 + d / dt)); };
  const btn = document.querySelector('#ov-x [data-act="droll"]'); if(btn && !document.querySelector('#ov-x [data-act="dshake"]')){ btn.insertAdjacentHTML("afterend", `<button class="cbtn ghost" data-act="dshake" style="margin-top:10px">${shakeH ? "摇手机：开着" : "摇一摇手机来掷"}</button>`); }
  const hint = document.querySelector("#ov-x .dres small"); hint && (hint.textContent += " · 也可以直接甩一下骰子");  setTimeout(() => { const sb = document.querySelector('#ov-x [data-act="dshake"]'); sb && sb.remove(); }, 0); }

function qianShakeTap(){ const cv = document.querySelector(".mo canvas"); if(!cv){ if(shakeH){ shakeH.stop(); shakeH = null; } return; } const r = cv.getBoundingClientRect(), o = { clientX: r.left + r.width / 2, clientY: r.top + r.height * .6, bubbles:true };
  cv.dispatchEvent(new PointerEvent("pointerdown", o)); cv.dispatchEvent(new PointerEvent("pointerup", o)); buzz(12); }
function playPiece(k){ if(MY_PIECES[k]) return playMine(k); if(!O) return toast("动画没有加载出来"); try{ O.playMotion(k, { temp: DAYCFG[S.day].temp }); }catch(e){ return toast("这段动画暂时放不了"); }
  setTimeout(() => { const sb = document.querySelector(".mo .shakebtn"); sb && sb.remove(); }, 80); }
/* private packing list: add your own things */
function packAdd(){ const inp = $("packin"), t = inp && inp.value.trim(); if(!t) return; let g = CHECK.findIndex(c => c.cat === "我自己加的"); if(g < 0){ CHECK.push({ cat:"我自己加的", items:[] }); g = CHECK.length - 1; }
  CHECK[g].items.push(t); PACK_TOTAL++; const sc = $("ov-pack").querySelector(".scr").scrollTop; renderPack(); $("ov-pack").querySelector(".scr").scrollTop = sc + 60; toast(`加进清单了 · ${t}`); snd("click"); }

document.addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if(!b) return; const [a, x] = b.dataset.act.split(":");
  switch(a){
    case "ooc": openOoc(x); break;
    case "oocdemo": openOoc(["7","8","9","6","4","J","10","Q"][Math.floor(Math.random() * 8)]); break;
    case "oocgo": S.oocPending = null; snd("chaos"); (OOC_FX[x] || OOC_FX.Q)(); break;
    case "cutgo": { const i = +x, tag = b.dataset.tag, k = b.dataset.k, title = b.dataset.title; setBanner(k, title, `「${DAYS[TODAY].items[i].title}」${tag}`, 0, !title.includes("失控")); goTrip(); setTimeout(() => shootRow(i, tag), 450); break; }
    case "addgo": { const [n] = EXTRA_PLACES[+x], tag = b.dataset.tag; S.fx.added.push({ t:"16:10", title:n, kind:"sight", dur:60, tag }); setBanner(b.dataset.k, b.dataset.title, `今天多了一站：${n}`, 0, !b.dataset.title.includes("失控")); goTrip(); snd("reveal"); setTimeout(() => { const r = [...$("view").querySelectorAll(".tl .row.added")].pop(); r && (vcenter(r), r.animate([{ scale:.9, opacity:0 }, { scale:1.03, opacity:1, offset:.6 }, { scale:1, opacity:1 }], { duration:600, easing:"cubic-bezier(.2,1.4,.4,1)" })); }, 500); break; }
    case "copygo": closeSheet(); toast(`镜界复制了 ${x} · ${O.CARD[x].name}`); setTimeout(() => (ACT_FX[x] || (() => {}))(), 500); break;
    
    
    
    
    
    case "packadd": packAdd(); break;
    
  }
});
document.addEventListener("keydown", e => { if(e.key === "Enter" && e.target.closest && e.target.closest("#packin")) packAdd(); });

/* ===================== part 6: bookshelf you can decorate + countdowns, identity code ===================== */
const BCOL = [["gold","金黄","#e8c86a","#b8902e"],["rose","玫红","#e46a9e","#b23f74"],["ink","墨黑","#3a3632","#141210"],["moss","墨绿","#5c7a55","#2f3a2e"],["sky","天青","#6f9cc4","#3f6a92"],["plum","紫藤","#9a7ec0","#5e417e"],["sand","米沙","#d9c9a8","#a8906a"],["clay","赭土","#d08a6a","#9a5436"]];
const BPAT = [["plain","素面"],["tape","纸胶带"],["stripe","条纹"],["dot","圆点"],["grid","方格"]];
const CHARM = { none:"", star:'<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.6 6.7 19.4l1.2-6L3.4 9.3l6-.7Z"/>', moon:'<path d="M15 3.5a8.5 8.5 0 1 0 5.5 14 7 7 0 0 1-5.5-14Z"/>', leaf:'<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14Z"/><path d="M5 19 13 11"/>', boat:'<path d="M3 15h18l-3 5H6Z"/><path d="M12 15V4l6 9h-6"/>', pagoda:'<path d="M6 9h12l-2-3H8ZM7 14h10l-2-3H9ZM8 19h8l-1-3H9Z"/><path d="M12 6V3"/>', heart:'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>' };
const CHARM_N = { none:"不要", star:"星星", moon:"月亮", leaf:"叶子", boat:"帆船", pagoda:"小塔", heart:"爱心" };
const charmSVG = k => CHARM[k] ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${CHARM[k]}</svg>` : "";
const BOOKS2 = [];
const TODAY_ISO = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; })();
const dayDiff = (a, b) => Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 864e5);
function bstatus(b){ if(b.look.arch) return { k:"arch", t:"已归档" }; const n = dayDiff(TODAY_ISO, b.start), len = dayDiff(b.start, b.end) + 1;
  if(n > 0) return { k:"soon", n, t:`还有 ${n} 天出发`, badge:`${n}天` }; if(TODAY_ISO > b.end) return { k:"done", t:`已完成 · ${len} 天`, badge:"✓", len };
  const d = dayDiff(b.start, TODAY_ISO) + 1; return { k:"now", d, len, t:`第 ${d} 天 / ${len}`, badge:`D${d}` }; }
function bookOrder(){ const rank = b => b.look.pin ? 0 : ({ now:1, soon:2, done:3, arch:4 })[bstatus(b).k]; return BOOKS2.map((b, i) => [b, i]).sort((x, y) => rank(x[0]) - rank(y[0]) || y[0].start.localeCompare(x[0].start)); }
const colOf = k => BCOL.find(c => c[0] === k) || BCOL[0];

function countBlock(b){ const s = bstatus(b);
  if(s.k === "soon") return `<small class="k">出发倒数</small><div class="cdown"><b class="cu">${s.n}</b><span>天</span></div><div class="hms" id="hms"></div><div class="bstats">${Number(b.start.slice(5, 7))} 月 ${Number(b.start.slice(8))} 日出发 · ${dayDiff(b.start, b.end) + 1} 天<br>${b.st}</div>`;
  if(s.k === "now"){ const C = 2 * Math.PI * 38, p = s.d / s.len; return `<small class="k">正在旅行</small><div class="cring"><svg viewBox="0 0 86 86"><circle cx="43" cy="43" r="38" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="6"/><circle cx="43" cy="43" r="38" fill="none" stroke="#EE6A3C" stroke-width="6" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C}" data-ring="${C * (1 - p)}" style="transition:stroke-dashoffset 1.2s cubic-bezier(.3,.9,.3,1)"/></svg><span class="c"><b>${s.d}</b><small>/ ${s.len} 天</small></span></div><div class="bstats">还剩 ${s.len - s.d} 天 · ${b.st}</div>`; }
  return `<small class="k">${s.t}</small><div class="bstats" style="margin-top:6px">${b.start.replace(/-/g, ".")} — ${b.end.slice(5).replace("-", ".")}<br>${b.st}</div>`; }

let hmsT = 0;
function afterShelf(){ const d = $("bdetail"); if(!d) return; d.querySelectorAll(".cu").forEach(countUp); const r = d.querySelector("[data-ring]"); if(r) requestAnimationFrame(() => requestAnimationFrame(() => r.setAttribute("stroke-dashoffset", r.dataset.ring)));
  clearInterval(hmsT); const b = BOOKS2[shelfSel]; if(bstatus(b).k === "soon"){ const tick = () => { const el = $("hms"); if(!el) return clearInterval(hmsT); const now = new Date(), end = new Date(now); end.setHours(24, 0, 0, 0); const ms = end - now; el.textContent = `再过 ${pad(Math.floor(ms / 3600e3))}:${pad(Math.floor(ms / 6e4) % 60)}:${pad(Math.floor(ms / 1000) % 60)} 就少一天`; }; tick(); hmsT = setInterval(tick, 1000); } }

/* decorate */
let DI = 0;
function decoSheet(i){ DI = i; const b = BOOKS2[i], L = b.look;
  sheet(`<h3>装饰这一本</h3><p class="sub">${b.t} · 只改这一本的封面和书脊</p><div class="decoprev" id="decoprev">${coverHTML(b, true)}</div>
    ${b.cur ? `<button class="li" data-act="dates" style="width:100%; background:none; border-left:0; border-right:0; border-top:0; text-align:left"><span class="tx"><b>旅行日期</b><small>${TRIP.rangeCN} · ${DAYS.length} 天 · 点这里改</small></span>${I("chev",16)}</button>` : ""}<div class="lbl">书名</div><label for="dname" style="position:absolute; left:-9999px">书名</label><input class="dinput" id="dname" value="${b.t}" maxlength="6" style="margin-top:8px">
    <div class="lbl">颜色</div><div class="swatches">${BCOL.map(([k, n, a, bb]) => `<button data-act="dcol:${k}" aria-label="${n}" aria-pressed="${L.c === k}" style="background:linear-gradient(135deg,${a},${bb})"></button>`).join("")}</div>
    <div class="lbl">花纹</div><div class="pick">${BPAT.map(([k, n]) => `<button class="chip ${L.p === k ? "on" : ""}" data-act="dpat:${k}">${n}</button>`).join("")}</div>
    <div class="lbl">小挂饰</div><div class="charms">${Object.keys(CHARM).map(k => `<button data-act="dchm:${k}" aria-pressed="${L.m === k}" aria-label="${CHARM_N[k]}">${k === "none" ? `<span style="font-size:11px; color:var(--mu)">不要</span>` : charmSVG(k)}</button>`).join("")}</div>
    <div class="lbl">封面照片</div><div class="smpics">${ALBUM.slice(0, 8).map((a, ai) => `<button data-act="coverpick:${i}:${ai}" aria-pressed="${b.cover === a[0]}" aria-label="用这张"><img src="${a[0]}" alt=""></button>`).join("")}<label class="up" style="flex-shrink:0; width:64px; height:64px; border-radius:14px; display:grid; place-items:center; cursor:pointer">${I("plus",20)}<input type="file" accept="image/*" id="coverfile" style="position:absolute; width:1px; height:1px; opacity:0"></label></div>
    <div class="li"><span class="tx"><b>书签丝带</b></span><button class="sw" role="switch" aria-label="书签丝带" aria-checked="${L.rib}" data-act="dtog:rib"></button></div>
    <div class="li"><span class="tx"><b>放在最前面</b><small>不管状态，一直排第一</small></span><button class="sw" role="switch" aria-label="置顶" aria-checked="${L.pin}" data-act="dtog:pin"></button></div>
    <div class="li"><span class="tx"><b>归档</b><small>放到最后，随时还能打开看</small></span><button class="sw" role="switch" aria-label="归档" aria-checked="${L.arch}" data-act="dtog:arch"></button></div>
    <div style="margin-top:14px"><button class="cbtn" data-act="ddone2">好了</button></div>`); }
function decoRefresh(){ const b = BOOKS2[DI], pv = $("decoprev"); if(pv){ pv.innerHTML = coverHTML(b, true); pv.firstElementChild.animate([{ scale:.94 }, { scale:1 }], { duration:300, easing:"cubic-bezier(.2,1.5,.4,1)" }); }
  const sc = document.querySelector("#ov-x .scr"), y = sc ? sc.scrollTop : 0; NOSTAG = true; openShelf(); const s2 = document.querySelector("#ov-x .scr"); s2 && (s2.scrollTop = y); snd("tap"); }
/* new trip */
const NT = { name:"", city:"东京", start:"2027-01-18", days:5, c:"rose" };

/* settings with identity code */
const SETS2 = SETS; let MYCODE = "K7Q2M9XA";
function openSettings(){ const sw = (k, t, s) => `<div class="li"><span class="tx"><b>${t}</b><small>${s}</small></span><button class="sw" role="switch" aria-checked="${SETS2[k]}" aria-label="${t}" data-act="sw:${k}"></button></div>`;
  sheet(`<h3>设置</h3><p class="sub">${S.me || "我"} · 这本手账只存在你和旅伴的手机里</p>
    <div class="card" style="padding:14px 16px; margin-bottom:6px"><small style="color:var(--mu); font-size:12px">我的身份码（8 位，只用来换手机时找回自己，不是房间号）</small><div class="idcode" id="idcode">${MYCODE.slice(0, 4)} ${MYCODE.slice(4)}</div>
      <small style="color:var(--mu); font-size:12px; line-height:1.5; display:block">换手机、删了 App 重装、清了浏览器数据，都会变成「新的人」。记下这个码，在新的那边输入，就能把自己找回来，所有打卡、照片、票根都在。</small>
      <div style="display:flex; gap:8px; margin-top:10px"><button class="chip on" data-act="idcopy">复制身份码</button></div>
      <div class="addrow"><label for="idin" style="position:absolute; left:-9999px">输入旧的身份码</label><input id="idin" placeholder="输入旧的身份码，找回自己" maxlength="9" autocapitalize="characters"><button class="chip" data-act="idback" style="height:46px">找回</button></div></div>
    ${sw("sound","音效","撕票、盖章、翻牌的声音")}${sw("haptic","震动","手机轻轻震一下")}${sw("paper","晚上 8 点的小报提醒","今天的报纸印好了就告诉你")}${sw("buddy","旅伴打卡时通知我","需要你确认的时候")}
    <div class="li"><span class="tx"><b>语言</b><small>切换后界面文字会全部换过来</small></span><span style="display:flex; gap:6px"><button class="chip on" data-act="soon">中文</button><button class="chip" data-act="soon">English</button></span></div>
    <div class="roomcard"><small style="color:var(--mu); font-size:12px">房间号（6 位，发给旅伴，他们输入就能进来）</small><div class="rc">${ROOM() || "还没有"}</div><div class="addrow"><input id="mjoinin" placeholder="加入别人的房间：输入 6 位房间号" maxlength="9" autocapitalize="characters"><button class="chip on" data-act="mjoin" style="height:46px; flex-shrink:0">加入</button></div></div><div class="li"><span class="tx"><b>邀请旅伴</b><small>把房间码发给朋友，他们就能加入这本手账</small></span><button class="chip" data-act="members">旅伴 · ${FRIENDS.length}</button></div>
    ${pushRowHTML()}<div class="li"><span class="tx"><b>我的名字</b><small>旅伴、护照和留言里显示的名字</small></span><button class="chip" data-act="namesheet">${S.me || "我"}</button></div><div class="li"><span class="tx"><b>我的头像</b><small>选一个可爱的，护照和旅伴里都会用</small></span><button data-act="avsheet:0" style="padding:0; border:0; background:none">${avHTML(0, 40)}</button></div><div class="li"><span class="tx"><b>货币与汇率</b><small>${TRIP.home} 记账 · 1 ${TRIP.dest} = ${RATE_CNY} ${TRIP.home}</small></span><button class="chip" data-act="currency">改</button></div>${syncRow()}<div class="li"><span class="tx"><b>安装到主屏幕</b><small>像 App 一样打开，没网也能看</small></span><button class="chip" data-act="install">安装</button></div><div class="li"><span class="tx"><b>清空这台手机的数据</b><small>删掉本机保存的一切，回到开始页（房间里别人的不受影响）</small></span><button class="chip" data-act="wipe" style="color:#FFB7A6">清空</button></div><div class="li"><span class="tx"><b>备份整趟手账</b><small>照片、票根和账本打包成一个文件，换手机时用</small></span><button class="chip" data-act="backup">备份</button></div><div class="li"><span class="tx"><b>从备份恢复</b><small>选之前存的备份文件</small></span><button class="chip" data-act="restore">恢复</button></div>`); }

document.addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if(!b) return; const [a, x] = b.dataset.act.split(":");
  switch(a){
    case "deco": decoSheet(+x); { setTimeout(() => { const s = $("sheet"); if(s && !s.querySelector('[data-act="bdel"]')) s.insertAdjacentHTML("beforeend", `<button class="cbtn holdbtn" data-act="bdel:${x}" style="margin-top:10px">删除这一本</button>`); }, 0); } break;
    case "dcol": BOOKS2[DI].look.c = x; document.querySelectorAll('#sheet [data-act^="dcol:"]').forEach(s => s.setAttribute("aria-pressed", s === b)); decoRefresh(); break;
    case "dpat": BOOKS2[DI].look.p = x; document.querySelectorAll('#sheet [data-act^="dpat:"]').forEach(s => s.classList.toggle("on", s === b)); decoRefresh(); break;
    case "dchm": BOOKS2[DI].look.m = x; document.querySelectorAll('#sheet [data-act^="dchm:"]').forEach(s => s.setAttribute("aria-pressed", s === b)); decoRefresh(); break;
    case "dtog": { const L = BOOKS2[DI].look; L[x] = !L[x]; b.setAttribute("aria-checked", L[x]); if(x === "arch" && L.arch) L.pin = false; decoRefresh(); break; }
    case "ddone2": closeSheet(); toast("封面换好了"); snd("success"); break;
    case "newtrip": closeSheet(); openStart(true); break;
    
    
    case "ntc": NT.c = x; document.querySelectorAll('#sheet [data-act^="ntc:"]').forEach(s => s.setAttribute("aria-pressed", s === b)); break;
    
    case "soonbook": if(!(BOOKS2[shelfSel] || {}).guide) toast("这一本还没有城市资料，先在行程里手动加"); { const bk = BOOKS2[shelfSel]; if(bk && bk.guide){ PD = 0; openPlan(shelfSel); } break; } break;
    case "idcopy": try{ navigator.clipboard && copyText(MYCODE); }catch(err){} toast("身份码已复制，记在备忘录里"); break;
    
    
  }
});

IC.zoom = '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2M11 8v6M8 11h6"/>';
/* ===================== part 7: photo viewer, stub maker with fonts, food ticket viewer, companions ===================== */
const NAMES = ["你"];
const PERSON_COL = ["#E2B77A","#9FB8D8","#B7C9A8","#E8A7B7","#C9B2E8","#F2C46A","#9BD0C8"];
const FONTS = [["sans","黑体",SYS_FONT()],["serif","宋体",'"Noto Serif SC","Songti SC",serif'],["hand","手写",'"Long Cang",cursive'],["brush","毛笔",'"Ma Shan Zheng","Kaiti SC",cursive']];
function SYS_FONT(){ return '-apple-system,BlinkMacSystemFont,"PingFang SC","Noto Sans SC",sans-serif'; }
const fontOf = k => (FONTS.find(f => f[0] === k) || FONTS[0])[2];
const srcOf = k => P[k] || k;
S.stubs = [];
/* ---------- photo viewer: swipe, pinch, double-tap to like, pull down to close ---------- */
let VW = null;
function albumList(){ return ALBUM.map(([k, a, n, cap], i) => ({ src: srcOf(k), cap, who: NAMES[a] || "旅伴", a, likes: n, i })); }
function openViewer(i, list){ closeViewer(true); list = list || albumList(); VW = { list, i, zoom:1, px:0, py:0 };
  const el = document.createElement("div"); el.className = "vw"; el.id = "vw"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "看照片");
  el.innerHTML = `<div class="vwtrack" id="vwtrack">${list.map(it => `<div class="vwslide"><img src="${it.src}" alt="${it.cap || ""}" draggable="false"></div>`).join("")}</div>
    <div class="vwtop"><button class="rbtn glass" data-act="vwclose" aria-label="关闭">${I("x",20,2)}</button><span id="vwn"></span><button class="rbtn glass" data-act="vwzoom" aria-label="放大">${I("zoom",18)}</button></div>
    <p class="vwhint" id="vwhint">左右滑换一张 · 双击点赞 · 双指放大 · 往下拉关掉</p><div class="vwbot" id="vwbot"></div>`;
  $("app").appendChild(el); requestAnimationFrame(() => el.classList.add("on")); vwGo(i, false); bindViewer(el); setTimeout(() => { const h = $("vwhint"); h && (h.style.opacity = 0); }, 2600); snd("paper"); }
function closeViewer(now){ const el = $("vw"); if(!el) return; if(now) return el.remove(); el.classList.remove("on"); setTimeout(() => el.remove(), 300); VW = null; }
function vwGo(i, anim = true){ if(!VW) return; VW.i = Math.max(0, Math.min(VW.list.length - 1, i)); VW.zoom = 1; VW.px = VW.py = 0; const tr = $("vwtrack"); tr.style.transition = anim ? "" : "none"; tr.style.transform = `translateX(${-VW.i * 100}%)`;
  tr.querySelectorAll("img").forEach(im => im.style.transform = ""); $("vwn").textContent = `${VW.i + 1} / ${VW.list.length}`; const it = VW.list[VW.i], lk = it.i != null && liked.has(it.i);
  $("vwbot").innerHTML = `<span class="dot-av" style="width:40px; height:40px; background:${(FRIENDS[it.a] || FRIENDS[0])[1]}">${(FRIENDS[it.a] || FRIENDS[0])[0]}</span><span class="tx"><b>${it.cap || "一张照片"}</b><small>${it.who} 拍的${it.meta ? " · " + it.meta : ""}</small></span>
    ${it.i != null ? `<button class="vwbtn ${lk ? "on" : ""}" data-act="vwlike" aria-pressed="${lk}">${I("heart",16,2)}${((ALBUM[it.i] || [])[5] || []).length}</button><button class="vwbtn" data-act="aopenc:${it.i}">${I("book",16)}${(CMTS[it.i] || []).length}</button>` : ""}`;  { const it = VW && VW.list[VW.i]; if(it && it.i != null){ const r = ALBUM[it.i]; const mine = !r || !r[6] || r[6] === MEID() || amOwner(); const bot = $("vwbot"); if(bot && mine && !bot.querySelector('[data-act="vwdel"]')) bot.insertAdjacentHTML("beforeend", `<button class="vwbtn" data-act="vwdel" aria-label="删掉这张照片">删掉</button>`); } } }
function bindViewer(el){ const pts = new Map(); let sx = 0, sy = 0, dx = 0, dy = 0, mode = null, d0 = 0, z0 = 1, lastTap = 0;
  const img = () => $("vwtrack").children[VW.i].querySelector("img"), apply = () => { img().style.transform = `translate(${VW.px}px, ${VW.py}px) scale(${VW.zoom})`; };
  el.addEventListener("pointerdown", e => { if(e.target.closest("button")) return; pts.set(e.pointerId, [e.clientX, e.clientY]); el.setPointerCapture(e.pointerId);
    if(pts.size === 2){ const [a, b] = [...pts.values()]; d0 = Math.hypot(a[0] - b[0], a[1] - b[1]); z0 = VW.zoom; mode = "pinch"; return; }
    sx = e.clientX; sy = e.clientY; dx = dy = 0; mode = null; const now = performance.now(); if(now - lastTap < 280){ mode = "dbl"; lastTap = 0; } else lastTap = now; });
  el.addEventListener("pointermove", e => { if(!pts.has(e.pointerId) || !VW) return; pts.set(e.pointerId, [e.clientX, e.clientY]);
    if(mode === "pinch" && pts.size === 2){ const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); VW.zoom = Math.max(1, Math.min(4, z0 * d / d0)); img().style.transition = "none"; apply(); return; }
    dx = e.clientX - sx; dy = e.clientY - sy; if(Math.abs(dx) + Math.abs(dy) < 6) return;
    if(VW.zoom > 1){ VW.px += e.movementX || 0; VW.py += e.movementY || 0; img().style.transition = "none"; apply(); return; }
    if(!mode || mode === "dbl") mode = Math.abs(dx) > Math.abs(dy) ? "swipe" : "down";
    const tr = $("vwtrack"); if(mode === "swipe"){ tr.style.transition = "none"; tr.style.transform = `translateX(calc(${-VW.i * 100}% + ${dx}px))`; }
    else if(mode === "down" && dy > 0){ tr.style.transition = "none"; tr.style.transform = `translateX(${-VW.i * 100}%) translateY(${dy}px) scale(${1 - dy / 1600})`; el.style.background = `rgba(0,0,0,${Math.max(.3, 1 - dy / 500)})`; } });
  const up = e => { if(!pts.has(e.pointerId)) return; pts.delete(e.pointerId); if(pts.size) return; if(!VW) return; const tr = $("vwtrack"); tr.style.transition = ""; img().style.transition = "";
    if(mode === "dbl"){ vwLike(true); return; }
    if(mode === "swipe"){ vwGo(VW.i + (dx < -60 ? 1 : dx > 60 ? -1 : 0)); if(Math.abs(dx) > 60) snd("paper"); }
    else if(mode === "down"){ if(dy > 130) closeViewer(); else { el.style.background = ""; vwGo(VW.i); } }
    else if(mode === "pinch" && VW.zoom < 1.05){ VW.zoom = 1; VW.px = VW.py = 0; apply(); } mode = null; };
  el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up); }
function vwLike(burstOnly){ const it = VW && VW.list[VW.i]; if(!it || it.i == null) return; if(!liked.has(it.i) || !burstOnly){ liked.has(it.i) && !burstOnly ? liked.delete(it.i) : liked.add(it.i); }
  const s = $("vwtrack").children[VW.i]; if(liked.has(it.i) && !REDUCE){ const b = document.createElement("span"); b.className = "burst"; b.innerHTML = `<svg viewBox="0 0 24 24" width="110" height="110"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" fill="#FF6B57"/></svg>`; b.style.position = "absolute"; s.style.position = "relative"; s.appendChild(b); setTimeout(() => b.remove(), 800); }
  buzz(8); snd("click"); vwGo(VW.i, false); }
/* ---------- make a photo stub: pick / upload a photo, write, choose a font ---------- */
const SM = { src:null, k:"tea", col:null, auto:"#2E4A3A", font:"hand", cap:"", layout:"h", en:"", zh:"" };
const SMCOL = ["#6A3A2E","#2E4A3A","#2A3566","#6B3524","#1F4B55","#4A3A6A","#2B2A28"];
function sampleColor(src){ return new Promise(res => { const im = new Image(); if(!/^(data:|blob:)/.test(src)) im.crossOrigin = "anonymous"; im.onload = () => { try{ const c = document.createElement("canvas"); c.width = 40; c.height = 50; const x = c.getContext("2d"); x.drawImage(im, 0, 0, 40, 50); const d = x.getImageData(0, 0, 40, 50).data; let r = 0, g = 0, b = 0, w = 0;
    for(let i = 0; i < d.length; i += 4){ const R = d[i] / 255, G = d[i+1] / 255, B = d[i+2] / 255, mx = Math.max(R, G, B), mn = Math.min(R, G, B), s = mx ? (mx - mn) / mx : 0, ww = s * (mx > .15 ? 1 : 0) + .02; r += R * ww; g += G * ww; b += B * ww; w += ww; }
    r /= w; g /= w; b /= w; let k = 1; const lum = () => .2126 * r * k + .7152 * g * k + .0722 * b * k; const m = (r + g + b) / 3; r = m + (r - m) * 1.4; g = m + (g - m) * 1.4; b = m + (b - m) * 1.4; while(lum() > .19 && k > .1) k *= .94;
    const h = v => Math.max(0, Math.min(255, Math.round(v * k * 255))).toString(16).padStart(2, "0"); res("#" + h(r) + h(g) + h(b)); }catch(e){ res("#2E4A3A"); } }; im.onerror = () => res("#2E4A3A"); im.src = src; }); }
function stubHTML(st, fresh){ const f = fontOf(st.font);
  if(st.layout === "v") return `<div class="vrow"><div class="vcard solo ${fresh ? "stub newone" : ""}" style="background:${st.col}"><div class="h"><small>TRAVEL MEMORY</small><b>${st.zh}</b><span><span>${st.en}</span><span>${st.date}${st.no ? " · " + st.no : ""}</span></span></div><div class="ph2"><img src="${st.src}" alt="${st.zh}">${st.cap ? `<span style="position:absolute; left:8px; bottom:8px; padding:5px 10px; border-radius:99px; background:rgba(10,12,16,.5); font-size:13px; font-family:${f}">${st.cap}</span>` : ""}</div></div></div>`;
  return `<div class="stub ${fresh ? "newone" : ""}"><div class="p"><img src="${st.src}" alt="${st.zh}">${st.cap ? `<span style="font-family:${f}; font-size:${st.font === "hand" || st.font === "brush" ? 17 : 13}px">${st.cap}</span>` : ""}</div><div class="s" style="background:${st.col}"><u aria-hidden="true">${st.en[0]}</u><div style="position:relative"><b style="font-size:${st.en.length > 7 ? 12 : 15}px">${st.en}</b><br><small>${st.date}</small></div><em style="position:relative">${st.no}</em></div><i class="perf"></i><i class="n1"></i><i class="n2"></i></div>`; }
function smCurrent(){ return { src: SM.src || P.tea, col: SM.col || SM.auto, font: SM.font, cap: SM.cap.trim(), layout: SM.layout, en: SM.en, zh: SM.zh, date: TDATE().slice(0, 7).replace("-", " · "), no: "No." + String(S.stubs.length + 1).padStart(3, "0") }; }
function smPreview(){ const p = $("smprev"); if(p) p.innerHTML = stubHTML(smCurrent()); }
async function smAuto(){ SM.auto = await sampleColor(SM.src || P.tea); if(!SM.col) smPreview(); const a = document.querySelector('#ov-x [data-act="smcol:auto"]'); a && (a.style.background = SM.auto); }
function openStubMaker(){ if(!SM.en){ SM.en = cityEn(DAYCFG[S.day].city); SM.zh = DAYCFG[S.day].place; } const pics = ALBUM.map(a => a[0]).slice(0, 8), sw = (v, lab, bg) => `<button data-act="smcol:${v}" aria-label="${lab}" aria-pressed="${(SM.col || "auto") === v}" style="background:${bg}"></button>`;
  page(`<div class="scr">${back("做一张票根")}<div class="smprev" id="smprev"></div>
    <div class="sec"><h2>照片<span>从相册选，或者上传一张</span></h2><div class="smpics">
      <label class="up" style="flex-shrink:0; width:64px; height:64px; border-radius:14px; background:rgba(255,255,255,.07); border:1.5px dashed rgba(255,255,255,.3); color:var(--mu); display:grid; place-items:center; font-size:11px; cursor:pointer">${I("plus",20)}<input type="file" accept="image/*" id="smfile" style="position:absolute; width:1px; height:1px; opacity:0" aria-label="上传照片"></label>
      ${pics.map((k, i) => `<button data-act="smpic:${i}" aria-pressed="${!SM.src && SM.k === k}" aria-label="选这张"><img src="${k}" alt=""></button>`).join("")}</div></div>
    <div class="sec"><h2>写一句</h2><label for="smcap" style="position:absolute; left:-9999px">写在票根上的一句话</label><input class="dinput" id="smcap" maxlength="16" placeholder="比如：山顶的雾一直没散" value="${SM.cap}">
      <div class="fontpick">${FONTS.map(([k, n, f]) => `<button data-act="smfont:${k}" aria-pressed="${SM.font === k}" style="font-family:${f}">${n}</button>`).join("")}</div></div>
    <div class="sec"><h2>颜色<span>默认从照片里取</span></h2><div class="swatches">${sw("auto", "从照片取色", SM.auto)}${SMCOL.map(c => sw(c, c, c)).join("")}</div></div>
    <div class="sec"><h2>版式和地点</h2><div class="pick">${[["h","横版"],["v","竖版"]].map(([k, n]) => `<button class="chip ${SM.layout === k ? "on" : ""}" data-act="smlay:${k}">${n}</button>`).join("")}<span style="width:10px"></span>${CITIES.map(c => [c.en.toUpperCase(), c.name]).map(([e, z]) => `<button class="chip ${SM.en === e ? "on" : ""}" data-act="smcity:${e}">${z}</button>`).join("")}</div>
      <label for="smzh" style="display:block; font-size:12px; color:var(--mu); margin-top:14px">地点名</label><input class="dinput" id="smzh" maxlength="8" value="${SM.zh}" style="margin-top:8px"></div>
    <div style="padding:18px 20px 0"><button class="cbtn" data-act="smsave">做好了，放进票根</button></div></div>`);
  smPreview(); smAuto();
  const f = $("smfile"); f.onchange = () => { const file = f.files && f.files[0]; if(!file) return; SM.src = URL.createObjectURL(file); SM.col = null; document.querySelectorAll('#ov-x [data-act^="smpic:"]').forEach(b => b.setAttribute("aria-pressed", "false")); smPreview(); smAuto(); snd("paper"); toast("照片放上去了，颜色已经从照片里取好"); }; }
/* ---------- food tickets up close: flip to the back, write a note, add a photo ---------- */
const FOOD_WHERE = {};
let TV = 0;
function openTicketView(i){ TV = i; const w = S.wallet[i], tw = Math.min(360, $("app").clientWidth - 30), th = Math.round(tw * .42), f = fontOf(w.font || "hand");
  const back2 = `<div class="tkback" style="height:${th}px"><div><div class="rows"><span><em>在哪吃的</em>${FOOD_WHERE[w.f] || "路边小店"}</span><span><em>和谁</em>${NAMES.slice(1).join(" · ") || "自己"}</span><span><em>哪天</em>${w.d}</span></div><div class="note" style="font-family:${f}">${w.note || "<span style='color:#9A958C; font-size:12px; font-family:var(--sans)'>翻到背面写一句…</span>"}</div></div>
    <div class="ph">${w.photo ? `<img src="${w.photo}" alt="">` : "还没有照片"}</div>${w.r ? `<span class="stampR">${RATE[w.r]}</span>` : ""}</div>`;
  page(`<div class="scr">${back("美食票", `<span style="font-family:var(--mono); font-size:12px; color:var(--mu)">${i + 1} / ${S.wallet.length}</span>`)}
    <div class="tkv"><button class="tkflip" id="tkflip" data-act="tkflip" aria-label="点一下翻面" style="width:${tw}px; height:${th}px"><span class="tkface">${frontTicket(w, tw)}</span><span class="tkface rv">${back2}</span></button></div>
    <p style="text-align:center; font-size:12px; color:var(--mu); margin:6px 0 0">点票翻面 · 手指在票上移动会反光</p>
    <div class="tknav"><button class="rbtn glass" data-act="tkview:${i - 1}" aria-label="上一张" ${i === 0 ? "disabled style='opacity:.3'" : ""}>${I("back",20,2)}</button><span>${w.f} · ${cityById(w.c).name}</span><button class="rbtn glass" data-act="tkview:${i + 1}" aria-label="下一张" ${i === S.wallet.length - 1 ? "disabled style='opacity:.3'" : ""} style="transform:scaleX(-1)">${I("back",20,2)}</button></div>
    <div class="sec"><h2>在背面写一句</h2><label for="tknote" style="position:absolute; left:-9999px">写一句</label><textarea class="tarea" id="tknote" maxlength="40" placeholder="比如：汤头好浓，下次加大肠">${w.note || ""}</textarea>
      <div class="fontpick">${FONTS.map(([k, n, ff]) => `<button data-act="tkfont:${k}" aria-pressed="${(w.font || "hand") === k}" style="font-family:${ff}">${n}</button>`).join("")}</div>
      <div style="display:flex; gap:10px; margin-top:12px"><label class="cbtn ghost" style="cursor:pointer">${I("camera",18)}加一张照片<input type="file" accept="image/*" id="tkfile" style="position:absolute; width:1px; height:1px; opacity:0"></label><button class="cbtn" data-act="tksave">写上</button></div></div>
    <div class="sec"><h2>评价</h2><div class="pick">${Object.entries(RATE).map(([k, v]) => `<button class="chip ${w.r === k ? "on" : ""}" data-act="tkrate:${k}">${v}</button>`).join("")}</div></div></div>`, "#0B0C10");
  const fl = $("tkflip"), tk = fl.querySelector(".tk"); if(tk) bindTiltEl(tk, 16); fl.animate([{ transform:"scale(.7) translateY(40px)", opacity:0 }, { transform:"none", opacity:1 }], { duration:500, easing:"cubic-bezier(.2,1.3,.3,1)" });
  const fi = $("tkfile"); fi.onchange = () => { const file = fi.files && fi.files[0]; if(!file) return; S.wallet[TV].photo = URL.createObjectURL(file); NOSTAG = true; openTicketView(TV); setTimeout(() => $("tkflip") && $("tkflip").classList.add("flip"), 120); toast("照片贴在背面了"); snd("stamp"); }; }
/* ---------- companions ---------- */

document.addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if(!b) return; const [a, x] = b.dataset.act.split(":");
  switch(a){
    case "vwclose": closeViewer(); break;
    case "vwzoom": if(VW){ VW.zoom = VW.zoom > 1 ? 1 : 2.2; VW.px = VW.py = 0; const im = $("vwtrack").children[VW.i].querySelector("img"); im.style.transform = `scale(${VW.zoom})`; } break;
    case "vwlike": vwLike(false); break;
    case "aopenc": albumSheet(+x); break;
    case "aup": { const f = document.createElement("input"); f.type = "file"; f.accept = "image/*"; f.onchange = () => { const file = f.files && f.files[0]; if(!file) return; ALBUM.unshift([URL.createObjectURL(file), 0, 0, "刚上传的", S.day]); liked.clear(); NOSTAG = true; openAlbum(); toast("上传好了，旅伴都能看到"); snd("success"); }; f.click(); break; }
    case "stubnew": openStubMaker(); break;
    case "smpic": SM.k = ALBUM[+x] ? ALBUM[+x][0] : null; SM.src = SM.k; SM.col = null; document.querySelectorAll('#ov-x [data-act^="smpic:"]').forEach(s => s.setAttribute("aria-pressed", s === b)); smPreview(); smAuto(); break;
    case "smfont": SM.font = x; document.querySelectorAll('#ov-x [data-act^="smfont:"]').forEach(s => s.setAttribute("aria-pressed", s === b)); smPreview(); break;
    case "smcol": SM.col = x === "auto" ? null : x; document.querySelectorAll('#ov-x [data-act^="smcol:"]').forEach(s => s.setAttribute("aria-pressed", s === b)); smPreview(); break;
    case "smlay": SM.layout = x; document.querySelectorAll('#ov-x [data-act^="smlay:"]').forEach(s => s.classList.toggle("on", s === b)); smPreview(); break;
    case "smcity": SM.en = x; document.querySelectorAll('#ov-x [data-act^="smcity:"]').forEach(s => s.classList.toggle("on", s === b)); smPreview(); break;
    case "smsave": { S.stubs.unshift(smCurrent()); S.stubFresh = true; SM.cap = ""; closeOv(); S.tab = "book"; S.seg = "tix"; render(); S.stubFresh = false; setTimeout(() => { const st = $("view").querySelector(".stub.newone, .vcard.newone"); st && vcenter(st); }, 300); confetti(); snd("stamp"); toast("新的票根放进去了"); break; }
    case "tkview": { const i = +x; if(i < 0 || i >= S.wallet.length) break; NOSTAG = curOv === "ov-x"; openTicketView(i); break; }
    case "tkflip": { const f = $("tkflip"); f.classList.toggle("flip"); snd("flip"); buzz(8); break; }
    case "tkfont": { S.wallet[TV].font = x; document.querySelectorAll('#ov-x [data-act^="tkfont:"]').forEach(s => s.setAttribute("aria-pressed", s === b)); const n = document.querySelector("#tkflip .note"); if(n) n.style.fontFamily = fontOf(x); $("tkflip").classList.add("flip"); break; }
    case "tksave": { S.wallet[TV].note = ($("tknote").value || "").trim(); NOSTAG = true; const i = TV; openTicketView(i); setTimeout(() => { const f = $("tkflip"); f && f.classList.add("flip"); }, 120); toast("写在背面了"); snd("stamp"); break; }
    case "tkrate": S.wallet[TV].r = x; NOSTAG = true; openTicketView(TV); snd("stamp"); break;
    case "members": openMembers(); break;
    case "madd": { const v = (($("mname") || {}).value || "").trim(); if(!v) return toast("先写个名字"); FRIENDS.push([v.slice(0, 1), PERSON_COL[FRIENDS.length % PERSON_COL.length]]); NAMES.push(v); S.justJoined = FRIENDS.length - 1;
      FEED.unshift({ a: FRIENDS.length - 1, t:`${v} 加入了这本手账`, s:"刚刚加入", ic:"plus" }); openMembers(); confetti(); snd("success"); toast(`${v} 加入了`); if(S.tab === "home" || S.tab === "money"){ NOSTAG = true; render(); } break; }
    
    case "mshare": { if(!ROOM()) return toast("还没连上数据库，暂时没有房间号"); const d = { title:"一起写旅行手账", text:`打开 ${location.origin}，在开始页输入房间号 ${ROOM()}，加入我们的「${TRIP.name}」旅行手账`, url: location.origin }; if(navigator.share) navigator.share(d).catch(() => {}); else { try{ copyText(d.text); }catch(err){} toast("邀请的话已经复制好了"); } break; }
  }
});
document.addEventListener("input", e => { if(e.target.id === "smcap"){ SM.cap = e.target.value; smPreview(); } if(e.target.id === "smzh"){ SM.zh = e.target.value.trim() || "这里"; smPreview(); } });

/* ===================== part 8: Mini Archive books, delete, email, capture, discoverability ===================== */
function coverHTML(b){ return `<div style="height:190px; display:flex; justify-content:center; pointer-events:none"><div style="transform:scale(.66); transform-origin:top center">${abookHTML(b, false).replace('id="abook"', "").replace('data-act="bopen"', "").replace(/^<button/, "<div").replace(/<\/button>$/, "</div>")}</div></div>`; }
/* ---------- the book, drawn like a small archive folder ---------- */
function abookHTML(b, open){ const [, , a, bb] = colOf(b.look.c), s = bstatus(b), f = [b.ph, ...["sea","pagoda","lane","tea","night","beach"].filter(k => k !== b.ph)].slice(0, 3);
  return `<button class="abook ${open ? "open" : ""} ${b.look.arch ? "arch" : ""}" id="abook" data-act="bopen" aria-expanded="${!!open}" aria-label="${b.t}，${s.t}，点一下${open ? "合上" : "打开"}" style="--a:${a}; --b:${bb}">
    <span class="slab"></span><span class="slab s2"></span>
    <span class="peekst" style="top:54px"><img src="${P[f[1]]}" alt=""></span><span class="peekst" style="top:128px; right:-18px"><img src="${P[f[2]]}" alt=""></span>
    <span class="inner"><small>${s.t}</small><b>${b.t}</b></span>
    ${f.map((k, i) => `<span class="fan f${i + 1}"><img src="${P[k]}" alt=""></span>`).join("")}
    <span class="cov"><img class="blur" src="${b.cover || P[b.ph]}" alt=""><span class="tint"></span><span class="pat pat-${b.look.p}"></span>${b.look.rib ? '<i class="rib"></i>' : ""}
      <span class="badge ${s.k === "soon" || s.k === "now" ? "go" : ""}">${s.k === "soon" ? `${s.n} 天后出发` : s.k === "now" ? `第 ${s.d} 天` : s.t}</span>${b.look.m !== "none" ? `<span class="chm">${charmSVG(b.look.m)}</span>` : ""}
      <span class="t"><b>${b.t}</b><small>${b.sub} · ${b.start.slice(0, 4)}</small><i></i><i></i></span></span>
    ${b.look.pin ? '<i class="pinmark" aria-hidden="true"></i>' : ""}</button>`; }
let bookOpen = false;
function openShelf(){ const order = bookOrder(); if(!BOOKS2[shelfSel]) shelfSel = order[0] ? order[0][1] : 0; const b = BOOKS2[shelfSel];
  if(!b){ page(`<div class="scr">${back("我的旅行书")}<p style="text-align:center; color:var(--mu); margin-top:120px">书架空了</p><div style="padding:20px"><button class="cbtn" data-act="newtrip">做一本新的</button></div></div>`); return; }
  const s = bstatus(b);
  page(`<div class="scr">${back(`<span class="brand"><img src="${LOGO}" alt="">我的旅行书</span>`, `<button class="rbtn glass" data-act="settings" aria-label="设置">${I("grid",20)}</button>`)}
    <div class="astage" id="astage">${abookHTML(b, bookOpen)}</div>
    <div class="adots" role="tablist" aria-label="切换旅行书">${order.map(([bk, i]) => { const [, , a, bb] = colOf(bk.look.c); return `<button role="tab" data-act="book:${i}" aria-pressed="${i === shelfSel}" aria-label="${bk.t}" style="background:linear-gradient(135deg,${a},${bb})"></button>`; }).join("")}<button class="plus" data-act="newtrip" aria-label="新的一本">${I("plus",16,2)}</button></div>
    <p class="aname">${b.t} · ${s.t} · 左右滑换一本，点书打开</p>
    <div class="bdetail" id="bdetail" style="margin-top:14px"><div class="binfo">${countBlock(b)}<div class="bbtns"><button class="cbtn ghost" data-act="deco:${shelfSel}">装饰 / 删除</button><button class="cbtn" data-act="${b.cur ? "close" : s.k === "soon" ? "soonbook" : "oldbook"}">${b.cur ? "继续写" : b.trip ? "换到这一本" : s.k === "soon" ? "准备行程" : "翻开"}</button></div></div></div></div>`);
  afterShelf(); bindBookSwipe(); }
function bindBookSwipe(){ const st = $("astage"); if(!st) return; let x0 = null, sw = false;
  st.addEventListener("pointerdown", e => { x0 = e.clientX; sw = false; });
  st.addEventListener("pointerup", e => { if(x0 === null) return; const dx = e.clientX - x0; x0 = null; if(Math.abs(dx) > 50){ sw = true; const order = bookOrder().map(o => o[1]), k = order.indexOf(shelfSel), n = order[Math.max(0, Math.min(order.length - 1, k + (dx < 0 ? 1 : -1)))]; if(n !== shelfSel) shelfPick(n, dx < 0 ? 1 : -1); } });
  st.addEventListener("click", e => { if(sw){ e.stopPropagation(); e.preventDefault(); sw = false; } }, true); }
function shelfPick(i, dir){ if(i === shelfSel && $("abook")) return; const order = bookOrder().map(o => o[1]); dir = dir || (order.indexOf(i) > order.indexOf(shelfSel) ? 1 : -1);
  const bk = $("abook"); bookOpen = false; buzz(6); snd("paper");
  const go = () => { shelfSel = i; if(!$("astage") || !$("ov-x").classList.contains("on")) return; NOSTAG = true; openShelf(); const nb = $("abook"); nb && !REDUCE && nb.animate([{ transform:`translateX(${dir * 120}px) rotate(${dir * 6}deg)`, opacity:0 }, { transform:"none", opacity:1 }], { duration:420, easing:"cubic-bezier(.3,1.1,.4,1)" }); };
  if(bk && !REDUCE) bk.animate([{ transform:"none", opacity:1 }, { transform:`translateX(${-dir * 120}px) rotate(${-dir * 6}deg)`, opacity:0 }], { duration:200, easing:"ease-in", fill:"forwards" }).onfinish = go; else go(); }
/* ---------- delete a book (hold to confirm) ---------- */
function deleteSheet(i){ const b = BOOKS2[i]; sheet(`<h3>删除「${b.t}」？</h3><p class="sub">${b.room ? "这一本有房间：删掉后你会离开这个房间，旅伴那边还在，以后用房间号还能再加入。" : "里面的照片、票根、日记和账本会一起删掉，不能恢复。"}</p>
  <p style="font-size:13px; color:var(--mu)">不想删也可以归档：书会放到最后，随时还能打开。</p>
  <div style="display:grid; gap:10px; margin-top:12px"><button class="cbtn ghost" data-act="archbook:${i}">改成归档</button><button class="cbtn holdbtn" id="holddel" data-i="${i}"><i></i><span style="position:relative">按住 1 秒删除</span></button></div>`);
  const h = $("holddel"), bar = h.querySelector("i"); let t0 = 0, raf = 0;
  const step = ts => { const p = Math.min(1, (ts - t0) / 1000); bar.style.width = p * 100 + "%"; if(p >= 1){ doDelete(+h.dataset.i); return; } raf = requestAnimationFrame(step); };
  h.onpointerdown = e => { e.preventDefault(); t0 = performance.now(); snd("charge", .4); raf = requestAnimationFrame(step); };
  const stop = () => { cancelAnimationFrame(raf); bar.style.transition = "width .3s"; bar.style.width = "0"; setTimeout(() => bar.style.transition = "", 300); };
  h.onpointerup = h.onpointerleave = h.onpointercancel = stop; }

/* ---------- 记录此刻: voice / photo / words ---------- */
let CAP = null;

function capPhotoSheet(){ const fnt = fontOf(CAP.font);
  sheet(`<h3>这张照片</h3><div class="capprev"><img src="${CAP.src}" alt="刚选的照片"><span id="capcap" style="font-family:${fnt}; ${CAP.cap ? "" : "display:none"}">${CAP.cap}</span></div>
    <label for="capin" style="font-size:12px; color:var(--mu)">写一句（可以不写）</label><input class="dinput" id="capin" maxlength="16" value="${CAP.cap}" placeholder="比如：终于见到东西塔" style="margin-top:8px">
    <div class="fontpick">${FONTS.map(([k, n, ff]) => `<button data-act="capfont:${k}" aria-pressed="${CAP.font === k}" style="font-family:${ff}">${n}</button>`).join("")}</div>
    <div class="lbl">这张在哪里拍的</div><div class="pick" id="capwhere">${capWhereHTML()}</div>
    <div class="li" style="margin-top:10px"><span class="tx"><b>放进大家的相册</b><small>旅伴都能看到、点赞、评论</small></span><button class="sw" role="switch" aria-label="放进大家的相册" aria-checked="${CAP.album}" data-act="captog:album"></button></div>
    <div class="li"><span class="tx"><b>同时做成一张票根</b><small>颜色自动从照片里取，放在手账 · 票根</small></span><button class="sw" role="switch" aria-label="做成票根" aria-checked="${CAP.stub}" data-act="captog:stub"></button></div>
    <div style="margin-top:12px"><button class="cbtn" data-act="capsave">保存</button></div>`); }
function capPlaces(){ const d = DAYS[S.day]; return d ? [...new Set(d.items.filter(i => i.kind === "sight" || i.kind === "food").map(i => i.title))].slice(0, 8) : []; }
function capWhereHTML(){ const w = CAP.where || "沿途风景"; return ["沿途风景", ...capPlaces()].map(n => `<button class="chip ${w === n ? "on" : ""}" data-act="capwhere:${n}">${n}</button>`).join("") + `<button class="chip ${w && w !== "沿途风景" && !capPlaces().includes(w) ? "on" : ""}" data-act="capwhereown">${w && w !== "沿途风景" && !capPlaces().includes(w) ? w : "自己写"}</button>`; }
document.addEventListener("click", e => { const b = e.target.closest('[data-act^="capwhere:"], [data-act="capwhereown"]'); if(!b || !CAP) return;
  if(b.dataset.act === "capwhereown"){ const row = $("capwhere"); if(row && !$("capwherein")) row.insertAdjacentHTML("afterend", `<div class="addrow" id="capwhererow"><input id="capwherein" maxlength="12" placeholder="比如：高速公路上、火车窗外"><button class="chip on" data-act="capwhereok" style="height:46px; flex-shrink:0">好</button></div>`); setTimeout(() => $("capwherein") && $("capwherein").focus(), 50); return; }
  CAP.where = b.dataset.act.slice(9); $("capwhere").innerHTML = capWhereHTML(); });
document.addEventListener("click", e => { const b = e.target.closest('[data-act="capwhereok"]'); if(!b || !CAP) return; const v = (($("capwherein") || {}).value || "").trim(); if(!v) return toast("写个地方"); CAP.where = v; $("capwhere").innerHTML = capWhereHTML(); const r = $("capwhererow"); r && r.remove(); });
async function capSave(){ const c = CAP; if(!c) return; const where = c.where || "沿途风景", city = DAYCFG[S.day].city; if(!c.album && !c.stub) return toast("选一个要放的地方"); closeSheet();
  if(c.album){ const r = [c.src, 0, 0, c.cap || where, S.day]; r[9] = where; ALBUM.unshift(r); }
  if(c.stub){ const col = await sampleColor(c.src); S.stubs.unshift({ src:c.src, col, font:c.font, cap:c.cap, layout:"h", en: cityEn(city), zh: where === "沿途风景" ? `${city} · 沿途` : where, date: TDATE().slice(0, 7).replace("-", " · "), no:"No." + String(S.stubs.length + 1).padStart(3, "0") }); }
  DAYCFG[S.day].pics = (DAYCFG[S.day].pics || 0) + 1; snd("success"); confetti(); toast(c.album && c.stub ? "放进相册，也做成票根了" : c.album ? "放进大家的相册了" : "做成票根了"); CAP = null; if(S.tab === "home"){ NOSTAG = true; render(); } }
function capNoteSheet(){ const D = DIARY[S.day] || DIARY[TODAY], f = D.font || "hand";
  sheet(`<h3>写几句</h3><p class="sub">写进 D${pad(S.day + 1)} 的日记，会出现在手账 · 日记和晚上的小报里</p><label for="capnt" style="position:absolute; left:-9999px">写几句</label>
    <textarea class="tarea" id="capnt" maxlength="80" placeholder="今天最想记住的一件事…" style="font-family:${fontOf(f)}; font-size:${f === "hand" || f === "brush" ? 22 : 16}px">${D.extra || ""}</textarea>
    <div class="fontpick">${FONTS.map(([k, n, ff]) => `<button data-act="ntfont:${k}" aria-pressed="${f === k}" style="font-family:${ff}">${n}</button>`).join("")}</div>
    <div style="margin-top:12px; display:flex; gap:10px"><button class="cbtn ghost" data-act="ntgodiary">去看日记</button><button class="cbtn" data-act="ntsave">写进去</button></div>`); }
document.addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if(!b) return; const [a, x] = b.dataset.act.split(":");
  switch(a){
    case "bopen": bookOpen = !bookOpen; { const bk = $("abook"); bk && (bk.classList.toggle("open", bookOpen), bk.setAttribute("aria-expanded", bookOpen)); } snd(bookOpen ? "flip" : "paper"); buzz(6); break;
    
    case "bdel": deleteSheet(+x); break;
    case "archbook": BOOKS2[+x].look.arch = true; BOOKS2[+x].look.pin = false; closeSheet(); NOSTAG = true; openShelf(); toast("归档了，放到最后"); break;
    case "capture": captureSheet(); break;
    case "capfont": CAP.font = x; document.querySelectorAll('#sheet [data-act^="capfont:"]').forEach(s => s.setAttribute("aria-pressed", s === b)); { const c = $("capcap"); c && (c.style.fontFamily = fontOf(x)); } break;
    case "captog": CAP[x] = !CAP[x]; b.setAttribute("aria-checked", CAP[x]); break;
    case "capsave": capSave(); break;
    case "capnote": capNoteSheet(); break;
    case "ntfont": { const D = DIARY[S.day] || DIARY[TODAY]; D.font = x; document.querySelectorAll('#sheet [data-act^="ntfont:"]').forEach(s => s.setAttribute("aria-pressed", s === b)); const t = $("capnt"); t && (t.style.fontFamily = fontOf(x), t.style.fontSize = (x === "hand" || x === "brush" ? 22 : 16) + "px"); break; }
    case "ntsave": case "ntgodiary": { const D = DIARY[S.day] || DIARY[TODAY], t = ($("capnt") || {}).value; if(t != null) D.extra = t.trim(); closeSheet(); if(a === "ntsave") { toast("写进今天的日记了"); snd("stamp"); } if(a === "ntgodiary" || D.extra){ S.tab = "book"; S.seg = "diary"; S.diary = Math.min(S.day, DIARY.length - 1); render(); } break; }
    
  }
});
document.addEventListener("input", e => { if(e.target.id === "capin" && CAP){ CAP.cap = e.target.value; const c = $("capcap"); if(c){ c.textContent = CAP.cap; c.style.display = CAP.cap ? "" : "none"; } } });

/* ===================== part 9: real recording, image export, install, sync hooks ===================== */
const ROOM = () => window.ROOM_CODE || "";
const ROOMTXT = () => window.ROOM_CODE || "还没连上";
const normCode = v => { let c = String(v || "").toUpperCase().replace(/[^A-Z0-9]/g, ""); if(c.length === 8 && c.startsWith("TD")) c = c.slice(2); return c; };
const VOICES = [];

document.addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if(!b) return; const [a, x] = b.dataset.act.split(":");
  switch(a){
    
    
    
    
    case "xpaper": exportNode("#ov-x .paperN", "旅途小报"); break;
    case "xreceipt": exportNode("#ov-x .rcpt", "旅行发票"); break;
     case "psave": exportNode("#ov-x .poster", "海报"); addKeep("poster"); break;
    case "xshare": exportNode("#ov-x .poster", "海报", true); break;
    case "install": installApp(); break;
    case "mjoin": joinRoom(($("mjoinin") || {}).value); break;
  }
});
IC.vplay = '<path d="M7 5v14l11-7z"/>'; IC.vpause = '<path d="M7 5h4v14H7zM13 5h4v14h-4z"/>';
async function exportNode(sel, name, share){ const el = document.querySelector(sel); if(!el) return toast("找不到要存的内容"); if(!window.htmlToImage) return toast("导出组件没有加载，检查网络后再试");
  toast("正在生成图片…"); try{ const url = await window.htmlToImage.toPng(el, { pixelRatio: 2, cacheBust: true, backgroundColor: getComputedStyle(el).backgroundColor });
    deliverImage(url, name); }catch(e){ toast("生成图片失败：" + (e.message || e)); } }
let installEvt = null; window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installEvt = e; });
function installApp(){ if(installEvt){ installEvt.prompt(); installEvt = null; return; } const ios = /iphone|ipad/i.test(navigator.userAgent); toast(ios ? "Safari 底部「分享」→「添加到主屏幕」" : "浏览器菜单里选「安装应用」或「添加到主屏幕」"); }
function syncRow(){ const st = (window.TD_SYNC && window.TD_SYNC.status) || { k:"off", t:"只存在这台手机（没有连数据库）" }; return `<div class="li"><span class="tx"><b><span class="syncdot ${st.k}"></span>同步</b><small id="syncstat">${st.t}</small></span></div>`; }

async function joinRoom(raw){ const v = normCode(raw); if(v.length === 8) return toast("这是 8 位的身份码，不是房间号。房间号是 6 位，在旅伴手机的「旅伴」页面"); if(v.length !== 6) return toast("房间号是 6 位，比如 AB12CD");
  if(v === ROOM()) return toast("你已经在这个房间里了");
  if(window.TD_SYNC && window.TD_SYNC.ready && !window.TD_SYNC.join){ toast("正在连接，请稍等…"); await Promise.race([window.TD_SYNC.ready, new Promise(r => setTimeout(r, 9000))]); }
  if(window.TD_SYNC && window.TD_SYNC.join){ toast("正在加入…"); return window.TD_SYNC.join(v); }
  sheet(`<h3>还没连上数据库</h3><p class="sub">要连上 Supabase 才能和旅伴进同一个房间。</p><p style="font-size:14px; line-height:1.7">如果你的网站部署在 Netlify，并且设好了 <b>VITE_SUPABASE_URL</b> 和 <b>VITE_SUPABASE_ANON_KEY</b>，打开网站时会自动连上，这里就能加入。现在打开的可能是预览版，或者网络没连上。</p><div style="margin-top:12px"><button class="cbtn" data-act="close2">知道了</button></div>`); }

/* the microphone stays open only while the recording page is open, so the phone asks once, not every time */

/* ===================== part 10: 47 destination guides from the original app ===================== */
const GUIDE = () => (O && O.GUIDES) || [];
const gById = id => (O && O.GUIDE_BY_ID && O.GUIDE_BY_ID[id]) || null;
NT.guide = "tokyo"; NT.q = "";
function cityListHTML(){ const q = NT.q.trim().toLowerCase(), L = GUIDE().filter(g => !q || g.name.includes(q) || (g.en || "").toLowerCase().includes(q) || (g.country || "").includes(q));
  const by = {}; L.forEach(g => (by[g.country || "其他"] = by[g.country || "其他"] || []).push(g));
  return Object.entries(by).map(([c, gs]) => `<div class="cg">${c}</div>${gs.map(g => `<button data-act="ntguide:${g.id}" aria-pressed="${NT.guide === g.id}"><i style="background:${g.color || "#888"}"></i>${g.name}<small>${g.en || ""} · ${g.spots.length} 个地方</small></button>`).join("")}`).join("") || `<div class="cg">没有这个城市，可以直接用名字建一本</div>`; }

/* an itinerary skeleton from the guide: 2–3 places a day, a local dish for lunch and dinner */
function makePlan(g, days){ const spots = g.spots.slice(), foods = g.foods.slice(), per = Math.max(2, Math.min(3, Math.ceil(spots.length / days))), out = [];
  for(let d = 0; d < days; d++){ const S2 = spots.splice(0, per); if(!S2.length && spots.length === 0 && d > 0) S2.push(...g.spots.slice((d * per) % g.spots.length, (d * per) % g.spots.length + 2));
    const items = [{ t:"09:00", title: S2[0] ? S2[0].n : "自由活动", kind:"sight", dur: S2[0] && S2[0].time || "2 小时", main:true }];
    if(S2[1]) items.push({ t:"11:30", title:S2[1].n, kind:"sight", dur:S2[1].time || "1 小时" });
    items.push({ t:"13:00", title:"午餐 · " + (foods[(d * 2) % foods.length] || {}).n, kind:"food", dur:"1 小时" });
    if(S2[2]) items.push({ t:"15:00", title:S2[2].n, kind:"sight", dur:S2[2].time || "1 小时" });
    items.push({ t:"18:30", title:"晚餐 · " + (foods[(d * 2 + 1) % foods.length] || {}).n, kind:"food", dur:"1 小时" }); out.push(items); }
  return out; }
let PD = 0;
function openPlan(i){ const b = BOOKS2[i], g = gById(b.guide); if(!g) return toast("这本还没有现成的城市资料，先在行程里手动加");
  if(!b.plan) b.plan = makePlan(g, dayDiff(b.start, b.end) + 1); const plan = b.plan, exps = (O.EXPERIENCES || {})[g.id] || [], lore = (O.LORE || {})[g.id]; PD = Math.min(PD, plan.length - 1);
  const spotOf = n => g.spots.find(s => s.n === n), foodOf = n => g.foods.find(f => f.n === n.replace(/^.+ · /, ""));
  page(`<div class="scr">${back(`${b.t} · 行程草稿`, `<button class="chip" data-act="planshuffle:${i}">换一版</button>`)}
    <div style="padding:0 20px"><p style="margin:0; font-size:14px; line-height:1.6; color:#D8D6CF">${g.intro || ""}</p><p style="margin:8px 0 0; font-size:12px; color:var(--mu)">${g.country} · ${g.name} ${g.en ? "· " + g.en : ""} · 出发还有 ${dayDiff(TODAY_ISO, b.start)} 天</p></div>
    <div class="dchips" style="margin-top:14px">${plan.map((_, d) => `<button data-act="planday:${d}" class="${d === PD ? "on" : ""}"><b>D${pad(d + 1)}</b><small>${addDays(b.start, d).slice(5).replace("-", "/")}</small></button>`).join("")}</div>
    <div class="sec"><h2>第 ${PD + 1} 天<span>${plan[PD].length} 个安排 · 可以在行程页里改</span></h2>
      ${plan[PD].map(it => { const s = spotOf(it.title), f = it.kind === "food" ? foodOf(it.title) : null;
        return `<div class="plan-spot"><span class="tt">${it.t}</span><div><b>${it.title}</b><small>${s ? `${s.t} · ${s.time || it.dur}` : f ? `美食 · ${f.where || ""}` : it.dur}</small>${s ? `<p>${s.d}</p>${s.tip ? `<div class="tip">${s.tip}</div>` : ""}` : f ? `<p>${f.d}</p>` : ""}</div></div>`; }).join("")}</div>
    <div class="sec"><h2>本地美食<span>${g.foods.length} 样 · 到了就撕票</span></h2><div class="foodrow">${g.foods.map(f => `<div class="foodcard ink"><span>${O.foodArt(f.n)}</span><b>${f.n}</b><small>${f.where || f.d}</small></div>`).join("")}</div></div>
    ${exps.length ? `<div class="sec"><h2>值得做的事<span>做过一件盖一个印记</span></h2>${exps.map(e => `<div class="li"><span class="tx"><b>${e.n}</b><small>${e.d}</small></span><span class="privtag">${e.price || ""}</span></div>`).join("")}</div>` : ""}
    ${lore ? `<div class="sec"><h2>这座城的故事</h2><div class="lore"><small>历史</small><p>${lore.history}</p></div><div class="lore"><small>传说</small><p>${lore.legend}</p></div><div class="lore"><small>风俗</small><p>${lore.custom}</p></div></div>` : ""}
    <div style="padding:16px 20px 0"><button class="cbtn" data-act="close">好，先这样</button></div></div>`); }
const addDays = (iso, n) => { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
document.addEventListener("input", e => { if(e.target.id === "ntq"){ NT.q = e.target.value; const l = $("citylist"); l && (l.innerHTML = cityListHTML()); } });
document.addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if(!b) return; const [a, x] = b.dataset.act.split(":");
  switch(a){
    case "ntguide": { NT.guide = x; const g = gById(x); NT.city = g ? g.name : NT.city; document.querySelectorAll('#citylist button').forEach(s => s.setAttribute("aria-pressed", s === b)); const n = $("ntname"); n && (n.placeholder = NT.city); snd("tap"); break; }
    
    
    case "planday": PD = +x; NOSTAG = true; openPlan(shelfSel); break;
    case "planshuffle": { const bk = BOOKS2[+x], g = gById(bk.guide); if(!g) break; const sp = g.spots.slice(); for(let k = sp.length - 1; k > 0; k--){ const j = Math.floor(Math.random() * (k + 1)); [sp[k], sp[j]] = [sp[j], sp[k]]; } bk.plan = makePlan({ ...g, spots: sp }, bk.plan.length); NOSTAG = true; openPlan(+x); toast("换了一版"); snd("shuffle"); break; }
  }
});

/* ===================== part 11: the last placeholders become real ===================== */
S.favs = new Set();
const geoOf = title => { const g = (typeof GEO !== "undefined" ? GEO : []).find(x => x[0] === title); return g ? { lat:g[1], lng:g[2] } : null; };
function navLinks(title){ const g = geoOf(title) || { lat:24.9, lng:118.59 }, q = encodeURIComponent(title);
  return { amap:`https://uri.amap.com/navigation?to=${g.lng},${g.lat},${q}&mode=car&src=tripdeck`, apple:`https://maps.apple.com/?daddr=${g.lat},${g.lng}&q=${q}`, google:`https://www.google.com/maps/dir/?api=1&destination=${g.lat},${g.lng}&destination_place_id=&travelmode=driving` }; }
function openDriver(title){ const L = navLinks(title), city = DAYCFG[TODAY].city;
  const el = document.createElement("div"); el.className = "drv"; el.id = "drv"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "给司机看");
  el.innerHTML = `<div class="top"><span>给司机看 · FOR THE DRIVER</span><button class="x" data-act="drvclose" aria-label="关闭">${I("x",20,2)}</button></div>
    <div class="big"><b>${title}</b><small>${city}</small><em>师傅您好，请带我们到这里。<br>谢谢！</em></div>
    <div class="navs"><a href="${L.amap}" target="_blank" rel="noopener">高德</a><a href="${L.apple}" target="_blank" rel="noopener">Apple</a><a href="${L.google}" target="_blank" rel="noopener">Google</a></div>`;
  $("app").appendChild(el); try{ document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {}); }catch(e){} }
function placesForTools(){ let L = DAYS[TODAY].items.filter(i => i.kind === "sight" || i.kind === "food" || i.kind === "lodging"); if(!L.length) L = DAYS.flatMap(d => d.items).filter(i => i.kind === "sight").slice(0, 12); return L; }
function navSheet(){ if(S.fx.lost > Date.now()) return toast("虚假世界：导航暂时关掉了"); const sights = placesForTools();
  sheet(`<h3>一键导航</h3><p class="sub">选一个地方，用你手机里的地图打开</p>${sights.map(i => { const L = navLinks(i.title); return `<div class="li"><span class="tx"><b>${i.title}</b><small>${i.t} · ${i.dur}</small></span><span style="display:flex; gap:6px"><a class="chip" href="${L.amap}" target="_blank" rel="noopener" style="text-decoration:none; display:inline-flex; align-items:center">高德</a><a class="chip" href="${L.apple}" target="_blank" rel="noopener" style="text-decoration:none; display:inline-flex; align-items:center">Apple</a><a class="chip" href="${L.google}" target="_blank" rel="noopener" style="text-decoration:none; display:inline-flex; align-items:center">Google</a></span></div>`; }).join("")}`); }
function driverSheet(){ const sights = placesForTools();
  sheet(`<h3>给司机看</h3><p class="sub">选一个地方，屏幕会变成一张大字卡，直接给司机看</p><div class="pick">${sights.map(i => `<button class="chip" data-act="drv:${i.title}">${i.title}</button>`).join("")}</div>`); }
document.addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if(!b) return; const [a, x] = b.dataset.act.split(":");
  switch(a){
    case "drv": closeSheet(); openDriver(x); break;
    case "drvclose": { const d = $("drv"); d && d.remove(); try{ document.exitFullscreen && document.fullscreenElement && document.exitFullscreen(); }catch(err){} break; }
    case "soon": {
      const lab = b.getAttribute("aria-label") || b.textContent.trim();
      if(lab === "播放语音"){ const v = VOICES.filter(v => v.day === S.diary && v.url).pop(); if(!v) toast(DAYCFG[S.diary].voice ? "示例的语音没有音频，你自己录的会在这里播" : "这一天还没有录语音，首页「记录此刻」可以录"); else { new Audio(v.url).play(); toast("播放中"); } }
      else if(lab === "添加照片、笔记或贴纸"){ S.day = S.diary; captureSheet(); }
      else if(lab === "收藏"){ const key = (CK.di || 0) + ":" + (CK.ii || 0); S.favs.has(key) ? S.favs.delete(key) : S.favs.add(key); b.style.color = S.favs.has(key) ? "#FF8A6B" : ""; b.querySelector("svg") && (b.querySelector("svg").style.fill = S.favs.has(key) ? "currentColor" : "none"); toast(S.favs.has(key) ? "收藏了，会出现在回忆放映里" : "取消收藏"); buzz(8); }
      else if(lab === "English"){ toast("英文界面下一版再来"); }
      else if(lab === "中文"){ }
      break; }
  }
});

/* ===================== part 18: safe text everywhere + resilient lookups ===================== */
/* Anything typed by a person or coming from Excel / the database is shown as text, never run as code.
   < > " are swapped for look-alike full-width characters, so they still read the same but can't form HTML. */
const SAFE_MAP = { "<":"＜", ">":"＞", '"':"＂" };
function safeStr(s){ if(typeof s !== "string" || !/[<>"]/.test(s) || /^(data:|blob:|https?:)/.test(s)) return s; return s.replace(/[<>"]/g, c => SAFE_MAP[c]); }
function safeDeep(v, depth = 0){ if(depth > 12 || v == null) return v; if(typeof v === "string") return safeStr(v); if(Array.isArray(v)){ for(let i = 0; i < v.length; i++) v[i] = safeDeep(v[i], depth + 1); return v; }
  if(typeof v === "object" && !(v instanceof Blob) && !(v instanceof Set)){ for(const k of Object.keys(v)) v[k] = safeDeep(v[k], depth + 1); } return v; }
window.TD_SAFE = safeDeep;
/* text the user types */
document.addEventListener("input", e => { const t = e.target; if(!t || !/^(INPUT|TEXTAREA)$/.test(t.tagName) || /^(file|number|date|time|range|checkbox|radio)$/.test(t.type)) return; if(/[<>"]/.test(t.value)){ const p = t.selectionStart; t.value = safeStr(t.value); try{ t.setSelectionRange(p, p); }catch(err){} } }, true);
/* city lookups never crash, even for tickets from a city that isn't in this trip */
const cityById = id => CITIES.find(c => c.id === id) || (() => { const g = O && O.GUIDE_BY_ID && O.GUIDE_BY_ID[id]; return g ? { id, name:g.name, en:g.en || id, color:g.color || "#6F7A88", food:"" } : { id, name:"旅途中", en:"TRIP", color:"#6F7A88", food:"" }; })();
/* ---- one tap = one action: ignore an accidental second tap on "save"-type buttons ---- */
(function(){ const ONCE = new Set(["aesave","ckkeep","trsave","eesave","capsave","ntgo","stblankgo","stguidego","smsave","gpstart","gpsend","gpreveal","recsave","tkeep","itsave","madd","ppdone","namesave","tksave","cksend","ntsave","eedel","itdel","stjoingo","mjoin","stcodego","wipego","backup"]), last = {};
  document.addEventListener("click", e => { const b = e.target.closest("[data-act]"); if(!b) return; const a = b.dataset.act.split(":")[0]; if(!ONCE.has(a)) return; const now = Date.now(); if(last[a] && now - last[a] < 900){ e.stopImmediatePropagation(); e.preventDefault(); return; } last[a] = now; }, true);
  document.addEventListener("dblclick", e => { if(e.target.closest("[data-act]")) e.preventDefault(); }, true); })();
/* ---- deleting the book you're using moves you to another one, or back to the start page ---- */
function doDelete(i){ const b = BOOKS2[i]; if(!b) return; if(b.room && window.TD_SYNC && window.TD_SYNC.leave) window.TD_SYNC.leave(b.room); closeSheet(); buzz([20, 40, 60]); snd("tear"); const bk = $("abook"); bk && bk.classList.add("gone"); const wasCur = b.cur || b.id === S.curBook;
  setTimeout(() => { BOOKS2.splice(i, 1); delete S.privBy[b.id]; bookOpen = false;
    if(wasCur){ S.curBook = null; const next = BOOKS2.find(x => x.trip); if(next){ useBook(next.id); toast(`「${b.t}」删掉了，现在是「${next.t}」`); return; }
      DAYS.length = 0; ALBUM.length = 0; EXP.length = 0; S.checkins.length = 0; closeOv(); $("view").innerHTML = ""; openStart(false); toast(`「${b.t}」删掉了`); return; }
    const o = bookOrder(); shelfSel = o[0] ? o[0][1] : 0; NOSTAG = true; openShelf(); toast(`「${b.t}」删掉了`); }, 650); }

document.addEventListener("click", e => { const b = e.target.closest('[data-act="expall"]'); if(b){ S.expAll = true; NOSTAG = true; render(); } });

/* ===================== core: the trip comes from an import, a template, or a city guide — never hard-coded ===================== */
const MONTH_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const emptyBox = (t, s) => `<div class="empty"><b>${t}</b><small>${s}</small></div>`;
const cityEn = name => { const c = CITIES.find(c => c.name === name); return (c ? c.en : (name || "")).toUpperCase(); };
const PHKEYS = ["sea","tea","lane","pagoda","night","beach"];
const durStr = m => typeof m === "string" ? m : m >= 60 ? `${+(m / 60).toFixed(1)} 小时`.replace(".0 ", " ") : `${m} 分钟`;
const GENERIC_CHECK = [{ cat:"证件", items:["护照 / 身份证","机票或车票","酒店预订确认","旅游保险"] }, { cat:"手机 & 钱", items:["当地支付方式","流量卡或漫游","一点现金","充电宝"] }, { cat:"行李", items:["转换插头","舒服的鞋","常用药","雨伞"] }];
function dayPhoto(di){ const a = ALBUM.find(x => x[4] === di); if(a){ P[a[0]] = a[0]; return a[0]; } const city = DAYS[di] ? DAYS[di].city : ""; let h = 0; for(const ch of (city + di)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return PHKEYS[(h + di) % PHKEYS.length]; }
function cityNameOf(id){ const g = O && O.GUIDE_BY_ID && O.GUIDE_BY_ID[id]; return g ? g.name : id; }
/* ---- turn a trip object into everything the screens read ---- */
function applyTrip(T){ if(window.TD_SAFE) window.TD_SAFE(T);
  RATE_CNY = T.rate || .6; Object.assign(TRIP, { home:T.home || T.currency || "MYR", dest:T.dest || "", name:T.name, start:T.start, end:T.end, budget:T.budget || 4000, currency:T.currency || "MYR", rate:T.rate || .6, cities:T.cities || [], stays:T.stays || [], source:T.source || "blank" });
  const gs = TRIP.cities.map(id => O && O.GUIDE_BY_ID ? O.GUIDE_BY_ID[id] : null).filter(Boolean); TRIP.guides = gs; if(!TRIP.dest) TRIP.dest = (gs[0] && COUNTRY_CUR[gs[0].country]) || "CNY"; if(TRIP.dest === TRIP.home) RATE_CNY = 1;
  const cityNames = TRIP.cities.map(cityNameOf); TRIP.cityNames = cityNames.join(" · ") || T.name;
  const md2 = iso => `${+iso.slice(5, 7)}/${+iso.slice(8, 10)}`; TRIP.range = `${md2(T.start)}–${md2(T.end)}`; TRIP.rangeDot = `${T.start.replace(/-/g, ".")} — ${T.end.slice(5).replace("-", ".")}`; TRIP.rangeCN = `${+T.start.slice(5, 7)} 月 ${+T.start.slice(8)} 日 — ${+T.end.slice(5, 7)} 月 ${+T.end.slice(8)} 日`;
  DAYS.length = 0; (T.days || []).forEach(d => DAYS.push({ date:d.date, city:d.city, title:d.title || "", items:(d.items || []).map(it => ({ id: it.id || itemId(d.date, it.t, it.title), cut:it.cut, cutBy:it.cutBy, added:it.added, t:it.t, title:it.title, kind:it.kind || "sight", dur:durStr(it.dur || 60), main:!!it.main, note:it.note || "", spots:it.spots || [] })) }));
  if(!DAYS.length){ let d = new Date(T.start + "T12:00:00"); const e = new Date(T.end + "T12:00:00"); while(d <= e){ DAYS.push({ date:`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`, city:cityNames[0] || T.name, title:"", items:[] }); d.setDate(d.getDate() + 1); } }
  const today = TDATE(); PHASE = today < T.start ? "before" : today > T.end ? "after" : "during"; TODAY = Math.max(0, Math.min(DAYS.length - 1, PHASE === "before" ? 0 : PHASE === "after" ? DAYS.length - 1 : DAYS.findIndex(d => d.date === today)));
  S.day = TODAY; S.tday = TODAY; S.diary = TODAY;
  CITIES.length = 0; gs.forEach(g => CITIES.push({ id:g.id, name:g.name, en:g.en || g.id, color:g.color || "#2f6c9f", food:(g.foods[0] || {}).n || "", ll:g.ll }));
  if(!CITIES.length) cityNames.forEach((n, i) => CITIES.push({ id:"c" + i, name:n, en:n, color:["#2f6c9f","#a8352e","#b9822a"][i % 3], food:"" }));
  Object.keys(FOODS).forEach(k => delete FOODS[k]); Object.keys(FOOD_WHERE).forEach(k => delete FOOD_WHERE[k]); GITEMS.length = 0;
  gs.forEach(g => g.foods.forEach(f => { FOODS[f.n] = { en:f.e || "", mean:f.d || "" }; if(f.where) FOOD_WHERE[f.n] = f.where; GITEMS.push([f.n, 0]); }));
  BTASK.length = 0; const ct = O && O.CTASKS ? TRIP.cities.flatMap(id => O.CTASKS[id] || []) : []; ct.map(t => t.slice(1)).concat(["拍一张大家影子的合照","和本地阿姨聊两句","坐一次公交","买一张明信片寄回家","喝一杯本地茶","在庙里求一支签","找一面最好看的墙拍照","学会一句当地话"]).slice(0, 16).forEach(t => BTASK.push(t)); while(BTASK.length < 16) BTASK.push("自由发挥一件小事");
  Object.keys(SPOTS).forEach(k => delete SPOTS[k]); GEO.length = 0; const coords = T.coords || {};
  gs.forEach(g => g.spots.forEach(sp => { SPOTS[sp.n] = { d:sp.d, tip:sp.tip || "", t:sp.t || "", time:sp.time || "" }; }));
  DAYS.forEach((d, di) => d.items.forEach(it => { if(it.kind !== "sight" && it.kind !== "food") return; let ll = coords[it.title]; if(!ll){ const key = Object.keys(SPOTS).find(k => it.title.includes(k) || k.includes(it.title.replace(/ · .*/, ""))); const sp = key && gs.flatMap(g => g.spots).find(s => s.n === key); ll = sp && sp.ll; } if(!ll) return; const ex = GEO.find(g => g[0] === it.title); if(ex) ex[3].push(di); else GEO.push([it.title, ll[0], ll[1], [di]]); }));
  EXTRA_PLACES.length = 0; const planned = new Set(DAYS.flatMap(d => d.items.map(i => i.title))); gs.flatMap(g => g.spots).filter(s => !planned.has(s.n)).slice(0, 8).forEach(s => EXTRA_PLACES.push([s.n, s.d ? s.d.slice(0, 22) : ""]));
  CHECK.length = 0; (T.checklist && T.checklist.length ? T.checklist : GENERIC_CHECK).forEach(c => CHECK.push({ cat:c.cat, items:c.items.slice() })); PACK_TOTAL = CHECK.reduce((n, c) => n + c.items.length, 0);
  EXP.length = 0; const CAT = { 住宿:["住宿","bed","#C9B2E8"], 交通:["交通","bus","#7FA7D6"], 餐饮:["餐饮","bowl","#EE6A3C"], 门票:["门票","pin","#A9B7A1"], 购物:["购物","tag","#E8A7B7"], 其他:["其他","tag","#9FB49A"] };
  (T.prepaid || []).forEach(p => { const c = CAT[p.category] || CAT.其他; EXP.push({ t:p.note, c:c[0], ic:c[1], col:c[2], splitN:Math.max(1, +p.split_n || 1), rm:p.currency === TRIP.home || !p.currency ? +p.amount || 0 : (+p.amount || 0) * RATE_CNY, cny: p.currency && p.currency !== TRIP.home ? +p.amount : null, who:"我", split:(p.split_n || 1) > 1 ? FRIENDS.map((_, i) => i) : [0], d:"预付", pre:true }); });
  DIARY.length = 0; DAYS.forEach((d, i) => DIARY.push({ cap:d.title || (d.items.find(x => x.kind === "sight") || {}).title || d.city, tag:"#" + d.city, note:"", ph:dayPhoto(i), font:"hand", extra:"" }));
  DAYCFG.length = 0; DAYS.forEach((d, i) => DAYCFG.push({ photo:dayPhoto(i), place:(d.items.find(x => x.main && x.kind === "sight") || d.items.find(x => x.kind === "sight") || {}).title || d.title || d.city, city:d.city, temp:"—", wx:"", steps:"—", pics:0, voice:0 }));
  refreshDerived(); }
function refreshDerived(){ { const W = window.TD_WX, c = DAYCFG[TODAY]; if(W && c && W.city === c.city && W.date === TDATE()){ c.temp = W.temp; if(W.text){ c.wx = W.text; c.desc = W.text; } } } if(FRIENDS[0]) FRIENDS[0][0] = (S.me || "我").slice(0, 1); if(typeof applySteps === "function") applySteps(); DAYCFG.forEach((c, i) => { c.photo = dayPhoto(i); c.pics = ALBUM.filter(a => a[4] === i).length; c.voice = VOICES.filter(v => v.day === i).reduce((n, v) => n + v.sec, 0); if(DIARY[i]) DIARY[i].ph = c.photo; });
  Object.keys(ARCH).forEach(k => delete ARCH[k]); CITIES.forEach(c => { const st = okCheckins().filter(k => k.city === c.name).map(k => [k.photo || dayPhoto(k.di), k.title]); ARCH[c.id] = { n:c.name, en:c.en.toUpperCase(), col:c.color, b1:"#8FA9C0", b2:"#C49A70", st, have:st.length }; }); if(!ARCH[S.acity] && CITIES[0]) S.acity = CITIES[0].id;
  PLACES.length = 0; S.checkins.forEach((k, ci) => { if(k.status && k.status !== "ok") return; const c = DAYCFG[k.di] || {}; PLACES.push({ ci, k:k.photo || dayPhoto(k.di), n:cityEn(c.city), z:k.title, d:`${md(DAYS[k.di].date)} · ${k.at || ""}`, w:`${c.temp}° ${c.wx}`, s:"—", m:k.mood || 0, p:c.pics, v:mmss(c.voice || 0), cap:k.title }); }); }
function addCheckin(){ const it = DAYS[CK.di].items[CK.ii], c = DAYCFG[CK.di]; const at = new Date().toTimeString().slice(0, 5);
  const photo = (ckPics()[CK.pic]) || ""; S.checkins.push({ id: it.id, di:CK.di, ii:CK.ii, title:it.title, city:c.city, date:TDATE(), at, photo, mood:0 }); FEED.unshift({ a:0, t:`你在「${it.title}」打卡了`, s:`${c.city} · ${at}`, ic:"pin" }); refreshDerived(); toast(`已收进护照 · ${c.city} ${ARCH[CITIES.find(x => x.name === c.city)?.id]?.have || 1} 枚`); if(!NOSTAG) NOSTAG = true; render(); }
/* ---- builders ---- */
function tripFromGuide(gid, start, ndays, name){ const g = O.GUIDE_BY_ID[gid]; const plan = makePlan(g, ndays);
  return { name:name || g.name, start, end:addDays(start, ndays - 1), budget:4000, currency:"MYR", cities:[gid], source:"guide", days:plan.map((items, d) => ({ date:addDays(start, d), city:g.name, title:(items[0] || {}).title || "", items })), prepaid:[], checklist:GENERIC_CHECK }; }
function tripBlank(name, start, ndays, cityName){ const g = O.guideFor && O.guideFor(cityName); return { name:name || cityName || "新的旅行", start, end:addDays(start, ndays - 1), budget:4000, currency:"MYR", cities:g ? [g.id] : [], source:"blank", days:[], prepaid:[], checklist:GENERIC_CHECK }; }
/* Excel: the same workbook the original app reads (sheets 旅行 / 行程 / 预付, plus 清单) */
async function loadXLSX(){ if(window.XLSX) return window.XLSX; await new Promise((res, rej) => { const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); return window.XLSX; }
const KIND_CN = { 景点:"sight", 美食:"food", 交通:"transit", 住宿:"lodging", 航班:"flight", 其他:"sight", 体验:"sight" };
async function tripFromXlsx(file){ const XLSX = await loadXLSX(); const wb = XLSX.read(await file.arrayBuffer(), { type:"array", cellDates:true });
  const rows = name => { const ws = wb.Sheets[name] || wb.Sheets[wb.SheetNames.find(n => n.includes(name)) || ""]; return ws ? XLSX.utils.sheet_to_json(ws, { defval:"", raw:true, cellDates:true }) : []; };
  const col = (r, ...keys) => { for(const k of keys){ const kk = Object.keys(r).find(x => x.replace(/\s|\*/g, "") === k); if(kk !== undefined && r[kk] !== "") return r[kk]; } return ""; };
  const dateStr = v => { if(v instanceof Date) return `${v.getFullYear()}-${pad(v.getMonth()+1)}-${pad(v.getDate())}`; if(typeof v === "number" && v > 30000 && v < 80000){ const d = new Date(Math.round((v - 25569) * 864e5)); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}`; }
    const s = String(v || "").trim().replace(/[年月]/g, "-").replace(/日/g, "").replace(/[./]/g, "-"); let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); if(m) return `${m[1]}-${m[2].padStart(2,"0")}-${m[3].padStart(2,"0")}`;
    m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/); if(m){ let d = +m[1], mo = +m[2]; if(mo > 12 && d <= 12){ [d, mo] = [mo, d]; } return `${m[3]}-${pad(mo)}-${pad(d)}`; } return ""; };
  const timeStr = v => { if(v instanceof Date) return v.toTimeString().slice(0, 5); if(typeof v === "number"){ const m = Math.round((v % 1) * 1440); return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`; }
    const s = String(v || "").trim(), m = s.match(/(\d{1,2})(?:[:：.](\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?/i); if(!m || (!m[2] && !m[3] && !/[点時时]/.test(s))) return ""; let h = +m[1], mi = m[2] ? +m[2] : 0;
    const pm = /pm|p\.m\.|下午|晚上|傍晚/i.test(s), am = /am|a\.m\.|上午|早上|凌晨/i.test(s); if(pm && h < 12) h += 12; if(am && h === 12) h = 0; if(/半/.test(s)) mi = 30; return `${pad(h % 24)}:${pad(mi)}`; };
  const yes = v => /^(是|y|yes|true|1|✓)$/i.test(String(v || "").trim());
  const t = rows("旅行")[0] || {}; const cityIds = String(col(t, "城市") || "").split(/[,，、\s]+/).map(n => { const g = O.guideFor(n.trim()); return g ? g.id : null; }).filter(Boolean);
  const T = { name:String(col(t, "名称", "旅行名称") || file.name.replace(/\.xlsx?$/i, "")), start:dateStr(col(t, "开始日期", "开始")), end:dateStr(col(t, "结束日期", "结束")), budget:+col(t, "每人预算", "预算") || 4000, currency:String(col(t, "币种") || "MYR"), rate:+col(t, "人民币汇率", "汇率") || .6, cities:cityIds, source:"xlsx", prepaid:[], checklist:[] };
  const byDate = {}; rows("行程").forEach(r => { const date = dateStr(col(r, "日期")), title = String(col(r, "地点", "名称", "标题")).trim(); if(!date || !title) return; const city = String(col(r, "城市") || "").trim(); const g = city && O.guideFor(city);
    (byDate[date] = byDate[date] || { date, city:g ? g.name : city || cityNameOf(cityIds[0]) || T.name, title:"", items:[] }).items.push({ t:timeStr(col(r, "时间")) || "09:00", title, kind:KIND_CN[String(col(r, "类型")).trim()] || "sight", dur:+col(r, "时长", "时长分钟") || 60, note:String(col(r, "备注") || "").trim(), spots:String(col(r, "候补", "候补地点") || "").split(/[,，、]/).map(x => x.trim()).filter(Boolean), main:yes(col(r, "主要", "主要行程")) }); });
  T.days = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date)); T.days.forEach(d => { d.items.sort((a, b) => a.t.localeCompare(b.t)); d.title = (d.items.find(i => i.main && i.kind === "sight") || d.items[0] || {}).title || ""; });
  if(!T.start && T.days.length) T.start = T.days[0].date; if(!T.end && T.days.length) T.end = T.days[T.days.length - 1].date; if(!T.start){ T.start = TDATE(); T.end = addDays(T.start, 4); }
  const CATX = { 住宿:"住宿", 酒店:"住宿", 机票:"交通", 航班:"交通", 门票:"门票", 景点:"门票", 交通:"交通", 餐饮:"餐饮", 美食:"餐饮", 购物:"购物" };
  rows("预付").forEach(r => { const name = String(col(r, "名称", "项目")).trim(), amount = +col(r, "金额"); if(!name || !(amount > 0)) return; T.prepaid.push({ note:name, amount, currency:String(col(r, "币种") || T.currency).toUpperCase().replace("RM", "MYR").replace("¥", "CNY"), category:CATX[String(col(r, "类别")).trim()] || "其他", split_n:+col(r, "分摊人数", "人数") || 1 }); });
  const cl = {}; rows("清单").forEach(r => { const cat = String(col(r, "分类", "类别") || "其他").trim(), item = String(col(r, "项目", "名称", "东西")).trim(); if(item) (cl[cat] = cl[cat] || []).push(item); }); T.checklist = Object.entries(cl).map(([cat, items]) => ({ cat, items }));
  if(!T.days.length) throw new Error("「行程」表里没有读到任何一行（需要 日期 和 地点 两列）"); return T; }
async function downloadTemplate(){ const XLSX = await loadXLSX(); const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["名称","开始日期","结束日期","城市","每人预算","币种","人民币汇率"],["福建 · 厦门泉州","2026-10-31","2026-11-08","厦门, 泉州",4000,"MYR",0.6]]), "旅行");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["日期","时间","地点","城市","类型","时长","主要","备注","候补"],["2026-11-01","08:00","第八市场 · 早餐","厦门","美食",60,"","",""],["2026-11-01","10:00","鼓浪屿","厦门","景点",420,"是","含午餐","日光岩, 菽庄花园"],["2026-11-01","19:00","晚餐","厦门","美食",60,"","",""]]), "行程");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["名称","金额","币种","类别","分摊人数"],["全季酒店 · 3 晚",1326.74,"MYR","住宿",3]]), "预付");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["分类","项目"],["证件","护照"],["证件","机票行程单"],["行李","充电宝"]]), "清单");
  XLSX.writeFile(wb, "旅行手账-行程模板.xlsx"); toast("模板已下载，填好再传回来"); }
/* ---- books: every trip is a book; the current one drives the whole app ---- */
function bookFromTrip(T){ const id = "b" + Date.now().toString(36); const g = O.GUIDE_BY_ID[(T.cities || [])[0]]; return { id, t:T.name.slice(0, 6), sub:T.cities.map(cityNameOf).join(" · ") || T.name, start:T.start, end:T.end, ph:PHKEYS[BOOKS2.length % 6], st:`${T.days.length} 天 · ${T.days.reduce((n, d) => n + d.items.length, 0)} 个安排`, guide:g ? g.id : undefined, trip:T, look:{ c:["sky","clay","moss","plum","gold","rose"][BOOKS2.length % 6], p:"plain", m:"star", rib:true, win:true, pin:false, arch:false } }; }
function useBook(id){ const b = BOOKS2.find(x => x.id === id); if(!b || !b.trip) return toast("这本还没有行程"); if(S.curBook && S.curBook !== id) stashBook(S.curBook); BOOKS2.forEach(x => x.cur = x.id === id); S.curBook = id; applyTrip(b.trip); restoreBook(id); if(window.TD_SYNC && window.TD_SYNC.onSwitch) window.TD_SYNC.onSwitch(b); S.tab = "home"; closeOv(); closeSheet(); render(); }
function adoptTrip(T){ const b = bookFromTrip(T); b._fresh = true; b.rev = Date.now(); BOOKS2.push(b); useBook(b.id); const st = $("start"); st && st.remove(); confetti(); snd("success"); toast(`「${T.name}」开始了`); EXP.forEach(e => { if(e.pre){ e.payer = 0; e.who = "你"; e.pre = false; e.wasPre = true; if(!e.split.includes(0)) e.split.push(0); } }); b.trip.prepaid = []; if(EXP.some(e => e.wasPre)) setTimeout(prepaidReview, 900); }
/* ---- first screen ---- */
function openStart(extra){ const el = document.createElement("div"); el.className = "start"; el.id = "start"; const hasGuide = O && O.GUIDES;
  el.innerHTML = `<div class="logo"><img src="${LOGO}" alt=""><div><h1>旅行手账</h1><div class="en">TRIP DECK</div></div></div>
    <p class="sub">${extra ? "再做一本新的旅行书。" : "一群人一起写的旅行手账。先把这趟旅行的行程放进来，其他的——票根、打卡、技能牌、账本——都会跟着长出来。"}</p>
    ${extra ? "" : `<div class="lbl">你叫什么</div><input class="dinput" id="stname" maxlength="8" placeholder="旅伴会看到这个名字" value="${S.me || ""}" style="margin-top:8px">`}
    ${!extra ? `<div class="have"><b>已经在用了？</b>
      <label for="stjoin">旅伴给了你房间号</label><div class="addrow" style="margin-top:6px"><input id="stjoin" placeholder="6 位房间号，比如 AB12CD" maxlength="9" autocapitalize="characters"><button class="chip on" data-act="stjoingo" style="height:46px; flex-shrink:0">加入</button></div>
      <label for="stcode" style="margin-top:12px">换了手机，想找回自己</label><div class="addrow" style="margin-top:6px"><input id="stcode" placeholder="你的 8 位身份码" maxlength="9" autocapitalize="characters"><button class="chip on" data-act="stcodego" style="height:46px; flex-shrink:0">找回</button></div></div>
    <div class="lbl">或者，新开一本</div>` : `<div class="lbl">这趟旅行的行程</div>`}
    <label class="opt main"><span class="oi" style="background:rgba(232,168,100,.2); color:var(--amber)">${I("grid",24)}</span><span><b>导入 Excel 行程表</b><small>和原版一样的模板：旅行 / 行程 / 预付 / 清单 四张表</small></span><input type="file" accept=".xlsx,.xls" id="stxlsx" style="position:absolute; width:1px; height:1px; opacity:0"></label>
    <button class="opt" data-act="sttpl"><span class="oi" style="background:rgba(159,184,216,.18); color:#CFE0F5">${I("book",24)}</span><span><b>下载空白模板</b><small>先拿一份 .xlsx 填，填好再传回来</small></span></button>

    ${hasGuide ? `<button class="opt" data-act="stguide"><span class="oi" style="background:rgba(201,178,232,.18); color:#E3D6F5">${I("spark",24)}</span><span><b>从城市资料生成</b><small>${O.GUIDES.length} 个城市的景点和美食，选一个就有行程草稿</small></span></button>` : ""}
    <button class="opt" data-act="restore"><span class="oi" style="background:rgba(255,255,255,.07); color:var(--mu)">${I("book",24)}</span><span><b>从备份恢复</b><small>换手机时，选旧手机存的备份文件</small></span></button>
    <button class="opt" data-act="stblank"><span class="oi" style="background:rgba(255,255,255,.07); color:var(--mu)">${I("plus",24)}</span><span><b>空白的一本</b><small>只填名字和日期，行程以后再加</small></span></button>
    ${extra ? `<div style="margin-top:14px"><button class="cbtn ghost" data-act="stcancel">先不用</button></div>` : ""}
    <p class="xlsx-help">Excel 的「行程」表至少要有 <code>日期</code> 和 <code>地点</code> 两列，可选 <code>时间</code>、<code>城市</code>、<code>类型</code>（景点 / 美食 / 交通 / 住宿 / 航班）、<code>时长</code>、<code>主要</code>、<code>备注</code>、<code>候补</code>。</p>`;
  $("app").appendChild(el); const f = $("stxlsx"); f.onchange = async () => { const file = f.files && f.files[0]; if(!file) return; saveName(); toast("正在读表…"); try{ const T = await tripFromXlsx(file); adoptTrip(T); }catch(e){ toast("读不了这个文件：" + (e.message || e)); } }; }
function saveName(){ const n = $("stname"); if(n && n.value.trim()){ S.me = n.value.trim(); FRIENDS[0][0] = S.me.slice(0, 1); if(window.TD_SYNC && window.TD_SYNC.setName) window.TD_SYNC.setName(S.me); } }
function guideStartSheet(){ NT.q = ""; sheet(`<h3>从城市资料生成</h3><label for="ntq" style="position:absolute; left:-9999px">搜城市</label><input class="dinput" id="ntq" placeholder="搜城市：吉隆坡、潮汕、清迈…" style="margin-top:4px"><div class="citylist" id="citylist">${cityListHTML()}</div>
    <div class="lbl">哪天出发</div><input class="dinput" id="ntdate" type="date" value="${NT.start}" style="margin-top:8px"><div class="lbl">玩几天</div><div class="step" style="margin-top:8px"><button data-act="ntd:-1" aria-label="少一天">−</button><b id="ntdays">${NT.days}</b><button data-act="ntd:1" aria-label="多一天">+</button><span style="color:var(--mu); font-size:13px">天</span></div>
    <div style="margin-top:16px"><button class="cbtn" data-act="stguidego">生成行程，开始</button></div>`); }
function blankSheet(){ sheet(`<h3>空白的一本</h3><div class="lbl">名字</div><input class="dinput" id="bkname" placeholder="比如：东京 · 冬天" maxlength="12" style="margin-top:8px"><div class="lbl">去哪（可不填）</div><input class="dinput" id="bkcity" placeholder="城市名，有资料的会自动带上美食和景点" style="margin-top:8px">
    <div class="lbl">哪天出发</div><input class="dinput" id="bkdate" type="date" value="${NT.start}" style="margin-top:8px"><div class="lbl">几天</div><div class="step" style="margin-top:8px"><button data-act="ntd:-1" aria-label="少一天">−</button><b id="ntdays">${NT.days}</b><button data-act="ntd:1" aria-label="多一天">+</button><span style="color:var(--mu); font-size:13px">天</span></div>
    <div style="margin-top:16px"><button class="cbtn" data-act="stblankgo">开始</button></div>`); }
function bootTrip(){ window.TD_BOOTED = true; const b = BOOKS2.find(x => x.id === S.curBook) || BOOKS2.find(x => x.trip); if(b && b.trip){ BOOKS2.forEach(x => x.cur = x.id === b.id); S.curBook = b.id; applyTrip(b.trip); restoreBook(b.id); render(); const st = $("start"); st && st.remove(); } else if(!$("start")) openStart(false); }
document.addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if(!b) return; const [a] = b.dataset.act.split(":");
  switch(a){
    case "sttpl": downloadTemplate(); break;
    case "stguide": saveName(); guideStartSheet(); break;
    case "stguidego": { const g = gById(NT.guide); if(!g) return toast("先选一个城市"); const start = ($("ntdate") || {}).value || NT.start; closeSheet(); adoptTrip(tripFromGuide(g.id, start, NT.days)); break; }
    case "stblank": saveName(); blankSheet(); break;
    case "stblankgo": { const name = (($("bkname") || {}).value || "").trim(), city = (($("bkcity") || {}).value || "").trim(), start = ($("bkdate") || {}).value || NT.start; if(!name && !city) return toast("给这本书取个名字"); closeSheet(); adoptTrip(tripBlank(name, start, NT.days, city)); break; }
    case "stjoingo": { saveName(); joinRoom(($("stjoin") || {}).value); break; }
    case "stcodego": { const v = (($("stcode") || {}).value || ""); reclaimCode(v); break; }
    case "stcancel": { const st = $("start"); st && st.remove(); break; }
    
    
  }
});
/* the book buttons: 翻开 / 继续写 switch the whole app to that trip */
document.addEventListener("click", e => { const b = e.target.closest('[data-act="oldbook"], [data-act="soonbook"]'); if(!b) return; const bk = BOOKS2[shelfSel]; if(bk && bk.trip && !bk.cur){ e.stopImmediatePropagation(); useBook(bk.id); toast(`换到「${bk.t}」`); } }, true);
/* ---- every book keeps its own photos, check-ins, expenses, games (shared) and its own packing, tickets, diary (private) ---- */
S.privBy = S.privBy || {};
const freshGames = () => ({ bingo:{}, guess:{ round:null, history:[] } });
const uid8 = () => Math.random().toString(36).slice(2, 10);
function expKey(e){ return e.id || [e.t, e.at, e.rm, e.who].join("|"); }
function stashBook(id){ syncMyDeck(); idsOut();  const b = BOOKS2.find(x => x.id === id); if(!b || !DAYS.length) return;
  EXP.forEach(e => { if(!e.pre && !e.id){ e.id = uid8(); e.u = e.u || Date.now(); } }); S.checkins.forEach(c => { if(!c.id){ c.id = uid8(); } c.u = c.u || Date.now(); });
  b.state = { del: (S.del || []).slice(), album: ALBUM.map(a => a.slice ? a.slice() : a), cmts: JSON.parse(JSON.stringify(CMTS)), exp: EXP.filter(e => !e.pre), checkins: S.checkins.slice(), decisions: S.decisions.slice(), games: S.games, feed: FEED.slice(0, 40) };
  const sig = JSON.stringify([b.state, b.trip, b.look, b.t, b.sub, b.cover]); let h = 5381; for(let i = 0; i < sig.length; i++) h = ((h << 5) + h + sig.charCodeAt(i)) >>> 0; if(b._h !== h){ b._h = h; b.rev = Date.now(); }
  S.privBy[id] = { packed: [...S.packed], wallet: S.wallet.slice(), stubs: S.stubs.slice(), diary: DIARY.map(d => ({ extra: d.extra || "", font: d.font || "" })), voices: VOICES.slice(), liked: [...liked] };  const bb = BOOKS2.find(x => x.id === id); if(bb && bb.state){ S.fx.day = S.fx.day || TDATE(); bb.state.fx = S.fx; bb.state.avatars = { ...(S.roomAvatars || {}), [MEID()]: S.avatar || "" }; } }
function restoreBook(id){ const b = BOOKS2.find(x => x.id === id); if(!b) return; const st = b.state, pv = S.privBy[id];
  S.del = (st && st.del || []).slice(); if(st){ fill2(ALBUM, st.album); Object.keys(CMTS).forEach(k => delete CMTS[k]); Object.assign(CMTS, st.cmts || {}); EXP.push(...(st.exp || [])); fill2(S.checkins, st.checkins); fill2(S.decisions, st.decisions); S.games = st.games || freshGames(); fill2(FEED, st.feed); }
  else if(b._fresh){ ALBUM.length = 0; Object.keys(CMTS).forEach(k => delete CMTS[k]); S.checkins.length = 0; S.decisions.length = 0; S.games = freshGames(); FEED.length = 0; }
  if(pv){ S.packed = new Set(pv.packed || []); fill2(S.wallet, pv.wallet); fill2(S.stubs, pv.stubs); (pv.diary || []).forEach((d, i) => { if(DIARY[i]){ DIARY[i].extra = d.extra; if(d.font) DIARY[i].font = d.font; } }); fill2(VOICES, pv.voices); liked.clear();  }
  else if(b._fresh){ S.packed = new Set(); S.wallet.length = 0; S.stubs.length = 0; VOICES.length = 0; liked.clear(); }
  delete b._fresh; if(typeof syncBingoSet === "function") syncBingoSet(); refreshDerived();  idsIn(); { const b2 = BOOKS2.find(x => x.id === id), st2 = b2 && b2.state; S.roomAvatars = (st2 && st2.avatars) || {}; FRIENDS.forEach((f, k) => { if(k > 0 && f[3] && S.roomAvatars[f[3]]) f[2] = S.roomAvatars[f[3]]; }); S.fx = st2 && st2.fx && st2.fx.day === TDATE() ? st2.fx : freshFx(); } if(typeof syncBingoSet === "function") syncBingoSet(); refreshDerived(); }
function fill2(arr, v){ arr.length = 0; if(Array.isArray(v)) arr.push(...v); }
window.TD_STASH = () => { if(S.curBook) stashBook(S.curBook); };

/* the sync layer hands over data imported from the original app */

/* a buddy's change arrived (or a merge happened): redraw the current book without losing where you are */
/* a buddy's change arrived (or a merge happened): redraw the current book, tell you what's new, keep shared weather going */
window.TD_REFRESH_CUR = () => { const busy = $("sheet").classList.contains("on") || (document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName)); const pf = FEED.slice(), pc = { ...(S.fx.cut || {}) };
  const redraw = () => { const b = BOOKS2.find(x => x.cur); if(!b || !b.trip) return; const keep = { day:S.day, tday:S.tday, diary:S.diary, tab:S.tab, seg:S.seg };
  applyTrip(b.trip); restoreBook(b.id); Object.assign(S, keep); const ae = document.activeElement; if(ae && /INPUT|TEXTAREA/.test(ae.tagName)) return; if(document.getElementById("sheet").classList.contains("on")) return; NOSTAG = true; render(); }; redraw(); notifyNew(pf, pc); reopenPage(); if(busy) window.__needRender = true;
  const a = S.fx && S.fx.atmos; if(a && a.day === TDATE() && atmosKind !== a.kind){ startAtmos(a.kind); if(a.by !== (S.me || "我")) toast(`${a.by} 用了${a.kind === "rain" ? "催雨，下雨了" : "落雪，下雪了"}`); } };

/* ===================== core 2: keepsakes drawn from the real trip ===================== */

const cnDate = iso => `${+iso.slice(0, 4)} 年 ${+iso.slice(5, 7)} 月 ${+iso.slice(8)} 日`;
function spentTotal(){ return EXP.reduce((n, x) => n + (x.rm || (x.cny ? x.cny * TRIP.rate : 0)), 0); }
function paperBody(){ const d = DAYS[TODAY], c = DAYCFG[TODAY], ks = S.checkins.filter(k => k.di === TODAY), nt = DIARY[TODAY], sights = d.items.filter(i => i.kind === "sight").map(i => i.title), foods = S.wallet.filter(w => w.d === TDATE().replace(/-/g, ".")).map(w => w.f), dec = S.decisions.filter(x => x.at === TDATE());
  const head = ks.length ? `${ks[ks.length - 1].title}，到了` : sights.length ? `今天的 ${c.city}：${sights[0]}` : `${c.city}，慢慢走的一天`;
  const p1 = sights.length ? `今天在 ${c.city}，计划是 ${sights.join("、")}。` + (ks.length ? `到目前为止打卡了 ${ks.length} 个地方：${ks.map(k => k.title).join("、")}。` : "还没有人打卡，行程页里每个地方都能盖章。") : `今天在 ${c.city} 没有排行程，自由活动。`;
  const p2 = (foods.length ? `吃了 ${foods.join("、")}，票都撕进票夹了。` : "") + (nt.extra ? nt.extra : "") || "晚上回来写几句，明天的小报会更好看。";
  const games = (dec.length ? `铜钱定了 ${dec.length} 件事：${dec.map(x => `${x.q}（${x.r}）`).join("；")}。` : "今天没有抛铜钱。") + (DK.card ? ` 技能牌：${DK.card} · ${O.CARD[DK.card].name}${DK.used ? "，发动了" : "，还没发动"}。` : " 技能牌还没抽。");
  return { head, paras:[p1, p2], quote: nt.extra ? nt.extra.slice(0, 40) : "", games }; }

function openPaper(){ window.CUR_PAGE = "paper";  const c = DAYCFG[TODAY], d = DAYS[TODAY], ks = S.checkins.filter(k => k.di === TODAY), nt = DIARY[TODAY], nxt = DAYS[TODAY + 1], body = paperBody();
  page(`<div class="scr">${back("每日小报", `<span style="display:flex; gap:6px"><button class="chip" data-act="keeppaper">收进手账</button><button class="chip" data-act="xpaper">存成图片</button></span>`)}
  <article class="paperN"><div class="mast"><b>旅途小报</b><small>THE TRIP DAILY · 第 ${TODAY + 1} 期</small></div>
    <div class="dateline"><span>${cnDate(d.date)} ${wk(d.date)}</span><span>${c.city} · ${c.temp}° ${c.wx}</span></div>
    <div class="lead"><h2>${body.head}</h2><figure style="margin:0" class="ph3wrap"><div class="ph3"><img src="${P[c.photo] || c.photo}" alt="${c.place}"></div><figcaption>${c.place} · ${c.city}${ALBUM.find(a => a[4] === TODAY) ? "" : " · 还没有今天的照片，先用插图"}</figcaption></figure></div>
    <div class="cols2">${body.paras.map(p => `<p>${p}</p>`).join("")}
      <div class="box"><h4>今日数字</h4><div class="nums"><div><b>${HSYM()}${Math.round(todaySpend())}</b><small>今天花了</small></div><div><b>${c.pics}</b><small>张照片</small></div><div><b>${ks.length}</b><small>个打卡</small></div></div></div>
      ${body.quote ? `<p class="quote">「${body.quote}」<br><span style="font-size:11px; font-style:normal; font-family:var(--sans)">—— ${S.me || "我"}，今天的日记</span></p>` : ""}
      <div class="box"><h4>骰子与技能</h4><p style="margin:0; font-size:12px">${body.games}</p></div>
      <div class="box"><h4>明日预告</h4><p style="margin:0; font-size:12px">${nxt ? `D${pad(TODAY + 2)} · ${nxt.items.filter(i => i.kind === "sight").map(i => i.title).slice(0, 3).join("、") || nxt.title || "自由活动"}。` : "明天就回家了，今晚把照片都传上来吧。"}</p></div></div></article></div>`, "#0B0C10"); }
function openReceipt(){ const r = (a, b) => `<div class="r"><span>${a}</span><span>${b}</span></div>`;
  page(`<div class="scr">${back("旅行发票")}<div class="printer"><i></i></div><div class="rclip"><div class="rcpt" id="rcpt">
    <div class="c"><b style="font-size:15px">TRIP DECK</b><br>TRAVEL RECEIPT · 旅行发票</div><hr>
    ${r("TRIP",TRIP.name)}${r("DATE",TRIP.rangeDot)}${r("TRAVELLER",S.me || "我")}${r("WITH",NAMES.slice(1).join(" · ") || "—")}<hr>
    ${r("城市 CITIES",CITIES.length)}${r("打卡 CHECK-INS",S.checkins.length)}${r("美食票 FOOD TICKETS", S.wallet.length)}${r("照片 PHOTOS",ALBUM.length)}${r("技能牌 SKILLS",DK.card ? 1 : 0)}<hr>
    ${r("花费 SPENT",HSYM() + " " + Math.round(spentTotal()).toLocaleString())}${r("预算 BUDGET",HSYM() + " " + TRIP.budget.toLocaleString())}<hr>
    <div class="r tot"><span>TOTAL</span><span>满载而归</span></div><hr>
    <svg viewBox="0 0 200 40" width="100%" height="40" aria-hidden="true">${Array.from({length: 60}, (_, i) => { const w = [1,2,1,3,1,2][i % 6], x = i * 3.3; return `<rect x="${x.toFixed(1)}" y="0" width="${w * .9}" height="34" fill="#1B1A18"/>`; }).join("")}</svg>
    <div class="c" style="font-size:10px">${ROOM() ? ROOM() + "-" : ""}${TRIP.end.replace(/-/g, "")} · THANK YOU · 下次见</div></div></div>
    <div style="padding:20px 20px 0; display:flex; gap:10px"><button class="cbtn ghost" data-act="rtear">撕下来</button><button class="cbtn" data-act="xreceipt">存成图片</button></div></div>`, "#0B0C10");
  requestAnimationFrame(() => { const rc = $("rcpt"); if(!rc) return; rc.classList.add("print"); buzz([5,30,5,30,5,30,5]); }); }
function openPoster(){ const inner = ptpl === "big"
  ? `<img src="${P[dayPhoto(0)] || dayPhoto(0)}" alt=""><span class="pg1"></span><span style="position:absolute; left:18px; top:18px; font-family:var(--mono); font-size:9px; letter-spacing:.24em">TRIP DECK · ${TRIP.start.slice(0, 4)}</span><span style="position:absolute; right:14px; top:14px; width:70px; height:70px; opacity:.85">${sealSVG(TRIP.name.slice(0, 2), (CITIES[0] || {}).en ? CITIES[0].en.toUpperCase() : "TRIP", TRIP.end.slice(5).replace("-", "."), "#FFFFFF", -10)}</span>
     <span style="position:absolute; left:18px; right:18px; bottom:20px"><b style="display:block; font-size:62px; line-height:1; font-weight:800; letter-spacing:-.02em">${CITIES.slice(0, 2).map(c => c.name).join("<br>") || TRIP.name}</b><span style="display:block; font-size:12px; margin-top:12px; opacity:.85">${TRIP.rangeDot}</span><span style="display:flex; gap:14px; margin-top:12px; font-size:11px; border-top:1px solid rgba(255,255,255,.4); padding-top:10px"><span><b style="font-size:18px; display:block">${DAYS.length}</b>天</span><span><b style="font-size:18px; display:block">${ALBUM.length}</b>张照片</span><span><b style="font-size:18px; display:block">${S.checkins.length}</b>枚章</span><span><b style="font-size:18px; display:block">${FRIENDS.length}</b>个人</span></span></span>`
  : `<span class="collage">${(ALBUM.slice(0, 5).map(a => a[0]).concat(PHKEYS)).slice(0, 5).map(k => `<img src="${P[k] || k}" alt="">`).join("")}</span><span style="position:absolute; left:4px; right:4px; bottom:4px; padding:12px 12px 10px; background:#F4EFE4; color:#1B1A18"><b style="font-size:24px; font-weight:800">${TRIP.cityNames.replace(/ · /g, " ")}</b><span style="display:block; font-family:var(--mono); font-size:9px; letter-spacing:.2em; margin-top:2px">${TRIP.range} · TRIP DECK</span></span>`;
  page(`<div class="scr">${back("海报")}<div class="hs" style="justify-content:center">${[["big","大图"],["col","拼贴"]].map(([k, l]) => `<button class="chip ${k === ptpl ? "on" : ""}" data-act="ptpl:${k}">${l}</button>`).join("")}</div>
    <div class="pstage"><div class="poster">${inner}</div></div><div style="padding:20px 20px 0; display:flex; gap:10px"><button class="cbtn ghost" data-act="xshare">分享</button><button class="cbtn" data-act="psave">存到相册</button></div></div>`); }
/* ---- 账本：全部从 EXP 算出来 ---- */
function expRM(e){ return e.rm != null ? +e.rm : (e.cny || 0) * RATE_CNY; }
function myShare(e){ if(e.kind === "transfer") return 0; if(e.splitN) return e.split.includes(0) ? expRM(e) / e.splitN : 0; return e.split.includes(0) ? expRM(e) / e.split.length : 0; }
function balances(){ const out = []; for(let j = 1; j < FRIENDS.length; j++){ let v = 0; EXP.forEach(e => { if(e.kind === "transfer"){ if(e.payer === 0 && e.to === j) v += e.rm; if(e.payer === j && e.to === 0) v -= e.rm; return; } const sh = expRM(e) / (e.splitN || e.split.length), payer = e.payer != null ? e.payer : (e.who === "你" || e.who === "我" ? 0 : NAMES.indexOf(e.who)); if(payer === 0 && e.split.includes(j)) v += sh; if(payer === j && e.split.includes(0)) v -= sh; }); if(Math.abs(v) > .005) out.push({ j, v }); } return out; }
function money(){
  const budget = TRIP.budget || 4000, mine = EXP.reduce((a, e) => a + myShare(e), 0), left = budget - mine, todayL = EXP.filter(e => e.at === TDATE()), today = todayL.reduce((a, e) => a + myShare(e), 0);
  CATS.forEach(c => c[1] = EXP.filter(e => e.c === c[0]).reduce((a, e) => a + myShare(e), 0)); const other = EXP.filter(e => !CATS.some(c => c[0] === e.c)).reduce((a, e) => a + myShare(e), 0);
  const rm = n => HSYM() + " " + n.toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
  const daysLeft = Math.max(1, DAYS.length - (PHASE === "before" ? 0 : TODAY)), bal = balances();
  return `<div class="ph"><div><h1>账本</h1><p>一起的平分，自己的算自己</p><button class="chip" data-act="currency" aria-label="改预算和汇率" style="height:30px; font-size:12px; margin-top:8px">每人预算 ${rm(budget)} · 改</button></div><span style="display:flex; gap:6px"><button class="chip" data-act="transfer">交钱</button><button class="chip on" data-act="addexp">${I("plus",16,2)}记一笔</button></span></div>
  <div class="big"><small style="margin:0 0 2px">还可以花</small><b class="cu">${rm(Math.round(left * 100) / 100)}</b><small>已花 ${rm(Math.round(mine * 100) / 100)}${TRIP.dest !== TRIP.home ? ` · 约 ${DSYM()} ${Math.round(mine / RATE_CNY).toLocaleString()}` : ""}</small></div>
  <div class="pbar" aria-label="预算用了 ${Math.round(mine / budget * 100)}%">${CATS.map(c => `<i style="width:${Math.min(100, c[1] / budget * 100)}%; background:${c[2]}"></i>`).join("")}${other ? `<i style="width:${Math.min(100, other / budget * 100)}%; background:#9FB49A"></i>` : ""}</div>
  <div class="legend">${CATS.filter(c => c[1] > 0).map(c => `<span><i style="background:${c[2]}"></i>${c[0]} ${rm(Math.round(c[1]))}</span>`).join("") || `<span style="color:var(--mu)">还没有花费</span>`}</div>
  <div class="sec" style="display:grid; grid-template-columns:1fr 1fr; gap:12px">
    <div class="card" style="padding:16px"><small style="color:var(--mu)">今天还能花</small><div style="font-size:26px; font-weight:700; margin-top:4px; font-variant-numeric:tabular-nums">${rm(Math.max(0, Math.round(left / daysLeft - today)))}</div><small style="color:var(--mu)">剩下 ${daysLeft} 天平均分</small></div>
    <div class="card" style="padding:16px"><small style="color:var(--mu)">今天已花</small><div style="font-size:26px; font-weight:700; margin-top:4px; font-variant-numeric:tabular-nums">${rm(Math.round(today * 100) / 100)}</div><small style="color:var(--mu)">${todayL.length} 笔</small></div></div>
  <div class="sec"><h2>谁该给谁<span>按到今天的账算</span></h2><div class="card" style="padding:6px 16px">
    ${bal.length ? bal.map(({ j, v }) => `<div class="exp"><span class="ei" style="background:${FRIENDS[j][1]}; color:#0B0C10; font-weight:700">${FRIENDS[j][0]}</span><span><b>${v > 0 ? `${NAMES[j]} 给你` : `你 给 ${NAMES[j]}`}</b><small>${v > 0 ? "你先付的那些" : `${NAMES[j]} 先付的那些`}</small></span><span class="amt"><b>${rm(Math.abs(Math.round(v * 100) / 100))}</b><br><button class="chip" data-act="settle:${j}" style="height:28px; margin-top:4px; font-size:12px">结清</button></span></div>`).join("") : `<p style="font-size:13px; color:var(--mu); margin:10px 0">${FRIENDS.length > 1 ? "大家互不相欠" : "还没有旅伴，记的账都算自己的"}</p>`}</div></div>
  <div class="sec"><h2>最近的账<span>${EXP.length} 笔</span></h2><div class="card" style="padding:4px 16px">
    ${EXP.length ? EXP.slice(0, S.expAll ? EXP.length : 60).map((e, ei) => `<div class="exp" data-act="expedit:${ei}" role="button" tabindex="0" aria-label="改这一笔：${e.t}"><span class="ei" style="background:${e.col}22; color:${e.col}">${I(e.ic,20)}</span><span style="min-width:0"><b>${e.t}</b><small>${e.d} · ${e.payer === 0 || e.who === "你" || e.who === "我" ? "你" : e.who}付的${e.splitN && e.splitN > e.split.length ? ` · ${e.splitN} 人分` : ""}</small></span>
      <span class="amt"><b>${e.cny && TRIP.dest !== TRIP.home ? DSYM() + " " + (+e.cny).toLocaleString() : rm(expRM(e))}</b>${e.cny && TRIP.dest !== TRIP.home ? `<small style="display:block; font-size:11px; color:var(--mu)">${e.real ? "实付" : "≈"} ${rm(expRM(e))}</small>` : ""}<br><span class="av">${e.split.map(k => `<i style="background:${(FRIENDS[k] || FRIENDS[0])[1]}">${(FRIENDS[k] || FRIENDS[0])[0]}</i>`).join("")}</span></span></div>`).join("") : `<p style="font-size:13px; color:var(--mu); margin:10px 0">还没有记账。右上角「记一笔」</p>`}${EXP.length > 60 && !S.expAll ? `<button class="cbtn ghost" data-act="expall" style="margin:10px 0">显示全部 ${EXP.length} 笔</button>` : ""}</div></div>`;
}
document.addEventListener("click", e => { const b = e.target.closest('[data-act^="settle:"]'); if(!b) return; const j = +b.dataset.act.split(":")[1], v = balances().find(x => x.j === j); if(!v) return; EXP.unshift({ t:`结清 · ${v.v > 0 ? NAMES[j] + " 给你" : "你给 " + NAMES[j]}`, c:"其他", ic:"check", col:"#9FB49A", rm:Math.abs(v.v), who:v.v > 0 ? NAMES[j] : "你", payer:v.v > 0 ? j : 0, split:[v.v > 0 ? 0 : j], d:`${+TDATE().slice(5,7)}/${+TDATE().slice(8)} 今天`, at:TDATE(), settle:true }); toast("结清了"); snd("success"); render(); });

IC.gear = '<path d="M10.3 3h3.4l.5 2.4a7 7 0 0 1 1.7 1l2.3-.8 1.7 2.9-1.8 1.6a7 7 0 0 1 0 2l1.8 1.6-1.7 2.9-2.3-.8a7 7 0 0 1-1.7 1l-.5 2.4h-3.4l-.5-2.4a7 7 0 0 1-1.7-1l-2.3.8-1.7-2.9 1.8-1.6a7 7 0 0 1 0-2L4.1 8.5l1.7-2.9 2.3.8a7 7 0 0 1 1.7-1Z"/><circle cx="12" cy="12" r="2.8"/>';
/* ===================== part 12: currencies, editable itinerary, covers, likes, pull-to-refresh, passport ===================== */
const CUR = { MYR:["RM","马币"], CNY:["¥","人民币"], SGD:["S$","新币"], USD:["$","美元"], THB:["฿","泰铢"], JPY:["¥","日元"], KRW:["₩","韩元"], HKD:["HK$","港币"], TWD:["NT$","台币"], VND:["₫","越南盾"], NZD:["NZ$","纽币"], IDR:["Rp","印尼盾"], MOP:["MOP$","澳门币"], EUR:["€","欧元"], GBP:["£","英镑"], AUD:["A$","澳元"] };
const COUNTRY_CUR = { 中国:"CNY", 马来西亚:"MYR", 新加坡:"SGD", 泰国:"THB", 韩国:"KRW", 日本:"JPY", 台湾:"TWD", 越南:"VND", 新西兰:"NZD", 香港:"HKD", 澳门:"MOP", 印度尼西亚:"IDR" };
const HSYM = () => (CUR[TRIP.home] || ["" + TRIP.home])[0], DSYM = () => (CUR[TRIP.dest] || ["" + TRIP.dest])[0], DNAME = () => (CUR[TRIP.dest] || ["", TRIP.dest])[1];
function currencySheet(){ sheet(`<h3>货币与汇率</h3><p class="sub">账本按你自己的货币算，记账时可以直接输当地的价钱</p>
  <div class="lbl">我的货币（预算按它算）</div><div class="pick">${Object.keys(CUR).map(k => `<button class="chip ${TRIP.home === k ? "on" : ""}" data-act="curhome:${k}">${CUR[k][0]} ${k}</button>`).join("")}</div>
  <div class="lbl">去的地方用的货币</div><div class="pick">${Object.keys(CUR).map(k => `<button class="chip ${TRIP.dest === k ? "on" : ""}" data-act="curdest:${k}">${CUR[k][0]} ${k}</button>`).join("")}</div>
  <div class="lbl">汇率：1 ${TRIP.dest} = ? ${TRIP.home}</div><div class="addrow"><input id="curate" inputmode="decimal" value="${RATE_CNY}" placeholder="比如 0.6"><button class="chip" data-act="curfetch" style="height:46px">用今天的</button></div>
  <p style="font-size:12px; color:var(--mu); margin-top:8px">现在：${DSYM()} 100 ≈ ${HSYM()} ${(100 * RATE_CNY).toFixed(2)} · 预算 ${HSYM()} ${TRIP.budget.toLocaleString()}</p>
  <div class="lbl">每人预算（${TRIP.home}）</div><input class="dinput" id="curbudget" inputmode="numeric" value="${TRIP.budget}" style="margin-top:8px">
  <div style="margin-top:14px"><button class="cbtn" data-act="cursave">保存</button></div>`); }
function saveCurrency(){ const r = parseFloat(($("curate") || {}).value); if(r > 0) RATE_CNY = r; const bud = parseFloat(($("curbudget") || {}).value); if(bud > 0) TRIP.budget = bud; TRIP.rate = RATE_CNY; const b = BOOKS2.find(x => x.id === S.curBook); if(b && b.trip){ b.trip.currency = TRIP.home; b.trip.home = TRIP.home; b.trip.dest = TRIP.dest; b.trip.rate = RATE_CNY; b.trip.budget = TRIP.budget; } closeSheet(); toast(`账本按 ${TRIP.home} 算，1 ${TRIP.dest} = ${RATE_CNY} ${TRIP.home}`); if(S.tab === "money"){ NOSTAG = true; render(); } }
async function fetchRate(){ try{ const r = await fetch(`https://api.frankfurter.app/latest?from=${TRIP.dest}&to=${TRIP.home}`); const j = await r.json(); const v = j && j.rates && j.rates[TRIP.home]; if(!v) throw 0; $("curate").value = (+v).toFixed(4); toast("拿到今天的汇率了"); }catch(e){ toast("拿不到汇率（要有网络，部署后可用），先手动填"); } }
/* ---- itinerary: add / edit / delete a stop, written back into the book ---- */
let IT = null;
function tripBack(){ const b = BOOKS2.find(x => x.id === S.curBook); if(b && b.trip) b.trip.days = DAYS.map(d => ({ date:d.date, city:d.city, title:d.title, items:d.items.map(it => ({ id:it.id, cut:it.cut, cutBy:it.cutBy, added:it.added, t:it.t, title:it.title, kind:it.kind, dur:it.dur, main:it.main, note:it.note, spots:it.spots })) })); }
function itemSheet(di, ii){ const it = ii != null ? DAYS[di].items[ii] : null; IT = { di, ii, title:it ? it.title : "", t:it ? it.t : "10:00", kind:it ? it.kind : "sight", dur:it ? it.dur : "1 小时", main:it ? it.main : false };
  const sug = (TRIP.guides || []).flatMap(g => g.spots.map(s => s.n)).concat((TRIP.guides || []).flatMap(g => g.foods.map(f => f.n))).filter(n => !DAYS[di].items.some(x => x.title === n)).slice(0, 14);
  sheet(`<h3>${it ? "改这个安排" : `D${pad(di + 1)} 加一个安排`}</h3><label for="itname" style="position:absolute; left:-9999px">名字</label><input class="dinput" id="itname" placeholder="地方或吃的，比如：鼓浪屿" value="${IT.title}" maxlength="24" style="margin-top:4px">
    ${sug.length ? `<div class="sug">${sug.map(n => `<button class="chip" data-act="itsug:${n}">${n}</button>`).join("")}</div>` : ""}
    <div class="lbl">时间</div><input class="dinput" id="ittime" type="time" value="${IT.t}" style="margin-top:8px">
    <div class="lbl">类型</div><div class="pick">${[["sight","景点"],["food","美食"],["transit","交通"],["lodging","住宿"],["flight","航班"]].map(([k, n]) => `<button class="chip ${IT.kind === k ? "on" : ""}" data-act="itkind:${k}">${n}</button>`).join("")}</div>
    <div class="lbl">停留</div><div class="pick">${["30 分钟","1 小时","2 小时","3 小时","半天"].map(d => `<button class="chip ${IT.dur === d ? "on" : ""}" data-act="itdur:${d}">${d}</button>`).join("")}</div>
    <div class="li" style="margin-top:10px"><span class="tx"><b>主要行程</b><small>技能牌动不了它</small></span><button class="sw" role="switch" aria-checked="${IT.main}" aria-label="主要行程" data-act="itmain"></button></div>
    <div style="display:flex; gap:10px; margin-top:14px">${it ? `<button class="cbtn ghost" data-act="itdel" style="color:#FFB7A6">删掉</button>` : ""}<button class="cbtn" data-act="itsave">${it ? "保存" : "加进去"}</button></div>`); }
function itSave(){ const title = (($("itname") || {}).value || "").trim(); if(!title) return toast("先写名字"); IT.t = ($("ittime") || {}).value || IT.t; const d = DAYS[IT.di];
  if(IT.ii != null) Object.assign(d.items[IT.ii], { title, t:IT.t, kind:IT.kind, dur:IT.dur, main:IT.main }); else d.items.push({ id: itemId(d.date, IT.t, title) + Date.now().toString(36), title, t:IT.t, kind:IT.kind, dur:IT.dur, main:IT.main, note:"", spots:[] });
  d.items.sort((a, b) => a.t.localeCompare(b.t)); tripBack(); applyGeoFor(title); closeSheet(); closeOv(); S.tab = "trip"; S.tday = IT.di; NOSTAG = true; render(); toast(IT.ii != null ? "改好了" : `加进 D${pad(IT.di + 1)} 了`); snd("success"); }
function applyGeoFor(title){ const sp = (TRIP.guides || []).flatMap(g => g.spots).find(s => s.n === title); if(sp && sp.ll && !GEO.find(g => g[0] === title)) GEO.push([title, sp.ll[0], sp.ll[1], [IT.di]]); if(SPOTS[title] == null && sp) SPOTS[title] = { d:sp.d, tip:sp.tip || "" }; }
/* ---- check-in photo straight from the camera ---- */
function bindCkFile(){ const f = $("ckfile"); if(!f || f._b) return; f._b = 1; f.onchange = () => { const file = f.files && f.files[0]; if(!file) return; ALBUM.unshift([URL.createObjectURL(file), 0, 0, DAYS[CK.di].items[CK.ii].title, CK.di]); CK.pic = 0; renderCheckin(); bindCkFile(); toast("照片放进相册了，也用作打卡照"); snd("paper"); }; }
/* ---- pull down to refresh ---- */
(function ptr(){ const v = $("view"); if(!v) return; let y0 = null, pulled = 0; const bar = document.createElement("div"); bar.className = "ptr"; bar.innerHTML = "<span>下拉刷新</span>"; $("app").appendChild(bar);
  v.addEventListener("pointerdown", e => { if(v.scrollTop <= 0) y0 = e.clientY; });
  v.addEventListener("pointermove", e => { if(y0 === null) return; pulled = e.clientY - y0; if(pulled > 30 && v.scrollTop <= 0){ bar.classList.add("on"); bar.firstChild.textContent = pulled > 90 ? "松开刷新" : "下拉刷新"; } });
  const end = async () => { if(y0 === null) return; const go = pulled > 90 && v.scrollTop <= 0; y0 = null; pulled = 0; if(!go){ bar.classList.remove("on"); return; } bar.firstChild.textContent = "刷新中…"; buzz(8);
    try{ if(window.TD_SYNC && window.TD_SYNC.pull) await window.TD_SYNC.pull(); }catch(e){} NOSTAG = true; render(); bar.firstChild.textContent = "已是最新"; setTimeout(() => bar.classList.remove("on"), 700); };
  v.addEventListener("pointerup", end); v.addEventListener("pointercancel", end); })();
document.addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if(!b) return; const [a, x] = b.dataset.act.split(":");
  switch(a){
    case "currency": currencySheet(); break;
    case "curhome": TRIP.home = x; currencySheet(); break;
    case "curdest": TRIP.dest = x; currencySheet(); break;
    case "curfetch": fetchRate(); break;
    case "cursave": saveCurrency(); break;
    case "itadd": itemSheet(+x, null); break;
    case "itedit": { const [, di, ii] = b.dataset.act.split(":"); itemSheet(+di, +ii); break; }
    case "itsug": { const n = $("itname"); n && (n.value = x); const g = (TRIP.guides || []).flatMap(gg => gg.foods).find(f => f.n === x); IT.kind = g ? "food" : "sight"; document.querySelectorAll('#sheet [data-act^="itkind:"]').forEach(s => s.classList.toggle("on", s.dataset.act === "itkind:" + IT.kind)); break; }
    case "itkind": IT.kind = x; document.querySelectorAll('#sheet [data-act^="itkind:"]').forEach(s => s.classList.toggle("on", s === b)); break;
    case "itdur": IT.dur = x; document.querySelectorAll('#sheet [data-act^="itdur:"]').forEach(s => s.classList.toggle("on", s === b)); break;
    case "itmain": IT.main = !IT.main; b.setAttribute("aria-checked", IT.main); break;
    case "itsave": itSave(); break;
    case "itdel": { const d = DAYS[IT.di], ii = IT.ii; const [it] = d.items.splice(ii, 1); tripBack(); closeSheet(); closeOv(); S.tab = "trip"; NOSTAG = true; render(); undoBar(`删掉了「${it.title}」`, () => { d.items.splice(Math.min(ii, d.items.length), 0, it); tripBack(); NOSTAG = true; render(); }); break; }
    
    
    
    case "photos2": openAlbum(); break;
    
    case "likers": { const [, i] = b.dataset.act.split(":"); const L = (ALBUM[+i][5] || []).map(n => n === myLikeName() ? "你" : n); sheet(`<h3>${L.length} 个赞</h3>${L.length ? `<div class="likers">${L.map(n => `<i>${n}</i>`).join("")}</div>` : `<p style="font-size:13px; color:var(--mu)">还没有人点赞，双击照片就能点</p>`}`); break; }
    case "coverpick": { const [, bi, ai] = b.dataset.act.split(":"); const bk = BOOKS2[+bi]; bk.cover = ALBUM[+ai][0]; bk.look.win = true; decoRefresh(); toast("封面换好了"); break; }
  }
});
document.addEventListener("change", e => { if(e.target.id === "coverfile"){ const f = e.target.files && e.target.files[0]; if(!f) return; const bk = BOOKS2[DI]; bk.cover = URL.createObjectURL(f); bk.look.win = true; ALBUM.unshift([bk.cover, 0, 0, "封面", TODAY]); decoRefresh(); toast("封面换好了"); } });

document.addEventListener("input", e => { if(e.target.id === "aenote" && typeof AE !== "undefined" && AE) AE.note = e.target.value; });
/* album grid: one tap opens the photo, a quick second tap likes it instead */
(function(){ let tmr = 0, last = -1;
  document.addEventListener("click", e => { const t = e.target.closest('[data-act^="aopen:"]'); if(!t) return; e.stopImmediatePropagation(); e.preventDefault(); const i = +t.dataset.act.split(":")[1];
    if(tmr && last === i){ clearTimeout(tmr); tmr = 0; if(!liked.has(i)){ liked.add(i); likeBurst(i); } const lk = document.querySelector(`#ov-x [data-act="alike:${i}"]`); if(lk){ lk.classList.add("on"); lk.setAttribute("aria-pressed", "true"); lk.innerHTML = `${I("heart",13,2)}${(ALBUM[i][5] || []).length + 1}`; } buzz(8); snd("click"); return; }
    clearTimeout(tmr); last = i; tmr = setTimeout(() => { tmr = 0; openViewer(i); }, 260); }, true); })();

/* ===================== part 13: bingo + 猜价格 shared by everyone in the room ===================== */
let _meid = null; const MEID = () => window.TD_UID || _meid || (() => { try{ _meid = localStorage.getItem("td3:meid"); }catch(e){} if(!_meid){ _meid = "l" + Math.random().toString(36).slice(2, 10); try{ localStorage.setItem("td3:meid", _meid); }catch(e){} } return _meid; })();
const MYNAME = () => S.me || "我";
S.games = { bingo:{}, guess:{ round:null, history:[] } };
const nowISO = () => new Date().toISOString();
const colorOfName = n => { const i = NAMES.indexOf(n); return (FRIENDS[i >= 0 ? (i === 0 ? 0 : i) : 0] || FRIENDS[0])[1]; };
const personKey = i => i === 0 ? MEID() : "n:" + NAMES[i];
/* merge two copies of the game state (used when saving and when someone else's change arrives) */
function mergeGames(a, b){ a = a || {}; b = b || {}; const out = { bingo:{}, guess:{ round:null, history:[] }, deck:{} };
  const da = a.deck || {}, db = b.deck || {}; new Set([...Object.keys(da), ...Object.keys(db)]).forEach(k => { const x = da[k], y = db[k]; out.deck[k] = !x ? y : !y ? x : ((x.at || 0) > (y.at || 0) ? x : y); });
  const ab = a.bingo || {}, bb = b.bingo || {}; new Set([...Object.keys(ab), ...Object.keys(bb)]).forEach(k => { const x = ab[k], y = bb[k]; out.bingo[k] = !x ? y : !y ? x : (x.at > y.at ? x : y); });
  const ag = a.guess || {}, bg = b.guess || {}, hist = {}; [...(ag.history || []), ...(bg.history || [])].forEach(r => { hist[r.id] = r; });
  const ra = ag.round, rb = bg.round; let r = null;
  if(ra && rb && ra.id === rb.id){ r = { ...ra, guesses:{ ...(rb.guesses || {}) } }; Object.entries(ra.guesses || {}).forEach(([k, g]) => { const o = r.guesses[k]; if(!o || g.at > o.at) r.guesses[k] = g; }); r.price = ra.price != null ? ra.price : rb.price; r.revealBy = ra.revealBy || rb.revealBy; if(ra.closed || rb.closed) r.closed = true; }
  else r = !ra ? rb : !rb ? ra : (ra.at > rb.at ? ra : rb);
  [ra, rb].forEach(x => { if(x && r && x.id !== r.id && x.price != null) hist[x.id] = x; });
  if(r && r.closed){ hist[r.id] = r; r = null; }
  out.guess.round = r; out.guess.history = Object.values(hist).sort((x, y) => y.at.localeCompare(x.at)).slice(0, 20); return out; }
/* ---- 城市宾果: one board for the whole room ---- */
function syncBingoSet(){ bingo.clear(); Object.entries(S.games.bingo).forEach(([k, v]) => { if(v && v.on) bingo.add(+k); }); }
function bingoToggle(i, btn){ const before = bingoLines().length, cur = S.games.bingo[i], on = !(cur && cur.on);
  S.games.bingo[i] = { on, by:MYNAME(), id:MEID(), at:nowISO() }; syncBingoSet(); buzz(8); snd(on ? "stamp" : "tap");
  if(on) FEED.unshift({ a:0, t:`${MYNAME()} 在宾果盖了「${BTASK[i]}」`, s:"城市宾果", ic:"grid" });
  const after = bingoLines().length; NOSTAG = true; openBingo(); if(after > before){ confetti(); toast(`连成 ${after} 条线了！`); FEED.unshift({ a:0, t:`宾果连成 ${after} 条线`, s:"城市宾果", ic:"grid" }); } }
function openBingo(){ window.CUR_PAGE = "bingo";  syncBingoSet(); const lines = bingoLines(), inL = new Set(lines.flat()), c = i => [(i % 4) * 25 + 12.5, Math.floor(i / 4) * 25 + 12.5];
  const recent = Object.entries(S.games.bingo).filter(([, v]) => v && v.on).sort((x, y) => y[1].at.localeCompare(x[1].at)).slice(0, 4);
  page(`<div class="scr">${back("城市宾果")}<div class="pt2" style="padding-top:0"><p>房间里所有人共用一张卡，谁做到谁点一下盖章，横竖斜连成一条线就赢</p></div>
    ${FRIENDS.length < 2 ? `<p class="roomnote">现在房间里只有你。旅伴用邀请码加入后，他们盖的章会实时出现在这张卡上。</p>` : ""}
    <div class="bingo" style="position:relative; margin-top:12px">${BTASK.map((t, i) => { const v = S.games.bingo[i]; const on = v && v.on; return `<button data-act="bcell:${i}" aria-pressed="${!!on}" class="${inL.has(i) ? "ln line" : ""}" aria-label="${t}${on ? `，${v.by} 盖的` : ""}"><span class="mk">做到</span><span>${t}</span>${on ? `<i class="by" style="background:${colorOfName(v.by === MYNAME() ? "你" : v.by)}">${(v.by || "?").slice(0, 1)}</i>` : ""}</button>`; }).join("")}
      <svg class="lineSvg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lines.map(l => { const [x0, y0] = c(l[0]), [x1, y1] = c(l[3]); return `<path pathLength="1" d="M${x0} ${y0}L${x1} ${y1}"/>`; }).join("")}</svg></div>
    <div class="bbanner ${lines.length ? "on" : ""}">连成 ${lines.length} 条线了</div>
    <p style="text-align:center; font-size:12px; color:var(--mu); margin:14px 0 0">${bingo.size} / 16 件 · 结果会写进今晚的小报</p>
    ${recent.length ? `<div class="blog">${recent.map(([k, v]) => `${v.by} 盖了「${BTASK[k]}」`).join("<br>")}</div>` : ""}</div>`); }
/* ---- 猜价格: a real round everyone joins ---- */
let GP = { food:null, mine:null };
function guessRound(){ return S.games.guess.round; }
function openGuess(){ window.CUR_PAGE = "guess";  const r = guessRound(), foods = GITEMS.map(g => g[0]);
  if(!r){ if(!GP.food) GP.food = foods[0] || "";
    page(`<div class="scr">${back("猜价格")}<div class="pt2" style="padding-top:0"><p>付钱前开一局：每个人在自己手机上偷偷猜，付钱的人填真实价格，最接近的人下一顿不用排队。</p></div>
      <div class="sec"><h2>猜什么</h2>${foods.length ? `<div class="gfoods">${foods.slice(0, 12).map(f => `<button data-act="gpfood:${f}" aria-pressed="${GP.food === f}"><span class="ink" style="display:block">${FOODART[f] || (O && O.foodArt ? O.foodArt(f) : "")}</span>${f}</button>`).join("")}</div>` : ""}
        <label for="gpname" style="display:block; font-size:12px; color:var(--mu); margin-top:12px">或者自己写</label><input class="dinput" id="gpname" maxlength="16" placeholder="比如：这杯奶茶" value="${foods.includes(GP.food) ? "" : GP.food || ""}" style="margin-top:8px"></div>
      <div style="padding:16px 20px 0"><button class="cbtn" data-act="gpstart">开一局，叫大家来猜</button></div>${guessHistory()}</div>`); return; }
  const G = r.guesses || {}, mine = G[MEID()], revealed = r.price != null, rows = [];
  const used = new Set(); FRIENDS.forEach((f, i) => { let key = personKey(i), g = G[key]; if(!g && i > 0){ const hit = Object.entries(G).find(([k, v]) => v.name === NAMES[i] && !used.has(k)); if(hit){ key = hit[0]; g = hit[1]; } } if(g) used.add(key); rows.push({ i, key, name: i === 0 ? "你" : NAMES[i], g }); });
  Object.entries(G).forEach(([key, g]) => { if(!used.has(key) && !rows.some(x => x.key === key)) rows.push({ i:-1, key, name:g.name, g }); });
  const done = rows.filter(x => x.g), best = revealed && done.length ? done.reduce((a, b) => Math.abs(b.g.v - r.price) < Math.abs(a.g.v - r.price) ? b : a).key : null;
  page(`<div class="scr">${back("猜价格")}<div class="gp-photo ink">${FOODART[r.food] || (O && O.foodArt ? O.foodArt(r.food) : "")}<span style="position:absolute; left:16px; bottom:14px; font-size:13px; color:rgba(255,255,255,.8)">${r.by} 开的一局</span></div>
    <div class="pt2"><h1 style="font-size:24px">${r.food} 多少钱？</h1><p>${revealed ? `实际价格 ${DSYM()} ${r.price}，${r.revealBy || ""}揭晓的` : `${done.length} / ${rows.length} 个人猜好了 · 没揭晓前看不到别人的数字`}</p></div>
    ${!revealed && !mine ? `<div class="sec"><div class="card" style="padding:16px"><label for="gpmine" style="font-size:12px; color:var(--mu)">你猜多少（${DSYM()}）</label><div class="gbig" id="gpmv">${DSYM()} ${GP.mine || 20}</div><input id="gpmine" type="range" min="1" max="200" value="${GP.mine || 20}" style="width:100%; margin-top:8px"><div style="margin-top:12px"><button class="cbtn" data-act="gpsend">交上去</button></div></div></div>` : ""}
    <div class="sec"><div class="card" style="padding:4px 16px">${rows.map(x => `<div class="gq">${x.i >= 0 ? av(x.i, 34) : `<span class="dot-av" style="width:34px; height:34px; background:#9FB8D8">${x.name.slice(0, 1)}</span>`}<span class="nm">${x.name}</span>
        <span class="st">${x.g ? (revealed ? `差 ${Math.abs(x.g.v - r.price).toFixed(x.g.v % 1 || r.price % 1 ? 1 : 0)}` : "已经猜好了") : revealed ? "没猜" : x.i > 0 && !window.TD_MEMBERS ? `<span style="display:flex; gap:6px; align-items:center"><input id="gpfor${x.i}" inputmode="decimal" placeholder="帮他填" aria-label="帮${x.name}填"><button class="chip" data-act="gpfor:${x.i}" style="height:38px">好</button></span>` : "还在想…"}</span>
        <span class="v">${x.g ? (revealed || x.key === MEID() ? `${DSYM()} ${x.g.v}` : "?") : ""}</span>${best === x.key ? '<span class="crown">最接近</span>' : ""}</div>`).join("")}</div></div>
    ${!revealed ? `<div class="sec"><label for="gpprice" style="font-size:12px; color:var(--mu)">付钱的人填实际价格（${DSYM()}）</label><div class="addrow"><input id="gpprice" inputmode="decimal" placeholder="比如 28"><button class="chip on" data-act="gpreveal" style="height:46px">揭晓</button></div></div>`
      : `<div style="padding:16px 20px 0; display:flex; gap:10px"><button class="cbtn ghost" data-act="gpcancel">收起这局</button><button class="cbtn" data-act="gpnew">再开一局</button></div>`}
    ${!revealed ? `<div style="padding:10px 20px 0"><button class="cbtn ghost" data-act="gpcancel">取消这局</button></div>` : ""}${guessHistory()}</div>`);
  const rg = $("gpmine"); if(rg) rg.oninput = () => { GP.mine = +rg.value; $("gpmv").textContent = `${DSYM()} ${GP.mine}`; }; }
function guessHistory(){ const H = S.games.guess.history.filter(r => r.price != null).slice(0, 5); if(!H.length) return "";
  return `<div class="sec ghist"><h2>之前几局</h2><div class="card" style="padding:4px 16px">${H.map(r => { const G = Object.values(r.guesses || {}); const w = G.length ? G.reduce((a, b) => Math.abs(b.v - r.price) < Math.abs(a.v - r.price) ? b : a) : null; return `<div class="li"><span class="tx"><b>${r.food} · ${DSYM()} ${r.price}</b><small>${w ? `${w.name} 最接近（猜 ${w.v}）` : "没人猜"} · ${G.length} 个人参加</small></span></div>`; }).join("")}</div></div>`; }
function setGuess(key, name, v){ const r = guessRound(); if(!r) return; r.guesses = r.guesses || {}; r.guesses[key] = { name, v:+v, at:nowISO() }; }
document.addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if(!b) return; const [a, x] = b.dataset.act.split(":");
  switch(a){
    case "gpfood": GP.food = x; document.querySelectorAll('#ov-x [data-act^="gpfood:"]').forEach(s => s.setAttribute("aria-pressed", s === b)); { const n = $("gpname"); n && (n.value = ""); } snd("tap"); break;
    case "gpstart": { const typed = (($("gpname") || {}).value || "").trim(), food = typed || GP.food; if(!food) return toast("先选一样或者写一样");
      S.games.guess.round = { id:"g" + Date.now().toString(36), food, by:MYNAME(), byId:MEID(), at:nowISO(), price:null, guesses:{} }; GP.mine = 20; FEED.unshift({ a:0, t:`${MYNAME()} 开了一局猜价格：${food}`, s:"快去猜", ic:"tag" }); notifyRoom(`${MYNAME()} 开了一局猜价格：${food}，快来猜`, "guess"); snd("shuffle"); NOSTAG = true; openGuess(); toast("开好了，旅伴打开「猜价格」就能猜"); break; }
    case "gpsend": setGuess(MEID(), MYNAME(), GP.mine || 20); snd("stamp"); buzz(10); NOSTAG = true; openGuess(); toast("交上去了，揭晓前别人看不到"); break;
    case "gpfor": { const i = +x, v = parseFloat(($("gpfor" + i) || {}).value); if(!(v > 0)) return toast("填一个数字"); setGuess(personKey(i), NAMES[i], v); NOSTAG = true; openGuess(); break; }
    case "gpreveal": { const v = parseFloat(($("gpprice") || {}).value); if(!(v > 0)) return toast("先填实际价格"); const r = guessRound(); r.price = v; r.revealBy = MYNAME(); snd("reveal"); buzz([10, 40, 10]); NOSTAG = true; openGuess();
      const G = Object.values(r.guesses || {}); if(G.length){ const w = G.reduce((p, q) => Math.abs(q.v - v) < Math.abs(p.v - v) ? q : p); confetti(); FEED.unshift({ a:0, t:`猜价格：${w.name} 最接近`, s:`${r.food} 实际 ${DSYM()} ${v}`, ic:"tag" }); } break; }
    case "gpnew": case "gpcancel": { const r = guessRound(); if(r){ r.closed = true; if(r.price != null) S.games.guess.history.unshift(r); } S.games.guess.round = null; GP.food = null; NOSTAG = true; openGuess(); break; }
  }
});
/* the sync layer calls this when someone else's change arrives */
window.TD_GAMES = { get: () => S.games, merge: (incoming) => { S.games = mergeGames(S.games, incoming); syncBingoSet(); const o = $("ov-x"); if(o && o.classList.contains("on")){ const t = (o.querySelector(".ph h1, .ovtop h1, h1") || {}).textContent || ""; if(t.includes("城市宾果")){ NOSTAG = true; openBingo(); } else if(t.includes("猜价格") && !document.activeElement.closest("#ov-x input")){ NOSTAG = true; openGuess(); } } } };

/* ===================== part 14: food choice, real steps, cute avatars, passport book, keeps, two currencies, transfers ===================== */
/* ---------- cute avatars ---------- */
const AVS = ["cat","bunny","bear","panda","fox","frog","chick","penguin","tiger","koala","pig","dog"];
const AV_N = { cat:"猫猫", bunny:"兔兔", bear:"小熊", panda:"熊猫", fox:"狐狸", frog:"青蛙", chick:"小鸡", penguin:"企鹅", tiger:"老虎", koala:"考拉", pig:"小猪", dog:"狗狗" };
function avatarSVG(k){ if(typeof k === "string" && k.startsWith("img:")) return `<img src="${k.slice(4)}" alt="" style="width:100%; height:100%; object-fit:cover; display:block; border-radius:50%">`; const eye = (x, y) => `<circle cx="${x}" cy="${y}" r="4.2" fill="#2B2A28"/><circle cx="${x + 1.4}" cy="${y - 1.6}" r="1.4" fill="#fff"/>`, cheek = `<ellipse cx="31" cy="62" rx="6" ry="3.6" fill="#EE8A6B" opacity=".55"/><ellipse cx="69" cy="62" rx="6" ry="3.6" fill="#EE8A6B" opacity=".55"/>`, mouth = `<path d="M45 62q5 5 10 0" fill="none" stroke="#2B2A28" stroke-width="2.4" stroke-linecap="round"/>`;
  const face = (c, extra = "", ears = "", muzzle = "") => `<svg viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" fill="#F4EFE4"/>${ears}<circle cx="50" cy="56" r="34" fill="${c}"/>${muzzle}${extra}${eye(38, 52)}${eye(62, 52)}${cheek}${mouth}</svg>`;
  switch(k){
    case "cat": return face("#F0C24B", `<path d="M30 40l4 6M70 40l-4 6" stroke="#D49A3A" stroke-width="2"/>`, `<path d="M22 40L28 12l20 18Z M78 40L72 12 52 30Z" fill="#F0C24B"/><path d="M27 34l3-14 9 10Z M73 34l-3-14-9 10Z" fill="#EE8A6B" opacity=".6"/>`);
    case "bunny": return face("#F4EFE4", "", `<ellipse cx="36" cy="18" rx="8" ry="22" fill="#F4EFE4" stroke="#E6DCC6" stroke-width="2"/><ellipse cx="64" cy="18" rx="8" ry="22" fill="#F4EFE4" stroke="#E6DCC6" stroke-width="2"/><ellipse cx="36" cy="20" rx="3.5" ry="14" fill="#EBB5B0"/><ellipse cx="64" cy="20" rx="3.5" ry="14" fill="#EBB5B0"/>`).replace('<circle cx="50" cy="56" r="34" fill="#F4EFE4"/>', '<circle cx="50" cy="56" r="34" fill="#FFFFFF" stroke="#E6DCC6" stroke-width="2"/>');
    case "bear": return face("#C9A274", "", `<circle cx="24" cy="30" r="12" fill="#C9A274"/><circle cx="76" cy="30" r="12" fill="#C9A274"/><circle cx="24" cy="30" r="6" fill="#8A5A3A" opacity=".5"/><circle cx="76" cy="30" r="6" fill="#8A5A3A" opacity=".5"/>`, `<ellipse cx="50" cy="64" rx="13" ry="10" fill="#E6DCC6"/><ellipse cx="50" cy="59" rx="4" ry="3" fill="#2B2A28"/>`);
    case "panda": return face("#FFFFFF", `<ellipse cx="37" cy="52" rx="9" ry="11" fill="#2B2A28" transform="rotate(-20 37 52)"/><ellipse cx="63" cy="52" rx="9" ry="11" fill="#2B2A28" transform="rotate(20 63 52)"/>`, `<circle cx="24" cy="28" r="11" fill="#2B2A28"/><circle cx="76" cy="28" r="11" fill="#2B2A28"/>`).replace(/<circle cx="(38|62)" cy="52" r="4.2" fill="#2B2A28"\/>/g, '<circle cx="$1" cy="52" r="4.2" fill="#FFFFFF"/>').replace(/<circle cx="(39.4|63.4)" cy="50.4" r="1.4" fill="#fff"\/>/g, '<circle cx="$1" cy="51" r="2" fill="#2B2A28"/>');
    case "fox": return face("#E8743B", "", `<path d="M20 44L24 10l22 22Z M80 44L76 10 54 32Z" fill="#E8743B"/><path d="M25 32l2-14 10 10Z M75 32l-2-14-10 10Z" fill="#F4EFE4"/>`, `<path d="M22 60q28 30 56 0q-10 26-28 26T22 60Z" fill="#FFFFFF"/><ellipse cx="50" cy="66" rx="4" ry="3" fill="#2B2A28"/>`);
    case "frog": return face("#7FB069", "", `<circle cx="32" cy="28" r="13" fill="#7FB069"/><circle cx="68" cy="28" r="13" fill="#7FB069"/><circle cx="32" cy="28" r="7" fill="#fff"/><circle cx="68" cy="28" r="7" fill="#fff"/>`).replace(/cy="52" r="4.2"/g, 'cy="28" r="4.2"').replace(/cy="50.4" r="1.4"/g, 'cy="26.4" r="1.4"').replace('<path d="M45 62q5 5 10 0"', '<path d="M38 62q12 10 24 0"');
    case "chick": return face("#F0C24B", `<path d="M44 60l6 6 6-6Z" fill="#E8743B"/>`, `<path d="M46 22q4-12 8 0q6-8 6 4" fill="none" stroke="#D49A3A" stroke-width="3" stroke-linecap="round"/>`).replace(mouth, "");
    case "penguin": return face("#2B3A5A", `<ellipse cx="50" cy="60" rx="24" ry="26" fill="#FFFFFF"/><path d="M44 62l6 5 6-5Z" fill="#F0C24B"/>`).replace(mouth, "");
    case "tiger": return face("#E8743B", `<path d="M50 24v10M44 26l2 8M56 26l-2 8M18 52h10M18 60h9M82 52H72M82 60h-9" stroke="#2B2A28" stroke-width="3" stroke-linecap="round"/>`, `<circle cx="24" cy="30" r="10" fill="#E8743B"/><circle cx="76" cy="30" r="10" fill="#E8743B"/><circle cx="24" cy="30" r="5" fill="#F4EFE4"/><circle cx="76" cy="30" r="5" fill="#F4EFE4"/>`, `<ellipse cx="50" cy="66" rx="14" ry="10" fill="#F4EFE4"/><ellipse cx="50" cy="61" rx="4" ry="3" fill="#2B2A28"/>`);
    case "koala": return face("#9FA6AD", "", `<circle cx="20" cy="40" r="16" fill="#9FA6AD"/><circle cx="80" cy="40" r="16" fill="#9FA6AD"/><circle cx="20" cy="40" r="9" fill="#EBB5B0" opacity=".7"/><circle cx="80" cy="40" r="9" fill="#EBB5B0" opacity=".7"/>`, `<ellipse cx="50" cy="62" rx="7" ry="9" fill="#2B2A28"/>`).replace(mouth, "");
    case "pig": return face("#EBB5B0", "", `<path d="M22 36L26 16l16 12Z M78 36L74 16 58 28Z" fill="#EBB5B0"/>`, `<ellipse cx="50" cy="64" rx="11" ry="8" fill="#E39A93"/><circle cx="46" cy="64" r="2.2" fill="#8A4A44"/><circle cx="54" cy="64" r="2.2" fill="#8A4A44"/>`).replace(mouth, "");
    default: return face("#D9B48A", "", `<ellipse cx="20" cy="50" rx="10" ry="20" fill="#8A5A3A"/><ellipse cx="80" cy="50" rx="10" ry="20" fill="#8A5A3A"/>`, `<ellipse cx="50" cy="64" rx="12" ry="9" fill="#F4EFE4"/><ellipse cx="50" cy="60" rx="4.5" ry="3.4" fill="#2B2A28"/>`);
  } }
function avHTML(k, s = 40){ const f = FRIENDS[k] || FRIENDS[0]; if(f && f[2]) return `<span class="cav" style="width:${s}px; height:${s}px">${avatarSVG(f[2])}</span>`; return `<span class="dot-av" style="width:${s}px; height:${s}px; background:${f[1]}; font-size:${s * .36}px">${f[0]}</span>`; }
function avatarSheet(i = 0){ const cur = (FRIENDS[i] || [])[2];
  sheet(`<h3>${i === 0 ? "选一个头像" : `给 ${NAMES[i]} 选头像`}</h3><p class="sub">护照、旅伴、打卡和留言都会用它</p>
    ${i === 0 ? `<label class="avphoto">${cur && cur.startsWith("img:") ? `<img src="${cur.slice(4)}" alt="现在的头像">` : `<span>${I("camera",22)}</span>`}<b>用自己的照片</b><small>自拍一张，或从相册选</small><input type="file" accept="image/*" capture="user" id="avfile" style="position:absolute; width:1px; height:1px; opacity:0"></label>` : ""}
    <div class="lbl">或者选一个可爱的</div><div class="avgrid">${AVS.map(k => `<button data-act="avpick:${i}:${k}" aria-pressed="${cur === k}" aria-label="${AV_N[k]}">${avatarSVG(k)}</button>`).join("")}</div>
    <div style="margin-top:14px"><button class="cbtn ghost" data-act="avpick:${i}:">不用头像，只显示名字</button></div>`);
  const f = $("avfile"); if(f) f.onchange = () => { const file = f.files && f.files[0]; if(!file) return; const im = new Image(); im.onload = () => { const c = document.createElement("canvas"), N = 256; c.width = c.height = N; const s0 = Math.min(im.width, im.height), cx = c.getContext("2d");
    cx.drawImage(im, (im.width - s0) / 2, (im.height - s0) / 2 * .8, s0, s0, 0, 0, N, N); const url = c.toDataURL("image/jpeg", .82); URL.revokeObjectURL(im.src);
    S.avatar = "img:" + url; FRIENDS[0][2] = S.avatar; closeSheet(); toast("换成你的照片了"); snd("success"); NOSTAG = true; render(); }; im.onerror = () => toast("这张照片打不开"); im.src = URL.createObjectURL(file); }; }
/* ---------- 撕美食票: pick any local dish, or write your own ---------- */
function tFoods(){ const g = (TRIP.guides || []).find(x => x.id === (tcity || {}).id); return g ? g.foods.map(f => f.n) : []; }
function renderTfoods(){ let el = $("tfoods"); if(!el){ const c = $("tcities"); if(!c) return; c.insertAdjacentHTML("afterend", '<div class="tfoods" id="tfoods"></div>'); el = $("tfoods"); }
  el.innerHTML = `<button class="chip" data-act="tfoodown" style="border-style:dashed">${I("plus",14,2)}自己写一样</button>` + tFoods().map(f => `<button class="chip ${tcity && tcity.food === f ? "on" : ""}" data-act="tfood:${f}">${f}</button>`).join(""); }
function setTfood(f){ tcity = { ...cityById(tcity.id), food:f }; if(!FOODS[f]) FOODS[f] = { en:"", mean:"" }; renderTcities(); renderTfoods();
  if(renderer){ drawTicket(stripTex.image, true); stripTex.needsUpdate = true; drawTicket(rollTex.image, false); rollTex.needsUpdate = true; capTex.image = capCanvas(); capTex.needsUpdate = true; kick(); }
  if(tstate === "done") tagain(); else { tstate = "idle"; animLen(TAIL, 300); renderTctl(); } snd("tap"); }
function renderTcities(){ $("tcities").innerHTML = CITIES.map(c => `<button class="chip" aria-pressed="${tcity && c.id === tcity.id}" data-act="tcity:${c.id}"><i style="width:10px; height:10px; border-radius:50%; background:${c.color}"></i>${c.name}</button>`).join(""); }
/* ---------- steps: keep counting and show it everywhere ---------- */

function onShake(cb){ let last = 0, prev = null; return onMotion(a => { const now = performance.now(), cur = [a.x || 0, a.y || 0, a.z || 0]; if(prev){ const j = Math.hypot(cur[0] - prev[0], cur[1] - prev[1], cur[2] - prev[2]); if(j > 13 && now - last > 600){ last = now; cb(); } } prev = cur; }); }
document.addEventListener("visibilitychange", () => { if(!document.hidden && S.tab === "home" && DAYS.length){ NOSTAG = true; render(); } });
/* ---------- check-in: no photo is pre-selected, and a photo used once isn't offered again ---------- */
function ckPics(){ const used = new Set(S.checkins.map(c => c.photo).filter(Boolean)); return ALBUM.filter(a => a[4] === CK.di && !used.has(a[0])).map(a => a[0]).slice(0, 4); }
/* ---------- passport: a real little book you swipe through ---------- */
function openPassport(open){ window.CUR_PAGE = "passport";  const me = S.me || "我", stamps = okCheckins().map(k => [k.photo || dayPhoto(k.di), k.title, cityEn(k.city)]), vis = CITIES.map(c => ({ c, first:okCheckins().find(k => k.city === c.name) }));
  const pages = [];
  pages.push(`<section class="ppg"><h4><span>PASPORT · 旅行护照</span><span>No. TD${TRIP.start.replace(/-/g, "")}</span></h4><div class="ppid"><button class="ph" data-act="avsheet:0" aria-label="换头像">${FRIENDS[0][2] ? `<span class="cav">${avatarSVG(FRIENDS[0][2])}</span>` : `<span style="font-size:44px; font-weight:700; color:#8A7A6A">${me.slice(0, 1)}</span>`}</button>
    <dl><dt>姓名 · NAME</dt><dd>${me}</dd><dt>旅行 · TRIP</dt><dd>${TRIP.name}</dd><dt>日期 · DATE</dt><dd>${TRIP.rangeDot}</dd><dt>同行 · WITH</dt><dd>${NAMES.slice(1).join(" · ") || "—"}</dd></dl></div>
    <p style="font-size:11px; color:#8A7A6A; margin-top:14px">点照片可以换一个可爱的头像</p>
    <div class="mrz">P&lt;MYS${me.replace(/\s/g, "").toUpperCase()}&lt;&lt;TRIPDECK&lt;&lt;&lt;&lt;&lt;&lt;<br>TD${TRIP.start.replace(/-/g, "")}MYS${TRIP.end.replace(/-/g, "").slice(2)}&lt;&lt;&lt;${S.checkins.length}</div><span class="no">— 1 —</span></section>`);
  pages.push(`<section class="ppg"><h4><span>入境章 · ENTRY</span><span>${vis.filter(v => v.first).length} / ${CITIES.length}</span></h4><div class="ppseals">${vis.map((v, i) => v.first ? `<div>${sealSVG(v.c.name, v.c.en.toUpperCase(), v.first.date.replace(/-/g, "."), v.c.color, i % 2 ? 6 : -8)}</div>` : `<div style="opacity:.3; filter:grayscale(1)">${sealSVG(v.c.name, v.c.en.toUpperCase(), "", "#8a8a8a", 0)}</div>`).join("")}</div>
    <p style="font-size:12px; color:#7A6A5A; margin-top:16px; line-height:1.6">到了一个城市，第一次打卡就会盖上入境章。</p>
    <h4 style="margin-top:22px"><span>城市勋章 · MEDALS</span><span>5 枚一枚</span></h4>${CITIES.map(c => { const h = Math.min(5, S.checkins.filter(k => k.city === c.name).length); return `<div style="display:flex; align-items:center; gap:10px; margin-top:8px"><span style="width:34px; height:34px; border-radius:50%; border:2px ${h >= 5 ? "solid" : "dashed"} ${c.color}; color:${c.color}; display:grid; place-items:center; font-family:var(--serif)">${c.name.slice(0, 1)}</span><span style="flex:1; height:6px; border-radius:3px; background:rgba(0,0,0,.08)"><i style="display:block; height:100%; width:${h * 20}%; border-radius:3px; background:${c.color}"></i></span><span style="font-size:12px">${h} / 5</span></div>`; }).join("")}<span class="no">— 2 —</span></section>`);
  const per = 6; for(let p = 0; p < Math.max(1, Math.ceil(stamps.length / per)); p++){ const L = stamps.slice(p * per, p * per + per);
    pages.push(`<section class="ppg"><h4><span>盖过的章 · STAMPS</span><span>${stamps.length} 枚</span></h4>${L.length ? `<div class="ppstamps">${L.map(([k, l, en], i) => `<div class="mini-st" style="transform:rotate(${[-4,3,-2,5,-3,2][i]}deg)">${stampSVG(k, l, en, "")}</div>`).join("")}</div>` : `<p style="font-size:12px; color:#7A6A5A">还没有章。行程里每个地方都能打卡。</p>`}<span class="no">— ${3 + p} —</span></section>`); }
  pages.push(`<section class="ppg" style="display:grid; place-items:center; text-align:center"><div><p style="font-family:var(--serif); font-size:18px; color:#7A5A44">这一页还空着</p><p style="font-size:12px; color:#9A8A7A">留给下一次出发</p></div><span class="no">— ${pages.length + 1} —</span></section>`);
  page(`<div class="scr">${back("护照")}<div class="ppbook ${open ? "open" : ""}" id="ppbook"><div class="pppages" id="pppages">${pages.join("")}</div>
    <button class="ppcover2" data-act="ppopen2" aria-label="翻开护照"><svg class="crest" viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="#E6C98A" stroke-width="1.6"><circle cx="50" cy="50" r="44" stroke-dasharray="2 3"/><circle cx="50" cy="50" r="36"/><path d="M58 30a22 22 0 1 0 0 40 17 17 0 1 1 0-40Z" fill="#E6C98A" stroke="none"/><path d="M66 50l2.3 5.6 6 .5-4.6 4 1.4 5.9-5.1-3.1-5.1 3.1 1.4-5.9-4.6-4 6-.5Z" fill="#E6C98A" stroke="none"/></g></svg><b>PASPORT</b><small>旅行手账 · TRIP DECK</small><em>点一下翻开</em></button>
    <div class="ppdots" id="ppdots">${pages.map((_, i) => `<i class="${i === 0 ? "on" : ""}"></i>`).join("")}</div></div><p style="text-align:center; font-size:12px; color:var(--mu); margin:34px 0 0">左右滑翻页</p></div>`);
  const pp = $("pppages"); pp && pp.addEventListener("scroll", () => { const i = Math.round(pp.scrollLeft / pp.clientWidth); document.querySelectorAll("#ppdots i").forEach((d, k) => d.classList.toggle("on", k === i)); }, { passive:true }); }
/* ---------- keeps: receipt / paper / poster saved into the journal ---------- */
S.keeps = S.keeps || [];
function addKeep(kind){ const t = { receipt:"旅行发票", paper:`旅途小报 · D${pad(TODAY + 1)}`, poster:"海报" }[kind]; S.keeps.unshift({ k:kind, t, at:TDATE(), sum: kind === "receipt" ? `${HSYM()} ${Math.round(spentTotal())}` : "" }); toast(`收进手账了 · 手账 → 票根最下面`); snd("stamp"); }
function keepsHTML(){ if(!S.keeps.length) return ""; return `<div class="sec" style="margin-top:6px"><h2>收进手账的<span>${S.keeps.length} 样</span></h2></div><div class="keeprow">${S.keeps.map((k, i) => `<button class="keep ${k.k}" data-act="keepopen:${i}"><b>${k.t}</b>${k.at.replace(/-/g, ".")}<br>${k.sum || ""}${k.k === "receipt" ? "<br>------<br>TRIP DECK" : ""}</button>`).join("")}</div>`; }
/* ---------- 回忆放映: real numbers + a gentle music box, or your own song ---------- */
let MUS = null;
function musicStart(){ musicStop(); try{ const C = new (window.AudioContext || window.webkitAudioContext)(), out = C.createGain(); out.gain.value = .16; const dl = C.createDelay(); dl.delayTime.value = .32; const fb = C.createGain(); fb.gain.value = .3; out.connect(C.destination); out.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(C.destination);
    const chords = [[60,64,67,72],[57,60,64,69],[53,57,60,65],[55,59,62,67]], f = m => 440 * Math.pow(2, (m - 69) / 12); let step = 0;
    const note = (m, t, d, v) => { const o = C.createOscillator(), g = C.createGain(); o.type = "sine"; o.frequency.value = f(m); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g); g.connect(out); o.start(t); o.stop(t + d + .05); };
    const tick = () => { if(!MUS) return; const t = C.currentTime + .05, ch = chords[Math.floor(step / 8) % 4], i = step % 8; note(ch[[0,2,1,3,2,1,3,2][i]] + 12, t, 1.4, .5); if(i === 0) note(ch[0] - 12, t, 3, .35); step++; MUS.t = setTimeout(tick, 330); };
    MUS = { C, t:0 }; tick(); }catch(e){} }
function musicStop(){ if(MUS){ clearTimeout(MUS.t); try{ MUS.C.close(); }catch(e){} MUS = null; } if(window._recapAudio){ window._recapAudio.pause(); window._recapAudio = null; } }
/* ---------- transfers: money handed to one person in advance ---------- */
let TR = { from:1, to:0 };
function transferSheet(){ if(FRIENDS.length < 2) return toast("先在旅伴里加人，才能记谁交钱给谁");
  sheet(`<h3>交钱给人</h3><p class="sub">比如出发前大家把钱交给一个人统一付，记下谁交了多少给谁</p>
    <div class="lbl">谁交的</div><div class="pick">${FRIENDS.map((f, i) => `<button class="avt" data-act="trfrom:${i}" aria-pressed="${TR.from === i}" style="background:${f[1]}" aria-label="${NAMES[i]}">${f[0]}</button>`).join("")}</div>
    <div class="lbl">交给谁</div><div class="pick">${FRIENDS.map((f, i) => `<button class="avt" data-act="trto:${i}" aria-pressed="${TR.to === i}" style="background:${f[1]}" aria-label="${NAMES[i]}">${f[0]}</button>`).join("")}</div>
    <div class="lbl">多少（${TRIP.home}）</div><input class="dinput" id="tramt" type="number" inputmode="decimal" placeholder="比如 500" style="margin-top:8px">
    <div class="lbl">备注</div><input class="dinput" id="trnote" placeholder="比如：公款、车费" maxlength="20" style="margin-top:8px">
    <div style="margin-top:14px"><button class="cbtn" data-act="trsave">记下来</button></div>
    <p style="font-size:12px; color:var(--mu); margin-top:10px; line-height:1.5">之后由收钱的人付的共同花费，记一笔时选「谁付的」是他，账本会自动算谁该给谁。</p>`); }
/* ---------- events ---------- */
document.addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if(!b) return; const parts = b.dataset.act.split(":"), a = parts[0], x = parts[1];
  switch(a){
    
    
    case "tfood": setTfood(x); break;
    case "tfoodown": sheet(`<h3>自己写一样</h3><input class="dinput" id="tfin" maxlength="10" placeholder="比如：芋圆冰" style="margin-top:6px"><div style="margin-top:12px"><button class="cbtn" data-act="tfoodok">用这个撕一张</button></div>`); setTimeout(() => $("tfin") && $("tfin").focus(), 300); break;
    case "tfoodok": { const v = (($("tfin") || {}).value || "").trim(); if(!v) return toast("先写名字"); closeSheet(); setTfood(v); break; }
    case "avsheet": avatarSheet(+x || 0); break;
    case "avpick": { const i = +x, k = parts[2] || ""; if(FRIENDS[i]) FRIENDS[i][2] = k || undefined; if(i === 0) S.avatar = k; closeSheet(); toast(k ? `换成${AV_N[k]}了` : "不用头像了"); snd("success"); const o = $("ov-x"); if(o && o.classList.contains("on") && o.querySelector("#ppbook")){ NOSTAG = true; openPassport(true); } else { NOSTAG = true; render(); } break; }
    
    case "ppopen2": { const bk = $("ppbook"); bk && bk.classList.add("open"); snd("flip"); buzz([8, 40, 8]); break; }
    case "keepopen": { const k = S.keeps[+x]; if(!k) break; if(k.k === "postcard"){ sheet(`<h3>${k.t}</h3><p class="sub">${k.at.replace(/-/g, ".")}</p><p style="font-family:var(--hand); font-size:24px; line-height:1.5; margin:8px 0 4px">${k.sum}</p>`); break; } if(k.k === "receipt") openReceipt(); else if(k.k === "paper") openPaper(); else openPoster(); break; }
    
    case "keeppaper": addKeep("paper"); break;
    
    
    case "musictoggle": if(MUS || window._recapAudio){ musicStop(); $("mustxt").textContent = "音乐：关"; } else { musicStart(); $("mustxt").textContent = "音乐：开"; } break;
    
    case "transfer": transferSheet(); break;
    case "trfrom": TR.from = +x; document.querySelectorAll('#sheet [data-act^="trfrom:"]').forEach(s => s.setAttribute("aria-pressed", s === b)); break;
    case "trto": TR.to = +x; document.querySelectorAll('#sheet [data-act^="trto:"]').forEach(s => s.setAttribute("aria-pressed", s === b)); break;
    case "trsave": { const v = parseFloat(($("tramt") || {}).value); if(!(v > 0)) return toast("填金额"); if(TR.from === TR.to) return toast("交钱的人和收钱的人要不一样"); const note = (($("trnote") || {}).value || "").trim();
      EXP.unshift({ kind:"transfer", t:`${NAMES[TR.from]} 交给 ${NAMES[TR.to]}${note ? " · " + note : ""}`, c:"转账", ic:"check", col:"#9FB8D8", rm:v, who:NAMES[TR.from], payer:TR.from, to:TR.to, split:[TR.to], d:`${+TDATE().slice(5,7)}/${+TDATE().slice(8)} 今天`, at:TDATE() }); closeSheet(); toast("记下了"); snd("success"); render(); break; }
  }
});
document.addEventListener("input", e => { if(e.target.id === "dname"){ const bk = BOOKS2[DI]; if(bk){ bk.t = e.target.value.trim().slice(0, 6) || bk.t; const pv = $("decoprev"); pv && (pv.innerHTML = coverHTML(bk, true)); } } });
document.addEventListener("change", e => { if(e.target.id === "dname"){ NOSTAG = true; openShelf(); } });
/* fast keypad: update the numbers in place instead of rebuilding the whole panel */
document.addEventListener("click", e => { const b = e.target.closest('[data-act^="aek:"]'); if(!b || !AE) return; e.stopImmediatePropagation(); const x = b.dataset.act.slice(4);
  AE.v = x === "⌫" ? AE.v.slice(0, -1) : (x === "." && AE.v.includes(".")) || AE.v.length > 8 ? AE.v : (AE.v === "0" && x !== "." ? x : AE.v + x); buzz(4);
  const n = parseFloat(AE.v || "0"), per = AE.split.size ? (AE.cur === "cny" ? n * RATE_CNY : n) / AE.split.size : 0, big = document.querySelector("#sheet .amtbig"), sub = document.querySelector("#sheet .amt-sub");
  const sv = document.querySelector('#sheet [data-act="aesave"]'); if(sv) sv.disabled = !(n > 0);
  if(big) big.textContent = `${AE.cur === "cny" ? DSYM() : HSYM()} ${AE.v || "0"}`; if(sub && sub.firstChild) sub.firstChild.textContent = `${AE.cur === "cny" ? `≈ ${HSYM()} ${(n * RATE_CNY).toFixed(2)}` : `≈ ${DSYM()} ${(n / RATE_CNY).toFixed(2)}`} · 每人 ${HSYM()} ${per.toFixed(2)} `; }, true);
document.addEventListener("click", e => { const b = e.target.closest('[data-act^="fxk:"]'); if(!b) return; e.stopImmediatePropagation(); const x = b.dataset.act.slice(4);
  fx.v = x === "⌫" ? fx.v.slice(0, -1) : (x === "." && fx.v.includes(".")) || fx.v.length > 8 ? fx.v : ((fx.v === "0" || fx.v === "") && x !== "." ? x : fx.v + x); buzz(4); fxSheet(); }, true);
document.addEventListener("click", e => { const b = e.target.closest('[data-act="tkeep"]'); if(b && tstate !== "done"){ e.stopImmediatePropagation(); } }, true);
document.addEventListener("click", e => { const b = e.target.closest('[data-act^="mood:"]'); if(!b) return; e.stopPropagation(); const [, ci, v] = b.dataset.act.split(":"); const c = S.checkins[+ci]; if(c){ c.mood = +v; refreshDerived(); b.parentElement.querySelectorAll("button").forEach((d, k) => d.classList.toggle("on", k < +v)); snd("tap"); } }, true);
document.addEventListener("click", e => { const b = e.target.closest('[data-act="fortune"]'); if(!b) return; setTimeout(() => { const n = $("fname"), av = $("fav"); n && (n.textContent = S.me || "朋友"); if(av) av.innerHTML = FRIENDS[0][2] ? avatarSVG(FRIENDS[0][2]) : (S.me || "我").slice(0, 1); }, 0); });
document.addEventListener("input", e => { if(e.target.id === "aereal" && typeof AE !== "undefined" && AE) AE.real = parseFloat(e.target.value) || 0; });

/* ===================== part 15: stable ids, undo, escape, name change, wipe, first-day tips ===================== */
function itemId(date, t, title){ let h = 0; for(const ch of (date + "|" + t + "|" + title)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return "i" + h.toString(36); }
function ckDone(di, ii){ const it = DAYS[di] && DAYS[di].items[ii]; if(!it) return false; return S.checkins.some(c => it.id && c.id ? c.id === it.id : (c.di === di && c.ii === ii)); }
let undoT = 0;
function undoBar(text, onUndo){ const old = document.querySelector(".undobar"); old && old.remove(); clearTimeout(undoT); const el = document.createElement("div"); el.className = "undobar"; el.innerHTML = `<span>${text}</span><button type="button">撤销</button>`; $("app").appendChild(el);
  el.querySelector("button").onclick = () => { el.remove(); clearTimeout(undoT); onUndo(); toast("已撤销"); snd("success"); }; undoT = setTimeout(() => el.remove(), 6000); }
document.addEventListener("keydown", e => { if(e.key !== "Escape") return; if($("sheet").classList.contains("on")) return closeSheet(); if($("vw")) return closeViewer(); if(document.querySelector(".ov.on")) closeOv(); });
function nameSheet(){ sheet(`<h3>我的名字</h3><input class="dinput" id="mename" maxlength="8" value="${S.me || ""}" placeholder="旅伴会看到这个名字" style="margin-top:6px"><div style="margin-top:12px"><button class="cbtn" data-act="namesave">改好了</button></div>`); setTimeout(() => $("mename") && $("mename").focus(), 300); }
function tipsHTML(){ if(S.tipsSeen || !DAYS.length) return ""; return `<div class="tips"><button class="x" data-act="tipsx" aria-label="收起">收起</button><b>${TRIP.name} · 开始前三件事</b><ol><li>行程页点任何地方 → <b style="display:inline">盖章打卡</b>，照片会进护照</li><li>首页「记录此刻」：传照片、写几句</li><li>玩法页每天抽一张技能牌，不发动会失控</li></ol></div>`; }
document.addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if(!b) return; const [a] = b.dataset.act.split(":");
  switch(a){
    case "namesheet": nameSheet(); break;
    case "namesave": { const v = (($("mename") || {}).value || "").trim(); if(!v) return toast("名字不能空"); S.me = v; FRIENDS[0][0] = v.slice(0, 1); if(window.TD_SYNC && window.TD_SYNC.setName) window.TD_SYNC.setName(v); closeSheet(); toast(`改成「${v}」了`); NOSTAG = true; render(); break; }
    case "wipe": sheet(`<h3>清空这台手机的数据？</h3><p class="sub">行程、照片、票根、账本都会从这台手机删掉，回到开始页。连了数据库的话，房间里的共享内容还在。</p><div style="display:grid; gap:10px; margin-top:12px"><button class="cbtn ghost" data-act="close2">先不要</button><button class="cbtn holdbtn" data-act="wipego">确定清空</button></div>`); break;
    case "close2": closeSheet(); break;
    case "wipego": try{ Object.keys(localStorage).filter(k => k.startsWith("td3:")).forEach(k => localStorage.removeItem(k)); indexedDB.deleteDatabase("td3"); }catch(err){} toast("清空了，正在重开"); setTimeout(() => location.reload(), 700); break;
    case "tipsx": S.tipsSeen = true; { const t = document.querySelector(".tips"); t && t.remove(); } break;
    
  }
});
/* tear: a city without food data goes straight to "write your own" */
document.addEventListener("click", e => { const b = e.target.closest('[data-act="tear"]'); if(!b) return; setTimeout(() => { if(CITIES.length && !tFoods().length && !(tcity && tcity.food)){ const x = document.querySelector('#tfoods [data-act="tfoodown"]'); x && x.click(); } }, 200); });

/* ===================== part 16: real identity code, backup/restore, editable expenses, prepaid review ===================== */
/* ---- each phone gets its own identity code (the database one replaces it once connected) ---- */
(function(){ try{ let c = localStorage.getItem("td3:code"); if(!c){ const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; c = Array.from(crypto.getRandomValues(new Uint8Array(8)), v => A[v % A.length]).join(""); localStorage.setItem("td3:code", c); } MYCODE = c; }catch(e){ MYCODE = Math.random().toString(36).slice(2, 10).toUpperCase(); } })();
/* ---- backup to a file and restore from it (works without any server) ---- */
function idbAll(){ return new Promise(res => { try{ const r = indexedDB.open("td3", 1); r.onupgradeneeded = () => r.result.createObjectStore("blobs"); r.onsuccess = () => { const d = r.result, out = {}, tx = d.transaction("blobs"), st = tx.objectStore("blobs"), cur = st.openCursor(); cur.onsuccess = () => { const c = cur.result; if(c){ out[c.key] = c.value; c.continue(); } else res(out); }; cur.onerror = () => res({}); }; r.onerror = () => res({}); }catch(e){ res({}); } }); }
function idbPut(k, blob){ return new Promise(res => { const r = indexedDB.open("td3", 1); r.onupgradeneeded = () => r.result.createObjectStore("blobs"); r.onsuccess = () => { const tx = r.result.transaction("blobs", "readwrite"); tx.objectStore("blobs").put(blob, k); tx.oncomplete = res; tx.onerror = res; }; r.onerror = res; }); }
const b64 = blob => new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(blob); });
async function makeBackup(){ toast("正在打包…"); try{ if(window.TD_STASH) window.TD_STASH(); await new Promise(r => setTimeout(r, 1200));
  const ls = {}; Object.keys(localStorage).filter(k => k.startsWith("td3:")).forEach(k => ls[k] = localStorage.getItem(k)); const blobs = await idbAll(), media = {};
  for(const [k, v] of Object.entries(blobs)) media[k] = await b64(v);
  const data = JSON.stringify({ app:"tripdeck", v:3, at:new Date().toISOString(), code:MYCODE, ls, media }), file = new Blob([data], { type:"application/json" }), name = `旅行手账备份-${TDATE()}.json`;
  const f2 = new File([file], name, { type:"application/json" }); if(navigator.canShare && navigator.canShare({ files:[f2] })){ try{ await navigator.share({ files:[f2], title:name }); return; }catch(e){} }
  const a = document.createElement("a"); a.href = URL.createObjectURL(file); a.download = name; document.body.appendChild(a); a.click(); a.remove(); toast(`备份好了 · ${Object.keys(media).length} 张照片`); snd("success"); }catch(e){ toast("备份失败：" + (e.message || e)); } }
async function restoreBackup(file){ try{ const j = JSON.parse(await file.text()); if(j.app !== "tripdeck" || !j.ls) throw new Error("这不是旅行手账的备份文件"); window.TD_RESTORING = true;
  Object.keys(localStorage).filter(k => k.startsWith("td3:")).forEach(k => localStorage.removeItem(k)); Object.entries(j.ls).forEach(([k, v]) => localStorage.setItem(k, v)); if(j.code) localStorage.setItem("td3:code", j.code);
  for(const [k, d] of Object.entries(j.media || {})){ const blob = await (await fetch(d)).blob(); await idbPut(k, blob); }
  toast("恢复好了，正在重开"); setTimeout(() => location.reload(), 300); }catch(e){ window.TD_RESTORING = false; toast("恢复失败：" + (e.message || e)); } }
function restorePicker(){ const f = document.createElement("input"); f.type = "file"; f.accept = ".json,application/json"; f.onchange = () => f.files[0] && restoreBackup(f.files[0]); f.click(); }
/* ---- 找回自己 ---- */
function reclaim(){ reclaimCode(($("idin") || {}).value || ""); }
function reclaimCode(raw){ const v = String(raw).replace(/[\s-]/g, "").toUpperCase(); if(v.length !== 8) return toast("身份码是 8 位");
  if(v === MYCODE) return toast("这就是你现在的身份码");
  if(window.TD_SYNC && window.TD_SYNC.reclaim) return window.TD_SYNC.reclaim(v);
  sheet(`<h3>现在找不回来</h3><p class="sub">这台手机还没有连数据库，身份码只在本机有效，别的手机查不到它。</p>
    <p style="font-size:14px; line-height:1.7">换手机有两个办法：</p><div class="li"><span class="tx"><b>1. 用备份文件</b><small>在旧手机：设置 →「备份整趟手账」存一个文件；在新手机：设置或开始页 →「从备份恢复」选那个文件，所有照片、票根、账本都会回来。</small></span></div>
    <div class="li"><span class="tx"><b>2. 部署时连上数据库</b><small>在 config.js 填好 Supabase，之后身份码就能在任何手机找回。</small></span></div>
    <div style="display:grid; gap:10px; margin-top:12px"><button class="cbtn" data-act="restore">从备份恢复</button><button class="cbtn ghost" data-act="settings">返回设置</button></div>`); }
/* ---- tap any expense to change who paid, how it's split, or delete it ---- */
let EE = null;
function expEditSheet(i){ const e = EXP[i]; if(!e) return; if(e.kind === "transfer"){ EE = { i, del:true }; return sheet(`<h3>${e.t}</h3><p class="sub">${HSYM()} ${e.rm} · ${e.d}</p><div style="display:grid; gap:10px; margin-top:12px"><button class="cbtn holdbtn" data-act="eedel">删掉这一笔</button><button class="cbtn ghost" data-act="close2">不改了</button></div>`); }
  EE = { i, payer: e.payer != null ? e.payer : 0, split: new Set(e.split || [0]), n: e.splitN || (e.split || [0]).length };
  sheet(`<h3>改这一笔</h3><p class="sub">${e.wasPre || e.pre ? "出发前的预付 · " : ""}${e.d}</p>
    <div class="lbl">名字</div><input class="dinput" id="eet" value="${(e.t || "").replace(/"/g, "&quot;")}" maxlength="40" style="margin-top:8px">
    <div class="lbl">金额（${TRIP.home}）</div><input class="dinput" id="eerm" type="number" inputmode="decimal" value="${+expRM(e).toFixed(2)}" style="margin-top:8px">
    <div class="lbl">谁付的</div><div class="pick" id="eepay">${eePayHTML()}</div>
    ${FRIENDS.length > 1 ? `<div class="lbl">算谁的（点掉就不算他）</div><div class="pick">${FRIENDS.map((f, k) => `<button class="avt" data-act="eesplit:${k}" aria-pressed="${EE.split.has(k)}" style="background:${f[1]}" aria-label="算${NAMES[k]}的">${f[0]}</button>`).join("")}</div>` : ""}
    <div class="lbl">总共几个人分（有人还没加进 App 也算进去）</div><div class="step" style="margin-top:8px"><button data-act="een:-1" aria-label="少一个">−</button><b id="een">${EE.n}</b><button data-act="een:1" aria-label="多一个">+</button><span style="color:var(--mu); font-size:13px" id="eeper">每人 ${HSYM()} ${(expRM(e) / EE.n).toFixed(2)}</span></div>
    <div style="display:flex; gap:10px; margin-top:16px"><button class="cbtn ghost" data-act="eedel" style="color:#FFB7A6">删掉</button><button class="cbtn" data-act="eesave">保存</button></div>`); }
function eePayHTML(){ return FRIENDS.map((f, k) => `<button class="avt" data-act="eepay:${k}" aria-pressed="${EE.payer === k}" style="background:${f[1]}" aria-label="${NAMES[k]}付的">${f[0]}</button>`).join("") + `<button class="chip" data-act="eenew" style="height:44px">${I("plus",14,2)}别人</button>`; }
function addPerson(name){ FRIENDS.push([name.slice(0, 1), PERSON_COL[FRIENDS.length % PERSON_COL.length], undefined, "n:" + name]); NAMES.push(name); FEED.unshift({ a:FRIENDS.length - 1, t:`${name} 加进了这本手账`, s:"在账本里加的", ic:"plus" }); return FRIENDS.length - 1; }
/* ---- after an Excel import: confirm who paid each prepaid item ---- */
function prepaidReview(){ const L = EXP.map((e, i) => [e, i]).filter(([e]) => e.wasPre && !e.reviewed); if(!L.length) return;
  sheet(`<h3>出发前的预付，谁付的？</h3><p class="sub">导入了 ${L.length} 笔，默认都算你付的。不对就改，不要的就删掉。之后在账本里点任何一笔也能再改。</p>
    <div class="card" style="padding:0 16px; margin-top:6px">${L.map(([e, i]) => `<div class="pprow ${e._del ? "del" : ""}" id="pp${i}"><b>${e.t}</b><small>${HSYM()} ${(+expRM(e)).toLocaleString()} · ${e.splitN || 1} 个人分</small>
      <div class="pick">${FRIENDS.map((f, k) => `<button class="chip ${((e.payer != null ? e.payer : 0) === k) ? "on" : ""}" data-act="pppay:${i}:${k}">${k === 0 ? "我付的" : NAMES[k]}</button>`).join("")}<button class="chip" data-act="ppother:${i}">别人付的</button><button class="chip" data-act="ppdel:${i}" style="color:#FFB7A6">${e._del ? "不删了" : "删掉"}</button></div></div>`).join("")}</div>
    <div style="margin-top:14px"><button class="cbtn" data-act="ppdone">好了</button></div>`); }
document.addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if(!b) return; const p = b.dataset.act.split(":"), a = p[0];
  switch(a){
    case "backup": e.stopImmediatePropagation(); makeBackup(); break;
    case "restore": restorePicker(); break;
    case "idback": e.stopImmediatePropagation(); reclaim(); break;
    case "expedit": expEditSheet(+p[1]); break;
    case "eepay": EE.payer = +p[1]; $("eepay").innerHTML = eePayHTML(); break;
    case "eenew": { if($("eenm")) break; $("eepay").insertAdjacentHTML("afterend", `<div class="addrow" id="eenmrow"><input id="eenm" placeholder="谁付的？写名字" maxlength="8"><button class="chip on" data-act="eenmok" style="height:46px">好</button></div>`); setTimeout(() => $("eenm").focus(), 50); break; }
    case "eenmok": { const n = (($("eenm") || {}).value || "").trim(); if(!n) return toast("写个名字"); EE.payer = addPerson(n); EE.split.add(EE.payer); $("eepay").innerHTML = eePayHTML(); $("eenmrow").remove(); toast(`加了 ${n}`); break; }
    case "eesplit": { const k = +p[1]; EE.split.has(k) ? EE.split.delete(k) : EE.split.add(k); if(!EE.split.size) EE.split.add(k); b.setAttribute("aria-pressed", EE.split.has(k)); if(EE.n < EE.split.size){ EE.n = EE.split.size; $("een").textContent = EE.n; } break; }
    case "een": { EE.n = Math.max(1, Math.min(30, EE.n + +p[1])); $("een").textContent = EE.n; const v = parseFloat(($("eerm") || {}).value) || 0; $("eeper").textContent = `每人 ${HSYM()} ${(v / EE.n).toFixed(2)}`; break; }
    case "eesave": { const x = EXP[EE.i], t = (($("eet") || {}).value || "").trim(), v = parseFloat(($("eerm") || {}).value); if(!(v > 0)) return toast("金额要大于 0");
      if(t) x.t = t; x.u = Date.now(); if(Math.abs(v - expRM(x)) > .001){ x.rm = v; if(x.cny) x.real = true; } x.payer = EE.payer; x.who = EE.payer === 0 ? "你" : NAMES[EE.payer]; x.split = [...EE.split].sort(); if(EE.n > x.split.length) x.splitN = EE.n; else delete x.splitN;
      closeSheet(); NOSTAG = true; render(); toast("改好了"); snd("success"); break; }
    case "eedel": { const [x] = EXP.splice(EE.i, 1), i = EE.i, key = expKey(x); (S.del = S.del || []).push(key); closeSheet(); NOSTAG = true; render(); undoBar(`删掉了「${x.t}」`, () => { EXP.splice(i, 0, x); S.del = S.del.filter(d => d !== key); NOSTAG = true; render(); }); break; }
    case "pppay": { const i = +p[1], k = +p[2], x = EXP[i]; x.payer = k; x.who = k === 0 ? "你" : NAMES[k]; if(!x.split.includes(0)) x.split.push(0); prepaidReview(); break; }
    case "ppother": { const i = +p[1], row = $("pp" + i); if(!row || row.querySelector(".addrow")) break; row.insertAdjacentHTML("beforeend", `<div class="addrow"><input id="ppn${i}" placeholder="是谁付的？写名字（会加进旅伴）" maxlength="8"><button class="chip on" data-act="ppname:${i}" style="height:46px">好</button></div>`); setTimeout(() => $("ppn" + i).focus(), 50); break; }
    case "ppname": { const i = +p[1], n = (($("ppn" + i) || {}).value || "").trim(); if(!n) return toast("写个名字"); const k = NAMES.indexOf(n) > 0 ? NAMES.indexOf(n) : addPerson(n), x = EXP[i]; x.payer = k; x.who = n; x.split = [...new Set([...(x.split || [0]), 0, k])]; prepaidReview(); break; }
    case "ppdel": { const x = EXP[+p[1]]; x._del = !x._del; prepaidReview(); break; }
    case "ppdone": { for(let i = EXP.length - 1; i >= 0; i--) if(EXP[i]._del) EXP.splice(i, 1); EXP.forEach(e => { if(e.wasPre) e.reviewed = true; }); closeSheet(); NOSTAG = true; render(); toast("预付都确认好了"); break; }
  }
}, true);

/* ===================== part 17: real step counts, finished recordings, stub download, local phrases per region, one room per app ===================== */
/* ---- steps: start at 0, one count per calendar day, kept when you close the app ---- */
S.steps = S.steps || {};
S.stepCount = 0;
function todaySteps(){ return S.steps[TDATE()] || 0; }

function applySteps(){ S.stepCount = todaySteps(); DAYS.forEach((d, i) => { if(DAYCFG[i]) DAYCFG[i].steps = S.steps[d.date] ? stepTxt(S.steps[d.date]) : "—"; }); }
/* the pedometer counts from today's saved value, not from a fixed number */

/* ---- recordings: wait for the audio file to finish before saving it ---- */

function diaryVoicesHTML(){ return ""; }

/* ---- 照片票根: save any stub as an image ---- */

/* ---- 当地话: phrases for the region you are actually in ---- */
const PH_BASE = [["谢谢","xièxie"],["这个多少钱？","zhège duōshao qián"],["少辣一点","shǎo là yìdiǎn"],["买单","mǎidān"],["好吃！","hǎochī"],["洗手间在哪里？","xǐshǒujiān zài nǎlǐ"]];
const PH_LOCAL = {
  minnan:{ n:"闽南话", lang:"zh-CN", L:[["多谢","to-siā"],["这个偌济钱？","tsit-ê guā-tsē tsînn"],["毋通傷辣","m̄-thang siunn hiam"],["算数","sǹg-siàu（买单）"],["真好食！","tsin hó-tsia̍h"],["便所佇佗位？","piān-sóo tī tó-uī"]] },
  fuzhou:{ n:"福州话", lang:"zh-CN", L:[["多谢","tŏ-siâ"],["这个若毛钱？","ciā-ciĕ nuó-muô-ciêng"],["莫辣","mò lăk"],["好食！","hó siăh"],["厕所底叠？","cáe-sō diē-dáe"]] },
  sichuan:{ n:"重庆 / 四川话", lang:"zh-CN", L:[["谢谢哈","xiè xie ha"],["好多钱嘛？","hǎo duō qián ma（多少钱）"],["微辣就可以了","wēi là jiù kě yǐ le"],["巴适得板！","bā shì dé bǎn（太舒服了）"],["要得！","yào dé（好的）"],["莫得问题","mò dé wèn tí（没问题）"],["你搞啥子哦？","nǐ gǎo shá zi o（你在干嘛）"],["厕所在哪儿嘛？","cè suǒ zài nǎr ma"]] },
  cantonese:{ n:"粤语", lang:"zh-HK", L:[["唔该","m̀h gōi（谢谢 / 麻烦你）"],["几多钱呀？","géi dō chín a"],["唔要辣","m̀h yiu laaht"],["埋单","màaih dāan"],["好好食！","hóu hóu sihk"],["洗手间喺边度？","sái sáu gāan hái bīn douh"]] },
  chaoshan:{ n:"潮汕话", lang:"zh-CN", L:[["多谢","do zia"],["只个若济钱？","zi gai ria zoi zin"],["好食！","ho ziah"],["厕池在地块？","ce di do de go"]] },
  shanghai:{ n:"上海话", lang:"zh-CN", L:[["谢谢侬","xia xia nong"],["几钿？","ji di（多少钱）"],["老好吃额","lao hao qie ge"],["卫生间勒拉阿里？","we sang ji leh la a li"]] },
  hunan:{ n:"长沙话", lang:"zh-CN", L:[["谢谢咯","xiè xie lo"],["好多钱？","hǎo duō qián"],["莫放辣椒","mò fàng là jiāo"],["好吃得很！","hǎo chī de hěn"],["要得","yào dé"]] },
  northeast:{ n:"东北话", lang:"zh-CN", L:[["谢谢啊","xiè xie a"],["多少钱呐？","duō shao qián na"],["贼好吃！","zéi hǎo chī"],["整一个","zhěng yí ge（来一份）"],["嘎嘎好","gā gā hǎo（非常好）"]] },
  yunnan:{ n:"云南话", lang:"zh-CN", L:[["谢谢喽","xiè xie lou"],["好多钱？","hǎo duō qián"],["好吃得很！","hǎo chī de hěn"],["板扎！","bǎn zhā（很棒）"]] },
  taiwan:{ n:"台湾", lang:"zh-TW", L:[["谢谢","xiè xie"],["这个多少钱？","zhè ge duō shǎo qián"],["不要辣","bú yào là"],["买单 / 结帐","jié zhàng"],["好好吃！","hǎo hǎo chī"],["厕所在哪里？","cè suǒ zài nǎ lǐ"]] },
  malay:{ n:"马来语", lang:"ms-MY", L:[["Terima kasih","谢谢"],["Berapa harga ini?","这个多少钱"],["Kurang pedas","少辣"],["Kira, ya","买单"],["Sedap!","好吃"],["Tandas di mana?","厕所在哪里"]] },
  thai:{ n:"泰语", lang:"th-TH", L:[["ขอบคุณครับ/ค่ะ","kòp kun（谢谢）"],["ราคาเท่าไหร่","raa-khaa thâo rài（多少钱）"],["ไม่เผ็ด","mâi phèt（不要辣）"],["เช็คบิล","chék bin（买单）"],["อร่อย!","a-ròi（好吃）"],["ห้องน้ำอยู่ไหน","hông náam yùu nǎi（厕所在哪）"]] },
  korean:{ n:"韩语", lang:"ko-KR", L:[["감사합니다","gam-sa-ham-ni-da（谢谢）"],["이거 얼마예요?","i-geo eol-ma-ye-yo（多少钱）"],["안 맵게 해주세요","an maep-ge hae-ju-se-yo（不要辣）"],["계산해 주세요","gye-san-hae ju-se-yo（买单）"],["맛있어요!","ma-si-sseo-yo（好吃）"],["화장실 어디예요?","hwa-jang-sil eo-di-ye-yo（厕所在哪）"]] },
  japanese:{ n:"日语", lang:"ja-JP", L:[["ありがとうございます","arigatō gozaimasu（谢谢）"],["これはいくらですか？","kore wa ikura desu ka（多少钱）"],["辛くしないでください","karaku shinaide kudasai（不要辣）"],["お会計お願いします","okaikei onegaishimasu（买单）"],["おいしい！","oishii（好吃）"],["トイレはどこですか？","toire wa doko desu ka（厕所在哪）"]] },
  vietnamese:{ n:"越南语", lang:"vi-VN", L:[["Cảm ơn","谢谢"],["Bao nhiêu tiền?","多少钱"],["Không cay","不要辣"],["Tính tiền","买单"],["Ngon quá!","好吃"],["Nhà vệ sinh ở đâu?","厕所在哪里"]] },
  english:{ n:"英语", lang:"en-NZ", L:[["Thank you","谢谢"],["How much is this?","多少钱"],["Not spicy, please","不要辣"],["Can I get the bill?","买单"],["This is delicious!","好吃"],["Where is the restroom?","厕所在哪里"]] },
  singapore:{ n:"新加坡（Singlish）", lang:"en-SG", L:[["Thank you","谢谢"],["How much ah?","多少钱"],["Less spicy, can?","少辣可以吗"],["Shiok!","太爽了 / 好吃"],["Can lah","可以啦"],["Toilet where ah?","厕所在哪"]] }
};
const PH_CITY = { 厦门:"minnan", 泉州:"minnan", 漳州:"minnan", 福州:"fuzhou", 重庆:"sichuan", 成都:"sichuan", 广州:"cantonese", 香港:"cantonese", 澳门:"cantonese", 潮汕:"chaoshan", 上海:"shanghai", 长沙:"hunan", 张家界:"hunan", 哈尔滨:"northeast", 昆明:"yunnan", 大理:"yunnan", 丽江:"yunnan", 台北:"taiwan",
  吉隆坡:"malay", 怡保:"malay", 太平:"malay", 槟城:"malay", 马六甲:"malay", 新山:"malay", 金马仑高原:"malay", 亚庇:"malay", 兰卡威:"malay", 合艾:"thai", 曼谷:"thai", 清迈:"thai", 普吉岛:"thai", 甲米:"thai", 宋卡:"thai", 首尔:"korean", 釜山:"korean", 东京:"japanese", 大阪:"japanese", 京都:"japanese", 沙坝:"vietnamese", 胡志明市:"vietnamese", 奥克兰:"english", 皇后镇:"english", 新加坡:"singapore" };
function phrasePack(){ const city = (DAYCFG[TODAY] || {}).city || (CITIES[0] || {}).name || ""; const k = PH_CITY[city] || Object.keys(PH_CITY).find(c => city.includes(c)) && PH_CITY[Object.keys(PH_CITY).find(c => city.includes(c))]; return k ? { city, ...PH_LOCAL[k] } : { city, n:"普通话", lang:"zh-CN", L:[] }; }
function talkSheet(){ const p = phrasePack(), local = p.L, base = /zh/.test(p.lang) ? PH_BASE : [];
  sheet(`<h3>当地话小卡 · ${p.n}</h3><p class="sub">${p.city || ""} · 点喇叭读出来，或者直接给对方看</p>
    ${local.length ? `<div class="lbl">${p.n}</div>${local.map(([z, py], i) => `<div class="li"><span class="tx"><b style="font-size:18px">${z}</b><small>${py}</small></span><button class="rbtn" data-act="say2:L:${i}" aria-label="读出「${z}」" style="background:rgba(255,255,255,.07)">${I("speaker",18)}</button></div>`).join("")}` : ""}
    ${base.length ? `<div class="lbl">普通话也通</div>${base.map(([z, py], i) => `<div class="li"><span class="tx"><b style="font-size:16px">${z}</b><small>${py}</small></span><button class="rbtn" data-act="say2:B:${i}" aria-label="读出「${z}」" style="background:rgba(255,255,255,.07)">${I("speaker",18)}</button></div>`).join("")}` : ""}
    <p style="font-size:11px; color:var(--mu); margin-top:10px">方言的朗读用的是手机自带的声音，${/zh-CN/.test(p.lang) && local.length ? "会用普通话的口音读出来，听个意思就好" : "不同手机声音不一样"}。</p>`); }
function say2(which, i){ const p = phrasePack(), row = which === "L" ? p.L[i] : PH_BASE[i]; if(!row) return; try{ const u = new SpeechSynthesisUtterance(row[0]); u.lang = which === "L" ? p.lang : "zh-CN"; u.rate = .85; speechSynthesis.cancel(); speechSynthesis.speak(u); }catch(err){ toast("这台设备不能朗读"); } }
document.addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if(!b) return; const p = b.dataset.act.split(":"), a = p[0];
  switch(a){
    
    case "say2": say2(p[1], +p[2]); break;
  }
}, true);
/* diary: when the voice button is tapped, play the real recording of that day */

/* draw a photo stub straight onto a canvas (sharp, and doesn't depend on the export library) */
async function stubPNG(st){ const img = await new Promise((res, rej) => { const im = new Image(); im.crossOrigin = "anonymous"; im.onload = () => res(im); im.onerror = rej; im.src = st.src; });
  const vert = st.layout === "v", W = vert ? 900 : 1500, H = vert ? 1350 : 600, c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d"), f = fontOf(st.font), R = 36;
  const rr = (X, Y, w, h, r) => { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); };
  const cover = (X, Y, w, h) => { const s = Math.max(w / img.width, h / img.height), iw = img.width * s, ih = img.height * s; x.save(); x.beginPath(); x.rect(X, Y, w, h); x.clip(); x.drawImage(img, X + (w - iw) / 2, Y + (h - ih) / 2, iw, ih); x.restore(); };
  rr(0, 0, W, H, R); x.save(); x.clip();
  if(!vert){ const pw = W * .72; cover(0, 0, pw, H); x.fillStyle = st.col; x.fillRect(pw, 0, W - pw, H);
    x.fillStyle = "rgba(255,255,255,.08)"; x.font = `700 ${H * .9}px -apple-system, "PingFang SC", sans-serif`; x.fillText((st.en || "T")[0], pw + 40, H * .92);
    x.fillStyle = "#fff"; x.font = `700 ${st.en.length > 7 ? 54 : 66}px -apple-system, "PingFang SC", sans-serif`; x.fillText(st.en, pw + 44, 110); x.font = `600 36px -apple-system, sans-serif`; x.globalAlpha = .85; x.fillText(st.date, pw + 44, 160); x.fillText(st.no, pw + 44, H - 50); x.globalAlpha = 1;
    x.setLineDash([14, 12]); x.strokeStyle = "rgba(255,255,255,.6)"; x.lineWidth = 4; x.beginPath(); x.moveTo(pw, 30); x.lineTo(pw, H - 30); x.stroke(); x.setLineDash([]);
    if(st.cap){ x.font = `${st.font === "hand" || st.font === "brush" ? 64 : 44}px ${f}`; const tw = x.measureText(st.cap).width; x.fillStyle = "rgba(10,12,16,.55)"; rr(36, H - 120, tw + 60, 84, 42); x.fill(); x.fillStyle = "#fff"; x.fillText(st.cap, 66, H - 62); } }
  else { x.fillStyle = st.col; x.fillRect(0, 0, W, H); x.fillStyle = "#fff"; x.font = `600 30px -apple-system, sans-serif`; x.globalAlpha = .8; x.fillText("TRAVEL MEMORY", 56, 80); x.globalAlpha = 1; x.font = `700 84px "Noto Serif SC", serif`; x.fillText(st.zh, 56, 180); x.font = `600 32px -apple-system, sans-serif`; x.fillText(`${st.en}   ${st.date}${st.no ? "   " + st.no : ""}`, 56, 232);
    rr(56, 270, W - 112, H - 330, 26); x.save(); x.clip(); cover(56, 270, W - 112, H - 330); x.restore();
    if(st.cap){ x.font = `${st.font === "hand" || st.font === "brush" ? 60 : 42}px ${f}`; const tw = x.measureText(st.cap).width; x.fillStyle = "rgba(10,12,16,.55)"; rr(80, H - 160, tw + 56, 80, 40); x.fill(); x.fillStyle = "#fff"; x.fillText(st.cap, 108, H - 106); } }
  x.restore(); for(const [cx, cy] of vert ? [] : [[W * .72, 0], [W * .72, H]]){ x.save(); x.globalCompositeOperation = "destination-out"; x.beginPath(); x.arc(cx, cy, 26, 0, 7); x.fill(); x.restore(); }
  return c.toDataURL("image/png"); }
function deliverImage(url, name){ return (async () => { try{ const blob = await (await fetch(url)).blob(), file = new File([blob], `${name}.png`, { type:"image/png" });
    if(navigator.canShare && navigator.canShare({ files:[file] })){ try{ await navigator.share({ files:[file], title:name }); toast("在分享面板里选「存储图像」，就会存进相册"); return; }catch(e){ if(e && e.name === "AbortError") return; } }
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    if(!ios){ const a = document.createElement("a"); a.href = url; a.download = `${name}.png`; document.body.appendChild(a); a.click(); a.remove(); toast(`${name} 已保存`); snd("success"); return; }
    const ov = document.createElement("div"); ov.className = "imgsave"; ov.innerHTML = `<img src="${url}" alt="${name}"><p>长按图片 → 选「存储到照片」</p><button type="button">好了</button>`; ov.querySelector("button").onclick = () => ov.remove(); $("app").appendChild(ov); }catch(e){ toast("这张图存不了"); } })(); }
async function saveStub(i){ const st = S.stubs[i]; if(!st) return; toast("正在生成图片…"); try{ const url = await stubPNG(st), name = `照片票根-${st.zh || i + 1}`, blob = await (await fetch(url)).blob(), file = new File([blob], `${name}.png`, { type:"image/png" });
  deliverImage(url, name); }catch(e){ toast("这张照片存不了（可能还在上传）"); } }
document.addEventListener("click", e => { const b = e.target.closest('[data-act^="stubdl:"]'); if(!b) return; e.stopImmediatePropagation(); saveStub(+b.dataset.act.split(":")[1]); }, true);

/* ===================== part 19: sound that keeps working, one fortune a day, daily secret mission, real deck table, pull-to-refresh by touch ===================== */
/* ---- sound: wake the audio up on every tap and when you come back to the app (iPhone pauses it) ---- */
const wakeAudio = () => { try{ O && O.unlock && O.unlock(); }catch(e){} };
["touchend","click","keydown"].forEach(ev => document.addEventListener(ev, wakeAudio, { capture:true, passive:true }));
document.addEventListener("visibilitychange", () => { if(!document.hidden) wakeAudio(); });
/* ---- 今日旅运: one card per day ---- */
S.fortune = S.fortune || null;
function fortuneToday(){ return S.fortune && S.fortune.date === TDATE() ? S.fortune : null; }
document.addEventListener("click", e => { const b = e.target.closest('[data-act="fortune"]'); if(!b) return; setTimeout(() => { const t = fortuneToday(), ag = $("fagain");
  if(t){ fi = t.fi; drawFortune(); if(ag) ag.style.display = "none"; const h = $("fhint"); if(h) h.textContent = "今天已经抽过了 · 往上拉再看一次"; }
  else { if(ag) ag.style.display = ""; } }, 30); });
(function(){ const ag = $("fagain"), kp = $("fkeep");
  if(ag) ag.onclick = () => { if(fortuneToday()) return toast("今天已经抽过了，明天再来抽新的一张"); closeCard(() => { fi++; drawFortune(); }); };
  if(kp) kp.onclick = () => { if(!fortuneToday()){ S.fortune = { date:TDATE(), fi }; } const a = $("fagain"); a && (a.style.display = "none"); toast("收进手账了 · 今天的旅运就是这张"); snd("stamp"); }; })();

/* ---- 秘密任务: a different envelope every day, no "换一封" ---- */
const SECRETS2 = ["偷偷给每个人拍一张他不知道被拍的照片。","今天找机会，让一个旅伴说出一句当地话。","在一家店里，请老板推荐一样他自己最爱吃的。","悄悄买一张明信片，写给今天的自己，回家再看。","今天至少夸每个旅伴一次，要具体。","找到一个和你同名或同姓的招牌，拍下来。","请一个陌生人帮你们拍一张合照。","今天吃一样你从来没吃过、看起来有点怕的东西。","帮一个旅伴偷偷付一次小钱，不要说是你。","在今天走过的路上捡一样小东西当纪念（不要摘花）。","今天不看地图走一段路，凭感觉找到下一站。","记住今天听到的一句当地话，晚上教大家。","找一个最好看的窗户或门，拍一张。","今天用三个词形容这座城市，写进日记。","找一家开了很多年的老店，问老板开了多少年。","在今天的照片里藏一个只有你知道的手势。","今天喝一样当地的饮料，猜猜它的名字由来。","找到一只猫或狗，跟它合照。","今天说服大家去一个不在行程里的地方，哪怕只是五分钟。","晚上睡前，给明天的自己写一句提醒。"];
function secretIdx(){ const d = new Date(TDATE() + "T12:00:00"), n = Math.floor(d / 864e5); let h = n; for(const ch of (S.me || "")) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h % SECRETS2.length; }
S.secretDone = S.secretDone || {};
function openSecret(){ const done = S.secretDone[TDATE()];
  page(`<div class="scr">${back("秘密任务")}<div class="pt2" style="padding-top:0"><p>每天一封，只有你看得到，第二天会换一封新的</p></div>
    <button class="env" id="env" data-act="envopen" aria-label="拆开信封" style="display:block; border:0; padding:0; background:none; color:inherit"><span class="letter"><small>SECRET MISSION · ${+TDATE().slice(5,7)}/${TDATE().slice(8)}</small><p>${SECRETS2[secretIdx()]}</p></span><span class="bodyE"></span><span class="flap"></span><span class="seal">秘</span></button>
    <p id="envh" style="text-align:center; font-size:13px; color:var(--mu); margin:36px 0 0">${done ? "今天的已经做到了，明天会有新的一封" : "点信封，拆开今天的任务"}</p>
    <div style="padding:16px 20px 0"><button class="cbtn" data-act="secdone2" ${done ? "disabled" : ""}>${done ? "✓ 今天做到了" : "我做到了"}</button></div></div>`); }
/* ---- 今天的牌桌: your real travel buddies, not 小林 and Q ---- */

document.addEventListener("click", e => { const b = e.target.closest('[data-act="skills"]'); if(!b) return; setTimeout(() => { const o = $("ov-x"); if(!o) return; const h2 = [...o.querySelectorAll(".sec h2")].find(x => x.textContent.includes("今天的牌桌")); if(h2) h2.closest(".sec").outerHTML = deckTableHTML(); }, 0); });
/* ---- 猜价格: a little click as you drag ---- */
let gpTick = 0; document.addEventListener("input", e => { if(e.target.id !== "gpmine") return; const v = +e.target.value; if(Math.abs(v - gpTick) >= 2){ gpTick = v; snd("tap"); buzz(3); } });
/* ---- 旅途通宝: after the coin lands, scroll so you can see "就这么定了" ---- */
function showCoinRes(){ setTimeout(() => { const r = $("coinRes"), sc = document.querySelector("#ov-x .scr"); if(!r || !sc) return; const top = r.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - 140; sc.scrollTo({ top: Math.max(0, top), behavior: REDUCE ? "auto" : "smooth" }); }, 250); }

/* ---- 撕美食票: tap the roll to see the front of the ticket ---- */
function ticketPeek(){ if(!tcity || !tcity.food) return; let el = $("tpeek"); if(el){ el.remove(); return; } el = document.createElement("div"); el.id = "tpeek"; el.className = "tpeek"; el.innerHTML = `${frontTicket(curTicket(), Math.min(340, $("app").clientWidth - 40))}<small>这就是它的正面 · 点一下收起</small>`; el.onclick = () => el.remove(); $("ov-tear").appendChild(el); snd("flip"); }
document.addEventListener("click", e => { if(!e.target.closest("#ov-tear .tstage, #ov-tear canvas")) return; if(typeof tstate !== "undefined" && (tstate === "idle" || tstate === "ready")) ticketPeek(); });
/* ---- pull down to refresh, using touch (works with iPhone scrolling) ---- */
(function(){ const v = $("view"); if(!v) return; let y0 = null, dy = 0; const bar = document.querySelector(".ptr") || (() => { const d = document.createElement("div"); d.className = "ptr"; d.innerHTML = "<span>下拉刷新</span>"; $("app").appendChild(d); return d; })();
  v.addEventListener("touchstart", e => { y0 = v.scrollTop <= 0 ? e.touches[0].clientY : null; dy = 0; }, { passive:true });
  v.addEventListener("touchmove", e => { if(y0 === null) return; dy = e.touches[0].clientY - y0; if(dy > 25){ bar.classList.add("on"); bar.firstChild.textContent = dy > 80 ? "松开刷新" : "下拉刷新"; } }, { passive:true });
  v.addEventListener("touchend", async () => { if(y0 === null) return; const go = dy > 80; y0 = null; if(!go){ bar.classList.remove("on"); return; } bar.firstChild.textContent = "刷新中…"; buzz(8);
    try{ if(window.TD_SYNC && window.TD_SYNC.pull) await window.TD_SYNC.pull(); }catch(err){} NOSTAG = true; render(); bar.firstChild.textContent = window.TD_SYNC && window.TD_SYNC.pull ? "已是最新" : "已刷新（没连数据库，只刷新这台手机）"; setTimeout(() => bar.classList.remove("on"), 900); }, { passive:true }); })();
/* ---- 记一笔: choose shared or personal right at the top ---- */
document.addEventListener("click", e => { const b = e.target.closest('[data-act^="aemode:"]'); if(!b || !AE) return; e.stopImmediatePropagation(); const m = b.dataset.act.split(":")[1]; AE.mode = m; if(m === "mine"){ AE.split = new Set([0]); AE.who = 0; } else { AE.split = new Set(FRIENDS.map((_, i) => i)); } renderAE(); }, true);
document.addEventListener("click", e => { const b = e.target.closest('[data-act="secdone2"]'); if(!b) return; S.secretDone[TDATE()] = true; b.disabled = true; b.textContent = "✓ 今天做到了"; snd("success"); confetti(); toast("做到了！明天会有新的一封"); FEED.unshift({ a:0, t:`${S.me || "你"} 完成了今天的秘密任务`, s:"秘密任务", ic:"check" }); });

/* ===================== part 20: people by id, real 房主, shared skills + notifications, real check-in confirmation, photo dedupe/delete, refresh everywhere, no voice ===================== */
/* ---- every person has a stable id: your account id, a buddy's account id, or "n:名字" for people added on this phone ---- */
function pid(i){ const f = FRIENDS[i]; if(!f) return ""; if(f[3]) return f[3]; return i === 0 ? MEID() : "n:" + (NAMES[i] || f[0]); }
function pidx(id){ if(!id) return -1; if(id === MEID()) return 0; const i = FRIENDS.findIndex((f, k) => (f[3] || (k === 0 ? MEID() : "n:" + (NAMES[k] || f[0]))) === id); if(i >= 0) return i; if(id.startsWith("n:")){ const j = NAMES.indexOf(id.slice(2)); if(j > 0) return j; } return -1; }
const pname = i => i === 0 ? (S.me || "我") : (NAMES[i] || "旅伴");
if(FRIENDS[0] && !FRIENDS[0][3]) FRIENDS[0][3] = undefined;
/* write ids before saving, read them back after loading */
function idsOut(){ EXP.forEach(e => { if(e.pre) return; if(!e.payerId) e.payerId = pid(e.payer != null ? e.payer : 0); if(!e.splitIds) e.splitIds = (e.split || [0]).map(pid); if(e.kind === "transfer" && e.to != null && !e.toId) e.toId = pid(e.to); e.whoName = e.whoName || pname(e.payer != null ? e.payer : 0); });
  ALBUM.forEach(r => { if(!r[6]){ r[6] = pid(r[1] || 0); r[7] = pname(r[1] || 0); } });
  S.checkins.forEach(c => { if(!c.byId){ c.byId = MEID(); c.byName = S.me || "我"; } }); }
function idsIn(){ EXP.forEach(e => { if(e.payerId){ const p = pidx(e.payerId); e.payer = p; e.who = p === 0 ? "你" : p > 0 ? NAMES[p] : (e.whoName || "旅伴"); } if(e.splitIds){ e.split = e.splitIds.map(pidx).filter(i => i >= 0); if(!e.split.length) e.split = [0]; } if(e.toId){ e.to = pidx(e.toId); } });
  ALBUM.forEach(r => { if(r[6]){ const p = pidx(r[6]); r[1] = p >= 0 ? p : 0; r._who = p === 0 ? "你" : p > 0 ? NAMES[p] : (r[7] || "旅伴"); } }); }

function freshFx(){ return { day:TDATE(), shift:0, cut:{}, added:[], banner:null, grey:false, reverse:false, free:false, lost:0, rewrite:false }; }
/* fx (skill effects) live in the shared book state so the whole room sees them */

/* ---- 房主 and removing people ---- */
function amOwner(){ return !window.ROOM_OWNER || window.ROOM_OWNER === MEID(); }
function ownerIdx(){ if(!window.ROOM_OWNER) return 0; const i = pidx(window.ROOM_OWNER); return i >= 0 ? i : -1; }
function openMembers(){ const own = ownerIdx(), me = amOwner();
  sheet(`<h3>旅伴</h3><p class="sub">${ROOM() ? `房间 ${ROOM()}` : "还没连上数据库"} · ${FRIENDS.length} 个人 · 大家一起写这本手账</p>
  ${FRIENDS.map((f, i) => `<div class="li"><button data-act="avsheet:${i}" aria-label="换头像" style="padding:0; border:0; background:none">${avHTML(i, 40)}</button><span class="tx"><b>${i === 0 ? `${S.me || "我"}（你）` : NAMES[i]}</b><small>${i === own ? "房主 · 开这个房间的人" : (f[3] || "").startsWith("n:") || !f[3] && i > 0 ? "只在这台手机上" : "旅伴"}</small></span>
    ${i === own ? `<span class="privtag">房主</span>` : i > 0 && (me || (f[3] || "n:").startsWith("n:")) ? `<button class="chip" data-act="mkick:${i}">移出</button>` : ""}</div>`).join("")}
  <div class="invite"><small style="font-size:12px; color:var(--mu)">${ROOM() ? "把房间号发给朋友，他们在开始页或这里输入就能进同一个房间" : "连上数据库后，这里会出现你们房间的 6 位房间号"}</small><div class="code">${ROOM() || "— — — — — —"}</div>
    <div style="display:flex; gap:8px"><button class="chip on" data-act="copycode">复制房间号</button><button class="chip" data-act="mshare">分享给朋友</button></div></div>
  <div class="lbl">加入别人的房间</div><div class="addrow"><input id="mjoinin" placeholder="朋友的 6 位房间号" maxlength="9" autocapitalize="characters"><button class="chip on" data-act="mjoin" style="height:46px; flex-shrink:0">加入</button></div>
  <div class="lbl">现场加一个人（他没有手机也可以记账）</div><div class="addrow"><input id="mname" placeholder="名字，比如：阿杰" maxlength="6"><button class="chip" data-act="madd" style="height:46px">加进来</button></div>`); }
document.addEventListener("click", async e => { const b = e.target.closest('[data-act^="mkick:"]'); if(!b) return; e.stopImmediatePropagation(); const i = +b.dataset.act.split(":")[1], f = FRIENDS[i], n = NAMES[i]; if(!f) return;
  if(f[3] && !f[3].startsWith("n:")){ if(!window.TD_SYNC || !window.TD_SYNC.kick) return toast("要连上数据库才能移出"); const ok = await window.TD_SYNC.kick(f[3]); if(!ok) return; }
  FRIENDS.splice(i, 1); NAMES.splice(i, 1); openMembers(); toast(`${n} 已移出`); NOSTAG = true; render(); }, true);
/* local people get an id too */

document.addEventListener("click", e => { const b = e.target.closest('[data-act="madd"]'); if(!b) return; setTimeout(() => { const f = FRIENDS[FRIENDS.length - 1]; if(f && !f[3]) f[3] = "n:" + NAMES[NAMES.length - 1]; }, 0); });
/* ---- real check-in confirmation ---- */
const okCheckins = () => S.checkins.filter(c => !c.status || c.status === "ok");
function others(){ return FRIENDS.filter((f, i) => i > 0 && f[3] && !String(f[3]).startsWith("n:")).length; }
document.addEventListener("click", e => { const b = e.target.closest('[data-act="cksend"]'); if(!b || others() < 1) return; e.stopImmediatePropagation();
  const it = DAYS[CK.di].items[CK.ii], c = DAYCFG[CK.di], photo = (ckPics()[CK.pic]) || ""; if(S.checkins.some(x => x.di === CK.di && x.ii === CK.ii && x.status === "pending")) return toast("这里已经在等旅伴确认了");
  S.checkins.push({ id:uid8(), u:Date.now(), di:CK.di, ii:CK.ii, title:it.title, city:c.city, date:TDATE(), at:new Date().toTimeString().slice(0, 5), photo, mood:0, status:"pending", byId:MEID(), byName:S.me || "我" });
  FEED.unshift({ a:0, t:`${S.me || "我"} 在「${it.title}」打卡了，等你确认`, s:`${c.city} · 打卡`, ic:"pin", by:S.me || "我", at:Date.now() }); notifyRoom(`${S.me || "我"} 在「${it.title}」打卡了，等你确认`, "checkin");
  sheet(`<h3>发给旅伴了</h3><p class="sub">${NAMES.slice(1).join("、")} 确认以后，就会盖章进护照</p>${photo ? `<div class="capprev"><img src="${photo}" alt=""></div>` : ""}<div style="margin-top:12px"><button class="cbtn" data-act="close2">好</button></div>`); snd("paper"); refreshDerived(); }, true);
function pendingForMe(){ return S.checkins.filter(c => c.status === "pending" && c.byId !== MEID()); }
function pendingHTML(){ const L = pendingForMe(); if(!L.length) return ""; return L.map(c => `<div class="tips" style="border-color:rgba(159,184,216,.4)"><b>${c.byName} 在「${c.title}」打卡了</b>${c.photo ? `<img src="${c.photo}" alt="" style="width:100%; height:140px; object-fit:cover; border-radius:14px; margin:4px 0 10px">` : ""}<div style="display:flex; gap:8px"><button class="cbtn ghost" data-act="ckno:${c.id}" style="height:42px">不算</button><button class="cbtn" data-act="ckyes:${c.id}" style="height:42px">确认，盖章</button></div></div>`).join(""); }
document.addEventListener("click", e => { const b = e.target.closest('[data-act^="ckyes:"], [data-act^="ckno:"]'); if(!b) return; const [a, id] = b.dataset.act.split(":"), c = S.checkins.find(x => x.id === id); if(!c) return;
  c.status = a === "ckyes" ? "ok" : "no"; c.confirmBy = S.me || "我"; c.u = Date.now(); if(a === "ckyes") notifyRoom(`${S.me || "我"} 确认了${c.byName}在「${c.title}」的打卡，盖章了！`, "checkin"); FEED.unshift({ a:0, t: a === "ckyes" ? `${S.me || "我"} 确认了 ${c.byName} 在「${c.title}」的打卡` : `${S.me || "我"} 觉得 ${c.byName} 在「${c.title}」的打卡不算`, s:"打卡", ic:"check", by:S.me || "我", at:Date.now() });
  refreshDerived(); snd(a === "ckyes" ? "stamp" : "tap"); toast(a === "ckyes" ? "确认了，盖章！" : "好，这次不算"); NOSTAG = true; render(); });
/* ---- photos: no duplicates, and delete your own ---- */
document.addEventListener("click", e => { const b = e.target.closest('[data-act="vwdel"]'); if(!b || !VW) return; const it = VW.list[VW.i]; if(it.i == null) return; const r = ALBUM[it.i]; if(!r) return;
  if(r[6] && r[6] !== MEID() && !amOwner()) return toast("只能删自己上传的照片"); const key = (window.TD_REF && window.TD_REF(r[0])) || r[0]; (S.del = S.del || []).push("a:" + key); ALBUM.splice(it.i, 1); closeViewer(); NOSTAG = true; render(); if(curOv === "ov-x") openAlbum(); toast("照片删掉了"); });

/* ---- notifications: what buddies did since you last looked ---- */

function feedKey(f){ return [f.t, f.s].join("|"); }
function notifyNew(prevFeed, prevCut){ if(!prevFeed) return; const old = new Set(prevFeed.map(feedKey)), me = S.me || "我";
  const fresh = FEED.filter(f => !old.has(feedKey(f)) && f.by && f.by !== me); if(fresh.length){ toast(fresh.length === 1 ? fresh[0].t : `${fresh[0].t} · 还有 ${fresh.length - 1} 条新动态`); buzz([10, 40, 10]); snd("pop"); }
  const newCut = Object.keys(S.fx.cut || {}).filter(k => !(k in prevCut)); if(newCut.length && S.tab === "trip"){ setTimeout(() => newCut.forEach(k => { const row = document.querySelector(`.tl .row[data-i="${k}"]`); if(row){ row.classList.add("shot"); vcenter(row); snd("tear"); buzz([30, 20, 50]); } }), 300); } }

/* skill activations and effects post to the shared feed */
document.addEventListener("click", e => { const b = e.target.closest('[data-act="dkactivate"], [data-act^="oocgo:"], [data-act^="cutgo:"], [data-act^="addgo:"]'); if(!b) return; setTimeout(() => { const me = S.me || "我", k = DK.card || (b.dataset.act.split(":")[1] || ""), card = O && O.CARD[k];
  const a = b.dataset.act.split(":")[0], txt = a === "dkactivate" && card ? `${me} 发动了 ${k} · ${card.name}` : a === "oocgo" && card ? `${me} 的 ${k} · ${card.name} 失控了` : a === "cutgo" ? `${me} 用技能射掉了「${(DAYS[TODAY].items[+b.dataset.act.split(":")[1]] || {}).title || ""}」` : `${me} 用传送门加了一站`;
  FEED.unshift({ a:0, t:txt, s:"技能牌", ic:"grid", by:me, at:Date.now() }); notifyRoom(txt, "skill"); }, 50); });
/* ---- refresh the page you're on (games, album…) when new data arrives ---- */
window.CUR_PAGE = null;

document.addEventListener("click", e => { const b = e.target.closest('[data-act="close"], [data-act^="tab:"]'); if(b) window.CUR_PAGE = null; }, true);
function reopenPage(){ if(window.CUR_PAGE === "skills"){ const o = $("ov-x"), h2 = o && [...o.querySelectorAll(".sec h2")].find(x => x.textContent.includes("今天的牌桌")); if(h2) h2.closest(".sec").outerHTML = deckTableHTML(); return; }  const p = window.CUR_PAGE, o = $("ov-x"); if(!p || !o || !o.classList.contains("on")) return; const ae = document.activeElement; if(ae && /INPUT|TEXTAREA/.test(ae.tagName) && o.contains(ae)) return; const sc = o.querySelector(".scr"), y = sc ? sc.scrollTop : 0; NOSTAG = true;
  ({ guess:openGuess, bingo:openBingo, album:openAlbum, passport:() => openPassport(true), paper:openPaper }[p] || (() => {}))(); const s2 = o.querySelector(".scr"); s2 && (s2.scrollTop = y); }
/* pull down to refresh inside pages too */
(function(){ let y0 = null, dy = 0, sc = null;
  document.addEventListener("touchstart", e => { sc = e.target.closest(".ov.on .scr"); y0 = sc && sc.scrollTop <= 0 ? e.touches[0].clientY : null; dy = 0; }, { passive:true });
  document.addEventListener("touchmove", e => { if(y0 === null) return; dy = e.touches[0].clientY - y0; const bar = document.querySelector(".ptr"); if(bar && dy > 25){ bar.classList.add("on"); bar.firstChild.textContent = dy > 80 ? "松开刷新" : "下拉刷新"; } }, { passive:true });
  document.addEventListener("touchend", async () => { if(y0 === null) return; const go = dy > 80, bar = document.querySelector(".ptr"); y0 = null; if(!go){ bar && bar.classList.remove("on"); return; } if(bar) bar.firstChild.textContent = "刷新中…";
    try{ if(window.TD_SYNC && window.TD_SYNC.pull) await window.TD_SYNC.pull(); else window.TD_REFRESH_CUR(); }catch(err){} if(bar){ bar.firstChild.textContent = "已是最新"; setTimeout(() => bar.classList.remove("on"), 800); } }, { passive:true }); })();
/* ---- voice recording removed ---- */
function captureSheet(){ sheet(`<h3>记录此刻</h3><p class="sub">${DAYCFG[S.day].place} · ${md(DAYS[S.day].date)}</p><div class="capgrid">
  <label class="capbtn"><span class="ci" style="background:rgba(159,184,216,.18); color:#CFE0F5">${I("camera",24)}</span><span><b>拍照或传一张照片</b><small>放进大家的相册，也可以顺手做成票根</small></span><input type="file" accept="image/*" id="capfile" style="position:absolute; width:1px; height:1px; opacity:0"></label>
  <button class="capbtn" data-act="capnote"><span class="ci" style="background:rgba(232,168,100,.18); color:var(--amber)">${I("book",24)}</span><span><b>写几句</b><small>写进今天的日记，可以选字体</small></span></button></div>`);
  const f = $("capfile"); f.onchange = () => { const file = f.files && f.files[0]; if(!file) return; CAP = { src: URL.createObjectURL(file), cap:"", font:"hand", album:true, stub:false }; capPhotoSheet(); }; }

/* if an update arrives while a panel is open, redraw as soon as it closes */

/* ===================== part 21: no steps, shake starts by itself, shared deck & weather, sound session, lighter bookshelf ===================== */
/* ---- sound: ask iPhone to treat this as playback, so effects aren't silently dropped ---- */
(function(){ const go = () => { try{ if(navigator.audioSession && SETS.sound !== false) navigator.audioSession.type = "playback"; }catch(e){} }; document.addEventListener("touchend", go, { once:true, capture:true }); document.addEventListener("click", go, { once:true, capture:true }); })();
/* ---- shake: opening 求签 or 骰子 turns shaking on right away (no extra button) ---- */
function autoShake(kind){ const req = typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function" ? DeviceMotionEvent.requestPermission() : Promise.resolve(typeof DeviceMotionEvent !== "undefined" ? "granted" : "denied");
  req.then(r => { if(r !== "granted") return; if(shakeH){ shakeH.stop(); shakeH = null; } shakeH = onShake(kind === "qian" ? qianShakeTap : () => rollNow(1.3)); const tip = kind === "qian" ? "摇三下手机就会出签" : "摇一摇手机就会掷骰子"; toast(tip); }).catch(() => {}); }
document.addEventListener("click", e => { const b = e.target.closest('[data-act="motion:qian"], [data-act="dice"]'); if(!b) return; autoShake(b.dataset.act === "dice" ? "dice" : "qian"); }, true);
document.addEventListener("click", e => { const b = e.target.closest(".mo button, .mo [data-act='close'], [data-act='close']"); if(b && shakeH && !document.querySelector(".mo")){ shakeH.stop(); shakeH = null; } }, true);
/* hide the old "摇一摇" buttons */

/* ---- the deck table shows what your buddies really drew today ---- */
function syncMyDeck(){ if(!S.games) return; S.games.deck = S.games.deck || {}; if(DK.card){ const cur = S.games.deck[MEID()]; const v = { day:TDATE(), card:DK.card, used:!!DK.used, name:S.me || "我", at: (cur && cur.card === DK.card && cur.used === !!DK.used) ? cur.at : Date.now() }; S.games.deck[MEID()] = v; } }

function deckTableHTML(){ const today = TDATE(), deck = (S.games && S.games.deck) || {}, others = FRIENDS.map((f, i) => i).filter(i => i > 0);
  const seat = i => { const d = deck[pid(i)], ok = d && d.day === today; return `<div class="seat">${ok && d.used ? cardHTML2(d.card, { cls:"mini", state:"done" }) : `<div class="tc mini down" style="${ok ? "" : "opacity:.35"}"><div class="tc-in"><div class="tc-face tc-back">${O.CARD_BACK}</div></div></div>`}<b>${NAMES[i]}</b><small>${ok ? (d.used ? `✓ 发动了 ${d.card} · ${(O.CARD[d.card] || {}).name || ""}` : "抽了，还没发动") : "今天还没抽"}</small></div>`; };
  return `<div class="sec"><h2>今天的牌桌<span>${others.length ? "旅伴发动后才能看到他们的牌" : "旅伴加入后会坐在这里"}</span></h2><div class="seats">${others.map(seat).join("")}
    <div class="seat">${DK.card ? cardHTML2(DK.card, { cls:"mini", state: DK.used ? "done" : "" }) : `<div class="tc mini down" style="opacity:.35"><div class="tc-in"><div class="tc-face tc-back">${O.CARD_BACK}</div></div></div>`}<b>你</b><small>${DK.card ? (DK.used ? "✓ 已发动" : "未发动") : "还没抽"}</small></div></div></div>`; }

/* ---- 催雨 / 落雪 reach everyone in the room ---- */
let atmosKind = null; 
function shareAtmos(kind){ S.fx.atmos = { kind, day:TDATE(), by:S.me || "我" }; notifyRoom(`${S.me || "我"} 用了${kind === "rain" ? "催雨，今天全房间下雨" : "落雪，今天全房间下雪"}`, "skill"); }
ACT_FX["6"] = () => { startAtmos("rain"); shareAtmos("rain"); setBanner("6", "催雨", "今天全房间都在下雨", 0, true); };
ACT_FX["5"] = () => { startAtmos("snow"); shareAtmos("snow"); setBanner("5", "落雪", "今天全房间都在下雪", 0, true); };
OOC_FX["6"] = () => { startAtmos("rain"); shareAtmos("rain"); setBanner("6", "催雨 · 失控", "雨会一直下到中午"); goHome(); };
OOC_FX["5"] = () => { startAtmos("snow"); shareAtmos("snow"); setBanner("5", "落雪 · 失控", "今天整天都在飘雪"); goHome(); };

/* the activation path for 6/5 also shares the weather */
document.addEventListener("click", e => { const b = e.target.closest('[data-act="dkactivate"]'); if(!b) return; setTimeout(() => { if(DK.card === "6") shareAtmos("rain"); if(DK.card === "5") shareAtmos("snow"); }, 100); });
/* when the app opens, keep today's shared weather going */
setTimeout(() => { const a = S.fx && S.fx.atmos; if(a && a.day === TDATE() && !atmosKind) startAtmos(a.kind); }, 1500);
/* ---- steps are gone: home shows today's spending instead ---- */
function todaySpend(){ return EXP.filter(e => e.at === TDATE()).reduce((n, e) => n + myShare(e), 0); }

fi = 0; drawFortune(); setTimeout(() => { if(!window.TD_BOOTED) bootTrip(); }, 1200);
document.querySelectorAll("[id=sdate]").forEach(t => t.textContent = "NOV 4 · WED");

/* ===================== trip dates: move the trip, add days, or shorten it ===================== */
let DT = null;
function dateSheet(){ if(!DAYS.length) return; DT = { start:TRIP.start, len:DAYS.length };
  sheet(`<h3>旅行日期</h3><p class="sub">改了以后，每天的安排会跟着一起移动</p>
    <div class="lbl">哪天出发</div><input class="dinput" id="dtstart" type="date" value="${DT.start}" style="margin-top:8px">
    <div class="lbl">玩几天</div><div class="step" style="margin-top:8px"><button data-act="dtlen:-1" aria-label="少一天">−</button><b id="dtlen">${DT.len}</b><button data-act="dtlen:1" aria-label="多一天">+</button><span style="color:var(--mu); font-size:13px">天</span></div>
    <p id="dtnote" style="font-size:13px; line-height:1.6; margin-top:14px"></p>
    <div style="margin-top:12px"><button class="cbtn" data-act="dtsave">保存日期</button></div>`); dateNote(); }
function dateNote(){ const n = $("dtnote"); if(!n) return; const st = ($("dtstart") || {}).value || DT.start, end = addDays(st, DT.len - 1);
  const lost = DAYS.slice(DT.len).reduce((k, d) => k + d.items.length, 0), lostDays = Math.max(0, DAYS.length - DT.len);
  n.innerHTML = `${+st.slice(5, 7)} 月 ${+st.slice(8)} 日 — ${+end.slice(5, 7)} 月 ${+end.slice(8)} 日 · ${DT.len} 天` + (lostDays ? `<br><span style="color:#FFB7A6">最后 ${lostDays} 天${lost ? `有 ${lost} 个安排会被删掉` : "会去掉"}；那几天的照片和打卡会移到最后一天</span>` : DT.len > DAYS.length ? `<br><span style="color:var(--mu)">会在最后加 ${DT.len - DAYS.length} 天空白的，之后可以加安排</span>` : ""); }
function saveDates(){ const b = BOOKS2.find(x => x.id === S.curBook); if(!b || !b.trip) return; const st = ($("dtstart") || {}).value || DT.start, len = DT.len, old = DAYS.length;
  stashBook(b.id); const T = b.trip, lastCity = (T.days[Math.min(len, old) - 1] || T.days[0] || { city:(CITIES[0] || {}).name || "" }).city;
  T.days = Array.from({ length:len }, (_, i) => i < old ? { ...T.days[i], date:addDays(st, i) } : { date:addDays(st, i), city:lastCity, title:"", items:[] });
  T.start = st; T.end = addDays(st, len - 1); b.start = T.start; b.end = T.end;
  if(b.state){ const cl = di => Math.min(di, len - 1); (b.state.album || []).forEach(r => { if(typeof r[4] === "number") r[4] = cl(r[4]); }); (b.state.checkins || []).forEach(c => { c.di = cl(c.di); c.u = Date.now(); }); }
  applyTrip(T); restoreBook(b.id); closeSheet(); NOSTAG = true; render(); toast(`日期改好了 · ${TRIP.rangeCN}`); snd("success"); }
document.addEventListener("click", e => { const b = e.target.closest("[data-act]"); if(!b) return; const [a, x] = b.dataset.act.split(":");
  if(a === "dates") dateSheet();
  else if(a === "dtlen"){ DT.len = Math.max(1, Math.min(60, DT.len + +x)); $("dtlen").textContent = DT.len; dateNote(); }
  else if(a === "dtsave") saveDates(); });
document.addEventListener("change", e => { if(e.target.id === "dtstart") dateNote(); });

/* ===================== notifications when the app is closed ===================== */
let lastPush = {};
function notifyRoom(text, tag){ const p = window.TD_SYNC && window.TD_SYNC.push; if(!p || !p.notify) return; const k = tag + "|" + text, now = Date.now(); if(lastPush[k] && now - lastPush[k] < 30000) return; lastPush[k] = now; p.notify("旅行手账", text, tag); }
function pushRowHTML(){ const p = window.TD_SYNC && window.TD_SYNC.push; let small, btn = "";
  if(!p) small = "要连上数据库才能用";
  else if(!p.supported()) small = "这个网站还没设好通知钥匙（看 README）";
  else if(p.needsHomeScreen()) small = "iPhone 要先把 App 加到主屏幕，再从主屏幕打开，才能开通知";
  else if(p.state() === "denied") small = "手机设置里拒绝了通知：去 设置 → 通知 → 旅行手账 打开";
  else if(p.state() === "granted" && S.pushOn){ small = "已开启 · 旅伴发动技能、打卡等你确认时，App 关着也会提醒你"; btn = `<button class="chip" data-act="pushoff">关闭</button>`; }
  else { small = "旅伴发动技能、打卡等你确认、开猜价格时提醒你"; btn = `<button class="chip on" data-act="pushon">打开</button>`; }
  return `<div class="li" id="pushrow"><span class="tx"><b>通知</b><small>${small}</small></span>${btn}</div>`; }
document.addEventListener("click", async e => { const b = e.target.closest('[data-act="pushon"], [data-act="pushoff"]'); if(!b) return; const p = window.TD_SYNC && window.TD_SYNC.push; if(!p) return;
  try{ if(b.dataset.act === "pushon"){ const r = await p.enable(); S.pushOn = r === "on"; toast(S.pushOn ? "通知打开了" : "没有拿到通知权限"); } else { await p.disable(); S.pushOn = false; toast("通知关掉了"); } }catch(err){ toast("开通知失败：" + (err.message || err)); }
  const row = $("pushrow"); if(row) row.outerHTML = pushRowHTML(); });

/* ===================== 原创小动画：舷窗日落 · 海边脚印 · 绣出这趟旅程 ===================== */
/* Same shape as the other mini animations: full-screen canvas, typed caption, hint, × to close, 30fps, paused when hidden, paper grain. */
let moGrain = null;
function moPrint(x, w, h, dark){ if(!moGrain){ const g = document.createElement("canvas"); g.width = g.height = 160; const c = g.getContext("2d"), d = c.createImageData(160, 160); for(let i = 0; i < d.data.length; i += 4){ const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 22; } c.putImageData(d, 0, 0); moGrain = x.createPattern(g, "repeat"); }
  x.save(); x.globalCompositeOperation = dark ? "screen" : "multiply"; x.globalAlpha = dark ? .35 : .55; x.fillStyle = moGrain; x.fillRect(0, 0, w, h); x.restore();
  const v = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .35, w / 2, h / 2, Math.max(w, h) * .75); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, dark ? "rgba(0,0,0,.45)" : "rgba(60,40,20,.18)"); x.fillStyle = v; x.fillRect(0, 0, w, h); }
const MY_PIECES = {
  /* ---- 舷窗日落：拖云、把太阳拖进海里 ---- */
  window: { name:"舷窗日落", sub:"拖一拖云，看太阳落海", tile:["#101828", "#E6C98A"], dark:true, bg:"#0B1220",
    icon:'<rect x="17" y="8" width="22" height="40" rx="11"/><circle cx="28" cy="31" r="5"/><path d="M19 38q4.5-3 9 0t9 0"/>',
    caption: () => "窗外的太阳，\n正在慢慢落进海里", hint: () => "左右拖动云 · 往下拖让太阳落得快一点",
    init(s, w, h){ s.p = 0; s.vx = 0; s.clouds = Array.from({ length:7 }, (_, i) => ({ x:Math.random(), y:.18 + Math.random() * .4, r:.09 + Math.random() * .09, sp:.012 + Math.random() * .02, a:.55 + Math.random() * .35 })); s.stars = Array.from({ length:40 }, () => [Math.random(), Math.random() * .55, Math.random()]); },
    drag(s, dx, dy, w, h){ s.vx += dx / w * 2.2; if(dy > 0) s.p = Math.min(1, s.p + dy / h * .9); },
    frame(s, x, w, h, t, dt){ s.p = Math.min(1, s.p + dt / 75); s.vx *= .92; const p = s.p;
      const W = Math.min(w * .64, h * .42), H = W * 1.62, X = (w - W) / 2, Y = h * .14, R = W / 2, horizon = Y + H * .64;
      const lerp = (a, b, k) => a + (b - a) * k, mix = (c1, c2, k) => `rgb(${c1.map((v, i) => Math.round(lerp(v, c2[i], k))).join(",")})`;
      x.save(); x.beginPath(); x.roundRect(X, Y, W, H, R); x.clip();
      const sky = x.createLinearGradient(0, Y, 0, horizon); sky.addColorStop(0, mix([110, 160, 214], [14, 22, 52], p)); sky.addColorStop(.62, mix([246, 196, 150], [74, 52, 98], p)); sky.addColorStop(1, mix([252, 214, 160], [228, 120, 82], Math.min(1, p * 1.4))); x.fillStyle = sky; x.fillRect(X, Y, W, horizon - Y);
      if(p > .55){ x.fillStyle = "#fff"; s.stars.forEach(([a, b, c]) => { x.globalAlpha = (p - .55) * 2 * (.4 + .6 * Math.abs(Math.sin(t * 1.3 + c * 9))); x.fillRect(X + a * W, Y + b * (horizon - Y), 1.6, 1.6); }); x.globalAlpha = 1; }
      const sy = lerp(Y + H * .22, horizon + R * .55, p), sr = W * .14;
      const glow = x.createRadialGradient(w / 2, sy, 0, w / 2, sy, sr * 3.2); glow.addColorStop(0, `rgba(255,214,150,${.55 - p * .3})`); glow.addColorStop(1, "rgba(255,180,120,0)"); x.fillStyle = glow; x.fillRect(X, Y, W, horizon - Y);
      x.fillStyle = mix([255, 240, 205], [255, 150, 90], p); x.beginPath(); x.arc(w / 2, sy, sr, 0, 7); x.fill();
      s.clouds.forEach(c => { c.x += (c.sp * dt + s.vx * dt * 6); if(c.x > 1.4) c.x = -.4; if(c.x < -.4) c.x = 1.4; const cx = X + c.x * W, cy = Y + c.y * (horizon - Y), cr = c.r * W * 1.6;
        x.fillStyle = mix([255, 250, 244], [120, 90, 120], p); x.globalAlpha = c.a * (1 - p * .35); for(let k = 0; k < 4; k++){ x.beginPath(); x.ellipse(cx + (k - 1.5) * cr * .55, cy + Math.sin(k * 2) * cr * .12, cr * (.55 + (k % 2) * .25), cr * .32, 0, 0, 7); x.fill(); } x.globalAlpha = 1; });
      const sea = x.createLinearGradient(0, horizon, 0, Y + H); sea.addColorStop(0, mix([70, 110, 160], [26, 30, 64], p)); sea.addColorStop(1, mix([24, 50, 92], [10, 14, 34], p)); x.fillStyle = sea; x.fillRect(X, horizon, W, Y + H - horizon);
      x.strokeStyle = mix([255, 220, 170], [255, 150, 90], p); for(let k = 0; k < 14; k++){ const yy = horizon + 6 + k * (Y + H - horizon) / 14, ww = (W * .32) * (1 - k / 18) * (p < .95 ? 1 : .3); x.globalAlpha = .55 - k * .03; x.lineWidth = 1.4; x.beginPath(); x.moveTo(w / 2 - ww / 2 + Math.sin(t * 2 + k) * 6, yy); x.lineTo(w / 2 + ww / 2 + Math.sin(t * 2 + k) * 6, yy); x.stroke(); }
      x.globalAlpha = .25; x.strokeStyle = "#fff"; for(let k = 0; k < 9; k++){ const yy = horizon + 10 + k * 16; x.beginPath(); for(let xx = X; xx <= X + W; xx += 8) x.lineTo(xx, yy + Math.sin(xx / 22 + t * 1.6 + k) * 2); x.stroke(); } x.globalAlpha = 1;
      x.restore();
      x.lineWidth = 9; x.strokeStyle = "#1B2438"; x.beginPath(); x.roundRect(X - 4.5, Y - 4.5, W + 9, H + 9, R + 4.5); x.stroke();
      const rim = x.createLinearGradient(X, Y, X + W, Y + H); rim.addColorStop(0, "#EAD6A6"); rim.addColorStop(.5, "#C9A86A"); rim.addColorStop(1, "#9A773C"); x.lineWidth = 3; x.strokeStyle = rim; x.beginPath(); x.roundRect(X - 10, Y - 10, W + 20, H + 20, R + 10); x.stroke();
      x.fillStyle = "rgba(255,255,255,.06)"; x.beginPath(); x.ellipse(X + W * .3, Y + H * .25, W * .1, H * .18, -.3, 0, 7); x.fill();
      if(p >= 1 && !s.done){ s.done = true; const cap = document.querySelector(".mo .mo-cap"); if(cap) cap.textContent = "今天的太阳落下了。\n晚安，" + (TRIP.cityNames || "旅途") + "。"; snd("success"); } } },
  /* ---- 海边脚印：手指走出脚印，浪来抹掉 ---- */
  sand: { name:"海边脚印", sub:"走一走，等浪来", tile:["#E9D6B4", "#3E6E8E"], dark:false, bg:"#E8D5B0",
    icon:'<path d="M8 16q10-6 20 0t20 0"/><ellipse cx="22" cy="36" rx="4" ry="7"/><ellipse cx="34" cy="28" rx="4" ry="7"/>',
    caption: () => "走过的地方，\n浪会替你记住一下下", hint: () => "手指在沙上走 · 等浪打上来",
    init(s, w, h){ s.prints = []; s.side = 1; s.last = null; s.wave = { y:0, reach:.3, dir:1, t:0, next:2 }; s.wet = 0; s.shells = Array.from({ length:7 }, () => [Math.random() * w, h * (.35 + Math.random() * .6), Math.random() * 6]); },
    drag(s, dx, dy, w, h, px, py){ if(!s.last){ s.last = [px, py]; return; } const ddx = px - s.last[0], ddy = py - s.last[1], d = Math.hypot(ddx, ddy); if(d < 30) return; const a = Math.atan2(ddy, ddx), nx = -Math.sin(a), ny = Math.cos(a);
      s.prints.push({ x:px + nx * 9 * s.side, y:py + ny * 9 * s.side, a, side:s.side, life:1 }); s.side *= -1; s.last = [px, py]; if(s.prints.length > 120) s.prints.shift(); snd("tap"); buzz(3); },
    up(s){ s.last = null; },
    frame(s, x, w, h, t, dt){ const sand = x.createLinearGradient(0, 0, 0, h); sand.addColorStop(0, "#D9C29A"); sand.addColorStop(1, "#EEDDBC"); x.fillStyle = sand; x.fillRect(0, 0, w, h);
      x.fillStyle = "rgba(120,90,50,.08)"; for(let i = 0; i < 220; i++){ const rx = (i * 97.13 % 1) * w, ry = (i * 57.71 % 1) * h; x.fillRect(rx, ry, 2, 2); }
      s.shells.forEach(([sx, sy, r]) => { x.fillStyle = "#F4E9D8"; x.strokeStyle = "rgba(140,100,70,.5)"; x.lineWidth = 1; x.beginPath(); x.ellipse(sx, sy, 5 + r * .4, 4 + r * .3, r, 0, 7); x.fill(); x.stroke(); });
      const W2 = s.wave; W2.t += dt; if(W2.dir === 0){ if(W2.t > W2.next){ W2.dir = 1; W2.t = 0; W2.reach = .22 + Math.random() * .3; snd("paper"); } } else if(W2.dir === 1){ W2.y = Math.min(W2.reach, W2.y + dt * .22); if(W2.y >= W2.reach){ W2.dir = -1; } } else { W2.y = Math.max(0, W2.y - dt * .12); if(W2.y <= 0){ W2.dir = 0; W2.t = 0; W2.next = 3 + Math.random() * 4; } }
      const edge = W2.y * h, maxWet = W2.dir === -1 ? W2.reach * h : edge; s.wet = Math.max(s.wet * (1 - dt * .2), maxWet);
      if(s.wet > 2){ const wg = x.createLinearGradient(0, 0, 0, s.wet + 26); wg.addColorStop(0, "rgba(110,85,55,.26)"); wg.addColorStop(Math.max(0, (s.wet - 18) / (s.wet + 26)), "rgba(110,85,55,.2)"); wg.addColorStop(1, "rgba(110,85,55,0)"); x.fillStyle = wg; x.beginPath(); x.moveTo(0, 0); x.lineTo(w, 0); for(let xx = w; xx >= 0; xx -= 14) x.lineTo(xx, s.wet + 26 + Math.sin(xx / 41 + 1.3) * 6); x.closePath(); x.fill(); }
      s.prints.forEach(p => { if(p.y < edge + 6) p.life -= dt * 1.6; else if(p.y < s.wet) p.life -= dt * .15; });
      s.prints = s.prints.filter(p => p.life > 0);
      s.prints.forEach(p => { x.save(); x.translate(p.x, p.y); x.rotate(p.a + Math.PI / 2); x.globalAlpha = Math.max(0, p.life) * .7; x.fillStyle = "#A88B60";
        x.beginPath(); x.ellipse(0, 4, 5.5, 9, 0, 0, 7); x.fill(); x.beginPath(); x.ellipse(0, -9, 4.4, 5, 0, 0, 7); x.fill();
        for(let k = 0; k < 5; k++){ x.beginPath(); x.arc(-5 + k * 2.6 * (p.side > 0 ? 1 : 1), -16 - (k === 0 || k === 4 ? 0 : 1.5), k === 0 ? 2 : 1.4, 0, 7); x.fill(); } x.restore(); });
      if(edge > 1){ const sea = x.createLinearGradient(0, 0, 0, edge); sea.addColorStop(0, "#3E6E8E"); sea.addColorStop(.75, "#6FA5B8"); sea.addColorStop(1, "rgba(190,225,228,.9)"); x.fillStyle = sea; x.beginPath(); x.moveTo(0, 0); x.lineTo(w, 0);
        for(let xx = w; xx >= 0; xx -= 10) x.lineTo(xx, edge + Math.sin(xx / 34 + t * 2.2) * 7 + Math.sin(xx / 13 + t) * 3); x.closePath(); x.fill();
        x.strokeStyle = "rgba(255,255,255,.85)"; x.lineWidth = 3; x.beginPath(); for(let xx = 0; xx <= w; xx += 10) x.lineTo(xx, edge + Math.sin(xx / 34 + t * 2.2) * 7 + Math.sin(xx / 13 + t) * 3); x.stroke();
        x.fillStyle = "rgba(255,255,255,.6)"; for(let k = 0; k < 30; k++){ const fx = (k * 61.7 + t * 20) % w; x.beginPath(); x.arc(fx, edge + Math.sin(fx / 34 + t * 2.2) * 7 + 5 + (k % 3) * 3, 1.4, 0, 7); x.fill(); } } } },
  /* ---- 绣出这趟旅程：这趟真的地方，一针针绣过去 ---- */
  stitch: { name:"绣出这趟旅程", sub:"点一下，绣到下一站", tile:["#EFE6D2", "#B3341E"], dark:false, bg:"#E9DFC9",
    icon:'<circle cx="28" cy="28" r="20"/><path d="M16 34l6-4M26 27l6-4M36 20l4-3" /><path d="M14 36l3 3M14 39l3-3M38 15l3 3M38 18l3-3"/>',
    caption: () => `${TRIP.name || "这趟旅程"}\n一针一针，绣在布上`, hint: () => "点一下，绣到下一站",
    init(s, w, h){ const cx = w / 2, cy = h * .44, R = Math.min(w * .42, h * .3); s.hoop = { cx, cy, R };
      let pts = (CITIES || []).filter(c => c.ll).map(c => ({ n:c.name, lat:c.ll[0], lng:c.ll[1], col:c.color }));
      if(pts.length < 2) pts = (GEO || []).slice().sort((a, b) => ((a[3] || [0])[0] || 0) - ((b[3] || [0])[0] || 0)).map(g => ({ n:g[0], lat:g[1], lng:g[2] })).slice(0, 9);
      if(pts.length < 2){ const L = DAYS.flatMap(d => d.items.filter(i => i.kind === "sight").map(i => i.title)).slice(0, 8); pts = L.map((n, i) => ({ n, lat:Math.sin(i * 1.7) * 3, lng:Math.cos(i * 1.3) * 3 + i * .6 })); }
      if(!pts.length) pts = [{ n:"出发", lat:0, lng:0 }, { n:"回家", lat:1, lng:1 }];
      const la = pts.map(p => p.lat), ln = pts.map(p => p.lng), mnA = Math.min(...la), mxA = Math.max(...la), mnN = Math.min(...ln), mxN = Math.max(...ln), sc = Math.max(mxA - mnA, mxN - mnN) || 1;
      s.pts = pts.map((p, i) => ({ ...p, x: cx + ((p.lng - (mnN + mxN) / 2) / sc) * R * 1.25, y: cy - ((p.lat - (mnA + mxA) / 2) / sc) * R * 1.25 }));
      s.pts.forEach(p => { const d = Math.hypot(p.x - cx, p.y - cy); if(d > R * .78){ p.x = cx + (p.x - cx) * R * .78 / d; p.y = cy + (p.y - cy) * R * .78 / d; } });
      const COLS = ["#B3341E", "#2F5D8A", "#3F7A4E", "#C98A1C", "#7A3E8E", "#1F7A7A", "#A0522D", "#5A5A8A"]; s.segs = []; s.cur = 0; s.anim = null; s.done = false;
      for(let i = 0; i < s.pts.length - 1; i++){ const a = s.pts[i], b = s.pts[i + 1], mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, nx = -(b.y - a.y), ny = b.x - a.x, k = .18 * (i % 2 ? 1 : -1); s.segs.push({ a, b, c:[mx + nx * k, my + ny * k], col:COLS[i % COLS.length], prog:0 }); }
      s.knots = []; },
    tap(s){ if(s.anim) return; if(s.cur >= s.segs.length){ s.knots.push(...Array.from({ length:6 }, () => ({ x:s.hoop.cx + (Math.random() - .5) * s.hoop.R * 1.4, y:s.hoop.cy + (Math.random() - .5) * s.hoop.R * 1.4, c:["#B3341E", "#C98A1C", "#2F5D8A"][Math.floor(Math.random() * 3)] }))); snd("pop"); return; } s.anim = s.segs[s.cur]; snd("paper"); },
    frame(s, x, w, h, t, dt){ x.fillStyle = "#E9DFC9"; x.fillRect(0, 0, w, h); x.strokeStyle = "rgba(120,100,70,.08)"; x.lineWidth = 1; for(let k = 0; k < w; k += 4){ x.beginPath(); x.moveTo(k, 0); x.lineTo(k, h); x.stroke(); } for(let k = 0; k < h; k += 4){ x.beginPath(); x.moveTo(0, k); x.lineTo(w, k); x.stroke(); }
      const H0 = s.hoop; x.fillStyle = "#F3ECDC"; x.beginPath(); x.arc(H0.cx, H0.cy, H0.R, 0, 7); x.fill();
      x.strokeStyle = "rgba(150,120,80,.1)"; for(let k = -H0.R; k < H0.R; k += 3){ x.beginPath(); x.moveTo(H0.cx + k, H0.cy - H0.R); x.lineTo(H0.cx + k, H0.cy + H0.R); x.stroke(); }
      const qb = (sg, u) => { const [cx2, cy2] = sg.c, a = sg.a, b = sg.b, v = 1 - u; return [v * v * a.x + 2 * v * u * cx2 + u * u * b.x, v * v * a.y + 2 * v * u * cy2 + u * u * b.y]; };
      if(s.anim){ s.anim.prog = Math.min(1, s.anim.prog + dt * .55); if(s.anim.prog >= 1){ s.anim = null; s.cur++; snd("stamp"); buzz(8); if(s.cur >= s.segs.length && !s.done){ s.done = true; const cap = document.querySelector(".mo .mo-cap"); if(cap) cap.textContent = "这趟旅程，绣好了。"; snd("success"); } } }
      s.segs.forEach(sg => { if(sg.prog <= 0) return; const n = 34, shown = Math.floor(n * sg.prog); x.lineCap = "round";
        for(let k = 0; k < shown; k += 2){ const [x1, y1] = qb(sg, k / n), [x2, y2] = qb(sg, Math.min(1, (k + 1.2) / n)); x.strokeStyle = "rgba(0,0,0,.18)"; x.lineWidth = 3.4; x.beginPath(); x.moveTo(x1 + .8, y1 + 1.2); x.lineTo(x2 + .8, y2 + 1.2); x.stroke(); x.strokeStyle = sg.col; x.lineWidth = 2.8; x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); x.stroke(); }
        if(sg.prog < 1){ const [nx2, ny2] = qb(sg, sg.prog); x.strokeStyle = "#D8D8DC"; x.lineWidth = 2; x.beginPath(); x.moveTo(nx2, ny2); x.lineTo(nx2 + 16, ny2 - 22); x.stroke(); x.fillStyle = "#fff"; x.globalAlpha = .7 + .3 * Math.sin(t * 12); x.beginPath(); x.arc(nx2 + 16, ny2 - 22, 1.6, 0, 7); x.fill(); x.globalAlpha = 1; } });
      s.pts.forEach((p, i) => { const reached = i <= s.cur; x.strokeStyle = reached ? (s.segs[Math.max(0, i - 1)] || { col:"#B3341E" }).col : "rgba(80,60,40,.35)"; x.lineWidth = 2.6; const r = 6;
        x.beginPath(); x.moveTo(p.x - r, p.y - r); x.lineTo(p.x + r, p.y + r); x.moveTo(p.x + r, p.y - r); x.lineTo(p.x - r, p.y + r); x.stroke();
        if(reached){ x.fillStyle = "#3A2E22"; x.font = `600 13px "Noto Serif SC", serif`; x.textAlign = "center"; x.fillText(p.n.slice(0, 8), p.x, p.y + 22); } });
      s.knots.forEach(k => { x.fillStyle = k.c; x.beginPath(); x.arc(k.x, k.y, 3.2, 0, 7); x.fill(); x.fillStyle = "rgba(255,255,255,.5)"; x.beginPath(); x.arc(k.x - 1, k.y - 1, 1, 0, 7); x.fill(); });
      x.lineWidth = 14; x.strokeStyle = "#B88A55"; x.beginPath(); x.arc(H0.cx, H0.cy, H0.R + 7, 0, 7); x.stroke(); x.lineWidth = 2; x.strokeStyle = "rgba(90,60,30,.5)"; x.beginPath(); x.arc(H0.cx, H0.cy, H0.R + 14, 0, 7); x.stroke(); x.beginPath(); x.arc(H0.cx, H0.cy, H0.R, 0, 7); x.stroke();
      x.fillStyle = "#9A7244"; x.fillRect(H0.cx - 9, H0.cy - H0.R - 26, 18, 14); x.fillStyle = "#C9A86A"; x.beginPath(); x.arc(H0.cx, H0.cy - H0.R - 30, 6, 0, 7); x.fill(); } }
};
function playMine(k){ const P = MY_PIECES[k]; if(!P) return; const old = document.querySelector(".mo"); old && old.remove();
  const ov = document.createElement("div"); ov.className = "mo" + (P.dark ? " dark" : ""); ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", P.name);
  ov.innerHTML = `<canvas></canvas><div class="mo-grain"></div><button class="sc-x" aria-label="关闭">×</button><p class="mo-cap"></p><small class="mo-hint">${P.hint()}</small>`;
  document.body.appendChild(ov); requestAnimationFrame(() => ov.classList.add("on"));
  const cv = ov.querySelector("canvas"), x = cv.getContext("2d"), dpr = Math.min(2, devicePixelRatio || 1), s = {}; let w, h;
  const size = () => { w = ov.clientWidth; h = ov.clientHeight; cv.width = w * dpr; cv.height = h * dpr; cv.style.width = w + "px"; cv.style.height = h + "px"; x.setTransform(dpr, 0, 0, dpr, 0, 0); }; size(); P.init(s, w, h); P.setup && P.setup(ov, s, w, h);
  const cap = ov.querySelector(".mo-cap"), full = P.caption(); let ci = 0; const type = setInterval(() => { ci++; cap.textContent = full.slice(0, ci); if(ci >= full.length) clearInterval(type); }, 70);
  let run = true, last = performance.now(), t = 0;
  const loop = now => { if(!run) return; requestAnimationFrame(loop); if(document.hidden || now - last < 31) return; const dt = Math.min(.06, (now - last) / 1000); last = now; t += dt; x.globalAlpha = 1; x.fillStyle = P.bg; x.fillRect(0, 0, w, h); P.frame(s, x, w, h, t, REDUCE ? dt * .3 : dt); moPrint(x, w, h, P.dark); };
  requestAnimationFrame(loop);
  let down = null; cv.addEventListener("pointerdown", e => { down = [e.clientX, e.clientY]; cv.setPointerCapture(e.pointerId); P.drag && P.drag(s, 0, 0, w, h, e.clientX, e.clientY); });
  cv.addEventListener("pointermove", e => { if(!down) return; const dx = e.clientX - down[0], dy = e.clientY - down[1]; down = [e.clientX, e.clientY]; P.drag && P.drag(s, dx, dy, w, h, e.clientX, e.clientY); });
  const up = () => { if(!down) return; down = null; P.up && P.up(s); }; cv.addEventListener("pointerup", e => { up(); P.tap && P.tap(s, e.clientX, e.clientY, w, h); }); cv.addEventListener("pointercancel", up);
  const close = () => { run = false; clearInterval(type); P.teardown && P.teardown(s); ov.classList.remove("on"); setTimeout(() => ov.remove(), 450); };
  ov.querySelector(".sc-x").addEventListener("click", close); }

/* ===================== 原创小动画（第二组）：雾窗写字 · 寄一张明信片 · 打卡星座 · 地铁线路图 ===================== */
const tripCity = () => (DAYCFG[TODAY] && DAYCFG[TODAY].city) || (CITIES[0] && CITIES[0].name) || "旅途";
const hashN = (str, n) => { let h = 7; for(const c of String(str)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h % n; };
Object.assign(MY_PIECES, {
  /* ---- 雾窗写字 ---- */
  fog: { name:"雾窗写字", sub:"在起雾的窗上写字", tile:["#1B2230", "#9FB8D8"], dark:true, bg:"#0E1320",
    icon:'<rect x="10" y="10" width="36" height="36" rx="6"/><path d="M18 30c3-6 6 4 9-2s5 3 9-1"/><path d="M40 16v6M22 38v4"/>',
    caption: () => `在起雾的车窗上，\n写下「${tripCity()}」`, hint: () => "手指写字 · 雾会慢慢回来",
    init(s, w, h){ s.lights = Array.from({ length:34 }, () => ({ x:Math.random() * w, y:h * (.25 + Math.random() * .6), r:10 + Math.random() * 34, c:["255,196,120", "255,150,90", "150,200,255", "255,230,170", "200,120,220"][Math.floor(Math.random() * 5)], tw:Math.random() * 6, v:(Math.random() - .5) * 6 }));
      s.fog = document.createElement("canvas"); s.fog.width = w; s.fog.height = h; s.fx = s.fog.getContext("2d"); s.fx.fillStyle = "rgba(170,182,198,.78)"; s.fx.fillRect(0, 0, w, h);
      s.drops = Array.from({ length:26 }, () => ({ x:Math.random() * w, y:Math.random() * h, r:1.2 + Math.random() * 2.6, v:0, slide:false })); s.last = null; },
    erase(s, x0, y0, x1, y1, wd){ const f = s.fx; f.save(); f.globalCompositeOperation = "destination-out"; f.lineCap = "round"; f.lineJoin = "round"; [[wd * 1.5, .25], [wd, .55], [wd * .6, 1]].forEach(([lw, a]) => { f.strokeStyle = `rgba(0,0,0,${a})`; f.lineWidth = lw; f.beginPath(); f.moveTo(x0, y0); f.lineTo(x1, y1); f.stroke(); }); f.restore(); },
    drag(s, dx, dy, w, h, px, py){ if(s.last) MY_PIECES.fog.erase(s, s.last[0], s.last[1], px, py, 22); s.last = [px, py]; if(Math.random() < .25) buzz(2); },
    up(s){ s.last = null; },
    frame(s, x, w, h, t, dt){ const sky = x.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, "#0B1020"); sky.addColorStop(1, "#1C2236"); x.fillStyle = sky; x.fillRect(0, 0, w, h);
      x.globalCompositeOperation = "lighter"; s.lights.forEach(l => { l.x += l.v * dt; if(l.x < -60) l.x = w + 60; if(l.x > w + 60) l.x = -60; const a = .32 + .18 * Math.sin(t * 1.4 + l.tw), g = x.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r); g.addColorStop(0, `rgba(${l.c},${a})`); g.addColorStop(1, `rgba(${l.c},0)`); x.fillStyle = g; x.beginPath(); x.arc(l.x, l.y, l.r, 0, 7); x.fill(); }); x.globalCompositeOperation = "source-over";
      const f = s.fx; f.globalCompositeOperation = "source-over"; f.fillStyle = `rgba(170,182,198,${dt * .06})`; f.fillRect(0, 0, w, h);
      const sliding = s.drops.filter(d => d.slide).length; s.drops.forEach(d => { if(d.slide){ d.v = Math.min(55, d.v + dt * 30); const oy = d.y; d.y += d.v * dt; const f2 = s.fx; f2.save(); f2.globalCompositeOperation = "destination-out"; f2.strokeStyle = "rgba(0,0,0,.35)"; f2.lineWidth = d.r * 1.1; f2.lineCap = "round"; f2.beginPath(); f2.moveTo(d.x, oy); f2.lineTo(d.x + Math.sin(d.y / 30) * .6, d.y); f2.stroke(); f2.restore(); if(d.y > h + 10){ d.y = -10 - Math.random() * h * .5; d.x = Math.random() * w; d.v = 0; d.slide = false; } } else if(sliding < 4 && Math.random() < dt * .02) d.slide = true; });
      x.drawImage(s.fog, 0, 0, w, h);
      s.drops.forEach(d => { x.fillStyle = "rgba(220,235,255,.55)"; x.beginPath(); x.arc(d.x, d.y, d.r, 0, 7); x.fill(); x.fillStyle = "rgba(255,255,255,.8)"; x.beginPath(); x.arc(d.x - d.r * .3, d.y - d.r * .3, d.r * .35, 0, 7); x.fill(); });
      x.strokeStyle = "rgba(0,0,0,.6)"; x.lineWidth = 18; x.strokeRect(0, 0, w, h); } },
  /* ---- 寄一张明信片 ---- */
  postcard: { name:"寄一张明信片", sub:"写一句，寄回家", tile:["#F1E7D3", "#2F5D8A"], dark:false, bg:"#E7DCC6",
    icon:'<rect x="8" y="14" width="40" height="28" rx="3"/><rect x="34" y="18" width="10" height="12"/><path d="M13 24h16M13 30h14M13 36h10"/>',
    caption: () => `从${tripCity()}，\n寄一张明信片回家`, hint: () => "写一句话 → 盖邮戳 → 寄出",
    init(s, w, h){ s.stage = 0; s.text = ""; s.stampT = -1; s.fly = 0; s.city = tripCity(); s.date = TDATE().replace(/-/g, "."); },
    setup(ov, s){ ov.insertAdjacentHTML("beforeend", `<div class="pc-ui"><input id="pcin" maxlength="28" placeholder="写一句话给回家的自己，或给远方的人"><div class="pc-btns"><button data-pc="stamp">盖邮戳</button><button data-pc="send" disabled>寄出</button></div></div>`);
      const inp = ov.querySelector("#pcin"); inp.addEventListener("input", () => { s.text = safeStr(inp.value); });
      ov.querySelectorAll("[data-pc]").forEach(b => b.addEventListener("click", () => { if(b.dataset.pc === "stamp"){ if(s.stampT >= 0) return; s.stampT = 0; snd("stamp"); buzz([10, 30, 10]); ov.querySelector('[data-pc="send"]').disabled = false; }
        else { if(s.stage) return; s.text = safeStr(inp.value.trim()) || "到此一游"; s.stage = 1; snd("paper"); ov.querySelector(".pc-ui").style.display = "none"; } })); },
    frame(s, x, w, h, t, dt){ x.fillStyle = "#E7DCC6"; x.fillRect(0, 0, w, h);
      const CW = Math.min(w * .86, 360), CH = CW * .64, cx = w / 2, by = h * .9;
      if(s.stage === 1){ s.fly = Math.min(1, s.fly + dt * .55); if(s.fly >= 1){ s.stage = 2; s.flyT = 0; snd("success"); if(!S.keeps) S.keeps = []; S.keeps.unshift({ k:"postcard", t:`明信片 · ${s.city}`, at:TDATE(), sum:s.text }); const cap = document.querySelector(".mo .mo-cap"); if(cap) cap.textContent = "寄出去了，\n收进手账的「明信片」里"; } }
      if(s.stage === 2){ s.flyT += dt; }
      // the mailbox
      const mx = w * .8, mw = 76, mh = 96, my = h * .78; x.fillStyle = "#2F5D8A"; x.beginPath(); x.roundRect(mx - mw / 2, my - mh, mw, mh, [40, 40, 6, 6]); x.fill(); x.fillStyle = "#1F3F62"; x.fillRect(mx - 30, my - mh + 34, 60, 8); x.fillStyle = "#24476E"; x.fillRect(mx - 6, my, 12, 70); x.fillStyle = "#F1E7D3"; x.font = '600 12px "Noto Serif SC", serif'; x.textAlign = "center"; x.fillText("邮 政", mx, my - 30);
      // the card
      let k = s.stage === 0 ? 0 : s.fly, scale = 1 - k * .82, ccx = cx + (mx - cx) * Math.pow(k, 1.2), ccy = h * .36 + (my - mh + 38 - h * .36) * Math.pow(k, 1.6);
      if(s.stage < 2){ x.save(); x.translate(ccx, ccy); x.rotate(-.04 + k * .3); x.scale(scale, scale);
        x.fillStyle = "rgba(0,0,0,.18)"; x.fillRect(-CW / 2 + 5, -CH / 2 + 7, CW, CH); x.fillStyle = "#FBF6EA"; x.fillRect(-CW / 2, -CH / 2, CW, CH); x.strokeStyle = "rgba(120,90,60,.25)"; x.lineWidth = 1; x.strokeRect(-CW / 2 + 8, -CH / 2 + 8, CW - 16, CH - 16);
        x.strokeStyle = "rgba(120,90,60,.35)"; x.beginPath(); x.moveTo(CW * .1, -CH / 2 + 22); x.lineTo(CW * .1, CH / 2 - 22); x.stroke(); for(let i = 0; i < 3; i++){ x.beginPath(); x.moveTo(CW * .16, -CH * .02 + i * 24); x.lineTo(CW / 2 - 18, -CH * .02 + i * 24); x.stroke(); }
        x.fillStyle = "#3A2E22"; x.font = '20px "Long Cang", "Ma Shan Zheng", cursive'; x.textAlign = "left"; const tx = s.text || "……"; x.fillText(tx.slice(0, 12), -CW / 2 + 22, -CH * .08); if(tx.length > 12) x.fillText(tx.slice(12, 24), -CW / 2 + 22, CH * .1);
        x.font = '600 12px "Noto Serif SC", serif'; x.fillStyle = "#6B5A48"; x.fillText("寄给：回家的我们", CW * .16, CH * .3);
        const sx = CW / 2 - 56, sy = -CH / 2 + 18; x.fillStyle = "#D96B4C"; x.fillRect(sx, sy, 40, 48); x.strokeStyle = "#FBF6EA"; x.setLineDash([3, 3]); x.strokeRect(sx + 2, sy + 2, 36, 44); x.setLineDash([]); x.fillStyle = "#FBF6EA"; x.font = '600 18px "Noto Serif SC", serif'; x.textAlign = "center"; x.fillText(s.city.slice(0, 1), sx + 20, sy + 31);
        if(s.stampT >= 0){ s.stampT = Math.min(1, s.stampT + dt * 3); const a = Math.min(1, s.stampT * 2), sc2 = 1.6 - .6 * Math.min(1, s.stampT * 2); x.save(); x.translate(sx - 6, sy + 30); x.rotate(-.25); x.scale(sc2, sc2); x.globalAlpha = a * .85; x.strokeStyle = "#2B3A6B"; x.lineWidth = 2.2; x.beginPath(); x.arc(0, 0, 30, 0, 7); x.stroke(); x.beginPath(); x.arc(0, 0, 22, 0, 7); x.stroke();
          x.fillStyle = "#2B3A6B"; x.font = '600 11px "Noto Serif SC", serif'; x.fillText(s.city.slice(0, 4), 0, -3); x.font = '9px ui-monospace, monospace'; x.fillText(s.date, 0, 12); for(let i = 0; i < 4; i++){ x.beginPath(); x.moveTo(34, -10 + i * 7); x.quadraticCurveTo(46, -14 + i * 7, 58, -10 + i * 7); x.stroke(); } x.restore(); }
        x.restore(); }
      // after posting: a little plane flies home along a dotted arc
      if(s.stage === 2){ const p = Math.min(1, s.flyT / 2.6), x0 = mx, y0 = my - mh, x1 = w * .85, y1 = h * .14, qx = w * .2, qy = h * .1;
        x.setLineDash([4, 6]); x.strokeStyle = "rgba(47,93,138,.6)"; x.lineWidth = 2; x.beginPath(); for(let u = 0; u <= p; u += .02){ const v = 1 - u; x.lineTo(v * v * x0 + 2 * v * u * qx + u * u * x1, v * v * y0 + 2 * v * u * qy + u * u * y1); } x.stroke(); x.setLineDash([]);
        const v = 1 - p, px = v * v * x0 + 2 * v * p * qx + p * p * x1, py = v * v * y0 + 2 * v * p * qy + p * p * y1; x.save(); x.translate(px, py); x.rotate(-.5 + p); x.fillStyle = "#FBF6EA"; x.strokeStyle = "#2F5D8A"; x.lineWidth = 1.5; x.beginPath(); x.moveTo(14, 0); x.lineTo(-10, -8); x.lineTo(-4, 0); x.lineTo(-10, 8); x.closePath(); x.fill(); x.stroke(); x.restore();
        x.fillStyle = "#3A2E22"; x.font = '600 13px "Noto Serif SC", serif'; x.textAlign = "center"; x.fillText("家", x1, y1 - 14); x.strokeStyle = "#3A2E22"; x.beginPath(); x.moveTo(x1 - 10, y1 + 6); x.lineTo(x1, y1 - 4); x.lineTo(x1 + 10, y1 + 6); x.lineTo(x1 + 10, y1 + 16); x.lineTo(x1 - 10, y1 + 16); x.closePath(); x.stroke(); } } },
  /* ---- 打卡星座 ---- */
  stars2: { name:"打卡星座", sub:"把打卡连成星座", tile:["#0F1430", "#F6E7A6"], dark:true, bg:"#0B1028",
    icon:'<path d="M12 40l10-12 12 6 10-18"/><circle cx="12" cy="40" r="2.5"/><circle cx="22" cy="28" r="2.5"/><circle cx="34" cy="34" r="2.5"/><circle cx="44" cy="16" r="2.5"/>',
    caption: () => `${TRIP.name || "这趟旅程"}\n每一个打卡，都是一颗星`, hint: () => "按顺序点星星，把它们连起来",
    init(s, w, h){ let L = okCheckins().map(c => c.title); s.real = L.length > 0; if(!L.length) L = DAYS.flatMap(d => d.items.filter(i => i.kind === "sight").map(i => i.title)).slice(0, 9); if(!L.length) L = ["出发", "第一站", "回家"]; L = [...new Set(L)].slice(0, 12);
      const geo = n => (GEO || []).find(g => g[0] === n), pts = L.map(n => { const g = geo(n); return { n, lat:g ? g[1] : null, lng:g ? g[2] : null }; }), withLL = pts.filter(p => p.lat != null);
      const cx = w / 2, cy = h * .42, R = Math.min(w, h) * .34;
      if(withLL.length >= 2){ const la = withLL.map(p => p.lat), ln = withLL.map(p => p.lng), mnA = Math.min(...la), mxA = Math.max(...la), mnN = Math.min(...ln), mxN = Math.max(...ln);
        const byLng = withLL.slice().sort((a, b) => a.lng - b.lng), byLat = withLL.slice().sort((a, b) => a.lat - b.lat), m = withLL.length - 1 || 1;
        pts.forEach(p => { if(p.lat != null){ const rx = byLng.indexOf(p) / m, ry = byLat.indexOf(p) / m; p.x = w * .14 + (rx * .75 + (mxN > mnN ? (p.lng - mnN) / (mxN - mnN) : .5) * .25) * w * .72; p.y = h * .62 - (ry * .75 + (mxA > mnA ? (p.lat - mnA) / (mxA - mnA) : .5) * .25) * h * .44; } else { const a = hashN(p.n, 360) / 57.3; p.x = cx + Math.cos(a) * R * .7; p.y = cy + Math.sin(a) * R * .7; } }); }
      else pts.forEach((p, i) => { const a = i * 2.4 + hashN(p.n, 10) * .1, r = R * (.25 + .7 * ((i + 1) / pts.length)); p.x = cx + Math.cos(a) * r; p.y = cy + Math.sin(a) * r * .9; });
      for(let it = 0; it < 80; it++) for(let a = 0; a < pts.length; a++) for(let b = a + 1; b < pts.length; b++){ const P1 = pts[a], P2 = pts[b], dx = P2.x - P1.x, dy = P2.y - P1.y, d = Math.hypot(dx, dy) || .01, need = 64; if(d < need){ const push = (need - d) / 2, ux = dx / d, uy = dy / d; P1.x -= ux * push; P1.y -= uy * push; P2.x += ux * push; P2.y += uy * push; } }
      pts.forEach(p => { p.x = Math.max(w * .1, Math.min(w * .9, p.x)); p.y = Math.max(h * .16, Math.min(h * .66, p.y)); });
      s.pts = pts; s.chain = []; s.done = false; s.bg = Array.from({ length:120 }, () => [Math.random() * w, Math.random() * h, Math.random() * 1.4 + .3, Math.random() * 6]); },
    tap(s, px, py){ if(s.done) return; let hit = -1, bd = 34; s.pts.forEach((p, i) => { const d = Math.hypot(p.x - px, p.y - py); if(d < bd){ bd = d; hit = i; } }); if(hit < 0) return; if(s.chain.includes(hit)){ if(s.chain[s.chain.length - 1] === hit) return; } s.chain.push(hit); snd("tap"); buzz(6);
      if(new Set(s.chain).size === s.pts.length){ s.done = true; s.doneT = 0; snd("success"); const cap = document.querySelector(".mo .mo-cap"); if(cap) cap.textContent = `连好了：「${(TRIP.name || "旅途").replace(/\s/g, "").slice(0, 6)}座」\n${s.pts.length} 颗星${s.real ? "，都是你们去过的地方" : ""}`; } },
    frame(s, x, w, h, t, dt){ const g = x.createRadialGradient(w / 2, h * .4, 0, w / 2, h * .4, h * .8); g.addColorStop(0, "#1A2350"); g.addColorStop(1, "#070B1C"); x.fillStyle = g; x.fillRect(0, 0, w, h);
      s.bg.forEach(([a, b, r, ph]) => { x.globalAlpha = .3 + .5 * Math.abs(Math.sin(t * .8 + ph)); x.fillStyle = "#DDE4FF"; x.fillRect(a, b, r, r); }); x.globalAlpha = 1;
      if(s.chain.length > 1){ x.strokeStyle = s.done ? "rgba(246,231,166,.9)" : "rgba(220,228,255,.55)"; x.lineWidth = s.done ? 1.8 : 1.2; x.beginPath(); s.chain.forEach((i, k) => { const p = s.pts[i]; k ? x.lineTo(p.x, p.y) : x.moveTo(p.x, p.y); }); x.stroke(); }
      if(s.done){ s.doneT += dt; x.globalAlpha = Math.min(.25, s.doneT * .2); x.strokeStyle = "#F6E7A6"; x.lineWidth = 8; x.beginPath(); s.chain.forEach((i, k) => { const p = s.pts[i]; k ? x.lineTo(p.x, p.y) : x.moveTo(p.x, p.y); }); x.stroke(); x.globalAlpha = 1; }
      s.pts.forEach((p, i) => { const on = s.chain.includes(i), r = on ? 4.4 : 3, tw = .7 + .3 * Math.sin(t * 2 + i);
        const gg = x.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 6); gg.addColorStop(0, `rgba(246,231,166,${(on ? .6 : .3) * tw})`); gg.addColorStop(1, "rgba(246,231,166,0)"); x.fillStyle = gg; x.beginPath(); x.arc(p.x, p.y, r * 6, 0, 7); x.fill();
        x.fillStyle = on ? "#FFF6CF" : "#C9D2F2"; x.beginPath(); for(let k = 0; k < 8; k++){ const a = k * Math.PI / 4, rr = k % 2 ? r * .45 : r * 1.6; x.lineTo(p.x + Math.cos(a) * rr, p.y + Math.sin(a) * rr); } x.closePath(); x.fill();
        x.fillStyle = on ? "rgba(255,246,207,.9)" : "rgba(201,210,242,.55)"; x.font = '11px "Noto Serif SC", serif'; x.textAlign = "center"; x.fillText(p.n.replace(/ ·.*/, "").slice(0, 7), p.x, p.y + 18); }); } },
  /* ---- 地铁线路图 ---- */
  metro: { name:"地铁线路图", sub:"每天一条线", tile:["#F4F1EA", "#D6402B"], dark:false, bg:"#F4F1EA",
    icon:'<path d="M8 18h18l8 8h14"/><path d="M8 36h14l8-8h18" /><circle cx="26" cy="18" r="3"/><circle cx="30" cy="28" r="3"/><circle cx="22" cy="36" r="3"/>',
    caption: () => `${TRIP.name || "这趟旅程"} · 线路图`, hint: () => "点一下站，看那天去了哪里",
    init(s, w, h){ const COLS = ["#D6402B", "#1F6FB2", "#2E9E5B", "#F0A21B", "#8E44AD", "#16A2A6", "#E26A9C", "#7A5B3A", "#4A5BD4"];
      const days = DAYS.slice(0, 9), n = Math.max(1, days.length), top = h * .2, bottom = h * .74, gap = (bottom - top) / Math.max(1, n - 1 || 1);
      s.lines = days.map((d, i) => { const st = d.items.filter(it => it.kind === "sight" || it.kind === "food" || it.kind === "lodging").slice(0, 6); const y = n === 1 ? (top + bottom) / 2 : top + gap * i, kink = (i % 2 ? -1 : 1) * Math.min(26, gap * .45);
        const x0 = w * .1, x1 = w * .9, pts = st.map((it, k) => { const u = st.length === 1 ? .5 : k / (st.length - 1), xx = x0 + (x1 - x0) * u, yy = y + (u > .35 && u < .65 ? kink : u >= .65 ? kink * 0 : 0) + (u > .35 && u < .65 ? 0 : 0); return { x:xx, y:yy + (u >= .35 && u <= .65 ? kink : 0), it, d:i }; });
        return { col:COLS[i % COLS.length], y, kink, pts, day:i, date:d.date }; });
      s.sel = null; s.prog = 0; },
    tap(s, px, py){ let best = null, bd = 28; s.lines.forEach(L => L.pts.forEach(p => { const d = Math.hypot(p.x - px, p.y - py); if(d < bd){ bd = d; best = p; } })); if(best){ s.sel = best; s.selT = 0; snd("tap"); buzz(6); } },
    frame(s, x, w, h, t, dt){ x.fillStyle = "#F4F1EA"; x.fillRect(0, 0, w, h); s.prog = Math.min(1, s.prog + dt * .7);
      x.strokeStyle = "rgba(0,0,0,.05)"; x.lineWidth = 1; for(let k = 0; k < w; k += 24){ x.beginPath(); x.moveTo(k, 0); x.lineTo(k, h); x.stroke(); } for(let k = 0; k < h; k += 24){ x.beginPath(); x.moveTo(0, k); x.lineTo(w, k); x.stroke(); }
      s.lines.forEach((L, i) => { if(!L.pts.length) return; const p = Math.max(0, Math.min(1, s.prog * 1.6 - i * .08));
        x.strokeStyle = L.col; x.lineWidth = 7; x.lineJoin = "round"; x.lineCap = "round"; x.beginPath(); const pts = L.pts, total = pts.length - 1; pts.forEach((q, k) => { if(k / Math.max(1, total) <= p + .001) k ? x.lineTo(q.x, q.y) : x.moveTo(q.x, q.y); }); x.stroke();
        x.fillStyle = L.col; x.beginPath(); x.roundRect(8, L.y - 11, 30, 22, 6); x.fill(); x.fillStyle = "#fff"; x.font = '700 11px -apple-system, sans-serif'; x.textAlign = "center"; x.fillText(`D${i + 1}`, 23, L.y + 4);
        pts.forEach((q, k) => { if(k / Math.max(1, total) > p + .001) return; const sel = s.sel === q; x.fillStyle = sel ? L.col : "#fff"; x.strokeStyle = L.col; x.lineWidth = 3; x.beginPath(); x.arc(q.x, q.y, sel ? 8 + Math.sin(t * 6) * 1.5 : 6, 0, 7); x.fill(); x.stroke();
          x.save(); x.translate(q.x + 4, q.y - 11); x.rotate(-.5); x.fillStyle = sel ? "#111" : "rgba(30,30,30,.75)"; x.font = `${sel ? 700 : 500} 10px "Noto Serif SC", serif`; x.textAlign = "left"; x.fillText(q.it.title.replace(/ ·.*/, "").slice(0, 7), 0, 0); x.restore(); }); });
      if(s.sel){ s.selT += dt; const q = s.sel, L = s.lines[q.d], txt = `D${q.d + 1} · ${md(L.date)} ${q.it.t} · ${q.it.title}`; x.font = '600 13px "Noto Serif SC", serif'; const tw = Math.min(w - 40, x.measureText(txt).width + 28), bx = (w - tw) / 2, byy = h * .085;
        x.globalAlpha = Math.min(1, s.selT * 5); x.fillStyle = L.col; x.beginPath(); x.roundRect(bx, byy, tw, 34, 17); x.fill(); x.fillStyle = "#fff"; x.textAlign = "center"; x.fillText(txt.length > 30 ? txt.slice(0, 30) + "…" : txt, w / 2, byy + 22); x.globalAlpha = 1; } } }
});

/* ===================== 跟着天气挑动画 + 贴满行李箱 ===================== */
function periodName(){ const h = new Date().getHours(); return h < 5 ? "深夜" : h < 10 ? "早上" : h < 13 ? "中午" : h < 17 ? "下午" : h < 20 ? "傍晚" : "夜里"; }
function periodIcon(){ const h = new Date().getHours(); return h >= 20 || h < 5 ? "☾" : h >= 17 ? "◐" : "☀"; }
/* every choice is one you play with your finger; each kind of weather has a few surprises — ones you haven't found come first */
const WX_LINES = { bubbles:"早上好，吹一串泡泡", sunflower:"中午的太阳，花都在看你", kite:"下午有风，放一只风筝", polaroid:"晴天，拍一张拍立得", fog:"在下雨，在起雾的车窗上写字", puffs:"在下雨，那就放空 15 秒", rain:"在下雨，那就再落一场雨", stars2:"夜里了，把今天去过的地方连成星座", stars:"夜里了，点一盏星空灯", window:"傍晚了，拖一拖，看太阳落进海里", melon:"好热，点一下加一块冰", sand:"晴天，在沙滩上走一走" };
function pickFrom(list){ const f = S.found || [], fresh = list.filter(k => !f.includes(k)); const k = fresh.length ? fresh[0] : list[Math.floor(Math.random() * list.length)]; return [k, WX_LINES[k]]; }
function weatherPick(){ const d = DAYCFG[TODAY] || {}, wx = String(d.wx || ""), temp = parseFloat(d.temp), hr = new Date().getHours();
  if(/雨|rain|shower|storm|雷/i.test(wx)) return pickFrom(["fog", "puffs", "rain"]);
  if(hr >= 20 || hr < 5) return pickFrom(["stars2", "stars"]);
  if(hr >= 17) return pickFrom(["window"]);
  if(/云|阴|雾|cloud|fog|overcast/i.test(wx)) return ["window", "多云，用手指把云推开"];
  if(!isNaN(temp) && temp >= 30) return ["melon", `${Math.round(temp)}°，好热，点一下加一块冰`];
  return pickFrom(hr < 10 ? ["bubbles", "sand", "polaroid", "sunflower", "kite"] : hr < 14 ? ["sunflower", "polaroid", "sand", "bubbles", "kite"] : ["kite", "polaroid", "sand", "bubbles", "sunflower"]); }
S.suitcase = S.suitcase || {};
MY_PIECES.suitcase = { name:"贴满行李箱", sub:"点一下贴一张", tile:["#E7DECF", "#1F6F72"], dark:false, bg:"#E7DECF",
  icon:'<rect x="10" y="16" width="36" height="30" rx="5"/><path d="M22 16v-5h12v5"/><circle cx="20" cy="28" r="3"/><rect x="28" y="30" width="10" height="6" rx="1"/><path d="M16 46v3M40 46v3"/>',
  caption: () => `${TRIP.name || "这趟旅程"}\n把这趟贴满行李箱`, hint: () => "点行李箱贴一张 · 下次打开还在",
  init(s, w, h){ s.bw = Math.min(w * .78, 320); s.bh = s.bw * 1.18; s.bx = (w - s.bw) / 2; s.by = h * .18; s.list = (S.suitcase[S.curBook] = S.suitcase[S.curBook] || []); s.pop = -1; s.popT = 0;
    const cities = (CITIES || []).map(c => [c.name, c.color, c.food]); s.pool = [];
    cities.forEach(([n, col, food]) => { s.pool.push({ k:"round", t:n, col }); if(food) s.pool.push({ k:"rect", t:food, col:"#C98A1C" }); });
    s.pool.push({ k:"rect", t:TRIP.rangeDot || TDATE(), col:"#2F5D8A" }, { k:"star", t:"", col:"#E2B77A" }, { k:"plane", t:"BOARDING", col:"#1F6F72" }, { k:"heart", t:(cities[0] || ["旅途"])[0], col:"#D6402B" }, { k:"round", t:"TRIP DECK", col:"#3A2E22" });
    if(!s.pool.length) s.pool.push({ k:"round", t:"旅途", col:"#D6402B" }); },
  tap(s, px, py){ if(px < s.bx || px > s.bx + s.bw || py < s.by || py > s.by + s.bh){ return; } const base = s.pool[(s.list.length * 7 + Math.floor(Math.random() * s.pool.length)) % s.pool.length];
    s.list.push({ ...base, x:(px - s.bx) / s.bw, y:(py - s.by) / s.bh, r:(Math.random() - .5) * .7, sz:.8 + Math.random() * .45 }); if(s.list.length > 40) s.list.shift(); s.pop = s.list.length - 1; s.popT = 0; snd("stamp"); buzz([6, 20, 6]);
    if(s.list.length === 8){ const cap = document.querySelector(".mo .mo-cap"); if(cap) cap.textContent = "这个行李箱，\n去过好多地方了"; snd("success"); } },
  frame(s, x, w, h, t, dt){ x.fillStyle = "#E7DECF"; x.fillRect(0, 0, w, h); const { bx, by, bw, bh } = s;
    x.fillStyle = "rgba(0,0,0,.12)"; x.beginPath(); x.ellipse(w / 2, by + bh + 26, bw * .48, 12, 0, 0, 7); x.fill();
    x.strokeStyle = "#5A4632"; x.lineWidth = 9; x.lineJoin = "round"; x.beginPath(); x.moveTo(w / 2 - bw * .16, by + 4); x.lineTo(w / 2 - bw * .16, by - 30); x.lineTo(w / 2 + bw * .16, by - 30); x.lineTo(w / 2 + bw * .16, by + 4); x.stroke();
    const g = x.createLinearGradient(bx, 0, bx + bw, 0); g.addColorStop(0, "#1A5F62"); g.addColorStop(.5, "#22787B"); g.addColorStop(1, "#185659"); x.fillStyle = g; x.beginPath(); x.roundRect(bx, by, bw, bh, 22); x.fill();
    x.strokeStyle = "rgba(0,0,0,.18)"; x.lineWidth = 2; for(let k = 1; k < 6; k++){ x.beginPath(); x.moveTo(bx + bw * k / 6, by + 10); x.lineTo(bx + bw * k / 6, by + bh - 10); x.stroke(); }
    x.fillStyle = "#3A2A1C"; [.22, .78].forEach(u => { x.fillRect(bx + bw * u - 9, by, 18, bh); x.fillStyle = "#C9A86A"; x.fillRect(bx + bw * u - 12, by + bh * .48, 24, 16); x.fillStyle = "#3A2A1C"; });
    x.fillStyle = "#2A2A2A"; [.18, .82].forEach(u => { x.beginPath(); x.arc(bx + bw * u, by + bh + 10, 10, 0, 7); x.fill(); });
    s.list.forEach((st, i) => { let sc = st.sz; if(i === s.pop){ s.popT += dt; const p = Math.min(1, s.popT * 5); sc *= 1.5 - .5 * (1 - Math.pow(1 - p, 3)) - (p < 1 ? 0 : 0); if(p < 1) sc *= .7 + .3 * p; }
      x.save(); x.translate(bx + st.x * bw, by + st.y * bh); x.rotate(st.r); x.scale(sc, sc); x.shadowColor = "rgba(0,0,0,.25)"; x.shadowBlur = 4; x.shadowOffsetY = 2;
      const txt = String(st.t || ""), fs = txt.length > 6 ? 10 : 13;
      if(st.k === "round"){ x.fillStyle = "#FBF6EA"; x.beginPath(); x.arc(0, 0, 34, 0, 7); x.fill(); x.shadowBlur = 0; x.strokeStyle = st.col; x.lineWidth = 4; x.beginPath(); x.arc(0, 0, 28, 0, 7); x.stroke(); x.fillStyle = st.col; x.font = `700 ${fs}px "Noto Serif SC", serif`; x.textAlign = "center"; x.fillText(txt.slice(0, 8), 0, 5); }
      else if(st.k === "rect"){ x.font = `700 ${fs}px "Noto Serif SC", serif`; const tw = Math.min(140, x.measureText(txt).width + 26); x.fillStyle = st.col; x.beginPath(); x.roundRect(-tw / 2, -17, tw, 34, 8); x.fill(); x.shadowBlur = 0; x.strokeStyle = "rgba(255,255,255,.7)"; x.setLineDash([4, 3]); x.lineWidth = 1.5; x.beginPath(); x.roundRect(-tw / 2 + 4, -13, tw - 8, 26, 6); x.stroke(); x.setLineDash([]); x.fillStyle = "#fff"; x.textAlign = "center"; x.fillText(txt.slice(0, 10), 0, 5); }
      else if(st.k === "star"){ x.fillStyle = st.col; x.beginPath(); for(let k = 0; k < 10; k++){ const a = k * Math.PI / 5 - Math.PI / 2, r = k % 2 ? 13 : 30; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.closePath(); x.fill(); }
      else if(st.k === "heart"){ x.fillStyle = st.col; x.beginPath(); x.moveTo(0, 22); x.bezierCurveTo(-40, -4, -18, -32, 0, -12); x.bezierCurveTo(18, -32, 40, -4, 0, 22); x.fill(); x.shadowBlur = 0; x.fillStyle = "#fff"; x.font = `700 10px "Noto Serif SC", serif`; x.textAlign = "center"; x.fillText(txt.slice(0, 4), 0, 2); }
      else { x.fillStyle = "#FBF6EA"; x.beginPath(); x.roundRect(-44, -20, 88, 40, 6); x.fill(); x.shadowBlur = 0; x.fillStyle = st.col; x.fillRect(-44, -20, 22, 40); x.fillStyle = "#FBF6EA"; x.beginPath(); x.moveTo(-26, 0); x.lineTo(-40, -6); x.lineTo(-36, 0); x.lineTo(-40, 6); x.closePath(); x.fill(); x.fillStyle = st.col; x.font = `700 10px ui-monospace, monospace`; x.textAlign = "center"; x.fillText(txt, 10, 4); }
      x.restore(); }); } };

/* copying: if the phone refuses clipboard access, show the text so it can be copied by hand */
function copyText(t){ try{ const p = navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(t) : Promise.reject(); return p.catch(() => { sheet(`<h3>手动复制</h3><p class="sub">这台手机不让 App 直接复制，长按下面的字就能复制</p><div style="font-family:ui-monospace,monospace; font-size:22px; letter-spacing:.12em; padding:14px; border-radius:14px; background:rgba(255,255,255,.06); user-select:all; -webkit-user-select:all">${t}</div>`); }); }catch(e){ return Promise.resolve(); } }

const WEATHER_ONLY = ["fog", "puffs", "rain", "stars2", "stars", "window", "melon", "sand", "bubbles", "sunflower", "kite", "polaroid"];
const PIECE_NAME = k => (MY_PIECES[k] && MY_PIECES[k].name) || ((O && O.GAMES || []).find(g => g[0] === k) || [k, k])[1];
document.addEventListener("click", e => { const b = e.target.closest('[data-act="wxplay"]'); if(!b) return; const k = weatherPick()[0]; playPiece(k);
  S.found = S.found || []; if(WEATHER_ONLY.includes(k) && !S.found.includes(k)){ S.found.push(k); const n = WEATHER_ONLY.filter(x => S.found.includes(x)).length; setTimeout(() => toast(n === WEATHER_ONLY.length ? `${WEATHER_ONLY.length} 个天气惊喜都找到了！最后一个是「${PIECE_NAME(k)}」` : `发现一个天气惊喜：${PIECE_NAME(k)}（${n}/${WEATHER_ONLY.length}）`), 900); } });

/* ===================== 晴天的惊喜：吹泡泡 · 向日葵 · 放风筝 · 拍立得显影 ===================== */
Object.assign(MY_PIECES, {
  bubbles: { name:"吹泡泡", sub:"划一下吹泡泡", tile:["#CFE7F2", "#3E7FA6"], dark:false, bg:"#CFE7F2", icon:'<circle cx="22" cy="24" r="10"/><circle cx="38" cy="34" r="7"/><circle cx="34" cy="16" r="4"/>',
    caption: () => "早上好，\n吹一串泡泡", hint: () => "手指划过去吹泡泡 · 点一下戳破",
    init(s, w, h){ s.b = []; s.pops = []; s.last = null; },
    drag(s, dx, dy, w, h, px, py){ const sp = Math.hypot(dx, dy); if(sp < 2) return; if(!s.last || Math.hypot(px - s.last[0], py - s.last[1]) > 22){ s.b.push({ x:px, y:py, r:10 + Math.min(34, sp * 1.4) * Math.random() + 8, vx:dx * .6, vy:-20 - Math.random() * 30, ph:Math.random() * 6, life:0 }); s.last = [px, py]; if(s.b.length > 60) s.b.shift(); } },
    up(s){ s.last = null; },
    tap(s, px, py){ for(let i = s.b.length - 1; i >= 0; i--){ const q = s.b[i]; if(Math.hypot(q.x - px, q.y - py) < q.r + 6){ s.pops.push({ x:q.x, y:q.y, r:q.r, t:0 }); s.b.splice(i, 1); snd("pop"); buzz(5); return; } } },
    frame(s, x, w, h, t, dt){ const sky = x.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, "#9FD3EC"); sky.addColorStop(1, "#E8F5F2"); x.fillStyle = sky; x.fillRect(0, 0, w, h);
      x.fillStyle = "#9CCB7A"; x.beginPath(); x.moveTo(0, h * .82); x.quadraticCurveTo(w * .4, h * .74, w, h * .84); x.lineTo(w, h); x.lineTo(0, h); x.fill(); x.fillStyle = "#86B866"; x.beginPath(); x.moveTo(0, h * .9); x.quadraticCurveTo(w * .6, h * .82, w, h * .9); x.lineTo(w, h); x.lineTo(0, h); x.fill();
      x.fillStyle = "rgba(255,255,255,.8)"; [[.2, .14, 1], [.72, .1, .8]].forEach(([a, b, k]) => { const cx = ((a * w + t * 8 * k) % (w + 160)) - 80; for(let i = 0; i < 4; i++){ x.beginPath(); x.ellipse(cx + i * 22 * k, b * h + Math.sin(i * 2) * 5, 26 * k, 14 * k, 0, 0, 7); x.fill(); } });
      s.b.forEach(q => { q.life += dt; q.vx *= .98; q.x += q.vx * dt + Math.sin(t * 2 + q.ph) * .4; q.y += q.vy * dt; q.vy *= .995; });
      s.b = s.b.filter(q => q.y > -60 && q.life < 14);
      s.b.forEach(q => { const g = x.createRadialGradient(q.x - q.r * .3, q.y - q.r * .3, q.r * .1, q.x, q.y, q.r); g.addColorStop(0, "rgba(255,255,255,.05)"); g.addColorStop(.8, "rgba(255,255,255,.12)"); g.addColorStop(1, "rgba(255,255,255,.5)"); x.fillStyle = g; x.beginPath(); x.arc(q.x, q.y, q.r, 0, 7); x.fill();
        const hue = (t * 40 + q.ph * 60) % 360; x.strokeStyle = `hsla(${hue},80%,65%,.55)`; x.lineWidth = 2; x.beginPath(); x.arc(q.x, q.y, q.r - 1, Math.PI * .1, Math.PI * .9); x.stroke(); x.strokeStyle = `hsla(${(hue + 140) % 360},80%,65%,.45)`; x.beginPath(); x.arc(q.x, q.y, q.r - 1, Math.PI * 1.1, Math.PI * 1.7); x.stroke();
        x.fillStyle = "rgba(255,255,255,.85)"; x.beginPath(); x.ellipse(q.x - q.r * .38, q.y - q.r * .42, q.r * .18, q.r * .09, -.6, 0, 7); x.fill(); });
      s.pops.forEach(p => { p.t += dt; x.strokeStyle = `rgba(255,255,255,${1 - p.t * 3})`; x.lineWidth = 1.5; x.beginPath(); x.arc(p.x, p.y, p.r * (1 + p.t * 2), 0, 7); x.stroke(); for(let k = 0; k < 8; k++){ const a = k * .785; x.fillStyle = `rgba(255,255,255,${.9 - p.t * 3})`; x.fillRect(p.x + Math.cos(a) * p.r * (1 + p.t * 3), p.y + Math.sin(a) * p.r * (1 + p.t * 3), 2, 2); } }); s.pops = s.pops.filter(p => p.t < .35); } },
  sunflower: { name:"向日葵", sub:"拖着太阳走", tile:["#F6E3A6", "#C9851A"], dark:false, bg:"#BFE0F0", icon:'<circle cx="28" cy="24" r="6"/><path d="M28 10v4M28 34v4M14 24h4M38 24h4M18 14l3 3M35 31l3 3M38 14l-3 3M18 34l3-3"/><path d="M28 38v12"/>',
    caption: () => "中午的太阳，\n花都在看着你", hint: () => "拖着太阳走 · 点一朵花让它长高",
    init(s, w, h){ s.sun = { x:w * .5, y:h * .16 }; s.f = Array.from({ length:9 }, (_, i) => ({ x:w * (.08 + i * .105) + (i % 2) * 6, base:h * (.76 + (i % 3) * .025), hgt:h * (.2 + ((i * 37) % 10) / 90), lean:0, r:16 + (i % 3) * 4, grow:0 })); },
    drag(s, dx, dy, w, h, px, py){ s.sun.x = Math.max(30, Math.min(w - 30, px)); s.sun.y = Math.max(40, Math.min(h * .5, py)); },
    tap(s, px, py){ const f = s.f.reduce((a, b) => Math.abs(b.x - px) < Math.abs(a.x - px) ? b : a); if(Math.abs(f.x - px) < 30 && py > h0(s)){ f.grow = Math.min(60, f.grow + 18); snd("tap"); buzz(5); } },
    frame(s, x, w, h, t, dt){ const sky = x.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, "#8CC8EA"); sky.addColorStop(.7, "#DDEFF5"); x.fillStyle = sky; x.fillRect(0, 0, w, h); s.h = h;
      const g = x.createRadialGradient(s.sun.x, s.sun.y, 0, s.sun.x, s.sun.y, 120); g.addColorStop(0, "rgba(255,240,170,.9)"); g.addColorStop(1, "rgba(255,240,170,0)"); x.fillStyle = g; x.fillRect(0, 0, w, h); x.fillStyle = "#FFD45A"; x.beginPath(); x.arc(s.sun.x, s.sun.y, 26, 0, 7); x.fill();
      x.strokeStyle = "rgba(255,212,90,.8)"; x.lineWidth = 3; for(let k = 0; k < 12; k++){ const a = k * .5236 + t * .3; x.beginPath(); x.moveTo(s.sun.x + Math.cos(a) * 34, s.sun.y + Math.sin(a) * 34); x.lineTo(s.sun.x + Math.cos(a) * 44, s.sun.y + Math.sin(a) * 44); x.stroke(); }
      x.fillStyle = "#7DB25A"; x.fillRect(0, h * .74, w, h * .26);
      s.f.forEach((f, i) => { const top0 = f.base - f.hgt - f.grow, want = Math.max(-1, Math.min(1, (s.sun.x - f.x) / (w * .45))); f.lean += (want - f.lean) * Math.min(1, dt * 3); f.grow = Math.max(0, f.grow - dt * 2);
        const sway = Math.sin(t * 1.2 + i) * 3, lx = f.lean * 26 + sway * 1.5, top = top0 + Math.abs(f.lean) * 6, up = Math.max(-1, Math.min(1, (s.sun.y - top) / (h * .5)));
        x.strokeStyle = "#4E8A35"; x.lineWidth = 5; x.beginPath(); x.moveTo(f.x, f.base); x.quadraticCurveTo(f.x + lx * .2, (f.base + top) / 2, f.x + lx, top); x.stroke();
        x.fillStyle = "#5F9C42"; x.beginPath(); x.ellipse(f.x + 12, f.base - f.hgt * .45, 14, 6, -.5, 0, 7); x.fill(); x.beginPath(); x.ellipse(f.x - 12, f.base - f.hgt * .3, 14, 6, .5, 0, 7); x.fill();
        x.save(); x.translate(f.x + lx, top); x.rotate(f.lean * .5); x.scale(1 - Math.abs(f.lean) * .35, 1 - Math.max(0, up) * .25);
        x.fillStyle = "#F5B82E"; for(let k = 0; k < 14; k++){ x.save(); x.rotate(k * Math.PI / 7); x.beginPath(); x.ellipse(0, -f.r - 6, 5, 11, 0, 0, 7); x.fill(); x.restore(); }
        const fx = f.lean * f.r * .35, fy = up * f.r * .25; x.fillStyle = "#6B3E1E"; x.beginPath(); x.arc(fx, fy, f.r, 0, 7); x.fill(); x.fillStyle = "rgba(255,220,150,.4)"; for(let k = 0; k < 12; k++){ x.beginPath(); x.arc(fx + Math.cos(k * 2.4) * f.r * .55 * (k % 3) / 2, fy + Math.sin(k * 2.4) * f.r * .55 * (k % 3) / 2, 1.6, 0, 7); x.fill(); } x.restore(); }); } },
  kite: { name:"放风筝", sub:"拖着风筝飞", tile:["#D5ECF7", "#D6402B"], dark:false, bg:"#CFE8F5", icon:'<path d="M30 8l12 14-12 16-12-16Z"/><path d="M30 38q-4 6 2 10t-2 8"/>',
    caption: () => "下午有风，\n放一只风筝", hint: () => "拖着风筝飞 · 点一下翻个跟斗",
    init(s, w, h){ s.k = { x:w * .6, y:h * .3, tx:w * .6, ty:h * .3, vx:0, vy:0, rot:0, spin:0 }; s.tail = Array.from({ length:14 }, () => ({ x:w * .6, y:h * .3 })); s.gust = 0; s.hand = { x:w * .3, y:h * .9 }; },
    drag(s, dx, dy, w, h, px, py){ s.k.tx = Math.max(30, Math.min(w - 30, px)); s.k.ty = Math.max(50, Math.min(h * .72, py)); },
    tap(s){ s.k.spin = Math.PI * 2; snd("tap"); buzz(8); },
    frame(s, x, w, h, t, dt){ const sky = x.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, "#9BCDEB"); sky.addColorStop(1, "#E9F4F7"); x.fillStyle = sky; x.fillRect(0, 0, w, h);
      x.fillStyle = "rgba(255,255,255,.75)"; for(let i = 0; i < 3; i++){ const cx = ((i * 170 + t * (10 + i * 4)) % (w + 200)) - 100, cy = h * (.12 + i * .1); for(let j = 0; j < 4; j++){ x.beginPath(); x.ellipse(cx + j * 24, cy + Math.sin(j) * 5, 30, 15, 0, 0, 7); x.fill(); } }
      x.fillStyle = "#93C47A"; x.beginPath(); x.moveTo(0, h * .88); x.quadraticCurveTo(w * .5, h * .8, w, h * .9); x.lineTo(w, h); x.lineTo(0, h); x.fill();
      if(Math.random() < dt * .25) s.gust = 1; s.gust = Math.max(0, s.gust - dt * .8); const k = s.k, wind = Math.sin(t * .7) * 20 + s.gust * 60;
      k.vx += ((k.tx + wind) - k.x) * dt * 2.2; k.vy += (k.ty - k.y + Math.sin(t * 1.8) * 12) * dt * 2.2; k.vx *= .92; k.vy *= .92; k.x += k.vx * dt * 3; k.y += k.vy * dt * 3;
      if(k.spin > 0){ const d = Math.min(k.spin, dt * 9); k.spin -= d; k.rot += d; } k.rot += (Math.atan2(k.vx, 40) * .5 - (k.rot % (Math.PI * 2))) * Math.min(1, dt * 4) * (k.spin > 0 ? 0 : 1);
      x.strokeStyle = "rgba(60,60,60,.55)"; x.lineWidth = 1.2; x.beginPath(); x.moveTo(s.hand.x, s.hand.y); x.quadraticCurveTo((s.hand.x + k.x) / 2 + 30, (s.hand.y + k.y) / 2 + 60, k.x, k.y + 22); x.stroke();
      let px = k.x, py = k.y + 24; s.tail.forEach((p, i) => { p.x += (px - p.x) * Math.min(1, dt * 10) - wind * dt * .2; p.y += (py + 10 - p.y) * Math.min(1, dt * 10); px = p.x; py = p.y; });
      x.strokeStyle = "#555"; x.lineWidth = 1; x.beginPath(); x.moveTo(k.x, k.y + 22); s.tail.forEach(p => x.lineTo(p.x, p.y)); x.stroke();
      s.tail.forEach((p, i) => { if(i % 3 !== 2) return; x.fillStyle = ["#F0A21B", "#1F6FB2", "#2E9E5B", "#D6402B"][i / 3 % 4 | 0]; x.beginPath(); x.moveTo(p.x, p.y); x.lineTo(p.x - 7, p.y - 5); x.lineTo(p.x - 7, p.y + 5); x.closePath(); x.moveTo(p.x, p.y); x.lineTo(p.x + 7, p.y - 5); x.lineTo(p.x + 7, p.y + 5); x.closePath(); x.fill(); });
      x.save(); x.translate(k.x, k.y); x.rotate(k.rot); const pts = [[0, -34], [24, 0], [0, 24], [-24, 0]];
      [["#D6402B", 0], ["#F0A21B", 1], ["#1F6FB2", 2], ["#2E9E5B", 3]].forEach(([c, q]) => { x.fillStyle = c; x.beginPath(); x.moveTo(0, 0); x.lineTo(...pts[q]); x.lineTo(...pts[(q + 1) % 4]); x.closePath(); x.fill(); });
      x.strokeStyle = "rgba(255,255,255,.7)"; x.lineWidth = 1.5; x.beginPath(); x.moveTo(0, -34); x.lineTo(0, 24); x.moveTo(-24, 0); x.lineTo(24, 0); x.stroke(); x.restore(); } },
  polaroid: { name:"拍立得显影", sub:"搓一搓显影", tile:["#EDE6DA", "#3A2E22"], dark:true, bg:"#6E5440", icon:'<rect x="12" y="8" width="32" height="40" rx="2"/><rect x="16" y="12" width="24" height="24"/>',
    caption: () => "晴天，\n拍一张拍立得", hint: () => "在照片上搓一搓，让它显影",
    init(s, w, h){ s.dev = 0; s.done = false; s.img = null; const today = ALBUM.find(a => a[4] === TODAY && typeof a[0] === "string"), src = today ? today[0] : (P[dayPhoto(TODAY)] || ""); if(src){ const im = new Image(); im.onload = () => s.img = im; im.src = src; } s.place = today ? (today[9] || today[3] || "") : ((DAYCFG[TODAY] || {}).place || ""); },
    drag(s, dx, dy, w, h){ const sp = Math.hypot(dx, dy); s.dev = Math.min(1, s.dev + sp / 2600); if(Math.random() < .2) buzz(2); },
    frame(s, x, w, h, t, dt){ x.fillStyle = "#6E5440"; x.fillRect(0, 0, w, h); x.strokeStyle = "rgba(0,0,0,.12)"; x.lineWidth = 2; for(let k = 0; k < h; k += 26){ x.beginPath(); x.moveTo(0, k + Math.sin(k) * 4); x.bezierCurveTo(w * .3, k + 8, w * .7, k - 8, w, k + Math.cos(k) * 4); x.stroke(); }
      s.dev = Math.min(1, s.dev + dt * .012); const PW = Math.min(w * .74, 300), PH = PW * 1.2, X = (w - PW) / 2, Y = h * .14, IW = PW - 28, IH = IW;
      x.save(); x.translate(w / 2, Y + PH / 2); x.rotate(-.03); x.translate(-w / 2, -(Y + PH / 2)); x.shadowColor = "rgba(0,0,0,.45)"; x.shadowBlur = 18; x.shadowOffsetY = 10; x.fillStyle = "#FBF8F1"; x.fillRect(X, Y, PW, PH); x.shadowBlur = 0; x.shadowOffsetY = 0;
      x.fillStyle = "#1F1B18"; x.fillRect(X + 14, Y + 14, IW, IH);
      if(s.img){ const im = s.img, sc = Math.max(IW / im.width, IH / im.height), iw = im.width * sc, ih = im.height * sc; x.save(); x.beginPath(); x.rect(X + 14, Y + 14, IW, IH); x.clip();
        x.globalAlpha = Math.min(1, s.dev * 1.3); x.filter = `sepia(${Math.max(0, 1 - s.dev * 1.4)}) saturate(${.4 + s.dev * .8}) brightness(${.6 + s.dev * .45}) blur(${(1 - s.dev) * 3}px)`; x.drawImage(im, X + 14 + (IW - iw) / 2, Y + 14 + (IH - ih) / 2, iw, ih); x.filter = "none"; x.restore(); x.globalAlpha = 1; }
      x.fillStyle = `rgba(90,96,110,${Math.max(0, .9 - s.dev * 1.2)})`; x.fillRect(X + 14, Y + 14, IW, IH);
      if(s.dev > .85){ x.globalAlpha = Math.min(1, (s.dev - .85) * 7); x.fillStyle = "#3A2E22"; x.font = '22px "Long Cang", "Ma Shan Zheng", cursive'; x.textAlign = "center"; x.fillText(`${(s.place || tripCity()).slice(0, 10)} · ${TDATE().slice(5).replace("-", ".")}`, w / 2, Y + 14 + IH + (PH - IH - 14) / 2 + 8); x.globalAlpha = 1;
        if(!s.done){ s.done = true; snd("success"); const cap = document.querySelector(".mo .mo-cap"); if(cap) cap.textContent = "显影好了。\n今天的这一张。"; } }
      x.restore(); } }
});
function h0(s){ return (s.h || 800) * .45; }

/* the "how many days" stepper on the start sheets (from a city guide, or a blank book) */
document.addEventListener("click", e => { const b = e.target.closest('[data-act^="ntd:"]'); if(!b) return; NT.days = Math.max(1, Math.min(30, NT.days + +b.dataset.act.split(":")[1])); const el = $("ntdays"); if(el){ el.textContent = NT.days; el.animate([{ scale:1.3 }, { scale:1 }], { duration:220 }); } });
