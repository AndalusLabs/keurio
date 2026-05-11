"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, PenLine, Upload } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { saveCompanyProfile, saveUserProfile, uploadCompanyLogo } from "@/lib/actions/settings";
import { WorkspaceSignaturePadDialog } from "@/components/settings/workspace-signature-pad-dialog";
import { profileAssetPublicUrl } from "@/lib/utils/storage";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { toast } from "@/hooks/use-toast";
import type { CompanyProfileRow, UserProfileRow } from "@/types";

const workspaceSchema = z.object({
  companyName: z.string(),
  addressStreet: z.string(),
  addressCity: z.string(),
  addressPostalCode: z.string(),
  phone: z.string(),
  kvkNumber: z.string(),
  websiteUrl: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  jobTitle: z.string(),
});

type WorkspaceForm = z.infer<typeof workspaceSchema>;

function mapWorkspace(
  company: CompanyProfileRow | null,
  user: UserProfileRow | null,
  defaultOrganizationName?: string,
  defaultFullName?: string
): WorkspaceForm {
  const fromRow = company?.company_name?.trim();
  const t = defaultFullName?.trim() ?? "";
  let firstName = user?.first_name?.trim() ?? "";
  let lastName = user?.last_name?.trim() ?? "";
  if (!firstName && !lastName && t) {
    const i = t.indexOf(" ");
    if (i === -1) {
      firstName = t;
    } else {
      firstName = t.slice(0, i);
      lastName = t.slice(i + 1).trim();
    }
  }
  return {
    companyName: fromRow || defaultOrganizationName?.trim() || "",
    addressStreet: company?.address_street ?? "",
    addressCity: company?.address_city ?? "",
    addressPostalCode: company?.address_postal_code ?? "",
    phone: company?.phone ?? "",
    kvkNumber: company?.kvk_number ?? "",
    websiteUrl: company?.website_url ?? "",
    firstName,
    lastName,
    jobTitle: user?.job_title ?? "",
  };
}

type Props = {
  initialCompany: CompanyProfileRow | null;
  initialUserProfile: UserProfileRow | null;
  defaultOrganizationName?: string;
  defaultFullName?: string;
};

