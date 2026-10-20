import { Store } from '../../storage.js';
import { Utils } from '../../../shared/js/utils.js';
import { Icons } from '../../../shared/js/icons.js';
import { Router } from '../../../shared/js/router.js';
import { Supabase } from '../../../shared/js/supabase.js';
import { allGuru, allSesi, guruBySekolah, emptyState, infoBanner } from '../helpers.js';

export const Dashboard = {
  _pendingKlaimData: null,

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

      ${this._pendingKlaimHtml()}

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
            <div class="card-header">${Icons.svg('target', 18)} Peta Kuadran Glickman</div>
            <div class="card-body">
              <svg viewBox="0 0 300 300" style="width:100%;max-width:280px;display:block;margin:0 auto">
                <rect x="10" y="10" width="140" height="140" fill="#e0e7ff" rx="8"/>
                <rect x="150" y="10" width="140" height="140" fill="#dcfce7" rx="8"/>
                <rect x="10" y="150" width="140" height="140" fill="#fee2e2" rx="8"/>
                <rect x="150" y="150" width="140" height="140" fill="#fef3c7" rx="8"/>
                <text x="80" y="55" text-anchor="middle" font-size="11" font-weight="700" fill="#4338ca">Analytical</text>
                <text x="80" y="80" text-anchor="middle" font-size="24" font-weight="800" fill="#4338ca">${tipeDist.Analytical}</text>
                <text x="220" y="55" text-anchor="middle" font-size="11" font-weight="700" fill="#166534">Professional</text>
                <text x="220" y="80" text-anchor="middle" font-size="24" font-weight="800" fill="#166534">${tipeDist.Professional}</text>
                <text x="80" y="195" text-anchor="middle" font-size="11" font-weight="700" fill="#991b1b">Dropout</text>
                <text x="80" y="220" text-anchor="middle" font-size="24" font-weight="800" fill="#991b1b">${tipeDist.Dropout}</text>
                <text x="220" y="195" text-anchor="middle" font-size="11" font-weight="700" fill="#92400e">Unfocused</text>
                <text x="220" y="220" text-anchor="middle" font-size="24" font-weight="800" fill="#92400e">${tipeDist.Unfocused}</text>
                <text x="80" y="245" text-anchor="middle" font-size="9" fill="#64748b">Komitmen R</text>
                <text x="220" y="245" text-anchor="middle" font-size="9" fill="#64748b">Komitmen T</text>
                <text x="80" y="125" text-anchor="middle" font-size="9" fill="#64748b">Abstraksi T</text>
                <text x="80" y="265" text-anchor="middle" font-size="9" fill="#64748b">Abstraksi R</text>
                <text x="220" y="125" text-anchor="middle" font-size="9" fill="#64748b">Abstraksi T</text>
                <text x="220" y="265" text-anchor="middle" font-size="9" fill="#64748b">Abstraksi R</text>
              </svg>
              <div style="text-align:center;font-size:.75rem;color:var(--slate-500);margin-top:.75rem">
                ${sudahDinilai} dari ${totalGuru} guru sudah dinilai
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-header">${Icons.svg('bar-chart-3', 18)} Sesi per Sekolah</div>
            <div class="card-body">
              ${perSekolah.slice(0, 6).map(x => `
                <div style="display:flex;align-items:center;gap:.65rem;margin-bottom:.5rem;font-size:.85rem">
                  <div style="width:120px;color:var(--slate-700);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${Utils.esc(x.nama)}</div>
                  <div style="flex:1;height:8px;background:var(--slate-100);border-radius:999px;overflow:hidden"><div style="height:100%;width:${Math.round(x.sesi / maxSesi * 100)}%;background:var(--brand-500);border-radius:999px"></div></div>
                  <div style="width:26px;font-weight:600;text-align:right">${x.sesi}</div>
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

  _pendingKlaimHtml() {
    if (!this._pendingKlaimData || this._pendingKlaimData.length === 0) return '';
    const count = this._pendingKlaimData.length;
    return `<div class="card" style="border-left:3px solid var(--warning);margin-bottom:1rem">
      <div class="card-body" style="padding:1rem 1.25rem">
        <div style="display:flex;gap:.75rem;align-items:center;flex-wrap:wrap">
          <span style="color:var(--warning)">${Icons.svg('clock', 28)}</span>
          <div style="flex:1;min-width:200px">
            <div style="font-weight:600;font-size:.9rem">${count} Sekolah Menunggu Konfirmasi KS</div>
            <div style="font-size:.8rem;color:var(--slate-600);margin-top:.15rem">Sekolah ini sudah Anda klaim, tapi KS belum konfirmasi.</div>
          </div>
          <button class="btn btn-primary" id="btnLihatPending">Lihat Daftar →</button>
        </div>
      </div>
    </div>`;
  },

  async _loadPendingKlaim() {
    try {
      const myNip = Store.config().nip_pengawas;
      if (!myNip) return;
      if (!Supabase.isReady()) return;
      const data = await Supabase.getPendingKlaimByNip(myNip);
      if (data && data.length > 0) {
        this._pendingKlaimData = data;
        Router.navigate('dashboard');
      }
    } catch (err) {
      console.error('Gagal cek pending klaim:', err);
    }
  },

  async bind() {
    const goImport = async () => {
      const { Sekolah } = await import('./sekolah.js');
      Sekolah.startImportJSON();
    };
    Utils.el('btnImport')?.addEventListener('click', goImport);
    Utils.el('btnEmptyImport')?.addEventListener('click', goImport);

    Utils.el('btnLihatPending')?.addEventListener('click', () => Router.navigate('sekolah'));

    // Load pending klaim otomatis (background, tidak block)
    this._loadPendingKlaim();
  }
};
