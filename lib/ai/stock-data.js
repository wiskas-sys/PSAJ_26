import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const key = serviceKey || anonKey;
  if (!url || !key) return null;
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Data dummy cadangan jika Supabase offline
const MOCK_PRODUCTS = [
  { kode: "FEA01", nama: "OLI FEDERAL MTC 0,8", kategori: "Oli", rak: "FEA01", stok: 12, satuan: "Botol", minimum: 5, hargaJual: 65000 },
  { kode: "FEA02", nama: "OLI FEDERAL 0,8", kategori: "Oli", rak: "FEA02", stok: 15, satuan: "Botol", minimum: 5, hargaJual: 65000 },
  { kode: "FEA03", nama: "OLI FEDERAL 1L", kategori: "Oli", rak: "FEA02", stok: 8, satuan: "Botol", minimum: 4, hargaJual: 80000 },
  { kode: "BUS01", nama: "BUSI NGK CPR9EA-9", kategori: "Kelistrikan", rak: "BIA01", stok: 20, satuan: "Pcs", minimum: 8, hargaJual: 26000 },
  { kode: "REM01", nama: "KAMPAS REM DEPAN VARIO", kategori: "Sparepart", rak: "REM01", stok: 4, satuan: "Set", minimum: 5, hargaJual: 68000 },
  { kode: "FLT01", nama: "FILTER OLI YAMAHA", kategori: "Mesin", rak: "FLT01", stok: 0, satuan: "Pcs", minimum: 6, hargaJual: 39000 },
];

async function fetchFromSupabase() {
  if (process.env.AI_USE_MOCK_DATA === "true") {
    return MOCK_PRODUCTS;
  }

  try {
    const supabase = getSupabaseClient() || (await createServerClient().catch(() => null));
    if (!supabase) return MOCK_PRODUCTS;

    // Prioritaskan tabel stok_barang yang berisi 1000 item riil
    const { data: stokData, error: stokErr } = await supabase
      .from("stok_barang")
      .select("*")
      .limit(1000);

    if (!stokErr && stokData && stokData.length > 0) {
      return stokData.map((r) => {
        const rawHarga = Number(r.HARGA || r.harga || 0);
        // Jika format harga dalam ribuan (misal 65 = 65.000)
        const normalizedHarga = rawHarga > 0 && rawHarga < 1000 ? rawHarga * 1000 : rawHarga;

        return {
          kode: r["KODE BRG"] || r.kode_brg || "-",
          nama: r["NAMA BARANG"] || r.nama_barang || "Barang",
          kategori: r["RAK"] ? `Rak ${r["RAK"]}` : "Sparepart",
          rak: r["RAK"] || "-",
          stok: Number(r.stok ?? 0),
          satuan: "Pcs",
          minimum: Number(r.stok_minimum ?? 5),
          hargaJual: normalizedHarga,
        };
      });
    }

    // Coba tabel products jika stok_barang kosong
    const { data: prodData, error: prodErr } = await supabase
      .from("products")
      .select("code,name,unit,stock,minimum_stock,selling_price,categories(name)")
      .eq("is_active", true);

    if (!prodErr && prodData && prodData.length > 0) {
      return prodData.map((r) => ({
        kode: r.code,
        nama: r.name,
        kategori: r.categories?.name || "Lainnya",
        rak: "-",
        stok: Number(r.stock ?? 0),
        satuan: r.unit || "Pcs",
        minimum: Number(r.minimum_stock ?? 5),
        hargaJual: Number(r.selling_price ?? 0),
      }));
    }
  } catch (e) {
    console.warn("fetchFromSupabase fallback:", e?.message);
  }

  return MOCK_PRODUCTS;
}

function withStatus(p) {
  let status = "Aman";
  if (p.stok === 0) status = "Habis";
  else if (p.stok <= p.minimum) status = "Menipis";
  return { ...p, status };
}

export async function getAllProducts() {
  const raw = await fetchFromSupabase();
  return raw.map(withStatus);
}

export async function searchProducts(query) {
  const q = (query || "").toLowerCase().trim();
  const all = await getAllProducts();
  if (!q) return all;
  return all.filter(
    (p) =>
      p.nama.toLowerCase().includes(q) ||
      p.kode.toLowerCase().includes(q) ||
      (p.rak && p.rak.toLowerCase().includes(q)) ||
      (p.kategori && p.kategori.toLowerCase().includes(q))
  );
}

export async function getCriticalProducts() {
  const all = await getAllProducts();
  return all
    .filter((p) => p.status !== "Aman")
    .map((p) => ({ ...p, kekurangan: Math.max(p.minimum - p.stok, 0) }))
    .sort((a, b) => a.stok - b.stok);
}

export async function getStockSummary() {
  const all = await getAllProducts();
  return {
    totalSku: all.length,
    stokAman: all.filter((p) => p.status === "Aman").length,
    stokMenipis: all.filter((p) => p.status === "Menipis").length,
    stokHabis: all.filter((p) => p.status === "Habis").length,
  };
}
