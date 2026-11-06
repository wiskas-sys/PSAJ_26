"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquareText, Boxes, X, Send, Loader2 } from "lucide-react";

const QUICK_PROMPTS = [
  "stok mana yg masih ada?",
  "brg apa yg abis?",
  "stok menipis apa aja?",
  "rekap stok",
  "oli mn?",
  "busi ad ga?",
];

export default function AiChatWidget({ userRole = 'kasir' }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const isOwner = userRole === 'admin' || userRole === 'owner';

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
        <div className="fixed bottom-24 right-6 z-50 flex h-[34rem] w-[23rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl animate-login-rise">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-card/60 px-4 py-3 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <div className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary">
                <Boxes className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold leading-none">Asisten Stok Dian Motor</p>
                  <span className={`rounded px-1.5 py-0.2 font-mono text-[9px] font-bold ${isOwner ? 'bg-amber-500/15 text-amber-600' : 'bg-blue-500/15 text-blue-600'}`}>
                    {isOwner ? 'OWNER' : 'KASIR'}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">Cek Ketersediaan Stok &amp; Posisi Rak Cepat</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
              aria-label="Tutup"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Pesan */}
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm">
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="rounded-xl border border-border/80 bg-muted/40 p-3">
                  <p className="text-xs font-semibold text-foreground">
                    Halo! Asisten database stok Dian Motor siap membantu.
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    Tanyakan ketersediaan barang, lokasi rak penyimpanan, atau harga suku cadang bengkel secara cepat.
                  </p>
                </div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Pertanyaan cepat:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PROMPTS.map((q) => (
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
                    "max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed shadow-sm " +
                    (m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-muted text-foreground rounded-bl-none border border-border/60")
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/40 w-fit">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> Mengecek database stok...
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
              placeholder="Ketik pertanyaan stok di sini..."
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
        aria-label="Buka asisten stok"
      >
        {open ? <X className="h-6 w-6" /> : <MessageSquareText className="h-6 w-6" />}
      </button>
    </>
  );
}
