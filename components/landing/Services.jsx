import Link from "next/link";
import { Gauge, Package, Wrench, Zap, Sparkles, ArrowRight } from "lucide-react";

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
      lead="Biaya di bawah adalah estimasi standar. Harga final selalu dikonfirmasi bersama Anda setelah pengecekan mekanik atau diagnosa AI."
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((service) => {
          const Icon = icons[service.icon] ?? Wrench;

          return (
            <Card
              key={service.title}
              className="group gap-0 rounded-2xl border border-border bg-card py-0 shadow-card ring-0 transition-all duration-300 hover:shadow-card-hover hover:border-primary/40 hover:-translate-y-1"
            >
              <CardHeader className="px-5 pt-6">
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-xl border border-border bg-background text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon className="size-5" />
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    Resmi
                  </span>
                </div>
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
          <h4 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <span>Punya keluhan mesin, bunyi aneh, atau tarikan berat?</span>
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            Gunakan AI Diagnosa Dian Motor untuk mendeteksi sumber kerusakan dan cek suku cadangnya sebelum datang ke bengkel.
          </p>
        </div>

        <Button asChild size="sm" className="shrink-0 h-10 px-5 gap-1.5 cursor-pointer">
          <Link href="/konsultasi-ai">
            <span>Coba AI Diagnosa Sekarang</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </div>
    </Section>
  );
}

export default Services;
