"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Wrench,
  Sparkles,
  Send,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Package,
  ArrowRight,
  MessageCircle,
  HelpCircle,
  ShieldCheck,
  Cpu,
} from "lucide-react";
import { Section } from "@/components/landing/Section";
import { Button } from "@/components/ui/button";
import { company, whatsappLink } from "@/components/landing/data";

const POPULAR_QUERIES = [
  { text: "Rem ku kok ora srek?", category: "Rem" },
  { text: "Standart 2 ne miring, apa kudu diganti?", category: "Standar" },
  { text: "Mesin kemlotok pas anget", category: "Mesin" },
  { text: "Motor brebet pas digas pol", category: "Pengapian" },
  { text: "Stang goyang karo oleng pas nikung", category: "Kaki-kaki" },
  { text: "CVT matic gredek pas angkatan awal", category: "CVT" },
];

function renderFormattedText(text) {
  if (!text) return null;
  const paragraphs = text.split("\n\n");

  return paragraphs.map((paragraph, pIdx) => {
    const lines = paragraph.split("\n").map((l) => l.trim()).filter(Boolean);

    return (
      <div key={pIdx} className="space-y-1">
        {lines.map((line, lIdx) => {
          if (line.startsWith("•") || line.startsWith("-") || line.startsWith("* ")) {
            const itemText = line.replace(/^[•\-*]\s*/, "");
            return (
              <div key={lIdx} className="flex items-start gap-2 pl-1.5 my-1 text-xs sm:text-sm">
                <span className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <div className="flex-1 leading-relaxed">{renderInlineTokens(itemText)}</div>
              </div>
            );
          }

          if (/^\d+\.\s/.test(line)) {
            const num = line.match(/^\d+\./)[0];
            const rest = line.replace(/^\d+\.\s*/, "");
            return (
              <div key={lIdx} className="flex items-start gap-2 pl-1.5 my-1 text-xs sm:text-sm">
                <span className="font-bold text-primary shrink-0">{num}</span>
                <div className="flex-1 leading-relaxed">{renderInlineTokens(rest)}</div>
              </div>
            );
          }

          return (
            <p key={lIdx} className="text-xs sm:text-sm leading-relaxed">
              {renderInlineTokens(line)}
            </p>
          );
        })}
      </div>
    );
  });
}

