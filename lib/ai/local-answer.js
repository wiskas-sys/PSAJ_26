import {
  getCriticalProducts,
  getStockSummary,
  searchProducts,
  getAllProducts,
  getOwnerStockRecap,
  getOwnerFinanceRecap,
} from "./stock-data.js";
import { extractStockIntent } from "./slang-dictionary.js";
import { checkPromptSafety } from "./security-guardrails.js";
import { isOwner } from "../demo-auth.js";

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function hasAnyPhrase(text, phrases) {
  const t = ` ${text.toLowerCase().trim()} `;
  return phrases.some((p) => t.includes(` ${p.toLowerCase().trim()} `));
}

function isSocialAck(text) {
  const clean = (text || "").toLowerCase().trim().replace(/[^\w\s]/g, "");
  if (!clean) return false;
  return /^(oalahh?|oalah|ohh?|oke+|ok|siap|sip|mantap|mantep|makasih|makasi|terima\s*kasih|suwun|matur\s*nuwun|thanks|thx|tq|baik|beres|paham|ngerti|jelas)(\s+(mas|bos|min|bro|bang|kak|ya|oke+|ok|siap|banget|banyak))?$/i.test(
    clean
  );
}

/**
 * Bangun narasi Rekap Stok & Penalaran Mendalam khusus Owner
 */
function buildOwnerStockRecapReply(recap) {
  const lines = [
    `📊 **Rekap Stok & Inventori Dian Motor (${recap.periodLabel})**`,
    "",
    `• Total SKU Aktif: **${recap.totalSku.toLocaleString("id-ID")} jenis** (${recap.totalUnits.toLocaleString("id-ID")} unit fisik)`,
    `• Stok Aman: **${recap.stokAman} jenis** (${recap.persenSehat}%)`,
    `• Stok Menipis: **${recap.stokMenipis} jenis** | Stok Habis: **${recap.stokHabis} jenis**`,
    "",
    `🔄 **Mutasi Pergerakan (${recap.periodLabel}):**`,
    `• Barang Masuk: **${recap.movements.inCount} catatan** (+${recap.movements.inUnits.toLocaleString("id-ID")} unit)`,
    `• Barang Keluar: **${recap.movements.outCount} catatan** (-${recap.movements.outUnits.toLocaleString("id-ID")} unit)`,
  ];

  if (recap.movements.topOutProducts.length > 0) {
    lines.push("");
    lines.push(`🔥 **Barang Paling Aktif Keluar (${recap.periodLabel}):**`);
    recap.movements.topOutProducts.slice(0, 3).forEach((item, idx) => {
      lines.push(`   ${idx + 1}. **${item.nama}** — keluar **${item.qty} ${item.unit}** (${item.kali}x mutasi)`);
    });
  }

  lines.push("");
  lines.push(`💰 **Valuasi Aset Gudang (Khusus Owner):**`);
  lines.push(`• Total Nilai Modal (HPP): **${formatRupiah(recap.totalNilaiModal)}**`);
  lines.push(`• Estimasi Nilai Jual: **${formatRupiah(recap.totalNilaiJual)}**`);
  lines.push(`• Potensi Laba Gudang: **${formatRupiah(recap.potensiLabaGudang)}** (Margin ~${recap.estimasiMarginGudang}%)`);

  // Penalaran Kritis Owner
  lines.push("");
  lines.push(`🧠 **Analisa & Penalaran Bisnis:**`);
  const insights = [];
  if (recap.persenKritis >= 50) {
    insights.push(
      `• **Risiko Lost Sales Tinggi:** ${recap.persenKritis}% SKU (${recap.stokHabis} habis & ${recap.stokMenipis} menipis) berada di bawah batas aman. Jika tidak segera di-restok, pelanggan berisiko batal servis/beli karena part kosong.`
    );
  } else if (recap.persenKritis >= 20) {
    insights.push(
      `• **Perlu Penjadwalan Restok:** ${recap.persenKritis}% SKU sudah kritis (${recap.stokHabis} habis). Sebaiknya jadwalkan kulakan minggu ini.`
    );
  } else {
    insights.push(`• **Kesehatan Gudang Baik:** Mayoritas SKU (${recap.persenSehat}%) dalam kondisi aman siap jual.`);
  }

  if (recap.movements.inCount === 0 && recap.movements.outCount > 0) {
    insights.push(
      `• **Ketimpangan Arus Barang:** Pada ${recap.periodLabel.toLowerCase()} ada **${recap.movements.outCount} barang keluar** namun **0 barang masuk**. Pastikan setiap belanja dari supplier dicatat di menu *Barang Masuk* agar stok & modal terpantau akurat.`
    );
  } else if (recap.movements.outUnits > recap.movements.inUnits && recap.movements.outUnits > 0) {
    insights.push(
      `• **Kecepatan Jual > Restok:** Unit keluar (${recap.movements.outUnits}) lebih besar dari unit masuk (${recap.movements.inUnits}). Perlu tambah buffer stok untuk part fast-moving.`
    );
  }

  if (recap.estimasiModalRestok > 0) {
    insights.push(
      `• **Kebutuhan Modal Restok Penuh:** Sekitar **${formatRupiah(recap.estimasiModalRestok)}** untuk seluruh ${recap.totalKritisCount} item kritis. Disarankan belanja bertahap mulai dari item yang paling cepat laku.`
    );
  }

  lines.push(...insights);
  lines.push("");
  lines.push(`Mau saya rincikan **prioritas belanja kulakan + estimasi modalnya**, atau mau lanjut cek **rekap keuangan ${recap.periodLabel.toLowerCase()}**?`);

  return lines.join("\n");
}

