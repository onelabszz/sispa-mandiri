import { Store } from '../../storage.js';
import { Utils } from '../../../shared/js/utils.js';
import { Icons } from '../../../shared/js/icons.js';
import { Router } from '../../../shared/js/router.js';
import { Supabase } from '../../../shared/js/supabase.js';
import { allGuru, allSesi, guruBySekolah, emptyState, infoBanner } from '../helpers.js';

export const Dashboard = {
  _pendingKlaimData: null,
  _syncing: false,

  async render() {
    const sekolah = Store.get('sekolah');
    const guru = allGuru();
    const sesi = allSesi();
    const totalGuru = guru.length;
    const totalSesi = sesi.length;

    // Breakdown per jenis (untuk sub-text di Total Sesi card)
    const total3T = sekolah.reduce((s, sk) => s + (sk.supervisi || []).length, 0);
    const totalPM = sekolah.reduce((s, sk) => s + (sk.supervisiPM || []).length, 0);
    const totalAkad = sekolah.reduce((s, sk) => s + (sk.akademik || []).length, 0);
    const totalCoach = sekolah.reduce((s, sk) => s + (sk.coaching || []).length, 0);

    const confirmed = sekolah.filter(sk => sk.pengawas_status === 'confirmed');
    const pending = sekolah.filter(sk => sk.pengawas_status === 'pending');

    // Belum ada data — include PM
    const belumAdaData = confirmed.filter(sk => 
      (sk.guru || []).length === 0 
      && (sk.supervisi || []).length === 0
      && (sk.supervisiPM || []).length === 0
      && (sk.akademik || []).length === 0
      && (sk.coaching || []).length === 0
    );

    const tipeDist = { Dropout: 0, Unfocused: 0, Analytical: 0, Professional: 0 };
    guru.forEach(g => { if (g.tipe && tipeDist[g.tipe] !== undefined) tipeDist[g.tipe]++; });
    const sudahDinilai = guru.filter(g => g.tipe).length;

    // Per sekolah — include PM
    const perSekolah = sekolah.map(sk => ({
      id: sk.id, nama: sk.nama_sekolah,
      sesi: (sk.supervisi || []).length
          + (sk.supervisiPM || []).length
          + (sk.akademik || []).length
          + (sk.coaching || []).length
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
          <div class="page-sub">${confirmed.length} sekolah binaan (${pending.length} pending) · ${totalGuru} guru · ${totalSesi} sesi</div>
        </div>
        <div style="display:flex;gap:.5rem">
          <button class="btn btn-secondary" id="btnSync" title="Sinkron dari database Dinas">
            ${Icons.svg('refresh-cw', 16)} Sync Dabin
          </button>
          <button class="btn btn-primary" id="btnImport">${Icons.svg('upload', 16)} Import JSON</button>
        </div>
      </div>

      <div class="grid-auto" style="margin-bottom:1.5rem">
        <div class="stat-card">
          <div class="stat-icon" style="background:linear-gradient(135deg,#e0e7ff,#c7d2fe);color:#4338ca">${Icons.svg('school', 22)}</div>
          <div>
            <div style="font-size:.75rem;color:var(--slate-500)">Sekolah Binaan</div>
            <div style="font-size:1.5rem;font-weight:700">${confirmed.length}</div>
            ${pending.length > 0 ? `<div style="font-size:.7rem;color:var(--warning);margin-top:.15rem">+${pending.length} pending</div>` : ''}
          </div>
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
          <div>
            <div style="font-size:.75rem;color:var(--slate-500)">Total Sesi</div>
            <div style="font-size:1.5rem;font-weight:700">${totalSesi}</div>
            <div style="font-size:.65rem;color:var(--slate-500);margin-top:.2rem">3T: ${total3T} · PM: ${totalPM} · Akad: ${totalAkad} · Coach: ${totalCoach}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:linear-gradient(135deg,#fce7f3,#fbcfe8);color:#9d174d">${Icons.svg('book-open-check', 22)}</div>
          <div>
            <div style="font-size:.75rem;color:var(--slate-500)">Supervisi PM</div>
            <div style="font-size:1.5rem;font-weight:700">${totalPM}</div>
            <div style="font-size:.65rem;color:var(--slate-500);margin-top:.2rem">Telaah RPP + Obs + Refleksi</div>
          </div>
        </div>
      </div>

      ${this._pendingKlaimHtml()}

      ${belumAdaData.length > 0 ? `
        <div class="card" style="border-left:3px solid var(--info);margin-bottom:1rem">
          <div class="card-body" style="padding:1rem 1.25rem">
            <div style="display:flex;gap:.75rem;align-items:center;flex-wrap:wrap">
              <span style="color:var(--info)">${Icons.svg('clock', 28)}</span>
              <div style="flex:1;min-width:200px">
                <div style="font-weight:600;font-size:.9rem">${belumAdaData.length} Sekolah Belum Ada Data</div>
                <div style="font-size:.8rem;color:var(--slate-600);margin-top:.15rem">Klaim sudah dikonfirmasi KS, tapi file JSON belum diterima.</div>
              </div>
              <button class="btn btn-secondary" id="btnLihatBelumData">Lihat Daftar →</button>
            </div>
          </div>
        </div>
      ` : ''}

      ${stale.length > 0 ? `
        <div class="card" style="border-left:3px solid var(--warning);margin-bottom:1rem">
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
          'Klik "Sync Dabin" untuk menarik data dari Dinas, atau "Import JSON" jika KS sudah kirim file.',
          `<div style="display:flex;gap:.5rem;justify-content:center;margin-top:1rem">
            <button class="btn btn-secondary" id="btnEmptySync">${Icons.svg('refresh-cw', 16)} Sync Dabin</button>
            <button class="btn btn-primary" id="btnEmptyImport">${Icons.svg('upload', 16)} Import JSON</button>
          </div>`)}
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
              const badge = x._jenis === 'Akademik' ? 'info'
                : x._jenis === 'Coaching' ? 'warning'
                : x._jenis === 'Supervisi PM' ? 'success'
                : 'neutral';
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

  async syncDabin(silent = false) {
    const myNip = Store.config().nip_pengawas;
    if (!myNip) return;
    if (!Supabase.isReady()) {
      if (!silent) Utils.toast('Butuh internet untuk sinkronisasi', 'error');
      return;
    }
    if (this._syncing) return;
    this._syncing = true;

    try {
      const allSchools = await Supabase.getAllSekolah();
      const mySchools = allSchools.filter(s => s.pengawas_nip === myNip);
      
      const local = Store.get('sekolah');
      const localNpsns = new Set(local.map(s => s.npsn));
      
      const missing = mySchools.filter(s => !localNpsns.has(s.npsn));
      let added = 0;
      const newSk = missing.map(s => {
        added++;
        return {
          id: Utils.uid(),
          npsn: s.npsn,
          nama_sekolah: s.nama_sekolah,
          ks_nama: '', ks_nip: '',
          pengawas_status: s.pengawas_status || 'pending',
          imported_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          guru: [], program: [], supervisi: [], supervisiPM: [], akademik: [], coaching: []
        };
      });
      
      let updated = 0;
      local.forEach(sk => {
        const remote = mySchools.find(s => s.npsn === sk.npsn);
        if (remote && remote.pengawas_status !== sk.pengawas_status) {
          sk.pengawas_status = remote.pengawas_status;
          updated++;
        }
      });
      
      const unclaimed = local.filter(sk => 
        sk.pengawas_status && !mySchools.find(s => s.npsn === sk.npsn)
      );
      unclaimed.forEach(sk => {
        sk.pengawas_status = null;
        updated++;
      });
      
      if (added > 0 || updated > 0) {
        await Store.set('sekolah', [...local, ...newSk]);
      }
      
      this._pendingKlaimData = mySchools
        .filter(s => s.pengawas_status === 'pending')
        .map(s => ({ npsn: s.npsn, nama_sekolah: s.nama_sekolah, pengawas_status: 'pending' }));
      
      if (!silent) {
        const msg = [];
        if (added > 0) msg.push(`${added} sekolah baru`);
        if (updated > 0) msg.push(`${updated} status diperbarui`);
        Utils.toast(msg.length ? `Sync berhasil: ${msg.join(', ')}` : 'Semua data sudah sinkron', 'success');
        Router.navigate('dashboard');
      } else {
        if (added > 0 || updated > 0) {
          Router.navigate('dashboard');
        }
      }
    } catch (err) {
      if (!silent) Utils.toast('Gagal sync: ' + err.message, 'error');
      console.error('Sync error:', err);
    } finally {
      this._syncing = false;
    }
  },

  async bind() {
    Utils.el('btnSync')?.addEventListener('click', () => this.syncDabin());
    Utils.el('btnEmptySync')?.addEventListener('click', () => this.syncDabin());
    
    const goImport = async () => {
      const { Sekolah } = await import('./sekolah.js');
      Sekolah.startImportJSON();
    };
    Utils.el('btnImport')?.addEventListener('click', goImport);
    Utils.el('btnEmptyImport')?.addEventListener('click', goImport);

    Utils.el('btnLihatPending')?.addEventListener('click', async () => {
      const { Sekolah } = await import('./sekolah.js');
      if (Sekolah._setFilter) Sekolah._setFilter('pending');
      Router.navigate('sekolah');
    });

    Utils.el('btnLihatBelumData')?.addEventListener('click', async () => {
      const { Sekolah } = await import('./sekolah.js');
      if (Sekolah._setFilter) Sekolah._setFilter('nodata');
      Router.navigate('sekolah');
    });

    setTimeout(() => this.syncDabin(true), 500);
  }
};
