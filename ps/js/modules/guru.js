import { Store } from '../../storage.js';
import { Utils } from '../../../shared/js/utils.js';
import { Icons } from '../../../shared/js/icons.js';
import { emptyState, allGuru } from '../helpers.js';

export const Guru = {
  async render() {
    const sekolah = Store.get('sekolah');
    const guru = allGuru();

    return `
      <div class="page-head">
        <div>
          <h2>Data Guru Lintas Sekolah</h2>
          <div class="page-sub">${guru.length} guru dari ${sekolah.length} sekolah</div>
        </div>
      </div>

      ${guru.length === 0 ? `<div class="card"><div class="card-body">
        ${emptyState('users', 'Belum ada data guru', 'Import file JSON dari KS untuk menampilkan data guru.')}
      </div></div>` : `
        <div class="card"><div class="card-body" style="padding:.75rem">
          <div style="display:grid;grid-template-columns:2fr 1.5fr 1.5fr 2fr auto;gap:.5rem;align-items:end">
            <div><label class="label">Sekolah</label><select class="select" id="fSk">
              <option value="">Semua Sekolah</option>
              ${sekolah.map(sk => `<option value="${sk.id}">${Utils.esc(sk.nama_sekolah)}</option>`).join('')}
            </select></div>
            <div><label class="label">Tipe</label><select class="select" id="fTipe">
              <option value="">Semua Tipe</option>
              <option value="Dropout">Dropout</option>
              <option value="Unfocused">Unfocused</option>
              <option value="Analytical">Analytical</option>
              <option value="Professional">Professional</option>
              <option value="__none">Belum Dinilai</option>
            </select></div>
            <div><label class="label">Coverage</label><select class="select" id="fCoverage">
              <option value="">Semua</option>
              <option value="none">Belum Disupervisi</option>
              <option value="partial">Sudah (belum lengkap)</option>
              <option value="full">Lengkap (3 Jenis)</option>
            </select></div>
            <div><label class="label">Cari</label><input class="input" id="fQ" placeholder="Nama / mapel / NIP..."></div>
            <div><button class="btn btn-ghost" id="btnReset">${Icons.svg('x', 14)}</button></div>
          </div>
        </div></div>
        <div class="card"><div id="guruList"></div></div>
      `}
    `;
  },

  async bind() {
    if (Store.get('sekolah').length === 0) return;
    const redraw = () => this._draw();
    Utils.el('fSk').onchange = redraw;
    Utils.el('fTipe').onchange = redraw;
    Utils.el('fCoverage').onchange = redraw;
    Utils.el('fQ').oninput = Utils.debounce(redraw, 150);
    Utils.el('btnReset').onclick = () => {
      Utils.el('fSk').value = '';
      Utils.el('fTipe').value = '';
      Utils.el('fCoverage').value = '';
      Utils.el('fQ').value = '';
      redraw();
    };
    this._draw();
  },

  _draw() {
    const box = Utils.el('guruList');
    if (!box) return;
    const skF = Utils.el('fSk').value;
    const tF = Utils.el('fTipe').value;
    const covF = Utils.el('fCoverage').value;
    const q = Utils.el('fQ').value.toLowerCase().trim();
    let list = allGuru();
    if (skF) list = list.filter(g => g._skId === skF);
    if (tF === '__none') list = list.filter(g => !g.tipe);
    else if (tF) list = list.filter(g => g.tipe === tF);
    if (q) list = list.filter(g =>
      (g.nama || '').toLowerCase().includes(q) ||
      (g.mapel || '').toLowerCase().includes(q) ||
      (g.nip || '').includes(q)
    );

    // Coverage filter
    if (covF) {
      list = list.filter(g => {
        const sk = Store.get('sekolah').find(x => x.id === g._skId);
        const n3 = (sk?.supervisi || []).some(s => s.gid === g.id);
        const nA = (sk?.akademik || []).some(s => s.gid === g.id);
        const nC = (sk?.coaching || []).some(s => s.gid === g.id);
        const typesCovered = [n3, nA, nC].filter(Boolean).length;
        if (covF === 'none') return typesCovered === 0;
        if (covF === 'partial') return typesCovered > 0 && typesCovered < 3;
        if (covF === 'full') return typesCovered === 3;
        return true;
      });
    }

    if (list.length === 0) {
      box.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--slate-400);font-size:.85rem">Tidak ada guru yang cocok</div>';
      return;
    }
    list.sort((a, b) => a._skNama.localeCompare(b._skNama) || a.nama.localeCompare(b.nama));

    box.innerHTML = `<table><thead><tr>
      <th>Sekolah</th><th>Nama / NIP</th><th>Mapel</th>
      <th style="text-align:center">Tipe</th>
      <th style="text-align:center">Coverage</th>
      <th style="text-align:right">Aksi</th>
    </tr></thead><tbody>${list.map(g => {
      const sk = Store.get('sekolah').find(x => x.id === g._skId);
      const n3 = (sk?.supervisi || []).filter(s => s.gid === g.id).length;
      const nA = (sk?.akademik || []).filter(s => s.gid === g.id).length;
      const nC = (sk?.coaching || []).filter(s => s.gid === g.id).length;
      const has3 = n3 > 0, hasAk = nA > 0, hasCo = nC > 0;
      const typesCovered = [has3, hasAk, hasCo].filter(Boolean).length;
      const covColor = typesCovered === 3 ? 'success' : typesCovered > 0 ? 'warning' : 'danger';
      const covLabel = typesCovered === 3 ? 'Lengkap' : typesCovered > 0 ? 'Partial' : 'Belum';

      // Render mini icons untuk 3 jenis
      const icon3T = has3
        ? `<span title="Supervisi 3T: ${n3}x" style="color:var(--success)">${Icons.svg('check-circle', 16)}</span>`
        : `<span title="Belum 3T" style="color:var(--slate-300)">${Icons.svg('circle', 16)}</span>`;
      const iconAkad = hasAk
        ? `<span title="Akademik: ${nA}x" style="color:var(--info)">${Icons.svg('check-circle', 16)}</span>`
        : `<span title="Belum Akademik" style="color:var(--slate-300)">${Icons.svg('circle', 16)}</span>`;
      const iconCoach = hasCo
        ? `<span title="Coaching: ${nC}x" style="color:var(--warning)">${Icons.svg('check-circle', 16)}</span>`
        : `<span title="Belum Coaching" style="color:var(--slate-300)">${Icons.svg('circle', 16)}</span>`;

      return `<tr>
        <td style="font-size:.8rem;color:var(--slate-600)">${Utils.esc(g._skNama)}</td>
        <td><div style="font-weight:600">${Utils.esc(g.nama)}</div><div style="font-size:.7rem;color:var(--slate-500);font-family:monospace">${Utils.esc(g.nip || '-')}</div></td>
        <td style="font-size:.85rem">${Utils.esc(g.mapel || '-')}${g.kelas ? ' · Kls ' + Utils.esc(g.kelas) : ''}</td>
        <td style="text-align:center">${g.tipe ? `<span class="badge badge-info">${g.tipe}</span>` : '<span style="color:var(--slate-400);font-size:.75rem">—</span>'}</td>
        <td style="text-align:center">
          <div style="display:flex;gap:.35rem;justify-content:center;align-items:center;margin-bottom:.25rem">
            ${icon3T}${iconAkad}${iconCoach}
          </div>
          <span class="badge badge-${covColor}" style="font-size:.65rem">${covLabel}</span>
        </td>
        <td style="text-align:right"><button class="btn btn-secondary btn-sm" data-detail="${g._skId}:${g.id}">${Icons.svg('eye', 14)} Detail</button></td>
      </tr>`;
    }).join('')}</tbody></table>`;

    box.querySelectorAll('[data-detail]').forEach(b => {
      b.onclick = () => {
        const [skId, gid] = b.dataset.detail.split(':');
        this._detail(skId, gid);
      };
    });
  },

  _detail(skId, gid) {
    const sk = Store.get('sekolah').find(x => x.id === skId);
    if (!sk) return;
    const g = (sk.guru || []).find(x => x.id === gid);
    if (!g) return;
    const sup = (sk.supervisi || []).filter(s => s.gid === gid);
    const ak = (sk.akademik || []).filter(s => s.gid === gid);
    const co = (sk.coaching || []).filter(s => s.gid === gid);
    const sesiRow = (s, jenis) => {
      const badge = jenis === 'Akademik' ? 'info' : jenis === 'Coaching' ? 'warning' : 'neutral';
      const skor = s.skor !== undefined ? `${s.skor}${jenis === 'Akademik' ? '/76' : jenis === 'Coaching' ? '/32' : ''}` : '';
      return `<div style="display:flex;justify-content:space-between;padding:.5rem .85rem;border-bottom:1px solid var(--slate-100);font-size:.85rem">
        <div><span class="badge badge-${badge}" style="font-size:.65rem">${jenis}</span> ${Utils.date(s.tgl)}</div>
        <div style="color:var(--slate-500)">${skor}</div>
      </div>`;
    };
    Utils.modal(g.nama, `
      <div style="font-size:.85rem;margin-bottom:1rem;line-height:1.6">
        <div><strong>Sekolah:</strong> ${Utils.esc(sk.nama_sekolah)}</div>
        <div><strong>NIP:</strong> ${Utils.esc(g.nip || '-')}</div>
        <div><strong>Mapel:</strong> ${Utils.esc(g.mapel || '-')}${g.kelas ? ' · Kls ' + Utils.esc(g.kelas) : ''}</div>
        <div><strong>Kepegawaian:</strong> ${Utils.esc(g.peg || '-')}</div>
        <div><strong>Tipe:</strong> ${g.tipe || '<span style="color:var(--slate-400)">belum dinilai</span>'}</div>
        ${g.pendekatan ? `<div><strong>Pendekatan:</strong> ${Utils.esc(g.pendekatan)}</div>` : ''}
      </div>
      <div style="font-weight:600;font-size:.85rem;margin-bottom:.5rem">Riwayat Supervisi (${sup.length + ak.length + co.length})</div>
      <div style="border:1px solid var(--slate-200);border-radius:8px;max-height:300px;overflow-y:auto">
        ${(sup.length + ak.length + co.length) === 0
          ? '<div style="padding:1rem;text-align:center;color:var(--slate-400);font-size:.8rem">Belum ada supervisi</div>'
          : [...sup.map(s => ({ s, j: '3 Tahap' })), ...ak.map(s => ({ s, j: 'Akademik' })), ...co.map(s => ({ s, j: 'Coaching' }))]
            .sort((a, b) => (b.s.tgl || '').localeCompare(a.s.tgl || ''))
            .map(x => sesiRow(x.s, x.j)).join('')}
      </div>
    `, '<button class="btn btn-secondary" onclick="Utils.closeModal()">Tutup</button>', true);
  }
};
