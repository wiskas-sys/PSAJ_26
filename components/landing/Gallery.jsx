import Image from "next/image";

import { Section } from "@/components/landing/Section";
import { galleryImages } from "@/components/landing/data";

/**
 * Gallery: dokumentasi workshop dalam grid responsif.
 * Daftar gambar dan alt ada di components/landing/data.js.
 */
export function Gallery() {
  return (
    <Section id="galeri" eyebrow="Galeri" title="Isi workshop kami">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {galleryImages.map((image) => (
          <div
            key={image.src}
            className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-card shadow-card"
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(max-width: 1024px) 50vw, 285px"
              className="object-cover"
            />
          </div>
        ))}
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        Foto: Unsplash dan Pexels.
      </p>
    </Section>
  );
}

export default Gallery;
