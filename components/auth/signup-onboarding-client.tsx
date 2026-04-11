"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { finishSignupOnboarding } from "@/lib/actions/onboarding";
import { createClient } from "@/lib/supabase/client";

const emailSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
});

const profileSchema = z.object({
  organizationName: z.string().min(2, "Organization name is required"),
  fullName: z.string().min(2, "Name is required"),
});

const otpSchema = z.object({
  code: z.string().min(4, "Enter the code from your email"),
});

type EmailForm = z.infer<typeof emailSchema>;
type ProfileForm = z.infer<typeof profileSchema>;
type OtpForm = z.infer<typeof otpSchema>;

type Step = "intro" | "email" | "verify" | "profile" | "welcome";

export function SignupOnboardingClient() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("intro");
  const [busy, setBusy] = useState(false);
  const [signedUpEmail, setSignedUpEmail] = useState("");
  const [pendingPassword, setPendingPassword] = useState("");

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "", password: "" },
  });

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { organizationName: "", fullName: "" },
  });
  const otpForm = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: { code: "" },
  });

  async function submitEmail(values: EmailForm) {
    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
    });
    setBusy(false);

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
        toast({
          title: "Email already in use",
          description: "Use another email or sign in.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Could not create account", description: error.message, variant: "destructive" });
      }
      return;
    }

    // Supabase can return a user with empty identities when email is already registered.
    const identities = (data.user as { identities?: unknown[] } | null)?.identities ?? [];
    if (data.user && identities.length === 0) {
      toast({
        title: "Email already in use",
        description: "Use another email or sign in.",
        variant: "destructive",
      });
      return;
    }

    setSignedUpEmail(values.email);
    setPendingPassword(values.password);

    if (data.session) {
      setStep("profile");
      return;
    }

    // If email confirmation is enabled, session is null until user verifies.
    setStep("verify");
  }

  async function continueAfterVerification(values: OtpForm) {
    if (!signedUpEmail) return;
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email: signedUpEmail,
      token: values.code.trim(),
      type: "signup",
    });
    setBusy(false);

    if (error) {
      toast({
        title: "Invalid code",
        description: "Check the code from your email and try again.",
        variant: "destructive",
      });
      return;
    }
    setStep("profile");
  }

  async function submitProfile(values: ProfileForm) {
    setBusy(true);
    const res = await finishSignupOnboarding({
      organizationName: values.organizationName,
      fullName: values.fullName,
    });
    setBusy(false);

    if (res.error) {
      toast({ title: "Could not finish setup", description: res.error, variant: "destructive" });
      return;
    }
    setStep("welcome");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md"
    >
      <div className="mb-8 flex justify-center">
        <Logo withLink={false} height={40} />
      </div>
      <Card className="border-border/80 shadow-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-xl text-primary">
            {step === "intro" && "Create your Workspace"}
            {step === "email" && "Continue with Email"}
            {step === "verify" && "Confirm your email"}
            {step === "profile" && "Tell us about your workspace"}
            {step === "welcome" && "Welcome to Keurio"}
          </CardTitle>
          <CardDescription>
            {step === "intro" && "Set up your workspace in a few quick steps."}
            {step === "email" && "Use your email and a secure password."}
            {step === "verify" && "We sent a verification code to your inbox."}
            {step === "profile" && "Add your organization and your name."}
            {step === "welcome" && "Your workspace is ready."}
          </CardDescription>
          {step === "intro" ? (
            <div className="mx-auto mb-2 grid h-12 w-12 place-content-center rounded-xl bg-accent/60 text-primary">
              <Building2 className="h-6 w-6" aria-hidden />
            </div>
          ) : null}
        </CardHeader>
        <CardContent>
          {step === "intro" ? (
            <div className="space-y-3">
              <Button className="w-full" size="lg" onClick={() => setStep("email")}>
                Continue with Email
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/login">I already have an account</Link>
              </Button>
            </div>
          ) : null}

          {step === "email" ? (
            <form className="space-y-4" onSubmit={emailForm.handleSubmit(submitEmail)}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" {...emailForm.register("email")} />
                {emailForm.formState.errors.email ? (
                  <p className="text-xs text-destructive">{emailForm.formState.errors.email.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" autoComplete="new-password" {...emailForm.register("password")} />
                {emailForm.formState.errors.password ? (
                  <p className="text-xs text-destructive">{emailForm.formState.errors.password.message}</p>
                ) : null}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep("intro")}>
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={busy}>
                  {busy ? "Creating…" : "Continue"}
                </Button>
              </div>
            </form>
          ) : null}

          {step === "profile" ? (
            <form className="space-y-4" onSubmit={profileForm.handleSubmit(submitProfile)}>
              <div className="space-y-2">
                <Label htmlFor="organizationName">Organization Name</Label>
                <Input id="organizationName" {...profileForm.register("organizationName")} />
                {profileForm.formState.errors.organizationName ? (
                  <p className="text-xs text-destructive">{profileForm.formState.errors.organizationName.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Name</Label>
                <Input id="fullName" {...profileForm.register("fullName")} />
                {profileForm.formState.errors.fullName ? (
                  <p className="text-xs text-destructive">{profileForm.formState.errors.fullName.message}</p>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">Signed up as {signedUpEmail}</p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep("email")}>
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={busy}>
                  {busy ? "Saving…" : "Continue"}
                </Button>
              </div>
            </form>
          ) : null}

          {step === "verify" ? (
            <form className="space-y-4" onSubmit={otpForm.handleSubmit(continueAfterVerification)}>
              <p className="text-sm text-muted-foreground">
                We sent a code to <span className="font-medium text-foreground">{signedUpEmail}</span>.
                Enter the code to continue.
              </p>
              <div className="space-y-2">
                <Label htmlFor="otpCode">Verification code</Label>
                <Input
                  id="otpCode"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="e.g. 123456"
                  {...otpForm.register("code")}
                />
                {otpForm.formState.errors.code ? (
                  <p className="text-xs text-destructive">{otpForm.formState.errors.code.message}</p>
                ) : null}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep("email")}>
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={busy}>
                  {busy ? "Checking…" : "Continue"}
                </Button>
              </div>
            </form>
          ) : null}

          {step === "welcome" ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Start creating inspections, templates and reports.
              </p>
              <Button
                className="w-full"
                size="lg"
                onClick={() => {
                  router.push("/dashboard");
                  router.refresh();
                }}
              >
                Get Started
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}

