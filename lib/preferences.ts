/** Client-only preference keys (localStorage). */

export const PREF_THEME = "keurio-theme"; // "light" | "dark" | "system"
export const PREF_LOCALE = "keurio-locale"; // "nl" | "en"
export const PREF_TIMEZONE = "keurio-timezone"; // IANA string e.g. Europe/Amsterdam

export type ThemePreference = "light" | "dark" | "system";
export type LocalePreference = "nl" | "en";

export const COMMON_TIMEZONES = [
  { value: "Europe/Amsterdam", label: "Europe/Amsterdam (CET)" },
  { value: "Europe/Brussels", label: "Europe/Brussels (CET)" },
  { value: "Europe/London", label: "Europe/London (GMT/BST)" },
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "America/New York (ET)" },
  { value: "America/Los_Angeles", label: "America/Los Angeles (PT)" },
] as const;
