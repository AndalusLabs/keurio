"use client";

import { useEffect } from "react";
import { PREF_LOCALE, type LocalePreference } from "@/lib/preferences";

/** Sets document.lang from localStorage (default en). */
export function LocaleSync() {
  useEffect(() => {
    function apply() {
      const raw = (localStorage.getItem(PREF_LOCALE) as LocalePreference | null) ?? "en";
      document.documentElement.lang = raw === "nl" ? "nl" : "en";
    }
    apply();
    window.addEventListener("storage", apply);
    return () => window.removeEventListener("storage", apply);
  }, []);

  return null;
}
