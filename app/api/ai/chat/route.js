import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { DEMO_SESSION_COOKIE, decodeDemoSession, isOwner } from "@/lib/demo-auth";
import { tools, runTool } from "@/lib/ai/tools";
import { answerLocally } from "@/lib/ai/local-answer";
import { extractStockIntent, normalizeSlang } from "@/lib/ai/slang-dictionary";
import { checkPromptSafety } from "@/lib/ai/security-guardrails";

export const runtime = "nodejs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";

function getSystemPrompt(userRole = "kasir") {
  const isOwnerUser = isOwner(userRole);

  const roleInstruction = isOwnerUser
    ? `Peran Pengguna: OWNER (PEMILIK BENGKEL).
Pengguna memiliki otoritas tertinggi atas Dian Motor. Kamu diizinkan memberikan ringkasan stok, posisi rak, harga jual, dan analisis ketersediaan inventori bengkel.`
    : `Peran Pengguna: KASIR (OPERASIONAL).
ATURAN KEAMANAN DAN PRIVASI OWNER (SANGAT KETAT):
1. Pengguna saat ini adalah staf KASIR.
2. DILARANG KERAS memberikan informasi mengenai:
   - HARGA BELI / HARGA MODAL (HPP / kulakan ke distributor).
   - MARGIN KEUNTUNGAN, PERSENTASE LABA, ATAU PROFIT TOKO.
   - TOTAL OMSET KESELURUHAN TOKO ATAU LAPORAN KEUANGAN PEMILIK.
   - KREDENSIAL, PASSWORD, MAUPUN TOKEN SISTEM.
3. Jika kasir menanyakan harga modal, keuntungan, atau omset toko, TOLAK DENGAN RAMAH DAN TEGAS:
   "Maaf, informasi mengenai harga modal/keuntungan/laporan keuangan toko merupakan kebijakan rahasia khusus Owner Dian Motor dan tidak dapat diakses melalui terminal kasir."
4. Kasir HANYA berhak memantau: Ketersediaan Sisa Stok, Posisi RAK, Status Barang (Aman/Menipis/Habis), dan HARGA JUAL resmi kepada pelanggan.`;

  return `Kamu adalah asisten pintar untuk bengkel motor "Dian Motor".
Tugasmu membantu mengecek ketersediaan suku cadang, posisi rak penyimpanan, dan harga jual barang bengkel.

${roleInstruction}

PEMAHAMAN BAHASA GEN Z & SINGKATAN CHATTING KASIR:
- Pengguna sering mengetik dengan sangat singkat, menggunakan bahasa gaul, atau singkatan chatting Gen Z. Kamu WAJIB memahaminya:
  - "oli?" -> maksudnya ingin cek ketersediaan, sisa stok, lokasi rak, dan harga oli.
  - "oli mn?" / "oli dmn?" -> maksudnya menanyakan posisi rak oli dan sisa stoknya.
  - "stok" / "stok sisa brp?" / "bpr" -> maksudnya ingin tahu sisa stok atau ringkasan stok bengkel.
  - "busi ad ga?" / "ad gk" -> maksudnya menanyakan apakah busi masih ada/tersedia.
  - Singkatan seperti 'bpr' (berapa), 'kpn' (kapan), 'gpp' (tidak apa-apa), 'brg' (barang), 'hbs' (habis), dll. harus dipahami dengan lancar.

Aturan Respon & Format:
1. Selalu gunakan tool 'cari_stok' atau 'daftar_stok_kritis' untuk mengambil data stok nyata.
2. Saat memanggil tool 'cari_stok', gunakan kata kunci nama barangnya saja (contoh: 'oli', 'busi', 'relay').
3. Jika user menanyakan stok/sisa barang tertentu (contoh: "oli?", "sisa aki berapa", "stok oli sisa berapa"):
   - **WAJIB** berikan kalimat ringkasan langsung di baris pertama (contoh: "Total stok **AKI** tersisa **XX pcs** dari Y tipe barang terdaftar:").
   - Lalu tampilkan DAFTAR RINCIANNYA dengan pemisah enter yang jelas agar gampang dibaca:

   Format per barang:
   1. **[NAMA BARANG]**
      📦 Stok: **[stok] pcs** (Min: [stok_minimum]) | Status: **[Aman / ⚡ MENIPIS / ⚠️ HABIS]**
      📍 Rak: \`[RAK]\` | Kode: \`[KODE BRG]\` | 💰 Rp [HARGA]

4. Jika barang tidak ditemukan, sampaikan secara sopan bahwa barang tersebut tidak ada di database stok.`;
}

