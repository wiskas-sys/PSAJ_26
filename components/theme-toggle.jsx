"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";

export function ThemeToggle({ className }) {
  const { theme, setTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      aria-label="Ganti tema"
      className={cn(
        "grid size-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:text-foreground",
        className
      )}
    >
      <Moon className="size-4 dark:hidden" />
      <Sun className="hidden size-4 dark:block" />
    </button>
  );
}

export default ThemeToggle;
