import Image from "next/image";
import Link from "next/link";
import { Gauge, Package, Wrench, Zap } from "lucide-react";

import { Section } from "@/components/landing/Section";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { services } from "@/components/landing/data";

const icons = { wrench: Wrench, zap: Zap, package: Package, gauge: Gauge };

/**
 * Services: grid empat kartu layanan unggulan + estimasi biaya transparan.
 */
export function Services() {
  return (
    <Section
      id="layanan"
      eyebrow="LAYANAN UNGGULAN"
      title="Servis Berkualitas dengan Estimasi Biaya Transparan"
      lead="Biaya di bawah adalah estimasi standar. Harga final selalu dikonfirmasi bersama Anda setelah pengecekan fisik mekanik di bengkel."
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((service) => {
          const Icon = icons[service.icon] ?? Wrench;

          return (
            <Card
              key={service.title}
              className="group gap-0 overflow-hidden rounded-2xl border border-border bg-card py-0 shadow-card ring-0 transition-colors hover:border-primary/40"
            >
              <div className="relative aspect-[16/10] overflow-hidden border-b border-border bg-muted">
                <Image
                  src={service.image.src}
                  alt={service.image.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 285px"
                  className="object-cover"
                />
              </div>

              <CardHeader className="px-5 pt-6">
                <span className="flex size-10 items-center justify-center rounded-xl border border-border bg-background text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="size-5" />
                </span>
                <CardTitle className="mt-4 text-base font-bold text-foreground">
                  {service.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="px-5 pb-6">
                <CardDescription className="leading-relaxed text-xs text-muted-foreground min-h-[48px]">
                  {service.description}
                </CardDescription>

                <div className="mt-5 border-t border-border pt-4">
                  <p className="font-heading text-sm font-bold text-foreground">
                    {service.price}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{service.meta}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Banner CTA Bawah Layanan */}
      <div className="mt-10 rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm sm:text-base font-bold text-foreground">
            Punya keluhan mesin, bunyi aneh, atau tarikan berat?
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            Gunakan fitur konsultasi online Dian Motor untuk mendeteksi sumber keluhan dan cek suku cadangnya sebelum datang ke bengkel.
          </p>
        </div>

        <Button asChild size="sm" className="shrink-0 h-10 px-5 cursor-pointer">
          <Link href="/konsultasi-ai">Konsultasi Kerusakan</Link>
        </Button>
      </div>
    </Section>
  );
}

export default Services;
