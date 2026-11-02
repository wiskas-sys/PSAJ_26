# DIAN MOTOR

Aplikasi manajemen bengkel, inventori, servis, dan POS berbasis Next.js 16, JavaScript, Tailwind CSS, dan Supabase. Kode aplikasi menggunakan berkas `.js` dan `.jsx` agar lebih mudah dipelajari oleh programmer pemula.

## 1. Instal dependensi

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`. Login dan area dashboard menggunakan Supabase Auth.

Mode demo login sudah dinonaktifkan. Buat pengguna melalui Supabase Authentication.

## 2. Konfigurasi Supabase

Tambahkan integrasi Supabase pada proyek Vercel/v0, lalu salin `.env.example` menjadi `.env.local`. Isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. `SUPABASE_SERVICE_ROLE_KEY` bersifat server-only dan hanya diperlukan untuk undangan pengguna oleh admin; jangan pernah mengirimkannya ke browser.

## 3. Buat database

Jalankan berurutan `001_initial_schema.sql` sampai `009_hard_delete_stock_product.sql` melalui Supabase SQL Editor. Migrasi 006 hanya menonaktifkan dua SKU contoh lama; migrasi 007 menambahkan penghapusan aman untuk produk yang belum punya riwayat; migrasi 008 menambahkan kategori dasar suku cadang motor tanpa menggandakan kategori yang sudah ada; migrasi 009 mengganti aturan hapus agar barang beserta mutasi stoknya dihapus permanen. Barang yang sudah dipakai dalam detail transaksi penjualan atau servis tetap dilindungi agar data transaksi tetap utuh. Jika `005_checkout_live.sql` pernah dijalankan sebelum tabel Realtime ditambahkan, jalankan ulang isi migrasi 005 untuk memastikan publikasi mencakup `products`, `stock_movements`, dan `transactions`. Buat pengguna pertama lewat Authentication → Users; trigger migration 003 membuat profilnya otomatis sebagai `kasir`. Setelah itu, ubah role profil pertama menjadi `admin` di SQL Editor menggunakan UUID pengguna tersebut. Jangan memasukkan pengguna langsung ke `auth.users`. `seed.sql` sengaja tidak mengisi data; jangan gunakan seed demo sebagai inventaris DIAN MOTOR.

## 4. Variabel lingkungan

Lihat `.env.example`. Di Vercel, masukkan variabel pada Project Settings → Environment Variables untuk Production, Preview, dan Development. Jangan commit `.env.local`.

## 5. Menjalankan lokal

```bash
npm run dev
```

Gunakan email dan password pengguna Supabase yang status profilnya aktif.

## 6. Build produksi

```bash
npm run build
npm run start
```

## 7. Deploy ke Vercel

Hubungkan repositori ke Vercel, tambahkan tiga environment variable di atas, lalu deploy. Pastikan URL deployment terdaftar sebagai Site URL/redirect URL autentikasi Supabase. Security headers sudah dikonfigurasi di `next.config.mjs`.

## Keamanan dan arsitektur

Semua tabel memakai RLS. Katalog stok, mutasi, kategori, supplier, pelanggan, Kasir, Transaksi, Dashboard, Laporan, dan data katalog untuk Servis membaca Supabase; halaman Stok, Kasir, laporan, dan transaksi menyegarkan data melalui Realtime. Stok masuk/keluar, opname, impor massal, dan checkout kasir memakai RPC. Data order Servis masih disimpan lokal, pengelolaan Pengguna belum menjadi CRUD Supabase, dan pencatatan pembayaran Midtrans belum memakai webhook konfirmasi server. Build perlu dijalankan dari checkout lokal yang bisa diakses Next.js.
