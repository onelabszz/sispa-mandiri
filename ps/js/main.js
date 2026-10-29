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

    const session = Auth.getSessionFor('PS');
    if (session) {
      const cfg = Store.config();

      // ============================================
      // GUARD: Session valid & konsisten dengan Store
      // ============================================

      // (a) Session harus punya NIP & role
      if (!session.nip || !session.role) {
        console.warn('[PS Init] Invalid session (no nip/role), logging out');
        Auth.logout('PS');
        this.showLogin();
        return;
      }

      // (b) Stale session guard — INI FIX UTAMA
      if (cfg.nip_pengawas && cfg.nip_pengawas !== session.nip) {
        console.warn(
          '[PS Init] Stale session detected. Session:', session.nip,
          'Store:', cfg.nip_pengawas, '→ forcing re-login'
        );
        Auth.logout('PS');
        this.showLogin();
        return;
      }

      // (c) Sync config
      Store.setConfig({
        ...cfg,
        nip_pengawas: session.nip,
        nama_pengawas: session.nama_pengawas,
        wilayah: session.wilayah
      });

      // (d) PIN check
      const cfg2 = Store.config();
      if (cfg2.pin && sessionStorage.getItem('sispa_unlocked') !== '1') {
        PinLock.show(cfg2, 'PS', () => this.boot());
        return;
      }
      return this.boot();
    }

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
            <span class="version-pill">v2.1.0</span>
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
          <p class="auth-sub">Masukkan NIP Anda untuk masuk ke aplikasi. Identitas akan diambil dari database.</p>
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
      if (nip.length < 8) return Utils.toast('NIP tidak valid', 'error');

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

        if (data.is_active === false) {
          btn.disabled = false;
          btn.innerHTML = originalHtml;
          return Utils.toast('Akun pengawas ini dinonaktifkan (Suspend). Hubungi Admin.', 'error');
        }

        const cfg = Store.config();
        const hasDifferentPengawas = cfg.nip_pengawas && cfg.nip_pengawas !== data.nip;
        const hasExistingData = (Store.get('sekolah') || []).length > 0
          || (Store.get('evaluasi') || []).length > 0
          || (Store.get('supervisiPM') || []).length > 0;

        if (hasDifferentPengawas && hasExistingData) {
          btn.disabled = false;
          btn.innerHTML = originalHtml;
          this._showConflictModal(cfg, data);
          return;
        }

        Auth.saveSession({
          role: 'PS',
          nip: data.nip,
          nama_pengawas: data.nama_pengawas,
          wilayah: data.wilayah || '',
          logged_in_at: new Date().toISOString()
        });

        Store.setConfig({
          ...cfg,
          nip_pengawas: data.nip,
          nama_pengawas: data.nama_pengawas,
          wilayah: data.wilayah || ''
        });

        Utils.toast('Berhasil masuk!', 'success');
        const screen = Utils.el('setupScreen');
        screen.classList.remove('auth-split');
        screen.style.display = 'none';
        setTimeout(() => this.boot(), 300);
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
      if (btn) {
        if (btn.dataset.tab === 'sekolah') {
          import('./modules/sekolah.js').then(({ Sekolah }) => { Sekolah._detailId = null; });
        }
        Router.navigate(btn.dataset.tab);
      }
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
      Auth.logout('PS');
      location.reload();
    });
  },

  _showConflictModal(oldCfg, newPengawasData) {
    const sekolahCount = (Store.get('sekolah') || []).length;
    const evaluasiCount = (Store.get('evaluasi') || []).length;
    const pmCount = (Store.get('supervisiPM') || []).length;

    Utils.modal('⚠️ Perangkat Sudah Punya Data', `
      <div style="padding:1rem;background:#fee2e2;border:1px solid #fecaca;border-radius:10px;margin-bottom:1rem">
        <div style="display:flex;gap:.75rem;align-items:flex-start">
          <span style="color:#dc2626;flex-shrink:0">${Icons.svg('alert-triangle', 24)}</span>
          <div style="flex:1">
            <div style="font-weight:700;color:#991b1b;font-size:.95rem">Data Lama Akan Hilang!</div>
            <div style="font-size:.85rem;color:#7f1d1d;margin-top:.35rem;line-height:1.6">
              Perangkat ini <strong>sudah menyimpan data</strong> untuk pengawas lain. 
              Jika Anda login sebagai <strong>${Utils.esc(newPengawasData.nama_pengawas)}</strong>, 
              semua data pengawas lama akan <strong>DIHAPUS PERMANEN</strong>.
            </div>
          </div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:1rem">
        <div style="padding:.85rem;background:#fef2f2;border-radius:8px;border:1px solid #fecaca">
          <div style="font-size:.7rem;color:#991b1b;text-transform:uppercase;font-weight:700;margin-bottom:.35rem">Pengawas Saat Ini</div>
          <div style="font-weight:700;color:#991b1b;font-size:.9rem">${Utils.esc(oldCfg.nama_pengawas || '—')}</div>
          <div style="font-size:.75rem;color:#7f1d1d;margin-top:.15rem;font-family:monospace">NIP ${Utils.esc(oldCfg.nip_pengawas || '—')}</div>
          <div style="font-size:.75rem;color:#991b1b;margin-top:.35rem">
            ${sekolahCount} sekolah binaan · ${evaluasiCount} evaluasi${pmCount > 0 ? ` · ${pmCount} sesi PM` : ''}
          </div>
        </div>
        <div style="padding:.85rem;background:var(--brand-50);border-radius:8px;border:1px solid var(--brand-500)">
          <div style="font-size:.7rem;color:var(--brand-700);text-transform:uppercase;font-weight:700;margin-bottom:.35rem">Akan Login Sebagai</div>
          <div style="font-weight:700;color:var(--brand-700);font-size:.9rem">${Utils.esc(newPengawasData.nama_pengawas)}</div>
          <div style="font-size:.75rem;color:var(--brand-600);margin-top:.15rem;font-family:monospace">NIP ${Utils.esc(newPengawasData.nip)}</div>
          <div style="font-size:.75rem;color:var(--brand-600);margin-top:.15rem">${Utils.esc(newPengawasData.wilayah || '')}</div>
        </div>
      </div>

      <div style="padding:.75rem;background:var(--brand-50);border-radius:8px;font-size:.8rem;color:var(--brand-700);line-height:1.6">
        <strong>💡 Rekomendasi:</strong> Ekspor backup JSON terlebih dahulu agar data pengawas lama bisa dipulihkan jika diperlukan.
      </div>
    `, `
      <button class="btn btn-secondary" id="btnConflictCancel">Batal</button>
      <button class="btn btn-secondary" id="btnConflictExport" style="color:var(--success);border-color:var(--success)">${Icons.svg('download', 14)} Ekspor Dulu</button>
      <button class="btn btn-danger" id="btnConflictForce">Lanjut (Timpa)</button>
    `);

    Utils.el('btnConflictCancel').onclick = () => {
      Utils.closeModal();
      const inp = Utils.el('loginNip');
      if (inp) { inp.value = ''; inp.focus(); }
    };

    Utils.el('btnConflictExport').onclick = () => {
      const data = Store.load();
      data.version = '2.1.0';
      data.app = 'sispa-pengawas';
      data.schema_flags = { supervisiPM: !!(data.supervisiPM && data.supervisiPM.length) };
      data.exported_at = new Date().toISOString();

      const sanitize = (str) => String(str || '')
        .replace(/[\\/:*?"<>|]/g, '')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 60);
      const filename = `SISPA_Pengawas_${sanitize(oldCfg.nip_pengawas)}_${new Date().toISOString().slice(0,10)}.json`;

      Utils.downloadJSON(data, filename);
      Utils.toast('Backup diekspor. Klik "Lanjut (Timpa)" untuk login.', 'success');
      Utils.el('btnConflictExport').innerHTML = `${Icons.svg('check', 14)} Backup OK`;
      Utils.el('btnConflictExport').disabled = true;
    };

    Utils.el('btnConflictForce').onclick = () => {
      Utils.confirm(
        'Yakin Timpa Data?',
        `Semua data ${oldCfg.nama_pengawas} (${sekolahCount} sekolah, ${evaluasiCount} evaluasi${pmCount > 0 ? `, ${pmCount} sesi PM` : ''}) akan dihapus permanen.`,
        () => this._wipeAndLogin(newPengawasData)
      );
    };
  },

  async _wipeAndLogin(newPengawasData) {
    await Store.reset();

    Auth.saveSession({
      role: 'PS',
      nip: newPengawasData.nip,
      nama_pengawas: newPengawasData.nama_pengawas,
      wilayah: newPengawasData.wilayah || '',
      logged_in_at: new Date().toISOString()
    });

    Store.setConfig({
      nip_pengawas: newPengawasData.nip,
      nama_pengawas: newPengawasData.nama_pengawas,
      wilayah: newPengawasData.wilayah || '',
      pin: ''
    });

    Utils.closeModal();
    Utils.toast(`Data lama dihapus. Login sebagai ${newPengawasData.nama_pengawas}.`, 'success');
    setTimeout(() => this.boot(), 300);
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
