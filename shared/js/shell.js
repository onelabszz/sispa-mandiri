import { Icons } from './icons.js';
import { Utils } from './utils.js';

export const Shell = {
  buildSidebar(nav, activeKey, config, role = 'KS') {
    const sidebar = Utils.el('sidebar');
    if (!sidebar) return;
    const ini = (config.nama_ks || config.nama_pengawas || 'K').charAt(0).toUpperCase();
    const user = config.nama_ks || config.nama_pengawas || '—';
    const school = config.nama_sekolah || config.wilayah || (role === 'KS' ? 'Sekolah' : 'Wilayah');
    const roleLabel = role === 'KS' ? 'Kepala Sekolah' : 'Pengawas';

    let navHtml = '';
    nav.forEach(n => {
      if (n.section) {
        navHtml += `<div class="sidebar-section-title">${n.section}</div>`;
      } else {
        navHtml += `<button class="nav-item" data-tab="${n.key}">
          <span class="nav-icon">${Icons.svg(n.icon, 18)}</span>
          <span>${Utils.esc(n.label)}</span>
        </button>`;
      }
    });

    sidebar.innerHTML = `
      <div class="sidebar-brand">
        <div class="sidebar-logo">${Icons.svg('graduation-cap', 20)}</div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;color:var(--slate-900);font-size:.875rem;line-height:1.2">SISPA</div>
          <div id="sidebarSchool" style="font-size:.75rem;color:var(--slate-500);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${Utils.esc(school)}</div>
        </div>
        <button class="btn-icon sm" id="sidebarClose" style="display:none" aria-label="Tutup menu">${Icons.svg('x', 18)}</button>
      </div>
      <nav class="sidebar-nav" id="sidebarNav">${navHtml}</nav>
      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="sidebar-user-avatar">${ini}</div>
          <div style="flex:1;min-width:0">
            <div id="sidebarUser" style="font-size:.75rem;font-weight:500;color:var(--slate-900);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${Utils.esc(user)}</div>
            <div style="font-size:.75rem;color:var(--slate-500)">${roleLabel}</div>
          </div>
        </div>
      </div>`;

    Shell.updateActive(activeKey);
  },

  buildHeader(config, role = 'KS') {
    const header = Utils.el('header');
    if (!header) return;
    const ini = (config.nama_ks || config.nama_pengawas || 'K').charAt(0).toUpperCase();
    const subtitle = role === 'KS'
      ? (config.npsn ? `NPSN <span style="font-family:monospace">${Utils.esc(config.npsn)}</span>` : Utils.esc(config.nama_sekolah || ''))
      : Utils.esc(config.wilayah || 'SISPA Pengawas');

    header.innerHTML = `
      <button class="btn-icon" id="menuBtn" aria-label="Menu">${Icons.svg('menu', 20)}</button>
      <div style="flex:1;min-width:0">
        <div style="font-size:.875rem;font-weight:500;color:var(--slate-500)">${subtitle}</div>
      </div>
      <button id="profileBtn" style="display:flex;align-items:center;gap:.5rem;padding:.25rem .5rem .25rem .25rem;border-radius:999px;border:none;background:transparent;cursor:pointer">
        <div style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:.875rem;background:var(--brand-100);color:var(--brand-700)">${ini}</div>
      </button>`;
  },

  updateActive(key) {
    document.querySelectorAll('.nav-item[data-tab]').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === key);
    });
  },

  buildProfileMenu(config, role, onLock, onLogout) {
    const menu = Utils.el('profileMenu');
    if (!menu) return;
    const name = config.nama_ks || config.nama_pengawas || '—';
    const sub = config.nama_sekolah || config.wilayah || '—';
    
    menu.innerHTML = `
      <div style="padding:.75rem;border-bottom:1px solid var(--slate-100);margin-bottom:.25rem">
        <div style="font-weight:600;font-size:.875rem;color:var(--slate-900);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${Utils.esc(name)}</div>
        <div style="font-size:.75rem;color:var(--slate-500);margin-top:.125rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${Utils.esc(sub)}</div>
        <div style="font-size:.75rem;color:var(--slate-400);margin-top:.125rem">${role === 'KS' ? 'Kepala Sekolah' : 'Pengawas'}</div>
      </div>
      <button id="btnLock" class="nav-item" style="width:100%;border:none;background:transparent;color:var(--slate-700);text-align:left">
        ${Icons.svg('lock', 18)} <span>Kunci Aplikasi</span>
      </button>
      <button id="btnLogout" class="nav-item" style="width:100%;border:none;background:transparent;color:var(--danger);text-align:left">
        ${Icons.svg('log-out', 18)} <span>Keluar</span>
      </button>`;
      
    Utils.el('btnLock').onclick = onLock;
    Utils.el('btnLogout').onclick = () => { 
      Shell.closeProfileMenu(); 
      onLogout?.(); 
    };
  },

  toggleProfileMenu() {
    const m = Utils.el('profileMenu');
    const btn = Utils.el('profileBtn');
    if (!m || !btn) return;
    const rect = btn.getBoundingClientRect();
    m.style.top = (rect.bottom + 8) + 'px';
    m.style.right = Math.max(8, window.innerWidth - rect.right) + 'px';
    m.classList.toggle('show');
  },

  closeProfileMenu() { Utils.el('profileMenu')?.classList.remove('show'); },

  openSidebar() {
    Utils.el('sidebar')?.classList.add('open');
    Utils.el('overlay')?.classList.add('show');
  },

  closeSidebar() {
    if (window.innerWidth < 1024) {
      Utils.el('sidebar')?.classList.remove('open');
      Utils.el('overlay')?.classList.remove('show');
    }
  }
};
