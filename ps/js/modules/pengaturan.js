import { Store } from '../../storage.js';
import { Utils } from '../../../shared/js/utils.js';
import { Icons } from '../../../shared/js/icons.js';
import { Router } from '../../../shared/js/router.js';

export const Pengaturan = {
  async render() {
    const c = Store.config();
    return `
      <div class="page-head"><h2>Pengaturan</h2></div>

      <div class="card"><div class="card-header">${Icons.svg('user', 18)} Identitas Pengawas</div><div class="card-body">
        <div class="row">
          <div class="form-group"><label class="label">Nama Pengawas</label><input class="input" id="pngNama" value="${Utils.esc(c.nama_pengawas || '')}"></div>
          <div class="form-group"><label class="label">NIP Pengawas</label><input class="input" id="pngNip" value="${Utils.esc(c.nip_pengawas || '')}"></div>
        </div>
        <div class="form-group"><label class="label">Wilayah Binaan</label><input class="input" id="pngWilayah" value="${Utils.esc(c.wilayah || '')}"></div>
        <div class="form-group"><label class="label">PIN (4 angka, kosongkan jika tanpa PIN)</label><input class="input" id="pngPin" maxlength="4" value="${Utils.esc(c.pin || '')}" placeholder="1234"></div>
        <button class="btn btn-primary" id="btnSave">${Icons.svg('save', 16)} Simpan Pengaturan</button>
      </div></div>

      <div class="card"><div class="card-header">${Icons.svg('save', 18)} Backup & Restore</div><div class="card-body">
        <p style="font-size:.8rem;color:var(--slate-500);margin:0 0 1rem">Backup seluruh data pengawas ke file JSON untuk dipindah device.</p>
        <div style="display:flex;gap:.5rem;flex-wrap:wrap">
          <button class="btn btn-success" id="btnExp">${Icons.svg('download', 16)} Ekspor Backup</button>
          <button class="btn btn-secondary" id="btnImp">${Icons.svg('upload', 16)} Restore Backup</button>
          <input type="file" id="fileImp" accept=".json" style="display:none">
        </div>
      </div></div>

      <div class="card"><div class="card-header" style="color:var(--danger)">${Icons.svg('alert-triangle', 18)} Zona Bahaya</div><div class="card-body">
        <button class="btn btn-danger" id="btnReset">${Icons.svg('trash-2', 16)} Hapus Semua Data</button>
      </div></div>
    `;
  },

  async bind() {
    Utils.el('btnSave').onclick = async () => {
      const c = Store.config();
      c.nama_pengawas = Utils.el('pngNama').value.trim();
      c.nip_pengawas = Utils.el('pngNip').value.trim();
      c.wilayah = Utils.el('pngWilayah').value.trim();
      c.pin = Utils.el('pngPin').value.replace(/\D/g, '').slice(0, 4);
      await Store.setConfig(c);
      Utils.toast('Pengaturan disimpan', 'success');
      Router.navigate('dashboard');
    };

    Utils.el('btnExp').onclick = () => {
      const data = Store.load();
      data.version = '2.0.0';
      data.app = 'sispa-pengawas';
      data.exported_at = new Date().toISOString();
      
      // Nama file: [Nama_Pengawas]_[YYYY-MM-DD].json
      const sanitize = (str) => String(str || '')
        .replace(/[\\/:*?"<>|]/g, '')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 60);
      
      const namaPg = sanitize(Store.config().nama_pengawas || 'Pengawas');
      const tgl = new Date().toISOString().slice(0, 10);
      const filename = `${namaPg}_${tgl}.json`;
      
      Utils.downloadJSON(data, filename);
      Utils.toast(`Backup diekspor: ${filename}`, 'success');
    };

    Utils.el('btnImp').onclick = () => Utils.el('fileImp').click();
    Utils.el('fileImp').onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const r = new FileReader();
      r.onload = async (ev) => {
        try {
          const d = JSON.parse(ev.target.result);
          if (!d.config || !Array.isArray(d.sekolah)) throw new Error('Bukan backup Pengawas');
          Utils.confirm('Restore Backup?', 'Semua data saat ini akan diganti.', async () => {
            await Store.save(d);
            location.reload();
          });
        } catch (err) {
          Utils.toast(err.message, 'error');
        }
      };
      r.readAsText(file);
    };

    Utils.el('btnReset').onclick = () => {
      Utils.confirm('Hapus Semua Data?', 'Semua data akan dihapus. Backup dulu kalau perlu.', async () => {
        await Store.reset();
        location.reload();
      });
    };
  }
};
