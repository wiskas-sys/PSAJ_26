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
  },

  // 9. Knalpot Nembak & Asap / Ngebul
  {
    category: "knalpot",
    keywords: [
      "knalpot", "nembak", "meletup", "ngebul", "asap putih", "asap ireng", "asap hitam",
      "paking knalpot", "knalpot bocor", "kebul", "ngasep"
    ],
    title: "Knalpot (Nembak / Meletup atau Mengeluarkan Asap/Ngebul)",
    causeId: "Jika nembak saat lepas gas: paking leher knalpot bocor, AIS/PAIR valve kotor, atau setelan angin terlalu miskin/boros. Jika asap putih tebal: ring piston atau seal klep sudah aus sehingga oli mesin ikut terbakar.",
    causeJawa: "Nek nembak-nembak pas ngecul gas: paking gulungan knalpote bocor utawa saringan hawa reged. Nek ngetokna kukus putih (ngebul): ring seher utawa sil klepe wis kemakan dadi oline melu kebakar.",
    actionId: "Cek paking knalpot dan setelan pembakaran karbu/injeksi. Jika ngebul asap putih, segera cek volume oli jangan sampai kering, dan jadwalkan ganti ring seher/seal klep.",
    actionJawa: "Ganti paking knalpot nek bocor. Nek motore ngebul putih, ajeg dicek oline ben ora kebobolan asat, terus diganti sil klep utawa ring sehere.",
    urgency: "Tinggi",
    componentQuery: "oli"
  },

  // 10. Motor Mogok Saat Hujan / Masuk Genangan Air
  {
    category: "hujan_air",
    keywords: [
      "hujan", "udang", "banyu", "genangan", "banjir", "kecipratan", "mati mendadak pas udan",
      "kena air", "cop busi", "kecebur", "mati pas udan"
    ],
    title: "Mesin Mati Mendadak Terkena Air Hujan / Banjir",
    causeId: "Paling sering cangklong (cop) busi sudah retak atau getas sehingga air hujan merembes masuk dan memicu korsleting pengapian.",
    causeJawa: "Sing paling kerep cop busine (cangklong busi) wis pecah utawa getas, dadi banyu udan mlebu nggarai setrum busine kongslet.",
    actionId: "Buka dan tiup cop busi hingga kering. Ganti cop busi baru bertipe waterproof (karet rapat) agar aman melibas hujan.",
    actionJawa: "Dicopot dhisik cop busine, disebul/dilap nganti garing. Pasangi cop busi anyar sing rapete karet ben aman bablas udan.",
    urgency: "Sedang - Tinggi",
    componentQuery: "busi"
  },

  // 11. Kopling Selip (Tarikan Lolos / Meraung)
  {
    category: "kopling",
    keywords: [
      "kopling", "selip", "slif", "meraung", "lolos", "tenaga ngempos pas nanjak",
      "kampas kopling", "plat kopling", "per kopling"
    ],
    title: "Kopling Selip (Mesin Meraung Tapi Laju Motor Lambat)",
    causeId: "Kampas kopling sudah tipis/aus, per kopling lemah, atau salah menggunakan oli mesin yang mengandung aditif mobil (licin).",
    causeJawa: "Kampas koplinge wis tipis/kemakan, pere wis ora nyokot, utawa salah nggunakake oli mesin.",
    actionId: "Ganti 1 set kampas kopling dan periksa mangkok kopling. Gunakan oli khusus motor standar JASO MA.",
    actionJawa: "Ganti kampas kopling set anyar, terus gunakna oli khusus motor sing pas spek-e.",
    urgency: "Sedang",
    componentQuery: "kampas"
  },

  // 12. Ban & Roda (Bocor Halus, Kempes, Velg Speleng)
  {
    category: "ban_roda",
    keywords: [
      "ban", "bocor", "kempes", "gembos", "tubeles", "tubeless", "pentil",
      "velg", "pelek", "speleng", "bengkok", "ban bocor alus"
    ],
    title: "Ban & Velg (Bocor Halus, Kempes, atau Velg Bengkok)",
    causeId: "Karet pentil bocor halus, bibir ban tubeless kotor/berpasir, paku kecil, atau velg peyang sehabis menghantam lubang.",
    causeJawa: "Karet pentile bocor alus, lambe ban tubeless-e reged pasir, utawa pelek-e peyang/bengkok bar nabrak dalan growok.",
    actionId: "Cek kebocoran dengan air sabun di sekitar pentil dan tapak ban. Pasang cairan ban tubeless atau press velg jika speleng.",
    actionJawa: "Disiram banyu sabun nang bagian pentil lan tapak ban. Nek peleke peyang bisa dipres ben lempeng maning.",
    urgency: "Sedang",
    componentQuery: "ban"
  }
];

