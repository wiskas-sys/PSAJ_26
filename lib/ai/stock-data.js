import { createClient } from "@/lib/supabase/server";

const USE_MOCK = process.env.AI_USE_MOCK_DATA !== "false";

// Data dummy, sama dengan yang tampil di halaman Stok & Inventori
const MOCK_PRODUCTS = [
  { kode: "OLI-001", nama: "Oli Mesin MPX 1 0.8L", kategori: "Oli", stok: 24, satuan: "Botol", minimum: 10, hargaJual: 58000 },
  { kode: "REM-014", nama: "Kampas Rem Depan Vario", kategori: "Sparepart", stok: 4, satuan: "Set", minimum: 5, hargaJual: 68000 },
  { kode: "BUS-007", nama: "Busi NGK CPR9EA-9", kategori: "Kelistrikan", stok: 18, satuan: "Pcs", minimum: 8, hargaJual: 26000 },
  { kode: "FLT-021", nama: "Filter Oli Yamaha", kategori: "Mesin", stok: 0, satuan: "Pcs", minimum: 6, hargaJual: 39000 },
  { kode: "RNT-008", nama: "Rantai Motor 428H", kategori: "Sparepart", stok: 9, satuan: "Set", minimum: 4, hargaJual: 125000 },
  { kode: "BAN-032", nama: "Ban Motor 80/90-14", kategori: "Ban", stok: 7, satuan: "Pcs", minimum: 3, hargaJual: 225000 },
  { kode: "AKI-009", nama: "Aki MF GTZ5S", kategori: "Kelistrikan", stok: 3, satuan: "Pcs", minimum: 4, hargaJual: 205000 },
  { kode: "UDR-005", nama: "Filter Udara Beat", kategori: "Mesin", stok: 13, satuan: "Pcs", minimum: 5, hargaJual: 45000 },
];

// TODO: sesuaikan nama tabel & kolom dengan skema Supabase final dari client
async function fetchFromSupabase() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("produk")
    .select("kode, nama, kategori, stok, satuan, stok_minimum, harga_jual");

  if (error) throw new Error(error.message);

  return data.map((r) => ({
    kode: r.kode,
    nama: r.nama,
    kategori: r.kategori,
    stok: r.stok,
    satuan: r.satuan,
    minimum: r.stok_minimum,
    hargaJual: r.harga_jual,
  }));
}

function withStatus(p) {
  let status = "Aman";
  if (p.stok === 0) status = "Habis";
  else if (p.stok <= p.minimum) status = "Menipis";
  return { ...p, status };
}

export async function getAllProducts() {
  const raw = USE_MOCK ? MOCK_PRODUCTS : await fetchFromSupabase();
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
      p.kategori.toLowerCase().includes(q)
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