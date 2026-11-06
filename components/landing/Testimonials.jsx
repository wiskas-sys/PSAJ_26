import { MessageCircle, Quote } from "lucide-react";

import { Section } from "@/components/landing/Section";
import { testimonials, whatsappLink } from "@/components/landing/data";

/**
 * Testimonials: data contoh sementara sampai ulasan asli pelanggan tersedia.
 */
export function Testimonials() {
  return (
    <Section
      id="testimoni"
      eyebrow="Testimoni"
      title="Cerita dari pelanggan"
      lead="Data di bawah masih contoh sementara. Ulasan asli akan menggantikan bagian ini setelah pelanggan memberi izin."
    >
      <div className="grid gap-5 lg:grid-cols-3">
        {testimonials.map((item) => (
          <figure
            key={item.name}
            className="flex flex-col rounded-lg border border-border bg-card p-6 shadow-card"
          >
            <div className="flex items-center justify-between">
              <Quote aria-hidden="true" className="size-5 text-primary" />
              {item.dummy ? (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  Contoh
                </span>
              ) : null}
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

      <a
        href={whatsappLink(
          "Halo Dian Motor, saya ingin mengirim testimoni setelah servis."
        )}
        target="_blank"
        rel="noreferrer noopener"
        className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        <MessageCircle className="size-4" />
        Kirim testimoni via WhatsApp
      </a>
    </Section>
  );
}

export default Testimonials;
