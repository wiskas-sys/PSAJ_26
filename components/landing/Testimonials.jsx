import { Quote, Star } from "lucide-react";

import { Section } from "@/components/landing/Section";
import { testimonials } from "@/components/landing/data";

/**
 * Testimonials: tiga kutipan pelanggan dalam grid.
 * TODO: ganti data asli — kutipan ada di components/landing/data.js
 */
export function Testimonials() {
  return (
    <Section
      id="testimoni"
      eyebrow="Testimoni"
      title="Cerita dari pelanggan"
      lead="Kutipan di bawah masih placeholder. Ganti dengan testimoni asli beserta nama dan foto bila ada."
    >
      <div className="grid gap-5 lg:grid-cols-3">
        {testimonials.map((item) => (
          <figure
            key={item.name}
            className="flex flex-col rounded-lg border border-border bg-card p-6 shadow-card"
          >
            <Quote aria-hidden="true" className="size-5 text-primary" />

            {/* TODO: ganti rating asli bila ada */}
            <div className="mt-4 flex gap-0.5" aria-label="Rating 5 dari 5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  aria-hidden="true"
                  className="size-3.5 fill-accent text-primary"
                />
              ))}
            </div>

            <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-pretty text-muted-foreground">
              {item.quote}
            </blockquote>

            <figcaption className="mt-6 border-t border-border pt-4">
              <p className="text-sm font-semibold text-foreground">{item.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{item.role}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}

export default Testimonials;
