"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function InviteGuestClient({
  token,
  invitedEmail,
  organizationName,
}: {
  token: string;
  invitedEmail: string;
  organizationName: string;
}) {
  const next = encodeURIComponent(`/invite/${token}`);
  const signupHref = `/signup?email=${encodeURIComponent(invitedEmail)}&next=${next}`;
  const loginHref = `/login?next=${next}&email=${encodeURIComponent(invitedEmail)}`;

  return (
    <Card className="w-full border-[#0f3e18]/15 shadow-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-semibold text-[#0f3e18]">
          You&apos;ve been invited to join {organizationName}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Button type="button" className="w-full bg-[#0f3e18] text-[#b2dbb8] hover:bg-[#0f3e18]/90" asChild>
          <Link href={signupHref}>Create account</Link>
        </Button>
        <Button type="button" variant="outline" className="w-full border-[#0f3e18]/25" asChild>
          <Link href={loginHref}>Sign in</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
