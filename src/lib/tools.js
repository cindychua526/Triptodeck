/* 旅途工具箱: the practical things you reach for on the street.
   给司机看 · 一键导航 · 汇率计算 · 当地话小卡 · 紧急信息 */
import { api } from "./api.js";
import { openSheet, closeSheet, bind, toast } from "./ui.js";
import { esc, today, toMin } from "./util.js";
import { t as T, lang } from "./i18n.js";
import { sfx } from "./sound.js";
import { CURS, BASE, rateToBase, homeCur, LOCAL_BY_CC } from "./money.js";
import { guideFor } from "../data/guides.js";
import { STAYS } from "../data/fujian.js";

const trip = () => import("../pages/trip.js");
const mapMod = () => import("../pages/map.js");
const ccOf = city => { const g = guideFor(city); return (g && ((g.w && g.w.cc) || g.cc)) || "CN"; };

/* ---------- 一键导航 ---------- */
export async function navLinks(name, city, a) {
  const M = await mapMod(); const ll = a ? M.coordOf(a) : null, q = encodeURIComponent(name), c = encodeURIComponent(city || "");
  const gc = ll ? M.toGcj(ll[0], ll[1]) : null;
  return {
    amap: gc ? `https://uri.amap.com/marker?position=${gc[1]},${gc[0]}&name=${q}&coordinate=gaode&callnative=1` : `https://uri.amap.com/search?keyword=${q}&city=${c}&callnative=1`,
    google: ll ? `https://www.google.com/maps/search/?api=1&query=${ll[0]},${ll[1]}` : `https://www.google.com/maps/search/?api=1&query=${q}+${c}`,
    apple: ll ? `https://maps.apple.com/?q=${q}&ll=${ll[0]},${ll[1]}` : `https://maps.apple.com/?q=${q}+${c}`
  };
}
export const navHTML = (L, cc) => `<div class="nav-row">${cc === "CN" ? `<a class="btn sm" href="${L.amap}" target="_blank" rel="noopener">${T("高德导航", "Amap")}</a>` : ""}<a class="btn sm" href="${L.google}" target="_blank" rel="noopener">${T("Google 地图", "Google Maps")}</a><a class="btn sm" href="${L.apple}" target="_blank" rel="noopener">${T("Apple 地图", "Apple Maps")}</a>${cc !== "CN" ? `<a class="btn sm" href="${L.amap}" target="_blank" rel="noopener">高德</a>` : ""}</div>`;

/* ---------- 给司机看 ---------- */
async function whereToday() {
  const TR = await trip(), d = today(), days = TR.tripDays(), day = days.includes(d) ? d : days[0];
  const list = TR.dayActs(day).filter(a => a.status !== "removed" && a.status !== "skipped");
  const now = new Date().getHours() * 60 + new Date().getMinutes();
  const next = list.find(a => a.kind !== "transit" && toMin(a.time) + (a.dur || 60) > now) || list.find(a => a.kind !== "transit");
  const fj = api.trip && api.trip.template === "fujian" ? STAYS.find(s => day >= s.in && day < s.out) : null;
  const lodge = fj ? { title: fj.name, city: fj.city, note: fj.note } : (() => { for (let i = days.indexOf(day); i >= 0; i--) { const L = TR.dayActs(days[i]).filter(a => a.kind === "lodging"); if (L.length) return L[L.length - 1]; } return null; })();
  return { day, next, lodge, city: TR.cityOf(day) };
}
export async function openTaxiCard(target) {
  const W = await whereToday(); const opts = [];
  if (target) opts.push({ k: "t", label: target.title, city: target.city || W.city, a: target, note: target.note });
  if (W.next && (!target || W.next.id !== target.id)) opts.push({ k: "n", label: W.next.title, city: W.next.city || W.city, a: W.next, sub: T(`下一站 · ${W.next.time}`, `Next · ${W.next.time}`) });
  if (W.lodge) opts.push({ k: "h", label: W.lodge.title, city: W.lodge.city || W.city, a: W.lodge.id ? W.lodge : null, sub: T("回酒店", "Back to the hotel"), note: W.lodge.note });
  if (!opts.length) return toast(T("今天还没有地点，先在行程里加一个", "Add a place to today's plan first"));
  let i = 0;
  const draw = async () => { const o = opts[i], L = await navLinks(o.label, o.city, o.a), cc = ccOf(o.city);
    const sh = openSheet(`<div class="as taxi"><small class="as-k">${T("给司机看 · 把手机转过去", "SHOW THE DRIVER")}</small>
      ${opts.length > 1 ? `<div class="seg taxi-seg">${opts.map((x, k) => `<button class="${k === i ? "on" : ""}" data-k="${k}">${esc(x.sub || T("这里", "Here"))}</button>`).join("")}</div>` : ""}
      <div class="taxi-card"><p class="taxi-ask">${cc === "CN" || cc === "TW" || cc === "HK" ? "师傅您好，请带我去：" : cc === "MY" ? "Tolong hantar saya ke:" : cc === "TH" ? "กรุณาพาไปที่:" : cc === "JP" ? "ここまでお願いします：" : cc === "KR" ? "여기로 가주세요:" : "Please take me to:"}</p>
        <b class="taxi-name">${esc(o.label.replace(/（.*?）/g, m => m.length > 12 ? "" : m))}</b><p class="taxi-city">${esc(o.city || "")}${o.note ? " · " + esc(o.note) : ""}</p><p class="taxi-thx">${cc === "CN" ? "谢谢！" : ""}</p></div>
      ${navHTML(L, cc)}
      <div class="as-btns"><button class="btn full" data-act="copy">${T("复制地名（贴到打车 App）", "Copy the name")}</button><button class="btn ink full" data-act="close">${T("好了", "Done")}</button></div></div>`);
    sh.querySelectorAll("[data-k]").forEach(b => b.onclick = () => { i = +b.dataset.k; sfx.tap(); draw(); });
    bind(sh, { close: closeSheet, copy: async () => { try { await navigator.clipboard.writeText(`${o.label} ${o.city || ""}`.trim()); toast(T("已复制，可以贴到滴滴 / Grab", "Copied")); } catch (e) { toast(o.label); } } });
  };
  draw();
}

