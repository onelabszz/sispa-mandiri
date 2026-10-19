import { Store } from '../storage.js';
import { Utils } from '../../shared/js/utils.js';
import { Icons } from '../../shared/js/icons.js';
import { Shell } from '../../shared/js/shell.js';
import { Router } from '../../shared/js/router.js';
import { PinLock } from '../../shared/js/pin.js';
import { Auth } from '../../shared/js/auth.js';
import { Supabase } from '../../shared/js/supabase.js';
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

window.Utils = Utils;
window.Icons = Icons;

const App = {
  async init() {
    await Store.init();
    
    // 1. Cek Session (Auto Login)
    const session = Auth.getSessionFor('KS');
    if (session) {
      // Sinkronkan nama sekolah dari Supabase ke lokal (jika ada perubahan)
      const cfg = Store.config();
      if (cfg.nama_sekolah !== session.nama_sekolah) {
        Store.setConfig({ ...cfg, nama_sekolah: session.nama_sekolah, npsn: session.npsn });
      }
      
      // Cek PIN
      if (cfg.pin && sessionStorage.getItem('sispa_unlocked') !== '1') {
        PinLock.show(cfg, 'KS', () => this.boot());
        return;
      }
      return this.boot();
    }
    
    // 2. Belum Login -> Tampil Layar Login NPSN
    this.showLogin();
  },

  showLogin() {
    Utils.el('app').style.display = 'none';
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
                <div><strong>Supervisi 3 Tahap</strong><span>Pra-observasi · Observasi · Pasca-observasi</span></div>
              </div>
              <div class="auth-feature-item">
                <div class="auth-fi-icon">${Icons.svg('target', 15)}</div>
                <div><strong>Pendekatan Adaptif</strong><span>Directive · Collaborative · Non-Directive</span></div>
              </div>
              <div class="auth-feature-item">
                <div class="auth-fi-icon">${Icons.svg('bar-chart-3', 15)}</div>
                <div><strong>Analitik PM & KKA</strong><span>Prinsip · Pengalaman · 8 DPL · Koding/AI</span></div>
              </div>
            </div>
          </div>

          <div class="auth-brand-footer">
            <div style="display:flex;align-items:center;gap:.6rem">
              <img src="../shared/icons/wonogiri.svg" alt="Lambang Wonogiri" style="width:32px;height:32px;filter:drop-shadow(0 1px 3px rgba(0,0,0,.25))">
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

          <div class="auth-step-pill">Login Kepala Sekolah</div>
          <h1 class="auth-heading">Selamat datang 👋</h1>
          <p class="auth-sub">Masukkan NPSN sekolah Anda. Data profil KS akan diisi setelahnya.</p>

          <div class="form-group">
            <label class="label">NPSN Sekolah</label>
            <input type="text" id="loginNpsn" class="input" placeholder="Contoh: 20311457" maxlength="8" inputmode="numeric" autocomplete="off">
          </div>

          <button class="btn btn-primary btn-lg" style="margin-top:.75rem" id="btnLogin">
            ${Icons.svg('chevron-right', 18)}
            Lanjutkan
          </button>

          <div class="auth-footer-note">
            <span style="flex-shrink:0;color:#4f46e5">${Icons.svg('info', 16)}</span>
            <span>Butuh internet pada verifikasi NPSN. Setelah itu bisa offline.</span>
          </div>
        </div>
      </main>
    `;
    
    const input = Utils.el('loginNpsn');
    const btn = Utils.el('btnLogin');
    
    const doLogin = async () => {
      const npsn = input.value.trim();
      if (!npsn) return Utils.toast('NPSN wajib diisi', 'error');
      if (!/^\d{8}$/.test(npsn)) return Utils.toast('NPSN harus 8 digit angka', 'error');
      
      if (!Supabase.isReady()) return Utils.toast('Butuh internet untuk verifikasi', 'error');
      
      const originalHtml = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `<span>Memverifikasi...</span>`;
      
      try {
        const data = await Supabase.findSekolah(npsn);
        if (!data) {
          btn.disabled = false;
          btn.innerHTML = originalHtml;
          return Utils.toast('NPSN tidak terdaftar. Hubungi Dinas Pendidikan.', 'error');
        }
        
        // Simpan session
        Auth.saveSession({
          role: 'KS',
          npsn: data.npsn,
          nama_sekolah: data.nama_sekolah,
          logged_in_at: new Date().toISOString()
        });
        
        // Update config lokal (simpan nama sekolah)
        const cfg = Store.config();
        Store.setConfig({ ...cfg, npsn: data.npsn, nama_sekolah: data.nama_sekolah });
        
        // Cek: Apakah profil KS (nama_ks) sudah ada di lokal?
        if (!Store.config().nama_ks) {
          this.showProfileSetup();
        } else {
          Utils.toast('Berhasil masuk!', 'success');
          const screen = Utils.el('setupScreen');
          screen.classList.remove('auth-split');
          screen.style.display = 'none';
          setTimeout(() => this.boot(), 300);
        }
      } catch (err) {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
        Utils.toast(err.message || 'Gagal terhubung ke server', 'error');
      }
    };
    
    btn.onclick = doLogin;
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });
    setTimeout(() => input.focus(), 100);
  },

  showProfileSetup() {
    const screen = Utils.el('setupScreen');
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
            <h1 class="auth-hero-title">Satu langkah lagi<br><span class="accent">lengkapi profil Anda.</span></h1>
            <p class="auth-hero-sub">Data ini digunakan untuk tanda tangan laporan cetak (PDF).</p>
            <div class="auth-quote-card" style="margin-top:2rem">
              "${Store.config().nama_sekolah || 'Sekolah Anda'}"
              <span class="qa-author">NPSN: ${Store.config().npsn || '-'}</span>
            </div>
          </div>
          <div class="auth-brand-footer">
            <div style="display:flex;align-items:center;gap:.6rem">
              <img src="../shared/icons/wonogiri.svg" alt="Lambang Wonogiri" style="width:32px;height:32px">
              <div><div style="font-size:.72rem;color:#e0e7ff;font-weight:600;line-height:1.2">Kabupaten Wonogiri</div></div>
            </div>
          </div>
        </div>
      </aside>

      <main class="auth-form-side">
        <div class="auth-form-card">
          <div class="auth-mobile-brand">
            <div class="mb-logo">${Icons.svg('graduation-cap', 20)}</div>
            <div>
              <div style="font-weight:800;color:#0f172a;font-size:.95rem">SISPA Mandiri</div>
              <div style="font-size:.7rem;color:#64748b">${Store.config().nama_sekolah}</div>
            </div>
          </div>
          <div class="auth-step-pill">Profil Kepala Sekolah</div>
          <h1 class="auth-heading">Lengkapi Profil</h1>
          <p class="auth-sub">Halo! Sepertinya Anda baru pertama kali masuk di perangkat ini.</p>

          <div class="form-group">
            <label class="label">Nama Lengkap & Gelar *</label>
            <input type="text" id="setupKs" class="input" placeholder="Dra. Siti Aminah, M.Pd">
          </div>
          <div class="form-group">
            <label class="label">NIP</label>
            <input type="text" id="setupNip" class="input" placeholder="NIP (Opsional)">
          </div>

          <button class="btn btn-primary btn-lg" style="margin-top:.75rem" id="btnSaveProfile">
            ${Icons.svg('check', 18)}
            Simpan & Masuk
          </button>
        </div>
      </main>
    `;

    Utils.el('btnSaveProfile').onclick = () => {
      const nama = Utils.el('setupKs').value.trim();
      if (!nama) return Utils.toast('Nama lengkap wajib diisi', 'error');
      const cfg = Store.config();
      Store.setConfig({ ...cfg, nama_ks: nama, nip_ks: Utils.el('setupNip').value.trim() });
      Utils.toast('Profil tersimpan!', 'success');
      const s = Utils.el('setupScreen');
      s.classList.remove('auth-split');
      s.style.display = 'none';
      setTimeout(() => this.boot(), 300);
    };
  },

  boot() {
    const screen = Utils.el('setupScreen');
    screen.classList.remove('auth-split');
    screen.style.display = 'none';
    Utils.el('pinScreen').classList.remove('show');
    
    Utils.el('app').style.display = 'block';
    const cfg = Store.config();
    
    Shell.buildSidebar(NAV_KS, Router.current || 'dashboard', cfg, 'KS');
    Shell.buildHeader(cfg, 'KS');
    Shell.buildProfileMenu(cfg, 'KS', () => this.lock(), () => this.logout());
    
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
    PinLock.show(cfg, 'KS', () => this.boot());
  },

  logout() {
    Utils.confirm('Keluar Aplikasi?', 'Anda akan keluar dari sesi ini. Data supervisi dan profil KS tetap tersimpan di perangkat ini.', () => {
      Auth.logout();
      location.reload();
    });
  }
};

window.App = App;

document.addEventListener('DOMContentLoaded', async () => {
  await App.init();
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().then(g => console.log(g ? '✅ Persistent storage aktif' : '⚠️ Tidak diberikan'));
  }
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').then(r => console.log('✅ SW:', r.scope)).catch(e => console.warn('SW err:', e));
    });
  }
});
