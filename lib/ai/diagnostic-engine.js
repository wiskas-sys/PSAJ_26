import { searchProducts, getAllProducts } from "./stock-data.js";

function formatRupiah(val) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(val) || 0);
}

// Kamus kata penanda dialek Jawa / Ngapak
const JAWA_NGAPAK_WORDS = new Set([
  "ora", "ra", "mboten", "nek", "yen", "iki", "kui", "kue", "ning", "neng",
  "nang", "motorku", "kemlotok", "klotok", "angel", "urip", "mburi", "ngarep",
  "opo", "apa", "tenan", "pisan", "kepiye", "piye", "kepriben", "rika", "inyong",
  "nyong", "gembredek", "gredek", "nggeleyer", "mbagel", "selip", "biyung",
  "pan", "karo", "mlebu", "metu", "ambles", "nyokot", "bengkel", "suwun",
  "matur", "monggo", "ndang", "ndang2", "aja", "ojo", "siki", "mengko", "ngesuk",
  "esuk", "bengi", "awan", "rusak", "rusake", "kenang", "kenopo", "ngopo",
  "bae", "standart", "standar", "jagang", "teyengen", "teyeng", "pira", "piro",
  "piroan", "pirang", "beneri", "benerke", "ndandani", "dandani", "suwe", "suwe2"
]);

export function detectLanguage(text) {
  const words = (text || "").toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/);
  let jawaCount = 0;
  for (const w of words) {
    if (JAWA_NGAPAK_WORDS.has(w)) jawaCount++;
  }
  return jawaCount >= 1 ? "jawa" : "id";
}

