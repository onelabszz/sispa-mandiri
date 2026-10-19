import { Store } from '../storage.js';
import { Utils } from '../../shared/js/utils.js';
import { Icons } from '../../shared/js/icons.js';
import { Shell } from '../../shared/js/shell.js';
import { Router } from '../../shared/js/router.js';
import { PinLock } from '../../shared/js/pin.js';
import { NAV_PS } from '../../shared/js/constants.js';

import { Dashboard } from './modules/dashboard.js';
import { Sekolah } from './modules/sekolah.js';
import { Guru } from './modules/guru.js';
import { Supervisi } from './modules/supervisi.js';
import { Analisis } from './modules/analisis.js';
import { Evaluasi } from './modules/evaluasi.js';
import { Laporan } from './modules/laporan.js';
import { Pengaturan } from './modules/pengaturan.js';

window.Utils = Utils;
window.Icons = Icons;

const App = {
  async init() {
    await Store.init();
    const cfg = Store.config();
    if (!cfg.nama_pengawas) return this.showSetup();
    if (cfg.pin && sessionStorage.getItem('sispa_unlocked') !== '1') {
      PinLock.show(cfg, 'PS', () => this.boot());
      return;
    }
    this.boot();
  },

  showSetup() {
    const screen = Utils.el('setupScreen');
    screen.innerHTML = `
      <div class="setup-card">
        <div style="text-align:center;margin-bottom:1.5rem">
          <div style="width:56px;height:56px;margin:0 auto .75rem;background:linear-gradient(135deg,var(--brand-500),var(--brand-700));border-radius:14px;display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:var(--shadow-md)">${Icons.svg('user', 28)}</div>
          <h2 style="margin:0;font-size:1.25rem">Selamat Datang, Pengawas</h2>
          <p style="margin:.35rem 0 0;color:var(--slate-500);font-size:.875rem">Isi identitas untuk memulai</p>
        </div>
        <div class="form-group"><label class="label">Nama Pengawas *</label><input type="text" id="setupNama" class="input" placeholder="Dr. Ahmad Suryadi, M.Pd"></div>
        <div class="row">
          <div class="form-group"><label class="label">NIP Pengawas</label><input type="text" id="setupNip" class="input" placeholder="NIP"></div>
          <div class="form-group"><label class="label">Wilayah Binaan</label><input type="text" id="setupWilayah" class="input" placeholder="Kec. Sukamaju"></div>
        </div>
        <button class="btn btn-primary" style="width:100%;padding:.75rem;margin-top:.5rem" id="btnSetup">${Icons.svg('chevron-right', 16)} Simpan & Mulai</button>
      </div>`;
    screen.style.display = 'flex';
    Utils.el('btnSetup').onclick = () => this.saveSetup();
  },

  saveSetup() {
    const nama = Utils.el('setupNama').value.trim();
    if (!nama) return Utils.toast('Nama pengawas wajib diisi', 'error');
    Store.setConfig({
      nama_pengawas: nama,
      nip_pengawas: Utils.el('setupNip').value.trim(),
      wilayah: Utils.el('setupWilayah').value.trim(),
      pin: ''
    });
    Utils.el('setupScreen').style.display = 'none';
    this.boot();
  },

  boot() {
    Utils.el('app').style.display = 'block';
    const cfg = Store.config();
    Shell.buildSidebar(NAV_PS, Router.current || 'dashboard', cfg, 'PS');
    Shell.buildHeader(cfg, 'PS');
    Shell.buildProfileMenu(cfg, 'PS', () => this.lock());
    this.wireShell();
    Router.register('dashboard', Dashboard);
    Router.register('sekolah', Sekolah);
    Router.register('guru', Guru);
    Router.register('supervisi', Supervisi);
    Router.register('analisis', Analisis);
    Router.register('evaluasi', Evaluasi);
    Router.register('laporan', Laporan);
    Router.register('pengaturan', Pengaturan);
    Router.navigate('dashboard');
  },

  wireShell() {
    Utils.el('menuBtn')?.addEventListener('click', () => Shell.openSidebar());
    Utils.el('overlay')?.addEventListener('click', () => Shell.closeSidebar());
    Utils.el('sidebarClose')?.addEventListener('click', () => Shell.closeSidebar());
    Utils.el('profileBtn')?.addEventListener('click', e => { e.stopPropagation(); Shell.toggleProfileMenu(); });
    document.addEventListener('click', e => {
      const m = Utils.el('profileMenu');
      const b = Utils.el('profileBtn');
      if (m && b && !m.contains(e.target) && !b.contains(e.target)) Shell.closeProfileMenu();
    });
    Utils.el('modalCloseBtn')?.addEventListener('click', () => Utils.closeModal());
    Utils.el('sidebar')?.addEventListener('click', e => {
      const btn = e.target.closest('.nav-item[data-tab]');
      if (btn) Router.navigate(btn.dataset.tab);
    });
    window.addEventListener('resize', () => {
      const btn = Utils.el('sidebarClose');
      if (btn) btn.style.display = window.innerWidth < 1024 ? 'inline-flex' : 'none';
    });
    if (window.innerWidth < 1024) Utils.el('sidebarClose').style.display = 'inline-flex';
  },

  lock() {
    Shell.closeProfileMenu();
    const cfg = Store.config();
    if (!cfg.pin) return Utils.toast('Atur PIN dulu di Pengaturan', 'warning');
    sessionStorage.removeItem('sispa_unlocked');
    PinLock.show(cfg, 'PS', () => this.boot());
  }
};

window.App = App;

document.addEventListener('DOMContentLoaded', async () => {
  await App.init();
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().then(g => console.log(g ? '✅ Persistent storage aktif' : '⚠️ Persistent storage tidak diberikan'));
  }
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').then(r => console.log('✅ SW:', r.scope)).catch(e => console.warn('SW err:', e));
    });
  }
});
