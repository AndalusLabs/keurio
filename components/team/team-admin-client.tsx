"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  type ColumnDef,
  type RowSelectionState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  MailPlus,
  Pencil,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BulkActionBar } from "@/components/shared/bulk-action-bar";
import { toast } from "@/hooks/use-toast";
import {
  inviteMemberByEmail,
  removeMembers,
  updateMemberRole,
} from "@/lib/actions/team";
import type { TeamMember } from "@/lib/queries/team";
import { useRouter } from "next/navigation";

const inviteSchema = z.object({
  email: z.string().email("Enter a valid email"),
  role: z.enum(["admin", "technician"]),
});

type InviteValues = z.infer<typeof inviteSchema>;

const MEMBER_RESTRICTION_TOOLTIP = "Only Admins can invite members";

const TEAM_COLUMN_LABEL: Record<string, string> = {
  name: "Name",
  email: "Email",
  role: "Role",
};

function roleBadge(role: "admin" | "technician") {
  if (role === "admin") return <Badge variant="default">Admin</Badge>;
  return <Badge variant="secondary">Member</Badge>;
}

export function TeamAdminClient({
  members,
  canManage = true,
}: {
  members: TeamMember[];
  /** When false, list is read-only (members can view team, not invite or edit roles). */
  canManage?: boolean;
}) {
  const router = useRouter();
  const [inviteSheetOpen, setInviteSheetOpen] = React.useState(false);
  const [editSheetOpen, setEditSheetOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [editingMember, setEditingMember] = React.useState<TeamMember | null>(null);
  const [selectedRole, setSelectedRole] = React.useState<"admin" | "technician">(
    "technician"
  );
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [bulkRemoveIds, setBulkRemoveIds] = React.useState<string[] | null>(null);
  const [removing, setRemoving] = React.useState(false);

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

  const openEdit = React.useCallback((member: TeamMember) => {
    setEditingMember(member);
    setSelectedRole(member.role);
    setEditSheetOpen(true);
  }, []);

  const columns = React.useMemo<ColumnDef<TeamMember>[]>(
    () => [
      ...(canManage
        ? [
            {
              id: "select",
              header: ({ table }) => (
                <Checkbox
                  checked={
                    table.getIsAllPageRowsSelected()
                      ? true
                      : table.getIsSomePageRowsSelected()
                        ? "indeterminate"
                        : false
                  }
                  onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
                  aria-label="Select all"
                  onClick={(e) => e.stopPropagation()}
                />
              ),
              cell: ({ row }) => (
                <Checkbox
                  checked={row.getIsSelected()}
                  onCheckedChange={(v) => row.toggleSelected(!!v)}
                  aria-label="Select row"
                  onClick={(e) => e.stopPropagation()}
                />
              ),
              enableSorting: false,
              enableHiding: false,
            } as ColumnDef<TeamMember>,
          ]
        : []),
      {
        id: "name",
        accessorFn: (row) => row.fullName?.trim() || "Member",
        header: "Name",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.fullName || "Member"}</span>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.email ?? "—"}</span>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => roleBadge(row.original.role),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="text-right">
            {canManage ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:bg-accent/60 hover:text-primary"
                onClick={() => openEdit(row.original)}
                aria-label="Edit role"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            ) : (
              <span
                className="inline-flex h-8 w-8 cursor-not-allowed items-center justify-center text-muted-foreground/50"
                title={MEMBER_RESTRICTION_TOOLTIP}
                aria-label={MEMBER_RESTRICTION_TOOLTIP}
              >
                <Pencil className="h-4 w-4 line-through" strokeWidth={1.75} aria-hidden />
              </span>
            )}
          </div>
        ),
        enableHiding: false,
      },
    ],
    [canManage, openEdit]
  );

  const table = useReactTable({
    data: members,
    columns,
    state: { globalFilter, columnVisibility, rowSelection },
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: canManage,
    getRowId: (row) => row.memberId,
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue ?? "")
        .toLowerCase()
        .trim();
      if (!q) return true;
      const name = (row.original.fullName ?? "").toLowerCase();
      const email = (row.original.email ?? "").toLowerCase();
      return name.includes(q) || email.includes(q);
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const filtered = table.getFilteredRowModel().rows.length;
  const selected = table.getFilteredSelectedRowModel().rows.length;
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const from = filtered === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, filtered);

  async function confirmBulkRemove() {
    if (!bulkRemoveIds?.length) return;
    setRemoving(true);
    const res = await removeMembers(bulkRemoveIds);
    setRemoving(false);
    if (res.error) {
      toast({ title: "Could not remove members", description: res.error, variant: "destructive" });
      return;
    }
    toast({
      title:
        bulkRemoveIds.length === 1
          ? "Member removed"
          : `${bulkRemoveIds.length} members removed`,
    });
    setBulkRemoveIds(null);
    table.resetRowSelection();
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground">No team members yet.</p>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-sm flex-1">
              <Label htmlFor="team-filter" className="sr-only">
                Filter by name or email
              </Label>
              <Input
                id="team-filter"
                placeholder="Filter by name or email…"
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="h-9 border-border/80 focus-visible:ring-primary"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-border/80 hover:bg-accent/60 hover:text-accent-foreground"
                  >
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    Columns
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-52 p-0">
                  <div className="p-2">
                    <p className="mb-2 px-3 pt-2 text-xs font-medium text-muted-foreground">
                      Toggle columns
                    </p>
                    <div className="space-y-1">
                      {table
                        .getAllColumns()
                        .filter((col) => col.getCanHide())
                        .map((column) => (
                          <label
                            key={column.id}
                            className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent/50"
                          >
                            <Checkbox
                              checked={column.getIsVisible()}
                              onCheckedChange={(v) => column.toggleVisibility(!!v)}
                            />
                            <span>{TEAM_COLUMN_LABEL[column.id] ?? column.id}</span>
                          </label>
                        ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              {canManage ? (
                <span title={!canManage ? MEMBER_RESTRICTION_TOOLTIP : undefined} className="inline-flex">
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="gap-2"
                    disabled={!canManage}
                    onClick={() => {
                      if (!canManage) return;
                      setInviteSheetOpen(true);
                    }}
                    aria-label={!canManage ? MEMBER_RESTRICTION_TOOLTIP : undefined}
                  >
                    <MailPlus className="h-4 w-4" aria-hidden />
                    Invite
                  </Button>
                </span>
              ) : null}
            </div>
          </div>

              <div className="rounded-xl border border-border/80 bg-card">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((hg) => (
                      <TableRow key={hg.id} className="hover:bg-transparent">
                        {hg.headers.map((header) => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && "selected"}
                          className="data-[state=selected]:bg-accent/50"
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="h-24 text-center text-muted-foreground"
                        >
                          No results.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  <span className="tabular-nums">
                    {from}–{to} of {filtered} row(s)
                    {canManage ? (
                      <>
                        {" "}
                        · {selected} selected
                      </>
                    ) : null}
                  </span>
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-border/80"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-border/80"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>

              {canManage ? (
                <BulkActionBar
                  count={selected}
                  total={filtered}
                  entity="team member"
                  entityPlural="team members"
                  onClear={() => table.resetRowSelection()}
                  actions={[
                    {
                      label: "Export CSV",
                      icon: Download,
                      onClick: () =>
                        toast({
                          title: `Exporting ${selected} team member${selected === 1 ? "" : "s"}…`,
                        }),
                    },
                    {
                      label: "Remove from team",
                      icon: Trash2,
                      variant: "destructive",
                      onClick: () => {
                        const ids = table
                          .getFilteredSelectedRowModel()
                          .rows.map((r) => r.original.memberId);
                        if (ids.length) setBulkRemoveIds(ids);
                      },
                    },
                  ]}
                />
              ) : null}

              {canManage ? (
                <AlertDialog
                  open={!!bulkRemoveIds?.length}
                  onOpenChange={(o) => !o && setBulkRemoveIds(null)}
                >
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Remove {bulkRemoveIds?.length === 1 ? "this team member" : "these team members"}?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        They will lose access to this organization. This cannot be undone. At least one
                        admin must remain.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={(e) => {
                          e.preventDefault();
                          void confirmBulkRemove();
                        }}
                        disabled={removing}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {removing
                          ? "Removing…"
                          : bulkRemoveIds && bulkRemoveIds.length > 1
                            ? `Remove ${bulkRemoveIds.length} team members`
                            : "Remove team member"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : null}
        </>
      )}

      {canManage ? (
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
      ) : null}

      {canManage ? (
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
      ) : null}
    </div>
  );
}

