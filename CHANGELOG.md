# CHANGELOG — DIAN MOTOR POS

Ringkasan perubahan terbaru (18 Sep 2026). Semua perubahan ini masih memakai data contoh/lokal, belum tersambung ke database Supabase.

## Tambahan / Perbaikan Terbaru

### 1. Halaman Laporan (`/laporan`)
- Sebelumnya: tab (Penjualan, Barang Masuk, dll) tidak berpindah saat diklik dan isinya hanya placeholder.
- Sekarang tab berfungsi dan berisi konten:
  - **Barang Masuk** — tabel realisasi barang masuk dari supplier (no. pergerakan, barang, jumlah, supplier, tanggal)
  - **Barang Keluar** — tabel pengeluaran stok untuk penjualan & servis
  - **Stok** — daftar seluruh produk dan status stoknya
  - **Servis** — tabel servis kendaraan pelanggan

### 2. Halaman Dashboard (`/dashboard`)
- Tombol tanggal statis diubah menjadi tanggal hari ini (dari sistem, bukan ditulis manual).
- Tombol "Lihat Semua" dan "Lihat Semua Stok" sekarang benar-benar berpindah halaman ke `/transaksi` dan `/stok`.

### 3. Halaman Notifikasi (`/notifikasi`)
- Klik satu notifikasi → ditandai terbaca (titik merah hilang).
- Tombol "Tandai Semua Dibaca" berfungsi dan menampilkan toast berhasil.

### 4. Halaman Cek Stok (`/stok`)
- Tombol Aksi (⋮) yang tadinya mati kini membuka menu:
  - **Tambah Stok** — dialog isi jumlah, angka stok di tabel berubah
  - **Kurangi Stok** — pengurangan stok (minimal 0)
- Status (Aman/Menipis/Habis), filter, dan metrik stok menipis ikut menyesuaikan otomatis.

### 5. Halaman Kasir (`/kasir`)
- Tombol "Cetak Struk" di popup "Transaksi Berhasil" sekarang membuka preview struk:
  nama toko, no. transaksi, daftar belanja, diskon, total, bayar, dan kembalian.

## Perubahan Sebelumnya (sesi yang sama)

### Navigasi & Sidebar (`components/app-shell.js`)
- Dihapus dari navbar: breadcrumb `DIAN MOTOR › ... › Active Session`, tombol "Hold Sale (F2)", dan search bar.
- Sidebar diganti bahasa Indonesia (menu, mobile menu, dan status kartu bawah).
- Logo "DM" dihilangkan; teks "DIAN MOTOR" di tengah dan diperbesar.
- Kartu Terminal/Operator/Sistem dihapus.

### Halaman Kasir
- Badge "SESSION ACTIVE · TRX-014" dan banner "Quick SKU lookup (Ctrl K)" dihapus.

### Halaman Pengaturan (`/pengaturan`)
- Tab "Pajak & Pembayaran" dihapus, diganti tab "Metode Pembayaran" (toggle Tunai, Transfer, QRIS, Virtual Account, E-Wallet).
- Kartu "Lokasi Operasional" dihapus; kartu "Kesehatan Sistem" tetap.
- Perbaikan: tab sekarang benar-benar berpindah (value tab sebelumnya tidak cocok).

### Pembayaran (`/pembayaran`)
- Kartu "Distribusi Metode Pembayaran" diubah dari bar horizontal menjadi donat (satu lingkaran) dengan segmen warna (QRIS merah, Virtual Account oranye, dll), total di tengah, dan legend jumlah + persen.

### Tabel Manajemen (`components/management-page.js`)
- Halaman Transaksi mendapat dropdown **"Urutkan..."** (Tanggal terbaru/terlama, Total terbesar/terkecil) — hanya di halaman Transaksi.
- Tombol Aksi (⋮) kini berfungsi penuh:
  - **Lihat Detail** (sheet samping)
  - **Edit** (dialog form; kolom kode/ID read-only, kolom Status/Peran memakai dropdown)
  - **Hapus** (dialog konfirmasi, baris benar-benar hilang)
  - **Transaksi**: Lihat Detail + Cetak Struk (gaya struk thermal)

## Catatan
- Perubahan hanya tersimpan di state lokal (browser). Jika halaman di-refresh, data kembali ke data awal.
- Belum ada integrasi database; data masih data contoh.