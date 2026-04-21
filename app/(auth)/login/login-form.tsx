"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { safePostAuthPath } from "@/lib/utils/auth-redirect";
import { createClient } from "@/lib/supabase/client";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "At least 6 characters"),
});

type SignInForm = z.infer<typeof signInSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextRaw = searchParams.get("next");
  const nextPath = safePostAuthPath(nextRaw);
  const emailFromUrl = searchParams.get("email")?.trim() ?? "";
  const signupHref =
    nextPath && emailFromUrl
      ? `/signup?email=${encodeURIComponent(emailFromUrl)}&next=${encodeURIComponent(nextPath)}`
      : nextPath
        ? `/signup?next=${encodeURIComponent(nextPath)}`
        : "/signup";

  const form = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: emailFromUrl, password: "" },
  });

  async function onSubmit(values: SignInForm) {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    if (error) {
      toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
      return;
    }
    const dest = nextPath ?? "/dashboard";
    router.push(dest);
    router.refresh();
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
          <CardTitle className="text-xl">Welcome to Keurio</CardTitle>
          <CardDescription>Sign in to run inspections and generate reports.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                {...form.register("email")}
              />
              {form.formState.errors.email ? (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...form.register("password")}
              />
              {form.formState.errors.password ? (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              ) : null}
            </div>
            <Button type="submit" className="w-full" size="lg">
              Sign in
            </Button>
            <Button type="button" variant="outline" className="w-full" asChild>
              <Link href={signupHref}>Sign up</Link>
            </Button>
          </form>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing you agree to your organization&apos;s data policies.
          </p>
        </CardContent>
      </Card>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link
          href="/dashboard"
          className="text-primary underline-offset-4 hover:underline"
        >
          Back to app
        </Link>
      </p>
    </motion.div>
  );
}
