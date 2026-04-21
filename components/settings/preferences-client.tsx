"use client";

import { useEffect, useState } from "react";
import {
  COMMON_TIMEZONES,
  PREF_LOCALE,
  PREF_THEME,
  PREF_TIMEZONE,
  type LocalePreference,
  type ThemePreference,
} from "@/lib/preferences";
import { applyStoredTheme } from "@/components/settings/theme-sync";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function PreferencesClient() {
  const [locale, setLocale] = useState<LocalePreference>("en");
  const [timezone, setTimezone] = useState("Europe/Amsterdam");
  const [theme, setTheme] = useState<ThemePreference>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setLocale((localStorage.getItem(PREF_LOCALE) as LocalePreference | null) ?? "en");
    setTimezone(localStorage.getItem(PREF_TIMEZONE) ?? "Europe/Amsterdam");
    setTheme((localStorage.getItem(PREF_THEME) as ThemePreference | null) ?? "system");
  }, []);

  function persistLocale(next: LocalePreference) {
    setLocale(next);
    localStorage.setItem(PREF_LOCALE, next);
    document.documentElement.lang = next === "nl" ? "nl" : "en";
  }

  function persistTimezone(next: string) {
    setTimezone(next);
    localStorage.setItem(PREF_TIMEZONE, next);
  }

  function persistTheme(next: ThemePreference) {
    setTheme(next);
    localStorage.setItem(PREF_THEME, next);
    applyStoredTheme();
  }

  if (!mounted) {
    return (
      <div className="h-40 animate-pulse rounded-lg bg-muted/50" aria-hidden />
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Preferences
        </h1>
        <p className="mt-1 text-sm text-muted-foreground md:text-base">
          Language, time zone and appearance. Stored on this device.
        </p>
      </div>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Language</CardTitle>
          <CardDescription>Interface language preference.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={locale === "en" ? "default" : "outline"}
              className={cn(locale === "en" && "bg-primary text-primary-foreground")}
              onClick={() => persistLocale("en")}
            >
              English
            </Button>
            <Button
              type="button"
              variant={locale === "nl" ? "default" : "outline"}
              className={cn(locale === "nl" && "bg-primary text-primary-foreground")}
              onClick={() => persistLocale("nl")}
            >
              Nederlands
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Time zone</CardTitle>
          <CardDescription>Used for dates and times in the app.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="tz">Region</Label>
          <Select value={timezone} onValueChange={persistTimezone}>
            <SelectTrigger id="tz" className="max-w-md">
              <SelectValue placeholder="Select time zone" />
            </SelectTrigger>
            <SelectContent>
              {COMMON_TIMEZONES.map((z) => (
                <SelectItem key={z.value} value={z.value}>
                  {z.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Theme</CardTitle>
          <CardDescription>Light, dark, or match your system.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["light", "Light"],
                ["dark", "Dark"],
                ["system", "System"],
              ] as const
            ).map(([value, label]) => (
              <Button
                key={value}
                type="button"
                variant={theme === value ? "default" : "outline"}
                className={cn(theme === value && "bg-primary text-primary-foreground")}
                onClick={() => persistTheme(value)}
              >
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
