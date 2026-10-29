import { Store } from '../../storage.js';
import { Utils } from '../../../shared/js/utils.js';
import { Icons } from '../../../shared/js/icons.js';
import { emptyState, allSesi, guruBySekolah } from '../helpers.js';
import {
  INSTRUMEN_TELAAH_RPP, KUALITATIF_TELAAH,
  INSTRUMEN_OBS_PM, REFLEKSI_PM
} from '../../../shared/js/constants.js';

export const Supervisi = {
  async render() {
    const sekolah = Store.get('sekolah');
    const sesi = allSesi();
    return `
      <div class="page-head">
        <div>
          <h2>Semua Sesi Supervisi</h2>
          <div class="page-sub">${sesi.length} sesi dari ${sekolah.length} sekolah</div>
        </div>
      </div>

      ${sesi.length === 0 ? `<div class="card"><div class="card-body">
        ${emptyState('clipboard-list', 'Belum ada sesi', 'Tambahkan data supervisi dengan mengimpor file JSON dari KS terlebih dahulu.', 
          `<button class="btn btn-primary" id="btnGoSekolah" style="margin-top:1rem">${Icons.svg('upload', 16)} Ke Menu Sekolah Binaan</button>`)}
      </div></div>` : `
        <div class="card"><div class="card-body" style="padding:.75rem">
          <div style="display:grid;grid-template-columns:2fr 1.2fr 1.2fr 2fr;gap:.5rem">
            <div><label class="label">Sekolah</label><select class="select" id="fSk">
              <option value="">Semua Sekolah</option>
              ${sekolah.map(sk => `<option value="${sk.id}">${Utils.esc(sk.nama_sekolah)}</option>`).join('')}
            </select></div>
            <div><label class="label">Jenis</label><select class="select" id="fJenis">
              <option value="">Semua</option>
              <option value="3 Tahap">3 Tahap</option>
              <option value="Supervisi PM">Supervisi PM</option>
              <option value="Supervisi Digitalisasi">Supervisi Digitalisasi</option>
              <option value="Coaching Digitalisasi">Coaching Digitalisasi</option>
            </select></div>
            <div><label class="label">Bulan</label><input type="month" class="input" id="fBulan"></div>
            <div><label class="label">Cari Guru</label><input class="input" id="fQ" placeholder="Nama guru..."></div>
          </div>
        </div></div>
        <div class="card"><div id="supList"></div></div>
      `}
    `;
  },

  async bind() {
    if (!Utils.el('fSk')) {
      Utils.el('btnGoSekolah')?.addEventListener('click', async () => {
        const { Router } = await import('../../../shared/js/router.js');
        Router.navigate('sekolah');
      });
      return;
    }

    const redraw = () => this._draw();
    Utils.el('fSk').onchange = redraw;
    Utils.el('fJenis').onchange = redraw;
    Utils.el('fBulan').onchange = redraw;
    Utils.el('fQ').oninput = Utils.debounce(redraw, 150);
    this._draw();
  },

  _draw() {
    const box = Utils.el('supList');
    if (!box) return;
    const skF = Utils.el('fSk').value;
    const jF = Utils.el('fJenis').value;
    const bF = Utils.el('fBulan').value;
    const q = Utils.el('fQ').value.toLowerCase().trim();
    let list = allSesi();
    if (skF) list = list.filter(s => s._skId === skF);
    if (jF) list = list.filter(s => s._jenis === jF);
    if (bF) list = list.filter(s => (s.tgl || '').startsWith(bF));
    if (q) list = list.filter(s => {
      const g = guruBySekolah(s._skId, s.gid);
      return (g?.nama || '').toLowerCase().includes(q);
    });
    if (list.length === 0) {
      box.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--slate-400);font-size:.85rem">Tidak ada sesi cocok</div>';
      return;
    }
    box.innerHTML = `<table><thead><tr>
      <th>Sekolah</th><th>Guru</th><th>Jenis</th><th>Tanggal</th>
      <th style="text-align:center">Skor</th>
      <th style="text-align:right">Aksi</th>
    </tr></thead><tbody>${list.map(s => {
      const g = guruBySekolah(s._skId, s.gid);
      let skor, max;
      if (s._jenis === 'Supervisi PM') {
        skor = (s.telaah && s.telaah.nilai) || 0;
        max = '/100';
      } else {
        skor = s.skor !== undefined && s.skor !== null ? s.skor : '-';
        max = s._jenis === 'Supervisi Digitalisasi' ? '/76' : s._jenis === 'Coaching Digitalisasi' ? '/32' : '';
      }
      const badge = s._jenis === 'Supervisi Digitalisasi' ? 'info'
        : s._jenis === 'Coaching Digitalisasi' ? 'warning'
        : s._jenis === 'Supervisi PM' ? 'success'
        : 'neutral';
      return `<tr>
        <td style="font-size:.8rem;color:var(--slate-600)">${Utils.esc(s._skNama)}</td>
        <td style="font-weight:600">${Utils.esc(g?.nama || '?')}</td>
        <td><span class="badge badge-${badge}">${s._jenis}</span></td>
        <td>${Utils.date(s.tgl)}</td>
        <td style="text-align:center;font-weight:700">${skor}${max ? ` <span style="font-weight:400;color:var(--slate-400);font-size:.7rem">${max}</span>` : ''}</td>
        <td style="text-align:right;white-space:nowrap">
          <button class="btn btn-secondary btn-sm" data-view="${s._skId}:${s.id}:${s._jenis}">${Icons.svg('eye', 14)}</button>
          <button class="btn btn-primary btn-sm" data-print="${s._skId}:${s.id}:${s._jenis}">${Icons.svg('printer', 14)}</button>
        </td>
      </tr>`;
    }).join('')}</tbody></table>`;
    box.querySelectorAll('[data-view]').forEach(b => {
      b.onclick = () => {
        const [skId, id, jenis] = b.dataset.view.split(':');
        this._detail(skId, id, jenis);
      };
    });
    box.querySelectorAll('[data-print]').forEach(b => {
      b.onclick = () => {
        const [skId, id, jenis] = b.dataset.print.split(':');
        this._print(skId, id, jenis);
      };
    });
  },

  _detail(skId, id, jenis) {
    const sk = Store.get('sekolah').find(x => x.id === skId);
    if (!sk) return;
    const arr = jenis === 'Supervisi Digitalisasi' ? 'akademik'
      : jenis === 'Coaching Digitalisasi' ? 'coaching'
      : jenis === 'Supervisi PM' ? 'supervisiPM'
      : 'supervisi';
    const s = (sk[arr] || []).find(x => x.id === id);
    if (!s) return;
    const g = (sk.guru || []).find(x => x.id === s.gid);
    let body = '';
    if (jenis === 'Supervisi PM') {
      body = this._detailPM(s, g, sk);
    } else if (jenis === 'Supervisi Digitalisasi') {
      const rows = (window.__INSTRUMEN_AKADEMIK || []).map(i =>
        `<tr><td style="padding:.35rem .5rem;font-family:monospace;font-weight:600;color:var(--brand-700)">${i.kode}</td>
         <td style="padding:.35rem .5rem;font-size:.8rem">${i.t}</td>
         <td style="padding:.35rem .5rem;text-align:center;font-weight:700">${(s.detail || {})[i.kode] || '-'}</td>
         <td style="padding:.35rem .5rem;font-size:.75rem;color:var(--slate-600)">${Utils.esc((s.catatan || {})[i.kode] || '')}</td></tr>`).join('');
      body = `
        <div style="font-size:.85rem;line-height:1.6;margin-bottom:.75rem">
          <div><strong>Guru:</strong> ${Utils.esc(g?.nama || '?')} · <strong>Tanggal:</strong> ${Utils.date(s.tgl)}</div>
          <div><strong>Mapel/Materi:</strong> ${Utils.esc(s.mapel || '-')} / ${Utils.esc(s.materi || '-')}</div>
          <div><strong>Skor:</strong> <strong style="color:var(--brand-700)">${s.skor} / 76</strong></div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:.8rem">
          <thead><tr style="background:var(--slate-50)">
            <th style="padding:.35rem .5rem;text-align:left;width:40px">Kode</th>
            <th style="padding:.35rem .5rem;text-align:left">Indikator</th>
            <th style="padding:.35rem .5rem;text-align:center;width:50px">Skor</th>
            <th style="padding:.35rem .5rem;text-align:left">Catatan</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>`;
    } else if (jenis === 'Coaching Digitalisasi') {
      const rows = (window.__INSTRUMEN_COACHING || []).map(i =>
        `<tr><td style="padding:.35rem .5rem;font-family:monospace;font-weight:600;color:var(--brand-700)">${i.tahap}</td>
         <td style="padding:.35rem .5rem;font-size:.8rem">${i.t}</td>
         <td style="padding:.35rem .5rem;text-align:center;font-weight:700">${(s.detail || {})[i.kode] || '-'}</td>
         <td style="padding:.35rem .5rem;font-size:.75rem;color:var(--slate-600)">${Utils.esc((s.catatan || {})[i.kode] || '')}</td></tr>`).join('');
      body = `
        <div style="font-size:.85rem;line-height:1.6;margin-bottom:.75rem">
          <div><strong>Guru:</strong> ${Utils.esc(g?.nama || '?')} · <strong>Tanggal:</strong> ${Utils.date(s.tgl)}</div>
          <div><strong>Skor:</strong> <strong style="color:var(--brand-700)">${s.skor} / 32</strong></div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:.8rem">
          <thead><tr style="background:var(--slate-50)">
            <th style="padding:.35rem .5rem;text-align:left;width:50px">Tahap</th>
            <th style="padding:.35rem .5rem;text-align:left">Indikator</th>
            <th style="padding:.35rem .5rem;text-align:center;width:50px">Skor</th>
            <th style="padding:.35rem .5rem;text-align:left">Catatan</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>`;
    } else {
      const momen = (s.momen || []).map(k => (window.__MOMEN_LIST || []).find(m => m.key === k)?.label || k).join(', ') || '—';
      body = `<div style="font-size:.85rem;line-height:1.6">
        <div><strong>Sekolah:</strong> ${Utils.esc(sk.nama_sekolah)}</div>
        <div><strong>Guru:</strong> ${Utils.esc(g?.nama || '?')}</div>
        <div><strong>Tanggal:</strong> ${Utils.date(s.tgl)}</div>
        <div><strong>Status:</strong> ${s.status === 'selesai' ? '<span class="badge badge-success">Selesai</span>' : '<span class="badge badge-warning">Draft</span>'}</div>
        <hr style="margin:.75rem 0;border:none;border-top:1px solid var(--slate-200)">
        <div><strong>Tujuan:</strong> ${Utils.esc(s.tujuan || '—')}</div>
        <div><strong>Strategi:</strong> ${Utils.esc(s.strategi || '—')}</div>
        <div><strong>Asesmen:</strong> ${Utils.esc(s.asesmen || '—')}</div>
        <hr style="margin:.75rem 0;border:none;border-top:1px solid var(--slate-200)">
        <div><strong>Aktivitas Guru:</strong> ${Utils.esc(s.obs_guru || '—')}</div>
        <div><strong>Aktivitas Murid:</strong> ${Utils.esc(s.obs_murid || '—')}</div>
        <div><strong>Momen PM:</strong> ${momen}</div>
        <div><strong>KKA:</strong> ${Utils.esc(s.kka || '—')}</div>
        <div><strong>Durasi:</strong> ${s.durasi || '—'} menit</div>
        <hr style="margin:.75rem 0;border:none;border-top:1px solid var(--slate-200)">
        <div><strong>RTL:</strong> ${Utils.esc(s.rtl?.aksi || '—')}</div>
        <div><strong>Waktu:</strong> ${Utils.esc(s.rtl?.waktu || '—')}</div>
        <div><strong>Indikator:</strong> ${Utils.esc(s.rtl?.indikator || '—')}</div>
      </div>`;
    }
    Utils.modal(`${jenis} — Detail`, body, '<button class="btn btn-secondary" onclick="Utils.closeModal()">Tutup</button>', true);
  },

  _detailPM(s, g, sk) {
    const t = s.telaah || {};
    const o = s.obs || {};
    const r = s.refleksi || {};
    const tMeta = t.meta || {};
    const oMeta = o.meta || {};
    const tSkor = t.skor || {};
    const tKom = t.komentar || {};
    const tKual = t.kualitatif || {};
    const oBukti = o.bukti || {};
    const oCat = o.catatan || {};

    const telaahRows = INSTRUMEN_TELAAH_RPP.map(i =>
      `<tr>
        <td style="padding:.35rem .5rem;font-family:monospace;font-weight:600;color:var(--brand-700);text-align:center">${i.kode}</td>
        <td style="padding:.35rem .5rem;font-size:.8rem">${Utils.esc(i.t)}</td>
        <td style="padding:.35rem .5rem;text-align:center;font-weight:700">${tSkor[i.kode] ?? '-'}</td>
        <td style="padding:.35rem .5rem;font-size:.75rem;color:var(--slate-600)">${Utils.esc(tKom[i.kode] || '')}</td>
      </tr>`).join('');

    const kualHtml = KUALITATIF_TELAAH.map(q =>
      `<div style="margin-bottom:.5rem">
        <div style="font-weight:600;font-size:.8rem;color:var(--slate-700)">${q.kode}. ${Utils.esc(q.t)}</div>
        <div style="font-size:.8rem;color:var(--slate-600);padding:.35rem .5rem;background:var(--slate-50);border-radius:6px;margin-top:.2rem;white-space:pre-wrap">${Utils.esc(tKual[q.kode] || '—')}</div>
      </div>`).join('');

    const obsRows = INSTRUMEN_OBS_PM.map(i =>
      `<tr>
        <td style="padding:.35rem .5rem;font-family:monospace;font-weight:600;color:var(--brand-700);text-align:center">${i.kode}</td>
        <td style="padding:.35rem .5rem;font-size:.8rem">${Utils.esc(i.t)}</td>
        <td style="padding:.35rem .5rem;font-size:.75rem;color:var(--slate-700)">${Utils.esc(oBukti[i.kode] || '—')}</td>
        <td style="padding:.35rem .5rem;font-size:.75rem;color:var(--slate-600)">${Utils.esc(oCat[i.kode] || '')}</td>
      </tr>`).join('');

    const refleksiHtml = REFLEKSI_PM.map(q =>
      `<div style="margin-bottom:.5rem">
        <div style="font-weight:600;font-size:.8rem;color:var(--slate-700)">${q.kode}. ${Utils.esc(q.t)}</div>
        <div style="font-size:.8rem;color:var(--slate-600);padding:.35rem .5rem;background:var(--slate-50);border-radius:6px;margin-top:.2rem;white-space:pre-wrap">${Utils.esc(r[q.kode] || '—')}</div>
      </div>`).join('');

    const nilai = t.nilai || 0;
    const total = t.total || 0;
    const obsFilled = Object.values(oBukti).filter(v => v && String(v).trim()).length;

    return `
      <div style="font-size:.85rem;line-height:1.6;margin-bottom:.75rem">
        <div><strong>Guru:</strong> ${Utils.esc(oMeta.nama_guru || g?.nama || '?')}</div>
        <div><strong>Sekolah:</strong> ${Utils.esc(sk.nama_sekolah)}</div>
        <div><strong>Tanggal:</strong> ${Utils.date(s.tgl)} · <strong>Status:</strong> ${s.status === 'selesai' ? '<span class="badge badge-success">Selesai</span>' : '<span class="badge badge-warning">Draft</span>'}</div>
        <div style="margin-top:.5rem;display:flex;gap:.5rem;flex-wrap:wrap">
          <span class="badge badge-success">Nilai Telaah: ${nilai}/100</span>
          <span class="badge badge-info">Obs terisi: ${obsFilled}/15</span>
          <span class="badge badge-${t.kualitatif && Object.keys(t.kualitatif).length === 3 ? 'success' : 'warning'}">Kualitatif: ${Object.keys(tKual).filter(k => String(tKual[k] || '').trim()).length}/3</span>
        </div>
      </div>

      <div style="border-top:1px solid var(--slate-200);padding-top:.75rem;margin-top:.75rem">
        <div style="font-weight:700;font-size:.9rem;color:var(--brand-700);margin-bottom:.5rem">1. Telaah RPP (Skor ${total}/60)</div>
        <div style="font-size:.75rem;color:var(--slate-600);margin-bottom:.5rem">
          ${Utils.esc(tMeta.jenjang || '—')} · ${Utils.esc(tMeta.mapel || oMeta.mapel || '—')} · Kls ${Utils.esc(tMeta.kelas || '—')} · ${Utils.esc(tMeta.judul_rpp || '—')}
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:.8rem;margin-bottom:.75rem">
          <thead><tr style="background:var(--slate-50)">
            <th style="padding:.35rem .5rem;text-align:center;width:40px">No</th>
            <th style="padding:.35rem .5rem;text-align:left">Aspek</th>
            <th style="padding:.35rem .5rem;text-align:center;width:50px">Skor</th>
            <th style="padding:.35rem .5rem;text-align:left">Komentar</th>
          </tr></thead>
          <tbody>${telaahRows}</tbody>
        </table>
        <div style="font-weight:600;font-size:.8rem;color:var(--slate-700);margin-bottom:.35rem">Kualitatif:</div>
        ${kualHtml}
      </div>

      <div style="border-top:1px solid var(--slate-200);padding-top:.75rem;margin-top:.75rem">
        <div style="font-weight:700;font-size:.9rem;color:var(--brand-700);margin-bottom:.5rem">2. Observasi Implementasi</div>
        <div style="font-size:.75rem;color:var(--slate-600);margin-bottom:.5rem">
          ${Utils.esc(oMeta.satuan_pendidikan || sk.nama_sekolah)} · Kls/Sem ${Utils.esc(oMeta.kelas_semester || '—')} · ${Utils.esc(oMeta.mapel || '—')} · Pemberi: ${Utils.esc(oMeta.pemberi_umpan_balik || sk.ks_nama || '—')}
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:.8rem">
          <thead><tr style="background:var(--slate-50)">
            <th style="padding:.35rem .5rem;text-align:center;width:40px">No</th>
            <th style="padding:.35rem .5rem;text-align:left">Aspek</th>
            <th style="padding:.35rem .5rem;text-align:left">Bukti</th>
            <th style="padding:.35rem .5rem;text-align:left">Catatan</th>
          </tr></thead>
          <tbody>${obsRows}</tbody>
        </table>
      </div>

      <div style="border-top:1px solid var(--slate-200);padding-top:.75rem;margin-top:.75rem">
        <div style="font-weight:700;font-size:.9rem;color:var(--brand-700);margin-bottom:.5rem">3. Refleksi & RTL</div>
        ${refleksiHtml}
      </div>
    `;
  },

  _print(skId, id, jenis) {
    const sk = Store.get('sekolah').find(x => x.id === skId);
    if (!sk) return;
    const arr = jenis === 'Supervisi Digitalisasi' ? 'akademik'
      : jenis === 'Coaching Digitalisasi' ? 'coaching'
      : jenis === 'Supervisi PM' ? 'supervisiPM'
      : 'supervisi';
    const s = (sk[arr] || []).find(x => x.id === id);
    if (!s) return;
    const g = (sk.guru || []).find(x => x.id === s.gid);
    const c = Store.config();

    if (jenis === 'Supervisi PM') {
      this._printPM(s, g, sk, c);
      return;
    }

    if (jenis === 'Supervisi Digitalisasi') {
      let html = '';
      (window.__INSTRUMEN_AKADEMIK || []).forEach(i => {
        html += `<tr><td class="kode">${i.kode}</td><td>${i.t}</td><td class="skor">${(s.detail || {})[i.kode] || '-'}</td><td>${Utils.esc((s.catatan || {})[i.kode] || '')}</td></tr>`;
      });
      Utils.el('printArea').innerHTML = `
        <h1>LEMBAR SUPERVISI DIGITALISASI</h1>
        <p class="sub">${Utils.esc(sk.nama_sekolah)}</p>
        <table class="info">
          <tr><td>Guru</td><td>:</td><td><strong>${Utils.esc(g?.nama)}</strong></td></tr>
          <tr><td>Mapel / Materi</td><td>:</td><td>${Utils.esc(s.mapel || '-')} / ${Utils.esc(s.materi || '-')}</td></tr>
          <tr><td>Tanggal</td><td>:</td><td>${Utils.date(s.tgl)}</td></tr>
          <tr><td>Skor Total</td><td>:</td><td><strong>${s.skor} / 76</strong></td></tr>
        </table>
        <table class="ind"><thead><tr><th>Kode</th><th>Indikator</th><th>Skor</th><th>Catatan</th></tr></thead><tbody>${html}</tbody></table>
        <p><strong>Kekuatan:</strong> ${Utils.esc(s.kekuatan || '-')}</p>
        <p><strong>Area:</strong> ${Utils.esc(s.area_pengembangan || '-')}</p>
        <p><strong>RTL:</strong> ${Utils.esc(s.rtl || '-')}</p>
        <div class="ttd-grid">
          <div class="ttd-box"><div>Kepala Sekolah</div><div class="ttd-space"></div><div class="ttd-name">${Utils.esc(sk.ks_nama || '...')}</div></div>
          <div class="ttd-box"><div>Guru</div><div class="ttd-space"></div><div class="ttd-name">${Utils.esc(g?.nama)}</div></div>
        </div>`;
    } else if (jenis === 'Coaching Digitalisasi') {
      let html = '';
      (window.__INSTRUMEN_COACHING || []).forEach(i => {
        html += `<tr><td class="kode">${i.tahap}</td><td>${i.t}</td><td class="skor">${(s.detail || {})[i.kode] || '-'}</td><td>${Utils.esc((s.catatan || {})[i.kode] || '')}</td></tr>`;
      });
      const rtlHtml = (s.rtl || []).map((r, i) =>
        `<tr><td>${i + 1}</td><td>${Utils.esc(r.aksi)}</td><td>${Utils.esc(r.waktu)}</td><td>${Utils.esc(r.dukungan)}</td><td>${Utils.esc(r.indikator)}</td></tr>`
      ).join('');
      Utils.el('printArea').innerHTML = `
        <h1>LEMBAR COACHING DIGITALISASI</h1>
        <p class="sub">${Utils.esc(sk.nama_sekolah)}</p>
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
          <div class="ttd-box"><div>Kepala Sekolah</div><div class="ttd-space"></div><div class="ttd-name">${Utils.esc(sk.ks_nama || '...')}</div></div>
          <div class="ttd-box"><div>Guru</div><div class="ttd-space"></div><div class="ttd-name">${Utils.esc(g?.nama)}</div></div>
        </div>`;
    } else {
      const prinsipAktif = (window.__PRINSIP_LIST || []).filter(p => s.prinsip_pm && s.prinsip_pm[p.key]).map(p => p.label).join(', ') || '—';
      const pengalamanAktif = (window.__PENGALAMAN_LIST || []).filter(p => s.pengalaman && s.pengalaman[p.key]).map(p => p.label).join(', ') || '—';
      const dplAktif = (s.dpl || []).map(n => (window.__DPL_LABELS || [])[n - 1]).join(', ') || '—';
      const momenLabels = (s.momen || []).map(k => (window.__MOMEN_LIST || []).find(m => m.key === k)?.label || k).join(', ') || '—';
      const refleksiHtml = (window.__REFLEKSI_7 || []).map((r, i) =>
        `<div style="margin-bottom:6px"><strong>${i + 1}. ${r.q}</strong><br>${Utils.esc((s.refleksi || {})[r.key] || '-')}</div>`
      ).join('');
      Utils.el('printArea').innerHTML = `
        <h1>LAPORAN SUPERVISI 3 TAHAP</h1>
        <p class="sub">${Utils.esc(sk.nama_sekolah)}</p>
        <table class="info">
          <tr><td>Guru</td><td>:</td><td><strong>${Utils.esc(g?.nama)}</strong></td></tr>
          <tr><td>Tanggal</td><td>:</td><td>${Utils.date(s.tgl)}</td></tr>
        </table>
        <h2>1. Pra-Observasi</h2>
        <p><strong>Tujuan:</strong> ${Utils.esc(s.tujuan || '-')}</p>
        <p><strong>Strategi:</strong> ${Utils.esc(s.strategi || '-')}</p>
        <p><strong>Prinsip PM:</strong> ${prinsipAktif}</p>
        <p><strong>Pengalaman:</strong> ${pengalamanAktif}</p>
        <p><strong>DPL:</strong> ${dplAktif}</p>
        <h2>2. Observasi</h2>
        <p><strong>Aktivitas Guru:</strong> ${Utils.esc(s.obs_guru || '-')}</p>
        <p><strong>Aktivitas Murid:</strong> ${Utils.esc(s.obs_murid || '-')}</p>
        <p><strong>Momen PM:</strong> ${momenLabels}</p>
        <p><strong>KKA:</strong> ${Utils.esc(s.kka || '-')}</p>
        <h2>3. Pasca-Observasi</h2>
        ${refleksiHtml}
        <h2>RTL</h2>
        <p><strong>Aksi:</strong> ${Utils.esc(s.rtl?.aksi || '-')}</p>
        <p><strong>Waktu:</strong> ${Utils.esc(s.rtl?.waktu || '-')}</p>
        <p><strong>Indikator:</strong> ${Utils.esc(s.rtl?.indikator || '-')}</p>
        <div class="ttd-grid">
          <div class="ttd-box"><div>Kepala Sekolah</div><div class="ttd-space"></div><div class="ttd-name">${Utils.esc(sk.ks_nama || '...')}</div></div>
          <div class="ttd-box"><div>Guru</div><div class="ttd-space"></div><div class="ttd-name">${Utils.esc(g?.nama)}</div></div>
        </div>`;
    }
    setTimeout(() => window.print(), 200);
  },

  _printPM(s, g, sk, c) {
    const t = s.telaah || {};
    const o = s.obs || {};
    const r = s.refleksi || {};
    const tMeta = t.meta || {};
    const oMeta = o.meta || {};
    const tSkor = t.skor || {};
    const tKom = t.komentar || {};
    const tKual = t.kualitatif || {};
    const oBukti = o.bukti || {};
    const oCat = o.catatan || {};

    const telaahRows = INSTRUMEN_TELAAH_RPP.map(i =>
      `<tr>
        <td class="kode" style="text-align:center">${i.kode}</td>
        <td>${Utils.esc(i.t)}</td>
        <td class="skor" style="text-align:center">${tSkor[i.kode] ?? '-'}</td>
        <td>${Utils.esc(tKom[i.kode] || '')}</td>
      </tr>`).join('');

    const kualHtml = KUALITATIF_TELAAH.map(q =>
      `<p><strong>${q.kode}. ${Utils.esc(q.t)}</strong><br>${Utils.esc(tKual[q.kode] || '-')}</p>`
    ).join('');

    const obsRows = INSTRUMEN_OBS_PM.map(i =>
      `<tr>
        <td class="kode" style="text-align:center">${i.kode}</td>
        <td>${Utils.esc(i.t)}</td>
        <td>${Utils.esc(oBukti[i.kode] || '')}</td>
        <td>${Utils.esc(oCat[i.kode] || '')}</td>
      </tr>`).join('');

    const refleksiHtml = REFLEKSI_PM.map(q =>
      `<p><strong>${q.kode}. ${Utils.esc(q.t)}</strong><br>${Utils.esc(r[q.kode] || '-')}</p>`
    ).join('');

    const totalTelaah = t.total || Object.values(tSkor).reduce((a, b) => a + b, 0);
    const nilai = t.nilai || Math.round(totalTelaah / 60 * 100);

    Utils.el('printArea').innerHTML = `
      <h1>LAPORAN SUPERVISI PM</h1>
      <p class="sub">${Utils.esc(sk.nama_sekolah)} — NPSN ${Utils.esc(sk.npsn || '-')}</p>

      <table class="info">
        <tr><td>Nama Guru</td><td>:</td><td><strong>${Utils.esc(oMeta.nama_guru || g?.nama || '-')}</strong></td></tr>
        <tr><td>NIP</td><td>:</td><td>${Utils.esc(g?.nip || '-')}</td></tr>
        <tr><td>Tanggal</td><td>:</td><td>${Utils.date(s.tgl)}</td></tr>
        <tr><td>Pemberi Umpan Balik</td><td>:</td><td>${Utils.esc(oMeta.pemberi_umpan_balik || sk.ks_nama || c.nama_pengawas || '-')}</td></tr>
      </table>

      <h2>1. Telaah RPP</h2>
      <table class="info">
        <tr><td>Jenjang</td><td>:</td><td>${Utils.esc(tMeta.jenjang || '-')}</td></tr>
        <tr><td>Mata Pelajaran</td><td>:</td><td>${Utils.esc(tMeta.mapel || oMeta.mapel || '-')}</td></tr>
        <tr><td>Kelas</td><td>:</td><td>${Utils.esc(tMeta.kelas || oMeta.kelas_semester || '-')}</td></tr>
        <tr><td>Judul Perencanaan</td><td>:</td><td>${Utils.esc(tMeta.judul_rpp || '-')}</td></tr>
        <tr><td>Skor Total</td><td>:</td><td><strong>${totalTelaah} / 60 (Nilai: ${nilai})</strong></td></tr>
      </table>
      <table class="ind">
        <thead><tr><th style="width:30px;text-align:center">No</th><th>Aspek</th><th style="width:40px;text-align:center">Skor</th><th>Komentar Kritis</th></tr></thead>
        <tbody>${telaahRows}</tbody>
      </table>
      ${kualHtml}

      <h2 style="page-break-before:always">2. Observasi Implementasi</h2>
      <table class="info">
        <tr><td>Hari/Tanggal</td><td>:</td><td>${Utils.date(oMeta.hari_tanggal || s.tgl)}</td></tr>
        <tr><td>Satuan Pendidikan</td><td>:</td><td>${Utils.esc(oMeta.satuan_pendidikan || sk.nama_sekolah)}</td></tr>
        <tr><td>Kelas/Semester</td><td>:</td><td>${Utils.esc(oMeta.kelas_semester || '-')}</td></tr>
        <tr><td>Mata Pelajaran</td><td>:</td><td>${Utils.esc(oMeta.mapel || '-')}</td></tr>
      </table>
      <table class="ind">
        <thead><tr><th style="width:30px;text-align:center">No</th><th>Aspek</th><th>Bukti Pembelajaran</th><th>Catatan</th></tr></thead>
        <tbody>${obsRows}</tbody>
      </table>

      <h2 style="page-break-before:always">3. Refleksi & RTL</h2>
      ${refleksiHtml}

      <div class="ttd-grid">
        <div class="ttd-box"><div>Kepala Sekolah</div><div class="ttd-space"></div><div class="ttd-name">${Utils.esc(sk.ks_nama || '...')}</div><div style="font-size:8.5pt;color:#64748b">NIP. ${Utils.esc(sk.ks_nip || '...')}</div></div>
        <div class="ttd-box"><div>Guru</div><div class="ttd-space"></div><div class="ttd-name">${Utils.esc(g?.nama || '...')}</div><div style="font-size:8.5pt;color:#64748b">NIP. ${Utils.esc(g?.nip || '...')}</div></div>
      </div>`;
    setTimeout(() => window.print(), 200);
  }
};
