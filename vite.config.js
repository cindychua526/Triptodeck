import { defineConfig } from "vite";
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: { output: {
      inlineDynamicImports: process.env.SINGLE === "1",
      /* libraries change rarely: keep them in their own files so an app update doesn't re-download them */
      manualChunks: process.env.SINGLE === "1" ? undefined : id => /node_modules\/@supabase/.test(id) ? "supabase" : /node_modules\/leaflet/.test(id) ? "leaflet" : undefined
    } }
  }
});
