import { Resend } from "resend";

export function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("Missing RESEND_API_KEY");
  }
  return new Resend(key);
}

/** Resend test sender — works without a verified domain. Override with RESEND_FROM when you add your own domain. */
export function getResendFrom() {
  return process.env.RESEND_FROM ?? "Keurio <onboarding@resend.dev>";
}

