import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import type { Artist } from "@/types";

// TODO: Replace with Supabase query
async function getArtists(): Promise<(Artist & { performanceCount: number })[]> {
  return [
    {
      id: "a1",
      name_ko: "요아소비",
      name_ja: "YOASOBI",
      name_en: "YOASOBI",
      image_url: null,
      created_at: new Date().toISOString(),
      performanceCount: 2,
    },
    {
      id: "a2",
      name_ko: "원오크록",
      name_ja: "ONE OK ROCK",
      name_en: "ONE OK ROCK",
      image_url: null,
      created_at: new Date().toISOString(),
      performanceCount: 1,
    },
    {
      id: "a3",
      name_ko: "아이묭",
      name_ja: "あいみょん",
      name_en: "Aimyon",
      image_url: null,
      created_at: new Date().toISOString(),
      performanceCount: 1,
    },
  ];
}

export default async function ArtistsPage() {
  const artists = await getArtists();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">아티스트</h1>
      <p className="text-muted-foreground mb-6">
        내한 공연이 있는 일본 아티스트 목록
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {artists.map((artist) => (
          <Link key={artist.id} href={`/artists/${artist.id}`}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold">
                    {artist.name_ko[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold">{artist.name_ko}</h3>
                    <p className="text-sm text-muted-foreground">
                      {artist.name_en || artist.name_ja}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      공연 {artist.performanceCount}건
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
