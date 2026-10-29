import { Store } from '../../storage.js';
import { Utils } from '../../../shared/js/utils.js';
import { Icons } from '../../../shared/js/icons.js';
import { emptyState, metricsSekolah, allGuru, allSesi, guruBySekolah } from '../helpers.js';

export const Laporan = {
  async render() {
    const sekolah = Store.get('sekolah');
    if (sekolah.length === 0) {
      return `<div class="card"><div class="card-body">
        ${emptyState('file-text', 'Belum ada data', 'Import JSON dari KS terlebih dahulu.')}
      </div></div>`;
    }
    return `
      <div class="page-head">
        <div>
          <h2>Laporan Rekap</h2>
          <div class="page-sub">Cetak & ekspor untuk Dinas</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">${Icons.svg('printer', 18)} Rekap Pengawas (Semua Sekolah)</div>
        <div class="card-body">
          <p style="font-size:.85rem;color:var(--slate-600);margin:0 0 1rem">1 halaman ringkasan semua sekolah binaan — cocok untuk laporan bulanan/semester ke Dinas.</p>
          <button class="btn btn-primary" id="btnPrintAll">${Icons.svg('printer', 16)} Cetak Rekap Pengawas</button>
        </div>
      </div>

      <div class="card">
        <div class="card-header">${Icons.svg('school', 18)} Rekap per Sekolah</div>
        <div class="card-body">
          <div style="display:grid;grid-template-columns:1fr auto;gap:.75rem;align-items:end">
            <div>
              <label class="label">Pilih Sekolah</label>
              <select class="select" id="skSel">
                ${sekolah.map(sk => `<option value="${sk.id}">${Utils.esc(sk.nama_sekolah)}</option>`).join('')}
              </select>
            </div>
            <button class="btn btn-primary" id="btnPrintSk">${Icons.svg('printer', 16)} Cetak</button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">${Icons.svg('download', 18)} Export CSV</div>
        <div class="card-body">
          <p style="font-size:.85rem;color:var(--slate-600);margin:0 0 1rem">Download CSV — buka di Excel / Google Sheets.</p>
          <div style="display:flex;gap:.5rem;flex-wrap:wrap">
            <button class="btn btn-success" id="btnCsvGuru">${Icons.svg('users', 16)} CSV Guru</button>
            <button class="btn btn-success" id="btnCsvSup">${Icons.svg('clipboard-list', 16)} CSV Supervisi</button>
            <button class="btn btn-success" id="btnCsvRekap">${Icons.svg('file-text', 16)} CSV Rekap</button>
          </div>
        </div>
      </div>
    `;
  },

  async bind() {
    if (Store.get('sekolah').length === 0) return;
    Utils.el('btnPrintAll').onclick = () => this._printAll();
    Utils.el('btnPrintSk').onclick = () => this._printSk(Utils.el('skSel').value);
    Utils.el('btnCsvGuru').onclick = () => this._csvGuru();
    Utils.el('btnCsvSup').onclick = () => this._csvSup();
    Utils.el('btnCsvRekap').onclick = () => this._csvRekap();
  },

  _printAll() {
    const c = Store.config();
    const sekolah = Store.get('sekolah');
    const ranked = sekolah.map(sk => ({ sk, m: metricsSekolah(sk) }));
    const totalGuru = ranked.reduce((s, x) => s + x.m.totalGuru, 0);
    const totalSesi = ranked.reduce((s, x) => s + x.m.totalSesi, 0);
    const totalPM = ranked.reduce((s, x) => s + x.m.totalPM, 0);
    const avgCov = Math.round(ranked.reduce((s, x) => s + x.m.coverage, 0) / ranked.length);
    const avgScore = Math.round(ranked.reduce((s, x) => s + x.m.score, 0) / ranked.length);

    Utils.el('printArea').innerHTML = `
      <h1>LAPORAN REKAP SUPERVISI AKADEMIK</h1>
      <p class="sub">${Utils.esc(c.wilayah || 'Wilayah Binaan')} — ${Utils.esc(c.nama_pengawas || 'Pengawas')}</p>
      <table class="info">
        <tr><td>Pengawas</td><td>:</td><td><strong>${Utils.esc(c.nama_pengawas || '-')}</strong></td></tr>
        <tr><td>NIP</td><td>:</td><td>${Utils.esc(c.nip_pengawas || '-')}</td></tr>
        <tr><td>Wilayah</td><td>:</td><td>${Utils.esc(c.wilayah || '-')}</td></tr>
        <tr><td>Tanggal Cetak</td><td>:</td><td>${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</td></tr>
      </table>
      <h2>Ringkasan</h2>
      <p>Total: <strong>${ranked.length} sekolah</strong> · <strong>${totalGuru} guru</strong> · <strong>${totalSesi} sesi</strong> (termasuk <strong>${totalPM} Supervisi PM</strong>)<br>
      Rata-rata Coverage: <strong>${avgCov}%</strong> · Rata-rata Skor: <strong>${avgScore}</strong></p>
      <h2>Rincian per Sekolah</h2>
      <table class="ind"><thead><tr>
        <th style="text-align:center">#</th>
        <th>Sekolah</th><th>Kepala Sekolah</th>
        <th style="text-align:center">Guru</th>
        <th style="text-align:center">Sesi</th>
        <th style="text-align:center">PM</th>
        <th style="text-align:center">Coverage</th>
        <th style="text-align:center">Skor</th>
        <th style="text-align:center">Kategori</th>
      </tr></thead><tbody>${ranked.map((r, i) => `
        <tr>
          <td style="text-align:center">${i + 1}</td>
          <td>${Utils.esc(r.sk.nama_sekolah)}</td>
          <td>${Utils.esc(r.sk.ks_nama || '—')}</td>
          <td style="text-align:center">${r.m.totalGuru}</td>
          <td style="text-align:center">${r.m.totalSesi}</td>
          <td style="text-align:center;font-weight:600;color:#9d174d">${r.m.totalPM}</td>
          <td style="text-align:center">${r.m.coverage}%</td>
          <td style="text-align:center">${r.m.score}</td>
          <td style="text-align:center">${r.m.kategori}</td>
        </tr>
      `).join('')}</tbody></table>
      <div class="ttd-grid">
        <div class="ttd-box"><div>Mengetahui,<br>Kepala Dinas Pendidikan</div><div class="ttd-space"></div><div class="ttd-name">(...................................)</div></div>
        <div class="ttd-box"><div>${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}<br>Pengawas</div><div class="ttd-space"></div><div class="ttd-name">${Utils.esc(c.nama_pengawas || '...')}</div><div style="font-size:8.5pt;color:#64748b">NIP. ${Utils.esc(c.nip_pengawas || '...')}</div></div>
      </div>`;
    setTimeout(() => window.print(), 200);
  },

  _printSk(skId) {
    const sk = Store.get('sekolah').find(x => x.id === skId);
    if (!sk) return;
    const c = Store.config();
    const m = metricsSekolah(sk);
    const guruRows = (sk.guru || []).map((g, i) => {
      const sup3 = (sk.supervisi || []).filter(s => s.gid === g.id);
      const pm = (sk.supervisiPM || []).filter(s => s.gid === g.id);
      const akad = (sk.akademik || []).filter(s => s.gid === g.id);
      const coach = (sk.coaching || []).filter(s => s.gid === g.id);
      const akAvg = akad.length > 0 ? Math.round(akad.reduce((s, x) => s + (x.skor || 0), 0) / akad.length) : null;
      const coAvg = coach.length > 0 ? Math.round(coach.reduce((s, x) => s + (x.skor || 0), 0) / coach.length) : null;
      const pmNilais = pm.map(s => (s.telaah && s.telaah.nilai) || 0).filter(n => n > 0);
      const pmAvg = pmNilais.length > 0 ? Math.round(pmNilais.reduce((a, b) => a + b, 0) / pmNilais.length) : null;
      return `<tr>
        <td style="text-align:center">${i + 1}</td>
        <td>${Utils.esc(g.nama)}</td>
        <td style="font-size:8.5pt">${Utils.esc(g.mapel || '-')}</td>
        <td style="text-align:center;font-size:8.5pt">${g.tipe || '—'}</td>
        <td style="text-align:center">${sup3.length}</td>
        <td style="text-align:center;font-weight:600;color:#9d174d">${pm.length}${pmAvg !== null ? ` <span style="font-size:8pt;color:#64748b">(${pmAvg})</span>` : ''}</td>
        <td style="text-align:center">${akad.length}${akAvg !== null ? ` <span style="font-size:8pt;color:#64748b">(${akAvg}/76)</span>` : ''}</td>
        <td style="text-align:center">${coach.length}${coAvg !== null ? ` <span style="font-size:8pt;color:#64748b">(${coAvg}/32)</span>` : ''}</td>
      </tr>`;
    }).join('');
    const tipeDist = { Dropout: 0, Unfocused: 0, Analytical: 0, Professional: 0 };
    (sk.guru || []).forEach(g => { if (g.tipe && tipeDist[g.tipe] !== undefined) tipeDist[g.tipe]++; });

    Utils.el('printArea').innerHTML = `
      <h1>REKAP SUPERVISI PER SEKOLAH</h1>
      <p class="sub">${Utils.esc(sk.nama_sekolah)} — NPSN ${Utils.esc(sk.npsn || '-')}</p>
      <table class="info">
        <tr><td>Kepala Sekolah</td><td>:</td><td><strong>${Utils.esc(sk.ks_nama || '-')}</strong></td></tr>
        <tr><td>NIP KS</td><td>:</td><td>${Utils.esc(sk.ks_nip || '-')}</td></tr>
        <tr><td>Wilayah</td><td>:</td><td>${Utils.esc(c.wilayah || '-')}</td></tr>
        <tr><td>Terakhir Sync</td><td>:</td><td>${Utils.date(sk.updated_at)}</td></tr>
      </table>
      <h2>Ringkasan Kinerja</h2>
      <table class="info">
        <tr><td>Total Guru</td><td>:</td><td><strong>${m.totalGuru}</strong></td></tr>
        <tr><td>Total Sesi</td><td>:</td><td>${m.totalSesi} (3T: ${m.totalSup3}, PM: ${m.totalPM}, Akademik: ${m.totalAkad}, Coaching: ${m.totalCo})</td></tr>
        <tr><td>Coverage</td><td>:</td><td><strong>${m.coverage}%</strong></td></tr>
        <tr><td>Skor Kinerja</td><td>:</td><td><strong>${m.score}</strong> (${m.kategori})</td></tr>
      </table>
      <h2>Distribusi Tipe Guru (Glickman)</h2>
      <table class="ind"><thead><tr><th>Dropout</th><th>Unfocused</th><th>Analytical</th><th>Professional</th><th>Belum Dinilai</th></tr></thead>
      <tbody><tr>
        <td style="text-align:center">${tipeDist.Dropout}</td>
        <td style="text-align:center">${tipeDist.Unfocused}</td>
        <td style="text-align:center">${tipeDist.Analytical}</td>
        <td style="text-align:center">${tipeDist.Professional}</td>
        <td style="text-align:center">${m.totalGuru - (tipeDist.Dropout + tipeDist.Unfocused + tipeDist.Analytical + tipeDist.Professional)}</td>
      </tr></tbody></table>
      <h2>Daftar Guru & Riwayat Supervisi</h2>
      <table class="ind"><thead><tr>
        <th style="text-align:center">#</th>
        <th>Nama</th><th>Mapel</th>
        <th style="text-align:center">Tipe</th>
        <th style="text-align:center">3T</th>
        <th style="text-align:center">PM</th>
        <th style="text-align:center">Akademik</th>
        <th style="text-align:center">Coaching</th>
      </tr></thead><tbody>${guruRows || '<tr><td colspan="8" style="text-align:center">—</td></tr>'}</tbody></table>
      <div class="ttd-grid">
        <div class="ttd-box"><div>Kepala Sekolah</div><div class="ttd-space"></div><div class="ttd-name">${Utils.esc(sk.ks_nama || '...')}</div><div style="font-size:8.5pt;color:#64748b">NIP. ${Utils.esc(sk.ks_nip || '...')}</div></div>
        <div class="ttd-box"><div>Pengawas</div><div class="ttd-space"></div><div class="ttd-name">${Utils.esc(c.nama_pengawas || '...')}</div><div style="font-size:8.5pt;color:#64748b">NIP. ${Utils.esc(c.nip_pengawas || '...')}</div></div>
      </div>`;
    setTimeout(() => window.print(), 200);
  },

  _csvGuru() {
    const list = allGuru();
    const rows = [['Sekolah', 'NPSN', 'Nama', 'NIP', 'Mapel', 'Kelas', 'Kepegawaian', 'Tipe', 'Pendekatan', '3T', 'PM', 'Akademik', 'Coaching']];
    list.sort((a, b) => a._skNama.localeCompare(b._skNama) || a.nama.localeCompare(b.nama)).forEach(g => {
      const sk = Store.get('sekolah').find(x => x.id === g._skId);
      const n3 = (sk?.supervisi || []).filter(s => s.gid === g.id).length;
      const nPM = (sk?.supervisiPM || []).filter(s => s.gid === g.id).length;
      const nA = (sk?.akademik || []).filter(s => s.gid === g.id).length;
      const nC = (sk?.coaching || []).filter(s => s.gid === g.id).length;
      rows.push([g._skNama, g._skNpsn || '', g.nama, g.nip || '', g.mapel || '', g.kelas || '', g.peg || '', g.tipe || '', g.pendekatan || '', n3, nPM, nA, nC]);
    });
    Utils.downloadCSV(rows, `SISPA_Guru_${new Date().toISOString().slice(0, 10)}.csv`);
    Utils.toast(`${list.length} guru diekspor`, 'success');
  },

  _csvSup() {
    const list = allSesi();
    const rows = [['Sekolah', 'Guru', 'Jenis', 'Tanggal', 'Status', 'Skor', 'Max']];
    list.forEach(s => {
      const g = guruBySekolah(s._skId, s.gid);
      let max = '';
      let skor = s.skor;
      if (s._jenis === 'Akademik') { max = 76; }
      else if (s._jenis === 'Coaching') { max = 32; }
      else if (s._jenis === 'Supervisi PM') {
        max = 100;
        skor = (s.telaah && s.telaah.nilai) || 0;
      }
      const status = s._jenis === '3 Tahap' || s._jenis === 'Supervisi PM'
        ? (s.status || 'draft')
        : 'selesai';
      rows.push([s._skNama, g?.nama || '?', s._jenis, s.tgl || '', status, skor ?? '', max]);
    });
    Utils.downloadCSV(rows, `SISPA_Supervisi_${new Date().toISOString().slice(0, 10)}.csv`);
    Utils.toast(`${list.length} sesi diekspor`, 'success');
  },

  _csvRekap() {
    const sekolah = Store.get('sekolah');
    const rows = [['Sekolah', 'NPSN', 'KS', 'Guru', 'Sesi', 'PM', 'Coverage', 'Avg Akademik', 'Avg Coaching', 'Avg Telaah PM', 'Kelengkapan RTL', 'Skor', 'Kategori']];
    sekolah.forEach(sk => {
      const m = metricsSekolah(sk);
      rows.push([
        sk.nama_sekolah, sk.npsn || '', sk.ks_nama || '',
        m.totalGuru, m.totalSesi, m.totalPM, m.coverage,
        m.avgAk ?? '', m.avgCo ?? '', m.avgPM ?? '',
        m.kelengkapan, m.score, m.kategori
      ]);
    });
    Utils.downloadCSV(rows, `SISPA_Rekap_${new Date().toISOString().slice(0, 10)}.csv`);
    Utils.toast(`${sekolah.length} sekolah diekspor`, 'success');
  }
};
