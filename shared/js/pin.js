import { Utils } from './utils.js';
import { Icons } from './icons.js';

export const PinLock = {
  temp: '',
  _cfg: {},
  _onSuccess: null,
  _role: 'KS',

  show(cfg, role, onSuccess) {
    this._cfg = cfg;
    this._role = role;
    this._onSuccess = onSuccess;
    this.temp = '';
    const screen = Utils.el('pinScreen');
    if (!screen) return;
    screen.classList.add('show');
    this.render();
  },

  render() {
    const screen = Utils.el('pinScreen');
    const cfg = this._cfg;
    const role = this._role;
    const name = role === 'KS' ? (cfg.nama_ks || 'Kepala Sekolah') : (cfg.nama_pengawas || 'Pengawas');
    const sub = role === 'KS' ? (cfg.nama_sekolah || 'Sekolah') : (cfg.wilayah || 'Wilayah Binaan');
    const initial = (name || 'K').charAt(0).toUpperCase();
    const roleLabel = role === 'KS' ? 'Kepala Sekolah' : 'Pengawas';
    const year = new Date().getFullYear();

    screen.innerHTML = `
      <div class="auth-split">
        <aside class="auth-brand auth-brand-compact">
          <div class="auth-brand-shape" style="width:220px;height:220px;top:-60px;right:-60px"></div>
          <div class="auth-brand-shape" style="width:110px;height:110px;bottom:15%;left:-40px"></div>

          <div class="auth-brand-header">
            <div class="logo-badge">${Icons.svg('graduation-cap', 24)}</div>
            <div>
              <div class="brand-name">SISPA Mandiri</div>
              <div class="brand-tagline">Supervisi Pendidikan Akademik</div>
            </div>
          </div>

          <div class="auth-brand-user">
            <div style="font-size:.65rem;color:#a5b4fc;letter-spacing:.06em;text-transform:uppercase;margin-bottom:.5rem;font-weight:600">${roleLabel}</div>
            <h3>${Utils.esc(name)}</h3>
            <p>${Utils.esc(sub)}</p>
          </div>

          <div class="auth-brand-tip">
            <span style="flex-shrink:0;color:#a5b4fc;margin-top:2px">${Icons.svg('lock', 16)}</span>
            <div>
              <strong style="color:#e0e7ff;display:block;margin-bottom:.15rem">PIN melindungi data</strong>
              <span style="color:#c7d2fe;font-size:.72rem">Jika laptop dipinjam orang lain, data supervisi tetap aman.</span>
            </div>
          </div>

          <div class="auth-brand-footer">
  <div style="display:flex;align-items:center;gap:.55rem">
    <img src="../shared/icons/wonogiri.svg" alt="Lambang Kabupaten Wonogiri" style="width:26px;height:26px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.25))">
    <span style="font-size:.68rem;color:#c7d2fe">Kabupaten Wonogiri · © ${year}</span>
  </div>
  <span class="version-pill">v2.0.0</span>
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

            <div class="pin-avatar">${Utils.esc(initial)}</div>
            <h1 class="auth-heading">Selamat datang kembali</h1>
            <p class="auth-sub">Masukkan PIN 4 digit untuk membuka aplikasi.</p>

            <div class="pin-dots-premium" id="pinDots">
              <div class="pin-dot-premium"></div>
              <div class="pin-dot-premium"></div>
              <div class="pin-dot-premium"></div>
              <div class="pin-dot-premium"></div>
            </div>

            <div class="pin-pad-premium">
              ${['1','2','3','4','5','6','7','8','9'].map(d => `<button class="pin-btn-premium" data-pin="${d}">${d}</button>`).join('')}
              <button class="pin-btn-premium action" data-pin="C">C</button>
              <button class="pin-btn-premium" data-pin="0">0</button>
              <button class="pin-btn-premium action" data-pin="X">${Icons.svg('chevron-left', 18)}</button>
            </div>

            <div class="auth-error" id="pinError"></div>

            <button class="auth-link-btn" id="btnForgotPin">
              ${Icons.svg('info', 14)}
              Lupa PIN?
            </button>
          </div>
        </main>
      </div>
    `;

    screen.querySelectorAll('[data-pin]').forEach(btn => {
      btn.onclick = () => this.input(btn.dataset.pin);
    });
    Utils.el('btnForgotPin').onclick = () => this.showHelp();
    this.updateDots();
  },

  input(v) {
    if (v === 'C') this.temp = '';
    else if (v === 'X') this.temp = this.temp.slice(0, -1);
    else if (this.temp.length < 4) this.temp += v;
    this.updateDots();

    if (this.temp.length === 4) {
      if (this.temp === this._cfg.pin) {
        sessionStorage.setItem('sispa_unlocked', '1');
        Utils.el('pinScreen').classList.remove('show');
        this._onSuccess?.();
      } else {
        const err = Utils.el('pinError');
        if (err) {
          err.textContent = 'PIN salah. Coba lagi.';
          err.classList.add('show');
        }
        this.temp = '';
        this.updateDots();
        setTimeout(() => {
          const e = Utils.el('pinError');
          if (e) e.classList.remove('show');
        }, 2500);
      }
    }
  },

  updateDots() {
    document.querySelectorAll('.pin-dot-premium').forEach((d, i) => {
      d.classList.toggle('fill', i < this.temp.length);
    });
  },

  showHelp() {
    if (Utils.el('pinHelpOverlay')) return;
    const isKS = this._role === 'KS';
    const storageKey = isKS ? 'sispa_full_v3' : 'sispa_pengawas_v1';
    const helpContact = isKS ? 'pengawas pembina' : 'admin Dinas Pendidikan';

    const overlay = document.createElement('div');
    overlay.className = 'pin-help-overlay';
    overlay.id = 'pinHelpOverlay';
    overlay.innerHTML = `
      <div class="pin-help-card">
        <div class="pin-help-icon">${Icons.svg('lock', 28)}</div>
        <h2 style="font-size:1.2rem;font-weight:700;margin:0 0 .5rem;color:#0f172a">Lupa PIN?</h2>
        <p style="font-size:.85rem;color:#64748b;line-height:1.6;margin:0 0 1rem">
          Aplikasi ini offline — tidak ada server untuk reset PIN otomatis.
        </p>
        <div style="padding:.7rem 1rem;background:#fef3c7;border-radius:8px;font-size:.78rem;color:#92400e;margin-bottom:1rem;line-height:1.5">
          <strong>⚠️ Perhatian:</strong> Reset aplikasi akan menghapus semua data. Anda harus setup ulang dan mengimpor backup JSON (jika ada).
        </div>
        <div style="font-size:.85rem;color:#475569;line-height:1.7;margin-bottom:1.25rem">
          <strong style="color:#0f172a">Coba dulu:</strong>
          <ol style="margin:.4rem 0 0 1.25rem;padding:0">
            <li>PIN umum: tanggal lahir, nomor absen, tahun ajaran</li>
            <li>Hubungi ${helpContact} untuk panduan</li>
            <li>Jika ada file backup JSON, reset lalu impor kembali</li>
          </ol>
        </div>
        <div style="display:flex;gap:.5rem;justify-content:flex-end;flex-wrap:wrap">
          <button class="btn btn-secondary" id="btnHelpClose">Tutup</button>
          <button class="btn btn-danger" id="btnHelpReset">Reset Aplikasi</button>
        </div>
      </div>
    `;

    Utils.el('pinScreen').appendChild(overlay);
    Utils.el('btnHelpClose').onclick = () => this.closeHelp();
    Utils.el('btnHelpReset').onclick = () => {
      Utils.confirm(
        'Reset Aplikasi?',
        'Semua data akan dihapus permanen. File backup JSON di folder Downloads Anda tidak terpengaruh. Lanjutkan?',
        () => {
          try { localStorage.removeItem(storageKey); } catch {}
          location.reload();
        }
      );
    };
  },

  closeHelp() {
    Utils.el('pinHelpOverlay')?.remove();
  }
};
