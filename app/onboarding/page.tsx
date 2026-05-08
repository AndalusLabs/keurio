import { redirect } from "next/navigation";
import { finishSignupOnboarding } from "@/lib/actions/onboarding";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getOrgContext } from "@/lib/queries/org";
import { createClient } from "@/lib/supabase/server";

type Props = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function OnboardingPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const error = params.error ? decodeURIComponent(params.error) : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const ctx = await getOrgContext();
  if (ctx) redirect("/dashboard");

  async function submit(formData: FormData) {
    "use server";
    const firstName = String(formData.get("firstName") ?? "");
    const lastName = String(formData.get("lastName") ?? "");
    const organizationName = String(formData.get("organizationName") ?? "");
    if (!firstName.trim() || !lastName.trim() || !organizationName.trim()) {
      redirect("/onboarding?error=All%20fields%20are%20required.");
    }
    const res = await finishSignupOnboarding({
      firstName,
      lastName,
      organizationName,
    });
    if (res.error) {
      redirect(`/onboarding?error=${encodeURIComponent(res.error)}`);
    }
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md items-center px-4 py-12">
      <Card className="w-full border-slate-200 bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="mb-5 flex justify-center">
            <Logo withLink={false} height={44} />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Create your workspace</h1>
          <p className="mt-1 text-sm text-slate-600">
            Almost done — just a few details to get started.
          </p>

          {error ? (
            <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <form action={submit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                First name <span className="text-red-600">*</span>
              </Label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="Jane"
                autoComplete="off"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">
                Last name <span className="text-red-600">*</span>
              </Label>
              <Input
                id="lastName"
                name="lastName"
                placeholder="Doe"
                autoComplete="off"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organizationName">
                Organization name <span className="text-red-600">*</span>
              </Label>
              <Input
                id="organizationName"
                name="organizationName"
                placeholder="Andalus Labs"
                autoComplete="off"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-[#0f3e18] text-white hover:bg-[#0d3414]"
            >
              Create workspace
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
