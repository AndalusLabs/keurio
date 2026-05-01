"use client";

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
import { Download, Pencil, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { ClientFormSheet } from "@/components/clients/client-form-sheet";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { BulkActionBar } from "@/components/shared/bulk-action-bar";
import { deleteClient, deleteClients } from "@/lib/actions/clients";
import { toast } from "@/hooks/use-toast";
import type { ClientRow } from "@/types";

const columnLabel: Record<string, string> = {
  company_name: "Company",
  contact_name: "Contact",
  email: "Email",
  city: "City",
};

export function ClientsDataTable({
  initialClients,
  canEdit,
}: {
  initialClients: ClientRow[];
  canEdit: boolean;
}) {
  const router = useRouter();

  const [globalFilter, setGlobalFilter] = React.useState("");
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ClientRow | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<ClientRow | null>(null);
  const [bulkDeleteIds, setBulkDeleteIds] = React.useState<string[] | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const columns = React.useMemo<ColumnDef<ClientRow>[]>(
    () => [
      ...(canEdit
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
            } as ColumnDef<ClientRow>,
          ]
        : []),
      {
        accessorKey: "company_name",
        header: "Company",
        cell: ({ row }) => (
          <span className="font-medium text-primary">{row.original.company_name}</span>
        ),
      },
      {
        accessorKey: "contact_name",
        header: "Contact",
        cell: ({ row }) => row.original.contact_name?.trim() || "—",
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.email?.trim() || "—"}</span>
        ),
      },
      {
        accessorKey: "city",
        header: "City",
        cell: ({ row }) => row.original.city?.trim() || "—",
      },
      ...(canEdit
        ? [
            {
              id: "actions",
              header: () => <span className="sr-only">Actions</span>,
              cell: ({ row }: { row: { original: ClientRow } }) => (
                <div className="flex justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:bg-accent/60 hover:text-primary"
                    aria-label="Edit client"
                    onClick={() => {
                      setEditing(row.original);
                      setSheetOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Delete client"
                    onClick={() => setDeleteTarget(row.original)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ),
              enableHiding: false,
            } as ColumnDef<ClientRow>,
          ]
        : []),
    ],
    [canEdit]
  );

  const table = useReactTable({
    data: initialClients,
    columns,
    state: { globalFilter, columnVisibility, rowSelection },
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: canEdit,
    getRowId: (row) => row.id,
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue ?? "")
        .toLowerCase()
        .trim();
      if (!q) return true;
      const name = (row.original.company_name ?? "").toLowerCase();
      return name.includes(q);
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

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deleteClient(deleteTarget.id);
    setDeleting(false);
    if (res.error) {
      toast({ title: "Could not delete", description: res.error, variant: "destructive" });
      return;
    }
    toast({ title: "Client removed" });
    setDeleteTarget(null);
    router.refresh();
  }

  async function confirmBulkDelete() {
    if (!bulkDeleteIds?.length) return;
    setDeleting(true);
    const res = await deleteClients(bulkDeleteIds);
    setDeleting(false);
    if (res.error) {
      toast({ title: "Could not delete clients", description: res.error, variant: "destructive" });
      return;
    }
    toast({
      title:
        bulkDeleteIds.length === 1
          ? "Client removed"
          : `${bulkDeleteIds.length} clients removed`,
    });
    setBulkDeleteIds(null);
    table.resetRowSelection();
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-sm flex-1">
          <Label htmlFor="client-filter" className="sr-only">
            Filter by company
          </Label>
          <Input
            id="client-filter"
            placeholder="Filter by company name…"
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-9 border-border/80 focus-visible:ring-primary"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="border-border/80">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Columns
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-52 p-2">
              <p className="mb-2 px-2 text-xs font-medium text-muted-foreground">
                Toggle columns
              </p>
              <div className="space-y-1">
                {table
                  .getAllColumns()
                  .filter((col) => col.getCanHide())
                  .map((column) => (
                    <label
                      key={column.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent/50"
                    >
                      <Checkbox
                        checked={column.getIsVisible()}
                        onCheckedChange={(v) => column.toggleVisibility(!!v)}
                      />
                      <span>{columnLabel[column.id] ?? column.id}</span>
                    </label>
                  ))}
              </div>
            </PopoverContent>
          </Popover>
          {canEdit ? (
            <Button
              type="button"
              variant="default"
              size="sm"
              className="gap-1"
              onClick={() => {
                setEditing(null);
                setSheetOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              New client
            </Button>
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
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No clients match your filter.
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
            {canEdit ? (
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
          </Button>
        </div>
      </div>

      {canEdit ? (
        <BulkActionBar
          count={selected}
          total={filtered}
          entity="client"
          onClear={() => table.resetRowSelection()}
          actions={[
            {
              label: "Export CSV",
              icon: Download,
              onClick: () =>
                toast({
                  title: `Exporting ${selected} client${selected === 1 ? "" : "s"}…`,
                }),
            },
            {
              label: "Delete",
              icon: Trash2,
              variant: "destructive",
              onClick: () => {
                const ids = table
                  .getFilteredSelectedRowModel()
                  .rows.map((r) => r.original.id);
                if (ids.length) setBulkDeleteIds(ids);
              },
            },
          ]}
        />
      ) : null}

      {canEdit ? (
        <ClientFormSheet
          open={sheetOpen}
          onOpenChange={(open) => {
            setSheetOpen(open);
            if (!open) setEditing(null);
          }}
          client={editing}
          onSaved={() => router.refresh()}
        />
      ) : null}

      <AlertDialog open={canEdit && !!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete client?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. Inspections linked to this client will keep their location text but
              will no longer be associated with the client record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={canEdit && !!bulkDeleteIds?.length}
        onOpenChange={(o) => !o && setBulkDeleteIds(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {bulkDeleteIds?.length === 1 ? "this client" : "these clients"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. Inspections linked to{" "}
              {bulkDeleteIds && bulkDeleteIds.length > 1
                ? "these clients"
                : "this client"}{" "}
              will keep their location text but will no longer be associated with the client record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmBulkDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting
                ? "Deleting…"
                : bulkDeleteIds && bulkDeleteIds.length > 1
                  ? `Delete ${bulkDeleteIds.length} clients`
                  : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
