import Image from "next/image";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Section } from "@/components/landing/Section";
import {
  businessHours,
  company,
  contactImage,
  whatsappLink,
} from "@/components/landing/data";

/**
 * Contact: detail workshop, tombol WhatsApp, jam buka, dan slot peta.
 * TODO: ganti data asli — alamat, nomor, email, dan tautan peta ada di
 * components/landing/data.js pada objek `company`.
 */
export function Contact() {
  return (
    <Section
      id="kontak"
      eyebrow="Kontak"
      title="Datang atau chat, terserah mana"
      lead="Bawa motor langsung ke workshop, atau chat dulu kalau mau memastikan komponennya tersedia."
    >
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        {/* Kolom detail */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-card sm:p-7">
          <ul className="space-y-6">
            <li className="flex gap-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-background text-primary">
                <MapPin className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Alamat</p>
                {/* TODO: ganti alamat asli */}
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {company.address}
                </p>
                <a
                  href={company.mapsLink}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-2 inline-block text-sm text-primary underline-offset-4 hover:underline"
                >
                  {/* TODO: ganti label tautan peta */}
                  Lihat di Google Maps
                </a>
              </div>
            </li>

            <li className="flex gap-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-background text-primary">
                <Phone className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Telepon</p>
                {/* TODO: ganti nomor telepon asli */}
                <a
                  href={`tel:${company.whatsapp}`}
                  className="mt-1 block text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
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
                {/* TODO: ganti alamat email asli */}
                <a
                  href={`mailto:${company.email}`}
                  className="mt-1 block break-all text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  {company.email}
                </a>
              </div>
            </li>

            <li className="flex gap-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-background text-primary">
                <Clock className="size-4" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Jam buka</p>
                <dl className="mt-1 space-y-1">
                  {businessHours.map((row) => (
                    <div
                      key={row.day}
                      className="flex items-baseline justify-between gap-4 text-sm"
                    >
                      <dt className="text-muted-foreground">{row.day}</dt>
                      <dd className="text-right text-muted-foreground">{row.time}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </li>
          </ul>

          {/* TODO: ganti pesan bawaan WhatsApp */}
          <Button asChild className="mt-7 h-11 w-full px-6 text-[0.95rem]">
            <a
              href={whatsappLink("Halo Dian Motor, saya mau tanya layanan yang tersedia.")}
              target="_blank"
              rel="noreferrer noopener"
            >
              <MessageCircle data-icon="inline-start" />
              Chat via WhatsApp
            </a>
          </Button>
        </div>

        {/* Slot peta */}
        <div className="flex flex-col gap-4">
          <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-border bg-card shadow-card">
            {/* TODO: ganti src iframe dengan titik koordinat workshop asli */}
            <iframe
              src={company.mapsEmbed}
              title="Lokasi Dian Motor"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          </div>

          <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-border bg-card shadow-card">
            <Image
              src={contactImage.src}
              alt={contactImage.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 620px"
              className="object-cover"
            />
          </div>

          {/* TODO: ganti catatan lokasi */}
          <p className="text-sm leading-relaxed text-muted-foreground">
            Parkir tersedia di depan workshop. Kalau datang di jam sibuk, chat
            dulu supaya kami siapkan rak kerja.
          </p>
        </div>
      </div>
    </Section>
  );
}

export default Contact;