/**
 * Bangun narasi Rekap Keuangan & Penalaran Mendalam khusus Owner
 */
function buildOwnerFinanceRecapReply(fin, stockRecap = null) {
  const lines = [
    `💵 **Rekap Keuangan & Penjualan Dian Motor (${fin.periodLabel})**`,
    "",
    `• Total Omzet (${fin.periodLabel}): **${formatRupiah(fin.totalOmzet)}**`,
    `• Jumlah Transaksi: **${fin.transactionCount} transaksi** | Rata-rata: **${formatRupiah(fin.avgTransaction)}/trx**`,
  ];

  if (fin.totalDiskon > 0) {
    lines.push(`• Total Diskon Diberikan: **${formatRupiah(fin.totalDiskon)}**`);
  }

  lines.push("");
  lines.push(`📈 **Estimasi Laba & Profitabilitas:**`);
  lines.push(`• Estimasi HPP (Modal Terjual): **${formatRupiah(fin.estimasiHpp)}**`);
  lines.push(`• Estimasi Laba Kotor: **${formatRupiah(fin.estimasiLabaKotor)}** (Margin ~**${fin.marginPersen}%**)`);

  if (fin.serviceSummary && fin.serviceSummary.count > 0) {
    lines.push(
      `• Aktivitas Servis (${fin.periodLabel}): **${fin.serviceSummary.count} order** (${fin.serviceSummary.completedCount} selesai, nilai **${formatRupiah(fin.serviceSummary.totalServiceCost)}**)`
    );
  }

  lines.push("");
  lines.push(`🗓️ **Perbandingan Cepat Omzet:**`);
  lines.push(`• Hari Ini: **${formatRupiah(fin.todayOmzet)}** (${fin.todayCount} trx)`);
  lines.push(`• 7 Hari Terakhir: **${formatRupiah(fin.weekOmzet)}** (${fin.weekCount} trx)`);
  lines.push(`• Bulan Ini: **${formatRupiah(fin.monthOmzet)}** (${fin.monthCount} trx)`);

  // Komposisi Metode Bayar
  const methods = Object.entries(fin.paymentBreakdown || {}).filter(([, info]) => info.count > 0);
  if (methods.length > 0) {
    lines.push("");
    lines.push(`💳 **Komposisi Metode Pembayaran (${fin.periodLabel}):**`);
    for (const [method, info] of methods) {
      lines.push(`• ${method}: **${formatRupiah(info.total)}** (${info.count} trx · ${info.pct}%)`);
    }
  }

  if (fin.topSellingItems.length > 0) {
    lines.push("");
    lines.push(`🏆 **Produk Terlaris (${fin.periodLabel}):**`);
    fin.topSellingItems.slice(0, 3).forEach((item, idx) => {
      lines.push(`   ${idx + 1}. **${item.nama}** — terjual **${item.qty} pcs** | Omzet **${formatRupiah(item.omzet)}**`);
    });
  }

  // Penalaran Kritis Keuangan
  lines.push("");
  lines.push(`🧠 **Analisa & Penalaran Keuangan:**`);
  if (fin.totalOmzet === 0) {
    if (fin.monthOmzet > 0 && fin.period === "hari_ini") {
      lines.push(
        `• Hari ini belum ada transaksi tercatat di POS kasir (sementara bulan ini sudah masuk **${formatRupiah(fin.monthOmzet)}** dari ${fin.monthCount} transaksi). Pastikan kasir langsung mencatat setiap penjualan tunai maupun QRIS.`
      );
    } else {
      lines.push(
        `• Belum ada transaksi penjualan tercatat pada periode **${fin.periodLabel.toLowerCase()}**. Cek apakah ada transaksi manual yang belum masuk POS kasir, atau manfaatkan momen ini untuk promo servis ringan + ganti oli.`
      );
    }
  } else {
    if (fin.bestDay) {
      lines.push(`• **Puncak Penjualan:** Terjadi pada **${fin.bestDay.date}** dengan omzet **${formatRupiah(fin.bestDay.total)}**.`);
    }
    if (fin.marginPersen >= 25) {
      lines.push(`• **Margin Sehat (${fin.marginPersen}%):** Struktur harga jual bengkel sudah cukup optimal untuk menutup operasional dan putaran modal.`);
    } else if (fin.marginPersen > 0) {
      lines.push(`• **Margin Ketat (${fin.marginPersen}%):** Pertimbangkan menaikkan porsi paket jasa servis atau bundling part (oli + busi/filter) untuk mendongkrak margin bersih.`);
    }
    const qrisInfo = fin.paymentBreakdown?.QRIS;
    if (qrisInfo && qrisInfo.pct === 0) {
      lines.push(`• **Optimalisasi QRIS:** Transaksi masih 100% non-QRIS. Tawarkan pembayaran QRIS di meja kasir agar pencatatan arus kas non-tunai makin rapi.`);
    }
  }

  if (stockRecap && stockRecap.stokHabis > 0) {
    lines.push(
      `• **Kaitan dengan Gudang:** Saat ini ada **${stockRecap.stokHabis} SKU habis**. Mengisi kembali item *fast-moving* (oli, busi, kampas rem) adalah cara tercepat menjaga arus kas tetap tumbuh.`
    );
  }

  lines.push("");
  lines.push(`Apakah Owner ingin lanjut melihat **analisa strategi peningkatan omzet** atau **estimasi budget kulakan prioritas**?`);

  return lines.join("\n");
}

