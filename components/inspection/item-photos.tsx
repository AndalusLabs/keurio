"use client";

import { Camera, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { deleteInspectionPhoto, uploadInspectionPhoto } from "@/lib/actions/photos";
import { inspectionPhotoPublicUrl } from "@/lib/utils/storage";
import { toast } from "@/hooks/use-toast";

export type PhotoRow = { id: string; storage_path: string };

type ItemPhotosProps = {
  resultId: string;
  photos: PhotoRow[];
  readOnly?: boolean;
};

export function ItemPhotos({ resultId, photos, readOnly }: ItemPhotosProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.set("resultId", resultId);
    fd.set("file", file);
    const res = await uploadInspectionPhoto(fd);
    setUploading(false);
    if (res.error) {
      toast({ title: "Upload failed", description: res.error, variant: "destructive" });
      return;
    }
    router.refresh();
  }

  async function remove(photo: PhotoRow) {
    const res = await deleteInspectionPhoto(photo.id, photo.storage_path);
    if (res.error) {
      toast({ title: "Could not remove", description: res.error, variant: "destructive" });
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <span className="text-sm font-medium text-muted-foreground">Photos</span>
      <div className="flex flex-wrap gap-2">
        {photos.map((p) => {
          const url = inspectionPhotoPublicUrl(p.storage_path);
          return (
            <div
              key={p.id}
              className="relative h-24 w-24 overflow-hidden rounded-lg border bg-muted"
            >
              {url ? (
                <Image
                  src={url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              ) : null}
              {!readOnly ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute right-1 top-1 h-8 w-8"
                  onClick={() => void remove(p)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          );
        })}
        {!readOnly ? (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(ev) => void onFile(ev)}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border p-2 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary sm:h-24 sm:w-24"
            >
              <Camera className="h-7 w-7 shrink-0 sm:h-8 sm:w-8" aria-hidden />
              <span className="text-center text-xs font-medium leading-tight">
                {uploading ? "…" : "Add photo"}
              </span>
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
