import { COUNTRY, CITY, SPOTS, CTASKS, stampSVG } from "../data/world.js";
import { api } from "../lib/api.js";
import { sfx } from "../lib/sound.js";
import { today as todayFn } from "../lib/util.js";
import { pickDest } from "./tickets.js";
import { addCityStamp } from "./collection.js";
import { tripCityKey, dayActs, isReady, cityOf, cityGuide } from "./trip.js";
import { weatherFor, weatherLine } from "../lib/weather.js";
import { playMotion, weatherMotion } from "../lib/motion.js";
let WX = null;
document.addEventListener("click", e => { const s = e.target.closest("#pg-fortune .hello span"); if (s) playMotion(weatherMotion(WX), { temp: WX && WX.temp != null ? Math.round(WX.temp) : null }); });
import { openCheckin } from "./checkin.js";
import { missionFor, missionIcon } from "../data/missions.js";
import { placeStamp } from "../data/stamps.js";
import { myStamps } from "./collection.js";
import { on as onApi } from "../lib/api.js";
import { seeded, now as nowFn } from "../lib/util.js";
const EMB = {
  globe:{bg:"#efe6d4",svg:`<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" fill="#9cc7d8"/><path d="M34 34 c6 -4 12 2 10 8 c-2 6 6 8 4 14 c-3 6 -12 2 -14 -4 c-2 -6 -6 -12 0 -18z M58 26 c8 0 14 6 12 12 c-4 2 -8 -2 -12 -2 c-4 -2 -4 -8 0 -10z M60 56 c6 -2 12 2 10 8 c-2 6 -10 8 -12 2 c-2 -4 -2 -8 2 -10z" fill="#8cbf7a"/><g fill="none" stroke="#fff" stroke-width="1" opacity=".6"><ellipse cx="50" cy="50" rx="30" ry="11"/><ellipse cx="50" cy="50" rx="12" ry="30"/></g><text x="50" y="52" text-anchor="middle" dominant-baseline="central" font-size="30" font-family="Georgia,serif" font-weight="700" fill="#fff" stroke="#3a6a80" stroke-width="1.2">?</text></svg>`},
  plane:{bg:"#dcecf8",svg:`<svg viewBox="0 0 100 100"><path d="M10 78 q10-8 20 0 q10 8 20 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M62 82 h24 M70 74 h14" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M14 60 C 30 58, 40 52, 44 46" stroke="#5c7fb3" stroke-width="1.6" stroke-dasharray="3 4" fill="none"/><g transform="rotate(-25 56 42)"><path d="M26 42 C26 38 32 37 38 37 H76 C84 37 90 40 90 42 C90 44 84 47 76 47 H38 C32 47 26 46 26 42Z" fill="#fff" stroke="#5c7fb3" stroke-width="2"/><path d="M56 37 L44 16 H52 L68 37Z M56 47 L44 68 H52 L68 47Z M32 38 L26 27 H32 L40 37Z" fill="#6f95cf"/><g fill="#5c7fb3"><circle cx="46" cy="42" r="1.4"/><circle cx="52" cy="42" r="1.4"/><circle cx="58" cy="42" r="1.4"/><circle cx="64" cy="42" r="1.4"/><circle cx="80" cy="41" r="2"/></g></g></svg>`},
  suitcase:{bg:"#fbe3cf",svg:`<svg viewBox="0 0 100 100"><path d="M40 28 V20 a4 4 0 0 1 4 -4 h12 a4 4 0 0 1 4 4 v8" stroke="#7a4a2a" stroke-width="3.5" fill="none"/><rect x="22" y="28" width="56" height="50" rx="8" fill="#e9824a"/><path d="M36 28 v50 M64 28 v50" stroke="#c9602e" stroke-width="4"/><circle cx="46" cy="46" r="7" fill="#fbe7b5"/><path d="M42 46 l3 3 5 -6" stroke="#e9824a" stroke-width="2" fill="none"/><rect x="50" y="58" width="12" height="8" rx="1.5" fill="#8fb8c9" transform="rotate(-10 56 62)"/><circle cx="32" cy="82" r="3.5" fill="#5a3a22"/><circle cx="68" cy="82" r="3.5" fill="#5a3a22"/></svg>`},
  mountain:{bg:"#dff0e6",svg:`<svg viewBox="0 0 100 100"><circle cx="72" cy="28" r="9" fill="#ffc75a"/><path d="M8 80 L38 36 L58 62 L68 50 L92 80Z" fill="#8cc3a4"/><path d="M20 80 L50 30 L80 80Z" fill="#4f9a7a"/><path d="M50 30 L42 44 L47 41 L50 46 L54 41 L58 44Z" fill="#fff"/><path d="M50 30 V18" stroke="#6b4a2b" stroke-width="1.6"/><path d="M50 18 l10 3 -10 3z" fill="#d9483b"/><path d="M12 86 H88" stroke="#4f9a7a" stroke-width="2" stroke-linecap="round" opacity=".5"/></svg>`},
  beach:{bg:"#fdeec8",svg:`<svg viewBox="0 0 100 100"><circle cx="30" cy="36" r="12" fill="#f5a53a"/><path d="M0 64 q12-6 25 0 t25 0 t25 0 t25 0 V100 H0Z" fill="#7cc3d6"/><path d="M0 74 q12-6 25 0 t25 0 t25 0 t25 0" stroke="#fff" stroke-width="2" fill="none" opacity=".7"/><path d="M68 82 C 66 64, 64 50, 58 38" stroke="#9a6a3a" stroke-width="4" fill="none" stroke-linecap="round"/><g fill="#4f9a4a"><path d="M58 38 C 48 30, 38 32, 34 38 C 44 36, 52 38, 58 38Z"/><path d="M58 38 C 60 26, 70 22, 78 24 C 70 28, 64 32, 58 38Z"/><path d="M58 38 C 68 34, 80 38, 84 46 C 74 42, 66 40, 58 38Z"/><path d="M58 38 C 54 28, 56 20, 60 16 C 60 24, 60 30, 58 38Z"/></g><path d="M58 90 q14 -6 30 0 V100 H58Z" fill="#f3d9a0"/></svg>`},
  balloon:{bg:"#e4eefa",svg:`<svg viewBox="0 0 100 100"><ellipse cx="22" cy="70" rx="12" ry="5" fill="#fff"/><ellipse cx="80" cy="30" rx="10" ry="4" fill="#fff"/><path d="M50 12 C 28 12, 22 34, 32 50 C 38 60, 44 64, 46 70 H54 C 56 64, 62 60, 68 50 C 78 34, 72 12, 50 12Z" fill="#e2432f"/><path d="M50 12 C 42 12, 38 34, 42 50 C 44 60, 46 64, 47 70 H53 C 54 64, 56 60, 58 50 C 62 34, 58 12, 50 12Z" fill="#f3c34a"/><path d="M46 70 L44 78 M54 70 L56 78" stroke="#7a5a3a" stroke-width="1.4"/><rect x="42" y="78" width="16" height="10" rx="2" fill="#b07a44"/><path d="M42 82 h16" stroke="#8a5a2a" stroke-width="1"/></svg>`},
  camera:{bg:"#f3e4d8",svg:`<svg viewBox="0 0 100 100"><path d="M20 30 C 20 16, 80 16, 80 30" stroke="#7a4a2a" stroke-width="2.4" fill="none"/><rect x="18" y="34" width="64" height="42" rx="7" fill="#f2a65a"/><rect x="18" y="44" width="64" height="22" fill="#e0894a"/><rect x="26" y="28" width="14" height="8" rx="2" fill="#5a3a22"/><circle cx="52" cy="55" r="15" fill="#fff8ef"/><circle cx="52" cy="55" r="10" fill="#3b4a5c"/><circle cx="48" cy="51" r="3" fill="#fff" opacity=".7"/><circle cx="72" cy="40" r="3" fill="#fbe7b5"/></svg>`},
  train:{bg:"#e6e9f6",svg:`<svg viewBox="0 0 100 100"><path d="M30 18 H70 a8 8 0 0 1 8 8 V66 a8 8 0 0 1 -8 8 H30 a8 8 0 0 1 -8 -8 V26 a8 8 0 0 1 8 -8Z" fill="#d9483b"/><rect x="30" y="26" width="40" height="20" rx="4" fill="#dcecf8"/><path d="M22 52 H78" stroke="#fff" stroke-width="3"/><circle cx="34" cy="62" r="4" fill="#fbe3a1"/><circle cx="66" cy="62" r="4" fill="#fbe3a1"/><path d="M36 74 L28 88 M64 74 L72 88" stroke="#5a3a22" stroke-width="3" stroke-linecap="round"/><path d="M24 84 H76 M20 92 H80" stroke="#8a7f70" stroke-width="2.4" stroke-linecap="round"/></svg>`},
  compass:{bg:"#f1ead9",svg:`<svg viewBox="0 0 100 100"><circle cx="50" cy="52" r="32" fill="#fffaf0" stroke="#d8b35a" stroke-width="5"/><rect x="45" y="14" width="10" height="7" rx="2" fill="#d8b35a"/><g font-family="Georgia,serif" font-size="9" fill="#7a5a3a" text-anchor="middle"><text x="50" y="32">N</text><text x="50" y="80">S</text><text x="28" y="55">W</text><text x="72" y="55">E</text></g><g transform="rotate(30 50 52)"><path d="M50 30 L56 52 L44 52Z" fill="#d9483b"/><path d="M50 74 L56 52 L44 52Z" fill="#8fb8c9"/></g><circle cx="50" cy="52" r="3" fill="#7a5a3a"/></svg>`},
  bowl:{bg:"#fde6d3",svg:`<svg viewBox="0 0 100 100"><path d="M40 30 q-6-8 0-14 M52 28 q-6-8 0-14 M64 30 q-6-8 0-14" stroke="#c9a58a" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M60 22 L90 50 M66 18 L94 44" stroke="#9a6a3a" stroke-width="3" stroke-linecap="round"/><path d="M14 50 H86 C 86 72, 70 84, 50 84 C 30 84, 14 72, 14 50Z" fill="#fff" stroke="#6f8fd1" stroke-width="2.4"/><path d="M22 58 q7 4 14 0 t14 0 t14 0 t14 0" stroke="#6f8fd1" stroke-width="1.6" fill="none"/><path d="M18 50 q8-6 16 0 q8-6 16 0 q8-6 16 0 q8-6 16 0" stroke="#f3c34a" stroke-width="3" fill="none"/><circle cx="36" cy="46" r="5" fill="#f28b6e"/><ellipse cx="62" cy="45" rx="6" ry="4" fill="#fff4d6" stroke="#f3c34a" stroke-width="1.5"/><path d="M40 90 H60" stroke="#6f8fd1" stroke-width="3" stroke-linecap="round"/></svg>`}
};

