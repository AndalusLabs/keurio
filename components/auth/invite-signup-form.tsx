"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { inviteTokenFromPath } from "@/lib/utils/auth-redirect";

const inviteFormSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  password: z.string().min(6, "At least 6 characters"),
});

type InviteForm = z.infer<typeof inviteFormSchema>;

export function InviteSignupForm({
  initialEmail,
  nextPath,
}: {
  initialEmail: string;
  nextPath: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [orgTitle, setOrgTitle] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "verify">("form");
  const [otp, setOtp] = useState("");

  const form = useForm<InviteForm>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: { firstName: "", lastName: "", password: "" },
  });

  useEffect(() => {
    const token = inviteTokenFromPath(nextPath);
    if (!token) {
      setOrgTitle(null);
      return;
    }
    const supabase = createClient();
    void supabase.rpc("peek_org_invite", { p_token: token }).then(({ data, error }) => {
      if (error || data == null) {
        setOrgTitle(null);
        return;
      }
      const row = Array.isArray(data) ? data[0] : data;
      if (!row || typeof row !== "object") {
        setOrgTitle(null);
        return;
      }
      const n = (row as { organization_name?: string | null }).organization_name?.trim();
      setOrgTitle(n || null);
    });
  }, [nextPath]);

  const title = orgTitle ? `Join ${orgTitle} on Keurio` : "Join your team on Keurio";

  async function onSubmit(values: InviteForm) {
    setBusy(true);
    const supabase = createClient();
    const fullName = `${values.firstName.trim()} ${values.lastName.trim()}`.trim();
    const { data, error } = await supabase.auth.signUp({
      email: initialEmail.trim(),
      password: values.password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    setBusy(false);

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
        toast({
          title: "Email already in use",
          description: "Sign in instead.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Could not create account", description: error.message, variant: "destructive" });
      }
      return;
    }

    const identities = (data.user as { identities?: unknown[] } | null)?.identities ?? [];
    if (data.user && identities.length === 0) {
      toast({
        title: "Email already in use",
        description: "Sign in instead.",
        variant: "destructive",
      });
      return;
    }

    if (data.session) {
      router.push(nextPath);
      router.refresh();
      return;
    }
    setStep("verify");
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email: initialEmail.trim(),
      token: otp.trim(),
      type: "signup",
    });
    setBusy(false);
    if (error) {
      toast({ title: "Invalid code", description: "Check your email and try again.", variant: "destructive" });
      return;
    }
    router.push(nextPath);
    router.refresh();
  }

  const loginHref = `/login?next=${encodeURIComponent(nextPath)}`;

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 flex justify-center">
        <Logo withLink={false} height={44} />
      </div>
      <Card className="border-[#0f3e18]/15 shadow-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-xl font-semibold text-[#0f3e18]">{title}</CardTitle>
          <CardDescription>Create your account to get started</CardDescription>
        </CardHeader>
        <CardContent>
          {step === "form" ? (
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={initialEmail}
                  readOnly
                  disabled
                  className="bg-muted/80 text-muted-foreground"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input id="firstName" autoComplete="given-name" {...form.register("firstName")} />
                  {form.formState.errors.firstName ? (
                    <p className="text-xs text-destructive">{form.formState.errors.firstName.message}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input id="lastName" autoComplete="family-name" {...form.register("lastName")} />
                  {form.formState.errors.lastName ? (
                    <p className="text-xs text-destructive">{form.formState.errors.lastName.message}</p>
                  ) : null}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
                {form.formState.errors.password ? (
                  <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
                ) : null}
              </div>
              <Button
                type="submit"
                className="w-full bg-[#0f3e18] text-[#b2dbb8] hover:bg-[#0f3e18]/90"
                disabled={busy}
              >
                {busy ? "Creating…" : "Create account & join"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href={loginHref} className="font-medium text-[#0f3e18] underline-offset-4 hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={verifyOtp}>
              <p className="text-sm text-muted-foreground">
                Enter the code we sent to <span className="font-medium text-foreground">{initialEmail}</span>.
              </p>
              <div className="space-y-2">
                <Label htmlFor="otp">Verification code</Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-[#0f3e18] text-[#b2dbb8] hover:bg-[#0f3e18]/90"
                disabled={busy}
              >
                {busy ? "Verifying…" : "Continue"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
