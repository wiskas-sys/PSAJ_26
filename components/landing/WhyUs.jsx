import { Clipboard, Gauge, Package, ShieldCheck } from "lucide-react";

import { Section } from "@/components/landing/Section";
import { advantages } from "@/components/landing/data";

const icons = {
  clipboard: Clipboard,
  shieldCheck: ShieldCheck,
  gauge: Gauge,
  package: Package,
};

/**
 * WhyUs: empat keunggulan, dua kolom di tablet, empat di desktop.
 * TODO: ganti data asli — daftar keunggulan ada di components/landing/data.js
 */
export function WhyUs() {
  return (
    <Section
      id="keunggulan"
      eyebrow="Kenapa Dian Motor"
      title="Yang membuat beda di garansi dan di nota"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {advantages.map((item) => {
          const Icon = icons[item.icon] ?? Package;

          return (
            <div
              key={item.title}
              className="flex gap-4 rounded-lg border border-border bg-card p-6 shadow-card"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-background text-primary">
                <Icon className="size-4" />
              </span>

              <div>
                <h3 className="font-heading text-base font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

export default WhyUs;
