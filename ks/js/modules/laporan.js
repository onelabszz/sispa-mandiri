import { Store } from '../../storage.js';
import { Utils } from '../../../shared/js/utils.js';
import { Icons } from '../../../shared/js/icons.js';
import { Router } from '../../../shared/js/router.js';
import { emptyState } from '../helpers.js';
import { Supervisi } from './supervisi.js';
import { Akademik } from './akademik.js';
import { Coaching } from './coaching.js';

export const Laporan = {
  async render() {
    const akad = Store.get('akademik').map(x => ({ ...x, type: 'Akademik', max: 76 }));
    const coach = Store.get('coaching').map(x => ({ ...x, type: 'Coaching', max: 32 }));
    const sup3 = Store.get('supervisi').map(x => ({ ...x, type: '3 Tahap', max: '-' }));
    const all = [...akad, ...coach, ...sup3].sort((a, b) => (b.tgl || '').localeCompare(a.tgl || ''));
    const guru = Store.get('guru');

    return `
      <div class="page-head">
        <div>
          <h2>Laporan & Riwayat</h2>
          <div class="page-sub">${all.length} sesi total</div>
        </div>
      </div>

      ${all.length === 0 ? `<div class="card"><div class="card-body">
        ${emptyState('file-text', 'Belum ada data', 'Laporan muncul setelah ada sesi supervisi.')}
      </div></div>` : `
        <div class="card"><table>
          <thead><tr>
            <th>Guru</th>
            <th>Jenis</th>
            <th>Tanggal</th>
            <th style="text-align:center">Skor</th>
            <th style="text-align:right">Aksi</th>
          </tr></thead>
          <tbody>${all.map(s => {
            const g = guru.find(x => x.id === s.gid);
            const skor = (s.skor !== undefined && s.skor !== null) ? s.skor : '-';
            const badge = s.type === 'Akademik' ? 'info' : s.type === 'Coaching' ? 'warning' : 'neutral';
            return `<tr>
              <td style="font-weight:600">${Utils.esc(g?.nama || '?')}</td>
              <td><span class="badge badge-${badge}">${s.type}</span></td>
              <td>${Utils.date(s.tgl)}</td>
              <td style="text-align:center;font-weight:700">
                ${skor} ${s.max && s.max !== '-' ? `<span style="font-weight:400;color:var(--slate-400);font-size:.75rem">/ ${s.max}</span>` : ''}
              </td>
              <td style="text-align:right;white-space:nowrap">
                <button class="btn btn-secondary btn-sm" data-print="${s.id}" data-type="${s.type}">${Icons.svg('printer', 14)} Cetak</button>
                <button class="btn btn-danger btn-sm" data-del="${s.id}" data-type="${s.type}">${Icons.svg('trash-2', 14)}</button>
              </td>
            </tr>`;
          }).join('')}</tbody>
        </table></div>
      `}
    `;
  },

  async bind() {
    document.querySelectorAll('[data-print]').forEach(b => {
      b.onclick = () => {
        const type = b.dataset.type;
        const id = b.dataset.print;
        if (type === 'Akademik') Akademik.print(id);
        else if (type === 'Coaching') Coaching.print(id);
        else Supervisi.print(id);
      };
    });
    document.querySelectorAll('[data-del]').forEach(b => {
      b.onclick = () => {
        const id = b.dataset.del;
        const type = b.dataset.type;
        Utils.confirm('Hapus Data?', 'Akan dihapus permanen.', () => {
          if (type === 'Akademik') Store.set('akademik', Store.get('akademik').filter(x => x.id !== id));
          else if (type === 'Coaching') Store.set('coaching', Store.get('coaching').filter(x => x.id !== id));
          else Store.set('supervisi', Store.get('supervisi').filter(x => x.id !== id));
          Router.navigate('laporan');
        });
      };
    });
  }
};
