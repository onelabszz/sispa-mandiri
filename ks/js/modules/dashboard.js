import { Store } from '../../storage.js';
import { Utils } from '../../../shared/js/utils.js';
import { Icons } from '../../../shared/js/icons.js';

const emptyState = (icon, title, sub, cta = '') => `
  <div class="empty-state">
    <div class="empty-icon">${Icons.svg(icon, 48)}</div>
    <h3>${title}</h3>
    <p>${sub}</p>
    ${cta}
  </div>`;

const backupBanner = () => {
  const last = localStorage.getItem('sispa_last_export');
  const days = last ? Math.floor((Date.now() - new Date(last).getTime()) / 86400000) : null;
  if (days !== null && days <= 7) return '';
  const msg = days === null
    ? 'Belum pernah backup. Ekspor JSON untuk mengamankan data Anda.'
    : `${days} hari tanpa backup. Ekspor JSON untuk simpan data ke file.`;
  return `<div class="card" style="border-left:3px solid var(--warning);margin-bottom:1rem">
    <div class="card-body" style="padding:1rem 1.25rem">
      <div style="display:flex;gap:.75rem;align-items:center;flex-wrap:wrap">
        <span style="color:var(--warning)">${Icons.svg('alert-triangle', 28)}</span>
        <div style="flex:1;min-width:200px">
          <div style="font-weight:600;font-size:.9rem">Waktunya Backup</div>
          <div style="font-size:.8rem;color:var(--slate-600);margin-top:.15rem">${msg}</div>
        </div>
        <button class="btn btn-primary" id="btnBackupNow">${Icons.svg('save', 16)} Ekspor Sekarang</button>
      </div>
    </div>
  </div>`;
};

