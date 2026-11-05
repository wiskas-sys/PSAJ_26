import { cn } from "@/lib/utils";

import { stats } from "@/components/landing/data";

/**
 * StatsBar: strip angka pencapaian, empat kolom.
 * Datar dan tanpa kartu agar tidak bersaing dengan section utama.
 *
 * Pembatas: dua baris di mobile (2 kolom), satu baris di desktop.
 * `lg:divide-x` dipakai untuk desktop, sedangkan `max-lg:*` untuk
 * pemisah baris dan kolom agar tidak ada border yang tumpang tindih.
 */
export function StatsBar() {
  return (
    <section
      aria-label="Angka pencapaian"
      className="border-y border-border bg-card/40"
    >
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <dl className="grid grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-border">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={cn(
                "py-8 sm:py-10 lg:px-8 lg:first:pl-0 lg:last:pr-0",
                // pemisah vertikal untuk grid dua kolom di bawah lg
                index % 2 === 1 &&
                  "max-lg:border-l max-lg:border-border max-lg:pl-5 sm:max-lg:pl-6",
                // pemisah horizontal untuk baris pertama di bawah lg
                index < 2 && "max-lg:border-b max-lg:border-border"
              )}
            >
              <dd className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {stat.value}
              </dd>
              <dt className="mt-2 text-sm leading-snug text-muted-foreground">
                {stat.label}
              </dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export default StatsBar;