const FORTUNES = [
  {t:"说走就走",p:"Shuo Zou Jiu Zou",e:"plane",m:"今天适合给自己放个假，哪怕只是去隔壁城市。"},
  {t:"一路顺风",p:"Yi Lu Shun Feng",e:"plane",m:"不管去哪儿，路上都会顺顺利利。"},
  {t:"满载而归",p:"Man Zai Er Gui",e:"suitcase",m:"带回来的除了纪念品，还有一整箱好心情。"},
  {t:"轻装上阵",p:"Qing Zhuang Shang Zhen",e:"suitcase",m:"放下包袱出发，脚步会越走越轻快。"},
  {t:"山高水长",p:"Shan Gao Shui Chang",e:"mountain",m:"去高一点的地方看看，心会变得很宽。"},
  {t:"登高望远",p:"Deng Gao Wang Yuan",e:"mountain",m:"爬上去的那一刻，风景会给你最好的奖励。"},
  {t:"海阔天空",p:"Hai Kuo Tian Kong",e:"beach",m:"去看看海吧，烦恼会被浪花一起带走。"},
  {t:"阳光正好",p:"Yang Guang Zheng Hao",e:"beach",m:"今天的天气偏爱你，适合出门晒晒太阳。"},
  {t:"扶摇直上",p:"Fu Yao Zhi Shang",e:"balloon",m:"旅途中会有让你心跳加速的小惊喜。"},
  {t:"奇遇连连",p:"Qi Yu Lian Lian",e:"balloon",m:"转角可能就是你会爱上的那家小店。"},
  {t:"美景入镜",p:"Mei Jing Ru Jing",e:"camera",m:"随手一拍都是大片，记得多留几张。"},
  {t:"风景独好",p:"Feng Jing Du Hao",e:"camera",m:"你看到的风景，刚好是最美的那一刻。"},
  {t:"一路繁花",p:"Yi Lu Fan Hua",e:"train",m:"窗外的风景一站比一站好看。"},
  {t:"准点出发",p:"Zhun Dian Chu Fa",e:"train",m:"今天的车次和航班都特别给面子。"},
  {t:"心之所向",p:"Xin Zhi Suo Xiang",e:"compass",m:"跟着感觉走，就不会走错路。"},
  {t:"四海为家",p:"Si Hai Wei Jia",e:"compass",m:"走到哪儿都能遇到温暖的人。"},
  {t:"吃遍四方",p:"Chi Bian Si Fang",e:"bowl",m:"今天会遇到一口让你记很久的美味。"},
  {t:"人间烟火",p:"Ren Jian Yan Huo",e:"bowl",m:"街边小摊里，藏着这座城市最好的味道。"}
];
const YI=["去海边看日落","逛一条老街","坐一趟慢火车","爬一座小山","找家本地小馆","去湖边吹吹风","逛逛博物馆","夜市觅食","骑车兜风","住一晚民宿","去花园散步","随便坐趟公交"];
const PLACES=["海边","古镇","山野","老街","湖边","小岛","夜市","花园","美术馆","森林","草原","温泉"];
const GO=["高铁","自驾","骑行","步行","飞机","轮渡","绿皮车","公交"];
const DIRS=["正东","东南","正南","西南","正西","西北","正北","东北"];
const ITEMS=["墨镜","草帽","胶片相机","帆布包","明信片","纸质地图","旅行手账","保温杯","小徽章","防晒霜"];
const TASKS_OLD=["拍一张今天的天空","尝一道没吃过的小吃","走一条没走过的路","给自己寄一张明信片","和路边的小猫打招呼","找一家有故事的小店","看一次日落或晚霞","收集一张车票或门票","在地图上标下个目的地","喝一杯当地特色饮品","给眼前的风景起个名字","录一段十秒的风声"];
const LEVELS=["大吉","大吉","大吉","上吉","上吉","中吉"];
const CONF=["✈️","🧳","🌴","⛰️","📷","🎈","🗺️","🚄","🌅","🍜"];
const R=a=>Math.floor(Math.random()*a.length), pick=a=>a[R(a)];
const pad=n=>String(n).padStart(2,"0");
const today=todayFn;

