/* Mythic figures in gold line-art (viewBox 0 0 120 150). Every stroke carries pathLength=1
   so the reveal can "draw" the figure in gold; .m-* parts are animated in CSS. */
const G = "var(--gold)";
const stars = (pts) => `<g class="m-stars" fill="${G}">${pts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join("")}</g>`;
const cloud = (x, y, s = 1, cls = "m-cloud") => `<g class="${cls}" transform="translate(${x} ${y}) scale(${s})"><path d="M0 0c3-6 10-6 12-1c2-5 9-5 11 0c4-1 7 2 6 5H-2c-2-1-1-4 2-4z" fill="rgba(0,0,0,.25)"/><path d="M4 2c0-3 3-4 5-2M14 1c1-3 5-3 6 0" /></g>`;
const face = (x, y, r = 5.5, turn = 0) => `<circle cx="${x}" cy="${y}" r="${r}" fill="var(--bgc)"/><path d="M${x + turn - 1.8} ${y + .6}q1 .7 2 0M${x + turn + 1.6} ${y + .6}q1 .7 2 0" stroke-width=".7"/>`;

export const FIGURES = {
  /* 嫦娥 holding the moon-mirror, ribbons and jade rabbit */
  K: () => `<circle class="m-moon" cx="62" cy="46" r="30" fill="rgba(246,227,166,.10)"/><circle cx="62" cy="46" r="30"/><circle cx="62" cy="46" r="24" stroke-dasharray=".02 .03" stroke-width=".6"/>
    ${stars([[16, 20, .9], [100, 16, 1.2], [104, 92, .8], [14, 74, .7], [90, 30, .6]])}
    <g class="m-fig">
      <path class="m-ribbon" d="M52 72C28 70 22 100 30 120C34 132 26 140 18 146"/><path class="m-ribbon2" d="M68 72C94 68 100 98 92 118C88 128 96 138 104 144"/>
      <path d="M53 70Q60 66 67 70L72 96Q76 120 84 140H36Q44 120 48 96Z" fill="rgba(217,195,138,.08)"/>
      <path d="M60 72L58 140M65 94Q68 118 74 140M54 94Q51 118 46 140M50 100Q60 104 70 100" stroke-width=".7"/>
      <path d="M53 72Q42 82 40 102Q44 110 51 101Q53 88 57 82"/>
      <path d="M67 72Q76 74 79 84"/>
      ${face(60, 62)}<path d="M54 60Q54 50 60 49Q67 50 66 60Q62 54 60 55Q57 54 54 60Z" fill="${G}" stroke="none" opacity=".9"/><circle cx="60" cy="46" r="3.4" fill="${G}" stroke="none"/><path d="M63 45l7-4M58 44l-6-3" stroke-width=".7"/>
      <g class="m-mirror"><circle cx="81" cy="86" r="8.5" fill="rgba(246,227,166,.18)"/><circle cx="81" cy="86" r="6"/><path d="M81 94.5V104M79 104h4M81 104l-2 6M81 104l2 6" stroke-width=".7"/></g>
    </g>
    <g class="m-rabbit"><path d="M22 138q-1-9 2-11M26 138q1-9 4-10"/><ellipse cx="25" cy="141" rx="6" ry="4" fill="rgba(217,195,138,.12)"/><circle cx="28" cy="139.5" r=".6" fill="${G}"/></g>
    ${cloud(70, 140, .9)}${cloud(8, 128, .7, "m-cloud2")}`,

  /* 羲和 raising a hand to stop the sun, a three-legged crow circling */
  Q: () => `<g class="m-rays">${Array.from({ length: 16 }, (_, i) => `<path d="M60 44L60 ${i % 2 ? 10 : 4}" transform="rotate(${i * 22.5} 60 44)" stroke-width="${i % 2 ? .5 : .9}"/>`).join("")}</g>
    <circle class="m-sun" cx="60" cy="44" r="20" fill="rgba(230,194,122,.16)"/><circle cx="60" cy="44" r="20"/><circle cx="60" cy="44" r="15" stroke-width=".6"/>
    ${Array.from({ length: 12 }, (_, i) => `<path d="M60 30.5V32.5" transform="rotate(${i * 30} 60 44)" stroke-width=".8"/>`).join("")}<path d="M60 44V35M60 44l6 3" stroke-width="1"/>
    <g class="m-crow"><path d="M92 26q5-4 10 0q-5-1-6 3q-1-4-4-3z" fill="${G}" stroke="none"/><path d="M96 29l-1 3M97 29v3M98 29l1 3" stroke-width=".5"/></g>
    ${stars([[14, 22, .8], [22, 70, .7], [106, 80, .9]])}
    <g class="m-fig">
      <path class="m-ribbon" d="M50 80C34 84 26 104 30 124C32 132 28 140 22 146"/>
      <path d="M53 78Q60 74 67 78L73 104Q77 124 82 142H38Q43 124 47 104Z" fill="rgba(230,194,122,.08)"/>
      <path d="M60 80V142M66 100Q70 122 74 142M53 100Q50 122 46 142M48 104Q60 110 72 104" stroke-width=".7"/>
      <path class="m-arm" d="M67 80Q78 72 80 60Q81 55 78 54M78 54l2-4M80 55l3-3M81 57l3-1"/>
      <path d="M53 80Q44 92 46 106Q52 108 54 100"/>
      ${face(60, 70)}<path d="M54 68Q55 58 61 58Q67 59 66 68Q63 63 60 64Q57 63 54 68Z" fill="${G}" stroke="none"/><path d="M57 59l3-6 3 6" fill="${G}" stroke="none"/>
    </g>${cloud(76, 140, .9)}${cloud(10, 138, .8, "m-cloud2")}`,

  /* 月老 with the book of fate; the red thread ties two rings together */
  J: () => `<path class="m-crescent" d="M88 14a14 14 0 1 0 12 24a11 11 0 0 1-12-24z" fill="rgba(227,185,140,.18)"/>
    ${stars([[20, 18, .9], [104, 60, .7], [12, 60, .8], [70, 12, .6]])}
    <path class="m-thread" d="M16 104C30 84 40 120 56 100S86 70 104 92" stroke="#e25b4a" stroke-width="1.2"/>
    <circle cx="16" cy="104" r="3.4" stroke="#e25b4a"/><circle cx="104" cy="92" r="3.4" stroke="#e25b4a"/>
    <g class="m-fig">
      <path d="M50 72Q60 66 70 72L76 102Q80 124 84 142H36Q40 124 44 102Z" fill="rgba(227,185,140,.08)"/>
      <path d="M60 74V142M68 100Q72 122 76 142M52 100Q48 122 44 142" stroke-width=".7"/>
      ${face(60, 60, 6)}<path d="M53 60Q53 50 60 49Q67 50 67 60" /><path d="M55 64Q60 84 65 64" fill="rgba(227,185,140,.25)"/><path d="M57 66Q60 80 63 66" stroke-width=".6"/>
      <path d="M53 51Q60 42 67 51" fill="${G}" stroke="none"/>
      <path d="M50 76Q40 86 44 96"/><g class="m-book"><path d="M36 92l12-4 12 4v12l-12-4-12 4z" fill="rgba(227,185,140,.14)"/><path d="M48 88v12M40 96h5M40 99h5M52 96h5" stroke-width=".6"/></g>
      <path d="M70 76Q80 84 84 94"/><path d="M86 60V142" stroke-width="1.1"/><path d="M83 62a3 3 0 1 1 6 0a4 4 0 1 1-6 0z" fill="rgba(227,185,140,.2)"/>
    </g>${cloud(8, 140, .9)}${cloud(78, 138, .8, "m-cloud2")}`,

  /* 妈祖 crowned, lantern held high, calming the waves (the halo = 主角光环) */
  "10": () => `<g class="m-halo"><circle cx="60" cy="44" r="22" fill="rgba(232,201,138,.10)"/><circle cx="60" cy="44" r="22"/>${Array.from({ length: 24 }, (_, i) => `<path d="M60 18V21" transform="rotate(${i * 15} 60 44)" stroke-width=".6"/>`).join("")}</g>
    ${stars([[16, 24, .9], [104, 22, .8], [110, 64, .6], [10, 60, .7]])}
    <g class="m-fig">
      <path d="M52 64Q60 60 68 64L74 94Q78 116 82 128H38Q42 116 46 94Z" fill="rgba(232,201,138,.08)"/>
      <path d="M60 66V128M66 92Q70 112 74 128M54 92Q50 112 46 128M48 96Q60 102 72 96" stroke-width=".7"/>
      ${face(60, 52)}<path d="M53 46h14l-2-5h-10z" fill="${G}" stroke="none"/><path d="M52 46v6M55 46v8M58 46v8M62 46v8M65 46v8M68 46v6" stroke-width=".5"/>
      <path d="M52 66Q42 78 44 94Q50 98 54 90"/>
      <path d="M68 66Q80 60 84 46"/><g class="m-lantern"><path d="M84 46V38"/><path d="M79 30h10l-1 8h-8z" fill="rgba(255,190,110,.35)"/><path d="M80 30l4-4 4 4"/><circle class="m-glow" cx="84" cy="34" r="9" fill="rgba(255,200,120,.18)" stroke="none"/></g>
    </g>
    <g class="m-waves"><path d="M4 132q8-6 16 0t16 0t16 0t16 0t16 0t16 0t16 0"/><path d="M-4 140q8-6 16 0t16 0t16 0t16 0t16 0t16 0t16 0" stroke-width=".7"/><path d="M4 148q8-6 16 0t16 0t16 0t16 0t16 0t16 0t16 0" stroke-width=".5"/></g>
    <g class="m-boat"><path d="M94 124h14l-3 4h-8z" fill="rgba(232,201,138,.2)"/><path d="M100 124V114l6 8" /></g>`,

  /* 哪吒 on spinning wind-fire wheels, sash streaming, through a moon-gate */
  "9": () => `<g class="m-gate"><circle cx="60" cy="68" r="44"/><circle cx="60" cy="68" r="38" stroke-dasharray=".015 .02" stroke-width=".6"/></g>
    ${stars([[12, 18, .8], [108, 24, .9], [104, 120, .6]])}
    <g class="m-speed" stroke-width=".6"><path d="M8 60h18M4 74h22M10 88h14"/></g>
    <g class="m-fig">
      <path class="m-sash" d="M50 70C34 60 24 70 16 62C24 78 36 74 48 80" stroke="#f08a5d" fill="rgba(240,138,93,.15)"/>
      <path class="m-sash2" d="M70 72C88 66 96 78 108 72C98 86 84 80 72 84" stroke="#f08a5d" fill="rgba(240,138,93,.12)"/>
      <path d="M54 66Q60 62 66 66L68 90H52Z" fill="rgba(239,181,122,.1)"/><path d="M53 90L48 108M67 90L72 108"/>
      <path d="M54 68Q46 74 44 84"/><path d="M66 68Q76 64 82 54" /><path d="M82 54l3-8M82 54l6-4" stroke-width=".8"/>
      ${face(60, 56)}<circle cx="54" cy="47" r="3.6" fill="${G}" stroke="none"/><circle cx="66" cy="47" r="3.6" fill="${G}" stroke="none"/><path d="M55 52Q60 48 65 52" />
    </g>
    <g class="m-wheel" style="transform-origin:46px 114px"><circle cx="46" cy="114" r="9"/><circle cx="46" cy="114" r="3"/><path d="M46 105v18M37 114h18M40 108l12 12M52 108l-12 12" stroke-width=".6"/></g>
    <g class="m-wheel" style="transform-origin:74px 114px"><circle cx="74" cy="114" r="9"/><circle cx="74" cy="114" r="3"/><path d="M74 105v18M65 114h18M68 108l12 12M80 108l-12 12" stroke-width=".6"/></g>
    <g class="m-flame" stroke="#f08a5d"><path d="M36 120q-6 6-2 14q2-6 6-6M84 120q6 6 2 14q-2-6-6-6M46 124q-2 8 2 12M74 124q2 8-2 12"/></g>
    ${cloud(20, 140, .9)}${cloud(72, 142, .8, "m-cloud2")}`,

  /* 庄周 asleep beneath a willow while a great butterfly dreams him */
  "8": () => `<path d="M12 8Q40 20 44 60" /><g class="m-willow" stroke-width=".6"><path d="M22 14q-2 16 2 30M30 18q-3 18 1 34M38 26q-2 16 2 32"/></g>
    ${stars([[80, 14, .8], [106, 40, .7], [16, 90, .6]])}
    <g class="m-bfly" style="transform-origin:80px 46px">
      <g class="m-wing-l"><path d="M80 46C68 30 56 34 60 46C56 56 70 60 80 50Z" fill="rgba(216,194,230,.22)"/><path d="M66 42q4 2 8 6" stroke-width=".5"/></g>
      <g class="m-wing-r"><path d="M80 46C92 30 104 34 100 46C104 56 90 60 80 50Z" fill="rgba(216,194,230,.22)"/><path d="M94 42q-4 2-8 6" stroke-width=".5"/></g>
      <path d="M80 42v12M80 42l-3-5M80 42l3-5" stroke-width=".7"/></g>
    <path class="m-dream" d="M58 92C62 80 66 70 76 60" stroke-dasharray=".04 .05" stroke-width=".8"/>
    <g class="m-fig">
      <path d="M18 124Q40 104 70 110Q92 114 104 124Z" fill="rgba(216,194,230,.08)"/>
      <path d="M28 120Q48 110 70 114M40 124Q60 118 90 120" stroke-width=".7"/>
      ${face(44, 106, 6)}<path d="M38 104Q40 96 46 97Q51 98 50 104" fill="${G}" stroke="none"/><path d="M41 108q2 1 4 0" stroke-width=".6"/>
      <path d="M50 112Q58 104 62 96" /><path d="M62 96l4-2" stroke-width=".8"/>
      <text class="m-zz" x="54" y="92" font-size="6" fill="${G}" stroke="none" font-family="Cormorant Garamond,serif">z</text>
    </g>
    <g class="m-mist" stroke-width=".6"><path d="M0 132q15-5 30 0t30 0t30 0t30 0"/><path d="M-10 142q15-5 30 0t30 0t30 0t30 0t30 0"/></g>`,

  /* 后羿: bow drawn, one of nine suns still burning */
  "7": () => `${stars([[14, 20, .8], [100, 18, 1], [108, 70, .7]])}
    <g class="m-suns">${[[22,16],[40,10],[58,8],[76,10],[94,16]].map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="${i===2?6:4}" fill="${i===2?"rgba(224,168,74,.5)":"rgba(224,168,74,.12)"}"/>`).join("")}</g>
    <g class="m-fig"><path d="M52 70Q60 64 68 70L74 104Q78 124 82 142H38Q42 124 46 104Z" fill="rgba(224,168,74,.08)"/>
      ${face(60, 58, 6)}<path d="M53 58Q53 47 60 46Q67 47 67 58"/><path d="M54 49Q60 44 66 49" fill="${G}" stroke="none"/>
      <path d="M28 40Q26 90 30 140" stroke-width="1.2"/><path d="M28 40Q56 70 30 140" stroke-width=".6"/>
      <path d="M50 76L28 90" /><path d="M70 76L56 92" /><path d="M30 90L104 40" stroke="#e0a84a" stroke-width=".9"/><path d="M100 42l6-4-2 7z" fill="#e0a84a" stroke="none"/>
    </g>${cloud(6, 140, .9)}${cloud(82, 138, .8, "m-cloud2")}`,
  /* 雷公: ring of drums, hammer raised, lightning */
  "6": () => `<g class="m-drums">${[[18,40],[100,36],[22,96],[98,96]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="9" fill="rgba(159,184,216,.12)"/><circle cx="${x}" cy="${y}" r="9"/><circle cx="${x}" cy="${y}" r="3"/>`).join("")}</g>
    <path class="m-bolt" d="M74 14l-10 22h10l-12 26" stroke="#dfe8f6" stroke-width="1.4"/>
    <g class="m-fig"><path d="M50 72Q60 64 70 72L76 104Q80 124 84 142H36Q40 124 44 104Z" fill="rgba(159,184,216,.08)"/>
      ${face(60, 58, 6)}<path d="M52 58Q52 46 60 45Q68 46 68 58"/><path d="M54 48l6-10 6 10" fill="${G}" stroke="none"/>
      <path d="M48 78Q34 70 30 56"/><path d="M26 50l8 12" stroke-width="2"/><path d="M72 78Q88 74 92 60"/><path d="M88 54l8 12" stroke-width="2"/>
    </g>${cloud(8, 140, 1)}${cloud(76, 136, .9, "m-cloud2")}`,
  /* 土地公: round old man with a staff, a tiny shrine */
  "4": () => `${stars([[16, 18, .8], [104, 22, .9], [108, 60, .6]])}
    <g class="m-shrine"><path d="M14 90h30v28H14z" fill="rgba(200,176,120,.10)"/><path d="M10 90l19-14 19 14z"/><path d="M24 102h10v16H24z"/></g>
    <g class="m-fig"><path d="M46 78Q60 68 74 78L80 106Q84 126 84 142H36Q36 126 40 106Z" fill="rgba(200,176,120,.10)"/>
      ${face(60, 58, 7)}<path d="M50 56Q50 42 60 41Q70 42 70 56"/><path d="M48 44Q60 36 72 44" fill="${G}" stroke="none"/>
      <path d="M54 66Q60 76 66 66" fill="rgba(200,176,120,.3)"/><path d="M52 70Q60 90 68 70" stroke-width=".6"/>
      <path d="M74 80L96 40" stroke-width="1.3"/><path d="M92 36a4 4 0 1 1 8 0a4 4 0 1 1-8 0z" fill="rgba(200,176,120,.3)"/>
    </g>${cloud(6, 140, .9)}${cloud(80, 138, .8, "m-cloud2")}`,
  /* 无常: tall hat, fan, mist */
  X: () => `${stars([[20, 16, .7], [96, 14, .8], [12, 80, .6], [106, 84, .7]])}
    <g class="m-fig"><path d="M48 60Q60 54 72 60L78 104Q82 124 86 142H34Q38 124 42 104Z" fill="rgba(201,195,214,.08)"/>
      <path d="M50 58L52 14h16l2 44z" fill="rgba(201,195,214,.12)"/><path d="M52 24h16M52 34h16" stroke-width=".6"/>
      ${face(60, 66, 6)}<path d="M54 70Q60 76 66 70"/>
      <path d="M72 82Q90 84 96 70"/><path d="M88 70l10-10 10 8-10 10z" fill="rgba(201,195,214,.15)"/><path d="M92 66l8 8" stroke-width=".5"/>
      <path d="M48 82Q36 92 40 110"/>
    </g><path class="m-mist" d="M6 128Q30 118 54 128T104 128" stroke-width=".8" opacity=".6"/>${cloud(8, 142, .9)}${cloud(74, 140, .8, "m-cloud2")}`,
};
export function characterSVG(card) {
  const f = FIGURES[card]; if (!f) return "";
  const body = f().replace(/<(path|circle|ellipse)(?![^>]*stroke="none")/g, '<$1 pathLength="1"');
  return `<svg class="char-svg" viewBox="0 0 120 150" aria-hidden="true"><g class="ch" fill="none" stroke="${G}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;
}
export const CARD_BACK = `<svg viewBox="0 0 100 148" class="tc-backart" aria-hidden="true"><g fill="none" stroke="var(--gold)" stroke-width=".5">
  <rect x="5" y="5" width="90" height="138" rx="4"/><rect x="8" y="8" width="84" height="132" rx="3" stroke-width=".3"/>
  <circle cx="50" cy="74" r="30"/><circle cx="50" cy="74" r="24" stroke-dasharray="1 2"/><circle cx="50" cy="74" r="12"/>
  ${Array.from({ length: 12 }, (_, i) => `<path d="M50 44L50 38" transform="rotate(${i * 30} 50 74)"/>`).join("")}
  <path d="M50 50L56 74L50 98L44 74Z M26 74L50 68L74 74L50 80Z" stroke-width=".6"/>
  <path d="M50 64a10 10 0 1 0 7 17a8 8 0 0 1-7-17z" fill="rgba(217,184,120,.25)"/>
  <path d="M14 14l8 0M14 14l0 8M86 14l-8 0M86 14l0 8M14 134l8 0M14 134l0-8M86 134l-8 0M86 134l0-8" stroke-width=".8"/>
  <path d="M50 16l2 4-2 4-2-4zM50 124l2 4-2 4-2-4z" fill="var(--gold)"/></g>
  <text x="50" y="118" text-anchor="middle" font-family="Cormorant Garamond,serif" font-style="italic" font-size="6" letter-spacing="1.4" fill="var(--gold)">The Trip Deck</text></svg>`;

/* suit emblems for the 36 minor cards: gold line-art, drawn in the same arch window */
const EMB = {
  F: `<g class="m-fig"><path d="M30 86H90Q88 112 60 116Q32 112 30 86Z" fill="rgba(232,185,138,.1)"/><path d="M26 86H94"/><path d="M36 96Q60 104 84 96" stroke-width=".7"/><path d="M72 58L96 34M78 62L100 40" stroke-width="1.2"/><g class="m-steam" stroke-width=".8"><path d="M48 80q-5-8 0-16t0-14"/><path d="M60 78q-5-8 0-16t0-14"/><path d="M72 80q-5-8 0-16t0-14"/></g></g>`,
  M: `<g class="m-fig"><circle cx="60" cy="72" r="30"/><circle cx="60" cy="72" r="24" stroke-dasharray=".02 .03" stroke-width=".6"/><g class="m-needle2"><path d="M60 46L66 72L60 98L54 72Z" fill="rgba(201,211,232,.18)"/><path d="M60 46L66 72H54Z" fill="var(--gold)" stroke="none" opacity=".8"/></g><text x="60" y="38" text-anchor="middle" font-size="7" fill="var(--gold)" stroke="none" font-family="Cormorant Garamond,serif">N</text><path d="M30 118q10-6 20 0t20 0t20 0" stroke-width=".7"/></g>`,
  P: `<g class="m-fig"><rect x="28" y="54" width="64" height="44" rx="6" fill="rgba(191,224,210,.08)"/><path d="M44 54l5-8h22l5 8"/><circle cx="60" cy="76" r="14"/><circle cx="60" cy="76" r="9" stroke-width=".7"/><g class="m-aperture" stroke-width=".6">${[0, 1, 2, 3, 4, 5].map(i => `<path d="M60 67l4 9" transform="rotate(${i * 60} 60 76)"/>`).join("")}</g><circle cx="82" cy="62" r="2" fill="var(--gold)" stroke="none"/><path class="m-flash" d="M60 22v10M44 28l5 7M76 28l-5 7" stroke-width=".8"/></g>`,
  S: `<g class="m-fig"><circle cx="46" cy="72" r="16"/><circle cx="74" cy="72" r="16"/><path class="m-thread" d="M20 110C34 96 44 118 60 104S88 92 100 108" stroke="#e25b4a" stroke-width="1.1"/><path d="M60 60v24" stroke-width=".6" stroke-dasharray=".05 .05"/><path d="M56 40q4-8 8 0q-4 6-8 0z" fill="rgba(240,196,200,.3)"/></g>`
};
export function emblemSVG(key) {
  const s = key[0], n = +key[1];
  const stars = Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2 - Math.PI / 2; return `<circle cx="${(60 + Math.cos(a) * 44).toFixed(1)}" cy="${(72 + Math.sin(a) * 44).toFixed(1)}" r="1.3" fill="var(--gold)" stroke="none"/>`; }).join("");
  const body = (EMB[s] || "") + `<g class="m-stars">${stars}</g>`;
  return `<svg class="char-svg" viewBox="0 0 120 150" aria-hidden="true"><g class="ch" fill="none" stroke="var(--gold)" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">${body.replace(/<(path|circle|rect)(?![^>]*stroke="none")/g, '<$1 pathLength="1"')}</g></svg>`;
}
