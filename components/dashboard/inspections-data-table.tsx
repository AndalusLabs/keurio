"use client";

import {
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  MoreHorizontal,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { deleteInspection, deleteInspections } from "@/lib/actions/inspections";
import { toast } from "@/hooks/use-toast";
import { formatInspectionDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils";
import type { InspectionListRow } from "@/types";
import type { InspectionStatus } from "@/types/database";

const STATUS_ORDER: Record<InspectionStatus, number> = {
  draft: 0,
  in_progress: 1,
  completed: 2,
};

function StatusBadge({ status }: { status: InspectionStatus }) {
  switch (status) {
    case "completed":
      return <Badge variant="statusCompleted">Completed</Badge>;
    case "in_progress":
      return <Badge variant="statusInProgress">In progress</Badge>;
    default:
      return <Badge variant="muted">Draft</Badge>;
  }
}

function sortIcon(sorted: false | "asc" | "desc") {
  if (sorted === "asc") return <ArrowUp className="ml-1 h-3.5 w-3.5" />;
  if (sorted === "desc") return <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  return <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-50" />;
}

export function InspectionsDataTable({
  data,
  canDelete,
}: {
  data: InspectionListRow[];
  canDelete: boolean;
}) {
  const router = useRouter();
  const [deleteTargetId, setDeleteTargetId] = React.useState<string | null>(null);
  const [bulkDeleteIds, setBulkDeleteIds] = React.useState<string[] | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "created_at", desc: true },
  ]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  const columns = React.useMemo<ColumnDef<InspectionListRow>[]>(
    () => [
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
            onCheckedChange={(v) =>
              table.toggleAllPageRowsSelected(!!v)
            }
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
      },
      {
        id: "inspection_name",
        header: "Inspection",
        accessorFn: (row) => row.title ?? "",
        cell: ({ row }) => (
          <span className="max-w-[200px] truncate font-medium text-primary">
            {row.original.title?.trim() || "—"}
          </span>
        ),
      },
      {
        id: "client",
        header: "Client",
        accessorFn: (row) => row.clients?.company_name ?? "",
        cell: ({ row }) => (
          <span className="max-w-[180px] truncate">
            {row.original.clients?.company_name?.trim() || "—"}
          </span>
        ),
      },
      {
        id: "location",
        header: "Location",
        accessorFn: (row) => row.location ?? "",
        cell: ({ row }) => (
          <span className="max-w-[180px] truncate">
            {row.original.location?.trim() || "—"}
          </span>
        ),
      },
      {
        id: "template",
        header: "Template",
        accessorFn: (row) => row.checklist_templates?.name ?? "",
        cell: ({ row }) => (
          <span className="max-w-[180px] truncate">
            {row.original.checklist_templates?.name ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <Button
            type="button"
            variant="ghost"
            className="-ml-3 h-8 px-2 font-medium text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground data-[state=open]:bg-accent/60"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          >
            Status
            {sortIcon(column.getIsSorted())}
          </Button>
        ),
        cell: ({ row }) => (
          <StatusBadge status={row.original.status as InspectionStatus} />
        ),
        sortingFn: (a, b) =>
          STATUS_ORDER[a.original.status as InspectionStatus] -
          STATUS_ORDER[b.original.status as InspectionStatus],
      },
      {
        accessorKey: "created_at",
        id: "created_at",
        header: ({ column }) => (
          <Button
            type="button"
            variant="ghost"
            className="-ml-3 h-8 px-2 font-medium text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          >
            Date
            {sortIcon(column.getIsSorted())}
          </Button>
        ),
        cell: ({ row }) => (
          <span className="whitespace-nowrap tabular-nums">
            {formatInspectionDate(row.original.created_at)}
          </span>
        ),
        sortingFn: (a, b) =>
          new Date(a.original.created_at).getTime() -
          new Date(b.original.created_at).getTime(),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const id = row.original.id;
          return (
            <div
              className="text-right"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:bg-accent/60 hover:text-primary"
                    aria-label="Open menu"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/inspections/${id}`}>View detail</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/run/${id}`}>Open in field</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a
                      href={`/api/inspections/${id}/pdf`}
                      download
                      className="cursor-pointer"
                    >
                      Download PDF
                    </a>
                  </DropdownMenuItem>
                  {canDelete ? (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setDeleteTargetId(id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete inspection
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [canDelete]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue ?? "")
        .toLowerCase()
        .trim();
      if (!q) return true;
      const name = (row.original.title ?? "").toLowerCase();
      const client = (row.original.clients?.company_name ?? "").toLowerCase();
      const location = (row.original.location ?? "").toLowerCase();
      return name.includes(q) || client.includes(q) || location.includes(q);
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.id,
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  const filtered = table.getFilteredRowModel().rows.length;
  const selected = table.getFilteredSelectedRowModel().rows.length;

  const columnLabel: Record<string, string> = {
    inspection_name: "Inspection",
    client: "Client",
    location: "Location",
    template: "Template",
    status: "Status",
    created_at: "Date",
  };

  async function confirmDeleteInspection() {
    if (!deleteTargetId) return;
    setDeleting(true);
    const res = await deleteInspection(deleteTargetId);
    setDeleting(false);
    if (res.error) {
      toast({
        title: "Could not delete inspection",
        description: res.error,
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Inspection deleted" });
    setDeleteTargetId(null);
    router.refresh();
  }

  async function confirmBulkDeleteInspections() {
    if (!bulkDeleteIds?.length) return;
    setDeleting(true);
    const res = await deleteInspections(bulkDeleteIds);
    setDeleting(false);
    if (res.error) {
      toast({
        title: "Could not delete inspections",
        description: res.error,
        variant: "destructive",
      });
      return;
    }
    toast({
      title:
        bulkDeleteIds.length === 1
          ? "Inspection deleted"
          : `${bulkDeleteIds.length} inspections deleted`,
    });
    setBulkDeleteIds(null);
    table.resetRowSelection();
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-sm flex-1">
          <Label htmlFor="inspection-filter" className="sr-only">
            Filter by inspection or client
          </Label>
          <Input
            id="inspection-filter"
            placeholder="Filter by inspection or client…"
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-9 border-border/80 focus-visible:ring-primary"
          />
        </div>
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
                        onCheckedChange={(v) =>
                          column.toggleVisibility(!!v)
                        }
                      />
                      <span>{columnLabel[column.id] ?? column.id}</span>
                    </label>
                  ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="rounded-xl border border-border/80 bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      header.column.id === "actions" && "w-[52px]"
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
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
                  className="cursor-pointer data-[state=selected]:bg-accent/50"
                  onClick={() =>
                    router.push(`/inspections/${row.original.id}`)
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
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
            {selected} of {filtered} row(s)
          </span>
        </p>
        <div className="flex items-center gap-2">
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

      <BulkActionBar
        count={selected}
        total={filtered}
        entity="inspection"
        onClear={() => table.resetRowSelection()}
        actions={[
          {
            label: "Export CSV",
            icon: Download,
            onClick: () =>
              toast({
                title: `Exporting ${selected} inspection${selected === 1 ? "" : "s"}…`,
              }),
          },
          ...(canDelete
            ? [
                {
                  label: "Delete",
                  icon: Trash2,
                  variant: "destructive" as const,
                  onClick: () => {
                    const ids = table
                      .getFilteredSelectedRowModel()
                      .rows.map((r) => r.original.id);
                    if (ids.length) setBulkDeleteIds(ids);
                  },
                },
              ]
            : []),
        ]}
      />

      <AlertDialog
        open={!!deleteTargetId}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this inspection?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The inspection results and attached
              photos will be permanently removed. Are you sure you want to
              continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmDeleteInspection();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete inspection"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!bulkDeleteIds?.length}
        onOpenChange={(open) => {
          if (!open) setBulkDeleteIds(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {bulkDeleteIds?.length === 1 ? "this inspection" : "these inspections"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.{" "}
              {bulkDeleteIds && bulkDeleteIds.length > 1
                ? `${bulkDeleteIds.length} inspections and their attached photos will be permanently removed.`
                : "The inspection results and attached photos will be permanently removed."}{" "}
              Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmBulkDeleteInspections();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting
                ? "Deleting…"
                : bulkDeleteIds && bulkDeleteIds.length > 1
                  ? `Delete ${bulkDeleteIds.length} inspections`
                  : "Delete inspection"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