/* ---- one draw per day ---- */
const KEY="travel-fortune-v1"; let mem=null;
function load(){ try{ const v=localStorage.getItem(KEY); return v?JSON.parse(v):mem; }catch(e){ return mem; } }
function save(o){ mem=o; try{ localStorage.setItem(KEY,JSON.stringify(o)); }catch(e){} api.saveFortune(o.date,o).catch(()=>{}); }
let rec=load(); if(!rec||rec.date!==today()) rec=null;
const TD={COUNTRY,CITY,SPOTS,CTASKS,stampSVG};
function defaultDest(){
  const ck=tripCityKey(); if(ck) return ck;
  return "xm";
}
function genTasks(ck){
  const pool=TD.CTASKS[ck]||TD.CTASKS.xm, F=pool.filter(t=>t[0]==="F"), D=pool.filter(t=>t[0]==="D");
  const sh=a=>a.slice().sort(()=>Math.random()-.5), nf=Math.random()<.5?1:2;
  return sh([...sh(F).slice(0,nf),...sh(D).slice(0,3-nf)]);
}
const escH=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
/* one mission per person, tied to today's itinerary; every travel buddy gets a different one */
function genMission(date){
  const ms=api.members.slice().sort((a,b)=>String(a.id).localeCompare(String(b.id))), i=Math.max(0,ms.findIndex(m=>m.id===(api.me&&api.me.id)));
  const lock=["transit","lodging","flight"], cand=[];
  dayActs(date).filter(a=>a.status!=="removed"&&a.status!=="skipped"&&!lock.includes(a.kind)&&!/^(早餐|午餐|晚餐)$/.test(a.title)).forEach(a=>{ cand.push({name:a.title,city:a.city,kind:a.kind}); (a.spots||[]).forEach(sp=>cand.push({name:sp,city:a.city,parent:a.title,kind:"sight"})); });
  if(cand.length){ const r=seeded("fm|"+date); for(let k=cand.length-1;k>0;k--){ const j=Math.floor(r()*(k+1)); [cand[k],cand[j]]=[cand[j],cand[k]]; }
    const c=cand[i%cand.length], m=missionFor(c.name,c.city,date,Math.floor(i/cand.length),c.parent,c.kind);
    return {place:c.name,parent:c.parent||null,city:c.city,type:m.type,text:m.text}; }
  const g=cityGuide(date);
  if(g&&g.spots.length){ const sp=g.spots[(i+Math.floor(seeded("fg|"+date)()*g.spots.length))%g.spots.length], m=missionFor(sp.n,g.name,date,Math.floor(i/g.spots.length),null,"sight"); return {place:sp.n,city:g.name,type:m.type,text:m.text}; }
  const ck=defaultDest(), pool=(TD.CTASKS[ck]||TD.CTASKS.xm), t=pool[(i+Math.floor(seeded("fm|"+date)()*pool.length))%pool.length];
  return {place:TD.CITY[ck].name,city:TD.CITY[ck].name,type:t[0]==="F"?"food":"pose",text:t.slice(1)};
}
function ensureMission(){ if(!rec) return false; if(rec.mission) return true; if(!isReady()) return false; rec.mission=genMission(rec.date); rec.done=[false]; save(rec); return true; }
export function refreshFortuneMission(){ if(rec){ renderTasks(false); } }

