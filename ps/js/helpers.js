import { Store } from '../storage.js';
import { Icons } from '../../shared/js/icons.js';

export const emptyState = (icon, title, sub, cta = '') => `
  <div class="empty-state">
    <div class="empty-icon">${Icons.svg(icon, 48)}</div>
    <h3>${title}</h3>
    <p>${sub}</p>
    ${cta}
  </div>`;

export const infoBanner = (type, icon, text) => `
  <div class="info-banner ${type}">
    ${Icons.svg(icon, 18)}
    <div>${text}</div>
  </div>`;

export const allGuru = () => {
  const out = [];
  Store.get('sekolah').forEach(sk => {
    (sk.guru || []).forEach(g => out.push({ ...g, _skId: sk.id, _skNama: sk.nama_sekolah, _skNpsn: sk.npsn }));
  });
  return out;
};

export const allSesi = () => {
  const out = [];
  Store.get('sekolah').forEach(sk => {
    (sk.supervisi || []).forEach(s => out.push({ ...s, _jenis: '3 Tahap', _skId: sk.id, _skNama: sk.nama_sekolah }));
    (sk.supervisiPM || []).forEach(s => out.push({ ...s, _jenis: 'Supervisi PM', _skId: sk.id, _skNama: sk.nama_sekolah }));
    (sk.akademik || []).forEach(s => out.push({ ...s, _jenis: 'Akademik', _skId: sk.id, _skNama: sk.nama_sekolah }));
    (sk.coaching || []).forEach(s => out.push({ ...s, _jenis: 'Coaching', _skId: sk.id, _skNama: sk.nama_sekolah }));
  });
  return out.sort((a, b) => (b.tgl || '').localeCompare(a.tgl || ''));
};

export const guruBySekolah = (skId, gid) => {
  const sk = Store.get('sekolah').find(x => x.id === skId);
  return sk ? (sk.guru || []).find(g => g.id === gid) : null;
};

export const metricsSekolah = (sk) => {
  const guru = sk.guru || [];
  const sup3 = sk.supervisi || [];
  const pm = sk.supervisiPM || [];
  const akad = sk.akademik || [];
  const coach = sk.coaching || [];
  const totalSesi = sup3.length + pm.length + akad.length + coach.length;
  const totalGuru = guru.length;

  const gidsWithSesi = new Set();
  [...sup3, ...pm, ...akad, ...coach].forEach(s => gidsWithSesi.add(s.gid));
  const covered = guru.filter(g => gidsWithSesi.has(g.id)).length;
  const coverage = totalGuru > 0 ? Math.round(covered / totalGuru * 100) : 0;

  const volRaw = totalGuru > 0 ? totalSesi / totalGuru : 0;
  const volNorm = Math.min(100, Math.round(volRaw / 4 * 100));

  let withRtl = 0;
  sup3.forEach(s => { if (s.rtl && (s.rtl.aksi || '').trim()) withRtl++; });
  // PM: cek refleksi item 18 (RTL) — handle key number & string
  pm.forEach(s => {
    const r = s.refleksi || {};
    const rtlText = r[18] || r['18'] || '';
    if (String(rtlText).trim()) withRtl++;
  });
  akad.forEach(s => { if ((s.rtl || '').trim()) withRtl++; });
  coach.forEach(s => { if ((s.rtl || []).some(r => (r.aksi || '').trim())) withRtl++; });
  const kelengkapan = totalSesi > 0 ? Math.round(withRtl / totalSesi * 100) : 0;

  const score = Math.round(coverage * 0.4 + volNorm * 0.3 + kelengkapan * 0.3);

  let kategori, katClass;
  if (score >= 85) { kategori = 'Sangat Baik'; katClass = 'success'; }
  else if (score >= 70) { kategori = 'Baik'; katClass = 'info'; }
  else if (score >= 50) { kategori = 'Cukup'; katClass = 'warning'; }
  else { kategori = 'Perlu Pembinaan'; katClass = 'danger'; }

  const avgAk = akad.length > 0 ? Math.round(akad.reduce((s, x) => s + (x.skor || 0), 0) / akad.length) : null;
  const avgCo = coach.length > 0 ? Math.round(coach.reduce((s, x) => s + (x.skor || 0), 0) / coach.length) : null;
  // PM: rata-rata nilai telaah (0-100)
  const pmNilais = pm.map(s => (s.telaah && s.telaah.nilai) || 0).filter(n => n > 0);
  const avgPM = pmNilais.length > 0 ? Math.round(pmNilais.reduce((a, b) => a + b, 0) / pmNilais.length) : null;

  return {
    totalGuru, totalSesi, coverage,
    volumeRaw: Math.round(volRaw * 10) / 10, volumeNorm: volNorm,
    kelengkapan, avgAk, avgCo, avgPM, score, kategori, katClass,
    totalSup3: sup3.length, totalPM: pm.length, totalAkad: akad.length, totalCo: coach.length
  };
};

export const rankBadge = (rank) => {
  const cls = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-default';
  return `<span class="rank-badge ${cls}">${rank}</span>`;
};
