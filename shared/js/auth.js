export const Auth = {
  // Session key BERBEDA per role agar KS & PS bisa login bersamaan
  KEY_KS: 'sispa_session_KS',
  KEY_PS: 'sispa_session_PS',

  _keyFor(role) {
    if (role === 'KS') return this.KEY_KS;
    if (role === 'PS') return this.KEY_PS;
    return 'sispa_session';
  },

  saveSession(session) {
    const key = this._keyFor(session.role);
    localStorage.setItem(key, JSON.stringify(session));
  },

  getSession(role) {
    if (!role) {
      // Fallback: cek KS dulu, lalu PS
      try {
        const rawKS = localStorage.getItem(this.KEY_KS);
        if (rawKS) return JSON.parse(rawKS);
        const rawPS = localStorage.getItem(this.KEY_PS);
        if (rawPS) return JSON.parse(rawPS);
      } catch {}
      return null;
    }
    try {
      const raw = localStorage.getItem(this._keyFor(role));
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  getSessionFor(role) {
    const s = this.getSession(role);
    return s && s.role === role ? s : null;
  },

  logout(role) {
    if (role) {
      localStorage.removeItem(this._keyFor(role));
    } else {
      // Logout semua (fallback)
      localStorage.removeItem(this.KEY_KS);
      localStorage.removeItem(this.KEY_PS);
    }
    localStorage.removeItem('sispa_session'); // hapus legacy juga
    sessionStorage.removeItem('sispa_unlocked');
  },

  // Migration: pindahkan session lama (single key) ke per-role key
  migrateOldSession() {
    const old = localStorage.getItem('sispa_session');
    if (!old) return;
    try {
      const data = JSON.parse(old);
      if (data.role === 'KS' || data.role === 'PS') {
        // Migrasi ke key per-role
        this.saveSession(data);
        console.log(`[Auth] Migrasi session lama role ${data.role} ke ${this._keyFor(data.role)}`);
      }
      // Hapus key lama
      localStorage.removeItem('sispa_session');
    } catch (e) {
      console.warn('[Auth] Migration error:', e);
    }
  }
};

// Auto-migrate saat module load
if (typeof window !== 'undefined' && window.localStorage) {
  Auth.migrateOldSession();
}