function formatToolsForGemini(rawTools) {
  if (!rawTools || !Array.isArray(rawTools)) return [];
  return [{
    functionDeclarations: rawTools.map((t) => ({
      name: t.name,
      description: t.description || "",
      parameters: t.input_schema || t.parameters || { type: "OBJECT", properties: {} },
    }))
  }];
}

function formatStockList(data, originalQuery = "") {
  if (!Array.isArray(data) || data.length === 0) {
    return "Barang yang kamu cari tidak ditemukan di database stok Dian Motor.";
  }

  const intent = extractStockIntent(originalQuery);
  const totalStok = data.reduce((acc, item) => acc + (Number(item.stok) || 0), 0);
  const keywordDisplay = intent.keyword ? `**${intent.keyword.toUpperCase()}** ` : "";
  const locationNotice = intent.isLocationQuery ? "📍 *Berikut posisi rak dan ketersediaan barang:*\n\n" : "";

  const headerText = `${locationNotice}Total stok ${keywordDisplay}tersisa **${totalStok} pcs** (terdiri dari ${data.length} jenis terdaftar):\n\n`;

  const itemsFormatted = data.slice(0, 10).map((item, index) => {
    const nama = item["NAMA BARANG"] || item.nama_barang || item.nama || "Barang";
    const rak = item["RAK"] || item.rak || "-";
    const kode = item["KODE BRG"] || item.kode_brg || "-";
    const stok = item.stok ?? 0;
    const min = item.stok_minimum ?? 5;
    const hargaVal = item["HARGA"] || item.harga || item.harga_jual;
    const harga = hargaVal ? `Rp ${Number(hargaVal).toLocaleString("id-ID")}` : null;

    let statusText = "Aman";
    if (stok === 0) statusText = "⚠️ HABIS";
    else if (stok <= min) statusText = "⚡ MENIPIS";

    return `${index + 1}. **${nama}**\n   📦 Stok: **${stok} pcs** (Min: ${min}) | Status: **${statusText}**\n   📍 Rak: \`${rak}\` | Kode: \`${kode}\`${harga ? ` | 💰 ${harga}` : ""}`;
  }).join("\n\n");

  const totalCount = data.length > 10 ? `\n\n*(Menampilkan 10 dari ${data.length} barang ditemukan)*` : "";

  return headerText + itemsFormatted + totalCount;
}

async function handleLocalFallback(userMessage, userRole = "kasir") {
  try {
    const intent = extractStockIntent(userMessage);
    let data;

    if (intent.isCriticalQuery && !intent.keyword) {
      data = await runTool("daftar_stok_kritis", {});
    } else {
      data = await runTool("cari_stok", { keyword: intent.keyword || userMessage });
    }

    if (!data || (Array.isArray(data) && data.length === 0)) {
      return await answerLocally(userMessage, userRole);
    }

    if (Array.isArray(data)) {
      return formatStockList(data, userMessage);
    }

    return typeof data === "string" ? data : JSON.stringify(data);
  } catch (err) {
    try {
      return await answerLocally(userMessage, userRole);
    } catch {
      return "Terjadi kesalahan saat membaca database stok Dian Motor.";
    }
  }
}

