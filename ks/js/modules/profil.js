import { Store } from '../../storage.js';
import { Utils } from '../../../shared/js/utils.js';
import { Icons } from '../../../shared/js/icons.js';
import { Router } from '../../../shared/js/router.js';
import { emptyState } from '../helpers.js';

export const Profil = {
  async render() {
    const guru = Store.get('guru');
    const dist = { Dropout: 0, Unfocused: 0, Analytical: 0, Professional: 0 };
    guru.forEach(g => { if (g.tipe && dist[g.tipe] !== undefined) dist[g.tipe]++; });

    const kuadran = `
      <svg viewBox="0 0 300 300" style="width:100%;max-width:280px;display:block;margin:0 auto">
        <rect x="10" y="10" width="140" height="140" fill="#fee2e2" rx="6"/>
        <rect x="150" y="10" width="140" height="140" fill="#fef3c7" rx="6"/>
        <rect x="10" y="150" width="140" height="140" fill="#e0e7ff" rx="6"/>
        <rect x="150" y="150" width="140" height="140" fill="#dcfce7" rx="6"/>
        <text x="80" y="55" text-anchor="middle" font-size="11" font-weight="700" fill="#991b1b">Dropout</text>
        <text x="80" y="75" text-anchor="middle" font-size="18" font-weight="800" fill="#991b1b">${dist.Dropout}</text>
        <text x="80" y="92" text-anchor="middle" font-size="9" fill="#991b1b">Komitmen R</text>
        <text x="80" y="104" text-anchor="middle" font-size="9" fill="#991b1b">Abstraksi R</text>
        <text x="220" y="55" text-anchor="middle" font-size="11" font-weight="700" fill="#92400e">Unfocused</text>
        <text x="220" y="75" text-anchor="middle" font-size="18" font-weight="800" fill="#92400e">${dist.Unfocused}</text>
        <text x="220" y="92" text-anchor="middle" font-size="9" fill="#92400e">Komitmen T</text>
        <text x="220" y="104" text-anchor="middle" font-size="9" fill="#92400e">Abstraksi R</text>
        <text x="80" y="195" text-anchor="middle" font-size="11" font-weight="700" fill="#4338ca">Analytical</text>
        <text x="80" y="215" text-anchor="middle" font-size="18" font-weight="800" fill="#4338ca">${dist.Analytical}</text>
        <text x="80" y="232" text-anchor="middle" font-size="9" fill="#4338ca">Komitmen R</text>
        <text x="80" y="244" text-anchor="middle" font-size="9" fill="#4338ca">Abstraksi T</text>
        <text x="220" y="195" text-anchor="middle" font-size="11" font-weight="700" fill="#166534">Professional</text>
        <text x="220" y="215" text-anchor="middle" font-size="18" font-weight="800" fill="#166534">${dist.Professional}</text>
        <text x="220" y="232" text-anchor="middle" font-size="9" fill="#166534">Komitmen T</text>
        <text x="220" y="244" text-anchor="middle" font-size="9" fill="#166534">Abstraksi T</text>
      </svg>`;

    return `
      <div class="page-head">
        <div>
          <h2>Profil Tipe Guru</h2>
          <div class="page-sub">Tentukan tipe (Glickman) untuk pendekatan supervisi</div>
        </div>
      </div>

      <div class="row" style="margin-bottom:1rem">
        <div class="card">
          <div class="card-header">${Icons.svg('target', 18)} Peta Kuadran</div>
          <div class="card-body">
            ${kuadran}
            <div style="text-align:center;font-size:.75rem;color:var(--slate-500);margin-top:.75rem">Abstraksi ↑ · Komitmen →</div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">${Icons.svg('info', 18)} Rekomendasi Pendekatan</div>
          <div class="card-body">
            <div style="padding:.65rem;background:#fee2e2;border-radius:8px;margin-bottom:.5rem"><div style="font-size:.75rem;font-weight:600;color:#991b1b">DROPOUT → Directive-Control (Mentoring)</div></div>
            <div style="padding:.65rem;background:#fef3c7;border-radius:8px;margin-bottom:.5rem"><div style="font-size:.75rem;font-weight:600;color:#92400e">UNFOCUSED → Directive-Informational (Mentoring)</div></div>
            <div style="padding:.65rem;background:#e0e7ff;border-radius:8px;margin-bottom:.5rem"><div style="font-size:.75rem;font-weight:600;color:#4338ca">ANALYTICAL → Collaborative (Coaching)</div></div>
            <div style="padding:.65rem;background:#dcfce7;border-radius:8px"><div style="font-size:.75rem;font-weight:600;color:#166534">PROFESSIONAL → Non-Directive (Coaching)</div></div>
          </div>
        </div>
      </div>

      <div class="card">
        ${guru.length === 0
          ? `<div class="card-body">${emptyState('users', 'Belum ada guru', 'Tambahkan guru dulu di menu Data Guru.')}</div>`
          : `<table>
              <thead><tr>
                <th>Nama</th>
                <th style="text-align:center">Tipe</th>
                <th>Pendekatan</th>
                <th style="text-align:right">Aksi</th>
              </tr></thead>
              <tbody>${guru.map(g => `
                <tr>
                  <td style="font-weight:600">${Utils.esc(g.nama)}</td>
                  <td style="text-align:center">${g.tipe ? `<span class="badge badge-info">${g.tipe}</span>` : '<span style="color:var(--slate-400);font-size:.75rem">—</span>'}</td>
                  <td style="font-size:.85rem">${Utils.esc(g.pendekatan || '—')}</td>
                  <td style="text-align:right">
                    <button class="btn btn-primary btn-sm" data-eval="${g.id}">${Icons.svg('pencil', 14)} ${g.tipe ? 'Ubah' : 'Nilai'}</button>
                  </td>
                </tr>
              `).join('')}</tbody>
            </table>`
        }
      </div>
    `;
  },

  async bind() {
    document.querySelectorAll('[data-eval]').forEach(btn => {
      btn.onclick = () => Profil.form(btn.dataset.eval);
    });
  },

  form(id) {
    const g = Store.get('guru').find(x => x.id === id);
    if (!g) return;

    Utils.modal(`Nilai Profil — ${g.nama}`, `
      <div class="form-group">
        <label class="label">Level Abstraksi</label>
        <select class="select" id="fab">
          <option value="rendah" ${g.abstraksi === 'rendah' ? 'selected' : ''}>Rendah (tidak mampu analisis masalah)</option>
          <option value="tinggi" ${g.abstraksi === 'tinggi' ? 'selected' : ''}>Tinggi (mampu analisis & cari solusi)</option>
        </select>
      </div>
      <div class="form-group">
        <label class="label">Level Komitmen</label>
        <select class="select" id="fko">
          <option value="rendah" ${g.komitmen === 'rendah' ? 'selected' : ''}>Rendah (tidak bersedia waktu)</option>
          <option value="tinggi" ${g.komitmen === 'tinggi' ? 'selected' : ''}>Tinggi (bersedia waktu & berkomitmen)</option>
        </select>
      </div>
      <div id="previewProfil" style="padding:1rem;border-radius:8px;background:var(--brand-50);border:2px dashed var(--brand-500);margin-top:.5rem"></div>
    `, `<button class="btn btn-secondary" onclick="Utils.closeModal()">Batal</button><button class="btn btn-primary" id="btnSaveProfil">${Icons.svg('save', 16)} Simpan</button>`);

    const updatePreview = () => {
      const ab = Utils.el('fab').value;
      const ko = Utils.el('fko').value;
      let t = 'Dropout', p = 'Directive-Control (Mentoring)', desc = 'Arahan langsung & kontrol ketat.';
      if (ab === 'tinggi' && ko === 'tinggi') { t = 'Professional'; p = 'Non-Directive (Coaching)'; desc = 'Beri kebebasan penuh, fasilitasi dengan pertanyaan.'; }
      else if (ab === 'tinggi' && ko === 'rendah') { t = 'Analytical'; p = 'Collaborative (Coaching)'; desc = 'Kolaborasi untuk membangun komitmen.'; }
      else if (ab === 'rendah' && ko === 'tinggi') { t = 'Unfocused'; p = 'Directive-Informational (Mentoring)'; desc = 'Beri pilihan solusi terbatas.'; }
      Utils.el('previewProfil').innerHTML = `
        <div style="font-size:.7rem;color:var(--brand-700);font-weight:600;text-transform:uppercase">Hasil</div>
        <div style="font-size:1.1rem;font-weight:700;margin-top:.25rem">${t}</div>
        <div style="font-size:.85rem;color:var(--slate-700);margin-top:.25rem"><strong>Pendekatan:</strong> ${p}</div>
        <div style="font-size:.8rem;color:var(--slate-600);margin-top:.25rem">${desc}</div>`;
    };
    Utils.el('fab').onchange = updatePreview;
    Utils.el('fko').onchange = updatePreview;
    updatePreview();

    Utils.el('btnSaveProfil').onclick = () => {
      const ab = Utils.el('fab').value;
      const ko = Utils.el('fko').value;
      let t = 'Dropout', p = 'Directive-Control';
      if (ab === 'tinggi' && ko === 'tinggi') { t = 'Professional'; p = 'Non-Directive'; }
      else if (ab === 'tinggi' && ko === 'rendah') { t = 'Analytical'; p = 'Collaborative'; }
      else if (ab === 'rendah' && ko === 'tinggi') { t = 'Unfocused'; p = 'Directive-Informational'; }
      const list = Store.get('guru');
      const idx = list.findIndex(x => x.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], abstraksi: ab, komitmen: ko, tipe: t, pendekatan: p };
        Store.set('guru', list);
      }
      Utils.closeModal();
      Router.navigate('profil');
      Utils.toast('Profil tersimpan', 'success');
    };
  }
};
