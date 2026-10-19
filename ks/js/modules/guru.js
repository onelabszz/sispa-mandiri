import { Store } from '../../storage.js';
import { Utils } from '../../../shared/js/utils.js';
import { Icons } from '../../../shared/js/icons.js';
import { Router } from '../../../shared/js/router.js';
import { emptyState } from '../helpers.js';

export const Guru = {
  async render() {
    const list = Store.get('guru');
    const pns = list.filter(g => g.peg === 'PNS').length;
    const pppk = list.filter(g => g.peg === 'PPPK').length;
    const non = list.filter(g => g.peg === 'Non ASN').length;

    return `
      <div class="page-head">
        <div>
          <h2>Data Guru</h2>
          <div class="page-sub">${list.length} guru terdaftar</div>
        </div>
        <div style="display:flex;gap:.5rem">
          <button class="btn btn-secondary" id="btnImportCSV">${Icons.svg('upload', 16)} Impor CSV</button>
          <button class="btn btn-primary" id="btnAddGuru">${Icons.svg('plus', 16)} Tambah Guru</button>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:.75rem;margin-bottom:1rem">
        ${[
          { label: 'Total', val: list.length },
          { label: 'PNS', val: pns },
          { label: 'PPPK', val: pppk },
          { label: 'Non ASN', val: non }
        ].map(s => `
          <div class="stat-card" style="padding:.75rem">
            <div>
              <div style="font-size:.7rem;color:var(--slate-500)">${s.label}</div>
              <div style="font-size:1.25rem;font-weight:700">${s.val}</div>
            </div>
          </div>
        `).join('')}
      </div>

      ${list.length === 0 ? `<div class="card"><div class="card-body">
        ${emptyState('users', 'Belum ada guru', 'Tambahkan guru pertama atau impor dari file CSV.',
          `<button class="btn btn-primary" id="btnEmptyAdd">${Icons.svg('plus', 16)} Tambah Guru</button>`)}
      </div></div>` : `
        <div class="card"><table>
          <thead><tr>
            <th>Nama / NIP</th>
            <th>Mapel</th>
            <th>Kepegawaian</th>
            <th style="text-align:right">Aksi</th>
          </tr></thead>
          <tbody>${list.map(g => `
            <tr>
              <td>
                <div style="font-weight:600">${Utils.esc(g.nama)}</div>
                <div style="font-size:.75rem;color:var(--slate-500)">${Utils.esc(g.nip || '-')}</div>
              </td>
              <td>${Utils.esc(g.mapel || '-')}${g.kelas ? ' · Kls ' + Utils.esc(g.kelas) : ''}</td>
              <td>${g.peg ? `<span class="badge badge-neutral">${Utils.esc(g.peg)}</span>` : '—'}</td>
              <td style="text-align:right;white-space:nowrap">
                <button class="btn btn-secondary btn-sm" data-edit="${g.id}">${Icons.svg('pencil', 14)} Edit</button>
                <button class="btn btn-danger btn-sm" data-del="${g.id}">${Icons.svg('trash-2', 14)} Hapus</button>
              </td>
            </tr>
          `).join('')}</tbody>
        </table></div>
      `}
    `;
  },

  async bind() {
    Utils.el('btnAddGuru')?.addEventListener('click', () => Guru.form());
    Utils.el('btnEmptyAdd')?.addEventListener('click', () => Guru.form());
    Utils.el('btnImportCSV')?.addEventListener('click', async () => {
      const { GuruImport } = await import('./guru-import.js');
      GuruImport.show();
    });
    document.querySelectorAll('[data-edit]').forEach(btn => {
      btn.onclick = () => Guru.form(btn.dataset.edit);
    });
    document.querySelectorAll('[data-del]').forEach(btn => {
      btn.onclick = () => Guru.hapus(btn.dataset.del);
    });
  },

  form(id) {
    const g = id ? Store.get('guru').find(x => x.id === id) : { nama: '', nip: '', mapel: '', kelas: '', peg: '' };
    Utils.modal(id ? 'Edit Data Guru' : 'Tambah Guru', `
      <div class="form-group"><label class="label">Nama Lengkap *</label><input class="input" id="fn" value="${Utils.esc(g.nama)}"></div>
      <div class="row">
        <div class="form-group"><label class="label">NIP</label><input class="input" id="fi" value="${Utils.esc(g.nip)}"></div>
        <div class="form-group"><label class="label">Mata Pelajaran</label><input class="input" id="fm" value="${Utils.esc(g.mapel)}"></div>
      </div>
      <div class="row">
        <div class="form-group"><label class="label">Kelas</label><input class="input" id="fk" value="${Utils.esc(g.kelas)}"></div>
        <div class="form-group"><label class="label">Status Kepegawaian</label>
          <select class="select" id="fp">
            <option value="">—</option>
            <option value="PNS" ${g.peg === 'PNS' ? 'selected' : ''}>PNS</option>
            <option value="PPPK" ${g.peg === 'PPPK' ? 'selected' : ''}>PPPK</option>
            <option value="Non ASN" ${g.peg === 'Non ASN' ? 'selected' : ''}>Non ASN</option>
          </select>
        </div>
      </div>
    `, `<button class="btn btn-secondary" onclick="Utils.closeModal()">Batal</button><button class="btn btn-primary" id="btnSaveGuru">${Icons.svg('save', 16)} Simpan</button>`);

    Utils.el('btnSaveGuru').onclick = () => {
      const n = Utils.el('fn').value.trim();
      if (!n) return Utils.toast('Nama wajib diisi', 'error');
      const d = {
        nama: n,
        nip: Utils.el('fi').value.trim(),
        mapel: Utils.el('fm').value.trim(),
        kelas: Utils.el('fk').value.trim(),
        peg: Utils.el('fp').value
      };
      const list = Store.get('guru');
      if (id) {
        const idx = list.findIndex(x => x.id === id);
        if (idx !== -1) list[idx] = { ...list[idx], ...d };
      } else {
        list.push({ id: Utils.uid(), ...d });
      }
      Store.set('guru', list);
      Utils.closeModal();
      Router.navigate('guru');
      Utils.toast('Tersimpan', 'success');
    };
  },

  hapus(id) {
    const g = Store.get('guru').find(x => x.id === id);
    if (!g) return;
    const n3 = Store.get('supervisi').filter(x => x.gid === id).length;
    const nA = Store.get('akademik').filter(x => x.gid === id).length;
    const nC = Store.get('coaching').filter(x => x.gid === id).length;
    const nP = Store.get('program').filter(x => x.gid === id).length;
    const total = n3 + nA + nC + nP;
    const msg = total > 0
      ? `${g.nama} memiliki riwayat: ${n3} Supervisi 3 Tahap, ${nA} Akademik, ${nC} Coaching, ${nP} Program. Jika dihapus, riwayat tetap ada tapi nama tampil "?" di Laporan. Lanjutkan?`
      : 'Data guru akan dihapus permanen.';
    Utils.confirm('Hapus Guru?', msg, () => {
      Store.set('guru', Store.get('guru').filter(x => x.id !== id));
      Router.navigate('guru');
    });
  }
};
