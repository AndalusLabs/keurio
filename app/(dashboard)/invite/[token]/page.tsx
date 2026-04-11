import { redirect } from "next/navigation";
import { InviteAcceptClient } from "@/components/team/invite-accept-client";
import { createClient } from "@/lib/supabase/server";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login`);
  }

  return (
    <div className="mx-auto w-full max-w-md py-10">
      <InviteAcceptClient token={token} />
    </div>
  );
}

