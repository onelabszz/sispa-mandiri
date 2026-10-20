import { Store } from '../../storage.js';
import { Utils } from '../../../shared/js/utils.js';
import { Icons } from '../../../shared/js/icons.js';
import { Router } from '../../../shared/js/router.js';
import { Supabase } from '../../../shared/js/supabase.js';
import { emptyState, infoBanner } from '../helpers.js';

export const Sekolah = {
  async render() {
    const list = Store.get('sekolah');
    return `
      <div class="page-head">
        <div>
          <h2>Sekolah Binaan</h2>
          <div class="page-sub">${list.length} sekolah terdaftar di perangkat ini</div>
        </div>
        <div style="display:flex;gap:.5rem;flex-wrap:wrap">
          <input type="file" id="csvFileSek" accept=".csv" style="display:none">
          <button class="btn btn-secondary" id="btnImportCSV">${Icons.svg('upload', 16)} Impor CSV</button>
          <button class="btn btn-secondary" id="btnPickDB">${Icons.svg('database', 16)} Pilih dari DB</button>
          <button class="btn btn-primary" id="btnImportJSON">${Icons.svg('file-json', 16)} Import JSON KS</button>
        </div>
      </div>

      ${list.length === 0 ? `<div class="card"><div class="card-body">
        ${emptyState('school', 'Belum ada sekolah', 'Tambahkan sekolah binaan dengan mengambil dari database, impor CSV, atau impor file JSON dari KS.',
          `<div style="display:flex;gap:.5rem;justify-content:center;margin-top:1rem">
             <button class="btn btn-secondary" id="btnEmptyPickDB">${Icons.svg('database', 16)} Pilih dari DB</button>
             <button class="btn btn-primary" id="btnEmptyImportJSON">${Icons.svg('file-json', 16)} Import JSON</button>
           </div>`)}
      </div></div>` : `
        <div class="card"><table>
          <thead><tr>
            <th>Sekolah</th>
            <th>Kepala Sekolah</th>
            <th style="text-align:center">Guru</th>
            <th style="text-align:center">Sesi</th>
            <th>Terakhir Sync</th>
            <th style="text-align:right">Aksi</th>
          </tr></thead>
          <tbody>${list.map(sk => {
            const sesi = (sk.supervisi || []).length + (sk.akademik || []).length + (sk.coaching || []).length;
            const days = Utils.daysAgo(sk.updated_at);
            const stale = days === null || days > 30;
            return `<tr>
              <td>
                <div style="font-weight:600">${Utils.esc(sk.nama_sekolah)}</div>
                <div style="font-size:.75rem;color:var(--slate-500);font-family:monospace">NPSN ${Utils.esc(sk.npsn || '-')}</div>
              </td>
              <td style="font-size:.85rem">${Utils.esc(sk.ks_nama || '—')}<div style="font-size:.7rem;color:var(--slate-500);font-family:monospace">${Utils.esc(sk.ks_nip || '')}</div></td>
              <td style="text-align:center;font-weight:600">${(sk.guru || []).length}</td>
              <td style="text-align:center;font-weight:600">${sesi}</td>
              <td><span class="badge ${stale ? 'badge-warning' : 'badge-success'}">${Utils.relTime(sk.updated_at)}</span></td>
              <td style="text-align:right;white-space:nowrap">
                <button class="btn btn-secondary btn-sm" data-view="${sk.id}">${Icons.svg('eye', 14)} Detail</button>
                <button class="btn btn-danger btn-sm" data-del="${sk.id}">${Icons.svg('trash-2', 14)}</button>
              </td>
            </tr>`;
          }).join('')}</tbody>
        </table></div>
      `}
    `;
  },

  async bind() {
    // Tombol Top Bar
    Utils.el('btnImportJSON')?.addEventListener('click', () => this.startImportJSON());
    Utils.el('btnEmptyImportJSON')?.addEventListener('click', () => this.startImportJSON());
    
    Utils.el('btnPickDB')?.addEventListener('click', () => this.pickFromDB());
    Utils.el('btnEmptyPickDB')?.addEventListener('click', () => this.pickFromDB());
    
    Utils.el('btnImportCSV')?.addEventListener('click', () => Utils.el('csvFileSek').click());
    Utils.el('csvFileSek')?.addEventListener('change', (e) => this.handleCSV(e));

    // Tombol Tabel
    document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => this.detail(b.dataset.view));
    document.querySelectorAll('[data-del]').forEach(b => b.onclick = () => this.hapus(b.dataset.del));
  },

  // ==========================================
  // 1. PILIH DARI DATABASE (SUPABASE)
  // ==========================================
  async pickFromDB() {
    Utils.modal('Pilih Sekolah dari Database', `
      <div style="text-align:center;padding:2rem;color:var(--slate-500)">
        <div class="skeleton" style="width:40px;height:40px;border-radius:50%;margin:0 auto 1rem"></div>
        Memuat data dari Supabase...
      </div>
    `, '<button class="btn btn-secondary" onclick="Utils.closeModal()">Tutup</button>', true);

    try {
      const allSchools = await Supabase.getAllSekolah();
      const localSchools = Store.get('sekolah');
      const localNpsns = new Set(localSchools.map(s => s.npsn));
      
      // Filter hanya sekolah yang belum ada di lokal
      const available = allSchools.filter(s => !localNpsns.has(s.npsn));

      if (available.length === 0) {
        Utils.closeModal();
        return Utils.toast('Semua sekolah di database sudah ada di daftar binaan Anda.', 'info');
      }

      const listHtml = available.map((s, i) => `
        <label style="display:flex;align-items:center;gap:.75rem;padding:.75rem;border-bottom:1px solid var(--slate-100);cursor:pointer">
          <input type="checkbox" class="db-checkbox" value="${s.npsn}" data-nama="${Utils.esc(s.nama_sekolah)}" style="width:18px;height:18px;accent-color:var(--brand-600)">
          <div>
            <div style="font-weight:600;font-size:.9rem">${Utils.esc(s.nama_sekolah)}</div>
            <div style="font-size:.75rem;color:var(--slate-500);font-family:monospace">NPSN: ${s.npsn}</div>
          </div>
        </label>
      `).join('');

      Utils.modal('Pilih Sekolah dari Database', `
        <div style="margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center">
          <span style="font-size:.85rem;color:var(--slate-500)">Ditemukan ${available.length} sekolah baru.</span>
          <button class="btn btn-secondary btn-sm" id="btnSelectAll">Pilih Semua</button>
        </div>
        <div style="max-height:50vh;overflow-y:auto;border:1px solid var(--slate-200);border-radius:8px">
          ${listHtml}
        </div>
      `, `
        <button class="btn btn-secondary" onclick="Utils.closeModal()">Batal</button>
        <button class="btn btn-primary" id="btnSavePick">Tambahkan ke Binaan</button>
      `, true);

      Utils.el('btnSelectAll').onclick = () => {
        const checks = document.querySelectorAll('.db-checkbox');
        const allChecked = Array.from(checks).every(c => c.checked);
        checks.forEach(c => c.checked = !allChecked);
        Utils.el('btnSelectAll').textContent = allChecked ? 'Pilih Semua' : 'Batal Pilih';
      };

      Utils.el('btnSavePick').onclick = async () => {
        const checked = Array.from(document.querySelectorAll('.db-checkbox:checked'));
        if (checked.length === 0) return Utils.toast('Pilih minimal satu sekolah', 'warning');

        const newSekolah = checked.map(cb => ({
          id: Utils.uid(),
          npsn: cb.value,
          nama_sekolah: cb.dataset.nama,
          ks_nama: '', ks_nip: '',
          imported_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          guru: [], program: [], supervisi: [], akademik: [], coaching: []
        }));

        const updatedList = [...localSchools, ...newSekolah];
        await Store.set('sekolah', updatedList);
        
        Utils.closeModal();
        Utils.toast(`${checked.length} sekolah ditambahkan ke binaan.`, 'success');
        Router.navigate('sekolah');
      };

    } catch (err) {
      Utils.closeModal();
      Utils.toast(err.message, 'error');
    }
  },

  // ==========================================
  // 2. IMPOR CSV LOKAL
  // ==========================================
  handleCSV(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const rows = ev.target.result.split(/\r?\n/).filter(r => r.trim());
      if (rows.length < 2) return Utils.toast('File CSV kosong / tidak valid', 'error');
      
      const sep = rows[0].includes(';') ? ';' : ',';
      const localSchools = Store.get('sekolah');
      const localNpsns = new Set(localSchools.map(s => s.npsn));
      
      let added = 0;
      const newSekolah = [];

      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split(sep).map(c => c.trim());
        if (cols[0] && cols[1] && !localNpsns.has(cols[0])) {
          newSekolah.push({
            id: Utils.uid(),
            npsn: cols[0],
            nama_sekolah: cols[1],
            ks_nama: '', ks_nip: '',
            imported_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            guru: [], program: [], supervisi: [], akademik: [], coaching: []
          });
          localNpsns.add(cols[0]);
          added++;
        }
      }
      
      if (added === 0) {
        e.target.value = '';
        return Utils.toast('Tidak ada data baru yang valid (atau semua duplikat).', 'warning');
      }
      
      await Store.set('sekolah', [...localSchools, ...newSekolah]);
      Utils.toast(`Berhasil menambahkan ${added} sekolah dari CSV.`, 'success');
      e.target.value = ''; // Reset
      Router.navigate('sekolah');
    };
    reader.readAsText(file);
  },

  // ==========================================
  // 3. IMPORT JSON DARI KS (Sama seperti sebelumnya)
  // ==========================================
  startImportJSON() {
    Utils.modal('Import JSON dari KS', `
      ${infoBanner('info', 'info', 'Pilih file JSON hasil ekspor dari SISPA-Offline (KS). Sistem akan mendeteksi sekolah dari NPSN dan menampilkan perubahan sebelum konfirmasi.')}
      <div style="margin-top:1rem">
        ${infoBanner('success', 'check-circle', '<strong>Mode default: Merge.</strong> Data lama dipertahankan, hanya item baru/diubah yang di-update. Cocok untuk sync berkala.')}
      </div>
      <div class="form-group" style="margin-top:1rem">
        <label class="label">File JSON</label>
        <input type="file" id="jsonFile" accept=".json,application/json" class="input" style="padding:.5rem">
      </div>
    `, `<button class="btn btn-secondary" onclick="Utils.closeModal()">Batal</button><button class="btn btn-primary" id="btnParseJSON">${Icons.svg('chevron-right', 16)} Analisis File</button>`);

    Utils.el('btnParseJSON').onclick = () => {
      const file = Utils.el('jsonFile').files[0];
      if (!file) return Utils.toast('Pilih file JSON dulu', 'warning');
      if (file.size > 10 * 1024 * 1024) return Utils.toast('File terlalu besar (maks 10 MB)', 'error');
      const r = new FileReader();
      r.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          this.processImport(data);
        } catch {
          Utils.toast('File JSON tidak valid', 'error');
        }
      };
      r.readAsText(file, 'UTF-8');
    };
  },

  processImport(data) {
    if (!data || typeof data !== 'object') return Utils.toast('Format file tidak valid', 'error');
    if (!data.config) return Utils.toast('File tidak punya config (bukan file SISPA)', 'error');
    const cfg = data.config;
    if (!cfg.nama_sekolah) return Utils.toast('Config tidak punya nama_sekolah', 'error');
    const npsn = String(cfg.npsn || '').trim();
    if (!npsn) return Utils.toast('Config tidak punya NPSN. Minta KS isi NPSN dulu.', 'error');

    const sekolah = Store.get('sekolah');
    const existing = sekolah.find(sk => String(sk.npsn || '').trim() === npsn);
    const isNew = !existing;

    const arrays = ['guru', 'program', 'supervisi', 'akademik', 'coaching'];
    const diff = {};
    arrays.forEach(k => {
      const oldArr = isNew ? [] : (existing[k] || []);
      const newArr = data[k] || [];
      const oldMap = new Map(oldArr.map(x => [x.id, x]));
      let baru = 0, update = 0, sama = 0;
      newArr.forEach(item => {
        const old = oldMap.get(item.id);
        if (!old) baru++;
        else if (JSON.stringify(old) !== JSON.stringify(item)) update++;
        else sama++;
      });
      diff[k] = { baru, update, sama, total: newArr.length };
    });

    this.showPreview({ data, cfg, npsn, existing, isNew, diff });
  },

  showPreview({ data, cfg, npsn, existing, isNew, diff }) {
    const fileExportTime = data.exported_at ? Utils.date(data.exported_at) : 'Tidak ada info';
    const diffRow = (label, d) => `
      <div style="display:flex;justify-content:space-between;padding:.55rem .75rem;border-bottom:1px solid var(--slate-100);font-size:.85rem">
        <span>${label}</span>
        <span>
          ${d.baru > 0 ? `<span style="color:var(--success);font-weight:600">${d.baru} baru</span> · ` : ''}
          ${d.update > 0 ? `<span style="color:var(--info);font-weight:600">${d.update} update</span> · ` : ''}
          <span style="color:var(--slate-400)">${d.sama} sama</span>
          <span style="color:var(--slate-400);font-size:.75rem"> / ${d.total}</span>
        </span>
      </div>`;

    const modeHtml = isNew ? infoBanner('success', 'check-circle', '<strong>Sekolah baru</strong> — akan ditambahkan sebagai sekolah binaan.')
      : `
        <div style="margin-bottom:1rem">
          ${infoBanner('warn', 'refresh-cw', `<strong>Sekolah sudah terdaftar</strong> — terakhir sync ${Utils.relTime(existing.updated_at)}.`)}
          <div style="margin-top:.75rem">
            <div style="font-weight:600;font-size:.85rem;margin-bottom:.4rem">Mode Import</div>
            <label style="display:flex;gap:.5rem;padding:.6rem;border:1.5px solid var(--brand-500);background:var(--brand-50);border-radius:8px;cursor:pointer;margin-bottom:.4rem">
              <input type="radio" name="impMode" value="merge" checked style="margin-top:.15rem">
              <div><strong style="font-size:.85rem">Merge (aman)</strong><div style="font-size:.75rem;color:var(--slate-600)">Data lama yang tidak ada di file tetap ada. Cocok untuk sync berkala.</div></div>
            </label>
            <label style="display:flex;gap:.5rem;padding:.6rem;border:1.5px solid var(--slate-200);border-radius:8px;cursor:pointer">
              <input type="radio" name="impMode" value="replace" style="margin-top:.15rem">
              <div><strong style="font-size:.85rem">Replace (reset)</strong><div style="font-size:.75rem;color:var(--slate-600)">Data lama diganti total dengan data dari file.</div></div>
            </label>
          </div>
        </div>`;

    Utils.modal(isNew ? 'Sekolah Baru' : 'Update Sekolah', `
      <table style="font-size:.85rem;margin-bottom:1rem">
        <tr><td style="padding:.3rem .5rem;color:var(--slate-500);width:120px">Sekolah</td><td style="padding:.3rem .5rem"><strong>${Utils.esc(cfg.nama_sekolah)}</strong></td></tr>
        <tr><td style="padding:.3rem .5rem;color:var(--slate-500)">NPSN</td><td style="padding:.3rem .5rem;font-family:monospace">${Utils.esc(npsn)}</td></tr>
        <tr><td style="padding:.3rem .5rem;color:var(--slate-500)">KS</td><td style="padding:.3rem .5rem">${Utils.esc(cfg.nama_ks || '—')}</td></tr>
        <tr><td style="padding:.3rem .5rem;color:var(--slate-500)">File tanggal</td><td style="padding:.3rem .5rem">${fileExportTime}</td></tr>
      </table>
      ${modeHtml}
      <div style="font-weight:600;font-size:.85rem;margin-bottom:.35rem">Perubahan data:</div>
      <div style="border:1px solid var(--slate-200);border-radius:8px;overflow:hidden">
        ${diffRow('Guru', diff.guru)}
        ${diffRow('Program', diff.program)}
        ${diffRow('Supervisi 3 Tahap', diff.supervisi)}
        ${diffRow('Akademik', diff.akademik)}
        ${diffRow('Coaching', diff.coaching)}
      </div>
    `, `<button class="btn btn-secondary" onclick="Utils.closeModal()">Batal</button><button class="btn btn-primary" id="btnConfirmImport">${isNew ? 'Tambahkan Sekolah' : 'Import Sekarang'}</button>`, true);

    Utils.el('btnConfirmImport').onclick = () => {
      const modeEl = document.querySelector('input[name="impMode"]:checked');
      const mode = modeEl ? modeEl.value : 'merge';
      this.executeImport({ data, cfg, npsn, existing, isNew }, mode);
    };
  },

  async executeImport({ data, cfg, npsn, existing, isNew }, mode) {
    const sekolah = Store.get('sekolah');
    const now = new Date().toISOString();

    if (isNew) {
      sekolah.push({
        id: Utils.uid(), npsn,
        nama_sekolah: cfg.nama_sekolah,
        ks_nama: cfg.nama_ks || '', ks_nip: cfg.nip_ks || '',
        imported_at: now, updated_at: now,
        guru: data.guru || [], program: data.program || [],
        supervisi: data.supervisi || [], akademik: data.akademik || [], coaching: data.coaching || []
      });
    } else {
      existing.nama_sekolah = cfg.nama_sekolah;
      existing.ks_nama = cfg.nama_ks || existing.ks_nama || '';
      existing.ks_nip = cfg.nip_ks || existing.ks_nip || '';
      existing.updated_at = now;
      ['guru', 'program', 'supervisi', 'akademik', 'coaching'].forEach(k => {
        if (mode === 'replace') {
          existing[k] = data[k] || [];
        } else {
          const oldMap = new Map((existing[k] || []).map(x => [x.id, x]));
          (data[k] || []).forEach(item => oldMap.set(item.id, item));
          existing[k] = [...oldMap.values()];
        }
      });
    }

    await Store.set('sekolah', sekolah);
    Utils.closeModal();
    Utils.toast(isNew ? `${cfg.nama_sekolah} ditambahkan` : `Data ${cfg.nama_sekolah} diperbarui`, 'success');
    Router.navigate('sekolah');
  },

  detail(id) {
    const sk = Store.get('sekolah').find(x => x.id === id);
    if (!sk) return;
    const n3 = (sk.supervisi || []).length;
    const nA = (sk.akademik || []).length;
    const nC = (sk.coaching || []).length;
    const guruDinilai = (sk.guru || []).filter(g => g.tipe).length;
    Utils.modal(sk.nama_sekolah, `
      <table style="font-size:.85rem;margin-bottom:1rem">
        <tr><td style="padding:.3rem .5rem;color:var(--slate-500);width:100px">NPSN</td><td style="padding:.3rem .5rem;font-family:monospace">${Utils.esc(sk.npsn || '-')}</td></tr>
        <tr><td style="padding:.3rem .5rem;color:var(--slate-500)">KS</td><td style="padding:.3rem .5rem">${Utils.esc(sk.ks_nama || '—')}</td></tr>
        <tr><td style="padding:.3rem .5rem;color:var(--slate-500)">Import pertama</td><td style="padding:.3rem .5rem">${Utils.date(sk.imported_at)}</td></tr>
        <tr><td style="padding:.3rem .5rem;color:var(--slate-500)">Sync terakhir</td><td style="padding:.3rem .5rem">${Utils.date(sk.updated_at)} (${Utils.relTime(sk.updated_at)})</td></tr>
      </table>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:.6rem;margin-bottom:1rem">
        <div style="padding:.75rem;background:var(--slate-50);border-radius:8px"><div style="font-size:.7rem;color:var(--slate-500)">Total Guru</div><div style="font-size:1.3rem;font-weight:700">${(sk.guru || []).length}</div></div>
        <div style="padding:.75rem;background:var(--slate-50);border-radius:8px"><div style="font-size:.7rem;color:var(--slate-500)">Sudah Dinilai Tipe</div><div style="font-size:1.3rem;font-weight:700">${guruDinilai}</div></div>
        <div style="padding:.75rem;background:#dbeafe;border-radius:8px"><div style="font-size:.7rem;color:#1e40af">Supervisi 3T</div><div style="font-size:1.3rem;font-weight:700">${n3}</div></div>
        <div style="padding:.75rem;background:#dbeafe;border-radius:8px"><div style="font-size:.7rem;color:#1e40af">Akademik</div><div style="font-size:1.3rem;font-weight:700">${nA}</div></div>
        <div style="padding:.75rem;background:#dbeafe;border-radius:8px"><div style="font-size:.7rem;color:#1e40af">Coaching</div><div style="font-size:1.3rem;font-weight:700">${nC}</div></div>
      </div>
      <div style="font-weight:600;font-size:.85rem;margin-bottom:.5rem">Guru di Sekolah Ini</div>
      <div style="max-height:220px;overflow-y:auto;border:1px solid var(--slate-200);border-radius:8px">
        ${(sk.guru || []).length === 0 ? '<div style="padding:1rem;text-align:center;color:var(--slate-400);font-size:.8rem">Belum ada guru</div>'
          : (sk.guru || []).map(g => `
            <div style="padding:.55rem .85rem;border-bottom:1px solid var(--slate-100);font-size:.85rem">
              <div style="font-weight:600">${Utils.esc(g.nama)}</div>
              <div style="font-size:.75rem;color:var(--slate-500)">${Utils.esc(g.mapel || '-')} · ${g.tipe ? `<span class="badge badge-info" style="font-size:.65rem">${g.tipe}</span>` : '<span style="color:var(--slate-400)">belum dinilai</span>'}</div>
            </div>`).join('')}
      </div>
    `, '<button class="btn btn-secondary" onclick="Utils.closeModal()">Tutup</button>', true);
  },

  hapus(id) {
    const sk = Store.get('sekolah').find(x => x.id === id);
    if (!sk) return;
    const total = (sk.guru || []).length + (sk.supervisi || []).length + (sk.akademik || []).length + (sk.coaching || []).length;
    Utils.confirm('Hapus Sekolah?',
      `Semua data ${sk.nama_sekolah} (${total} record) akan dihapus dari aplikasi ini. File JSON asli dari KS tidak terpengaruh.`,
      async () => {
        await Store.set('sekolah', Store.get('sekolah').filter(x => x.id !== id));
        Router.navigate('sekolah');
      });
  }
};
