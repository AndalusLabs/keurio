"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ClientCombobox } from "@/components/clients/client-combobox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const selectedClientName = useMemo(
    () => clients.find((c) => c.id === selectedClientId)?.company_name?.trim() ?? "",
    [clients, selectedClientId]
  );
  const selectedTemplateName = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId)?.name?.trim() ?? "",
    [templates, selectedTemplateId]
  );

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
    >
      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="text-lg">Inspection details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label>Client</Label>
                <Button type="button" variant="link" className="h-auto p-0 text-primary" asChild>
                  <Link href="/clients">Manage clients</Link>
                </Button>
              </div>
              <ClientCombobox
                clients={clients}
                value={form.watch("clientId")}
                onChange={(id) => form.setValue("clientId", id, { shouldValidate: true })}
                disabled={clients.length === 0}
              />
              {form.formState.errors.clientId ? (
                <p className="text-xs text-destructive">{form.formState.errors.clientId.message}</p>
              ) : null}
              {clients.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Add a client first on the{" "}
                  <Link href="/clients" className="font-medium text-primary underline-offset-4 hover:underline">
                    Clients
                  </Link>{" "}
                  page.
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label>Checklist template</Label>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="ghost" size="sm" className="h-8 text-primary">
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
                    <form
                      className="space-y-4"
                      onSubmit={tplForm.handleSubmit(onCreateTemplate)}
                    >
                      <div className="space-y-2">
                        <Label htmlFor="tpl-name">Template name</Label>
                        <Input id="tpl-name" {...tplForm.register("name")} placeholder="Safety walkthrough" />
                        {tplForm.formState.errors.name ? (
                          <p className="text-xs text-destructive">{tplForm.formState.errors.name.message}</p>
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
                          <p className="text-xs text-destructive">
                            {tplForm.formState.errors.itemsText.message}
                          </p>
                        ) : null}
                      </div>
                      <DialogFooter>
                        <Button type="submit" variant="accent">
                          Save template
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <Select
                value={form.watch("templateId") || undefined}
                onValueChange={(v) => form.setValue("templateId", v, { shouldValidate: true })}
              >
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Select a template" />
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
                <p className="text-xs text-destructive">
                  {form.formState.errors.templateId.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location (optional)</Label>
              <Input
                id="location"
                placeholder="e.g. Postjesweg 12"
                {...form.register("location")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Inspection</Label>
              <Input
                id="title"
                placeholder="Auto-filled from client and date/time"
                {...form.register("title")}
              />
              {form.formState.errors.title ? (
                <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
              ) : null}
            </div>
            <Button
              type="submit"
              variant="accent"
              size="lg"
              className="w-full"
              disabled={templates.length === 0 || clients.length === 0}
            >
              Start inspection
            </Button>
            {templates.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">
                Create a template first using &quot;New template&quot;.
              </p>
            ) : null}
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
