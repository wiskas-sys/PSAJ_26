// =============================================================================
// DATA LANDING PAGE BENGKEL DIAN MOTOR
// =============================================================================

export const company = {
  name: "Dian Motor",
  tagline: "Bengkel motor terpercaya di Bumiayu dengan sistem inventori transparan dan estimasi biaya di muka.",
  address:
    "Jl. Ps. Wage No. 19, RT.05/RW.04, Krajan, Jatisawit, Kec. Bumiayu, Kabupaten Brebes, Jawa Tengah 52273",
  phoneDisplay: "+62 823-1388-9969",
  whatsapp: "6282313889969",
  email: "dmotor80@gmail.com",
  mapsQuery: "DIAN MOTOR Bumiayu, Jl. Ps. Wage, Brebes",
  mapsEmbed:
    "https://maps.google.com/maps?q=DIAN+MOTOR,+Jl.+Ps.+Wage,+Krajan,+Jatisawit,+Kec.+Bumiayu,+Kabupaten+Brebes,+Jawa+Tengah+52273&t=&z=17&ie=UTF8&iwloc=&output=embed",
  mapsLink:
    "https://www.google.com/maps/place/DIAN+MOTOR/@-7.2603516,109.006605,17z",
};

export const whatsappLink = (message = "") =>
  `https://wa.me/${company.whatsapp}${
    message ? `?text=${encodeURIComponent(message)}` : ""
  }`;

// Nav header & footer links
export const navLinks = [
  { label: "Konsultasi Pelanggan", href: "/#ai-diagnosa" },
  { label: "Layanan", href: "/#layanan" },
  { label: "Alur Servis", href: "/#alur" },
  { label: "Keunggulan", href: "/#keunggulan" },
  { label: "Tentang", href: "/#tentang" },
  { label: "Testimoni", href: "/#testimoni" },
  { label: "FAQ", href: "/#faq" },
  { label: "Kontak", href: "/#kontak" },
];

export const heroCopy = {
  headline: "Servis motor bebek dan matic, biaya disepakati sebelum dikerjakan.",
  subheadline:
    "Dian Motor menangani servis berkala, tune-up, kelistrikan, sampai turun mesin. Mekanik menjelaskan temuan dan biayanya di muka, dan Anda bisa konsultasi keluhan motor secara online dalam bahasa Indonesia, Jawa, atau Ngapak.",
};

export const heroImage = {
  src: "/images/landing/hero-workshop.jpg",
  alt: "Mekanik Dian Motor sedang menyervis mesin motor di workshop",
};

export const aboutImage = {
  src: "/images/landing/about-parts.jpg",
  alt: "Rak peralatan dan suku cadang yang tertata di workshop Dian Motor",
};

export const whyUsImage = {
  src: "/images/landing/whyus-engine.jpg",
  alt: "Close-up mekanik memeriksa komponen mesin motor",
};

export const contactImage = {
  src: "/images/landing/contact-workshop.jpg",
  alt: "Suasana ruang kerja bengkel Dian Motor yang penuh peralatan",
};

export const heroSpecs = [
  { label: "Pengalaman", value: "13 Tahun" },
  { label: "Spesialisasi", value: "Bebek, Matic, & Sport" },
  { label: "Jam Operasional", value: "08.30 – 22.00 WIB (Buka Setiap Hari)" },
  { label: "Sistem Inventori", value: "1.000+ Suku Cadang Terdata" },
  { label: "Konsultasi Online", value: "Aktif 24 Jam Nonstop" },
];

export const services = [
  {
    icon: "wrench",
    title: "Servis Rutin & Tune-Up Cepat",
    description:
      "Ganti oli mesin/gardan, pembersihan busi, filter udara, kalibrasi injeksi/karburator, dan penyetelan rantai/rem.",
    price: "Rp 60.000 - 120.000",
    meta: "Durasi ~45 menit",
    image: {
      src: "/images/landing/service-tune-up.jpg",
      alt: "Pengisian oli mesin motor saat servis rutin",
    },
  },
  {
    icon: "zap",
    title: "Kelistrikan, Starter & Aki",
    description:
      "Uji kesehatan aki (CCA & voltase), servis dinamo starter, relay, bendik, perapihan kabel body, dan lampu LED.",
    price: "Rp 85.000 - 350.000",
    meta: "Garansi pemasangan",
    image: {
      src: "/images/landing/service-electrical.jpg",
      alt: "Mekanik memeriksa sistem kelistrikan dan aki motor",
    },
  },
  {
    icon: "package",
    title: "Servis CVT & Transmisi Matic",
    description:
      "Atasi gredek getar awal, ganti v-belt, roller, slider, pembersihan mangkok kopling ganda, dan pelumasan grease high-temp.",
    price: "Rp 65.000 - 250.000",
    meta: "Suku cadang ready di rak",
    image: {
      src: "/images/landing/service-cvt.jpg",
      alt: "Motor matic dibongkar untuk perawatan CVT di workshop",
    },
  },
  {
    icon: "gauge",
    title: "Overhaul Mesin & Kaki-kaki",
    description:
      "Penanganan mesin ngebul/kemlotok, skir klep, ganti bearing kruk as/roda, perbaikan shockbreaker, dan ganti kampas rem.",
    price: "Mulai Rp 250.000",
    meta: "Estimasi biaya di muka",
    image: {
      src: "/images/landing/service-engine.jpg",
      alt: "Mekanik menangani overhaul komponen mesin motor",
    },
  },
];

