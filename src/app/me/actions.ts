"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();

  // Supabase chunked auth cookie(`sb-XXX-auth-token.0`, `.1` …)를
  // 누락 없이 만료 처리. 라이브러리 signOut이 분할 쿠키 일부를 놓치는
  // 케이스에서 헤더에 잔재가 남아 다음 요청이 거대해지는 걸 방지.
  const cookieStore = await cookies();
  for (const c of cookieStore.getAll()) {
    if (c.name.startsWith("sb-")) {
      cookieStore.set(c.name, "", { maxAge: 0, path: "/" });
    }
  }

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
