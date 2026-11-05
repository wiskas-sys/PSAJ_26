"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Wrench,
  Sparkles,
  Send,
  Loader2,
  RefreshCw,
  MessageCircle,
  MapPin,
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  HelpCircle,
  ChevronRight,
  ShieldCheck,
  Package,
} from "lucide-react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { company, whatsappLink } from "@/components/landing/data";

const POPULAR_COMPLAINTS = [
  { label: "Rem depan kok ora srek / licin?", lang: "jawa" },
  { label: "Motor brebet pas digas pol", lang: "id" },
  { label: "Mesin kemlotok pas anget, apane sing rusak?", lang: "jawa" },
  { label: "Stang goyang karo oleng pas nikung", lang: "jawa" },
  { label: "Motor angel distarter pas esuk", lang: "jawa" },
  { label: "CVT matic gredek pas tarikan awal", lang: "id" },
  { label: "Knalpot nembak-nembak pas lepas gas", lang: "id" },
];

function MessageBubble({ msg, index, messages }) {
  const isUser = msg.role === "user";

  // Format baris teks dan markdown sederhana
  function formatContent(text) {
    if (!text) return null;
    const lines = text.split("\n");

    return lines.map((line, lIdx) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return <div key={lIdx} className="h-2" />;
      }

      // Format bullet point
      if (trimmed.startsWith("•") || trimmed.startsWith("-")) {
        const itemText = trimmed.replace(/^[•\-]\s*/, "");
        return (
          <div key={lIdx} className="my-1 flex items-start gap-2 pl-2">
            <span className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
            <div className="flex-1 font-medium">{renderInlineTokens(itemText)}</div>
          </div>
        );
      }

      return (
        <p key={lIdx} className="leading-relaxed">
          {renderInlineTokens(line)}
        </p>
      );
    });
  }

  function renderInlineTokens(str) {
    // Regex pembagi **bold**, `code`, dan _italic_
    const parts = str.split(/(\*\*.*?\*\*|`.*?`|_.*?_)/g);
    return parts.map((part, pIdx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={pIdx} className="font-bold text-foreground">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={pIdx}
            className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] font-semibold text-primary"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith("_") && part.endsWith("_")) {
        return (
          <em key={pIdx} className="italic text-muted-foreground">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  }

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} animate-in fade-in-50 duration-200`}
    >
      <div
        className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
          isUser
            ? "bg-primary text-primary-foreground rounded-br-xs font-medium"
            : "border border-border/70 bg-card text-foreground rounded-bl-xs"
        }`}
      >
        <div className="space-y-1">{formatContent(msg.content)}</div>

        {/* Action Buttons jika respon AI */}
        {!isUser && index > 0 && (
          <div className="mt-4 pt-3 border-t border-border/60 flex flex-wrap gap-2">
            <a
              href={whatsappLink(
                `Halo Bengkel Dian Motor, saya ingin konsultasi servis setelah cek di AI Diagnosa: "${messages[index - 1]?.content || ""}"`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-emerald-600 hover:text-white shadow-2xs"
            >
              <MessageCircle className="size-3.5 text-emerald-500" />
              <span>Booking via WhatsApp</span>
            </a>

            <a
              href={company.mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted shadow-2xs"
            >
              <MapPin className="size-3.5 text-primary" />
              <span>Lokasi Bengkel</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function KonsultasiAiContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Halo mas/mbak! Selamat datang di **AI Mekanik & Diagnostik Dian Motor** 🛵

Punya keluhan seputar performa motor? Ceritakan gejalanya dengan bahasa santai, **Boso Jowo**, maupun **Dialek Ngapak**. Kami siap membantu:
• Menganalisa perkiraan kerusakan dan komponen penyebabnya.
• Mengecek ketersediaan suku cadang pengganti langsung di database bengkel.
• Memberikan saran penanganan awal yang aman sebelum dibawa ke bengkel.

Silakan ketik keluhan motormu di bawah atau klik salah satu contoh keluhan di atas!`,
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const hasAutoFired = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Otomatis jalankan jika ada query param ?q=
  useEffect(() => {
    if (initialQuery && !hasAutoFired.current) {
      hasAutoFired.current = true;
      handleSend(initialQuery);
    }
  }, [initialQuery]);

  async function handleSend(textToSend) {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const newHistory = [...messages, { role: "user", content: query }];
    setMessages(newHistory);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/diagnosa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newHistory }),
      });

      const data = await res.json();
      if (res.ok && data?.reply) {
        setMessages([...newHistory, { role: "assistant", content: data.reply }]);
      } else {
        setMessages([
          ...newHistory,
          {
            role: "assistant",
            content:
              data?.error ||
              "Mohon maaf, sistem sedang sibuk. Silakan coba kirim keluhanmu sekali lagi.",
          },
        ]);
      }
    } catch {
      setMessages([
        ...newHistory,
        {
          role: "assistant",
          content:
            "Gagal terhubung ke server diagnosa. Pastikan jaringan internetmu stabil ya!",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setMessages([
      {
        role: "assistant",
        content: `Halo kembali! Ruang konsultasi sudah di-reset. Ceritakan keluhan motormu berikutnya, kami siap mendiagnosa dan mengecek suku cadangnya!`,
      },
    ]);
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
      {/* Breadcrumb & Status */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          <span>Kembali ke Beranda Utama</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-500">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            AI Mekanik Aktif 24 Jam
          </span>
        </div>
      </div>

      {/* Banner Header Diagnosa */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-[linear-gradient(135deg,rgba(220,38,38,0.06),rgba(255,255,255,0))] p-6 sm:p-8 mb-6 shadow-sm">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </span>
            <p className="eyebrow">DIAN MOTOR SMART DIAGNOSTICS</p>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Tanya Masalah Motor, <span className="text-primary">Langsung Tahu Solusinya</span>
          </h1>
          <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
            Ceritakan kendala motormu dengan bahasa sehari-hari, bahasa Jawa, maupun bahasa Ngapak.
            AI kami menganalisa komponen yang bermasalah dan mengecek ketersediaan suku cadang asli di bengkel Dian Motor.
          </p>

          {/* Badge Bahasa */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Dukungan Bahasa:</span>
            <span className="rounded-md border border-border bg-card px-2 py-0.5 text-[11px]">
              🇮🇩 Bahasa Indonesia Santai
            </span>
            <span className="rounded-md border border-border bg-card px-2 py-0.5 text-[11px]">
              🌾 Bahasa Jawa Ngoko &amp; Krama
            </span>
            <span className="rounded-md border border-border bg-card px-2 py-0.5 text-[11px]">
              ⚡ Dialek Jawa Ngapak
            </span>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex h-[620px] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-lg">
        {/* Chat Header Bar */}
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-5 py-3.5 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-md">
                <Wrench className="size-5" />
              </div>
              <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-card bg-emerald-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-none text-foreground">
                Asisten AI Mekanik Dian Motor
              </h3>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Terhubung dengan database inventori 1.000+ suku cadang
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              title="Mulai obrolan baru"
            >
              <RefreshCw className="size-3.5" />
              <span className="hidden sm:inline">Reset Chat</span>
            </Button>
          </div>
        </div>

        {/* Chat Messages Scroll Area */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {/* Quick Prompt Pills */}
          <div className="rounded-2xl border border-border/80 bg-muted/20 p-4">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2.5">
              <HelpCircle className="size-3.5 text-primary" />
              <span>Contoh keluhan yang sering ditanyakan pelanggan:</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_COMPLAINTS.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(item.label)}
                  disabled={loading}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary/50 hover:bg-primary/5 active:scale-95 disabled:opacity-50 cursor-pointer text-left"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message History */}
          {messages.map((msg, index) => (
            <MessageBubble
              key={index}
              msg={msg}
              index={index}
              messages={messages}
            />
          ))}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
                <Loader2 className="size-4 animate-spin text-primary" />
                <span>Mekanik AI sedang menganalisa keluhan motormu &amp; mengecek stok...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="border-t border-border bg-card p-3 sm:p-4"
        >
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ketik keluhan motormu di sini... (contoh: rem ora srek, mesin kemlotok, brebet)"
              disabled={loading}
              className="flex-1 rounded-2xl border border-border bg-background px-4 py-3 text-xs sm:text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="size-11 rounded-2xl shrink-0 p-0 shadow-sm cursor-pointer"
              aria-label="Kirim"
            >
              <Send className="size-4" />
            </Button>
          </div>

          <div className="mt-2 flex items-center justify-between px-1 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <ShieldCheck className="size-3 text-primary" />
              Diagnosa otomatis berbasis standar mekanik bengkel Dian Motor
            </span>
            <span className="hidden sm:inline">Tekan Enter untuk mengirim</span>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function KonsultasiAiPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1 py-8 sm:py-12">
        <Suspense
          fallback={
            <div className="flex min-h-[400px] items-center justify-center">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          }
        >
          <KonsultasiAiContent />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
