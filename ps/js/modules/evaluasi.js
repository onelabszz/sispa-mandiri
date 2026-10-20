import { Store } from '../../storage.js';
import { Utils } from '../../../shared/js/utils.js';
import { Icons } from '../../../shared/js/icons.js';
import { Router } from '../../../shared/js/router.js';
import { emptyState } from '../helpers.js';

const INSTRUMEN_EVALUASI = {
  rencana: {
    label: 'A. Perencanaan Pembelajaran',
    max: 27,
    indikator: [
      { kode: 'R1', teks: 'Merumuskan tujuan pembelajaran yang spesifik dan terukur' },
      { kode: 'R2', teks: 'Menyusun materi pembelajaran sesuai dengan tujuan' },
      { kode: 'R3', teks: 'Memilih metode/strategi pembelajaran yang tepat' },
      { kode: 'R4', teks: 'Merencanakan media dan sumber belajar yang relevan' },
      { kode: 'R5', teks: 'Menyusun langkah-langkah pembelajaran yang sistematis' },
      { kode: 'R6', teks: 'Merencanakan asesmen awal, formatif, dan sumatif' },
      { kode: 'R7', teks: 'Mengakomodasi kebutuhan murid yang beragam' },
      { kode: 'R8', teks: 'Mengintegrasikan prinsip pembelajaran mendalam (berkesadaran, bermakna, menggembirakan)' },
      { kode: 'R9', teks: 'Mengintegrasikan Koding/Kecerdasan Artifisial (KKA) dalam rencana' }
    ]
  },
  pelaksanaan: {
    label: 'B. Pelaksanaan Pembelajaran',
    max: 42,
    indikator: [
      { kode: 'P1', teks: 'Membuka pembelajaran dengan apersepsi dan motivasi' },
      { kode: 'P2', teks: 'Menyampaikan tujuan pembelajaran secara jelas' },
      { kode: 'P3', teks: 'Menggunakan metode pembelajaran yang variatif' },
      { kode: 'P4', teks: 'Menggunakan media pembelajaran yang interaktif' },
      { kode: 'P5', teks: 'Memberikan pertanyaan pemantik yang kritis' },
      { kode: 'P6', teks: 'Memfasilitasi diskusi dan kolaborasi antar murid' },
      { kode: 'P7', teks: 'Memberikan umpan balik yang konstruktif' },
      { kode: 'P8', teks: 'Mengelola kelas dengan efektif dan kondusif' },
      { kode: 'P9', teks: 'Mengintegrasikan teknologi secara bermakna' },
      { kode: 'P10', teks: 'Menerapkan pembelajaran yang memuliakan murid' },
      { kode: 'P11', teks: 'Membangun suasana belajar yang menyenangkan' },
      { kode: 'P12', teks: 'Menangani perbedaan karakteristik murid' },
      { kode: 'P13', teks: 'Menerapkan prinsip PM dalam pelaksanaan' },
      { kode: 'P14', teks: 'Menutup pembelajaran dengan refleksi' }
    ]
  },
  asesmen: {
    label: 'C. Asesmen Pembelajaran',
    max: 21,
    indikator: [
      { kode: 'A1', teks: 'Melaksanakan asesmen awal (diagnostik)' },
      { kode: 'A2', teks: 'Menggunakan instrumen asesmen yang valid' },
      { kode: 'A3', teks: 'Melaksanakan asesmen formatif secara berkelanjutan' },
      { kode: 'A4', teks: 'Menggunakan hasil asesmen untuk perbaikan pembelajaran' },
      { kode: 'A5', teks: 'Melaksanakan asesmen sumatif sesuai tujuan' },
      { kode: 'A6', teks: 'Memberikan umpan balik hasil asesmen' },
      { kode: 'A7', teks: 'Menggunakan asesmen berbasis digital (jika relevan)' }
    ]
  }
};

