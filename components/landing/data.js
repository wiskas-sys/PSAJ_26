// =============================================================================
// DATA LANDING PAGE BENGKEL DIAN MOTOR
// =============================================================================

export const company = {
  name: "Dian Motor",
  tagline: "Bengkel motor modern dengan sistem inventori cerdas & AI diagnosa terintegrasi.",
  address: "Jl. Veteran No. 26, Dian Motor Workshop Center",
  phoneDisplay: "+62 812-2605-2026",
  whatsapp: "6281226052026",
  email: "layanan@dianmotor.co.id",
  mapsQuery: "Dian Motor Workshop",
  mapsEmbed:
    "https://maps.google.com/maps?q=Dian%20Motor&t=&z=15&ie=UTF8&iwloc=&output=embed",
  mapsLink: "https://maps.google.com/?q=Dian+Motor",
};

export const whatsappLink = (message = "") =>
  `https://wa.me/${company.whatsapp}${
    message ? `?text=${encodeURIComponent(message)}` : ""
  }`;

// Nav header & footer links
export const navLinks = [
  { label: "Tentang", href: "/#tentang" },
  { label: "Layanan", href: "/#layanan" },
  { label: "AI Diagnosa Motor", href: "/konsultasi-ai", badge: "AI Baru" },
  { label: "Alur Servis", href: "/#alur" },
  { label: "Keunggulan", href: "/#keunggulan" },
  { label: "Testimoni", href: "/#testimoni" },
  { label: "FAQ", href: "/#faq" },
  { label: "Kontak", href: "/#kontak" },
];

export const heroCopy = {
  headline: "Servis motor terpercaya, transparan, dan didukung AI diagnosa.",
  subheadline:
    "Dian Motor melayani servis berkala, tune-up, kelistrikan, hingga turun mesin untuk motor bebek dan matic. Dilengkapi AI Problem Solving yang mengerti keluhan bahasa daerah dan sistem stok suku cadang real-time.",
};

export const heroSpecs = [
  { label: "Pengalaman", value: "Sejak 2009 (15+ Tahun)" },
  { label: "Spesialisasi", value: "Bebek, Matic, & Sport" },
  { label: "Jam Operasional", value: "08.00 - 17.00 WIB" },
  { label: "Sistem Inventori", value: "1.000+ Suku Cadang Terdata" },
  { label: "Dukungan AI", value: "Aktif 24 Jam (Jawa / Ngapak / ID)" },
];

export const stats = [
  { value: "15+", label: "Tahun Melayani Pelanggan" },
  { value: "12.000+", label: "Motor Sukses Diservis" },
  { value: "1.000+", label: "SKU Suku Cadang Terdata Real-Time" },
  { value: "99%", label: "Kepuasan Pelanggan & Konsultasi" },
];

export const services = [
  {
    icon: "wrench",
    title: "Servis Rutin & Tune-Up Cepat",
    description:
      "Ganti oli mesin/gardan, pembersihan busi, filter udara, kalibrasi injeksi/karburator, dan penyetelan rantai/rem.",
    price: "Rp 60.000 - 120.000",
    meta: "Durasi ~45 menit",
  },
  {
    icon: "zap",
    title: "Kelistrikan, Starter & Aki",
    description:
      "Uji kesehatan aki (CCA & voltase), servis dinamo starter, relay, bendik, perapihan kabel body, dan lampu LED.",
    price: "Rp 85.000 - 350.000",
    meta: "Garansi pemasangan",
  },
  {
    icon: "package",
    title: "Servis CVT & Transmisi Matic",
    description:
      "Atasi gredek getar awal, ganti v-belt, roller, slider, pembersihan mangkok kopling ganda, dan pelumasan grease high-temp.",
    price: "Rp 65.000 - 250.000",
    meta: "Suku cadang ready di rak",
  },
  {
    icon: "gauge",
    title: "Overhaul Mesin & Kaki-kaki",
    description:
      "Penanganan mesin ngebul/kemlotok, skir klep, ganti bearing kruk as/roda, perbaikan shockbreaker, dan ganti kampas rem.",
    price: "Mulai Rp 250.000",
    meta: "Estimasi biaya di muka",
  },
];

export const processSteps = [
  {
    title: "Konsultasi & Diagnosa Cerdas",
    description:
      "Sampaikan keluhan secara online via AI Mekanik atau cek fisik langsung di bengkel dengan mekanik berpengalaman.",
  },
  {
    title: "Persetujuan Rincian Biaya",
    description:
      "Mekanik menjelaskan kondisi komponen dan estimasi biaya secara transparan. Pengerjaan baru dimulai setelah Anda setuju.",
  },
  {
    title: "Pengerjaan & Pemasangan Suku Cadang",
    description:
      "Dikerjakan dengan tools presisi. Setiap suku cadang yang terpasang dicatat langsung di sistem stok resmi bengkel.",
  },
  {
    title: "Pemeriksaan Akhir & Garansi",
    description:
      "Motor diuji jalan untuk memastikan performa prima. Anda menerima nota fisik dan garansi servis resmi.",
  },
];

