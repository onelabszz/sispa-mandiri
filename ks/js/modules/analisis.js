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

    // 1. Hitung Data Prinsip & Pengalaman
    const pC = { berkesadaran: 0, bermakna: 0, menggembirakan: 0 };
    sup.forEach(s => { if (s.prinsip_pm) Object.keys(pC).forEach(k => { if (s.prinsip_pm[k]) pC[k]++; }); });
    const gC = { memahami: 0, mengaplikasi: 0, merefleksi: 0 };
    sup.forEach(s => { if (s.pengalaman) Object.keys(gC).forEach(k => { if (s.pengalaman[k]) gC[k]++; }); });
    
    // 2. Hitung Data DPL
    const dC = Array(8).fill(0);
    sup.forEach(s => { (s.dpl || []).forEach(n => { if (n >= 1 && n <= 8) dC[n - 1]++; }); });
    const maxD = Math.max(...dC, 1);

    // 3. Hitung KKA
    const withKKA = sup.filter(s => s.kka && String(s.kka).trim()).length;
    const pctKKA = sup.length > 0 ? Math.round(withKKA / sup.length * 100) : 0;

    // 4. Hitung Insight Otomatis
    const insights = [];
    const prinsipMax = Object.keys(pC).reduce((a, b) => pC[a] > pC[b] ? a : b);
    const prinsipMin = Object.keys(pC).reduce((a, b) => pC[a] < pC[b] ? a : b);
    const pctMax = Math.round((pC[prinsipMax] / sup.length) * 100);
    const pctMin = Math.round((pC[prinsipMin] / sup.length) * 100);

    if (pctMax >= 70) {
      insights.push({ type: 'success', text: `Prinsip <strong>${prinsipMax}</strong> konsisten diterapkan dalam <strong>${pctMax}%</strong> sesi.` });
    }
    if (pctMin < 40 && sup.length > 0) {
      insights.push({ type: 'warning', text: `Prinsip <strong>${prinsipMin}</strong> paling jarang diterapkan (<strong>${pctMin}%</strong>). Area ini bisa jadi fokus pengembangan berikutnya.` });
    }
    if (pctKKA < 30 && sup.length > 0) {
      insights.push({ type: 'info', text: `Integrasi KKA baru mencapai <strong>${pctKKA}%</strong>. Target ideal adalah lebih dari 50%.` });
    }

    // 5. Hitung Tren 12 Bulan (SVG Line Chart)
    const bulanLabels = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
    const currentYear = new Date().getFullYear();
    const trendData = Array(12).fill(0);
    
    [...sup, ...akad].forEach(s => {
      if (!s.tgl) return;
      const d = new Date(s.tgl);
      if (d.getFullYear() === currentYear) {
        trendData[d.getMonth()]++;
      }
    });
    
    const maxTrend = Math.max(...trendData, 1);
    const svgPoints = trendData.map((val, i) => {
      const x = (i / 11) * 300;
      const y = 100 - (val / maxTrend) * 100;
      return `${x},${y}`;
    }).join(' ');

    return `
      <div class="page-head">
        <div>
          <h2>Analisis PM & KKA</h2>
          <div class="page-sub">Data dari ${sup.length} supervisi 3 tahap + ${akad.length} obs akademik</div>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="grid-auto" style="margin-bottom:1.5rem">
        <div class="stat-card">
          <div class="stat-icon" style="background:#e0e7ff;color:#4338ca">${Icons.svg('clipboard-list', 22)}</div>
          <div><div style="font-size:.75rem;color:var(--slate-500)">Total Sesi</div><div style="font-size:1.5rem;font-weight:700">${sup.length + akad.length}</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#dcfce7;color:#166534">${Icons.svg('check-circle', 22)}</div>
          <div><div style="font-size:.75rem;color:var(--slate-500)">Supervisi 3T Selesai</div><div style="font-size:1.5rem;font-weight:700">${sup.filter(s=>s.status==='selesai').length}</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fef3c7;color:#92400e">${Icons.svg('laptop', 22)}</div>
          <div><div style="font-size:.75rem;color:var(--slate-500)">Integrasi KKA</div><div style="font-size:1.5rem;font-weight:700">${pctKKA}%</div></div>
        </div>
      </div>

      <!-- Trend Chart -->
      <div class="card" style="margin-bottom:1.5rem">
        <div class="card-header">${Icons.svg('trending-up', 18)} Tren Supervisi ${currentYear}</div>
        <div class="card-body">
          <div style="position:relative; height:150px; width:100%">
            <svg viewBox="0 0 300 100" preserveAspectRatio="none" style="width:100%; height:100%; overflow:visible">
              <!-- Garis Grid -->
              <line x1="0" y1="0" x2="300" y2="0" stroke="var(--slate-200)" stroke-width="0.5" stroke-dasharray="2,2"/>
              <line x1="0" y1="50" x2="300" y2="50" stroke="var(--slate-200)" stroke-width="0.5" stroke-dasharray="2,2"/>
              <line x1="0" y1="100" x2="300" y2="100" stroke="var(--slate-200)" stroke-width="0.5" stroke-dasharray="2,2"/>
              
              <!-- Area Fill -->
              <polygon points="0,100 ${svgPoints} 300,100" fill="rgba(99,102,241,0.1)" />
              
              <!-- Line -->
              <polyline points="${svgPoints}" fill="none" stroke="var(--brand-500)" stroke-width="2.5" stroke-linejoin="round" />
              
              <!-- Points -->
              ${trendData.map((val, i) => {
                const x = (i / 11) * 300;
                const y = 100 - (val / maxTrend) * 100;
                return `<circle cx="${x}" cy="${y}" r="2.5" fill="white" stroke="var(--brand-600)" stroke-width="1.5" />`;
              }).join('')}
            </svg>
          </div>
          <div style="display:flex; justify-content:space-between; margin-top:.5rem; font-size:.65rem; color:var(--slate-500)">
            ${bulanLabels.map(b => `<span>${b}</span>`).join('')}
          </div>
        </div>
      </div>

      <!-- Insight Otomatis -->
      ${insights.length > 0 ? `
        <div class="card" style="margin-bottom:1.5rem">
          <div class="card-header">${Icons.svg('lightbulb', 18)} Insight & Rekomendasi</div>
          <div class="card-body" style="display:flex; flex-direction:column; gap:.75rem">
            ${insights.map(i => {
              const c = i.type === 'success' ? { bg: '#dcfce7', border: '#86efac', color: '#166534', icon: 'trending-up' }
                      : i.type === 'warning' ? { bg: '#fef3c7', border: '#fde68a', color: '#92400e', icon: 'alert-triangle' }
                      : { bg: '#dbeafe', border: '#93c5fd', color: '#1e40af', icon: 'info' };
              return `
                <div style="display:flex; gap:.75rem; padding:.85rem; background:${c.bg}; border:1px solid ${c.border}; border-radius:8px; align-items:flex-start">
                  <div style="width:32px; height:32px; border-radius:8px; background:white; color:${c.color}; display:flex; align-items:center; justify-content:center; flex-shrink:0">
                    ${Icons.svg(c.icon, 18)}
                  </div>
                  <div style="flex:1; font-size:.85rem; color:${c.color}; line-height:1.5">${i.text}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <div class="row" style="margin-bottom:1rem">
        <div class="card"><div class="card-header">${Icons.svg('bar-chart-3', 18)} Prinsip PM</div><div class="card-body">
          <div class="chart-wrap">
            <div class="chart-col"><div class="chart-bar" style="height:${Math.round(pC.berkesadaran / Math.max(...Object.values(pC), 1) * 100)}%;background:var(--brand-500)"></div><div class="chart-label">Berkesadaran<br><strong>${pC.berkesadaran}</strong></div></div>
            <div class="chart-col"><div class="chart-bar" style="height:${Math.round(pC.bermakna / Math.max(...Object.values(pC), 1) * 100)}%;background:#10b981"></div><div class="chart-label">Bermakna<br><strong>${pC.bermakna}</strong></div></div>
            <div class="chart-col"><div class="chart-bar" style="height:${Math.round(pC.menggembirakan / Math.max(...Object.values(pC), 1) * 100)}%;background:#f59e0b"></div><div class="chart-label">Menggembirakan<br><strong>${pC.menggembirakan}</strong></div></div>
          </div>
        </div></div>
        <div class="card"><div class="card-header">${Icons.svg('graduation-cap', 18)} Pengalaman Belajar</div><div class="card-body">
          <div class="chart-wrap">
            <div class="chart-col"><div class="chart-bar" style="height:${Math.round(gC.memahami / Math.max(...Object.values(gC), 1) * 100)}%;background:#0ea5e9"></div><div class="chart-label">Memahami<br><strong>${gC.memahami}</strong></div></div>
            <div class="chart-col"><div class="chart-bar" style="height:${Math.round(gC.mengaplikasi / Math.max(...Object.values(gC), 1) * 100)}%;background:#8b5cf6"></div><div class="chart-label">Mengaplikasi<br><strong>${gC.mengaplikasi}</strong></div></div>
            <div class="chart-col"><div class="chart-bar" style="height:${Math.round(gC.merefleksi / Math.max(...Object.values(gC), 1) * 100)}%;background:#ec4899"></div><div class="chart-label">Merefleksi<br><strong>${gC.merefleksi}</strong></div></div>
          </div>
        </div></div>
      </div>

      <div class="card"><div class="card-header">${Icons.svg('layers', 18)} 8 Dimensi Profil Lulusan</div><div class="card-body">
        ${DPL_LABELS.map((d, i) => `
          <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.45rem">
            <div style="width:140px;font-size:.8rem;color:var(--slate-700)">${i + 1}. ${d}</div>
            <div style="flex:1;height:8px;background:var(--slate-100);border-radius:999px;overflow:hidden"><div style="height:100%;width:${Math.round(dC[i] / maxD * 100)}%;background:var(--brand-500);border-radius:999px"></div></div>
            <div style="width:30px;font-size:.75rem;font-weight:600;text-align:right">${dC[i]}</div>
          </div>
        `).join('')}
      </div></div>
    `;
  },

  async bind() {}
};
