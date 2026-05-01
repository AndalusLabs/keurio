"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Building2, ChevronDown, Flag, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardFilters, FilterOption, PeriodKey } from "@/lib/dashboard-filters";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PERIODS: { id: PeriodKey; label: string }[] = [
  { id: "week", label: "Last week" },
  { id: "month", label: "Last month" },
  { id: "year", label: "Last year" },
];

type Props = {
  initial?: Partial<DashboardFilters>;
  statuses?: FilterOption[];
  templates?: FilterOption[];
  clients?: FilterOption[];
  liveLabel?: string;
  onChange?: (next: DashboardFilters) => void;
  className?: string;
};

const DEFAULT: DashboardFilters = {
  period: "month",
  status: [],
  template: [],
  client: [],
};

export function DashboardFilterBar({
  initial,
  statuses = [],
  templates = [],
  clients = [],
  liveLabel = "Live · updated just now",
  onChange,
  className,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filters, setFilters] = React.useState<DashboardFilters>({
    ...DEFAULT,
    ...initial,
  });

  const update = React.useCallback(
    (patch: Partial<DashboardFilters>) => {
      const next = { ...filters, ...patch };
      setFilters(next);
      onChange?.(next);

      const params = new URLSearchParams(searchParams.toString());
      params.set("period", next.period);
      params.delete("status");
      params.delete("template");
      params.delete("client");

      next.status.forEach((value) => params.append("status", value));
      next.template.forEach((value) => params.append("template", value));
      next.client.forEach((value) => params.append("client", value));

      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [filters, onChange, pathname, router, searchParams]
  );

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 border-b border-border pb-4",
        className
      )}
      role="toolbar"
      aria-label="Dashboard filters"
    >
      <span className="text-[12.5px] font-medium text-muted-foreground">
        Period
      </span>

      <div className="inline-flex items-center gap-1">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={filters.period === p.id}
            onClick={() => update({ period: p.id })}
            className={cn(
              "h-8 rounded-md border px-3 text-[12px] font-medium transition-colors",
              filters.period === p.id
                ? "border-primary bg-primary text-primary-foreground shadow-brand"
                : "border-border bg-card text-foreground shadow-sm hover:bg-muted"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <span aria-hidden className="mx-1 h-5 w-px bg-border" />

      <FilterSelect
        icon={Flag}
        ariaLabel="Status"
        allLabel="All statuses"
        options={statuses}
        value={filters.status}
        onChange={(status) => update({ status })}
      />
      <FilterSelect
        icon={LayoutGrid}
        ariaLabel="Template"
        allLabel="All templates"
        options={templates}
        value={filters.template}
        onChange={(template) => update({ template })}
      />
      <FilterSelect
        icon={Building2}
        ariaLabel="Client"
        allLabel="All clients"
        options={clients}
        value={filters.client}
        onChange={(client) => update({ client })}
      />

      <div className="ml-auto flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        {liveLabel}
      </div>
    </div>
  );
}

function FilterSelect({
  icon: Icon,
  ariaLabel,
  allLabel,
  options,
  value,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  ariaLabel: string;
  allLabel: string;
  options: FilterOption[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const current =
    value.length === 0
      ? allLabel
      : value.length === 1
        ? options.find((o) => o.id === value[0])?.label ?? allLabel
        : `${value.length} selected`;

  function toggle(optionId: string, checked: boolean) {
    if (checked) {
      onChange(Array.from(new Set([...value, optionId])));
      return;
    }
    onChange(value.filter((id) => id !== optionId));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[12.5px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
            value.length > 0
              ? "border-primary/30 bg-secondary text-primary"
              : "border-border bg-card text-foreground shadow-sm hover:bg-muted data-[state=open]:bg-muted"
          )}
        >
          <Icon
            className={cn(
              "h-3.5 w-3.5 shrink-0",
              value.length > 0 ? "text-primary" : "text-muted-foreground"
            )}
          />
          <span className="max-w-[160px] truncate">{current}</span>
          <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground transition-transform duration-150 group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" sideOffset={6} className="min-w-[200px]">
        <DropdownMenuItem
          onSelect={() => onChange([])}
          className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
        >
          Clear selection
        </DropdownMenuItem>
        {options.length > 0 && <DropdownMenuSeparator />}
        {options.map((o) => (
          <DropdownMenuCheckboxItem
            key={o.id}
            checked={value.includes(o.id)}
            onCheckedChange={(checked) => toggle(o.id, checked === true)}
          >
            {o.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
