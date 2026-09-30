# DIAN MOTOR

Aplikasi manajemen bengkel, inventori, servis, dan POS berbasis Next.js 16, JavaScript, Tailwind CSS, dan Supabase. Kode aplikasi menggunakan berkas `.js` dan `.jsx` agar lebih mudah dipelajari oleh programmer pemula.

## 1. Instal dependensi

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`. Aplikasi memakai login demo lokal sehingga seluruh halaman dapat dicoba tanpa integrasi eksternal.

## 1.1 Login demo

Tanpa konfigurasi Supabase, login memakai akun dummy dari `lib/demo-auth.js`. Sesi disimpan pada cookie `dian-motor-session` dan proteksi route oleh `proxy.js` tetap aktif.

| Peran | Email | Password |
| --- | --- | --- |
| Administrator | `admin@dianmotor.co.id` | `dianmotor123` |
| Kasir | `kasir@dianmotor.co.id` | `kasir123` |
| Mekanik | `mekanik@dianmotor.co.id` | `mekanik123` |

Kredensial ini hanya untuk demo lokal. Jangan gunakan di produksi: begitu `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` terisi, login otomatis beralih ke Supabase Auth dan cookie demo diabaikan.

## 2. Konfigurasi Supabase

Tambahkan integrasi Supabase pada proyek Vercel/v0, lalu salin `.env.example` menjadi `.env.local`. Isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. `SUPABASE_SERVICE_ROLE_KEY` bersifat server-only dan hanya diperlukan untuk undangan pengguna oleh admin; jangan pernah mengirimkannya ke browser.

## 3. Buat database

Jalankan `supabase/migrations/001_initial_schema.sql` melalui Supabase MCP/SQL editor pada proyek Anda, lalu opsional jalankan `supabase/seed.sql` untuk data demonstrasi. Seed bukan inventaris nyata DIAN MOTOR. Buat pengguna pertama lewat Supabase Auth, lalu tautkan UUID-nya ke `public.profiles` dengan role `admin`; jangan memasukkan pengguna langsung ke `auth.users`.

## 4. Variabel lingkungan

Lihat `.env.example`. Di Vercel, masukkan variabel pada Project Settings → Environment Variables untuk Production, Preview, dan Development. Jangan commit `.env.local`.

## 5. Menjalankan lokal

```bash
npm run dev
```

Gunakan akun demo di bagian 1.1, atau akun Supabase Auth yang sudah dikonfirmasi bila Supabase sudah dikonfigurasi. Proxy Next.js memperbarui sesi dan melindungi seluruh route baik pada mode demo maupun mode Supabase.

## 6. Build produksi

```bash
npm run build
npm run start
```

## 7. Deploy ke Vercel

Hubungkan repositori ke Vercel, tambahkan tiga environment variable di atas, lalu deploy. Pastikan URL deployment terdaftar sebagai Site URL/redirect URL autentikasi Supabase. Security headers sudah dikonfigurasi di `next.config.mjs`.

## Keamanan dan arsitektur

Semua tabel memakai RLS. Stok masuk/keluar diproses oleh RPC PostgreSQL atomik dengan row lock dan validasi stok agar tidak pernah negatif. Untuk produksi, perluas RPC checkout dengan idempotency key seperti struktur transaksi yang tersedia, jalankan Supabase security advisors, dan uji matriks hak akses Admin/Kasir/Mekanik sebelum memasukkan data nyata.
