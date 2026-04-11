"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { ClientFormInput } from "@/lib/actions/clients";
import { upsertClient } from "@/lib/actions/clients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import type { ClientRow } from "@/types";

const schema = z.object({
  companyName: z.string().min(1, "Required"),
  contactName: z.string().optional(),
  email: z.union([z.string().email("Invalid email"), z.literal("")]),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function mapRowToDefaults(row: ClientRow | null): FormValues {
  if (!row) {
    return {
      companyName: "",
      contactName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      postalCode: "",
      notes: "",
    };
  }
  return {
    companyName: row.company_name,
    contactName: row.contact_name ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    address: row.address ?? "",
    city: row.city ?? "",
    postalCode: row.postal_code ?? "",
    notes: row.notes ?? "",
  };
}

function toActionPayload(values: FormValues): ClientFormInput {
  return {
    companyName: values.companyName,
    contactName: values.contactName,
    email: values.email || undefined,
    phone: values.phone,
    address: values.address,
    city: values.city,
    postalCode: values.postalCode,
    notes: values.notes,
  };
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ClientRow | null;
  onSaved?: () => void;
};

export function ClientFormSheet({ open, onOpenChange, client, onSaved }: Props) {
  const [pending, setPending] = React.useState(false);
  const isEdit = Boolean(client);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: mapRowToDefaults(client),
    values: mapRowToDefaults(client),
  });

  async function onSubmit(values: FormValues) {
    setPending(true);
    const res = await upsertClient(toActionPayload(values), client?.id);
    setPending(false);
    if (res.error) {
      toast({ title: "Could not save", description: res.error, variant: "destructive" });
      return;
    }
    toast({ title: isEdit ? "Client updated" : "Client created" });
    onOpenChange(false);
    onSaved?.();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader className="text-left">
          <SheetTitle className="text-primary">
            {isEdit ? "Edit client" : "New client"}
          </SheetTitle>
          <SheetDescription>
            {isEdit ? "Update details below." : "Add a client for inspections and reports."}
          </SheetDescription>
        </SheetHeader>
        <form
          className="flex flex-1 flex-col gap-4 px-4 pb-4 pt-2"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="space-y-2">
            <Label htmlFor="companyName">Company name</Label>
            <Input id="companyName" {...form.register("companyName")} className="border-border/80" />
            {form.formState.errors.companyName ? (
              <p className="text-xs text-destructive">{form.formState.errors.companyName.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactName">Contact name</Label>
            <Input id="contactName" {...form.register("contactName")} className="border-border/80" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...form.register("email")} className="border-border/80" />
            {form.formState.errors.email ? (
              <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...form.register("phone")} className="border-border/80" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" {...form.register("address")} className="border-border/80" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" {...form.register("city")} className="border-border/80" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal code</Label>
              <Input id="postalCode" {...form.register("postalCode")} className="border-border/80" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" className="min-h-[88px] border-border/80" {...form.register("notes")} />
          </div>
          <SheetFooter className="mt-auto flex-row gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
