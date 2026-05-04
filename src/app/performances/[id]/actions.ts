"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { isStartedKST } from "@/lib/utils/kst";

export type ToggleResult =
  | { ok: true; attended: boolean }
  | { error: "unauthorized" | "not_found" | "too_early" | "db_error"; message?: string };

export async function toggleAttendance(performanceId: string): Promise<ToggleResult> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" };

  const { data: perf } = await supabase
    .from("performances")
    .select("start_date, artist_id")
    .eq("id", performanceId)
    .maybeSingle();
  if (!perf) return { error: "not_found" };

  if (!isStartedKST(perf.start_date)) {
    return { error: "too_early" };
  }

  const { data: existing } = await supabase
    .from("user_attendances")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("performance_id", performanceId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("user_attendances")
      .delete()
      .eq("user_id", user.id)
      .eq("performance_id", performanceId);
    if (error) return { error: "db_error", message: error.message };
  } else {
    const { error } = await supabase
      .from("user_attendances")
      .insert({ user_id: user.id, performance_id: performanceId });
    if (error) return { error: "db_error", message: error.message };
  }

  revalidatePath(`/performances/${performanceId}`);
  revalidatePath("/me");
  revalidatePath("/me/stamps");
  if (perf.artist_id) revalidatePath(`/artists/${perf.artist_id}`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("handle")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.handle) {
    revalidatePath(`/u/${profile.handle}`);
    revalidatePath(`/u/${profile.handle}/opengraph-image`);
  }

  return { ok: true, attended: !existing };
}
