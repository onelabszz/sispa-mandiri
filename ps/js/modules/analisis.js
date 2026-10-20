import { Store } from '../../storage.js';
import { Icons } from '../../../shared/js/icons.js';
import { Router } from '../../../shared/js/router.js';
import { Utils } from '../../../shared/js/utils.js';
import { emptyState, metricsSekolah } from '../helpers.js';
import { DPL_LABELS, INSTRUMEN_AKADEMIK, INSTRUMEN_COACHING } from '../../../shared/js/constants.js';

export const Analisis = {
  _tab: 'overview',

  async render() {
    const sekolah = Store.get('sekolah');
    if (sekolah.length === 0) {
      return `<div class="card"><div class="card-body">
        ${emptyState('bar-chart-3', 'Belum ada data', 'Import JSON dari KS terlebih dahulu.')}
      </div></div>`;
    }

    const tabContent = this._tab === 'akademik' ? this._renderAkademik(sekolah)
      : this._tab === 'coaching' ? this._renderCoaching(sekolah)
      : this._renderOverview(sekolah);

    return `
      <div class="page-head">
        <div>
          <h2>Analisis & Benchmark</h2>
          <div class="page-sub">Agregat dari ${sekolah.length} sekolah</div>
        </div>
      </div>

      <div class="tab-nav">
        <button class="tab-btn ${this._tab === 'overview' ? 'active' : ''}" data-tab="overview">${Icons.svg('bar-chart-3', 16)} Overview</button>
        <button class="tab-btn ${this._tab === 'akademik' ? 'active' : ''}" data-tab="akademik">${Icons.svg('laptop', 16)} Obs. Akademik</button>
        <button class="tab-btn ${this._tab === 'coaching' ? 'active' : ''}" data-tab="coaching">${Icons.svg('message-circle', 16)} Obs. Coaching</button>
      </div>

      ${tabContent}
    `;
  },

  async bind() {
    document.querySelectorAll('.tab-nav .tab-btn').forEach(b => {
      b.onclick = () => {
        this._tab = b.dataset.tab;
        Router.navigate('analisis');
      };
    });
  },

  _renderOverview(sekolah) {
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
      <div class="card">
        <div class="card-header">${Icons.svg('percent', 18)} Coverage Supervisi per Sekolah</div>
        <div class="card-body">
          ${sekolah.map(sk => {
            const m = metricsSekolah(sk);
            const color = m.coverage >= 80 ? 'var(--success)' : m.coverage >= 50 ? 'var(--warning)' : 'var(--danger)';
            return `<div style="display:flex;align-items:center;gap:.65rem;margin-bottom:.5rem;font-size:.85rem">
              <div style="width:150px;color:var(--slate-700);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${Utils.esc(sk.nama_sekolah)}</div>
              <div style="flex:1;height:8px;background:var(--slate-100);border-radius:999px;overflow:hidden"><div style="height:100%;width:${m.coverage}%;background:${color};border-radius:999px"></div></div>
              <div style="width:50px;font-weight:600;text-align:right;color:${color}">${m.coverage}%</div>
            </div>`;
          }).join('')}
        </div>
      </div>
      <div class="row">
        <div class="card">
          <div class="card-header">${Icons.svg('target', 18)} Prinsip PM</div>
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
            <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.45rem">
              <div style="width:140px;font-size:.8rem;color:var(--slate-700)">${i + 1}. ${d}</div>
              <div style="flex:1;height:8px;background:var(--slate-100);border-radius:999px;overflow:hidden"><div style="height:100%;width:${Math.round(dC[i] / maxD * 100)}%;background:var(--brand-500);border-radius:999px"></div></div>
              <div style="width:30px;font-size:.75rem;font-weight:600;text-align:right">${dC[i]}</div>
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
          <div style="font-size:.85rem;color:var(--slate-600)"><strong>${withKKA}</strong> dari <strong>${allSup3.length}</strong> sesi 3T menyertakan KKA</div>
        </div>
      </div>
    `;
  },

  _renderAkademik(sekolah) {
    const allAkad = sekolah.flatMap(sk => sk.akademik || []);
    if (allAkad.length === 0) {
      return `<div class="card"><div class="card-body">${emptyState('laptop', 'Belum ada data', 'Belum ada observasi akademik yang diimpor dari KS.')}</div></div>`;
    }

    // Hitung distribusi skor per indikator (1-4)
    const perInd = INSTRUMEN_AKADEMIK.map(ind => {
      const counts = [0, 0, 0, 0]; // skor 1-4
      let total = 0, n = 0;
      allAkad.forEach(a => {
        const skor = (a.detail || {})[ind.kode];
        if (skor >= 1 && skor <= 4) { counts[skor - 1]++; total += skor; n++; }
      });
      return { ...ind, counts, avg: n > 0 ? total / n : 0, totalN: n };
    });

    // Statistik global
    const avgTotal = allAkad.length > 0 ? (allAkad.reduce((s, x) => s + (x.skor || 0), 0) / allAkad.length).toFixed(1) : 0;
    const maxAvg = Math.max(...perInd.map(x => x.avg), 1);

    return `
      <div class="grid-auto" style="margin-bottom:1.5rem">
        <div class="stat-card">
          <div class="stat-icon" style="background:#dbeafe;color:#1e40af">${Icons.svg('laptop', 22)}</div>
          <div><div style="font-size:.75rem;color:var(--slate-500)">Total Observasi</div><div style="font-size:1.5rem;font-weight:700">${allAkad.length}</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#dcfce7;color:#166534">${Icons.svg('trending-up', 22)}</div>
          <div><div style="font-size:.75rem;color:var(--slate-500)">Rata-rata Skor</div><div style="font-size:1.5rem;font-weight:700">${avgTotal}<span style="color:var(--slate-400);font-size:1rem;font-weight:500">/76</span></div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fef3c7;color:#92400e">${Icons.svg('school', 22)}</div>
          <div><div style="font-size:.75rem;color:var(--slate-500)">Sekolah Terlibat</div><div style="font-size:1.5rem;font-weight:700">${sekolah.filter(sk => (sk.akademik || []).length > 0).length}</div></div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">${Icons.svg('bar-chart-3', 18)} Rata-rata Skor per Indikator (19 Indikator)</div>
        <div class="card-body">
          ${perInd.map(ind => `
            <div style="display:flex;align-items:center;gap:.65rem;margin-bottom:.5rem;font-size:.8rem">
              <div style="width:30px;font-family:monospace;font-weight:700;color:var(--brand-700)">${ind.kode}</div>
              <div style="flex:1;min-width:0">
                <div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--slate-700);margin-bottom:.15rem">${Utils.esc(ind.t)}</div>
                <div style="height:6px;background:var(--slate-100);border-radius:999px;overflow:hidden">
                  <div style="height:100%;width:${Math.round(ind.avg / 4 * 100)}%;background:var(--brand-500);border-radius:999px"></div>
                </div>
              </div>
              <div style="width:55px;text-align:right">
                <strong style="color:var(--brand-700)">${ind.avg.toFixed(2)}</strong>
                <div style="font-size:.65rem;color:var(--slate-500)">(${ind.totalN}x)</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  _renderCoaching(sekolah) {
    const allCoach = sekolah.flatMap(sk => sk.coaching || []);
    if (allCoach.length === 0) {
      return `<div class="card"><div class="card-body">${emptyState('message-circle', 'Belum ada data', 'Belum ada observasi coaching yang diimpor dari KS.')}</div></div>`;
    }

    const perInd = INSTRUMEN_COACHING.map(ind => {
      let total = 0, n = 0;
      allCoach.forEach(c => {
        const skor = (c.detail || {})[ind.kode];
        if (skor >= 1 && skor <= 4) { total += skor; n++; }
      });
      return { ...ind, avg: n > 0 ? total / n : 0, totalN: n };
    });

    const avgTotal = allCoach.length > 0 ? (allCoach.reduce((s, x) => s + (x.skor || 0), 0) / allCoach.length).toFixed(1) : 0;

    return `
      <div class="grid-auto" style="margin-bottom:1.5rem">
        <div class="stat-card">
          <div class="stat-icon" style="background:#fef3c7;color:#92400e">${Icons.svg('message-circle', 22)}</div>
          <div><div style="font-size:.75rem;color:var(--slate-500)">Total Coaching</div><div style="font-size:1.5rem;font-weight:700">${allCoach.length}</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#dcfce7;color:#166534">${Icons.svg('trending-up', 22)}</div>
          <div><div style="font-size:.75rem;color:var(--slate-500)">Rata-rata Skor</div><div style="font-size:1.5rem;font-weight:700">${avgTotal}<span style="color:var(--slate-400);font-size:1rem;font-weight:500">/32</span></div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#e0e7ff;color:#4338ca">${Icons.svg('school', 22)}</div>
          <div><div style="font-size:.75rem;color:var(--slate-500)">Sekolah Terlibat</div><div style="font-size:1.5rem;font-weight:700">${sekolah.filter(sk => (sk.coaching || []).length > 0).length}</div></div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">${Icons.svg('bar-chart-3', 18)} Rata-rata Skor per Indikator (8 Indikator STAR-GROW)</div>
        <div class="card-body">
          ${perInd.map(ind => `
            <div style="display:flex;align-items:center;gap:.65rem;margin-bottom:.5rem;font-size:.8rem">
              <div style="width:30px;height:28px;border-radius:6px;background:var(--brand-50);color:var(--brand-700);display:flex;align-items:center;justify-content:center;font-weight:700">${ind.tahap}</div>
              <div style="flex:1;min-width:0">
                <div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--slate-700);margin-bottom:.15rem">${Utils.esc(ind.t)}</div>
                <div style="height:6px;background:var(--slate-100);border-radius:999px;overflow:hidden">
                  <div style="height:100%;width:${Math.round(ind.avg / 4 * 100)}%;background:#f59e0b;border-radius:999px"></div>
                </div>
              </div>
              <div style="width:55px;text-align:right">
                <strong style="color:#92400e">${ind.avg.toFixed(2)}</strong>
                <div style="font-size:.65rem;color:var(--slate-500)">(${ind.totalN}x)</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
};
