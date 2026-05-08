import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import { safePostAuthPath } from "@/lib/utils/auth-redirect";

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database, "public", any>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const remember = request.cookies.get("keurio_remember")?.value === "1";
  const sessionOnly = request.cookies.get("keurio_session")?.value === "1";

  const isLoginRoute = request.nextUrl.pathname.startsWith("/login");
  const isSignupRoute = request.nextUrl.pathname.startsWith("/signup");
  const isAuthRoute = isLoginRoute || isSignupRoute;
  const isOnboardingRoute = request.nextUrl.pathname.startsWith("/onboarding");
  const isInviteRoute = request.nextUrl.pathname.startsWith("/invite");
  const isPublicAsset =
    request.nextUrl.pathname.startsWith("/_next") ||
    /\.(ico|png|jpg|jpeg|svg|gif|webp|txt)$/.test(request.nextUrl.pathname);

  if (!user && !isAuthRoute && !isPublicAsset && !isInviteRoute) {
    const next = request.nextUrl.clone();
    next.pathname = "/login";
    return NextResponse.redirect(next);
  }

  // Session-only login: if browser session marker is gone, expire Supabase auth too.
  if (user && !remember && !sessionOnly) {
    await supabase.auth.signOut();
    const next = request.nextUrl.clone();
    next.pathname = "/login";
    next.search = "";
    return NextResponse.redirect(next);
  }

  if (user && isLoginRoute) {
    if (request.nextUrl.searchParams.get("error")) {
      return supabaseResponse;
    }
    const inviteNext = safePostAuthPath(request.nextUrl.searchParams.get("next"));
    if (inviteNext) {
      const next = request.nextUrl.clone();
      next.pathname = inviteNext;
      next.search = "";
      return NextResponse.redirect(next);
    }
    const dash = request.nextUrl.clone();
    dash.pathname = "/dashboard";
    return NextResponse.redirect(dash);
  }

  // Organization gate: if logged in but no org membership, force onboarding.
  if (user && !isAuthRoute && !isPublicAsset && !isOnboardingRoute && !isInviteRoute) {
    const { data: membership } = await supabase
      .from("organization_members")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      // If user lands on root without an org, do not keep stale session around.
      if (request.nextUrl.pathname === "/") {
        await supabase.auth.signOut();
        const login = request.nextUrl.clone();
        login.pathname = "/login";
        login.search = "";
        const out = NextResponse.redirect(login);
        out.cookies.delete("keurio_session");
        out.cookies.delete("keurio_remember");
        return out;
      }
      const next = request.nextUrl.clone();
      next.pathname = "/onboarding";
      return NextResponse.redirect(next);
    }
  }

  return supabaseResponse;
}
