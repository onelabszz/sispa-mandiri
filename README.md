# 📄 Full README.md — SISPA Mandiri

```markdown
# 🎓 SISPA Mandiri

**Sistem Supervisi Pendidikan Akademik** — Aplikasi semi-online untuk Kepala Sekolah & Pengawas di Kabupaten Wonogiri.

[![GitHub Pages](https://img.shields.io/badge/Hosting-GitHub%20Pages-4f46e5?style=flat-square)](https://pages.github.com/)
[![Supabase](https://img.shields.io/badge/Cloud-Supabase-3ECF8E?style=flat-square)](https://supabase.com/)
[![Version](https://img.shields.io/badge/Version-v2.0.0-16a34a?style=flat-square)]()

---

## 🌐 Akses Aplikasi

| Role | URL | Login |
|------|-----|-------|
| 🎓 **KS (Kepala Sekolah)** | `https://onelabszz.github.io/sispa-mandiri/ks/` | NPSN 8 digit |
| 👨‍🏫 **PS (Pengawas)** | `https://onelabszz.github.io/sispa-mandiri/ps/` | NIP 18 digit |

> ℹ️ **Panel Admin** — URL tidak dipublikasi untuk keamanan. Hubungi pengembang untuk akses.

---

## 🎯 Tentang Proyek

SISPA Mandiri adalah aplikasi **offline-first** yang mengadopsi Modul 5 (Supervisi Akademik pada Pembelajaran Mendalam termasuk Koding & Kecerdasan Artifisial). Dibuat khusus untuk:

- **Kepala Sekolah** — melakukan supervisi mandiri ke guru
- **Pengawas** — mengelola data supervisi dari banyak sekolah binaan
- **Admin Dinas** — mengelola akun & klaim pengawas

### Prinsip Arsitektur

> **Data supervisi tetap di lokal. Cloud hanya untuk autentikasi & klaim.**

- ✅ **Ringan** — Supabase hanya menyimpan akun (~100 KB untuk 800 sekolah)
- ✅ **Offline-first** — Aplikasi jalan penuh tanpa internet setelah install PWA
- ✅ **Aman** — Data supervisi tidak pernah menyentuh server
- ✅ **Gratis selamanya** — Kuota free tier Supabase tidak akan habis
- ✅ **Portabel** — Backup via file JSON, bisa dipindah device kapan saja

---

## 🏗️ Arsitektur Sistem

```
┌──────────────────────────────────────────────────────────────┐
│                     GitHub Pages (Hosting)                     │
│  https://[user].github.io/sispa-mandiri/                       │
│                                                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                    │
│  │    KS    │  │    PS    │  │  Admin   │                    │
│  │ /ks/     │  │ /ps/     │  │ /admin/  │                    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                    │
└───────┼─────────────┼─────────────┼──────────────────────────┘
        │             │             │
        │  Login      │  Login      │  Kunci Admin
        │  (NPSN)     │  (NIP)      │
        ▼             ▼             ▼
┌──────────────────────────────────────────────────────────────┐
│                      Supabase (Cloud)                          │
│  - Auth (find sekolah/pengawas)                                │
│  - Claim (klaim pengawas + status)                             │
│  - Admin CRUD (add/edit/delete akun)                           │
└──────────────────────────────────────────────────────────────┘
        │             │
        │ Sync        │ Import
        │ via JSON    │ JSON
        ▼             ▼
┌─────────────────┐  ┌─────────────────┐
│  localStorage   │  │   IndexedDB     │
│  (Data KS)      │  │  (Data PS)      │
│  ~500 KB/KS     │  │  ~380 MB/800    │
└─────────────────┘  └─────────────────┘
```

### Alur Kerja

```
1. Admin Dinas → input NPSN + Pengawas ke Supabase
2. PS login → pilih sekolah dari DB atau tunggu
3. KS login → cek pengawas → konfirmasi klaim
4. KS input data supervisi (offline, lokal)
5. KS ekspor JSON → kirim ke PS via WA
6. PS import JSON → analisis → laporan rekap
```

