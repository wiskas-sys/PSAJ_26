"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";

import { Logo } from "@/components/landing/Logo";
import { company, navLinks, whatsappLink } from "@/components/landing/data";
import { StaffGateModal } from "@/components/landing/StaffGateModal";

/**
 * Footer: logo, ringkasan, nav pengunjung, dan tombol akses terproteksi staf.
 */
export function Footer() {
  const [gateOpen, setGateOpen] = useState(false);

  return (
    <>
      <footer className="border-t border-border bg-card/40">
        <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Logo />
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {company.tagline}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                Halaman
              </p>
              <ul className="mt-4 space-y-2.5">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
                <li>
                  <a
                    href={whatsappLink()}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                  >
                    Konsultasi WhatsApp
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                Kontak & Lokasi
              </p>
              <address className="mt-4 space-y-2.5 text-sm not-italic text-muted-foreground">
                <p>{company.address}</p>
                <p>
                  <a
                    href={`tel:${company.whatsapp}`}
                    className="underline-offset-4 hover:text-foreground hover:underline"
                  >
                    {company.phoneDisplay}
                  </a>
                </p>
                <p>
                  <a
                    href={`mailto:${company.email}`}
                    className="break-all underline-offset-4 hover:text-foreground hover:underline"
                  >
                    {company.email}
                  </a>
                </p>
              </address>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {company.name}. Hak cipta dilindungi undang-undang.
            </p>

            <div className="flex items-center gap-3">
              {/* Tombol Terproteksi Verifikasi 2 Pola untuk Staf / Owner */}
              <button
                type="button"
                onClick={() => setGateOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/50 hover:bg-muted hover:text-foreground cursor-pointer"
                title="Akses terbatas untuk Staf Kasir & Owner Dian Motor"
              >
                <Lock className="size-3 text-primary" />
                <span>Portal Staf &amp; Manajemen</span>
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal Verifikasi 2 Pola Keamanan (PIN + Pattern Lock 3x3) */}
      <StaffGateModal open={gateOpen} onClose={() => setGateOpen(false)} />
    </>
  );
}

export default Footer;
