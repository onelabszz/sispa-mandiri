import { Store } from '../../storage.js';
import { Utils } from '../../../shared/js/utils.js';
import { Icons } from '../../../shared/js/icons.js';
import { Router } from '../../../shared/js/router.js';
import { Supabase } from '../../../shared/js/supabase.js';
import { emptyState, infoBanner } from '../helpers.js';

export const Sekolah = {
  _detailId: null,
  _activeTab: 'guru',

  async render() {
    if (this._detailId) return this._renderDetail();
    return this._renderList();
  },

  async bind() {
    if (this._detailId) return this._bindDetail();
    return this._bindList();
  },

  // ============================================
  // MODE LIST
  // ============================================
  _renderList() {
    const list = Store.get('sekolah');
    return `
      <div class="page-head">
        <div>
          <h2>Sekolah Binaan</h2>
          <div class="page-sub">${list.length} sekolah terdaftar di perangkat ini</div>
        </div>
        <div style="display:flex;gap:.5rem;flex-wrap:wrap">
          <button class="btn btn-secondary" id="btnPickDB">${Icons.svg('server', 16)} Pilih dari DB</button>
          <button class="btn btn-primary" id="btnImportJSON">${Icons.svg('file-json', 16)} Import JSON KS</button>
        </div>
      </div>

      ${list.length === 0 ? `<div class="card"><div class="card-body">
        ${emptyState('school', 'Belum ada sekolah', 'Tambahkan sekolah binaan dengan mengambil dari database atau impor file JSON dari KS.',
          `<div style="display:flex;gap:.5rem;justify-content:center;margin-top:1rem">
             <button class="btn btn-secondary" id="btnEmptyPickDB">${Icons.svg('server', 16)} Pilih dari DB</button>
             <button class="btn btn-primary" id="btnEmptyImportJSON">${Icons.svg('file-json', 16)} Import JSON</button>
           </div>`)}
      </div></div>` : `
        <div class="card"><table>
          <thead><tr>
            <th>Sekolah</th>
            <th style="text-align:center">Guru</th>
            <th style="text-align:center">Sesi</th>
            <th style="text-align:center">Coverage</th>
            <th>Terakhir Sync</th>
            <th style="text-align:right">Aksi</th>
          </tr></thead>
          <tbody>${list.map(sk => {
            const sesi = (sk.supervisi || []).length + (sk.akademik || []).length + (sk.coaching || []).length;
            const totalGuru = (sk.guru || []).length;
            const gidsWithSesi = new Set();
            [...(sk.supervisi || []), ...(sk.akademik || []), ...(sk.coaching || [])].forEach(s => gidsWithSesi.add(s.gid));
            const covered = (sk.guru || []).filter(g => gidsWithSesi.has(g.id)).length;
            const coverage = totalGuru > 0 ? Math.round(covered / totalGuru * 100) : 0;
            const covColor = coverage >= 80 ? 'success' : coverage >= 50 ? 'warning' : 'danger';
            const days = Utils.daysAgo(sk.updated_at);
            const stale = days === null || days > 30;
            return `<tr>
              <td>
                <div style="font-weight:600">${Utils.esc(sk.nama_sekolah)}</div>
                <div style="font-size:.75rem;color:var(--slate-500);font-family:monospace">NPSN ${Utils.esc(sk.npsn || '-')}</div>
              </td>
              <td style="text-align:center;font-weight:600">${totalGuru}</td>
              <td style="text-align:center;font-weight:600">${sesi}</td>
              <td style="text-align:center"><span class="badge badge-${covColor}">${coverage}%</span></td>
              <td><span class="badge ${stale ? 'badge-warning' : 'badge-success'}">${Utils.relTime(sk.updated_at)}</span></td>
              <td style="text-align:right;white-space:nowrap">
                <button class="btn btn-primary btn-sm" data-open="${sk.id}">${Icons.svg('eye', 14)} Detail</button>
                <button class="btn btn-danger btn-sm" data-del="${sk.id}">${Icons.svg('trash-2', 14)}</button>
              </td>
            </tr>`;
          }).join('')}</tbody>
        </table></div>
      `}
    `;
  },

  async _bindList() {
    Utils.el('btnImportJSON')?.addEventListener('click', () => this.startImportJSON());
    Utils.el('btnEmptyImportJSON')?.addEventListener('click', () => this.startImportJSON());
    Utils.el('btnPickDB')?.addEventListener('click', () => this.pickFromDB());
    Utils.el('btnEmptyPickDB')?.addEventListener('click', () => this.pickFromDB());

    document.querySelectorAll('[data-open]').forEach(b => {
      b.onclick = () => {
        this._detailId = b.dataset.open;
        this._activeTab = 'guru';
        Router.navigate('sekolah');
      };
    });
    document.querySelectorAll('[data-del]').forEach(b => b.onclick = () => this.hapus(b.dataset.del));
  },

  // ============================================
  // MODE DETAIL
  // ============================================
  _renderDetail() {
    const sk = Store.get('sekolah').find(x => x.id === this._detailId);
    if (!sk) { this._detailId = null; return this._renderList(); }

    const tab = this._activeTab;
    const tabContent = tab === 'guru' ? this._renderTabGuru(sk)
      : tab === 'program' ? this._renderTabProgram(sk)
      : tab === 'progress' ? this._renderTabProgress(sk)
      : this._renderTabSupervisi(sk);

    const sesi3 = (sk.supervisi || []).length;
    const sesiAk = (sk.akademik || []).length;
    const sesiCo = (sk.coaching || []).length;

    return `
      <div class="page-head">
        <div>
          <button class="btn btn-secondary btn-sm" id="btnBackSekolah" style="margin-bottom:.75rem">
            ${Icons.svg('chevron-left', 14)} Kembali
          </button>
          <h2 style="margin:0">${Utils.esc(sk.nama_sekolah)}</h2>
          <div class="page-sub">
            NPSN <span style="font-family:monospace">${Utils.esc(sk.npsn || '-')}</span> ·
            ${sesi3} Supervisi 3T · ${sesiAk} Akademik · ${sesiCo} Coaching
          </div>
        </div>
        <button class="btn btn-secondary" id="btnExportCSV">${Icons.svg('download', 16)} Export CSV</button>
      </div>

      <div class="tab-nav">
        <button class="tab-btn ${tab === 'guru' ? 'active' : ''}" data-tab="guru">${Icons.svg('users', 16)} Profil Guru</button>
        <button class="tab-btn ${tab === 'program' ? 'active' : ''}" data-tab="program">${Icons.svg('calendar-days', 16)} Program</button>
        <button class="tab-btn ${tab === 'supervisi' ? 'active' : ''}" data-tab="supervisi">${Icons.svg('clipboard-list', 16)} Supervisi</button>
        <button class="tab-btn ${tab === 'progress' ? 'active' : ''}" data-tab="progress">${Icons.svg('target', 16)} Progress Matrix</button>
      </div>

      ${tabContent}
    `;
  },

  async _bindDetail() {
    Utils.el('btnBackSekolah').onclick = () => {
      this._detailId = null;
      Router.navigate('sekolah');
    };
    Utils.el('btnExportCSV').onclick = () => this._exportCSV();

    document.querySelectorAll('.tab-nav .tab-btn').forEach(b => {
      b.onclick = () => {
        this._activeTab = b.dataset.tab;
        Router.navigate('sekolah');
      };
    });
  },

  _renderTabGuru(sk) {
    const guru = sk.guru || [];
    if (guru.length === 0) {
      return `<div class="card"><div class="card-body">${emptyState('users', 'Belum ada guru', 'Data guru akan muncul setelah KS mengirim JSON.')}</div></div>`;
    }

    const tipeBadge = { Dropout: 'danger', Unfocused: 'warning', Analytical: 'info', Professional: 'success' };

    return `<div class="card"><table>
      <thead><tr>
        <th>Nama / NIP</th>
        <th>Mapel</th>
        <th style="text-align:center">Abstraksi</th>
        <th style="text-align:center">Komitmen</th>
        <th style="text-align:center">Tipe Glickman</th>
        <th style="text-align:center">Total Sesi</th>
      </tr></thead>
      <tbody>${guru.map(g => {
        const n3 = (sk.supervisi || []).filter(s => s.gid === g.id).length;
        const nA = (sk.akademik || []).filter(s => s.gid === g.id).length;
        const nC = (sk.coaching || []).filter(s => s.gid === g.id).length;
        const total = n3 + nA + nC;
        return `<tr>
          <td>
            <div style="font-weight:600">${Utils.esc(g.nama)}</div>
            <div style="font-size:.75rem;color:var(--slate-500);font-family:monospace">${Utils.esc(g.nip || '-')}</div>
          </td>
          <td style="font-size:.85rem">${Utils.esc(g.mapel || '-')}${g.kelas ? ' · Kls ' + Utils.esc(g.kelas) : ''}</td>
          <td style="text-align:center">${g.abstraksi ? `<span class="badge badge-${g.abstraksi === 'tinggi' ? 'success' : 'danger'}">${g.abstraksi === 'tinggi' ? 'Tinggi' : 'Rendah'}</span>` : '<span style="color:var(--slate-400);font-size:.75rem">—</span>'}</td>
          <td style="text-align:center">${g.komitmen ? `<span class="badge badge-${g.komitmen === 'tinggi' ? 'success' : 'danger'}">${g.komitmen === 'tinggi' ? 'Tinggi' : 'Rendah'}</span>` : '<span style="color:var(--slate-400);font-size:.75rem">—</span>'}</td>
          <td style="text-align:center">${g.tipe ? `<span class="badge badge-${tipeBadge[g.tipe] || 'neutral'}">${g.tipe}</span>` : '<span style="color:var(--slate-400);font-size:.75rem">Belum</span>'}</td>
          <td style="text-align:center"><strong>${total}</strong> <span style="font-size:.7rem;color:var(--slate-500)">(${n3}T, ${nA}A, ${nC}C)</span></td>
        </tr>`;
      }).join('')}</tbody>
    </table></div>`;
  },

  _renderTabProgram(sk) {
    const prog = sk.program || [];
    if (prog.length === 0) {
      return `<div class="card"><div class="card-body">${emptyState('calendar-days', 'Belum ada program', 'Program supervisi akan muncul setelah KS mengirim JSON.')}</div></div>`;
    }
    const guru = sk.guru || [];
    return `<div class="card"><table>
      <thead><tr>
        <th>Guru</th>
        <th>Periode</th>
        <th>Waktu Rencana</th>
      </tr></thead>
      <tbody>${prog.map(p => {
        const g = guru.find(x => x.id === p.gid);
        return `<tr>
          <td style="font-weight:600">${Utils.esc(g?.nama || '?')}</td>
          <td style="font-family:monospace;font-size:.8rem">${Utils.esc(p.periode)}</td>
          <td style="font-size:.85rem">${p.waktu ? Utils.date(p.waktu) : '—'}</td>
        </tr>`;
      }).join('')}</tbody>
    </table></div>`;
  },

  _renderTabSupervisi(sk) {
    const all = [
      ...(sk.supervisi || []).map(s => ({ ...s, _jenis: '3 Tahap' })),
      ...(sk.akademik || []).map(s => ({ ...s, _jenis: 'Akademik' })),
      ...(sk.coaching || []).map(s => ({ ...s, _jenis: 'Coaching' }))
    ].sort((a, b) => (b.tgl || '').localeCompare(a.tgl || ''));

    if (all.length === 0) {
      return `<div class="card"><div class="card-body">${emptyState('clipboard-list', 'Belum ada supervisi', 'Data supervisi akan muncul setelah KS mengirim JSON.')}</div></div>`;
    }

    const guru = sk.guru || [];
    return `<div class="card"><table>
      <thead><tr>
        <th>Guru</th>
        <th>Jenis</th>
        <th>Tanggal</th>
        <th style="text-align:center">Skor</th>
      </tr></thead>
      <tbody>${all.map(s => {
        const g = guru.find(x => x.id === s.gid);
        const max = s._jenis === 'Akademik' ? 76 : s._jenis === 'Coaching' ? 32 : null;
        const badge = s._jenis === 'Akademik' ? 'info' : s._jenis === 'Coaching' ? 'warning' : 'neutral';
        return `<tr>
          <td style="font-weight:600">${Utils.esc(g?.nama || '?')}</td>
          <td><span class="badge badge-${badge}">${s._jenis}</span></td>
          <td>${Utils.date(s.tgl)}</td>
          <td style="text-align:center;font-weight:700">${s.skor !== undefined ? s.skor : '—'}${max ? `<span style="font-weight:400;color:var(--slate-400);font-size:.7rem">/${max}</span>` : ''}</td>
        </tr>`;
      }).join('')}</tbody>
    </table></div>`;
  },

  _renderTabProgress(sk) {
    const guru = sk.guru || [];
    if (guru.length === 0) {
      return `<div class="card"><div class="card-body">${emptyState('users', 'Belum ada guru', 'Data guru belum tersedia.')}</div></div>`;
    }

    // Hitung summary
    let tot3 = 0, totAk = 0, totCo = 0;
    const matrix = guru.map(g => {
      const has3 = (sk.supervisi || []).some(s => s.gid === g.id);
      const hasAk = (sk.akademik || []).some(s => s.gid === g.id);
      const hasCo = (sk.coaching || []).some(s => s.gid === g.id);
      if (has3) tot3++; if (hasAk) totAk++; if (hasCo) totCo++;
      return { guru: g, has3, hasAk, hasCo };
    });

    const pct = (n) => Math.round(n / guru.length * 100);

    return `
      <div class="grid-auto" style="margin-bottom:1rem">
        <div class="stat-card">
          <div class="stat-icon" style="background:#e0e7ff;color:#4338ca">${Icons.svg('clipboard-list', 22)}</div>
          <div><div style="font-size:.75rem;color:var(--slate-500)">Supervisi 3 Tahap</div><div style="font-size:1.5rem;font-weight:700">${tot3}<span style="color:var(--slate-400);font-size:1rem;font-weight:500">/${guru.length}</span></div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#dbeafe;color:#1e40af">${Icons.svg('laptop', 22)}</div>
          <div><div style="font-size:.75rem;color:var(--slate-500)">Obs. Akademik</div><div style="font-size:1.5rem;font-weight:700">${totAk}<span style="color:var(--slate-400);font-size:1rem;font-weight:500">/${guru.length}</span></div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fef3c7;color:#92400e">${Icons.svg('message-circle', 22)}</div>
          <div><div style="font-size:.75rem;color:var(--slate-500)">Obs. Coaching</div><div style="font-size:1.5rem;font-weight:700">${totCo}<span style="color:var(--slate-400);font-size:1rem;font-weight:500">/${guru.length}</span></div></div>
        </div>
      </div>

      <div class="card"><table>
        <thead><tr>
          <th>Guru</th>
          <th style="text-align:center">3 Tahap</th>
          <th style="text-align:center">Akademik</th>
          <th style="text-align:center">Coaching</th>
          <th style="text-align:center">Coverage</th>
        </tr></thead>
        <tbody>${matrix.map(m => {
          const cov = [m.has3, m.hasAk, m.hasCo].filter(Boolean).length;
          const covColor = cov === 3 ? 'success' : cov >= 1 ? 'warning' : 'danger';
          return `<tr>
            <td>
              <div style="font-weight:600">${Utils.esc(m.guru.nama)}</div>
              <div style="font-size:.75rem;color:var(--slate-500)">${Utils.esc(m.guru.mapel || '-')}${m.guru.tipe ? ` · <span class="badge badge-info" style="font-size:.6rem">${m.guru.tipe}</span>` : ''}</div>
            </td>
            <td style="text-align:center">${m.has3 ? `<span style="color:var(--success)">${Icons.svg('check-circle', 20)}</span>` : `<span style="color:var(--slate-300)">${Icons.svg('x', 20)}</span>`}</td>
            <td style="text-align:center">${m.hasAk ? `<span style="color:var(--success)">${Icons.svg('check-circle', 20)}</span>` : `<span style="color:var(--slate-300)">${Icons.svg('x', 20)}</span>`}</td>
            <td style="text-align:center">${m.hasCo ? `<span style="color:var(--success)">${Icons.svg('check-circle', 20)}</span>` : `<span style="color:var(--slate-300)">${Icons.svg('x', 20)}</span>`}</td>
            <td style="text-align:center"><span class="badge badge-${covColor}">${cov}/3</span></td>
          </tr>`;
        }).join('')}</tbody>
      </table></div>

      <div style="text-align:center;font-size:.75rem;color:var(--slate-500);margin-top:.75rem">
        <strong>Coverage Ringkas:</strong>
        3T ${pct(tot3)}% · Akademik ${pct(totAk)}% · Coaching ${pct(totCo)}%
      </div>
    `;
  },

  _exportCSV() {
    const sk = Store.get('sekolah').find(x => x.id === this._detailId);
    if (!sk) return;

    const rows = [
      ['SISPA — Rekap Sekolah', sk.nama_sekolah],
      ['NPSN', sk.npsn || ''],
      ['KS', sk.ks_nama || ''],
      ['Terakhir Sync', Utils.date(sk.updated_at)],
      [],
      ['Nama Guru', 'NIP', 'Mapel', 'Kelas', 'Kepegawaian', 'Abstraksi', 'Komitmen', 'Tipe Glickman', 'Supervisi 3T', 'Akademik', 'Coaching']
    ];
    (sk.guru || []).forEach(g => {
      const n3 = (sk.supervisi || []).filter(s => s.gid === g.id).length;
      const nA = (sk.akademik || []).filter(s => s.gid === g.id).length;
      const nC = (sk.coaching || []).filter(s => s.gid === g.id).length;
      rows.push([g.nama, g.nip || '', g.mapel || '', g.kelas || '', g.peg || '', g.abstraksi || '', g.komitmen || '', g.tipe || '', n3, nA, nC]);
    });

    Utils.downloadCSV(rows, `SISPA_${sk.npsn}_${new Date().toISOString().slice(0, 10)}.csv`);
    Utils.toast('CSV terunduh', 'success');
  },

  // ============================================
  // PICK FROM DB (tidak diubah)
  // ============================================
  async pickFromDB() {
    Utils.modal('Pilih Sekolah dari Database', `<div style="text-align:center;padding:2rem;color:var(--slate-500)">Memuat data...</div>`, '<button class="btn btn-secondary" onclick="Utils.closeModal()">Tutup</button>', true);

    try {
      const allSchools = await Supabase.getAllSekolah();
      const localSchools = Store.get('sekolah');
      const localNpsns = new Set(localSchools.map(s => s.npsn));
      const myNip = Store.config().nip_pengawas;

      const available = allSchools.filter(s => {
        if (localNpsns.has(s.npsn)) return false;
        if (s.pengawas_nip && s.pengawas_nip !== myNip) return false;
        return true;
      });

      if (available.length === 0) {
        Utils.closeModal();
        return Utils.toast('Tidak ada sekolah baru yang tersedia (atau semua sudah dibina PS lain).', 'info');
      }

      let filtered = [...available];
      let page = 1;
      const perPage = 10;
      const selected = new Set();

      // 1. RENDER KERANGKA MODAL (Hanya Sekali)
      Utils.modal('Pilih Sekolah dari Database', `
        <div style="margin-bottom:1rem">
          <input type="text" id="searchDB" class="input" placeholder="Cari NPSN atau nama sekolah...">
        </div>
        <div style="margin-bottom:1rem;display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:.85rem;color:var(--slate-500)"><strong id="dbCount">${filtered.length}</strong> sekolah tersedia</span>
          <button class="btn btn-secondary btn-sm" id="btnSelectAllPage">Pilih Semua di Halaman</button>
        </div>
        <div id="dbListContainer" style="max-height:45vh;overflow-y:auto;border:1px solid var(--slate-200);border-radius:8px"></div>
        <div id="dbPagination"></div>
      `, `<button class="btn btn-secondary" onclick="Utils.closeModal()">Batal</button><button class="btn btn-primary" id="btnSavePick">Klaim Sekolah</button>`, true);

      // 2. FUNGSI RENDER LIST (Hanya mengupdate list dan pagination)
      const renderList = () => {
        const totalPages = Math.ceil(filtered.length / perPage);
        if (page > totalPages) page = Math.max(1, totalPages);
        if (page < 1) page = 1;

        const start = (page - 1) * perPage;
        const data = filtered.slice(start, start + perPage);

        // Update List Container
        const listContainer = Utils.el('dbListContainer');
        if (data.length === 0) {
          listContainer.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--slate-400);font-size:.85rem">Tidak ada hasil</div>';
        } else {
          listContainer.innerHTML = data.map(s => `
            <label style="display:flex;align-items:center;gap:.75rem;padding:.75rem;border-bottom:1px solid var(--slate-100);cursor:pointer;background:${selected.has(s.npsn) ? 'var(--brand-50)' : 'transparent'}">
              <input type="checkbox" class="db-cb" value="${s.npsn}" data-nama="${Utils.esc(s.nama_sekolah)}" ${selected.has(s.npsn) ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--brand-600)">
              <div><div style="font-weight:600;font-size:.9rem">${Utils.esc(s.nama_sekolah)}</div><div style="font-size:.75rem;color:var(--slate-500);font-family:monospace">NPSN: ${s.npsn}</div></div>
            </label>
          `).join('');
        }

        // Update Pagination Container
        const pagContainer = Utils.el('dbPagination');
        if (totalPages > 1) {
          pagContainer.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:1rem;padding-top:1rem;border-top:1px solid var(--slate-200)">
              <button class="btn btn-secondary btn-sm" id="prevPage" ${page === 1 ? 'disabled' : ''}>Prev</button>
              <span style="font-size:.8rem;color:var(--slate-500)">Halaman ${page} dari ${totalPages}</span>
              <button class="btn btn-secondary btn-sm" id="nextPage" ${page === totalPages ? 'disabled' : ''}>Next</button>
            </div>
          `;
          Utils.el('prevPage').onclick = () => { page--; renderList(); };
          Utils.el('nextPage').onclick = () => { page++; renderList(); };
        } else {
          pagContainer.innerHTML = '';
        }

        // Update Text
        Utils.el('dbCount').textContent = filtered.length;
        Utils.el('btnSavePick').innerHTML = `Klaim ${selected.size > 0 ? `(${selected.size})` : ''} Sekolah`;
        
        // Bind Checkbox
        document.querySelectorAll('.db-cb').forEach(cb => {
          cb.onchange = (e) => {
            if (e.target.checked) selected.add(e.target.value);
            else selected.delete(e.target.value);
            e.target.closest('label').style.background = e.target.checked ? 'var(--brand-50)' : 'transparent';
            Utils.el('btnSavePick').innerHTML = `Klaim ${selected.size > 0 ? `(${selected.size})` : ''} Sekolah`;
          };
        });
      };

      // 3. BIND EVENT PENCARIAN
      Utils.el('searchDB').addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase().trim();
        filtered = available.filter(s => s.nama_sekolah.toLowerCase().includes(q) || s.npsn.includes(q));
        page = 1;
        renderList(); // Hanya render ulang list, input search tidak disentuh
      });

      // 4. BIND SELECT ALL PER HALAMAN
      Utils.el('btnSelectAllPage').onclick = () => {
        const start = (page - 1) * perPage;
        const data = filtered.slice(start, start + perPage);
        const allChecked = data.every(s => selected.has(s.npsn));
        data.forEach(s => allChecked ? selected.delete(s.npsn) : selected.add(s.npsn));
        renderList();
      };

      // 5. BIND TOMBOL SIMPAN
      Utils.el('btnSavePick').onclick = async () => {
        if (selected.size === 0) return Utils.toast('Pilih minimal satu', 'warning');
        const btn = Utils.el('btnSavePick');
        btn.disabled = true;
        btn.innerHTML = 'Memproses...';
        try {
          const newSk = [];
          for (const npsn of selected) {
            const sk = available.find(s => s.npsn === npsn);
            await Supabase.claimSekolah(npsn, myNip);
            newSk.push({
              id: Utils.uid(), npsn, nama_sekolah: sk.nama_sekolah,
              ks_nama: '', ks_nip: '',
              imported_at: new Date().toISOString(), updated_at: new Date().toISOString(),
              guru: [], program: [], supervisi: [], akademik: [], coaching: []
            });
          }
          await Store.set('sekolah', [...localSchools, ...newSk]);
          Utils.closeModal();
          Utils.toast(`${selected.size} sekolah diklaim`, 'success');
          Router.navigate('sekolah');
        } catch (err) {
          btn.disabled = false;
          btn.innerHTML = 'Klaim';
          Utils.toast('Gagal: ' + err.message, 'error');
        }
      };

      // 6. RENDER PERTAMA KALI
      renderList();

    } catch (err) {
      Utils.closeModal();
      Utils.toast(err.message, 'error');
    }
  },

  // ============================================
  // IMPORT JSON (tidak diubah)
  // ============================================
  startImportJSON() {
    Utils.modal('Import JSON dari KS', `
      ${infoBanner('info', 'info', 'Pilih file JSON hasil ekspor dari SISPA-Offline (KS). Sistem akan memvalidasi NPSN terhadap binaan Anda.')}
      <div class="form-group" style="margin-top:1rem">
        <label class="label">File JSON</label>
        <input type="file" id="jsonFile" accept=".json,application/json" class="input" style="padding:.5rem">
      </div>
    `, `<button class="btn btn-secondary" onclick="Utils.closeModal()">Batal</button><button class="btn btn-primary" id="btnParseJSON">${Icons.svg('chevron-right', 16)} Analisis</button>`);

    Utils.el('btnParseJSON').onclick = () => {
      const file = Utils.el('jsonFile').files[0];
      if (!file) return Utils.toast('Pilih file', 'warning');
      const r = new FileReader();
      r.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          const npsn = String(data.config?.npsn || '').trim();
          if (!npsn) return Utils.toast('File JSON tidak memiliki NPSN.', 'error');

          const localSchools = Store.get('sekolah');
          const isBinaan = localSchools.some(s => String(s.npsn).trim() === npsn);
          if (!isBinaan) {
            return Utils.modal('Akses Ditolak', `
              ${infoBanner('danger', 'alert-triangle', `<strong>Bukan Binaan Anda!</strong><br>File dari <strong>${Utils.esc(data.config.nama_sekolah)}</strong> (NPSN: ${npsn}) belum terdaftar. Tambahkan via "Pilih dari DB" dulu.`)}
            `, '<button class="btn btn-primary" onclick="Utils.closeModal()">Tutup</button>');
          }
          this.processImport(data);
        } catch { Utils.toast('File JSON tidak valid', 'error'); }
      };
      r.readAsText(file, 'UTF-8');
    };
  },

  processImport(data) {
    const cfg = data.config;
    const npsn = String(cfg.npsn).trim();
    const sekolah = Store.get('sekolah');
    const existing = sekolah.find(sk => String(sk.npsn).trim() === npsn);

    const arrays = ['guru', 'program', 'supervisi', 'akademik', 'coaching'];
    const diff = {};
    arrays.forEach(k => {
      const oldArr = existing[k] || [];
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

    this.showPreview({ data, cfg, npsn, existing, diff });
  },

  showPreview({ data, cfg, npsn, existing, diff }) {
    const diffRow = (label, d) => `<div style="display:flex;justify-content:space-between;padding:.55rem .75rem;border-bottom:1px solid var(--slate-100);font-size:.85rem">
      <span>${label}</span><span>${d.baru > 0 ? `<span style="color:var(--success);font-weight:600">${d.baru} baru</span> · ` : ''}${d.update > 0 ? `<span style="color:var(--info);font-weight:600">${d.update} update</span> · ` : ''}<span style="color:var(--slate-400)">${d.sama} sama</span><span style="color:var(--slate-400);font-size:.75rem"> / ${d.total}</span></span>
    </div>`;

    Utils.modal('Update Sekolah', `
      <table style="font-size:.85rem;margin-bottom:1rem">
        <tr><td style="padding:.3rem .5rem;color:var(--slate-500);width:120px">Sekolah</td><td><strong>${Utils.esc(cfg.nama_sekolah)}</strong></td></tr>
        <tr><td style="padding:.3rem .5rem;color:var(--slate-500)">NPSN</td><td style="font-family:monospace">${Utils.esc(npsn)}</td></tr>
        <tr><td style="padding:.3rem .5rem;color:var(--slate-500)">Terakhir Sync</td><td>${Utils.relTime(existing.updated_at)}</td></tr>
      </table>
      <div style="margin-bottom:1rem">
        <label style="display:flex;gap:.5rem;padding:.6rem;border:1.5px solid var(--brand-500);background:var(--brand-50);border-radius:8px;cursor:pointer;margin-bottom:.4rem">
          <input type="radio" name="impMode" value="merge" checked><div><strong style="font-size:.85rem">Merge (aman)</strong><div style="font-size:.75rem;color:var(--slate-600)">Data lama dipertahankan.</div></div>
        </label>
        <label style="display:flex;gap:.5rem;padding:.6rem;border:1.5px solid var(--slate-200);border-radius:8px;cursor:pointer">
          <input type="radio" name="impMode" value="replace"><div><strong style="font-size:.85rem">Replace (reset)</strong><div style="font-size:.75rem;color:var(--slate-600)">Data lama diganti total.</div></div>
        </label>
      </div>
      <div style="font-weight:600;font-size:.85rem;margin-bottom:.35rem">Perubahan:</div>
      <div style="border:1px solid var(--slate-200);border-radius:8px;overflow:hidden">
        ${diffRow('Guru', diff.guru)}${diffRow('Program', diff.program)}${diffRow('Supervisi', diff.supervisi)}${diffRow('Akademik', diff.akademik)}${diffRow('Coaching', diff.coaching)}
      </div>
    `, `<button class="btn btn-secondary" onclick="Utils.closeModal()">Batal</button><button class="btn btn-primary" id="btnConfirm">Import</button>`, true);

    Utils.el('btnConfirm').onclick = () => {
      const mode = document.querySelector('input[name="impMode"]:checked').value;
      const now = new Date().toISOString();
      existing.nama_sekolah = cfg.nama_sekolah;
      existing.ks_nama = cfg.nama_ks || existing.ks_nama || '';
      existing.ks_nip = cfg.nip_ks || existing.ks_nip || '';
      existing.updated_at = now;
      ['guru', 'program', 'supervisi', 'akademik', 'coaching'].forEach(k => {
        if (mode === 'replace') existing[k] = data[k] || [];
        else {
          const oldMap = new Map((existing[k] || []).map(x => [x.id, x]));
          (data[k] || []).forEach(item => oldMap.set(item.id, item));
          existing[k] = [...oldMap.values()];
        }
      });
      Store.set('sekolah', Store.get('sekolah'));
      Utils.closeModal();
      Utils.toast(`Data ${cfg.nama_sekolah} diperbarui`, 'success');
      Router.navigate('sekolah');
    };
  },

  async hapus(id) {
    const sk = Store.get('sekolah').find(x => x.id === id);
    if (!sk) return;
    Utils.confirm('Hapus Sekolah?', `Data ${sk.nama_sekolah} akan dihapus dari perangkat ini dan status klaim di database dilepas.`, async () => {
      try { await Supabase.unclaimSekolah(sk.npsn); } catch {}
      await Store.set('sekolah', Store.get('sekolah').filter(x => x.id !== id));
      Router.navigate('sekolah');
    });
  }
};
