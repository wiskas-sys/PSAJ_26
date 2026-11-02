import { createClient } from "@/lib/supabase/server";

async function fetchFromSupabase() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("code,name,unit,stock,minimum_stock,selling_price,categories(name)")
    .eq("is_active", true);

  if (error) throw new Error(error.message);

  return (data || []).map((r) => ({
    kode: r.code,
    nama: r.name,
    kategori: r.categories?.name || "Lainnya",
    stok: r.stock,
    satuan: r.unit,
    minimum: r.minimum_stock,
    hargaJual: r.selling_price,
  }));
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
