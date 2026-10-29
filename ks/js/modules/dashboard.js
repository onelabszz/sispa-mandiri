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

const pengawasWidget = () => {
  const cfg = Store.config();
  const lastCheck = cfg.pengawas_last_check;

  if (!lastCheck) {
    return `<div class="card" style="margin-bottom:1rem">
      <div class="card-body">
        <div style="display:flex;gap:.75rem;align-items:center">
          <div style="width:52px;height:52px;border-radius:12px;background:var(--slate-100);color:var(--slate-500);display:flex;align-items:center;justify-content:center;flex-shrink:0">
            ${Icons.svg('user-plus', 26)}
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-weight:600;font-size:.9rem">Cek Pengawas Pembina</div>
            <div style="font-size:.8rem;color:var(--slate-500);margin-top:.15rem">Klik untuk memeriksa apakah pengawas sudah mengklaim sekolah Anda.</div>
          </div>
          <button class="btn btn-primary" id="btnCekPengawas">
            ${Icons.svg('refresh-cw', 16)} Cek
          </button>
        </div>
      </div>
    </div>`;
  }

  if (cfg.pengawas_status === 'confirmed' && cfg.pengawas_nip) {
    return `<div class="card" style="margin-bottom:1rem;border-left:3px solid var(--success)">
      <div class="card-body">
        <div style="display:flex;gap:.75rem;align-items:center;flex-wrap:wrap">
          <div style="width:52px;height:52px;border-radius:12px;background:#dcfce7;color:#166534;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            ${Icons.svg('user-check', 26)}
          </div>
          <div style="flex:1;min-width:150px">
            <div style="font-size:.7rem;color:var(--success);font-weight:600;text-transform:uppercase;letter-spacing:.03em">✓ Pengawas Terkonfirmasi</div>
            <div style="font-weight:700;font-size:1rem;margin-top:.15rem">${Utils.esc(cfg.pengawas_nama || '—')}</div>
            <div style="font-size:.75rem;color:var(--slate-500);margin-top:.15rem">${Utils.esc(cfg.pengawas_wilayah || '')} · NIP ${Utils.esc(cfg.pengawas_nip)}</div>
          </div>
          <button class="btn btn-secondary" id="btnCekPengawas" title="Periksa apakah pengawas berubah">
            ${Icons.svg('refresh-cw', 14)} Cek Ulang
          </button>
        </div>
        <div style="font-size:.7rem;color:var(--slate-400);margin-top:.65rem;padding-top:.65rem;border-top:1px solid var(--slate-100)">
          Terakhir dicek: ${Utils.relTime(lastCheck)}
        </div>
      </div>
    </div>`;
  }

  return `<div class="card" style="margin-bottom:1rem">
    <div class="card-body">
      <div style="display:flex;gap:.75rem;align-items:center;flex-wrap:wrap">
        <div style="width:52px;height:52px;border-radius:12px;background:var(--slate-100);color:var(--slate-500);display:flex;align-items:center;justify-content:center;flex-shrink:0">
          ${Icons.svg('user-x', 26)}
        </div>
        <div style="flex:1;min-width:150px">
          <div style="font-weight:600;font-size:.9rem">Belum Ada Pengawas Pembina</div>
          <div style="font-size:.8rem;color:var(--slate-500);margin-top:.15rem">Pengawas belum mengklaim sekolah Anda. Hubungi Dinas atau klik cek lagi nanti.</div>
        </div>
        <button class="btn btn-primary" id="btnCekPengawas">
          ${Icons.svg('refresh-cw', 16)} Cek Ulang
        </button>
      </div>
      <div style="font-size:.7rem;color:var(--slate-400);margin-top:.65rem;padding-top:.65rem;border-top:1px solid var(--slate-100)">
        Terakhir dicek: ${Utils.relTime(lastCheck)}
      </div>
    </div>
  </div>`;
};

