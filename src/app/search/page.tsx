import { createServerClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/date";
import Link from "next/link";

const statusConfig: Record<string, { label: string; className: string }> = {
  upcoming: { label: "UPCOMING", className: "status-upcoming" },
  on_sale: { label: "ON SALE", className: "status-on-sale" },
  sold_out: { label: "SOLD OUT", className: "status-sold-out" },
  completed: { label: "종료", className: "status-completed" },
};

const sourceConfig: Record<string, { label: string; className: string }> = {
  yes24: { label: "예스24", className: "btn-yes24" },
  interpark: { label: "인터파크", className: "btn-interpark" },
  melon: { label: "멜론티켓", className: "btn-melon" },
};

const avatarColors = [
  { bg: "bg-[#d8e2ff]", text: "text-[#0058be]" },
  { bg: "bg-[#dae2fd]", text: "text-[#424754]" },
  { bg: "bg-[#6cf8bb]", text: "text-[#00714d]" },
  { bg: "bg-[#ffd6d6]", text: "text-[#da3437]" },
  { bg: "bg-[#e8d6ff]", text: "text-[#6b4297]" },
];

async function searchArtists(query: string) {
  const supabase = createServerClient();
  const pattern = `%${query}%`;

  const { data: artists } = await supabase
    .from("artists")
    .select("*")
    .or(
      `name_ko.ilike.${pattern},name_en.ilike.${pattern},name_ja.ilike.${pattern}`
    );

  if (!artists || artists.length === 0) return [];

  const artistIds = artists.map((a) => a.id);
  const { data: performances } = await supabase
    .from("performances")
    .select("*, source_listings(*)")
    .in("artist_id", artistIds)
    .order("start_date", { ascending: true });

  return artists.map((artist) => ({
    artist,
    performances: (performances || []).filter(
      (p) => p.artist_id === artist.id
    ),
  }));
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() || "";
  const results = query ? await searchArtists(query) : [];
  const totalPerformances = results.reduce(
    (acc, r) => acc + r.performances.length,
    0
  );

  return (
    <div className="mx-auto max-w-[1280px] px-6 pt-24 pb-36">
      <div className="mb-12">
        <h2 className="text-[30px] font-black text-[#131b2e] tracking-[-1.5px] leading-[36px]">
          {query ? `'${query}' 검색 결과` : "검색"}
        </h2>
        {query && (
          <p className="text-base text-[#424754] mt-2">
            총 {totalPerformances}개의 공연 정보가 발견되었습니다.
          </p>
        )}
      </div>

      {!query && (
        <p className="text-[#424754]">검색어를 입력해주세요.</p>
      )}

      {query && results.length === 0 && (
        <p className="text-[#424754]">
          검색 결과가 없습니다. 다른 이름으로 검색해보세요.
        </p>
      )}

      <div className="space-y-12">
        {results.map(({ artist, performances }, idx) => {
          const color = avatarColors[idx % avatarColors.length];

          return (
            <div key={artist.id} className={idx > 0 ? "pt-4" : ""}>
              {/* Artist header */}
              <div className="flex items-center gap-5 mb-8">
                <div
                  className={`w-16 h-16 rounded-xl ${color.bg} flex items-center justify-center text-2xl font-bold ${color.text} shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)]`}
                >
                  {artist.name_ko[0]}
                </div>
                <div>
                  <Link
                    href={`/artists/${artist.id}`}
                    className="text-2xl font-bold text-[#131b2e] hover:underline leading-[30px]"
                  >
                    {artist.name_en || artist.name_ko}
                  </Link>
                  <p className="text-base font-medium text-[#424754]">
                    {artist.name_ko}
                    {artist.name_ja && artist.name_ja !== artist.name_en
                      ? ` / ${artist.name_ja}`
                      : ""}
                  </p>
                </div>
              </div>

              {/* Concert cards grid */}
              {performances.length === 0 ? (
                <p className="text-sm text-[#424754]">
                  예정된 공연이 없습니다.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {performances.map((perf) => {
                    const status =
                      statusConfig[perf.status] || statusConfig.upcoming;
                    const isSoldOut =
                      perf.status === "sold_out" ||
                      perf.status === "completed";
                    const listings = (perf.source_listings || []) as {
                      id: string;
                      source: string;
                      source_url: string;
                    }[];

                    return (
                      <div
                        key={perf.id}
                        className={`bg-white rounded-lg p-6 ${isSoldOut ? "opacity-80" : ""}`}
                      >
                        {/* Status + Date */}
                        <div className="flex items-start justify-between mb-4">
                          <span
                            className={`${status.className} text-xs font-bold uppercase tracking-[1.2px] px-3 py-1 rounded-xl`}
                          >
                            {status.label}
                          </span>
                          <span
                            className={`text-sm font-bold ${isSoldOut ? "text-[#424754]" : "text-[#0058be]"}`}
                          >
                            {formatDate(perf.start_date)}
                          </span>
                        </div>

                        {/* Title */}
                        <Link
                          href={`/performances/${perf.id}`}
                          className="block"
                        >
                          <h4
                            className={`text-xl font-bold leading-7 mb-2 hover:underline ${isSoldOut ? "text-[#424754]" : "text-[#131b2e]"}`}
                          >
                            {perf.title}
                          </h4>
                        </Link>

                        {/* Venue */}
                        {perf.venue && (
                          <div className="flex items-center gap-1 mb-6">
                            <svg
                              className="w-[10px] h-[12px] text-[#424754] shrink-0"
                              fill="currentColor"
                              viewBox="0 0 10 12"
                            >
                              <path d="M5 0C2.24 0 0 2.24 0 5c0 3.5 5 7 5 7s5-3.5 5-7c0-2.76-2.24-5-5-5zm0 6.75c-.97 0-1.75-.78-1.75-1.75S4.03 3.25 5 3.25 6.75 4.03 6.75 5 5.97 6.75 5 6.75z" />
                            </svg>
                            <span className="text-sm text-[#424754]">
                              {perf.venue}
                            </span>
                          </div>
                        )}

                        {/* Divider + Price + Buttons */}
                        <div className="border-t border-[rgba(194,198,214,0.15)] pt-6 flex items-center justify-between">
                          <div>
                            {perf.price_info && (
                              <>
                                <p className="text-sm text-[#424754]">
                                  {perf.price_info.includes("/")
                                    ? perf.price_info
                                        .split("/")[0]
                                        .replace(/[0-9,원]/g, "")
                                        .trim() || "가격"
                                    : "가격"}
                                </p>
                                <p
                                  className={`text-lg font-semibold ${isSoldOut ? "text-[#424754]" : "text-[#131b2e]"}`}
                                >
                                  {perf.price_info.match(
                                    /[\d,]+원/
                                  )?.[0] || perf.price_info}
                                </p>
                              </>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {isSoldOut ? (
                              <span className="bg-[#c2c6d6] text-white text-xs font-bold px-4 py-2 rounded">
                                판매 종료
                              </span>
                            ) : (
                              listings.map((sl) => {
                                const sc = sourceConfig[sl.source] || {
                                  label: sl.source,
                                  className: "bg-gray-500",
                                };
                                return (
                                  <a
                                    key={sl.id}
                                    href={sl.source_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`${sc.className} text-white text-xs font-bold px-4 py-2 rounded transition-all`}
                                  >
                                    {sc.label}
                                  </a>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
