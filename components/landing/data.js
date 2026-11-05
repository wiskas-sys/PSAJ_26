// =============================================================================
// DATA PLACEHOLDER — seluruh nilai di file ini masih dummy.
// Ganti satu per satu, lalu hapus komentar TODO terkait.
// Cara cepat cari sisa placeholder: grep -rn "TODO: ganti data asli" .
// =============================================================================

export const company = {
  // TODO: ganti data asli
  name: "Dian Motor",
  // TODO: ganti data asli
  tagline: "Bengkel motor dengan sistem inventori terintegrasi",
  // TODO: ganti data asli
  address:
    "Jl. Contoh No. 00, Kelurahan Contoh, Kecamatan Contoh, Kota Contoh 00000",
  // TODO: ganti data asli — format tampilan
  phoneDisplay: "+62 812-3456-7890",
  // TODO: ganti data asli — format internasional untuk wa.me, tanpa "+" dan tanpa spasi
  whatsapp: "6281234567890",
  // TODO: ganti data asli — pakai domain .example selama masih placeholder
  email: "halo@dianmotor.example",
  // TODO: ganti data asli — teks kueri untuk iframe dan tautan Google Maps
  mapsQuery: "Kota Contoh, Indonesia",
  // TODO: ganti data asli — ganti parameter q dengan alamat atau titik koordinat workshop
  mapsEmbed:
    "https://maps.google.com/maps?q=Kota%20Contoh%2C%20Indonesia&t=&z=15&ie=UTF8&iwloc=&output=embed",
  // TODO: ganti data asli
  mapsLink: "https://maps.google.com/?q=Kota%20Contoh%2C%20Indonesia",
};

export const whatsappLink = (message = "") =>
  `https://wa.me/${company.whatsapp}${
    message ? `?text=${encodeURIComponent(message)}` : ""
  }`;

// TODO: ganti data asli — nav header
export const navLinks = [
  { label: "Tentang", href: "#tentang" },
  { label: "Layanan", href: "#layanan" },
  { label: "Testimoni", href: "#testimoni" },
  { label: "Kontak", href: "#kontak" },
];

// TODO: ganti data asli — headline dan subheadline hero
export const heroCopy = {
  headline: "Servis motor yang tercatat rapi, dari sparepart sampai aki.",
  subheadline:
    "Dian Motor menangani servis rutin, penggantian komponen, dan kelistrikan untuk motor bebek dan matic. Setiap parts yang keluar dicatat di sistem inventori internal, jadi tidak ada lagi barang yang hilang tanpa jejak.",
};

// TODO: ganti data asli — panel spesifikasi di hero
export const heroSpecs = [
  { label: "Berdiri sejak", value: "2009" },
  { label: "Jenis motor", value: "Bebek dan matic" },
  { label: "Jam buka", value: "08.00 - 17.00 WIB" },
  { label: "Sistem inventori", value: "Internal, real-time" },
];

// TODO: ganti data asli — angka pencapaian
export const stats = [
  { value: "15+", label: "Tahun melayani pelanggan" },
  { value: "12.000+", label: "Motor telah diservis" },
  { value: "30+", label: "Jenis komponen terdata" },
  { value: "98%", label: "Pelanggan servis kembali" },
];

// TODO: ganti data asli — katalog layanan dan estimasi harga
export const services = [
  {
    icon: "wrench",
    title: "Servis Rutin",
    description:
      "Ganti oli, tune-up, penyetelan rem, dan pengecekan komponen harian lainnya.",
    price: "Rp 60.000 - 120.000",
    meta: "Sekitar 1 jam",
  },
  {
    icon: "zap",
    title: "Kelistrikan dan Aki",
    description:
      "Diagnosis kabel, regulator, spion, dan penggantian aki dengan garansi pemasangan.",
    price: "Rp 90.000 - 350.000",
    meta: "Sekitar 2 jam",
  },
  {
    icon: "package",
    title: "Penggantian Komponen",
    description:
      "Ban, rem, filter, dan bearing. Ketersediaan komponen dicek sebelum motor dikerjakan.",
    price: "Mulai Rp 150.000",
    meta: "Komponen original",
  },
  {
    icon: "gauge",
    title: "Bore Up dan Tuning",
    description:
      "Pengerjaan mesin, karburasi, dan setelan performa dengan estimasi biaya di awal.",
    price: "Mulai Rp 1.500.000",
    meta: "Konsultasi dulu",
  },
];