/* ---------- 汇率计算 ---------- */
export async function openCalc() {
  const cfg = api.membership, TR = await trip(), local = LOCAL_BY_CC[ccOf(TR.cityOf(today()))] || "CNY", home = homeCur(cfg);
  let from = local === home ? BASE : local, to = home === from ? (from === BASE ? "CNY" : BASE) : home, v = "";
  const conv = () => { const n = parseFloat(v) || 0; return n * rateToBase(from, cfg) / rateToBase(to, cfg); };
  const fmtN = (n, c) => (["KRW", "JPY", "VND", "IDR"].includes(c) ? Math.round(n).toLocaleString() : n.toLocaleString(undefined, { maximumFractionDigits: 2 }));
  const sh = openSheet(`<div class="as calc"><small class="as-k">${T("汇率计算", "CONVERTER")}</small><h3>${T("这个多少钱？", "How much is that?")}</h3>
    <div class="calc-box"><div class="calc-row"><select class="inp" id="cFrom">${Object.keys(CURS).map(k => `<option value="${k}"${k === from ? " selected" : ""}>${CURS[k].sym} ${CURS[k].name}</option>`).join("")}</select><b id="cIn">0</b></div>
      <button class="calc-swap" id="cSwap" aria-label="${T("对调", "Swap")}">⇅</button>
      <div class="calc-row out"><select class="inp" id="cTo">${Object.keys(CURS).map(k => `<option value="${k}"${k === to ? " selected" : ""}>${CURS[k].sym} ${CURS[k].name}</option>`).join("")}</select><b id="cOut">0</b></div></div>
    <div class="calc-keys">${["7", "8", "9", "4", "5", "6", "1", "2", "3", ".", "0", "⌫"].map(k => `<button data-key="${k}">${k}</button>`).join("")}</div>
    <p class="as-hint" id="cRate"></p>
    <div class="as-btns"><div class="row"><button class="btn" data-act="log">${T("记进账本", "Add to ledger")}</button><button class="btn ink" data-act="close">${T("好了", "Done")}</button></div></div></div>`);
  const paint = () => { sh.querySelector("#cIn").textContent = (v || "0"); sh.querySelector("#cOut").textContent = CURS[to].sym + " " + fmtN(conv(), to);
    sh.querySelector("#cRate").textContent = `1 ${CURS[from].sym} ≈ ${fmtN(rateToBase(from, cfg) / rateToBase(to, cfg), to === "KRW" || to === "VND" || to === "IDR" || to === "JPY" ? "USD" : to)} ${CURS[to].sym} · ${T("汇率可以在账本设置里改", "set rates in the ledger settings")}`; };
  sh.querySelectorAll("[data-key]").forEach(b => b.onclick = () => { const k = b.dataset.key; sfx.tap();
    if (k === "⌫") v = v.slice(0, -1); else if (k === "." && v.includes(".")) return; else if (v.length < 10) v = (v === "0" && k !== "." ? "" : v) + k; paint(); });
  sh.querySelector("#cFrom").onchange = e => { from = e.target.value; paint(); }; sh.querySelector("#cTo").onchange = e => { to = e.target.value; paint(); };
  sh.querySelector("#cSwap").onclick = () => { [from, to] = [to, from]; sh.querySelector("#cFrom").value = from; sh.querySelector("#cTo").value = to; sfx.flip ? sfx.flip() : sfx.tap(); paint(); };
  bind(sh, { close: closeSheet, log: async () => { const n = parseFloat(v); if (!n) return toast(T("先输入金额", "Type an amount first")); closeSheet(); const B = await import("../pages/budget.js"); setTimeout(() => B.openAdd({ date: today(), amount: n, currency: from }), 250); } });
  paint();
}

