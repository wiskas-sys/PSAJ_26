// Kamus normalizer singkatan chatting kasir & bahasa informal
export const SLANG_MAP = {
    // Tanya jumlah / harga / waktu
    bpr: "berapa",
    brp: "berapa",
    brapa: "berapa",
    brapaan: "berapa",
    piro: "berapa",
    kpn: "kapan",
    kapan2: "kapan-kapan",
    
    // Tanya lokasi / rak
    mn: "dimana",
    dmn: "dimana",
    dimn: "dimana",
    dmna: "dimana",
    mna: "dimana",
    
    // Keberadaan / ketersediaan
    "ad g": "ada tidak",
    "ad gk": "ada tidak",
    "ada g": "ada tidak",
    "ada gk": "ada tidak",
    "ad ga": "ada tidak",
    "ad gak": "ada tidak",
    "ada ga": "ada tidak",
    "ada gak": "ada tidak",
    ad: "ada",
    adaa: "ada",
    
    // Kondisi barang
    hbs: "habis",
    abis: "habis",
    abiz: "habis",
    habiz: "habis",
    kosong: "habis",
    menipis: "menipis",
    tipis: "menipis",
    kritis: "menipis",
    msh: "masih",
    masi: "masih",
    
    // Kata ganti & kata hubung
    yg: "yang",
    brg: "barang",
    brg2: "barang",
    bwt: "buat",
    utk: "untuk",
    klo: "kalau",
    kl: "kalau",
    dlu: "dulu",
    dl: "dulu",
    tdk: "tidak",
    ga: "tidak",
    gak: "tidak",
    gk: "tidak",
    ngga: "tidak",
    nggak: "tidak",
    udh: "sudah",
    uda: "sudah",
    sdh: "sudah",
    blm: "belum",
    blom: "belum",
    skrg: "sekarang",
    bgt: "banget",
    bgtt: "banget",
    bener: "benar",
    bnr: "benar",
    plis: "tolong",
    pls: "tolong",
    tlg: "tolong",
    thx: "terima kasih",
    tq: "terima kasih",
    ty: "terima kasih",
    makasi: "terima kasih",
    makasih: "terima kasih",
    sp: "sparepart",
    spart: "sparepart",
    onderdil: "sparepart",
    rek: "rekap",
    rekap: "ringkasan",
    gpp: "tidak apa-apa",
    gapapa: "tidak apa-apa",
    gp2: "tidak apa-apa",
    aja: "saja",
    aj: "saja",
    doang: "saja",
};

export const STOP_WORDS = new Set([
    "stok", "sisa", "berapa", "bpr", "brp", "dimana", "mn", "dmn", "posisi",
    "rak", "ada", "ad", "tidak", "ga", "gak", "gk", "apakah", "cek", "tolong",
    "cari", "barang", "brg", "apa", "yang", "yg", "mau", "hampir", "habis",
    "abis", "hbs", "kosong", "menipis", "tipis", "kritis", "restock", "kurang",
    "dong", "kah", "ya", "sih", "min", "sekarang", "skrg", "terbaru", "bengkel",
    "plis", "pls", "sparepart", "spart", "terima", "kasih", "makasih", "makasi",
    "thx", "tq", "halo", "hai", "hi", "pagi", "siang", "sore", "malam", "masih",
    "msh", "aja", "aj", "saja", "nih", "ini", "itu", "daftar", "rekap",
    "ringkasan", "info", "tentang", "soal", "buat", "bwt", "utk", "untuk",
    "tipe", "jenis", "semua"
]);

/**
 * Normalisasi kalimat chatting informal ke bentuk standar
 */
export function normalizeSlang(text) {
    if (!text || typeof text !== "string") return "";
    let clean = text.toLowerCase().trim();

    // Ganti frasa 2 kata terlebih dahulu
    for (const [slang, norm] of Object.entries(SLANG_MAP)) {
        if (slang.includes(" ")) {
            const regex = new RegExp(`\\b${slang}\\b`, "gi");
            clean = clean.replace(regex, norm);
        }
    }

    // Tokenize dan ganti per kata
    const words = clean.split(/\s+/);
    const normalizedWords = words.map((w) => {
        const stripped = w.replace(/[?!,.;:"'()]/g, "");
        if (SLANG_MAP[stripped]) {
            return SLANG_MAP[stripped];
        }
        return stripped;
    });

    return normalizedWords.filter(Boolean).join(" ");
}

/**
 * Ekstraksi kata kunci nama barang dan intensi pengguna
 */
export function extractStockIntent(rawText) {
    const original = (rawText || "").trim();
    const normalized = normalizeSlang(original);
    const lower = normalized.toLowerCase();

    // 1. Cek intensi barang kritis / habis / menipis
    const hasHabis = lower.includes("habis") || lower.includes("kosong");
    const hasMenipis = lower.includes("menipis") || lower.includes("kritis") || lower.includes("tipis");
    const hasRestock = lower.includes("restock") || lower.includes("kurang") || lower.includes("mau habis") || lower.includes("hampir habis");
    const isCriticalQuery = hasHabis || hasMenipis || hasRestock;

    let criticalFilter = "all";
    if (hasHabis && !hasMenipis) criticalFilter = "habis";
    else if (hasMenipis && !hasHabis) criticalFilter = "menipis";

    // 2. Cek intensi ringkasan stok total
    const isSummaryQuery =
        lower === "stok" ||
        lower === "cek stok" ||
        lower === "stok sisa berapa" ||
        lower === "sisa berapa" ||
        lower === "rekap stok" ||
        lower.includes("ringkasan") ||
        lower.includes("total sku") ||
        lower.includes("rekap");

    // 3. Cek intensi menanyakan posisi rak / lokasi
    const isLocationQuery =
        lower.includes("dimana") ||
        lower.includes("posisi") ||
        lower.includes("rak") ||
        lower.includes("taruh") ||
        lower.includes("letak");

    // 4. Ekstraksi kata kunci barang spesifik
    // Buang semua stop words
    const words = lower.split(/\s+/).map(w => w.replace(/[?!,.;:"'()]/g, "")).filter(Boolean);
    const nonStopWords = words.filter(w => !STOP_WORDS.has(w) && !SLANG_MAP[w]);

    let keyword = nonStopWords.join(" ").trim();

    return {
        original,
        normalized,
        keyword,
        isCriticalQuery,
        criticalFilter,
        isSummaryQuery,
        isLocationQuery,
    };
}
