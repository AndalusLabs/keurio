"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PageHeader } from "@/components/shared/page-header";
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
import {
  saveCompanyProfile,
  saveUserProfile,
  uploadCompanyLogo,
  uploadSignature,
} from "@/lib/actions/settings";
import { profileAssetPublicUrl } from "@/lib/utils/storage";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { toast } from "@/hooks/use-toast";
import type { CompanyProfileRow, UserProfileRow } from "@/types";

const companySchema = z.object({
  companyName: z.string(),
  addressStreet: z.string(),
  addressCity: z.string(),
  addressPostalCode: z.string(),
  phone: z.string(),
  kvkNumber: z.string(),
  websiteUrl: z.string(),
});

const techSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  jobTitle: z.string(),
});

type CompanyForm = z.infer<typeof companySchema>;
type TechForm = z.infer<typeof techSchema>;

function mapCompany(
  row: CompanyProfileRow | null,
  defaultOrganizationName?: string
): CompanyForm {
  const fromRow = row?.company_name?.trim();
  return {
    companyName: fromRow || defaultOrganizationName?.trim() || "",
    addressStreet: row?.address_street ?? "",
    addressCity: row?.address_city ?? "",
    addressPostalCode: row?.address_postal_code ?? "",
    phone: row?.phone ?? "",
    kvkNumber: row?.kvk_number ?? "",
    websiteUrl: row?.website_url ?? "",
  };
}

function splitFullName(full: string): { firstName: string; lastName: string } {
  const t = full.trim();
  if (!t) return { firstName: "", lastName: "" };
  const i = t.indexOf(" ");
  if (i === -1) return { firstName: t, lastName: "" };
  return { firstName: t.slice(0, i), lastName: t.slice(i + 1).trim() };
}

function mapTech(
  row: UserProfileRow | null,
  defaultFullName?: string
): TechForm {
  const fb = splitFullName(defaultFullName ?? "");
  return {
    firstName: row?.first_name?.trim() || fb.firstName,
    lastName: row?.last_name?.trim() || fb.lastName,
    jobTitle: row?.job_title ?? "",
  };
}

type SettingsPageClientProps = {
  initialCompany: CompanyProfileRow | null;
  initialUserProfile: UserProfileRow | null;
  /** From onboarding / org when company_profiles.company_name is empty. */
  defaultOrganizationName?: string;
  /** From public.users.full_name when user_profiles names are empty. */
  defaultFullName?: string;
};

