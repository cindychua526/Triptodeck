import { ICON } from "../data/world.js";
import { ic } from "../lib/icons.js";
import { foodArt } from "../data/foodart.js";
import { doodle } from "../data/doodles.js";
import { openSheet as openUSheet, closeSheet as closeUSheet, bind as bindU, toast as toastU, askConfirm, askText } from "../lib/ui.js";
const RATE={love:["好吃！",ic("thumbs-up")],ok:["还行",ic("smiley-meh")],meh:["不爱",ic("thumbs-down")]};
import { GUIDES, guideFor } from "../data/guides.js";
/* food tickets: this module keeps its own city / food tables */
const COUNTRY = {}, CITY = {}, SPOTS = [];
import { api } from "../lib/api.js";
import { esc } from "../lib/util.js";
import { sfx } from "../lib/sound.js";
import { today as todayFn, shrinkImage, dataUrlToBlob } from "../lib/util.js";
import { on, nameOf } from "../lib/api.js";
import { acts as tripActs, tripDays, cityOf, customs, tripCities, tripCityNames } from "./trip.js";
import { GUIDE, kindIcon } from "../data/fujian.js";
import { COORDS } from "../data/fujian.js";
const $=id=>document.getElementById(id);
const pad=n=>String(n).padStart(2,"0");
const today=todayFn;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const buzz=p=>{ try{ navigator.vibrate&&navigator.vibrate(p); }catch(e){} };
let wallet=[], walletLoaded=false;
export async function loadWallet(){ loadFoodPhotoUrls().then(()=>{ try{ renderSpots(); }catch(e){} }); const tid=api.trip&&api.trip.id; wallet=[]; walletLoaded=false; renderWallet(); updateBadge(); try{ const rows=(await api.wallet()).filter(r=>!tid||r.trip_id===tid); if(!api.trip||api.trip.id!==tid) return; wallet=rows.map(r=>({id:r.spot_id,date:r.date,serial:r.serial,rating:r.rating||null,note:r.note||null,t:Date.parse(r.created_at||0)||0})).sort((a,b)=>a.t-b.t).filter((w,i,a)=>a.findIndex(x=>x.id===w.id)===i); }catch(e){ console.warn(e); } walletLoaded=true; renderWallet(); updateBadge(); renderSpots(); }
function persistOne(w){ const sp=spotById(w.id); api.putWallet({spot_id:w.id,date:w.date,serial:w.serial,rating:w.rating||null,note:w.note||null,city:sp?CITY[sp.c].name:null}).catch(()=>toast("票夹没能同步，请检查网络")); }
/* ---------- helpers ---------- */
const spotById=id=>SPOTS.find(s=>s.id===id);
const inWallet=id=>wallet.find(w=>w.id===id);
const countryOf=s=>CITY[s.c].k;
function toast(msg){ const t=$("toast"); t.textContent=msg; t.classList.add("on"); clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.remove("on"),Math.max(4200,String(msg).length*160)); }
function dist(a,b,c,d){ const R=6371,r=Math.PI/180,x=Math.sin((c-a)*r/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin((d-b)*r/2)**2; return 2*R*Math.asin(Math.sqrt(x)); }

const PHOTO={};
export async function loadFoodPhotoUrls(){ let L=[]; try{ L=await api.foodPhotos(); }catch(e){ return; } const pick={}; L.forEach(p=>{ const cur=pick[p.food]; if(!cur||(p.user_id===api.me.id&&cur.user_id!==api.me.id)||(p.user_id===cur.user_id&&String(p.created_at)>String(cur.created_at))) pick[p.food]=p; });
  await Promise.all(Object.entries(pick).map(async([f,p])=>{ try{ const u=p.photo_path.startsWith("data:")?p.photo_path:await api.sharedUrl(p.photo_path); if(u) PHOTO[f]=u; }catch(e){} })); }
const artOrPhoto=(name,cls)=>PHOTO[name]?`<div class="${cls} photo" style="background-image:url('${PHOTO[name]}')"></div>`:`<div class="${cls}">${foodArt(name)}</div>`;
function frontHTML(s,meta,tw){
  const c=CITY[s.c], k=COUNTRY[c.k];
  return `<div class="tk" style="--c:${c.color};--tw:${tw}px">
    <div class="tk-main">
      <div class="tk-top"><span>Taste of ${c.en}</span><span>${meta.serial}</span></div>
      <div class="tk-name${s.name.length>9?" xlong":s.name.length>5?" long":""}">${s.name}</div>
      <div class="tk-en">${s.en}</div>
      <p class="tk-mean">${s.mean}</p>
      <div class="tk-foot"><span>${meta.date.replace(/-/g,".")}</span>${s.tag&&s.tag!=="美食"?`<em>${s.tag}</em>`:""}</div>
      ${artOrPhoto(s.name,"tk-food")}
    </div>
    <div class="tk-stub"><b>尝过了</b><small>${c.name}</small></div>${meta.rating&&RATE[meta.rating]?`<div class="tk-rate r-${meta.rating}">${RATE[meta.rating][0]}</div>`:""}
  </div>`;
}
const MINI_PAL=[["#e8a87c","#fff4e8"],["#8fb8a8","#eef7f2"],["#e6c27a","#fff8e6"],["#d98a8a","#fdf0ef"],["#9aaed6","#f0f3fb"],["#c5a3d1","#f7f0fa"],["#e0976b","#fdf1e9"],["#a7c47f","#f3f8ea"]];
function hashS(t){ let h=0; for(const ch of String(t)) h=(h*31+ch.charCodeAt(0))|0; return Math.abs(h); }
function miniHTML(s,w){
  const [c,bg]=MINI_PAL[hashS(s.name)%MINI_PAL.length], r=(hashS(s.id)%5)-2, rate=w.rating&&RATE[w.rating];
  return `<div class="tkm" style="--c:${c};--bg:${bg};--r:${r}deg">
    <div class="tkm-top"><span>${esc(w.serial||"")}</span><span>${(w.date||"").slice(5).replace("-",".")}</span></div>
    ${PHOTO[s.name]?`<div class="tkm-art photo" style="background-image:url('${PHOTO[s.name]}')"></div>`:`<div class="tkm-art">${foodArt(s.name)}</div>`}
    <b class="tkm-name">${esc(s.name)}</b><small class="tkm-en">${esc(s.en||"")}</small>
    <i class="tkm-perf"></i><div class="tkm-stub"><span>尝过了</span><em>${esc(CITY[s.c].name)}</em></div>
    ${rate?`<span class="tkm-rate r-${w.rating}">${rate[0]}</span>`:""}</div>`;
}
function blankHTML(s,tw){
  const c=CITY[s.c], k=COUNTRY[c.k];
  return `<div class="tk blank" style="--c:${c.color};--tw:${tw}px">
    <i class="edge-l"></i>
    <div class="tk-main">
      <div class="tk-top"><span>Food Ticket</span><span>No. ????</span></div>
      <div class="tk-name${s.name.length>9?" xlong":s.name.length>5?" long":""}">${s.name}</div>
      <div class="tk-en">${c.name} · ${s.en||"local food"}</div>
      <div class="bl-q">食</div>
      <div class="tk-foot"><span>吃到了就撕下</span></div>
    </div>
    <div class="tk-stub"><b>撕下收藏</b><small>TEAR</small></div>
  </div>`;
}

export function onShow(){ layoutTape(); renderWallet(); const sc=$("scene"); if(sc&&!sc.querySelector(".chalk")){ const c=document.createElement("div"); c.className="chalk"; c.innerHTML=[["fruit",6,4,26],["drink",64,2,22],["noodles",70,58,30],["star",8,60,14]].map(([d,x,y,w])=>`<span style="left:${x}%;top:${y}%;width:${w}%">${doodle(d,{sketch:true,ink:"#a0764a",accent:"#a0764a",seed:x})}</span>`).join(""); sc.prepend(c);} }
/* the red number on 手账 = new things since you last opened it (not the total) */
const seenKey=()=>"td-seen-book:"+(api.trip?api.trip.id:"");
function updateBadge(){ const b=$("badge"); if(!b) return; let seen=null; try{ seen=localStorage.getItem(seenKey()); }catch(e){} if(seen===null){ if(!walletLoaded){ b.textContent=""; return; } try{ localStorage.setItem(seenKey(),String(wallet.length)); }catch(e){} seen=wallet.length; } const n=Math.max(0,wallet.length-(+seen||0)); b.textContent=n?(n>9?"9+":n):""; }
export function markBookSeen(){ try{ localStorage.setItem(seenKey(),String(wallet.length)); }catch(e){} updateBadge(); }

/* ---------- tear page: country -> city -> spot ---------- */
let country="cn", city="xm", spot=SPOTS.find(s=>s.id==="xm1"), located=null, L0=80, L=80, busy=false;
const scene=$("scene"), rig=$("rig"), strip=$("strip"), tape=$("tape"), grab=$("grab"), rollPrint=$("rollPrint");
const twPx=()=>Math.round(scene.querySelector(".roll").offsetHeight/0.42);

function renderCountries(){
  const box=$("countries");
  box.innerHTML=`<button class="chip loc" id="locBtn">${ic("crosshair")} 定位</button>`+Object.entries(COUNTRY).map(([k,c])=>`<button class="chip${k===country?" on":""}" data-k="${k}" style="--c:${CITY[firstCity(k)].color}">${c.flag} ${c.name}</button>`).join("");
  box.querySelectorAll("[data-k]").forEach(b=>b.onclick=()=>{ located=null; setCountry(b.dataset.k); });
  $("locBtn").onclick=locate;
}
const firstCity=k=>Object.keys(CITY).find(c=>CITY[c].k===k);
function setCountry(k,keepCity){
  country=k;
  document.querySelectorAll("#countries [data-k]").forEach(b=>b.classList.toggle("on",b.dataset.k===k));
  const box=$("cities");
  box.innerHTML=Object.entries(CITY).filter(([,c])=>c.k===k).map(([ck,c])=>`<button class="chip sm" data-k="${ck}" style="--c:${c.color}">${c.name}</button>`).join("");
  box.querySelectorAll("[data-k]").forEach(b=>b.onclick=()=>{ located=null; setCity(b.dataset.k); });
  box.insertAdjacentHTML("beforeend",`<button class="chip sm add-own" id="addOwn2">＋ 加自己吃到的</button>`); $("addOwn2").onclick=openAddFood;
  box.style.display="";
  if(!keepCity) setCity(firstCity(k));
}
function setCity(ck,keepSpot){
  city=ck;
  document.querySelectorAll("#cities [data-k]").forEach(b=>b.classList.toggle("on",b.dataset.k===ck));
  const on=document.querySelector("#cities .on"); on&&on.scrollIntoView({inline:"nearest",block:"nearest"});
  if(!keepSpot){ const list=SPOTS.filter(s=>s.c===ck); spot=list.find(s=>!inWallet(s.id))||list[0]; }
  renderSpots(); if(!spot||spot.c!==ck&&!SPOTS.some(x=>x.c===ck)) return; setSpot(spot.id);
}
function renderSpots(){
  const box=$("spots"); if(!box) return;
  box.innerHTML=SPOTS.filter(s=>s.c===city).map(s=>`<button class="spot${spot&&s.id===spot.id?" on":""}" data-id="${s.id}" style="--c:${CITY[s.c].color}">
    ${inWallet(s.id)?'<span class="got">✓</span>':''}
    ${PHOTO[s.name]?`<span class="spot-art photo" style="background-image:url('${PHOTO[s.name]}')"></span>`:`<span class="spot-art">${foodArt(s.name)}</span>`}<b>${s.name}</b>${inWallet(s.id)?`<i class="spot-got${inWallet(s.id).rating?" r-"+inWallet(s.id).rating:""}">${inWallet(s.id).rating==="love"?"♥":"✓"}</i>`:""}</button>`).join("");
  box.querySelectorAll(".spot").forEach(b=>b.onclick=()=>setSpot(b.dataset.id));
  renderTodo();
}
/* under the roll: what this city still has for you (tap one to load its ticket) */
function renderTodo(){
  const el=$("tearTodo"); if(!el) return;
  const all=SPOTS.filter(s=>s.c===city), left=all.filter(s=>!inWallet(s.id)), got=all.length-left.length;
  if(!all.length){ el.innerHTML=""; return; }
  el.innerHTML=`<div class="tt-h"><b>${esc(CITY[city].name)}还没吃过的</b><span>${got} / ${all.length} 已撕</span></div>${left.length?`<div class="tt-grid">${left.slice(0,12).map(s=>`<button class="tt-i" data-id="${s.id}"><span>${foodArt(s.name)}</span><b>${esc(s.name)}</b>${s.tag&&s.tag!=="美食"?`<small>${esc(s.tag)}</small>`:""}</button>`).join("")}</div>${left.length>12?`<p class="tt-more">还有 ${left.length-12} 样，在上面的票里左右滑</p>`:""}`:`<p class="tt-done">✦ 这座城市的美食票都撕齐了！</p>`}`;
  el.querySelectorAll(".tt-i").forEach(b=>b.onclick=()=>{ setSpot(b.dataset.id); document.getElementById("pg-tear").scrollTo({top:0,behavior:"smooth"}); });
}
function setSpot(id){
  spot=spotById(id);
  document.querySelectorAll("#spots .spot").forEach(b=>b.classList.toggle("on",b.dataset.id===id));
  const on=document.querySelector("#spots .spot.on"); on&&on.scrollIntoView({inline:"nearest",block:"nearest",behavior:"smooth"});
  const col=CITY[spot.c].color;
  scene.style.setProperty("--c",col); $("tearBtn").style.setProperty("--c",col);
  $("tearBtn").textContent=`撕下「${spot.name}」`;
  $("tearHint").textContent=inWallet(spot.id)?"这张已经在票夹里了，撕下可以更新日期":"吃到了？按住票的一角往右拉，或者点上面的按钮";
  const gi=$("foodInfo"); if(gi) gi.innerHTML=`<b>${spot.name}</b>${spot.en?` <em>${spot.en}</em>`:""}<p>${spot.mean||""}</p>${spot.where?`<p class="fi-where">${ic("map-pin")} ${spot.where}</p>`:""}`;
  layoutTape();
}
function layoutTape(){
  if(!spot) return;
  const tw=twPx(); L0=Math.round(scene.querySelector(".roll").offsetWidth*0.5+34);
  tape.innerHTML=blankHTML(spot,tw)+blankHTML(spot,tw);
  setL(L0,0);
}
function setL(v,ms){
  L=v;
  strip.style.transition=ms?`width ${ms}ms cubic-bezier(.22,1,.36,1)`:"none";
  strip.style.width=v+"px";
  rollPrint.style.transition=ms?`background-position ${ms}ms cubic-bezier(.22,1,.36,1)`:"none";
  rollPrint.style.backgroundPosition=`${v*0.9}px 0`;
  grab.style.left=(scene.querySelector(".roll").offsetWidth*0.5+v-14)+"px";
}
function locate(){
  if(!navigator.geolocation){ toast("这个页面拿不到定位，先手动选打卡点吧"); return; }
  toast("正在定位…");
  navigator.geolocation.getCurrentPosition(p=>{
    const {latitude:a,longitude:b}=p.coords;
    let best=null,bd=1e9; SPOTS.forEach(s=>{ const d=dist(a,b,s.lat,s.lng); if(d<bd){ bd=d; best=s; } });
    if(bd>80){ toast("附近还没有收录的打卡点，先手动选一个吧"); return; }
    located={lat:a,lng:b};
    setCountry(CITY[best.c].k,true); spot=best; setCity(best.c,true);
    toast(`你在${CITY[best.c].name}，离${best.name}约 ${bd<1?Math.round(bd*1000)+" 米":bd.toFixed(1)+" 公里"}`);
  },()=>toast("没有拿到定位，先手动选打卡点吧"),{timeout:8000,maximumAge:600000});
}

/* drag to tear */
let drag=null;
rig.addEventListener("pointerdown",e=>{ if(busy) return; drag={x:e.clientX,start:L}; rig.setPointerCapture(e.pointerId); rig.classList.add("pulling"); });
rig.addEventListener("pointermove",e=>{
  if(!drag) return;
  const tw=twPx(), v=Math.max(L0,Math.min(tw+14,drag.start+(e.clientX-drag.x)));
  setL(v,0);
  if(v>=tw+8){ drag=null; tear(); }
});
const endDrag=()=>{ if(!drag) return; drag=null; rig.classList.remove("pulling"); if(!busy&&L<twPx()*0.25) setL(L0,400); };
rig.addEventListener("pointerup",endDrag); rig.addEventListener("pointercancel",endDrag);
$("tearBtn").addEventListener("click",async()=>{
  if(busy) return; busy=true; rig.classList.add("pulling");
  setL(twPx()+10,900); await wait(900); busy=false; tear();
});

let cur=null, fly=null;
async function tear(){
  if(busy) return; busy=true; rig.classList.add("pulling");
  const tw=twPx(), lead=tape.lastElementChild, r=lead.getBoundingClientRect();
  const s=spot, had=inWallet(s.id);
  const meta={date:today(), serial:had?had.serial:`No. ${String(wallet.length+1).padStart(3,"0")}`};
  cur={s,meta,again:!!had,rating:had?had.rating:null};
  buzz([18,30,10]); sfx.tear();
  fly=document.createElement("div"); fly.className="fly";
  Object.assign(fly.style,{left:r.left+"px",top:r.top+"px",width:r.width+"px",height:r.height+"px"});
  fly.innerHTML=`<div class="flipper">${blankHTML(s,tw).replace('class="tk blank"','class="tk blank face-a"')}${frontHTML(s,meta,tw).replace('class="tk"','class="tk face-b"')}<div class="shine"></div></div>`;
  document.body.appendChild(fly);
  lead.remove(); tape.insertAdjacentHTML("afterbegin",blankHTML(s,tw));
  setL(Math.max(10,L-tw),0); setTimeout(()=>setL(L0,500),60);
  paperBits(r.left,r.top,r.height,CITY[s.c].color);
  await fly.animate([{transform:"none"},{transform:"translate(14px,-6px) rotate(4deg)"}],{duration:160,easing:"cubic-bezier(.2,.9,.3,1.4)",fill:"forwards"}).finished;
  $("overlay").classList.add("on");
  const W=Math.min(innerWidth*0.9,400), sc=W/r.width, tx=(innerWidth-W)/2-r.left, ty=Math.max(84,innerHeight*0.16)-r.top;
  await fly.animate([{transform:"translate(14px,-6px) rotate(4deg)"},{transform:`translate(${tx}px,${ty}px) rotate(-3deg) scale(${sc})`,offset:.8},{transform:`translate(${tx}px,${ty}px) scale(${sc})`}],{duration:700,easing:"cubic-bezier(.22,1,.36,1)",fill:"forwards"}).finished;
  fly.querySelector(".flipper").classList.add("turn"); buzz(12); sfx.flip(); setTimeout(()=>sfx.reveal(),300);
  await wait(420); fly&&fly.querySelector(".shine").classList.add("go");
  openSheet(false);
}
function paperBits(x,y,h,color){
  for(let i=0;i<16;i++){
    const b=document.createElement("i"); b.className="bit";
    b.style.left=x+"px"; b.style.top=(y+Math.random()*h)+"px"; b.style.background=i%3?color:"#fff6e6";
    document.body.appendChild(b);
    b.animate([{transform:"none",opacity:1},{transform:`translate(${-6-Math.random()*40}px,${40+Math.random()*80}px) rotate(${Math.random()*540}deg)`,opacity:0}],{duration:900+Math.random()*500,easing:"cubic-bezier(.2,.6,.4,1)"}).onfinish=()=>b.remove();
  }
}
function openSheet(fromWallet, inSheet){
  const {s,meta,again}=cur, c=CITY[s.c], k=COUNTRY[c.k], sh=$("sheet");
  sh.style.setProperty("--c",c.color);
  const near=located?`，距你约 ${dist(located.lat,located.lng,s.lat,s.lng).toFixed(1)} 公里`:"";
  sh.innerHTML=`<div class="sh-tag"><i></i>${c.name}${s.tag&&s.tag!=="美食"?"　"+s.tag:""}</div>
    <h3>${s.name}</h3>
    <div class="sh-block"><b>是什么</b><p>${s.mean}</p></div>
    ${s.where?`<div class="sh-block"><b>去哪吃</b><p>${s.where}</p></div>`:""}
    ${s.o?`<div class="sh-block"><b>出处</b><p>${s.o}</p></div>`:""}
    ${fromWallet?`<div class="sh-block"><b>你的评价 · 可以改</b></div><div class="rate-row" role="radiogroup" aria-label="好不好吃">${Object.entries(RATE).map(([k,[t,e]])=>`<button class="rate${meta.rating===k?" on":""}" data-rate="${k}" role="radio" aria-checked="${meta.rating===k}"><span>${e}</span>${t}</button>`).join("")}</div>`:`<div class="rate-row" role="radiogroup" aria-label="好不好吃">${Object.entries(RATE).map(([k,[t,e]])=>`<button class="rate${cur.rating===k?" on":""}" data-rate="${k}" role="radio" aria-checked="${cur.rating===k}"><span>${e}</span>${t}</button>`).join("")}</div>`}
    <div class="sh-block sh-photos"><b>大家拍的</b><div class="shp-row" id="shPhotos"></div><label class="shp-add">${ic("camera")} 上传这道菜的照片<input type="file" accept="image/*" id="shPhotoIn" hidden></label></div>
    ${s.cids&&s.cids.length?`<button class="linkbtn sh-del" id="shDel">${ic("trash")} 删除这道自己加的菜${s.cids.length>1?`（加了 ${s.cids.length} 次，会一起删掉）`:""}</button>`:""}
    <div class="sh-meta">${fromWallet?`${meta.date.replace(/-/g,".")} 收进票夹　${meta.serial}`:(again?"这张你已经收藏过了，可以更新打卡日期":"第一次来这里打卡")+near}</div>
    <div class="sh-btns">${fromWallet
      ?`<button class="btn" id="shRemove">移出票夹</button><button class="btn" id="shLog">记这一笔</button><button class="btn solid" id="shClose">收好了</button>`
      :`<button class="btn" id="shAgain">放回去</button><button class="btn solid" id="shSave">${again?"更新打卡日期":"收进票夹"}</button>`}</div>`;
  requestAnimationFrame(()=>sh.classList.add("on"));
  const del=$("shDel"); if(del) del.onclick=async()=>{ const w=inWallet(s.id); if(!await askConfirm(`删除「${s.name}」？同一个旅行房间的人也会看不到这道菜${w?"，你票夹里这张票也会一起移除":""}。`)) return;
    try{ await Promise.all(s.cids.map(id=>api.deleteCustom(id))); if(w){ wallet=wallet.filter(x=>x.id!==s.id); api.removeWallet(s.id).catch(()=>{}); updateBadge(); renderWallet(); } closeReveal(true); toast(`「${s.name}」删掉了`); }catch(e){ toast("没能删除："+e.message); } };
  foodPhotosInto($("shPhotos"), s.name, c.name);
  $("shPhotoIn").onchange=async e=>{ const f=e.target.files&&e.target.files[0]; if(!f) return; try{ const small=await shrinkImage(f, api.mode==="local"?600:1280, .8); const path=api.mode==="local"?small:await api.uploadShared(dataUrlToBlob(small)); loadFoodPhotoUrls.later=true; await api.addFoodPhoto({ food:s.name, city:c.name, date:todayFn(), photo_path:path }); toast("照片放进大家的手帐了"); foodPhotosInto($("shPhotos"), s.name, c.name); }catch(err){ toast("没能上传："+err.message); } };
  if(fromWallet){
    sh.querySelectorAll("[data-rate]").forEach(b=>b.onclick=()=>{ const w=inWallet(s.id); if(!w) return; w.rating=w.rating===b.dataset.rate?null:b.dataset.rate; persistOne(w); sh.querySelectorAll("[data-rate]").forEach(x=>{ x.classList.toggle("on",x.dataset.rate===w.rating); x.setAttribute("aria-checked",x.dataset.rate===w.rating); }); sfx.tap(); renderWallet(); });
    if(inSheet){ sh.insertAdjacentHTML("afterbegin",`<div class="sh-ticket">${frontHTML(s,meta,Math.min(innerWidth*0.86,360))}</div>`); sh.classList.add("with-ticket"); }
    $("shLog").onclick=()=>{ closeReveal(); setTimeout(()=>import("./budget.js").then(m=>m.openAdd({ category:/(奶茶|拉茶|咖啡|kopi|茶饮|饮|果汁|汁|冰沙|冰$|茶$)/i.test(s.name)&&!/面|饭|粥|汤|鸭|鸡|肉|粿|饼/.test(s.name)?"Coffee":"Food", note:s.name, date:meta.date, onSaved:()=>toastU("记好了") })),350); };
    $("shClose").onclick=()=>closeReveal();
    $("shRemove").onclick=()=>{ wallet=wallet.filter(w=>w.id!==s.id); api.removeWallet(s.id).catch(()=>{}); updateBadge(); closeReveal(true); renderSpots(); toast(`已把${s.name}移出票夹`); };
  }else{
    $("shAgain").onclick=()=>closeReveal();
    $("shSave").onclick=saveCur;
    sh.querySelectorAll("[data-rate]").forEach(b=>b.onclick=()=>{ cur.rating=b.dataset.rate; sh.querySelectorAll("[data-rate]").forEach(x=>{ x.classList.toggle("on",x===b); x.setAttribute("aria-checked",x===b); }); sfx.tap(); });
  }
}
async function closeReveal(removed){
  $("sheet").classList.remove("on","with-ticket"); $("overlay").classList.remove("on");
  const f=fly; fly=null;
  if(f){ await f.animate([{opacity:1},{opacity:0,transform:getComputedStyle(f).transform+" translateY(60px)"}],{duration:350,easing:"ease-in",fill:"forwards"}).finished; f.remove(); }
  busy=false; rig.classList.remove("pulling");
  if(removed) renderWallet();
}
async function saveCur(){
  const {s,meta,again}=cur;
  let w;
  if(again){ w=inWallet(s.id); w.date=meta.date; w.t=Date.now(); if(cur.rating) w.rating=cur.rating; wallet=wallet.filter(x=>x.id!==s.id).concat(w); }
  else { w={id:s.id,date:meta.date,serial:meta.serial,rating:cur.rating||null,t:Date.now()}; wallet.push(w); }
  persistOne(w); sfx.stamp();
  $("sheet").classList.remove("on"); $("overlay").classList.remove("on");
  if(api.trip && !again) setTimeout(()=>import("./budget.js").then(m=>m.openAdd({ category:/(奶茶|拉茶|咖啡|kopi|茶饮|饮|果汁|汁|冰沙|冰$|茶$)/i.test(s.name)&&!/面|饭|粥|汤|鸭|鸡|肉|粿|饼/.test(s.name)?"Coffee":"Food", note:s.name, date:meta.date, onSaved:()=>toastU("记好了") })), 900);
  const f=fly; fly=null;
  const tr=$("tab-collect").getBoundingClientRect(), cx=tr.left+tr.width/2, cy=tr.top+tr.height/2-6;
  await f.animate([{transform:getComputedStyle(f).transform,opacity:1},{transform:`translate(${cx-parseFloat(f.style.left)}px,${cy-parseFloat(f.style.top)}px) rotate(18deg) scale(.06)`,opacity:.4}],{duration:700,easing:"cubic-bezier(.55,0,.25,1)",fill:"forwards"}).finished;
  f.remove();
  const tab=$("tab-collect"); tab.classList.remove("bump"); void tab.offsetWidth; tab.classList.add("bump");
  updateBadge(); buzz(15);
  toast(again?`${s.name}的日期已更新`:`「${s.name}」收进票夹了，这是你的第 ${wallet.length} 张美食票`);
  justAdded=s.id; renderSpots(); setSpot(s.id);
  busy=false; rig.classList.remove("pulling");
}

/* ---------- wallet by country ---------- */
let justAdded=null, wFilter="all";
function renderWallet(){
  const items=wallet.filter(w=>spotById(w.id));
  const nc=new Set(items.map(w=>countryOf(spotById(w.id)))).size;
  $("wSub").innerHTML=items.length?`收集了 ${items.length} 张美食票，只有你看得到 <button class="linkbtn" id="wSave">存成照片</button>`:`这趟旅行有 ${SPOTS.length} 种当地美食等你尝`;
  const sv=$("wSave"); if(sv) sv.onclick=()=>exportWallet(items);
  $("wBar").style.width=(items.length/SPOTS.length*100)+"%";
  const cards=[`<button class="wc${wFilter==="all"?" on":""}" data-k="all"><span class="f">${ic("globe-hemisphere-east")}</span><b>全部</b><small>${items.length} 张</small></button>`]
    .concat(Object.entries(COUNTRY).map(([k,c])=>{ const all=SPOTS.filter(s=>countryOf(s)===k).length, got=items.filter(w=>countryOf(spotById(w.id))===k).length;
      return `<button class="wc${wFilter===k?" on":""}${got?" has":""}" data-k="${k}"><span class="f">${c.flag}</span><b>${c.name}</b><small>${got} / ${all}</small><i style="width:${got/all*100}%"></i></button>`; }));
  $("wCountries").innerHTML=cards.join("");
  $("wCountries").querySelectorAll(".wc").forEach(b=>b.onclick=()=>{ wFilter=b.dataset.k; renderWallet(); const l=$("wList"); requestAnimationFrame(()=>l.scrollTop=l.scrollHeight); });
  const act=$("wCountries").querySelector(".wc.on"); act&&act.scrollIntoView({inline:"nearest",block:"nearest"});
  const wc=$("wCities");
  if(wFilter==="all"){ wc.style.display="none"; }
  else{
    wc.style.display="";
    wc.innerHTML=Object.entries(CITY).filter(([,c])=>c.k===wFilter).map(([ck,c])=>{ const all=SPOTS.filter(s=>s.c===ck).length, got=SPOTS.filter(s=>s.c===ck&&inWallet(s.id)).length; return `<span class="w-city${got?" has":""}" style="--c:${c.color}"><i></i>${c.name} ${got}/${all}</span>`; }).join("");
  }
  const shown=items.filter(w=>wFilter==="all"||countryOf(spotById(w.id))===wFilter);
  const list=$("wList");
  if(!shown.length){
    const nm=wFilter==="all"?"":COUNTRY[wFilter].name;
    list.innerHTML=`<div class="w-empty"><svg viewBox="0 0 120 60" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="5 5"><rect x="4" y="6" width="112" height="48" rx="6"/><path d="M84 6V54"/></svg><br>${nm?`还没有${nm}的打卡票`:"票夹还是空的"}<br>到了想去的地方，就去撕一张吧<br><br><button class="btn" id="goTear">去撕票</button></div>`;
    $("goTear").onclick=()=>{ if(wFilter!=="all"){ located=null; setCountry(wFilter); } show("tear"); };
    return;
  }
  const tw=Math.round(Math.min(innerWidth*0.86,370));
  /* the wallet shows little stubs in a scrapbook grid, one colour per dish; tap one to take the full ticket out */
  const byCity={}; shown.forEach(w=>{ const c=CITY[spotById(w.id).c].name; (byCity[c]=byCity[c]||[]).push(w); });
  const multi=Object.keys(byCity).length>1;
  list.innerHTML=`<div class="wm">${Object.entries(byCity).map(([c,L])=>`${multi?`<div class="wm-city"><b>${esc(c)}</b><i></i><span>${L.length} 张</span></div>`:""}<div class="wm-grid">${L.map(w=>{ const s=spotById(w.id); return `<div class="w-item wm-item${w.id===justAdded?" new":""}" data-id="${w.id}" role="button" aria-label="${s.name}">${miniHTML(s,w)}</div>`; }).join("")}</div>`).join("")}</div>`;
  justAdded=null;
  list.querySelectorAll(".w-item").forEach(el=>el.addEventListener("click",()=>openFromWallet(el)));
  buddyTickets();
}
/* tickets your buddies tore that you don't have: take one if you ate it too */
const nameOfBuddy=id=>{ const m=(api.members||[]).find(x=>x.id===id); return m?m.name:"旅伴"; };
async function buddyTickets(){
  const list=$("wList"); if(!list) return; let B=[]; try{ B=await api.buddyWallet(); }catch(e){ return; }
  const no=(()=>{ try{ return new Set(JSON.parse(localStorage.getItem("td-buddy-no")||"[]")); }catch(e){ return new Set(); } })();
  const byId={}; B.forEach(r=>{ if(inWallet(r.spot_id)||no.has(r.spot_id)||!spotById(r.spot_id)) return; (byId[r.spot_id]=byId[r.spot_id]||[]).push(r); });
  const ids=Object.keys(byId); list.querySelector(".w-buddy")?.remove(); if(!ids.length) return;
  list.insertAdjacentHTML("beforeend",`<div class="w-buddy"><div class="sk-sec-h">BUDDIES <b>旅伴撕的票</b></div><p class="as-hint">你也吃了就收下，没吃就不要。只影响你自己的票夹。</p>${ids.map(id=>{ const s=spotById(id), rs=byId[id]; return `<div class="wb-row"><span class="wb-art">${foodArt(s.name)}</span><span class="wb-t"><b>${s.name}</b><small>${rs.map(r=>esc(nameOfBuddy(r.user_id))).join("、")} · ${rs[0].date}</small></span><button class="btn sm" data-no="${id}">没吃</button><button class="btn sm ink" data-take="${id}" data-date="${rs[0].date}">收下</button></div>`; }).join("")}</div>`);
  list.querySelectorAll("[data-take]").forEach(b=>b.onclick=()=>{ const w={id:b.dataset.take,date:b.dataset.date,serial:`No. ${String(wallet.length+1).padStart(3,"0")}`,rating:null,t:Date.now()}; wallet.push(w); persistOne(w); updateBadge(); sfx.stamp(); toastU(`收下了「${spotById(w.id).name}」`); justAdded=w.id; renderWallet(); renderSpots(); });
  list.querySelectorAll("[data-no]").forEach(b=>b.onclick=()=>{ no.add(b.dataset.no); localStorage.setItem("td-buddy-no",JSON.stringify([...no])); b.closest(".wb-row").remove(); });
}
function openFromWallet(el){
  if(fly) return;
  const w=inWallet(el.dataset.id), s=spotById(w.id), r=el.getBoundingClientRect();
  cur={s,meta:{date:w.date,serial:w.serial,rating:w.rating},again:true};
  $("overlay").classList.add("on"); buzz(8); openSheet(true, true);
}
$("overlay").addEventListener("click",()=>{ if(fly) closeReveal(); });

/* ---------- destination picker (for fortune tasks) ---------- */
let pickCb=null;
function pickDest(current,cb){
  pickCb=cb; let pk=CITY[current].k, pc=current; const sh=$("sheet");
  const draw=()=>{
    sh.style.setProperty("--c",CITY[pc].color);
    sh.innerHTML=`<h3 style="margin-top:0">今天要去哪儿？</h3><div class="sh-meta" style="margin-top:-6px">换了目的地，任务和印章都会跟着变成当地的</div>
      <div class="pick-row">${Object.entries(COUNTRY).map(([k,c])=>`<button class="chip sm${k===pk?" on":""}" data-k="${k}" style="--c:${CITY[Object.keys(CITY).find(x=>CITY[x].k===k)].color}">${c.flag} ${c.name}</button>`).join("")}</div>
      <div class="pick-row">${Object.entries(CITY).filter(([,c])=>c.k===pk).map(([ck,c])=>`<button class="chip sm${ck===pc?" on":""}" data-c="${ck}" style="--c:${c.color}">${c.name}</button>`).join("")}</div>
      <div class="sh-btns" style="margin-top:14px"><button class="btn" id="pkCancel">取消</button><button class="btn solid" id="pkOk">去${CITY[pc].name}</button></div>`;
    sh.querySelectorAll("[data-k]").forEach(b=>b.onclick=()=>{ pk=b.dataset.k; pc=Object.keys(CITY).find(x=>CITY[x].k===pk); draw(); });
    sh.querySelectorAll("[data-c]").forEach(b=>b.onclick=()=>{ pc=b.dataset.c; draw(); });
    $("pkCancel").onclick=closePick; $("pkOk").onclick=()=>{ const f=pickCb; closePick(); f&&f(pc); };
  };
  draw(); $("overlay").classList.add("on"); requestAnimationFrame(()=>sh.classList.add("on"));
}
function closePick(){ pickCb=null; $("sheet").classList.remove("on"); $("overlay").classList.remove("on"); }
$("overlay").addEventListener("click",()=>{ if(pickCb) closePick(); });
export { pickDest };

/* ---------- init ---------- */
/* food tickets: every local dish in this trip's cities (plus the ones you add yourself) */
const dishKey=n=>String(n||"").replace(/\s|·|・/g,"").toLowerCase();
function injectFoods(){
  Object.keys(COUNTRY).forEach(k=>delete COUNTRY[k]); Object.keys(CITY).forEach(k=>delete CITY[k]); SPOTS.length=0;
  COUNTRY.food={name:"美食",en:"Food",flag:""};
  const names=[...tripCityNames()];
  (customs||[]).filter(c=>c.kind==="food"&&!names.includes(c.city)).forEach(c=>{ if(!names.includes(c.city)) names.push(c.city); });
  if(!names.length) GUIDES.slice(0,2).forEach(g=>names.push(g.name));
  names.forEach(n=>{ const g=guideFor(n), ck="f-"+n; CITY[ck]={k:"food",name:n,en:g?g.en:n,color:g?g.color:"#7a5a2c"};
    (g?g.foods:[]).forEach(f=>SPOTS.push({id:`food:${n}:${f.n}`,c:ck,name:f.n,en:f.e||"",tag:"美食",icon:"bowl",o:f.o,mean:f.d,fact:(f.d||"")+(f.where?`　📍 推荐：${f.where}`:""),where:f.where,lat:0,lng:0}));
    (customs||[]).filter(c=>c.kind==="food"&&c.city===n).forEach(c=>{ const dup=SPOTS.find(x=>x.c===ck&&dishKey(x.name)===dishKey(c.name));
      if(dup){ if(dup.tag==="自己加的"){ dup.cids.push(c.id); if(!dup.fact&&c.note){ dup.mean=dup.fact=c.note; } } return; }
      SPOTS.push({id:`food:${n}:${c.name}`,c:ck,name:c.name,en:"",tag:"自己加的",icon:"bowl",mean:c.note||"你们自己发现的好吃的。",fact:c.note||"",lat:0,lng:0,cids:[c.id]}); });
  });
  return true;
}
function todayCityKey(){ const n=cityOf(todayFn()); return CITY["f-"+n]?"f-"+n:Object.keys(CITY)[0]; }
on("trip",()=>{ injectFoods(); renderCountries(); setCountry("food",true); setCity(todayCityKey()); loadWallet(); });
on("custom_items",()=>{ const c=city; injectFoods(); setCountry("food",true); setCity(CITY[c]?c:todayCityKey()); });
export function initTickets(){ injectFoods(); renderCountries(); setCountry("food",true); setCity(todayCityKey()); updateBadge(); renderWallet(); loadWallet(); }
export function refreshTripTickets(){ injectFoods(); renderCountries(); setCountry("food",true); setCity(todayCityKey()); renderWallet(); }
addEventListener("resize",()=>{ if(!busy) layoutTape(); });

function openAddFood(){
  const cn=CITY[city]?CITY[city].name:"";
  const sh=openUSheet(`<div class="as"><small class="as-k">ADD A DISH</small><h3>吃到了别的？</h3><p class="as-hint" style="margin-top:0">写下来就能撕它的票。加在「${cn}」，同一个旅行房间的人也看得到这道菜。</p>
    <label class="lbl">菜名<input class="inp" id="afName" maxlength="24" placeholder="比如：巷口那家的鱼丸汤" autofocus></label>
    <label class="lbl">一句话（可选）<input class="inp" id="afNote" maxlength="60" placeholder="在哪吃的、什么味道"></label>
    <div class="as-btns"><button class="btn ink full" data-act="save">加上，去撕票</button></div></div>`,{accent:"#3a2c1f"});
  bindU(sh,{save:async()=>{ const n=$("afName").value.trim(); if(!n) return toastU("写上菜名");
    const had=SPOTS.find(x=>x.c===city&&dishKey(x.name)===dishKey(n)); if(had){ closeUSheet(); toastU(`「${had.name}」已经有了，不用再加`); setTimeout(()=>setSpot(had.id),350); return; }
    try{ await api.addCustom({city:cn,kind:"food",name:n,note:$("afNote").value.trim()||null}); closeUSheet(); setTimeout(()=>{ const id=`food:${cn}:${n}`; if(spotById(id)) setSpot(id); },400); sfx.stamp(); }catch(e){ toastU("没能保存"); } }});
}

/* shared food photos: anyone can add, everyone sees them in their book */
export async function foodPhotosInto(el, food, city){ if(!el) return; let L=[]; try{ L=(await api.foodPhotos()).filter(p=>p.food===food); }catch(e){}
  el.innerHTML=L.length?L.map(p=>`<figure><div class="shp-ph" data-fp="${p.photo_path.replace(/"/g,"&quot;")}"></div><figcaption>${nameOf(p.user_id)}</figcaption></figure>`).join(""):`<p class="shp-empty">还没有人拍。第一个拍的人，照片会出现在每个人的手帐里。</p>`;
  for(const d of el.querySelectorAll("[data-fp]")){ const u=d.dataset.fp.startsWith("data:")?d.dataset.fp:await api.sharedUrl(d.dataset.fp); if(u&&d.isConnected){ d.style.backgroundImage=`url("${u}")`; d.onclick=()=>bigPhoto(u, d.closest("figure").querySelector("figcaption").textContent); } } }
function bigPhoto(u, who){ const v=document.createElement("div"); v.className="shp-view"; v.style.zIndex=140; v.innerHTML=`<img src="${u}" alt=""><div class="shp-bar"><span>${esc(who||"")}</span><div><button data-a="x">关闭</button></div></div>`; document.body.appendChild(v); const x=()=>v.remove(); v.querySelector("[data-a=x]").onclick=x; v.querySelector("img").onclick=x; }

/* the whole wallet as one picture: a sheet of stubs on washi */
async function exportWallet(items){
  const { toPng } = await import("html-to-image"); toastU("正在生成…");
  const sheet=document.createElement("div"); sheet.className="wl-sheet"; sheet.innerHTML=`<div class="wl-sheet-h"><b>美食票</b><small>${api.trip?api.trip.name:""} · ${items.length} 张</small></div><div class="wl-sheet-g">${items.map(w=>{const s=spotById(w.id); const c=CITY[s.c]||{}; return `<div class="wl-stub"><div class="wl-stub-a">${foodArt(s.name)}</div><b>${s.name}</b><small>${c.name||""} · ${w.date||""}${w.rating==="love"?" · ♥":""}</small><i>No.${String(w.serial||"").padStart(3,"0")}</i></div>`;}).join("")}</div><div class="wl-sheet-f">TRIP DECK · FOOD TICKETS</div>`;
  document.body.appendChild(sheet);
  try{ const raw=await toPng(sheet,{pixelRatio:3,cacheBust:true,backgroundColor:"#f6f1e8"}); const blob=await (await fetch(raw)).blob(), f=new File([blob],"food-tickets.png",{type:"image/png"}); if(navigator.canShare&&navigator.canShare({files:[f]})) await navigator.share({files:[f]}); else { const a=document.createElement("a"); a.href=raw; a.download=f.name; a.click(); } }catch(e){ toastU("没能生成："+e.message); } finally{ sheet.remove(); }
}
export const walletItems=()=>wallet.filter(w=>spotById(w.id)).map(w=>({...w, name:spotById(w.id).name, city:(CITY[spotById(w.id).c]||{}).name}));

api && import("../lib/api.js").then(m=>m.on("food_photos",()=>loadFoodPhotoUrls().then(()=>{ try{ renderSpots(); if(document.querySelector("#wList")) renderWallet(); }catch(e){} })));
