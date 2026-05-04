import Link from "next/link";
import { redirect } from "next/navigation";
import { Settings, Share2, Stamp as StampIcon, ArrowRight } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";
import { getStampTitle } from "@/lib/stamps/title";
import { formatDate } from "@/lib/utils/date";

export const metadata = {
  title: "내 프로필 | THE PULSE",
};

interface RecentRow {
  attended_at: string;
  performance: {
    id: string;
    title: string;
    start_date: string;
    image_url: string | null;
    artist: { name_ko: string } | null;
  } | null;
}

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

  const { count } = await supabase
    .from("user_attendances")
    .select("user_id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const total = count ?? 0;
  const title = getStampTitle(total);

  const { data: recent } = await supabase
    .from("user_attendances")
    .select(
      "attended_at, performance:performances(id, title, start_date, image_url, artist:artists(name_ko))"
    )
    .eq("user_id", user.id)
    .order("attended_at", { ascending: false })
    .limit(3);
  const recentRows = (recent ?? []) as unknown as RecentRow[];

  const { data: firstStamp } =
    total > 0
      ? await supabase
          .from("user_attendances")
          .select("performance:performances(start_date)")
          .eq("user_id", user.id)
          .order("attended_at", { ascending: true })
          .limit(1)
          .maybeSingle()
      : { data: null };
  const firstDate =
    (firstStamp as { performance: { start_date: string } | null } | null)
      ?.performance?.start_date ?? null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <header className="flex items-start justify-between gap-4 mb-10">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center text-2xl font-black overflow-hidden">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
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
          <Stat label="누적 스탬프" value={String(total)} />
          <Stat label="첫 관람일" value={firstDate ? formatDate(firstDate) : "—"} />
          <Stat label="칭호" value={`${title.emoji} ${title.title}`} />
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="editorial-title-sm text-base font-bold tracking-tight text-on-surface">
            최근 스탬프
          </h2>
          <Link
            href="/me/stamps"
            className="inline-flex items-center gap-1 text-xs font-bold tracking-widest text-primary uppercase hover:underline"
          >
            전체 보기 <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {recentRows.length === 0 ? (
          <div className="text-sm text-on-surface-variant text-center py-6">
            <StampIcon className="w-8 h-8 text-on-surface-variant/40 mx-auto mb-2" />
            다녀온 공연에서 <span className="font-bold">다녀왔어요</span> 버튼을 눌러보세요.
          </div>
        ) : (
          <ul className="space-y-3">
            {recentRows.map(
              (row) =>
                row.performance && (
                  <li key={row.performance.id}>
                    <Link
                      href={`/performances/${row.performance.id}`}
                      className="flex items-center gap-3 hover:bg-surface-container-low rounded-xl p-2 -mx-2 transition"
                    >
                      <div className="w-10 h-10 rounded-lg bg-surface-container-high overflow-hidden shrink-0">
                        {row.performance.image_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={row.performance.image_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-on-surface truncate">
                          {row.performance.title}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          {formatDate(row.performance.start_date)}
                          {row.performance.artist?.name_ko && (
                            <> · {row.performance.artist.name_ko}</>
                          )}
                        </p>
                      </div>
                    </Link>
                  </li>
                )
            )}
          </ul>
        )}
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
            <StampIcon className="w-3.5 h-3.5" />내 스탬프
          </Link>
          {profile.is_public ? (
            <Link
              href={`/u/${profile.handle}`}
              className="inline-flex items-center gap-2 bg-surface-container text-on-surface font-semibold px-4 py-2 rounded-full text-sm hover:bg-surface-container-high transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              공개 프로필 보기
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl md:text-3xl font-black tracking-tighter text-primary">
        {value}
      </div>
      <div className="mt-1 text-xs font-semibold tracking-widest text-on-surface-variant">
        {label}
      </div>
    </div>
  );
}