function generate(){
  const stars=[0,0,0,0].map(()=>3+Math.floor(Math.random()*3));
  if(!stars.includes(5)) stars[R(stars)]=5;
  const dest=defaultDest(), t=[];
  return { date:today(), i:R(FORTUNES), lvl:pick(LEVELS), yi:pick(YI), place:pick(PLACES), go:pick(GO), dir:pick(DIRS), item:pick(ITEMS), stars, dest, tasks:t, done:[false] };
}

const $=id=>document.getElementById(id);
const stage=$("stage"), card=$("card"), tiltEl=$("tilt"), hint=$("hint"), count=$("count"), footer=$("footer"), emblem=$("emblem"), back=$("back");

function setEmblem(key){ emblem.innerHTML=EMB[key].svg; emblem.style.background=EMB[key].bg; }
function renderCard(r){
  const f=FORTUNES[r.i];
  setEmblem(f.e);
  $("lvl").textContent=r.lvl;
  $("title").textContent=f.t; $("pinyin").textContent=f.p;
  $("info").innerHTML=`<div class="col"><b>宜</b>・${r.yi}</div><div class="col"><b>去处</b>・${r.place}</div><div class="col"><b>出行</b>・${r.go}</div><div class="col"><b>方位</b>・${r.dir}</div>`;
  const L=["出行","美食","风景","奇遇"];
  $("ratings").innerHTML=L.map((l,k)=>`<span>${l}<em class="stars">${"★".repeat(r.stars[k])}<i>${"★".repeat(5-r.stars[k])}</i></em></span>`).join("")+`<span style="grid-column:1/-1">幸运物<em>${r.item}</em></span>`;
  $("msg").textContent=f.m;
  renderTasks(false);
}
function renderTasks(fresh){
  if(!ensureMission()){ $("dest").textContent="正在读取今天的行程…"; $("tasks").innerHTML=""; $("szTip").innerHTML=""; $("bigstamp").innerHTML=""; return; }
  const m=rec.mission; let done=!!rec.done[0];
  const has=myStamps().some(s=>s.name===m.place&&s.date===rec.date); if(rec.pending&&has){ rec.pending=false; save(rec); }
  const waiting=done&&rec.pending&&!has;
  $("dest").innerHTML=`${escH(m.city)} · 只属于你的任务`;
  $("tasks").innerHTML=`<div class="fm ${m.type}"><small>${missionIcon(m.type)} · ${escH(m.place)}</small><p>${escH(m.text)}</p>${waiting?`<b class="fm-done">✈ 已交给旅伴，等确认</b>`:done?`<b class="fm-done">✓ 已完成，印章在手账里</b>`:`<button class="btn ink sm fm-go" data-go>去完成</button>`}</div><p class="fm-note">每个旅伴今天拿到的任务都不一样</p>`;
  $("szTip").innerHTML=`完成后盖上<br>${escH(m.place.replace(/（.*?）/g,""))}印章`;
  $("bigstamp").innerHTML=done&&!waiting?placeStamp(m.place,m.city,rec.date):"";
  back.classList.toggle("all",done); back.classList.toggle("fresh",!!fresh&&done);
}

