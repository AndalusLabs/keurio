"use client";

import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { acceptInvite } from "@/lib/actions/team";
import { useRouter } from "next/navigation";

export function InviteAcceptClient({ token }: { token: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void (async () => {
      setPending(true);
      const res = await acceptInvite(token);
      setPending(false);
      if (res.error) {
        toast({ title: "Invite failed", description: res.error, variant: "destructive" });
        return;
      }
      toast({ title: "Welcome to the organization" });
      router.push("/dashboard");
      router.refresh();
    })();
  }, [router, token]);

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="text-center">
        <div className="mx-auto grid h-12 w-12 place-content-center rounded-xl bg-accent/60 text-primary">
          <Building2 className="h-6 w-6" aria-hidden />
        </div>
        <CardTitle className="text-xl text-primary">Accepting invite…</CardTitle>
        <CardDescription>
          {pending ? "This takes a moment." : "If you are not redirected, use the button below."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          type="button"
          className="w-full"
          onClick={() => router.push("/dashboard")}
          disabled={pending}
        >
          Go to dashboard
        </Button>
      </CardContent>
    </Card>
  );
}

