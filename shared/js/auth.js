export const Auth = {
  SESSION_KEY: 'sispa_session',

  // Simpan session setelah login
  saveSession(session) {
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
  },

  // Ambil session aktif
  getSession() {
    try {
      const raw = localStorage.getItem(this.SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  // Cek apakah session cocok dengan role
  getSessionFor(role) {
    const s = this.getSession();
    return s && s.role === role ? s : null;
  },

  // Logout: hapus session, simpan data
  logout() {
    localStorage.removeItem(this.SESSION_KEY);
    sessionStorage.removeItem('sispa_unlocked');
  },

  // Cek apakah data lokal sudah milik NPSN/NIP lain
  hasConflict(role, id) {
    const session = this.getSession();
    return !!(session && session.id !== id);
  }
};
