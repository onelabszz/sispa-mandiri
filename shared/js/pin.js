import { Utils } from './utils.js';
import { Icons } from './icons.js';

export const PinLock = {
  temp: '',
  _cfg: {},
  _onSuccess: null,
  _role: 'KS',

  show(cfg, role, onSuccess) {
    this._cfg = cfg;
    this._role = role;
    this._onSuccess = onSuccess;
    this.temp = '';
    const screen = Utils.el('pinScreen');
    if (!screen) return;
    const icon = role === 'KS' ? 'graduation-cap' : 'search';
    const title = role === 'KS' ? 'SISPA Full' : 'SISPA Pengawas';
    screen.innerHTML = `
      <div style="text-align:center">
        <div style="width:64px;height:64px;margin:0 auto 1rem;background:rgba(255,255,255,.15);border-radius:16px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.2);color:#fff">${Icons.svg(icon, 32)}</div>
        <h2 style="font-size:1.5rem;margin:0">${title}</h2>
        <p style="font-size:0.85rem;opacity:.8;margin-top:.5rem">Masukkan PIN 4 digit</p>
        <div class="pin-dots" id="pinDots">
          <div class="pin-dot"></div><div class="pin-dot"></div><div class="pin-dot"></div><div class="pin-dot"></div>
        </div>
        <div class="pin-pad">
          ${['1','2','3','4','5','6','7','8','9'].map(d => `<button class="pin-btn" data-pin="${d}">${d}</button>`).join('')}
          <button class="pin-btn" data-pin="C" style="font-size:16px">C</button>
          <button class="pin-btn" data-pin="0">0</button>
          <button class="pin-btn" data-pin="X" style="font-size:16px">⌫</button>
        </div>
        <div id="pinError" style="color:#fca5a5;margin-top:1rem;font-size:0.8rem;height:20px"></div>
      </div>`;
    screen.classList.add('show');
    this.updateDots();
    screen.querySelectorAll('[data-pin]').forEach(btn => {
      btn.onclick = () => this.input(btn.dataset.pin);
    });
  },

  input(v) {
    if (v === 'C') this.temp = '';
    else if (v === 'X') this.temp = this.temp.slice(0, -1);
    else if (this.temp.length < 4) this.temp += v;
    this.updateDots();
    if (this.temp.length === 4) {
      if (this.temp === this._cfg.pin) {
        sessionStorage.setItem('sispa_unlocked', '1');
        Utils.el('pinScreen').classList.remove('show');
        this._onSuccess?.();
      } else {
        Utils.el('pinError').textContent = 'PIN Salah';
        this.temp = '';
        this.updateDots();
        setTimeout(() => { const e = Utils.el('pinError'); if (e) e.textContent = ''; }, 2000);
      }
    }
  },

  updateDots() {
    document.querySelectorAll('.pin-dot').forEach((d, i) => d.classList.toggle('fill', i < this.temp.length));
  }
};
