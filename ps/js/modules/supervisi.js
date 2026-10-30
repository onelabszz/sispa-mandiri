import { Store } from '../../storage.js';
import { Utils } from '../../../shared/js/utils.js';
import { Icons } from '../../../shared/js/icons.js';
import { emptyState, allSesi, guruBySekolah } from '../helpers.js';
import {
  INSTRUMEN_TELAAH_RPP, KUALITATIF_TELAAH,
  INSTRUMEN_OBS_PM, REFLEKSI_PM,
  INSTRUMEN_AKADEMIK, INSTRUMEN_COACHING,
  REFLEKSI_7, PRINSIP_LIST, PENGALAMAN_LIST, DPL_LABELS, MOMEN_LIST
} from '../../../shared/js/constants.js';

export const Supervisi = {
  async render() {
    const sekolah = Store.get('sekolah');
    const sesi = allSesi();
    return `
      <div class="page-head">
        <div>
          <h2>Semua Sesi Supervisi</h2>
          <div class="page-sub">${sesi.length} sesi dari ${sekolah.length} sekolah</div>
        </div>
      </div>

      ${sesi.length === 0 ? `<div class="card"><div class="card-body">
        ${emptyState('clipboard-list', 'Belum ada sesi', 'Tambahkan data supervisi dengan mengimpor file JSON dari KS terlebih dahulu.', 
          `<button class="btn btn-primary" id="btnGoSekolah" style="margin-top:1rem">${Icons.svg('upload', 16)} Ke Menu Sekolah Binaan</button>`)}
      </div></div>` : `
        <div class="card"><div class="card-body" style="padding:.75rem">
          <div style="display:grid;grid-template-columns:2fr 1.2fr 1.2fr 2fr;gap:.5rem">
            <div><label class="label">Sekolah</label><select class="select" id="fSk">
              <option value="">Semua Sekolah</option>
              ${sekolah.map(sk => `<option value="${sk.id}">${Utils.esc(sk.nama_sekolah)}</option>`).join('')}
            </select></div>
            <div><label class="label">Jenis</label><select class="select" id="fJenis">
              <option value="">Semua</option>
              <option value="3 Tahap">3 Tahap</option>
              <option value="Supervisi PM">Supervisi PM</option>
              <option value="Supervisi Digitalisasi">Supervisi Digitalisasi</option>
              <option value="Coaching Digitalisasi">Coaching Digitalisasi</option>
            </select></div>
            <div><label class="label">Bulan</label><input type="month" class="input" id="fBulan"></div>
            <div><label class="label">Cari Guru</label><input class="input" id="fQ" placeholder="Nama guru..."></div>
          </div>
        </div></div>
        <div class="card"><div id="supList"></div></div>
      `}
    `;
  },

  async bind() {
    if (!Utils.el('fSk')) {
      Utils.el('btnGoSekolah')?.addEventListener('click', async () => {
        const { Router } = await import('../../../shared/js/router.js');
        Router.navigate('sekolah');
      });
      return;
    }

    const redraw = () => this._draw();
    Utils.el('fSk').onchange = redraw;
    Utils.el('fJenis').onchange = redraw;
    Utils.el('fBulan').onchange = redraw;
    Utils.el('fQ').oninput = Utils.debounce(redraw, 150);
    this._draw();
  },

  _draw() {
    const box = Utils.el('supList');
    if (!box) return;
    const skF = Utils.el('fSk').value;
    const jF = Utils.el('fJenis').value;
    const bF = Utils.el('fBulan').value;
    const q = Utils.el('fQ').value.toLowerCase().trim();
    let list = allSesi();
    if (skF) list = list.filter(s => s._skId === skF);
    if (jF) list = list.filter(s => s._jenis === jF);
    if (bF) list = list.filter(s => (s.tgl || '').startsWith(bF));
    if (q) list = list.filter(s => {
      const g = guruBySekolah(s._skId, s.gid);
      return (g?.nama || '').toLowerCase().includes(q);
    });
    if (list.length === 0) {
      box.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--slate-400);font-size:.85rem">Tidak ada sesi cocok</div>';
      return;
    }
    box.innerHTML = `<table><thead><tr>
      <th>Sekolah</th><th>Guru</th><th>Jenis</th><th>Tanggal</th>
      <th style="text-align:center">Skor</th>
      <th style="text-align:right">Aksi</th>
    </tr></thead><tbody>${list.map(s => {
      const g = guruBySekolah(s._skId, s.gid);
      let skor, max;
      if (s._jenis === 'Supervisi PM') {
        skor = (s.telaah && s.telaah.nilai) || 0;
        max = '/100';
      } else {
        skor = s.skor !== undefined && s.skor !== null ? s.skor : '-';
        max = s._jenis === 'Supervisi Digitalisasi' ? '/76' : s._jenis === 'Coaching Digitalisasi' ? '/32' : '';
      }
      const badge = s._jenis === 'Supervisi Digitalisasi' ? 'info'
        : s._jenis === 'Coaching Digitalisasi' ? 'warning'
        : s._jenis === 'Supervisi PM' ? 'success'
        : 'neutral';
      return `<tr>
        <td style="font-size:.8rem;color:var(--slate-600)">${Utils.esc(s._skNama)}</td>
        <td style="font-weight:600">${Utils.esc(g?.nama || '?')}</td>
        <td><span class="badge badge-${badge}">${s._jenis}</span></td>
        <td>${Utils.date(s.tgl)}</td>
        <td style="text-align:center;font-weight:700">${skor}${max ? ` <span style="font-weight:400;color:var(--slate-400);font-size:.7rem">${max}</span>` : ''}</td>
        <td style="text-align:right;white-space:nowrap">
          <button class="btn btn-secondary btn-sm" data-view="${s._skId}:${s.id}:${s._jenis}">${Icons.svg('eye', 14)}</button>
          <button class="btn btn-primary btn-sm" data-print="${s._skId}:${s.id}:${s._jenis}">${Icons.svg('printer', 14)}</button>
        </td>
      </tr>`;
    }).join('')}</tbody></table>`;
    box.querySelectorAll('[data-view]').forEach(b => {
      b.onclick = () => {
        const [skId, id, jenis] = b.dataset.view.split(':');
        this._detail(skId, id, jenis);
      };
    });
    box.querySelectorAll('[data-print]').forEach(b => {
      b.onclick = () => {
        const [skId, id, jenis] = b.dataset.print.split(':');
        this._print(skId, id, jenis);
      };
    });
  },

  // ============================================
  // HELPER — Visual skor dots
  // ============================================
  _skorDots(n) {
    if (n === undefined || n === null) return '<span style="color:var(--slate-300);font-size:.8rem">—</span>';
    const num = parseInt(n);
    if (isNaN(num)) return '<span style="color:var(--slate-300);font-size:.8rem">—</span>';
    const filled = '●'.repeat(num);
    const empty = '○'.repeat(Math.max(0, 4 - num));
    const color = num === 4 ? 'var(--success)' : num === 3 ? 'var(--info)' : num === 2 ? 'var(--warning)' : 'var(--danger)';
    return `<span style="color:${color};font-family:monospace;letter-spacing:1px;font-size:.85rem;white-space:nowrap">${filled}${empty}</span>`;
  },

  _chipList(list, cls = 'info') {
    if (!list || list.length === 0) return '<span style="color:var(--slate-400);font-size:.75rem;font-style:italic">—</span>';
    return list.map(x => `<span class="badge badge-${cls}" style="font-size:.65rem;margin:.1rem .2rem .1rem 0">${Utils.esc(x)}</span>`).join('');
  },

  // ============================================
  // MODAL DETAIL — Opsi 4 Hybrid
  // ============================================
  _detail(skId, id, jenis) {
    const sk = Store.get('sekolah').find(x => x.id === skId);
    if (!sk) return;
    const arr = jenis === 'Supervisi Digitalisasi' ? 'akademik'
      : jenis === 'Coaching Digitalisasi' ? 'coaching'
      : jenis === 'Supervisi PM' ? 'supervisiPM'
      : 'supervisi';
    const s = (sk[arr] || []).find(x => x.id === id);
    if (!s) return;
    const g = (sk.guru || []).find(x => x.id === s.gid);
    const guruName = (s.obs && s.obs.meta && s.obs.meta.nama_guru) || g?.nama || '?';
    const tglLabel = Utils.date(s.tgl);
    const isFinal = s.status === 'selesai' || jenis === 'Supervisi Digitalisasi' || jenis === 'Coaching Digitalisasi';
    const statusLabel = isFinal ? '✅ Selesai' : '🟡 Draft';

    const infoBar = `
      <div class="detail-info">
        <div class="detail-info-item">🏫 <strong>${Utils.esc(sk.nama_sekolah)}</strong></div>
        <div class="detail-info-item">📅 <strong>${tglLabel}</strong></div>
        <div class="detail-info-item">${statusLabel}</div>
        ${jenis === 'Supervisi PM' && s.obs && s.obs.meta && s.obs.meta.pemberi_umpan_balik ? `<div class="detail-info-item">👤 <strong>${Utils.esc(s.obs.meta.pemberi_umpan_balik)}</strong></div>` : ''}
      </div>`;

    let summaryHtml = '';
    let sectionsHtml = '';

    // ============================================
    // SUPERVISI PM
    // ============================================
    if (jenis === 'Supervisi PM') {
      const nilai = (s.telaah && s.telaah.nilai) || 0;
      const telaahKategori = nilai >= 86 ? 'Sangat Baik' : nilai >= 71 ? 'Baik' : nilai >= 56 ? 'Cukup' : 'Kurang';
      const telaahCls = nilai >= 86 ? 'success' : nilai >= 71 ? 'info' : nilai >= 56 ? 'warning' : 'danger';
      const obsFilled = Object.values((s.obs && s.obs.bukti) || {}).filter(v => v && String(v).trim()).length;
      const kualFilled = Object.values((s.telaah && s.telaah.kualitatif) || {}).filter(v => v && String(v).trim()).length;
      const reflFilled = Object.values(s.refleksi || {}).filter(v => v && String(v).trim()).length;
      const telaahTotal = Object.values((s.telaah && s.telaah.skor) || {}).reduce((a, b) => a + b, 0);

      summaryHtml = `
        <div class="detail-summary">
          <div class="detail-summary-card">
            <div class="detail-summary-label">🎯 Telaah RPP</div>
            <div class="detail-summary-value">${nilai}<span style="font-size:.75rem;color:var(--slate-400);font-weight:500">/100</span></div>
            <div class="detail-summary-sub"><span class="badge badge-${telaahCls}" style="font-size:.65rem">${telaahKategori}</span></div>
          </div>
          <div class="detail-summary-card">
            <div class="detail-summary-label">👁️ Observasi</div>
            <div class="detail-summary-value">${obsFilled}<span style="font-size:.75rem;color:var(--slate-400);font-weight:500">/15</span></div>
            <div class="detail-summary-sub">item dengan bukti</div>
          </div>
          <div class="detail-summary-card">
            <div class="detail-summary-label">💬 Kualitatif & Refleksi</div>
            <div class="detail-summary-value">${kualFilled + reflFilled}<span style="font-size:.75rem;color:var(--slate-400);font-weight:500">/6</span></div>
            <div class="detail-summary-sub">${kualFilled}/3 + ${reflFilled}/3</div>
          </div>
        </div>`;

      // Telaah items
      const telaahItems = INSTRUMEN_TELAAH_RPP.map(i => {
        const skor = (s.telaah && s.telaah.skor) ? s.telaah.skor[i.kode] : undefined;
        const kom = (s.telaah && s.telaah.komentar) ? (s.telaah.komentar[i.kode] || '') : '';
        return `<div class="detail-item">
          <div class="detail-item-head">
            <div class="detail-item-no">${i.kode}</div>
            <div class="detail-item-text">${Utils.esc(i.t)}</div>
            <div class="detail-item-skor">${this._skorDots(skor)}</div>
          </div>
          ${kom ? `<div class="detail-item-kom">💬 ${Utils.esc(kom)}</div>` : ''}
        </div>`;
      }).join('');

      const kualItems = KUALITATIF_TELAAH.map(q => {
        const val = (s.telaah && s.telaah.kualitatif) ? (s.telaah.kualitatif[q.kode] || '') : '';
        return `<div class="detail-item">
          <div class="detail-item-text"><strong>${q.kode}. ${Utils.esc(q.t)}</strong></div>
          ${val ? `<div class="detail-item-bukti">${Utils.esc(val)}</div>` : `<div class="detail-item-bukti" style="color:var(--slate-400);font-style:italic">(tidak diisi)</div>`}
        </div>`;
      }).join('');

      sectionsHtml += `
        <details class="detail-section" open>
          <summary>Telaah RPP (15 item)<span class="detail-section-badge">${telaahTotal}/60</span></summary>
          <div class="detail-content">${telaahItems}</div>
        </details>
        <details class="detail-section">
          <summary>Komentar Kualitatif<span class="detail-section-badge">${kualFilled}/3</span></summary>
          <div class="detail-content">${kualItems}</div>
        </details>`;

      // Obs items
      const obsItems = INSTRUMEN_OBS_PM.map(i => {
        const bukti = (s.obs && s.obs.bukti) ? (s.obs.bukti[i.kode] || '') : '';
        const cat = (s.obs && s.obs.catatan) ? (s.obs.catatan[i.kode] || '') : '';
        return `<div class="detail-item">
          <div class="detail-item-head">
            <div class="detail-item-no">${i.kode}</div>
            <div class="detail-item-text">${Utils.esc(i.t)}</div>
          </div>
          ${bukti ? `<div class="detail-item-bukti"><strong>Bukti:</strong> ${Utils.esc(bukti)}</div>` : `<div class="detail-item-bukti" style="color:var(--slate-400);font-style:italic">(belum ada bukti)</div>`}
          ${cat ? `<div class="detail-item-kom">📝 ${Utils.esc(cat)}</div>` : ''}
        </div>`;
      }).join('');

      sectionsHtml += `
        <details class="detail-section">
          <summary>Observasi Implementasi (15 item)<span class="detail-section-badge">${obsFilled}/15</span></summary>
          <div class="detail-content">${obsItems}</div>
        </details>`;

      // Refleksi
      const reflItems = REFLEKSI_PM.map(q => {
        const val = s.refleksi ? (s.refleksi[q.kode] || '') : '';
        return `<div class="detail-item">
          <div class="detail-item-text"><strong>${q.kode}. ${Utils.esc(q.t)}</strong></div>
          ${val ? `<div class="detail-item-bukti">${Utils.esc(val)}</div>` : `<div class="detail-item-bukti" style="color:var(--slate-400);font-style:italic">(tidak diisi)</div>`}
        </div>`;
      }).join('');

      sectionsHtml += `
        <details class="detail-section">
          <summary>Refleksi & RTL (3 item)<span class="detail-section-badge">${reflFilled}/3</span></summary>
          <div class="detail-content">${reflItems}</div>
        </details>`;
    }

    // ============================================
    // SUPERVISI DIGITALISASI (Akademik)
    // ============================================
    else if (jenis === 'Supervisi Digitalisasi') {
      const skor = s.skor || 0;
      const pct = Math.round((skor / 76) * 100);
      const pctCls = pct >= 86 ? 'success' : pct >= 71 ? 'info' : pct >= 56 ? 'warning' : 'danger';
      const pctLabel = pct >= 86 ? 'Sangat Baik' : pct >= 71 ? 'Baik' : pct >= 56 ? 'Cukup' : 'Kurang';

      summaryHtml = `
        <div class="detail-summary">
          <div class="detail-summary-card">
            <div class="detail-summary-label">📊 Skor Total</div>
            <div class="detail-summary-value">${skor}<span style="font-size:.75rem;color:var(--slate-400);font-weight:500">/76</span></div>
            <div class="detail-summary-sub">19 indikator</div>
          </div>
          <div class="detail-summary-card">
            <div class="detail-summary-label">⭐ Persentase</div>
            <div class="detail-summary-value">${pct}%</div>
            <div class="detail-summary-sub"><span class="badge badge-${pctCls}" style="font-size:.65rem">${pctLabel}</span></div>
          </div>
          <div class="detail-summary-card">
            <div class="detail-summary-label">📚 Mapel / Materi</div>
            <div class="detail-summary-value" style="font-size:.85rem">${Utils.esc(s.mapel || '—')}</div>
            <div class="detail-summary-sub">${Utils.esc(s.materi || '—')}</div>
          </div>
        </div>`;

      const items = INSTRUMEN_AKADEMIK.map(i => {
        const skorVal = (s.detail || {})[i.kode];
        const cat = (s.catatan || {})[i.kode] || '';
        return `<div class="detail-item">
          <div class="detail-item-head">
            <div class="detail-item-no">${i.kode}</div>
            <div class="detail-item-text">${Utils.esc(i.t)}</div>
            <div class="detail-item-skor">${this._skorDots(skorVal)}</div>
          </div>
          ${cat ? `<div class="detail-item-kom">💬 ${Utils.esc(cat)}</div>` : ''}
        </div>`;
      }).join('');

      sectionsHtml += `
        <details class="detail-section" open>
          <summary>19 Indikator Pembelajaran Digital<span class="detail-section-badge">${Object.keys(s.detail || {}).length}/19</span></summary>
          <div class="detail-content">${items}</div>
        </details>`;

      if (s.catatan_tambahan || s.kekuatan || s.area_pengembangan || s.rtl) {
        sectionsHtml += `
          <details class="detail-section">
            <summary>Catatan & RTL</summary>
            <div class="detail-content">
              ${s.catatan_tambahan ? `<div class="detail-item"><div class="detail-item-text"><strong>Catatan Tambahan:</strong></div><div class="detail-item-bukti">${Utils.esc(s.catatan_tambahan)}</div></div>` : ''}
              ${s.kekuatan ? `<div class="detail-item"><div class="detail-item-text"><strong>Kekuatan:</strong></div><div class="detail-item-bukti">${Utils.esc(s.kekuatan)}</div></div>` : ''}
              ${s.area_pengembangan ? `<div class="detail-item"><div class="detail-item-text"><strong>Area Pengembangan:</strong></div><div class="detail-item-bukti">${Utils.esc(s.area_pengembangan)}</div></div>` : ''}
              ${s.rtl ? `<div class="detail-item"><div class="detail-item-text"><strong>RTL:</strong></div><div class="detail-item-bukti">${Utils.esc(s.rtl)}</div></div>` : ''}
            </div>
          </details>`;
      }
    }

    // ============================================
    // COACHING DIGITALISASI
    // ============================================
    else if (jenis === 'Coaching Digitalisasi') {
      const skor = s.skor || 0;
      const pct = Math.round((skor / 32) * 100);
      const pctCls = pct >= 86 ? 'success' : pct >= 71 ? 'info' : pct >= 51 ? 'warning' : 'danger';
      const katLabel = pct >= 86 ? 'Konsisten' : pct >= 71 ? 'Berkembang' : pct >= 51 ? 'Mulai Tampak' : 'Belum Tampak';
      const rtlCount = (s.rtl || []).filter(r => (r.aksi || '').trim()).length;

      summaryHtml = `
        <div class="detail-summary">
          <div class="detail-summary-card">
            <div class="detail-summary-label">📊 Skor Total</div>
            <div class="detail-summary-value">${skor}<span style="font-size:.75rem;color:var(--slate-400);font-weight:500">/32</span></div>
            <div class="detail-summary-sub">8 indikator</div>
          </div>
          <div class="detail-summary-card">
            <div class="detail-summary-label">🏷️ Kategori</div>
            <div class="detail-summary-value" style="font-size:1rem"><span class="badge badge-${pctCls}" style="font-size:.75rem">${katLabel}</span></div>
            <div class="detail-summary-sub">${pct}%</div>
          </div>
          <div class="detail-summary-card">
            <div class="detail-summary-label">💬 RTL</div>
            <div class="detail-summary-value">${rtlCount}<span style="font-size:.75rem;color:var(--slate-400);font-weight:500"> item</span></div>
            <div class="detail-summary-sub">rencana tindak lanjut</div>
          </div>
        </div>`;

      const items = INSTRUMEN_COACHING.map(i => {
        const skorVal = (s.detail || {})[i.kode];
        const cat = (s.catatan || {})[i.kode] || '';
        return `<div class="detail-item">
          <div class="detail-item-head">
            <div class="detail-item-no">${i.tahap}</div>
            <div class="detail-item-text">${Utils.esc(i.t)}</div>
            <div class="detail-item-skor">${this._skorDots(skorVal)}</div>
          </div>
          ${cat ? `<div class="detail-item-kom">💬 ${Utils.esc(cat)}</div>` : ''}
        </div>`;
      }).join('');

      sectionsHtml += `
        <details class="detail-section" open>
          <summary>8 Indikator STAR-GROW<span class="detail-section-badge">${Object.keys(s.detail || {}).length}/8</span></summary>
          <div class="detail-content">${items}</div>
        </details>`;

      if ((s.rtl || []).length > 0 || s.kekuatan || s.area) {
        const rtlHtml = (s.rtl || []).filter(r => (r.aksi || '').trim()).map((r, i) => `
          <div class="detail-item">
            <div class="detail-item-text"><strong>RTL ${i + 1}:</strong> ${Utils.esc(r.aksi || '')}</div>
            <div style="font-size:.75rem;color:var(--slate-500);margin-top:.25rem">
              ${r.waktu ? `⏰ ${Utils.esc(r.waktu)}` : ''}${r.dukungan ? ` · 🤝 ${Utils.esc(r.dukungan)}` : ''}${r.indikator ? ` · 🎯 ${Utils.esc(r.indikator)}` : ''}
            </div>
          </div>`).join('');

        sectionsHtml += `
          <details class="detail-section">
            <summary>Catatan & RTL</summary>
            <div class="detail-content">
              ${s.kekuatan ? `<div class="detail-item"><div class="detail-item-text"><strong>Kekuatan:</strong></div><div class="detail-item-bukti">${Utils.esc(s.kekuatan)}</div></div>` : ''}
              ${s.area ? `<div class="detail-item"><div class="detail-item-text"><strong>Area Pengembangan:</strong></div><div class="detail-item-bukti">${Utils.esc(s.area)}</div></div>` : ''}
              ${rtlHtml}
            </div>
          </details>`;
      }
    }

    // ============================================
    // SUPERVISI 3 TAHAP
    // ============================================
    else {
      const reflFilled = Object.values(s.refleksi || {}).filter(v => v && String(v).trim()).length;
      const rtlFilled = (s.rtl && s.rtl.aksi) ? '✓' : '—';

      summaryHtml = `
        <div class="detail-summary">
          <div class="detail-summary-card">
            <div class="detail-summary-label">📋 Status</div>
            <div class="detail-summary-value" style="font-size:1rem">${s.status === 'selesai' ? '<span class="badge badge-success">Selesai</span>' : '<span class="badge badge-warning">Draft</span>'}</div>
            <div class="detail-summary-sub">siklus 3 tahap</div>
          </div>
          <div class="detail-summary-card">
            <div class="detail-summary-label">💬 Refleksi</div>
            <div class="detail-summary-value">${reflFilled}<span style="font-size:.75rem;color:var(--slate-400);font-weight:500">/7</span></div>
            <div class="detail-summary-sub">pertanyaan</div>
          </div>
          <div class="detail-summary-card">
            <div class="detail-summary-label">🎯 RTL</div>
            <div class="detail-summary-value">${rtlFilled}</div>
            <div class="detail-summary-sub">rencana tindak lanjut</div>
          </div>
        </div>`;

      // Chips data 3T
      const prinsipChips = PRINSIP_LIST.filter(p => s.prinsip_pm && s.prinsip_pm[p.key]).map(p => p.label);
      const pengalamanChips = PENGALAMAN_LIST.filter(p => s.pengalaman && s.pengalaman[p.key]).map(p => p.label);
      const dplChips = (s.dpl || []).map(n => DPL_LABELS[n - 1]).filter(Boolean);
      const momenChips = (s.momen || []).map(k => {
        const m = MOMEN_LIST.find(x => x.key === k);
        return m ? m.label : k;
      });

      sectionsHtml += `
        <details class="detail-section" open>
          <summary>1. Pra-Observasi</summary>
          <div class="detail-content">
            <div class="detail-item"><div class="detail-item-text"><strong>Tujuan:</strong> ${Utils.esc(s.tujuan || '—')}</div></div>
            <div class="detail-item"><div class="detail-item-text"><strong>Strategi:</strong> ${Utils.esc(s.strategi || '—')}</div></div>
            <div class="detail-item"><div class="detail-item-text"><strong>Asesmen:</strong> ${Utils.esc(s.asesmen || '—')}</div></div>
            <div class="detail-item"><div class="detail-item-text"><strong>Prinsip PM:</strong> ${this._chipList(prinsipChips, 'info')}</div></div>
            <div class="detail-item"><div class="detail-item-text"><strong>Pengalaman Belajar:</strong> ${this._chipList(pengalamanChips, 'success')}</div></div>
            <div class="detail-item"><div class="detail-item-text"><strong>DPL:</strong> ${this._chipList(dplChips, 'warning')}</div></div>
          </div>
        </details>
        <details class="detail-section">
          <summary>2. Observasi</summary>
          <div class="detail-content">
            <div class="detail-item"><div class="detail-item-text"><strong>Aktivitas Guru:</strong> ${Utils.esc(s.obs_guru || '—')}</div></div>
            <div class="detail-item"><div class="detail-item-text"><strong>Aktivitas Murid:</strong> ${Utils.esc(s.obs_murid || '—')}</div></div>
            <div class="detail-item"><div class="detail-item-text"><strong>Momen PM:</strong> ${this._chipList(momenChips, 'info')}</div></div>
            <div class="detail-item"><div class="detail-item-text"><strong>KKA:</strong> ${Utils.esc(s.kka || '—')}</div></div>
            <div class="detail-item"><div class="detail-item-text"><strong>Durasi:</strong> ${s.durasi || '—'} menit</div></div>
          </div>
        </details>
        <details class="detail-section">
          <summary>3. Pasca-Observasi<span class="detail-section-badge">${reflFilled}/7</span></summary>
          <div class="detail-content">
            ${REFLEKSI_7.map((r, i) => {
              const val = (s.refleksi || {})[r.key];
              return `<div class="detail-item">
                <div class="detail-item-text"><strong>${i + 1}. ${Utils.esc(r.q)}</strong></div>
                ${val ? `<div class="detail-item-bukti">${Utils.esc(val)}</div>` : `<div class="detail-item-bukti" style="color:var(--slate-400);font-style:italic">(tidak diisi)</div>`}
              </div>`;
            }).join('')}
          </div>
        </details>
        <details class="detail-section">
          <summary>RTL</summary>
          <div class="detail-content">
            <div class="detail-item"><div class="detail-item-text"><strong>Aksi:</strong> ${Utils.esc((s.rtl && s.rtl.aksi) || '—')}</div></div>
            <div class="detail-item"><div class="detail-item-text"><strong>Waktu:</strong> ${Utils.esc((s.rtl && s.rtl.waktu) || '—')}</div></div>
            <div class="detail-item"><div class="detail-item-text"><strong>Dukungan:</strong> ${Utils.esc((s.rtl && s.rtl.dukungan) || '—')}</div></div>
            <div class="detail-item"><div class="detail-item-text"><strong>Indikator:</strong> ${Utils.esc((s.rtl && s.rtl.indikator) || '—')}</div></div>
          </div>
        </details>`;
    }

    const body = `${infoBar}${summaryHtml}${sectionsHtml}`;
    const footer = `
      <button class="btn btn-secondary" onclick="Utils.closeModal()">Tutup</button>
      <button class="btn btn-primary" id="btnPrintDetail">${Icons.svg('printer', 16)} Cetak PDF</button>`;

    Utils.modal(`Detail ${jenis} — ${guruName}`, body, footer, true);

    setTimeout(() => {
      Utils.el('btnPrintDetail')?.addEventListener('click', () => {
        Utils.closeModal();
        this._print(skId, id, jenis);
      });
    }, 80);
  },

  // ============================================
  // PRINT
  // ============================================
  _print(skId, id, jenis) {
    const sk = Store.get('sekolah').find(x => x.id === skId);
    if (!sk) return;
    const arr = jenis === 'Supervisi Digitalisasi' ? 'akademik'
      : jenis === 'Coaching Digitalisasi' ? 'coaching'
      : jenis === 'Supervisi PM' ? 'supervisiPM'
      : 'supervisi';
    const s = (sk[arr] || []).find(x => x.id === id);
    if (!s) return;
    const g = (sk.guru || []).find(x => x.id === s.gid);
    const c = Store.config();

    if (jenis === 'Supervisi PM') {
      this._printPM(s, g, sk, c);
      return;
    }

    if (jenis === 'Supervisi Digitalisasi') {
      let html = '';
      INSTRUMEN_AKADEMIK.forEach(i => {
        html += `<tr><td class="kode">${i.kode}</td><td>${i.t}</td><td class="skor">${(s.detail || {})[i.kode] || '-'}</td><td>${Utils.esc((s.catatan || {})[i.kode] || '')}</td></tr>`;
      });
      Utils.el('printArea').innerHTML = `
        <h1>LEMBAR SUPERVISI DIGITALISASI</h1>
        <p class="sub">${Utils.esc(sk.nama_sekolah)}</p>
        <table class="info">
          <tr><td>Guru</td><td>:</td><td><strong>${Utils.esc(g?.nama)}</strong></td></tr>
          <tr><td>Mapel / Materi</td><td>:</td><td>${Utils.esc(s.mapel || '-')} / ${Utils.esc(s.materi || '-')}</td></tr>
          <tr><td>Tanggal</td><td>:</td><td>${Utils.date(s.tgl)}</td></tr>
          <tr><td>Skor Total</td><td>:</td><td><strong>${s.skor} / 76</strong></td></tr>
        </table>
        <table class="ind"><thead><tr><th>Kode</th><th>Indikator</th><th>Skor</th><th>Catatan</th></tr></thead><tbody>${html}</tbody></table>
        <p><strong>Kekuatan:</strong> ${Utils.esc(s.kekuatan || '-')}</p>
        <p><strong>Area:</strong> ${Utils.esc(s.area_pengembangan || '-')}</p>
        <p><strong>RTL:</strong> ${Utils.esc(s.rtl || '-')}</p>
        <div class="ttd-grid">
          <div class="ttd-box"><div>Kepala Sekolah</div><div class="ttd-space"></div><div class="ttd-name">${Utils.esc(sk.ks_nama || '...')}</div></div>
          <div class="ttd-box"><div>Guru</div><div class="ttd-space"></div><div class="ttd-name">${Utils.esc(g?.nama)}</div></div>
        </div>`;
    } else if (jenis === 'Coaching Digitalisasi') {
      let html = '';
      INSTRUMEN_COACHING.forEach(i => {
        html += `<tr><td class="kode">${i.tahap}</td><td>${i.t}</td><td class="skor">${(s.detail || {})[i.kode] || '-'}</td><td>${Utils.esc((s.catatan || {})[i.kode] || '')}</td></tr>`;
      });
      const rtlHtml = (s.rtl || []).map((r, i) =>
        `<tr><td>${i + 1}</td><td>${Utils.esc(r.aksi)}</td><td>${Utils.esc(r.waktu)}</td><td>${Utils.esc(r.dukungan)}</td><td>${Utils.esc(r.indikator)}</td></tr>`
      ).join('');
      Utils.el('printArea').innerHTML = `
        <h1>LEMBAR COACHING DIGITALISASI</h1>
        <p class="sub">${Utils.esc(sk.nama_sekolah)}</p>
        <table class="info">
          <tr><td>Guru</td><td>:</td><td><strong>${Utils.esc(g?.nama)}</strong></td></tr>
          <tr><td>Tanggal</td><td>:</td><td>${Utils.date(s.tgl)}</td></tr>
          <tr><td>Skor Total</td><td>:</td><td><strong>${s.skor} / 32</strong></td></tr>
        </table>
        <table class="ind"><thead><tr><th>Tahap</th><th>Indikator</th><th>Skor</th><th>Catatan</th></tr></thead><tbody>${html}</tbody></table>
        <p><strong>Kekuatan:</strong> ${Utils.esc(s.kekuatan || '-')}</p>
        <p><strong>Area:</strong> ${Utils.esc(s.area || '-')}</p>
        <h2>RTL / Kontrak Belajar</h2>
        <table class="ind"><thead><tr><th>No</th><th>Aksi</th><th>Waktu</th><th>Dukungan</th><th>Indikator</th></tr></thead><tbody>${rtlHtml || '<tr><td colspan="5">—</td></tr>'}</tbody></table>
        <div class="ttd-grid">
          <div class="ttd-box"><div>Kepala Sekolah</div><div class="ttd-space"></div><div class="ttd-name">${Utils.esc(sk.ks_nama || '...')}</div></div>
          <div class="ttd-box"><div>Guru</div><div class="ttd-space"></div><div class="ttd-name">${Utils.esc(g?.nama)}</div></div>
        </div>`;
    } else {
      const prinsipAktif = PRINSIP_LIST.filter(p => s.prinsip_pm && s.prinsip_pm[p.key]).map(p => p.label).join(', ') || '—';
      const pengalamanAktif = PENGALAMAN_LIST.filter(p => s.pengalaman && s.pengalaman[p.key]).map(p => p.label).join(', ') || '—';
      const dplAktif = (s.dpl || []).map(n => DPL_LABELS[n - 1]).join(', ') || '—';
      const momenLabels = (s.momen || []).map(k => (MOMEN_LIST.find(m => m.key === k) || {}).label || k).join(', ') || '—';
      const refleksiHtml = REFLEKSI_7.map((r, i) =>
        `<div style="margin-bottom:6px"><strong>${i + 1}. ${r.q}</strong><br>${Utils.esc((s.refleksi || {})[r.key] || '-')}</div>`
      ).join('');
      Utils.el('printArea').innerHTML = `
        <h1>LAPORAN SUPERVISI 3 TAHAP</h1>
        <p class="sub">${Utils.esc(sk.nama_sekolah)}</p>
        <table class="info">
          <tr><td>Guru</td><td>:</td><td><strong>${Utils.esc(g?.nama)}</strong></td></tr>
          <tr><td>Tanggal</td><td>:</td><td>${Utils.date(s.tgl)}</td></tr>
        </table>
        <h2>1. Pra-Observasi</h2>
        <p><strong>Tujuan:</strong> ${Utils.esc(s.tujuan || '-')}</p>
        <p><strong>Strategi:</strong> ${Utils.esc(s.strategi || '-')}</p>
        <p><strong>Prinsip PM:</strong> ${prinsipAktif}</p>
        <p><strong>Pengalaman:</strong> ${pengalamanAktif}</p>
        <p><strong>DPL:</strong> ${dplAktif}</p>
        <h2>2. Observasi</h2>
        <p><strong>Aktivitas Guru:</strong> ${Utils.esc(s.obs_guru || '-')}</p>
        <p><strong>Aktivitas Murid:</strong> ${Utils.esc(s.obs_murid || '-')}</p>
        <p><strong>Momen PM:</strong> ${momenLabels}</p>
        <p><strong>KKA:</strong> ${Utils.esc(s.kka || '-')}</p>
        <h2>3. Pasca-Observasi</h2>
        ${refleksiHtml}
        <h2>RTL</h2>
        <p><strong>Aksi:</strong> ${Utils.esc((s.rtl && s.rtl.aksi) || '-')}</p>
        <p><strong>Waktu:</strong> ${Utils.esc((s.rtl && s.rtl.waktu) || '-')}</p>
        <p><strong>Indikator:</strong> ${Utils.esc((s.rtl && s.rtl.indikator) || '-')}</p>
        <div class="ttd-grid">
          <div class="ttd-box"><div>Kepala Sekolah</div><div class="ttd-space"></div><div class="ttd-name">${Utils.esc(sk.ks_nama || '...')}</div></div>
          <div class="ttd-box"><div>Guru</div><div class="ttd-space"></div><div class="ttd-name">${Utils.esc(g?.nama)}</div></div>
        </div>`;
    }
    setTimeout(() => window.print(), 200);
  },

  // ============================================
  // PRINT PM (3-section A4)
  // ============================================
  _printPM(s, g, sk, c) {
    const t = s.telaah || {};
    const o = s.obs || {};
    const r = s.refleksi || {};
    const tMeta = t.meta || {};
    const oMeta = o.meta || {};
    const tSkor = t.skor || {};
    const tKom = t.komentar || {};
    const tKual = t.kualitatif || {};
    const oBukti = o.bukti || {};
    const oCat = o.catatan || {};

    const telaahRows = INSTRUMEN_TELAAH_RPP.map(i =>
      `<tr>
        <td class="kode" style="text-align:center">${i.kode}</td>
        <td>${Utils.esc(i.t)}</td>
        <td class="skor" style="text-align:center">${tSkor[i.kode] ?? '-'}</td>
        <td>${Utils.esc(tKom[i.kode] || '')}</td>
      </tr>`).join('');

    const kualHtml = KUALITATIF_TELAAH.map(q =>
      `<p><strong>${q.kode}. ${Utils.esc(q.t)}</strong><br>${Utils.esc(tKual[q.kode] || '-')}</p>`
    ).join('');

    const obsRows = INSTRUMEN_OBS_PM.map(i =>
      `<tr>
        <td class="kode" style="text-align:center">${i.kode}</td>
        <td>${Utils.esc(i.t)}</td>
        <td>${Utils.esc(oBukti[i.kode] || '')}</td>
        <td>${Utils.esc(oCat[i.kode] || '')}</td>
      </tr>`).join('');

    const refleksiHtml = REFLEKSI_PM.map(q =>
      `<p><strong>${q.kode}. ${Utils.esc(q.t)}</strong><br>${Utils.esc(r[q.kode] || '-')}</p>`
    ).join('');

    const totalTelaah = t.total || Object.values(tSkor).reduce((a, b) => a + b, 0);
    const nilai = t.nilai || Math.round(totalTelaah / 60 * 100);

    Utils.el('printArea').innerHTML = `
      <h1>LAPORAN SUPERVISI PM</h1>
      <p class="sub">${Utils.esc(sk.nama_sekolah)} — NPSN ${Utils.esc(sk.npsn || '-')}</p>

      <table class="info">
        <tr><td>Nama Guru</td><td>:</td><td><strong>${Utils.esc(oMeta.nama_guru || g?.nama || '-')}</strong></td></tr>
        <tr><td>NIP</td><td>:</td><td>${Utils.esc(g?.nip || '-')}</td></tr>
        <tr><td>Tanggal</td><td>:</td><td>${Utils.date(s.tgl)}</td></tr>
        <tr><td>Pemberi Umpan Balik</td><td>:</td><td>${Utils.esc(oMeta.pemberi_umpan_balik || sk.ks_nama || c.nama_pengawas || '-')}</td></tr>
      </table>

      <h2>1. Telaah RPP</h2>
      <table class="info">
        <tr><td>Jenjang</td><td>:</td><td>${Utils.esc(tMeta.jenjang || '-')}</td></tr>
        <tr><td>Mata Pelajaran</td><td>:</td><td>${Utils.esc(tMeta.mapel || oMeta.mapel || '-')}</td></tr>
        <tr><td>Kelas</td><td>:</td><td>${Utils.esc(tMeta.kelas || oMeta.kelas_semester || '-')}</td></tr>
        <tr><td>Judul Perencanaan</td><td>:</td><td>${Utils.esc(tMeta.judul_rpp || '-')}</td></tr>
        <tr><td>Skor Total</td><td>:</td><td><strong>${totalTelaah} / 60 (Nilai: ${nilai})</strong></td></tr>
      </table>
      <table class="ind">
        <thead><tr><th style="width:30px;text-align:center">No</th><th>Aspek</th><th style="width:40px;text-align:center">Skor</th><th>Komentar Kritis</th></tr></thead>
        <tbody>${telaahRows}</tbody>
      </table>
      ${kualHtml}

      <h2 style="page-break-before:always">2. Observasi Implementasi</h2>
      <table class="info">
        <tr><td>Hari/Tanggal</td><td>:</td><td>${Utils.date(oMeta.hari_tanggal || s.tgl)}</td></tr>
        <tr><td>Satuan Pendidikan</td><td>:</td><td>${Utils.esc(oMeta.satuan_pendidikan || sk.nama_sekolah)}</td></tr>
        <tr><td>Kelas/Semester</td><td>:</td><td>${Utils.esc(oMeta.kelas_semester || '-')}</td></tr>
        <tr><td>Mata Pelajaran</td><td>:</td><td>${Utils.esc(oMeta.mapel || '-')}</td></tr>
      </table>
      <table class="ind">
        <thead><tr><th style="width:30px;text-align:center">No</th><th>Aspek</th><th>Bukti Pembelajaran</th><th>Catatan</th></tr></thead>
        <tbody>${obsRows}</tbody>
      </table>

      <h2 style="page-break-before:always">3. Refleksi & RTL</h2>
      ${refleksiHtml}

      <div class="ttd-grid">
        <div class="ttd-box"><div>Kepala Sekolah</div><div class="ttd-space"></div><div class="ttd-name">${Utils.esc(sk.ks_nama || '...')}</div><div style="font-size:8.5pt;color:#64748b">NIP. ${Utils.esc(sk.ks_nip || '...')}</div></div>
        <div class="ttd-box"><div>Guru</div><div class="ttd-space"></div><div class="ttd-name">${Utils.esc(g?.nama || '...')}</div><div style="font-size:8.5pt;color:#64748b">NIP. ${Utils.esc(g?.nip || '...')}</div></div>
      </div>`;
    setTimeout(() => window.print(), 200);
  }
};
