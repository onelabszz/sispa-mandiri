import { Store } from '../storage.js';
import { Utils } from '../../shared/js/utils.js';
import { Icons } from '../../shared/js/icons.js';
import { Shell } from '../../shared/js/shell.js';
import { Router } from '../../shared/js/router.js';
import { PinLock } from '../../shared/js/pin.js';
import { NAV_KS } from '../../shared/js/constants.js';

import { Dashboard } from './modules/dashboard.js';
// Modul lain akan di-import di batch berikutnya:
// import { Guru } from './modules/guru.js';
// import { Profil } from './modules/profil.js';
// import { Program } from './modules/program.js';
// import { Supervisi } from './modules/supervisi.js';
// import { Akademik } from './modules/akademik.js';
// import { Coaching } from './modules/coaching.js';
// import { Analisis } from './modules/analisis.js';
// import { Laporan } from './modules/laporan.js';
// import { Pengaturan } from './modules/pengaturan.js';

const App = {
  async init() {
    await Store.init();
    const cfg = Store.config();
    if (!cfg.nama_sekolah) return this.showSetup();
    if (cfg.pin && sessionStorage.getItem('sispa_unlocked') !== '1') {
      PinLock.show(cfg, 'KS', () => this.boot());
      return;
    }
    this.boot();
  },

  showSetup() {
    const screen = Utils.el('setupScreen');
    screen.innerHTML = `
      <div class="setup-card">
        <div style="text-align:center;margin-bottom:1.5rem">
          <div style="width:56px;height:56px;margin:0 auto .75rem;background:linear-gradient(135deg,var(--brand-500),var(--brand-700));border-radius:14px;display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:var(--shadow-md)">${Icons.svg('graduation-cap', 28)}</div>
          <h2 style="margin:0;font-size:1.25rem">Selamat Datang di SISPA</h2>
          <p style="margin:.35rem 0 0;color:var(--slate-500);font-size:.875rem">Isi identitas sekolah & KS untuk memulai</p>
        </div>
        <div class="form-group"><label class="label">Nama Sekolah *</label><input type="text" id="setupSekolah" class="input" placeholder="Contoh: SDN 1 Sukamaju"></div>
        <div class="row">
          <div class="form-group"><label class="label">NPSN</label><input type="text" id="setupNpsn" class="input" placeholder="8 digit" maxlength="8"></div>
          <div class="form-group"><label class="label">NIP KS</label><input type="text" id="setupNip" class="input" placeholder="NIP"></div>
        </div>
        <div class="form-group"><label class="label">Nama Kepala Sekolah *</label><input type="text" id="setupKs" class="input" placeholder="Dra. Siti Aminah, M.Pd"></div>
        <button class="btn btn-primary" style="width:100%;padding:.75rem;margin-top:.5rem" id="btnSetup">Simpan & Mulai</button>
      </div>`;
    screen.style.display = 'flex';
    Utils.el('btnSetup').onclick = () => this.saveSetup();
  },

  saveSetup() {
    const nama_sekolah = Utils.el('setupSekolah').value.trim();
    const nama_ks = Utils.el('setupKs').value.trim();
    if (!nama_sekolah) return Utils.toast('Nama sekolah wajib diisi', 'error');
    if (!nama_ks) return Utils.toast('Nama KS wajib diisi', 'error');
    Store.setConfig({
      nama_sekolah,
      npsn: Utils.el('setupNpsn').value.trim(),
      nama_ks,
      nip_ks: Utils.el('setupNip').value.trim(),
      pin: ''
    });
    Utils.el('setupScreen').style.display = 'none';
    this.boot();
  },

  boot() {
    Utils.el('app').style.display = 'block';
    const cfg = Store.config();
    Shell.buildSidebar(NAV_KS, Router.current || 'dashboard', cfg, 'KS');
    Shell.buildHeader(cfg, 'KS');
    Shell.buildProfileMenu(cfg, 'KS', () => this.lock());
    this.wireShell();
    Router.register('dashboard', Dashboard);
    // Register modul lain menyusul di batch berikutnya
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
    document.getElementById('modalCloseBtn')?.addEventListener('click', () => Utils.closeModal());
    // Nav clicks
    document.getElementById('sidebar')?.addEventListener('click', e => {
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
    PinLock.show(cfg, 'KS', () => this.boot());
  }
};

window.App = App;

document.addEventListener('DOMContentLoaded', async () => {
  await App.init();
  // Persistent storage
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().then(g => console.log(g ? '✅ Persistent storage aktif' : '⚠️ Tidak diberikan'));
  }
  // Service worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').then(r => console.log('✅ SW:', r.scope)).catch(e => console.warn('SW err:', e));
    });
  }
});
