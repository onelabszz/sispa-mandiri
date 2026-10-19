import { Store } from '../../storage.js';
import { Utils } from '../../../shared/js/utils.js';
import { Icons } from '../../../shared/js/icons.js';
import { emptyState, allSesi, guruBySekolah } from '../helpers.js';

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
        ${emptyState('clipboard-list', 'Belum ada sesi', 'Import file JSON dari KS untuk melihat data.')}
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
              <option value="Akademik">Akademik</option>
              <option value="Coaching">Coaching</option>
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
    if (Store.get('sekolah').length === 0) return;
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
      const skor = s.skor !== undefined && s.skor !== null ? s.skor : '-';
      const max = s._jenis === 'Akademik' ? '/76' : s._jenis === 'Coaching' ? '/32' : '';
      const badge = s._jenis === 'Akademik' ? 'info' : s._jenis === 'Coaching' ? 'warning' : 'neutral';
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
    const arr = jenis === 'Akademik' ? 'akademik' : jenis === 'Coaching' ? 'coaching' : 'supervisi';
    const s = (sk[arr] || []).find(x => x.id === id);
    if (!s) return;
    const g = (sk.guru || []).find(x => x.id === s.gid);
    let body = '';
    if (jenis === '3 Tahap') {
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
    } else if (jenis === 'Akademik') {
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
    } else {
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
    }
    Utils.modal(`${jenis} — Detail`, body, '<button class="btn btn-secondary" onclick="Utils.closeModal()">Tutup</button>', true);
  },

  _print(skId, id, jenis) {
    const sk = Store.get('sekolah').find(x => x.id === skId);
    if (!sk) return;
    const arr = jenis === 'Akademik' ? 'akademik' : jenis === 'Coaching' ? 'coaching' : 'supervisi';
    const s = (sk[arr] || []).find(x => x.id === id);
    if (!s) return;
    const g = (sk.guru || []).find(x => x.id === s.gid);
    const c = Store.config();

    if (jenis === 'Akademik') {
      let html = '';
      (window.__INSTRUMEN_AKADEMIK || []).forEach(i => {
        html += `<tr><td class="kode">${i.kode}</td><td>${i.t}</td><td class="skor">${(s.detail || {})[i.kode] || '-'}</td><td>${Utils.esc((s.catatan || {})[i.kode] || '')}</td></tr>`;
      });
      Utils.el('printArea').innerHTML = `
        <h1>LEMBAR OBSERVASI AKADEMIK</h1>
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
    } else if (jenis === 'Coaching') {
      let html = '';
      (window.__INSTRUMEN_COACHING || []).forEach(i => {
        html += `<tr><td class="kode">${i.tahap}</td><td>${i.t}</td><td class="skor">${(s.detail || {})[i.kode] || '-'}</td><td>${Utils.esc((s.catatan || {})[i.kode] || '')}</td></tr>`;
      });
      const rtlHtml = (s.rtl || []).map((r, i) =>
        `<tr><td>${i + 1}</td><td>${Utils.esc(r.aksi)}</td><td>${Utils.esc(r.waktu)}</td><td>${Utils.esc(r.dukungan)}</td><td>${Utils.esc(r.indikator)}</td></tr>`
      ).join('');
      Utils.el('printArea').innerHTML = `
        <h1>LEMBAR OBSERVASI COACHING</h1>
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
  }
};
