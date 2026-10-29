import { Store } from '../../storage.js';
import { Utils } from '../../../shared/js/utils.js';
import { Icons } from '../../../shared/js/icons.js';
import { Router } from '../../../shared/js/router.js';
import { emptyState, guruLabel, updateDupWarn } from '../helpers.js';
import { INSTRUMEN_AKADEMIK } from '../../../shared/js/constants.js';

let _detail = {};
let _catatan = {};

export const Akademik = {
  _view: 'list',
  _curId: null,

  async render() {
    if (this._view === 'form') return this._renderForm();
    return this._renderList();
  },

  async bind() {
    if (this._view === 'form') return this._bindForm();
    return this._bindList();
  },

  // ============================================
  // LIST VIEW
  // ============================================
  _renderList() {
    const guru = Store.get('guru');
    const list = Store.get('akademik').map(x => ({
      ...x,
      status: x.status || 'selesai',
      _guru: guru.find(g => g.id === x.gid)
    })).sort((a, b) => (b.tgl || '').localeCompare(a.tgl || ''));

    const total = list.length;
    const selesai = list.filter(x => x.status === 'selesai').length;
    const draft = list.filter(x => x.status === 'draft').length;

    return `
      <div class="page-head">
        <div>
      <h2>Supervisi Digitalisasi</h2>
      <div class="page-sub">${total} sesi · ${selesai} selesai${draft > 0 ? ` · ${draft} draft` : ''} · 19 indikator</div>
    </div>
    <div style="display:flex;gap:.5rem;flex-wrap:wrap">
      ${total > 0 ? `<button class="btn btn-secondary" id="btnCetakRekap">${Icons.svg('printer', 16)} Cetak Rekap</button>` : ''}
      <button class="btn btn-primary" id="btnStartAkad">${Icons.svg('plus', 16)} Mulai Supervisi Digitalisasi</button>
    </div>
      </div>

      ${guru.length === 0 ? `<div class="card"><div class="card-body">
        ${emptyState('users', 'Belum ada guru', 'Tambahkan guru dulu di menu Data Guru.')}
      </div></div>` : total === 0 ? `<div class="card"><div class="card-body">
        ${emptyState('laptop', 'Belum ada sesi Supervisi Digitalisasi', 'Mulai Supervisi Digitalisasi pertama Anda.',
  `<button class="btn btn-primary" id="btnEmptyStart">${Icons.svg('plus', 16)} Mulai Supervisi Digitalisasi</button>`)}
      </div></div>` : `
        <div class="card"><table>
          <thead><tr>
            <th>Guru</th>
            <th>Tanggal</th>
            <th>Mapel / Materi</th>
            <th style="text-align:center">Skor</th>
            <th style="text-align:center">Status</th>
            <th style="text-align:right">Aksi</th>
          </tr></thead>
          <tbody>${list.map(s => {
            const isDraft = s.status === 'draft';
            return `<tr>
              <td>
                <div style="font-weight:600">${Utils.esc(s._guru?.nama || '?')}</div>
                <div style="font-size:.75rem;color:var(--slate-500)">${Utils.esc(s._guru?.mapel || '—')}</div>
              </td>
              <td>${Utils.date(s.tgl)}</td>
              <td style="font-size:.85rem">${Utils.esc(s.mapel || '-')}${s.materi ? ' · ' + Utils.esc(s.materi) : ''}</td>
              <td style="text-align:center;font-weight:700">${s.skor || 0}<span style="font-weight:400;color:var(--slate-400);font-size:.7rem">/76</span></td>
              <td style="text-align:center"><span class="badge badge-${isDraft ? 'warning' : 'success'}">${isDraft ? 'Draft' : 'Selesai'}</span></td>
              <td style="text-align:right;white-space:nowrap">
                ${isDraft
                  ? `<button class="btn btn-secondary btn-sm" data-edit="${s.id}">${Icons.svg('pencil', 14)} Lanjut</button>`
                  : `<button class="btn btn-secondary btn-sm" data-view="${s.id}">${Icons.svg('eye', 14)} Lihat</button>
                     <button class="btn btn-primary btn-sm" data-print="${s.id}">${Icons.svg('printer', 14)} Cetak</button>`}
                <button class="btn btn-danger btn-sm" data-del="${s.id}">${Icons.svg('trash-2', 14)}</button>
              </td>
            </tr>`;
          }).join('')}</tbody>
        </table></div>
      `}
    `;
  },

  async _bindList() {
    Utils.el('btnStartAkad')?.addEventListener('click', () => this._startNew());
    Utils.el('btnEmptyStart')?.addEventListener('click', () => this._startNew());
    Utils.el('btnCetakRekap')?.addEventListener('click', () => this._cetakRekap());

    document.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => this._openForm(b.dataset.edit));
    document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => this._openForm(b.dataset.view));
    document.querySelectorAll('[data-print]').forEach(b => b.onclick = () => this.print(b.dataset.print));
    document.querySelectorAll('[data-del]').forEach(b => b.onclick = () => this._delete(b.dataset.del));
  },

  _startNew() {
    _detail = {};
    _catatan = {};
    this._curId = null;
    this._view = 'form';
    Router.navigate('akademik');
  },

  _openForm(id) {
    this._curId = id;
    this._view = 'form';
    Router.navigate('akademik');
  },

  _delete(id) {
    Utils.confirm('Hapus Observasi?', 'Data akan dihapus permanen.', () => {
      Store.set('akademik', Store.get('akademik').filter(x => x.id !== id));
      Router.navigate('akademik');
    });
  },

  // ============================================
  // FORM VIEW
  // ============================================
  _renderForm() {
    const guru = Store.get('guru');
    if (guru.length === 0) {
      this._view = 'list';
      return `<div class="card"><div class="card-body">${emptyState('users', 'Belum ada guru', 'Tambahkan guru dulu.')}</div></div>`;
    }

    const existing = this._curId ? Store.get('akademik').find(x => x.id === this._curId) : null;
    const isReadonly = existing && (existing.status || 'selesai') === 'selesai';

    if (existing) {
      _detail = { ...(existing.detail || {}) };
      _catatan = { ...(existing.catatan || {}) };
    }

    const f = existing || {};
    const filled = Object.keys(_detail).length;

    let rows = '';
    let sec = '';
    INSTRUMEN_AKADEMIK.forEach(i => {
      if (i.sec !== sec) {
        sec = i.sec;
        rows += `<div style="background:var(--brand-50);padding:.6rem 1rem;font-weight:700;font-size:.8rem;color:var(--brand-700)">${sec}</div>`;
      }
      const cur = _detail[i.kode];
      const curCat = _catatan[i.kode] || '';
      rows += `<div class="ind-row" data-k="${i.kode}">
        <div class="ind-kode">${i.kode}</div>
        <div class="ind-teks">${i.t}<input class="input ind-catatan" placeholder="Catatan/bukti..." data-cat="${i.kode}" value="${Utils.esc(curCat)}" ${isReadonly ? 'disabled' : ''}></div>
        <div>
          <div style="font-size:10px;font-weight:600;color:var(--slate-500);margin-bottom:3px">Skor (1–4)</div>
          <div class="skor-grid">${[1,2,3,4].map(v => `<button class="skor-btn ${cur===v?'active':''}" data-v="${v}" data-kode="${i.kode}" ${isReadonly ? 'disabled' : ''}>${v}</button>`).join('')}</div>
        </div>
      </div>`;
    });

    return `
      <div class="page-head">
        <div>
          <button class="btn btn-secondary btn-sm" id="btnBack" style="margin-bottom:.75rem">${Icons.svg('chevron-left', 14)} Kembali</button>
          <h2 style="margin:0">${existing ? (isReadonly ? 'Lihat Supervisi Digitalisasi' : 'Lanjutkan Supervisi Digitalisasi') : 'Supervisi Digitalisasi Baru'}</h2>
          <div class="page-sub">${filled}/19 indikator terisi</div>
        </div>
      </div>

      ${isReadonly ? `<div class="info-banner success" style="margin-bottom:1rem">
        <div style="display:flex;align-items:flex-start;gap:.5rem">
          ${Icons.svg('check-circle', 18)}
          <div><strong>Supervisi sudah selesai.</strong> Data tidak dapat diubah.</div>
        </div>
      </div>` : ''}

      <div class="card"><div class="card-body">
        <div class="row">
          <div class="form-group">
            <label class="label">Guru *</label>
            <select class="select" id="aguru" ${isReadonly || existing ? 'disabled' : ''}>
              ${guru.map(g => `<option value="${g.id}" ${existing?.gid === g.id ? 'selected' : ''}>${Utils.esc(guruLabel(g))}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label class="label">Tanggal</label><input type="date" class="input" id="atgl" value="${f.tgl || Utils.today()}" ${isReadonly ? 'disabled' : ''}></div>
        </div>
        <div class="row-3">
          <div class="form-group"><label class="label">Mapel</label><input class="input" id="amapel" value="${Utils.esc(f.mapel || '')}" placeholder="Matematika" ${isReadonly ? 'disabled' : ''}></div>
          <div class="form-group"><label class="label">Materi</label><input class="input" id="amateri" value="${Utils.esc(f.materi || '')}" placeholder="Bangun Ruang" ${isReadonly ? 'disabled' : ''}></div>
          <div class="form-group"><label class="label">Durasi</label><input class="input" id="adurasi" value="${Utils.esc(f.durasi || '')}" placeholder="2 JP" ${isReadonly ? 'disabled' : ''}></div>
        </div>
      </div></div>

      <div class="card" style="padding:0">${rows}</div>

      <div class="card"><div class="card-header">${Icons.svg('file-text', 18)} Catatan & RTL</div><div class="card-body">
        <div class="form-group"><label class="label">Catatan Tambahan</label><textarea class="textarea" id="acat" rows="2" ${isReadonly ? 'disabled' : ''}>${Utils.esc(f.catatan_tambahan || '')}</textarea></div>
        <div class="form-group"><label class="label">Kekuatan / Praktik Baik</label><textarea class="textarea" id="akek" rows="2" ${isReadonly ? 'disabled' : ''}>${Utils.esc(f.kekuatan || '')}</textarea></div>
        <div class="form-group"><label class="label">Area Pengembangan</label><textarea class="textarea" id="aarea" rows="2" ${isReadonly ? 'disabled' : ''}>${Utils.esc(f.area_pengembangan || '')}</textarea></div>
        <div class="form-group"><label class="label">RTL</label><textarea class="textarea" id="artl" rows="2" ${isReadonly ? 'disabled' : ''}>${Utils.esc(f.rtl || '')}</textarea></div>
      </div></div>

      ${!isReadonly ? `
        <div style="display:flex;justify-content:flex-end;gap:.5rem;margin-bottom:3rem">
          <button class="btn btn-secondary" id="btnSaveDraft">${Icons.svg('save', 16)} Simpan Draft</button>
          <button class="btn btn-success" id="btnSelesai">${Icons.svg('check', 16)} Selesaikan</button>
        </div>
      ` : ''}
    `;
  },

  async _bindForm() {
    Utils.el('btnBack').onclick = () => {
      const hasChanges = Object.keys(_detail).length > 0 || Object.values(_catatan).some(v => v);
      const existing = this._curId ? Store.get('akademik').find(x => x.id === this._curId) : null;
      const isReadonly = existing && (existing.status || 'selesai') === 'selesai';

      if (isReadonly || !hasChanges) {
        this._view = 'list';
        this._curId = null;
        Router.navigate('akademik');
      } else {
        Utils.confirm('Kembali tanpa simpan?', 'Perubahan yang belum disimpan akan hilang.', () => {
          this._view = 'list';
          this._curId = null;
          Router.navigate('akademik');
        });
      }
    };

    document.querySelectorAll('.skor-btn').forEach(btn => {
      btn.onclick = () => {
        const kode = btn.dataset.kode;
        const v = parseInt(btn.dataset.v);
        document.querySelectorAll(`.ind-row[data-k="${kode}"] .skor-btn`).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        _detail[kode] = v;
      };
    });

    document.querySelectorAll('[data-cat]').forEach(inp => {
      inp.addEventListener('input', () => { _catatan[inp.dataset.cat] = inp.value; });
    });

    Utils.el('btnSaveDraft')?.addEventListener('click', () => this._save('draft'));
    Utils.el('btnSelesai')?.addEventListener('click', () => {
      const filled = Object.keys(_detail).length;
      if (filled < 19) {
        Utils.confirm('Belum lengkap', `Masih ada ${19 - filled} indikator belum dinilai. Tetap selesaikan sebagai final?`, () => this._save('selesai'));
      } else {
        this._save('selesai');
      }
    });
  },

  _save(status) {
    const guruId = Utils.el('aguru')?.value;
    if (!guruId) return Utils.toast('Pilih guru dulu', 'error');
    if (!Utils.el('atgl')?.value) return Utils.toast('Tanggal wajib diisi', 'error');

    const total = Object.values(_detail).reduce((s, v) => s + v, 0);
    const list = Store.get('akademik');
    const record = {
      id: this._curId || Utils.uid(),
      gid: guruId,
      tgl: Utils.el('atgl').value,
      mapel: Utils.el('amapel').value,
      materi: Utils.el('amateri').value,
      durasi: Utils.el('adurasi').value,
      skor: total,
      detail: { ..._detail },
      catatan: { ..._catatan },
      catatan_tambahan: Utils.el('acat').value,
      kekuatan: Utils.el('akek').value,
      area_pengembangan: Utils.el('aarea').value,
      rtl: Utils.el('artl').value,
      status: status
    };

    if (this._curId) {
      const idx = list.findIndex(x => x.id === this._curId);
      if (idx !== -1) list[idx] = record;
    } else {
      list.push(record);
    }
    Store.set('akademik', list);

    Utils.toast(status === 'draft' ? 'Draft tersimpan' : 'Supervisi Digitalisasi selesai', 'success');

    this._view = 'list';
    this._curId = null;
    Router.navigate('akademik');
  },

  // ============================================
  // CETAK REKAP
  // ============================================
  _cetakRekap() {
    const c = Store.config();
    const guru = Store.get('guru');
    const list = Store.get('akademik').map(x => ({
      ...x,
      status: x.status || 'selesai',
      _guru: guru.find(g => g.id === x.gid)
    })).sort((a, b) => (b.tgl || '').localeCompare(a.tgl || ''));

    if (list.length === 0) return Utils.toast('Belum ada data', 'warning');

    const rows = list.map((s, i) => `<tr>
      <td style="text-align:center">${i+1}</td>
      <td>${Utils.esc(s._guru?.nama || '?')}</td>
      <td>${Utils.date(s.tgl)}</td>
      <td>${Utils.esc(s.mapel || '-')}${s.materi ? ' · ' + Utils.esc(s.materi) : ''}</td>
      <td style="text-align:center">${s.skor || 0}/76</td>
      <td style="text-align:center">${s.status === 'draft' ? 'Draft' : 'Selesai'}</td>
    </tr>`).join('');

    Utils.el('printArea').innerHTML = `
      <h1>REKAP SUPERVISI DIGITALISASI</h1>
      <p class="sub">${Utils.esc(c.nama_sekolah)} — NPSN ${Utils.esc(c.npsn || '-')}</p>
      <table class="info">
        <tr><td>Kepala Sekolah</td><td>:</td><td><strong>${Utils.esc(c.nama_ks || '-')}</strong></td></tr>
        <tr><td>Tanggal Cetak</td><td>:</td><td>${new Date().toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'})}</td></tr>
        <tr><td>Total Sesi</td><td>:</td><td>${list.length}</td></tr>
      </table>
      <table class="ind"><thead><tr>
        <th style="width:30px;text-align:center">#</th>
        <th>Nama Guru</th>
        <th>Tanggal</th>
        <th>Mapel / Materi</th>
        <th style="text-align:center;width:60px">Skor</th>
        <th style="text-align:center;width:70px">Status</th>
      </tr></thead><tbody>${rows}</tbody></table>
      <div class="ttd-grid">
        <div class="ttd-box"><div>Kepala Sekolah</div><div class="ttd-space"></div><div class="ttd-name">${Utils.esc(c.nama_ks || '...')}</div><div style="font-size:8.5pt;color:#64748b">NIP. ${Utils.esc(c.nip_ks || '...')}</div></div>
        <div class="ttd-box"><div>Pengawas Pembina</div><div class="ttd-space"></div><div class="ttd-name">(...................................)</div></div>
      </div>`;
    setTimeout(() => window.print(), 200);
  },

  // ============================================
  // PRINT (single sesi)
  // ============================================
  print(id) {
    const s = Store.get('akademik').find(x => x.id === id);
    if (!s) return;
    const g = Store.get('guru').find(x => x.id === s.gid);
    const c = Store.config();
    let html = '';
    INSTRUMEN_AKADEMIK.forEach(i => {
      html += `<tr><td class="kode">${i.kode}</td><td>${i.t}</td><td class="skor">${(s.detail || {})[i.kode] || '-'}</td><td>${Utils.esc((s.catatan || {})[i.kode] || '')}</td></tr>`;
    });
    Utils.el('printArea').innerHTML = `
      <h1>LEMBAR SUPERVISI DIGITALISASI</h1>
      <p class="sub">${Utils.esc(c.nama_sekolah)}</p>
      <table class="info">
        <tr><td>Guru</td><td>:</td><td><strong>${Utils.esc(g?.nama)}</strong></td></tr>
        <tr><td>Mapel / Materi</td><td>:</td><td>${Utils.esc(s.mapel || '-')} / ${Utils.esc(s.materi || '-')}</td></tr>
        <tr><td>Tanggal</td><td>:</td><td>${Utils.date(s.tgl)}</td></tr>
        <tr><td>Skor Total</td><td>:</td><td><strong>${s.skor} / 76</strong></td></tr>
      </table>
      <table class="ind"><thead><tr><th>Kode</th><th>Indikator</th><th>Skor</th><th>Catatan</th></tr></thead><tbody>${html}</tbody></table>
      <p><strong>Catatan Tambahan:</strong> ${Utils.esc(s.catatan_tambahan || '-')}</p>
      <p><strong>Kekuatan:</strong> ${Utils.esc(s.kekuatan || '-')}</p>
      <p><strong>Area Pengembangan:</strong> ${Utils.esc(s.area_pengembangan || '-')}</p>
      <p><strong>RTL:</strong> ${Utils.esc(s.rtl || '-')}</p>
      <div class="ttd-grid">
        <div class="ttd-box"><div>Kepala Sekolah</div><div class="ttd-space"></div><div class="ttd-name">${Utils.esc(c.nama_ks)}</div><div style="font-size:8.5pt;color:#64748b">NIP. ${Utils.esc(c.nip_ks || '...')}</div></div>
        <div class="ttd-box"><div>Guru</div><div class="ttd-space"></div><div class="ttd-name">${Utils.esc(g?.nama)}</div><div style="font-size:8.5pt;color:#64748b">NIP. ${Utils.esc(g?.nip || '...')}</div></div>
      </div>`;
    setTimeout(() => window.print(), 200);
  }
};