export const Evaluasi = {
  _view: 'list',
  _editId: null,
  _formData: null,

  async render() {
    if (this._view === 'form') return this._renderForm();
    return this._renderList();
  },

  async bind() {
    if (this._view === 'form') return this._bindForm();
    return this._bindList();
  },

  // =============== LIST VIEW ===============
  _renderList() {
    const items = (Store.get('evaluasi') || []).sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
    return `
      <div class="page-head">
        <div>
          <h2>Evaluasi Kinerja KS</h2>
          <div class="page-sub">Penilaian manual terhadap kinerja pembelajaran Kepala Sekolah</div>
        </div>
        <button class="btn btn-primary" id="btnNewEval">${Icons.svg('plus', 16)} Evaluasi Baru</button>
      </div>

      ${items.length === 0 ? `<div class="card"><div class="card-body">
        ${emptyState('award', 'Belum ada evaluasi', 'Buat evaluasi kinerja KS pertama Anda.',
          `<button class="btn btn-primary" id="btnNewEvalEmpty" style="margin-top:1rem">${Icons.svg('plus', 16)} Evaluasi Baru</button>`)}
      </div></div>` : `
        <div class="card"><table>
          <thead><tr>
            <th>KS / Tanggal</th>
            <th>Sekolah</th>
            <th>Periode</th>
            <th style="text-align:center">Capaian</th>
            <th style="text-align:center">Predikat</th>
            <th style="text-align:center">Status</th>
            <th style="text-align:right">Aksi</th>
          </tr></thead>
          <tbody>${items.map(e => {
            const pCls = e.predikat === 'Sangat Baik' ? 'success' : e.predikat === 'Baik' ? 'info' : e.predikat === 'Cukup' ? 'warning' : 'danger';
            const isFinal = e.status === 'final';
            return `<tr>
              <td>
                <div style="font-weight:600">${Utils.esc(e.ks_nama || '—')}</div>
                <div style="font-size:.75rem;color:var(--slate-500)">${Utils.date(e.tanggal)}</div>
              </td>
              <td style="font-size:.85rem">${Utils.esc(e.nama_sekolah || '—')}</td>
              <td style="font-family:monospace;font-size:.8rem">${Utils.esc(e.periode)}</td>
              <td style="text-align:center">
                <div style="font-weight:700;font-size:1rem">${(e.persen_capaian || 0).toFixed(1)}%</div>
                <div style="font-size:.7rem;color:var(--slate-500)">${e.skor_total || 0}/90</div>
              </td>
              <td style="text-align:center"><span class="badge badge-${pCls}">${e.predikat || '—'}</span></td>
              <td style="text-align:center"><span class="badge badge-${isFinal ? 'success' : 'neutral'}">${isFinal ? 'Final' : 'Draft'}</span></td>
              <td style="text-align:right;white-space:nowrap">
                <button class="btn btn-secondary btn-sm" data-edit="${e.id}">${Icons.svg(isFinal ? 'eye' : 'pencil', 14)} ${isFinal ? 'Lihat' : 'Lanjut'}</button>
                ${isFinal ? `<button class="btn btn-primary btn-sm" data-print="${e.id}">${Icons.svg('printer', 14)} Cetak</button>` : ''}
                <button class="btn btn-danger btn-sm" data-del="${e.id}">${Icons.svg('trash-2', 14)}</button>
              </td>
            </tr>`;
          }).join('')}</tbody>
        </table></div>
      `}
    `;
  },

  async _bindList() {
    Utils.el('btnNewEval')?.addEventListener('click', () => this._startNew());
    Utils.el('btnNewEvalEmpty')?.addEventListener('click', () => this._startNew());

    document.querySelectorAll('[data-edit]').forEach(b => {
      b.onclick = () => {
        this._editId = b.dataset.edit;
        this._formData = null;
        this._view = 'form';
        Router.navigate('evaluasi');
      };
    });
    document.querySelectorAll('[data-print]').forEach(b => {
      b.onclick = () => this._print(b.dataset.print);
    });
    document.querySelectorAll('[data-del]').forEach(b => {
      b.onclick = () => {
        Utils.confirm('Hapus Evaluasi?', 'Data evaluasi akan dihapus permanen.', () => {
          Store.set('evaluasi', Store.get('evaluasi').filter(x => x.id !== b.dataset.del));
          Router.navigate('evaluasi');
        });
      };
    });
  },

  _startNew() {
    this._editId = null;
    this._formData = null;
    this._view = 'form';
    Router.navigate('evaluasi');
  },

  // =============== FORM VIEW ===============
  _renderForm() {
    const sekolah = Store.get('sekolah');
    const existing = this._editId ? (Store.get('evaluasi') || []).find(e => e.id === this._editId) : null;
    if (this._editId && !existing) this._editId = null;
    const isReadonly = existing && existing.status === 'final';

    if (!this._formData) {
      if (existing) {
        this._formData = {
          npsn_sekolah: existing.npsn_sekolah || '',
          ks_nama: existing.ks_nama || '',
          periode: existing.periode || '',
          tanggal: existing.tanggal || Utils.today(),
          detail: existing.detail || {},
          catatan: existing.catatan || {},
          rtl: existing.rtl || '',
          sumber_data: existing.sumber_data || {},
          link_dokumentasi: existing.link_dokumentasi || ''
        };
      } else {
        this._formData = {
          npsn_sekolah: '',
          ks_nama: '',
          periode: '2025/2026-Ganjil',
          tanggal: Utils.today(),
          detail: {},
          catatan: {},
          rtl: '',
          sumber_data: { observasi: false, dokumen: false, video: false },
          link_dokumentasi: ''
        };
      }
    }

    const f = this._formData;

    return `
      <div class="page-head">
        <div>
          <button class="btn btn-secondary btn-sm" id="btnBack" style="margin-bottom:.75rem">${Icons.svg('chevron-left', 14)} Kembali</button>
          <h2 style="margin:0">${existing ? (isReadonly ? 'Lihat Evaluasi' : 'Lanjutkan Evaluasi') : 'Evaluasi Baru'}</h2>
          <div class="page-sub">Isi 30 indikator dari 3 komponen</div>
        </div>
      </div>

      ${isReadonly ? `<div class="info-banner success" style="margin-bottom:1rem">${Icons.svg('check-circle', 18)}<div><strong>Evaluasi sudah final.</strong> Data tidak dapat diubah.</div></div>` : ''}

      <div class="card" style="margin-bottom:1.5rem">
        <div class="card-header">${Icons.svg('settings', 18)} Informasi Dasar</div>
        <div class="card-body">
          <div class="row">
            <div class="form-group">
              <label class="label">Sekolah</label>
              <select class="select" id="fSek" ${isReadonly ? 'disabled' : ''}>
                <option value="">— Pilih Sekolah —</option>
                ${sekolah.map(s => `<option value="${s.npsn}" ${f.npsn_sekolah === s.npsn ? 'selected' : ''}>${Utils.esc(s.nama_sekolah)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="label">Kepala Sekolah</label>
              <input type="text" class="input" id="fKs" placeholder="Nama KS" value="${Utils.esc(f.ks_nama)}" ${isReadonly ? 'disabled' : ''}>
            </div>
          </div>
          <div class="row">
            <div class="form-group">
              <label class="label">Periode</label>
              <input type="text" class="input" id="fPeriode" value="${Utils.esc(f.periode)}" ${isReadonly ? 'disabled' : ''}>
            </div>
            <div class="form-group">
              <label class="label">Tanggal Evaluasi</label>
              <input type="date" class="input" id="fTanggal" value="${f.tanggal}" ${isReadonly ? 'disabled' : ''}>
            </div>
          </div>
          <div class="form-group">
            <label class="label">Sumber Data</label>
            <div style="display:flex;gap:1rem;flex-wrap:wrap">
              <label style="display:flex;align-items:center;gap:.4rem;font-size:.85rem;cursor:pointer"><input type="checkbox" id="sdObs" ${f.sumber_data.observasi ? 'checked' : ''} ${isReadonly ? 'disabled' : ''}> Observasi Kelas</label>
              <label style="display:flex;align-items:center;gap:.4rem;font-size:.85rem;cursor:pointer"><input type="checkbox" id="sdDok" ${f.sumber_data.dokumen ? 'checked' : ''} ${isReadonly ? 'disabled' : ''}> Dokumen</label>
              <label style="display:flex;align-items:center;gap:.4rem;font-size:.85rem;cursor:pointer"><input type="checkbox" id="sdVid" ${f.sumber_data.video ? 'checked' : ''} ${isReadonly ? 'disabled' : ''}> Video</label>
            </div>
          </div>
          <div class="form-group">
            <label class="label">Link Dokumentasi (Opsional)</label>
            <input type="url" class="input" id="fLink" value="${Utils.esc(f.link_dokumentasi)}" ${isReadonly ? 'disabled' : ''}>
          </div>
        </div>
      </div>

      <div id="instrumenContainer"></div>

      <div class="card" style="margin-top:1.5rem">
        <div class="card-header">${Icons.svg('message-square', 18)} Catatan & RTL</div>
        <div class="card-body">
          <div class="form-group"><label class="label">Catatan Rencana</label><textarea class="textarea" id="cRencana" rows="2" ${isReadonly ? 'disabled' : ''}>${Utils.esc(f.catatan.rencana || '')}</textarea></div>
          <div class="form-group"><label class="label">Catatan Pelaksanaan</label><textarea class="textarea" id="cPelaksanaan" rows="2" ${isReadonly ? 'disabled' : ''}>${Utils.esc(f.catatan.pelaksanaan || '')}</textarea></div>
          <div class="form-group"><label class="label">Catatan Asesmen</label><textarea class="textarea" id="cAsesmen" rows="2" ${isReadonly ? 'disabled' : ''}>${Utils.esc(f.catatan.asesmen || '')}</textarea></div>
          <div class="form-group"><label class="label">RTL (Rencana Tindak Lanjut)</label><textarea class="textarea" id="fRtl" rows="3" ${isReadonly ? 'disabled' : ''}>${Utils.esc(f.rtl)}</textarea></div>
        </div>
      </div>

      ${!isReadonly ? `
        <div style="display:flex;justify-content:flex-end;gap:.5rem;margin-top:1.5rem;margin-bottom:3rem">
          <button class="btn btn-secondary" id="btnSaveDraft">${Icons.svg('save', 16)} Simpan Draft</button>
          <button class="btn btn-primary" id="btnFinal">${Icons.svg('check-circle', 16)} Finalisasi</button>
        </div>
      ` : ''}
    `;
  },

  async _bindForm() {
    Utils.el('btnBack').onclick = () => {
      this._view = 'list';
      this._editId = null;
      this._formData = null;
      Router.navigate('evaluasi');
    };

    Utils.el('fSek')?.addEventListener('change', (e) => {
      this._formData.npsn_sekolah = e.target.value; // Simpan langsung ke state
      const sk = Store.get('sekolah').find(x => x.npsn === e.target.value);
      if (sk && sk.ks_nama && Utils.el('fKs')) Utils.el('fKs').value = sk.ks_nama;
    });

    this._renderInstrumen();

    const isReadonly = this._editId && (Store.get('evaluasi') || []).find(e => e.id === this._editId)?.status === 'final';

    if (!isReadonly) {
      Utils.el('btnSaveDraft').onclick = () => this._save('draft');
      Utils.el('btnFinal').onclick = () => {
        const filled = Object.keys(this._formData.detail).length;
        if (filled < 30) {
          Utils.confirm('Belum lengkap', `Masih ada ${30 - filled} indikator belum dinilai. Tetap finalisasi?`, () => this._save('final'));
        } else {
          Utils.confirm('Finalisasi?', 'Setelah final, data tidak dapat diubah.', () => this._save('final'));
        }
      };
    }
  },

  _renderInstrumen() {
    const container = Utils.el('instrumenContainer');
    const f = this._formData;
    const isReadonly = this._editId && (Store.get('evaluasi') || []).find(e => e.id === this._editId)?.status === 'final';

    container.innerHTML = ['rencana', 'pelaksanaan', 'asesmen'].map(komKey => {
      const kom = INSTRUMEN_EVALUASI[komKey];
      return `
        <div class="card" style="margin-bottom:1.5rem;padding:0">
          <div style="background:var(--slate-100);padding:.75rem 1rem;font-weight:700;font-size:.85rem;color:var(--slate-800);border-bottom:1px solid var(--slate-200);display:flex;justify-content:space-between">
            <span>${kom.label}</span>
            <span style="color:var(--brand-600);font-size:.75rem">Maks ${kom.max} poin</span>
          </div>
          ${kom.indikator.map(ind => {
            const cur = f.detail[ind.kode];
            return `<div style="padding:.75rem 1rem;border-bottom:1px solid var(--slate-100)">
              <div style="display:grid;grid-template-columns:32px 1fr auto;gap:.75rem;align-items:flex-start">
                <div style="width:32px;height:32px;border-radius:8px;background:var(--brand-50);color:var(--brand-700);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.75rem">${ind.kode}</div>
                <div style="font-size:.85rem;color:var(--slate-800);line-height:1.5">${Utils.esc(ind.teks)}</div>
                <div style="display:flex;gap:4px">
                  ${[0,1,2,3].map(s => `<button type="button" class="skor-btn" data-kode="${ind.kode}" data-skor="${s}" style="padding:.35rem .5rem;border:1.5px solid ${cur===s?'var(--brand-600)':'var(--slate-200)'};background:${cur===s?'var(--brand-600)':'#fff'};color:${cur===s?'#fff':'var(--slate-600)'};border-radius:6px;font-size:.75rem;font-weight:700;cursor:pointer;min-width:28px" ${isReadonly?'disabled':''}>${s}</button>`).join('')}
                </div>
              </div>
            </div>`;
          }).join('')}
        </div>`;
    }).join('');

    if (!isReadonly) {
      container.querySelectorAll('.skor-btn').forEach(btn => {
        btn.onclick = () => {
          const kode = btn.dataset.kode;
          const skor = parseInt(btn.dataset.skor);
          this._formData.detail[kode] = skor;
          container.querySelectorAll(`.skor-btn[data-kode="${kode}"]`).forEach(b => {
            b.style.borderColor = 'var(--slate-200)';
            b.style.background = '#fff';
            b.style.color = 'var(--slate-600)';
          });
          btn.style.borderColor = 'var(--brand-600)';
          btn.style.background = 'var(--brand-600)';
          btn.style.color = '#fff';
        };
      });
    }
  },

  _save(status) {
    const f = this._formData;
    
    // 1. BACA NILAI DARI FORM
    if (Utils.el('fSek')) f.npsn_sekolah = Utils.el('fSek').value;
    if (Utils.el('fKs')) f.ks_nama = Utils.el('fKs').value.trim();
    
    // 2. VALIDASI
    if (!f.npsn_sekolah) return Utils.toast('Sekolah wajib dipilih', 'error');
    if (!f.ks_nama) return Utils.toast('Nama KS wajib diisi', 'error');

    // 3. SIMPAN INPUTAN LAINNYA
    f.periode = Utils.el('fPeriode')?.value.trim() || f.periode;
    f.tanggal = Utils.el('fTanggal')?.value || f.tanggal;
    f.sumber_data = {
      observasi: Utils.el('sdObs')?.checked || false,
      dokumen: Utils.el('sdDok')?.checked || false,
      video: Utils.el('sdVid')?.checked || false
    };
    f.link_dokumentasi = Utils.el('fLink')?.value.trim() || '';
    f.catatan = {
      rencana: Utils.el('cRencana')?.value.trim() || '',
      pelaksanaan: Utils.el('cPelaksanaan')?.value.trim() || '',
      asesmen: Utils.el('cAsesmen')?.value.trim() || ''
    };
    f.rtl = Utils.el('fRtl')?.value.trim() || '';

    const sumKom = (k) => INSTRUMEN_EVALUASI[k].indikator.reduce((s, i) => s + (f.detail[i.kode] || 0), 0);
    const sR = sumKom('rencana');
    const sP = sumKom('pelaksanaan');
    const sA = sumKom('asesmen');
    const total = sR + sP + sA;
    const persen = (total / 90) * 100;

    let predikat = 'Kurang';
    if (persen >= 91) predikat = 'Sangat Baik';
    else if (persen >= 80) predikat = 'Baik';
    else if (persen >= 71) predikat = 'Cukup';

    const sekolah = Store.get('sekolah').find(s => s.npsn === f.npsn_sekolah);
    const list = Store.get('evaluasi') || [];
    const now = new Date().toISOString();

    // 4. TENTUKAN ID (KUNCI PERBAIKANNYA DI SINI)
    const currentId = this._editId || Utils.uid(); 
    
    const record = {
      ...f,
      id: currentId, // Gunakan ID yang sudah ada, atau buat baru jika memang baru
      nama_sekolah: sekolah ? sekolah.nama_sekolah : '-',
      status: status,
      skor_rencana: sR, skor_pelaksanaan: sP, skor_asesmen: sA,
      skor_total: total, persen_capaian: persen, predikat: predikat,
      updated_at: now,
      created_at: this._editId ? (list.find(x => x.id === this._editId)?.created_at || now) : now
    };

    // 5. SIMPAN KE DATABASE (Cek berdasarkan ID yang sama)
    const idx = list.findIndex(x => x.id === currentId);
    if (idx !== -1) {
      list[idx] = record; // Update data yang sudah ada
    } else {
      list.push(record); // Buat baru
    }
    Store.set('evaluasi', list);

    // 6. KUNCI PERBAIKAN: Set _editId agar klik berikutnya mengupdate, bukan menduplikasi
    this._editId = currentId;

    Utils.toast(status === 'final' ? 'Evaluasi difinalisasi' : 'Draft tersimpan', 'success');

    if (status === 'final') {
      this._view = 'list';
      this._editId = null;
      this._formData = null;
    } else {
      this._formData = record;
    }
    Router.navigate('evaluasi');
  },

  _print(id) {
    const e = (Store.get('evaluasi') || []).find(x => x.id === id);
    if (!e) return;
    const c = Store.config();

    const renderKomponen = (komKey) => {
      const kom = INSTRUMEN_EVALUASI[komKey];
      const rows = kom.indikator.map(ind => {
        const skor = e.detail[ind.kode] || 0;
        return `<tr><td class="kode">${ind.kode}</td><td>${ind.teks}</td><td class="skor">${skor}</td></tr>`;
      }).join('');
      return `<h2>${kom.label}</h2><table class="ind"><thead><tr><th>Kode</th><th>Indikator</th><th style="width:60px">Skor</th></tr></thead><tbody>${rows}</tbody></table>`;
    };

    const sumKom = (k) => INSTRUMEN_EVALUASI[k].indikator.reduce((s, i) => s + (e.detail[i.kode] || 0), 0);

    Utils.el('printArea').innerHTML = `
      <h1>INSTRUMEN EVALUASI KINERJA KEPALA SEKOLAH</h1>
      <p class="sub">${Utils.esc(e.nama_sekolah)} — NPSN ${Utils.esc(e.npsn_sekolah)}</p>
      <table class="info">
        <tr><td>Nama KS</td><td>:</td><td><strong>${Utils.esc(e.ks_nama)}</strong></td></tr>
        <tr><td>Periode</td><td>:</td><td>${Utils.esc(e.periode)}</td></tr>
        <tr><td>Tanggal</td><td>:</td><td>${Utils.date(e.tanggal)}</td></tr>
        <tr><td>Pengawas</td><td>:</td><td>${Utils.esc(c.nama_pengawas || '-')}</td></tr>
      </table>
      ${renderKomponen('rencana')}
      ${e.catatan.rencana ? `<p><strong>Catatan:</strong> ${Utils.esc(e.catatan.rencana)}</p>` : ''}
      ${renderKomponen('pelaksanaan')}
      ${e.catatan.pelaksanaan ? `<p><strong>Catatan:</strong> ${Utils.esc(e.catatan.pelaksanaan)}</p>` : ''}
      ${renderKomponen('asesmen')}
      ${e.catatan.asesmen ? `<p><strong>Catatan:</strong> ${Utils.esc(e.catatan.asesmen)}</p>` : ''}
      <h2>Rekap Capaian</h2>
      <table class="info">
        <tr><td>Rencana</td><td>:</td><td>${sumKom('rencana')} / 27</td></tr>
        <tr><td>Pelaksanaan</td><td>:</td><td>${sumKom('pelaksanaan')} / 42</td></tr>
        <tr><td>Asesmen</td><td>:</td><td>${sumKom('asesmen')} / 21</td></tr>
        <tr><td>Total</td><td>:</td><td><strong>${e.skor_total} / 90 (${(e.persen_capaian || 0).toFixed(1)}%)</strong></td></tr>
        <tr><td>Predikat</td><td>:</td><td><strong>${e.predikat}</strong></td></tr>
      </table>
      ${e.rtl ? `<h2>RTL</h2><p>${Utils.esc(e.rtl)}</p>` : ''}
      <div class="ttd-grid">
        <div class="ttd-box"><div>Pengawas</div><div class="ttd-space"></div><div class="ttd-name">${Utils.esc(c.nama_pengawas || '...')}</div><div style="font-size:8.5pt;color:#64748b">NIP. ${Utils.esc(c.nip_pengawas || '...')}</div></div>
        <div class="ttd-box"><div>Kepala Sekolah</div><div class="ttd-space"></div><div class="ttd-name">${Utils.esc(e.ks_nama)}</div></div>
      </div>`;
    setTimeout(() => window.print(), 200);
  }
};
