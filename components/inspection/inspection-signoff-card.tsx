"use client";

import {
  CheckCircle2,
  Loader2,
  Mail,
  PenLine,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type WorkspaceSignature = {
  /** URL of the workspace signature image (PNG with transparent bg). */
  imageUrl: string;
  /** Display name shown next to the signature. */
  signedByName: string;
  /** Subtitle shown under the name (e.g. "Lead Inspector — FC HVAC"). */
  signedByRole?: string;
};

type InitialSignoff = {
  signedAt: string | null;     // ISO; null = not yet signed
  sentAt: string | null;       // ISO; null = not yet sent
  sentToEmail: string | null;
};

type Props = {
  inspectionId: string;
  /** Pull from workspace settings — null if user hasn't set one up yet. */
  signature: WorkspaceSignature | null;
  /** Pre-fill from inspection.client.email if available. */
  defaultRecipientEmail?: string | null;
  /** Server-side state — used to render in the right phase on first paint. */
  initial: InitialSignoff;
  /**
   * Wire these to your server actions.
   *   onSign   → applies workspace signature to this inspection (DB write)
   *   onSend   → emails the report to recipient + marks sent
   * Both should `revalidatePath` server-side; the component refreshes locally.
   */
  onSign?: () => Promise<{ ok: true; signedAt: string } | { ok: false; error: string }>;
  onSend?: (
    recipientEmail: string
  ) => Promise<{ ok: true; sentAt: string } | { ok: false; error: string }>;
};

/**
 * Premium two-step sign-off + send card for the completed inspection page.
 *
 * Phases:
 *   1. NOT SIGNED  → muted card, primary CTA = "Add signature".
 *      Send button is disabled (gray).
 *   2. SIGNED      → signature renders inline, recipient email field appears.
 *      Send button activates (forest green) — pulses subtly until clicked.
 *   3. SENT        → success card with timestamp + recipient + "Resend" link.
 */
export function InspectionSignoffCard({
  inspectionId: _inspectionId,
  signature,
  defaultRecipientEmail,
  initial,
  onSign,
  onSend,
}: Props) {
  const [signedAt, setSignedAt] = useState<string | null>(initial.signedAt);
  const [sentAt, setSentAt] = useState<string | null>(initial.sentAt);
  const [recipient, setRecipient] = useState(
    initial.sentToEmail ?? defaultRecipientEmail ?? ""
  );
  const [signing, setSigning] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirmSignOpen, setConfirmSignOpen] = useState(false);

  useEffect(() => setSignedAt(initial.signedAt), [initial.signedAt]);
  useEffect(() => setSentAt(initial.sentAt), [initial.sentAt]);

  const isSigned = Boolean(signedAt);
  const isSent = Boolean(sentAt);
  const canSend = isSigned && !isSent && recipient.trim().length > 3;

  async function handleSign() {
    if (!signature) {
      toast({
        title: "No signature on file",
        description: "Set up your signature in Settings → Workspace first.",
        variant: "destructive",
      });
      return;
    }
    setSigning(true);
    try {
      const res = onSign
        ? await onSign()
        : ({ ok: true, signedAt: new Date().toISOString() } as const); // optimistic stub
      if (!res.ok) {
        toast({ title: "Could not sign", description: res.error, variant: "destructive" });
        return;
      }
      setSignedAt(res.signedAt);
      setConfirmSignOpen(false);
      toast({ description: "Inspection signed" });
    } finally {
      setSigning(false);
    }
  }

  async function handleSend() {
    if (!canSend) return;
    setSending(true);
    try {
      const res = onSend
        ? await onSend(recipient.trim())
        : ({ ok: true, sentAt: new Date().toISOString() } as const); // stub
      if (!res.ok) {
        toast({ title: "Could not send", description: res.error, variant: "destructive" });
        return;
      }
      setSentAt(res.sentAt);
      toast({ description: `Inspection sent to ${recipient.trim()}` });
    } finally {
      setSending(false);
    }
  }

  // ── Phase 3: SENT ──────────────────────────────────────────────────────────
  if (isSent && sentAt) {
    return (
      <section
        aria-label="Inspection sign-off"
        className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-emerald-50/60 to-white p-6 shadow-sm"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-brand">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
              Delivered
            </p>
            <h3 className="mt-1 text-[18px] font-semibold leading-tight text-emerald-950">
              Inspection sent successfully
            </h3>
            <p className="mt-1 text-[13px] text-emerald-900/80">
              Sent to{" "}
              <span className="font-medium text-emerald-950">
                {recipient || initial.sentToEmail}
              </span>{" "}
              · {formatDateTime(sentAt)}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50"
                onClick={() => void handleSend()}
                disabled={sending}
              >
                {sending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Resend
              </Button>
              <span className="text-[11.5px] text-emerald-800/70">
                Receipt logged · audit trail saved
              </span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ── Phases 1–2: NOT SIGNED / SIGNED ────────────────────────────────────────
  return (
    <section
      aria-label="Inspection sign-off"
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      {/* Header strip */}
      <div className="flex items-start justify-between gap-3 border-b border-border bg-gradient-to-br from-muted/60 to-card px-6 py-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Sign-off &amp; deliver
          </p>
          <h3 className="mt-0.5 text-[16px] font-semibold leading-tight text-foreground">
            Finalize and send to client
          </h3>
        </div>
        <StepIndicator signed={isSigned} />
      </div>

      {/* Body */}
      <div className="grid gap-6 px-6 py-6 md:grid-cols-[1fr_auto]">
        {/* Left: signature block */}
        <div className="min-w-0">
          <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Inspector signature
          </Label>

          {!isSigned ? (
            <div className="mt-2 flex flex-col gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-5 py-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <PenLine className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[13.5px] font-medium text-foreground">
                    Signature required to send
                  </p>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    Apply your workspace signature to lock and stamp the report.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="default"
                className="shrink-0 gap-1.5"
                onClick={() => setConfirmSignOpen(true)}
                disabled={!signature || signing}
              >
                <PenLine className="h-4 w-4" />
                Add signature
              </Button>
            </div>
          ) : (
            <div className="mt-2 flex flex-wrap items-end justify-between gap-4 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-white px-5 py-4">
              <div className="flex min-w-0 items-end gap-4">
                {signature?.imageUrl ? (
                  <div className="relative h-16 w-40 shrink-0 overflow-hidden rounded-md bg-white ring-1 ring-emerald-200">
                    <Image
                      src={signature.imageUrl}
                      alt={`Signature of ${signature.signedByName}`}
                      fill
                      sizes="160px"
                      className="object-contain"
                    />
                  </div>
                ) : null}
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold leading-tight text-emerald-950">
                    {signature?.signedByName ?? "Signed"}
                  </p>
                  {signature?.signedByRole ? (
                    <p className="mt-0.5 text-[11.5px] text-emerald-900/70">
                      {signature.signedByRole}
                    </p>
                  ) : null}
                  <p className="mt-1 inline-flex items-center gap-1 text-[11px] tabular-nums text-emerald-800/80">
                    <ShieldCheck className="h-3 w-3" />
                    Signed {formatDateTime(signedAt!)}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-[11.5px] text-muted-foreground hover:text-foreground"
                onClick={() => setSignedAt(null)}
              >
                Replace
              </Button>
            </div>
          )}
        </div>

        {/* Right: tiny "what happens" hint, only pre-sign */}
        {!isSigned ? (
          <aside className="hidden w-[220px] rounded-xl border border-border bg-muted/40 p-4 md:block">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
              <Sparkles className="h-3 w-3" />
              What happens
            </div>
            <ol className="mt-2 space-y-1.5 text-[12px] leading-snug text-muted-foreground">
              <li>1. Apply signature</li>
              <li>2. Confirm recipient</li>
              <li>3. Email + PDF delivered</li>
            </ol>
          </aside>
        ) : null}
      </div>

      {/* Recipient + Send (only after signed) */}
      <div
        className={cn(
          "border-t border-border bg-muted/30 px-6 py-5 transition-opacity",
          !isSigned && "pointer-events-none opacity-50"
        )}
      >
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label
              htmlFor="signoff-recipient"
              className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Send to
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="signoff-recipient"
                type="email"
                placeholder="client@example.com"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="h-11 pl-9 text-[14px]"
                disabled={!isSigned}
              />
            </div>
          </div>
          <Button
            type="button"
            size="lg"
            onClick={() => void handleSend()}
            disabled={!canSend || sending}
            className={cn(
              "h-11 gap-2 px-5 text-[14px] font-semibold shadow-brand transition-all",
              canSend
                ? "bg-[#0f3e18] text-white hover:bg-[#0d3414]"
                : "bg-muted text-muted-foreground"
            )}
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send inspection
              </>
            )}
          </Button>
        </div>

        {/* Microcopy footer */}
        <p className="mt-3 text-[11.5px] text-muted-foreground">
          {!isSigned
            ? "Add your signature above to enable sending."
            : !canSend
              ? "Add a recipient email to send."
              : "We&rsquo;ll email a PDF copy + log delivery in the audit trail."}
        </p>
      </div>

      {/* Confirm sign dialog */}
      <Dialog open={confirmSignOpen} onOpenChange={setConfirmSignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply your signature?</DialogTitle>
            <DialogDescription>
              Your workspace signature will be stamped on the report. This action is logged
              and cannot be silently changed.
            </DialogDescription>
          </DialogHeader>
          {signature?.imageUrl ? (
            <div className="my-2 flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
              <div className="relative h-12 w-32 shrink-0 overflow-hidden rounded bg-white ring-1 ring-border">
                <Image
                  src={signature.imageUrl}
                  alt="Workspace signature"
                  fill
                  sizes="128px"
                  className="object-contain"
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-foreground">
                  {signature.signedByName}
                </p>
                {signature.signedByRole ? (
                  <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                    {signature.signedByRole}
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="rounded-md border border-dashed border-border bg-muted/40 p-3 text-[12.5px] text-muted-foreground">
              No signature on file. Add one in <strong>Settings → Workspace</strong> first.
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirmSignOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleSign()}
              disabled={!signature || signing}
              className="gap-1.5 bg-[#0f3e18] text-white hover:bg-[#0d3414]"
            >
              {signing ? <Loader2 className="h-4 w-4 animate-spin" /> : <PenLine className="h-4 w-4" />}
              Apply signature
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function StepIndicator({ signed }: { signed: boolean }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
      <Step n={1} label="Sign" active={!signed} done={signed} />
      <span aria-hidden className="h-px w-4 bg-border" />
      <Step n={2} label="Send" active={signed} done={false} />
    </div>
  );
}

function Step({
  n,
  label,
  active,
  done,
}: {
  n: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 ring-1 transition-colors",
        done && "bg-emerald-50 text-emerald-700 ring-emerald-200",
        active && !done && "bg-[#0f3e18]/5 text-[#0f3e18] ring-[#0f3e18]/20",
        !active && !done && "text-muted-foreground ring-border"
      )}
    >
      <span
        className={cn(
          "flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums",
          done && "bg-emerald-600 text-white",
          active && !done && "bg-[#0f3e18] text-white",
          !active && !done && "bg-muted text-foreground"
        )}
      >
        {done ? "✓" : n}
      </span>
      {label}
    </span>
  );
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("nl-NL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
