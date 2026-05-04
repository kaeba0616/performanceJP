import Link from "next/link";
import { redirect } from "next/navigation";
import { Settings, Share2, ExternalLink } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";

export const metadata = {
  title: "내 프로필 | THE PULSE",
};

export default async function MePage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/me");

  const { data: profile } = await supabase
    .from("profiles")
    .select("handle, display_name, avatar_url, bio, is_public")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.handle) redirect("/onboarding");

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <header className="flex items-start justify-between gap-4 mb-10">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center text-2xl font-black">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              profile.handle?.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <div className="text-xs font-semibold tracking-widest text-on-surface-variant">
              @{profile.handle}
            </div>
            <h1 className="text-2xl font-black tracking-tight text-on-surface">
              {profile.display_name || profile.handle}
            </h1>
          </div>
        </div>
        <Link
          href="/me/settings"
          className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary transition"
        >
          <Settings className="w-4 h-4" />
          설정
        </Link>
      </header>

      <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 mb-6">
        <div className="grid grid-cols-3 gap-6 text-center">
          <Stat label="누적 스탬프" value="—" hint="PR2에서 활성화" />
          <Stat label="첫 관람일" value="—" />
          <Stat label="칭호" value="준비 중" />
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6">
        <h2 className="editorial-title-sm text-base font-bold tracking-tight text-on-surface mb-4">
          빠른 링크
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/me/stamps"
            className="inline-flex items-center gap-2 bg-primary-fixed text-on-primary-fixed font-semibold px-4 py-2 rounded-full text-sm hover:bg-primary-fixed-dim transition"
          >
            내 스탬프 보기
          </Link>
          {profile.is_public ? (
            <Link
              href={`/u/${profile.handle}`}
              className="inline-flex items-center gap-2 bg-surface-container text-on-surface-variant font-semibold px-4 py-2 rounded-full text-sm hover:bg-surface-container-high transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              공개 프로필 (PR3에서 활성화)
              <ExternalLink className="w-3 h-3" />
            </Link>
          ) : (
            <span className="inline-flex items-center gap-2 bg-surface-container text-on-surface-variant font-semibold px-4 py-2 rounded-full text-sm">
              비공개 모드 — 설정에서 변경 가능
            </span>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <div className="text-3xl font-black tracking-tighter text-primary">{value}</div>
      <div className="mt-1 text-xs font-semibold tracking-widest text-on-surface-variant">
        {label}
      </div>
      {hint && (
        <div className="mt-0.5 text-[10px] text-on-surface-variant/70">{hint}</div>
      )}
    </div>
  );
}
