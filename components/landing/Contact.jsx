import Image from "next/image";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { Section } from "@/components/landing/Section";
import {
  businessHours,
  company,
  contactImage,
  whatsappLink,
} from "@/components/landing/data";

/**
 * Contact: detail workshop, tombol WhatsApp, jam buka, dan slot peta.
 */
export function Contact() {
  return (
    <Section
      id="kontak"
      eyebrow="Kontak"
      title="Datang atau chat, terserah mana"
      lead="Bawa motor langsung ke workshop, atau chat dulu kalau mau memastikan komponennya tersedia."
    >
      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        {/* Kolom detail */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-7">
          <ul className="space-y-6">
            <li className="flex gap-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-background text-primary">
                <MapPin className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Alamat Workshop</p>
                <p className="mt-1 text-sm font-bold text-foreground">DIAN MOTOR</p>
                <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                  {company.address}
                </p>
                <a
                  href={company.mapsLink}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 hover:underline"
                >
                  <span>Buka di Google Maps</span>
                  <span aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </li>

            <li className="flex gap-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-background text-primary">
                <Phone className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Telepon &amp; WhatsApp</p>
                <a
                  href={`tel:${company.whatsapp}`}
                  className="mt-1 block text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  {company.phoneDisplay}
                </a>
              </div>
            </li>

            <li className="flex gap-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-background text-primary">
                <Mail className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Email</p>
                <a
                  href={`mailto:${company.email}`}
                  className="mt-1 block break-all text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  {company.email}
                </a>
              </div>
            </li>

            <li className="flex gap-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-background text-primary">
                <Clock className="size-4" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Jam Operasional</p>
                <div className="mt-2 space-y-2">
                  {businessHours.map((row) => (
                    <div
                      key={row.day}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3 rounded-lg border border-border/50 bg-muted/40 px-3 py-2 text-xs sm:text-sm"
                    >
                      <span className="font-medium text-muted-foreground">{row.day}</span>
                      <span className="font-bold text-foreground sm:text-right shrink-0">{row.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </li>
          </ul>

          {/* Tombol WhatsApp: Flex horizontal rapi, icon tidak bertumpuk */}
          <a
            href={whatsappLink("Halo Dian Motor, saya mau tanya layanan yang tersedia.")}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-7 flex h-11 w-full items-center justify-center gap-2.5 rounded-xl bg-primary px-6 text-sm font-bold text-white shadow-md transition-all hover:bg-primary/90 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <MessageCircle className="size-5 shrink-0 text-white" />
            <span>Chat via WhatsApp</span>
          </a>
        </div>

        {/* Slot peta */}
        <div className="flex flex-col gap-4">
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <iframe
              src={company.mapsEmbed}
              title="Lokasi Bengkel Dian Motor Bumiayu"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-0"
            />
          </div>

          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <Image
              src={contactImage.src}
              alt={contactImage.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 620px"
              className="object-cover"
            />
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground">
            Parkir tersedia di depan workshop. Kalau datang di jam sibuk, Anda bisa chat
            terlebih dahulu lewat WhatsApp supaya kami siapkan rak dan mekanik.
          </p>
        </div>
      </div>
    </Section>
  );
}
