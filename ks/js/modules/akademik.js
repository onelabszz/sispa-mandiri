import { Store } from '../../storage.js';
import { Utils } from '../../../shared/js/utils.js';
import { Icons } from '../../../shared/js/icons.js';
import { Router } from '../../../shared/js/router.js';
import { emptyState, guruLabel, updateDupWarn } from '../helpers.js';
import { INSTRUMEN_AKADEMIK } from '../../../shared/js/constants.js';

let _detail = {};       // { A1: 3, A2: 4, ... }
let _catatan = {};      // { A1: 'text', ... }

export const Akademik = {
  async render() {
    const guru = Store.get('guru');
    if (guru.length === 0) {
      return `<div class="card"><div class="card-body">
        ${emptyState('users', 'Belum ada guru', 'Tambahkan guru dulu di menu Data Guru.')}
      </div></div>`;
    }
    _detail = {}; _catatan = {};

    let rows = '', sec = '';
    INSTRUMEN_AKADEMIK.forEach(i => {
      if (i.sec !== sec) {
        sec = i.sec;
        rows += `<div style="background:var(--brand-50);padding:.6rem 1rem;font-weight:700;font-size:.8rem;color:var(--brand-700)">${sec}</div>`;
      }
      rows += `<div class="ind-row" data-k="${i.kode}">
        <div class="ind-kode">${i.kode}</div>
        <div class="ind-teks">${i.t}<input class="input ind-catatan" placeholder="Catatan/bukti..." data-cat="${i.kode}"></div>
        <div>
          <div style="font-size:10px;font-weight:600;color:var(--slate-500);margin-bottom:3px">Skor (1–4)</div>
          <div class="skor-grid">${[1, 2, 3, 4].map(v => `<button class="skor-btn" data-v="${v}" data-kode="${i.kode}">${v}</button>`).join('')}</div>
        </div>
      </div>`;
    });

    return `
      <div class="page-head">
        <div>
          <h2>Observasi Akademik</h2>
          <div class="page-sub">19 indikator pembelajaran berbasis digital</div>
        </div>
      </div>

      <div class="card"><div class="card-body">
        <div class="row">
          <div class="form-group">
            <label class="label">Guru</label>
            <select class="select" id="aguru" onchange="window.__updateDupWarn && window.__updateDupWarn('aguru','aguruWarn','akademik')">
              ${guru.map(g => `<option value="${g.id}">${Utils.esc(guruLabel(g))}</option>`).join('')}
            </select>
            <div id="aguruWarn" style="display:none;margin-top:.5rem"></div>
          </div>
          <div class="form-group"><label class="label">Tanggal</label><input type="date" class="input" id="atgl" value="${Utils.today()}"></div>
        </div>
        <div class="row-3">
          <div class="form-group"><label class="label">Mapel</label><input class="input" id="amapel" placeholder="Matematika"></div>
          <div class="form-group"><label class="label">Materi</label><input class="input" id="amateri" placeholder="Bangun Ruang"></div>
          <div class="form-group"><label class="label">Durasi</label><input class="input" id="adurasi" placeholder="2 JP"></div>
        </div>
      </div></div>

      <div class="card" style="padding:0">${rows}</div>

      <div class="card"><div class="card-header">${Icons.svg('file-text', 18)} Catatan & RTL</div><div class="card-body">
        <div class="form-group"><label class="label">Catatan Tambahan</label><textarea class="textarea" id="acat" rows="2"></textarea></div>
        <div class="form-group"><label class="label">Kekuatan / Praktik Baik</label><textarea class="textarea" id="akek" rows="2"></textarea></div>
        <div class="form-group"><label class="label">Area Pengembangan</label><textarea class="textarea" id="aarea" rows="2"></textarea></div>
        <div class="form-group"><label class="label">RTL</label><textarea class="textarea" id="artl" rows="2"></textarea></div>
      </div></div>

      <div style="text-align:right;margin-bottom:2rem">
        <button class="btn btn-primary" id="btnSaveAkad" style="padding:.75rem 1.25rem">${Icons.svg('save', 18)} Simpan Observasi</button>
      </div>
    `;
  },

  async bind() {
    window.__updateDupWarn = updateDupWarn;
    updateDupWarn('aguru', 'aguruWarn', 'akademik');

    document.querySelectorAll('[data-cat]').forEach(inp => {
      inp.addEventListener('input', () => { _catatan[inp.dataset.cat] = inp.value; });
    });

    document.querySelectorAll('.skor-btn').forEach(btn => {
      btn.onclick = () => {
        const kode = btn.dataset.kode;
        const v = parseInt(btn.dataset.v);
        document.querySelectorAll(`.ind-row[data-k="${kode}"] .skor-btn`).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        _detail[kode] = v;
      };
    });

    Utils.el('btnSaveAkad').onclick = () => this._save();
  },

  _save() {
    const total = Object.values(_detail).reduce((s, v) => s + v, 0);
    const filled = Object.keys(_detail).length;
    const doSave = () => {
      const list = Store.get('akademik');
      list.push({
        id: Utils.uid(),
        gid: Utils.el('aguru').value,
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
        rtl: Utils.el('artl').value
      });
      Store.set('akademik', list);
      Utils.toast('Observasi tersimpan', 'success');
      Router.navigate('laporan');
    };

    if (filled < 19) {
      Utils.confirm('Belum lengkap', `Masih ada ${19 - filled} indikator belum dinilai. Tetap simpan?`, doSave);
    } else {
      doSave();
    }
  },

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
      <h1>LEMBAR OBSERVASI AKADEMIK</h1>
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
