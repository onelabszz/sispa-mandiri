import { Store } from '../storage.js';
import { Utils } from '../../shared/js/utils.js';
import { Icons } from '../../shared/js/icons.js';
import { Shell } from '../../shared/js/shell.js';
import { Router } from '../../shared/js/router.js';
import { PinLock } from '../../shared/js/pin.js';
import { Auth } from '../../shared/js/auth.js';
import { Supabase } from '../../shared/js/supabase.js';
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
    
    // 1. Cek Session (Auto Login)
    const session = Auth.getSessionFor('PS');
    if (session) {
      const cfg = Store.config();
      if (cfg.wilayah !== session.wilayah) {
        Store.setConfig({ ...cfg, wilayah: session.wilayah, nip_pengawas: session.nip });
      }
      
      if (cfg.pin && sessionStorage.getItem('sispa_unlocked') !== '1') {
        PinLock.show(cfg, 'PS', () => this.boot());
        return;
      }
      return this.boot();
    }
    
    // 2. Belum Login -> Tampil Layar Login NIP
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
            <div class="logo-badge">${Icons.svg('user', 24)}</div>
            <div>
              <div class="brand-name">SISPA Pengawas</div>
              <div class="brand-tagline">Dashboard multi-sekolah binaan</div>
            </div>
          </div>

          <div>
            <h1 class="auth-hero-title">
              Kelola banyak sekolah<br>
              <span class="accent">dalam satu dashboard.</span>
            </h1>
            <p class="auth-hero-sub">
              Terima data dari banyak KS, analisis kinerja, evaluasi kepala sekolah, dan cetak rekap untuk
              <strong style="color:#e0e7ff">Dinas Pendidikan</strong>.
            </p>

            <div class="auth-feature-list">
              <div class="auth-feature-item">
                <div class="auth-fi-icon">${Icons.svg('upload', 15)}</div>
                <div><strong>Import JSON dari KS</strong><span>Merge otomatis · Deteksi duplikat</span></div>
              </div>
              <div class="auth-feature-item">
                <div class="auth-fi-icon">${Icons.svg('bar-chart-3', 15)}</div>
                <div><strong>Analitik lintas sekolah</strong><span>Coverage · Benchmark · KKA agregat</span></div>
              </div>
              <div class="auth-feature-item">
                <div class="auth-fi-icon">${Icons.svg('award', 15)}</div>
                <div><strong>Evaluasi Kinerja KS</strong><span>Ranking · Rekomendasi otomatis</span></div>
              </div>
            </div>
          </div>

          <div class="auth-brand-footer">
            <div style="display:flex;align-items:center;gap:.6rem">
              <img src="../shared/icons/wonogiri.svg" alt="Lambang Wonogiri" style="width:32px;height:32px;filter:drop-shadow(0 1px 3px rgba(0,0,0,.25))">
              <div>
                <div style="font-size:.72rem;color:#e0e7ff;font-weight:600;line-height:1.2">Kabupaten Wonogiri</div>
                <div style="font-size:.62rem;color:#a5b4fc;line-height:1.2">© ${new Date().getFullYear()} SISPA Pengawas</div>
              </div>
            </div>
            <span class="version-pill">v2.0.0</span>
          </div>
        </div>
      </aside>

      <main class="auth-form-side">
        <div class="auth-form-card">
          <div class="auth-mobile-brand">
            <div class="mb-logo">${Icons.svg('user', 20)}</div>
            <div>
              <div style="font-weight:800;color:#0f172a;font-size:.95rem">SISPA Pengawas</div>
              <div style="font-size:.7rem;color:#64748b">Kabupaten Wonogiri</div>
            </div>
          </div>

          <div class="auth-step-pill">Login Pengawas</div>
          <h1 class="auth-heading">Selamat datang 👋</h1>
          <p class="auth-sub">Masukkan NIP Anda untuk masuk ke aplikasi. Data profil akan diisi setelahnya.</p>

          <div class="form-group">
            <label class="label">NIP Pengawas</label>
            <input type="text" id="loginNip" class="input" placeholder="Contoh: 197001012000031001" maxlength="18" inputmode="numeric" autocomplete="off">
          </div>

          <button class="btn btn-primary btn-lg" style="margin-top:.75rem" id="btnLogin">
            ${Icons.svg('chevron-right', 18)}
            Lanjutkan
          </button>

          <div class="auth-footer-note">
            <span style="flex-shrink:0;color:#4f46e5">${Icons.svg('info', 16)}</span>
            <span>Butuh internet pada verifikasi NIP. Setelah itu bisa offline.</span>
          </div>
        </div>
      </main>
    `;
    
    const input = Utils.el('loginNip');
    const btn = Utils.el('btnLogin');
    
    const doLogin = async () => {
      const nip = input.value.trim();
      if (!nip) return Utils.toast('NIP wajib diisi', 'error');
      if (nip.length < 8) return Utils.toast('NIP tidak valid', 'error'); // Standar NIP minimal 8 digit (bisa 18)
      
      if (!Supabase.isReady()) return Utils.toast('Butuh internet untuk verifikasi', 'error');
      
      const originalHtml = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `<span>Memverifikasi...</span>`;
      
      try {
        const data = await Supabase.findPengawas(nip);
        if (!data) {
          btn.disabled = false;
          btn.innerHTML = originalHtml;
          return Utils.toast('NIP tidak terdaftar. Hubungi Dinas Pendidikan.', 'error');
        }

        // --- TAMBAHAN: Cek Status Suspend ---
        if (data.is_active === false) {
          btn.disabled = false;
          btn.innerHTML = originalHtml;
          return Utils.toast('Akun pengawas ini dinonaktifkan (Suspend). Hubungi Admin.', 'error');
        }
        // -----------------------------------
        
        // Simpan session
        Auth.saveSession({
          role: 'PS',
          nip: data.nip,
          nama_pengawas: data.nama_pengawas,
          wilayah: data.wilayah || '',
          logged_in_at: new Date().toISOString()
        });
        
        // Update config lokal
        const cfg = Store.config();
        Store.setConfig({ ...cfg, nip_pengawas: data.nip, wilayah: data.wilayah || '' });
        
        // Cek: Apakah profil PS (nama_pengawas) sudah ada di lokal?
        if (!Store.config().nama_pengawas) {
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
            <div class="logo-badge">${Icons.svg('user', 24)}</div>
            <div>
              <div class="brand-name">SISPA Pengawas</div>
              <div class="brand-tagline">Dashboard multi-sekolah binaan</div>
            </div>
          </div>
          <div>
            <h1 class="auth-hero-title">Satu langkah lagi<br><span class="accent">lengkapi profil Anda.</span></h1>
            <p class="auth-hero-sub">Data ini digunakan untuk tampilan header dan tanda tangan laporan cetak.</p>
            <div class="auth-quote-card" style="margin-top:2rem">
              "NIP: ${Store.config().nip_pengawas || '-'}"
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
            <div class="mb-logo">${Icons.svg('user', 20)}</div>
            <div>
              <div style="font-weight:800;color:#0f172a;font-size:.95rem">SISPA Pengawas</div>
              <div style="font-size:.7rem;color:#64748b">Lengkapi Profil</div>
            </div>
          </div>
          <div class="auth-step-pill">Profil Pengawas</div>
          <h1 class="auth-heading">Lengkapi Profil</h1>
          <p class="auth-sub">Halo! Sepertinya Anda baru pertama kali masuk di perangkat ini.</p>

          <div class="form-group">
            <label class="label">Nama Lengkap & Gelar *</label>
            <input type="text" id="setupPsNama" class="input" placeholder="Dr. Ahmad Suryadi, M.Pd">
          </div>
          <div class="form-group">
            <label class="label">Wilayah Binaan</label>
            <input type="text" id="setupPsWilayah" class="input" placeholder="Kecamatan Pule">
          </div>

          <button class="btn btn-primary btn-lg" style="margin-top:.75rem" id="btnSaveProfile">
            ${Icons.svg('check', 18)}
            Simpan & Masuk
          </button>
        </div>
      </main>
    `;

    Utils.el('btnSaveProfile').onclick = () => {
      const nama = Utils.el('setupPsNama').value.trim();
      if (!nama) return Utils.toast('Nama lengkap wajib diisi', 'error');
      const cfg = Store.config();
      Store.setConfig({ ...cfg, nama_pengawas: nama, wilayah: Utils.el('setupPsWilayah').value.trim() });
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
    
    Shell.buildSidebar(NAV_PS, Router.current || 'dashboard', cfg, 'PS');
    Shell.buildHeader(cfg, 'PS');
    Shell.buildProfileMenu(cfg, 'PS', () => this.lock(), () => this.logout());
    
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
  },

  logout() {
    Utils.confirm('Keluar Aplikasi?', 'Anda akan keluar dari sesi ini. Data supervisi dan profil tetap tersimpan di perangkat ini.', () => {
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
