import { Store } from '../../storage.js';
import { Utils } from '../../../shared/js/utils.js';
import { Icons } from '../../../shared/js/icons.js';
import { emptyState, metricsSekolah, rankBadge } from '../helpers.js';

export const Evaluasi = {
  async render() {
    const sekolah = Store.get('sekolah');
    if (sekolah.length === 0) {
      return `<div class="card"><div class="card-body">
        ${emptyState('award', 'Belum ada data', 'Import JSON dari KS terlebih dahulu.')}
      </div></div>`;
    }
    const ranked = sekolah.map(sk => ({ sk, m: metricsSekolah(sk) })).sort((a, b) => b.m.score - a.m.score);
    const avgCoverage = Math.round(sekolah.reduce((s, sk) => s + metricsSekolah(sk).coverage, 0) / sekolah.length);
    const avgScore = Math.round(ranked.reduce((s, x) => s + x.m.score, 0) / ranked.length);
    const topKat = ranked.filter(r => r.m.score >= 85).length;
    const botKat = ranked.filter(r => r.m.score < 50).length;

    return `
      <div class="page-head">
        <div>
          <h2>Evaluasi Kinerja KS</h2>
          <div class="page-sub">Ranking berdasarkan 3 metrik weighted</div>
        </div>
      </div>

      <div class="grid-auto" style="margin-bottom:1.5rem">
        <div class="stat-card">
          <div class="stat-icon" style="background:linear-gradient(135deg,#e0e7ff,#c7d2fe);color:#4338ca">${Icons.svg('school', 22)}</div>
          <div><div style="font-size:.75rem;color:var(--slate-500)">Sekolah Dinilai</div><div style="font-size:1.5rem;font-weight:700">${sekolah.length}</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:linear-gradient(135deg,#dcfce7,#bbf7d0);color:#166534">${Icons.svg('percent', 22)}</div>
          <div><div style="font-size:.75rem;color:var(--slate-500)">Rata-rata Coverage</div><div style="font-size:1.5rem;font-weight:700">${avgCoverage}%</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:linear-gradient(135deg,#fef3c7,#fde68a);color:#92400e">${Icons.svg('award', 22)}</div>
          <div><div style="font-size:.75rem;color:var(--slate-500)">Rata-rata Skor</div><div style="font-size:1.5rem;font-weight:700">${avgScore}</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:linear-gradient(135deg,#fecaca,#fca5a5);color:#991b1b">${Icons.svg('alert-triangle', 22)}</div>
          <div><div style="font-size:.75rem;color:var(--slate-500)">Perlu Pembinaan</div><div style="font-size:1.5rem;font-weight:700">${botKat}</div></div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">${Icons.svg('award', 18)} Ranking Kinerja</div>
        <div class="card-body" style="padding:0">
          <table>
            <thead><tr>
              <th style="width:50px;text-align:center">#</th>
              <th>Sekolah / KS</th>
              <th style="text-align:center">Coverage <span style="font-weight:400;color:var(--slate-400);font-size:.7rem">40%</span></th>
              <th style="text-align:center">Volume <span style="font-weight:400;color:var(--slate-400);font-size:.7rem">30%</span></th>
              <th style="text-align:center">Kelengkapan RTL <span style="font-weight:400;color:var(--slate-400);font-size:.7rem">30%</span></th>
              <th style="text-align:center">Skor</th>
              <th style="text-align:center">Kategori</th>
            </tr></thead>
            <tbody>${ranked.map((r, i) => {
              const m = r.m;
              return `<tr>
                <td style="text-align:center">${rankBadge(i + 1)}</td>
                <td>
                  <div style="font-weight:600">${Utils.esc(r.sk.nama_sekolah)}</div>
                  <div style="font-size:.75rem;color:var(--slate-500)">${Utils.esc(r.sk.ks_nama || '—')}</div>
                </td>
                <td style="text-align:center"><strong>${m.coverage}%</strong><div style="font-size:.7rem;color:var(--slate-400)">${m.totalGuru} guru</div></td>
                <td style="text-align:center"><strong>${m.volumeRaw}</strong><div style="font-size:.7rem;color:var(--slate-400)">sesi/guru (${m.totalSesi})</div></td>
                <td style="text-align:center"><strong>${m.kelengkapan}%</strong></td>
                <td style="text-align:center"><strong style="font-size:1.1rem;color:var(--${m.katClass === 'success' ? 'success' : m.katClass === 'info' ? 'info' : m.katClass === 'warning' ? 'warning' : 'danger'})">${m.score}</strong></td>
                <td style="text-align:center"><span class="badge badge-${m.katClass}">${m.kategori}</span></td>
              </tr>`;
            }).join('')}</tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-header">${Icons.svg('file-text', 18)} Detail & Rekomendasi</div>
        <div class="card-body" style="padding:0">
          ${ranked.map(r => {
            const m = r.m;
            const reko = m.score >= 85
              ? 'Pertahankan kinerja. Bagikan praktik baik ke sekolah lain.'
              : m.score >= 70
              ? 'Kinerja baik. Tingkatkan kelengkapan dokumentasi & jangkauan guru.'
              : m.score >= 50
              ? 'Perlu peningkatan: ' + (m.coverage < 70 ? 'jadwalkan supervisi guru yang belum.' : m.kelengkapan < 70 ? 'lengkapi RTL setiap sesi.' : 'tingkatkan frekuensi supervisi.')
              : 'Prioritas pembinaan: ' + (m.coverage < 40 ? 'coverage sangat rendah — banyak guru belum disupervisi.' : 'kelengkapan dokumentasi sangat rendah.');
            return `<div style="padding:.85rem 1.25rem;border-bottom:1px solid var(--slate-100)">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:.5rem;margin-bottom:.35rem;flex-wrap:wrap">
                <div><strong>${Utils.esc(r.sk.nama_sekolah)}</strong><span style="color:var(--slate-500);font-size:.85rem"> — ${Utils.esc(r.sk.ks_nama || '—')}</span></div>
                <span class="badge badge-${m.katClass}">${m.kategori} · ${m.score}</span>
              </div>
              <div style="font-size:.8rem;color:var(--slate-600);line-height:1.5">${reko}</div>
              <div style="font-size:.75rem;color:var(--slate-400);margin-top:.35rem">
                ${m.totalSup3} Supervisi 3T · ${m.totalAkad} Akademik · ${m.totalCo} Coaching
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
    `;
  },

  async bind() {}
};
