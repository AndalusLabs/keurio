"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { ClientRow } from "@/types";

type Props = {
  clients: ClientRow[];
  value: string;
  onChange: (clientId: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

export function ClientCombobox({
  clients,
  value,
  onChange,
  disabled,
  placeholder = "Search client…",
}: Props) {
  const [open, setOpen] = React.useState(false);
  const selected = clients.find((c) => c.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="h-12 w-full justify-between border-border/80 font-normal hover:bg-accent/40 hover:text-accent-foreground"
        >
          <span className="truncate">
            {selected
              ? `${selected.company_name}${selected.city ? ` · ${selected.city}` : ""}`
              : "Select client"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter>
          <CommandInput placeholder={placeholder} className="h-11" />
          <CommandList className="max-h-[240px]">
            <CommandEmpty>No client found.</CommandEmpty>
            <CommandGroup>
              {clients.map((c) => (
                <CommandItem
                  key={c.id}
                  value={`${c.company_name} ${c.city ?? ""} ${c.contact_name ?? ""}`}
                  onSelect={() => {
                    onChange(c.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      value === c.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{c.company_name}</p>
                    {(c.city || c.contact_name) && (
                      <p className="truncate text-xs text-muted-foreground">
                        {[c.contact_name, c.city].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
