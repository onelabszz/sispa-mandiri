import { Icons } from './icons.js';
import { Shell } from './shell.js';

export const Router = {
  routes: {},
  current: null,
  onNavigate: null,

  register(key, module) { this.routes[key] = module; },

  async navigate(key) {
    const mod = this.routes[key];
    if (!mod) {
      document.getElementById('main').innerHTML =
        `<div class="card"><div class="card-body empty-state"><h3>Halaman belum tersedia</h3><p>Modul "${key}" belum terdaftar.</p></div></div>`;
      return;
    }
    this.current = key;
    Shell.updateActive(key);
    const main = document.getElementById('main');
    try {
      main.innerHTML = await mod.render();
      Icons.inject();
      if (mod.bind) await mod.bind();
      Shell.closeSidebar();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (this.onNavigate) this.onNavigate(key);
    } catch (err) {
      console.error('Router error:', err);
      main.innerHTML = `<div class="card"><div class="card-body"><h3 style="color:var(--danger)">Terjadi kesalahan</h3><p style="font-size:.85rem;color:var(--slate-500)">${err.message}</p></div></div>`;
    }
  }
};
