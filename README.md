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
| 🔐 **Admin Dinas** | `https://onelabszz.github.io/sispa-mandiri/admin/` | Kunci Admin |

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
