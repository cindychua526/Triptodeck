import { defineConfig } from "vite";
import { PurgeCSS } from "purgecss";

/* 瘦身: after the build, drop CSS rules whose class names appear nowhere in the app's source.
   Class names that are put together in code ("atm-" + kind, `k-${kind}` …) are kept by the safelist below.
   Set NOPURGE=1 to build without it. */
const SAFE = [/^atm-/, /^p-/, /^pat-/, /^r-/, /^k-/, /^s\d$/, /^n\d$/, /^d\d$/, /^np-/, /^lk-/, /^f-/, /^st-/, /^pg-/, /^q24-/, /^fb-/, /^sp-/, /^ht-/, /^phase-/, /^look-/, /^leaflet/, /^pin/, /^tl-/, /^gk-/, /^sv-/, /^ooc/, /^fx/,
  /^on$/, /^open$/, /^lit$/, /^flip$/, /^done$/, /^dead$/, /^cur$/, /^now$/, /^got$/, /^todo$/, /^grey$/, /^hit$/, /^out$/, /^yes$/, /^no$/, /^t$/, /^pulled$/, /^opening$/, /^ready$/, /^new$/, /^printing/, /^lowpower$/, /^archived$/, /^over$/, /^off$/, /^busy$/, /^show$/, /^in$/, /^go$/, /^turned$/];
function purge() {
  return { name: "td-purge-css", apply: "build", enforce: "post",
    async generateBundle(_, bundle) {
      if (process.env.NOPURGE === "1") return;
      const css = Object.values(bundle).filter(f => f.type === "asset" && /index-.*\.css$/.test(f.fileName));
      for (const f of css) {
        const [r] = await new PurgeCSS().purge({ content: ["index.html", "src/**/*.js"], css: [{ raw: String(f.source) }],
          defaultExtractor: c => c.match(/[\w-/:%.]+(?<!:)/g) || [], safelist: { standard: SAFE, greedy: [/data-/, /aria-/, /\[data/] }, keyframes: false, fontFace: false, variables: false });
        if (r && r.css && r.css.length > String(f.source).length * .5) f.source = r.css;   // never ship a result that looks broken
      }
    } };
}
export default defineConfig({
  plugins: [purge()],
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: { output: {
      inlineDynamicImports: process.env.SINGLE === "1",
      /* libraries change rarely: keep them in their own files so an app update doesn't re-download them */
      manualChunks: process.env.SINGLE === "1" ? undefined : id => /node_modules\/@supabase/.test(id) ? "supabase" : /node_modules\/leaflet/.test(id) ? "leaflet" : undefined
    } }
  }
});
