import { Store } from '../../storage.js';
import { Utils } from '../../../shared/js/utils.js';
import { Icons } from '../../../shared/js/icons.js';
import { Router } from '../../../shared/js/router.js';
import { allGuru, allSesi, guruBySekolah, emptyState, infoBanner } from '../helpers.js';

export const Dashboard = {
  async render() {
    const sekolah = Store.get('sekolah');
    const guru = allGuru();
    const sesi = allSesi();
    const totalGuru = guru.length;
    const totalSesi = sesi.length;

    const tipeDist = { Dropout: 0, Unfocused: 0, Analytical: 0, Professional: 0 };
    guru.forEach(g => { if (g.tipe && tipeDist[g.tipe] !== undefined) tipeDist[g.tipe]++; });
    const sudahDinilai = guru.filter(g => g.tipe).length;

    const perSekolah = sekolah.map(sk => ({
      id: sk.id, nama: sk.nama_sekolah,
      sesi: (sk.supervisi || []).length + (sk.akademik || []).length + (sk.coaching || []).length
    })).sort((a, b) => b.sesi - a.sesi);
    const maxSesi = Math.max(...perSekolah.map(x => x.sesi), 1);

    const stale = sekolah.filter(sk => {
      const d = Utils.daysAgo(sk.updated_at);
      return d === null || d > 30;
    });

    const recent = sesi.slice(0, 6);

    return `
      <div class="page-head">
        <div>
          <h2>Dashboard Agregat</h2>
          <div class="page-sub">${sekolah.length} sekolah binaan · ${totalGuru} guru · ${totalSesi} sesi</div>
        </div>
        <button class="btn btn-primary" id="btnImport">${Icons.svg('upload', 16)} Import JSON</button>
      </div>

      <div class="grid-auto" style="margin-bottom:1.5rem">
        <div class="stat-card">
          <div class="stat-icon" style="background:linear-gradient(135deg,#e0e7ff,#c7d2fe);color:#4338ca">${Icons.svg('school', 22)}</div>
          <div><div style="font-size:.75rem;color:var(--slate-500)">Sekolah</div><div style="font-size:1.5rem;font-weight:700">${sekolah.length}</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:linear-gradient(135deg,#dcfce7,#bbf7d0);color:#166534">${Icons.svg('users', 22)}</div>
          <div><div style="font-size:.75rem;color:var(--slate-500)">Total Guru</div><div style="font-size:1.5rem;font-weight:700">${totalGuru}</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:linear-gradient(135deg,#fef3c7,#fde68a);color:#92400e">${Icons.svg('target', 22)}</div>
          <div><div style="font-size:.75rem;color:var(--slate-500)">Dinilai Tipe</div><div style="font-size:1.5rem;font-weight:700">${sudahDinilai}<span style="color:var(--slate-400);font-size:1rem;font-weight:500">/${totalGuru}</span></div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:linear-gradient(135deg,#dbeafe,#bfdbfe);color:#1e40af">${Icons.svg('clipboard-list', 22)}</div>
          <div><div style="font-size:.75rem;color:var(--slate-500)">Total Sesi</div><div style="font-size:1.5rem;font-weight:700">${totalSesi}</div></div>
        </div>
      </div>

      ${stale.length > 0 ? `
        <div class="card" style="border-left:3px solid var(--warning)">
          <div class="card-body">
            ${infoBanner('warn', 'alert-triangle',
              `<strong>${stale.length} sekolah</strong> belum kirim data >30 hari.
               <div style="margin-top:.4rem;display:flex;flex-wrap:wrap;gap:.35rem">
                 ${stale.map(sk => `<span class="badge badge-warning">${Utils.esc(sk.nama_sekolah)}</span>`).join('')}
               </div>`)}
          </div>
        </div>` : ''}

      ${sekolah.length === 0 ? `<div class="card"><div class="card-body">
        ${emptyState('school', 'Belum ada sekolah binaan',
          'Import file JSON dari KS untuk menambahkan sekolah.',
          `<button class="btn btn-primary" id="btnEmptyImport">${Icons.svg('upload', 16)} Import Sekarang</button>`)}
      </div></div>` : `
        <div class="row">
          <div class="card">
            <div class="card-header">${Icons.svg('layers', 18)} Distribusi Tipe Guru</div>
            <div class="card-body">
              <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:.5rem;text-align:center">
                ${Object.entries(tipeDist).map(([t, c]) => `
                  <div style="padding:.75rem;background:var(--slate-50);border-radius:10px">
                    <div style="font-size:1.4rem;font-weight:700">${c}</div>
                    <div style="font-size:.7rem;color:var(--slate-500);margin-top:.25rem">${t}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-header">${Icons.svg('bar-chart-3', 18)} Sesi per Sekolah</div>
            <div class="card-body">
              ${perSekolah.slice(0, 6).map(x => `
                <div class="metric-row">
                  <div class="metric-label" style="width:120px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${Utils.esc(x.nama)}</div>
                  <div class="metric-bar"><div class="metric-fill" style="width:${Math.round(x.sesi / maxSesi * 100)}%;background:var(--brand-500)"></div></div>
                  <div class="metric-value">${x.sesi}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `}

      ${recent.length > 0 ? `
        <div class="card">
          <div class="card-header">${Icons.svg('refresh-cw', 18)} Aktivitas Terbaru</div>
          <div class="card-body" style="padding:0">
            ${recent.map(x => {
              const g = guruBySekolah(x._skId, x.gid);
              const badge = x._jenis === 'Akademik' ? 'info' : x._jenis === 'Coaching' ? 'warning' : 'neutral';
              return `<div style="display:flex;justify-content:space-between;gap:.5rem;padding:.7rem 1.25rem;border-bottom:1px solid var(--slate-100);font-size:.85rem">
                <div style="min-width:0;flex:1">
                  <div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${Utils.esc(g?.nama || '?')}</div>
                  <div style="font-size:.75rem;color:var(--slate-500);margin-top:.1rem">${Utils.esc(x._skNama)} · <span class="badge badge-${badge}" style="font-size:.65rem">${x._jenis}</span></div>
                </div>
                <div style="color:var(--slate-500);font-size:.75rem;white-space:nowrap">${Utils.date(x.tgl)}</div>
              </div>`;
            }).join('')}
          </div>
        </div>` : ''}
    `;
  },

  async bind() {
    const goImport = async () => {
      const { Sekolah } = await import('./sekolah.js');
      Sekolah.startImport();
    };
    Utils.el('btnImport')?.addEventListener('click', goImport);
    Utils.el('btnEmptyImport')?.addEventListener('click', goImport);
  }
};