/* ---- card motion ---- */
let state="idle", cy=0, cs=1, cr=0;
const ch=()=>card.offsetHeight;
function apply(ms,ease){
  card.style.transition=ms?`transform ${ms}ms ${ease||"cubic-bezier(.22,1,.36,1)"}`:"none";
  card.style.transform=`translateY(${cy}px) rotate(${cr}deg) scale(${cs})`;
}
const REST=()=>-0.1*ch(), UNTIED=()=>-0.3*ch(), TOP=()=>-0.58*ch();
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const buzz=ms=>{ try{ navigator.vibrate&&navigator.vibrate(ms); }catch(e){} };

function untie(){
  sfx.paper();
  state="busy"; stage.classList.add("untied"); buzz(8);
  hint.textContent="按住卡片往上抽 ↑"; count.textContent=rec?"今天的旅运已经抽过啦，再看一眼":"";
  setTimeout(()=>{ cy=UNTIED(); apply(650,"cubic-bezier(.34,1.45,.64,1)"); state="untied"; },380);
}
async function pullOut(){
  state="busy"; askGyro();
  const first=!rec;
  if(first){ rec=generate(); save(rec); }
  cr=0; cy=TOP(); apply(380,"cubic-bezier(.3,.7,.4,1)");
  if(first){ renderCard(rec); emblem.classList.remove("pop"); void emblem.offsetWidth; emblem.classList.add("pop"); }
  await wait(360);
  stage.classList.add("front","down");
  cy=0; cs=1.03; apply(650,"cubic-bezier(.22,1.2,.36,1)");
  buzz(first?[12,40,18]:10);
  await wait(300);
  card.classList.add("revealed"); burst(first?22:10); sfx.reveal();
  footer.classList.add("show-close"); hint.textContent="轻点卡片翻面，看看今日打卡任务"; count.textContent="按住卡片左右拖动试试";
  gyroBase=null; state="front";
}
async function putBack(){
  if(state!=="front") return;
  state="busy"; footer.classList.remove("show-close"); card.classList.remove("revealed");
  if(stage.classList.contains("flipped")){ stage.classList.remove("flipped"); await wait(450); }
  setTilt(0,0,false);
  stage.classList.remove("down");
  cy=TOP(); cs=1; apply(420,"cubic-bezier(.4,0,.2,1)");
  await wait(400);
  stage.classList.remove("front");
  cy=REST(); apply(520);
  await wait(420);
  stage.classList.remove("untied");
  await wait(300); state="idle"; updateIdleHint();
}

