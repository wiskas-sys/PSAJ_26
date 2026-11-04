import { getCriticalProducts, getStockSummary, searchProducts } from "@/lib/ai/stock-data";
import { extractStockIntent, normalizeSlang } from "@/lib/ai/slang-dictionary";
import { checkPromptSafety } from "@/lib/ai/security-guardrails";

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value) || 0);
}

function includesAny(text, words) {
  return words.some((word) => text.includes(word));
}

export async function answerLocally(message, userRole = "kasir") {
  // 1. Guardrail keamanan Owner untuk akun Kasir
  const safety = checkPromptSafety(message, userRole);
  if (!safety.allowed) {
    return safety.warningReply;
  }

  const raw = String(message || "").trim();
  if (!raw) {
    return 'Halo! Mau cari barang apa? Ketik singkat seperti: "oli?", "oli mn?", "busi?", atau "stok sisa brp?".';
  }

  // 2. Normalisasi Slang Gen Z & Ekstraksi Intensi
  const intent = extractStockIntent(raw);
  const normalized = intent.normalized;

  if (includesAny(normalized, ["halo", "hai", "hi", "pagi", "siang", "sore", "malam", "assalam"])) {
    return "Halo! Aku asisten stok Dian Motor. Tanya saja ketersediaan barang, lokasi rak, atau stok menipis (bisa ketik singkat: misal 'oli?', 'oli mn?', 'busi ad ga?').";
  }

  if (includesAny(normalized, ["makasih", "terima kasih", "thanks", "thank you", "thx", "tq", "makasi"])) {
    return "Sama-sama! Kalau butuh cek stok atau posisi rak lagi, langsung chat ya.";
  }

  if (includesAny(normalized, ["tidak apa-apa", "gpp", "gapapa", "sip", "ok", "oke"])) {
    return "Siap! Ada barang lain yang mau dicek?";
  }

  // 3. Intensi Ringkasan Stok Total ("stok", "stok sisa brp", "rekap", dll.)
  if (intent.isSummaryQuery && !intent.keyword) {
    const summary = await getStockSummary();
    return `📊 **Ringkasan Stok Bengkel Dian Motor:**\n- Total SKU: **${summary.totalSku} jenis**\n- Stok Aman: **${summary.stokAman}**\n- Stok Menipis: **${summary.stokMenipis}**\n- Stok Habis: **${summary.stokHabis}**\n\nKetik nama barang untuk cek rak atau rinciannya (contoh: *oli?* atau *kampas?*).`;
  }

  // 4. Intensi Stok Kritis / Habis / Menipis ("habis", "restock", "tipis", dll.)
  if (intent.isCriticalQuery && !intent.keyword) {
    const critical = await getCriticalProducts();
    if (critical.length === 0) {
      return "Semua barang masih di atas batas minimum. Belum ada stok yang habis atau perlu di-restock.";
    }
    const lines = critical
      .slice(0, 10)
      .map((p) => `- **${p.nama}** (${p.kode}) — sisa **${p.stok} ${p.satuan}** (min: ${p.minimum}, kurang ${p.kekurangan} ${p.satuan}) [${p.status === 'Habis' ? '⚠️ HABIS' : '⚡ MENIPIS'}]`);
    return `⚠️ **Barang Perlu Restock Segera (${critical.length} barang):**\n\n${lines.join("\n")}`;
  }

  // 5. Pencarian Barang Berdasarkan Keyword (contoh: "oli?", "oli mn?", "busi ad ga?")
  const searchKeyword = intent.keyword || normalized;
  const searched = await searchProducts(searchKeyword);
  const matches = searched.length > 0 ? searched : await searchProducts("");

  const filteredMatches = matches.filter((p) => {
    const kw = searchKeyword.toLowerCase();
    return (
      p.nama.toLowerCase().includes(kw) ||
      p.kode.toLowerCase().includes(kw) ||
      p.kategori.toLowerCase().includes(kw)
    );
  });

  const finalResults = filteredMatches.length > 0 ? filteredMatches : (searched.length > 0 ? searched : []);

  if (finalResults.length > 0) {
    const totalStok = finalResults.reduce((sum, p) => sum + (Number(p.stok) || 0), 0);
    const shown = finalResults.slice(0, 10);

    const locationHeader = intent.isLocationQuery ? "📍 **Informasi Lokasi Rak & Stok:**\n\n" : "";
    const summaryHeader = `Total stok **${searchKeyword.toUpperCase()}** tersisa **${totalStok} pcs** (dari ${finalResults.length} tipe terdaftar):\n\n`;

    const lines = shown.map((p, idx) => {
      let statusIcon = "✅ Aman";
      if (p.stok === 0) statusIcon = "⚠️ HABIS";
      else if (p.stok <= p.minimum) statusIcon = "⚡ MENIPIS";

      const rakText = p.rak ? `📍 Rak: \`${p.rak}\` | ` : "";
      return `${idx + 1}. **${p.nama}**\n   📦 Stok: **${p.stok} ${p.satuan}** (Min: ${p.minimum}) | Status: **${statusIcon}**\n   ${rakText}Kode: \`${p.kode}\` | 💰 ${formatRupiah(p.hargaJual)}`;
    });

    const note = finalResults.length > shown.length ? `\n\n*(Menampilkan 10 dari ${finalResults.length} barang)*` : "";
    return locationHeader + summaryHeader + lines.join("\n\n") + note;
  }

  const summary = await getStockSummary();
  return `Barang **"${searchKeyword}"** tidak ditemukan di database stok Dian Motor.\n\nRingkasan stok bengkel: ${summary.totalSku} SKU (${summary.stokAman} aman, ${summary.stokMenipis} menipis, ${summary.stokHabis} habis).`;
}
