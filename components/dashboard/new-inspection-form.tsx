"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  ArrowRight,
  Building2,
  Check,
  ClipboardList,
  FileText,
  MapPin,
  Plus,
  Type as TypeIcon,
} from "lucide-react";
import { ClientCombobox } from "@/components/clients/client-combobox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { createInspection, createTemplate } from "@/lib/actions/inspections";
import { cn } from "@/lib/utils";
import type { ClientRow } from "@/types";

const schema = z.object({
  title: z.string().min(1, "Inspection is required"),
  clientId: z.string().uuid("Select a client"),
  templateId: z.string().min(1, "Pick a template").uuid(),
  location: z.string().trim().optional(),
});

type FormValues = z.infer<typeof schema>;

const templateSchema = z.object({
  name: z.string().min(1, "Name required"),
  itemsText: z.string().min(3, "Add checklist lines"),
});

type TemplateForm = z.infer<typeof templateSchema>;

type TemplateOption = { id: string; name: string; created_at: string };

type NewInspectionFormProps = {
  templates: TemplateOption[];
  clients: ClientRow[];
};

export function NewInspectionForm({
  templates: initialTemplates,
  clients,
}: NewInspectionFormProps) {
  const router = useRouter();
  const [templates, setTemplates] = useState(initialTemplates);
  const [dialogOpen, setDialogOpen] = useState(false);

  const lastAutoTitleRef = useRef("");

  useEffect(() => {
    setTemplates(initialTemplates);
  }, [initialTemplates]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", clientId: "", templateId: "", location: "" },
  });

  const selectedClientId = form.watch("clientId");
  const selectedTemplateId = form.watch("templateId");
  const titleValue = form.watch("title");
  const locationValue = form.watch("location");

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId) ?? null,
    [clients, selectedClientId]
  );
  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId) ?? null,
    [templates, selectedTemplateId]
  );

  const selectedClientName = selectedClient?.company_name?.trim() ?? "";
  const selectedTemplateName = selectedTemplate?.name?.trim() ?? "";

  useEffect(() => {
    if (!selectedClientName || !selectedTemplateName) return;
    const now = new Date();
    const date = now.toLocaleDateString("nl-NL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const time = now.toLocaleTimeString("nl-NL", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const autoTitle = `${selectedClientName} — ${date} ${time}`;
    const current = titleValue?.trim() ?? "";
    if (!current || current === lastAutoTitleRef.current) {
      form.setValue("title", autoTitle, { shouldDirty: false, shouldValidate: true });
      lastAutoTitleRef.current = autoTitle;
    }
  }, [form, selectedClientName, selectedTemplateName, titleValue]);

  const tplForm = useForm<TemplateForm>({
    resolver: zodResolver(templateSchema),
    defaultValues: { name: "", itemsText: "" },
  });

  const isSubmitting = form.formState.isSubmitting;
  const canSubmit = templates.length > 0 && clients.length > 0;

  async function onSubmit(values: FormValues) {
    const res = await createInspection({
      title: values.title,
      clientId: values.clientId,
      templateId: values.templateId,
      location: values.location,
    });
    if (res.error) {
      toast({ title: "Could not create", description: res.error, variant: "destructive" });
      return;
    }
    if (res.data?.id) {
      router.push(`/run/${res.data.id}`);
      router.refresh();
    }
  }

  async function onCreateTemplate(values: TemplateForm) {
    const lines = values.itemsText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const res = await createTemplate({ name: values.name, items: lines });
    if (res.error) {
      toast({ title: "Template failed", description: res.error, variant: "destructive" });
      return;
    }
    if (res.data?.id) {
      setTemplates((t) => [
        { id: res.data!.id, name: values.name, created_at: new Date().toISOString() },
        ...t,
      ]);
      form.setValue("templateId", res.data.id);
      setDialogOpen(false);
      tplForm.reset();
      toast({ title: "Template created" });
      router.refresh();
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]"
    >
      {/* LEFT — stepper form */}
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        id="new-inspection-form"
      >
        {/* Step 1 — Client */}
        <StepCard
          step={1}
          icon={Building2}
          title="Client"
          description="Who is this inspection for?"
          done={!!selectedClient}
          action={
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto p-0 text-[12.5px] font-medium text-primary"
              asChild
            >
              <Link href="/clients">Manage clients</Link>
            </Button>
          }
        >
          <ClientCombobox
            clients={clients}
            value={selectedClientId}
            onChange={(id) => form.setValue("clientId", id, { shouldValidate: true })}
            disabled={clients.length === 0}
          />
          {form.formState.errors.clientId ? (
            <FieldError>{form.formState.errors.clientId.message}</FieldError>
          ) : null}
          {clients.length === 0 ? (
            <p className="mt-2 text-[12.5px] text-muted-foreground">
              No clients yet. Add one on the{" "}
              <Link
                href="/clients"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Clients
              </Link>{" "}
              page first.
            </p>
          ) : null}
        </StepCard>

        {/* Step 2 — Template */}
        <StepCard
          step={2}
          icon={ClipboardList}
          title="Checklist template"
          description="The list of items to verify on site."
          done={!!selectedTemplate}
          action={
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-[12.5px] font-medium text-primary hover:bg-secondary"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New template
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create template</DialogTitle>
                  <DialogDescription>
                    One item per line. You can reuse this template on future inspections.
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-4" onSubmit={tplForm.handleSubmit(onCreateTemplate)}>
                  <div className="space-y-2">
                    <Label htmlFor="tpl-name">Template name</Label>
                    <Input
                      id="tpl-name"
                      {...tplForm.register("name")}
                      placeholder="Safety walkthrough"
                    />
                    {tplForm.formState.errors.name ? (
                      <FieldError>{tplForm.formState.errors.name.message}</FieldError>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tpl-items">Checklist items</Label>
                    <Textarea
                      id="tpl-items"
                      className="min-h-[140px] font-mono text-sm"
                      placeholder={"PPE verified\nAccess path clear\nEquipment labeled"}
                      {...tplForm.register("itemsText")}
                    />
                    {tplForm.formState.errors.itemsText ? (
                      <FieldError>{tplForm.formState.errors.itemsText.message}</FieldError>
                    ) : null}
                  </div>
                  <DialogFooter>
                    <Button type="submit">Save template</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          }
        >
          <Select
            value={selectedTemplateId || undefined}
            onValueChange={(v) => form.setValue("templateId", v, { shouldValidate: true })}
          >
            <SelectTrigger className="h-12 border-border/80 font-normal hover:bg-accent/40 hover:text-accent-foreground">
              <SelectValue className="text-foreground" placeholder="Select a template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.templateId ? (
            <FieldError>{form.formState.errors.templateId.message}</FieldError>
          ) : null}
        </StepCard>

        {/* Step 3 — Location */}
        <StepCard
          step={3}
          icon={MapPin}
          title="Location"
          description="Site address, building, or room reference."
          optional
          done={!!locationValue?.trim()}
        >
          <Input
            id="location"
            placeholder="e.g. Postjesweg 12, Amsterdam"
            className="h-11"
            {...form.register("location")}
          />
        </StepCard>

        {/* Step 4 — Inspection name */}
        <StepCard
          step={4}
          icon={TypeIcon}
          title="Inspection name"
          description="Auto-filled from the client and date — edit if you like."
          done={!!titleValue?.trim()}
        >
          <Input
            id="title"
            placeholder="Waiting for client and template…"
            className="h-11"
            {...form.register("title")}
          />
          {form.formState.errors.title ? (
            <FieldError>{form.formState.errors.title.message}</FieldError>
          ) : null}
        </StepCard>
      </form>

      {/* RIGHT — live summary + sticky actions */}
      <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <div className="border-b border-border bg-secondary/40 px-5 py-3">
            <div className="eyebrow text-primary">SUMMARY</div>
            <div className="mt-0.5 text-[14px] font-semibold text-foreground">
              {titleValue?.trim() || "New inspection"}
            </div>
          </div>
          <dl className="divide-y divide-border text-[13px]">
            <SummaryRow
              icon={Building2}
              label="Client"
              value={selectedClientName || null}
              placeholder="No client selected"
            />
            <SummaryRow
              icon={ClipboardList}
              label="Template"
              value={selectedTemplateName || null}
              placeholder="No template selected"
            />
            <SummaryRow
              icon={MapPin}
              label="Location"
              value={locationValue?.trim() || null}
              placeholder="Not set"
              dim
            />
            <SummaryRow
              icon={FileText}
              label="Started by you"
              value={new Intl.DateTimeFormat("en-GB", {
                weekday: "short",
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date())}
              dim
            />
          </dl>
        </div>

        {/* Action bar */}
        <div className="flex flex-col gap-2">
          <Button
            type="submit"
            form="new-inspection-form"
            size="lg"
            disabled={!canSubmit || isSubmitting}
            className="w-full justify-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSubmitting ? "Starting…" : "Start inspection"}
            {!isSubmitting ? <ArrowRight className="h-4 w-4" /> : null}
          </Button>
          <Button asChild type="button" variant="ghost" size="sm" className="w-full">
            <Link href="/inspections">Cancel</Link>
          </Button>
          {!canSubmit ? (
            <p className="mt-1 text-center text-[11.5px] text-muted-foreground">
              {clients.length === 0
                ? "Add a client to start your first inspection."
                : "Create a template to start your first inspection."}
            </p>
          ) : null}
        </div>
      </aside>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────── */

function StepCard({
  step,
  icon: Icon,
  title,
  description,
  optional,
  done,
  action,
  children,
}: {
  step: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  optional?: boolean;
  done?: boolean;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-5 shadow-card transition-colors",
        done ? "border-primary/20" : "border-border"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12.5px] font-semibold tabular-nums transition-colors",
              done
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-primary"
            )}
            aria-hidden
          >
            {done ? <Check className="h-4 w-4" strokeWidth={2.6} /> : step}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[14px] font-semibold tracking-[-0.005em] text-foreground">
                {title}
              </span>
              {optional ? (
                <span className="text-[10.5px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                  Optional
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div className="mt-4 pl-0 sm:pl-11">{children}</div>
    </div>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
  placeholder,
  dim,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null;
  placeholder?: string;
  dim?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 px-5 py-3">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10.5px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
          {label}
        </div>
        <div
          className={cn(
            "mt-0.5 truncate text-[13px]",
            value
              ? "font-medium text-foreground"
              : "text-muted-foreground/70 italic",
            dim && value && "font-normal text-muted-foreground"
          )}
        >
          {value ?? placeholder}
        </div>
      </div>
    </div>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1.5 text-[11.5px] font-medium text-destructive">
      {children}
    </p>
  );
}
