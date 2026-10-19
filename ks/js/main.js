import { Store } from '../storage.js';
import { Utils } from '../../shared/js/utils.js';
import { Icons } from '../../shared/js/icons.js';
import { Shell } from '../../shared/js/shell.js';
import { Router } from '../../shared/js/router.js';
import { PinLock } from '../../shared/js/pin.js';
import { NAV_KS } from '../../shared/js/constants.js';

import { Dashboard } from './modules/dashboard.js';
import { Guru } from './modules/guru.js';
import { Profil } from './modules/profil.js';
import { Program } from './modules/program.js';
import { Supervisi } from './modules/supervisi.js';
import { Akademik } from './modules/akademik.js';
import { Coaching } from './modules/coaching.js';
import { Analisis } from './modules/analisis.js';
import { Laporan } from './modules/laporan.js';
import { Pengaturan } from './modules/pengaturan.js';

// Expose globals needed by Utils.modal/toast (batch 1 helper)
window.Utils = Utils;
window.Icons = Icons;

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
    Utils.el('app').style.display = 'none';
    Utils.el('profileMenu')?.classList.remove('show');
    Utils.el('overlay')?.classList.remove('show');
    Utils.el('modalBack')?.classList.remove('show');
    const screen = Utils.el('setupScreen');
    screen.className = 'auth-split';
    screen.style.display = 'grid';
    screen.innerHTML = `
      <aside class="auth-brand">
        <div class="auth-brand-shape" style="width:260px;height:260px;top:-80px;right:-80px"></div>
        <div class="auth-brand-shape" style="width:130px;height:130px;bottom:15%;right:10%"></div>
        <div class="auth-brand-shape" style="width:80px;height:80px;top:45%;left:-30px"></div>

        <div style="display:flex;flex-direction:column;justify-content:space-between;height:100%;position:relative;z-index:2;gap:1.5rem">
          <div class="auth-brand-header">
            <div class="logo-badge">${Icons.svg('graduation-cap', 24)}</div>
            <div>
              <div class="brand-name">SISPA Mandiri</div>
              <div class="brand-tagline">Sistem Supervisi Pendidikan Akademik</div>
            </div>
          </div>

          <div>
            <h1 class="auth-hero-title">
              Supervisi akademik yang<br>
              <span class="accent">memuliakan & bermakna.</span>
            </h1>
            <p class="auth-hero-sub">
              Aplikasi semi-online untuk Kepala Sekolah dalam membina guru melalui
              <strong style="color:#e0e7ff">observasi pembelajaran mendalam</strong> dan
              <strong style="color:#e0e7ff">percakapan coaching-mentoring</strong>.
            </p>

            <div class="auth-feature-list">
              <div class="auth-feature-item">
                <div class="auth-fi-icon">${Icons.svg('git-branch', 15)}</div>
                <div>
                  <strong>Supervisi 3 Tahap</strong>
                  <span>Pra-observasi · Observasi · Pasca-observasi</span>
                </div>
              </div>
              <div class="auth-feature-item">
                <div class="auth-fi-icon">${Icons.svg('target', 15)}</div>
                <div>
                  <strong>Pendekatan Adaptif</strong>
                  <span>Directive · Collaborative · Non-Directive</span>
                </div>
              </div>
              <div class="auth-feature-item">
                <div class="auth-fi-icon">${Icons.svg('bar-chart-3', 15)}</div>
                <div>
                  <strong>Analitik PM & KKA</strong>
                  <span>Prinsip · Pengalaman · 8 DPL · Koding/AI</span>
                </div>
              </div>
            </div>

            <div class="auth-quote-card">
              "Supervisi akademik intinya bukan menilai kinerja guru, tetapi membantu guru untuk meningkatkan profesionalismenya."
              <span class="qa-author">— Modul 5, Supervisi Akademik (2026)</span>
            </div>
          </div>

          <div class="auth-brand-footer">
  <div style="display:flex;align-items:center;gap:.6rem">
    <img src="../shared/icons/wonogiri.svg" alt="Lambang Kabupaten Wonogiri" style="width:32px;height:32px;filter:drop-shadow(0 1px 3px rgba(0,0,0,.25))">
    <div>
      <div style="font-size:.72rem;color:#e0e7ff;font-weight:600;line-height:1.2">Kabupaten Wonogiri</div>
      <div style="font-size:.62rem;color:#a5b4fc;line-height:1.2">© ${new Date().getFullYear()} SISPA Mandiri</div>
    </div>
  </div>
  <span class="version-pill">v2.0.0</span>
</div>
        </div>
      </aside>

      <main class="auth-form-side">
        <div class="auth-form-card">
          <div class="auth-mobile-brand">
            <div class="mb-logo">${Icons.svg('graduation-cap', 20)}</div>
            <div>
                <div style="font-weight:800;color:#0f172a;font-size:.95rem">SISPA Mandiri</div>
                <div style="font-size:.7rem;color:#64748b">Kabupaten Wonogiri</div>
            </div>
          </div>

          <div class="auth-step-pill">Setup Awal</div>
          <h1 class="auth-heading">Selamat datang 👋</h1>
          <p class="auth-sub">Isi identitas sekolah & Kepala Sekolah. Data akan tersimpan di device ini saja.</p>

          <div class="form-group">
            <label class="label">Nama Sekolah *</label>
            <input type="text" id="setupSekolah" class="input" placeholder="Contoh: SDN 1 Sukamaju">
          </div>

          <div class="row">
            <div class="form-group">
              <label class="label">NPSN</label>
              <input type="text" id="setupNpsn" class="input" placeholder="8 digit" maxlength="8">
            </div>
            <div class="form-group">
              <label class="label">NIP KS</label>
              <input type="text" id="setupNip" class="input" placeholder="NIP">
            </div>
          </div>

          <div class="form-group">
            <label class="label">Nama Kepala Sekolah *</label>
            <input type="text" id="setupKs" class="input" placeholder="Dra. Siti Aminah, M.Pd">
          </div>

          <button class="btn btn-primary btn-lg" style="margin-top:.75rem" id="btnSetup">
            ${Icons.svg('chevron-right', 18)}
            Simpan & Mulai
          </button>

          <div class="auth-footer-note">
            <span style="flex-shrink:0;color:#4f46e5">${Icons.svg('info', 16)}</span>
            <span>Anda bisa mengatur PIN setelah setup di menu <strong>Pengaturan</strong>.</span>
          </div>
        </div>
      </main>
    `;
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
    // Pastikan setup screen & PIN hidden saat masuk app
    Utils.el('setupScreen').style.display = 'none';
    Utils.el('pinScreen').classList.remove('show');
    
    Utils.el('app').style.display = 'block';
    const cfg = Store.config();
    Shell.buildSidebar(NAV_KS, Router.current || 'dashboard', cfg, 'KS');
    Shell.buildHeader(cfg, 'KS');
    Shell.buildProfileMenu(cfg, 'KS', () => this.lock());
    this.wireShell();
    Router.register('dashboard', Dashboard);
    Router.register('guru', Guru);
    Router.register('profil', Profil);
    Router.register('program', Program);
    Router.register('supervisi', Supervisi);
    Router.register('akademik', Akademik);
    Router.register('coaching', Coaching);
    Router.register('analisis', Analisis);
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
