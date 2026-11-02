import {
  searchProducts,
  getCriticalProducts,
  getStockSummary,
} from "@/lib/ai/stock-data";

export const tools = [
  {
    name: "cari_barang",
    description:
      "Cari barang berdasarkan nama, kode, atau kategori. Kosongkan query untuk melihat semua barang. Mengembalikan stok, minimum, satuan, harga jual, dan status.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Kata kunci, misalnya 'oli', 'BUS-007', 'kampas', atau 'Kelistrikan'",
        },
      },
    },
  },
  {
    name: "daftar_stok_kritis",
    description:
      "Daftar barang yang stoknya menipis atau habis, beserta jumlah kekurangan dari batas minimum. Gunakan untuk saran restock.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "ringkasan_stok",
    description:
      "Ringkasan jumlah SKU: total, aman, menipis, dan habis.",
    input_schema: { type: "object", properties: {} },
  },
];

export async function runTool(name, input) {
  switch (name) {
    case "cari_barang":
      return await searchProducts(input?.query);
    case "daftar_stok_kritis":
      return await getCriticalProducts();
    case "ringkasan_stok":
      return await getStockSummary();
    default:
      return { error: `Tool tidak dikenal: ${name}` };
  }
}