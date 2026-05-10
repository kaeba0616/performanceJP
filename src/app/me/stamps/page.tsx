import Link from "next/link";
import { redirect } from "next/navigation";
import { Stamp as StampIcon } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";
import { StampCard } from "@/components/stamps/StampCard";
import { getStampTitle } from "@/lib/stamps/title";
import { formatDate } from "@/lib/utils/date";

export const metadata = {
  title: "내 스탬프 | THE PULSE",
};

interface StampRow {
  attended_at: string;
  performance: {
    id: string;
    title: string;
    venue: string | null;
    start_date: string;
    image_url: string | null;
    artist:
      | {
          id: string;
          name_ko: string;
          name_en: string | null;
          image_url: string | null;
        }
      | null;
  } | null;
}

interface ArtistGroup {
  artistId: string;
  artistName: string;
  artistImage: string | null;
  stamps: StampRow[];
}

export default async function MyStampsPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/me/stamps");

  const { data: profile } = await supabase
    .from("profiles")
    .select("handle")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.handle) redirect("/onboarding");

  const { data: rawStamps } = await supabase
    .from("user_attendances")
    .select(
      "attended_at, performance:performances(id, title, venue, start_date, image_url, artist:artists!performances_artist_id_fkey(id, name_ko, name_en, image_url))"
    )
    .eq("user_id", user.id)
    .order("attended_at", { ascending: false });

  const stamps = (rawStamps ?? []) as unknown as StampRow[];
  const total = stamps.length;
  const title = getStampTitle(total);
  const firstDate = stamps.length
    ? stamps.reduce<string | null>((earliest, s) => {
        const d = s.performance?.start_date ?? null;
        if (!d) return earliest;
        if (!earliest || d < earliest) return d;
        return earliest;
      }, null)
    : null;

  // 아티스트별 그룹핑
  const groupMap = new Map<string, ArtistGroup>();
  const UNKNOWN_KEY = "__unknown__";
  for (const s of stamps) {
    const a = s.performance?.artist;
    const key = a?.id ?? UNKNOWN_KEY;
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        artistId: a?.id ?? UNKNOWN_KEY,
        artistName: a ? a.name_ko : "기타",
        artistImage: a?.image_url ?? null,
        stamps: [],
      });
    }
    groupMap.get(key)!.stamps.push(s);
  }
  const groups = Array.from(groupMap.values()).sort((g1, g2) => {
    if (g1.artistId === UNKNOWN_KEY) return 1;
    if (g2.artistId === UNKNOWN_KEY) return -1;
    return g2.stamps.length - g1.stamps.length;
  });

  // 스탬프 번호: 오래된 것부터 1번. 카드는 최신부터 표시하지만 번호는 시간순.
  const ascending = [...stamps].sort(
    (a, b) => (a.performance?.start_date ?? "").localeCompare(b.performance?.start_date ?? "")
  );
  const numberMap = new Map<string, number>();
  ascending.forEach((s, i) => {
    if (s.performance?.id) numberMap.set(s.performance.id, i + 1);
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <StampIcon className="w-5 h-5 text-primary" />
          <p className="text-xs font-black tracking-widest text-on-surface-variant uppercase">
            My Stamps
          </p>
        </div>
        <h1 className="editorial-title text-4xl md:text-5xl font-black tracking-tighter text-on-surface">
          {total}{" "}
          <span className="text-primary italic">{total === 1 ? "STAMP" : "STAMPS"}</span>
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          {title.emoji} {title.title}
          {firstDate && <> · {formatDate(firstDate)}부터 함께</>}
        </p>
      </header>

      {total === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-12">
          {groups.map((g) => (
            <section key={g.artistId}>
              <header className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-black overflow-hidden shrink-0">
                  {g.artistImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={g.artistImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    g.artistName.charAt(0)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="editorial-title-sm text-base font-black text-on-surface truncate">
                    {g.artistName}
                  </h2>
                </div>
                <span className="text-xs font-black tracking-widest text-on-surface-variant uppercase">
                  {g.stamps.length} {g.stamps.length === 1 ? "STAMP" : "STAMPS"}
                </span>
              </header>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {g.stamps.map((s) =>
                  s.performance ? (
                    <StampCard
                      key={s.performance.id}
                      performanceId={s.performance.id}
                      performanceTitle={s.performance.title}
                      performanceDate={s.performance.start_date}
                      venue={s.performance.venue}
                      imageUrl={s.performance.image_url || s.performance.artist?.image_url || null}
                      artistName={s.performance.artist?.name_ko ?? null}
                      stampNumber={numberMap.get(s.performance.id) ?? 0}
                    />
                  ) : null
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-12 text-center">
      <StampIcon className="w-12 h-12 text-on-surface-variant/40 mx-auto mb-4" />
      <h2 className="text-lg font-bold text-on-surface mb-2">아직 스탬프가 없어요</h2>
      <p className="text-sm text-on-surface-variant mb-6">
        다녀온 공연 페이지에서 <span className="font-bold">다녀왔어요</span> 버튼을 눌러보세요.
      </p>
      <Link
        href="/calendar"
        className="inline-flex items-center bg-primary text-on-primary font-bold px-5 py-2.5 rounded-full text-sm hover:bg-primary-container transition"
      >
        공연 둘러보기
      </Link>
    </div>
  );
}