function renderInlineTokens(str) {
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

export function AiDiagnosticSection() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeQuestion, setActiveQuestion] = useState(null);

  async function handleDiagnose(questionText) {
    const textToSearch = questionText || query;
    if (!textToSearch.trim() || loading) return;

    setLoading(true);
    setActiveQuestion(textToSearch);
    try {
      const res = await fetch("/api/ai/diagnosa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: textToSearch }],
        }),
      });

      const data = await res.json();
      if (res.ok && data?.reply) {
        setResult({
          reply: data.reply,
          category: data.category,
          urgency: data.urgency,
          suggestedItems: data.suggestedItems || [],
          originalQuery: textToSearch,
        });
      } else {
        setResult({
          reply:
            data?.error ||
            "Mohon maaf, sistem sedang sibuk. Silakan coba beberapa saat lagi.",
          originalQuery: textToSearch,
        });
      }
    } catch {
      setResult({
        reply:
          "Gagal terhubung dengan server diagnosa. Silakan periksa jaringan internet Anda.",
        originalQuery: textToSearch,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Section
      id="ai-diagnosa"
      className="relative bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(220,38,38,0.1),rgba(255,255,255,0))]"
      eyebrow="✨ KONSULTASI CERDAS PELANGGAN"
      title="AI Problem Solving: Diagnosa Motor & Cek Suku Cadang"
      lead="Bingung motor terasa tidak enak? Ceritakan keluhan motormu dengan bahasa santai, Boso Jowo, maupun dialek Ngapak. AI Mekanik kami siap menganalisa penyebabnya dan mengecek ketersediaan suku cadang resmi di Dian Motor secara instan."
    >
      <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
        {/* Kolom Kiri: Input Keluhan & Chip Gejala Populer */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <Cpu className="size-4.5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Konsultasi Keluhan Motor
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Paham bahasa Indonesia, Jawa, &amp; Ngapak
                </p>
              </div>
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleDiagnose();
              }}
              className="space-y-3"
            >
              <div className="relative">
                <textarea
                  rows={3}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ketik keluhan motormu di sini... (contoh: rem ora srek, mesin kemlotok, brebet)"
                  className="w-full resize-none rounded-xl border border-border bg-background p-3.5 text-xs sm:text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !query.trim()}
                className="w-full h-11 rounded-xl gap-2 font-semibold shadow-sm cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Menganalisa Kerusakan &amp; Stok...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    <span>Diagnosa Kerusakan Sekarang</span>
                  </>
                )}
              </Button>
            </form>

            {/* Bahasa Dukungan */}
            <div className="mt-4 pt-4 border-t border-border/80 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">Dukungan Bahasa:</span>
              <span className="rounded bg-muted px-1.5 py-0.5">🇮🇩 Indonesia</span>
              <span className="rounded bg-muted px-1.5 py-0.5">🌾 Jawa</span>
              <span className="rounded bg-muted px-1.5 py-0.5">⚡ Ngapak</span>
            </div>
          </div>

          {/* Contoh Gejala yang Sering Masuk */}
          <div className="rounded-2xl border border-border/80 bg-muted/20 p-5">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-3">
              <HelpCircle className="size-3.5 text-primary" />
              <span>Contoh keluhan yang bisa kamu klik langsung:</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_QUERIES.map((item) => (
                <button
                  key={item.text}
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setQuery(item.text);
                    handleDiagnose(item.text);
                  }}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition cursor-pointer text-left ${
                    activeQuestion === item.text
                      ? "border-primary bg-primary text-primary-foreground font-semibold"
                      : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-muted active:scale-95"
                  }`}
                >
                  {item.text}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Hasil Diagnosa & Validasi Stok Real-time */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card min-h-[380px] flex flex-col justify-between">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="relative mb-4">
                  <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary animate-pulse">
                    <Wrench className="size-7" />
                  </div>
                  <Loader2 className="absolute -bottom-1 -right-1 size-5 animate-spin text-primary" />
                </div>
                <h4 className="text-base font-bold text-foreground">
                  Mas Dian sedang menganalisa keluhan motormu...
                </h4>
                <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                  Menganalisa gejala kerusakan mesin, membaca bahasa daerah, dan mengecek suku cadang di rak bengkel Dian Motor.
                </p>
              </div>
            ) : result ? (
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                {/* Header Hasil */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-8 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500">
                      <CheckCircle className="size-4.5" />
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">
                        Hasil Diagnosa Mas Dian
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Keluhan: &ldquo;{result.originalQuery}&rdquo;
                      </p>
                    </div>
                  </div>

                  {result.urgency && (
                    <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-500 flex items-center gap-1">
                      <AlertTriangle className="size-3" />
                      Urgensi: {result.urgency}
                    </span>
                  )}
                </div>

                {/* Konten Balasan */}
                <div className="rounded-xl border border-border/80 bg-muted/30 p-4 text-xs sm:text-sm leading-relaxed text-foreground space-y-2">
                  {renderFormattedText(result.reply)}
                </div>

                {/* Tombol Aksi Lanjutan */}
                <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                  <Button asChild className="flex-1 h-10 gap-2 rounded-xl text-xs font-semibold cursor-pointer">
                    <Link href={`/konsultasi-ai?q=${encodeURIComponent(result.originalQuery)}`}>
                      <span>Lanjut Ngobrol di Halaman AI Penuh</span>
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="h-10 gap-2 rounded-xl text-xs font-semibold cursor-pointer border-border hover:bg-muted">
                    <a
                      href={whatsappLink(
                        `Halo Bengkel Dian Motor, saya ingin konsultasi servis setelah cek di AI Diagnosa: "${result.originalQuery}"`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="size-3.5 text-emerald-500" />
                      <span>Booking Servis WA</span>
                    </a>
                  </Button>
                </div>
              </div>
            ) : (
              /* State Kosong / Panduan Awal */
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <div className="grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground mb-4">
                  <Wrench className="size-7" />
                </div>
                <h4 className="text-base font-bold text-foreground">
                  Ruang Diagnosa Siap Digunakan
                </h4>
                <p className="mt-2 text-xs sm:text-sm max-w-md leading-relaxed text-muted-foreground">
                  Ketik keluhan yang kamu rasakan pada motormu di formulir sebelah kiri, atau klik salah satu contoh keluhan. Mas Dian siap memberikan analisa teknis dan cek ketersediaan komponennya!
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="size-4 text-primary" />
                    Penjelasan bahasa awam
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Package className="size-4 text-primary" />
                    Cek stok 1.000+ suku cadang
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="size-4 text-primary" />
                    Solusi hemat &amp; transparan
                  </span>
                </div>
              </div>
            )}

            {/* Footer Kotak Hasil */}
            <div className="mt-5 pt-3.5 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Sistem AI terhubung langsung ke inventori resmi Dian Motor</span>
              <Link
                href="/konsultasi-ai"
                className="font-medium text-primary hover:underline inline-flex items-center gap-1"
              >
                <span>Buka Halaman AI Penuh</span>
                <ArrowRight className="size-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

export default AiDiagnosticSection;
