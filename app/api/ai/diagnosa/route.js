import { GoogleGenerativeAI } from "@google/generative-ai";
import { diagnoseMotorComplaint, detectLanguage } from "@/lib/ai/diagnostic-engine";
import { searchProducts } from "@/lib/ai/stock-data";

const CANDIDATE_MODELS = [
  process.env.GEMINI_DIAGNOSA_MODEL,
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
].filter(Boolean);

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

    // 1. Ekstrak data stok nyata bengkel Dian Motor untuk membantu jawaban AI (Max 500ms timeout)
    let stockContext = "";
    try {
      const words = lastUserMsg
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter((w) => w.length >= 3 && !["apa", "yang", "ini", "itu", "kira", "kue", "bae", "bakal"].includes(w));
      
      const searchKey = words.slice(0, 2).join(" ") || "oli";
      const stockSearchPromise = searchProducts(searchKey);
      const stockTimeout = new Promise((resolve) => setTimeout(() => resolve([]), 500));
      const products = await Promise.race([stockSearchPromise, stockTimeout]);

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

    // 2. Coba gunakan Gemini AI jika API key tersedia dengan strict timeout 2.5 detik
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    if (apiKey && apiKey.length > 10) {
      const genAI = new GoogleGenerativeAI(apiKey);

      const systemPrompt = `Kamu adalah "Mas Dian", kepala mekanik bengkel "Dian Motor" yang berpengalaman lebih dari 15 tahun, sangat ramah, santai, kritis, dan menguasai segala seluk-beluk motor bebek, matic, dan sport.

GAYA KOMUNIKASI & KARAKTER:
1. Bersikaplah seperti kepala mekanik bengkel sungguhan yang asyik diajak ngobrol langsung di garasi: LUWES, AKRAB, EMPATIK, KRITIS, dan SOLUTIF. 
2. JANGAN PERNAH memakai gaya bahasa kaku seperti robot atau template formal. Langsung jawab inti pertanyaannya dengan luwes dan taktis!
3. SESUAIKAN BAHASA DENGAN PELANGGAN:
   - Jika pelanggan memakai Bahasa Jawa atau dialek Ngapak (contoh: 'kue', 'bae', 'ora', 'kepriben', 'piye', 'standart 2 ne', 'beneri bae', 'teyengen', 'kemlotok', 'brebet', 'nyong', 'urung sempet'), TANGGAPI DENGAN BAHASA JAWA/NGAPAK yang luwes, natural, dan hangat!
   - Jika pelanggan memakai Bahasa Indonesia santai, tanggapi dengan bahasa Indonesia santai khas obrolan bengkel motor.

PENDEKATAN DIAGNOSA KRITIS & SOLUTIF:
1. JANGAN PERNAH langsung menyuruh ke bengkel tanpa menjawab pertanyaan inti!
2. Jika pelanggan bertanya "langkah awal apa yang bisa saya terapkan sendiri di rumah karena belum sempat ke bengkel", WAJIB berikan panduan pengecekan mandiri awal (DIY checklist) yang aman dilakukan sendiri dengan obeng/lap/kunci busi (contoh: cek stik oli, cop busi, tegangan aki, setelan angin/filter).
3. Klasifikasikan tingkat resiko secara kritis:
   - MANA YANG BERBAHAYA JANGAN DIPAKSAKAN JALAN (contoh: oli kering, rem blong, komstir mengunci).
   - MANA YANG AMAN DIJALANKAN PELAN SEMENTARA WAKTU (contoh: standar seret, rantai kendor, lampu sein putus).
4. MENDAHULUKAN SOLUSI HEMAT:
   - Selalu sarankan pembersihan/penyetelan/pelumasan terlebih dahulu sebelum mengganti suku cadang baru agar menghemat biaya pelanggan.
5. DATA SUKU CADANG DIAN MOTOR SAAT INI:
${stockContext || "Data stok dapat dicek langsung saat pemeriksaan fisik di bengkel."}
6. AJAKAN KE BENGKEL SECARA NATURAL:
   Setelah memberikan analisa kritis dan solusi awal, sampaikan bahwa jika pelanggan ada waktu luang, mereka bisa mampir ke bengkel Dian Motor untuk pengecekan fisik lebih tuntas dengan estimasi biaya transparan di muka.`;

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

          // Timeout 2500ms agar respon selalu super cepat
          const generatePromise = model.generateContent({
            contents: validContents,
          });
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Gemini timeout (>2.5s)")), 2500)
          );

          const result = await Promise.race([generatePromise, timeoutPromise]);
          const reply = result?.response?.text();
          if (reply && reply.trim()) {
            return Response.json({
              reply: reply.trim(),
              source: "gemini",
              model: modelName,
            });
          }
        } catch (err) {
          console.warn(`Model ${modelName} error/timeout:`, err?.message?.slice(0, 80));
          break; // Segera lanjut ke engine lokal tanpa buang waktu berputar di model lain
        }
      }
    }

    // 3. Fallback instan & akurat ke engine lokal jika Gemini lambat atau offline (< 20ms)
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
