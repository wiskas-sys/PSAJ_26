import { getCriticalProducts, getStockSummary, searchProducts, getAllProducts } from "./stock-data.js";
import { extractStockIntent } from "./slang-dictionary.js";
import { checkPromptSafety } from "./security-guardrails.js";

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
    return 'Halo! Mau cari barang apa? Ketik nama barang atau pertanyaan stok di sini.';
  }

  // 2. Normalisasi Slang & Ekstraksi Intensi
  const intent = extractStockIntent(raw);
  const normalized = intent.normalized;

  if (includesAny(normalized, ["halo", "hai", "hi", "pagi", "siang", "sore", "malam", "assalam"])) {
    return "Halo! Aku asisten stok Dian Motor. Silakan tanyakan ketersediaan barang, lokasi rak, atau stok yang menipis/habis.";
  }

  if (includesAny(normalized, ["makasih", "terima kasih", "thanks", "thank you", "thx", "tq", "makasi"])) {
    return "Sama-sama! Senang bisa membantu operasional bengkel Dian Motor.";
  }

  if (includesAny(normalized, ["tidak apa-apa", "gpp", "gapapa", "sip", "ok", "oke"])) {
    return "Siap! Beritahu saya jika ada barang lain yang ingin dicek.";
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
          : `Kabar baik! Saat ini tidak ada barang yang habis (stok 0 pcs) di bengkel.`;
      }

      const totalCount = targets.length;
      const shown = targets.slice(0, 10);
      const list = shown.map((p, idx) => {
        const rakText = p.rak ? `📍 Rak: \`${p.rak}\` | ` : "";
        return `${idx + 1}. **${p.nama}**\n   📦 Stok: **0 ${p.satuan}** (Min: ${p.minimum}) | Status: **⚠️ HABIS**\n   ${rakText}Kode: \`${p.kode}\` | 💰 ${formatRupiah(p.hargaJual)}`;
      });

      const note = totalCount > 10 ? `\n\n*(Menampilkan 10 dari total ${totalCount} barang yang habis)*` : "";
      return `⚠️ **Daftar Barang yang HABIS (${totalCount} barang):**\n\n${list.join("\n\n")}${note}`;
    }

    if (intent.criticalFilter === "menipis") {
      targets = all.filter((p) => p.stok > 0 && p.stok <= p.minimum);
      if (intent.keyword) {
        targets = targets.filter((p) => p.nama.toLowerCase().includes(intent.keyword) || p.kode.toLowerCase().includes(intent.keyword));
      }

      if (targets.length === 0) {
        return intent.keyword
          ? `Semua stok **${intent.keyword.toUpperCase()}** masih dalam batas aman.`
          : `Semua barang saat ini masih dalam batas aman (belum ada yang menipis).`;
      }

      const totalCount = targets.length;
      const shown = targets.slice(0, 10);
      const list = shown.map((p, idx) => {
        const rakText = p.rak ? `📍 Rak: \`${p.rak}\` | ` : "";
        return `${idx + 1}. **${p.nama}**\n   📦 Stok: **${p.stok} ${p.satuan}** (Min: ${p.minimum}) | Status: **⚡ MENIPIS**\n   ${rakText}Kode: \`${p.kode}\` | 💰 ${formatRupiah(p.hargaJual)}`;
      });

      const note = totalCount > 10 ? `\n\n*(Menampilkan 10 dari total ${totalCount} barang yang menipis)*` : "";
      return `⚡ **Daftar Barang yang MENIPIS (${totalCount} barang):**\n\n${list.join("\n\n")}${note}`;
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

    const shown = filteredCrit.slice(0, 10);
    const lines = shown.map((p, idx) => {
      const rakText = p.rak ? `📍 Rak: \`${p.rak}\` | ` : "";
      const statusIcon = p.stok === 0 ? "⚠️ HABIS" : "⚡ MENIPIS";
      return `${idx + 1}. **${p.nama}**\n   📦 Sisa: **${p.stok} ${p.satuan}** (Min: ${p.minimum}, kurang: ${p.kekurangan} ${p.satuan}) | Status: **${statusIcon}**\n   ${rakText}Kode: \`${p.kode}\` | 💰 ${formatRupiah(p.hargaJual)}`;
    });

    const note = filteredCrit.length > 10 ? `\n\n*(Menampilkan 10 dari total ${filteredCrit.length} barang)*` : "";
    return `⚠️ **Daftar Barang Perlu Restock Segera (${filteredCrit.length} barang):**\n\n${lines.join("\n\n")}${note}`;
  }

  // 4. Intensi Ringkasan Stok Total ("stok", "stok sisa brp", "rekap", dll.)
  if (intent.isSummaryQuery && !intent.keyword) {
    const summary = await getStockSummary();
    return `📊 **Ringkasan Stok Bengkel Dian Motor:**\n- Total SKU: **${summary.totalSku} jenis barang**\n- Stok Aman: **${summary.stokAman} jenis**\n- Stok Menipis: **${summary.stokMenipis} jenis**\n- Stok Habis: **${summary.stokHabis} jenis**\n\nSilakan tanyakan nama barang spesifik untuk mengecek lokasi rak dan sisa unitnya.`;
  }

  // 5. Pencarian Barang Berdasarkan Keyword
  const searchKeyword = intent.keyword || normalized;
  if (!searchKeyword) {
    const summary = await getStockSummary();
    return `Silakan sebutkan nama barang yang ingin dicari.\n\nRingkasan saat ini: ${summary.totalSku} SKU (${summary.stokAman} aman, ${summary.stokMenipis} menipis, ${summary.stokHabis} habis).`;
  }

  const searched = await searchProducts(searchKeyword);
  const matches = searched.filter((p) => {
    const kw = searchKeyword.toLowerCase();
    return (
      p.nama.toLowerCase().includes(kw) ||
      p.kode.toLowerCase().includes(kw) ||
      (p.rak && p.rak.toLowerCase().includes(kw)) ||
      (p.kategori && p.kategori.toLowerCase().includes(kw))
    );
  });

  const finalResults = matches.length > 0 ? matches : (searched.length > 0 ? searched : []);

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