/**
 * Diagnosa cerdas yang menghasilkan balasan kritis, taktis, luwes, dan akrab layaknya kepala mekanik bengkel
 */
export async function diagnoseMotorComplaint(userMessage, conversationHistory = []) {
  const raw = (userMessage || "").trim();
  if (!raw) {
    return {
      reply: "Halo Mas/Mbak! Ada kendala apa dengan motornya? Ceritakan keluhannya santai saja ya, kami siap bantu cek dan kasih solusi paling hemat!",
      category: "umum",
      urgency: "Rendah",
      suggestedItems: [],
    };
  }

  // Gabungkan pesan terakhir dengan histori percakapan sebelumnya untuk menjaga konteks
  const pastUserMsgs = Array.isArray(conversationHistory)
    ? conversationHistory.filter(m => m.role === "user").map(m => m.content || "").join(" ")
    : "";
  const combinedContext = `${pastUserMsgs} ${raw}`.toLowerCase();

  const lower = raw.toLowerCase();
  const lang = detectLanguage(raw);
  const isJawa = lang === "jawa";

  // 1. Deteksi intensi khusus: Langkah awal mandiri / Pertolongan pertama di rumah / Belum sempat ke bengkel
  const isAskingInitialSteps =
    lower.includes("langkah awal") ||
    lower.includes("urung sempet") ||
    lower.includes("belum sempat") ||
    lower.includes("pertolongan pertama") ||
    lower.includes("tek terapna") ||
    lower.includes("saya terapkan") ||
    lower.includes("cek sendiri") ||
    lower.includes("priksa dhewek") ||
    lower.includes("beneri dhewek") ||
    lower.includes("di rumah") ||
    lower.includes("nang ngumah") ||
    lower.includes("tindakan awal") ||
    lower.includes("kudu piye dhisik") ||
    lower.includes("harus gimana dulu");

  // 2. Cari kecocokan masalah berdasarkan basis pengetahuan (prioritaskan pesan sekarang, lalu fallback ke histori)
  let matchedPattern = null;
  let maxMatched = 0;

  for (const pattern of AUTOMOTIVE_KNOWLEDGE) {
    let count = 0;
    for (const kw of pattern.keywords) {
      if (lower.includes(kw)) count += 2; // Bobot lebih tinggi untuk pesan saat ini
      else if (combinedContext.includes(kw)) count += 1; // Bobot histori
    }
    if (count > maxMatched) {
      maxMatched = count;
      matchedPattern = pattern;
    }
  }

  // 3. Cari stok suku cadang terkait di database Supabase jika ada pola yang cocok
  let availableItems = [];
  if (matchedPattern) {
    try {
      const searchRes = await searchProducts(matchedPattern.componentQuery);
      availableItems = searchRes.slice(0, 3);
    } catch (e) {
      console.warn("Diagnosa search error:", e?.message);
    }
  }

  // 4. RESPON KRITIS: Jika user bertanya langkah awal / belum sempat ke bengkel
  if (isAskingInitialSteps) {
    if (matchedPattern) {
      const p = matchedPattern;
      if (isJawa) {
        return {
          reply: `Siap mas/mbak! Nek pancen urung kober maring Dian Motor, iki **Langkah Paling Kritis & Pengecekan Mandiri** sing isa kok terapna dhisik nang ngumah:

🛠️ **Pertolongan Pertama Mandiri:**
${p.actionJawa}

⚠️ **Tingkat Resiko (Kritis):**
• Status: **${p.urgency}**
• Saran: Aja dipeksa numpak banter utawa beban abot sadurunge dipriksa tuntas.

Nek mengko ana wektu lodhang, nembe digawa mrene maring **Dian Motor** ya mas. Tak priksaake gratis fisike karo mekanik senior ben ora ana resiko nambah rusak. Ana sing arep ditakokna maning bab carane ngecek?`,
          category: p.category,
          urgency: p.urgency,
          suggestedItems: availableItems,
        };
      }

      return {
        reply: `Tentu Mas/Mbak! Jika memang belum sempat mampir ke bengkel Dian Motor, ini **Langkah Kritis & Pengecekan Awal** yang aman diterapkan sendiri di rumah:

🛠️ **Langkah Penanganan Awal Mandiri:**
${p.actionId}

⚠️ **Tingkat Urgensi & Keamanan:**
• Status: **${p.urgency}**
• Catatan: Jangan dipaksakan berkendara dengan kecepatan tinggi atau rute menanjak sebelum kondisi fisiknya stabil.

Nanti jika sudah ada waktu luang, silakan bawa motor ke **Dian Motor**. Pengecekan fisik awal kami gratis dan transparan tanpa ada paksaan ganti part. Ada langkah yang masih kurang jelas saat dicoba?`,
        category: p.category,
        urgency: p.urgency,
        suggestedItems: availableItems,
      };
    }

    // Jika belum tahu kendala spesifiknya (pertanyaan umum langkah awal)
    if (isJawa) {
      return {
        reply: `Siap mas/mbak, nek pancen urung kober maring Dian Motor, iki **4 Langkah Kritis Pengecekan Mandiri** sing wajib kok terapna dhisik nang ngumah ben motore ora mogok utawa tambah parah:

1. 🔍 **Priksa Kahanan & Volume Oli Mesin:**
   Cabut colokan (stik) oli mesin, usap nganggo tisu/lap resik, lebokna maning tanpa dipuntir. Priksa dhuwure oli — **AJA NGANTI ASAT / KERING!** Nek oline wernane wis ireng pekat utawa kaya kopi susu (kebobolan banyu), kudu enggal diganti.
2. ⚡ **Priksa Cop Busi & Pengapian:**
   Pethil cangklong (cop) busine, deleng bokat pecah, kendor, utawa teles kena banyu udan. Nek teles, disebul/dilap nganti garing sadurunge distarter maning.
3. 🔋 **Priksa Setrum Kontak & Aki:**
   Puter kunci kontak ON, terus jajal pethik klaksone. Nek unine banter cetho, berarti akine isih kuwat. Nek suwarane bindeng utawa lampu spidometer kedip lemes, berarti tekor setrum.
4. 🛑 **Priksa Tuas Rem & Angin Ban:**
   Priksa rem ora ambles/blong lan ban ora kempes gembos.

💡 **Ben diagnosane luwih presisi mas:**
Motormu tipe apa (Matic / Bebek / Sport) lan gejala sing paling krasa apa? (Contoh: brebet pas digas, angel diuripna, apa ana swara kemlotok nang jero mesin?)`,
        category: "umum",
        urgency: "Sedang",
        suggestedItems: [],
      };
    }

    return {
      reply: `Baik Mas/Mbak! Jika belum sempat ke bengkel Dian Motor, berikut **4 Langkah Pengecekan Kritis Awal** yang sangat aman dan wajib dilakukan sendiri di rumah:

1. 🔍 **Periksa Volume & Kondisi Oli Mesin:**
   Buka tutup stik oli, bersihkan dengan kain lap, celupkan kembali tanpa diputar. Pastikan oli berada di antara garis batas aman. **JANGAN PERNAH MENYALAKAN MESIN JIKA OLI SUDAH KERING/ASAT!** Jika warna oli berubah keruh seperti kopi susu, tandanya tercampur air.
2. ⚡ **Periksa Cop Busi & Percikan Pengapian:**
   Lepas cangklong (cop) busi, pastikan tidak getas/retak dan tidak kemasukan air atau lumpur. Bersihkan ujung elektroda busi jika berkerak arang hitam.
3. 🔋 **Periksa Indikator Aki & Kelistrikan:**
   Putar kunci kontak ON dan bunyikan klakson. Jika suara klakson nyaring dan lampu speedometer terang, aki masih bagus. Jika redup atau hanya bunyi 'cetek-cetek', aki drop/soak.
4. 🛑 **Periksa Fungsi Rem & Tekanan Ban:**
   Pastikan tuas rem tidak terasa ambles/spons dan ban tidak kempes.

💡 **Agar diagnosa kami lebih tepat sasaran:**
Boleh sebutkan tipe motormu (Matic / Bebek / Sport) dan gejala utama yang paling dirasakan saat ini? (Misal: mesin brebet pas digas pol, susah starter, atau suara kemlotok di bagian mana?)`,
      category: "umum",
      urgency: "Sedang",
      suggestedItems: [],
    };
  }

  // 5. Buat respon ramah dan luwes seperti mekanik sungguhan jika tidak ada kecocokan
  if (!matchedPattern || maxMatched === 0) {
    if (isJawa) {
      return {
        reply: `Wah mas/mbak, perihal keluhan iku kudu dipriksa luwih kritis dhisik kahanane ben ora salah diagnosa!

💡 **Pemeriksaan Awal sing Isa Kok Cek Dhewek:**
1. Priksa dhisik oline nganggo stik colokan — pastikna ora asat.
2. Deleng bokat ana lelehan lenga/bensin nang sela-sela mesin.
3. Cek unine motor: apa ana swara kletek-kletek utawa gredek pas digas?

Prinsip kerja nang **Dian Motor** santai lan transparan: yen isih isa disetel utawa dibeneri, ora bakal dikon ganti anyar!
Btw, motormu jinis apa mas (Matic/Bebek/Sport) lan kendalane krasa pas mesin adhem apa pas wis anget?`,
        category: "umum",
        urgency: "Rendah",
        suggestedItems: [],
      };
    }

    return {
      reply: `Mengenai kendala tersebut, mari kita analisa lebih kritis agar penanganannya tepat sasaran dan hemat biaya!

💡 **Langkah Pengecekan Cepat yang Bisa Dicek:**
1. Cek dipstick oli mesin — pastikan volume oli tidak kering atau hitam pekat.
2. Periksa apakah ada tetesan cairan oli atau bensin di area bawah mesin.
3. Dengarkan gejalanya: apakah timbul suara kletek-kletek saat akselerasi atau tarikan terasa berat?

Di bengkel **Dian Motor**, prinsip kami selalu mendahulukan perbaikan/penyetelan sebelum menyarankan ganti suku cadang baru.
Boleh ceritakan lebih detail, motormu tipe apa (Matic / Bebek / Sport) dan gejalanya muncul saat kondisi mesin dingin atau setelah jalan jauh?`,
      category: "umum",
      urgency: "Rendah",
      suggestedItems: [],
    };
  }

  // 6. Jika cocok dengan masalah spesifik:
  const p = matchedPattern;

  // Suku cadang format teks luwes
  let partText = "";
  if (availableItems.length > 0) {
    const readyItems = availableItems.filter((i) => i.stok > 0);
    if (readyItems.length > 0) {
      const first = readyItems[0];
      partText = isJawa
        ? `\n\nNang gudang Dian Motor, suku cadang penggantine wis **READY STOK** (contoh: **${first.nama}** nang Rak \`${first.rak || "-"}\` sekitar ${formatRupiah(first.hargaJual)}).`
        : `\n\nDi bengkel Dian Motor, suku cadang penggantinya juga sudah **READY STOK** (misal: **${first.nama}** di Rak \`${first.rak || "-"}\` kisaran ${formatRupiah(first.hargaJual)}).`;
    }
  }

  if (isJawa) {
    const reply = `Halo Mas/Mbak! Terkait kendala motormu, iki analisa kritis saka kepala mekanik Dian Motor:

🔍 **Analisa Masalah & Penyebab:**
${p.causeJawa}

💡 **Saran Solusi & Tindakan:**
${p.actionJawa}${partText}

⚠️ **Tingkat Kritis:** **${p.urgency}**

📍 **Saran Langkah:**
Nek pengin dipriksa luwih tuntas, gawa bae motormu mrene maring **Dian Motor**. Pemeriksaan awal santai lan transparan, lan yen isih isa dibeneri, ora bakal dikon ganti anyar! Ana gejala liyane sing krasa pas motor mlaku?`;

    return {
      reply,
      category: p.category,
      urgency: p.urgency,
      suggestedItems: availableItems,
    };
  }

  const reply = `Halo! Terkait kendala motormu, berikut analisa kritis dan solutif dari kepala mekanik kami:

🔍 **Analisa Masalah & Kemungkinan Penyebab:**
${p.causeId}

💡 **Rekomendasi Solusi & Tindakan:**
${p.actionId}${partText}

⚠️ **Tingkat Urgensi:** **${p.urgency}**

📍 **Langkah Selanjutnya:**
Silakan bawa motor ke bengkel **Dian Motor** untuk pemeriksaan fisik menyeluruh. Kami selalu mengedepankan solusi paling hemat (stel/bersihkan dulu) dan biaya selalu dikonfirmasi di awal sebelum pengerjaan dimulai! Ada gejala lain yang menyertai?`;

  return {
    reply,
    category: p.category,
    urgency: p.urgency,
    suggestedItems: availableItems,
  };
}
