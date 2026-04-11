"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MailPlus, Pencil } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { inviteMemberByEmail, updateMemberRole } from "@/lib/actions/team";
import type { TeamMember } from "@/lib/queries/team";
import { useRouter } from "next/navigation";

const inviteSchema = z.object({
  email: z.string().email("Enter a valid email"),
  role: z.enum(["admin", "technician"]),
});

type InviteValues = z.infer<typeof inviteSchema>;

function roleBadge(role: "admin" | "technician") {
  if (role === "admin") return <Badge variant="default">Admin</Badge>;
  return <Badge variant="secondary">Member</Badge>;
}

export function TeamAdminClient({ members }: { members: TeamMember[] }) {
  const router = useRouter();
  const [inviteSheetOpen, setInviteSheetOpen] = React.useState(false);
  const [editSheetOpen, setEditSheetOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [editingMember, setEditingMember] = React.useState<TeamMember | null>(null);
  const [selectedRole, setSelectedRole] = React.useState<"admin" | "technician">(
    "technician"
  );

  const form = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", role: "technician" },
  });

  async function onInvite(values: InviteValues) {
    setPending(true);
    const res = await inviteMemberByEmail(values);
    setPending(false);
    if (res.error) {
      toast({ title: "Invite failed", description: res.error, variant: "destructive" });
      return;
    }
    toast({ title: "Invite sent" });
    setInviteSheetOpen(false);
    form.reset({ email: "", role: "technician" });
    router.refresh();
  }

  async function onRoleChange(memberId: string, role: "admin" | "technician") {
    const res = await updateMemberRole({ memberId, role });
    if (res.error) {
      toast({ title: "Could not update role", description: res.error, variant: "destructive" });
      return;
    }
    toast({ title: "Role updated" });
    router.refresh();
  }

  async function saveRoleEdit() {
    if (!editingMember) return;
    setPending(true);
    await onRoleChange(editingMember.memberId, selectedRole);
    setPending(false);
    setEditSheetOpen(false);
  }

  function openEdit(member: TeamMember) {
    setEditingMember(member);
    setSelectedRole(member.role);
    setEditSheetOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Manage members in your organization.
        </p>
        <Button type="button" onClick={() => setInviteSheetOpen(true)} className="gap-2">
          <MailPlus className="h-4 w-4" />
          Invite
        </Button>
      </div>

      <Card className="border-border/80 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-primary">Members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">No members yet.</p>
          ) : (
            <div className="rounded-lg border border-border/80">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="w-[56px] text-right"> </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m) => (
                    <TableRow key={m.memberId}>
                      <TableCell className="font-medium">
                        {m.fullName || "Member"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {m.email ?? "—"}
                      </TableCell>
                      <TableCell>{roleBadge(m.role)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:bg-accent/60 hover:text-primary"
                          onClick={() => openEdit(m)}
                          aria-label="Edit role"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={inviteSheetOpen} onOpenChange={setInviteSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-primary">Invite member</SheetTitle>
            <SheetDescription>
              We’ll email a signup link. The user becomes a member after accepting the invite.
            </SheetDescription>
          </SheetHeader>
          <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onInvite)}>
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">Email</Label>
              <Input id="inviteEmail" type="email" {...form.register("email")} className="border-border/80" />
              {form.formState.errors.email ? (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={form.watch("role")}
                onValueChange={(v) => form.setValue("role", v as any)}
              >
                <SelectTrigger className="border-border/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technician">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <SheetFooter className="gap-2 sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setInviteSheetOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Send invite
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-primary">Edit role</SheetTitle>
            <SheetDescription>
              Update the member role.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {editingMember?.fullName || "Member"}
              </p>
              <p className="text-sm text-muted-foreground">
                {editingMember?.email ?? "—"}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={selectedRole}
                onValueChange={(v) => setSelectedRole(v as "admin" | "technician")}
              >
                <SelectTrigger className="border-border/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="technician">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <SheetFooter className="gap-2 sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setEditSheetOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={() => void saveRoleEdit()} disabled={pending}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save
              </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

