/**
 * Auth — Per-Role Session Management
 * v2.0.1 — fix: per-role keys + migration + stale-session guard
 *
 * Keys:
 *   sispa_session_KS  → session Kepala Sekolah
 *   sispa_session_PS  → session Pengawas
 *   sispa_session     → legacy (dimigrasikan lalu dihapus)
 */
export const Auth = {
  KEY_KS: 'sispa_session_KS',
  KEY_PS: 'sispa_session_PS',
  KEY_LEGACY: 'sispa_session',

  _keyFor(role) {
    if (role === 'KS') return this.KEY_KS;
    if (role === 'PS') return this.KEY_PS;
    return this.KEY_LEGACY;
  },

  saveSession(session) {
    if (!session || !session.role) {
      console.warn('[Auth] saveSession: session missing role, skipped');
      return;
    }
    try {
      const key = this._keyFor(session.role);
      localStorage.setItem(key, JSON.stringify(session));
    } catch (e) {
      console.warn('[Auth] saveSession error:', e);
    }
  },

  getSession(role) {
    if (!role) {
      // Priority: KS first, then PS
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
    // Strict: role field HARUS cocok
    return s && s.role === role ? s : null;
  },

  logout(role) {
    if (role) {
      localStorage.removeItem(this._keyFor(role));
    } else {
      localStorage.removeItem(this.KEY_KS);
      localStorage.removeItem(this.KEY_PS);
    }
    // Always clear legacy + unlock flag
    localStorage.removeItem(this.KEY_LEGACY);
    sessionStorage.removeItem('sispa_unlocked');
  },

  /**
   * Migrate old single-key session to per-role key.
   * Rules:
   *  - Only migrate if role is KS or PS
   *  - Only if target key doesn't already exist (don't overwrite)
   *  - Always delete legacy key (clean up garbage)
   */
  migrateOldSession() {
    let old;
    try {
      old = localStorage.getItem(this.KEY_LEGACY);
    } catch {
      return;
    }
    if (!old) return;

    try {
      const data = JSON.parse(old);
      if (data && (data.role === 'KS' || data.role === 'PS')) {
        const targetKey = this._keyFor(data.role);
        if (!localStorage.getItem(targetKey)) {
          this.saveSession(data);
          console.log(`[Auth] Migrated legacy session → ${targetKey}`);
        } else {
          console.log(`[Auth] Legacy session dropped (target ${targetKey} exists)`);
        }
      } else {
        console.log('[Auth] Legacy session dropped (invalid/no role)');
      }
    } catch (e) {
      console.warn('[Auth] Legacy session parse error, dropped:', e);
    }
    localStorage.removeItem(this.KEY_LEGACY);
  }
};

if (typeof window !== 'undefined' && window.localStorage) {
  Auth.migrateOldSession();
}
