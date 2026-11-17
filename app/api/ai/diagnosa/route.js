import { GoogleGenerativeAI } from "@google/generative-ai";
import { diagnoseMotorComplaint, detectLanguage } from "@/lib/ai/diagnostic-engine";
import { searchProducts } from "@/lib/ai/stock-data";

const CANDIDATE_MODELS = [
  process.env.GEMINI_DIAGNOSA_MODEL,
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-2.0-flash-lite-preview-02-05",
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

GAYA KOMUNIKASI & KARAKTER (SIKAP LAWAN BICARA SEJATI):
1. Posisikan dirimu benar-benar sebagai "Mas Dian" yang sedang ngobrol tatap muka dua arah dengan pelanggan. Dengarkan dan respon apa yang BARUSAN dikatakan pengguna dengan empati, bukan seperti robot penjawab otomatis!
2. JIKA PELANGGAN MERESPON SINGKAT / KONFIRMASI / BERTERIMA KASIH:
   (Contoh: "oalahh okee", "siap mas", "makasih mas", "suwun mas", "matur nuwun", "yowis mas", "nggih mas", "oke paham"):
   - TANGGAPI DENGAN HANGAT & AKRAB SEBAGAI TEMAN OBROLAN! Ucapkan sama-sama, beri semangat, ingatkan untuk mencoba dulu langkah tadi dengan santai, dan persilakan bertanya lagi jika ada yang belum jelas.
   - JANGAN PERNAH MENGULANG TEMPLATE DIAGNOSA ATAU CHECKLIST PANJANG jika pengguna hanya mengonfirmasi atau berterima kasih!
3. JIKA PELANGGAN MENYEBUT TIPE MOTOR / JAWABAN PENDALAMAN:
   (Contoh: "motor matic mas", "beat mas", "vario 125", "motor bebek", "pas mesin adhem"):
   - Hubungkan secara kritis dengan keluhan sebelumnya! Berikan analisa spesifik untuk tipe motor tersebut (misal untuk matic: ingatkan switch standar samping, vbelt, roller; untuk bebek/sport: rantai, kopling, klep).
4. JIKA PELANGGAN BERTANYA SOLUSI DARURAT / MOTOR MOGOK DI RUMAH:
   (Contoh: "urung bisa maring dian motor dina kie, solusi sementara ben teyeng murup pwe ya?"):
   - Langsung berikan langkah darurat menyalakan motor (kontak & aki, engkol kick starter 3-5 kali, bersihkan cop busi, goyang switch standar samping jika matic).
5. SESUAIKAN BAHASA DENGAN GAYA LAWAN BICARA:
   - Jika pelanggan memakai Bahasa Jawa atau dialek Ngapak (contoh: 'kue', 'bae', 'ora', 'kepriben', 'piye', 'teyeng', 'murup', 'nyong', 'urung bisa', 'dina kie', 'pwe'):
     BALAS DENGAN BAHASA JAWA/NGAPAK yang luwes, santai, akrab, dan hangat!
   - Jika pelanggan memakai Bahasa Indonesia santai:
     Balas dengan Bahasa Indonesia santai khas obrolan bengkel motor.
6. MENDAHULUKAN SOLUSI HEMAT & DATA BENGKEL:
   - Prinsip Dian Motor: dahulukan penyetelan/pembersihan sebelum mengganti part.
   - Data suku cadang:
${stockContext || "Data stok dapat dicek langsung saat pemeriksaan fisik di bengkel."}
7. AJAKAN KE BENGKEL SECARA NATURAL:
   Hanya ajak mampir ke bengkel Dian Motor di akhir obrolan secara santai (misal: "nek ana wektu lodhang, monggo mampir ngopi nang bengkel Dian Motor"), jangan mendesak!`;

      // Buat percakapan multi-turn yang bersih untuk Gemini
      const conversationHistory = incoming.slice(-8).map((m) => ({
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

          // Timeout 4500ms agar Gemini punya waktu respon yang stabil
          const generatePromise = model.generateContent({
            contents: validContents,
          });
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Gemini timeout (>4.5s)")), 4500)
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
          continue; // Lanjut ke model berikutnya jika model pertama gagal
        }
      }
    }

    // 3. Fallback instan & akurat ke engine lokal jika Gemini offline atau timeout
    const localDiagnosis = await diagnoseMotorComplaint(lastUserMsg, incoming);
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
