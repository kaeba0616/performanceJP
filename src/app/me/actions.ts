"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function updateProfile(formData: FormData) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const display_name = (formData.get("display_name") as string | null)?.trim() || null;
  const bio = (formData.get("bio") as string | null)?.trim() || null;
  const avatar_url = (formData.get("avatar_url") as string | null)?.trim() || null;
  const is_public = formData.get("is_public") === "on";

  const { error } = await supabase
    .from("profiles")
    .update({ display_name, bio, avatar_url, is_public })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/me");
  revalidatePath("/me/settings");

  const { data: profile } = await supabase
    .from("profiles")
    .select("handle")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.handle) {
    revalidatePath(`/u/${profile.handle}`);
  }

  return { ok: true };
}
