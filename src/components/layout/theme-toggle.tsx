"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark";

function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(stored === "light" || stored === "dark" ? stored : getSystemTheme());
  }, []);

  function apply(next: Theme) {
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  }

  if (!theme) return null;

  if (compact) {
    return (
      <button
        onClick={() => apply(theme === "light" ? "dark" : "light")}
        aria-label="Toggle dark mode"
        className="rounded-full p-2 hover:bg-surface-muted"
      >
        {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl bg-surface-muted p-1">
      {(["light", "dark"] as const).map((t) => (
        <button
          key={t}
          onClick={() => apply(t)}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium capitalize transition-colors",
            theme === t ? "bg-surface shadow text-brand-primary" : "text-foreground/50"
          )}
        >
          {t === "light" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          {t}
        </button>
      ))}
    </div>
  );
}
