import { Store } from '../../storage.js';
import { Utils } from '../../../shared/js/utils.js';
import { Icons } from '../../../shared/js/icons.js';
import { Router } from '../../../shared/js/router.js';

export const Pengaturan = {
  async render() {
    const c = Store.config();
    const pengawasStatus = c.pengawas_status;
    const hasPengawas = pengawasStatus === 'confirmed' && c.pengawas_nip;

    return `
      <div class="page-head"><h2>Pengaturan</h2></div>

      <div class="card"><div class="card-header">${Icons.svg('school', 18)} Identitas Sekolah & KS</div><div class="card-body">
        <div class="row">
          <div class="form-group"><label class="label">Nama Sekolah</label><input class="input" id="ps" value="${Utils.esc(c.nama_sekolah || '')}"></div>
          <div class="form-group"><label class="label">NPSN</label><input class="input" id="pn" value="${Utils.esc(c.npsn || '')}" maxlength="8" inputmode="numeric"></div>
        </div>
        <div class="row">
          <div class="form-group"><label class="label">Nama KS</label><input class="input" id="pk" value="${Utils.esc(c.nama_ks || '')}"></div>
          <div class="form-group"><label class="label">NIP KS</label><input class="input" id="pnip" value="${Utils.esc(c.nip_ks || '')}"></div>
        </div>
        <div class="form-group">
          <label class="label">PIN (4 angka, kosongkan jika tanpa PIN)</label>
          <input class="input" id="ppin" maxlength="4" value="${Utils.esc(c.pin || '')}" placeholder="Contoh: 1234" inputmode="numeric">
        </div>
        <button class="btn btn-primary" id="btnSaveCfg">${Icons.svg('save', 16)} Simpan Pengaturan</button>
      </div></div>

      <div class="card">
        <div class="card-header">${Icons.svg('user-check', 18)} Pengawas Pembina Saya</div>
        <div class="card-body">
          ${hasPengawas ? `
            <div style="display:flex;gap:1rem;align-items:center;flex-wrap:wrap">
              <div style="width:56px;height:56px;border-radius:50%;background:#dcfce7;color:#166534;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                ${Icons.svg('user-check', 28)}
              </div>
              <div style="flex:1;min-width:200px">
                <div style="font-size:.7rem;color:var(--success);font-weight:600;text-transform:uppercase;letter-spacing:.03em">✓ Terkonfirmasi</div>
                <div style="font-weight:700;font-size:1rem;margin-top:.15rem">${Utils.esc(c.pengawas_nama || '—')}</div>
                <div style="font-size:.8rem;color:var(--slate-500);margin-top:.15rem">${Utils.esc(c.pengawas_wilayah || '')} · NIP ${Utils.esc(c.pengawas_nip)}</div>
              </div>
              <button class="btn btn-secondary" id="btnCekPengawas">
                ${Icons.svg('refresh-cw', 16)} Cek Perubahan
              </button>
            </div>
            <div style="font-size:.7rem;color:var(--slate-400);margin-top:.75rem;padding-top:.75rem;border-top:1px solid var(--slate-100)">
              Terakhir dicek: ${c.pengawas_last_check ? Utils.relTime(c.pengawas_last_check) : '—'}
            </div>
          ` : pengawasStatus === 'pending' ? `
            <div style="padding:.85rem 1rem;background:#fef3c7;border:1px solid #fde68a;border-radius:10px;font-size:.85rem;color:#92400e;margin-bottom:1rem">
              <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.35rem">
                ${Icons.svg('clock', 18)}
                <strong>Menunggu konfirmasi Anda</strong>
              </div>
              <div>Pengawas <strong>${Utils.esc(c.pengawas_nama || '—')}</strong> telah mengklaim sekolah Anda. Buka <strong>Dashboard</strong> untuk konfirmasi.</div>
            </div>
            <button class="btn btn-primary" id="btnCekPengawas">${Icons.svg('refresh-cw', 16)} Cek Sekarang</button>
          ` : `
            <div style="text-align:center;padding:1rem 0">
              <div style="color:var(--slate-400);font-size:.9rem;margin-bottom:1rem">Belum ada pengawas pembina terdaftar. Klik tombol di bawah untuk memeriksa dari database Dinas.</div>
              <button class="btn btn-primary" id="btnCekPengawas">${Icons.svg('refresh-cw', 16)} Cek Pengawas Dabin</button>
            </div>
          `}
        </div>
      </div>

      <div class="card"><div class="card-header">${Icons.svg('file-json', 18)} Backup & Transfer</div><div class="card-body">
        <p style="font-size:.85rem;color:var(--slate-600);margin:0 0 1rem">Ekspor seluruh data ke file JSON. Bisa diimpor kembali, atau dikirim ke Pengawas via WhatsApp/Email.</p>
        <div style="display:flex;gap:.5rem;flex-wrap:wrap">
          <button class="btn btn-success" id="btnExp">${Icons.svg('download', 16)} Ekspor JSON</button>
          <button class="btn btn-secondary" id="btnImp">${Icons.svg('upload', 16)} Impor JSON</button>
          <input type="file" id="fileImp" accept=".json,application/json" style="display:none">
        </div>
        <div style="font-size:.75rem;color:var(--slate-500);margin-top:.75rem">
          💡 Nama file akan otomatis berisi <strong>NPSN + Nama Sekolah</strong> agar mudah dikenali.
        </div>
      </div></div>

      <div class="card"><div class="card-header" style="color:var(--danger)">${Icons.svg('alert-triangle', 18)} Zona Bahaya</div><div class="card-body">
        <button class="btn btn-danger" id="btnReset">${Icons.svg('trash-2', 16)} Hapus Semua Data</button>
      </div></div>
    `;
  },

  async bind() {
    // ============================================
    // 1. Simpan Pengaturan
    // ============================================
    Utils.el('btnSaveCfg').onclick = () => {
      const c = Store.config();
      c.nama_sekolah = Utils.el('ps').value.trim();
      c.nama_ks = Utils.el('pk').value.trim();
      c.npsn = Utils.el('pn').value.trim();
      c.nip_ks = Utils.el('pnip').value.trim();
      c.pin = Utils.el('ppin').value.replace(/\D/g, '').slice(0, 4);
      Store.setConfig(c);
      Utils.toast('Pengaturan disimpan', 'success');
      Router.navigate('dashboard');
    };

    // ============================================
    // 2. Cek Pengawas
    // ============================================
    Utils.el('btnCekPengawas')?.addEventListener('click', () => {
      if (window.App?.cekpengawas) window.App.cekpengawas();
    });

    // ============================================
    // 3. Ekspor JSON (dengan nama file NPSN_Sekolah_Tanggal)
    // ============================================
    Utils.el('btnExp').onclick = () => {
      const cfg = Store.config();
      const data = Store.load();
      data.version = '2.0.0';
      data.app = 'sispa-standalone';
      data.exported_at = new Date().toISOString();

      // Tambah metadata pengawas untuk validasi di PS
      if (data.config) {
        data.config.pengawas_nip = data.config.pengawas_nip || null;
        data.config.pengawas_nama = data.config.pengawas_nama || null;
        data.config.pengawas_status = data.config.pengawas_status || null;
      }

      // Sanitize nama file (hapus karakter illegal Windows)
      const sanitize = (str) => String(str || '')
        .replace(/[\\/:*?"<>|]/g, '')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 60);

      const npsn = sanitize(cfg.npsn || 'NPSN');
      const namaSekolah = sanitize(cfg.nama_sekolah || 'Sekolah');
      const tgl = new Date().toISOString().slice(0, 10);
      const filename = `${npsn}_${namaSekolah}_${tgl}.json`;

      Utils.downloadJSON(data, filename);
      localStorage.setItem('sispa_last_export', new Date().toISOString());
      Utils.toast(`Data diekspor: ${filename}`, 'success');
    };

    // ============================================
    // 4. Impor JSON
    // ============================================
    Utils.el('btnImp').onclick = () => Utils.el('fileImp').click();
    Utils.el('fileImp').onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const r = new FileReader();
      r.onload = (ev) => {
        try {
          const d = JSON.parse(ev.target.result);
          if (!d.config) throw new Error('File tidak valid');
          Utils.confirm('Impor Data?', 'Semua data saat ini akan diganti. Backup dulu jika perlu.', () => {
            Store.save(d);
            location.reload();
          });
        } catch (err) {
          Utils.toast(err.message, 'error');
        }
      };
      r.readAsText(file);
    };

    // ============================================
    // 5. Hapus Semua Data
    // ============================================
    Utils.el('btnReset').onclick = () => {
      Utils.confirm('Hapus Semua Data?', 'Tidak bisa dibatalkan. Backup dulu kalau perlu.', async () => {
        await Store.reset();
        location.reload();
      });
    };
  }
};
