import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  /** When false, render image only (e.g. auth screens). */
  withLink?: boolean;
  href?: string;
  height?: number;
};

export function Logo({
  className,
  withLink = true,
  href = "/",
  height = 32,
}: LogoProps) {
  const img = (
    <Image
      src="/keurio_logo_new.jpg"
      alt="Keurio"
      width={160}
      height={height}
      className={cn("h-auto w-auto object-contain", className)}
      style={{ maxHeight: height }}
      priority
    />
  );

  if (withLink) {
    return (
      <Link href={href} className="inline-flex items-center gap-2">
        {img}
      </Link>
    );
  }
  return img;
}