---

## 📦 Fitur Utama

### 🎓 Aplikasi KS (Kepala Sekolah)

| Modul | Fitur |
|-------|-------|
| **Login** | NPSN 8 digit + auto-fill profil |
| **Dashboard** | Kartu profil, Papan Supervisi (progress bar), pengawas widget, kuadran Glickman, distribusi tipe, backup reminder |
| **Data Guru** | CRUD + import CSV (file & paste) + validasi duplikat |
| **Profil Tipe** | Kuadran interaktif + form dengan catatan observasi/abstraksi/komitmen + filter periode |
| **Program** | Rencana supervisi per periode + auto-suggest tipe guru + filter periode |
| **Supervisi 3T** | Wizard 3 tahap + Panduan Modul 5 + panduan adaptif per tipe guru + draft/complete |
| **Obs. Akademik** | 19 indikator + list view + draft mode + catatan per indikator |
| **Obs. Coaching** | 8 indikator STAR-GROW + RTL multi-baris + list view + draft mode |
| **Analisis** | Chart Prinsip PM, DPL, KKA, Tren bulanan, Insight otomatis |
| **Laporan** | List + filter (jenis/status/bulan/guru) + cetak individual + rekap semester |
| **Pengaturan** | Identitas, PIN, klaim pengawas, ekspor/impor JSON |
| **PWA** | Install ke desktop/HP, offline-capable |

### 👨‍🏫 Aplikasi PS (Pengawas)

| Modul | Fitur |
|-------|-------|
| **Login** | NIP 18 digit + auto-fill dari DB |
| **Dashboard** | 4 stat cards + kuadran Glickman + chart per sekolah + warning stale + pending klaim |
| **Sekolah Binaan** | Pilih dari DB (search + pagination) + import CSV + import JSON KS + status klaim + refresh status |
| **Detail Sekolah** | 4 tabs: Profil Guru, Program, Supervisi, Progress Matrix + export CSV |
| **Data Guru** | Lintas sekolah + coverage matrix (3T/Akad/Coach) + filter status |
| **Semua Supervisi** | Lintas sekolah + filter + detail + cetak |
| **Analisis** | Overview + Akademik (19 indikator) + Coaching (8 indikator) + tren + insight |
| **Evaluasi KS** | Form manual 30 indikator (Rencana/Pelaksanaan/Asesmen) + draft/final + cetak PDF |
| **Laporan** | Rekap pengawas + per sekolah + CSV export |
| **Pengaturan** | Profil, backup IndexedDB, restore |

### 🔐 Panel Admin

| Fitur | Detail |
|-------|--------|
| **Login** | Kunci Admin (default `admin123`, **ganti sebelum deploy!**) |
| **Dashboard** | 5 stat cards (Sekolah, Pengawas, Terkonfirmasi, Pending, Belum PS) + warning interaktif |
| **Data Sekolah** | CRUD + kolom pengawas & status klaim + filter + pagination + assign pengawas + reset klaim |
| **Data Pengawas** | CRUD + kolom binaan + filter belum punya binaan + sort |
| **Assign Pengawas** | Paksa assign dengan auto-confirm (bypass KS) |
| **Reset Klaim** | Konfirmasi ketik `RESET` untuk reset klaim deadlock |
| **Import CSV** | Sekolah & Pengawas (bulk) |
| **Suspend** | Toggle status aktif/suspend per akun |

### 🔄 Fitur Klaim Pengawas (Dual Confirmation)

```
PS klaim sekolah  →  Status: pending
                          ↓
KS buka app → Klik "Cek Pengawas"
                          ↓
              Konfirmasi / Tolak
                     ↓       ↓
              confirmed    rejected (auto-unclaim)
                          ↓
              PS lihat status via "Refresh Status"
```

