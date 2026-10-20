import { Store } from '../../storage.js';
import { Utils } from '../../../shared/js/utils.js';
import { Icons } from '../../../shared/js/icons.js';
import { Router } from '../../../shared/js/router.js';

export const Pengaturan = {
  async render() {
    const c = Store.config();
    return `
      <div class="page-head"><h2>Pengaturan</h2></div>

      <div class="card"><div class="card-header">${Icons.svg('school', 18)} Identitas Sekolah & KS</div><div class="card-body">
        <div class="row">
          <div class="form-group"><label class="label">Nama Sekolah</label><input class="input" id="ps" value="${Utils.esc(c.nama_sekolah || '')}"></div>
          <div class="form-group"><label class="label">NPSN</label><input class="input" id="pn" value="${Utils.esc(c.npsn || '')}"></div>
        </div>
        <div class="row">
          <div class="form-group"><label class="label">Nama KS</label><input class="input" id="pk" value="${Utils.esc(c.nama_ks || '')}"></div>
          <div class="form-group"><label class="label">NIP KS</label><input class="input" id="pnip" value="${Utils.esc(c.nip_ks || '')}"></div>
        </div>
        <div class="form-group">
          <label class="label">PIN (4 angka, kosongkan jika tanpa PIN)</label>
          <input class="input" id="ppin" maxlength="4" value="${Utils.esc(c.pin || '')}" placeholder="Contoh: 1234">
        </div>
        <button class="btn btn-primary" id="btnSaveCfg">${Icons.svg('save', 16)} Simpan Pengaturan</button>
      </div></div>

      <div class="card"><div class="card-header">${Icons.svg('file-json', 18)} Backup & Transfer</div><div class="card-body">
        <p style="font-size:.85rem;color:var(--slate-600);margin:0 0 1rem">Ekspor seluruh data ke file JSON. Bisa diimpor kembali, atau dikirim ke Pengawas via WhatsApp/Email.</p>
        <div style="display:flex;gap:.5rem;flex-wrap:wrap">
          <button class="btn btn-success" id="btnExp">${Icons.svg('download', 16)} Ekspor JSON</button>
          <button class="btn btn-secondary" id="btnImp">${Icons.svg('upload', 16)} Impor JSON</button>
          <input type="file" id="fileImp" accept=".json,application/json" style="display:none">
        </div>
      </div></div>

      <div class="card"><div class="card-header" style="color:var(--danger)">${Icons.svg('alert-triangle', 18)} Zona Bahaya</div><div class="card-body">
        <button class="btn btn-danger" id="btnReset">${Icons.svg('trash-2', 16)} Hapus Semua Data</button>
      </div></div>
    `;
  },

  async bind() {
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

    Utils.el('btnExp').onclick = () => {
      const data = Store.load();
      data.version = '2.0.0';
      data.app = 'sispa-standalone';
      data.exported_at = new Date().toISOString();
      
      // Tambahkan metadata pengawas untuk validasi di PS
      if (data.config) {
        data.config.pengawas_nip = data.config.pengawas_nip || null;
        data.config.pengawas_nama = data.config.pengawas_nama || null;
        data.config.pengawas_status = data.config.pengawas_status || null;
      }
      
      Utils.downloadJSON(data, `SISPA_Backup_${new Date().toISOString().slice(0, 10)}.json`);
      localStorage.setItem('sispa_last_export', new Date().toISOString());
      Utils.toast('Data diekspor', 'success');
    };

    Utils.el('btnImp').onclick = () => Utils.el('fileImp').click();
    Utils.el('fileImp').onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const r = new FileReader();
      r.onload = (ev) => {
        try {
          const d = JSON.parse(ev.target.result);
          if (!d.config) throw new Error('File tidak valid');
          Utils.confirm('Impor Data?', 'Semua data saat ini akan diganti.', () => {
            Store.save(d);
            location.reload();
          });
        } catch (err) {
          Utils.toast(err.message, 'error');
        }
      };
      r.readAsText(file);
    };

    Utils.el('btnReset').onclick = () => {
      Utils.confirm('Hapus Semua Data?', 'Tidak bisa dibatalkan. Backup dulu kalau perlu.', async () => {
        await Store.reset();
        location.reload();
      });
    };
  }
};
