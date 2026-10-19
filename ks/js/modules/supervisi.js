import { Store } from '../../storage.js';
import { Utils } from '../../../shared/js/utils.js';
import { Icons } from '../../../shared/js/icons.js';
import { Router } from '../../../shared/js/router.js';
import { emptyState, guruLabel, updateDupWarn } from '../helpers.js';
import {
  PRINSIP_LIST, PENGALAMAN_LIST, DPL_LABELS, MOMEN_LIST,
  REFLEKSI_7, FOKUS_LABELS, KESIAPAN_LABELS
} from '../../../shared/js/constants.js';

let _cur = null;      // current supervisi object
let _step = 1;        // current step (1, 2, 3)

const goNav = (tab) => Router.navigate(tab);

export const Supervisi = {
  async render() {
    const list = Store.get('supervisi');
    const guru = Store.get('guru');

    return `
      <div class="page-head">
        <div>
          <h2>Supervisi 3 Tahap</h2>
          <div class="page-sub">${list.length} sesi tersimpan</div>
        </div>
        <button class="btn btn-primary" id="btnStartSup">${Icons.svg('plus', 16)} Mulai Supervisi</button>
      </div>

      ${list.length === 0 ? `<div class="card"><div class="card-body">
        ${emptyState('clipboard-list', 'Belum ada sesi supervisi', 'Mulai supervisi pertama: pra-observasi, observasi, pasca-observasi.',
          `<button class="btn btn-primary" id="btnEmptyStart">${Icons.svg('plus', 16)} Mulai Supervisi</button>`)}
      </div></div>` : `
        <div class="card"><table>
          <thead><tr>
            <th>Guru</th>
            <th>Tanggal</th>
            <th style="text-align:center">Status</th>
            <th style="text-align:right">Aksi</th>
          </tr></thead>
          <tbody>${list.map(s => {
            const g = guru.find(x => x.id === s.gid);
            return `<tr>
              <td style="font-weight:600">${Utils.esc(g?.nama || '?')}</td>
              <td>${Utils.date(s.tgl)}</td>
              <td style="text-align:center"><span class="badge badge-${s.status === 'selesai' ? 'success' : 'warning'}">${s.status === 'selesai' ? 'Selesai' : 'Draft'}</span></td>
              <td style="text-align:right;white-space:nowrap">
                <button class="btn btn-secondary btn-sm" data-open="${s.id}">${Icons.svg('pencil', 14)} Edit</button>
                <button class="btn btn-primary btn-sm" data-print="${s.id}">${Icons.svg('printer', 14)} Cetak</button>
                <button class="btn btn-danger btn-sm" data-del="${s.id}">${Icons.svg('trash-2', 14)}</button>
              </td>
            </tr>`;
          }).join('')}</tbody>
        </table></div>
      `}
    `;
  },

  async bind() {
    Utils.el('btnStartSup')?.addEventListener('click', () => this.start());
    Utils.el('btnEmptyStart')?.addEventListener('click', () => this.start());
    document.querySelectorAll('[data-open]').forEach(b => b.onclick = () => this._open(b.dataset.open));
    document.querySelectorAll('[data-print]').forEach(b => b.onclick = () => this.print(b.dataset.print));
    document.querySelectorAll('[data-del]').forEach(b => b.onclick = () => this.del(b.dataset.del));
  },

  start() {
    const guru = Store.get('guru');
    if (guru.length === 0) return Utils.toast('Tambahkan guru dulu di Data Guru', 'warning');

    Utils.modal('Mulai Supervisi Baru', `
      <div class="form-group">
        <label class="label">Pilih Guru *</label>
        <select class="select" id="sg" onchange="window.__updateDupWarn && window.__updateDupWarn('sg','sgWarn','supervisi')">
          ${guru.map(g => `<option value="${g.id}">${Utils.esc(guruLabel(g))}</option>`).join('')}
        </select>
        <div id="sgWarn" style="display:none;margin-top:.5rem"></div>
      </div>
      <div class="form-group">
        <label class="label">Tanggal Supervisi *</label>
        <input type="date" class="input" id="st" value="${Utils.today()}">
      </div>
    `, `<button class="btn btn-secondary" onclick="Utils.closeModal()">Batal</button><button class="btn btn-primary" id="btnStart">${Icons.svg('chevron-right', 16)} Mulai</button>`);

    // Expose warning updater once
    window.__updateDupWarn = updateDupWarn;
    updateDupWarn('sg', 'sgWarn', 'supervisi');

    Utils.el('btnStart').onclick = () => {
      const id = Utils.uid();
      const list = Store.get('supervisi');
      list.push({
        id, gid: Utils.el('sg').value, tgl: Utils.el('st').value,
        status: 'draft', step: 1,
        tujuan: '', strategi: '', asesmen: '',
        prinsip_pm: {}, pengalaman: {}, dpl: [],
        aspek_fokus: '', kesiapan: '', dokumen: '',
        obs_guru: '', obs_murid: '', momen: [], kka: '', durasi: '',
        refleksi: {}, respon: {}, rtl: { aksi: '', waktu: '', dukungan: '', indikator: '' }, link_dok: ''
      });
      Store.set('supervisi', list);
      Utils.closeModal();
      this._open(id);
    };
  },

  _open(id) {
    const s = Store.get('supervisi').find(x => x.id === id);
    if (!s) return;
    _cur = s;
    _step = s.step || 1;
    this._wizard();
  },

  _wizard() {
    if (!_cur) return goNav('supervisi');
    const g = Store.get('guru').find(x => x.id === _cur.gid);
    const step = _step;
    const stepper = `
      <div style="display:flex;gap:.35rem;margin-bottom:1rem;flex-wrap:wrap">
        <button class="step-tab ${step === 1 ? 'active' : step > 1 ? 'done' : ''}" data-step="1">1. Pra-Observasi</button>
        <button class="step-tab ${step === 2 ? 'active' : step > 2 ? 'done' : ''}" data-step="2">2. Observasi</button>
        <button class="step-tab ${step === 3 ? 'active' : ''}" data-step="3">3. Pasca</button>
      </div>`;
    let body = step === 1 ? this._pra(_cur) : step === 2 ? this._obs(_cur) : this._pasca(_cur);

    Utils.el('main').innerHTML = `
      <div class="page-head">
        <div>
          <h2>Supervisi — ${Utils.esc(g?.nama || '?')}</h2>
          <div class="page-sub">${Utils.date(_cur.tgl)}</div>
        </div>
        <button class="btn btn-secondary" id="btnBack">${Icons.svg('chevron-left', 16)} Kembali</button>
      </div>
      ${stepper}
      ${body}
      <div style="display:flex;justify-content:space-between;gap:.5rem;margin-bottom:3rem;flex-wrap:wrap">
        <div>${step > 1 ? `<button class="btn btn-ghost" id="btnPrev">${Icons.svg('chevron-left', 16)} Sebelumnya</button>` : ''}</div>
        <div style="display:flex;gap:.5rem">
          <button class="btn btn-secondary" id="btnDraft">${Icons.svg('save', 16)} Simpan Draft</button>
          ${step < 3
            ? `<button class="btn btn-primary" id="btnNext">Lanjut ${Icons.svg('chevron-right', 16)}</button>`
            : `<button class="btn btn-success" id="btnDone">${Icons.svg('check', 16)} Selesaikan</button>`}
        </div>
      </div>`;
    Icons.inject();
    this._bindWizard();
  },

  _bindWizard() {
    Utils.el('btnBack').onclick = () => { _cur = null; _step = 1; goNav('supervisi'); };
    document.querySelectorAll('.step-tab').forEach(b => {
      b.onclick = () => this._goStep(parseInt(b.dataset.step));
    });
    Utils.el('btnPrev')?.addEventListener('click', () => this._goStep(_step - 1));
    Utils.el('btnNext')?.addEventListener('click', () => this._goStep(_step + 1));
    Utils.el('btnDraft')?.addEventListener('click', () => this._saveDraft());
    Utils.el('btnDone')?.addEventListener('click', () => this._finish());
    // Respon buttons (pasca)
    document.querySelectorAll('[data-respon]').forEach(b => {
      b.onclick = () => this._setRespon(b.dataset.key, b.dataset.respon);
    });
  },

  _pra(s) {
    return `
      <div class="card"><div class="card-body">
        <div class="form-group"><label class="label">Tujuan Pembelajaran</label><textarea class="textarea" id="fTujuan" rows="2">${Utils.esc(s.tujuan || '')}</textarea></div>
        <div class="form-group"><label class="label">Strategi / Praktik Pedagogis</label><textarea class="textarea" id="fStrategi" rows="2">${Utils.esc(s.strategi || '')}</textarea></div>
        <div class="form-group"><label class="label">Rencana Asesmen</label><textarea class="textarea" id="fAsesmen" rows="2">${Utils.esc(s.asesmen || '')}</textarea></div>
      </div></div>

      <div class="card"><div class="card-header">${Icons.svg('target', 18)} Prinsip Pembelajaran Mendalam</div><div class="card-body">
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem">
          ${PRINSIP_LIST.map(p => `
            <label class="cbx">
              <input type="checkbox" id="pm_${p.key}" ${(s.prinsip_pm || {})[p.key] ? 'checked' : ''}>
              <div style="font-size:.85rem;font-weight:600">${p.label}</div>
            </label>`).join('')}
        </div>
      </div></div>

      <div class="card"><div class="card-header">${Icons.svg('bar-chart-3', 18)} Pengalaman Belajar</div><div class="card-body">
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem">
          ${PENGALAMAN_LIST.map(p => `
            <label class="cbx">
              <input type="checkbox" id="pl_${p.key}" ${(s.pengalaman || {})[p.key] ? 'checked' : ''}>
              <div style="font-size:.85rem;font-weight:600">${p.label}</div>
            </label>`).join('')}
        </div>
      </div></div>

      <div class="card"><div class="card-header">${Icons.svg('graduation-cap', 18)} 8 Dimensi Profil Lulusan</div><div class="card-body">
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:.4rem">
          ${DPL_LABELS.map((d, i) => `
            <label class="cbx cbx-sm">
              <input type="checkbox" id="dpl_${i + 1}" ${(s.dpl || []).includes(i + 1) ? 'checked' : ''}>
              <div>${d}</div>
            </label>`).join('')}
        </div>
      </div></div>

      <div class="card"><div class="card-body">
        <div class="row">
          <div class="form-group">
            <label class="label">Aspek Fokus Observasi</label>
            <select class="select" id="fFokus">
              <option value="">— Pilih —</option>
              <option value="teknik_bertanya" ${s.aspek_fokus === 'teknik_bertanya' ? 'selected' : ''}>Teknik Bertanya</option>
              <option value="memuliakan" ${s.aspek_fokus === 'memuliakan' ? 'selected' : ''}>Memuliakan Murid</option>
              <option value="kolaborasi" ${s.aspek_fokus === 'kolaborasi' ? 'selected' : ''}>Kolaborasi</option>
              <option value="refleksi" ${s.aspek_fokus === 'refleksi' ? 'selected' : ''}>Refleksi</option>
              <option value="integrasi_kka" ${s.aspek_fokus === 'integrasi_kka' ? 'selected' : ''}>Integrasi KKA</option>
            </select>
          </div>
          <div class="form-group">
            <label class="label">Kesiapan Guru</label>
            <select class="select" id="fSiap">
              <option value="">— Pilih —</option>
              <option value="siap" ${s.kesiapan === 'siap' ? 'selected' : ''}>Siap</option>
              <option value="ragu" ${s.kesiapan === 'ragu' ? 'selected' : ''}>Ragu</option>
              <option value="belum_siap" ${s.kesiapan === 'belum_siap' ? 'selected' : ''}>Belum Siap</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="label">Link Dokumen (Opsional)</label>
          <input class="input" id="fDok" value="${Utils.esc(s.dokumen || '')}" placeholder="https://...">
        </div>
      </div></div>`;
  },

  _obs(s) {
    return `
      <div class="card"><div class="card-body">
        <div style="padding:.75rem;background:var(--brand-50);border-left:3px solid var(--brand-500);border-radius:4px;font-size:.8rem;color:var(--brand-700);margin-bottom:1rem">
          Catat aktivitas faktual (bukan opini) yang dilihat & didengar.
        </div>
        <div class="form-group"><label class="label">Aktivitas Guru</label><textarea class="textarea" id="fObsGuru" rows="4">${Utils.esc(s.obs_guru || '')}</textarea></div>
        <div class="form-group"><label class="label">Aktivitas Murid</label><textarea class="textarea" id="fObsMurid" rows="4">${Utils.esc(s.obs_murid || '')}</textarea></div>
      </div></div>

      <div class="card"><div class="card-header">${Icons.svg('target', 18)} Momen Pembelajaran Mendalam</div><div class="card-body">
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:.5rem">
          ${MOMEN_LIST.map(m => `
            <label class="cbx cbx-sm">
              <input type="checkbox" id="mm_${m.key}" ${(s.momen || []).includes(m.key) ? 'checked' : ''}>
              <div>${m.label}</div>
            </label>`).join('')}
        </div>
      </div></div>

      <div class="card"><div class="card-body">
        <div class="form-group"><label class="label">Integrasi Koding / AI (KKA)</label><textarea class="textarea" id="fKKA" rows="2">${Utils.esc(s.kka || '')}</textarea></div>
        <div class="form-group"><label class="label">Durasi Observasi (menit)</label><input type="number" class="input" id="fDur" value="${s.durasi || ''}"></div>
      </div></div>`;
  },

  _pasca(s) {
    return `
      <div class="card"><div class="card-header">${Icons.svg('message-circle', 18)} 7 Pertanyaan Refleksi</div><div class="card-body">
        ${REFLEKSI_7.map((r, i) => {
          const curResp = (s.respon || {})[r.key];
          return `<div style="padding:.75rem;border:1px solid var(--slate-200);border-radius:8px;margin-bottom:.65rem">
            <div style="font-weight:600;font-size:.85rem;margin-bottom:.35rem">${i + 1}. ${r.q}</div>
            <textarea class="textarea" id="rf_${r.key}" rows="2" style="margin-bottom:.5rem;font-size:.8rem">${Utils.esc((s.refleksi || {})[r.key] || '')}</textarea>
            <div style="font-size:.7rem;color:var(--slate-500);margin-bottom:.25rem">Respons supervisor:</div>
            <div style="display:flex;gap:.4rem">
              <button type="button" class="btn btn-sm ${curResp === 'menanyakan' ? 'btn-primary' : 'btn-secondary'}" data-respon="menanyakan" data-key="${r.key}" style="flex:1">Menanyakan</button>
              <button type="button" class="btn btn-sm ${curResp === 'memberitahu' ? 'btn-primary' : 'btn-secondary'}" data-respon="memberitahu" data-key="${r.key}" style="flex:1">Memberitahu</button>
            </div>
          </div>`;
        }).join('')}
      </div></div>

      <div class="card"><div class="card-header">${Icons.svg('file-text', 18)} RTL (Rencana Tindak Lanjut)</div><div class="card-body">
        <div class="form-group"><label class="label">Rencana Aksi</label><textarea class="textarea" id="fRtlAksi" rows="2">${Utils.esc((s.rtl || {}).aksi || '')}</textarea></div>
        <div class="row">
          <div class="form-group"><label class="label">Waktu Pelaksanaan</label><input class="input" id="fRtlWaktu" value="${Utils.esc((s.rtl || {}).waktu || '')}" placeholder="Kamis, 20 Okt"></div>
          <div class="form-group"><label class="label">Dukungan</label><input class="input" id="fRtlDuk" value="${Utils.esc((s.rtl || {}).dukungan || '')}"></div>
        </div>
        <div class="form-group"><label class="label">Indikator Keberhasilan</label><input class="input" id="fRtlInd" value="${Utils.esc((s.rtl || {}).indikator || '')}"></div>
        <div class="form-group"><label class="label">Link Dokumentasi</label><input class="input" id="fLinkDok" value="${Utils.esc(s.link_dok || '')}"></div>
      </div></div>`;
  },

  _setRespon(key, val) {
    this._collect();
    _cur.respon = _cur.respon || {};
    _cur.respon[key] = val;
    // persist
    const list = Store.get('supervisi');
    const idx = list.findIndex(x => x.id === _cur.id);
    if (idx !== -1) list[idx] = _cur;
    Store.set('supervisi', list);
    this._wizard();
  },

  _collect() {
    if (!_cur) return;
    const s = _cur;
    const el = Utils.el;
    if (_step === 1) {
      s.tujuan = el('fTujuan')?.value || '';
      s.strategi = el('fStrategi')?.value || '';
      s.asesmen = el('fAsesmen')?.value || '';
      s.prinsip_pm = {};
      PRINSIP_LIST.forEach(p => s.prinsip_pm[p.key] = el('pm_' + p.key)?.checked || false);
      s.pengalaman = {};
      PENGALAMAN_LIST.forEach(p => s.pengalaman[p.key] = el('pl_' + p.key)?.checked || false);
      s.dpl = [];
      DPL_LABELS.forEach((_, i) => { if (el('dpl_' + (i + 1))?.checked) s.dpl.push(i + 1); });
      s.aspek_fokus = el('fFokus')?.value || '';
      s.kesiapan = el('fSiap')?.value || '';
      s.dokumen = el('fDok')?.value || '';
    } else if (_step === 2) {
      s.obs_guru = el('fObsGuru')?.value || '';
      s.obs_murid = el('fObsMurid')?.value || '';
      s.momen = [];
      MOMEN_LIST.forEach(m => { if (el('mm_' + m.key)?.checked) s.momen.push(m.key); });
      s.kka = el('fKKA')?.value || '';
      s.durasi = el('fDur')?.value || '';
    } else if (_step === 3) {
      s.refleksi = s.refleksi || {};
      REFLEKSI_7.forEach(r => { const e = el('rf_' + r.key); if (e) s.refleksi[r.key] = e.value; });
      s.rtl = s.rtl || {};
      if (el('fRtlAksi')) s.rtl.aksi = el('fRtlAksi').value;
      if (el('fRtlWaktu')) s.rtl.waktu = el('fRtlWaktu').value;
      if (el('fRtlDuk')) s.rtl.dukungan = el('fRtlDuk').value;
      if (el('fRtlInd')) s.rtl.indikator = el('fRtlInd').value;
      if (el('fLinkDok')) s.link_dok = el('fLinkDok').value;
    }
    const list = Store.get('supervisi');
    const idx = list.findIndex(x => x.id === s.id);
    if (idx !== -1) list[idx] = s;
    Store.set('supervisi', list);
  },

  _goStep(n) {
    this._collect();
    _step = n;
    _cur.step = n;
    this._wizard();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  _saveDraft() {
    this._collect();
    Utils.toast('Draft tersimpan', 'success');
  },

  _finish() {
    this._collect();
    _cur.status = 'selesai';
    const list = Store.get('supervisi');
    const idx = list.findIndex(x => x.id === _cur.id);
    if (idx !== -1) list[idx] = _cur;
    Store.set('supervisi', list);
    _cur = null; _step = 1;
    Utils.toast('Supervisi selesai!', 'success');
    goNav('supervisi');
  },

  del(id) {
    Utils.confirm('Hapus Sesi?', 'Sesi supervisi akan dihapus permanen.', () => {
      Store.set('supervisi', Store.get('supervisi').filter(x => x.id !== id));
      goNav('supervisi');
    });
  },

  print(id) {
    const s = Store.get('supervisi').find(x => x.id === id);
    if (!s) return;
    const g = Store.get('guru').find(x => x.id === s.gid);
    const c = Store.config();
    const prinsipAktif = PRINSIP_LIST.filter(p => s.prinsip_pm[p.key]).map(p => p.label).join(', ') || '—';
    const pengalamanAktif = PENGALAMAN_LIST.filter(p => s.pengalaman[p.key]).map(p => p.label).join(', ') || '—';
    const dplAktif = (s.dpl || []).map(n => DPL_LABELS[n - 1]).join(', ') || '—';
    const momenLabels = (s.momen || []).map(k => (MOMEN_LIST.find(m => m.key === k) || {}).label || k).join(', ') || '—';
    const fokusLabel = FOKUS_LABELS[s.aspek_fokus] || s.aspek_fokus || '—';
    const kesiapanLabel = KESIAPAN_LABELS[s.kesiapan] || s.kesiapan || '—';
    const refleksiHtml = REFLEKSI_7.map((r, i) => {
      const resp = (s.respon || {})[r.key];
      const respLabel = resp === 'menanyakan' ? 'Menanyakan' : resp === 'memberitahu' ? 'Memberitahu' : '—';
      return `<div style="margin-bottom:6px"><strong>${i + 1}. ${r.q}</strong><br>${Utils.esc((s.refleksi || {})[r.key] || '-')}<br><em style="font-size:8.5pt;color:#64748b">Respons: ${respLabel}</em></div>`;
    }).join('');

    Utils.el('printArea').innerHTML = `
      <h1>LAPORAN SUPERVISI AKADEMIK</h1>
      <p class="sub">${Utils.esc(c.nama_sekolah)} — NPSN ${Utils.esc(c.npsn || '-')}</p>
      <table class="info">
        <tr><td>Guru</td><td>:</td><td><strong>${Utils.esc(g?.nama)}</strong></td></tr>
        <tr><td>NIP</td><td>:</td><td>${Utils.esc(g?.nip || '-')}</td></tr>
        <tr><td>Tanggal</td><td>:</td><td>${Utils.date(s.tgl)}</td></tr>
      </table>
      <h2>1. Pra-Observasi</h2>
      <p><strong>Tujuan:</strong> ${Utils.esc(s.tujuan || '-')}</p>
      <p><strong>Strategi:</strong> ${Utils.esc(s.strategi || '-')}</p>
      <p><strong>Asesmen:</strong> ${Utils.esc(s.asesmen || '-')}</p>
      <p><strong>Prinsip PM:</strong> ${prinsipAktif}</p>
      <p><strong>Pengalaman:</strong> ${pengalamanAktif}</p>
      <p><strong>DPL:</strong> ${dplAktif}</p>
      <p><strong>Fokus:</strong> ${fokusLabel}</p>
      <p><strong>Kesiapan:</strong> ${kesiapanLabel}</p>
      <h2>2. Observasi</h2>
      <p><strong>Aktivitas Guru:</strong> ${Utils.esc(s.obs_guru || '-')}</p>
      <p><strong>Aktivitas Murid:</strong> ${Utils.esc(s.obs_murid || '-')}</p>
      <p><strong>Momen PM:</strong> ${momenLabels}</p>
      <p><strong>KKA:</strong> ${Utils.esc(s.kka || '-')}</p>
      <p><strong>Durasi:</strong> ${s.durasi || '-'} menit</p>
      <h2>3. Pasca-Observasi</h2>
      ${refleksiHtml}
      <h2>Rencana Tindak Lanjut</h2>
      <p><strong>Aksi:</strong> ${Utils.esc((s.rtl || {}).aksi || '-')}</p>
      <p><strong>Waktu:</strong> ${Utils.esc((s.rtl || {}).waktu || '-')}</p>
      <p><strong>Dukungan:</strong> ${Utils.esc((s.rtl || {}).dukungan || '-')}</p>
      <p><strong>Indikator:</strong> ${Utils.esc((s.rtl || {}).indikator || '-')}</p>
      <div class="ttd-grid">
        <div class="ttd-box"><div>Kepala Sekolah</div><div class="ttd-space"></div><div class="ttd-name">${Utils.esc(c.nama_ks)}</div><div style="font-size:8.5pt;color:#64748b">NIP. ${Utils.esc(c.nip_ks || '...')}</div></div>
        <div class="ttd-box"><div>Guru</div><div class="ttd-space"></div><div class="ttd-name">${Utils.esc(g?.nama)}</div><div style="font-size:8.5pt;color:#64748b">NIP. ${Utils.esc(g?.nip || '...')}</div></div>
      </div>`;
    setTimeout(() => window.print(), 200);
  }
};