export const advantages = [
  {
    icon: "clipboard",
    title: "Stok 1.000+ Suku Cadang Terdata",
    description:
      "Semua barang tercatat rapi di sistem internal Dian Motor. Posisi rak dan ketersediaan langsung terlacak tanpa menebak-nebak.",
  },
  {
    icon: "shieldCheck",
    title: "Harga Transparan Tanpa Jebakan",
    description:
      "Estimasi ongkos jasa dan harga komponen diberitahukan di muka. Tidak ada biaya siluman atau penggantian sepihak.",
  },
  {
    icon: "gauge",
    title: "AI Diagnostik Paham Bahasa Daerah",
    description:
      "Website dilengkapi AI yang paham keluhan bahasa Jawa & Ngapak (seperti kemlotok, ora srek, brebet, mbagel) 24 jam non-stop.",
  },
  {
    icon: "package",
    title: "Suku Cadang Berkualitas & Bergaransi",
    description:
      "Kami menjamin keaslian suku cadang pengganti dengan garansi pemasangan yang aman bagi kendaraan Anda.",
  },
];

export const testimonials = [
  {
    quote:
      "Sangat puas servis di Dian Motor. Waktu motor brebet, saya coba tanya di fitur AI-nya dulu pakai bahasa Jawa 'motor brebet pas digas', langsung dikasih tau kemungkinan busi kotor dan stoknya ada. Datang ke bengkel langsung dikerjakan!",
    name: "Mas Budi Santoso",
    role: "Pengendara Vario 125, Pelanggan Rutin",
  },
  {
    quote:
      "Rem depan bunyi srek-srek dan kurang pakem. Mekanik cek langsung dan tunjukkan kampas rem lamanya yang sudah tipis. Harganya pas, nota transparan, dan pelayanannya sangat ramah.",
    name: "Ibu Rahmawati",
    role: "Pengendara Honda Beat, Servis Berkala",
  },
  {
    quote:
      "Yang paling saya suka itu keterbukaan stoknya. Tidak perlu nunggu seharian atau disuruh cari part sendiri keluar. Di sistem mereka langsung kelihatan di rak mana barangnya ada.",
    name: "Pak Joko Susilo",
    role: "Pengendara Supra X 125, Servis Kaki-kaki",
  },
];

export const galleryImages = [
  { src: "/gallery-1.jpg", alt: "Ruang servis Dian Motor yang bersih dan tertata" },
  { src: "/gallery-2.jpg", alt: "Peralatan mekanik presisi dan diagnosis modern" },
  { src: "/gallery-3.jpg", alt: "Rak penyimpanan 1.000+ suku cadang terdata rapi" },
  { src: "/gallery-4.jpg", alt: "Mekanik profesional sedang menangani servis motor" },
];

export const faqs = [
  {
    question: "Bagaimana cara kerja fitur AI Diagnosa Motor di website Dian Motor?",
    answer:
      "AI Mekanik Dian Motor dilatih mengenali berbagai keluhan motor harian. Anda cukup menceritakan kendala yang dirasakan (bisa memakai Bahasa Indonesia, Bahasa Jawa, atau dialek Ngapak). AI akan menganalisa kemungkinan komponen yang rusak dan mencocokkan stok suku cadang pengganti langsung dari database gudang Dian Motor.",
  },
  {
    question: "Apakah saya bisa konsultasi menggunakan Bahasa Jawa atau Ngapak?",
    answer:
      "Tentu saja! Mau bertanya 'rem ku kok ora srek?', 'mesin kemlotok pas panas?', atau 'motor brebet pas digas pol?', AI kami akan langsung paham maksud Anda dan merespon dengan ramah dan solutif.",
  },
  {
    question: "Apakah harus booking terlebih dahulu sebelum datang ke bengkel?",
    answer:
      "Tidak wajib, Anda bisa langsung membawa kendaraan ke workshop Dian Motor pada jam operasional. Namun jika Anda ingin booking terlebih dahulu atau memastikan suku cadang sudah disiapkan di rak, Anda bisa klik tombol Booking via WhatsApp setelah berkonsultasi dengan AI.",
  },
  {
    question: "Apakah suku cadang yang digunakan dijamin asli dan ada garansi?",
    answer:
      "Ya, semua komponen suku cadang yang kami gunakan terjamin mutunya, sesuai spesifikasi pabrikan motor Anda, dan dilengkapi garansi pemasangan dari bengkel Dian Motor.",
  },
  {
    question: "Berapa lama pengerjaan servis motor?",
    answer:
      "Untuk servis rutin dan ganti oli umumnya selesai dalam 30–45 menit. Untuk servis CVT matic sekitar 45–60 menit. Mekanik kami selalu menginformasikan estimasi waktu sebelum motor mulai dikerjakan.",
  },
];

export const businessHours = [
  { day: "Senin – Jumat", time: "08.00 – 17.00 WIB" },
  { day: "Sabtu", time: "08.00 – 15.30 WIB" },
  { day: "Minggu & Hari Libur", time: "Konsultasi AI & WA Tetap Aktif" },
];
