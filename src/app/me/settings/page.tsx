import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { signOut, updateProfile } from "@/app/me/actions";
import { LogOut } from "lucide-react";
import { SettingsForm } from "./SettingsForm";

export const metadata = {
  title: "설정 | THE PULSE",
};

export default async function SettingsPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/me/settings");

  const { data: profile } = await supabase
    .from("profiles")
    .select("handle, display_name, avatar_url, bio, is_public")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.handle) redirect("/onboarding");

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <header className="mb-10">
        <h1 className="editorial-title text-3xl font-black tracking-tighter text-primary">
          SETTINGS
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          @{profile.handle} · {user.email}
        </p>
      </header>

      <SettingsForm
        initial={{
          display_name: profile.display_name ?? "",
          bio: profile.bio ?? "",
          avatar_url: profile.avatar_url ?? "",
          is_public: profile.is_public,
        }}
        action={updateProfile}
      />

      <section className="mt-10 pt-8 border-t border-outline-variant">
        <h2 className="text-xs font-bold tracking-widest text-on-surface-variant mb-3">
          계정
        </h2>
        <form action={signOut}>
          <button
            type="submit"
            className="inline-flex items-center gap-2 text-sm text-error font-semibold hover:underline"
          >
            <LogOut className="w-4 h-4" />
            로그아웃
          </button>
        </form>
      </section>
    </div>
  );
}
