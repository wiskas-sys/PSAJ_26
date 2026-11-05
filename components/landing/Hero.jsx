import Link from "next/link";
import { ArrowRight, MessageCircle, Sparkles, ShieldCheck, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { heroCopy, heroSpecs } from "@/components/landing/data";

const QUICK_SYMPTOMS = [
  { label: "Rem ora srek", query: "rem ku kok ora srek" },
  { label: "Mesin kemlotok", query: "mesin kemlotok pas anget" },
  { label: "Motor brebet", query: "motor brebet pas digas pol" },
  { label: "Stang oleng", query: "stang goyang karo oleng" },
];

/**
 * Hero: headline, subheadline, CTA cerdas ke AI Diagnosa, dan panel spesifikasi modern.
 */
export function Hero() {
  return (
    <section id="atas" className="relative scroll-mt-20 overflow-hidden">
      {/* glow accent tipis di belakang headline */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[450px] bg-[radial-gradient(65%_100%_at_50%_0%,var(--primary)_0%,transparent_70%)] opacity-[0.09]"
      />

      <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 pt-16 pb-20 sm:px-8 sm:pt-24 sm:pb-28 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-14">
        <div>
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary mb-4">
            <span className="size-2 rounded-full bg-primary animate-pulse" />
            <span>Bengkel Motor Terpercaya &amp; Sistem Terintegrasi</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl font-extrabold tracking-tight text-balance text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
            {heroCopy.headline}
          </h1>

          {/* Subheadline */}
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-pretty text-muted-foreground sm:text-base">
            {heroCopy.subheadline}
          </p>

          {/* Tombol Aksi Utama */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              asChild
              className="h-11 px-6 text-sm font-semibold shadow-md bg-gradient-to-r from-primary to-rose-600 hover:brightness-110 cursor-pointer"
            >
              <Link href="/konsultasi-ai">
                <Sparkles className="size-4 mr-2" />
                <span>Tanya AI Diagnosa Kerusakan</span>
                <ArrowRight className="size-4 ml-1.5" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-11 border-border bg-card/60 px-6 text-sm font-medium hover:bg-muted cursor-pointer"
            >
              <a href="#layanan">Lihat Layanan &amp; Biaya</a>
            </Button>
          </div>

          {/* Chips Keluhan Cepat */}
          <div className="mt-6 pt-5 border-t border-border/70">
            <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
              <span>Punya keluhan motor? Coba klik diagnosa cepat:</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_SYMPTOMS.map((chip) => (
                <Link
                  key={chip.label}
                  href={`/konsultasi-ai?q=${encodeURIComponent(chip.query)}`}
                  className="rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-medium text-foreground transition-all hover:border-primary hover:bg-primary/5 hover:text-primary active:scale-95 shadow-xs"
                >
                  ⚡ {chip.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Catatan workshop */}
          <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 text-emerald-500" />
            Bisa langsung datang ke workshop tanpa booking wajib. Pengecekan awal transparan.
          </p>
        </div>

        {/* Panel spesifikasi & Keunggulan Real-time */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-7 relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              <p className="text-xs font-bold tracking-[0.15em] text-primary uppercase">
                INFORMASI WORKSHOP
              </p>
              <h3 className="text-base font-bold text-foreground mt-0.5">
                Dian Motor Center
              </h3>
            </div>
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-500">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Buka Hari Ini
            </span>
          </div>

          <dl className="mt-4 divide-y divide-border">
            {heroSpecs.map((spec) => (
              <div
                key={spec.label}
                className="flex items-baseline justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <dt className="text-xs sm:text-sm text-muted-foreground">{spec.label}</dt>
                <dd className="text-right text-xs sm:text-sm font-semibold text-foreground">
                  {spec.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-5 rounded-xl border border-border/80 bg-muted/40 p-3.5">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                <strong className="text-foreground">Sistem Inventori Terbuka:</strong> Ketersediaan sparepart dan posisi rak dicek otomatis saat diagnosa, jadi Anda tidak perlu menunggu barang tanpa kepastian.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
