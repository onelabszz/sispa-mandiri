import { Store } from '../../storage.js';
import { Utils } from '../../../shared/js/utils.js';
import { Icons } from '../../../shared/js/icons.js';
import { Router } from '../../../shared/js/router.js';
import { emptyState } from '../helpers.js';
import {
  INSTRUMEN_PEMANTAUAN_KS,
  SKALA_PEMANTAUAN_KS,
  KATEGORI_PEMANTAUAN_KS,
  MAX_SKOR_PEMANTAUAN_KS
} from '../../../shared/js/constants.js';

const VERSION_KEY = 'v2_pemantauan';

// Daftar aspek unik (dari konstanta)
const ASPEK_LIST = [...new Set(INSTRUMEN_PEMANTAUAN_KS.map(i => i.aspek))];

// ============================================================
// HELPERS
// ============================================================

const detectSemester = (tgl) => {
  const d = tgl ? new Date(tgl) : new Date();
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  return m >= 7 ? `${y}/${y + 1}-Ganjil` : `${y - 1}/${y}-Genap`;
};

const hitungTotal = (detail) => {
  return INSTRUMEN_PEMANTAUAN_KS.reduce((sum, i) => sum + (detail[i.kode] || 0), 0);
};

const hitungNilai = (detail) => {
  const total = hitungTotal(detail);
  return Math.round((total / MAX_SKOR_PEMANTAUAN_KS) * 100 * 10) / 10;
};

const getKategori = (nilai) => {
  return KATEGORI_PEMANTAUAN_KS.find(k => nilai >= k.min) || KATEGORI_PEMANTAUAN_KS[KATEGORI_PEMANTAUAN_KS.length - 1];
};

// ============================================================
// AUTO-SUGGEST — data KS sebagai konteks
// ============================================================

function getAutoSuggest(sk, kode) {
  if (!sk) return null;
  const sup3 = sk.supervisi || [];
  const pm = sk.supervisiPM || [];
  const akad = sk.akademik || [];
  const coach = sk.coaching || [];
  const guru = sk.guru || [];
  const prog = sk.program || [];

  switch (kode) {
    case '1.1': {
      const n = prog.length;
      return n > 0 ? `📊 ${n} program supervisi tersedia` : '📊 Belum ada program supervisi';
    }
    case '1.2': {
      const n = prog.filter(p => p.waktu).length;
      return n > 0 ? `📅 ${n} program terjadwal` : '📅 Belum ada jadwal';
    }
    case '1.3': {
      const n = sup3.length + pm.length + akad.length + coach.length;
      return n > 0 ? `📋 ${n} sesi instrumen sudah dipakai` : '📋 Belum ada sesi supervisi';
    }
    case '1.4':
      return null; // tidak ter-track
    case '2.1': {
      const n = pm.filter(s => s.telaah && Object.keys(s.telaah.skor || {}).length > 0).length;
      return n > 0 ? `📝 ${n} sesi Telaah RPP PM tercatat` : '📝 Belum ada Telaah RPP PM';
    }
    case '2.2': {
      const n = sup3.length + pm.filter(s => s.obs && Object.keys(s.obs.bukti || {}).length > 0).length + akad.length + coach.length;
      return n > 0 ? `👁️ ${n} sesi observasi tercatat` : '👁️ Belum ada observasi';
    }
    case '2.3': {
      let n = 0;
      sup3.forEach(s => { if (s.obs_guru || s.obs_murid) n++; });
      pm.forEach(s => { if (Object.values(s.obs?.catatan || {}).some(v => v && String(v).trim())) n++; });
      akad.forEach(s => { if (Object.values(s.catatan || {}).some(v => v && String(v).trim())) n++; });
      coach.forEach(s => { if (Object.values(s.catatan || {}).some(v => v && String(v).trim())) n++; });
      return n > 0 ? `📝 ${n} sesi dengan catatan data` : '📝 Belum ada catatan';
    }
    case '2.4':
      return null;
    case '3.1':
      return null; // analisis user behavior tidak ter-track
    case '3.2': {
      const n = guru.filter(g => g.tipe).length;
      return guru.length > 0 ? `🎯 ${n}/${guru.length} guru dinilai tipe` : '🎯 Belum ada data guru';
    }
    case '3.3': {
      const n = sup3.filter(s => s.status === 'selesai').length + pm.filter(s => s.status === 'selesai').length;
      return n > 0 ? `📄 ${n} sesi sudah difinalisasi` : '📄 Belum ada sesi final';
    }
    case '4.1': {
      const n = sup3.filter(s => s.refleksi && Object.keys(s.refleksi).length > 0).length;
      return n > 0 ? `💬 ${n} sesi dengan refleksi 3T` : '💬 Belum ada refleksi';
    }
    case '4.2': {
      const n = sup3.filter(s => s.refleksi && Object.keys(s.refleksi).length > 0).length
        + pm.filter(s => s.refleksi && Object.values(s.refleksi).some(v => v && String(v).trim())).length;
      return n > 0 ? `🪞 ${n} sesi refleksi tercatat` : '🪞 Belum ada refleksi';
    }
    case '4.3': {
      const n = sup3.filter(s => s.rtl && s.rtl.aksi).length
        + coach.filter(s => (s.rtl || []).some(r => r.aksi)).length;
      return n > 0 ? `🤝 ${n} sesi RTL disepakati` : '🤝 Belum ada RTL';
    }
    case '5.1': {
      const n = coach.length;
      return n > 0 ? `🎓 ${n} sesi coaching digitalisasi` : '🎓 Belum ada sesi coaching';
    }
    case '5.2':
      return null;
    case '5.3':
      return null;
    case '5.4': {
      const n = sup3.filter(s => s.rtl && s.rtl.aksi).length;
      return n > 0 ? `🔁 ${n} RTL tercatat (monitoring manual)` : '🔁 Belum ada RTL';
    }
    default:
      return null;
  }
}

