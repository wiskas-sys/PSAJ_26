"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/landing/Logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { navLinks } from "@/components/landing/data";

/**
 * Header sticky: garis aksen 2px di atas, logo + nav,
 * dan tombol hubungi kami untuk pengunjung publik.
 */
export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      <div aria-hidden="true" className="h-0.5 w-full bg-primary" />

      <div className="border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-[76px] w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <a href="#atas" className="shrink-0" aria-label="DIAN MOTOR, ke atas">
            <Logo />
          </a>

          <nav
            aria-label="Navigasi utama"
            className="hidden items-center gap-7 lg:flex"
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

          <div className="flex items-center gap-2">
            <ThemeToggle className="size-9 rounded-lg" />

            <Button asChild className="hidden h-9 px-4 sm:inline-flex">
              <a href="#kontak">Hubungi Kami</a>
            </Button>

            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls="menu-mobile"
              aria-label={open ? "Tutup menu" : "Buka menu"}
              className="inline-flex size-9 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-muted lg:hidden"
            >
              {open ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>
      </div>

      {open ? (
        <div
          id="menu-mobile"
          className="border-b border-border bg-background lg:hidden"
        >
          <nav
            aria-label="Navigasi mobile"
            className="mx-auto flex w-full max-w-6xl flex-col px-5 py-2 sm:px-8"
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "border-b border-border/60 py-3 text-sm font-medium text-muted-foreground last:border-b-0",
                  "transition-colors hover:text-foreground"
                )}
              >
                {link.label}
              </a>
            ))}
            <Button asChild className="mt-4 mb-2 h-10 w-full">
              <a href="#kontak" onClick={() => setOpen(false)}>
                Hubungi Kami
              </a>
            </Button>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

export default Header;
