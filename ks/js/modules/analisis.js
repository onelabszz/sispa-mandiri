import { Store } from '../../storage.js';
import { Icons } from '../../../shared/js/icons.js';
import { DPL_LABELS } from '../../../shared/js/constants.js';
import { emptyState } from '../helpers.js';

export const Analisis = {
  async render() {
    const akad = Store.get('akademik');
    const sup = Store.get('supervisi');
    const pm = Store.get('supervisiPM') || [];

    if (sup.length === 0 && akad.length === 0 && pm.length === 0) {
      return `<div class="card"><div class="card-body">
        ${emptyState('bar-chart-3', 'Belum ada data', 'Analisis muncul setelah ada sesi supervisi.')}
      </div></div>`;
    }

    // ============================================
    // 1. Hitung Prinsip & Pengalaman (dari 3T saja)
    // ============================================
    const pC = { berkesadaran: 0, bermakna: 0, menggembirakan: 0 };
    sup.forEach(s => { if (s.prinsip_pm) Object.keys(pC).forEach(k => { if (s.prinsip_pm[k]) pC[k]++; }); });
    const gC = { memahami: 0, mengaplikasi: 0, merefleksi: 0 };
    sup.forEach(s => { if (s.pengalaman) Object.keys(gC).forEach(k => { if (s.pengalaman[k]) gC[k]++; }); });

    // ============================================
    // 2. Hitung DPL (dari 3T saja)
    // ============================================
    const dC = Array(8).fill(0);
    sup.forEach(s => { (s.dpl || []).forEach(n => { if (n >= 1 && n <= 8) dC[n - 1]++; }); });
    const maxD = Math.max(...dC, 1);

    // ============================================
    // 3. Hitung KKA (dari 3T saja)
    // ============================================
    const withKKA = sup.filter(s => s.kka && String(s.kka).trim()).length;
    const pctKKA = sup.length > 0 ? Math.round(withKKA / sup.length * 100) : 0;

    // ============================================
    // 3b. Hitung Metrik PM
    // ============================================
    const pmFinalCount = pm.filter(s => s.status === 'selesai').length;
    const avgPMTelaah = pm.length > 0
      ? Math.round(pm.reduce((sum, s) => sum + ((s.telaah && s.telaah.nilai) || 0), 0) / pm.length)
      : 0;
    const obsItemFilled = pm.reduce((sum, s) =>
      sum + Object.values((s.obs && s.obs.bukti) || {}).filter(v => v && String(v).trim()).length, 0);
    const obsItemTotal = pm.length * 15;
    const obsFillRate = obsItemTotal > 0 ? Math.round(obsItemFilled / obsItemTotal * 100) : 0;
    const pmGuruCovered = new Set(pm.map(s => s.gid)).size;
    const guruTotal = Store.get('guru').length;
    const pmCoverage = guruTotal > 0 ? Math.round(pmGuruCovered / guruTotal * 100) : 0;

    // ============================================
    // 4. Insight Otomatis
    // ============================================
    const insights = [];
    const prinsipMax = Object.keys(pC).reduce((a, b) => pC[a] > pC[b] ? a : b);
    const prinsipMin = Object.keys(pC).reduce((a, b) => pC[a] < pC[b] ? a : b);
    // FIX: guard sup.length === 0 (division by zero kalau hanya ada PM)
    const pctMax = sup.length > 0 ? Math.round((pC[prinsipMax] / sup.length) * 100) : 0;
    const pctMin = sup.length > 0 ? Math.round((pC[prinsipMin] / sup.length) * 100) : 0;

    if (sup.length > 0 && pctMax >= 70) {
      insights.push({ type: 'success', text: `Prinsip <strong>${prinsipMax}</strong> konsisten diterapkan dalam <strong>${pctMax}%</strong> sesi.` });
    }
    if (sup.length > 0 && pctMin < 40) {
      insights.push({ type: 'warning', text: `Prinsip <strong>${prinsipMin}</strong> paling jarang diterapkan (<strong>${pctMin}%</strong>). Area ini bisa jadi fokus pengembangan berikutnya.` });
    }
    if (sup.length > 0 && pctKKA < 30) {
      insights.push({ type: 'info', text: `Integrasi KKA baru mencapai <strong>${pctKKA}%</strong>. Target ideal adalah lebih dari 50%.` });
    }
    if (pm.length > 0) {
      if (pmCoverage >= 80) {
        insights.push({ type: 'success', text: `Coverage Supervisi PM sudah <strong>${pmCoverage}%</strong> (${pmGuruCovered}/${guruTotal} guru). Pertahankan!` });
      } else if (pmCoverage >= 40) {
        insights.push({ type: 'info', text: `Coverage Supervisi PM baru <strong>${pmCoverage}%</strong> (${pmGuruCovered}/${guruTotal} guru). Tingkatkan pemerataan.` });
      } else {
        insights.push({ type: 'warning', text: `Coverage Supervisi PM rendah (<strong>${pmCoverage}%</strong>). Prioritaskan guru yang belum tersentuh PM.` });
      }
      if (avgPMTelaah >= 75) {
        insights.push({ type: 'success', text: `Rata-rata skor Telaah RPP PM <strong>${avgPMTelaah}/100</strong> — kualitas perencanaan sudah tinggi.` });
      } else if (avgPMTelaah > 0 && avgPMTelaah < 60) {
        insights.push({ type: 'warning', text: `Rata-rata skor Telaah RPP PM <strong>${avgPMTelaah}/100</strong>. Perlu pembinaan pada kualitas perencanaan.` });
      }
      if (obsFillRate < 50) {
        insights.push({ type: 'warning', text: `Pengisian bukti observasi PM hanya <strong>${obsFillRate}%</strong>. Lengkapi bukti agar analisis lebih akurat.` });
      }
    }

    // ============================================
    // 5. Tren 12 Bulan (dari semua sumber termasuk PM)
    // ============================================
    const bulanLabels = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
    const currentYear = new Date().getFullYear();
    const trendData = Array(12).fill(0);

    [...sup, ...akad, ...pm].forEach(s => {
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

    // ============================================
    // 6. Korelasi Telaah vs Observasi (pre-compute)
    // ============================================
    const correlationText = (() => {
      const complete = pm.filter(s =>
        (s.telaah && s.telaah.nilai) > 0 &&
        Object.values((s.obs && s.obs.bukti) || {}).some(v => v && String(v).trim())
      );
      if (complete.length === 0) return 'Belum ada cukup data untuk dianalisis.';

      const highTelaahLowObs = complete.filter(s =>
        s.telaah.nilai >= 75 &&
        Object.values(s.obs.bukti || {}).filter(v => v && String(v).trim()).length < 8
      ).length;

      const lowTelaahHighObs = complete.filter(s =>
        s.telaah.nilai < 60 &&
        Object.values(s.obs.bukti || {}).filter(v => v && String(v).trim()).length >= 12
      ).length;

      if (highTelaahLowObs > 0) {
        return `<strong style="color:var(--warning)">${highTelaahLowObs} guru</strong> punya RPP bagus tapi implementasi kurang terdokumentasi — perlu observasi lebih teliti.`;
      }
      if (lowTelaahHighObs > 0) {
        return `<strong style="color:var(--info)">${lowTelaahHighObs} guru</strong> punya RPP sederhana tapi implementasi kaya — bisa jadi praktik baik untuk dibagikan.`;
      }
      return 'Data telaah & observasi cukup seimbang.';
    })();

    // ============================================
    // RENDER
    // ============================================
    return `
      <div class="page-head">
        <div>
          <h2>Analisis PM & KKA</h2>
          <div class="page-sub">Data dari ${sup.length} supervisi 3 tahap + ${pm.length} Supervisi PM + ${akad.length} Supervisi Digitalisasi</div>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="grid-auto" style="margin-bottom:1.5rem">
        <div class="stat-card">
          <div class="stat-icon" style="background:#e0e7ff;color:#4338ca">${Icons.svg('clipboard-list', 22)}</div>
          <div><div style="font-size:.75rem;color:var(--slate-500)">Total Sesi</div><div style="font-size:1.5rem;font-weight:700">${sup.length + akad.length + pm.length}</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#dcfce7;color:#166534">${Icons.svg('check-circle', 22)}</div>
          <div><div style="font-size:.75rem;color:var(--slate-500)">Supervisi 3T Selesai</div><div style="font-size:1.5rem;font-weight:700">${sup.filter(s=>s.status==='selesai').length}</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fef3c7;color:#92400e">${Icons.svg('laptop', 22)}</div>
          <div><div style="font-size:.75rem;color:var(--slate-500)">Integrasi KKA</div><div style="font-size:1.5rem;font-weight:700">${pctKKA}%</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fce7f3;color:#9d174d">${Icons.svg('book-open-check', 22)}</div>
          <div><div style="font-size:.75rem;color:var(--slate-500)">Supervisi PM Selesai</div><div style="font-size:1.5rem;font-weight:700">${pmFinalCount}<span style="color:var(--slate-400);font-size:1rem;font-weight:500">/${pm.length}</span></div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#e0f2fe;color:#0369a1">${Icons.svg('award', 22)}</div>
          <div><div style="font-size:.75rem;color:var(--slate-500)">Rata-rata Telaah PM</div><div style="font-size:1.5rem;font-weight:700">${avgPMTelaah}<span style="color:var(--slate-400);font-size:1rem;font-weight:500">/100</span></div></div>
        </div>
      </div>

      <!-- Trend Chart -->
      <div class="card" style="margin-bottom:1.5rem">
        <div class="card-header">${Icons.svg('trending-up', 18)} Tren Supervisi ${currentYear}</div>
        <div class="card-body">
          <div style="position:relative; height:150px; width:100%">
            <svg viewBox="0 0 300 100" preserveAspectRatio="none" style="width:100%; height:100%; overflow:visible">
              <line x1="0" y1="0" x2="300" y2="0" stroke="var(--slate-200)" stroke-width="0.5" stroke-dasharray="2,2"/>
              <line x1="0" y1="50" x2="300" y2="50" stroke="var(--slate-200)" stroke-width="0.5" stroke-dasharray="2,2"/>
              <line x1="0" y1="100" x2="300" y2="100" stroke="var(--slate-200)" stroke-width="0.5" stroke-dasharray="2,2"/>
              <polygon points="0,100 ${svgPoints} 300,100" fill="rgba(99,102,241,0.1)" />
              <polyline points="${svgPoints}" fill="none" stroke="var(--brand-500)" stroke-width="2.5" stroke-linejoin="round" />
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

      ${pm.length > 0 ? `
        <div class="card" style="margin-top:1rem">
          <div class="card-header">${Icons.svg('book-open-check', 18)} Analisis Supervisi PM</div>
          <div class="card-body">
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:.75rem;margin-bottom:1rem">
              <div style="padding:.75rem;background:var(--slate-50);border-radius:8px;text-align:center">
                <div style="font-size:.7rem;color:var(--slate-500)">Coverage PM</div>
                <div style="font-size:1.25rem;font-weight:700;color:var(--brand-600)">${pmCoverage}%</div>
                <div style="font-size:.75rem;color:var(--slate-500)">${pmGuruCovered}/${guruTotal} guru</div>
              </div>
              <div style="padding:.75rem;background:var(--slate-50);border-radius:8px;text-align:center">
                <div style="font-size:.7rem;color:var(--slate-500)">Rata-rata Telaah</div>
                <div style="font-size:1.25rem;font-weight:700;color:var(--brand-600)">${avgPMTelaah}<span style="font-size:.85rem;color:var(--slate-400)">/100</span></div>
              </div>
              <div style="padding:.75rem;background:var(--slate-50);border-radius:8px;text-align:center">
                <div style="font-size:.7rem;color:var(--slate-500)">Bukti Obs Terisi</div>
                <div style="font-size:1.25rem;font-weight:700;color:var(--brand-600)">${obsFillRate}%</div>
                <div style="font-size:.75rem;color:var(--slate-500)">${obsItemFilled}/${obsItemTotal} item</div>
              </div>
              <div style="padding:.75rem;background:var(--slate-50);border-radius:8px;text-align:center">
                <div style="font-size:.7rem;color:var(--slate-500)">Siklus Selesai</div>
                <div style="font-size:1.25rem;font-weight:700;color:var(--brand-600)">${pmFinalCount}<span style="font-size:.85rem;color:var(--slate-400)">/${pm.length}</span></div>
              </div>
            </div>
            <div style="font-size:.8rem;color:var(--slate-600);line-height:1.7;padding-top:.75rem;border-top:1px solid var(--slate-100)">
              <strong>Korelasi Telaah vs Observasi:</strong> ${correlationText}
            </div>
          </div>
        </div>
      ` : ''}
    `;
  },

  async bind() {}
};