/* ---- confetti ---- */
function burst(n){
  const w=stage.offsetWidth, h=stage.offsetHeight;
  for(let k=0;k<n;k++){
    const s=document.createElement("span"); s.className="conf"; s.textContent=pick(CONF);
    const a=Math.random()*Math.PI*2, d=w*(.45+Math.random()*.55);
    s.style.setProperty("--dx",Math.cos(a)*d+"px");
    s.style.setProperty("--dy",(Math.sin(a)*d*.8 + h*.15)+"px");
    s.style.setProperty("--r",(Math.random()*120-60)+"deg");
    s.style.fontSize=(14+Math.random()*14)+"px";
    s.style.animationDelay=(Math.random()*.2)+"s";
    stage.appendChild(s); setTimeout(()=>s.remove(),1900);
  }
}

/* ---- tilt + glare ---- */
function setTilt(rx,ry,live){
  tiltEl.classList.toggle("live",!!live);
  tiltEl.style.setProperty("--rx",rx+"deg"); tiltEl.style.setProperty("--ry",ry+"deg");
  const f=stage.classList.contains("flipped")?-1:1;
  card.style.setProperty("--gx",(50+ry*3*f)+"%"); card.style.setProperty("--gy",(35-rx*3)+"%");
}
function tiltFrom(x,y){
  const b=card.getBoundingClientRect();
  const nx=Math.max(-1,Math.min(1,(x-(b.left+b.width/2))/(b.width/2)));
  const ny=Math.max(-1,Math.min(1,(y-(b.top+b.height/2))/(b.height/2)));
  setTilt(-ny*14, nx*16, true);
}
let gyroAsked=false, gyroBase=null;
function askGyro(){
  if(gyroAsked) return; gyroAsked=true;
  try{ if(window.DeviceOrientationEvent&&typeof DeviceOrientationEvent.requestPermission==="function") DeviceOrientationEvent.requestPermission().catch(()=>{}); }catch(e){}
}
window.addEventListener("deviceorientation",e=>{
  if(state!=="front"||fdrag||e.beta==null) return;
  if(!gyroBase) gyroBase={b:e.beta,g:e.gamma};
  const c=v=>Math.max(-12,Math.min(12,v));
  setTilt(c(-(e.beta-gyroBase.b)*.6), c((e.gamma-gyroBase.g)*.6), true);
});