/* ---------- 当地话小卡 ---------- */
const PHRASES = {
  CN: { lang: "zh-CN", name: "普通话", rows: [["谢谢", "xiè xie"], ["多少钱？", "duō shao qián?"], ["太贵了，便宜一点", "tài guì le, pián yi yì diǎn"], ["不要辣", "bú yào là"], ["好吃！", "hǎo chī!"], ["洗手间在哪里？", "xǐ shǒu jiān zài nǎ lǐ?"], ["可以用支付宝吗？", "kě yǐ yòng zhī fù bǎo ma?"], ["我要这个", "wǒ yào zhè ge"], ["帮我们拍张照好吗？", "bāng wǒ men pāi zhāng zhào hǎo ma?"], ["买单", "mǎi dān"]] },
  MY: { lang: "ms-MY", name: "Bahasa Melayu", rows: [["Terima kasih", "谢谢"], ["Berapa harga?", "多少钱？"], ["Tak nak pedas", "不要辣"], ["Sedap!", "好吃！"], ["Tandas di mana?", "洗手间在哪？"], ["Saya nak ini", "我要这个"], ["Kira", "买单"]] },
  SG: { lang: "en-SG", name: "English", rows: [["Thank you", "谢谢"], ["How much?", "多少钱？"], ["Less spicy, please", "少辣"], ["Very nice!", "好吃！"], ["Where's the toilet?", "洗手间在哪？"]] },
  TH: { lang: "th-TH", name: "ภาษาไทย", rows: [["ขอบคุณค่ะ / ครับ", "khop khun ka / khrap · 谢谢"], ["เท่าไหร่?", "tao rai? · 多少钱"], ["ไม่เผ็ด", "mai phet · 不要辣"], ["อร่อย!", "a-roi! · 好吃"], ["ห้องน้ำอยู่ที่ไหน?", "hong nam yoo tee nai? · 洗手间在哪"], ["เช็คบิล", "check bin · 买单"]] },
  JP: { lang: "ja-JP", name: "日本語", rows: [["ありがとうございます", "arigatou gozaimasu · 谢谢"], ["いくらですか？", "ikura desu ka? · 多少钱"], ["これをください", "kore o kudasai · 我要这个"], ["おいしい！", "oishii! · 好吃"], ["トイレはどこですか？", "toire wa doko desu ka? · 洗手间"], ["お会計お願いします", "okaikei onegaishimasu · 买单"]] },
  KR: { lang: "ko-KR", name: "한국어", rows: [["감사합니다", "gamsahamnida · 谢谢"], ["얼마예요?", "eolmayeyo? · 多少钱"], ["이거 주세요", "igeo juseyo · 我要这个"], ["맛있어요!", "masisseoyo! · 好吃"], ["화장실 어디예요?", "hwajangsil eodiyeyo? · 洗手间"], ["안 맵게 해 주세요", "an maepge hae juseyo · 不要辣"]] },
  VN: { lang: "vi-VN", name: "Tiếng Việt", rows: [["Cảm ơn", "谢谢"], ["Bao nhiêu tiền?", "多少钱？"], ["Không cay", "不要辣"], ["Ngon quá!", "好吃！"], ["Nhà vệ sinh ở đâu?", "洗手间在哪？"], ["Tính tiền", "买单"]] }
};
/* English mode: what each line means */
const MEAN = { "谢谢": "Thank you", "多少钱？": "How much?", "多少钱": "How much?", "太贵了，便宜一点": "Too pricey — a bit cheaper?", "不要辣": "Not spicy, please", "好吃！": "Delicious!", "好吃": "Delicious!",
  "洗手间在哪里？": "Where's the toilet?", "洗手间在哪？": "Where's the toilet?", "洗手间在哪": "Where's the toilet?", "洗手间": "Toilet", "可以用支付宝吗？": "Can I pay with Alipay?", "我要这个": "I'll have this one",
  "帮我们拍张照好吗？": "Could you take a photo of us?", "买单": "The bill, please", "少辣": "Less spicy, please", "喝茶（请喝茶）": "Have some tea", "很好吃": "Really tasty", "吃饱了吗（打招呼）": "Eaten yet? (a hello)" };
