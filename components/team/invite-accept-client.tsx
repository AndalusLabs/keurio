"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { acceptInvite } from "@/lib/actions/team";
import { useRouter } from "next/navigation";

export function InviteAcceptClient({
  token,
  organizationName,
}: {
  token: string;
  organizationName: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "error">("loading");

  useEffect(() => {
    void (async () => {
      const res = await acceptInvite(token);
      if ("error" in res && res.error) {
        setStatus("error");
        toast({ title: "Could not join", description: res.error, variant: "destructive" });
        return;
      }
      if ("ok" in res && res.ok) {
        toast({
          title: `Welcome to ${res.organizationName}!`,
          description: "You're in.",
        });
      }
      router.replace("/dashboard");
      router.refresh();
    })();
  }, [router, token]);

  if (status === "error") {
    return (
      <Card className="w-full border-[#0f3e18]/15 shadow-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-semibold text-[#0f3e18]">Could not complete</CardTitle>
          <CardDescription>Try the invite link again or contact your admin.</CardDescription>
        </CardHeader>
        <div className="px-6 pb-6">
          <Button type="button" className="w-full bg-[#0f3e18] text-[#b2dbb8] hover:bg-[#0f3e18]/90" asChild>
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full border-[#0f3e18]/15 shadow-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-semibold text-[#0f3e18]">Joining {organizationName}…</CardTitle>
        <CardDescription>Taking you to your workspace.</CardDescription>
      </CardHeader>
    </Card>
  );
}
