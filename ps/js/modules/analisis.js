import { Store } from '../../storage.js';
import { Icons } from '../../../shared/js/icons.js';
import { Router } from '../../../shared/js/router.js';
import { Utils } from '../../../shared/js/utils.js';
import { emptyState, metricsSekolah, allGuru } from '../helpers.js';
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
      : this._tab === 'pm' ? this._renderPM(sekolah)
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
        <button class="tab-btn ${this._tab === 'pm' ? 'active' : ''}" data-tab="pm">${Icons.svg('book-open-check', 16)} Supervisi PM</button>
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
    const allPM = sekolah.flatMap(sk => sk.supervisiPM || []);
    const allAkad = sekolah.flatMap(sk => sk.akademik || []);
    const allCoach = sekolah.flatMap(sk => sk.coaching || []);
    const allSesi = [...allSup3, ...allPM, ...allAkad, ...allCoach];
    const totalSesi = allSesi.length;

    // KPI
    const denganKKA = allSup3.filter(s => s.kka && String(s.kka).trim()).length;
    const pctKKA = allSup3.length > 0 ? Math.round(denganKKA / allSup3.length * 100) : 0;
    const avgAkad = allAkad.length > 0 ? (allAkad.reduce((s, x) => s + (x.skor || 0), 0) / allAkad.length).toFixed(1) : '—';
    const avgCoach = allCoach.length > 0 ? (allCoach.reduce((s, x) => s + (x.skor || 0), 0) / allCoach.length).toFixed(1) : '—';
    const avgPM = allPM.length > 0
      ? Math.round(allPM.reduce((sum, s) => sum + ((s.telaah && s.telaah.nilai) || 0), 0) / allPM.length)
      : 0;

    // Prinsip & Pengalaman
    const pC = { berkesadaran: 0, bermakna: 0, menggembirakan: 0 };
    allSup3.forEach(s => { if (s.prinsip_pm) Object.keys(pC).forEach(k => { if (s.prinsip_pm[k]) pC[k]++; }); });
    const gC = { memahami: 0, mengaplikasi: 0, merefleksi: 0 };
    allSup3.forEach(s => { if (s.pengalaman) Object.keys(gC).forEach(k => { if (s.pengalaman[k]) gC[k]++; }); });
    const dC = Array(8).fill(0);
    allSup3.forEach(s => { (s.dpl || []).forEach(n => { if (n >= 1 && n <= 8) dC[n - 1]++; }); });
    const maxP = Math.max(...Object.values(pC), 1);
    const maxG = Math.max(...Object.values(gC), 1);
    const maxD = Math.max(...dC, 1);

    // Trend per bulan
    const bulanLabels = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
    const currentYear = new Date().getFullYear();
    const trendData = Array(12).fill(0);
    allSesi.forEach(s => {
      if (!s.tgl) return;
      const d = new Date(s.tgl);
      if (d.getFullYear() === currentYear) trendData[d.getMonth()]++;
    });
    const maxTrend = Math.max(...trendData, 1);
    const svgPoints = trendData.map((val, i) => {
      const x = (i / 11) * 300;
      const y = 100 - (val / maxTrend) * 100;
      return `${x},${y}`;
    }).join(' ');

    // Insight
    const insights = [];
    if (allSup3.length > 0) {
      const prinsipMax = Object.keys(pC).reduce((a, b) => pC[a] > pC[b] ? a : b);
      const prinsipMin = Object.keys(pC).reduce((a, b) => pC[a] < pC[b] ? a : b);
      const pctMax = Math.round((pC[prinsipMax] / allSup3.length) * 100);
      const pctMin = Math.round((pC[prinsipMin] / allSup3.length) * 100);
      if (pctMax >= 70) insights.push({ type: 'success', text: `Prinsip <strong>${prinsipMax}</strong> konsisten diterapkan dalam <strong>${pctMax}%</strong> sesi 3T.` });
      if (pctMin < 40) insights.push({ type: 'warning', text: `Prinsip <strong>${prinsipMin}</strong> jarang diterapkan (<strong>${pctMin}%</strong>). Perlu jadi fokus pembinaan.` });
      if (pctKKA < 30) insights.push({ type: 'info', text: `Integrasi KKA baru <strong>${pctKKA}%</strong>. Target ideal >50% sesuai Modul 5.` });
      else if (pctKKA >= 50) insights.push({ type: 'success', text: `Integrasi KKA baik: <strong>${pctKKA}%</strong> sesi 3T menyertakan Koding/AI.` });
    }
    if (allPM.length > 0) {
      const pmCovered = new Set(allPM.map(s => `${s._skId || ''}:${s.gid}`)).size;
      const totalGuruAll = allGuru().length;
      const pmCov = totalGuruAll > 0 ? Math.round(pmCovered / totalGuruAll * 100) : 0;
      if (pmCov >= 80) insights.push({ type: 'success', text: `Coverage Supervisi PM lintas sekolah: <strong>${pmCov}%</strong> (${pmCovered}/${totalGuruAll} guru).` });
      else if (pmCov >= 40) insights.push({ type: 'info', text: `Coverage Supervisi PM lintas sekolah baru <strong>${pmCov}%</strong>. Tingkatkan pemerataan.` });
      else insights.push({ type: 'warning', text: `Coverage Supervisi PM rendah (<strong>${pmCov}%</strong>). Prioritaskan guru yang belum tersentuh PM.` });
      if (avgPM >= 75) insights.push({ type: 'success', text: `Rata-rata skor Telaah RPP PM <strong>${avgPM}/100</strong> — kualitas perencanaan tinggi.` });
      else if (avgPM > 0 && avgPM < 60) insights.push({ type: 'warning', text: `Rata-rata Telaah RPP PM <strong>${avgPM}/100</strong>. Perlu pembinaan kualitas perencanaan.` });
    }
    const skMetrics = sekolah.map(sk => ({ sk, m: metricsSekolah(sk) }));
    const lowestCoverage = skMetrics.reduce((min, x) => x.m.coverage < min.m.coverage ? x : min, skMetrics[0]);
    if (lowestCoverage && lowestCoverage.m.coverage < 50) {
      insights.push({ type: 'warning', text: `Sekolah <strong>${Utils.esc(lowestCoverage.sk.nama_sekolah)}</strong> memiliki coverage terendah (<strong>${lowestCoverage.m.coverage}%</strong>). Prioritaskan pembinaan.` });
    }

    return `
      <div class="grid-auto" style="margin-bottom:1.5rem">
        <div class="stat-card">
          <div class="stat-icon" style="background:#e0e7ff;color:#4338ca">${Icons.svg('clipboard-list', 22)}</div>
          <div><div style="font-size:.75rem;color:var(--slate-500)">Total Sesi</div><div style="font-size:1.5rem;font-weight:700">${totalSesi}</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#dcfce7;color:#166534">${Icons.svg('laptop', 22)}</div>
          <div><div style="font-size:.75rem;color:var(--slate-500)">Avg Akademik</div><div style="font-size:1.5rem;font-weight:700">${avgAkad}<span style="color:var(--slate-400);font-size:1rem;font-weight:500">/76</span></div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fef3c7;color:#92400e">${Icons.svg('message-circle', 22)}</div>
          <div><div style="font-size:.75rem;color:var(--slate-500)">Avg Coaching</div><div style="font-size:1.5rem;font-weight:700">${avgCoach}<span style="color:var(--slate-400);font-size:1rem;font-weight:500">/32</span></div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fce7f3;color:#9d174d">${Icons.svg('book-open-check', 22)}</div>
          <div><div style="font-size:.75rem;color:var(--slate-500)">Avg Telaah PM</div><div style="font-size:1.5rem;font-weight:700">${avgPM}<span style="color:var(--slate-400);font-size:1rem;font-weight:500">/100</span></div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#dbeafe;color:#1e40af">${Icons.svg('code', 22)}</div>
          <div><div style="font-size:.75rem;color:var(--slate-500)">Integrasi KKA</div><div style="font-size:1.5rem;font-weight:700">${pctKKA}%</div></div>
        </div>
      </div>

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

      ${insights.length > 0 ? `
        <div class="card" style="margin-bottom:1.5rem">
          <div class="card-header">${Icons.svg('info', 18)} Insight & Rekomendasi</div>
          <div class="card-body" style="display:flex; flex-direction:column; gap:.75rem">
            ${insights.map(i => {
              const c = i.type === 'success' ? { bg: '#dcfce7', border: '#86efac', color: '#166534', icon: 'trending-up' }
                      : i.type === 'warning' ? { bg: '#fef3c7', border: '#fde68a', color: '#92400e', icon: 'alert-triangle' }
                      : { bg: '#dbeafe', border: '#93c5fd', color: '#1e40af', icon: 'info' };
              return `<div style="display:flex; gap:.75rem; padding:.85rem; background:${c.bg}; border:1px solid ${c.border}; border-radius:8px; align-items:flex-start">
                <div style="width:32px; height:32px; border-radius:8px; background:white; color:${c.color}; display:flex; align-items:center; justify-content:center; flex-shrink:0">
                  ${Icons.svg(c.icon, 18)}
                </div>
                <div style="flex:1; font-size:.85rem; color:${c.color}; line-height:1.5">${i.text}</div>
              </div>`;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <div class="card">
        <div class="card-header">${Icons.svg('percent', 18)} Coverage per Sekolah</div>
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
    `;
  },

  // ============================================
  // TAB: SUPERVISI PM
  // ============================================
  _renderPM(sekolah) {
    const allPM = sekolah.flatMap(sk => (sk.supervisiPM || []).map(s => ({ ...s, _skId: sk.id, _skNama: sk.nama_sekolah })));
    if (allPM.length === 0) {
      return `<div class="card"><div class="card-body">${emptyState('book-open-check', 'Belum ada data PM', 'Belum ada Supervisi PM yang diimpor dari KS. Pastikan KS sudah update ke v2.1.0 dan buat sesi Supervisi PM.')}</div></div>`;
    }

    const pmFinal = allPM.filter(s => s.status === 'selesai');
    const avgTelaah = allPM.length > 0
      ? Math.round(allPM.reduce((sum, s) => sum + ((s.telaah && s.telaah.nilai) || 0), 0) / allPM.length)
      : 0;

    const obsFilled = allPM.reduce((sum, s) =>
      sum + Object.values((s.obs && s.obs.bukti) || {}).filter(v => v && String(v).trim()).length, 0);
    const obsTotal = allPM.length * 15;
    const fillRate = obsTotal > 0 ? Math.round(obsFilled / obsTotal * 100) : 0;

    // Coverage PM lintas sekolah (guru unik)
    const pmGuruKeys = new Set(allPM.map(s => `${s._skId}:${s.gid}`));
    const totalGuruAll = allGuru().length;
    const pmCoverage = totalGuruAll > 0 ? Math.round(pmGuruKeys.size / totalGuruAll * 100) : 0;

    // Per sekolah breakdown
    const perSk = sekolah.map(sk => {
      const pmSk = sk.supervisiPM || [];
      const totalGuruSk = (sk.guru || []).length;
      const gidsWithPM = new Set(pmSk.map(s => s.gid));
      const covered = (sk.guru || []).filter(g => gidsWithPM.has(g.id)).length;
      const cov = totalGuruSk > 0 ? Math.round(covered / totalGuruSk * 100) : 0;
      const avgNilaiSk = pmSk.length > 0
        ? Math.round(pmSk.reduce((sum, s) => sum + ((s.telaah && s.telaah.nilai) || 0), 0) / pmSk.length)
        : 0;
      const finalSk = pmSk.filter(s => s.status === 'selesai').length;
      return { sk, total: pmSk.length, final: finalSk, covered, cov, totalGuru: totalGuruSk, avgNilai: avgNilaiSk };
    }).filter(x => x.total > 0 || x.totalGuru > 0).sort((a, b) => b.total - a.total);

    return `
      <div class="grid-auto" style="margin-bottom:1.5rem">
        <div class="stat-card">
          <div class="stat-icon" style="background:#fce7f3;color:#9d174d">${Icons.svg('book-open-check', 22)}</div>
          <div>
            <div style="font-size:.75rem;color:var(--slate-500)">Total PM</div>
            <div style="font-size:1.5rem;font-weight:700">${allPM.length}</div>
            <div style="font-size:.7rem;color:var(--slate-500);margin-top:.15rem">${pmFinal.length} selesai</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#e0e7ff;color:#4338ca">${Icons.svg('award', 22)}</div>
          <div>
            <div style="font-size:.75rem;color:var(--slate-500)">Avg Telaah</div>
            <div style="font-size:1.5rem;font-weight:700">${avgTelaah}<span style="color:var(--slate-400);font-size:1rem;font-weight:500">/100</span></div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#dcfce7;color:#166534">${Icons.svg('percent', 22)}</div>
          <div>
            <div style="font-size:.75rem;color:var(--slate-500)">Coverage PM</div>
            <div style="font-size:1.5rem;font-weight:700">${pmCoverage}%</div>
            <div style="font-size:.7rem;color:var(--slate-500);margin-top:.15rem">${pmGuruKeys.size}/${totalGuruAll} guru</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#dbeafe;color:#1e40af">${Icons.svg('eye', 22)}</div>
          <div>
            <div style="font-size:.75rem;color:var(--slate-500)">Bukti Obs Terisi</div>
            <div style="font-size:1.5rem;font-weight:700">${fillRate}%</div>
            <div style="font-size:.7rem;color:var(--slate-500);margin-top:.15rem">${obsFilled}/${obsTotal} item</div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom:1rem">
        <div class="card-header">${Icons.svg('percent', 18)} Coverage PM per Sekolah</div>
        <div class="card-body">
          ${perSk.map(x => {
            const color = x.cov >= 80 ? 'var(--success)' : x.cov >= 50 ? 'var(--warning)' : 'var(--danger)';
            return `<div style="margin-bottom:.75rem">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.25rem;font-size:.85rem">
                <div style="font-weight:600;color:var(--slate-800)">${Utils.esc(x.sk.nama_sekolah)}</div>
                <div style="font-size:.75rem;color:var(--slate-500)">
                  <strong>${x.total}</strong> sesi (${x.final} final) ·
                  <span style="color:${color};font-weight:600">${x.covered}/${x.totalGuru} guru (${x.cov}%)</span>
                  ${x.avgNilai > 0 ? ` · avg <strong>${x.avgNilai}</strong>` : ''}
                </div>
              </div>
              <div style="height:8px;background:var(--slate-100);border-radius:999px;overflow:hidden">
                <div style="height:100%;width:${x.cov}%;background:${color};border-radius:999px;transition:width .3s"></div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-header">${Icons.svg('list', 18)} Daftar Sesi PM Terbaru</div>
        <div class="card-body" style="padding:0">
          ${allPM
            .sort((a, b) => (b.tgl || '').localeCompare(a.tgl || ''))
            .slice(0, 20)
            .map(s => {
              const nilai = (s.telaah && s.telaah.nilai) || 0;
              const status = s.status === 'selesai'
                ? '<span class="badge badge-success" style="font-size:.65rem">Selesai</span>'
                : '<span class="badge badge-warning" style="font-size:.65rem">Draft</span>';
              const g = (Store.get('sekolah').find(x => x.id === s._skId)?.guru || []).find(x => x.id === s.gid);
              return `<div style="display:flex;justify-content:space-between;gap:.5rem;padding:.75rem 1.25rem;border-bottom:1px solid var(--slate-100);font-size:.85rem">
                <div style="min-width:0;flex:1">
                  <div style="font-weight:600">${Utils.esc(g?.nama || '?')} ${status}</div>
                  <div style="font-size:.75rem;color:var(--slate-500);margin-top:.1rem">${Utils.esc(s._skNama)} · ${Utils.date(s.tgl)}</div>
                </div>
                <div style="text-align:right;white-space:nowrap">
                  <div style="font-weight:700;color:var(--brand-700)">${nilai}<span style="color:var(--slate-400);font-weight:400;font-size:.7rem">/100</span></div>
                  <div style="font-size:.65rem;color:var(--slate-500)">Telaah</div>
                </div>
              </div>`;
            }).join('')}
        </div>
      </div>
    `;
  },

  _renderAkademik(sekolah) {
    const allAkad = sekolah.flatMap(sk => sk.akademik || []);
    if (allAkad.length === 0) {
      return `<div class="card"><div class="card-body">${emptyState('laptop', 'Belum ada data', 'Belum ada observasi akademik yang diimpor dari KS.')}</div></div>`;
    }

    const perInd = INSTRUMEN_AKADEMIK.map(ind => {
      let total = 0, n = 0;
      allAkad.forEach(a => {
        const skor = (a.detail || {})[ind.kode];
        if (skor >= 1 && skor <= 4) { total += skor; n++; }
      });
      return { ...ind, avg: n > 0 ? total / n : 0, totalN: n };
    });

    const avgTotal = allAkad.length > 0 ? (allAkad.reduce((s, x) => s + (x.skor || 0), 0) / allAkad.length).toFixed(1) : 0;

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
