import { GoogleGenerativeAI } from "@google/generative-ai";
import { diagnoseMotorComplaint, detectLanguage } from "@/lib/ai/diagnostic-engine";
import { searchProducts } from "@/lib/ai/stock-data";

const CANDIDATE_MODELS = [
  "gemini-3.5-flash",
  "gemini-flash-latest",
  "gemini-2.5-flash-lite",
  "gemini-3.8-flash",
];

export async function POST(request) {
  try {
    const body = await request.json();
    const incoming = Array.isArray(body?.messages) ? body.messages : [];
    const lastUserMsg =
      incoming.filter((m) => m.role === "user").pop()?.content ||
      body?.message ||
      "";

    if (!lastUserMsg.trim()) {
      return Response.json({ error: "Pesan tidak boleh kosong." }, { status: 400 });
    }

    // 1. Ekstrak data stok nyata bengkel Dian Motor untuk membantu jawaban AI
    let stockContext = "";
    try {
      // Ambil kata kunci sederhana dari pesan terakhir
      const words = lastUserMsg
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter((w) => w.length >= 3 && !["apa", "yang", "ini", "itu", "kira", "kue", "bae", "bakal"].includes(w));
      
      const searchKey = words.slice(0, 2).join(" ") || "oli";
      const products = await searchProducts(searchKey);
      if (products && products.length > 0) {
        const top = products.slice(0, 3);
        stockContext = top
          .map(
            (p) =>
              `- ${p.nama}: Stok ${p.stok > 0 ? `${p.stok} pcs (READY)` : "HABIS (bisa dicarikan)"}, Rak ${p.rak || "-"}, Harga Rp ${Number(p.hargaJual).toLocaleString("id-ID")}`
          )
          .join("\n");
      }
    } catch (e) {
      console.warn("Stock search error in API diagnosa:", e?.message);
    }

    // 2. Coba gunakan Gemini AI jika API key tersedia
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    if (apiKey && apiKey.length > 10) {
      const genAI = new GoogleGenerativeAI(apiKey);

      const systemPrompt = `Kamu adalah "Mas Dian", kepala mekanik bengkel "Dian Motor" yang berpengalaman lebih dari 15 tahun, sangat ramah, santai, dan menguasai segala seluk-beluk motor bebek, matic, dan sport.

GAYA KOMUNIKASI & KARAKTER:
1. Bersikaplah seperti kepala mekanik bengkel sungguhan yang asyik diajak ngobrol langsung di garasi: LUWES, AKRAB, EMPATIK, dan KOMUNIKATIF. 
2. JANGAN PERNAH memakai gaya bahasa kaku seperti robot atau template formal (misal JANGAN mengulang ucapan 'Terima kasih sudah bertanya di Dian Motor... Keluhan motormu: ...' di setiap chat). Langsung jawab inti pertanyaannya dengan luwes!
3. SESUAIKAN BAHASA DENGAN PELANGGAN:
   - Jika pelanggan memakai Bahasa Jawa atau dialek Ngapak (contoh: 'kue', 'bae', 'ora', 'kepriben', 'piye', 'standart 2 ne', 'beneri bae', 'teyengen', 'kemlotok', 'brebet'), TANGGAPI DENGAN BAHASA JAWA/NGAPAK yang luwes, natural, dan hangat!
   - Jika pelanggan memakai Bahasa Indonesia santai, tanggapi dengan bahasa Indonesia santai khas obrolan bengkel motor.

PENGETAHUAN TEKNIS & PRINSIP KERJA:
1. Pahami komponen motor secara presisi (standar samping/tengah, rem cakram/tromol, CVT matic, kelistrikan/aki/starter, rantai, shock, karbu/injeksi, suara mesin).
2. MENDAHULUKAN SOLUSI HEMAT:
   - Contoh: jika ditanya apakah standar 2 harus ganti atau dibetulkan saja, jelaskan bahwa seringkali cuma as-nya yang berkarat/seret kena kotoran, jadi cukup dibongkar, diamplas, dan dilumasi gemuk (grease). Baru diganti kalau dudukan rangkanya sudah jebol atau pipanya keropos/patah.
   - Tidak memaksa pelanggan mengganti sparepart jika masih bisa disetel atau diservis dengan aman.
3. DATA SUKU CADANG DIAN MOTOR SAAT INI:
${stockContext || "Data stok dapat dicek langsung saat pemeriksaan fisik di bengkel."}
4. AJAKAN KE BENGKEL:
   Ajak pelanggan mampir ke bengkel Dian Motor untuk pemeriksaan fisik langsung yang akurat. Sebutkan bahwa pengecekan awal santai dan estimasi biaya selalu transparan di muka sebelum pengerjaan.`;

      // Buat percakapan multi-turn yang bersih untuk Gemini
      const conversationHistory = incoming.slice(-6).map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: String(m.content || "") }],
      }));

      // Pastikan urutan percakapan valid (mulai dari user)
      const validContents = [];
      for (const item of conversationHistory) {
        if (validContents.length === 0 && item.role !== "user") {
          continue;
        }
        validContents.push(item);
      }
      if (validContents.length === 0) {
        validContents.push({ role: "user", parts: [{ text: lastUserMsg }] });
      }

      for (const modelName of CANDIDATE_MODELS) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: systemPrompt,
          });

          const result = await model.generateContent({
            contents: validContents,
          });

          const reply = result?.response?.text();
          if (reply && reply.trim()) {
            return Response.json({
              reply: reply.trim(),
              source: "gemini",
              model: modelName,
            });
          }
        } catch (err) {
          console.warn(`Model ${modelName} error:`, err?.message?.slice(0, 80));
        }
      }
    }

    // 3. Fallback cerdas ke engine lokal jika Gemini sedang sibuk atau offline
    const localDiagnosis = await diagnoseMotorComplaint(lastUserMsg);
    return Response.json({
      reply: localDiagnosis.reply,
      category: localDiagnosis.category,
      urgency: localDiagnosis.urgency,
      suggestedItems: localDiagnosis.suggestedItems,
      source: "local",
    });
  } catch (err) {
    console.error("API Diagnosa Route Error:", err);
    return Response.json(
      { error: "Terjadi gangguan saat memproses konsultasi motor." },
      { status: 500 }
    );
  }
}
