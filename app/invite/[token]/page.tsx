import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { acceptInvite } from "@/lib/actions/team";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";

type Props = {
  params: Promise<{ token: string }>;
};

export default async function InviteAcceptPage({ params }: Props) {
  const { token } = await params;
  if (!token?.trim()) {
    redirect("/");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: peekRows, error: peekError } = await supabase.rpc("peek_org_invite", {
    p_token: token,
  });

  if (peekError || !peekRows?.length) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-4 py-12">
        <div className="w-full rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex justify-center">
            <Logo withLink={false} height={40} />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Invalid invite</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This link is not valid or has expired. Ask your admin for a new invite.
          </p>
          <Button asChild className="mt-6 w-full bg-[#0f3e18] text-white hover:bg-[#0d3414]">
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </main>
    );
  }

  const peek = peekRows[0]!;

  if (peek.accepted_at) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-4 py-12">
        <div className="w-full rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex justify-center">
            <Logo withLink={false} height={40} />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Invite already used</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This invitation was already accepted. Sign in with your Keurio account to open your workspace.
          </p>
          <Button asChild className="mt-6 w-full bg-[#0f3e18] text-white hover:bg-[#0d3414]">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </main>
    );
  }

  const nextPath = `/invite/${encodeURIComponent(token)}`;

  if (user) {
    const result = await acceptInvite(token);
    if ("error" in result && result.error) {
      return (
        <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-4 py-12">
          <div className="w-full rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex justify-center">
              <Logo withLink={false} height={40} />
            </div>
            <h1 className="text-xl font-semibold text-foreground">Could not accept invite</h1>
            <p className="mt-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {result.error}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              You must be signed in with the same email this invite was sent to:{" "}
              <span className="font-medium text-foreground">{peek.email}</span>
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">Sign in with a different account</Link>
              </Button>
              <Button asChild className="w-full bg-[#0f3e18] text-white hover:bg-[#0d3414]">
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            </div>
          </div>
        </main>
      );
    }
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-4 py-12">
      <div className="w-full rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex justify-center">
          <Logo withLink={false} height={40} />
        </div>
        <h1 className="text-xl font-semibold text-foreground">You&apos;re invited</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Join <span className="font-medium text-foreground">{peek.organization_name}</span> on Keurio.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Sign in or create an account with{" "}
          <span className="font-medium text-foreground">{peek.email}</span> — the address this invite was sent to.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Button asChild className="min-h-12 w-full bg-[#0f3e18] py-3 text-white hover:bg-[#0d3414]">
            <Link href={`/login?next=${encodeURIComponent(nextPath)}`}>Sign in to accept</Link>
          </Button>
          <Button asChild variant="outline" className="min-h-12 w-full border-[#0f3e18]/25 py-3 text-[#0f3e18]">
            <Link href={`/signup?next=${encodeURIComponent(nextPath)}`}>Create account</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