export const processSteps = [
  {
    title: "Konsultasi & Diagnosa Keluhan",
    description:
      "Sampaikan kendala motor secara online via asisten mekanik Mas Dian atau cek fisik langsung di workshop bersama teknisi kami.",
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
    title: "Paham Istilah & Bahasa Daerah",
    description:
      "Sistem konsultasi memahami istilah keluhan motor sehari-hari dalam bahasa Jawa & Ngapak (seperti kemlotok, ora srek, brebet) serta terhubung ke stok suku cadang.",
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
      "Motor brebet pas digas pol. Setelah konsultasi keluhan lewat website, saya dikasih gambaran kemungkinan busi kotor, jadi pas datang mekanik langsung cek bagian itu.",
    name: "Agus Setiawan",
    role: "Servis rutin, Vario 125",
  },
  {
    quote:
      "Rem depan kurang pakem dan bunyi srek. Mekanik langsung menunjukkan kampas rem lamanya yang aus, menjelaskan biayanya dulu, baru mulai dikerjakan. Sangat jujur.",
    name: "Rizal Pratama",
    role: "Servis berkala, Honda Beat",
  },
  {
    quote:
      "Suka karena ketersediaan sparepart dan posisi rak bisa dicek langsung dari sistem, jadi tidak perlu nunggu berjam-jam tanpa kepastian barang.",
    name: "Hendra Wijaya",
    role: "Servis kaki-kaki, Supra X 125",
  },
];

export const galleryImages = [
  { src: "/gallery-1.jpg", alt: "Ruang servis Dian Motor yang bersih dan tertata" },
  { src: "/gallery-2.jpg", alt: "Peralatan mekanik presisi dan diagnosis modern" },
  { src: "/gallery-3.jpg", alt: "Rak penyimpanan 1.000+ suku cadang terdata rapi" },
  { src: "/gallery-4.jpg", alt: "Mekanik profesional sedang menangani servis motor" },
  {
    src: "/images/landing/gallery-5.jpg",
    alt: "Motor sport diangkat di lift untuk pemeriksaan kaki-kaki",
  },
  {
    src: "/images/landing/gallery-6.jpg",
    alt: "Motor custom sedang dirakit di area workshop",
  },
  {
    src: "/images/landing/gallery-7.jpg",
    alt: "Dua mekanik bekerja bersama memperbaiki motor pelanggan",
  },
  {
    src: "/images/landing/gallery-8.jpg",
    alt: "Mekanik menggunakan kunci untuk membongkar komponen motor",
  },
];

export const faqs = [
  {
    question: "Bagaimana cara kerja fitur diagnosa kerusakan di website Dian Motor?",
    answer:
      "Sistem konsultasi Dian Motor mengenali berbagai keluhan motor harian. Anda cukup menceritakan kendala yang dirasakan (bisa memakai Bahasa Indonesia, Bahasa Jawa, atau dialek Ngapak). Sistem menganalisa kemungkinan komponen yang bermasalah dan mencocokkan stok suku cadang pengganti langsung dari database gudang Dian Motor.",
  },
  {
    question: "Apakah saya bisa konsultasi menggunakan Bahasa Jawa atau Ngapak?",
    answer:
      "Tentu saja! Mau bertanya 'rem ku kok ora srek?', 'mesin kemlotok pas panas?', atau 'motor brebet pas digas pol?', sistem konsultasi kami langsung memahami istilah bengkel tersebut dan merespon dengan rekomendasi yang solutif.",
  },
  {
    question: "Apakah harus booking terlebih dahulu sebelum datang ke bengkel?",
    answer:
      "Tidak wajib, Anda bisa langsung membawa kendaraan ke workshop Dian Motor pada jam operasional. Namun jika Anda ingin booking terlebih dahulu atau memastikan suku cadang sudah disiapkan di rak, Anda bisa klik tombol Booking via WhatsApp setelah konsultasi online.",
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
  { day: "Buka Setiap Hari (Senin – Minggu)", time: "08.30 – 22.00 WIB" },
  { day: "Layanan Servis & Suku Cadang", time: "Siap Setiap Hari" },
  { day: "Konsultasi Online & WA", time: "Aktif 24 Jam" },
];
