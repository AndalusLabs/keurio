import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safePostAuthPath } from "@/lib/utils/auth-redirect";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string;
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const next = safePostAuthPath(params.next);
  const error = params.error ? decodeURIComponent(params.error) : null;

  async function login(formData: FormData) {
    "use server";

    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const nextParam = safePostAuthPath(String(formData.get("next") ?? ""));
    const remember = formData.get("remember") === "on";

    if (!email || !password) {
      redirect("/login?error=Please%20fill%20in%20email%20and%20password.");
    }

    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      // Ensure stale sessions do not bounce users away from /login?error=...
      await supabase.auth.signOut();
      const cookieStore = await cookies();
      cookieStore.delete("keurio_session");
      cookieStore.delete("keurio_remember");
      redirect("/login?error=Invalid%20email%20or%20password.");
    }

    const cookieStore = await cookies();
    const baseCookie = {
      path: "/",
      sameSite: "lax" as const,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };
    if (remember) {
      cookieStore.set("keurio_remember", "1", {
        ...baseCookie,
        maxAge: 60 * 60 * 24 * 30,
      });
      cookieStore.delete("keurio_session");
    } else {
      cookieStore.set("keurio_session", "1", baseCookie);
      cookieStore.delete("keurio_remember");
    }

    redirect(nextParam ?? "/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md items-center px-4 py-12">
      <div className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex justify-center">
          <Logo withLink={false} height={44} />
        </div>
        <h1 className="text-2xl font-semibold text-slate-900">Login</h1>
        <p className="mt-1 text-sm text-slate-600">
          Sign in to continue to your workspace.
        </p>

        {error ? (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <form action={login} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={next ?? ""} />
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              id="remember"
              name="remember"
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-[#0f3e18] focus:ring-[#0f3e18]"
            />
            Remember me
          </label>
          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          No account yet?{" "}
          <Link href="/signup" className="font-medium text-[#0f3e18] hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