const gloss = (a, b) => lang !== "en" ? b : /[\u3400-\u9fff]/.test(b) ? b.split(" · ").map(p => MEAN[p] || p).join(" · ") : MEAN[a] ? `${b} · ${MEAN[a]}` : b;
/* dialect on top of Mandarin: written as it sounds (no phone can read these out, so they're shown for you to say) */
const DIALECT = {
  chaoshan: { name: "潮汕话", rows: [["多谢", "to-sia · 谢谢"], ["好食！", "ho-tsiah · 好吃"], ["几多钱？", "gui-to-tsi? · 多少钱"], ["食茶", "tsiah-deh · 喝茶（请喝茶）"], ["勿爱辣", "mai-ai-luah · 不要辣"]] },
  minnan: { name: "闽南话", rows: [["多谢", "to-siā · 谢谢"], ["真好食！", "tsin hó-tsia̍h · 很好吃"], ["偌济钱？", "guā-tsē tsînn? · 多少钱"], ["无爱薟", "bô ài hiam · 不要辣"], ["呷饱未？", "tsia̍h-pá buē? · 吃饱了吗（打招呼）"]] }
};
const dialectOf = city => /潮|汕|揭阳|cs2/.test(city || "") ? "chaoshan" : /厦门|泉州|漳州|闽|台/.test(city || "") ? "minnan" : null;
const say = (text, lang) => { try { const u = new SpeechSynthesisUtterance(text); u.lang = lang; u.rate = .85; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) { toast(T("这台手机不能朗读", "Speech isn't available")); } };
export async function openPhrases() {
  const TR = await trip(), city = TR.cityOf(today()), cc = ccOf(city), P = PHRASES[cc] || PHRASES.CN, D = cc === "CN" || cc === "TW" ? DIALECT[dialectOf(city)] : null;
  const sh = openSheet(`<div class="as phr"><small class="as-k">${T("当地话小卡", "PHRASES")} · ${esc(city || "")}</small><h3>${esc(lang === "en" && P.name === "普通话" ? "Mandarin 普通话" : P.name)}</h3>
    <p class="as-hint">${T("点一句，手机会念出来。", "Tap a line to hear it.")}</p>
    <div class="phr-l" data-noi18n>${P.rows.map(([a, b], i) => `<button class="phr-r" data-say="${i}"><b>${esc(a)}</b><small>${esc(gloss(a, b))}</small><i>🔊</i></button>`).join("")}</div>
    ${D ? `<h4 class="phr-h">${esc(lang === "en" ? ({ 潮汕话: "Teochew 潮汕话", 闽南话: "Hokkien 闽南话" })[D.name] || D.name : D.name)} · ${T("说给老板听，他会笑", "say it, they'll smile")}</h4><div class="phr-l" data-noi18n>${D.rows.map(([a, b]) => `<div class="phr-r dia"><b>${esc(a)}</b><small>${esc(gloss(a, b))}</small></div>`).join("")}</div><p class="as-hint">${T("方言没有朗读，照着拼音念就好。", "Dialects can't be read aloud — follow the sounds.")}</p>` : ""}
    <div class="as-btns"><button class="btn ink full" data-act="close">${T("好了", "Done")}</button></div></div>`);
  sh.querySelectorAll("[data-say]").forEach(b => b.onclick = () => { const r = P.rows[+b.dataset.say]; say(r[0], P.lang); b.classList.add("on"); setTimeout(() => b.classList.remove("on"), 900); });
  bind(sh, { close: closeSheet });
}

