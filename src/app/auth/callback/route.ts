import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveOrigin(request: NextRequest): string {
  const envOrigin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  if (envOrigin) return envOrigin;
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (host) return `${proto}://${host}`;
  return new URL(request.url).origin;
}

export async function GET(request: NextRequest) {
  const origin = resolveOrigin(request);

  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const next = requestUrl.searchParams.get("next") || "/me";

    if (!code) {
      return NextResponse.redirect(`${origin}/login?error=missing_code`);
    }

    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[auth/callback] exchange error:", error.message);
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message)}`
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(`${origin}/login?error=no_user`);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("handle")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.handle) {
      const onboardingUrl = new URL("/onboarding", origin);
      if (next !== "/me") onboardingUrl.searchParams.set("next", next);
      return NextResponse.redirect(onboardingUrl);
    }

    return NextResponse.redirect(`${origin}${next}`);
  } catch (err) {
    console.error("[auth/callback] unhandled:", err);
    const message = err instanceof Error ? err.message : "callback_failure";
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(message)}`
    );
  }
}
