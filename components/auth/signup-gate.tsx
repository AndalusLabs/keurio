"use client";

import { useSearchParams } from "next/navigation";
import { z } from "zod";
import { InviteSignupForm } from "@/components/auth/invite-signup-form";
import { SignupOnboardingClient } from "@/components/auth/signup-onboarding-client";
import { inviteTokenFromPath, safePostAuthPath } from "@/lib/utils/auth-redirect";

export function SignupGate() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email");
  const inviteNext = safePostAuthPath(searchParams.get("next"));
  const token = inviteNext ? inviteTokenFromPath(inviteNext) : null;
  const parsed = emailParam ? z.string().email().safeParse(emailParam.trim()) : null;

  if (parsed?.success && inviteNext && token) {
    return <InviteSignupForm initialEmail={parsed.data} nextPath={inviteNext} />;
  }

  return <SignupOnboardingClient />;
}
