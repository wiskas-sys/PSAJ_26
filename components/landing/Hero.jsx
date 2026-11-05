import { ArrowRight, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { heroCopy, heroSpecs } from "@/components/landing/data";

/**
 * Hero: headline, subheadline, dua tombol, dan panel spesifikasi.
 * Tombol primary menuju #kontak, ghost menuju #layanan.
 */
export function Hero() {
  return (
    <section id="atas" className="relative scroll-mt-20 overflow-hidden">
      {/* glow accent tipis di belakang headline */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(60%_100%_at_50%_0%,var(--primary)_0%,transparent_70%)] opacity-[0.07]"
      />

      <div className="mx-auto grid w-full max-w-6xl gap-14 px-5 pt-20 pb-24 sm:px-8 sm:pt-28 sm:pb-32 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-16">
        <div>
          {/* TODO: ganti label eyebrow */}
          <p className="eyebrow">Bengkel motor</p>

          {/* TODO: ganti headline asli */}
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-balance text-foreground sm:text-5xl lg:text-[3.5rem] lg:leading-[1.05]">
            {heroCopy.headline}
          </h1>

          {/* TODO: ganti subheadline asli */}
          <p className="mt-6 max-w-xl text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">
            {heroCopy.subheadline}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild className="h-11 px-6 text-[0.95rem]">
              <a href="#kontak">
                Hubungi Kami
                <ArrowRight data-icon="inline-end" />
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 border-border bg-transparent px-6 text-[0.95rem] hover:bg-muted"
            >
              <a href="#layanan">Lihat Layanan</a>
            </Button>
          </div>

          {/* TODO: ganti catatan singkat di bawah tombol */}
          <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <MessageCircle className="size-4 text-primary" />
            Tanpa booking wajib, motor bisa langsung dibawa ke workshop.
          </p>
        </div>

        {/* Panel spesifikasi */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-card sm:p-7">
          {/* TODO: ganti judul panel */}
          <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Informasi workshop
          </p>

          <dl className="mt-6 divide-y divide-border">
            {heroSpecs.map((spec) => (
              <div
                key={spec.label}
                className="flex items-baseline justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
              >
                <dt className="text-sm text-muted-foreground">{spec.label}</dt>
                <dd className="text-right text-sm font-semibold text-foreground">
                  {spec.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 rounded-md border border-border bg-background/60 px-4 py-3">
            {/* TODO: ganti teks catatan inventori */}
            <p className="text-xs leading-relaxed text-muted-foreground">
              Ketersediaan sparepart dapat dicek langsung lewat sistem inventori
              internal kami, jadi tidak perlu menunggu stok dari luar.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
