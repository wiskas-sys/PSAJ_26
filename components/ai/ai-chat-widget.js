"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquareText, Boxes, TrendingUp, X, Send, Loader2, RotateCcw } from "lucide-react";

const KASIR_PROMPTS = [
  "stok mana yg masih ada?",
  "brg apa yg abis?",
  "stok menipis apa aja?",
  "rekomendasi kulakan apa?",
  "rekap stok",
  "oli ditaruh di rak mana?",
  "baut mur ada ngga?",
  "busi ad ga?",
  "stok paling banyak apa?",
  "kampas rem ana ra?",
  "regane oli mpx piro?",
];

const OWNER_PROMPTS = [
  "rekap stok bulan ini",
  "rekap keuangan bulan ini",
  "omzet hari ini berapa?",
  "analisa performa bengkel dong",
  "estimasi modal kulakan prioritas",
  "nilai aset gudang sekarang",
  "barang apa yang habis?",
  "stok menipis apa aja?",
  "oli ditaruh di rak mana?",
];

function renderFormattedLine(line, lineIdx) {
  const tokens = String(line).split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
  return (
    <span key={lineIdx}>
      {tokens.map((tok, i) => {
        if (tok.startsWith("**") && tok.endsWith("**") && tok.length > 4) {
          return (
            <strong key={i} className="font-semibold">
              {tok.slice(2, -2)}
            </strong>
          );
        }
        if (tok.startsWith("`") && tok.endsWith("`") && tok.length > 2) {
          return (
            <code
              key={i}
              className="rounded bg-black/10 px-1 py-0.5 font-mono text-[11px] dark:bg-white/15"
            >
              {tok.slice(1, -1)}
            </code>
          );
        }
        if (tok.startsWith("*") && tok.endsWith("*") && tok.length > 2) {
          return (
            <em key={i} className="italic opacity-90">
              {tok.slice(1, -1)}
            </em>
          );
        }
        return <span key={i}>{tok}</span>;
      })}
    </span>
  );
}

function FormattedMessage({ content }) {
  const lines = String(content || "").split("\n");
  return (
    <>
      {lines.map((line, idx) => (
        <span key={idx}>
          {renderFormattedLine(line, idx)}
          {idx < lines.length - 1 && <br />}
        </span>
      ))}
    </>
  );
}

export default function AiChatWidget({ userRole = 'kasir' }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const isOwner = userRole === 'admin' || userRole === 'owner';
  const quickPrompts = isOwner ? OWNER_PROMPTS : KASIR_PROMPTS;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

  async function send(text) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, role: userRole }),
      });
      const data = await res.json();
      const reply = res.ok ? data.reply : data.error || "Terjadi kesalahan.";
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch {
      setMessages([
        ...next,
        { role: "assistant", content: "Gagal terhubung ke server. Coba lagi." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[35rem] w-[24.5rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl animate-login-rise">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-card/60 px-4 py-3 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <div className={`grid size-8 place-items-center rounded-xl ${isOwner ? 'bg-amber-500/15 text-amber-600' : 'bg-primary/10 text-primary'}`}>
                {isOwner ? <TrendingUp className="h-4 w-4" /> : <Boxes className="h-4 w-4" />}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold leading-none">
                    {isOwner ? 'Asisten Bisnis & Stok' : 'Asisten Stok Dian Motor'}
                  </p>
                  <span className={`rounded px-1.5 py-0.2 font-mono text-[9px] font-bold ${isOwner ? 'bg-amber-500/15 text-amber-600' : 'bg-blue-500/15 text-blue-600'}`}>
                    {isOwner ? 'OWNER' : 'KASIR'}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {isOwner ? 'Rekap Stok, Keuangan, Laba & Analisa Bisnis' : 'Cek Ketersediaan Stok & Posisi Rak Cepat'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                  aria-label="Reset obrolan"
                  title="Mulai obrolan baru"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Pesan */}
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm">
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="rounded-xl border border-border/80 bg-muted/40 p-3">
                  <p className="text-xs font-semibold text-foreground">
                    {isOwner
                      ? 'Halo Owner! Asisten Bisnis & Stok Dian Motor siap membantu.'
                      : 'Halo! Asisten database stok Dian Motor siap membantu.'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {isOwner
                      ? 'Diskusikan rekap stok, mutasi gudang, laporan keuangan, omzet, estimasi laba, hingga strategi prioritas kulakan secara langsung.'
                      : 'Tanyakan ketersediaan barang, lokasi rak penyimpanan, atau harga suku cadang bengkel secara cepat.'}
                  </p>
                </div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Pertanyaan cepat:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {quickPrompts.map((q) => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      className="rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-primary hover:text-white cursor-pointer"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={
                    "max-w-[90%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] leading-relaxed shadow-sm " +
                    (m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-muted text-foreground rounded-bl-none border border-border/60")
                  }
                >
                  <FormattedMessage content={m.content} />
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/40 w-fit">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />{' '}
                {isOwner ? 'Menganalisa data stok & keuangan...' : 'Mengecek database stok...'}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-center gap-2 border-t border-border bg-card/40 p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isOwner ? 'Tanya rekap stok, omzet, laba, atau analisa...' : 'Ketik pertanyaan stok di sini...'}
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs sm:text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-xl bg-primary px-3 py-2 text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-40 cursor-pointer"
              aria-label="Kirim"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {/* Tombol mengambang */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 flex h-13 w-13 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
        aria-label={isOwner ? "Buka asisten bisnis & stok" : "Buka asisten stok"}
      >
        {open ? <X className="h-6 w-6" /> : <MessageSquareText className="h-6 w-6" />}
      </button>
    </>
  );
}
