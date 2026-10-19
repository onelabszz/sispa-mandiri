export const Store = {
  KEY: 'sispa_full_v3',
  _cache: null,

  init() {
    try {
      const raw = localStorage.getItem(this.KEY);
      this._cache = raw ? JSON.parse(raw) : { config:{}, guru:[], program:[], supervisi:[], akademik:[], coaching:[] };
    } catch {
      this._cache = { config:{}, guru:[], program:[], supervisi:[], akademik:[], coaching:[] };
    }
    return Promise.resolve();
  },

  load() { return this._cache; },

  save(data) {
    this._cache = data;
    try { localStorage.setItem(this.KEY, JSON.stringify(data)); }
    catch (err) { console.error('localStorage save error:', err); }
  },

  get(key) { return this.load()[key] || []; },

  set(key, val) {
    const d = { ...this.load() };
    d[key] = val;
    this.save(d);
  },

  config() { return this.load().config || {}; },

  setConfig(cfg) {
    const d = { ...this.load() };
    d.config = cfg;
    this.save(d);
  },

  async reset() {
    this._cache = { config:{}, guru:[], program:[], supervisi:[], akademik:[], coaching:[] };
    try { localStorage.removeItem(this.KEY); } catch {}
  }
};
