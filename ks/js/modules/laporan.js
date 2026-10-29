import { Store } from '../../storage.js';
import { Utils } from '../../../shared/js/utils.js';
import { Icons } from '../../../shared/js/icons.js';
import { Router } from '../../../shared/js/router.js';
import { emptyState } from '../helpers.js';
import { Supervisi } from './supervisi.js';
import { SupervisiPM } from './supervisi-pm.js';
import { Akademik } from './akademik.js';
import { Coaching } from './coaching.js';

export const Laporan = {
  _filters: { q: '', jenis: '', status: '', bulan: '' },

  async render() {
    const akad = Store.get('akademik').map(x => ({ ...x, type: 'Akademik', max: 76 }));
    const coach = Store.get('coaching').map(x => ({ ...x, type: 'Coaching', max: 32 }));
    const sup3 = Store.get('supervisi').map(x => ({ ...x, type: '3 Tahap', max: '-' }));
    const pm = (Store.get('supervisiPM') || []).map(x => ({ ...x, type: 'Supervisi PM', max: 100, skor: (x.telaah && x.telaah.nilai) || 0 }));
    const all = [...akad, ...coach, ...sup3, ...pm].sort((a, b) => (b.tgl || '').localeCompare(a.tgl || ''));
    const guru = Store.get('guru');

    return `
      <div class="page-head">
        <div>
          <h2>Laporan & Riwayat</h2>
          <div class="page-sub">${all.length} sesi total</div>
        </div>
        ${all.length > 0 ? `<button class="btn btn-primary" onclick="Laporan.printRekapSemester()">${Icons.svg('printer', 16)} Cetak Rekap Semester</button>` : ''}
      </div>

      ${all.length === 0 ? `<div class="card"><div class="card-body">
        ${emptyState('file-text', 'Belum ada data', 'Laporan muncul setelah ada sesi supervisi.')}
      </div></div>` : `
        <div class="card" style="margin-bottom:1rem">
          <div class="card-body" style="padding:.75rem">
            <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr auto;gap:.5rem;align-items:end">
              <div><label class="label">Cari Guru</label><input class="input" id="fQ" placeholder="Nama guru..." value="${Utils.esc(this._filters.q)}"></div>
              <div><label class="label">Jenis</label><select class="select" id="fJenis">
                <option value="">Semua</option>
                <option value="3 Tahap" ${this._filters.jenis === '3 Tahap' ? 'selected' : ''}>3 Tahap</option>
                <option value="Akademik" ${this._filters.jenis === 'Akademik' ? 'selected' : ''}>Supervisi Digitalisasi</option>
                <option value="Coaching" ${this._filters.jenis === 'Coaching' ? 'selected' : ''}>Coaching Digitalisasi</option>
                <option value="Supervisi PM" ${this._filters.jenis === 'Supervisi PM' ? 'selected' : ''}>Supervisi PM</option>
              </select></div>
              <div><label class="label">Status</label><select class="select" id="fStatus">
                <option value="">Semua</option>
                <option value="selesai" ${this._filters.status === 'selesai' ? 'selected' : ''}>Selesai</option>
                <option value="draft" ${this._filters.status === 'draft' ? 'selected' : ''}>Draft</option>
              </select></div>
              <div><label class="label">Bulan</label><input type="month" class="input" id="fBulan" value="${this._filters.bulan}"></div>
              <div><button class="btn btn-ghost" id="btnReset">${Icons.svg('x', 14)} Reset</button></div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <span>${Icons.svg('file-text', 18)} Daftar Sesi <span id="resultCount" class="badge badge-neutral" style="margin-left:.5rem">0</span></span>
          </div>
          <div id="tableWrap"></div>
        </div>
      `}
    `;
  },

  async bind() {
    const hasData = Store.get('supervisi').length > 0
      || Store.get('akademik').length > 0
      || Store.get('coaching').length > 0;
    if (!hasData) return;

    this._draw();

    Utils.el('fQ')?.addEventListener('input', Utils.debounce((e) => {
      this._filters.q = e.target.value.toLowerCase().trim();
      this._draw();
    }, 200));
    Utils.el('fJenis')?.addEventListener('change', (e) => {
      this._filters.jenis = e.target.value;
      this._draw();
    });
    Utils.el('fStatus')?.addEventListener('change', (e) => {
      this._filters.status = e.target.value;
      this._draw();
    });
    Utils.el('fBulan')?.addEventListener('change', (e) => {
      this._filters.bulan = e.target.value;
      this._draw();
    });
    Utils.el('btnReset')?.addEventListener('click', () => {
      this._filters = { q: '', jenis: '', status: '', bulan: '' };
      Router.navigate('laporan');
    });
  },

  _draw() {
    const box = Utils.el('tableWrap');
    if (!box) return;

    const akad = Store.get('akademik').map(x => ({ ...x, type: 'Akademik', max: 76, status: 'selesai' }));
    const coach = Store.get('coaching').map(x => ({ ...x, type: 'Coaching', max: 32, status: 'selesai' }));
    const sup3 = Store.get('supervisi').map(x => ({ ...x, type: '3 Tahap', max: '-' }));
    const pm = (Store.get('supervisiPM') || []).map(x => ({ ...x, type: 'Supervisi PM', max: 100, skor: (x.telaah && x.telaah.nilai) || 0 }));
    const guru = Store.get('guru');

    let list = [...akad, ...coach, ...sup3, ...pm].sort((a, b) => (b.tgl || '').localeCompare(a.tgl || ''));

    // Apply filters
    if (this._filters.jenis) list = list.filter(s => s.type === this._filters.jenis);
    if (this._filters.status) list = list.filter(s => (s.status || 'selesai') === this._filters.status);
    if (this._filters.bulan) list = list.filter(s => (s.tgl || '').startsWith(this._filters.bulan));
    if (this._filters.q) {
      list = list.filter(s => {
        const g = guru.find(x => x.id === s.gid);
        return (g?.nama || '').toLowerCase().includes(this._filters.q);
      });
    }

    Utils.el('resultCount').textContent = list.length;

    if (list.length === 0) {
      box.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--slate-400);font-size:.85rem">Tidak ada hasil dengan filter ini</div>';
      return;
    }

    const typeLabel = { 'Akademik': 'Supervisi Digitalisasi', 'Coaching': 'Coaching Digitalisasi' };

    box.innerHTML = `<table><thead><tr>
      <th>Guru</th>
      <th>Jenis</th>
      <th>Tanggal</th>
      <th style="text-align:center">Status</th>
      <th style="text-align:center">Skor</th>
      <th style="text-align:right">Aksi</th>
    </tr></thead><tbody>${list.map(s => {
      const g = guru.find(x => x.id === s.gid);
      const skor = (s.skor !== undefined && s.skor !== null) ? s.skor : '-';
      const badge = s.type === 'Akademik' ? 'info' : s.type === 'Coaching' ? 'warning' : s.type === 'Supervisi PM' ? 'success' : 'neutral';
      const statusBadge = s.status === 'selesai' ? 'success' : s.status === 'draft' ? 'neutral' : 'warning';
      const statusLabel = s.status === 'selesai' ? 'Selesai' : s.status === 'draft' ? 'Draft' : 'Berjalan';
      return `<tr>
        <td style="font-weight:600">${Utils.esc(g?.nama || '?')}</td>
        <td><span class="badge badge-${badge}">${typeLabel[s.type] || s.type}</span></td>
        <td>${Utils.date(s.tgl)}</td>
        <td style="text-align:center"><span class="badge badge-${statusBadge}">${statusLabel}</span></td>
        <td style="text-align:center;font-weight:700">${skor} ${s.max && s.max !== '-' ? `<span style="font-weight:400;color:var(--slate-400);font-size:.75rem">/ ${s.max}</span>` : ''}</td>
        <td style="text-align:right;white-space:nowrap">
          <button class="btn btn-secondary btn-sm" data-print="${s.id}" data-type="${s.type}">${Icons.svg('printer', 14)} Cetak</button>
          <button class="btn btn-danger btn-sm" data-del="${s.id}" data-type="${s.type}">${Icons.svg('trash-2', 14)}</button>
        </td>
      </tr>`;
    }).join('')}</tbody></table>`;

    box.querySelectorAll('[data-print]').forEach(b => {
      b.onclick = () => {
        const type = b.dataset.type;
        const id = b.dataset.print;
        if (type === 'Akademik') Akademik.print(id);
        else if (type === 'Coaching') Coaching.print(id);
        else Supervisi.print(id);
      };
    });
    box.querySelectorAll('[data-del]').forEach(b => {
      b.onclick = () => {
        const id = b.dataset.del;
        const type = b.dataset.type;
        Utils.confirm('Hapus Data?', 'Akan dihapus permanen.', () => {
          if (type === 'Akademik') Store.set('akademik', Store.get('akademik').filter(x => x.id !== id));
          else if (type === 'Coaching') Store.set('coaching', Store.get('coaching').filter(x => x.id !== id));
          else Store.set('supervisi', Store.get('supervisi').filter(x => x.id !== id));
          Router.navigate('laporan');
        });
      };
    });
  },

  printRekapSemester() {
    const c = Store.config();
    const guru = Store.get('guru');
    const sup = Store.get('supervisi');
    const akad = Store.get('akademik');
    const coach = Store.get('coaching');
    const pm = Store.get('supervisiPM') || [];

    // Auto-detect periode aktif
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const periode = m >= 7 ? `${y}/${y+1} Ganjil` : `${y-1}/${y} Genap`;

    // Filter sesi dalam 6 bulan terakhir (auto detect semester)
    const cutOff = new Date();
    cutOff.setMonth(cutOff.getMonth() - 6);
    const cutoffISO = cutOff.toISOString().slice(0, 10);

    const supFiltered = sup.filter(s => (s.tgl || '') >= cutoffISO);
    const akadFiltered = akad.filter(s => (s.tgl || '') >= cutoffISO);
    const coachFiltered = coach.filter(s => (s.tgl || '') >= cutoffISO);
    const pmFiltered = pm.filter(s => (s.tgl || '') >= cutoffISO);

    const totalSesi = supFiltered.length + akadFiltered.length + coachFiltered.length + pmFiltered.length;

    // Statistik
    const guruIdsSup = new Set(supFiltered.map(s => s.gid));
    const guruIdsAkad = new Set(akadFiltered.map(s => s.gid));
    const guruIdsCoach = new Set(coachFiltered.map(s => s.gid));
    const guruIdsPM = new Set(pmFiltered.map(s => s.gid));
    const guruCovered = new Set([...guruIdsSup, ...guruIdsAkad, ...guruIdsCoach, ...guruIdsPM]);
    const coverage = guru.length > 0 ? Math.round(guruCovered.size / guru.length * 100) : 0;

    // Distribusi tipe
    const tipeDist = { Dropout: 0, Unfocused: 0, Analytical: 0, Professional: 0 };
    guru.forEach(g => { if (g.tipe && tipeDist[g.tipe] !== undefined) tipeDist[g.tipe]++; });

    // Rata-rata skor
    const avgAkad = akadFiltered.length > 0
      ? (akadFiltered.reduce((s, x) => s + (x.skor || 0), 0) / akadFiltered.length).toFixed(1)
      : '—';
    const avgCoach = coachFiltered.length > 0
      ? (coachFiltered.reduce((s, x) => s + (x.skor || 0), 0) / coachFiltered.length).toFixed(1)
      : '—';
    const avgPM = pmFiltered.length > 0
      ? (pmFiltered.reduce((s, x) => s + ((x.telaah && x.telaah.nilai) || 0), 0) / pmFiltered.length).toFixed(1)
      : '—';

    // Tabel per guru
    const guruRows = guru.map((g, i) => {
      const s3 = supFiltered.filter(s => s.gid === g.id).length;
      const sA = akadFiltered.filter(s => s.gid === g.id).length;
      const sC = coachFiltered.filter(s => s.gid === g.id).length;
      const sPM = pmFiltered.filter(s => s.gid === g.id).length;
      return `<tr>
        <td style="text-align:center">${i+1}</td>
        <td>${Utils.esc(g.nama)}</td>
        <td style="font-size:8.5pt">${Utils.esc(g.mapel || '-')}</td>
        <td style="text-align:center;font-size:8.5pt">${g.tipe || '—'}</td>
        <td style="text-align:center">${s3}</td>
        <td style="text-align:center">${sPM}</td>
        <td style="text-align:center">${sA}</td>
        <td style="text-align:center">${sC}</td>
      </tr>`;
    }).join('');

    Utils.el('printArea').innerHTML = `
      <h1>REKAP SUPERVISI SEMESTER</h1>
      <p class="sub">${Utils.esc(c.nama_sekolah)} — NPSN ${Utils.esc(c.npsn || '-')}<br>Periode: ${periode}</p>
      <table class="info">
        <tr><td>Kepala Sekolah</td><td>:</td><td><strong>${Utils.esc(c.nama_ks || '-')}</strong></td></tr>
        <tr><td>NIP</td><td>:</td><td>${Utils.esc(c.nip_ks || '-')}</td></tr>
        <tr><td>Tanggal Cetak</td><td>:</td><td>${new Date().toLocaleDateString('id-ID', {day:'2-digit',month:'long',year:'numeric'})}</td></tr>
      </table>

      <h2>Ringkasan</h2>
      <table class="info">
        <tr><td>Total Guru</td><td>:</td><td><strong>${guru.length}</strong></td></tr>
        <tr><td>Total Sesi Supervisi</td><td>:</td><td><strong>${totalSesi}</strong> (3T: ${supFiltered.length}, PM: ${pmFiltered.length}, Digitalisasi: ${akadFiltered.length}, Coaching: ${coachFiltered.length})</td></tr>
        <tr><td>Coverage (Guru Tersentuh)</td><td>:</td><td><strong>${guruCovered.size}/${guru.length} (${coverage}%)</strong></td></tr>
        <tr><td>Rata-rata Skor Supervisi Digitalisasi</td><td>:</td><td>${avgAkad} / 76</td></tr>
        <tr><td>Rata-rata Skor Coaching Digitalisasi</td><td>:</td><td>${avgCoach} / 32</td></tr>
        <tr><td>Rata-rata Skor Telaah PM</td><td>:</td><td>${avgPM} / 100</td></tr>
      </table>      </table>

      <h2>Distribusi Tipe Guru (Glickman)</h2>
      <table class="ind">
        <thead><tr>
          <th style="text-align:center">Dropout</th>
          <th style="text-align:center">Unfocused</th>
          <th style="text-align:center">Analytical</th>
          <th style="text-align:center">Professional</th>
          <th style="text-align:center">Belum Dinilai</th>
        </tr></thead>
        <tbody><tr>
          <td style="text-align:center">${tipeDist.Dropout}</td>
          <td style="text-align:center">${tipeDist.Unfocused}</td>
          <td style="text-align:center">${tipeDist.Analytical}</td>
          <td style="text-align:center">${tipeDist.Professional}</td>
          <td style="text-align:center">${guru.length - (tipeDist.Dropout+tipeDist.Unfocused+tipeDist.Analytical+tipeDist.Professional)}</td>
        </tr></tbody>
      </table>

      <h2>Rekap per Guru</h2>
      <table class="ind">
        <thead><tr>
          <th style="text-align:center;width:30px">#</th>
          <th>Nama Guru</th>
          <th>Mapel</th>
          <th style="text-align:center">Tipe</th>
          <th style="text-align:center">3T</th>
          <th style="text-align:center">PM</th>
          <th style="text-align:center">Digitalisasi</th>
          <th style="text-align:center">Coaching</th>
        </tr></thead>
      <tbody>${guruRows || '<tr><td colspan="8" style="text-align:center">Belum ada data guru</td></tr>'}</tbody>
      </table>

      <div class="ttd-grid">
        <div class="ttd-box"><div>Mengetahui,<br>Pengawas Pembina</div><div class="ttd-space"></div><div class="ttd-name">(...................................)</div></div>
        <div class="ttd-box"><div>${new Date().toLocaleDateString('id-ID', {day:'2-digit',month:'long',year:'numeric'})}<br>Kepala Sekolah</div><div class="ttd-space"></div><div class="ttd-name">${Utils.esc(c.nama_ks || '...')}</div><div style="font-size:8.5pt;color:#64748b">NIP. ${Utils.esc(c.nip_ks || '...')}</div></div>
      </div>`;
    setTimeout(() => window.print(), 200);
  }
};

// Expose ke window untuk onclick inline
if (typeof window !== 'undefined') window.Laporan = Laporan;
