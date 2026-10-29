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

  _setFilter(filterType) {
    this._detailId = null;
    sessionStorage.setItem('sispa_sekolah_filter', filterType);
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
          <button class="btn btn-secondary" id="btnRefreshStatus" title="Cek status klaim dari KS">${Icons.svg('refresh-cw', 16)} Refresh Status</button>
          <button class="btn btn-secondary" id="btnPickDB">${Icons.svg('server', 16)} Pilih dari DB</button>
          <button class="btn btn-primary" id="btnImportJSON">${Icons.svg('file-json', 16)} Import JSON KS</button>
        </div>
      </div>

      ${list.length === 0 ? `<div class="card"><div class="card-body">
        ${emptyState('school', 'Belum ada sekolah', 'Tambahkan sekolah binaan dengan mengambil dari database atau impor file JSON dari KS.',
          `<div style="display:flex;gap:.5rem;justify-content:center;margin-top:1rem;flex-wrap:wrap">
             <button class="btn btn-secondary" id="btnEmptyPickDB">${Icons.svg('server', 16)} Pilih dari DB</button>
             <button class="btn btn-primary" id="btnEmptyImportJSON">${Icons.svg('file-json', 16)} Import JSON</button>
           </div>`)}
      </div></div>` : `
        <div class="card"><div class="card-body" style="padding:.75rem">
          <div style="display:grid;grid-template-columns:2fr 1.5fr 1.5fr 2fr auto;gap:.5rem;align-items:end">
            <div><label class="label">Sekolah</label><select class="select" id="filterSk">
              <option value="">Semua Sekolah</option>
              ${list.map(sk => `<option value="${sk.id}">${Utils.esc(sk.nama_sekolah)}</option>`).join('')}
            </select></div>
            <div><label class="label">Status Klaim</label><select class="select" id="filterKlaim">
              <option value="">Semua Klaim</option>
              <option value="confirmed">Terkonfirmasi</option>
              <option value="pending">Pending</option>
              <option value="nodata">Belum Ada Data</option>
              <option value="none">Belum Diklaim</option>
            </select></div>
            <div><label class="label">Coverage</label><select class="select" id="filterCoverage">
              <option value="">Semua</option>
              <option value="low">Rendah (&lt;50%)</option>
              <option value="mid">Sedang (50-79%)</option>
              <option value="high">Tinggi (≥80%)</option>
            </select></div>
            <div><label class="label">Cari</label><input class="input" id="filterQ" placeholder="NPSN / Nama..."></div>
            <div><button class="btn btn-ghost" id="btnResetFilter" title="Reset Filter">${Icons.svg('x', 14)}</button></div>
          </div>
        </div></div>
        <div class="card"><div id="sekolahList"></div></div>
      `}
    `;
  },

  async _bindList() {
    const pendingFilter = sessionStorage.getItem('sispa_sekolah_filter');
    if (pendingFilter) {
      sessionStorage.removeItem('sispa_sekolah_filter');
      if (['pending', 'nodata', 'confirmed', 'none'].includes(pendingFilter)) {
        setTimeout(() => {
          const filterSel = Utils.el('filterKlaim');
          if (filterSel) {
            filterSel.value = pendingFilter;
            this._draw();
          }
        }, 50);
      }
    }

    Utils.el('btnRefreshStatus')?.addEventListener('click', () => this.refreshStatusKlaim());
    Utils.el('btnPickDB')?.addEventListener('click', () => this.pickFromDB());
    Utils.el('btnEmptyPickDB')?.addEventListener('click', () => this.pickFromDB());
    Utils.el('btnImportJSON')?.addEventListener('click', () => this.startImportJSON());
    Utils.el('btnEmptyImportJSON')?.addEventListener('click', () => this.startImportJSON());

    Utils.el('filterSk')?.addEventListener('change', () => this._draw());
    Utils.el('filterKlaim')?.addEventListener('change', () => this._draw());
    Utils.el('filterCoverage')?.addEventListener('change', () => this._draw());
    Utils.el('filterQ')?.addEventListener('input', Utils.debounce(() => this._draw(), 150));
    Utils.el('btnResetFilter')?.addEventListener('click', () => {
      Utils.el('filterSk').value = '';
      Utils.el('filterKlaim').value = '';
      Utils.el('filterCoverage').value = '';
      Utils.el('filterQ').value = '';
      this._draw();
    });

    if (Store.get('sekolah').length > 0) {
      this._draw();
    }
  },

  _draw() {
    const box = Utils.el('sekolahList');
    if (!box) return;

    const list = Store.get('sekolah');
    const filterSk = Utils.el('filterSk')?.value || '';
    const filterKlaim = Utils.el('filterKlaim')?.value || '';
    const filterCoverage = Utils.el('filterCoverage')?.value || '';
    const filterQ = Utils.el('filterQ')?.value?.toLowerCase().trim() || '';

    let filtered = list.slice();

    if (filterSk) filtered = filtered.filter(sk => sk.id === filterSk);

    if (filterKlaim === 'confirmed') {
      filtered = filtered.filter(sk => sk.pengawas_status === 'confirmed');
    } else if (filterKlaim === 'pending') {
      filtered = filtered.filter(sk => sk.pengawas_status === 'pending');
    } else if (filterKlaim === 'none') {
      filtered = filtered.filter(sk => !sk.pengawas_status && !sk.pengawas_nip);
    } else if (filterKlaim === 'nodata') {
      filtered = filtered.filter(sk => {
        const isConfirmed = sk.pengawas_status === 'confirmed' || !sk.pengawas_status;
        const noData = (sk.guru || []).length === 0
          && (sk.supervisi || []).length === 0
          && (sk.akademik || []).length === 0
          && (sk.coaching || []).length === 0
          && (sk.supervisiPM || []).length === 0;
        return isConfirmed && noData;
      });
    }

    if (filterCoverage) {
      filtered = filtered.filter(sk => {
        const totalGuru = (sk.guru || []).length;
        const gidsWithSesi = new Set();
        [...(sk.supervisi || []), ...(sk.akademik || []), ...(sk.coaching || []), ...(sk.supervisiPM || [])].forEach(s => gidsWithSesi.add(s.gid));
        const covered = (sk.guru || []).filter(g => gidsWithSesi.has(g.id)).length;
        const cov = totalGuru > 0 ? Math.round(covered / totalGuru * 100) : 0;
        if (filterCoverage === 'low') return cov < 50;
        if (filterCoverage === 'mid') return cov >= 50 && cov < 80;
        if (filterCoverage === 'high') return cov >= 80;
        return true;
      });
    }

    if (filterQ) {
      filtered = filtered.filter(sk =>
        (sk.nama_sekolah || '').toLowerCase().includes(filterQ) ||
        (sk.npsn || '').toLowerCase().includes(filterQ)
      );
    }

    if (filtered.length === 0) {
      box.innerHTML = `<div style="padding:3rem 1rem;text-align:center;color:var(--slate-400);font-size:.85rem">Tidak ada sekolah yang cocok dengan filter</div>`;
      return;
    }

    box.innerHTML = `<table>
      <thead><tr>
        <th>Sekolah</th>
        <th style="text-align:center">Guru</th>
        <th style="text-align:center">Sesi</th>
        <th style="text-align:center">Coverage</th>
        <th style="text-align:center">Klaim</th>
        <th>Terakhir Sync</th>
        <th style="text-align:right">Aksi</th>
      </tr></thead>
      <tbody>${filtered.map(sk => {
        const sesi = (sk.supervisi || []).length + (sk.akademik || []).length + (sk.coaching || []).length + (sk.supervisiPM || []).length;
        const totalGuru = (sk.guru || []).length;
        const gidsWithSesi = new Set();
        [...(sk.supervisi || []), ...(sk.akademik || []), ...(sk.coaching || []), ...(sk.supervisiPM || [])].forEach(s => gidsWithSesi.add(s.gid));
        const covered = (sk.guru || []).filter(g => gidsWithSesi.has(g.id)).length;
        const coverage = totalGuru > 0 ? Math.round(covered / totalGuru * 100) : 0;
        const covColor = coverage >= 80 ? 'success' : coverage >= 50 ? 'warning' : 'danger';
        const days = Utils.daysAgo(sk.updated_at);
        const stale = days === null || days > 30;

        let statusKlaim = `<span style="font-size:.7rem;color:var(--slate-400)">—</span>`;
        if (sk.pengawas_status === 'confirmed') {
          statusKlaim = `<span class="badge badge-success" style="font-size:.7rem">${Icons.svg('check-circle', 12)} Dikonfirmasi</span>`;
        } else if (sk.pengawas_status === 'pending') {
          statusKlaim = `<span class="badge badge-warning" style="font-size:.7rem">${Icons.svg('clock', 12)} Menunggu</span>`;
        } else if (sk.pengawas_status === 'rejected') {
          statusKlaim = `<span class="badge badge-danger" style="font-size:.7rem">${Icons.svg('x-circle', 12)} Ditolak</span>`;
        }

        const noData = totalGuru === 0 && sesi === 0;
        const noDataBadge = noData ? `<div style="font-size:.65rem;color:var(--info);margin-top:.2rem">Belum ada data</div>` : '';

        return `<tr>
          <td>
            <div style="font-weight:600">${Utils.esc(sk.nama_sekolah)}</div>
            <div style="font-size:.75rem;color:var(--slate-500);font-family:monospace">NPSN ${Utils.esc(sk.npsn || '-')}</div>
          </td>
          <td style="text-align:center;font-weight:600">${totalGuru}</td>
          <td style="text-align:center;font-weight:600">${sesi}</td>
          <td style="text-align:center">
            <span class="badge badge-${covColor}">${coverage}%</span>
            ${noDataBadge}
          </td>
          <td style="text-align:center">${statusKlaim}</td>
          <td><span class="badge ${stale ? 'badge-warning' : 'badge-success'}">${Utils.relTime(sk.updated_at)}</span></td>
          <td style="text-align:right;white-space:nowrap">
            <button class="btn btn-primary btn-sm" data-open="${sk.id}">${Icons.svg('eye', 14)} Detail</button>
            <button class="btn btn-danger btn-sm" data-del="${sk.id}">${Icons.svg('trash-2', 14)}</button>
          </td>
        </tr>`;
      }).join('')}</tbody>
    </table>`;

    box.querySelectorAll('[data-open]').forEach(b => {
      b.onclick = () => {
        this._detailId = b.dataset.open;
        this._activeTab = 'guru';
        Router.navigate('sekolah');
      };
    });
    box.querySelectorAll('[data-del]').forEach(b => {
      b.onclick = () => this.hapus(b.dataset.del);
    });
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
    const sesiPM = (sk.supervisiPM || []).length;
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
            ${sesi3} Supervisi 3T · ${sesiPM} PM · ${sesiAk} Akademik · ${sesiCo} Coaching
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
        const nPM = (sk.supervisiPM || []).filter(s => s.gid === g.id).length;
        const nA = (sk.akademik || []).filter(s => s.gid === g.id).length;
        const nC = (sk.coaching || []).filter(s => s.gid === g.id).length;
        const total = n3 + nPM + nA + nC;
        return `<tr>
          <td>
            <div style="font-weight:600">${Utils.esc(g.nama)}</div>
            <div style="font-size:.75rem;color:var(--slate-500);font-family:monospace">${Utils.esc(g.nip || '-')}</div>
          </td>
          <td style="font-size:.85rem">${Utils.esc(g.mapel || '-')}${g.kelas ? ' · Kls ' + Utils.esc(g.kelas) : ''}</td>
          <td style="text-align:center">${g.abstraksi ? `<span class="badge badge-${g.abstraksi === 'tinggi' ? 'success' : 'danger'}">${g.abstraksi === 'tinggi' ? 'Tinggi' : 'Rendah'}</span>` : '<span style="color:var(--slate-400);font-size:.75rem">—</span>'}</td>
          <td style="text-align:center">${g.komitmen ? `<span class="badge badge-${g.komitmen === 'tinggi' ? 'success' : 'danger'}">${g.komitmen === 'tinggi' ? 'Tinggi' : 'Rendah'}</span>` : '<span style="color:var(--slate-400);font-size:.75rem">—</span>'}</td>
          <td style="text-align:center">${g.tipe ? `<span class="badge badge-${tipeBadge[g.tipe] || 'neutral'}">${g.tipe}</span>` : '<span style="color:var(--slate-400);font-size:.75rem">Belum</span>'}</td>
          <td style="text-align:center"><strong>${total}</strong> <span style="font-size:.7rem;color:var(--slate-500)">(${n3}T, ${nPM}PM, ${nA}A, ${nC}C)</span></td>
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
      ...(sk.supervisiPM || []).map(s => ({ ...s, _jenis: 'Supervisi PM', _skorPM: (s.telaah && s.telaah.nilai) || 0 })),
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
        const max = s._jenis === 'Akademik' ? 76 : s._jenis === 'Coaching' ? 32 : s._jenis === 'Supervisi PM' ? 100 : null;
        const badge = s._jenis === 'Akademik' ? 'info' : s._jenis === 'Coaching' ? 'warning' : s._jenis === 'Supervisi PM' ? 'success' : 'neutral';
        const skorVal = s._jenis === 'Supervisi PM' ? s._skorPM : s.skor;
        return `<tr>
          <td style="font-weight:600">${Utils.esc(g?.nama || '?')}</td>
          <td><span class="badge badge-${badge}">${s._jenis}</span></td>
          <td>${Utils.date(s.tgl)}</td>
          <td style="text-align:center;font-weight:700">${skorVal !== undefined && skorVal !== null ? skorVal : '—'}${max ? `<span style="font-weight:400;color:var(--slate-400);font-size:.7rem">/${max}</span>` : ''}</td>
        </tr>`;
      }).join('')}</tbody>
    </table></div>`;
  },

  _renderTabProgress(sk) {
    const guru = sk.guru || [];
    if (guru.length === 0) {
      return `<div class="card"><div class="card-body">${emptyState('users', 'Belum ada guru', 'Data guru belum tersedia.')}</div></div>`;
    }

    let tot3 = 0, totPM = 0, totAk = 0, totCo = 0;
    const matrix = guru.map(g => {
      const has3 = (sk.supervisi || []).some(s => s.gid === g.id);
      const hasPM = (sk.supervisiPM || []).some(s => s.gid === g.id);
      const hasAk = (sk.akademik || []).some(s => s.gid === g.id);
      const hasCo = (sk.coaching || []).some(s => s.gid === g.id);
      if (has3) tot3++;
      if (hasPM) totPM++;
      if (hasAk) totAk++;
      if (hasCo) totCo++;
      return { guru: g, has3, hasPM, hasAk, hasCo };
    });

    const pct = (n) => Math.round(n / guru.length * 100);

    return `
      <div class="grid-auto" style="margin-bottom:1rem">
        <div class="stat-card">
          <div class="stat-icon" style="background:#e0e7ff;color:#4338ca">${Icons.svg('clipboard-list', 22)}</div>
          <div><div style="font-size:.75rem;color:var(--slate-500)">Supervisi 3 Tahap</div><div style="font-size:1.5rem;font-weight:700">${tot3}<span style="color:var(--slate-400);font-size:1rem;font-weight:500">/${guru.length}</span></div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fce7f3;color:#9d174d">${Icons.svg('book-open-check', 22)}</div>
          <div><div style="font-size:.75rem;color:var(--slate-500)">Supervisi PM</div><div style="font-size:1.5rem;font-weight:700">${totPM}<span style="color:var(--slate-400);font-size:1rem;font-weight:500">/${guru.length}</span></div></div>
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
          <th style="text-align:center">PM</th>
          <th style="text-align:center">Akademik</th>
          <th style="text-align:center">Coaching</th>
          <th style="text-align:center">Coverage</th>
        </tr></thead>
        <tbody>${matrix.map(m => {
          const cov = [m.has3, m.hasPM, m.hasAk, m.hasCo].filter(Boolean).length;
          const covColor = cov === 4 ? 'success' : cov >= 2 ? 'warning' : cov >= 1 ? 'info' : 'danger';
          return `<tr>
            <td>
              <div style="font-weight:600">${Utils.esc(m.guru.nama)}</div>
              <div style="font-size:.75rem;color:var(--slate-500)">${Utils.esc(m.guru.mapel || '-')}${m.guru.tipe ? ` · <span class="badge badge-info" style="font-size:.6rem">${m.guru.tipe}</span>` : ''}</div>
            </td>
            <td style="text-align:center">${m.has3 ? `<span style="color:var(--success)">${Icons.svg('check-circle', 20)}</span>` : `<span style="color:var(--slate-300)">${Icons.svg('x', 20)}</span>`}</td>
            <td style="text-align:center">${m.hasPM ? `<span style="color:var(--success)">${Icons.svg('check-circle', 20)}</span>` : `<span style="color:var(--slate-300)">${Icons.svg('x', 20)}</span>`}</td>
            <td style="text-align:center">${m.hasAk ? `<span style="color:var(--success)">${Icons.svg('check-circle', 20)}</span>` : `<span style="color:var(--slate-300)">${Icons.svg('x', 20)}</span>`}</td>
            <td style="text-align:center">${m.hasCo ? `<span style="color:var(--success)">${Icons.svg('check-circle', 20)}</span>` : `<span style="color:var(--slate-300)">${Icons.svg('x', 20)}</span>`}</td>
            <td style="text-align:center"><span class="badge badge-${covColor}">${cov}/4</span></td>
          </tr>`;
        }).join('')}</tbody>
      </table></div>

      <div style="text-align:center;font-size:.75rem;color:var(--slate-500);margin-top:.75rem">
        <strong>Coverage Ringkas:</strong>
        3T ${pct(tot3)}% · PM ${pct(totPM)}% · Akademik ${pct(totAk)}% · Coaching ${pct(totCo)}%
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
      ['Status Klaim', sk.pengawas_status || 'Belum'],
      ['Terakhir Sync', Utils.date(sk.updated_at)],
      [],
      ['Nama Guru', 'NIP', 'Mapel', 'Kelas', 'Kepegawaian', 'Abstraksi', 'Komitmen', 'Tipe Glickman', 'Supervisi 3T', 'Supervisi PM', 'Akademik', 'Coaching']
    ];
    (sk.guru || []).forEach(g => {
      const n3 = (sk.supervisi || []).filter(s => s.gid === g.id).length;
      const nPM = (sk.supervisiPM || []).filter(s => s.gid === g.id).length;
      const nA = (sk.akademik || []).filter(s => s.gid === g.id).length;
      const nC = (sk.coaching || []).filter(s => s.gid === g.id).length;
      rows.push([g.nama, g.nip || '', g.mapel || '', g.kelas || '', g.peg || '', g.abstraksi || '', g.komitmen || '', g.tipe || '', n3, nPM, nA, nC]);
    });

    Utils.downloadCSV(rows, `SISPA_${sk.npsn}_${new Date().toISOString().slice(0, 10)}.csv`);
    Utils.toast('CSV terunduh', 'success');
  },

  // ============================================
  // PILIH DARI DB
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

      const renderList = () => {
        const totalPages = Math.ceil(filtered.length / perPage);
        if (page > totalPages) page = Math.max(1, totalPages);
        if (page < 1) page = 1;

        const start = (page - 1) * perPage;
        const data = filtered.slice(start, start + perPage);

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

        Utils.el('dbCount').textContent = filtered.length;
        Utils.el('btnSavePick').innerHTML = `Klaim ${selected.size > 0 ? `(${selected.size})` : ''} Sekolah`;

        document.querySelectorAll('.db-cb').forEach(cb => {
          cb.onchange = (e) => {
            if (e.target.checked) selected.add(e.target.value);
            else selected.delete(e.target.value);
            e.target.closest('label').style.background = e.target.checked ? 'var(--brand-50)' : 'transparent';
            Utils.el('btnSavePick').innerHTML = `Klaim ${selected.size > 0 ? `(${selected.size})` : ''} Sekolah`;
          };
        });
      };

      Utils.el('searchDB').addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase().trim();
        filtered = available.filter(s => s.nama_sekolah.toLowerCase().includes(q) || s.npsn.includes(q));
        page = 1;
        renderList();
      });

      Utils.el('btnSelectAllPage').onclick = () => {
        const start = (page - 1) * perPage;
        const data = filtered.slice(start, start + perPage);
        const allChecked = data.every(s => selected.has(s.npsn));
        data.forEach(s => allChecked ? selected.delete(s.npsn) : selected.add(s.npsn));
        renderList();
      };

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
              pengawas_status: 'pending',
              imported_at: new Date().toISOString(), updated_at: new Date().toISOString(),
              guru: [], program: [], supervisi: [], supervisiPM: [], akademik: [], coaching: []
            });
          }
          await Store.set('sekolah', [...localSchools, ...newSk]);
          Utils.closeModal();
          Utils.toast(`${selected.size} sekolah diklaim (menunggu konfirmasi KS)`, 'success');
          Router.navigate('sekolah');
        } catch (err) {
          btn.disabled = false;
          btn.innerHTML = 'Klaim';
          Utils.toast('Gagal: ' + err.message, 'error');
        }
      };

      renderList();
    } catch (err) {
      Utils.closeModal();
      Utils.toast(err.message, 'error');
    }
  },

  // ============================================
  // IMPORT JSON
  // ============================================
  startImportJSON() {
    Utils.modal('Import JSON dari KS', `
      ${infoBanner('info', 'info', 'Pilih file JSON hasil ekspor dari SISPA-Offline (KS). Sistem akan memvalidasi NPSN dan pengawas penerima.')}
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

          const myNip = Store.config().nip_pengawas;
          const filePengawasNip = data.config.pengawas_nip;
          if (filePengawasNip && filePengawasNip !== myNip) {
            return Utils.modal('File Bukan Untuk Anda', `
              ${infoBanner('danger', 'alert-triangle', `
                <strong>File ini ditujukan ke Pengawas lain!</strong><br><br>
                File dari <strong>${Utils.esc(data.config.nama_sekolah)}</strong> mencantumkan pengawas NIP <code>${Utils.esc(filePengawasNip)}</code>, bukan Anda (<code>${Utils.esc(myNip)}</code>).
              `)}
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

    const arrays = ['guru', 'program', 'supervisi', 'supervisiPM', 'akademik', 'coaching'];
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
        ${data.version ? `<tr><td style="padding:.3rem .5rem;color:var(--slate-500)">Versi JSON</td><td><code>${Utils.esc(data.version)}</code></td></tr>` : ''}
      </table>
      ${data.schema_flags && !data.schema_flags.supervisiPM && (data.supervisiPM || []).length === 0 ? `
        <div style="padding:.6rem .85rem;background:#fef3c7;border-radius:8px;font-size:.8rem;color:#92400e;margin-bottom:1rem;line-height:1.5">
          ⚠️ File ini dari aplikasi KS versi lama (tanpa data Supervisi PM). Data lain tetap bisa di-import.
        </div>
      ` : ''}
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
        ${diffRow('Guru', diff.guru)}${diffRow('Program', diff.program)}${diffRow('Supervisi 3T', diff.supervisi)}${diffRow('Supervisi PM', diff.supervisiPM)}${diffRow('Akademik', diff.akademik)}${diffRow('Coaching', diff.coaching)}
      </div>
    `, `<button class="btn btn-secondary" onclick="Utils.closeModal()">Batal</button><button class="btn btn-primary" id="btnConfirm">Import</button>`, true);

    Utils.el('btnConfirm').onclick = () => {
      const mode = document.querySelector('input[name="impMode"]:checked').value;
      const now = new Date().toISOString();
      existing.nama_sekolah = cfg.nama_sekolah;
      existing.ks_nama = cfg.nama_ks || existing.ks_nama || '';
      existing.ks_nip = cfg.nip_ks || existing.ks_nip || '';
      existing.updated_at = now;
      ['guru', 'program', 'supervisi', 'supervisiPM', 'akademik', 'coaching'].forEach(k => {
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

  // ============================================
  // REFRESH STATUS KLAIM
  // ============================================
  async refreshStatusKlaim() {
    const myNip = Store.config().nip_pengawas;
    if (!myNip) return Utils.toast('NIP pengawas tidak ditemukan', 'error');
    if (!Supabase.isReady()) return Utils.toast('Butuh internet untuk refresh status', 'error');

    const btn = Utils.el('btnRefreshStatus');
    const orig = btn?.innerHTML;
    if (btn) { btn.disabled = true; btn.innerHTML = `${Icons.svg('refresh-cw', 14)} Memeriksa...`; }

    try {
      const klaimList = await Supabase.getAllKlaimByNip(myNip);
      const klaimMap = {};
      klaimList.forEach(k => { klaimMap[k.npsn] = k.pengawas_status; });

      const list = Store.get('sekolah');
      let updated = 0;
      list.forEach(sk => {
        const st = klaimMap[sk.npsn] || null;
        if (sk.pengawas_status !== st) {
          sk.pengawas_status = st;
          updated++;
        }
      });
      await Store.set('sekolah', list);

      Utils.toast(updated > 0 ? `${updated} status klaim diperbarui` : 'Tidak ada perubahan status', 'success');
      Router.navigate('sekolah');
    } catch (err) {
      Utils.toast('Gagal: ' + err.message, 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = orig; }
    }
  },

  // ============================================
  // HAPUS
  // ============================================
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
