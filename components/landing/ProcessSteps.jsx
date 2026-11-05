import { Section } from "@/components/landing/Section";
import { processSteps } from "@/components/landing/data";

/**
 * ProcessSteps: empat langkah bernomor, dihubungkan garis pada layout desktop.
 * TODO: ganti data asli — daftar langkah ada di components/landing/data.js
 */
export function ProcessSteps() {
  return (
    <Section
      id="alur"
      eyebrow="Alur kerja"
      title="Empat langkah, tidak ada kejutan di tengah"
    >
      <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {processSteps.map((step, index) => (
          <li key={step.title} className="relative">
            {/* garis penghubung di desktop */}
            {index < processSteps.length - 1 ? (
              <span
                aria-hidden="true"
                className="absolute top-4 left-[2.125rem] hidden h-px w-[calc(100%-1rem)] bg-border lg:block"
              />
            ) : null}

            <span className="relative flex size-9 items-center justify-center rounded-md border border-primary bg-background font-heading text-sm font-bold text-primary">
              {/* TODO: nomor langkah, urutan sudah benar */}
              {index + 1}
            </span>

            <h3 className="mt-4 font-heading text-base font-semibold text-foreground">
              {step.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {step.description}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

export default ProcessSteps;
