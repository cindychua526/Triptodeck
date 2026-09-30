/* 外观: 跟随手机 / 浅色 / 深色. Dark mode is the same paper, turned down for night — ink on dark tea-stained paper.
   Printed things (stamps, tickets, the passport, the newspaper, the receipt) stay as they are: they're objects on the table. */
const KEY = "td-theme";
export const themePref = () => { try { return localStorage.getItem(KEY) || "auto"; } catch (e) { return "auto"; } };
const mq = typeof matchMedia !== "undefined" ? matchMedia("(prefers-color-scheme: dark)") : null;
export function applyTheme() {
  const p = themePref(), dark = p === "dark" || (p === "auto" && mq && mq.matches);
  document.documentElement.toggleAttribute("data-dark", !!dark);
  const m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute("content", dark ? "#1b1f1a" : "#f6f1e8");
}
export function setTheme(p) { try { localStorage.setItem(KEY, p); } catch (e) {} applyTheme(); }
if (mq) { try { mq.addEventListener("change", applyTheme); } catch (e) { mq.addListener && mq.addListener(applyTheme); } }
applyTheme();
