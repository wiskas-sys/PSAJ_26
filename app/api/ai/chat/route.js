import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { tools, runTool } from "@/lib/ai/tools";

export const runtime = "nodejs";

const client = new Anthropic(); // otomatis membaca ANTHROPIC_API_KEY
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";

const SYSTEM_PROMPT = `Kamu adalah asisten stok untuk bengkel motor "Dian Motor".
Tugasmu membantu admin memantau stok suku cadang dan barang bengkel.

Aturan:
- Selalu gunakan tool untuk mengambil data stok. Jangan pernah menebak atau mengarang angka.
- Jawab dalam Bahasa Indonesia yang singkat, jelas, dan ramah.
- Tulis harga dalam format Rupiah (contoh: Rp 58.000).
- Untuk saran restock, sebutkan barang, stok saat ini, minimum, dan kekurangannya.
- Saat ini kamu hanya bisa MEMBACA data. Kalau diminta mengubah/mencatat stok, jelaskan bahwa fitur itu belum aktif dan arahkan ke menu Barang Masuk / Barang Keluar.
- Kalau pertanyaan di luar urusan stok bengkel, tolak dengan sopan.`;

export async function POST(request) {
  // 1. Hanya user yang sudah login yang boleh memakai AI (mencegah biaya API bocor)
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) {
    return Response.json({ error: "Belum login." }, { status: 401 });
  }

  // 2. Validasi input
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Format request salah." }, { status: 400 });
  }

  const incoming = Array.isArray(body?.messages) ? body.messages : [];
  const convo = incoming
    .slice(-20)
    .filter(
      (m) =>
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim()
    )
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

  if (convo.length === 0 || convo[convo.length - 1].role !== "user") {
    return Response.json({ error: "Pesan kosong." }, { status: 400 });
  }

  // 3. Loop tool-use (maksimal 5 putaran)
  try {
    for (let i = 0; i < 5; i++) {
      const res = await client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools,
        messages: convo,
      });

      if (res.stop_reason !== "tool_use") {
        const reply = res.content
          .filter((b) => b.type === "text")
          .map((b) => b.text)
          .join("\n")
          .trim();
        return Response.json({ reply: reply || "Maaf, aku tidak punya jawaban." });
      }

      convo.push({ role: "assistant", content: res.content });

      const results = [];
      for (const block of res.content) {
        if (block.type !== "tool_use") continue;
        let output;
        try {
          output = await runTool(block.name, block.input);
        } catch (e) {
          output = { error: e.message };
        }
        results.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(output),
        });
      }
      convo.push({ role: "user", content: results });
    }

    return Response.json({ reply: "Maaf, permintaanmu terlalu rumit. Coba dipersingkat." });
  } catch (e) {
    console.error("AI error:", e);
    return Response.json({ error: "AI sedang bermasalah, coba lagi." }, { status: 500 });
  }
}