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

  const [{ data: userRow }, { data: userProfileRow }] = await Promise.all([
    supabase.from("users").select("full_name").eq("id", user.id).maybeSingle(),
    supabase
      .from("user_profiles")
      .select("first_name, last_name")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const fromProfileFirst = userProfileRow?.first_name?.trim() ?? "";
  const fromProfileLast = userProfileRow?.last_name?.trim() ?? "";
  const fromUsers = userRow?.full_name?.trim() ?? "";
  let fallbackFirst = "";
  let fallbackLast = "";
  if (fromUsers) {
    const parts = fromUsers.split(/\s+/).filter(Boolean);
    fallbackFirst = parts[0] ?? "";
    fallbackLast = parts.slice(1).join(" ");
  }
  const defaultFirstName = fromProfileFirst || fallbackFirst;
  const defaultLastName = fromProfileLast || fallbackLast;

  async function submit(formData: FormData) {
    "use server";
    const firstName = String(formData.get("firstName") ?? "");
    const lastName = String(formData.get("lastName") ?? "");
    const organizationName = String(formData.get("organizationName") ?? "");
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
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                name="firstName"
                defaultValue={defaultFirstName}
                placeholder="Jane"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                name="lastName"
                defaultValue={defaultLastName}
                placeholder="Doe"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organizationName">Organization name</Label>
              <Input
                id="organizationName"
                name="organizationName"
                placeholder="Andalus Labs"
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
