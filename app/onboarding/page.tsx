import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { finishSignupOnboarding } from "@/lib/actions/onboarding";
import { getOrgContext } from "@/lib/queries/org";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/logo";

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

  const { data: userRow } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  async function submit(formData: FormData) {
    "use server";
    const fullName = String(formData.get("fullName") ?? "");
    const organizationName = String(formData.get("organizationName") ?? "");
    const res = await finishSignupOnboarding({ fullName, organizationName });
    if (res.error) {
      redirect(`/onboarding?error=${encodeURIComponent(res.error)}`);
    }
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md items-center px-4 py-12">
      <div className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex justify-center">
          <Logo withLink={false} height={44} />
        </div>
        <h1 className="text-2xl font-semibold text-slate-900">Finish onboarding</h1>
        <p className="mt-1 text-sm text-slate-600">
          Set your name and create your workspace to continue.
        </p>

        {error ? (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <form action={submit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Your name</Label>
            <Input
              id="fullName"
              name="fullName"
              defaultValue={userRow?.full_name ?? ""}
              placeholder="Jane Doe"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="organizationName">Workspace name</Label>
            <Input
              id="organizationName"
              name="organizationName"
              placeholder="Andalus Labs"
              required
            />
          </div>
          <Button type="submit" className="w-full bg-[#0f3e18] text-white hover:bg-[#0d3414]">
            Continue
          </Button>
        </form>
      </div>
    </main>
  );
}
