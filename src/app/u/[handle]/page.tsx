import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";
import { StampCard } from "@/components/stamps/StampCard";
import { ShareButtons } from "@/components/share/ShareButtons";
import { getStampTitle } from "@/lib/stamps/title";
import { formatDate } from "@/lib/utils/date";

interface PageProps {
  params: Promise<{ handle: string }>;
}

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
  count: number;
}

async function loadProfile(handle: string) {
  const supabase = createServiceClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, handle, display_name, avatar_url, bio, is_public, created_at")
    .ilike("handle", handle)
    .maybeSingle();
  if (!profile || !profile.is_public || !profile.handle) return null;

  const { data: rawStamps } = await supabase
    .from("user_attendances")
    .select(
      "attended_at, performance:performances(id, title, venue, start_date, image_url, artist:artists(id, name_ko, name_en, image_url))"
    )
    .eq("user_id", profile.id)
    .order("attended_at", { ascending: false });

  const stamps = (rawStamps ?? []) as unknown as StampRow[];
  return { profile, stamps };
}

export async function generateMetadata({ params }: PageProps) {
  const { handle } = await params;
  const data = await loadProfile(handle);
  if (!data) {
    return {
      title: "프로필을 찾을 수 없어요 | THE PULSE",
    };
  }
  const total = data.stamps.length;
  const title = getStampTitle(total);
  const displayName = data.profile.display_name || `@${data.profile.handle}`;
  const desc = `${displayName}의 내한공연 스탬프 ${total}개 · ${title.title}`;

  return {
    title: `@${data.profile.handle}의 스탬프 | THE PULSE`,
    description: desc,
    openGraph: {
      title: `@${data.profile.handle} · ${title.title}`,
      description: desc,
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: `@${data.profile.handle} · ${title.title}`,
      description: desc,
    },
  };
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { handle } = await params;
  const data = await loadProfile(handle);
  if (!data) notFound();

  const { profile, stamps } = data;
  const total = stamps.length;
  const title = getStampTitle(total);
  const firstDate = stamps.reduce<string | null>((earliest, s) => {
    const d = s.performance?.start_date ?? null;
    if (!d) return earliest;
    if (!earliest || d < earliest) return d;
    return earliest;
  }, null);

  // 최애 아티스트 top 3
  const artistMap = new Map<string, ArtistGroup>();
  for (const s of stamps) {
    const a = s.performance?.artist;
    if (!a) continue;
    const cur = artistMap.get(a.id);
    if (cur) cur.count += 1;
    else
      artistMap.set(a.id, {
        artistId: a.id,
        artistName: a.name_ko,
        artistImage: a.image_url,
        count: 1,
      });
  }
  const topArtists = Array.from(artistMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // 스탬프 번호: 오래된 것부터 1번
  const ascending = [...stamps].sort(
    (a, b) =>
      (a.performance?.start_date ?? "").localeCompare(b.performance?.start_date ?? "")
  );
  const numberMap = new Map<string, number>();
  ascending.forEach((s, i) => {
    if (s.performance?.id) numberMap.set(s.performance.id, i + 1);
  });

  const profileUrl = `/u/${profile.handle}`;
  const displayName = profile.display_name || `@${profile.handle}`;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <nav className="flex items-center gap-1.5 text-xs mb-8 text-on-surface-variant font-medium">
        <Link href="/" className="hover:text-primary transition-colors">홈</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-on-surface font-bold">@{profile.handle}</span>
      </nav>

      <header className="text-center mb-12">
        <div className="w-24 h-24 mx-auto rounded-full bg-primary text-on-primary flex items-center justify-center text-4xl font-black overflow-hidden mb-5">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            profile.handle!.charAt(0).toUpperCase()
          )}
        </div>
        <p className="text-xs font-black tracking-widest text-on-surface-variant uppercase mb-1">
          @{profile.handle}
        </p>
        <h1 className="editorial-title text-3xl md:text-4xl font-black tracking-tighter text-on-surface mb-3">
          {displayName}
        </h1>
        {profile.bio && (
          <p className="max-w-md mx-auto text-sm text-on-surface-variant mb-5">
            {profile.bio}
          </p>
        )}
        <div className="inline-flex items-center gap-2 bg-surface-container-lowest border border-outline-variant px-5 py-2.5 rounded-full">
          <span className="text-2xl">{title.emoji}</span>
          <span className="font-black tracking-tight text-on-surface">{title.title}</span>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4 max-w-md mx-auto">
          <Stat label="STAMPS" value={String(total)} />
          <Stat label="ARTISTS" value={String(artistMap.size)} />
          <Stat
            label="SINCE"
            value={firstDate ? formatDate(firstDate).slice(2) : "—"}
          />
        </div>

        <div className="mt-6">
          <ShareButtons
            url={profileUrl}
            text={`${displayName}의 내한공연 스탬프 ${total}개 · ${title.title}`}
          />
        </div>
      </header>

      {topArtists.length > 0 && (
        <section className="mb-10 bg-surface-container-lowest rounded-2xl border border-outline-variant p-6">
          <h2 className="text-xs font-black tracking-widest text-on-surface-variant uppercase mb-4">
            최애 아티스트 TOP 3
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {topArtists.map((a, idx) => (
              <li key={a.artistId}>
                <Link
                  href={`/artists/${a.artistId}`}
                  className="flex items-center gap-3 bg-surface-container-low rounded-xl p-3 hover:bg-surface-container transition"
                >
                  <span className="editorial-title text-2xl font-black italic text-primary w-6 shrink-0">
                    {idx + 1}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-primary-fixed overflow-hidden shrink-0">
                    {a.artistImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.artistImage} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-on-surface text-sm truncate">
                      {a.artistName}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {a.count}회 직관
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {total === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-12 text-center">
          <p className="text-on-surface-variant">아직 스탬프가 없어요.</p>
        </div>
      ) : (
        <section>
          <h2 className="editorial-title-sm text-base font-black tracking-tight text-on-surface mb-5">
            전체 스탬프 ({total})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {stamps.map(
              (s) =>
                s.performance && (
                  <StampCard
                    key={s.performance.id}
                    performanceId={s.performance.id}
                    performanceTitle={s.performance.title}
                    performanceDate={s.performance.start_date}
                    venue={s.performance.venue}
                    imageUrl={
                      s.performance.image_url || s.performance.artist?.image_url || null
                    }
                    artistName={s.performance.artist?.name_ko ?? null}
                    stampNumber={numberMap.get(s.performance.id) ?? 0}
                  />
                )
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-3">
      <div className="text-xl font-black tracking-tighter text-primary">{value}</div>
      <div className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">
        {label}
      </div>
    </div>
  );
}
