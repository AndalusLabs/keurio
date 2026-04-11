"use server";

import { revalidatePath } from "next/cache";
import crypto from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/queries/org";
import { getResend, getResendFrom } from "@/lib/email/resend";

function appBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000"
  );
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" as const };
  const ctx = await getOrgContext();
  if (!ctx) return { error: "Unauthorized" as const };
  if (ctx.role !== "admin") return { error: "Forbidden" as const };
  return { supabase, ctx, userId: user.id } as const;
}

export async function inviteMemberByEmail(input: {
  email: string;
  role: "admin" | "technician";
}) {
  const admin = await requireAdmin();
  if ("error" in admin) return { error: admin.error };
  const { supabase, ctx } = admin;

  const email = input.email.trim().toLowerCase();
  if (!email) return { error: "Email is required" };

  const token = crypto.randomBytes(24).toString("hex");
  const { error } = await supabase.from("organization_invites").insert({
    organization_id: ctx.organizationId,
    email,
    role: input.role,
    token,
  });

  if (error) return { error: error.message };

  const url = `${appBaseUrl()}/invite/${token}`;
  try {
    const resend = getResend();
    await resend.emails.send({
      from: getResendFrom(),
      to: [email],
      subject: "You’ve been invited to Keurio",
      html: `
        <div style="font-family: ui-sans-serif, system-ui; line-height:1.4">
          <p>You’ve been invited to join an organization in Keurio.</p>
          <p><a href="${url}">Accept invite</a></p>
          <p style="color:#64748b;font-size:12px">If you didn’t expect this, you can ignore this email.</p>
        </div>
      `,
    });
  } catch (e) {
    // Invite exists even if email fails; surface a helpful error
    return { error: e instanceof Error ? e.message : "Email failed" };
  }

  revalidatePath("/team");
  return { ok: true };
}

export async function updateMemberRole(input: {
  memberId: string;
  role: "admin" | "technician";
}) {
  const admin = await requireAdmin();
  if ("error" in admin) return { error: admin.error };
  const { supabase, ctx, userId } = admin;

  const { data: target } = await supabase
    .from("organization_members")
    .select("user_id, role")
    .eq("id", input.memberId)
    .eq("organization_id", ctx.organizationId)
    .maybeSingle();

  if (!target) return { error: "Member not found" };

  const selfDemote =
    target.user_id === userId &&
    target.role === "admin" &&
    input.role === "technician";

  if (selfDemote) {
    const { count } = await supabase
      .from("organization_members")
      .select("*", { head: true, count: "exact" })
      .eq("organization_id", ctx.organizationId)
      .eq("role", "admin");

    if ((count ?? 0) <= 1) {
      return { error: "Someone must be an admin of this organization." };
    }
  }

  const { error } = await supabase
    .from("organization_members")
    .update({ role: input.role })
    .eq("id", input.memberId)
    .eq("organization_id", ctx.organizationId);

  if (error) return { error: error.message };
  revalidatePath("/team");
  return { ok: true };
}

export async function removeMember(input: { memberId: string }) {
  const admin = await requireAdmin();
  if ("error" in admin) return { error: admin.error };
  const { supabase, ctx } = admin;

  const { error } = await supabase
    .from("organization_members")
    .delete()
    .eq("id", input.memberId)
    .eq("organization_id", ctx.organizationId);

  if (error) return { error: error.message };
  revalidatePath("/team");
  return { ok: true };
}

export async function acceptInvite(token: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: orgId, error } = await supabase.rpc("accept_org_invite", {
    invite_token: token,
  });
  if (error || !orgId) return { error: error?.message ?? "Invalid invite" };

  revalidatePath("/dashboard");
  revalidatePath("/team");
  return { ok: true };
}

