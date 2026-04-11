"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Logo } from "@/components/shared/logo";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { createOrganization } from "@/lib/actions/onboarding";

const schema = z.object({
  name: z.string().min(2, "Please enter a name"),
});

type FormValues = z.infer<typeof schema>;

export function OnboardingClient() {
  const [pending, setPending] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
  });

  async function onSubmit(values: FormValues) {
    setPending(true);
    const res = await createOrganization({ name: values.name });
    setPending(false);
    if (res?.error) {
      toast({ title: "Could not create organization", description: res.error, variant: "destructive" });
    }
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
          <CardTitle className="text-xl text-primary">Create your Workspace</CardTitle>
          <CardDescription>
            Set up your workspace in a few quick steps.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization Name</Label>
              <Input id="orgName" placeholder="e.g. Dutch CV Ketel" {...form.register("name")} />
              {form.formState.errors.name ? (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              ) : null}
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={pending}>
              {pending ? "Creating…" : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