/* ---- pointer handling ---- */
let drag=null, fdrag=null;
card.addEventListener("pointerdown",e=>{
  if(state==="untied"){ drag={x:e.clientX,y:e.clientY,start:cy,moved:0}; card.setPointerCapture(e.pointerId); card.style.cursor="grabbing"; }
  else if(state==="front"){ fdrag={x:e.clientX,y:e.clientY,t:e.target,moved:0}; card.setPointerCapture(e.pointerId); tiltFrom(e.clientX,e.clientY); }
});
card.addEventListener("pointermove",e=>{
  if(drag){
    const dx=e.clientX-drag.x, dy=e.clientY-drag.y; drag.moved=Math.max(drag.moved,Math.hypot(dx,dy));
    const want=drag.start+dy, lo=TOP(), hi=UNTIED()+20;
    cy = want<lo ? lo-(lo-want)*.25 : Math.min(hi,want);
    cr=Math.max(-7,Math.min(7,dx*.06)); apply(0);
    if(cy < -0.42*ch() && !drag.ready){ drag.ready=true; buzz(6); }
  } else if(fdrag){
    fdrag.moved=Math.max(fdrag.moved,Math.hypot(e.clientX-fdrag.x,e.clientY-fdrag.y)); tiltFrom(e.clientX,e.clientY);
  }
});
function endPointer(e){
  if(drag){
    const d=drag; drag=null; card.style.cursor="";
    if(d.moved<6 || cy < -0.42*ch()) pullOut();
    else { cy=UNTIED(); cr=0; apply(550,"cubic-bezier(.34,1.45,.64,1)"); }
  } else if(fdrag){
    const d=fdrag; fdrag=null;
    if(e.pointerType!=="mouse") setTilt(0,0,false);
    if(d.moved<8 && e.type==="pointerup") tap(d.t);
  }
}
card.addEventListener("pointerup",endPointer);
card.addEventListener("pointercancel",endPointer);
document.addEventListener("pointermove",e=>{
  if(e.pointerType==="mouse" && state==="front" && !fdrag) tiltFrom(e.clientX,e.clientY);
});
card.addEventListener("pointerleave",e=>{ if(e.pointerType==="mouse"&&!fdrag&&state==="front") setTilt(0,0,false); });

