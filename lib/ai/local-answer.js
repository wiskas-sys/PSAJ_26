import { getCriticalProducts, getStockSummary, searchProducts, getAllProducts } from "./stock-data.js";
import { extractStockIntent } from "./slang-dictionary.js";
import { checkPromptSafety } from "./security-guardrails.js";

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value) || 0);
}

function hasAnyPhrase(text, phrases) {
  const t = ` ${text.toLowerCase().trim()} `;
  return phrases.some((p) => t.includes(` ${p.toLowerCase().trim()} `));
}

export async function answerLocally(message, userRole = "kasir") {
  // 1. Guardrail keamanan Owner untuk akun Kasir
  const safety = checkPromptSafety(message, userRole);
  if (!safety.allowed) {
    return safety.warningReply;
  }

  const raw = String(message || "").trim();
  if (!raw) {
    return 'Halo! Mau cari barang apa? Ketik nama barang atau pertanyaan stok di sini.';
  }

  // 2. Normalisasi Slang & Ekstraksi Intensi
  const intent = extractStockIntent(raw);
  const normalized = intent.normalized;

  // Percakapan sopan santun (hanya dicek jika bukan query stok)
  if (!intent.isCriticalQuery && !intent.isSummaryQuery && !intent.keyword) {
    if (hasAnyPhrase(normalized, ["halo", "hai", "hi", "pagi", "siang", "sore", "malam", "assalam", "assalamualaikum"])) {
      return "Halo! Aku asisten stok Dian Motor. Silakan tanyakan ketersediaan barang, lokasi rak, atau stok yang menipis/habis.";
    }

    if (hasAnyPhrase(normalized, ["makasih", "terima kasih", "thanks", "thank you", "thx", "tq", "makasi"])) {
      return "Sama-sama! Senang bisa membantu operasional bengkel Dian Motor.";
    }

    if (hasAnyPhrase(normalized, ["tidak apa-apa", "gpp", "gapapa", "sip", "ok", "oke", "siap"])) {
      return "Siap! Beritahu saya jika ada barang lain yang ingin dicek.";
    }
  }

  // 3. Intensi Barang Habis / Menipis / Kritis / Restock
  if (intent.isCriticalQuery) {
    const all = await getAllProducts();
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

      const note = totalCount > 5 ? `\n\n*(Menampilkan 5 dari total ${totalCount} barang habis. Ketik nama suku cadang tertentu untuk cek rak).*` : "";
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

    // General critical (gabungan habis & menipis)
    const critical = await getCriticalProducts();
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

  // 4. Intensi Ketersediaan Barang / Barang Ready / Masih Ada
  if (intent.isAvailableQuery) {
    const all = await getAllProducts();
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

    // Urutkan dari stok terbanyak
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

  // 5. Intensi Ringkasan Stok Total ("stok", "stok sisa brp", "rekap", dll.)
  if (intent.isSummaryQuery && !intent.keyword) {
    const summary = await getStockSummary();
    return `📊 **Ringkasan Stok Bengkel Dian Motor:**\n• Total: **${summary.totalSku.toLocaleString("id-ID")} jenis suku cadang**\n• Stok Aman: **${summary.stokAman.toLocaleString("id-ID")} jenis**\n• Stok Menipis: **${summary.stokMenipis.toLocaleString("id-ID")} jenis**\n• Stok Habis: **${summary.stokHabis.toLocaleString("id-ID")} jenis**\n\nSilakan ketik nama barang untuk mengecek lokasi rak dan sisa unitnya.\nContoh: *"stok mana yg masih ada?"*, *"barang apa yg habis?"*, *"oli federal dimana?"*`;
  }

  // 6. Pencarian Barang Berdasarkan Keyword
  const searchKeyword = intent.keyword;
  if (!searchKeyword) {
    if (normalized.includes("ada") || normalized.includes("ready") || normalized.includes("sedia")) {
      const all = await getAllProducts();
      const ready = all.filter(p => p.stok > 0).sort((a, b) => b.stok - a.stok).slice(0, 5);
      if (ready.length > 0) {
        const list = ready.map((p, idx) => `${idx + 1}. **${p.nama}** — Sisa **${p.stok} ${p.satuan}** | Rak \`${p.rak}\` | ${formatRupiah(p.hargaJual)}`);
        return `✅ **Suku Cadang yang Masih Tersedia:**\n\n${list.join("\n")}\n\n*(Ketik nama suku cadang untuk info lebih detail).*\n💡 *Tanyakan juga: "posisi [nama barang]" untuk cek rak.*`;
      }
    }

    const summary = await getStockSummary();
    return `Halo! Saya Asisten Stok Dian Motor.\n\n📊 **Status Stok Saat Ini:**\n• Total: **${summary.totalSku.toLocaleString("id-ID")} jenis suku cadang**\n• Ready / Aman: **${summary.stokAman.toLocaleString("id-ID")} jenis**\n• Menipis: **${summary.stokMenipis.toLocaleString("id-ID")} jenis**\n• Habis: **${summary.stokHabis.toLocaleString("id-ID")} jenis**\n\nSilakan tanyakan seputar stok, contohnya:\n• *"stok mana yang masih ada?"*\n• *"barang apa yang habis?"*\n• *"stok menipis apa saja?"*\n• *"posisi rak oli"*\n• *"harga kampas rem"*`;
  }
  const matches = await searchProducts(searchKeyword);

  if (!matches || matches.length === 0) {
    return `Suku cadang **"${searchKeyword}"** tidak ditemukan di database stok Dian Motor.\n\n💡 *Tips: Coba ketik singkatan atau nama intinya saja, misalnya "oli", "busi", "filter", atau kode barang.*`;
  }

  // A. TAMPILAN ELEGAN JIKA HANYA 1 BARANG DITEMUKAN
  if (matches.length === 1) {
    const p = matches[0];
    const statusText = p.stok === 0 ? "Habis (0 pcs)" : p.stok <= p.minimum ? `${p.stok} ${p.satuan} (Menipis)` : `${p.stok} ${p.satuan} (Aman)`;
    const rakText = p.rak && p.rak !== "-" ? `**Rak ${p.rak}**` : "Belum ada rak";
    const kodeText = p.kode && p.kode !== "-" ? ` (Kode: \`${p.kode}\`)` : "";

    if (intent.isLocationQuery) {
      return `📍 **${p.nama}**\n• Lokasi Penyimpanan: ${rakText}${kodeText}\n• Ketersediaan: **${statusText}**\n• Harga Jual: **${formatRupiah(p.hargaJual)}**`;
    }

    if (intent.isPriceQuery) {
      return `💰 Harga **${p.nama}**: **${formatRupiah(p.hargaJual)}**\n• Lokasi: ${rakText}${kodeText}\n• Ketersediaan: **${statusText}**`;
    }

    return `Suku cadang ditemukan:\n\n**${p.nama}**\n• Lokasi: ${rakText}${kodeText}\n• Ketersediaan: **${statusText}**\n• Harga Jual: **${formatRupiah(p.hargaJual)}**`;
  }

  // B. TAMPILAN ELEGAN JIKA 2 - 5 BARANG DITEMUKAN (2 BARIS RAMPING)
  if (matches.length <= 5) {
    const header = intent.isLocationQuery
      ? `📍 Ditemukan **${matches.length} pilihan** untuk **"${searchKeyword.toUpperCase()}"**:`
      : `Ditemukan **${matches.length} pilihan** untuk **"${searchKeyword.toUpperCase()}"**:`;

    const list = matches.map((p, idx) => {
      const rak = p.rak && p.rak !== "-" ? `Rak \`${p.rak}\`` : "Rak -";
      const statusLabel = p.stok === 0 ? "Habis" : p.stok <= p.minimum ? `Stok ${p.stok} (Menipis)` : `Stok ${p.stok} (Aman)`;
      return `${idx + 1}. **${p.nama}**\n   ${rak} • ${statusLabel} • ${formatRupiah(p.hargaJual)}`;
    });

    return `${header}\n\n${list.join("\n\n")}`;
  }

  // C. TAMPILAN ELEGAN JIKA LEBIH DARI 5 BARANG DITEMUKAN (1 BARIS RAMPING, TOP 5)
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
