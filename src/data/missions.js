/* Check-in missions: place-specific first, then playful templates. */
import { GUIDE, CITY_FOODS } from "./fujian.js";
import { seeded, hash } from "../lib/util.js";

export const PLACE_MISSIONS = {
  "鼓浪屿": ["找到一架钢琴或任何乐器，假装你在开演奏会", "拍下一栋老洋楼最好看的一扇窗", "在巷子里拍一张「回眸」照，像电影海报"],
  "日光岩": ["站在高处，把整座鼓浪屿装进一张照片", "拍一张「征服日光岩」的胜利姿势"],
  "菽庄花园": ["在海上的桥廊拍一张「走在海面上」的照片"],
  "最美转角": ["在最美转角拍一张街角回眸照"],
  "龙头路小吃街": ["一张照片里同时出现三种不同的小吃"],
  "第八市场 · 早餐": ["拍一张「被海鲜包围」的照片", "找到今天看到最奇怪的一样海鲜，和它合影"],
  "中山路步行街": ["在骑楼下拍一张长长的透视照", "拍下一块你最喜欢的老招牌"],
  "南普陀寺": ["拍下屋檐上的一个小雕饰", "找到一只在寺里散步的鸽子或猫"],
  "沙坡尾": ["找一面涂鸦墙，模仿墙上的姿势", "拍下避风坞里的一艘小船"],
  "曾厝垵": ["拍一张「被小吃包围」的照片", "在一家文艺小店门口找一句喜欢的话，和它合影"],
  "集美学村": ["把嘉庚建筑的红屋顶和你拍在一起", "在龙舟池边拍一张倒影照"],
  "海上地铁（高崎站 → 集美学村站）": ["隔着车窗拍下大海和天空"],
  "音乐广场": ["对着大海唱一句歌，让旅伴拍下这一刻"],
  "泉州西街": ["在骑楼下拍一张剪影", "找到能望见开元寺塔的角度拍一张"],
  "泉州开元寺": ["用手指比一个框，把东塔或西塔框进去", "和寺里的一棵老树合影"],
  "泉州钟楼": ["拍一张钟楼和车流同框的照片"],
  "清源山": ["模仿老君岩的坐姿（摸胡子加分）"],
  "金鱼巷": ["拍下巷子里的一个角落，像电影截图"],
  "阳光夜市": ["拍下你手里拿满小吃的那一刻"],
  "晋江五店市": ["在红砖古厝前拍一张「民国风」照片"],
  "晋江梧林传统村落": ["找到一栋番仔楼，拍它最好看的角度"],
  "黄金海岸": ["在沙滩上写下今天的日期再拍下来", "拍一张海浪冲过脚边的瞬间"],
  "红塔湾": ["和红塔拍一张「我把塔举起来」的错位照"],
  "海上洛伽寺": ["拍下海上的寺庙和天空"],
  "天后宫": ["安静地拍一张屋脊上的剪瓷雕"],
  "永宁古城": ["找一扇老门，站在门里拍一张"],
  "杏林村夜市": ["和旅伴举起手里的小吃「干杯」"]
};
const FOOD_T = [
  "点一份「{f}」，拍下你吃第一口的表情", "让「{f}」和你一起比耶合影", "拍一张「{f}」和店家招牌同框的照片",
  "拍下「{f}」冒热气的瞬间", "和旅伴举起「{f}」干杯", "用「{f}」摆一个笑脸再拍"
];
const PLACE_T = [
  "在「{p}」拍一张像明信片的风景照（画面里不许有人）", "在「{p}」找到一只猫或狗，和它同框", "在「{p}」找一个和你衣服同色的东西合影",
  "在「{p}」用影子拍一张照片", "在「{p}」拍一张全员跳起来的照片", "在「{p}」假装是杂志封面拍一张",
  "在「{p}」拍下一个只有这里才有的小细节", "在「{p}」拍一张有年代感的照片", "在「{p}」拍一张「偷拍感」的侧脸照"
];
const short = n => n.replace(/（.*?）|\(.*?\)/g, "").replace(/ · .*/, "").trim();
export const isFoodPlace = (name, kind) => kind === "food" || /夜市|小吃|市场|美食|早餐|午餐|晚餐|厝垵|步行街/.test(name);
export function foodsFor(name, city, parent) { const g = GUIDE[name] || (parent && GUIDE[parent]) || {}; return g.foods || (isFoodPlace(name) ? CITY_FOODS[city] : null) || null; }

/* variant lets several people get different missions for the same place */
export function missionList(name, city, seed, parent, kind) {
  const r = seeded(`${seed}|${name}`);
  const sp = PLACE_MISSIONS[name] || [];
  const foods = foodsFor(name, city, parent);
  const rest = [];
  if (foods) FOOD_T.forEach((t, i) => rest.push({ type: "food", text: t.replace("{f}", foods[(i + Math.floor(r() * foods.length)) % foods.length]) }));
  if (!isFoodPlace(name, kind) || !foods) PLACE_T.forEach(t => rest.push({ type: "pose", text: t.replace("{p}", short(name)) }));
  for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
  return [...sp.map(t => ({ type: "place", text: t.includes("「") ? t : `在「${short(name)}」${t}` })), ...rest];
}
export function missionFor(name, city, seed, variant = 0, parent, kind) { const l = missionList(name, city, seed, parent, kind); return l[variant % l.length]; }
import { ic } from "../lib/icons.js";
export const missionIcon = t => t === "food" ? ic("bowl-food") + " 美食任务" : t === "place" ? ic("sparkle") + " 限定任务" : ic("camera") + " 拍照任务";
export { hash };
