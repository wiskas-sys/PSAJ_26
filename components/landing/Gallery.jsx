import Image from "next/image";

import { Section } from "@/components/landing/Section";
import { galleryImages } from "@/components/landing/data";

/**
 * Gallery: empat foto placeholder dari /public.
 * TODO: ganti data asli — ganti file gambar dan alt di components/landing/data.js
 * Ukuran gambar saat ini 1200x800 (4:3). Sesuaikan `sizes` bila rasio berubah.
 */
export function Gallery() {
  return (
    <Section id="galeri" eyebrow="Galeri" title="Isi workshop kami">
      <div className="grid gap-4 sm:grid-cols-2">
        {galleryImages.map((image, index) => (
          <div
            key={image.src}
            className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-card shadow-card"
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              priority={index === 0}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 576px"
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {/* TODO: ganti catatan galeri */}
      <p className="mt-8 text-sm text-muted-foreground">
        Foto di atas masih contoh. Ganti dengan dokumentasi workspace, rak
        sparepart, dan proses kerja yang sebenarnya.
      </p>
    </Section>
  );
}

export default Gallery;
