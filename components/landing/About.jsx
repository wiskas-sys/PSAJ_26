import Image from "next/image";
import { ClipboardList, Package, Wrench } from "lucide-react";

import { Section } from "@/components/landing/Section";
import { aboutImage } from "@/components/landing/data";

const highlights = [
  { icon: Wrench, label: "Servis dan perbaikan" },
  { icon: Package, label: "Sparepart original" },
  { icon: ClipboardList, label: "Pencatatan stok digital" },
];

/**
 * About: dua paragraf tentang bengkel dan sistem pencatatan stok internal.
 * Layout dua kolom: teks di kiri, ringkasan poin di kanan (desktop).
 */
export function About() {
  return (
    <Section id="tentang" eyebrow="Tentang kami" title="Bengkel kecil, proses yang tercatat rapi">
      <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div className="space-y-5 text-base leading-relaxed text-muted-foreground">
          {/* TODO: ganti paragraf profil bengkel */}
          <p>
            Dian Motor berdiri sejak 2009 dan melayani motor bebek serta matic
            di sekitar workshop kami. Kami menjaga ruang lingkup kecil supaya
            setiap motor dikerjakan oleh teknisi yang sama, dan biaya yang
            muncul selalu disampaikan di muka.
          </p>

          {/* TODO: ganti paragraf tentang sistem inventori internal */}
          <p>
            Sejak 2022 kami memakai sistem inventori internal untuk mencatat
            setiap komponen yang keluar dan barang yang masuk dari supplier.
            Sparepart punya nomor rak, jumlah, dan riwayat pemakaian, sehingga
            ketersediaan stok bisa dicek sebelum motor dikerjakan.
          </p>

          {/* TODO: ganti paragraf penutup */}
          <p>
            Semua pekerjaan dicatat di nota, mulai dari komponen yang diganti
            sampai penyetelan akhir. Tidak ada bagian yang disembunyikan dari
            nota.
          </p>
        </div>

        <div className="flex flex-col gap-5">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-card shadow-card">
            <Image
              src={aboutImage.src}
              alt={aboutImage.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 460px"
              className="object-cover"
            />
          </div>

          <div className="rounded-lg border border-border bg-card p-6 shadow-card sm:p-7">
            <p className="text-sm font-semibold text-foreground">
              Ringkasan
            </p>

            <ul className="mt-6 space-y-4">
              {highlights.map((item) => (
                <li key={item.label} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-background text-primary">
                    <item.icon className="size-4" />
                  </span>
                  <span className="pt-1.5 text-sm font-medium text-foreground">
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-7 border-t border-border pt-6">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {/* TODO: ganti kalimat penutup kartu */}
                Punya pertanyaan soal komponen atau perkiraan biaya? Chat dulu,
                kami bantu jelaskan sebelum motor naik ke rak servis.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

export default About;
