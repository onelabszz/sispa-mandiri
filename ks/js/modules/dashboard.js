import { Store } from '../../storage.js';
import { Utils } from '../../../shared/js/utils.js';
import { Icons } from '../../../shared/js/icons.js';
import { Router } from '../../../shared/js/router.js';

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
    
    // Deteksi supervisi yang belum selesai (draft)
    const supBerjalan = sup.filter(s => s.status !== 'selesai').length;

    const tipeDist = { Dropout: 0, Unfocused: 0, Analytical: 0, Professional: 0 };
    guru.forEach(g => { if (g.tipe && tipeDist[g.tipe] !== undefined) tipeDist[g.tipe]++; });

    const recent = [...akad.slice(-3).map(x => ({ ...x, type: 'Akademik' })),
                    ...coach.slice(-3).map(x => ({ ...x, type: 'Coaching' })),
                    ...sup.slice(-3).map(x => ({ ...x, type: '3 Tahap' }))]
      .sort((a, b) => (b.tgl || '').localeCompare(a.tgl || ''))
      .slice(0, 5);

    // Hitung Perlu Perhatian
    const perhatian = [];
    if (guru.length === 0) {
      perhatian.push({ icon: 'users', text: 'Belum ada data guru. Tambahkan guru terlebih dahulu.', href: 'guru', color: 'var(--brand-600)' });
    } else if (belumDinilai > 0) {
      perhatian.push({ icon: 'target', text: `${belumDinilai} guru belum dinilai tipe profilnya.`, href: 'profil', color: 'var(--warning)' });
    }
    if (supBerjalan > 0) {
      perhatian.push({ icon: 'clipboard-list', text: `${supBerjalan} supervisi belum diselesaikan.`, href: 'supervisi', color: 'var(--brand-600)' });
    }

    return `
      ${backupBanner()}
      
      <!-- Kartu Profil KS -->
      <div class="card" style="margin-bottom:1.5rem; overflow:hidden">
        <div style="background:linear-gradient(135deg, var(--brand-600) 0%, var(--brand-700) 100%); padding:1.5rem; color:white">
          <div style="display:flex; align-items:center; gap:1rem; flex-wrap:wrap">
            <div style="width:64px; height:64px; border-radius:50%; background:rgba(255,255,255,.15); backdrop-filter:blur(10px); display:flex; align-items:center; justify-content:center; font-size:1.5rem; font-weight:700; border:1px solid rgba(255,255,255,.25)">
              ${(cfg.nama_ks || 'K').charAt(0).toUpperCase()}
            </div>
            <div style="flex:1; min-width:0">
              <div style="font-size:0.75rem; color:#c7d2fe; text-transform:uppercase; letter-spacing:0.05em">Kepala Sekolah</div>
              <div style="font-size:1.25rem; font-weight:700; margin-top:0.25rem">${Utils.esc(cfg.nama_ks || '—')}</div>
              <div style="font-size:0.875rem; color:#e0e7ff; margin-top:0.125rem">${Utils.esc(cfg.nama_sekolah || '—')}</div>
            </div>
            <button class="btn" onclick="App.switchTab('pengaturan')" style="background:rgba(255,255,255,.15); color:white; border:1px solid rgba(255,255,255,.25)">
              ${Icons.svg('settings', 16)} Edit Profil
            </button>
          </div>
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); border-top:1px solid var(--slate-100)">
          <div style="padding:1rem">
            <div style="font-size:0.75rem; color:var(--slate-500)">NPSN</div>
            <div class="text-mono" style="font-size:0.875rem; font-weight:500; color:var(--slate-900); margin-top:0.25rem">${Utils.esc(cfg.npsn || '—')}</div>
          </div>
          <div style="padding:1rem; border-left:1px solid var(--slate-100)">
            <div style="font-size:0.75rem; color:var(--slate-500)">NIP</div>
            <div class="text-mono" style="font-size:0.875rem; font-weight:500; color:var(--slate-900); margin-top:0.25rem">${Utils.esc(cfg.nip_ks || '—')}</div>
          </div>
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
          <div><div style="font-size:.75rem;color:var(--slate-500)">Sudah Dinilai</div><div style="font-size:1.5rem;font-weight:700">${sudahDinilai}<span style="color:var(--slate-400);font-size:1rem;font-weight:500">/${guru.length}</span></div></div>
        </div>
      </div>

      ${perhatian.length > 0 ? `
        <div class="card" style="margin-bottom:1.5rem">
          <div class="card-header" style="color:var(--warning)">${Icons.svg('alert-circle', 18)} Perlu Perhatian</div>
          <div class="card-body" style="display:flex;flex-direction:column;gap:.5rem">
            ${perhatian.map(p => `
              <button class="btn btn-secondary" style="justify-content:flex-start; padding:.75rem; text-align:left" onclick="App.switchTab('${p.href}')">
                <span style="color:${p.color}; margin-right:.5rem">${Icons.svg(p.icon, 18)}</span>
                <span style="flex:1; font-size:.85rem">${p.text}</span>
                ${Icons.svg('chevron-right', 16)}
              </button>
            `).join('')}
          </div>
        </div>
      ` : ''}

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

    Utils.el('btnAddGuru')?.addEventListener('click', async () => {
      const { Router } = await import('../../../shared/js/router.js');
      Router.navigate('guru');
    });
  }
};
