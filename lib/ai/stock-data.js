import { createBrowserClient } from "@supabase/ssr";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const key = serviceKey || anonKey;
  if (!url || !key) return null;
  return createBrowserClient(url, key);
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

async function fetchFromSupabase(supabaseClient = null) {
  if (process.env.AI_USE_MOCK_DATA === "true") {
    return MOCK_PRODUCTS;
  }

  try {
    const supabase = supabaseClient || getSupabaseClient();
    if (!supabase) return MOCK_PRODUCTS;

    // 1. Ambil data dari tabel 'products' (tabel utama yang tersinkronisasi live dengan POS Kasir & Stok)
    let prodData = null;
    let prodErr = null;
    try {
      const res = await supabase
        .from("products")
        .select("id,code,name,unit,stock,minimum_stock,purchase_price,selling_price,description,rack,categories(name)")
        .eq("is_active", true)
        .limit(2000);
      prodData = res.data;
      prodErr = res.error;
    } catch {
      prodErr = { message: "retry base" };
    }

    if (prodErr) {
      const resBase = await supabase
        .from("products")
        .select("id,code,name,unit,stock,minimum_stock,purchase_price,selling_price,description,categories(name)")
        .eq("is_active", true)
        .limit(2000);
      prodData = resBase.data;
      prodErr = resBase.error;
    }

    if (!prodErr && prodData && prodData.length > 0) {
      return prodData.map((r) => ({
        id: r.id || null,
        kode: r.code || "-",
        nama: r.name || "Barang",
        kategori: r.categories?.name || "Sparepart",
        rak: r.rack || r.description || "-",
        stok: Number(r.stock ?? 0),
        satuan: r.unit || "Pcs",
        minimum: Number(r.minimum_stock ?? 5),
        hargaBeli: Number(r.purchase_price ?? 0),
        hargaJual: Number(r.selling_price ?? 0),
      }));
    }

    // 2. Fallback ke tabel 'stok_barang' jika tabel products kosong
    const { data: stokData, error: stokErr } = await supabase
      .from("stok_barang")
      .select("*")
      .limit(1000);

    if (!stokErr && stokData && stokData.length > 0) {
      return stokData.map((r) => {
        const rawHarga = Number(r.HARGA || r.harga || 0);
        const normalizedHarga = rawHarga > 0 && rawHarga < 1000 ? rawHarga * 1000 : rawHarga;

        return {
          id: r.id || null,
          kode: r["KODE BRG"] || r.kode_brg || "-",
          nama: r["NAMA BARANG"] || r.nama_barang || "Barang",
          kategori: r["RAK"] ? `Rak ${r["RAK"]}` : "Sparepart",
          rak: r["RAK"] || "-",
          stok: Number(r.stok ?? 0),
          satuan: "Pcs",
          minimum: Number(r.stok_minimum ?? 5),
          hargaBeli: Math.round(normalizedHarga * 0.72),
          hargaJual: normalizedHarga,
        };
      });
    }
  } catch (e) {
    console.warn("fetchFromSupabase fallback:", e?.message);
  }

  return MOCK_PRODUCTS.map((p) => ({ ...p, hargaBeli: Math.round((p.hargaJual || 0) * 0.72) }));
}

function withStatus(p) {
  let status = "Aman";
  if (p.stok === 0) status = "Habis";
  else if (p.stok <= p.minimum) status = "Menipis";
  return { ...p, status };
}

export async function getAllProducts(supabaseClient = null) {
  const raw = await fetchFromSupabase(supabaseClient);
  return raw.map(withStatus);
}

