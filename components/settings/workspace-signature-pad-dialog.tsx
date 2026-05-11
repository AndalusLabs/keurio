"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const SignatureCanvas = dynamic(async () => {
  const mod = await import("react-signature-canvas");
  const Base = mod.default;
  const Wrapped = forwardRef<any, any>((props, ref) => <Base ref={ref} {...props} />);
  Wrapped.displayName = "SignatureCanvasNoSSR";
  return Wrapped;
}, { ssr: false }) as any;

const CANVAS_H = 192;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (storagePath: string) => void;
};

export function WorkspaceSignaturePadDialog({ open, onOpenChange, onSuccess }: Props) {
  const sigRef = useRef<any>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(560);
  const [saving, setSaving] = useState(false);

  useLayoutEffect(() => {
    if (!open) return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    const apply = () => {
      const w = Math.max(280, Math.floor(wrap.clientWidth || 560));
      setCanvasWidth(w);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [open]);

  useEffect(() => {
    if (open) {
      sigRef.current?.clear();
    }
  }, [open]);

  function handleClear() {
    const pad = sigRef.current as any;
    if (pad && typeof pad.clear === "function") {
      pad.clear();
      return;
    }
    const canvas = wrapRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  async function handleSave() {
    const pad = sigRef.current as any;
    const hasTrimmed = pad && typeof pad.getTrimmedCanvas === "function";
    const hasIsEmpty = pad && typeof pad.isEmpty === "function";
    const canvas = hasTrimmed
      ? (pad.getTrimmedCanvas() as HTMLCanvasElement)
      : ((wrapRef.current?.querySelector("canvas") as HTMLCanvasElement | null) ?? null);

    if (!canvas) {
      toast({
        title: "Could not save",
        description: "Signature pad is not ready yet. Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (hasIsEmpty && pad.isEmpty()) {
      toast({
        title: "Nothing to save",
        description: "Draw your signature first.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const dataUrl = canvas.toDataURL("image/png");
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], "signature.png", { type: "image/png" });
      const fd = new FormData();
      fd.set("file", file);
      const uploadRes = await fetch("/api/settings/signature", {
        method: "POST",
        body: fd,
      });
      const upload = (await uploadRes.json()) as
        | { ok: true; path?: string }
        | { error: string };
      if (!uploadRes.ok || "error" in upload) {
        const message = "error" in upload ? upload.error : "Could not save signature.";
        toast({ title: "Could not save", description: message, variant: "destructive" });
        return;
      }
      if (upload.path) onSuccess(upload.path);
      toast({ title: "Signature saved" });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Could not save",
        description:
          error instanceof Error ? error.message : "Unexpected error while saving signature.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-4 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Draw your signature</DialogTitle>
          <DialogDescription>
            Sign with touch or mouse. This image is stored on your profile for PDF reports and
            inspection sign-off.
          </DialogDescription>
        </DialogHeader>

        <div
          className={cn(
            "rounded-lg border border-[#b2dbb8]/50 bg-[#b2dbb8]/15 px-3 py-2.5 text-[13px] text-foreground/90"
          )}
        >
          Tip: use your finger on mobile — scroll is disabled while drawing.
        </div>

        <div ref={wrapRef} className="w-full touch-none">
          <SignatureCanvas
            ref={sigRef}
            penColor="#0b1220"
            clearOnResize={false}
            canvasProps={{
              width: canvasWidth,
              height: CANVAS_H,
              className:
                "h-48 w-full touch-none rounded-lg border border-gray-200 bg-white",
            }}
          />
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end sm:gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-12 w-full py-3 sm:w-auto"
            onClick={handleClear}
            disabled={saving}
          >
            Clear
          </Button>
          <Button
            type="button"
            className="min-h-12 w-full bg-[#0f3e18] py-3 text-white hover:bg-[#0d3414] sm:w-auto"
            onClick={() => void handleSave()}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save signature"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
