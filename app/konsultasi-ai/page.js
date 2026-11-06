"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Wrench,
  HelpCircle,
  Send,
  Loader2,
  RefreshCw,
  MessageCircle,
  MapPin,
  ArrowLeft,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { company, whatsappLink } from "@/components/landing/data";

const QUICK_CHIPS = [
  { label: "Rem kok ora srek?", query: "rem ku kok ora srek" },
  { label: "Standar 2 miring / macet", query: "kue kira kira bakal ganti standart 2 ne apa di beneri bae?" },
  { label: "Mesin kemlotok pas anget", query: "mesin kemlotok pas anget, apane sing rusak?" },
  { label: "Motor brebet pas digas pol", query: "motor brebet pas digas pol" },
  { label: "Stang goyang / oleng", query: "stang goyang karo oleng pas nikung" },
  { label: "CVT matic gredek", query: "cvt matic gredek pas tarikan awal" },
  { label: "Motor angel distarter", query: "motor angel distarter pas esuk" },
];

function MessageBubble({ msg, index, totalMessages, lastUserQuery }) {
  const isUser = msg.role === "user";
  const isLatestAssistant = !isUser && index === totalMessages - 1;

  // Format teks dan markdown sederhana dengan rapi tanpa teks bertumpuk
  function formatContent(text) {
    if (!text) return null;
    const paragraphs = text.split("\n\n");

    return paragraphs.map((paragraph, pIdx) => {
      const lines = paragraph.split("\n").map((l) => l.trim()).filter(Boolean);

      return (
        <div key={pIdx} className="space-y-1">
          {lines.map((line, lIdx) => {
            // Format bullet point
            if (line.startsWith("•") || line.startsWith("-") || line.startsWith("* ")) {
              const itemText = line.replace(/^[•\-*]\s*/, "");
              return (
                <div key={lIdx} className="flex items-start gap-2 pl-1.5 my-1 text-xs sm:text-sm">
                  <span className="size-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <div className="flex-1 leading-relaxed">{renderInline(itemText)}</div>
                </div>
              );
            }

            // Format nomor (1. 2. 3.)
            if (/^\d+\.\s/.test(line)) {
              const num = line.match(/^\d+\./)[0];
              const rest = line.replace(/^\d+\.\s*/, "");
              return (
                <div key={lIdx} className="flex items-start gap-2 pl-1.5 my-1 text-xs sm:text-sm">
                  <span className="font-bold text-primary shrink-0">{num}</span>
                  <div className="flex-1 leading-relaxed">{renderInline(rest)}</div>
                </div>
              );
            }

            return (
              <p key={lIdx} className="text-xs sm:text-sm leading-relaxed">
                {renderInline(line)}
              </p>
            );
          })}
        </div>
      );
    });
  }

  function renderInline(str) {
    const parts = str.split(/(\*\*.*?\*\*|`.*?`|_.*?_)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={idx} className="font-bold text-foreground">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={idx}
            className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] font-semibold text-primary"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith("_") && part.endsWith("_")) {
        return (
          <em key={idx} className="italic text-muted-foreground">
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
        className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 shadow-xs ${
          isUser
            ? "bg-primary text-primary-foreground rounded-br-xs font-medium text-xs sm:text-sm"
            : "border border-border/80 bg-card/90 text-foreground rounded-bl-xs"
        }`}
      >
        <div className="space-y-2">{formatContent(msg.content)}</div>

        {/* Action Buttons: HANYA tampil di balasan asisten yang PALING AKHIR */}
        {isLatestAssistant && index > 0 && (
          <div className="mt-3.5 pt-3 border-t border-border/60 flex flex-wrap items-center gap-2">
            <a
              href={whatsappLink(
                `Halo Mas Dian Bengkel Dian Motor, saya ingin konsultasi & booking servis setelah cek diagnosa: "${lastUserQuery || ""}"`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-500 transition hover:bg-emerald-600 hover:text-white"
            >
              <MessageCircle className="size-3.5" />
              <span>Booking via WhatsApp</span>
            </a>

            <a
              href={company.mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground hover:bg-muted"
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
      content: `Halo Mas/Mbak! Saya **Mas Dian**, kepala mekanik bengkel Dian Motor 🛵

Motormu lagi ada kendala apa? Mau cerita pakai **Bahasa Indonesia**, **Boso Jowo**, atau **Ngapak** santai saja ya. 
Ketik keluhanmu di bawah atau klik salah satu topik cepat!`,
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const hasAutoFired = useRef(false);
  const chipsRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!chipsRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = chipsRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scrollChips = (dir) => {
    if (!chipsRef.current) return;
    chipsRef.current.scrollBy({
      left: dir === "left" ? -220 : 220,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

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
              "Mohon maaf, sistem sedang sibuk. Silakan tanyakan keluhanmu sekali lagi.",
          },
        ]);
      }
    } catch {
      setMessages([
        ...newHistory,
        {
          role: "assistant",
          content:
            "Gagal terhubung dengan server diagnosa. Pastikan jaringan internet stabil ya!",
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
        content: `Halo kembali! Ruang konsultasi sudah di-reset. Ceritakan keluhan motormu berikutnya, Mas Dian siap bantu analisa dan cek suku cadangnya!`,
      },
    ]);
  }

  const lastUserQuery =
    messages.filter((m) => m.role === "user").pop()?.content || "";

  return (
    <div className="mx-auto w-full max-w-4xl px-3 sm:px-6">
      {/* Top Header Ringkas & Bersih */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          <span>Kembali ke Beranda</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-500">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Asisten Mekanik Aktif 24 Jam
          </span>
        </div>
      </div>

      {/* Chat Container Utama */}
      <div className="flex h-[calc(100vh-210px)] min-h-[520px] max-h-[720px] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-lg">
        {/* Chat Topbar */}
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                <Wrench className="size-5" />
              </div>
              <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-card bg-emerald-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground leading-none">
                Mas Dian — Asisten Mekanik Dian Motor
              </h2>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Paham Bahasa Jawa, Ngapak, &amp; Indonesia • Cek Stok Real-Time
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              title="Reset Percakapan"
            >
              <RefreshCw className="size-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
          </div>
        </div>

        {/* Message Scroll Area */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {messages.map((msg, index) => (
            <MessageBubble
              key={index}
              msg={msg}
              index={index}
              totalMessages={messages.length}
              lastUserQuery={lastUserQuery}
            />
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2.5 rounded-2xl border border-border/80 bg-card px-4 py-3 text-xs text-muted-foreground shadow-xs">
                <Loader2 className="size-4 animate-spin text-primary" />
                <span>Mas Dian sedang memikirkan solusi &amp; mengecek stok...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Strip (Horizontal Scrollable with wheel & arrow navigation) */}
        <div className="relative border-t border-border/60 bg-muted/20 px-3 py-2 sm:px-6">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground shrink-0 flex items-center gap-1 pr-1 select-none">
              <HelpCircle className="size-3 text-primary" />
              Contoh:
            </span>

            {canScrollLeft && (
              <button
                type="button"
                onClick={() => scrollChips("left")}
                aria-label="Geser ke kiri"
                className="grid size-6 shrink-0 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground shadow-xs cursor-pointer transition hover:bg-muted"
              >
                <ChevronLeft className="size-3.5" />
              </button>
            )}

            <div
              ref={chipsRef}
              onScroll={checkScroll}
              onWheel={(e) => {
                if (e.deltaY !== 0) {
                  e.currentTarget.scrollLeft += e.deltaY;
                }
              }}
              className="flex items-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-border pb-1 pt-0.5 scroll-smooth touch-pan-x"
            >
              {QUICK_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={loading}
                  onClick={() => handleSend(chip.query)}
                  className="shrink-0 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground transition hover:border-primary hover:text-primary hover:bg-primary/5 active:scale-95 disabled:opacity-50 cursor-pointer shadow-2xs whitespace-nowrap"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {canScrollRight && (
              <button
                type="button"
                onClick={() => scrollChips("right")}
                aria-label="Geser ke kanan"
                className="grid size-6 shrink-0 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground shadow-xs cursor-pointer transition hover:bg-muted"
              >
                <ChevronRight className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Chat Input Bar */}
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
              placeholder="Tanya keluhan motormu... (contoh: rem ora srek, mesin kemlotok, brebet)"
              disabled={loading}
              className="flex-1 rounded-2xl border border-border bg-background px-4 py-3 text-xs sm:text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
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
              Konsultasi online gratis • Pemeriksaan fisik transparan di bengkel Dian Motor
            </span>
            <span className="hidden sm:inline">Tekan Enter untuk kirim</span>
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

      <main className="flex-1 py-6 sm:py-8">
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
