import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import type { Performance } from "@/types";

// TODO: Replace with actual Supabase query once DB is connected
async function getPerformances(): Promise<Performance[]> {
  // Placeholder data for development
  return [
    {
      id: "1",
      artist_id: "a1",
      title: "YOASOBI ASIA TOUR 2026 in KOREA",
      venue: "KSPO DOME",
      city: "서울",
      start_date: new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        15
      )
        .toISOString()
        .split("T")[0],
      end_date: new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        16
      )
        .toISOString()
        .split("T")[0],
      ticket_open_at: new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        10,
        20,
        0
      ).toISOString(),
      presale_open_at: null,
      price_info: "VIP 198,000원 / R석 154,000원 / S석 110,000원",
      status: "on_sale",
      image_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      artist: {
        id: "a1",
        name_ko: "요아소비",
        name_ja: "YOASOBI",
        name_en: "YOASOBI",
        image_url: null,
        created_at: new Date().toISOString(),
      },
    },
    {
      id: "2",
      artist_id: "a2",
      title: "ONE OK ROCK 2026 KOREA CONCERT",
      venue: "고척스카이돔",
      city: "서울",
      start_date: new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        22
      )
        .toISOString()
        .split("T")[0],
      end_date: null,
      ticket_open_at: new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        18,
        11,
        0
      ).toISOString(),
      presale_open_at: null,
      price_info: "R석 132,000원 / S석 99,000원",
      status: "upcoming",
      image_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      artist: {
        id: "a2",
        name_ko: "원오크록",
        name_ja: "ONE OK ROCK",
        name_en: "ONE OK ROCK",
        image_url: null,
        created_at: new Date().toISOString(),
      },
    },
  ];
}

export default async function HomePage() {
  const performances = await getPerformances();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">내한공연 캘린더</h1>
        <p className="text-muted-foreground mt-1">
          일본 아티스트 내한 공연 일정을 한눈에 확인하세요
        </p>
      </div>
      <CalendarGrid performances={performances} />
    </div>
  );
}