export function WorkspaceSettingsClient({
  initialCompany,
  initialUserProfile,
  defaultOrganizationName,
  defaultFullName,
}: Props) {
  const router = useRouter();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);

  const [logoPath, setLogoPath] = useState(
    initialCompany?.logo_storage_path ?? null
  );
  const [sigPath, setSigPath] = useState(
    initialUserProfile?.signature_storage_path ?? null
  );
  /** Bumps preview URL when file at same storage path is replaced (upsert). */
  const [sigPreviewBust, setSigPreviewBust] = useState(0);
  const profileUpdatedAt = initialUserProfile?.updated_at ?? "";

  useEffect(() => {
    setLogoPath(initialCompany?.logo_storage_path ?? null);
  }, [initialCompany?.logo_storage_path]);

  useEffect(() => {
    setSigPath(initialUserProfile?.signature_storage_path ?? null);
  }, [initialUserProfile?.signature_storage_path]);

  useEffect(() => {
    setSigPreviewBust(0);
  }, [profileUpdatedAt]);

  const form = useForm<WorkspaceForm>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: mapWorkspace(
      initialCompany,
      initialUserProfile,
      defaultOrganizationName,
      defaultFullName
    ),
  });

  const syncKey = [
    initialCompany?.updated_at,
    initialCompany?.logo_storage_path,
    initialUserProfile?.updated_at,
    initialUserProfile?.signature_storage_path,
    defaultOrganizationName,
    defaultFullName,
  ].join("|");

  useEffect(() => {
    form.reset(
      mapWorkspace(
        initialCompany,
        initialUserProfile,
        defaultOrganizationName,
        defaultFullName
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncKey]);

  useUnsavedChanges(form.formState.isDirty);

  async function onSubmit(values: WorkspaceForm) {
    setSaving(true);
    let web = values.websiteUrl.trim();
    if (web && !/^https?:\/\//i.test(web)) {
      web = `https://${web}`;
    }
    const companyRes = await saveCompanyProfile({
      companyName: values.companyName,
      addressStreet: values.addressStreet,
      addressCity: values.addressCity,
      addressPostalCode: values.addressPostalCode,
      phone: values.phone,
      kvkNumber: values.kvkNumber,
      websiteUrl: web,
    });
    if (companyRes.error) {
      setSaving(false);
      toast({
        title: "Could not save",
        description: companyRes.error,
        variant: "destructive",
      });
      return;
    }
    const profileRes = await saveUserProfile({
      firstName: values.firstName,
      lastName: values.lastName,
      jobTitle: values.jobTitle,
    });
    setSaving(false);
    if (profileRes.error) {
      toast({
        title: "Could not save profile",
        description: profileRes.error,
        variant: "destructive",
      });
      return;
    }
    form.reset({ ...values, websiteUrl: web });
    toast({ title: "Workspace saved" });
    router.refresh();
  }

  async function onLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingLogo(true);
    const fd = new FormData();
    fd.set("file", file);
    const res = await uploadCompanyLogo(fd);
    setUploadingLogo(false);
    if (res.error) {
      toast({
        title: "Upload failed",
        description: res.error,
        variant: "destructive",
      });
      return;
    }
    if (res.path) setLogoPath(res.path);
    toast({ title: "Logo updated" });
    router.refresh();
  }

  const logoUrl = logoPath ? profileAssetPublicUrl(logoPath) : "";
  const sigUrl = (() => {
    if (!sigPath) return "";
    const base = profileAssetPublicUrl(sigPath);
    const v =
      sigPreviewBust > 0
        ? `b${sigPreviewBust}`
        : profileUpdatedAt
          ? encodeURIComponent(profileUpdatedAt)
          : "";
    return v ? `${base}?v=${v}` : base;
  })();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Workspace
        </h1>
        <p className="mt-1 text-sm text-muted-foreground md:text-base">
          Organization and personal details used on generated PDF reports.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Organization</CardTitle>
            <CardDescription>
              Shown on the top of inspection PDFs (left: details, right: logo).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="companyName">Organization name</Label>
              <Input id="companyName" {...form.register("companyName")} />
            </div>
            <div className="space-y-2">
              <Label>Organization logo</Label>
              <div className="flex flex-wrap items-end gap-4">
                <div className="relative h-20 w-40 overflow-hidden rounded-lg border bg-muted">
                  {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt="Organization logo"
                      fill
                      className="object-contain p-1"
                      sizes="160px"
                      unoptimized={logoUrl.endsWith(".svg")}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      No logo
                    </div>
                  )}
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(ev) => void onLogoFile(ev)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingLogo}
                  onClick={() => logoInputRef.current?.click()}
                >
                  {uploadingLogo ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Upload
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressStreet">Street</Label>
              <Input id="addressStreet" {...form.register("addressStreet")} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="addressPostalCode">Postal code</Label>
                <Input id="addressPostalCode" {...form.register("addressPostalCode")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressCity">City</Label>
                <Input id="addressCity" {...form.register("addressCity")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" {...form.register("phone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kvkNumber">KVK number</Label>
              <Input id="kvkNumber" {...form.register("kvkNumber")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Website URL</Label>
              <Input
                id="websiteUrl"
                type="url"
                placeholder="https://example.com"
                {...form.register("websiteUrl")}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Personal profile</CardTitle>
            <CardDescription>Name, title and signature on PDF reports.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" {...form.register("firstName")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" {...form.register("lastName")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job title</Label>
              <Input
                id="jobTitle"
                placeholder="HVAC Technician"
                {...form.register("jobTitle")}
              />
            </div>
            <div className="space-y-2">
              <Label>Signature</Label>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="relative h-28 w-full max-w-md overflow-hidden rounded-lg border border-border bg-muted">
                  {sigUrl ? (
                    <Image
                      key={sigUrl}
                      src={sigUrl}
                      alt="Your saved signature"
                      fill
                      className="object-contain p-2"
                      sizes="(max-width: 768px) 100vw, 448px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
                      No signature yet — add one to use on PDFs and sign-offs.
                    </div>
                  )}
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[11rem]">
                  {!sigPath ? (
                    <Button
                      type="button"
                      className="min-h-12 gap-2 bg-[#0f3e18] py-3 text-white hover:bg-[#0d3414]"
                      onClick={() => setSignatureDialogOpen(true)}
                    >
                      <PenLine className="h-4 w-4" />
                      Add signature
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="link"
                      className="min-h-12 h-auto py-3 text-base font-semibold text-[#0f3e18] underline-offset-4 hover:text-[#0f3e18] hover:no-underline"
                      onClick={() => setSignatureDialogOpen(true)}
                    >
                      Re-sign
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator className="opacity-60" />

        <div className="flex justify-end pb-8 md:pb-0">
          <Button type="submit" size="lg" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save workspace"
            )}
          </Button>
        </div>
      </form>

      <WorkspaceSignaturePadDialog
        open={signatureDialogOpen}
        onOpenChange={setSignatureDialogOpen}
        onSuccess={(path) => {
          setSigPath(path);
          setSigPreviewBust((n) => n + 1);
          router.refresh();
        }}
      />
    </div>
  );
}
