import { Store } from '../storage.js';
import { Icons } from '../../shared/js/icons.js';

export const guruLabel = (g) => {
  const n3 = Store.get('supervisi').filter(x => x.gid === g.id).length;
  const nA = Store.get('akademik').filter(x => x.gid === g.id).length;
  const nC = Store.get('coaching').filter(x => x.gid === g.id).length;
  const parts = [];
  if (n3 > 0) parts.push(`3T:${n3}`);
  if (nA > 0) parts.push(`Ak:${nA}`);
  if (nC > 0) parts.push(`Co:${nC}`);
  return g.nama + (parts.length ? ' — ' + parts.join(', ') : '');
};

export const guruCount = (gid, jenis) => Store.get(jenis).filter(x => x.gid === gid).length;

export const updateDupWarn = (selId, warnId, jenis) => {
  const sel = document.getElementById(selId);
  const warn = document.getElementById(warnId);
  if (!sel || !warn) return;
  const cnt = guruCount(sel.value, jenis);
  if (cnt > 0) {
    const label = jenis === 'supervisi' ? 'Supervisi 3 Tahap'
      : jenis === 'akademik' ? 'Observasi Akademik'
      : 'Observasi Coaching';
    warn.style.display = 'block';
    warn.innerHTML = `<div style="display:flex;gap:.5rem;align-items:flex-start;padding:.5rem .75rem;background:#fef3c7;border-radius:6px;font-size:.8rem;color:#92400e">
      <span style="flex-shrink:0">${Icons.svg('alert-triangle', 16)}</span>
      <div>Guru ini sudah pernah ${label} <strong>${cnt}×</strong>. Sesi baru akan ditambahkan.</div>
    </div>`;
  } else {
    warn.style.display = 'none';
    warn.innerHTML = '';
  }
};

export const emptyState = (iconName, title, sub, cta = '') => `
  <div class="empty-state">
    <div class="empty-icon">${Icons.svg(iconName, 48)}</div>
    <h3>${title}</h3>
    <p>${sub}</p>
    ${cta}
  </div>`;
