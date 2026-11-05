import { searchProducts, getAllProducts } from "./stock-data.js";

function formatRupiah(val) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(val) || 0);
}

// Kamus kata penanda bahasa Jawa / Ngapak
const JAWA_NGAPAK_WORDS = new Set([
  "ora", "ra", "mboten", "nek", "yen", "iki", "kui", "kue", "ning", "neng",
  "nang", "motorku", "kemlotok", "klotok", "angel", "urip", "mburi", "ngarep",
  "opo", "apa", "tenan", "pisan", "kepiye", "piye", "kepriben", "rika", "inyong",
  "nyong", "gembredek", "gredek", "nggeleyer", "mbagel", "selip", "biyung",
  "pan", "karo", "mlebu", "metu", "ambles", "nyokot", "bengkel", "suwun",
  "matur", "monggo", "ndang", "ndang2", "aja", "ojo", "siki", "mengko", "ngesuk",
  "esuk", "bengi", "awan", "rusak", "rusake", "kenang", "kenopo", "ngopo"
]);

export function detectLanguage(text) {
  const words = (text || "").toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/);
  let jawaCount = 0;
  for (const w of words) {
    if (JAWA_NGAPAK_WORDS.has(w)) jawaCount++;
  }
  return jawaCount >= 1 ? "jawa" : "id";
}

