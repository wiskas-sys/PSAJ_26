// Kamus dan normalizer singkatan chatting kasir & bahasa Gen Z
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
    
    // Kosakata umum Gen Z & Chatting
    gpp: "tidak apa-apa",
    gapapa: "tidak apa-apa",
    gp2: "tidak apa-apa",
    brg: "barang",
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
};

/**
 * Normalisasi kalimat chatting kasir/Gen Z ke kalimat yang mudah dipahami LLM & Query Engine
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
        // Hilangkan tanda baca yang menempel di ujung (contoh: "oli?", "brp?")
        const stripped = w.replace(/[?!,.;:]/g, "");
        if (SLANG_MAP[stripped]) {
            return SLANG_MAP[stripped];
        }
        return w;
    });

    return normalizedWords.join(" ");
}

/**
 * Ekstraksi kata kunci nama barang dan intensi dari prompt super singkat
 * Contoh: "oli?" -> { keyword: "oli", isStockQuery: true, isLocationQuery: false }
 * "oli mn?" -> { keyword: "oli", isStockQuery: true, isLocationQuery: true }
 * "stok" -> { keyword: "", isStockQuery: true, isSummaryQuery: true }
 */
export function extractStockIntent(rawText) {
    const original = (rawText || "").trim();
    const normalized = normalizeSlang(original);
    const lower = normalized.toLowerCase();

    // 1. Cek intensi ringkasan stok total
    const isSummaryQuery =
        lower === "stok" ||
        lower === "cek stok" ||
        lower === "stok sisa brp" ||
        lower === "sisa brp" ||
        lower === "rekap stok" ||
        lower.includes("ringkasan") ||
        lower.includes("total sku") ||
        lower.includes("rekap");

    // 2. Cek intensi barang kritis / habis / menipis
    const isCriticalQuery =
        lower.includes("habis") ||
        lower.includes("menipis") ||
        lower.includes("kritis") ||
        lower.includes("restock") ||
        lower.includes("kurang") ||
        lower.includes("mau habis") ||
        lower.includes("hampir habis");

    // 3. Cek intensi menanyakan posisi rak / lokasi
    const isLocationQuery =
        lower.includes("dimana") ||
        lower.includes("posisi") ||
        lower.includes("rak") ||
        lower.includes("taruh") ||
        lower.includes("letak");

    // 4. Ekstraksi kata kunci barang spesifik
    // Buang stop words dan kata tanya
    const stopWords = [
        "stok", "sisa", "berapa", "dimana", "posisi", "rak", "ada", "tidak",
        "apakah", "cek", "tolong", "cari", "barang", "apa", "yang", "mau",
        "hampir", "habis", "kosong", "menipis", "kritis", "restock", "kurang",
        "dong", "kah", "ya", "sih", "min", "sekarang", "terbaru", "bengkel",
        "tolong", "plis", "pls", "sparepart", "spart", "terima kasih", "halo",
        "hai", "hi", "pagi", "siang", "sore", "malam", "masih"
    ];

    let keyword = lower;
    stopWords.forEach((word) => {
        const regex = new RegExp(`\\b${word}\\b`, "gi");
        keyword = keyword.replace(regex, " ");
    });

    // Hilangkan karakter non-alfanumerik
    keyword = keyword.replace(/[^\w\s-]/gi, " ").replace(/\s+/g, " ").trim();

    // Jika kata kunci kosong tapi rawText ada nama barang pendek (contoh: "oli?")
    if (!keyword && original) {
        const directMatch = original.replace(/[?!,.;:]/g, "").trim().toLowerCase();
        if (directMatch && !stopWords.includes(directMatch)) {
            keyword = directMatch;
        }
    }

    return {
        original,
        normalized,
        keyword,
        isSummaryQuery,
        isCriticalQuery,
        isLocationQuery,
    };
}

