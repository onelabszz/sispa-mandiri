import { Store } from '../../storage.js';
import { Utils } from '../../../shared/js/utils.js';
import { Icons } from '../../../shared/js/icons.js';
import { Router } from '../../../shared/js/router.js';
import { emptyState } from '../helpers.js';
import { Supervisi } from './supervisi.js';
import { Akademik } from './akademik.js';
import { Coaching } from './coaching.js';

export const Laporan = {
  _filters: { q: '', jenis: '', status: '', bulan: '' },

  async render() {
    const akad = Store.get('akademik').map(x => ({ ...x, type: 'Akademik', max: 76 }));
    const coach = Store.get('coaching').map(x => ({ ...x, type: 'Coaching', max: 32 }));
    const sup3 = Store.get('supervisi').map(x => ({ ...x, type: '3 Tahap', max: '-' }));
    const all = [...akad, ...coach, ...sup3].sort((a, b) => (b.tgl || '').localeCompare(a.tgl || ''));
    const guru = Store.get('guru');

    return `
      <div class="page-head">
        <div>
          <h2>Laporan & Riwayat</h2>
          <div class="page-sub">${all.length} sesi total</div>
        </div>
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
                <option value="Akademik" ${this._filters.jenis === 'Akademik' ? 'selected' : ''}>Akademik</option>
                <option value="Coaching" ${this._filters.jenis === 'Coaching' ? 'selected' : ''}>Coaching</option>
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
    if (Store.get('guru').length === 0 && Store.get('supervisi').length === 0 && Store.get('akademik').length === 0 && Store.get('coaching').length === 0) return;

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
    const guru = Store.get('guru');

    let list = [...akad, ...coach, ...sup3].sort((a, b) => (b.tgl || '').localeCompare(a.tgl || ''));

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
      const badge = s.type === 'Akademik' ? 'info' : s.type === 'Coaching' ? 'warning' : 'neutral';
      const statusBadge = s.status === 'selesai' ? 'success' : s.status === 'draft' ? 'neutral' : 'warning';
      const statusLabel = s.status === 'selesai' ? 'Selesai' : s.status === 'draft' ? 'Draft' : 'Berjalan';
      return `<tr>
        <td style="font-weight:600">${Utils.esc(g?.nama || '?')}</td>
        <td><span class="badge badge-${badge}">${s.type}</span></td>
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
  }
};
