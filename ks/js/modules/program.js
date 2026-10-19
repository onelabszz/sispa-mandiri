import { Store } from '../../storage.js';
import { Utils } from '../../../shared/js/utils.js';
import { Icons } from '../../../shared/js/icons.js';
import { Router } from '../../../shared/js/router.js';
import { emptyState } from '../helpers.js';

export const Program = {
  async render() {
    const prog = Store.get('program');
    const guru = Store.get('guru');

    return `
      <div class="page-head">
        <div>
          <h2>Program Supervisi</h2>
          <div class="page-sub">${prog.length} program terdaftar</div>
        </div>
        <button class="btn btn-primary" id="btnAddProgram">${Icons.svg('plus', 16)} Tambah Program</button>
      </div>

      ${prog.length === 0 ? `<div class="card"><div class="card-body">
        ${emptyState('calendar-days', 'Belum ada program', 'Tambahkan program supervisi untuk merencanakan jadwal per periode.',
          `<button class="btn btn-primary" id="btnEmptyAdd">${Icons.svg('plus', 16)} Tambah Program</button>`)}
      </div></div>` : `
        <div class="card"><table>
          <thead><tr>
            <th>Guru</th>
            <th>Periode</th>
            <th>Waktu Rencana</th>
            <th style="text-align:right">Aksi</th>
          </tr></thead>
          <tbody>${prog.map(p => {
            const g = guru.find(g => g.id === p.gid);
            return `<tr>
              <td style="font-weight:600">${Utils.esc(g?.nama || '?')}</td>
              <td style="font-family:monospace;font-size:.8rem">${Utils.esc(p.periode)}</td>
              <td style="font-size:.85rem">${p.waktu ? Utils.date(p.waktu) : '—'}</td>
              <td style="text-align:right">
                <button class="btn btn-danger btn-sm" data-del="${p.id}">${Icons.svg('trash-2', 14)} Hapus</button>
              </td>
            </tr>`;
          }).join('')}</tbody>
        </table></div>
      `}
    `;
  },

  async bind() {
    Utils.el('btnAddProgram')?.addEventListener('click', () => Program.form());
    Utils.el('btnEmptyAdd')?.addEventListener('click', () => Program.form());
    document.querySelectorAll('[data-del]').forEach(btn => {
      btn.onclick = () => Program.hapus(btn.dataset.del);
    });
  },

  form() {
    const guru = Store.get('guru');
    if (guru.length === 0) return Utils.toast('Tambahkan guru dulu di Data Guru', 'warning');

    Utils.modal('Tambah Program', `
      <div class="form-group">
        <label class="label">Guru</label>
        <select class="select" id="pg">
          ${guru.map(g => `<option value="${g.id}">${Utils.esc(g.nama)}</option>`).join('')}
        </select>
      </div>
      <div class="row">
        <div class="form-group">
          <label class="label">Periode</label>
          <input class="input" id="pp" value="2025/2026-Ganjil" placeholder="2025/2026-Ganjil">
        </div>
        <div class="form-group">
          <label class="label">Waktu Rencana</label>
          <input type="date" class="input" id="pw" value="${Utils.today()}">
        </div>
      </div>
    `, `<button class="btn btn-secondary" onclick="Utils.closeModal()">Batal</button><button class="btn btn-primary" id="btnSaveProg">${Icons.svg('save', 16)} Simpan</button>`);

    Utils.el('btnSaveProg').onclick = () => {
      const list = Store.get('program');
      list.push({
        id: Utils.uid(),
        gid: Utils.el('pg').value,
        periode: Utils.el('pp').value,
        waktu: Utils.el('pw').value
      });
      Store.set('program', list);
      Utils.closeModal();
      Router.navigate('program');
      Utils.toast('Program ditambahkan', 'success');
    };
  },

  hapus(id) {
    Utils.confirm('Hapus Program?', 'Program akan dihapus permanen.', () => {
      Store.set('program', Store.get('program').filter(x => x.id !== id));
      Router.navigate('program');
    });
  }
};
