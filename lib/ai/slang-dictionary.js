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
    "di mana": "dimana",
    "di mn": "dimana",
    "di dmn": "dimana",
    "rak mana": "dimana",
    "di rak mana": "dimana",
    "posisi mana": "dimana",
    "sebelah mana": "dimana",
    
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
    // Pertanyaan ketersediaan & jumlah
    "stok", "sisa", "berapa", "bpr", "brp", "brapa", "brapaan", "piro",
    "ada", "ad", "adaa", "tidak", "tdk", "ga", "gak", "gk", "ngga", "nggak",
    "apakah", "cek", "tolong", "tlg", "plis", "pls", "cari", "lihat", "liat",
    "kasih", "tau", "tahu", "kasitau", "kasihtau", "info", "tentang", "soal",
    "ready", "punya", "jual", "masih", "msh", "masi", "sudah", "udh", "uda", "sdh",
    "belum", "blm", "blom",

    // Pertanyaan lokasi & posisi rak
    "dimana", "mana", "mn", "dmn", "dimn", "dmna", "mna",
    "posisi", "rak", "letak", "taruh", "ditaruh", "lokasi",
    "sebelah", "bagian", "di", "ke", "dari", "pada",

    // Kata barang & kategori umum
    "barang", "brg", "brg2", "sparepart", "spart", "sp", "onderdil",
    "apa", "yang", "yg", "tipe", "jenis", "semua", "satuan", "pcs",
    "motor", "bengkel", "dian",

    // Kondisi & filter kritis
    "mau", "hampir", "habis", "abis", "abiz", "habiz", "hbs", "kosong",
    "menipis", "tipis", "kritis", "restock", "kurang",

    // Harga & biaya
    "harga", "hrg", "biaya", "tarif", "ongkos", "bayar",

    // Partikel & sapaan informal
    "dong", "kah", "ya", "sih", "nih", "ini", "itu", "aja", "aj", "saja", "doang",
    "kan", "min", "gan", "bos", "mas", "om", "bang", "kak", "bro", "sis",
    "sekarang", "skrg", "terbaru", "halo", "hai", "hi", "pagi", "siang", "sore", "malam",
    "terima", "kasih", "makasih", "makasi", "thx", "tq", "ty",
    "apa-apa", "siap", "ok", "oke", "sip", "gpp", "gapapa", "gp2",
    "buat", "bwt", "utk", "untuk", "daftar", "rekap", "ringkasan"
]);

/**
 * Normalisasi kalimat chatting informal ke bentuk standar
 */
export function normalizeSlang(text) {
    if (!text || typeof text !== "string") return "";
    let clean = text.toLowerCase().trim();

    // Ganti frasa 2-3 kata terlebih dahulu
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

    // 2. Cek intensi barang tersedia / ready / masih ada
    const hasAvailable =
        lower.includes("masih ada") ||
        lower.includes("yang ada") ||
        lower.includes("yang masih ada") ||
        lower.includes("stok ready") ||
        lower.includes("barang ready") ||
        lower.includes("apa yang ada") ||
        lower.includes("apa saja yang ada") ||
        lower.includes("apa yang ready") ||
        lower.includes("stok aman") ||
        lower.includes("barang aman") ||
        lower.includes("stok mana yang masih") ||
        lower.includes("mana yang masih ada") ||
        lower.includes("stok mana yang ada") ||
        lower.includes("mana yang ada") ||
        lower.includes("mana yang ready") ||
        lower.includes("tersedia") ||
        (lower.includes("ready") && !hasHabis);

    const isAvailableQuery = hasAvailable && !isCriticalQuery;

    // 3. Cek intensi ringkasan stok total
    const isSummaryQuery =
        !isAvailableQuery &&
        !isCriticalQuery &&
        (
            lower === "stok" ||
            lower === "cek stok" ||
            lower === "stok sisa berapa" ||
            lower === "sisa berapa" ||
            lower === "rekap stok" ||
            lower === "rekap" ||
            lower === "total stok" ||
            lower === "total barang" ||
            lower.includes("ringkasan") ||
            lower.includes("total sku") ||
            lower.includes("ada berapa barang") ||
            lower.includes("berapa jumlah barang") ||
            lower.includes("kondisi stok") ||
            lower.includes("status stok")
        );

    // 4. Cek intensi menanyakan posisi rak / lokasi
    const isLocationQuery =
        !isCriticalQuery &&
        !isAvailableQuery &&
        !isSummaryQuery &&
        (
            lower.includes("dimana") ||
            lower.includes("posisi") ||
            lower.includes("rak") ||
            lower.includes("taruh") ||
            lower.includes("letak") ||
            lower.includes("lokasi") ||
            lower.includes("sebelah") ||
            (lower.includes("mana") && !lower.includes("stok mana") && !lower.includes("yang mana"))
        );

    // 5. Cek intensi harga
    const isPriceQuery =
        lower.includes("harga") ||
        lower.includes("berapa") ||
        lower.includes("brapaan") ||
        lower.includes("piro") ||
        lower.includes("biaya");

    // 6. Ekstraksi kata kunci barang spesifik
    const words = lower.split(/\s+/).map(w => w.replace(/[?!,.;:"'()]/g, "")).filter(Boolean);
    const nonStopWords = words.filter(w => !STOP_WORDS.has(w) && !SLANG_MAP[w]);

    let keyword = nonStopWords.join(" ").trim();

    return {
        original,
        normalized,
        keyword,
        isCriticalQuery,
        criticalFilter,
        isAvailableQuery,
        isSummaryQuery,
        isLocationQuery,
        isPriceQuery,
    };
}