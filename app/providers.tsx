"use client";

import { LocaleSync } from "@/components/settings/locale-sync";
import { ThemeSync } from "@/components/settings/theme-sync";
import { Toaster } from "@/components/ui/toaster";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ThemeSync />
      <LocaleSync />
      {children}
      <Toaster />
    </>
  );
}