function tap(t){
  const task=t.closest&&t.closest(".task");
  const flippedNow=stage.classList.contains("flipped");
  if(flippedNow && t.closest && t.closest("[data-go]")){
    const m=rec.mission;
    openCheckin({ name:m.place, city:m.city, date:rec.date, kind:"place", parent:m.parent, mission:{type:m.type,text:m.text}, onDone:(r)=>{ rec.done=[true]; rec.pending=!!(r&&r.pending); save(rec); renderTasks(true); buzz([15,50,25]); if(!rec.pending) setTimeout(()=>burst(26),250); hint.textContent=rec.pending?"已交给旅伴，确认后就盖章":"任务完成！印章已放进手账"; } });
    return;
  }
  if(flippedNow && t.closest && t.closest(".fm")) return;
  const on=!stage.classList.toggle("flipped"); buzz(6);
  setTilt(0,0,false);
  hint.textContent = on ? "轻点卡片翻面，看看今日打卡任务" : "今天只有一个任务，完成就能盖章";
  count.textContent = on ? "按住卡片左右拖动试试" : `已完成 ${rec.done.filter(Boolean).length} / 1`;
}
const obsTasks=new MutationObserver(()=>{ if(stage.classList.contains("flipped")&&rec) count.textContent=`已完成 ${rec.done.filter(Boolean).length} / 1`; });
obsTasks.observe($("tasks"),{childList:true});

stage.addEventListener("click",e=>{
  if(card.contains(e.target) && state!=="idle") return;
  if(state==="idle") untie();
  else if(state==="untied" && !drag) pullOut();
});
$("closeBtn").addEventListener("click",putBack);

/* ---- idle hint + countdown + midnight reset ---- */
function updateIdleHint(){
  if(state!=="idle") return;
  if(rec && rec.date!==today()){ rec=null; setEmblem("globe"); }
  if(!rec){ hint.textContent="轻触绳结，拆开今日旅运"; count.textContent="每天只能抽一次哦"; return; }
  const n=new Date(), m=new Date(n); m.setHours(24,0,0,0);
  const s=Math.max(0,Math.floor((m-n)/1000));
  hint.textContent="今日旅运已抽出，点卡套再看一眼";
  count.textContent=`距离下一次抽取还有 ${pad(Math.floor(s/3600))}:${pad(Math.floor(s%3600/60))}:${pad(s%60)}`;
}
setInterval(updateIdleHint,1000);

/* ---- header ---- */
const now=nowFn(), hr=new Date().getHours();
$("greet").textContent = hr<11?"早上好,":hr<14?"中午好,":hr<18?"下午好,":"晚上好,";
weatherFor(cityOf(today())).then(v=>{ WX=v; const el=document.querySelector("#pg-fortune .hello span"); if(el&&v){ el.textContent=weatherLine(v); el.title="数据来源："+v.source; } if(el) el.classList.add("wx-tap"); });
export function refreshWeather(){ weatherFor(cityOf(today())).then(v=>{ WX=v; const el=document.querySelector("#pg-fortune .hello span"); if(el) el.classList.add("wx-tap"); if(el&&v){ el.textContent=weatherLine(v); el.title="数据来源："+v.source; } }); }
$("dNum").textContent=`${now.getMonth()+1}.${now.getDate()}`;
$("dWeek").textContent=`星期${"日一二三四五六"[now.getDay()]}`;
const md=`${pad(now.getMonth()+1)}.${pad(now.getDate())}`;
$("sDate").textContent=`${now.getFullYear()} · ${md.replace("."," · ")}`;
$("sPostDate").textContent=md; $("pmDate").textContent=md;

if(rec) renderCard(rec); else setEmblem("globe");
updateIdleHint();
/* pull today's fortune from the cloud if this device doesn't have it */
export async function hydrateFortune(){ if(rec) return; try{ const d=await api.getFortune(today()); if(d&&d.date===today()&&!rec&&state==="idle"){ rec=d; mem=d; try{ localStorage.setItem(KEY,JSON.stringify(d)); }catch(e){} renderCard(rec); updateIdleHint(); } }catch(e){} }
export function fortuneResize(){ if(state==="idle"){ cy=REST(); apply(0); } }
requestAnimationFrame(()=>{ cy=REST(); apply(0); });
window.addEventListener("resize",()=>{ if(state==="idle"){ cy=REST(); apply(0); } else if(state==="untied"){ cy=UNTIED(); apply(0); } });
onApi("stamps",()=>{ if(rec&&rec.pending) renderTasks(false); });
