/* A visual of the cash an amount would be (stylised, not real currency) — for the ledger */
const D = {
  MYR: { sym: "RM", word: "RINGGIT", notes: [[100, "#6f4a8e"], [50, "#2f7f7a"], [20, "#c98424"], [10, "#b8423a"], [5, "#4f8a3a"], [1, "#3a64a0"]], land: "towers" },
  CNY: { sym: "¥", word: "YUAN", notes: [[100, "#b8322a"], [50, "#3a7f56"], [20, "#9a6a34"], [10, "#3a5a9a"], [5, "#6f4a82"], [1, "#7f8a3a"]], land: "pagoda" }
};
const LAND = {
  towers: `<path d="M88 64V30l4-8 4 8v34M104 64V30l4-8 4 8v34M96 44h8" stroke-width="1.6"/><path d="M60 64h80" stroke-width="1"/>`,
  pagoda: `<path d="M100 22v6M90 34h20l-4-6h-12zM88 44h24l-5-8h-14zM86 54h28l-5-8h-18zM84 64h32l-5-8h-22z" stroke-width="1.2"/><path d="M60 64h80" stroke-width="1"/>`
};
function note(val, col, cur) {
  const d = D[cur], g = "bn" + val + cur + Math.random().toString(36).slice(2, 6);
  return `<svg viewBox="0 0 200 96" class="bn" aria-hidden="true"><defs><linearGradient id="${g}" x1="0" x2="1"><stop offset="0" stop-color="${col}"/><stop offset=".6" stop-color="color-mix(in srgb, ${col} 70%, #fff)"/><stop offset="1" stop-color="${col}"/></linearGradient></defs>
    <rect x="1" y="1" width="198" height="94" rx="5" fill="url(#${g})"/><rect x="6" y="6" width="188" height="84" rx="3" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="1"/>
    <g fill="none" stroke="rgba(255,255,255,.22)" stroke-width=".7">${[0, 1, 2, 3, 4, 5].map(i => `<path d="M6 ${30 + i * 8}q24-${6 + i} 48 0t48 0t48 0t48 0"/>`).join("")}</g>
    <circle cx="150" cy="48" r="26" fill="rgba(255,255,255,.14)"/><circle cx="150" cy="48" r="20" fill="none" stroke="rgba(255,255,255,.3)" stroke-dasharray="2 2"/>
    <g fill="none" stroke="rgba(255,255,255,.7)" transform="translate(-40 10)">${LAND[d.land]}</g>
    <text x="14" y="30" font-family="Cormorant Garamond, Georgia, serif" font-weight="700" font-size="26" fill="#fff">${val}</text>
    <text x="186" y="84" text-anchor="end" font-family="Cormorant Garamond, serif" font-weight="700" font-size="16" fill="rgba(255,255,255,.9)">${val} ${d.word}</text>
    <text x="14" y="84" font-family="Noto Serif SC, serif" font-size="7.5" fill="rgba(255,255,255,.7)">TRIP DECK · 非真实货币</text></svg>`;
}
export function cashHTML(amount, cur = "MYR") {
  const d = D[cur] || D.MYR; let left = Math.round((+amount || 0) * 100) / 100;
  if (!(left > 0)) return `<div class="cash empty"><span>输入金额，看看是几张钞票</span></div>`;
  const parts = [];
  for (const [v, c] of d.notes) { const n = Math.floor(left / v + 1e-9); if (n) { parts.push({ v, c, n }); left = Math.round((left - n * v) * 100) / 100; } }
  const shown = parts.slice(0, 4);
  return `<div class="cash"><div class="cash-fan">${shown.map((p, i) => `<div class="cash-note" style="--i:${i};--n:${Math.min(p.n, 5)}">${Array.from({ length: Math.min(p.n, 4) }, (_, j) => `<div class="cash-sheet" style="--j:${j}">${note(p.v, p.c, cur)}</div>`).join("")}</div>`).join("")}</div>
    <div class="cash-count">${parts.map(p => `<span><i style="background:${p.c}"></i>${d.sym}${p.v} ×${p.n}</span>`).join("")}${left > 0 ? `<span><i class="coin"></i>零钱 ${d.sym}${left.toFixed(2)}</span>` : ""}</div><small>非真实货币，仅为可视化</small></div>`;
}
