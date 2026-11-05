import { cn } from "@/lib/utils";

/**
 * Wrapper section standar: border-top tipis, container max-w-6xl,
 * dan blok judul dengan eyebrow label (teks uppercase mono warna primary).
 *
 * `id` dipakai untuk anchor link navigasi, `scroll-mt` mencegah judul
 * tertutup header yang sticky.
 */
export function Section({
  id,
  eyebrow,
  title,
  lead,
  children,
  className,
  headingClassName,
  childrenClassName,
}) {
  return (
    <section
      id={id}
      className={cn("scroll-mt-20 border-t border-border py-20 sm:py-24", className)}
    >
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        {eyebrow || title ? (
          <div className={cn("max-w-2xl", headingClassName)}>
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            {title ? (
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-balance text-foreground sm:text-4xl">
                {title}
              </h2>
            ) : null}
            {lead ? (
              <p className="mt-4 text-base leading-relaxed text-pretty text-muted-foreground">
                {lead}
              </p>
            ) : null}
          </div>
        ) : null}
        {children ? <div className={cn("mt-12", childrenClassName)}>{children}</div> : null}
      </div>
    </section>
  );
}

export default Section;
