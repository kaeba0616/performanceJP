import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { signOut } from "@/app/me/actions";
import { UserMenuClient } from "./UserMenuClient";

export async function UserMenu() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Link
        href="/login"
        className="hidden sm:inline-flex items-center text-sm font-bold tracking-tight text-on-surface-variant hover:text-primary px-3 py-1.5 transition-colors"
      >
        로그인
      </Link>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("handle, display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const handle = profile?.handle ?? null;
  const initial = (handle ?? user.email ?? "?").charAt(0).toUpperCase();

  return (
    <UserMenuClient
      handle={handle}
      displayName={profile?.display_name ?? null}
      avatarUrl={profile?.avatar_url ?? null}
      initial={initial}
      email={user.email ?? ""}
      signOutAction={signOut}
    />
  );
}
