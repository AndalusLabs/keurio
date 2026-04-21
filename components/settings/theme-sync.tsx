"use client";

import { useEffect } from "react";
import {
  PREF_THEME,
  type ThemePreference,
} from "@/lib/preferences";

function resolveTheme(pref: ThemePreference): "light" | "dark" {
  if (pref === "system") {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return pref;
}

/** Apply <html> dark class from localStorage (client-only). */
export function applyStoredTheme() {
  if (typeof document === "undefined") return;
  const raw = (localStorage.getItem(PREF_THEME) as ThemePreference | null) ?? "system";
  const mode = resolveTheme(raw);
  document.documentElement.classList.toggle("dark", mode === "dark");
}

/** Applies theme class on <html> from localStorage (runs once on load + on storage events). */
export function ThemeSync() {
  useEffect(() => {
    function apply() {
      applyStoredTheme();
    }

    apply();

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onMq = () => {
      const raw = (localStorage.getItem(PREF_THEME) as ThemePreference | null) ?? "system";
      if (raw === "system") apply();
    };
    mq.addEventListener("change", onMq);

    const onStorage = (e: StorageEvent) => {
      if (e.key === PREF_THEME || e.key === null) apply();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      mq.removeEventListener("change", onMq);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return null;
}