const papanSupervisi = () => {
  const guru = Store.get('guru');
  const sup = Store.get('supervisi');
  const akad = Store.get('akademik');
  const coach = Store.get('coaching');
  const pm = Store.get('supervisiPM') || [];
  const total = guru.length;

  if (total === 0) return '';

  const supGuru = new Set(sup.map(s => s.gid));
  const akadGuru = new Set(akad.map(s => s.gid));
  const coachGuru = new Set(coach.map(s => s.gid));
  const pmGuru = new Set(pm.map(s => s.gid));
  const combined = new Set([...supGuru, ...akadGuru, ...coachGuru, ...pmGuru]);
  const belumSamaSekali = guru.filter(g => !combined.has(g.id)).length;

  const pct = (n) => Math.round((n / total) * 100);
  const color = (p) => p >= 80 ? 'var(--success)' : p >= 50 ? 'var(--warning)' : 'var(--danger)';

  const row = (tab, label, count) => {
    const p = pct(count);
    const c = color(p);
    return `<div class="papan-row" data-tab="${tab}" style="padding:.7rem;border-radius:8px;cursor:pointer;transition:background .15s;margin-bottom:.5rem">
      <div style="display:flex;justify-content:space-between;margin-bottom:.35rem;font-size:.85rem">
        <span style="font-weight:600;color:var(--slate-800)">${label}</span>
        <span style="color:${c};font-weight:600"><strong>${count}/${total}</strong> (${p}%)</span>
      </div>
      <div style="height:8px;background:var(--slate-100);border-radius:999px;overflow:hidden">
        <div style="height:100%;width:${p}%;background:${c};border-radius:999px;transition:width .3s"></div>
      </div>
    </div>`;
  };

  return `<div class="card" style="margin-bottom:1.5rem">
    <div class="card-header">
      <span>${Icons.svg('target', 18)} Papan Supervisi</span>
      <button class="btn btn-secondary btn-sm" id="btnKelolaPapan">Kelola →</button>
    </div>
    <div class="card-body">
      ${row('supervisi', 'Supervisi 3 Tahap', supGuru.size)}
      ${row('supervisi_pm', 'Supervisi PM', pmGuru.size)}
      ${row('akademik', 'Supervisi Digitalisasi', akadGuru.size)}
      ${row('coaching', 'Coaching Digitalisasi', coachGuru.size)}
      ${belumSamaSekali > 0 ? `
        <div style="margin-top:.75rem;padding:.75rem;background:#fef3c7;border-radius:8px;display:flex;align-items:center;justify-content:space-between;gap:.5rem;flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:.5rem;color:#92400e;font-size:.85rem">
            ${Icons.svg('alert-triangle', 18)}
            <span><strong>${belumSamaSekali} guru</strong> belum pernah disupervisi</span>
          </div>
          <button class="btn btn-secondary btn-sm" id="btnLihatBelum">Lihat</button>
        </div>
      ` : `
        <div style="margin-top:.75rem;padding:.75rem;background:#dcfce7;border-radius:8px;display:flex;align-items:center;gap:.5rem;color:#166534;font-size:.85rem">
          ${Icons.svg('check-circle', 18)}
          <span><strong>Semua guru</strong> sudah pernah disupervisi</span>
        </div>
      `}
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
    const supBerjalan = sup.filter(s => s.status !== 'selesai').length;

    const tipeDist = { Dropout: 0, Unfocused: 0, Analytical: 0, Professional: 0 };
    guru.forEach(g => { if (g.tipe && tipeDist[g.tipe] !== undefined) tipeDist[g.tipe]++; });

    const recent = [...akad.slice(-3).map(x => ({ ...x, type: 'Akademik' })),
                    ...coach.slice(-3).map(x => ({ ...x, type: 'Coaching' })),
                    ...sup.slice(-3).map(x => ({ ...x, type: '3 Tahap' }))]
      .sort((a, b) => (b.tgl || '').localeCompare(a.tgl || ''))
      .slice(0, 5);

    const perhatian = [];
    if (guru.length === 0) {
      perhatian.push({ icon: 'users', text: 'Belum ada data guru. Tambahkan guru terlebih dahulu.', href: 'guru', color: 'var(--brand-600)' });
    } else if (belumDinilai > 0) {
      perhatian.push({ icon: 'target', text: `${belumDinilai} guru belum dinilai tipe profilnya.`, href: 'profil', color: 'var(--warning)' });
    }
    if (supBerjalan > 0) {
      perhatian.push({ icon: 'clipboard-list', text: `${supBerjalan} supervisi 3T belum diselesaikan.`, href: 'supervisi', color: 'var(--brand-600)' });
    }

    return `
      ${backupBanner()}

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

      ${pengawasWidget()}

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

      ${papanSupervisi()}

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

      ${guru.length > 0 ? `<div class="card">
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
      </div>` : ''}

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
        data.version = '2.1.0';
        data.app = 'sispa-standalone';
        data.schema_flags = { supervisiPM: true };
        data.exported_at = new Date().toISOString();
        Utils.downloadJSON(data, `SISPA_Backup_${new Date().toISOString().slice(0, 10)}.json`);
        localStorage.setItem('sispa_last_export', new Date().toISOString());
        Utils.toast('Backup diekspor', 'success');
        const { Router } = await import('../../../shared/js/router.js');
        Router.navigate('dashboard');
      };
    }

    Utils.el('btnAddGuru')?.addEventListener('click', () => Router.navigate('guru'));
    Utils.el('btnCekPengawas')?.addEventListener('click', () => { if (window.App?.cekpengawas) window.App.cekpengawas(); });
    Utils.el('btnKelolaPapan')?.addEventListener('click', () => Router.navigate('supervisi'));

    // Progress bar rows → navigate ke tab masing-masing
    document.querySelectorAll('.papan-row').forEach(row => {
      row.onclick = () => Router.navigate(row.dataset.tab);
      row.addEventListener('mouseenter', () => { row.style.background = 'var(--slate-50)'; });
      row.addEventListener('mouseleave', () => { row.style.background = 'transparent'; });
    });

    // Lihat guru belum disupervisi
    Utils.el('btnLihatBelum')?.addEventListener('click', () => {
      const guru = Store.get('guru');
      const sup = Store.get('supervisi');
      const akad = Store.get('akademik');
      const coach = Store.get('coaching');
      const pm = Store.get('supervisiPM') || [];
      const combined = new Set([...sup.map(s => s.gid), ...akad.map(s => s.gid), ...coach.map(s => s.gid), ...pm.map(s => s.gid)]);
      const belum = guru.filter(g => !combined.has(g.id));

      Utils.modal(`${belum.length} Guru Belum Disupervisi`, `
        <div style="border:1px solid var(--slate-200);border-radius:8px;max-height:400px;overflow-y:auto">
          ${belum.map((g, i) => `
            <div style="padding:.6rem .85rem;border-bottom:1px solid var(--slate-100);font-size:.85rem;${i === belum.length-1 ? 'border-bottom:none' : ''}">
              <div style="font-weight:600">${Utils.esc(g.nama)}</div>
              <div style="font-size:.75rem;color:var(--slate-500)">${Utils.esc(g.mapel || '—')}${g.kelas ? ' · Kls ' + Utils.esc(g.kelas) : ''}${g.tipe ? ` · <span class="badge badge-info" style="font-size:.6rem">${g.tipe}</span>` : ''}</div>
            </div>
          `).join('')}
        </div>
        <div style="margin-top:.75rem;font-size:.8rem;color:var(--slate-500)">Buka menu Supervisi 3T, Akademik, atau Coaching untuk mulai supervisi guru-guru ini.</div>
      `, '<button class="btn btn-secondary" onclick="Utils.closeModal()">Tutup</button>');
    });
  }
};