// Basis pengetahuan mekanik resmi Dian Motor (Honda AHASS, Yamaha, Suzuki, Kawasaki standards)
export const AUTOMOTIVE_KNOWLEDGE = [
  // 1. Standar 2 / Standar Tengah / Standar Samping
  {
    category: "standar",
    keywords: [
      "standar 2", "standart 2", "standar dua", "standart tengah", "standar tengah",
      "standar samping", "standart samping", "jagang", "standar macet", "standar seret",
      "standar teyengen", "standar miring", "beneri bae", "ganti standart", "per standar"
    ],
    title: "Standar Tengah / Standar Samping (Seret, Macet, atau Miring)",
    causeId: "Paling sering karena as pen standar tengah karatan (teyengen), kering pelumas, atau kemasukan tanah/pasir. Jika miring, biasanya lubang dudukan rangka sudah aus (oblak) atau per penahan sudah lemah.",
    causeJawa: "Paling kerep mergo as pen standar tengahe teyengen (karatan), garing ora ana pelumase, utawa kemasukan bledug/lebu. Nek motore miring, biasane bolongan dudukan nang rangkane wis oblak utawa pere wis loyo.",
    actionId: "Tidak perlu langsung ganti baru! Cukup dibongkar, as pen diamplas dan dipanaskan bila macet, lalu dilumasi gemuk (grease) tahan panas. Hanya perlu diganti atau dilas jika pipa sudah keropos atau dudukan rangka sudah jebol parah.",
    actionJawa: "Ora kudu langsung ganti anyar mas! Cukup dibongkar, as pen-e diamplas/diresiki teyenge, terus dilumuri gemuk (grease) kandel. Nembe diganti utawa dilas yen pipane wis keropos/bengkok utawa bolongan nang rangkane wis jebol.",
    urgency: "Rendah - Sedang",
    componentQuery: "standar"
  },

  // 2. Rem & Pengereman
  {
    category: "rem",
    keywords: [
      "rem", "ngerem", "braking", "pakem", "srek", "nggeleyer", "blong", "ambles",
      "mbagel", "decit", "cit cit", "seret", "nyokot", "baret", "kampas", "discpad", "cakram"
    ],
    title: "Sistem Pengereman (Kurang Pakem, Bunyi Srek-srek, atau Ambles)",
    causeId: "Kampas rem (discpad/tromol) sudah tipis/habis, piringan cakram bergelombang/kotor oli, atau minyak rem sudah masuk angin dan perlu bleeding.",
    causeJawa: "Kampas rem-e (discpad) wis tipis/entek, piringan cakrame baret utawa reged kena oli, utawa lenga rem-e ana hawa mampet (masuk angin).",
    actionId: "Ganti kampas rem baru bila sudah tipis. Bersihkan kaliper dari debu kampas, dan bleeding minyak rem bila tuas terasa spons/ambles.",
    actionJawa: "Ganti kampas anyar nek pancen wis tipis. Kaliper reme diresiki saka bledug, terus lenga reme distel maning ben pengeremane nyokot maning.",
    urgency: "Tinggi (Segera periksa demi keselamatan)",
    componentQuery: "discpad"
  },

  // 3. Mesin Brebet & Bahan Bakar
  {
    category: "brebet",
    keywords: [
      "brebet", "mberebet", "ngempos", "kempos", "tarikan berat", "tenaga hilang",
      "ora gelem mlayu", "tersendat", "ndut ndutan", "mati-matian", "gas kosong", "busi", "karbu", "injeksi"
    ],
    title: "Pengapian & Pembakaran (Mesin Brebet atau Ngempos)",
    causeId: "Elektroda busi kotor/aus, filter udara tersumbat debu, atau suplai bensin tidak lancar (injektor kotor / spuyer karburator kemasukan air/endapan kotoran).",
    causeJawa: "Busine wis ireng/kotor, saringan hawa (filter) mampet kena lebu, utawa aliran bensine kesendat (spuyer karburator kemasukan banyu utawa injektore reged).",
    actionId: "Cek dan bersihkan busi serta cop busi. Bersihkan filter udara atau lakukan servis infus injeksi/karbu.",
    actionJawa: "Cek dhisik busine, resiki cop busine bokat teles. Filter hawane diresiki utawa karbu/injektore diservis reresik.",
    urgency: "Sedang",
    componentQuery: "busi"
  },

  // 4. Suara Mesin Kasar / Kemlotok
  {
    category: "suara_mesin",
    keywords: [
      "kemlotok", "klotok", "kletek", "kemricik", "gembredek", "kasar", "suara mesin",
      "mesin bunyi", "tek tek", "ngorok", "gemeritik", "oli", "asat", "kering"
    ],
    title: "Mesin Bersuara Kasar (Kemlotok / Kletek-kletek)",
    causeId: "Paling fatal adalah volume oli mesin sudah kering/asat. Penyebab lain: rantai keteng (kamrat) kendur, tensioner lemah, atau setelan celah klep longgar.",
    causeJawa: "Sing paling kerep mergo oline wis asat/entek dadi komponen jero ora kelumasi. Sakliyane kuwe, rantai keteng (kamrat) sing kendor utawa setelan klep sing renggang.",
    actionId: "Segera matikan mesin dan cek dipstick oli! Jika kering, langsung isi oli baru sebelum mesin macet/turun mesin.",
    actionJawa: "Enggal dicek colokan oline mas! Nek wis asat aja dipeksa diuripna, kudu langsung diisi oli anyar ben jerone mesin ora macet/baret.",
    urgency: "Sangat Tinggi (Risiko turun mesin)",
    componentQuery: "oli"
  },

  // 5. CVT Matic Gredek
  {
    category: "cvt",
    keywords: [
      "gredek", "gembredek", "getar", "gas awal", "cvt", "vbelt", "v-belt", "vanbelt",
      "roller", "roler", "kampas ganda", "mangkok cvt"
    ],
    title: "CVT Motor Matic (Gredek / Getar di Tarikan Awal)",
    causeId: "Debu kampas ganda menumpuk di dalam mangkok kopling CVT, roller sudah aus/peyang, atau v-belt sudah mulai retak dan kaku.",
    causeJawa: "Bledug rereged numpuk nang mangkok kampas ganda CVT, rollere wis peyang ora bunder, utawa vanbelt-e wis kaku lan retak-retak.",
    actionId: "Servis CVT: bongkar dan bersihkan mangkok kopling ganda, cek kebulatan roller, dan berikan grease khusus CVT pada pulley.",
    actionJawa: "Cukup servis reresik CVT: mangkok gandane diresiki bleduge, dicek rollere, terus dikei pelumas grease CVT.",
    urgency: "Sedang",
    componentQuery: "vbelt"
  },

  // 6. Kaki-kaki & Kemudi (Stang Oleng)
  {
    category: "kaki_kaki",
    keywords: [
      "stang", "oleng", "goyang", "geol", "abot", "berat", "geol-geol",
      "laher", "bearing", "komstir", "shock", "skok", "jedug", "stabil"
    ],
    title: "Kaki-Kaki & Kemudi (Stang Goyang / Oleng / Jedug)",
    causeId: "Laher (bearing) roda oblak, komstir stang aus/terlalu kencang/kendor, atau shockbreaker bocor sehingga redaman tidak seimbang.",
    causeJawa: "Laher rodane wis oblak, komstir stange wis kemakan gotrine utawa kendor, utawa skok-e wis mati lengane.",
    actionId: "Ganti bearing roda jika oblak, setel atau ganti komstir baru bila setir kaku/terasa jeglug pas ngerem.",
    actionJawa: "Ganti laher roda nek wis oblak, utawa setel komstir ben setire luwes lan ora mbebayani pas nikung.",
    urgency: "Tinggi",
    componentQuery: "bearing"
  },

  // 7. Kelistrikan & Starter
  {
    category: "kelistrikan",
    keywords: [
      "starter", "stater", "mati", "angel urip", "ora gelem nyala", "ora kuat",
      "aki", "accu", "tekor", "soak", "lampu redup", "klakson", "bendik", "cetek"
    ],
    title: "Kelistrikan & Starter (Aki Soak / Starter Macet)",
    causeId: "Voltase aki drop di bawah 12.4V, arang dinamo starter habis, bendik starter kotor, atau sekring putus.",
    causeJawa: "Akine (accu) wis soak ora kuat ngangkat dinamo starter, arang dinamo startere entek, utawa bendik startere kotor.",
    actionId: "Cek voltase aki. Gunakan engkol kick-starter sementara. Bersihkan kutub aki dari jamur putih.",
    actionJawa: "Cek voltase akine, nggo starter sikil (engkol) sedelo dhisik. Resiki kutub akine bokat ana jamur putih.",
    urgency: "Sedang",
    componentQuery: "aki"
  },

  // 8. Rantai & Gir Motor Bebek/Sport
  {
    category: "rantai",
    keywords: [
      "rantai", "rante", "gir", "gear", "kamrat", "rantai kendor", "rantai bunyi", "loncat"
    ],
    title: "Rantai & Gir Penggerak Roda",
    causeId: "Rantai sudah mulur melebihi batas setelan, mata gir sudah runcing/tajam, atau rantai kering tanpa pelumas.",
    causeJawa: "Rantene wis mulur kendor, mata gire wis lancip-lancip, utawa rantene garing kaku ora tau dikei pelumas.",
    actionId: "Setel kekencangan rantai dan semprot chain lube. Jika gir sudah tajam atau rantai kaku di beberapa ruas, ganti 1 set gir.",
    actionJawa: "Distel kencenge rante terus disemprot pelumas rante. Nek mata gire wis lancip, luwih apik ganti gir set anyar.",
    urgency: "Sedang",
    componentQuery: "gear"
  }
];