// Kamus sinonim umum suku cadang bengkel
const SYNONYMS = {
  discpad: ["kampas", "rem"],
  kampas: ["discpad", "rem"],
  rem: ["discpad", "kampas"],
  aki: ["accu", "batre", "baterai"],
  accu: ["aki", "batre", "baterai"],
  batre: ["aki", "accu"],
  bohlam: ["lampu", "bolam"],
  lampu: ["bohlam", "bolam", "led"],
  bearing: ["laher", "klaker", "gotri"],
  laher: ["bearing", "klaker"],
  klaker: ["bearing", "laher"],
  sil: ["seal"],
  seal: ["sil"],
  vbelt: ["vanbelt", "fanbelt", "tali"],
  vanbelt: ["vbelt", "fanbelt"],
  roler: ["roller", "lorer"],
  roller: ["roler", "lorer"],
  matic: ["mtc"],
  mtc: ["matic"],
  baut: ["mur", "screw", "bolt"],
  mur: ["baut", "nut"],
  busi: ["spark", "plug"],
  oli: ["pelumas", "mpx", "spx", "federal", "castrol", "yamalube"],
  mpx: ["oli"],
  spx: ["oli"],
  federal: ["oli"],
  yamalube: ["oli"],
  castrol: ["oli"],
  rantai: ["gir", "gear", "kamrat", "chain"],
  gir: ["rantai", "gear"],
  gear: ["rantai", "gir"],
  skok: ["shock", "sokbreker"],
  shock: ["skok", "sokbreker"],
  per: ["pir", "spring"],
  pir: ["per", "spring"],
  ban: ["tubeless", "tubeles", "tire"],
  tubeless: ["ban"],
  spion: ["kaca"],
};

