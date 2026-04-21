"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function InviteWrongAccountClient({
  token,
  invitedEmail,
  sessionEmail,
  organizationName,
}: {
  token: string;
  invitedEmail: string;
  sessionEmail: string;
  organizationName: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOutAndContinue() {
    setBusy(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    const next = encodeURIComponent(`/invite/${token}`);
    const href = `/signup?email=${encodeURIComponent(invitedEmail)}&next=${next}`;
    router.push(href);
    router.refresh();
  }

  return (
    <Card className="w-full border-[#0f3e18]/15 shadow-sm">
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="text-xl font-semibold text-[#0f3e18]">
          You&apos;ve been invited to join {organizationName}
        </CardTitle>
        <CardDescription className="text-pretty text-muted-foreground">
          This invite is for <span className="font-medium text-foreground">{invitedEmail}</span>. You are signed in
          as <span className="font-medium text-foreground">{sessionEmail}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          type="button"
          className="w-full bg-[#0f3e18] text-[#b2dbb8] hover:bg-[#0f3e18]/90"
          disabled={busy}
          onClick={() => void signOutAndContinue()}
        >
          {busy ? "Signing out…" : "Sign out and continue"}
        </Button>
      </CardContent>
    </Card>
  );
}
