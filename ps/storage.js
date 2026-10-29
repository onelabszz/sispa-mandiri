const idb = {
  _db: null,
  NAME: 'sispa_pengawas',
  open() {
    if (this._db) return Promise.resolve(this._db);
    return new Promise((res, rej) => {
      const req = indexedDB.open(this.NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains('kv')) req.result.createObjectStore('kv');
      };
      req.onsuccess = () => { this._db = req.result; res(this._db); };
      req.onerror = () => rej(req.error);
    });
  },
  async get(k) {
    const db = await this.open();
    return new Promise((res, rej) => {
      const tx = db.transaction('kv', 'readonly');
      const r = tx.objectStore('kv').get(k);
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  },
  async set(k, v) {
    const db = await this.open();
    return new Promise((res, rej) => {
      const tx = db.transaction('kv', 'readwrite');
      tx.objectStore('kv').put(v, k);
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
  }
};

export const Store = {
  KEY: 'sispa_pengawas_v1',
  _cache: null,

  async init() {
    try {
      const raw = await idb.get(this.KEY);
      if (raw) {
        this._cache = typeof raw === 'string' ? JSON.parse(raw) : raw;
        console.log('✅ Store loaded from IndexedDB');
        return;
      }
    } catch (e) { console.warn('IDB read error:', e); }

    // Migrasi dari localStorage (jika ada versi lama)
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) {
        this._cache = JSON.parse(raw);
        await idb.set(this.KEY, this._cache);
        console.log('✅ Migrasi localStorage → IndexedDB');
        return;
      }
    } catch {}
    this._cache = { config: {}, sekolah: [], evaluasi: [], supervisiPM: [] };
  },

  load() { return this._cache || { config: {}, sekolah: [], supervisiPM: [] }; },

  save(d) {
    this._cache = d;
    return idb.set(this.KEY, d).catch(err => {
      console.error('IDB save error:', err);
      try { localStorage.setItem(this.KEY, JSON.stringify(d)); } catch {}
    });
  },

  get(k) { return this.load()[k] || []; },
  set(k, v) { const d = { ...this.load() }; d[k] = v; return this.save(d); },
  config() { return this.load().config || {}; },
  setConfig(c) { const d = { ...this.load() }; d.config = c; return this.save(d); },

  async reset() {
    this._cache = { config: {}, sekolah: [], evaluasi: [], supervisiPM: [] };
    try { await idb.set(this.KEY, null); } catch {}
    try { localStorage.removeItem(this.KEY); } catch {}
  }
};
