"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/landing/Logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { navLinks, whatsappLink } from "@/components/landing/data";

/**
 * Header sticky dengan penanda section aktif saat halaman di-scroll.
 */
export function Header() {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const ids = navLinks
      .map((link) => link.href.split("#")[1])
      .filter(Boolean);

    function onScroll() {
      setScrolled(window.scrollY > 8);

      let current = "";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 96) {
          current = id;
        }
      }
      setActiveId(current);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function isActive(href) {
    return href.split("#")[1] === activeId;
  }

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-5">
      <div
        className={cn(
          "mx-auto w-full max-w-6xl rounded-full border border-border bg-card/90 backdrop-blur-md transition-shadow duration-200",
          scrolled ? "shadow-lg shadow-black/5" : "shadow-sm"
        )}
      >
        <div className="flex h-14 items-center justify-between gap-3 pl-4 pr-2 sm:pl-5 sm:pr-3">
          <Link href="/" className="shrink-0" aria-label="DIAN MOTOR, ke beranda">
            <Logo />
          </Link>

          <nav aria-label="Navigasi utama" className="hidden items-center gap-1 xl:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "location" : undefined}
                className={cn(
                  "rounded-full px-3 py-2 text-[13px] font-medium transition-colors",
                  isActive(link.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle className="size-9 rounded-full" />

            <Button
              asChild
              className="hidden h-9 rounded-full px-4 text-xs font-semibold cursor-pointer sm:inline-flex"
            >
              <Link href="/konsultasi-ai">AI Diagnosa</Link>
            </Button>

            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls="menu-mobile"
              aria-label={open ? "Tutup menu" : "Buka menu"}
              className="inline-flex size-9 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-muted xl:hidden cursor-pointer"
            >
              {open ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>
      </div>

      {open ? (
        <div
          id="menu-mobile"
          className="mx-auto mt-2 w-full max-w-6xl rounded-3xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur-md xl:hidden animate-in slide-in-from-top-2 duration-150"
        >
          <nav
            aria-label="Navigasi mobile"
            className="flex w-full flex-col gap-1"
          >
            <Button asChild className="mb-2 h-11 w-full rounded-full cursor-pointer">
              <Link href="/konsultasi-ai" onClick={() => setOpen(false)}>
                AI Diagnosa Motor
              </Link>
            </Button>

            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(link.href) ? "location" : undefined}
                className={cn(
                  "rounded-full px-4 py-2.5 text-sm font-medium transition-colors",
                  isActive(link.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {link.label}
              </a>
            ))}

            <a
              href={whatsappLink("Halo Dian Motor, saya ingin bertanya.")}
              target="_blank"
              rel="noreferrer noopener"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-emerald-500/40 hover:text-emerald-500"
            >
              Chat via WhatsApp
            </a>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

export default Header;