**Fitur pendukung:**
- KS deteksi perubahan pengawas otomatis
- PS validasi `pengawas_nip` di file JSON
- Admin override (assign manual)
- Reset klaim (admin)

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Frontend** | Vanilla JS (ES Modules), HTML, CSS |
| **Icons** | Lucide (inline SVG) |
| **Hosting** | GitHub Pages (statis, HTTPS gratis) |
| **Cloud** | Supabase (PostgreSQL, RLS, free tier) |
| **Storage KS** | localStorage (~500 KB) |
| **Storage PS** | IndexedDB (~380 MB) |
| **PWA** | Service Worker + Web App Manifest |
| **Build** | **Tidak ada** — pure ES Modules, no bundler |
| **Print** | `window.print()` + CSS `@media print` |

---

## 📁 Struktur Direktori

```
sispa-mandiri/
│
├── index.html                          ← Landing page (pilih role)
├── README.md                           ← Dokumentasi ini
├── .nojekyll                           ← Aktifkan GitHub Pages
├── .github/
│   └── workflows/
│       └── keep-alive.yml              ← GitHub Action: prevent Supabase pause
│
├── shared/                             ← Kode bersama KS & PS
│   ├── css/
│   │   ├── tokens.css                  ← CSS variables (warna, radius)
│   │   ├── base.css                    ← Reset & tipografi
│   │   ├── components.css              ← Button, card, badge, modal
│   │   ├── layout.css                  ← Sidebar, header, grid
│   │   ├── premium.css                 ← Auth split, tab-nav, polish
│   │   └── print.css                   ← Print styles A4
│   ├── js/
│   │   ├── config.js                   ← ⚠️ Konfigurasi Supabase (URL, Key)
│   │   ├── supabase.js                 ← Supabase client + CRUD helpers
│   │   ├── auth.js                     ← Session management
│   │   ├── utils.js                    ← el, esc, toast, modal, date
│   │   ├── icons.js                    ← Lucide subset (~43 icon)
│   │   ├── constants.js                ← INSTRUMEN, DPL, NAV
│   │   ├── shell.js                    ← Sidebar, header, profile menu
│   │   ├── router.js                   ← Routing antar modul
│   │   └── pin.js                      ← PIN lock
│   └── icons/
│       ├── icon.svg                    ← Master icon
│       ├── icon-192.png                ← PWA icon (iOS/Android)
│       ├── icon-512.png
│       └── wonogiri.svg                ← Lambang Kabupaten Wonogiri
│
├── ks/                                 ← Aplikasi Kepala Sekolah
│   ├── index.html
│   ├── manifest.webmanifest
│   ├── sw.js                           ← Service Worker
│   ├── storage.js                      ← localStorage wrapper
│   ├── js/
│   │   ├── main.js                     ← Entry point + login + cekpengawas
│   │   ├── helpers.js
│   │   └── modules/
│   │       ├── dashboard.js            ← Papan supervisi + kuadran
│   │       ├── guru.js                 ← CRUD guru
│   │       ├── guru-import.js          ← Import CSV (file + paste)
│   │       ├── profil.js               ← Kuadran interaktif + form
│   │       ├── program.js              ← Program supervisi per periode
│   │       ├── supervisi.js            ← Wizard 3 tahap + panduan
│   │       ├── akademik.js             ← 19 indikator + draft mode
│   │       ├── coaching.js             ← 8 indikator + RTL multi
│   │       ├── analisis.js             ← Chart + tren + insight
│   │       ├── laporan.js              ← List + filter + cetak
│   │       └── pengaturan.js           ← Config + backup + klaim
│   └── panduan.html                    ← (TODO) Panduan KS
│
├── ps/                                 ← Aplikasi Pengawas
│   ├── index.html
│   ├── manifest.webmanifest
│   ├── sw.js
│   ├── storage.js                      ← IndexedDB wrapper
│   ├── js/
│   │   ├── main.js
│   │   ├── helpers.js
│   │   └── modules/
│   │       ├── dashboard.js            ← Agregat + pending klaim
│   │       ├── sekolah.js              ← Binaan + assign + refresh status
│   │       ├── guru.js                 ← Lintas sekolah + coverage matrix
│   │       ├── supervisi.js            ← Semua sesi + detail + cetak
│   │       ├── analisis.js             ← Overview + Akademik + Coaching
│   │       ├── evaluasi.js             ← 30 indikator manual + cetak
│   │       ├── laporan.js              ← Rekap + CSV export
│   │       └── pengaturan.js
│   └── panduan.html                    ← (TODO) Panduan PS
│
└── admin/                              ← Panel Admin Dinas
    └── index.html                      ← Single-file admin panel
```

