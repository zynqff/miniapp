/* ═══════════════════════════════════════════════════
   STORE — localStorage с безопасным JSON
   ═══════════════════════════════════════════════════ */

const Store = {
  get(key) {
    try { return JSON.parse(localStorage.getItem(key)); }
    catch { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch {}
  },
  del(key) {
    try { localStorage.removeItem(key); }
    catch {}
  },
};