// Basis pengetahuan masalah mekanikal otomotif bengkel Dian Motor
const COMPLAINT_PATTERNS = [
  // 1. Rem & Pengereman
  {
    category: "rem",
    keywords: [
      "rem", "ngerem", "braking", "pakem", "srek", "nggeleyer", "blong", "ambles",
      "mbagel", "decit", "cit cit", "seret", "nyokot", "baret", "kampas"
    ],
    diagnosis: {
      title: "Masalah Sistem Pengereman (Rem Kurang Pakem / Bunyi / Ambles)",
      cause: "Biasanya disebabkan oleh kampas rem (discpad) yang sudah menipis/aus, permukaan piringan cakram kotor atau bergelombang, atau minyak rem yang sudah masuk angin/bocor.",
      causeJawa: "Kendalane biasane mergo kampas rem (discpad) wis entek/tipis, piringan cakrame reged kena bledug/oli, utawa lenga rem-e wis lawas/ana hawa mampet.",
      urgency: "Tinggi (Segera periksa demi keselamatan berkendara)",
      componentQuery: "discpad",
      temporaryAdvice: "Kurangi kecepatan berkendara, manfaatkan engine brake (turunkan gigi pada motor bebek/tahan gas stabil pada matic), dan jangan mengandalkan rem yang bermasalah sendirian.",
      temporaryAdviceJawa: "Ojo digawa ngebut dhisik mas/mbak, manfaatna pengereman mesin (engine brake), lan enggal dipriksa ben ora mbebayani nang dalan.",
    }
  },

  // 2. Mesin Brebet / Tarikan Ngempos / Tenaga Hilang
  {
    category: "brebet",
    keywords: [
      "brebet", "mberebet", "ngempos", "kempos", "tarikan berat", "tenaga hilang",
      "ora gelem mlayu", "tersendat", "ndut ndutan", "mati-matian", "gas kosong", "ketahan"
    ],
    diagnosis: {
      title: "Masalah Pengapian & Aliran Bahan Bakar (Mesin Brebet / Ngempos)",
      cause: "Kemungkinan besar elektroda busi sudah kotor/aus, filter udara tersumbat debu pekat, atau injektor/karburator kemasukan kotoran/endapan air sehingga semprotan bensin tidak stabil.",
      causeJawa: "Kendalane biasane ana nang busi sing wis ireng/kotor, saringan hawa (filter udara) buntet kena lebu, utawa spuyer karburator/injektore kemasukan rereged.",
      urgency: "Sedang (Bisa mogok mendadak di jalan)",
      componentQuery: "busi",
      temporaryAdvice: "Bisa coba bersihkan elektroda busi dengan sikat kawat dan periksa tutup cop busi apakah basah/longgar. Jangan paksa putaran gas penuh jika motor tersendat.",
      temporaryAdviceJawa: "Bisa dijajal diresiki dhisik busine nganggo sikat, cek cop busine bokat teles kena banyu. Ojo dipaksa ngegas pol pas brebet.",
    }
  },

  // 3. Suara Mesin Kasar / Kemlotok / Kletek-kletek
  {
    category: "suara_mesin",
    keywords: [
      "kemlotok", "klotok", "kletek", "kemricik", "gembredek", "kasar", "suara mesin",
      "mesin bunyi", "tek tek", "ngorok", "gemeritik"
    ],
    diagnosis: {
      title: "Gejala Mesin Kasar (Suara Kemlotok / Kletek-Kletek)",
      cause: "Paling sering akibat volume oli mesin sudah berkurang/kering sehingga pelumasan tidak maksimal. Penyebab lain bisa dari rantai keteng (kamrat) yang kendur atau setelan klep yang renggang.",
      causeJawa: "Sing paling kerep mergo oline wis asat/entek dadi pelumasane ora maksimal. Sakliyane kuwe, rantai keteng (kamrat) sing kendor utawa setelan klepe renggang ya marahi kemlotok.",
      urgency: "Sangat Tinggi (Risiko turun mesin jika dipaksakan)",
      componentQuery: "oli",
      temporaryAdvice: "Segera cek dipstick oli mesin! Jika kering, segera tambahkan oli sebelum menyalakan mesin lagi agar ruang bakar dan piston tidak baret/macet.",
      temporaryAdviceJawa: "Enggal dicek colokan (dipstick) oline mas! Nek wis asat, kudu ndang diisi oli anyar ben jerone mesin ora baret utawa macet.",
    }
  },

  // 4. Stang Goyang / Oleng / Kaki-kaki
  {
    category: "kaki_kaki",
    keywords: [
      "stang", "oleng", "goyang", "geol", "abot", "berat", "geol-geol",
      "laher", "bearing", "komstir", "shock", "skok", "jedug", "stabil"
    ],
    diagnosis: {
      title: "Kestabilan Kemudi & Kaki-kaki (Stang Oleng / Goyang)",
      cause: "Biasanya bantalan komstir stang sudah aus atau kendor, bearing/laher roda sudah oblak, tekanan angin ban kurang, atau shockbreaker bocor sehingga redaman tidak seimbang.",
      causeJawa: "Biasane laher (bearing) rodane wis oblak, komstir stange wis kemakan/kendor, utawa skok mburi/ngarepe wis mati oline.",
      urgency: "Sedang - Tinggi (Mempengaruhi kendali saat menikung)",
      componentQuery: "bearing",
      temporaryAdvice: "Periksa tekanan angin ban dan cek goyangan ban saat motor distandarkan dua. Hindari membawa beban berlebih sebelum diperbaiki.",
      temporaryAdviceJawa: "Priksa dhisik angin banne, jajal digoyang rodane pas standar loro. Ojo nggo boncengan kakehan momotan dhisik.",
    }
  },

  // 5. Kelistrikan / Starter Mati / Angel Urip
  {
    category: "kelistrikan",
    keywords: [
      "starter", "stater", "mati", "angel urip", "ora gelem nyala", "ora kuat",
      "aki", "accu", "tekor", "soak", "lampu redup", "klakson pelan", "cetek"
    ],
    diagnosis: {
      title: "Masalah Kelistrikan & Starter (Aki Lemah / Motor Susah Nyala)",
      cause: "Aki (accu) sudah tekor atau voltasenya drop di bawah 12V. Bisa juga akibat arang dinamo starter habis, bendik starter kotor, atau sekring kelistrikan longgar.",
      causeJawa: "Akine (accu) wis tekor utawa soak ora kuat ngangkat dinamo starter. Isa uga mergo bendik starter utawa sekring kelistrikane sing kendor/pedot.",
      urgency: "Sedang (Bisa mogok dan sulit dihidupkan)",
      componentQuery: "aki",
      temporaryAdvice: "Gunakan kick starter (engkol) secara manual untuk sementara waktu. Jika motor injeksi dan aki benar-benar habis, hindari pemaksaan agar sistem ECU tetap terlindungi.",
      temporaryAdviceJawa: "Nggo starter sikil (engkol) dhisik sedelo. Nek motore injeksi lan akine blas mati, luwih becik ndang diganti ben ECU-ne aman.",
    }
  },

  // 6. Transmisi Matic / CVT Gredek
  {
    category: "cvt",
    keywords: [
      "gredek", "gembredek", "getar", "gas awal", "cvt", "vbelt", "v-belt", "vanbelt",
      "roller", "roler", "kampas ganda", "tarikan berat matic"
    ],
    diagnosis: {
      title: "Masalah Transmisi CVT Motor Matic (Getar / Gredek)",
      cause: "Akumulasi debu dan sisa serbuk kampas ganda di dalam mangkok CVT, permukaan roller yang sudah peyang (tidak bulat sempurna), atau v-belt yang sudah mulai retak/kaku.",
      causeJawa: "Kotoran lebu numpuk nang mangkok kampas ganda CVT, rollere wis peyang ora bunder maning, utawa vanbelt-e wis mulai kaku lan retak-retak.",
      urgency: "Sedang (Mengurangi kenyamanan berkendara dan boros bensin)",
      componentQuery: "vbelt",
      temporaryAdvice: "Buka gas secara perlahan dan halus saat angkatan awal untuk mengurangi hentakan getaran. Servis rutin pembersihan CVT biasanya langsung menyembuhkan keluhan ini.",
      temporaryAdviceJawa: "Pas angkatan awal, bukaken gas alon-alon ojo langsung dientak. Servis reresik CVT biasane langsung mari kendalane.",
    }
  },

  // 7. Knalpot Nembak / Asap
  {
    category: "knalpot",
    keywords: [
      "knalpot", "nembak", "mbeledos", "meledak", "asap", "keluk", "ngebul",
      "keluk putih", "keluk ireng", "boros bensin"
    ],
    diagnosis: {
      title: "Sistem Pembuangan & Pembakaran (Knalpot Nembak / Asap Ngebul)",
      cause: "Knalpot nembak biasanya karena packing knalpot bocor, busi setengah mati, atau campuran bensin terlalu miskin saat lepas gas. Jika ngebul putih, kemungkinan oli mesin ikut terbakar lewat seal klep atau ring piston.",
      causeJawa: "Knalpot mbeledos biasane mergo paking knalpote bocor utawa busine setengah mati. Nek metu keluk putih, berarti oli mesine melu kobong mergo ring seher wis aus.",
      urgency: "Sedang - Tinggi",
      componentQuery: "paking",
      temporaryAdvice: "Pastikan baut leher knalpot kencang dan tidak ada kebocoran udara. Periksa apakah oli mesin berkurang drastis.",
      temporaryAdviceJawa: "Cek baut gulu knalpot bokat kendor. Cek oline kanthi rutin mergo bokat nyusut kemakan ning jero mesin.",
    }
  }
];

