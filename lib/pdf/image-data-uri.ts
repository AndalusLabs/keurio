/** Fetch a public image URL and return a data URI for @react-pdf/renderer. */
export async function fetchImageDataUri(
  url: string
): Promise<string | undefined> {
  if (!url) return undefined;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return undefined;
    const buf = Buffer.from(await res.arrayBuffer());
    const mime = res.headers.get("content-type") || "image/png";
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return undefined;
  }
}
