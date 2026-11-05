"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Sparkles, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/landing/Logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { navLinks, whatsappLink } from "@/components/landing/data";

/**
 * Header sticky: bersih, proporsional, tanpa penumpukan teks.
 */
export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      <div aria-hidden="true" className="h-0.5 w-full bg-primary" />

      <div className="border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-[72px] w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="shrink-0" aria-label="DIAN MOTOR, ke beranda">
            <Logo />
          </Link>

          {/* Desktop Nav Links */}
          <nav
            aria-label="Navigasi utama"
            className="hidden items-center gap-6 lg:flex"
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">
            <ThemeToggle className="size-9 rounded-lg" />

            {/* Standout AI Button */}
            <Button
              asChild
              className="h-9 rounded-full px-3.5 bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold text-xs shadow-sm hover:brightness-110 cursor-pointer"
            >
              <Link href="/konsultasi-ai" className="flex items-center gap-1.5">
                <Sparkles className="size-3.5 animate-pulse text-amber-200" />
                <span>AI Diagnosa</span>
                <span className="rounded-full bg-black/25 px-1.5 py-0.2 text-[9px] font-bold">
                  24 Jam
                </span>
              </Link>
            </Button>

            <Button
              asChild
              size="sm"
              variant="outline"
              className="hidden xl:inline-flex h-9 px-4 border-border text-xs font-semibold cursor-pointer"
            >
              <a href="/#kontak">Hubungi Kami</a>
            </Button>

            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls="menu-mobile"
              aria-label={open ? "Tutup menu" : "Buka menu"}
              className="inline-flex size-9 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-muted lg:hidden cursor-pointer"
            >
              {open ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {open ? (
        <div
          id="menu-mobile"
          className="border-b border-border bg-background lg:hidden animate-in slide-in-from-top-2 duration-150"
        >
          <nav
            aria-label="Navigasi mobile"
            className="mx-auto flex w-full max-w-6xl flex-col px-5 py-3 space-y-1"
          >
            <Link
              href="/konsultasi-ai"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-bold text-primary my-1"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <span>AI Diagnosa Motor</span>
              </div>
              <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                Aktif 24 Jam
              </span>
            </Link>

            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "border-b border-border/50 py-2.5 text-sm font-medium text-muted-foreground last:border-b-0",
                  "transition-colors hover:text-foreground"
                )}
              >
                {link.label}
              </a>
            ))}

            <div className="pt-3 pb-2">
              <Button asChild variant="outline" className="h-10 w-full cursor-pointer">
                <a href="/#kontak" onClick={() => setOpen(false)}>
                  Hubungi Workshop
                </a>
              </Button>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

export default Header;
