import { Store } from '../../storage.js';
import { Utils } from '../../../shared/js/utils.js';
import { Icons } from '../../../shared/js/icons.js';
import { Router } from '../../../shared/js/router.js';
import { emptyState, guruLabel } from '../helpers.js';
import {
  INSTRUMEN_TELAAH_RPP, KUALITATIF_TELAAH,
  INSTRUMEN_OBS_PM, REFLEKSI_PM
} from '../../../shared/js/constants.js';

let _cur = null;
let _step = 1;

const MAX_TELAAH = INSTRUMEN_TELAAH_RPP.length;   // 15
const MAX_OBS = INSTRUMEN_OBS_PM.length;           // 15
const MAX_SKOR = MAX_TELAAH * 4;                   // 60

const isFilled = (v) => v !== null && v !== undefined && String(v).trim() !== '';

export const SupervisiPM = {
  async render() {
    if (_cur) return this._renderWizard();
    return this._renderList();
  },

  async bind() {
    if (_cur) return this._bindWizard();
    return this._bindList();
  },

  // ============================================
  // LIST VIEW
  // ============================================
  _renderList() {
    const guru = Store.get('guru');
    const list = Store.get('supervisiPM') || [];
    const sorted = [...list].sort((a, b) => (b.tgl || '').localeCompare(a.tgl || ''));
    const total = sorted.length;
    const selesai = sorted.filter(x => x.status === 'selesai').length;
    const draft = sorted.filter(x => x.status !== 'selesai').length;

    return `
      <div class="page-head">
        <div>
          <h2>Supervisi PM</h2>
          <div class="page-sub">${total} sesi · ${selesai} selesai${draft > 0 ? ` · ${draft} draft` : ''} · Telaah RPP + Obs Implementasi + Refleksi</div>
        </div>
        <button class="btn btn-primary" id="btnStartPM">${Icons.svg('plus', 16)} Mulai Supervisi PM</button>
      </div>

      ${guru.length === 0 ? `<div class="card"><div class="card-body">
        ${emptyState('users', 'Belum ada guru', 'Tambahkan guru dulu di menu Data Guru.')}
      </div></div>` : total === 0 ? `<div class="card"><div class="card-body">
        ${emptyState('book-open-check', 'Belum ada sesi Supervisi PM', 'Mulai siklus pertama: Telaah RPP → Observasi Implementasi → Refleksi & RTL.',
          `<button class="btn btn-primary" id="btnEmptyStart">${Icons.svg('plus', 16)} Mulai Supervisi PM</button>`)}
      </div></div>` : `
        <div class="card"><table>
          <thead><tr>
            <th>Guru</th>
            <th>Tanggal</th>
            <th style="text-align:center">Progress</th>
            <th style="text-align:center">Skor Telaah</th>
            <th style="text-align:center">Status</th>
            <th style="text-align:right">Aksi</th>
          </tr></thead>
          <tbody>${sorted.map(s => {
            const g = guru.find(x => x.id === s.gid);
            const tDone = this._isTelaahDone(s);
            const oDone = this._isObsDone(s);
            const rDone = this._isRefleksiDone(s);
            const isDraft = s.status !== 'selesai';
            const nilai = s.telaah?.nilai || 0;
            const badge = (done, label) => `<span class="badge badge-${done?'success':'neutral'}" style="font-size:.65rem">${done?'✓':'○'} ${label}</span>`;

            return `<tr>
              <td>
                <div style="font-weight:600">${Utils.esc(g?.nama || '?')}</div>
                <div style="font-size:.75rem;color:var(--slate-500)">${Utils.esc(g?.mapel || '—')}</div>
              </td>
              <td>${Utils.date(s.tgl)}</td>
              <td style="text-align:center;white-space:nowrap">${badge(tDone,'Telaah')} ${badge(oDone,'Obs')} ${badge(rDone,'Refleksi')}</td>
              <td style="text-align:center;font-weight:700">${nilai > 0 ? nilai + '<span style="font-weight:400;color:var(--slate-400);font-size:.7rem">/100</span>' : '—'}</td>
              <td style="text-align:center"><span class="badge badge-${isDraft?'warning':'success'}">${isDraft?'Draft':'Selesai'}</span></td>
              <td style="text-align:right;white-space:nowrap">
                <button class="btn btn-secondary btn-sm" data-open="${s.id}">${Icons.svg('pencil', 14)} ${isDraft?'Lanjut':'Lihat'}</button>
                <button class="btn btn-primary btn-sm" data-print="${s.id}" ${isDraft?'disabled':''}>${Icons.svg('printer', 14)} Cetak</button>
                <button class="btn btn-danger btn-sm" data-del="${s.id}">${Icons.svg('trash-2', 14)}</button>
              </td>
            </tr>`;
          }).join('')}</tbody>
        </table></div>
      `}
    `;
  },

  async _bindList() {
    Utils.el('btnStartPM')?.addEventListener('click', () => this._startNew());
    Utils.el('btnEmptyStart')?.addEventListener('click', () => this._startNew());
    document.querySelectorAll('[data-open]').forEach(b => { b.onclick = () => this._open(b.dataset.open); });
    document.querySelectorAll('[data-print]').forEach(b => { b.onclick = () => this.print(b.dataset.print); });
    document.querySelectorAll('[data-del]').forEach(b => { b.onclick = () => this._delete(b.dataset.del); });
  },

  _startNew() {
    const guru = Store.get('guru');
    if (guru.length === 0) return Utils.toast('Tambahkan guru dulu di Data Guru', 'warning');

    Utils.modal('Mulai Supervisi PM Baru', `
      <div class="form-group">
        <label class="label">Pilih Guru *</label>
        <select class="select" id="pmGuru">
          ${guru.map(g => `<option value="${g.id}">${Utils.esc(guruLabel(g))}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="label">Tanggal Supervisi *</label>
        <input type="date" class="input" id="pmTgl" value="${Utils.today()}">
      </div>
      <div class="info-banner info" style="margin-top:.5rem">
        ${Icons.svg('info', 16)}
        <div>Siklus Supervisi PM: <strong>Telaah RPP</strong> → <strong>Observasi Implementasi</strong> → <strong>Refleksi & RTL</strong>. Bisa simpan draft di setiap tahap.</div>
      </div>
    `, `<button class="btn btn-secondary" onclick="Utils.closeModal()">Batal</button>
        <button class="btn btn-primary" id="btnStartPMSave">${Icons.svg('chevron-right', 16)} Mulai</button>`);

    Utils.el('btnStartPMSave').onclick = () => {
      const gid = Utils.el('pmGuru').value;
      const tgl = Utils.el('pmTgl').value;
      if (!gid) return Utils.toast('Pilih guru dulu', 'error');
      if (!tgl) return Utils.toast('Tanggal wajib diisi', 'error');

      const now = new Date().toISOString();
      const rec = {
        id: Utils.uid(), gid, tgl, step: 1, status: 'draft',
        telaah: { meta: { jenjang:'', mapel:'', kelas:'', judul_rpp:'' }, skor:{}, komentar:{}, kualitatif:{}, total:0, nilai:0 },
        obs: { meta: { hari_tanggal:tgl, satuan_pendidikan:'', nama_guru:'', kelas_semester:'', mapel:'', pemberi_umpan_balik:'' }, bukti:{}, catatan:{} },
        refleksi: {},
        created_at: now, updated_at: now
      };
      const list = Store.get('supervisiPM') || [];
      list.push(rec);
      Store.set('supervisiPM', list);

      Utils.closeModal();
      _cur = rec; _step = 1;
      Router.navigate('supervisi_pm');
    };
  },

  _open(id) {
    const list = Store.get('supervisiPM') || [];
    const rec = list.find(x => x.id === id);
    if (!rec) return;
    _cur = JSON.parse(JSON.stringify(rec));
    _step = rec.step || 1;
    Router.navigate('supervisi_pm');
  },

  _delete(id) {
    Utils.confirm('Hapus Supervisi PM?', 'Data telaah, observasi, dan refleksi akan dihapus permanen.', () => {
      Store.set('supervisiPM', (Store.get('supervisiPM')||[]).filter(x => x.id !== id));
      Router.navigate('supervisi_pm');
    });
  },

  // ============================================
  // WIZARD VIEW
  // ============================================
  _renderWizard() {
    if (!_cur) return '';
    const g = Store.get('guru').find(x => x.id === _cur.gid);
    const isReadonly = _cur.status === 'selesai';

    const stepper = `
      <div style="display:flex;gap:.35rem;margin-bottom:1rem;flex-wrap:wrap">
        <button class="step-tab ${_step===1?'active':_step>1?'done':''}" data-step="1">1. Telaah RPP</button>
        <button class="step-tab ${_step===2?'active':_step>2?'done':''}" data-step="2">2. Observasi</button>
        <button class="step-tab ${_step===3?'active':''}" data-step="3">3. Refleksi & RTL</button>
      </div>`;

    let body = '';
    if (_step === 1) body = this._renderTelaah(isReadonly);
    else if (_step === 2) body = this._renderObs(isReadonly);
    else body = this._renderRefleksi(isReadonly);

    return `
      <div class="page-head">
        <div>
          <h2>Supervisi PM — ${Utils.esc(g?.nama || '?')}</h2>
          <div class="page-sub">${Utils.date(_cur.tgl)} · ${isReadonly?'<span class="badge badge-success">Selesai</span>':'<span class="badge badge-warning">Draft</span>'}</div>
        </div>
        <button class="btn btn-secondary" id="btnBack">${Icons.svg('chevron-left', 16)} Kembali</button>
      </div>
      ${stepper}
      ${body}
      <div style="display:flex;justify-content:space-between;gap:.5rem;margin-bottom:3rem;flex-wrap:wrap">
        <div>${_step > 1 && !isReadonly ? `<button class="btn btn-ghost" id="btnPrev">${Icons.svg('chevron-left', 16)} Sebelumnya</button>` : ''}</div>
        <div style="display:flex;gap:.5rem">
          ${!isReadonly ? `<button class="btn btn-secondary" id="btnDraft">${Icons.svg('save', 16)} Simpan Draft</button>` : ''}
          ${!isReadonly && _step < 3 ? `<button class="btn btn-primary" id="btnNext">Lanjut ${Icons.svg('chevron-right', 16)}</button>` : ''}
          ${!isReadonly && _step === 3 ? `<button class="btn btn-success" id="btnDone">${Icons.svg('check', 16)} Selesaikan</button>` : ''}
          ${isReadonly ? `<button class="btn btn-primary" id="btnPrintNow">${Icons.svg('printer', 16)} Cetak</button>` : ''}
        </div>
      </div>`;
  },

  async _bindWizard() {
    const isReadonly = _cur?.status === 'selesai';
    Utils.el('btnBack').onclick = () => { _cur = null; _step = 1; Router.navigate('supervisi_pm'); };

    document.querySelectorAll('.step-tab').forEach(b => {
      b.onclick = () => this._goStep(parseInt(b.dataset.step));
    });

    Utils.el('btnPrev')?.addEventListener('click', () => this._goStep(_step - 1));
    Utils.el('btnNext')?.addEventListener('click', () => this._goStep(_step + 1));
    Utils.el('btnDraft')?.addEventListener('click', () => this._saveDraft());
    Utils.el('btnDone')?.addEventListener('click', () => this._finish());
    Utils.el('btnPrintNow')?.addEventListener('click', () => this.print(_cur.id));

    if (isReadonly) return;

    // Score buttons (Telaah)
    document.querySelectorAll('.skor-pm').forEach(btn => {
      btn.onclick = () => {
        const kode = parseInt(btn.dataset.kode);
        const v = parseInt(btn.dataset.v);
        _cur.telaah.skor[kode] = v;
        document.querySelectorAll(`.skor-pm[data-kode="${kode}"]`).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        // Update live total badge
        const badge = Utils.el('telaahBadge');
        if (badge) {
          const total = Object.values(_cur.telaah.skor).reduce((a,b) => a+b, 0);
          const filled = Object.keys(_cur.telaah.skor).length;
          const nilai = Math.round(total / MAX_SKOR * 100);
          badge.textContent = `${filled}/${MAX_TELAAH} · Skor ${total}/${MAX_SKOR} (${nilai})`;
        }
      };
    });

    // Komentar & kualitatif telaah
    document.querySelectorAll('[data-komentar]').forEach(ta => { ta.oninput = () => { _cur.telaah.komentar[parseInt(ta.dataset.komentar)] = ta.value; }; });
    document.querySelectorAll('[data-kualitatif]').forEach(ta => { ta.oninput = () => { _cur.telaah.kualitatif[parseInt(ta.dataset.kualitatif)] = ta.value; }; });

    // Telaah meta
    ['jenjang','mapel','kelas','judul_rpp'].forEach(k => {
      const inp = Utils.el('telaah_' + k);
      if (inp) inp.oninput = () => { _cur.telaah.meta[k] = inp.value; };
    });

    // Obs bukti & catatan
    document.querySelectorAll('[data-bukti]').forEach(ta => { ta.oninput = () => { _cur.obs.bukti[parseInt(ta.dataset.bukti)] = ta.value; }; });
    document.querySelectorAll('[data-catatan]').forEach(ta => { ta.oninput = () => { _cur.obs.catatan[parseInt(ta.dataset.catatan)] = ta.value; }; });

    // Obs meta
    ['hari_tanggal','satuan_pendidikan','nama_guru','kelas_semester','mapel','pemberi_umpan_balik'].forEach(k => {
      const inp = Utils.el('obs_' + k);
      if (inp) inp.oninput = () => { _cur.obs.meta[k] = inp.value; };
    });

    // Refleksi
    document.querySelectorAll('[data-refleksi]').forEach(ta => { ta.oninput = () => { _cur.refleksi[parseInt(ta.dataset.refleksi)] = ta.value; }; });
  },

  _renderTelaah(isReadonly) {
    const t = _cur.telaah;
    const html = [];
    let lastSec = '';

    INSTRUMEN_TELAAH_RPP.forEach(item => {
      if (item.sec !== lastSec) {
        lastSec = item.sec;
        html.push(`<div style="background:var(--brand-50);padding:.55rem 1rem;font-weight:700;font-size:.8rem;color:var(--brand-700)">${Utils.esc(item.sec)}</div>`);
      }
      const curSkor = t.skor[item.kode];
      const curKom = t.komentar[item.kode] || '';
      const subHtml = item.sub && item.sub.length > 0
        ? `<details style="margin-top:.35rem"><summary style="font-size:.75rem;color:var(--slate-500);cursor:pointer">Panduan pengamatan (${item.sub.length})</summary>
            <ul style="margin:.35rem 0 0;padding-left:1.25rem;font-size:.75rem;color:var(--slate-600);line-height:1.55">
              ${item.sub.map(s => `<li>${Utils.esc(s)}</li>`).join('')}
            </ul></details>` : '';

      html.push(`
        <div style="padding:.85rem 1rem;border-bottom:1px solid var(--slate-100)">
          <div style="display:flex;gap:.75rem;align-items:flex-start">
            <div class="ind-kode" style="flex-shrink:0">${item.kode}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:.85rem;line-height:1.55;color:var(--slate-800)">${Utils.esc(item.t)}</div>
              ${subHtml}
              <div style="margin-top:.65rem">
                <div style="font-size:10px;font-weight:600;color:var(--slate-500);margin-bottom:4px">Skor (0=tidak ada · 1=sangat kurang · 2=kurang · 3=baik · 4=sangat baik)</div>
                <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:3px">
                  ${[0,1,2,3,4].map(v => `
                    <button class="skor-pm skor-btn ${curSkor===v?'active':''}" data-v="${v}" data-kode="${item.kode}" ${isReadonly?'disabled':''}>${v}</button>
                  `).join('')}
                </div>
                <textarea class="textarea" style="margin-top:.5rem;font-size:.8rem" rows="2"
                  placeholder="Komentar kritis (opsional)" data-komentar="${item.kode}" ${isReadonly?'disabled':''}>${Utils.esc(curKom)}</textarea>
              </div>
            </div>
          </div>
        </div>
      `);
    });

    const total = Object.values(t.skor).reduce((a,b) => a+b, 0);
    const nilai = Math.round(total / MAX_SKOR * 100);
    const filled = Object.keys(t.skor).length;

    return `
      <div class="card" style="margin-bottom:1rem"><div class="card-body">
        <div style="font-size:.7rem;font-weight:700;color:var(--slate-500);text-transform:uppercase;margin-bottom:.75rem">Identitas Perencanaan</div>
        <div class="row">
          <div class="form-group"><label class="label">Jenjang</label><input class="input" id="telaah_jenjang" value="${Utils.esc(t.meta.jenjang || '')}" placeholder="SD/SMP/SMA" ${isReadonly?'disabled':''}></div>
          <div class="form-group"><label class="label">Mata Pelajaran</label><input class="input" id="telaah_mapel" value="${Utils.esc(t.meta.mapel || '')}" placeholder="Matematika" ${isReadonly?'disabled':''}></div>
        </div>
        <div class="row">
          <div class="form-group"><label class="label">Kelas</label><input class="input" id="telaah_kelas" value="${Utils.esc(t.meta.kelas || '')}" placeholder="V" ${isReadonly?'disabled':''}></div>
          <div class="form-group"><label class="label">Judul Perencanaan</label><input class="input" id="telaah_judul_rpp" value="${Utils.esc(t.meta.judul_rpp || '')}" placeholder="Bangun Ruang" ${isReadonly?'disabled':''}></div>
        </div>
      </div></div>

      <div class="card" style="margin-bottom:1rem">
        <div class="card-header">
          ${Icons.svg('file-check', 18)} Instrumen Telaah RPP
          <span id="telaahBadge" class="badge badge-${filled===MAX_TELAAH?'success':'warning'}">${filled}/${MAX_TELAAH} · Skor ${total}/${MAX_SKOR} (${nilai})</span>
        </div>
        <div style="padding:0">${html.join('')}</div>
      </div>

      <div class="card" style="margin-bottom:1rem">
        <div class="card-header">${Icons.svg('message-square', 18)} Komentar Kualitatif</div>
        <div class="card-body">
          ${KUALITATIF_TELAAH.map(q => `
            <div class="form-group">
              <label class="label">${q.kode}. ${Utils.esc(q.t)}</label>
              <textarea class="textarea" rows="3" data-kualitatif="${q.kode}" ${isReadonly?'disabled':''}>${Utils.esc(t.kualitatif[q.kode] || '')}</textarea>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  _renderObs(isReadonly) {
    const o = _cur.obs;
    const html = [];
    let lastSec = '';

    INSTRUMEN_OBS_PM.forEach(item => {
      if (item.sec !== lastSec) {
        lastSec = item.sec;
        html.push(`<div style="background:var(--brand-50);padding:.55rem 1rem;font-weight:700;font-size:.8rem;color:var(--brand-700)">${Utils.esc(item.sec)}</div>`);
      }
      const curBukti = o.bukti[item.kode] || '';
      const curCat = o.catatan[item.kode] || '';
      const subHtml = item.sub && item.sub.length > 0
        ? `<details style="margin-top:.35rem"><summary style="font-size:.75rem;color:var(--slate-500);cursor:pointer">Panduan pengamatan (${item.sub.length})</summary>
            <ul style="margin:.35rem 0 0;padding-left:1.25rem;font-size:.75rem;color:var(--slate-600);line-height:1.55">
              ${item.sub.map(s => `<li>${Utils.esc(s)}</li>`).join('')}
            </ul></details>` : '';

      html.push(`
        <div style="padding:.85rem 1rem;border-bottom:1px solid var(--slate-100)">
          <div style="display:flex;gap:.75rem;align-items:flex-start">
            <div class="ind-kode" style="flex-shrink:0">${item.kode}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:.85rem;line-height:1.55;color:var(--slate-800)">${Utils.esc(item.t)}</div>
              ${subHtml}
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-top:.65rem">
                <div>
                  <div style="font-size:10px;font-weight:600;color:var(--slate-500);margin-bottom:3px">Bukti Pembelajaran</div>
                  <textarea class="textarea" rows="2" style="font-size:.8rem" placeholder="Fakta yang dilihat/didengar..."
                    data-bukti="${item.kode}" ${isReadonly?'disabled':''}>${Utils.esc(curBukti)}</textarea>
                </div>
                <div>
                  <div style="font-size:10px;font-weight:600;color:var(--slate-500);margin-bottom:3px">Catatan</div>
                  <textarea class="textarea" rows="2" style="font-size:.8rem" placeholder="Interpretasi/refleksi..."
                    data-catatan="${item.kode}" ${isReadonly?'disabled':''}>${Utils.esc(curCat)}</textarea>
                </div>
              </div>
            </div>
          </div>
        </div>
      `);
    });

    const filled = Object.values(o.bukti).filter(v => isFilled(v)).length;
    const g = Store.get('guru').find(x => x.id === _cur.gid);
    const cfg = Store.config();

    return `
      <div class="card" style="margin-bottom:1rem"><div class="card-body">
        <div style="font-size:.7rem;font-weight:700;color:var(--slate-500);text-transform:uppercase;margin-bottom:.75rem">Identitas Observasi</div>
        <div class="row">
          <div class="form-group"><label class="label">Hari/Tanggal</label><input type="date" class="input" id="obs_hari_tanggal" value="${o.meta.hari_tanggal || _cur.tgl || ''}" ${isReadonly?'disabled':''}></div>
          <div class="form-group"><label class="label">Nama Satuan Pendidikan</label><input class="input" id="obs_satuan_pendidikan" value="${Utils.esc(o.meta.satuan_pendidikan || '')}" placeholder="${Utils.esc(cfg.nama_sekolah || '')}" ${isReadonly?'disabled':''}></div>
        </div>
        <div class="row">
          <div class="form-group"><label class="label">Nama Guru</label><input class="input" id="obs_nama_guru" value="${Utils.esc(o.meta.nama_guru || '')}" placeholder="${Utils.esc(g?.nama || '')}" ${isReadonly?'disabled':''}></div>
          <div class="form-group"><label class="label">Kelas/Semester</label><input class="input" id="obs_kelas_semester" value="${Utils.esc(o.meta.kelas_semester || '')}" placeholder="V/1" ${isReadonly?'disabled':''}></div>
        </div>
        <div class="row">
          <div class="form-group"><label class="label">Mata Pelajaran</label><input class="input" id="obs_mapel" value="${Utils.esc(o.meta.mapel || '')}" placeholder="Matematika" ${isReadonly?'disabled':''}></div>
          <div class="form-group"><label class="label">Pemberi Umpan Balik</label><input class="input" id="obs_pemberi_umpan_balik" value="${Utils.esc(o.meta.pemberi_umpan_balik || '')}" placeholder="${Utils.esc(cfg.nama_ks || 'Nama kepala sekolah')}" ${isReadonly?'disabled':''}></div>
        </div>
      </div></div>

      <div class="card" style="margin-bottom:1rem">
        <div class="card-header">
          ${Icons.svg('eye', 18)} Instrumen Observasi Implementasi
          <span class="badge badge-${filled===MAX_OBS?'success':'warning'}">${filled}/${MAX_OBS} terisi</span>
        </div>
        <div style="padding:0">${html.join('')}</div>
      </div>
    `;
  },

  _renderRefleksi(isReadonly) {
    const r = _cur.refleksi || {};
    return `
      <div class="card" style="margin-bottom:1rem">
        <div class="card-header">${Icons.svg('message-circle', 18)} Refleksi Pasca-Observasi</
