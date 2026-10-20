
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
