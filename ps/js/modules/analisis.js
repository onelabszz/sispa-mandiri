import { Store } from '../../storage.js';
import { Icons } from '../../../shared/js/icons.js';
import { emptyState, metricsSekolah } from '../helpers.js';
import { DPL_LABELS } from '../../../shared/js/constants.js';

window.__DPL_LABELS = DPL_LABELS;

export const Analisis = {
  async render() {
    const sekolah = Store.get('sekolah');
    if (sekolah.length === 0) {
      return `<div class="card"><div class="card-body">
        ${emptyState('bar-chart-3', 'Belum ada data', 'Import JSON dari KS terlebih dahulu.')}
      </div></div>`;
    }
    const allSup3 = sekolah.flatMap(sk => sk.supervisi || []);
    const pC = { berkesadaran: 0, bermakna: 0, menggembirakan: 0 };
    allSup3.forEach(s => { if (s.prinsip_pm) Object.keys(pC).forEach(k => { if (s.prinsip_pm[k]) pC[k]++; }); });
    const gC = { memahami: 0, mengaplikasi: 0, merefleksi: 0 };
    allSup3.forEach(s => { if (s.pengalaman) Object.keys(gC).forEach(k => { if (s.pengalaman[k]) gC[k]++; }); });
    const dC = Array(8).fill(0);
    allSup3.forEach(s => { (s.dpl || []).forEach(n => { if (n >= 1 && n <= 8) dC[n - 1]++; }); });
    const maxP = Math.max(...Object.values(pC), 1);
    const maxG = Math.max(...Object.values(gC), 1);
    const maxD = Math.max(...dC, 1);
    const withKKA = allSup3.filter(s => s.kka && String(s.kka).trim()).length;
    const pctKKA = allSup3.length > 0 ? Math.round(withKKA / allSup3.length * 100) : 0;

    return `
      <div class="page-head">
        <div>
          <h2>Analisis & Benchmark</h2>
          <div class="page-sub">Agregat dari ${sekolah.length} sekolah</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">${Icons.svg('percent', 18)} Coverage Supervisi per Sekolah</div>
        <div class="card-body">
          ${sekolah.map(sk => {
            const m = metricsSekolah(sk);
            const color = m.coverage >= 80 ? 'var(--success)' : m.coverage >= 50 ? 'var(--warning)' : 'var(--danger)';
            return `<div class="metric-row">
              <div class="metric-label" style="width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${sk.nama_sekolah}</div>
              <div class="metric-bar"><div class="metric-fill" style="width:${m.coverage}%;background:${color}"></div></div>
              <div class="metric-value" style="color:${color}">${m.coverage}%</div>
              <div style="width:60px;font-size:.7rem;color:var(--slate-500);text-align:right">${m.totalGuru} guru</div>
            </div>`;
          }).join('')}
          <div style="font-size:.75rem;color:var(--slate-500);margin-top:.75rem;padding-top:.75rem;border-top:1px solid var(--slate-100)">
            Coverage = % guru yang sudah ≥1× disupervisi
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">${Icons.svg('bar-chart-3', 18)} Rata-rata Skor per Sekolah</div>
        <div class="card-body" style="padding:0">
          <table>
            <thead><tr>
              <th>Sekolah</th>
              <th style="text-align:center">Guru</th>
              <th style="text-align:center">Sesi</th>
              <th style="text-align:center">Coverage</th>
              <th style="text-align:center">Avg Akademik</th>
              <th style="text-align:center">Avg Coaching</th>
            </tr></thead>
            <tbody>${sekolah.map(sk => {
              const m = metricsSekolah(sk);
              const akTxt = m.avgAk !== null ? `${m.avgAk}<span style="color:var(--slate-400);font-size:.7rem">/76</span> <span style="color:var(--slate-400);font-size:.7rem">(${m.totalAkad})</span>` : '<span style="color:var(--slate-400)">—</span>';
              const coTxt = m.avgCo !== null ? `${m.avgCo}<span style="color:var(--slate-400);font-size:.7rem">/32</span> <span style="color:var(--slate-400);font-size:.7rem">(${m.totalCo})</span>` : '<span style="color:var(--slate-400)">—</span>';
              return `<tr>
                <td style="font-weight:600;font-size:.85rem">${sk.nama_sekolah}</td>
                <td style="text-align:center">${m.totalGuru}</td>
                <td style="text-align:center">${m.totalSesi}</td>
                <td style="text-align:center;font-weight:600;color:${m.coverage >= 80 ? 'var(--success)' : m.coverage >= 50 ? 'var(--warning)' : 'var(--danger)'}">${m.coverage}%</td>
                <td style="text-align:center;font-weight:600">${akTxt}</td>
                <td style="text-align:center;font-weight:600">${coTxt}</td>
              </tr>`;
            }).join('')}</tbody>
          </table>
        </div>
      </div>

      <div class="row">
        <div class="card">
          <div class="card-header">${Icons.svg('target', 18)} Prinsip PM (Agregat)</div>
          <div class="card-body">
            <div class="chart-wrap">
              <div class="chart-col"><div class="chart-bar" style="height:${Math.round(pC.berkesadaran / maxP * 100)}%;background:var(--brand-500)"></div><div class="chart-label">Berkesadaran<br><strong>${pC.berkesadaran}</strong></div></div>
              <div class="chart-col"><div class="chart-bar" style="height:${Math.round(pC.bermakna / maxP * 100)}%;background:#10b981"></div><div class="chart-label">Bermakna<br><strong>${pC.bermakna}</strong></div></div>
              <div class="chart-col"><div class="chart-bar" style="height:${Math.round(pC.menggembirakan / maxP * 100)}%;background:#f59e0b"></div><div class="chart-label">Menggembirakan<br><strong>${pC.menggembirakan}</strong></div></div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">${Icons.svg('graduation-cap', 18)} Pengalaman Belajar</div>
          <div class="card-body">
            <div class="chart-wrap">
              <div class="chart-col"><div class="chart-bar" style="height:${Math.round(gC.memahami / maxG * 100)}%;background:#0ea5e9"></div><div class="chart-label">Memahami<br><strong>${gC.memahami}</strong></div></div>
              <div class="chart-col"><div class="chart-bar" style="height:${Math.round(gC.mengaplikasi / maxG * 100)}%;background:#8b5cf6"></div><div class="chart-label">Mengaplikasi<br><strong>${gC.mengaplikasi}</strong></div></div>
              <div class="chart-col"><div class="chart-bar" style="height:${Math.round(gC.merefleksi / maxG * 100)}%;background:#ec4899"></div><div class="chart-label">Merefleksi<br><strong>${gC.merefleksi}</strong></div></div>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">${Icons.svg('layers', 18)} 8 Dimensi Profil Lulusan</div>
        <div class="card-body">
          ${DPL_LABELS.map((d, i) => `
            <div class="metric-row">
              <div class="metric-label">${i + 1}. ${d}</div>
              <div class="metric-bar"><div class="metric-fill" style="width:${Math.round(dC[i] / maxD * 100)}%;background:var(--brand-500)"></div></div>
              <div class="metric-value">${dC[i]}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-header">${Icons.svg('laptop', 18)} Integrasi KKA</div>
        <div class="card-body" style="display:flex;align-items:center;justify-content:center;gap:1.5rem;padding:1.5rem;flex-wrap:wrap">
          <svg width="140" height="140" viewBox="0 0 36 36">
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" stroke-width="4"/>
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#16a34a" stroke-width="4" stroke-dasharray="${pctKKA}, 100" stroke-linecap="round"/>
            <text x="18" y="18" text-anchor="middle" style="font-size:6px;font-weight:700;fill:#0f172a">${pctKKA}%</text>
            <text x="18" y="22.5" text-anchor="middle" style="font-size:2.5px;fill:#64748b">KKA</text>
          </svg>
          <div style="font-size:.85rem;color:var(--slate-600)">
            <strong>${withKKA}</strong> dari <strong>${allSup3.length}</strong> sesi 3T menyertakan KKA
          </div>
        </div>
      </div>
    `;
  },

  async bind() {}
};
