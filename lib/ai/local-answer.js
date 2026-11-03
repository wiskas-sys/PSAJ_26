import { getCriticalProducts, getStockSummary, searchProducts } from "@/lib/ai/stock-data";

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value) || 0);
}

function includesAny(text, words) {
  return words.some((word) => text.includes(word));
}

export async function answerLocally(message) {
  const text = String(message || "").toLowerCase().trim();

  if (!text) {
    return 'Tulis pertanyaan soal stok, misalnya: "barang apa yang hampir habis?"';
  }

  if (includesAny(text, ["halo", "hai", "hi", "pagi", "siang", "sore", "malam", "assalam"])) {
    return "Halo! Aku asisten stok Dian Motor. Tanya saja soal stok menipis, stok habis, restock, atau cari barang tertentu.";
  }

  if (includesAny(text, ["makasih", "terima kasih", "thanks", "thank you"])) {
    return "Sama-sama! Kalau butuh cek stok lagi, panggil saja aku.";
  }

  if (includesAny(text, ["ringkasan", "rekap", "total sku", "jumlah sku", "total barang", "jumlah barang"])) {
    const summary = await getStockSummary();
    return `Ringkasan stok saat ini:\n- Total SKU: ${summary.totalSku}\n- Aman: ${summary.stokAman}\n- Menipis: ${summary.stokMenipis}\n- Habis: ${summary.stokHabis}`;
  }

  if (includesAny(text, ["habis", "menipis", "kritis", "restock", "kurang", "minimum", "beli lagi"])) {
    const critical = await getCriticalProducts();
    if (critical.length === 0) {
      return "Semua barang masih di atas batas minimum. Belum ada yang perlu di-restock.";
    }
    const lines = critical
      .slice(0, 10)
      .map((p) => `- ${p.nama} (${p.kode}) — sisa ${p.stok} ${p.satuan}, minimum ${p.minimum}, kurang ${p.kekurangan} ${p.satuan}`);
    return `Barang yang perlu perhatian (${critical.length}):\n${lines.join("\n")}`;
  }

  const tokens = text.split(/[^a-z0-9]+/).filter((token) => token.length >= 3);
  const searched = await searchProducts(text);
  const matches = searched.length > 0
    ? searched
    : (await searchProducts("")).filter((p) =>
        tokens.some((token) =>
          p.nama.toLowerCase().includes(token) ||
          p.kode.toLowerCase().includes(token) ||
          p.kategori.toLowerCase().includes(token)
        )
      );

  if (matches.length > 0) {
    const shown = matches.slice(0, 10);
    const lines = shown.map((p) => `- ${p.nama} (${p.kode}) — ${p.stok} ${p.satuan}, min ${p.minimum}, ${formatRupiah(p.hargaJual)}, status ${p.status}`);
    const note = matches.length > shown.length ? `\n\nMenampilkan ${shown.length} dari ${matches.length} barang.` : "";
    return `Hasil pencarian stok:\n${lines.join("\n")}${note}`;
  }

  const summary = await getStockSummary();
  return `Aku belum menemukan barang yang cocok. Coba sebutkan nama atau kode barangnya.\n\nRingkasan stok: ${summary.totalSku} SKU (${summary.stokAman} aman, ${summary.stokMenipis} menipis, ${summary.stokHabis} habis).`;
}