/**
 * Mendiagnosa keluhan motor pelanggan dan menghubungkannya dengan stok suku cadang Dian Motor
 */
export async function diagnoseMotorComplaint(userMessage) {
  const raw = (userMessage || "").trim();
  if (!raw) {
    return {
      reply: "Halo! Ceritakan keluhan motormu di sini, contoh: 'rem depan kurang pakem', 'motor brebet pas digas', atau 'mesin kemlotok pas anget'.",
      detectedIssue: null,
      suggestedItems: [],
    };
  }

  const lower = raw.toLowerCase();
  const lang = detectLanguage(raw);

  // 1. Cari kategori keluhan yang paling cocok
  let matchedPattern = null;
  let maxMatchedKeywords = 0;

  for (const pattern of COMPLAINT_PATTERNS) {
    let count = 0;
    for (const kw of pattern.keywords) {
      if (lower.includes(kw)) {
        count++;
      }
    }
    if (count > maxMatchedKeywords) {
      maxMatchedKeywords = count;
      matchedPattern = pattern;
    }
  }

  // 2. Jika tidak ada kecocokan spesifik, berikan konsultasi diagnostik umum
  if (!matchedPattern || maxMatchedKeywords === 0) {
    if (lang === "jawa") {
      return {
        reply: `Matur nuwun wis takon nang Dian Motor mas/mbak! 🛵\n\nKeluhan motormu: _"${raw}"_.\nKanggo keluhan iki, apike digawa langsung nang bengkel Dian Motor ben dicek fisik lan distel langsung karo mekanik senior. Pengecekan awal gratis, lan biayane transparan dhisik sadurunge digarap!\n\nAna gejala liyane sing dirasakna pas motor mlaku? Monggo diceritakna dhisik.`,
        detectedIssue: null,
        suggestedItems: [],
      };
    }

    return {
      reply: `Terima kasih sudah berkonsultasi dengan Bengkel Dian Motor! 🛵\n\nMengenai keluhan: _"${raw}"_.\nUntuk gejala tersebut, kami sarankan motor dibawa langsung ke workshop Dian Motor untuk pengecekan fisik menyeluruh oleh mekanik kami. Pengecekan awal tidak dipungut biaya dan kami selalu konfirmasi estimasi biaya serta ketersediaan sparepart sebelum pengerjaan dimulai.\n\nApakah ada gejala lain yang terasa (seperti bunyi aneh, tarikan berat, atau getaran)? Ceritakan lebih detail ya!`,
      detectedIssue: null,
      suggestedItems: [],
    };
  }

  // 3. Cari komponen terkait di database stok nyata Dian Motor
  const compQuery = matchedPattern.diagnosis.componentQuery;
  let availableItems = [];
  try {
    const searchRes = await searchProducts(compQuery);
    availableItems = searchRes.slice(0, 3);
  } catch (e) {
    console.warn("Diagnosa search error:", e?.message);
  }

  // 4. Susun Respon Cerdas
  const d = matchedPattern.diagnosis;
  const isJawa = lang === "jawa";

  let greeting = isJawa
    ? `Halo mas/mbak! Tak bantu analisa keluhan motormu ya:`
    : `Halo! Berikut hasil diagnosa awal untuk kendala motormu:`;

  let diagSection = isJawa
    ? `🔍 **Diagnosa Masalah:**\n${d.causeJawa}`
    : `🔍 **Diagnosa Masalah:**\n${d.cause}`;

  let adviceSection = isJawa
    ? `💡 **Saran Sementara:**\n${d.temporaryAdviceJawa}`
    : `💡 **Saran Sementara:**\n${d.temporaryAdvice}`;

  // Bagian Stok Suku Cadang Dian Motor
  let stockSection = "";
  if (availableItems.length > 0) {
    const readyItems = availableItems.filter((p) => p.stok > 0);
    if (readyItems.length > 0) {
      const itemsList = readyItems
        .map((p) => `• **${p.nama}** (Rak \`${p.rak || "-"}\`) — ${formatRupiah(p.hargaJual)}`)
        .join("\n");
      stockSection = isJawa
        ? `📦 **Ketersediaan Sparepart nang Dian Motor:**\nKabar apik, komponen penggantine saiki **READY STOK** nang bengkel:\n${itemsList}`
        : `📦 **Ketersediaan Suku Cadang di Dian Motor:**\nKabar baik, komponen suku cadang pengganti saat ini **READY STOK** di bengkel:\n${itemsList}`;
    } else {
      // Jika barang ada di katalog tapi stok 0 (habis)
      const sampleItem = availableItems[0];
      stockSection = isJawa
        ? `📦 **Informasi Sparepart:**\nKomponen ${sampleItem.nama} (Kira-kira ${formatRupiah(sampleItem.hargaJual)}) stok nang gudang saiki lagi entek. Nanging aja kuwatir, mekanik Dian Motor isa nulungi nyiapna sparepart sing cocok pas rika mampir nang bengkel.`
        : `📦 **Informasi Suku Cadang:**\nKomponen terkait seperti ${sampleItem.nama} (Kisaran ${formatRupiah(sampleItem.hargaJual)}) stoknya sedang menipis/habis di rak. Namun mekanik kami siap membantu mencarikan opsi suku cadang substitusi yang aman saat kamu berkunjung.`;
    }
  } else {
    stockSection = isJawa
      ? `📦 **Suku Cadang & Pengerjaan:**\nTim mekanik Dian Motor siap ngecek kahanan komponen motormu kanthi teliti.`
      : `📦 **Suku Cadang & Pengerjaan:**\nTim mekanik Dian Motor siap memeriksa kondisi fisik komponen dan memberikan rekomendasi part terbaik.`;
  }

  let ctaSection = isJawa
    ? `📍 **Solusi Paling Apik:**\nMonggo langsung digawa mampir nang bengkel **Dian Motor** ben dicek langsung karo mekanik senior. Pengecekan gratis lan pengerjaan transparan!`
    : `📍 **Langkah Selanjutnya:**\nYuk langsung mampir ke bengkel **Dian Motor** agar dicek fisik langsung oleh mekanik kami. Konsultasi awal ramah dan biaya selalu dikonfirmasi di awal!`;

  const fullReply = [greeting, diagSection, adviceSection, stockSection, ctaSection].join("\n\n");

  return {
    reply: fullReply,
    category: matchedPattern.category,
    urgency: d.urgency,
    suggestedItems: availableItems,
  };
}

