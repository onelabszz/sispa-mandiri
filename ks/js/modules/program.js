import { Store } from '../../storage.js';
import { Utils } from '../../../shared/js/utils.js';
import { Icons } from '../../../shared/js/icons.js';
import { Router } from '../../../shared/js/router.js';
import { emptyState } from '../helpers.js';

const getDefaultPeriode = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  return m >= 7 ? `${y}/${y + 1}-Ganjil` : `${y - 1}/${y}-Genap`;
};

export const Program = {
  _filterPeriode: '',

  async render() {
    const prog = Store.get('program');
    const guru = Store.get('guru');

    // Filter berdasarkan periode (jika dipilih)
    const filtered = this._filterPeriode
      ? prog.filter(p => p.periode === this._filterPeriode)
      : prog;

    // Kumpulkan daftar periode unik
    const periodeList = [...new Set(prog.map(p => p.periode))].sort().reverse();

    return `
      <div class="page-head">
        <div>
          <h2>Program Supervisi</h2>
          <div class="page-sub">${filtered.length} program ${this._filterPeriode ? `· ${this._filterPeriode}` : 'dari semua periode'}</div>
        </div>
        <div style="display:flex;gap:.5rem;flex-wrap:wrap">
          ${periodeList.length > 0 ? `
            <select class="select" id="filterPeriode" style="width:auto;min-width:180px">
              <option value="">Semua Periode</option>
              ${periodeList.map(p => `<option value="${p}" ${this._filterPeriode === p ? 'selected' : ''}>${p}</option>`).join('')}
            </select>
          ` : ''}
          <button class="btn btn-primary" id="btnAddProgram">${Icons.svg('plus', 16)} Tambah Program</button>
        </div>
      </div>

      ${filtered.length === 0 ? `<div class="card"><div class="card-body">
        ${emptyState('calendar-days', 'Belum ada program', 'Rencanakan jadwal supervisi guru di periode ini.',
          `<button class="btn btn-primary" id="btnEmptyAdd">${Icons.svg('plus', 16)} Tambah Program</button>`)}
      </div></div>` : `
        <div class="card"><table>
          <thead><tr>
            <th>Guru</th>
            <th style="text-align:center">Tipe</th>
            <th>Periode</th>
            <th>Waktu Rencana</th>
            <th style="text-align:right">Aksi</th>
          </tr></thead>
          <tbody>${filtered.map(p => {
            const g = guru.find(x => x.id === p.gid);
            const tipeBadge = g?.tipe === 'Professional' ? 'success'
              : g?.tipe === 'Analytical' ? 'info'
              : g?.tipe === 'Unfocused' ? 'warning'
              : g?.tipe === 'Dropout' ? 'danger' : 'neutral';
            return `<tr>
              <td>
                <div style="font-weight:600">${Utils.esc(g?.nama || '?')}</div>
                <div style="font-size:.75rem;color:var(--slate-500)">${Utils.esc(g?.mapel || '—')}${g?.kelas ? ' · Kls ' + g.kelas : ''}</div>
              </td>
              <td style="text-align:center">${g?.tipe ? `<span class="badge badge-${tipeBadge}">${g.tipe}</span>` : '<span style="color:var(--slate-400);font-size:.75rem">Belum</span>'}</td>
              <td style="font-family:monospace;font-size:.8rem">${Utils.esc(p.periode)}</td>
              <td style="font-size:.85rem">${p.waktu ? Utils.date(p.waktu) : '<span style="color:var(--slate-400)">Belum dijadwalkan</span>'}</td>
              <td style="text-align:right;white-space:nowrap">
                <button class="btn btn-secondary btn-sm" data-edit="${p.id}">${Icons.svg('pencil', 14)}</button>
                <button class="btn btn-danger btn-sm" data-del="${p.id}">${Icons.svg('trash-2', 14)}</button>
              </td>
            </tr>`;
          }).join('')}</tbody>
        </table></div>
      `}
    `;
  },

  async bind() {
    Utils.el('filterPeriode')?.addEventListener('change', e => {
      this._filterPeriode = e.target.value;
      Router.navigate('program');
    });

    Utils.el('btnAddProgram')?.addEventListener('click', () => this.form());
    Utils.el('btnEmptyAdd')?.addEventListener('click', () => this.form());

    document.querySelectorAll('[data-edit]').forEach(b => {
      b.onclick = () => this.form(b.dataset.edit);
    });
    document.querySelectorAll('[data-del]').forEach(b => {
      b.onclick = () => {
        Utils.confirm('Hapus Program?', 'Program akan dihapus permanen.', () => {
          Store.set('program', Store.get('program').filter(x => x.id !== b.dataset.del));
          Router.navigate('program');
        });
      };
    });
  },

  form(id) {
    const guru = Store.get('guru');
    if (guru.length === 0) return Utils.toast('Tambahkan guru dulu di Data Guru', 'warning');
    const edit = id ? Store.get('program').find(p => p.id === id) : null;

    Utils.modal(edit ? 'Edit Program' : 'Tambah Program', `
      <div class="form-group">
        <label class="label">Guru</label>
        <select class="select" id="pg" ${edit ? 'disabled' : ''}>
          ${guru.map(g => `
            <option value="${g.id}" ${edit?.gid === g.id ? 'selected' : ''}>
              ${Utils.esc(g.nama)}${g.tipe ? ` — ${g.tipe}` : ' — Belum dinilai tipe'}
            </option>
          `).join('')}
        </select>
      </div>
      <div class="row">
        <div class="form-group">
          <label class="label">Periode</label>
          <input class="input" id="pp" value="${Utils.esc(edit?.periode || getDefaultPeriode())}" placeholder="2025/2026-Ganjil">
        </div>
        <div class="form-group">
          <label class="label">Waktu Rencana (Opsional)</label>
          <input type="date" class="input" id="pw" value="${edit?.waktu || ''}">
        </div>
      </div>
      <div id="infoTipeBox" style="display:none;padding:.65rem;background:var(--brand-50);border-radius:8px;font-size:.8rem;color:var(--brand-700)"></div>
    `, `<button class="btn btn-secondary" onclick="Utils.closeModal()">Batal</button><button class="btn btn-primary" id="btnSaveProg">${Icons.svg('save', 16)} Simpan</button>`);

    const updateInfo = () => {
      const gid = Utils.el('pg').value;
      const g = guru.find(x => x.id === gid);
      const box = Utils.el('infoTipeBox');
      if (g?.tipe) {
        box.style.display = 'block';
        box.innerHTML = `<strong>Tipe: ${g.tipe}</strong> — Pendekatan: ${g.pendekatan}`;
      } else {
        box.style.display = 'none';
      }
    };
    Utils.el('pg').addEventListener('change', updateInfo);
    updateInfo();

    Utils.el('btnSaveProg').onclick = () => {
      const gid = edit ? edit.gid : Utils.el('pg').value;
      const periode = Utils.el('pp').value.trim();
      const waktu = Utils.el('pw').value;
      if (!gid) return Utils.toast('Pilih guru', 'error');
      if (!periode) return Utils.toast('Periode wajib diisi', 'error');

      const list = Store.get('program');
      // Cek duplikat (guru + periode sama) - hanya jika bukan edit
      if (!edit) {
        const dup = list.find(p => p.gid === gid && p.periode === periode);
        if (dup) return Utils.toast('Guru ini sudah ada di program periode tersebut', 'warning');
      }

      if (edit) {
        const idx = list.findIndex(x => x.id === edit.id);
        if (idx !== -1) list[idx] = { ...list[idx], periode, waktu };
      } else {
        list.push({ id: Utils.uid(), gid, periode, waktu });
      }
      Store.set('program', list);
      Utils.closeModal();
      Router.navigate('program');
      Utils.toast(edit ? 'Program diperbarui' : 'Program ditambahkan', 'success');
    };
  }
};