export async function POST(request) {
  // 1. Identifikasi User & Role
  let userRole = "kasir";
  let isAuthenticated = false;

  try {
    const supabase = await createClient();
    if (supabase) {
      const { data: auth } = await supabase.auth.getUser();
      if (auth?.user) {
        isAuthenticated = true;
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", auth.user.id)
          .single();
        if (profile?.role) {
          userRole = profile.role;
        }
      }
    }
  } catch (e) {}

  if (!isAuthenticated) {
    try {
      const store = await cookies();
      const demoCookie = store.get(DEMO_SESSION_COOKIE)?.value;
      const demoUser = decodeDemoSession(demoCookie);
      if (demoUser) {
        isAuthenticated = true;
        userRole = demoUser.role || "kasir";
      }
    } catch (e) {}
  }

  // 2. Validasi Input
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Format request salah." }, { status: 400 });
  }

  if (body?.role && !isAuthenticated) {
    userRole = body.role;
  }

  const incoming = Array.isArray(body?.messages) ? body.messages : [];
  const lastUserMsg = incoming.filter((m) => m.role === "user").pop()?.content || "";

  if (!lastUserMsg.trim()) {
    return Response.json({ error: "Pesan kosong." }, { status: 400 });
  }

  // 3. Guardrail Keamanan Owner untuk Akun Kasir
  const safety = checkPromptSafety(lastUserMsg, userRole);
  if (!safety.allowed) {
    return Response.json({ reply: safety.warningReply });
  }

  const systemPrompt = getSystemPrompt(userRole);
  const normalizedQuery = normalizeSlang(lastUserMsg);

  // 4. Eksekusi AI: Prioritaskan Gemini jika GEMINI_API_KEY tersedia
  if (process.env.GEMINI_API_KEY) {
    try {
      const geminiTools = formatToolsForGemini(tools);
      const contents = incoming.slice(-10).map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: String(m.content || "") }],
      }));

      // Tambahkan info normalisasi jika mengandung slang
      if (normalizedQuery !== lastUserMsg.toLowerCase()) {
        const lastContent = contents[contents.length - 1];
        if (lastContent && lastContent.role === "user") {
          lastContent.parts[0].text += ` (Konteks singkatan kasir: "${normalizedQuery}")`;
        }
      }

      const modelsToTry = [
        process.env.GEMINI_MODEL,
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
      ].filter(Boolean);

      let responseText = null;

      for (const modelName of modelsToTry) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: systemPrompt,
            tools: geminiTools.length > 0 ? geminiTools : undefined,
          });

          const result = await model.generateContent({ contents });
          const response = result.response;
          const functionCalls = response.functionCalls();

          if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];
            let output = await runTool(call.name, call.args);

            if (!output || (Array.isArray(output) && output.length === 0)) {
              output = { status: "not_found", message: "Barang tidak ditemukan di database stok." };
            }

            contents.push({ role: "model", parts: response.candidates[0].content.parts });
            contents.push({
              role: "user",
              parts: [{ functionResponse: { name: call.name, response: { result: output } } }],
            });

            const finalResult = await model.generateContent({ contents });
            responseText = finalResult.response.text();
          } else {
            responseText = response.text();
          }

          if (responseText) break;
        } catch (err) {
          console.warn(`Model ${modelName} gagal: ${err.message}`);
        }
      }

      if (!responseText) {
        responseText = await handleLocalFallback(lastUserMsg, userRole);
      }

      return Response.json({ reply: responseText });
    } catch (globalError) {
      console.warn("Global Gemini error, fallback ke lokal:", globalError?.message);
      const fallbackReply = await handleLocalFallback(lastUserMsg, userRole);
      return Response.json({ reply: fallbackReply });
    }
  }

  // 5. Jika ANTHROPIC_API_KEY tersedia
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const convo = incoming
        .slice(-20)
        .filter(
          (m) =>
            (m.role === "user" || m.role === "assistant") &&
            typeof m.content === "string" &&
            m.content.trim()
        )
        .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

      for (let i = 0; i < 5; i++) {
        const res = await client.messages.create({
          model: ANTHROPIC_MODEL,
          max_tokens: 1024,
          system: systemPrompt,
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
      console.error("Anthropic error, fallback ke lokal:", e);
      const fallback = await handleLocalFallback(lastUserMsg, userRole);
      return Response.json({ reply: fallback });
    }
  }

  // 6. Jika tidak ada API key LLM, jawab secara lokal dari database
  try {
    const reply = await handleLocalFallback(lastUserMsg, userRole);
    return Response.json({ reply });
  } catch (e) {
    console.error("AI lokal error:", e);
    return Response.json({ error: "Gagal membaca data stok. Coba lagi." }, { status: 500 });
  }
}