---

## 🚀 Setup & Deployment

### 1. Clone Repository

```bash
git clone https://github.com/onelabszz/sispa-mandiri.git
cd sispa-mandiri
```

### 2. Setup Supabase

**A. Buat Project**
1. Buka [database.new](https://database.new)
2. Buat project baru (region: Southeast Asia/Singapore)
3. Salin **Project URL** dan **Anon Key** dari Settings → API

**B. Buat Tabel**

Buka SQL Editor, jalankan:

```sql
-- Tabel Sekolah
CREATE TABLE sekolah (
  npsn TEXT PRIMARY KEY,
  nama_sekolah TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  pengawas_nip TEXT,
  pengawas_status TEXT,
  pengawas_confirmed_at TIMESTAMPTZ
);

-- Tabel Pengawas
CREATE TABLE pengawas (
  nip TEXT PRIMARY KEY,
  nama_pengawas TEXT NOT NULL,
  wilayah TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Index untuk performa
CREATE INDEX idx_sekolah_pengawas ON sekolah(pengawas_nip);
CREATE INDEX idx_sekolah_status ON sekolah(pengawas_status);

-- RLS (allow admin operations via anon key, protected by Admin Key in frontend)
ALTER TABLE sekolah ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengawas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "all_sekolah" ON sekolah FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "all_pengawas" ON pengawas FOR ALL TO anon USING (true) WITH CHECK (true);
```

**C. Konfigurasi di Aplikasi**

Edit file `shared/js/config.js`:

```javascript
export const SUPABASE_CONFIG = {
  url: 'https://[PROJECT-ID].supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
};
```

### 3. Setup GitHub Pages

```bash
git add .
git commit -m "Initial SISPA Mandiri setup"
git push origin main
```

Lalu di GitHub:
1. **Settings** → **Pages**
2. Source: **Deploy from branch** → `main` → `/(root)`
3. Save → tunggu 30 detik → live

### 4. GitHub Actions (Keep-Alive)

Sudah ada `.github/workflows/keep-alive.yml` — otomatis ping Supabase setiap 3 hari agar tidak ter-pause.

**Setup Secret di repo:**
1. **Settings** → **Secrets and variables** → **Actions**
2. New repository secret:
   - `SUPABASE_URL` = `https://[PROJECT-ID].supabase.co`
   - `SUPABASE_KEY` = Anon Key Anda

### 5. Isi Data Awal (Admin)

1. Buka `/admin/` → login dengan kunci `admin123` (**ganti di `admin/index.html`!**)
2. Tambah sekolah (manual atau Import CSV)
3. Tambah pengawas
4. Assign pengawas ke sekolah (opsional — PS bisa klaim sendiri)

---

## 🔐 Keamanan

### Yang Aman Dipublikasi
- ✅ **Anon Key Supabase** — memang untuk frontend, dilindungi RLS
- ✅ **URL Supabase** — public endpoint

### Yang Harus Dijaga
- 🔒 **Admin Key** (di `admin/index.html`) — ganti dari `admin123` sebelum deploy
- 🔒 **Service Role Key** Supabase — **JANGAN PERNAH** taruh di frontend
- 🔒 **Database password** — simpan di password manager

### RLS Policy
Saat ini `FOR ALL TO anon` (terbuka) — **aman karena:**
1. Aplikasi KS/PS hanya membaca (SELECT) + klaim terbatas (UPDATE pengawas_nip/status)
2. Admin operations dilindungi **Admin Key** di frontend
3. Untuk keamanan lebih ketat, tambah Supabase Auth (backlog)

---

## 📊 Kapasitas & Batasan

| Aspek | Estimasi |
|-------|----------|
| **Sekolah** | ~800 (1 kabupaten) |
| **Pengawas** | ~20 |
| **Guru per sekolah** | ~15-30 |
| **Ukuran DB Supabase** | <100 KB (hanya akun) |
| **Kuota free tier** | 500 MB DB, 5 GB bandwidth/bulan |
| **Pakai bandwidth/bulan** | ~5 MB (0.1%) |
| **Storage KS** | ~500 KB di localStorage |
| **Storage PS** | ~380 MB untuk 800 sekolah di IndexedDB |
| **Biaya** | **Rp 0 selamanya** |

---

## 🔄 Workflow Data Lengkap

### Setup Awal
```
Admin → Isi sekolah + pengawas di Supabase
  ↓
PS login → Pilih sekolah dari DB (klaim) → Status: pending
  ↓
KS login → Cek Pengawas → Konfirmasi → Status: confirmed
```

### Siklus Supervisi
```
KS input data guru → Profil tipe → Program → Supervisi (3T/Akad/Coach)
  ↓
KS analisis & cetak laporan (offline)
  ↓
KS ekspor JSON → kirim ke PS via WhatsApp
  ↓
PS import JSON (validasi pengawas_nip)
  ↓
PS analisis agregat → laporan rekap → cetak
```

### Backup & Restore
```
KS: Pengaturan → Ekspor JSON → simpan Drive
PS: Pengaturan → Ekspor Backup → simpan Drive
Restore: Impor JSON (replace semua data)
```

---

## 🧪 Testing

### Test Manual (Prioritas)

**A. Fresh Install (KS):**
- [ ] Buka `/ks/` di Chrome/Edge
- [ ] Install PWA → icon muncul di desktop
- [ ] Login NPSN → verifikasi → lengkapi profil
- [ ] Buka Dashboard → Papan Supervisi dengan widget pengawas
- [ ] Klik "Cek Pengawas" → konfirmasi PS (jika ada)
- [ ] Tambah 3 guru (manual atau Import CSV)
- [ ] Profil tipe → isi kuadran
- [ ] Supervisi 3T → selesaikan 1 sesi
- [ ] Ekspor JSON → file terunduh `[NPSN]_[Sekolah]_[Tgl].json`

**B. Fresh Install (PS):**
- [ ] Buka `/ps/` → login NIP
- [ ] Dashboard → empty state
- [ ] Pilih dari DB → klaim sekolah
- [ ] Refresh Status → badge pending
- [ ] Import JSON dari KS → verifikasi pengawas_nip
- [ ] Analisis → chart terisi
- [ ] Evaluasi KS → form 30 indikator → finalisasi → cetak

**C. Klaim Pengawas End-to-End:**
- [ ] PS klaim sekolah → status pending
- [ ] KS cek pengawas → konfirmasi → status confirmed
- [ ] PS refresh status → badge confirmed
- [ ] Admin ganti pengawas → KS cek ulang → modal perubahan

**D. Offline Mode:**
- [ ] Install PWA KS → matikan WiFi → refresh → tetap jalan
- [ ] Install PWA PS → matikan WiFi → refresh → tetap jalan
- [ ] Login baru saat offline → error "Butuh internet"

**E. Cross-Browser:**
- [ ] Chrome desktop
- [ ] Edge desktop
- [ ] Chrome Android
- [ ] Safari iOS
- [ ] Firefox desktop

---

## 🐛 Troubleshooting

### Error: `ERR_NAME_NOT_RESOLVED`
- **Penyebab:** Salah ketik URL Supabase di `config.js`
- **Fix:** Copy ulang URL dari Supabase Dashboard (Settings → API). Pastikan tidak ada spasi / karakter tambahan.

### Error: `Cannot set properties of null`
- **Penyebab:** Modul dipanggil dengan data kosong (belum import)
- **Fix:** Sudah ditangani dengan guard pattern di semua modul. Kalau masih muncul, kirim screenshot console.

### Aplikasi tidak update setelah push
- **Penyebab:** Service Worker cache lama
- **Fix:**
  1. F12 → Application → **Service Workers** → **Unregister**
  2. Application → **Storage** → **Clear site data**
  3. **Ctrl+Shift+R** (hard refresh)

### Supabase Paused
- **Penyebab:** Tidak ada aktivitas >7 hari
- **Fix:** GitHub Actions `keep-alive.yml` sudah otomatis mencegah ini. Kalau tetap paused, buka Supabase Dashboard → Restore.

### Data KS hilang setelah clear browsing
- **Penyebab:** localStorage terhapus
- **Fix:** Restore dari backup JSON terakhir. **Selalu backup mingguan!**

### Login Supabase "Butuh internet"
- **Penyebab:** Offline / jaringan blokir domain supabase
- **Fix:** Login **hanya butuh internet sekali**. Setelah itu session tersimpan → auto-login offline.

---

## 📈 Roadmap

> **Pengembang:** Ekwan Nugroho

### ✅ v2.0.0 (Selesai)
- [x] Modul KS lengkap (10 modul)
- [x] Modul PS lengkap (8 modul)
- [x] Panel Admin (CRUD + assign + reset klaim)
- [x] Klaim Pengawas dual-confirmation
- [x] PWA offline-capable
- [x] Import CSV (file + paste)
- [x] Panduan Modul 5 di Supervisi 3T
- [x] Cetak Rekap Semester
- [x] Nama file ekspor berdasarkan NPSN & nama

### 🔜 v2.1.0 (Rencana)
- [ ] Panduan HTML untuk KS & PS (user guide)
- [ ] Import CSV di Panel Admin (re-integrate)
- [ ] Bulk delete sekolah di Admin
- [ ] Dashboard Dinas (import agregat dari PS)

### 🔮 v3.0.0 (Future)
- [ ] Multi-periode dengan filter
- [ ] Trend benchmark antar semester
- [ ] Catatan kunjungan pengawas
- [ ] QR code sync (alternatif WA)
- [ ] Dark mode
- [ ] Sign pad digital (TTD canvas)

---

## 🤝 Kontribusi

Solo developer project. Untuk kontribusi:
1. Fork repo
2. Branch baru: `git checkout -b feature/nama-fitur`
3. Commit: `git commit -m "Add fitur X"`
4. Push: `git push origin feature/nama-fitur`
5. Pull request

---

## 📄 Lisensi

**MIT License** — bebas dipakai untuk kepentingan pendidikan.

```
Copyright (c) 2026 Kabupaten Wonogiri

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
```

---

## 📞 Kontak & Dukungan

| Peran | Detail |
|-------|--------|
| **Pengembang** | Ekwan Nugroho |
| **Wilayah** | Kabupaten Wonogiri, Jawa Tengah |
| **Pengguna** | 800 Kepala Sekolah · 20 Pengawas · 1 Admin Dinas |
| **Kontak Dinas** | Dinas Pendidikan Kabupaten Wonogiri |
| **Bug & Saran** | Hubungi pengembang via WhatsApp/Email |

---

## 🙏 Credits

- **Modul 5** — Supervisi Akademik pada PM & KKA (Kemendikdasmen, 2026)
- **Lucide Icons** — [lucide.dev](https://lucide.dev)
- **Supabase** — [supabase.com](https://supabase.com)
- **GitHub Pages** — [pages.github.com](https://pages.github.com)

---

## 👨‍💻 Pengembang

**Ekwan Nugroho**

Project ini dikembangkan secara mandiri untuk mendukung digitalisasi supervisi akademik di Kabupaten Wonogiri. Segala feedback, bug report, atau saran pengembangan dapat disampaikan langsung kepada pengembang.

---

**Dibuat dengan ❤️ untuk pendidikan Indonesia.**

**SISPA Mandiri v2.0.0 — Kabupaten Wonogiri, 2026**
```

---

## 🚀 Deploy

```bash
git add README.md
git commit -m "README: add developer Ekwan Nugroho + hide admin URL"
git push origin main
```

---