export async function searchProducts(query, supabaseClient = null) {
  const q = (query || "").toLowerCase().trim();
  const all = await getAllProducts(supabaseClient);
  if (!q) return all;

  // Bersihkan spasi ganda dan karakter khusus
  const cleanKw = q.replace(/[^\w\s-]/g, " ").replace(/\s+/g, " ").trim();
  const rawTokens = cleanKw.split(" ").filter((t) => t.length > 0);
  if (rawTokens.length === 0) return all;

  const scored = [];

  for (const p of all) {
    const pName = (p.nama || "").toLowerCase().replace(/\s+/g, " ");
    const pCode = (p.kode || "").toLowerCase().trim();
    const pRak = (p.rak || "").toLowerCase().trim();

    // 1. Exact match
    if (pName === cleanKw || pCode === cleanKw) {
      scored.push({ product: p, score: 300 });
      continue;
    }

    // 2. Full phrase substring match (mengatasi kata berurutan)
    if (pName.includes(cleanKw)) {
      let score = 150;
      if (pName.startsWith(cleanKw)) score += 40;
      scored.push({ product: p, score });
      continue;
    }

    // 3. Token-level matching (mengatasi urutan kata / spasi ganda)
    let matchedCount = 0;
    for (const t of rawTokens) {
      if (pName.includes(t) || pCode.includes(t) || pRak.includes(t)) {
        matchedCount++;
      } else if (SYNONYMS[t] && SYNONYMS[t].some((s) => pName.includes(s) || pCode.includes(s))) {
        matchedCount += 0.8;
      }
    }

    // Single token: harus cocok
    if (rawTokens.length === 1 && matchedCount >= 0.8) {
      let score = 50;
      if (pName.startsWith(rawTokens[0])) score += 30;
      if (pCode === rawTokens[0]) score += 40;
      scored.push({ product: p, score });
    }
    // Multiple tokens: harus cocok semua atau minimal n-1 jika token >= 3
    else if (rawTokens.length > 1) {
      const threshold = rawTokens.length >= 3 ? rawTokens.length - 1 : rawTokens.length;
      if (matchedCount >= threshold) {
        let score = matchedCount * 30;
        if (pName.startsWith(rawTokens[0])) score += 20;
        scored.push({ product: p, score });
      }
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.product);
}

export async function getCriticalProducts(supabaseClient = null) {
  const all = await getAllProducts(supabaseClient);
  return all
    .filter((p) => p.status !== "Aman")
    .map((p) => ({ ...p, kekurangan: Math.max(p.minimum - p.stok, 0) }))
    .sort((a, b) => a.stok - b.stok);
}

export async function getStockSummary(supabaseClient = null) {
  const all = await getAllProducts(supabaseClient);
  return {
    totalSku: all.length,
    totalUnits: all.reduce((sum, p) => sum + (Number(p.stok) || 0), 0),
    stokAman: all.filter((p) => p.status === "Aman").length,
    stokMenipis: all.filter((p) => p.status === "Menipis").length,
    stokHabis: all.filter((p) => p.status === "Habis").length,
  };
}

/**
 * Helper rentang tanggal WIB (UTC+7) untuk rekap Owner
 */
export function getPeriodWindow(period = "bulan_ini") {
  const now = new Date();
  const wibMs = now.getTime() + 7 * 60 * 60 * 1000;
  const wib = new Date(wibMs);
  const yyyy = wib.getUTCFullYear();
  const mm = String(wib.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(wib.getUTCDate()).padStart(2, "0");
  const todayDate = `${yyyy}-${mm}-${dd}`;
  const monthStartDate = `${yyyy}-${mm}-01`;

  const weekObj = new Date(wibMs);
  weekObj.setUTCDate(weekObj.getUTCDate() - 6);
  const weekStartDate = `${weekObj.getUTCFullYear()}-${String(weekObj.getUTCMonth() + 1).padStart(2, "0")}-${String(weekObj.getUTCDate()).padStart(2, "0")}`;

  if (period === "hari_ini") {
    return { period: "hari_ini", label: "Hari Ini", startDate: todayDate, startISO: `${todayDate}T00:00:00+07:00`, todayDate, weekStartDate, monthStartDate };
  }
  if (period === "minggu_ini") {
    return { period: "minggu_ini", label: "7 Hari Terakhir", startDate: weekStartDate, startISO: `${weekStartDate}T00:00:00+07:00`, todayDate, weekStartDate, monthStartDate };
  }
  if (period === "semua") {
    return { period: "semua", label: "Keseluruhan", startDate: "2000-01-01", startISO: "2000-01-01T00:00:00+07:00", todayDate, weekStartDate, monthStartDate };
  }
  return { period: "bulan_ini", label: "Bulan Ini", startDate: monthStartDate, startISO: `${monthStartDate}T00:00:00+07:00`, todayDate, weekStartDate, monthStartDate };
}

/**
 * Rekap Stok & Mutasi Gudang Mendalam khusus OWNER (paralel & cepat)
 */
export async function getOwnerStockRecap(period = "bulan_ini", supabaseClient = null) {
  const win = getPeriodWindow(period);
  const supabase = supabaseClient || getSupabaseClient();

  const [allProducts, movementsRes] = await Promise.all([
    getAllProducts(supabase),
    supabase
      ? (async () => {
          try {
            let q = supabase
              .from("stock_movements")
              .select("id,type,kind,quantity,movement_date,created_at,product_id,party,reference,products(name,code,unit)")
              .order("created_at", { ascending: false })
              .limit(500);
            if (win.period !== "semua") {
              q = q.gte("movement_date", win.startDate);
            }
            const res = await q;
            if (!res.error) return res.data || [];
            // Fallback jika kolom movement_date belum ada
            let q2 = supabase
              .from("stock_movements")
              .select("id,type,quantity,created_at,product_id,reference,products(name,code,unit)")
              .order("created_at", { ascending: false })
              .limit(500);
            if (win.period !== "semua") {
              q2 = q2.gte("created_at", win.startISO);
            }
            const res2 = await q2;
            return res2.data || [];
          } catch {
            return [];
          }
        })()
      : Promise.resolve([]),
  ]);

  const totalSku = allProducts.length;
  const totalUnits = allProducts.reduce((s, p) => s + (Number(p.stok) || 0), 0);
  const stokAman = allProducts.filter((p) => p.status === "Aman").length;
  const stokMenipis = allProducts.filter((p) => p.status === "Menipis").length;
  const stokHabis = allProducts.filter((p) => p.status === "Habis").length;
  const persenKritis = totalSku > 0 ? Math.round(((stokHabis + stokMenipis) / totalSku) * 100) : 0;
  const persenSehat = totalSku > 0 ? Math.round((stokAman / totalSku) * 100) : 0;

  let totalNilaiModal = 0;
  let totalNilaiJual = 0;
  let estimasiModalRestok = 0;

  const restockCandidates = [];
  const valueItems = [];

  for (const p of allProducts) {
    const stok = Number(p.stok) || 0;
    const min = Number(p.minimum) || 5;
    const jual = Number(p.hargaJual) || 0;
    const beli = Number(p.hargaBeli) > 0 ? Number(p.hargaBeli) : Math.round(jual * 0.72);

    const asetModal = stok * beli;
    const asetJual = stok * jual;
    totalNilaiModal += asetModal;
    totalNilaiJual += asetJual;

    if (stok > 0) {
      valueItems.push({ ...p, hargaBeliEfektif: beli, asetModal, asetJual });
    }

    if (stok <= min) {
      const targetOrder = stok === 0 ? Math.max(min * 2, 5) : Math.max(min * 2 - stok, min);
      const biayaOrder = targetOrder * beli;
      estimasiModalRestok += biayaOrder;
      restockCandidates.push({
        nama: p.nama,
        kode: p.kode,
        rak: p.rak,
        stok,
        minimum: min,
        satuan: p.satuan,
        hargaBeli: beli,
        hargaJual: jual,
        saranOrder: targetOrder,
        estimasiBiaya: biayaOrder,
      });
    }
  }

  const potensiLabaGudang = Math.max(0, totalNilaiJual - totalNilaiModal);
  const estimasiMarginGudang = totalNilaiJual > 0 ? Math.round((potensiLabaGudang / totalNilaiJual) * 100) : 0;

  // Hitung mutasi barang masuk & keluar pada periode
  const movements = Array.isArray(movementsRes) ? movementsRes : [];
  const inRows = movements.filter((m) => m.type === "IN");
  const outRows = movements.filter((m) => m.type === "OUT");
  const inCount = inRows.length;
  const inUnits = inRows.reduce((s, m) => s + Math.abs(Number(m.quantity) || 0), 0);
  const outCount = outRows.length;
  const outUnits = outRows.reduce((s, m) => s + Math.abs(Number(m.quantity) || 0), 0);

  // Top barang paling sering keluar di periode ini
  const outByProduct = new Map();
  for (const m of outRows) {
    const key = m.products?.name || m.product_id || "Produk";
    const cur = outByProduct.get(key) || { nama: key, kode: m.products?.code || "-", unit: m.products?.unit || "pcs", qty: 0, kali: 0 };
    cur.qty += Math.abs(Number(m.quantity) || 0);
    cur.kali += 1;
    outByProduct.set(key, cur);
  }
  const topOutProducts = [...outByProduct.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);

  // Top 5 aset stok bernilai modal tertinggi
  const topValueItems = valueItems.sort((a, b) => b.asetModal - a.asetModal).slice(0, 5);

  // Prioritas restok (utamakan stok 0 & harga jual tinggi / fast-moving)
  const outNames = new Set(topOutProducts.map((x) => x.nama.toLowerCase()));
  const priorityRestockItems = restockCandidates
    .sort((a, b) => {
      const aFast = outNames.has(a.nama.toLowerCase()) ? 1 : 0;
      const bFast = outNames.has(b.nama.toLowerCase()) ? 1 : 0;
      if (aFast !== bFast) return bFast - aFast;
      if (a.stok === 0 && b.stok > 0) return -1;
      if (b.stok === 0 && a.stok > 0) return 1;
      return b.hargaJual - a.hargaJual;
    })
    .slice(0, 6);

  return {
    period: win.period,
    periodLabel: win.label,
    totalSku,
    totalUnits,
    stokAman,
    stokMenipis,
    stokHabis,
    persenKritis,
    persenSehat,
    totalNilaiModal,
    totalNilaiJual,
    potensiLabaGudang,
    estimasiMarginGudang,
    estimasiModalRestok,
    totalKritisCount: restockCandidates.length,
    topValueItems,
    priorityRestockItems,
    movements: {
      inCount,
      inUnits,
      outCount,
      outUnits,
      topOutProducts,
    },
  };
}

/**
 * Rekap Keuangan, Omzet, Laba, & Metode Pembayaran khusus OWNER (paralel & cepat)
 */
export async function getOwnerFinanceRecap(period = "bulan_ini", supabaseClient = null) {
  const win = getPeriodWindow(period);
  const supabase = supabaseClient || getSupabaseClient();

  if (!supabase) {
    return {
      period: win.period,
      periodLabel: win.label,
      transactionCount: 0,
      totalOmzet: 0,
      totalSubtotal: 0,
      totalDiskon: 0,
      avgTransaction: 0,
      todayOmzet: 0,
      todayCount: 0,
      weekOmzet: 0,
      weekCount: 0,
      monthOmzet: 0,
      monthCount: 0,
      paymentBreakdown: {},
      estimasiHpp: 0,
      estimasiLabaKotor: 0,
      marginPersen: 0,
      topSellingItems: [],
      serviceSummary: { count: 0, completedCount: 0, totalServiceCost: 0 },
      bestDay: null,
    };
  }

  // Ambil transaksi periode bulan ini atau semua agar perbandingan Hari Ini / 7 Hari / Bulan Ini akurat dalam 1 query!
  const fetchStartISO = win.period === "semua" ? "2000-01-01T00:00:00+07:00" : `${win.monthStartDate < win.weekStartDate ? win.monthStartDate : win.weekStartDate}T00:00:00+07:00`;

  const [txRes, itemsRes, serviceRes, allProducts] = await Promise.all([
    supabase
      .from("transactions")
      .select("id,transaction_code,subtotal,discount,total,payment_method,status,created_at")
      .gte("created_at", fetchStartISO)
      .order("created_at", { ascending: false })
      .limit(1000)
      .then((r) => (r.error ? [] : r.data || []))
      .catch(() => []),
    supabase
      .from("transaction_items")
      .select("transaction_id,product_id,quantity,price,subtotal,products(name,code,purchase_price)")
      .limit(2000)
      .then((r) => (r.error ? [] : r.data || []))
      .catch(() => []),
    supabase
      .from("services")
      .select("id,service_number,status,total_cost,created_at")
      .gte("created_at", fetchStartISO)
      .limit(500)
      .then((r) => (r.error ? [] : r.data || []))
      .catch(() => []),
    getAllProducts(supabase),
  ]);

  const allTxs = txRes.filter((t) => String(t.status || "Selesai").toLowerCase() !== "dibatalkan");

  // Helper ubah created_at ke YYYY-MM-DD WIB
  const toWibDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10);
    const w = new Date(d.getTime() + 7 * 60 * 60 * 1000);
    return `${w.getUTCFullYear()}-${String(w.getUTCMonth() + 1).padStart(2, "0")}-${String(w.getUTCDate()).padStart(2, "0")}`;
  };

  // Hitung perbandingan cepat (Hari ini, 7 Hari, Bulan Ini)
  const todayTxs = allTxs.filter((t) => toWibDate(t.created_at) === win.todayDate);
  const weekTxs = allTxs.filter((t) => toWibDate(t.created_at) >= win.weekStartDate);
  const monthTxs = allTxs.filter((t) => toWibDate(t.created_at) >= win.monthStartDate);

  const todayOmzet = todayTxs.reduce((s, t) => s + Number(t.total || 0), 0);
  const weekOmzet = weekTxs.reduce((s, t) => s + Number(t.total || 0), 0);
  const monthOmzet = monthTxs.reduce((s, t) => s + Number(t.total || 0), 0);

  // Filter sesuai periode yang diminta Owner
  const periodTxs =
    win.period === "hari_ini"
      ? todayTxs
      : win.period === "minggu_ini"
      ? weekTxs
      : win.period === "bulan_ini"
      ? monthTxs
      : allTxs;

  const periodTxIds = new Set(periodTxs.map((t) => t.id));
  const transactionCount = periodTxs.length;
  const totalOmzet = periodTxs.reduce((s, t) => s + Number(t.total || 0), 0);
  const totalSubtotal = periodTxs.reduce((s, t) => s + Number(t.subtotal || t.total || 0), 0);
  const totalDiskon = periodTxs.reduce((s, t) => s + Number(t.discount || 0), 0);
  const avgTransaction = transactionCount > 0 ? Math.round(totalOmzet / transactionCount) : 0;

  // Breakdown metode pembayaran
  const paymentMap = { Tunai: { count: 0, total: 0 }, Transfer: { count: 0, total: 0 }, QRIS: { count: 0, total: 0 } };
  const byDay = new Map();

  for (const t of periodTxs) {
    const method = t.payment_method || "Tunai";
    if (!paymentMap[method]) paymentMap[method] = { count: 0, total: 0 };
    paymentMap[method].count += 1;
    paymentMap[method].total += Number(t.total || 0);

    const dKey = toWibDate(t.created_at);
    byDay.set(dKey, (byDay.get(dKey) || 0) + Number(t.total || 0));
  }

  const paymentBreakdown = {};
  for (const [m, info] of Object.entries(paymentMap)) {
    paymentBreakdown[m] = {
      ...info,
      pct: totalOmzet > 0 ? Math.round((info.total / totalOmzet) * 100) : 0,
    };
  }

  let bestDay = null;
  for (const [date, total] of byDay.entries()) {
    if (!bestDay || total > bestDay.total) bestDay = { date, total };
  }

  // Hitung HPP & produk terlaris dari transaction_items pada periode ini
  const productById = new Map(allProducts.filter((p) => p.id).map((p) => [p.id, p]));
  const periodItems = itemsRes.filter((it) => periodTxIds.has(it.transaction_id));
  let computedHpp = 0;
  let computedItemRev = 0;
  const soldByProduct = new Map();

  for (const it of periodItems) {
    const qty = Number(it.quantity || 0);
    const rev = Number(it.subtotal || Number(it.price || 0) * qty);
    const prod = productById.get(it.product_id);
    const unitCost =
      Number(it.products?.purchase_price || 0) > 0
        ? Number(it.products.purchase_price)
        : Number(prod?.hargaBeli || 0) > 0
        ? Number(prod.hargaBeli)
        : Math.round(Number(it.price || 0) * 0.72);

    computedHpp += unitCost * qty;
    computedItemRev += rev;

    const pName = it.products?.name || prod?.nama || "Suku Cadang";
    const cur = soldByProduct.get(pName) || { nama: pName, qty: 0, omzet: 0, laba: 0 };
    cur.qty += qty;
    cur.omzet += rev;
    cur.laba += Math.max(0, rev - unitCost * qty);
    soldByProduct.set(pName, cur);
  }

  // Jika transaksi ada namun item tidak tertaut (misal pembayaran servis langsung di kasir), pakai rasio margin katalog
  const catalogTotalJual = allProducts.reduce((s, p) => s + (Number(p.hargaJual) || 0), 0);
  const catalogTotalBeli = allProducts.reduce((s, p) => s + (Number(p.hargaBeli) > 0 ? Number(p.hargaBeli) : Math.round((Number(p.hargaJual) || 0) * 0.72)), 0);
  const avgCostRatio = catalogTotalJual > 0 ? catalogTotalBeli / catalogTotalJual : 0.72;

  const estimasiHpp =
    computedItemRev > 0
      ? Math.round(computedHpp + Math.max(0, totalOmzet - computedItemRev) * avgCostRatio)
      : Math.round(totalOmzet * avgCostRatio);
  const estimasiLabaKotor = Math.max(0, totalOmzet - estimasiHpp);
  const marginPersen = totalOmzet > 0 ? Math.round((estimasiLabaKotor / totalOmzet) * 100) : 0;

  const topSellingItems = [...soldByProduct.values()].sort((a, b) => b.omzet - a.omzet).slice(0, 5);

  // Rekap Servis pada periode
  const periodServices = serviceRes.filter((sv) => win.period === "semua" || toWibDate(sv.created_at) >= win.startDate);
  const completedServices = periodServices.filter((sv) => sv.status === "Selesai" || sv.status === "Diambil");
  const totalServiceCost = completedServices.reduce((s, sv) => s + Number(sv.total_cost || 0), 0);

  return {
    period: win.period,
    periodLabel: win.label,
    transactionCount,
    totalOmzet,
    totalSubtotal,
    totalDiskon,
    avgTransaction,
    todayOmzet,
    todayCount: todayTxs.length,
    weekOmzet,
    weekCount: weekTxs.length,
    monthOmzet,
    monthCount: monthTxs.length,
    paymentBreakdown,
    estimasiHpp,
    estimasiLabaKotor,
    marginPersen,
    topSellingItems,
    serviceSummary: {
      count: periodServices.length,
      completedCount: completedServices.length,
      totalServiceCost,
    },
    bestDay,
  };
}
