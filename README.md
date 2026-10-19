# E-Zakat OCR Scanner v2 (SharePoint Edition)

Sistem Pengimbas Resit Zakat Berasaskan AI OCR dengan Integrasi Pangkalan Data Enterprise **Microsoft SharePoint** (Tanpa Supabase / PostgreSQL).

## 🚀 Kelebihan Versi 2.0 (Lebih Ringan & Stabil)

1. **Pangkalan Data Tunggal SharePoint (Zero-Supabase)**
   - Semua rekod metadata resit disimpan terus ke dalam **SharePoint Lists** (`ZakatReceipts`, `ZakatUsers`, `ZakatRates`).
   - Salinan fail imej resit fizikal disimpan ke dalam **SharePoint Document Library** (`Zakat-Images/`).
   - Menggunakan panggilan `fetch` Microsoft Graph API yang pantas, tiada lagi isu websocket pool, cold start timeout, atau kehabisan memori.

2. **Ultra-Lightweight & Pantas**
   - Menggugurkan Prisma, pg, pg-cloudflare, Sentry, dan binary WASM. Saiz bundle berkurang lebih 75%.
   - Tiada lagi ralat **HTTP 500** atau **Cloudflare Error 1101**.

3. **Kekalkan Semua Fungsi Sebenar**
   - **Imbasan Pintar**: Sokongan Zakat Fitrah (Slip Segi Empat, kod DW/CS 6-angka) dan Zakat Harta (Borang A, format memanjang 5-angka merah).
   - **Analisis Kertas Automatik**: Pengesanan warna kertas (Hijau = DW, Kuning = CS, Putih = Harta).
   - **Mod Tanggungan (Multi-Scan)**: Aliran imbasan resit tanggungan berperingkat dengan folder `CS xxxxxx - CS xxxxxx`.
   - **E-Resit Standard**: Membuka resit dalam tab yang sama (mudah tekan kembali), sokongan cetakan & PDF.
   - **Kawalan Akses Peranan (RBAC)**:
     - **Admin**: Akses penuh ke pautan fail asal SharePoint.
     - **Staf / Amil**: Paparan *thumbnail* di sebelah kanan, dengan mesej pop-up amaran sekiranya cuba membuka pautan SharePoint terus.

## 🔑 Akaun Log Masuk Sedia Ada

| Peranan | ID Pengguna | Kata Laluan | Kariah / Fungsi |
|---|---|---|---|
| **Admin Pusat** | `admin` | `admin123` | Pentadbir Utama Sistem |
| **Staf Arkib** | `staf` | `staf123` | Staf Arkib JUZWAB |
| **Amil Zon 1** | `AMIL-Z01-001` | `amil123` | Masjid Jame' Asr Hassanil Bolkiah |
| **Amil Zon 2** | `AMIL-Z02-001` | `amil123` | Masjid Mohammad Jamalul Alam |

## 🛠️ Arahan Pembangunan & Pelancaran

```bash
# Jalankan mod pembangunan tempatan
npm run dev

# Bina versi pengeluaran (Production Build)
npm run build

# Lancarkan pelayan pengeluaran
npm run start
```