/* ---------- 紧急信息 ---------- */
const SOS = { CN: [["报警", "110"], ["急救", "120"], ["火警", "119"], ["交通事故", "122"]], MY: [["报警 / 急救", "999"], ["火警", "994"]], SG: [["报警", "999"], ["急救 / 火警", "995"]],
  TH: [["报警", "191"], ["急救", "1669"], ["旅游警察", "1155"]], JP: [["报警", "110"], ["急救 / 火警", "119"]], KR: [["报警", "112"], ["急救 / 火警", "119"]], VN: [["报警", "113"], ["急救", "115"], ["火警", "114"]],
  TW: [["报警", "110"], ["急救 / 火警", "119"]], HK: [["报警 / 急救", "999"]], MO: [["报警 / 急救", "999"]], ID: [["报警", "110"], ["急救", "118"]], NZ: [["报警 / 急救", "111"]] };
const EKEY = "td-sos";
const sosGet = () => { try { return JSON.parse(localStorage.getItem(EKEY) || "{}"); } catch (e) { return {}; } };
export async function openEmergency() {
  const TR = await trip(), city = TR.cityOf(today()), cc = ccOf(city), nums = SOS[cc] || SOS.CN, S = sosGet();
  const W = await whereToday();
  const field = (k, label, ph) => `<label class="lbl">${label}<input class="inp" data-sos="${k}" value="${esc(S[k] || "")}" placeholder="${ph}"></label>`;
  const sh = openSheet(`<div class="as sos"><small class="as-k">${T("紧急信息 · 没网也能看", "EMERGENCY · works offline")}</small><h3>${esc(city || "")}</h3>
    <div class="sos-nums">${nums.map(([n, v]) => `<a class="sos-n" href="tel:${v}"><b>${v}</b><small>${esc(T(n, n.replace("报警", "Police").replace("急救", "Ambulance").replace("火警", "Fire").replace("交通事故", "Traffic accident").replace("海上救援", "Sea rescue")))}</small></a>`).join("")}</div>
    ${W.lodge ? `<div class="sos-card"><small>${T("今晚住", "Tonight")}</small><b>${esc(W.lodge.title)}</b>${W.lodge.note ? `<p>${esc(W.lodge.note)}</p>` : ""}</div>` : ""}
    <div class="lbl" style="margin-top:12px">${T("自己的资料（只存在这台手机）", "Your details (this phone only)")}</div>
    ${field("name", T("姓名 / 护照号", "Name / passport no."), T("例如：CINDY CHUA · A12345678", "e.g. passport number"))}
    ${field("blood", T("血型 / 过敏 / 常用药", "Blood type / allergies / meds"), T("例如：O 型，对青霉素过敏", "e.g. O+, allergic to penicillin"))}
    ${field("ins", T("旅行保险 · 保单号和热线", "Travel insurance · policy & hotline"), T("保单号 + 24 小时热线", "policy no. + 24h hotline"))}
    ${field("emb", T("大使馆 / 领事馆电话", "Embassy / consulate"), T("出发前查好填进来", "look it up before you go"))}
    ${field("c1", T("紧急联系人 1", "Emergency contact 1"), T("名字 · 电话", "name · phone"))}
    ${field("c2", T("紧急联系人 2", "Emergency contact 2"), T("名字 · 电话", "name · phone"))}
    <div class="as-btns"><button class="btn ink full" data-act="close">${T("保存", "Save")}</button></div></div>`);
  const save = () => { const o = {}; sh.querySelectorAll("[data-sos]").forEach(i => o[i.dataset.sos] = i.value.trim()); try { localStorage.setItem(EKEY, JSON.stringify(o)); } catch (e) {} };
  let dirty = false; sh.querySelectorAll("[data-sos]").forEach(i => i.oninput = () => { dirty = true; save(); });
  bind(sh, { close: () => { save(); closeSheet(); if (dirty) toast(T("存好了", "Saved")); } });
}

/* ---------- the toolbox strip (Today page) ---------- */
export const TOOLS = [["taxi", "🚕", "给司机看", "Taxi card"], ["calc", "¥", "汇率", "Converter"], ["phr", "话", "当地话", "Phrases"], ["sos", "✚", "紧急", "SOS"]];
export function toolsHTML() { return `<div class="tbx"><small>${T("旅途工具箱", "TOOLBOX")}</small><div class="tbx-row">${TOOLS.map(([k, i, zh, en]) => `<button class="tbx-b" data-tool="${k}"><i>${i}</i><span>${T(zh, en)}</span></button>`).join("")}</div></div>`; }
export function wireTools(root) { root.querySelectorAll("[data-tool]").forEach(b => b.onclick = () => { sfx.tap(); ({ taxi: () => openTaxiCard(), calc: openCalc, phr: openPhrases, sos: openEmergency })[b.dataset.tool](); }); }
