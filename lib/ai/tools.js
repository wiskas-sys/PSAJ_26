import { createClient } from "@/lib/supabase/server";
import { extractStockIntent, normalizeSlang } from "@/lib/ai/slang-dictionary";

export const tools = [
  {
    name: "cari_stok",
    description: "Mencari data stok barang di bengkel berdasarkan nama barang, kode barang, rak, atau barcode. Masukkan kata kunci nama barang saja (contoh: 'oli', 'relay', 'kampas', 'busi').",
    parameters: {
      type: "OBJECT",
      properties: {
        keyword: {
          type: "STRING",
          description: "Kata kunci spesifik nama barang/rak/kode, TANPA kata tanya. Contoh: 'oli', 'busi', 'ADP01'",
        },
      },
      required: ["keyword"],
    },
  },
  {
    name: "daftar_stok_kritis",
    description: "Mengambil daftar barang yang stoknya menipis, hampir habis, atau di bawah stok minimum.",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
];

// Pembersih kata kunci otomatis menggunakan kamus slang Gen Z
export function cleanKeyword(text) {
  if (!text) return "";
  const intent = extractStockIntent(text);
  return intent.keyword || text.replace(/[^\w\s-]/gi, "").trim();
}

export async function runTool(name, args) {
  let supabase;
  try {
    supabase = await createClient();
  } catch (e) {
    console.error("Gagal koneksi Supabase:", e);
  }

  if (!supabase) return [];

  // 1. Tool Pencarian Stok
  if (name === "cari_stok" || name === "cari_stok_barang" || name === "cek_stok") {
    const rawKeyword = args?.keyword || "";
    const keyword = cleanKeyword(rawKeyword);

    if (!keyword) {
      // Ambil 15 sampel barang stok jika tidak ada kata kunci
      const { data } = await supabase.from("stok_barang").select("*").limit(15);
      if (data && data.length > 0) return data;

      // Coba tabel produk jika stok_barang belum di-seed
      const { data: prodData } = await supabase.from("products").select("*").limit(15);
      return (prodData || []).map(p => ({
        "NAMA BARANG": p.name,
        "KODE BRG": p.code,
        "RAK": p.rack || "-",
        stok: p.stock,
        stok_minimum: p.minimum_stock,
        "HARGA": p.selling_price,
      }));
    }

    // Cari berdasarkan NAMA BARANG, KODE BRG, RAK, atau BARCODE di stok_barang
    const { data, error } = await supabase
      .from("stok_barang")
      .select("*")
      .or(`"NAMA BARANG".ilike.%${keyword}%,"KODE BRG".ilike.%${keyword}%,"RAK".ilike.%${keyword}%,"BARCODE".ilike.%${keyword}%`)
      .limit(15);

    if (!error && data && data.length > 0) {
      return data;
    }

    // Coba cari kata per kata jika lebih dari 1 kata
    const words = keyword.split(/\s+/).filter((w) => w.length > 1);
    if (words.length > 0) {
      const firstWord = words[0];
      const { data: fallbackData } = await supabase
        .from("stok_barang")
        .select("*")
        .or(`"NAMA BARANG".ilike.%${firstWord}%,"RAK".ilike.%${firstWord}%`)
        .limit(15);
      if (fallbackData && fallbackData.length > 0) return fallbackData;
    }

    // Fallback ke tabel products
    const { data: prodData } = await supabase
      .from("products")
      .select("*")
      .or(`name.ilike.%${keyword}%,code.ilike.%${keyword}%`)
      .limit(15);

    if (prodData && prodData.length > 0) {
      return prodData.map(p => ({
        "NAMA BARANG": p.name,
        "KODE BRG": p.code,
        "RAK": p.rack || "-",
        stok: p.stock,
        stok_minimum: p.minimum_stock,
        "HARGA": p.selling_price,
      }));
    }

    return [];
  }

  // 2. Tool Stok Kritis / Menipis
  if (name === "daftar_stok_kritis" || name === "stok_kritis") {
    const { data, error } = await supabase
      .from("stok_barang")
      .select("*")
      .limit(100);

    if (!error && data && data.length > 0) {
      const kritis = data.filter((item) => (item.stok ?? 0) <= (item.stok_minimum ?? 5));
      return kritis.length > 0 ? kritis : data.slice(0, 15);
    }

    // Fallback ke tabel products
    const { data: prodData } = await supabase.from("products").select("*").limit(100);
    if (prodData && prodData.length > 0) {
      const mapped = prodData.map(p => ({
        "NAMA BARANG": p.name,
        "KODE BRG": p.code,
        "RAK": p.rack || "-",
        stok: p.stock,
        stok_minimum: p.minimum_stock,
        "HARGA": p.selling_price,
      }));
      const kritis = mapped.filter((item) => (item.stok ?? 0) <= (item.stok_minimum ?? 5));
      return kritis.length > 0 ? kritis : mapped.slice(0, 15);
    }

    return [];
  }

  throw new Error(`Tool tidak dikenal: ${name}`);
}
