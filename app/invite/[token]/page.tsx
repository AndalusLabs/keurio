import Link from "next/link";
import { InviteAcceptClient } from "@/components/team/invite-accept-client";
import { InviteGuestClient } from "@/components/team/invite-guest-client";
import { InviteWrongAccountClient } from "@/components/team/invite-wrong-account-client";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

function orgLabel(name: string | null | undefined) {
  const n = name?.trim();
  return n || "your team";
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("peek_org_invite", { p_token: token });
  const invite = Array.isArray(data) ? data[0] : null;

  if (error) {
    return (
      <div className="w-full space-y-4 text-center">
        <h1 className="text-lg font-semibold text-[#0f3e18]">Could not load invite</h1>
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <Button asChild variant="outline" className="border-[#0f3e18]/25">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="w-full space-y-4 text-center">
        <h1 className="text-lg font-semibold text-[#0f3e18]">Invalid or expired link</h1>
        <p className="text-sm text-muted-foreground">Ask your admin for a new invite.</p>
        <Button asChild variant="outline" className="border-[#0f3e18]/25">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    );
  }

  const organizationName = orgLabel(
    (invite as { organization_name?: string | null }).organization_name
  );

  if (invite.accepted_at) {
    return (
      <div className="w-full space-y-4 text-center">
        <h1 className="text-lg font-semibold text-[#0f3e18]">Invite already used</h1>
        <p className="text-sm text-muted-foreground">Open the app with your account.</p>
        <Button asChild className="bg-[#0f3e18] text-[#b2dbb8] hover:bg-[#0f3e18]/90">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <InviteGuestClient
        token={token}
        invitedEmail={invite.email}
        organizationName={organizationName}
      />
    );
  }

  const sessionEmail = user.email?.trim().toLowerCase() ?? "";
  const invitedEmail = invite.email.trim().toLowerCase();

  if (sessionEmail !== invitedEmail) {
    return (
      <InviteWrongAccountClient
        token={token}
        invitedEmail={invite.email}
        sessionEmail={user.email ?? ""}
        organizationName={organizationName}
      />
    );
  }

  return <InviteAcceptClient token={token} organizationName={organizationName} />;
}
