// Kamus normalizer singkatan chatting kasir, bahasa informal, dan dialek lokal (Jawa / Ngapak / Gaul)
export const SLANG_MAP = {
    // Tanya jumlah / harga / waktu
    bpr: "berapa",
    brp: "berapa",
    brapa: "berapa",
    brapaan: "berapa",
    piro: "berapa",
    pira: "berapa",
    piroan: "berapa",
    piraan: "berapa",
    pirang: "berapa",
    regane: "harga",
    regone: "harga",
    rego: "harga",
    hargane: "harga",
    hargany: "harga",
    hrg: "harga",
    hrga: "harga",
    kpn: "kapan",
    kapan2: "kapan-kapan",
    
    // Tanya lokasi / rak / tempat penyimpanan
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
    "taroh mana": "dimana",
    "taro mana": "dimana",
    "taruh mana": "dimana",
    "taronya dimana": "dimana",
    "taruhnya dimana": "dimana",
    "disimpen dimana": "dimana",
    "nyimpen dimana": "dimana",
    "gon ngendi": "dimana",
    "ning ngendi": "dimana",
    "neng ngendi": "dimana",
    "nang ngendi": "dimana",
    "posisi ngendi": "dimana",
    "rak ngendi": "dimana",
    "rak piro": "dimana",
    "rak pira": "dimana",
    "ning rak apa": "dimana",
    "neng rak apa": "dimana",
    "nang rak apa": "dimana",
    "sebelah ndi": "dimana",
    
    // Keberadaan / ketersediaan (Indonesia & Jawa/Ngapak)
    "ad g": "ada tidak",
    "ad gk": "ada tidak",
    "ada g": "ada tidak",
    "ada gk": "ada tidak",
    "ad ga": "ada tidak",
    "ad gak": "ada tidak",
    "ada ga": "ada tidak",
    "ada gak": "ada tidak",
    "ada ngga": "ada tidak",
    "ada nggak": "ada tidak",
    "ready g": "ada tidak",
    "ready ga": "ada tidak",
    "ready gak": "ada tidak",
    "ready gk": "ada tidak",
    "ready kah": "ada tidak",
    "ready ora": "ada tidak",
    "ana ora": "ada tidak",
    "ana ra": "ada tidak",
    "ana belih": "ada tidak",
    "ana gak": "ada tidak",
    "ana po ra": "ada tidak",
    "ora ana": "habis",
    "ora ono": "habis",
    "ra ono": "habis",
    "ga ono": "habis",
    "gak ono": "habis",
    "jseh ono": "masih ada",
    "sek ono": "masih ada",
    "jseh ana": "masih ada",
    "isen ono": "masih ada",
    ad: "ada",
    adaa: "ada",
    ana: "ada",
    ono: "ada",
    
    // Kondisi barang
    hbs: "habis",
    abis: "habis",
    abiz: "habis",
    habiz: "habis",
    kosong: "habis",
    ludes: "habis",
    entek: "habis",
    asat: "habis",
    menipis: "menipis",
    tipis: "menipis",
    kritis: "menipis",
    kurang: "menipis",
    sitik: "sedikit",
    sithik: "sedikit",
    dikit: "sedikit",
    akeh: "banyak",
    msh: "masih",
    masi: "masih",
    
    // Restok / Belanja / Pengadaan
    kulakan: "restock",
    kulak: "restock",
    ngulak: "restock",
    belanja: "restock",
    order: "restock",
    pesen: "restock",
    tumbas: "beli",
    pengadaan: "restock",
    "perlu kulakan": "rekomendasi restock",
    "harus belanja": "rekomendasi restock",
    "kudu belanja": "rekomendasi restock",
    "kudu kulak": "rekomendasi restock",
    "mau belanja": "rekomendasi restock",
    "saran belanja": "rekomendasi restock",
    "saran kulakan": "rekomendasi restock",
    "rekomendasi kulakan": "rekomendasi restock",
    "rekomendasi order": "rekomendasi restock",
    "daftar belanja": "rekomendasi restock",
    "list belanja": "rekomendasi restock",
    
    // Suku cadang & istilah bengkel
    sp: "sparepart",
    spart: "sparepart",
    sperpat: "sparepart",
    seperpat: "sparepart",
    onderdil: "sparepart",
    part: "sparepart",
    part2: "sparepart",
    dispad: "discpad",
    dispet: "discpad",
    brakepad: "discpad",
    kanvas: "kampas",
    "kampas rem": "discpad",
    vbelt: "v-belt",
    vanbelt: "v-belt",
    fanbelt: "v-belt",
    "tali kipas": "v-belt",
    accu: "aki",
    akki: "aki",
    batre: "aki",
    batere: "aki",
    skok: "shock",
    sokbreker: "shock",
    skokbreker: "shock",
    laher: "bearing",
    klaker: "bearing",
    gotri: "bearing",
    sil: "seal",
    "karet sil": "seal",
    roler: "roller",
    lorer: "roller",
    bolam: "bohlam",
    bohlam: "lampu",
    rante: "rantai",
    gir: "gear",
    kamrat: "rantai",
    "koco spion": "spion",
    pir: "per",
    spring: "per",
    tubeles: "tubeless",
    
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
    ora: "tidak",
    mboten: "tidak",
    udh: "sudah",
    uda: "sudah",
    sdh: "sudah",
    wis: "sudah",
    wes: "sudah",
    blm: "belum",
    blom: "belum",
    durung: "belum",
    dereng: "belum",
    skrg: "sekarang",
    siki: "sekarang",
    saiki: "sekarang",
    bgt: "banget",
    bgtt: "banget",
    pisan: "banget",
    tenan: "banget",
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
    suwun: "terima kasih",
    matur: "terima kasih",
    rek: "rekap",
    rekap: "ringkasan",
    gpp: "tidak apa-apa",
    gapapa: "tidak apa-apa",
    gp2: "tidak apa-apa",
    oraopopo: "tidak apa-apa",
    aja: "saja",
    aj: "saja",
    bae: "saja",
    wae: "saja",
    doang: "saja",
    kue: "itu",
    kui: "itu",
    iki: "ini",
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
        lower.includes("pira") ||
        lower.includes("regane") ||
        lower.includes("biaya");

    // 6. Cek intensi rekomendasi kulakan / saran belanja / restock
    const isRestockAdviceQuery =
        lower.includes("rekomendasi restock") ||
        lower.includes("perlu kulakan") ||
        lower.includes("harus belanja") ||
        lower.includes("kudu belanja") ||
        lower.includes("kudu kulak") ||
        lower.includes("mau belanja") ||
        lower.includes("saran belanja") ||
        lower.includes("saran kulakan") ||
        lower.includes("rekomendasi order") ||
        lower.includes("daftar belanja") ||
        lower.includes("list belanja") ||
        lower.includes("belanja apa") ||
        lower.includes("kulakan apa") ||
        lower.includes("restok apa") ||
        lower.includes("order apa");

    // 7. Cek intensi ranking (stok terbanyak / tersedikit / termurah / termahal)
    let isRankingQuery = false;
    let rankingType = null;
    if (
        lower.includes("paling banyak") ||
        lower.includes("stok terbanyak") ||
        lower.includes("paling akeh") ||
        lower.includes("terbanyak")
    ) {
        isRankingQuery = true;
        rankingType = "terbanyak";
    } else if (
        lower.includes("paling sedikit") ||
        lower.includes("paling dikit") ||
        lower.includes("tersedikit") ||
        lower.includes("paling sitik") ||
        lower.includes("paling sithik") ||
        lower.includes("paling tipis")
    ) {
        isRankingQuery = true;
        rankingType = "tersedikit";
    } else if (lower.includes("paling murah") || lower.includes("termurah")) {
        isRankingQuery = true;
        rankingType = "termurah";
    } else if (lower.includes("paling mahal") || lower.includes("termahal")) {
        isRankingQuery = true;
        rankingType = "termahal";
    }

    // 8. Ekstraksi kata kunci barang spesifik
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
        isRestockAdviceQuery,
        isRankingQuery,
        rankingType,
    };
}