/**
 * Diagnosa cerdas yang menghasilkan balasan luwes, interaktif, dan akrab layaknya mekanik sungguhan
 */
export async function diagnoseMotorComplaint(userMessage) {
  const raw = (userMessage || "").trim();
  if (!raw) {
    return {
      reply: "Halo Mas/Mbak! Ada kendala apa dengan motornya? Ceritakan keluhannya santai saja ya, kami siap bantu cek!",
      category: "umum",
      urgency: "Rendah",
      suggestedItems: [],
    };
  }

  const lower = raw.toLowerCase();
  const lang = detectLanguage(raw);
  const isJawa = lang === "jawa";

  // 1. Cari kecocokan masalah berdasarkan basis pengetahuan
  let matchedPattern = null;
  let maxMatched = 0;

  for (const pattern of AUTOMOTIVE_KNOWLEDGE) {
    let count = 0;
    for (const kw of pattern.keywords) {
      if (lower.includes(kw)) count++;
    }
    if (count > maxMatched) {
      maxMatched = count;
      matchedPattern = pattern;
    }
  }

  // 2. Cari stok komponen di Supabase jika ada kecocokan
  let availableItems = [];
  if (matchedPattern) {
    try {
      const searchRes = await searchProducts(matchedPattern.componentQuery);
      availableItems = searchRes.slice(0, 3);
    } catch (e) {
      console.warn("Diagnosa search error:", e?.message);
    }
  }

  // 3. Buat respon ramah dan luwes seperti mekanik sungguhan (BUKAN template kaku)
  if (!matchedPattern || maxMatched === 0) {
    // Respon luwes untuk pertanyaan umum / follow-up
    if (isJawa) {
      return {
        reply: `Wah, perihal iku apike tak priksa dhisik kahanan nyatane nang bengkel Dian Motor mas/mbak!

Nang Dian Motor, prinsip kerjane mekanik santai lan jujur:
• **Dicek dhisik fisike:** Yen isih isa dibeneri, disetel, utawa diresiki, ora bakal langsung dikon ganti anyar ben ora mbuwang biaya.
• **Biayane transparan:** Estimasi ongkos lan sparepart mesthi tak kandani dhisik sakdurunge motor digarap.

Monggo mampir bae langsung maring bengkel Dian Motor mas, santai bae karo ngopi! Ana bagian liyane sing dirasakna ora kepenak pas motor mlaku?`,
        category: "umum",
        urgency: "Rendah",
        suggestedItems: [],
      };
    }

    return {
      reply: `Mengenai kendala tersebut, sebaiknya kita periksa fisik langsung di bengkel Dian Motor ya!

Di bengkel Dian Motor, prinsip kami transparan dan mengutamakan solusi paling hemat:
• **Pemeriksaan Fisik Terlebih Dahulu:** Jika komponen masih bisa disetel, dibersihkan, atau diperbaiki, mekanik tidak akan langsung menyarankan ganti baru agar hemat biaya.
• **Konfirmasi Biaya di Awal:** Semua perkiraan ongkos dan suku cadang selalu kami sampaikan sebelum pengerjaan dimulai.

Silakan langsung mampir ke bengkel Dian Motor, kami siap bantu cek sampai tuntas! Ada gejala lain yang terasa saat motor dikendarai?`,
      category: "umum",
      urgency: "Rendah",
      suggestedItems: [],
    };
  }

  // Jika cocok dengan masalah spesifik:
  const p = matchedPattern;

  // Suku cadang format teks luwes
  let partText = "";
  if (availableItems.length > 0) {
    const readyItems = availableItems.filter((i) => i.stok > 0);
    if (readyItems.length > 0) {
      const first = readyItems[0];
      partText = isJawa
        ? `\n\nNang gudang Dian Motor, sparepart penggantine ya wis **READY** (contoh: **${first.nama}** nang Rak \`${first.rak || "-"}\` sekitar ${formatRupiah(first.hargaJual)}).`
        : `\n\nDi bengkel Dian Motor, suku cadang penggantinya juga sudah **READY STOK** (misal: **${first.nama}** di Rak \`${first.rak || "-"}\` kisaran ${formatRupiah(first.hargaJual)}).`;
    }
  }

  if (isJawa) {
    const reply = `Halo Mas/Mbak! Perkara kendala motormu, tak bantu jelasna ya:

🔍 **Analisa Masalah:**
${p.causeJawa}

💡 **Saran Mekanik & Solusi:**
${p.actionJawa}${partText}

📍 **Langkah Paling Enak:**
Gawa bae motormu mrene maring **Dian Motor**, mas/mbak. Tak cek langsung karo mekanik senior. Pengecekan awal santai, lan yen isih isa dibeneri, ora bakal dikon ganti anyar!`;

    return {
      reply,
      category: p.category,
      urgency: p.urgency,
      suggestedItems: availableItems,
    };
  }

  const reply = `Halo! Terkait kendala motormu, berikut penjelasan dari mekanik kami:

🔍 **Analisa Masalah:**
${p.causeId}

💡 **Saran Mekanik & Solusi:**
${p.actionId}${partText}

📍 **Langkah Selanjutnya:**
Yuk bawa motor ke bengkel **Dian Motor**. Mekanik kami siap memeriksa langsung kondisinya secara transparan, dan biaya selalu dikonfirmasi di awal sebelum pengerjaan dimulai!`;

  return {
    reply,
    category: p.category,
    urgency: p.urgency,
    suggestedItems: availableItems,
  };
}
