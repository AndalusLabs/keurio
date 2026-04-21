/** Only allow internal redirects after login/signup (open-redirect safe). */
const INVITE_PREFIX = "/invite/";

export function safePostAuthPath(nextParam: string | null | undefined): string | null {
  if (nextParam == null || typeof nextParam !== "string") return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(nextParam.trim());
  } catch {
    return null;
  }
  if (!decoded.startsWith("/") || decoded.startsWith("//")) return null;
  const pathOnly = decoded.split("?")[0];
  if (!pathOnly.startsWith(INVITE_PREFIX) || pathOnly.length <= INVITE_PREFIX.length) return null;
  return pathOnly;
}

/** Extract invite token from a path like `/invite/abc123`. */
export function inviteTokenFromPath(invitePath: string | null | undefined): string | null {
  if (!invitePath) return null;
  const pathOnly = invitePath.split("?")[0];
  if (!pathOnly.startsWith(INVITE_PREFIX)) return null;
  const token = pathOnly.slice(INVITE_PREFIX.length).split("/")[0];
  return token.length > 0 ? token : null;
}
