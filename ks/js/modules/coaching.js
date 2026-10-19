import { Store } from '../../storage.js';
import { Utils } from '../../../shared/js/utils.js';
import { Icons } from '../../../shared/js/icons.js';
import { Router } from '../../../shared/js/router.js';
import { emptyState, guruLabel, updateDupWarn } from '../helpers.js';
import { INSTRUMEN_COACHING } from '../../../shared/js/constants.js';

let _detail = {};
let _catatan = {};
let _rtl = [{ aksi: '', waktu: '', dukungan: '', indikator: '' }];

export const Coaching = {
  async render() {
    const guru = Store.get('guru');
    if (guru.length === 0) {
      return `<div class="card"><div class="card-body">
        ${emptyState('users', 'Belum ada guru', 'Tambahkan guru dulu di menu Data Guru.')}
      </div></div>`;
    }
    _detail = {}; _catatan = {};
    _rtl = [{ aksi: '', waktu: '', dukungan: '', indikator: '' }];

    let rows = '';
    INSTRUMEN_COACHING.forEach(i => {
      rows += `<div class="ind-row" data-k="${i.kode}">
        <div class="ind-kode">${i.tahap}</div>
        <div class="ind-teks">${i.t}<input class="input ind-catatan" placeholder="Kutipan/bukti percakapan..." data-cat="${i.kode}"></div>
        <div>
          <div style="font-size:10px;font-weight:600;color:var(--slate-500);margin-bottom:3px">Skor (1–4)</div>
          <div class="skor-grid">${[1, 2, 3, 4].map(v => `<button class="skor-btn" data-v="${v}" data-kode="${i.kode}">${v}</button>`).join('')}</div>
        </div>
      </div>`;
    });

    return `
      <div class="page-head">
        <div>
          <h2>Observasi Coaching</h2>
          <div class="page-sub">Teknik STAR-GROW pasca-observasi</div>
        </div>
      </div>

      <div class="card"><div class="card-body">
        <div class="row">
          <div class="form-group">
            <label class="label">Guru</label>
            <select class="select" id="cguru" onchange="window.__updateDupWarn && window.__updateDupWarn('cguru','cguruWarn','coaching')">
              ${guru.map(g => `<option value="${g.id}">${Utils.esc(guruLabel(g))}</option>`).join('')}
            </select>
            <div id="cguruWarn" style="display:none;margin-top:.5rem"></div>
          </div>
          <div class="form-group"><label class="label">Tanggal</label><input type="date" class="input" id="ctgl" value="${Utils.today()}"></div>
        </div>
      </div></div>

      <div class="card" style="padding:0">${rows}</div>

      <div class="card"><div class="card-header">${Icons.svg('file-text', 18)} Catatan Kualitatif</div><div class="card-body">
        <div class="form-group"><label class="label">Kekuatan yang Ditunjukkan</label><textarea class="textarea" id="ckek" rows="2"></textarea></div>
        <div class="form-group"><label class="label">Area yang Perlu Dikembangkan</label><textarea class="textarea" id="carea" rows="2"></textarea></div>
      </div></div>

      <div class="card"><div class="card-header">${Icons.svg('target', 18)} RTL / Kontrak Belajar</div><div class="card-body">
        <div id="rtlRows"></div>
        <button type="button" class="btn btn-secondary btn-sm" id="btnAddRtl">${Icons.svg('plus', 14)} Tambah Baris RTL</button>
      </div></div>

      <div style="text-align:right;margin-bottom:2rem">
        <button class="btn btn-primary" id="btnSaveCoach" style="padding:.75rem 1.25rem">${Icons.svg('save', 18)} Simpan Coaching</button>
      </div>
    `;
  },

  async bind() {
    window.__updateDupWarn = updateDupWarn;
    updateDupWarn('cguru', 'cguruWarn', 'coaching');

    document.querySelectorAll('[data-cat]').forEach(inp => {
      inp.addEventListener('input', () => { _catatan[inp.dataset.cat] = inp.value; });
    });
    document.querySelectorAll('.skor-btn').forEach(btn => {
      btn.onclick = () => {
        const kode = btn.dataset.kode;
        document.querySelectorAll(`.ind-row[data-k="${kode}"] .skor-btn`).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        _detail[kode] = parseInt(btn.dataset.v);
      };
    });

    Utils.el('btnAddRtl').onclick = () => {
      _rtl.push({ aksi: '', waktu: '', dukungan: '', indikator: '' });
      this._renderRtl();
    };
    this._renderRtl();
    Utils.el('btnSaveCoach').onclick = () => this._save();
  },

  _renderRtl() {
    const box = Utils.el('rtlRows');
    if (!box) return;
    box.innerHTML = _rtl.map((r, i) => `
      <div style="padding:.5rem;border:1px solid var(--slate-200);border-radius:6px;margin-bottom:.5rem">
        <div style="display:flex;justify-content:space-between;margin-bottom:.35rem">
          <strong style="font-size:.75rem">RTL ${i + 1}</strong>
          <button type="button" class="btn btn-ghost btn-sm" data-del-rtl="${i}" style="color:var(--danger);padding:.15rem .35rem">${Icons.svg('x', 14)}</button>
        </div>
        <input class="input" placeholder="Rencana Aksi" value="${Utils.esc(r.aksi)}" data-rtl="${i}" data-field="aksi" style="margin-bottom:.35rem;font-size:.8rem">
        <div class="row" style="gap:.35rem">
          <input class="input" placeholder="Waktu" value="${Utils.esc(r.waktu)}" data-rtl="${i}" data-field="waktu" style="font-size:.8rem">
          <input class="input" placeholder="Dukungan" value="${Utils.esc(r.dukungan)}" data-rtl="${i}" data-field="dukungan" style="font-size:.8rem">
        </div>
        <input class="input" placeholder="Indikator Keberhasilan" value="${Utils.esc(r.indikator)}" data-rtl="${i}" data-field="indikator" style="margin-top:.35rem;font-size:.8rem">
      </div>
    `).join('');
    box.querySelectorAll('[data-rtl]').forEach(inp => {
      inp.oninput = () => {
        const i = parseInt(inp.dataset.rtl);
        const f = inp.dataset.field;
        if (_rtl[i]) _rtl[i][f] = inp.value;
      };
    });
    box.querySelectorAll('[data-del-rtl]').forEach(btn => {
      btn.onclick = () => {
        const i = parseInt(btn.dataset.delRtl);
        _rtl.splice(i, 1);
        if (_rtl.length === 0) _rtl.push({ aksi: '', waktu: '', dukungan: '', indikator: '' });
        this._renderRtl();
      };
    });
  },

  _save() {
    const total = Object.values(_detail).reduce((s, v) => s + v, 0);
    const list = Store.get('coaching');
    list.push({
      id: Utils.uid(),
      gid: Utils.el('cguru').value,
      tgl: Utils.el('ctgl').value,
      skor: total,
      detail: { ..._detail },
      catatan: { ..._catatan },
      kekuatan: Utils.el('ckek').value,
      area: Utils.el('carea').value,
      rtl: _rtl.filter(r => r.aksi.trim())
    });
    Store.set('coaching', list);
    Utils.toast('Coaching tersimpan', 'success');
    Router.navigate('laporan');
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
