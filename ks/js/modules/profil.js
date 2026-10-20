import { Store } from '../../storage.js';
import { Utils } from '../../../shared/js/utils.js';
import { Icons } from '../../../shared/js/icons.js';
import { Router } from '../../../shared/js/router.js';
import { emptyState } from '../helpers.js';

const TIPE_MAP = {
  'Dropout': { kuadran: 'I', pendekatan: 'Directive-Control', teknik: 'Mentoring', color: '#991b1b', bg: '#fee2e2' },
  'Unfocused': { kuadran: 'II', pendekatan: 'Directive-Informational', teknik: 'Mentoring', color: '#92400e', bg: '#fef3c7' },
  'Analytical': { kuadran: 'III', pendekatan: 'Collaborative', teknik: 'Coaching + Mentoring', color: '#4338ca', bg: '#e0e7ff' },
  'Professional': { kuadran: 'IV', pendekatan: 'Non-Directive', teknik: 'Coaching', color: '#166534', bg: '#dcfce7' }
};

export const Profil = {
  _filterTipe: null,

  async render() {
    const guru = Store.get('guru');
    const dist = { Dropout: 0, Unfocused: 0, Analytical: 0, Professional: 0 };
    guru.forEach(g => { if (g.tipe && dist[g.tipe] !== undefined) dist[g.tipe]++; });
    const dinilai = Object.values(dist).reduce((a, b) => a + b, 0);

    const kuadran = `
      <svg viewBox="0 0 300 300" style="width:100%;max-width:340px;display:block;margin:0 auto">
        <!-- Kuadran I: Dropout -->
        <g class="kuadran-cell" data-tipe="Dropout" style="cursor:pointer">
          <rect x="10" y="10" width="140" height="140" fill="#fee2e2" rx="8" stroke="${this._filterTipe === 'Dropout' ? '#991b1b' : 'transparent'}" stroke-width="3"/>
          <text x="80" y="55" text-anchor="middle" font-size="11" font-weight="700" fill="#991b1b">Dropout</text>
          <text x="80" y="90" text-anchor="middle" font-size="32" font-weight="800" fill="#991b1b">${dist.Dropout}</text>
          <text x="80" y="120" text-anchor="middle" font-size="9" fill="#991b1b">Kuadran I</text>
        </g>
        <!-- Kuadran II: Unfocused -->
        <g class="kuadran-cell" data-tipe="Unfocused" style="cursor:pointer">
          <rect x="150" y="10" width="140" height="140" fill="#fef3c7" rx="8" stroke="${this._filterTipe === 'Unfocused' ? '#92400e' : 'transparent'}" stroke-width="3"/>
          <text x="220" y="55" text-anchor="middle" font-size="11" font-weight="700" fill="#92400e">Unfocused</text>
          <text x="220" y="90" text-anchor="middle" font-size="32" font-weight="800" fill="#92400e">${dist.Unfocused}</text>
          <text x="220" y="120" text-anchor="middle" font-size="9" fill="#92400e">Kuadran II</text>
        </g>
        <!-- Kuadran III: Analytical -->
        <g class="kuadran-cell" data-tipe="Analytical" style="cursor:pointer">
          <rect x="10" y="150" width="140" height="140" fill="#e0e7ff" rx="8" stroke="${this._filterTipe === 'Analytical' ? '#4338ca' : 'transparent'}" stroke-width="3"/>
          <text x="80" y="195" text-anchor="middle" font-size="11" font-weight="700" fill="#4338ca">Analytical</text>
          <text x="80" y="230" text-anchor="middle" font-size="32" font-weight="800" fill="#4338ca">${dist.Analytical}</text>
          <text x="80" y="260" text-anchor="middle" font-size="9" fill="#4338ca">Kuadran III</text>
        </g>
        <!-- Kuadran IV: Professional -->
        <g class="kuadran-cell" data-tipe="Professional" style="cursor:pointer">
          <rect x="150" y="150" width="140" height="140" fill="#dcfce7" rx="8" stroke="${this._filterTipe === 'Professional' ? '#166534' : 'transparent'}" stroke-width="3"/>
          <text x="220" y="195" text-anchor="middle" font-size="11" font-weight="700" fill="#166534">Professional</text>
          <text x="220" y="230" text-anchor="middle" font-size="32" font-weight="800" fill="#166534">${dist.Professional}</text>
          <text x="220" y="260" text-anchor="middle" font-size="9" fill="#166534">Kuadran IV</text>
        </g>
      </svg>`;

    return `
      <div class="page-head">
        <div>
          <h2>Profil Tipe Guru</h2>
          <div class="page-sub">${dinilai} dari ${guru.length} guru sudah dinilai</div>
        </div>
      </div>

      <div class="row" style="margin-bottom:1rem">
        <div class="card">
          <div class="card-header">${Icons.svg('target', 18)} Peta Kuadran (Klik untuk Filter)</div>
          <div class="card-body">
            ${kuadran}
            <div style="text-align:center;font-size:.7rem;color:var(--slate-500);margin-top:.75rem;line-height:1.6">
              <strong>Abstraksi Tinggi</strong> (atas) · <strong>Abstraksi Rendah</strong> (bawah)<br>
              <strong>Komitmen Rendah</strong> (kiri) · <strong>Komitmen Tinggi</strong> (kanan)
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">${Icons.svg('info', 18)} Rekomendasi Pendekatan</div>
          <div class="card-body">
            <div style="padding:.65rem;background:#fee2e2;border-radius:8px;margin-bottom:.5rem;font-size:.75rem;font-weight:600;color:#991b1b">DROPOUT → Directive-Control (Mentoring)</div>
            <div style="padding:.65rem;background:#fef3c7;border-radius:8px;margin-bottom:.5rem;font-size:.75rem;font-weight:600;color:#92400e">UNFOCUSED → Directive-Informational (Mentoring)</div>
            <div style="padding:.65rem;background:#e0e7ff;border-radius:8px;margin-bottom:.5rem;font-size:.75rem;font-weight:600;color:#4338ca">ANALYTICAL → Collaborative (Coaching)</div>
            <div style="padding:.65rem;background:#dcfce7;border-radius:8px;font-size:.75rem;font-weight:600;color:#166534">PROFESSIONAL → Non-Directive (Coaching)</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <span>${Icons.svg('users', 18)} Daftar Guru ${this._filterTipe ? `<span class="badge badge-info" style="margin-left:.5rem">Filter: ${this._filterTipe}</span>` : ''}</span>
          ${this._filterTipe ? `<button class="btn btn-ghost btn-sm" id="btnClearFilter">${Icons.svg('x', 14)} Hapus Filter</button>` : ''}
        </div>
        ${guru.length === 0
          ? `<div class="card-body">${emptyState('users', 'Belum ada guru', 'Tambahkan guru dulu di menu Data Guru.')}</div>`
          : `<table>
              <thead><tr>
                <th>Nama</th>
                <th style="text-align:center">Abstraksi</th>
                <th style="text-align:center">Komitmen</th>
                <th style="text-align:center">Tipe</th>
                <th>Pendekatan</th>
                <th style="text-align:right">Aksi</th>
              </tr></thead>
              <tbody>
                ${guru.filter(g => !this._filterTipe || g.tipe === this._filterTipe).map(g => `
                  <tr>
                    <td style="font-weight:600">${Utils.esc(g.nama)}</td>
                    <td style="text-align:center">${g.abstraksi ? `<span class="badge badge-${g.abstraksi === 'tinggi' ? 'success' : 'danger'}">${g.abstraksi === 'tinggi' ? 'Tinggi' : 'Rendah'}</span>` : '<span style="color:var(--slate-400);font-size:.75rem">—</span>'}</td>
                    <td style="text-align:center">${g.komitmen ? `<span class="badge badge-${g.komitmen === 'tinggi' ? 'success' : 'danger'}">${g.komitmen === 'tinggi' ? 'Tinggi' : 'Rendah'}</span>` : '<span style="color:var(--slate-400);font-size:.75rem">—</span>'}</td>
                    <td style="text-align:center">${g.tipe ? `<span class="badge badge-info">${g.tipe}</span>` : '<span style="color:var(--slate-400);font-size:.75rem">Belum</span>'}</td>
                    <td style="font-size:.85rem">${Utils.esc(g.pendekatan || '—')}</td>
                    <td style="text-align:right">
                      <button class="btn btn-primary btn-sm" data-eval="${g.id}">${Icons.svg('pencil', 14)} ${g.tipe ? 'Ubah' : 'Nilai'}</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>`
        }
      </div>
    `;
  },

  async bind() {
    // Klik kuadran untuk filter
    document.querySelectorAll('.kuadran-cell').forEach(cell => {
      cell.onclick = () => {
        this._filterTipe = this._filterTipe === cell.dataset.tipe ? null : cell.dataset.tipe;
        Router.navigate('profil');
      };
    });

    Utils.el('btnClearFilter')?.addEventListener('click', () => {
      this._filterTipe = null;
      Router.navigate('profil');
    });

    document.querySelectorAll('[data-eval]').forEach(btn => {
      btn.onclick = () => this.form(btn.dataset.eval);
    });
  },

  form(id) {
    const g = Store.get('guru').find(x => x.id === id);
    if (!g) return;

    const getDefaultPeriode = () => {
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth() + 1;
      return m >= 7 ? `${y}/${y + 1}-Ganjil` : `${y - 1}/${y}-Genap`;
    };

    Utils.modal(`Nilai Profil — ${g.nama}`, `
      <div class="form-group">
        <label class="label">Periode Penilaian</label>
        <input class="input" id="fPeriode" value="${Utils.esc(g.periode_tipe || getDefaultPeriode())}" placeholder="2025/2026-Ganjil">
      </div>

      <div class="form-group">
        <label class="label">Catatan Observasi & Kesenjangan</label>
        <textarea class="textarea" id="fCatObs" rows="2" placeholder="Contoh: Murid pasif saat diskusi, guru dominan ceramah...">${Utils.esc(g.catatan_observasi || '')}</textarea>
      </div>

      <div style="padding:1rem;background:var(--slate-50);border-radius:8px;margin-bottom:.75rem">
        <label class="label">Level Abstraksi</label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-bottom:.75rem">
          <label class="cbx" style="text-align:left">
            <input type="radio" name="abs" value="rendah" ${g.abstraksi === 'rendah' ? 'checked' : ''}>
            <div><strong style="font-size:.85rem">Rendah</strong><div style="font-size:.7rem;color:var(--slate-500)">Tidak mampu analisis masalah</div></div>
          </label>
          <label class="cbx" style="text-align:left">
            <input type="radio" name="abs" value="tinggi" ${g.abstraksi === 'tinggi' ? 'checked' : ''}>
            <div><strong style="font-size:.85rem">Tinggi</strong><div style="font-size:.7rem;color:var(--slate-500)">Mampu analisis & cari solusi</div></div>
          </label>
        </div>
        <textarea class="textarea" id="fCatAbs" rows="2" style="font-size:.8rem" placeholder="Bukti/kutipan abstraksi...">${Utils.esc(g.catatan_abstraksi || '')}</textarea>
      </div>

      <div style="padding:1rem;background:var(--slate-50);border-radius:8px;margin-bottom:.75rem">
        <label class="label">Level Komitmen</label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-bottom:.75rem">
          <label class="cbx" style="text-align:left">
            <input type="radio" name="kom" value="rendah" ${g.komitmen === 'rendah' ? 'checked' : ''}>
            <div><strong style="font-size:.85rem">Rendah</strong><div style="font-size:.7rem;color:var(--slate-500)">Tidak bersedia waktu</div></div>
          </label>
          <label class="cbx" style="text-align:left">
            <input type="radio" name="kom" value="tinggi" ${g.komitmen === 'tinggi' ? 'checked' : ''}>
            <div><strong style="font-size:.85rem">Tinggi</strong><div style="font-size:.7rem;color:var(--slate-500)">Bersedia & berkomitmen</div></div>
          </label>
        </div>
        <textarea class="textarea" id="fCatKom" rows="2" style="font-size:.8rem" placeholder="Bukti/kutipan komitmen...">${Utils.esc(g.catatan_komitmen || '')}</textarea>
      </div>

      <div id="previewProfil" style="padding:1rem;border-radius:8px;background:var(--brand-50);border:2px dashed var(--brand-500)"></div>
    `, `<button class="btn btn-secondary" onclick="Utils.closeModal()">Batal</button><button class="btn btn-primary" id="btnSaveProfil">${Icons.svg('save', 16)} Simpan</button>`);

    const updatePreview = () => {
      const ab = document.querySelector('input[name="abs"]:checked')?.value;
      const ko = document.querySelector('input[name="kom"]:checked')?.value;
      const box = Utils.el('previewProfil');
      if (!ab || !ko) {
        box.innerHTML = '<div style="font-size:.8rem;color:var(--slate-500);text-align:center">Pilih kedua level untuk melihat hasil</div>';
        return;
      }
      let t = 'Dropout';
      if (ab === 'tinggi' && ko === 'tinggi') t = 'Professional';
      else if (ab === 'tinggi' && ko === 'rendah') t = 'Analytical';
      else if (ab === 'rendah' && ko === 'tinggi') t = 'Unfocused';
      const meta = TIPE_MAP[t];
      box.innerHTML = `
        <div style="font-size:.7rem;color:${meta.color};font-weight:700;text-transform:uppercase">Hasil — Kuadran ${meta.kuadran}</div>
        <div style="font-size:1.1rem;font-weight:700;margin-top:.25rem;color:${meta.color}">${t}</div>
        <div style="font-size:.85rem;margin-top:.35rem"><strong>Pendekatan:</strong> ${meta.pendekatan}</div>
        <div style="font-size:.8rem;color:var(--slate-600);margin-top:.15rem">Teknik: ${meta.teknik}</div>
      `;
    };

    document.querySelectorAll('input[name="abs"], input[name="kom"]').forEach(r => {
      r.onchange = () => {
        // Update visual cbx
        document.querySelectorAll('input[name="abs"]').forEach(x => x.closest('label').style.borderColor = x.checked ? 'var(--brand-500)' : 'var(--slate-200)');
        document.querySelectorAll('input[name="kom"]').forEach(x => x.closest('label').style.borderColor = x.checked ? 'var(--brand-500)' : 'var(--slate-200)');
        updatePreview();
      };
    });
    // Init visual
    document.querySelectorAll('input[name="abs"]').forEach(x => x.closest('label').style.borderColor = x.checked ? 'var(--brand-500)' : 'var(--slate-200)');
    document.querySelectorAll('input[name="kom"]').forEach(x => x.closest('label').style.borderColor = x.checked ? 'var(--brand-500)' : 'var(--slate-200)');
    updatePreview();

    Utils.el('btnSaveProfil').onclick = () => {
      const ab = document.querySelector('input[name="abs"]:checked')?.value;
      const ko = document.querySelector('input[name="kom"]:checked')?.value;
      if (!ab) return Utils.toast('Pilih level abstraksi', 'error');
      if (!ko) return Utils.toast('Pilih level komitmen', 'error');

      let t = 'Dropout';
      if (ab === 'tinggi' && ko === 'tinggi') t = 'Professional';
      else if (ab === 'tinggi' && ko === 'rendah') t = 'Analytical';
      else if (ab === 'rendah' && ko === 'tinggi') t = 'Unfocused';

      const list = Store.get('guru');
      const idx = list.findIndex(x => x.id === id);
      if (idx !== -1) {
        list[idx] = {
          ...list[idx],
          abstraksi: ab,
          komitmen: ko,
          tipe: t,
          pendekatan: TIPE_MAP[t].pendekatan,
          catatan_observasi: Utils.el('fCatObs').value.trim(),
          catatan_abstraksi: Utils.el('fCatAbs').value.trim(),
          catatan_komitmen: Utils.el('fCatKom').value.trim(),
          periode_tipe: Utils.el('fPeriode').value.trim()
        };
        Store.set('guru', list);
      }
      Utils.closeModal();
      Router.navigate('profil');
      Utils.toast('Profil tersimpan', 'success');
    };
  }
};