// ============================================================
// EXPORT
// ============================================================

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

  // ============================================
  // LIST VIEW
  // ============================================
  _renderList() {
    const all = Store.get('evaluasi') || [];
    const items = all
      .filter(e => e.instrumen_version === VERSION_KEY)
      .sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
    const orphaned = all.filter(e => e.instrumen_version !== VERSION_KEY).length;

    return `
      <div class="page-head">
        <div>
          <h2>Pemantauan Supervisi Akademik</h2>
          <div class="page-sub">Penilaian kinerja supervisi Kepala Sekolah · 18 indikator</div>
        </div>
        <button class="btn btn-primary" id="btnNewEval">${Icons.svg('plus', 16)} Pemantauan Baru</button>
      </div>

      ${items.length === 0 ? `<div class="card"><div class="card-body">
        ${emptyState('award', 'Belum ada pemantauan',
          'Buat pemantauan supervisi KS pertama. Instrumen ini menggantikan Evaluasi Kinerja KS lama (30 indikator).',
          `<button class="btn btn-primary" id="btnNewEvalEmpty" style="margin-top:1rem">${Icons.svg('plus', 16)} Pemantauan Baru</button>`)}
      </div></div>` : `
        <div class="card"><table>
          <thead><tr>
            <th>Sekolah / KS</th>
            <th>Semester</th>
            <th>Tanggal</th>
            <th style="text-align:center">Nilai</th>
            <th style="text-align:center">Kategori</th>
            <th style="text-align:center">Status</th>
            <th style="text-align:right">Aksi</th>
          </tr></thead>
          <tbody>${items.map(e => {
            const kat = getKategori(e.nilai || 0);
            const isFinal = e.status === 'final';
            return `<tr>
              <td>
                <div style="font-weight:600">${Utils.esc(e.nama_sekolah || '—')}</div>
                <div style="font-size:.75rem;color:var(--slate-500)">${Utils.esc(e.ks_nama || '—')}</div>
              </td>
              <td style="font-family:monospace;font-size:.8rem">${Utils.esc(e.semester || '—')}</td>
              <td>${Utils.date(e.tanggal)}</td>
              <td style="text-align:center">
                <div style="font-weight:700;font-size:1rem">${(e.nilai || 0).toFixed(1)}</div>
                <div style="font-size:.7rem;color:var(--slate-500)">${e.skor_total || 0}/${MAX_SKOR_PEMANTAUAN_KS}</div>
              </td>
              <td style="text-align:center"><span class="badge badge-${kat.cls}">${kat.label}</span></td>
              <td style="text-align:center"><span class="badge badge-${isFinal ? 'success' : 'neutral'}">${isFinal ? 'Final' : 'Draft'}</span></td>
              <td style="text-align:right;white-space:nowrap">
                <button class="btn btn-secondary btn-sm" data-edit="${e.id}">${Icons.svg(isFinal ? 'eye' : 'pencil', 14)} ${isFinal ? 'Lihat' : 'Lanjut'}</button>
                ${isFinal ? `<button class="btn btn-primary btn-sm" data-print="${e.id}">${Icons.svg('printer', 14)} Cetak</button>` : ''}
                <button class="btn btn-danger btn-sm" data-del="${e.id}">${Icons.svg('trash-2', 14)}</button>
              </td>
            </tr>`;
          }).join('')}</tbody>
        </table></div>
        ${orphaned > 0 ? `<div style="margin-top:1rem;padding:.75rem;background:var(--slate-50);border-radius:8px;font-size:.8rem;color:var(--slate-500)">
          ℹ️ ${orphaned} data evaluasi lama (instrumen 30-indikator) masih tersimpan sebagai arsip. Bisa diakses via export JSON.
        </div>` : ''}
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
        Utils.confirm('Hapus Pemantauan?', 'Data pemantauan akan dihapus permanen.', () => {
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

  // ============================================
  // FORM VIEW
  // ============================================
  _renderForm() {
    const sekolah = Store.get('sekolah');
    const existing = this._editId ? (Store.get('evaluasi') || []).find(e => e.id === this._editId) : null;
    if (this._editId && !existing) this._editId = null;
    const isReadonly = existing && existing.status === 'final';
    const cfg = Store.config();

    if (!this._formData) {
      if (existing) {
        this._formData = {
          npsn: existing.npsn || '',
          nama_sekolah: existing.nama_sekolah || '',
          ks_nama: existing.ks_nama || '',
          nama_pengawas: existing.nama_pengawas || cfg.nama_pengawas || '',
          semester: existing.semester || '',
          tanggal: existing.tanggal || Utils.today(),
          skor: existing.skor || {},
          catatan: existing.catatan || {},
          catatan_rekomendasi: existing.catatan_rekomendasi || ''
        };
      } else {
        this._formData = {
          npsn: '',
          nama_sekolah: '',
          ks_nama: '',
          nama_pengawas: cfg.nama_pengawas || '',
          semester: detectSemester(Utils.today()),
          tanggal: Utils.today(),
          skor: {},
          catatan: {},
          catatan_rekomendasi: ''
        };
      }
    }

    const f = this._formData;
    const total = hitungTotal(f.skor);
    const nilai = hitungNilai(f.skor);
    const kat = getKategori(nilai);

    return `
      <div class="page-head">
        <div>
          <button class="btn btn-secondary btn-sm" id="btnBack" style="margin-bottom:.75rem">${Icons.svg('chevron-left', 14)} Kembali</button>
          <h2 style="margin:0">${existing ? (isReadonly ? 'Lihat Pemantauan' : 'Lanjutkan Pemantauan') : 'Pemantauan Baru'}</h2>
          <div class="page-sub">Isi 18 indikator dari 5 aspek · Skor 1-4</div>
        </div>
      </div>

      ${isReadonly ? `<div class="info-banner success" style="margin-bottom:1rem">${Icons.svg('check-circle', 18)}<div><strong>Pemantauan sudah final.</strong> Data tidak dapat diubah.</div></div>` : ''}

      <div class="card" style="margin-bottom:1.5rem">
        <div class="card-header">${Icons.svg('settings', 18)} Identitas Pemantauan</div>
        <div class="card-body">
          <div class="row">
            <div class="form-group">
              <label class="label">Sekolah *</label>
              <select class="select" id="fSek" ${isReadonly ? 'disabled' : ''}>
                <option value="">— Pilih Sekolah Binaan —</option>
                ${sekolah.map(s => `<option value="${s.npsn}" ${f.npsn === s.npsn ? 'selected' : ''}>${Utils.esc(s.nama_sekolah)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="label">Nama Kepala Sekolah *</label>
              <input type="text" class="input" id="fKs" placeholder="Nama lengkap KS" value="${Utils.esc(f.ks_nama)}" ${isReadonly ? 'disabled' : ''}>
            </div>
          </div>
          <div class="row">
            <div class="form-group">
              <label class="label">Nama Pengawas</label>
              <input type="text" class="input" id="fPengawas" value="${Utils.esc(f.nama_pengawas)}" ${isReadonly ? 'disabled' : ''}>
            </div>
            <div class="form-group">
              <label class="label">Semester / Tahun</label>
              <input type="text" class="input" id="fSemester" value="${Utils.esc(f.semester)}" placeholder="2026/2027-Ganjil" ${isReadonly ? 'disabled' : ''}>
            </div>
          </div>
          <div class="form-group">
            <label class="label">Tanggal Pemantauan</label>
            <input type="date" class="input" id="fTanggal" value="${f.tanggal}" ${isReadonly ? 'disabled' : ''}>
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom:1rem">
        <div class="card-header">${Icons.svg('info', 18)} Skala Penilaian</div>
        <div class="card-body" style="font-size:.8rem;color:var(--slate-600);line-height:1.7">
          ${SKALA_PEMANTAUAN_KS.map(s => `<div><strong>${s.skor} (${s.label}):</strong> ${s.deskripsi}</div>`).join('')}
        </div>
      </div>

      <div id="instrumenContainer"></div>

      <div class="card" style="margin-top:1.5rem">
        <div class="card-header">${Icons.svg('message-square', 18)} Catatan & Rekomendasi Pengawas</div>
        <div class="card-body">
          <textarea class="textarea" id="fRekomendasi" rows="5" placeholder="Catatan, temuan, dan rekomendasi untuk kepala sekolah..." ${isReadonly ? 'disabled' : ''}>${Utils.esc(f.catatan_rekomendasi)}</textarea>
        </div>
      </div>

      <div class="card" style="margin-top:1.5rem;border:2px solid var(--brand-500)">
        <div class="card-header" style="background:var(--brand-50)">${Icons.svg('award', 18)} Ringkasan Capaian</div>
        <div class="card-body" id="summaryBox">
          ${this._renderSummary(total, nilai, kat)}
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

  _renderSummary(total, nilai, kat) {
    return `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:.75rem">
        <div style="padding:.75rem;background:var(--slate-50);border-radius:8px;text-align:center">
          <div style="font-size:.7rem;color:var(--slate-500);text-transform:uppercase;font-weight:700">Skor Total</div>
          <div style="font-size:1.5rem;font-weight:800;color:var(--brand-700)">${total}<span style="font-size:.9rem;font-weight:400;color:var(--slate-400)">/${MAX_SKOR_PEMANTAUAN_KS}</span></div>
        </div>
        <div style="padding:.75rem;background:var(--slate-50);border-radius:8px;text-align:center">
          <div style="font-size:.7rem;color:var(--slate-500);text-transform:uppercase;font-weight:700">Nilai Akhir</div>
          <div style="font-size:1.5rem;font-weight:800;color:var(--brand-700)">${nilai.toFixed(1)}</div>
        </div>
        <div style="padding:.75rem;background:var(--slate-50);border-radius:8px;text-align:center">
          <div style="font-size:.7rem;color:var(--slate-500);text-transform:uppercase;font-weight:700">Kategori</div>
          <div style="margin-top:.35rem"><span class="badge badge-${kat.cls}" style="font-size:.9rem;padding:.4rem .9rem">${kat.label}</span></div>
        </div>
      </div>
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
      this._formData.npsn = e.target.value;
      const sk = Store.get('sekolah').find(x => x.npsn === e.target.value);
      if (sk) {
        this._formData.nama_sekolah = sk.nama_sekolah;
        if (sk.ks_nama && Utils.el('fKs') && !Utils.el('fKs').value) {
          Utils.el('fKs').value = sk.ks_nama;
          this._formData.ks_nama = sk.ks_nama;
        }
      }
      // Re-render instrumen supaya auto-suggest update
      this._renderInstrumen();
    });

    // Auto-detect semester saat tanggal berubah
    Utils.el('fTanggal')?.addEventListener('change', (e) => {
      this._formData.tanggal = e.target.value;
      const semInput = Utils.el('fSemester');
      if (semInput && !semInput.value) {
        semInput.value = detectSemester(e.target.value);
        this._formData.semester = semInput.value;
      }
    });

    this._renderInstrumen();

    const isReadonly = this._editId && (Store.get('evaluasi') || []).find(e => e.id === this._editId)?.status === 'final';
    if (!isReadonly) {
      Utils.el('btnSaveDraft').onclick = () => this._save('draft');
      Utils.el('btnFinal').onclick = () => {
        const filled = INSTRUMEN_PEMANTAUAN_KS.filter(i => this._formData.skor[i.kode]).length;
        if (filled < 18) {
          Utils.confirm('Belum lengkap', `Masih ada ${18 - filled} indikator belum dinilai. Tetap finalisasi?`, () => this._save('final'));
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
    const sk = Store.get('sekolah').find(x => x.npsn === f.npsn);

    container.innerHTML = ASPEK_LIST.map(aspek => {
      const items = INSTRUMEN_PEMANTAUAN_KS.filter(i => i.aspek === aspek);
      const maxAspek = items.length * 4;
      const curAspek = items.reduce((s, i) => s + (f.skor[i.kode] || 0), 0);

      return `
        <div class="card" style="margin-bottom:1.5rem;padding:0">
          <div style="background:var(--slate-100);padding:.75rem 1rem;font-weight:700;font-size:.85rem;color:var(--slate-800);border-bottom:1px solid var(--slate-200);display:flex;justify-content:space-between">
            <span>${Utils.esc(aspek)}</span>
            <span style="color:var(--brand-600);font-size:.75rem">${curAspek}/${maxAspek}</span>
          </div>
          ${items.map(ind => {
            const cur = f.skor[ind.kode];
            const catVal = f.catatan[ind.kode] || '';
            const autoSuggest = getAutoSuggest(sk, ind.kode);
            return `<div style="padding:.85rem 1rem;border-bottom:1px solid var(--slate-100)">
              <div style="display:grid;grid-template-columns:42px 1fr;gap:.75rem;align-items:flex-start">
                <div style="width:42px;height:32px;border-radius:6px;background:var(--brand-50);color:var(--brand-700);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.75rem">${ind.kode}</div>
                <div style="flex:1;min-width:0">
                  <div style="font-size:.85rem;color:var(--slate-800);line-height:1.55;margin-bottom:.35rem">${Utils.esc(ind.teks)}</div>
                  <div style="font-size:.7rem;color:var(--slate-500);margin-bottom:.35rem">
                    <strong>Bukti:</strong> ${Utils.esc(ind.bukti)}
                  </div>
                  ${autoSuggest ? `<div style="font-size:.7rem;color:var(--info);padding:.35rem .5rem;background:#eff6ff;border-radius:6px;margin-bottom:.5rem">${Utils.esc(autoSuggest)}</div>` : ''}
                  <div style="display:flex;gap:4px;margin-bottom:.5rem">
                    ${[1,2,3,4].map(s => `<button type="button" class="skor-btn" data-kode="${ind.kode}" data-skor="${s}" style="padding:.4rem .7rem;border:1.5px solid ${cur===s?'var(--brand-600)':'var(--slate-200)'};background:${cur===s?'var(--brand-600)':'#fff'};color:${cur===s?'#fff':'var(--slate-600)'};border-radius:6px;font-size:.8rem;font-weight:700;cursor:pointer;min-width:34px" ${isReadonly?'disabled':''}>${s}</button>`).join('')}
                  </div>
                  <textarea class="textarea" data-cat="${ind.kode}" rows="1" style="font-size:.75rem" placeholder="Catatan pengawas (opsional)..." ${isReadonly?'disabled':''}>${Utils.esc(catVal)}</textarea>
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
          this._formData.skor[kode] = skor;
          this._updateSkorBtns(kode, skor);
          this._updateSummary();
        };
      });
      container.querySelectorAll('[data-cat]').forEach(ta => {
        ta.oninput = () => { this._formData.catatan[ta.dataset.cat] = ta.value; };
      });
    }
  },

  _updateSkorBtns(kode, skor) {
    const buttons = document.querySelectorAll(`.skor-btn[data-kode="${kode}"]`);
    buttons.forEach(b => {
      const isActive = parseInt(b.dataset.skor) === skor;
      b.style.borderColor = isActive ? 'var(--brand-600)' : 'var(--slate-200)';
      b.style.background = isActive ? 'var(--brand-600)' : '#fff';
      b.style.color = isActive ? '#fff' : 'var(--slate-600)';
    });
  },

  _updateSummary() {
    const box = Utils.el('summaryBox');
    if (!box) return;
    const total = hitungTotal(this._formData.skor);
    const nilai = hitungNilai(this._formData.skor);
    const kat = getKategori(nilai);
    box.innerHTML = this._renderSummary(total, nilai, kat);
  },

  _save(status) {
    const f = this._formData;
    if (Utils.el('fSek')) f.npsn = Utils.el('fSek').value;
    if (Utils.el('fKs')) f.ks_nama = Utils.el('fKs').value.trim();
    if (Utils.el('fPengawas')) f.nama_pengawas = Utils.el('fPengawas').value.trim();
    if (Utils.el('fSemester')) f.semester = Utils.el('fSemester').value.trim();
    if (Utils.el('fTanggal')) f.tanggal = Utils.el('fTanggal').value;
    if (Utils.el('fRekomendasi')) f.catatan_rekomendasi = Utils.el('fRekomendasi').value.trim();

    if (!f.npsn) return Utils.toast('Sekolah wajib dipilih', 'error');
    if (!f.ks_nama) return Utils.toast('Nama KS wajib diisi', 'error');

    const sk = Store.get('sekolah').find(s => s.npsn === f.npsn);
    if (sk) f.nama_sekolah = sk.nama_sekolah;

    const total = hitungTotal(f.skor);
    const nilai = hitungNilai(f.skor);
    const kat = getKategori(nilai);

    const list = Store.get('evaluasi') || [];
    const now = new Date().toISOString();
    const currentId = this._editId || Utils.uid();

    const record = {
      ...f,
      id: currentId,
      instrumen_version: VERSION_KEY,
      skor_total: total,
      nilai: nilai,
      kategori_label: kat.label,
      status: status,
      updated_at: now,
      created_at: this._editId ? (list.find(x => x.id === this._editId)?.created_at || now) : now
    };

    const idx = list.findIndex(x => x.id === currentId);
    if (idx !== -1) list[idx] = record;
    else list.push(record);
    Store.set('evaluasi', list);

    this._editId = currentId;
    Utils.toast(status === 'final' ? 'Pemantauan difinalisasi' : 'Draft tersimpan', 'success');

    if (status === 'final') {
      this._view = 'list';
      this._editId = null;
      this._formData = null;
    } else {
      this._formData = record;
    }
    Router.navigate('evaluasi');
  },

  // ============================================
  // PRINT
  // ============================================
  _print(id) {
    const e = (Store.get('evaluasi') || []).find(x => x.id === id);
    if (!e) return;
    const c = Store.config();

    // Group by aspek
    const aspekRows = ASPEK_LIST.map(aspek => {
      const items = INSTRUMEN_PEMANTAUAN_KS.filter(i => i.aspek === aspek);
      const rows = items.map(ind => {
        const skor = (e.skor || {})[ind.kode] || 0;
        const cat = (e.catatan || {})[ind.kode] || '';
        return `<tr>
          <td style="text-align:center;font-family:monospace;font-weight:600">${ind.kode}</td>
          <td style="font-size:9.5pt">${Utils.esc(ind.teks)}</td>
          <td style="text-align:center;font-weight:700">${skor}</td>
          <td style="font-size:8.5pt">${Utils.esc(cat)}</td>
          <td style="font-size:8pt;color:#64748b">${Utils.esc(ind.bukti)}</td>
        </tr>`;
      }).join('');
      return `
        <tr><td colspan="5" style="background:#f1f5f9;padding:.4rem .5rem;font-weight:700;font-size:9.5pt">${Utils.esc(aspek)}</td></tr>
        ${rows}
      `;
    }).join('');

    const total = hitungTotal(e.skor || {});
    const nilai = hitungNilai(e.skor || {});
    const kat = getKategori(nilai);

    Utils.el('printArea').innerHTML = `
      <h1 style="text-align:center;font-size:13pt;margin:0 0 2px">INSTRUMEN PEMANTAUAN SUPERVISI AKADEMIK KEPALA SEKOLAH DASAR</h1>
      <p style="text-align:center;font-size:10pt;margin:0 0 1rem">TAHUN PELAJARAN ${(e.semester || '').split('-')[0] || '—'}</p>

      <table class="info">
        <tr><td style="width:160px">Nama Sekolah / SD</td><td>:</td><td>${Utils.esc(e.nama_sekolah || '-')}</td></tr>
        <tr><td>Nama Kepala Sekolah</td><td>:</td><td>${Utils.esc(e.ks_nama || '-')}</td></tr>
        <tr><td>Nama Pengawas Sekolah</td><td>:</td><td>${Utils.esc(e.nama_pengawas || c.nama_pengawas || '-')}</td></tr>
        <tr><td>Semester / Tahun</td><td>:</td><td>${Utils.esc(e.semester || '-')}</td></tr>
      </table>

      <div style="margin-bottom:.75rem;font-size:8.5pt;line-height:1.5;padding:.4rem .6rem;background:#f8fafc;border-radius:4px">
        <strong>Keterangan Skala Skor:</strong><br>
        ${SKALA_PEMANTAUAN_KS.map(s => `<strong>${s.skor} (${s.label}):</strong> ${s.deskripsi}`).join('<br>')}
      </div>

      <table class="ind">
        <thead><tr>
          <th style="width:36px;text-align:center">No</th>
          <th>Aspek yang Dipantau / Indikator Kinerja</th>
          <th style="width:40px;text-align:center">Skor<br>(1-4)</th>
          <th style="width:120px">Catatan Pengawas</th>
          <th style="width:130px">Bukti Fisik / Dokumen Acuan</th>
        </tr></thead>
        <tbody>${aspekRows}</tbody>
      </table>

      <table class="info" style="margin-top:.75rem">
        <tr><td style="width:160px">Jumlah Skor Yang Diperoleh</td><td>:</td><td><strong>${total}</strong></td></tr>
        <tr><td>Skor Maksimal</td><td>:</td><td>${MAX_SKOR_PEMANTAUAN_KS} (18 Indikator × 4)</td></tr>
        <tr><td>Nilai Akhir Pemantauan</td><td>:</td><td><strong>${nilai.toFixed(1)}</strong> — <strong>${kat.label}</strong></td></tr>
      </table>

      <h2 style="margin-top:1rem">Catatan dan Rekomendasi Pengawas Sekolah</h2>
      <div style="min-height:80px;padding:.5rem;border:1px solid #e2e8f0;border-radius:4px;font-size:9.5pt;white-space:pre-wrap">${Utils.esc(e.catatan_rekomendasi || '')}</div>

      <div class="ttd-grid" style="margin-top:1.5rem">
        <div class="ttd-box">
          <div>Kepala Sekolah,</div>
          <div class="ttd-space"></div>
          <div class="ttd-name">( ${Utils.esc(e.ks_nama || '................................')} )</div>
          <div style="font-size:8.5pt;color:#64748b">NIP. ..............................................</div>
        </div>
        <div class="ttd-box">
          <div>Pengawas Sekolah,</div>
          <div class="ttd-space"></div>
          <div class="ttd-name">( ${Utils.esc(e.nama_pengawas || c.nama_pengawas || '................................')} )</div>
          <div style="font-size:8.5pt;color:#64748b">NIP. ${Utils.esc(c.nip_pengawas || '..............................................')}</div>
        </div>
      </div>`;
    setTimeout(() => window.print(), 200);
  }
};
