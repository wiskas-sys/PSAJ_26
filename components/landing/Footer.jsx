"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, Sparkles, MessageCircle, Phone, Mail, MapPin } from "lucide-react";

import { Logo } from "@/components/landing/Logo";
import { company, navLinks, whatsappLink } from "@/components/landing/data";
import { StaffGateModal } from "@/components/landing/StaffGateModal";

/**
 * Footer: logo, ringkasan workshop, navigasi publik, dan tombol akses terproteksi staf.
 */
export function Footer() {
  const [gateOpen, setGateOpen] = useState(false);

  return (
    <>
      <footer className="border-t border-border bg-card/40">
        <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Link href="/">
                <Logo />
              </Link>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {company.tagline}
              </p>

              <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs text-primary font-medium">
                <Sparkles className="size-3.5" />
                <span>AI Diagnostik Aktif 24 Jam</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-foreground uppercase">
                Navigasi &amp; Fitur
              </p>
              <ul className="mt-4 space-y-2.5">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline inline-flex items-center gap-1.5"
                    >
                      {link.badge && <Sparkles className="size-3 text-primary" />}
                      <span>{link.label}</span>
                      {link.badge && (
                        <span className="rounded bg-primary/20 px-1 py-0.2 text-[9px] font-bold text-primary">
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
                <li>
                  <a
                    href={whatsappLink("Halo Bengkel Dian Motor, saya ingin konsultasi servis.")}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-emerald-500 hover:underline inline-flex items-center gap-1.5"
                  >
                    <MessageCircle className="size-3.5 text-emerald-500" />
                    <span>Booking Langsung WhatsApp</span>
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-foreground uppercase">
                Kontak &amp; Workshop
              </p>
              <address className="mt-4 space-y-2.5 text-sm not-italic text-muted-foreground">
                <p className="flex items-start gap-2">
                  <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
                  <span>{company.address}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="size-4 text-primary shrink-0" />
                  <a
                    href={`tel:${company.whatsapp}`}
                    className="underline-offset-4 hover:text-foreground hover:underline"
                  >
                    {company.phoneDisplay}
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="size-4 text-primary shrink-0" />
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
              &copy; {new Date().getFullYear()} {company.name}. Sistem Inventori &amp; Diagnosa Motor Terintegrasi.
            </p>

            <div className="flex items-center gap-3">
              {/* Tombol Terproteksi Verifikasi 2 Pola untuk Staf / Owner */}
              <button
                type="button"
                onClick={() => setGateOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/50 hover:bg-muted hover:text-foreground cursor-pointer"
                title="Akses khusus Staf Kasir & Owner Dian Motor (Dilindungi PIN + Pola)"
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
