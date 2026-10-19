import { Store } from '../../storage.js';
import { Icons } from '../../../shared/js/icons.js';
import { DPL_LABELS } from '../../../shared/js/constants.js';
import { emptyState } from '../helpers.js';

export const Analisis = {
  async render() {
    const akad = Store.get('akademik');
    const sup = Store.get('supervisi');

    if (sup.length === 0 && akad.length === 0) {
      return `<div class="card"><div class="card-body">
        ${emptyState('bar-chart-3', 'Belum ada data', 'Analisis muncul setelah ada sesi supervisi.')}
      </div></div>`;
    }

    const pC = { berkesadaran: 0, bermakna: 0, menggembirakan: 0 };
    sup.forEach(s => { if (s.prinsip_pm) Object.keys(pC).forEach(k => { if (s.prinsip_pm[k]) pC[k]++; }); });
    const gC = { memahami: 0, mengaplikasi: 0, merefleksi: 0 };
    sup.forEach(s => { if (s.pengalaman) Object.keys(gC).forEach(k => { if (s.pengalaman[k]) gC[k]++; }); });
    const dC = Array(8).fill(0);
    sup.forEach(s => { (s.dpl || []).forEach(n => { if (n >= 1 && n <= 8) dC[n - 1]++; }); });
    const maxP = Math.max(...Object.values(pC), 1);
    const maxG = Math.max(...Object.values(gC), 1);
    const maxD = Math.max(...dC, 1);
    const withKKA = sup.filter(s => s.kka && String(s.kka).trim()).length;
    const pctKKA = sup.length > 0 ? Math.round(withKKA / sup.length * 100) : 0;

    return `
      <div class="page-head">
        <div>
          <h2>Analisis PM & KKA</h2>
          <div class="page-sub">Data dari ${sup.length} supervisi 3 tahap + ${akad.length} obs akademik</div>
        </div>
      </div>

      <div class="row" style="margin-bottom:1rem">
        <div class="card"><div class="card-header">${Icons.svg('bar-chart-3', 18)} Prinsip PM</div><div class="card-body">
          <div class="chart-wrap">
            <div class="chart-col">
              <div class="chart-bar" style="height:${Math.round(pC.berkesadaran / maxP * 100)}%;background:var(--brand-500)"></div>
              <div class="chart-label">Berkesadaran<br><strong>${pC.berkesadaran}</strong></div>
            </div>
            <div class="chart-col">
              <div class="chart-bar" style="height:${Math.round(pC.bermakna / maxP * 100)}%;background:#10b981"></div>
              <div class="chart-label">Bermakna<br><strong>${pC.bermakna}</strong></div>
            </div>
            <div class="chart-col">
              <div class="chart-bar" style="height:${Math.round(pC.menggembirakan / maxP * 100)}%;background:#f59e0b"></div>
              <div class="chart-label">Menggembirakan<br><strong>${pC.menggembirakan}</strong></div>
            </div>
          </div>
        </div></div>
        <div class="card"><div class="card-header">${Icons.svg('graduation-cap', 18)} Pengalaman Belajar</div><div class="card-body">
          <div class="chart-wrap">
            <div class="chart-col">
              <div class="chart-bar" style="height:${Math.round(gC.memahami / maxG * 100)}%;background:#0ea5e9"></div>
              <div class="chart-label">Memahami<br><strong>${gC.memahami}</strong></div>
            </div>
            <div class="chart-col">
              <div class="chart-bar" style="height:${Math.round(gC.mengaplikasi / maxG * 100)}%;background:#8b5cf6"></div>
              <div class="chart-label">Mengaplikasi<br><strong>${gC.mengaplikasi}</strong></div>
            </div>
            <div class="chart-col">
              <div class="chart-bar" style="height:${Math.round(gC.merefleksi / maxG * 100)}%;background:#ec4899"></div>
              <div class="chart-label">Merefleksi<br><strong>${gC.merefleksi}</strong></div>
            </div>
          </div>
        </div></div>
      </div>

      <div class="card"><div class="card-header">${Icons.svg('target', 18)} 8 Dimensi Profil Lulusan</div><div class="card-body">
        ${DPL_LABELS.map((d, i) => `
          <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.5rem">
            <div style="width:150px;font-size:.8rem;color:var(--slate-700)">${i + 1}. ${d}</div>
            <div style="flex:1;height:8px;background:var(--slate-100);border-radius:999px;overflow:hidden">
              <div style="height:100%;width:${Math.round(dC[i] / maxD * 100)}%;background:var(--brand-500);border-radius:999px"></div>
            </div>
            <div style="width:30px;font-size:.75rem;font-weight:600;text-align:right">${dC[i]}</div>
          </div>
        `).join('')}
      </div></div>

      <div class="card"><div class="card-header">${Icons.svg('laptop', 18)} Integrasi KKA</div><div class="card-body" style="display:flex;align-items:center;justify-content:center;padding:1.5rem;gap:1.5rem;flex-wrap:wrap">
        <svg width="140" height="140" viewBox="0 0 36 36">
          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" stroke-width="4"/>
          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#16a34a" stroke-width="4" stroke-dasharray="${pctKKA}, 100" stroke-linecap="round"/>
          <text x="18" y="18" text-anchor="middle" style="font-size:6px;font-weight:700;fill:#0f172a">${pctKKA}%</text>
          <text x="18" y="22.5" text-anchor="middle" style="font-size:2.5px;fill:#64748b">KKA</text>
        </svg>
        <div style="font-size:.85rem;color:var(--slate-600)"><strong>${withKKA}</strong> dari <strong>${sup.length}</strong> sesi 3T menyertakan KKA</div>
      </div></div>
    `;
  },

  async bind() {}
};