export const Dashboard = {
  async render() {
    const guru = Store.get('guru');
    const sup = Store.get('supervisi');
    const akad = Store.get('akademik');
    const coach = Store.get('coaching');
    const cfg = Store.config();
    const totalSesi = sup.length + akad.length + coach.length;
    const sudahDinilai = guru.filter(g => g.tipe).length;
    const belumDinilai = guru.length - sudahDinilai;
    const tipeDist = { Dropout: 0, Unfocused: 0, Analytical: 0, Professional: 0 };
    guru.forEach(g => { if (g.tipe && tipeDist[g.tipe] !== undefined) tipeDist[g.tipe]++; });

    const recent = [...akad.slice(-3).map(x => ({ ...x, type: 'Akademik' })),
                    ...coach.slice(-3).map(x => ({ ...x, type: 'Coaching' })),
                    ...sup.slice(-3).map(x => ({ ...x, type: '3 Tahap' }))]
      .sort((a, b) => (b.tgl || '').localeCompare(a.tgl || ''))
      .slice(0, 5);

    return `
      ${backupBanner()}
      <div class="page-head">
        <div>
          <h2>Dashboard</h2>
          <div class="page-sub">Selamat datang, ${Utils.esc(cfg.nama_ks || 'Kepala Sekolah')}</div>
        </div>
      </div>

      <div class="grid-auto" style="margin-bottom:1.5rem">
        <div class="stat-card">
          <div class="stat-icon" style="background:#e0e7ff;color:#4338ca">${Icons.svg('users', 22)}</div>
          <div><div style="font-size:.75rem;color:var(--slate-500)">Total Guru</div><div style="font-size:1.5rem;font-weight:700">${guru.length}</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#dcfce7;color:#166534">${Icons.svg('clipboard-list', 22)}</div>
          <div><div style="font-size:.75rem;color:var(--slate-500)">Total Supervisi</div><div style="font-size:1.5rem;font-weight:700">${totalSesi}</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fef3c7;color:#92400e">${Icons.svg('target', 22)}</div>
          <div><div style="font-size:.75rem;color:var(--slate-500)">Sudah Dinilai</div><div style="font-size:1.5rem;font-weight:700">${sudahDinilai}</div></div>
        </div>
      </div>

      ${belumDinilai > 0 ? `
        <div class="card" style="border-left:3px solid var(--warning)">
          <div class="card-body">
            <div style="display:flex;gap:.75rem;align-items:center">
              <span style="color:var(--warning)">${Icons.svg('alert-triangle', 24)}</span>
              <div style="flex:1">
                <div style="font-weight:600">Perlu Perhatian</div>
                <div style="font-size:.85rem;color:var(--slate-600)">${belumDinilai} guru belum dinilai tipe profilnya.</div>
              </div>
              <button class="btn btn-secondary" id="btnGoProfil">Nilai Sekarang ${Icons.svg('chevron-right', 16)}</button>
            </div>
          </div>
        </div>` : ''}

      ${guru.length === 0 ? `<div class="card"><div class="card-body">
        ${emptyState('users', 'Belum ada guru', 'Tambahkan data guru untuk memulai supervisi.',
          `<button class="btn btn-primary" id="btnAddGuru">${Icons.svg('plus', 16)} Tambah Guru Pertama</button>`)}
      </div></div>` : ''}

      <div class="card">
        <div class="card-header">${Icons.svg('target', 18)} Distribusi Tipe Guru</div>
        <div class="card-body">
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:.75rem;text-align:center">
            ${Object.entries(tipeDist).map(([t, c]) => `
              <div style="padding:.75rem;background:var(--slate-50);border-radius:8px">
                <div style="font-size:1.5rem;font-weight:700">${c}</div>
                <div style="font-size:.75rem;color:var(--slate-500);margin-top:.25rem">${t}</div>
              </div>`).join('')}
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">${Icons.svg('plus', 18)} Aksi Cepat</div>
        <div class="card-body" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:.75rem">
          <button class="btn btn-secondary" style="justify-content:flex-start;padding:1rem" data-nav="guru">${Icons.svg('users', 18)} Tambah Guru</button>
          <button class="btn btn-secondary" style="justify-content:flex-start;padding:1rem" data-nav="supervisi">${Icons.svg('clipboard-list', 18)} Supervisi 3 Tahap</button>
          <button class="btn btn-secondary" style="justify-content:flex-start;padding:1rem" data-nav="akademik">${Icons.svg('laptop', 18)} Obs. Akademik</button>
          <button class="btn btn-secondary" style="justify-content:flex-start;padding:1rem" data-nav="coaching">${Icons.svg('message-circle', 18)} Obs. Coaching</button>
          <button class="btn btn-secondary" style="justify-content:flex-start;padding:1rem" data-nav="laporan">${Icons.svg('file-text', 18)} Laporan</button>
        </div>
      </div>

      ${recent.length > 0 ? `
        <div class="card">
          <div class="card-header">${Icons.svg('refresh-cw', 18)} Aktivitas Terakhir</div>
          <div class="card-body" style="padding:0">
            ${recent.map(x => {
              const g = guru.find(g => g.id === x.gid);
              return `<div style="display:flex;justify-content:space-between;padding:.7rem 1.25rem;border-bottom:1px solid var(--slate-100);font-size:.875rem">
                <div><strong>${Utils.esc(g?.nama || '?')}</strong> <span class="badge badge-info" style="font-size:.65rem">${x.type}</span></div>
                <span style="color:var(--slate-500);font-size:.8rem">${Utils.date(x.tgl)}</span>
              </div>`;
            }).join('')}
          </div>
        </div>` : ''}
    `;
  },

  async bind() {
    // Backup CTA
    const backupBtn = Utils.el('btnBackupNow');
    if (backupBtn) {
      backupBtn.onclick = async () => {
        const { Store } = await import('../../storage.js');
        const { Utils } = await import('../../../shared/js/utils.js');
        const data = Store.load();
        data.version = '2.0.0';
        data.app = 'sispa-standalone';
        data.exported_at = new Date().toISOString();
        Utils.downloadJSON(data, `SISPA_Backup_${new Date().toISOString().slice(0, 10)}.json`);
        localStorage.setItem('sispa_last_export', new Date().toISOString());
        Utils.toast('Backup diekspor', 'success');
        const { Router } = await import('../../../shared/js/router.js');
        Router.navigate('dashboard');
      };
    }

    // Quick action nav
    document.querySelectorAll('#main [data-nav]').forEach(btn => {
      btn.onclick = async () => {
        const { Router } = await import('../../../shared/js/router.js');
        Router.navigate(btn.dataset.nav);
      };
    });
    // Specific helpers
    Utils.el('btnGoProfil')?.addEventListener('click', async () => {
      const { Router } = await import('../../../shared/js/router.js');
      Router.navigate('profil');
    });
    Utils.el('btnAddGuru')?.addEventListener('click', async () => {
      const { Router } = await import('../../../shared/js/router.js');
      Router.navigate('guru');
    });
  }
};
