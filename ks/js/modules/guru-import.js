import { Store } from '../../storage.js';
import { Utils } from '../../../shared/js/utils.js';
import { Icons } from '../../../shared/js/icons.js';
import { Router } from '../../../shared/js/router.js';

export const GuruImport = {
  show() {
    Utils.modal('Impor Data Guru dari CSV', `
      <div style="font-size:.875rem;line-height:1.6;color:var(--slate-700)">
        <div style="margin-bottom:1rem">
          <div style="font-weight:600;margin-bottom:.35rem">Langkah 1: Download Template</div>
          <button class="btn btn-secondary" id="btnDownloadTemplate">${Icons.svg('download', 16)} Download Template CSV</button>
        </div>
        <div style="margin-bottom:1rem">
          <div style="font-weight:600;margin-bottom:.35rem">Langkah 2: Isi di Excel</div>
          <div style="font-size:.8rem;color:var(--slate-500)">Buka template, isi data guru, lalu <strong>Save As → CSV UTF-8</strong></div>
        </div>
        <div style="margin-bottom:1rem">
          <div style="font-weight:600;margin-bottom:.35rem">Langkah 3: Upload</div>
          <input type="file" id="csvFile" accept=".csv,text/csv" class="input" style="padding:.5rem">
        </div>
        <div style="padding:.65rem;background:var(--slate-50);border-radius:6px;font-size:.8rem;color:var(--slate-600)">
          <div><strong>Format kolom:</strong> nama ; nip ; mapel ; kelas ; peg</div>
          <div><strong>Status pegawai:</strong> PNS / PPPK / Non ASN</div>
        </div>
      </div>
    `, `<button class="btn btn-secondary" onclick="Utils.closeModal()">Batal</button><button class="btn btn-primary" id="btnParse">Lanjut Preview ${Icons.svg('chevron-right', 16)}</button>`);

    Utils.el('btnDownloadTemplate').onclick = () => GuruImport.downloadTemplate();
    Utils.el('btnParse').onclick = () => {
      const file = Utils.el('csvFile').files[0];
      if (!file) return Utils.toast('Pilih file CSV dulu', 'warning');
      GuruImport.parse(file);
    };
  },

  downloadTemplate() {
    const content = '\uFEFF# Template Import Data Guru SISPA\n'
      + '# Hapus baris yang dimulai dengan # sebelum upload\n'
      + '# Format: nama;nip;mapel;kelas;peg\n'
      + '# Status kepegawaian: PNS, PPPK, atau Non ASN\n'
      + '# Kosongkan kolom yang tidak ada\n'
      + 'nama;nip;mapel;kelas;peg\n'
      + 'Budi Santoso, S.Pd;198501012010011001;Matematika;V;PNS\n'
      + 'Siti Aminah, M.Pd;199002022015012002;IPA;VI;PPPK\n'
      + 'Ahmad Fauzi;198703032011011003;Bahasa Inggris;IV;Non ASN\n';
    Utils.downloadFile(content, 'template_guru_sispa.csv', 'text/csv;charset=utf-8');
    Utils.toast('Template terunduh', 'success');
  },

  parse(file) {
    if (file.size > 5 * 1024 * 1024) return Utils.toast('File terlalu besar (maks 5 MB)', 'error');
    const reader = new FileReader();
    reader.onload = (e) => {
      let text = String(e.target.result || '');
      if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
      const lines = text.split(/\r?\n/).filter(l => l.trim() && !l.trim().startsWith('#'));
      if (lines.length < 1) return Utils.toast('File kosong', 'error');
      const headerLine = lines[0];
      const sep = headerLine.includes(';') ? ';' : ',';
      let startIdx = 0;
      const hc = headerLine.toLowerCase();
      if (hc.includes('nama') && (hc.includes('nip') || hc.includes('mapel'))) startIdx = 1;
      const dataLines = lines.slice(startIdx);
      if (dataLines.length === 0) return Utils.toast('Tidak ada data guru', 'error');
      if (dataLines.length > 500) return Utils.toast('Maks 500 baris per import', 'error');

      const existing = Store.get('guru');
      const existingKeys = new Set(existing.map(g =>
        (g.nama || '').toLowerCase().trim() + '|' + (g.nip || '').trim()
      ));
      const fileKeys = new Set();

      const parsed = dataLines.map((line, idx) => {
        const cols = line.split(sep).map(c => c.trim());
        const nama = cols[0] || '';
        const nip = cols[1] || '';
        const mapel = cols[2] || '';
        const kelas = cols[3] || '';
        const peg = cols[4] || '';
        let status = 'valid', msg = '';
        if (nama.length < 2) {
          status = 'error'; msg = 'Nama terlalu pendek';
        } else {
          const key = nama.toLowerCase() + '|' + nip;
          if (existingKeys.has(key)) { status = 'dup'; msg = 'Duplikat — sudah ada di database'; }
          else if (fileKeys.has(key)) { status = 'dup'; msg = 'Duplikat — di file ini juga'; }
          else { fileKeys.add(key); }
        }
        return { lineNum: startIdx + idx + 1, nama, nip, mapel, kelas, peg, status, msg };
      });

      GuruImport.preview(parsed);
    };
    reader.readAsText(file, 'UTF-8');
  },

  preview(parsed) {
    const valid = parsed.filter(p => p.status === 'valid');
    const dups = parsed.filter(p => p.status === 'dup');
    const errs = parsed.filter(p => p.status === 'error');

    const rowsHtml = parsed.map(p => {
      const icon = p.status === 'valid' ? 'check' : p.status === 'dup' ? 'alert-triangle' : 'x';
      const color = p.status === 'valid' ? 'var(--success)' : p.status === 'dup' ? 'var(--warning)' : 'var(--danger)';
      return `<div style="padding:.55rem .75rem;border-bottom:1px solid var(--slate-100);display:flex;gap:.65rem;align-items:flex-start">
        <div style="color:${color};flex-shrink:0">${Icons.svg(icon, 20)}</div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:.85rem">${Utils.esc(p.nama || '(tanpa nama)')}</div>
          <div style="font-size:.75rem;color:var(--slate-500);margin-top:.15rem">NIP ${Utils.esc(p.nip || '—')} · ${Utils.esc(p.mapel || '—')} · ${Utils.esc(p.kelas ? 'Kls ' + p.kelas : '—')} · ${Utils.esc(p.peg || '—')}</div>
          ${p.msg ? `<div style="font-size:.75rem;color:${color};margin-top:.2rem">${Utils.esc(p.msg)}</div>` : ''}
        </div>
      </div>`;
    }).join('');

    const summary = `${valid.length} valid, ${dups.length} duplikat, ${errs.length} error`;

    Utils.modal(`Preview Impor — ${summary}`, `
      <div style="max-height:55vh;overflow-y:auto;border:1px solid var(--slate-200);border-radius:6px;margin-bottom:.75rem">${rowsHtml}</div>
      <div style="font-size:.85rem;color:var(--slate-600)">
        <strong>${valid.length}</strong> guru akan ditambahkan.
        ${dups.length ? ` <strong>${dups.length}</strong> duplikat dilewati.` : ''}
        ${errs.length ? ` <strong>${errs.length}</strong> error dilewati.` : ''}
      </div>
    `, `<button class="btn btn-secondary" id="btnBack">${Icons.svg('chevron-left', 16)} Kembali</button><button class="btn btn-primary" id="btnDoInsert" ${valid.length === 0 ? 'disabled' : ''}>Impor ${valid.length} Guru</button>`);

    Utils.el('btnBack').onclick = () => GuruImport.show();
    Utils.el('btnDoInsert').onclick = () => {
      const list = Store.get('guru');
      valid.forEach(p => {
        list.push({ id: Utils.uid(), nama: p.nama, nip: p.nip, mapel: p.mapel, kelas: p.kelas, peg: p.peg });
      });
      Store.set('guru', list);
      Utils.closeModal();
      const skipped = dups.length + errs.length;
      Utils.toast(`${valid.length} guru ditambahkan${skipped ? `, ${skipped} dilewati` : ''}`, 'success');
      Router.navigate('guru');
    };
  }
};
