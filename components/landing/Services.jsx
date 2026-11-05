import { Gauge, Package, Wrench, Zap } from "lucide-react";

import { Section } from "@/components/landing/Section";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { services } from "@/components/landing/data";

// ikon dipetakan di sini supaya data.js bebas dari JSX
const icons = { wrench: Wrench, zap: Zap, package: Package, gauge: Gauge };

/**
 * Services: grid empat kartu layanan + estimasi harga.
 * TODO: ganti data asli — isi katalog ada di components/landing/data.js
 */
export function Services() {
  return (
    <Section
      id="layanan"
      eyebrow="Layanan"
      title="Empat layanan utama"
      lead="Harga di bawah adalah estimasi awal. Biaya final ditentukan setelah pemeriksaan motor di workshop."
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((service) => {
          const Icon = icons[service.icon] ?? Wrench;

          return (
            <Card
              key={service.title}
              className="gap-0 rounded-lg border border-border bg-card py-0 shadow-card ring-0 transition-shadow duration-200 hover:shadow-card-hover"
            >
              <CardHeader className="px-5 pt-6">
                <span className="flex size-9 items-center justify-center rounded-md border border-border bg-background text-primary">
                  <Icon className="size-4" />
                </span>
                <CardTitle className="mt-4 text-base font-semibold text-foreground">
                  {service.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="px-5 pb-6">
                <CardDescription className="leading-relaxed">
                  {service.description}
                </CardDescription>

                <div className="mt-5 border-t border-border pt-4">
                  {/* TODO: ganti estimasi harga asli */}
                  <p className="font-heading text-sm font-semibold text-foreground">
                    {service.price}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{service.meta}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* TODO: ganti catatan kaki layanan */}
      <p className="mt-8 text-sm text-muted-foreground">
        Punya keluhan lain di luar daftar ini? Chat dulu, biasanya bisa kami
        tangani di workshop yang sama.
      </p>
    </Section>
  );
}

export default Services;