/**
 * Bangun Analisa Bisnis Gabungan (Stok + Keuangan + Strategi) khusus Owner
 */
function buildOwnerBusinessAnalysisReply(stockRecap, fin) {
  const lines = [
    `🎯 **Analisa Bisnis & Kesehatan Bengkel Dian Motor (${fin.periodLabel})**`,
    "",
    `1️⃣ **Ringkasan Keuangan (${fin.periodLabel}):**`,
    `• Omzet: **${formatRupiah(fin.totalOmzet)}** (${fin.transactionCount} trx · Avg ${formatRupiah(fin.avgTransaction)})`,
    `• Estimasi Laba Kotor: **${formatRupiah(fin.estimasiLabaKotor)}** (Margin ~${fin.marginPersen}%)`,
    `• Perbandingan: Hari Ini **${formatRupiah(fin.todayOmzet)}** | 7 Hari **${formatRupiah(fin.weekOmzet)}** | Bulan Ini **${formatRupiah(fin.monthOmzet)}**`,
    "",
    `2️⃣ **Ringkasan Gudang & Aset:**`,
    `• Katalog: **${stockRecap.totalSku} SKU** (${stockRecap.totalUnits} unit) — Aman: **${stockRecap.stokAman}**, Menipis: **${stockRecap.stokMenipis}**, Habis: **${stockRecap.stokHabis}**`,
    `• Nilai Modal Aset Gudang: **${formatRupiah(stockRecap.totalNilaiModal)}** (Potensi Jual: **${formatRupiah(stockRecap.totalNilaiJual)}**)`,
    `• Mutasi (${stockRecap.periodLabel}): Masuk **${stockRecap.movements.inCount}x** (+${stockRecap.movements.inUnits} unit) | Keluar **${stockRecap.movements.outCount}x** (-${stockRecap.movements.outUnits} unit)`,
    "",
    `🧠 **Penalaran Strategis & Rekomendasi Keputusan Owner:**`,
  ];

  // 1. Diagnosa risiko stok vs omzet
  if (stockRecap.persenKritis >= 40) {
    lines.push(
      `• **Prioritas 1 — Selamatkan Potensi Omzet (Lost Sales):** ${stockRecap.persenKritis}% barang di katalog sedang kosong/menipis. Jangan belanja semua sekaligus jika kas ketat — fokuskan dulu 15–20 SKU paling cepat laku (oli mesin, busi, kampas rem, v-belt, aki).`
    );
  } else {
    lines.push(
      `• **Prioritas 1 — Jaga Perputaran Stok:** Kesehatan stok relatif terjaga (${stockRecap.persenSehat}% aman). Pastikan item bernilai modal besar tidak menjadi *dead stock* (stok mengendap).`
    );
  }

  // 2. Diagnosa cashflow vs modal belanja
  if (stockRecap.priorityRestockItems.length > 0) {
    const top6Cost = stockRecap.priorityRestockItems.reduce((s, it) => s + it.estimasiBiaya, 0);
    const coverageNote =
      fin.totalOmzet >= top6Cost && top6Cost > 0
        ? `Kas dari omzet ${fin.periodLabel.toLowerCase()} (**${formatRupiah(fin.totalOmzet)}**) **cukup** untuk menutup kulakan 6 item paling mendesak (**${formatRupiah(top6Cost)}**).`
        : `Kulakan 6 item paling prioritas membutuhkan estimasi modal sekitar **${formatRupiah(top6Cost)}** (dari total restok penuh ${formatRupiah(stockRecap.estimasiModalRestok)}). Disarankan alokasikan dari kas operasional secara bertahap.`;
    lines.push(`• **Prioritas 2 — Alokasi Modal Kulakan:** ${coverageNote}`);
  }

  // 3. Strategi naikkan basket size
  if (fin.avgTransaction > 0 && fin.avgTransaction < 75000) {
    lines.push(
      `• **Prioritas 3 — Naikkan Nilai Rata-rata Struk:** Rata-rata belanja saat ini **${formatRupiah(fin.avgTransaction)}/trx**. Arahkan kasir & mekanik untuk menawarkan *paket bundling* (misal: ganti oli + cek busi/kampas rem) agar rata-rata struk naik di atas Rp 100.000.`
    );
  } else {
    lines.push(
      `• **Prioritas 3 — Disiplin Pencatatan Real-Time:** Pastikan setiap transaksi jasa servis dan barang masuk supplier langsung diinput ke sistem agar grafik tren & valuasi modal di Dashboard selalu akurat.`
    );
  }

  lines.push("");
  lines.push(`Mau saya tampilkan **daftar 6 barang paling urgent untuk dikulak + rincian modalnya**, atau mau bedah **laporan keuangan harian/mingguan**?`);

  return lines.join("\n");
}

