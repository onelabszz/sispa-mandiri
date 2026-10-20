import { Store } from '../../storage.js';
import { Utils } from '../../../shared/js/utils.js';
import { Icons } from '../../../shared/js/icons.js';
import { Router } from '../../../shared/js/router.js';
import { emptyState, guruLabel, updateDupWarn } from '../helpers.js';
import { INSTRUMEN_COACHING } from '../../../shared/js/constants.js';

let _detail = {};
let _catatan = {};
let _rtl = [];

export const Coaching = {
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
    const list = Store.get('coaching').map(x => ({
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
          <h2>Observasi Coaching</h2>
          <div class="page-sub">${total} sesi · ${selesai} selesai${draft > 0 ? ` · ${draft} draft` : ''} · 8 indikator STAR-GROW</div>
        </div>
        <div style="display:flex;gap:.5rem;flex-wrap:wrap">
          ${total > 0 ? `<button class="btn btn-secondary" id="btnCetakRekap">${Icons.svg('printer', 16)} Cetak Rekap</button>` : ''}
          <button class="btn btn-primary" id="btnStartCoach">${Icons.svg('plus', 16)} Mulai Coaching Baru</button>
        </div>
      </div>

      ${guru.length === 0 ? `<div class="card"><div class="card-body">
        ${emptyState('users', 'Belum ada guru', 'Tambahkan guru dulu di menu Data Guru.')}
      </div></div>` : total === 0 ? `<div class="card"><div class="card-body">
        ${emptyState('message-circle', 'Belum ada observasi coaching', 'Mulai observasi coaching pertama Anda.',
          `<button class="btn btn-primary" id="btnEmptyStart">${Icons.svg('plus', 16)} Mulai Coaching</button>`)}
      </div></div>` : `
        <div class="card"><table>
          <thead><tr>
            <th>Guru</th>
            <th>Tanggal</th>
            <th style="text-align:center">Skor</th>
            <th style="text-align:center">Kategori</th>
            <th style="text-align:center">Status</th>
            <th style="text-align:right">Aksi</th>
          </tr></thead>
          <tbody>${list.map(s => {
            const isDraft = s.status === 'draft';
            const pct = s.skor ? Math.round((s.skor / 32) * 100) : 0;
            let kat = 'Belum Tampak';
            let katColor = 'neutral';
            if (pct >= 86) { kat = 'Konsisten'; katColor = 'success'; }
            else if (pct >= 71) { kat = 'Berkembang'; katColor = 'info'; }
            else if (pct >= 51) { kat = 'Mulai Tampak'; katColor = 'warning'; }
            else if (pct > 0) { kat = 'Belum Tampak'; katColor = 'danger'; }
            return `<tr>
              <td>
                <div style="font-weight:600">${Utils.esc(s._guru?.nama || '?')}</div>
                <div style="font-size:.75rem;color:var(--slate-500)">${Utils.esc(s._guru?.mapel || '—')}</div>
              </td>
              <td>${Utils.date(s.tgl)}</td>
              <td style="text-align:center;font-weight:700">${s.skor || 0}<span style="font-weight:400;color:var(--slate-400);font-size:.7rem">/32</span></td>
              <td style="text-align:center"><span class="badge badge-${katColor}">${kat}</span></td>
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
    Utils.el('btnStartCoach')?.addEventListener('click', () => this._startNew());
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
    _rtl = [{ aksi: '', waktu: '', dukungan: '', indikator: '' }];
    this._curId = null;
    this._view = 'form';
    Router.navigate('coaching');
  },

  _openForm(id) {
    this._curId = id;
    this._view = 'form';
    Router.navigate('coaching');
  },

  _delete(id) {
    Utils.confirm('Hapus Coaching?', 'Data akan dihapus permanen.', () => {
      Store.set('coaching', Store.get('coaching').filter(x => x.id !== id));
      Router.navigate('coaching');
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

    const existing = this._curId ? Store.get('coaching').find(x => x.id === this._curId) : null;
    const isReadonly = existing && (existing.status || 'selesai') === 'selesai';

    if (existing) {
      _detail = { ...(existing.detail || {}) };
      _catatan = { ...(existing.catatan || {}) };
      _rtl = (existing.rtl && existing.rtl.length > 0) ? JSON.parse(JSON.stringify(existing.rtl)) : [{ aksi: '', waktu: '', dukungan: '', indikator: '' }];
    } else if (_rtl.length === 0) {
      _rtl = [{ aksi: '', waktu: '', dukungan: '', indikator: '' }];
    }

    const f = existing || {};
    const filled = Object.keys(_detail).length;

    let rows = '';
    INSTRUMEN_COACHING.forEach(i => {
      const cur = _detail[i.kode];
      const curCat = _catatan[i.kode] || '';
      rows += `<div class="ind-row" data-k="${i.kode}">
        <div class="ind-kode">${i.tahap}</div>
        <div class="ind-teks">${i.t}<input class="input ind-catatan" placeholder="Kutipan/bukti percakapan..." data-cat="${i.kode}" value="${Utils.esc(curCat)}" ${isReadonly ? 'disabled' : ''}></div>
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
          <h2 style="margin:0">${existing ? (isReadonly ? 'Lihat Observasi Coaching' : 'Lanjutkan Observasi Coaching') : 'Observasi Coaching Baru'}</h2>
          <div class="page-sub">${filled}/8 indikator terisi</div>
        </div>
      </div>

      ${isReadonly ? `<div class="info-banner success" style="margin-bottom:1rem">
        <div style="display:flex;align-items:flex-start;gap:.5rem">
          ${Icons.svg('check-circle', 18)}
          <div><strong>Observasi sudah selesai.</strong> Data tidak dapat diubah.</div>
        </div>
      </div>` : ''}

      <div class="card"><div class="card-body">
        <div class="row">
          <div class="form-group">
            <label class="label">Guru *</label>
            <select class="select" id="cguru" ${isReadonly || existing ? 'disabled' : ''}>
              ${guru.map(g => `<option value="${g.id}" ${existing?.gid === g.id ? 'selected' : ''}>${Utils.esc(guruLabel(g))}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label class="label">Tanggal</label><input type="date" class="input" id="ctgl" value="${f.tgl || Utils.today()}" ${isReadonly ? 'disabled' : ''}></div>
        </div>
      </div></div>

      <div class="card" style="padding:0">${rows}</div>

      <div class="card"><div class="card-header">${Icons.svg('file-text', 18)} Catatan Kualitatif</div><div class="card-body">
        <div class="form-group"><label class="label">Kekuatan yang Ditunjukkan</label><textarea class="textarea" id="ckek" rows="2" ${isReadonly ? 'disabled' : ''}>${Utils.esc(f.kekuatan || '')}</textarea></div>
        <div class="form-group"><label class="label">Area yang Perlu Dikembangkan</label><textarea class="textarea" id="carea" rows="2" ${isReadonly ? 'disabled' : ''}>${Utils.esc(f.area || '')}</textarea></div>
      </div></div>

      <div class="card"><div class="card-header">${Icons.svg('target', 18)} RTL / Kontrak Belajar</div><div class="card-body">
        <div id="rtlRows"></div>
        ${!isReadonly ? `<button type="button" class="btn btn-secondary btn-sm" id="btnAddRtl">${Icons.svg('plus', 14)} Tambah Baris RTL</button>` : ''}
      </div></div>

      ${!isReadonly ? `
        <div style="display:flex;justify-content:flex-end;gap:.5rem;margin-bottom:3rem">
          <button class="btn btn-secondary" id="btnSaveDraft">${Icons.svg('save', 16)} Simpan Draft</button>
          <button class="btn btn-success" id="btnSelesai">${Icons.svg('check', 16)} Selesaikan</button>
        </div>
      ` : ''}
    `;
  },

  _renderRtlRows(isReadonly = false) {
    const box = Utils.el('rtlRows');
    if (!box) return;
    box.innerHTML = _rtl.map((r, i) => `
      <div style="padding:.5rem;border:1px solid var(--slate-200);border-radius:6px;margin-bottom:.5rem">
        <div style="display:flex;justify-content:space-between;margin-bottom:.35rem">
          <strong style="font-size:.75rem">RTL ${i + 1}</strong>
          ${!isReadonly ? `<button type="button" class="btn btn-ghost btn-sm" data-del-rtl="${i}" style="color:var(--danger);padding:.15rem .35rem">${Icons.svg('x', 14)}</button>` : ''}
        </div>
        <input class="input" placeholder="Rencana Aksi" value="${Utils.esc(r.aksi)}" data-rtl="${i}" data-field="aksi" style="margin-bottom:.35rem;font-size:.8rem" ${isReadonly ? 'disabled' : ''}>
        <div class="row" style="gap:.35rem">
          <input class="input" placeholder="Waktu" value="${Utils.esc(r.waktu)}" data-rtl="${i}" data-field="waktu" style="font-size:.8rem" ${isReadonly ? 'disabled' : ''}>
          <input class="input" placeholder="Dukungan" value="${Utils.esc(r.dukungan)}" data-rtl="${i}" data-field="dukungan" style="font-size:.8rem" ${isReadonly ? 'disabled' : ''}>
        </div>
        <input class="input" placeholder="Indikator Keberhasilan" value="${Utils.esc(r.indikator)}" data-rtl="${i}" data-field="indikator" style="margin-top:.35rem;font-size:.8rem" ${isReadonly ? 'disabled' : ''}>
      </div>
    `).join('');

    box.querySelectorAll('[data-rtl]').forEach(inp => {
      inp.oninput = () => {
        const i = parseInt(inp.dataset.rtl);
        const field = inp.dataset.field;
        if (_rtl[i]) _rtl[i][field] = inp.value;
      };
    });

    box.querySelectorAll('[data-del-rtl]').forEach(btn => {
      btn.onclick = () => {
        _rtl.splice(parseInt(btn.dataset.delRtl), 1);
        if (_rtl.length === 0) _rtl.push({ aksi: '', waktu: '', dukungan: '', indikator: '' });
        this._renderRtlRows();
      };
    });
  },

  async _bindForm() {
    const existing = this._curId ? Store.get('coaching').find(x => x.id === this._curId) : null;
    const isReadonly = existing && (existing.status || 'selesai') === 'selesai';

    Utils.el('btnBack').onclick = () => {
      const hasChanges = Object.keys(_detail).length > 0 || Object.values(_catatan).some(v => v);
      if (isReadonly || !hasChanges) {
        this._view = 'list';
        this._curId = null;
        Router.navigate('coaching');
      } else {
        Utils.confirm('Kembali tanpa simpan?', 'Perubahan yang belum disimpan akan hilang.', () => {
          this._view = 'list';
          this._curId = null;
          Router.navigate('coaching');
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

    this._renderRtlRows(isReadonly);

    if (isReadonly) return;

    Utils.el('btnAddRtl')?.addEventListener('click', () => {
      _rtl.push({ aksi: '', waktu: '', dukungan: '', indikator: '' });
      this._renderRtlRows();
    });

    Utils.el('btnSaveDraft')?.addEventListener('click', () => this._save('draft'));
    Utils.el('btnSelesai')?.addEventListener('click', () => {
      const filled = Object.keys(_detail).length;
      if (filled < 8) {
        Utils.confirm('Belum lengkap', `Masih ada ${8 - filled} indikator belum dinilai. Tetap selesaikan sebagai final?`, () => this._save('selesai'));
      } else {
        this._save('selesai');
      }
    });
  },

  _save(status) {
    const guruId = Utils.el('cguru')?.value;
    if (!guruId) return Utils.toast('Pilih guru dulu', 'error');
    if (!Utils.el('ctgl')?.value) return Utils.toast('Tanggal wajib diisi', 'error');

    const total = Object.values(_detail).reduce((s, v) => s + v, 0);
    const list = Store.get('coaching');
    const record = {
      id: this._curId || Utils.uid(),
      gid: guruId,
      tgl: Utils.el('ctgl').value,
      skor: total,
      detail: { ..._detail },
      catatan: { ..._catatan },
      kekuatan: Utils.el('ckek').value,
      area: Utils.el('carea').value,
      rtl: _rtl.filter(r => r.aksi.trim()),
      status: status
    };

    if (this._curId) {
      const idx = list.findIndex(x => x.id === this._curId);
      if (idx !== -1) list[idx] = record;
    } else {
      list.push(record);
    }
    Store.set('coaching', list);

    Utils.toast(status === 'draft' ? 'Draft tersimpan' : 'Coaching selesai', 'success');

    this._view = 'list';
    this._curId = null;
    Router.navigate('coaching');
  },

  // ============================================
  // CETAK REKAP
  // ============================================
  _cetakRekap() {
    const c = Store.config();
    const guru = Store.get('guru');
    const list = Store.get('coaching').map(x => ({
      ...x,
      status: x.status || 'selesai',
      _guru: guru.find(g => g.id === x.gid)
    })).sort((a, b) => (b.tgl || '').localeCompare(a.tgl || ''));

    if (list.length === 0) return Utils.toast('Belum ada data', 'warning');

    const rows = list.map((s, i) => {
      const pct = s.skor ? Math.round((s.skor / 32) * 100) : 0;
      let kat = 'Belum Tampak';
      if (pct >= 86) kat = 'Konsisten/Optimal';
      else if (pct >= 71) kat = 'Berkembang';
      else if (pct >= 51) kat = 'Mulai Tampak';
      return `<tr>
        <td style="text-align:center">${i+1}</td>
        <td>${Utils.esc(s._guru?.nama || '?')}</td>
        <td>${Utils.date(s.tgl)}</td>
        <td style="text-align:center">${s.skor || 0}/32</td>
        <td style="text-align:center">${kat}</td>
        <td style="text-align:center">${s.status === 'draft' ? 'Draft' : 'Selesai'}</td>
      </tr>`;
    }).join('');

    Utils.el('printArea').innerHTML = `
      <h1>REKAP OBSERVASI COACHING</h1>
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
        <th style="text-align:center;width:60px">Skor</th>
        <th>Kategori</th>
        <th style="text-align:center;width:70px">Status</th>
      </tr></thead><tbody>${rows}</tbody></table>
      <div class="ttd-grid">
        <div class="ttd-box"><div>Kepala Sekolah</div><div class="ttd-space"></div><div class="ttd-name">${Utils.esc(c.nama_ks || '...')}</div><div style="font-size:8.5pt;color:#64748b">NIP. ${Utils.esc(c.nip_ks || '...')}</div></div>
        <div class="ttd-box"><div>Pengawas Pembina</div><div class="ttd-space"></div><div class="ttd-name">(...................................)</div></div>
      </div>`;
    setTimeout(() => window.print(), 200);
  },

  print(id) {
    const s = Store.get('coaching').find(x => x.id === id);
    if (!s) return;
    const g = Store.get('guru').find(x => x.id === s.gid);
    const c = Store.config();
    let html = '';
    INSTRUMEN_COACHING.forEach(i => {
      html += `<tr><td class="kode">${i.tahap}</td><td>${i.t}</td><td class="skor">${(s.detail || {})[i.kode] || '-'}</td><td>${Utils.esc((s.catatan || {})[i.kode] || '')}</td></tr>`;
    });
    const rtlHtml = (s.rtl || []).map((r, i) =>
      `<tr><td>${i + 1}</td><td>${Utils.esc(r.aksi)}</td><td>${Utils.esc(r.waktu)}</td><td>${Utils.esc(r.dukungan)}</td><td>${Utils.esc(r.indikator)}</td></tr>`
    ).join('');
    Utils.el('printArea').innerHTML = `
      <h1>LEMBAR OBSERVASI COACHING</h1>
      <p class="sub">${Utils.esc(c.nama_sekolah)}</p>
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
        <div class="ttd-box"><div>Kepala Sekolah</div><div class="ttd-space"></div><div class="ttd-name">${Utils.esc(c.nama_ks)}</div><div style="font-size:8.5pt;color:#64748b">NIP. ${Utils.esc(c.nip_ks || '...')}</div></div>
        <div class="ttd-box"><div>Guru</div><div class="ttd-space"></div><div class="ttd-name">${Utils.esc(g?.nama)}</div><div style="font-size:8.5pt;color:#64748b">NIP. ${Utils.esc(g?.nip || '...')}</div></div>
      </div>`;
    setTimeout(() => window.print(), 200);
  }
};