// TODO: ganti data asli — alur kerja 4 langkah
export const processSteps = [
  {
    title: "Konsultasi dan Cek Motor",
    description:
      "Mekanik memeriksa kondisi motor lalu menjelaskan hasil diagnosa beserta estimasi biaya.",
  },
  {
    title: "Persetujuan Pekerjaan",
    description:
      "Tidak ada komponen yang diganti atau dibongkar sebelum kamu menyetujui tawaran biaya.",
  },
  {
    title: "Pengerjaan dan Pemeriksaan",
    description:
      "Setelah pengerjaan selesai dilakukan pengecekan akhir, termasuk pencatatan parts yang dipakai.",
  },
  {
    title: "Serah Terima dan Dokumentasi",
    description:
      "Motor dikembalikan dengan rincian pekerjaan dan komponen yang diganti tercatat di nota.",
  },
];

// TODO: ganti data asli — keunggulan
export const advantages = [
  {
    icon: "clipboard",
    title: "Stok tercatat, bukan di kepala",
    description:
      "Setiap komponen keluar masuk dicatat di sistem inventori internal kami, jadi pengecekan stok selesai dalam hitungan detik.",
  },
  {
    icon: "shieldCheck",
    title: "Estimasi biaya di muka",
    description:
      "Rincian biaya dan saran perbaikan diserahkan sebelum pekerjaan dimulai. Tidak ada biaya tambahan mendadak.",
  },
  {
    icon: "gauge",
    title: "Mekanik berpengalaman",
    description:
      "Ditangani teknisi yang mengerjakan motor setiap hari, bukan sekadar diteruskan ke pihak lain.",
  },
  {
    icon: "package",
    title: "Komponen original",
    description:
      "Sparepart yang digunakan original dan sesuai tipe motor, dilengkapi garansi pemasangan.",
  },
];

// TODO: ganti data asli — kutipan pelanggan
export const testimonials = [
  {
    quote:
      "Bawa motor karena lampu rem mulai redup. Parts-nya ternyata ready, selesai dalam sehari. Biayanya juga sesuai yang sempat kita bahas di awal.",
    name: "Pelanggan A",
    role: "Motor matic, servis 2024",
  },
  {
    quote:
      "Yang paling membantu, mekanik tahu persis barang apa yang masih ada di gudang. Tidak perlu menunggu komponen dari luar kota hanya karena datanya belum diperbarui.",
    name: "Pelanggan B",
    role: "Motor bebek, pelanggan tetap",
  },
  {
    quote:
      "Harga di awal sudah jelas rinciannya. Pengerjaan selesai sesuai janji waktu, dan motor tidak ada keluhan sampai sekarang.",
    name: "Pelanggan C",
    role: "Bore up, pelanggan tetap",
  },
];

// TODO: ganti data asli — galeri (contoh file ada di /public)
export const galleryImages = [
  { src: "/gallery-1.jpg", alt: "Ruang servis Dian Motor" },
  { src: "/gallery-2.jpg", alt: "Area mesin dan alat kerja" },
  { src: "/gallery-3.jpg", alt: "Rak penyimpanan sparepart" },
  { src: "/gallery-4.jpg", alt: "Mekanik sedang mengerjakan motor" },
];

// TODO: ganti data asli — FAQ
export const faqs = [
  {
    question: "Apakah harus booking sebelum datang?",
    answer:
      "Tidak wajib, motor bisa datang langsung. Untuk pekerjaan yang perlu waktu lama seperti bore up atau penanganan kelistrikan, kami sarankan menghubungi lebih dulu agar waktu pengerjaan bisa disiapkan.",
  },
  {
    question: "Berapa lama pengerjaan servis rutin?",
    answer:
      "Servis rutin umumnya selesai dalam satu jam, tergantung ketersediaan komponen. Mekanik memberi estimasi waktu sebelum motor mulai dikerjakan.",
  },
  {
    question: "Apakah sparepart yang dipakai original?",
    answer:
      "Ya. Semua komponen yang kami pasang original dan sesuai tipe motor. Komponen hasil penggantian selalu dicatat di nota dan tersedia garansi pemasangan.",
  },
];

// TODO: ganti data asli — jam buka
export const businessHours = [
  { day: "Senin sampai Jumat", time: "08.00 - 17.00 WIB" },
  { day: "Sabtu", time: "08.00 - 14.00 WIB" },
  { day: "Minggu dan hari libur", time: "Tutup" },
];