export async function answerLocally(
  message,
  userRole = "kasir",
  conversationHistory = [],
  supabaseClient = null
) {
  // 1. Guardrail keamanan Owner untuk akun Kasir
  const safety = checkPromptSafety(message, userRole);
  if (!safety.allowed) {
    return safety.warningReply;
  }

  const ownerMode = isOwner(userRole);
  const raw = String(message || "").trim();
  if (!raw) {
    return ownerMode
      ? "Halo Owner! Saya siap bantu cek rekap stok, laporan keuangan, estimasi laba, atau analisa bisnis Dian Motor. Mau mulai dari mana?"
      : "Halo! Mau cari barang apa? Ketik nama barang atau pertanyaan stok di sini.";
  }

  // 2. Normalisasi Slang & Ekstraksi Intensi
  const intent = extractStockIntent(raw);
  const normalized = intent.normalized;
  const lower = normalized.toLowerCase();

  // Konteks percakapan sebelumnya (untuk sikap lawan bicara multi-turn!)
  const pastAssistant = Array.isArray(conversationHistory)
    ? conversationHistory
        .filter((m) => m.role === "assistant")
        .slice(-2)
        .map((m) => String(m.content || "").toLowerCase())
        .join(" ")
    : "";
  const pastUser = Array.isArray(conversationHistory)
    ? conversationHistory
        .filter((m) => m.role === "user")
        .slice(-3, -1)
        .map((m) => String(m.content || "").toLowerCase())
        .join(" ")
    : "";

  // 2b. Sikap lawan bicara untuk respon konfirmasi / salam
  if (isSocialAck(raw)) {
    return ownerMode
      ? "Siap Owner! Kalau nanti butuh cek ulang rekap stok, omzet harian/bulanan, estimasi modal kulakan, atau analisa bisnis lainnya, tinggal chat aja di sini ya."
      : "Siap! Kabari lagi di sini ya kalau ada suku cadang atau posisi rak lain yang mau dicek.";
  }

  if (
    !intent.isCriticalQuery &&
    !intent.isSummaryQuery &&
    !intent.isFinanceQuery &&
    !intent.isBusinessAnalysisQuery &&
    !intent.isRestockAdviceQuery &&
    !intent.keyword
  ) {
    if (
      hasAnyPhrase(normalized, [
        "halo",
        "hai",
        "hi",
        "pagi",
        "siang",
        "sore",
        "malam",
        "assalam",
        "assalamualaikum",
      ])
    ) {
      return ownerMode
        ? "Halo Owner! Asisten Bisnis & Stok Dian Motor siap membantu. Mau saya buatkan **rekap stok bulan ini**, **rekap keuangan/omzet**, atau **analisa performa bengkel**?"
        : "Halo! Aku asisten stok Dian Motor. Silakan tanyakan ketersediaan barang, lokasi rak, atau stok yang menipis/habis.";
    }
  }

  // 2c. Deteksi follow-up singkat dari Owner berdasarkan konteks sebelumnya
  if (ownerMode) {
    const isShortFollowUpPeriod =
      !intent.keyword &&
      !intent.isFinanceQuery &&
      !intent.isStockRecapQuery &&
      !intent.isBusinessAnalysisQuery &&
      !intent.isCriticalQuery &&
      !intent.isRestockAdviceQuery &&
      (lower.includes("hari ini") ||
        lower.includes("minggu ini") ||
        lower.includes("bulan ini") ||
        lower.includes("7 hari") ||
        lower.includes("harian") ||
        lower.includes("mingguan") ||
        lower.includes("bulanan"));

    if (isShortFollowUpPeriod) {
      if (pastAssistant.includes("rekap keuangan") || pastUser.includes("keuangan") || pastUser.includes("omzet") || pastUser.includes("omset")) {
        const [fin, stockRecap] = await Promise.all([
          getOwnerFinanceRecap(intent.period, supabaseClient),
          getOwnerStockRecap(intent.period, supabaseClient),
        ]);
        return buildOwnerFinanceRecapReply(fin, stockRecap);
      }
      if (pastAssistant.includes("rekap stok") || pastUser.includes("stok")) {
        const recap = await getOwnerStockRecap(intent.period, supabaseClient);
        return buildOwnerStockRecapReply(recap);
      }
    }

    // Follow-up: "ya tampilkan", "boleh", "mana yang paling urgent", "rincikan dong"
    const isFollowUpYes =
      /^(ya|iya|boleh|lanjut|tampilkan|rincikan|kasih\s*liat|coba\s*liat|mana\s*yang\s*urgent|yang\s*urgent)/i.test(
        lower
      );
    if (isFollowUpYes && pastAssistant.includes("kulakan")) {
      const recap = await getOwnerStockRecap("bulan_ini", supabaseClient);
      if (recap.priorityRestockItems.length > 0) {
        const rows = recap.priorityRestockItems.map(
          (p, i) =>
            `${i + 1}. **${p.nama}** (Rak \`${p.rak}\`)\n   • Sisa: **${p.stok} ${p.satuan}** | Saran Order: **+${p.saranOrder} ${p.satuan}**\n   • Estimasi Modal: **${formatRupiah(p.estimasiBiaya)}** (@ ${formatRupiah(p.hargaBeli)})`
        );
        const totalTop = recap.priorityRestockItems.reduce((s, p) => s + p.estimasiBiaya, 0);
        return `🛒 **6 Prioritas Kulakan Paling Mendesak (Owner):**\n\n${rows.join("\n\n")}\n\n💰 **Total Estimasi Modal 6 Item Prioritas:** **${formatRupiah(totalTop)}**\n*(Total estimasi restok seluruh ${recap.totalKritisCount} item kritis: ${formatRupiah(recap.estimasiModalRestok)})*`;
      }
    }
  }

  // 3. KHUSUS OWNER: Analisa Bisnis Gabungan / Rekap Lengkap (Stok + Keuangan)
  if (ownerMode && (intent.isCombinedRecapQuery || intent.isBusinessAnalysisQuery)) {
    const [stockRecap, fin] = await Promise.all([
      getOwnerStockRecap(intent.period, supabaseClient),
      getOwnerFinanceRecap(intent.period, supabaseClient),
    ]);
    return buildOwnerBusinessAnalysisReply(stockRecap, fin);
  }

  // 4. KHUSUS OWNER: Rekap Keuangan, Omzet, Laba, Metode Pembayaran, Transaksi
  if (ownerMode && intent.isFinanceQuery && !intent.keyword) {
    const [fin, stockRecap] = await Promise.all([
      getOwnerFinanceRecap(intent.period, supabaseClient),
      getOwnerStockRecap(intent.period, supabaseClient),
    ]);
    return buildOwnerFinanceRecapReply(fin, stockRecap);
  }

  // 5. KHUSUS OWNER: Rekap Stok / Mutasi / Valuasi Aset Gudang
  if (ownerMode && (intent.isStockRecapQuery || (intent.isSummaryQuery && !intent.keyword))) {
    const recap = await getOwnerStockRecap(intent.period, supabaseClient);
    return buildOwnerStockRecapReply(recap);
  }

  // 6. Intensi Rekomendasi Kulakan / Restok Pengadaan Toko (Owner mendapat estimasi modal HPP, Kasir hanya daftar barang)
  if (intent.isRestockAdviceQuery) {
    if (ownerMode) {
      const recap = await getOwnerStockRecap("bulan_ini", supabaseClient);
      if (recap.totalKritisCount === 0) {
        return "Alhamdulillah Owner, seluruh stok suku cadang Dian Motor saat ini dalam kondisi aman. Belum ada barang yang mendesak untuk dibelanjakan.";
      }
      const rows = recap.priorityRestockItems.map(
        (p, idx) =>
          `${idx + 1}. **${p.nama}** (Rak \`${p.rak}\`)\n   • Status: **${p.stok === 0 ? "HABIS (0)" : `Sisa ${p.stok}`}** | Order: **+${p.saranOrder} ${p.satuan}**\n   • Estimasi Modal: **${formatRupiah(p.estimasiBiaya)}** (@ HPP ~${formatRupiah(p.hargaBeli)})`
      );
      const totalTop = recap.priorityRestockItems.reduce((s, p) => s + p.estimasiBiaya, 0);
      return `📋 **Rekomendasi Kulakan & Estimasi Modal (Khusus Owner):**\n\n${rows.join("\n\n")}\n\n💰 **Ringkasan Budget Belanja:**\n• Prioritas 6 Item Teratas: **${formatRupiah(totalTop)}**\n• Estimasi Restok Penuh (${recap.totalKritisCount} item kritis): **${formatRupiah(recap.estimasiModalRestok)}**\n\n🧠 *Saran: Mulai dari 6 item prioritas di atas terlebih dahulu agar perputaran kas tetap sehat. Setelah barang datang, langsung catat di menu Barang Masuk.*`;
    }

    const all = await getAllProducts(supabaseClient);
    const habis = all.filter((p) => p.stok === 0);
    const menipis = all.filter((p) => p.stok > 0 && p.stok <= p.minimum);

    if (habis.length === 0 && menipis.length === 0) {
      return "Alhamdulillah, seluruh stok suku cadang Dian Motor saat ini dalam kondisi aman dan mencukupi. Belum ada barang yang perlu dibelanjakan.";
    }

    let lines = [];
    if (habis.length > 0) {
      lines.push("🔴 **Prioritas 1: Barang HABIS (0 pcs - Segera Order):**");
      habis.slice(0, 6).forEach((p, idx) => {
        const saran = Math.max(p.minimum * 2, 5);
        lines.push(`   ${idx + 1}. **${p.nama}** (Rak \`${p.rak}\`) — Disarankan order: **+${saran} ${p.satuan}**`);
      });
      if (habis.length > 6) lines.push(`   *(...dan ${habis.length - 6} barang habis lainnya)*`);
    }

    if (menipis.length > 0) {
      if (lines.length > 0) lines.push("");
      lines.push("🟡 **Prioritas 2: Stok MENIPIS (Di bawah batas minimum):**");
      menipis.slice(0, 6).forEach((p, idx) => {
        const saran = Math.max(p.minimum * 2 - p.stok, p.minimum);
        lines.push(`   ${idx + 1}. **${p.nama}** (Sisa ${p.stok} pcs | Min: ${p.minimum} | Rak \`${p.rak}\`) — Order: **+${saran} ${p.satuan}**`);
      });
      if (menipis.length > 6) lines.push(`   *(...dan ${menipis.length - 6} barang menipis lainnya)*`);
    }

    return `📋 **Rekomendasi Kulakan / Restok Bengkel Dian Motor:**\n\n${lines.join("\n")}\n\n💡 *Tips: Segera hubungi supplier atau catat di menu Barang Masuk setelah pengiriman tiba.*`;
  }

  // 7. Intensi Ranking (Stok Terbanyak / Tersedikit / Termurah / Termahal)
  if (intent.isRankingQuery) {
    const all = await getAllProducts(supabaseClient);
    if (intent.rankingType === "terbanyak") {
      const sorted = [...all].sort((a, b) => b.stok - a.stok).slice(0, 6);
      const list = sorted.map((p, idx) => `${idx + 1}. **${p.nama}** — Stok **${p.stok} ${p.satuan}** | Rak \`${p.rak}\` | ${formatRupiah(p.hargaJual)}`);
      return `📈 **Top Suku Cadang dengan Stok Terbanyak:**\n\n${list.join("\n")}`;
    }
    if (intent.rankingType === "tersedikit") {
      const sorted = [...all].sort((a, b) => a.stok - b.stok).slice(0, 6);
      const list = sorted.map((p, idx) => `${idx + 1}. **${p.nama}** — Sisa **${p.stok} ${p.satuan}** | Rak \`${p.rak}\` | ${formatRupiah(p.hargaJual)}`);
      return `📉 **Top Suku Cadang dengan Stok Paling Sedikit:**\n\n${list.join("\n")}`;
    }
    if (intent.rankingType === "termurah") {
      const sorted = [...all].sort((a, b) => a.hargaJual - b.hargaJual).slice(0, 6);
      const list = sorted.map((p, idx) => `${idx + 1}. **${p.nama}** — **${formatRupiah(p.hargaJual)}** | Stok: ${p.stok} pcs | Rak \`${p.rak}\``);
      return `🏷️ **Top Suku Cadang Termurah di Dian Motor:**\n\n${list.join("\n")}`;
    }
    if (intent.rankingType === "termahal") {
      const sorted = [...all].sort((a, b) => b.hargaJual - a.hargaJual).slice(0, 6);
      const list = sorted.map((p, idx) => `${idx + 1}. **${p.nama}** — **${formatRupiah(p.hargaJual)}** | Stok: ${p.stok} pcs | Rak \`${p.rak}\``);
      return `💎 **Top Suku Cadang dengan Harga Tertinggi:**\n\n${list.join("\n")}`;
    }
  }

  // 8. Intensi Barang Habis / Menipis / Kritis / Restock
  if (intent.isCriticalQuery) {
    const all = await getAllProducts(supabaseClient);
    let targets = [];

    if (intent.criticalFilter === "habis") {
      targets = all.filter((p) => p.stok === 0);
      if (intent.keyword) {
        targets = targets.filter((p) => p.nama.toLowerCase().includes(intent.keyword) || p.kode.toLowerCase().includes(intent.keyword));
      }

      if (targets.length === 0) {
        return intent.keyword
          ? `Kabar baik! Tidak ada stok **${intent.keyword.toUpperCase()}** yang habis saat ini.`
          : `Kabar baik! Saat ini seluruh suku cadang masih tersedia (belum ada yang habis).`;
      }

      const totalCount = targets.length;
      const shown = targets.slice(0, 5);
      const list = shown.map((p, idx) => {
        const rak = p.rak && p.rak !== "-" ? `Rak \`${p.rak}\`` : "Rak -";
        return `${idx + 1}. **${p.nama}** — ${rak} | ${formatRupiah(p.hargaJual)}`;
      });

      const note = totalCount > 5 ? `\n\n*(Menampilkan 5 dari total ${totalCount} barang habis.${ownerMode ? ' Ketik "estimasi modal kulakan" untuk hitung budget belanja prioritas.' : ' Ketik nama suku cadang tertentu untuk cek rak.'})*` : "";
      return `⚠️ **Daftar Barang Habis (Stok 0 pcs):**\n\n${list.join("\n")}${note}`;
    }

    if (intent.criticalFilter === "menipis") {
      targets = all.filter((p) => p.stok > 0 && p.stok <= p.minimum);
      if (intent.keyword) {
        targets = targets.filter((p) => p.nama.toLowerCase().includes(intent.keyword) || p.kode.toLowerCase().includes(intent.keyword));
      }

      if (targets.length === 0) {
        return intent.keyword
          ? `Semua stok **${intent.keyword.toUpperCase()}** saat ini masih dalam batas aman.`
          : `✅ **Semua stok dalam batas aman.**\nSaat ini belum ada suku cadang yang menipis atau di bawah stok minimum.`;
      }

      const totalCount = targets.length;
      const shown = targets.slice(0, 5);
      const list = shown.map((p, idx) => {
        const rak = p.rak && p.rak !== "-" ? `Rak \`${p.rak}\`` : "Rak -";
        return `${idx + 1}. **${p.nama}** — Sisa **${p.stok} ${p.satuan}** (Min: ${p.minimum}) | ${rak}`;
      });

      const note = totalCount > 5 ? `\n\n*(Menampilkan 5 dari total ${totalCount} barang menipis).*` : "";
      return `⚡ **Daftar Barang Menipis (Perlu Restock):**\n\n${list.join("\n")}${note}`;
    }

    const critical = await getCriticalProducts(supabaseClient);
    let filteredCrit = critical;
    if (intent.keyword) {
      filteredCrit = critical.filter((p) => p.nama.toLowerCase().includes(intent.keyword) || p.kode.toLowerCase().includes(intent.keyword));
    }

    if (filteredCrit.length === 0) {
      return "Semua barang masih di atas batas minimum. Belum ada stok yang habis atau perlu di-restock.";
    }

    const shown = filteredCrit.slice(0, 5);
    const lines = shown.map((p, idx) => {
      const rak = p.rak && p.rak !== "-" ? `Rak \`${p.rak}\`` : "Rak -";
      const statusLabel = p.stok === 0 ? "Habis" : `Sisa ${p.stok} pcs`;
      return `${idx + 1}. **${p.nama}** — ${rak} | ${statusLabel} | ${formatRupiah(p.hargaJual)}`;
    });

    const note = filteredCrit.length > 5 ? `\n\n*(Menampilkan 5 dari total ${filteredCrit.length} barang).*` : "";
    return `⚠️ **Daftar Barang Perlu Restock Segera:**\n\n${lines.join("\n")}${note}`;
  }

  // 9. Intensi Ketersediaan Barang / Barang Ready / Masih Ada
  if (intent.isAvailableQuery) {
    const all = await getAllProducts(supabaseClient);
    let targets = all.filter((p) => p.stok > 0);

    if (intent.keyword) {
      targets = targets.filter(
        (p) =>
          p.nama.toLowerCase().includes(intent.keyword) ||
          p.kode.toLowerCase().includes(intent.keyword)
      );
    }

    if (targets.length === 0) {
      return intent.keyword
        ? `Saat ini stok suku cadang **${intent.keyword.toUpperCase()}** sedang kosong / habis di bengkel Dian Motor.`
        : `Saat ini belum ada suku cadang yang tercatat ready (stok > 0) di database.`;
    }

    targets.sort((a, b) => b.stok - a.stok);
    const totalCount = targets.length;
    const shown = targets.slice(0, 6);

    const list = shown.map((p, idx) => {
      const rak = p.rak && p.rak !== "-" ? `Rak \`${p.rak}\`` : "Rak -";
      return `${idx + 1}. **${p.nama}**\n   📦 Tersedia: **${p.stok} ${p.satuan}** | 📍 ${rak} | 💰 ${formatRupiah(p.hargaJual)}`;
    });

    const header = intent.keyword
      ? `✅ **Suku Cadang ${intent.keyword.toUpperCase()} yang Masih Tersedia:**`
      : `✅ **Daftar Suku Cadang yang Masih Tersedia (Ready Stok):**`;

    const note = `\n\n*(Total ada **${totalCount} barang** ready di Dian Motor. Ketik nama suku cadang seperti "solasi", "gigi", "oli" untuk mencari item spesifik).*\n\n💡 *Tips: Untuk melihat posisi rak, cukup tanyakan "posisi [nama barang]".*`;

    return `${header}\n\n${list.join("\n\n")}${note}`;
  }

  // 10. Intensi Ringkasan Stok Total untuk Kasir
  if (intent.isSummaryQuery && !intent.keyword) {
    const summary = await getStockSummary(supabaseClient);
    return `📊 **Ringkasan Stok Bengkel Dian Motor:**\n• Total: **${summary.totalSku.toLocaleString("id-ID")} jenis suku cadang**\n• Stok Aman: **${summary.stokAman.toLocaleString("id-ID")} jenis**\n• Stok Menipis: **${summary.stokMenipis.toLocaleString("id-ID")} jenis**\n• Stok Habis: **${summary.stokHabis.toLocaleString("id-ID")} jenis**\n\nSilakan ketik nama barang untuk mengecek lokasi rak dan sisa unitnya.\nContoh: *"stok mana yg masih ada?"*, *"barang apa yg habis?"*, *"oli federal dimana?"*`;
  }

  // 11. Pencarian Barang Berdasarkan Keyword
  const searchKeyword = intent.keyword;
  if (!searchKeyword) {
    if (normalized.includes("ada") || normalized.includes("ready") || normalized.includes("sedia")) {
      const all = await getAllProducts(supabaseClient);
      const ready = all.filter((p) => p.stok > 0).sort((a, b) => b.stok - a.stok).slice(0, 5);
      if (ready.length > 0) {
        const list = ready.map((p, idx) => `${idx + 1}. **${p.nama}** — Sisa **${p.stok} ${p.satuan}** | Rak \`${p.rak}\` | ${formatRupiah(p.hargaJual)}`);
        return `✅ **Suku Cadang yang Masih Tersedia:**\n\n${list.join("\n")}\n\n*(Ketik nama suku cadang untuk info lebih detail).*\n💡 *Tanyakan juga: "posisi [nama barang]" untuk cek rak.*`;
      }
    }

    if (ownerMode) {
      const recap = await getOwnerStockRecap("bulan_ini", supabaseClient);
      return buildOwnerStockRecapReply(recap);
    }

    const summary = await getStockSummary(supabaseClient);
    return `Halo! Saya Asisten Stok Dian Motor.\n\n📊 **Status Stok Saat Ini:**\n• Total: **${summary.totalSku.toLocaleString("id-ID")} jenis suku cadang**\n• Ready / Aman: **${summary.stokAman.toLocaleString("id-ID")} jenis**\n• Menipis: **${summary.stokMenipis.toLocaleString("id-ID")} jenis**\n• Habis: **${summary.stokHabis.toLocaleString("id-ID")} jenis**\n\nSilakan tanyakan seputar stok, contohnya:\n• *"stok mana yang masih ada?"*\n• *"barang apa yang habis?"*\n• *"stok menipis apa saja?"*\n• *"posisi rak oli"*\n• *"harga kampas rem"*`;
  }

  const matches = await searchProducts(searchKeyword, supabaseClient);

  if (!matches || matches.length === 0) {
    return ownerMode
      ? `Suku cadang **"${searchKeyword}"** tidak ditemukan di database stok Dian Motor.\n\n💡 *Tips: Ketik nama barang lebih singkat (misal "oli", "busi", "kampas"), atau tanyakan **"rekap stok bulan ini"**, **"rekap keuangan bulan ini"**, maupun **"analisa performa bengkel"**.*`
      : `Suku cadang **"${searchKeyword}"** tidak ditemukan di database stok Dian Motor.\n\n💡 *Tips: Coba ketik singkatan atau nama intinya saja, misalnya "oli", "busi", "filter", atau kode barang.*`;
  }

  // A. TAMPILAN ELEGAN JIKA HANYA 1 BARANG DITEMUKAN
  if (matches.length === 1) {
    const p = matches[0];
    const statusText = p.stok === 0 ? "Habis (0 pcs)" : p.stok <= p.minimum ? `${p.stok} ${p.satuan} (Menipis)` : `${p.stok} ${p.satuan} (Aman)`;
    const rakText = p.rak && p.rak !== "-" ? `**Rak ${p.rak}**` : "Belum ada rak";
    const kodeText = p.kode && p.kode !== "-" ? ` (Kode: \`${p.kode}\`)` : "";
    const ownerExtra =
      ownerMode && p.hargaBeli > 0
        ? `\n• Harga Beli (HPP): **${formatRupiah(p.hargaBeli)}** | Margin: **${formatRupiah(Math.max(0, p.hargaJual - p.hargaBeli))}/unit**`
        : "";

    if (intent.isLocationQuery) {
      return `📍 **${p.nama}**\n• Lokasi Penyimpanan: ${rakText}${kodeText}\n• Ketersediaan: **${statusText}**\n• Harga Jual: **${formatRupiah(p.hargaJual)}**${ownerExtra}`;
    }

    if (intent.isPriceQuery) {
      return `💰 Harga **${p.nama}**: **${formatRupiah(p.hargaJual)}**\n• Lokasi: ${rakText}${kodeText}\n• Ketersediaan: **${statusText}**${ownerExtra}`;
    }

    return `Suku cadang ditemukan:\n\n**${p.nama}**\n• Lokasi: ${rakText}${kodeText}\n• Ketersediaan: **${statusText}**\n• Harga Jual: **${formatRupiah(p.hargaJual)}**${ownerExtra}`;
  }

  // B. TAMPILAN ELEGAN JIKA 2 - 5 BARANG DITEMUKAN
  if (matches.length <= 5) {
    const header = intent.isLocationQuery
      ? `📍 Ditemukan **${matches.length} pilihan** untuk **"${searchKeyword.toUpperCase()}"**:`
      : `Ditemukan **${matches.length} pilihan** untuk **"${searchKeyword.toUpperCase()}"**:`;

    const list = matches.map((p, idx) => {
      const rak = p.rak && p.rak !== "-" ? `Rak \`${p.rak}\`` : "Rak -";
      const statusLabel = p.stok === 0 ? "Habis" : p.stok <= p.minimum ? `Stok ${p.stok} (Menipis)` : `Stok ${p.stok} (Aman)`;
      const hppNote = ownerMode && p.hargaBeli > 0 ? ` (HPP ${formatRupiah(p.hargaBeli)})` : "";
      return `${idx + 1}. **${p.nama}**\n   ${rak} • ${statusLabel} • ${formatRupiah(p.hargaJual)}${hppNote}`;
    });

    return `${header}\n\n${list.join("\n\n")}`;
  }

  // C. TAMPILAN ELEGAN JIKA LEBIH DARI 5 BARANG DITEMUKAN
  const totalCount = matches.length;
  const shown = matches.slice(0, 5);
  const header = intent.isLocationQuery
    ? `📍 Ditemukan **${totalCount} barang** untuk **"${searchKeyword.toUpperCase()}"** (menampilkan 5 teratas):`
    : `Ditemukan **${totalCount} barang** untuk **"${searchKeyword.toUpperCase()}"** (menampilkan 5 teratas):`;

  const list = shown.map((p, idx) => {
    const rak = p.rak && p.rak !== "-" ? `Rak \`${p.rak}\`` : "Rak -";
    const statusLabel = p.stok === 0 ? "Habis" : `${p.stok} pcs`;
    return `${idx + 1}. **${p.nama}** — ${rak} | ${statusLabel} | ${formatRupiah(p.hargaJual)}`;
  });

  return `${header}\n\n${list.join("\n")}\n\n*(Ketik nama lebih spesifik untuk mempersempit hasil).*`;
}
