import { GoogleGenerativeAI } from "@google/generative-ai";
import { diagnoseMotorComplaint } from "@/lib/ai/diagnostic-engine";

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

export async function POST(request) {
  try {
    const body = await request.json();
    const incoming = Array.isArray(body?.messages) ? body.messages : [];
    const lastUserMsg = incoming.filter((m) => m.role === "user").pop()?.content || body?.message || "";

    if (!lastUserMsg.trim()) {
      return Response.json({ error: "Pesan tidak boleh kosong." }, { status: 400 });
    }

    // 1. Dapatkan diagnosa berbasis pengetahuan otomotif & stok nyata Dian Motor
    const localDiagnosis = await diagnoseMotorComplaint(lastUserMsg);

    // 2. Jika ada API Key resmi Google AI Studio (AIzaSy...), manfaatkan Gemini untuk dialog yang lebih luwes
    const hasValidKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().startsWith("AIzaSy"));

    if (hasValidKey && genAI) {
      try {
        const systemPrompt = `Kamu adalah "AI Mekanik Dian Motor", asisten konsultasi dan diagnosa kerusakan sepeda motor resmi untuk bengkel "Dian Motor".
Karaktermu: Sangat ramah, bersahabat, solutif, dan menguasai istilah otomotif.
Bahasa: Kamu menguasai Bahasa Indonesia santai, Bahasa Jawa (Ngoko & Krama), dan dialek Jawa Ngapak. Tanggapi dengan bahasa yang senada dengan pelanggan agar terasa akrab dan dekat.

PANDUAN MENJAWAB:
1. Pahami keluhan motor pelanggan (contoh: rem tidak pakem / ora srek, mesin kemlotok, motor brebet, stang oleng, starter angel urip, knalpot nembak).
2. Jelaskan penyebab kerusakan teknis dengan bahasa awam yang mudah dipahami pelanggan.
3. Informasikan ketersediaan suku cadang dan solusi berdasarkan data internal berikut:
${localDiagnosis.reply}
4. Jika suku cadang ada, sebutkan ketersediaannya. Jika suku cadang habis, berikan solusi darurat sementara yang aman secara otomotif.
5. Selalu ajak pelanggan untuk berkonsultasi fisik langsung ke bengkel Dian Motor untuk pemeriksaan mekanik yang akurat dan aman.`;

        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-flash-latest",
          systemInstruction: systemPrompt,
        });

        const contents = incoming.slice(-6).map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: String(m.content || "") }],
        }));

        const result = await model.generateContent({ contents });
        const reply = result.response.text();
        if (reply && reply.trim()) {
          return Response.json({ reply: reply.trim(), diagnosis: localDiagnosis });
        }
      } catch (err) {
        console.warn("Gemini diagnosa fallback ke lokal:", err?.message);
      }
    }

    // 3. Fallback langsung ke engine lokal yang cepat (< 20ms) dan akurat
    return Response.json({
      reply: localDiagnosis.reply,
      category: localDiagnosis.category,
      urgency: localDiagnosis.urgency,
      suggestedItems: localDiagnosis.suggestedItems,
    });
  } catch (err) {
    console.error("API Diagnosa Error:", err);
    return Response.json(
      { error: "Terjadi gangguan saat memproses diagnosa keluhan." },
      { status: 500 }
    );
  }
}