export function SettingsPageClient({
  initialCompany,
  initialUserProfile,
  defaultOrganizationName,
  defaultFullName,
}: SettingsPageClientProps) {
  const router = useRouter();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const sigInputRef = useRef<HTMLInputElement>(null);
  const [savingCompany, setSavingCompany] = useState(false);
  const [savingTech, setSavingTech] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSig, setUploadingSig] = useState(false);

  const [logoPath, setLogoPath] = useState(
    initialCompany?.logo_storage_path ?? null
  );
  const [sigPath, setSigPath] = useState(
    initialUserProfile?.signature_storage_path ?? null
  );

  useEffect(() => {
    setLogoPath(initialCompany?.logo_storage_path ?? null);
  }, [initialCompany?.logo_storage_path]);

  useEffect(() => {
    setSigPath(initialUserProfile?.signature_storage_path ?? null);
  }, [initialUserProfile?.signature_storage_path]);

  const companyForm = useForm<CompanyForm>({
    resolver: zodResolver(companySchema),
    defaultValues: mapCompany(initialCompany, defaultOrganizationName),
  });

  const techForm = useForm<TechForm>({
    resolver: zodResolver(techSchema),
    defaultValues: mapTech(initialUserProfile, defaultFullName),
  });

  const companySyncKey = [
    initialCompany?.updated_at,
    initialCompany?.logo_storage_path,
    defaultOrganizationName,
  ].join("|");
  const techSyncKey = [
    initialUserProfile?.updated_at,
    initialUserProfile?.signature_storage_path,
    defaultFullName,
  ].join("|");

  useEffect(() => {
    companyForm.reset(mapCompany(initialCompany, defaultOrganizationName));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync when server data version changes
  }, [companySyncKey]);

  useEffect(() => {
    techForm.reset(mapTech(initialUserProfile, defaultFullName));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [techSyncKey]);

  const dirty =
    companyForm.formState.isDirty || techForm.formState.isDirty;
  useUnsavedChanges(dirty);

  async function onSaveCompany(values: CompanyForm) {
    setSavingCompany(true);
    let web = values.websiteUrl.trim();
    if (web && !/^https?:\/\//i.test(web)) {
      web = `https://${web}`;
    }
    const res = await saveCompanyProfile({
      ...values,
      websiteUrl: web,
    });
    setSavingCompany(false);
    if (res.error) {
      toast({
        title: "Could not save",
        description: res.error,
        variant: "destructive",
      });
      return;
    }
    companyForm.reset({ ...values, websiteUrl: web });
    toast({ title: "Organization profile saved" });
    router.refresh();
  }

  async function onSaveTech(values: TechForm) {
    setSavingTech(true);
    const res = await saveUserProfile(values);
    setSavingTech(false);
    if (res.error) {
      toast({
        title: "Could not save",
        description: res.error,
        variant: "destructive",
      });
      return;
    }
    techForm.reset(values);
    toast({ title: "Profile saved" });
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

  async function onSigFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingSig(true);
    const fd = new FormData();
    fd.set("file", file);
    const res = await uploadSignature(fd);
    setUploadingSig(false);
    if (res.error) {
      toast({
        title: "Upload failed",
        description: res.error,
        variant: "destructive",
      });
      return;
    }
    if (res.path) setSigPath(res.path);
    toast({ title: "Signature updated" });
    router.refresh();
  }

  const logoUrl = logoPath ? profileAssetPublicUrl(logoPath) : "";
  const sigUrl = sigPath ? profileAssetPublicUrl(sigPath) : "";

  return (
    <div className="space-y-10">
      <PageHeader
        title="Settings"
        description="Organization and profile details appear on generated PDF reports."
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="text-lg">Organization profile</CardTitle>
            <CardDescription>
              Shown on the top of inspection PDFs (left: details, right: logo).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-5"
              onSubmit={companyForm.handleSubmit(onSaveCompany)}
            >
              <div className="space-y-2">
                <Label htmlFor="companyName">Organization name</Label>
                <Input
                  id="companyName"
                  {...companyForm.register("companyName")}
                />
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
                <Input
                  id="addressStreet"
                  {...companyForm.register("addressStreet")}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="addressPostalCode">Postal code</Label>
                  <Input
                    id="addressPostalCode"
                    {...companyForm.register("addressPostalCode")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressCity">City</Label>
                  <Input
                    id="addressCity"
                    {...companyForm.register("addressCity")}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" {...companyForm.register("phone")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kvkNumber">KVK number</Label>
                <Input id="kvkNumber" {...companyForm.register("kvkNumber")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="websiteUrl">Website URL</Label>
                <Input
                  id="websiteUrl"
                  type="url"
                  placeholder="https://example.com"
                  {...companyForm.register("websiteUrl")}
                />
              </div>
              <Button type="submit" variant="accent" disabled={savingCompany}>
                {savingCompany ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save organization profile"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="text-lg">My profile</CardTitle>
            <CardDescription>
              Name, title and signature on PDF reports.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-5"
              onSubmit={techForm.handleSubmit(onSaveTech)}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input id="firstName" {...techForm.register("firstName")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input id="lastName" {...techForm.register("lastName")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job title</Label>
                <Input
                  id="jobTitle"
                  placeholder="HVAC Technician"
                  {...techForm.register("jobTitle")}
                />
              </div>
              <div className="space-y-2">
                <Label>Signature</Label>
                <div className="flex flex-wrap items-end gap-4">
                  <div className="relative h-24 w-48 overflow-hidden rounded-lg border bg-muted">
                    {sigUrl ? (
                      <Image
                        src={sigUrl}
                        alt="Signature"
                        fill
                        className="object-contain p-1"
                        sizes="192px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                        No signature
                      </div>
                    )}
                  </div>
                  <input
                    ref={sigInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    className="hidden"
                    onChange={(ev) => void onSigFile(ev)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadingSig}
                    onClick={() => sigInputRef.current?.click()}
                  >
                    {uploadingSig ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    Upload
                  </Button>
                </div>
              </div>
              <Button type="submit" disabled={savingTech}>
                {savingTech ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save profile"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
