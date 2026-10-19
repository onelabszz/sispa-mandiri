export const Utils = {
  el: id => document.getElementById(id),
  esc: s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
  today: () => new Date().toISOString().slice(0, 10),
  uid: () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
  date: iso => iso ? new Date(iso).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }) : '—',
  now: () => new Date().toISOString(),
  relTime: iso => {
    if (!iso) return '—';
    const diff = Date.now() - new Date(iso).getTime();
    const d = Math.floor(diff / 86400000);
    if (d === 0) return 'Hari ini';
    if (d === 1) return 'Kemarin';
    if (d < 7) return d + ' hari lalu';
    if (d < 30) return Math.floor(d/7) + ' minggu lalu';
    if (d < 365) return Math.floor(d/30) + ' bulan lalu';
    return Math.floor(d/365) + ' tahun lalu';
  },
  daysAgo: iso => iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86400000) : null,
  debounce: (fn, ms = 200) => {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  },
  toast: (msg, type = '', iconName = null) => {
    const t = Utils.el('toast');
    const icon = iconName || (type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : type === 'warning' ? 'alert-triangle' : 'info');
    t.innerHTML = `${Utils._icon(icon, 18)}<span>${Utils.esc(msg)}</span>`;
    t.className = 'toast show' + (type ? ' toast-' + type : '');
    clearTimeout(Utils._tt);
    Utils._tt = setTimeout(() => { t.className = 'toast' + (type ? ' toast-' + type : ''); }, 2800);
  },
  _icon: (name, size) => {
    if (window.Icons) return window.Icons.svg(name, size);
    return '';
  },
  modal: (title, body, footer, wide = false) => {
    Utils.el('modalTitle').textContent = title;
    Utils.el('modalBody').innerHTML = body;
    Utils.el('modalFooter').innerHTML = footer || `<button class="btn btn-secondary" onclick="Utils.closeModal()">Tutup</button>`;
    Utils.el('modalPanel').classList.toggle('wide', !!wide);
    Utils.el('modalBack').classList.add('show');
    if (window.Icons) window.Icons.inject();
  },
  closeModal: () => Utils.el('modalBack').classList.remove('show'),
  confirm: (title, msg, yes) => {
    Utils.modal(title, `<p style="margin:0;color:var(--slate-700)">${Utils.esc(msg)}</p>`,
      `<button class="btn btn-secondary" onclick="Utils.closeModal()">Batal</button><button class="btn btn-danger" id="btnYes">Ya, Lanjutkan</button>`);
    Utils.el('btnYes').onclick = () => { Utils.closeModal(); yes(); };
  },
  downloadFile: (content, filename, type = 'application/json') => {
    const blob = new Blob([content], { type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  },
  downloadJSON: (data, filename) => {
    Utils.downloadFile(JSON.stringify(data, null, 2), filename, 'application/json');
  },
  downloadCSV: (rows, filename) => {
    const csv = rows.map(r => r.map(cell => {
      const s = String(cell ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n') ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(',')).join('\r\n');
    Utils.downloadFile('\uFEFF' + csv, filename, 'text/csv;charset=utf-8');
  }
};

if (typeof window !== 'undefined') window.Utils = Utils;
