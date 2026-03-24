import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function seed() {
  console.log("Seeding database...");

  // 1. Insert artists
  const { data: artists, error: artistError } = await supabase
    .from("artists")
    .insert([
      { name_ko: "요아소비", name_en: "YOASOBI", name_ja: "ヨアソビ" },
      { name_ko: "원오크록", name_en: "ONE OK ROCK", name_ja: "ワンオクロック" },
      { name_ko: "아이묭", name_en: "Aimyon", name_ja: "あいみょん" },
      { name_ko: "후지이 카제", name_en: "Fujii Kaze", name_ja: "藤井風" },
      { name_ko: "아도", name_en: "Ado", name_ja: "Ado" },
      { name_ko: "크리피너츠", name_en: "Creepy Nuts", name_ja: "クリーピーナッツ" },
    ])
    .select();

  if (artistError) {
    console.error("Artist insert error:", artistError);
    return;
  }
  console.log(`Inserted ${artists.length} artists`);

  // Map artist names to IDs
  const artistMap = new Map(artists.map((a) => [a.name_ko, a.id]));

  // 2. Insert performances
  const performances = [
    {
      artist_id: artistMap.get("요아소비"),
      title: "YOASOBI ASIA TOUR 2026 in KOREA",
      venue: "KSPO DOME",
      city: "서울",
      start_date: "2026-05-10",
      end_date: "2026-05-11",
      ticket_open_at: "2026-04-15T20:00:00+09:00",
      price_info: "VIP 198,000원 / R석 154,000원 / S석 110,000원",
      status: "upcoming",
    },
    {
      artist_id: artistMap.get("원오크록"),
      title: "ONE OK ROCK LUXURY DISEASE ASIA TOUR in SEOUL",
      venue: "고척스카이돔",
      city: "서울",
      start_date: "2026-04-19",
      end_date: null,
      ticket_open_at: "2026-03-28T11:00:00+09:00",
      price_info: "R석 132,000원 / S석 99,000원 / A석 77,000원",
      status: "on_sale",
    },
    {
      artist_id: artistMap.get("아이묭"),
      title: "Aimyon TOUR 2026 -마리골드- in KOREA",
      venue: "올림픽공원 올림픽홀",
      city: "서울",
      start_date: "2026-06-07",
      end_date: "2026-06-08",
      ticket_open_at: "2026-05-10T12:00:00+09:00",
      price_info: "전석 121,000원",
      status: "upcoming",
    },
    {
      artist_id: artistMap.get("후지이 카제"),
      title: "Fujii Kaze LOVE ALL ARENA TOUR in KOREA",
      venue: "KSPO DOME",
      city: "서울",
      start_date: "2026-04-26",
      end_date: "2026-04-27",
      ticket_open_at: "2026-04-01T20:00:00+09:00",
      price_info: "전석 143,000원",
      status: "on_sale",
    },
    {
      artist_id: artistMap.get("아도"),
      title: "Ado WORLD TOUR 2026 'Wish' in KOREA",
      venue: "인스파이어 아레나",
      city: "인천",
      start_date: "2026-07-12",
      end_date: null,
      ticket_open_at: "2026-06-01T18:00:00+09:00",
      price_info: "VIP 176,000원 / R석 143,000원 / S석 110,000원",
      status: "upcoming",
    },
    {
      artist_id: artistMap.get("크리피너츠"),
      title: "Creepy Nuts FIRST KOREA CONCERT",
      venue: "블루스퀘어 마스터카드홀",
      city: "서울",
      start_date: "2026-05-24",
      end_date: null,
      ticket_open_at: "2026-04-20T12:00:00+09:00",
      price_info: "전석 99,000원",
      status: "upcoming",
    },
    {
      artist_id: artistMap.get("요아소비"),
      title: "YOASOBI SPECIAL FANMEETING in BUSAN",
      venue: "부산 벡스코 오디토리움",
      city: "부산",
      start_date: "2026-05-17",
      end_date: null,
      ticket_open_at: "2026-04-20T20:00:00+09:00",
      price_info: "전석 88,000원",
      status: "upcoming",
    },
  ];

  const { data: perfData, error: perfError } = await supabase
    .from("performances")
    .insert(performances)
    .select();

  if (perfError) {
    console.error("Performance insert error:", perfError);
    return;
  }
  console.log(`Inserted ${perfData.length} performances`);

  // 3. Insert source_listings (ticket links)
  const perfMap = new Map(perfData.map((p) => [p.title, p.id]));

  const sourceListings = [
    // YOASOBI ASIA TOUR
    {
      performance_id: perfMap.get("YOASOBI ASIA TOUR 2026 in KOREA"),
      source: "yes24",
      source_url: "https://ticket.yes24.com/Perf/49876543",
      source_id: "49876543",
      raw_title: "YOASOBI ASIA TOUR 2026 in KOREA",
    },
    {
      performance_id: perfMap.get("YOASOBI ASIA TOUR 2026 in KOREA"),
      source: "interpark",
      source_url: "https://tickets.interpark.com/goods/26005432",
      source_id: "26005432",
      raw_title: "YOASOBI ASIA TOUR 2026 in KOREA",
    },
    {
      performance_id: perfMap.get("YOASOBI ASIA TOUR 2026 in KOREA"),
      source: "melon",
      source_url: "https://ticket.melon.com/performance/index.htm?prodId=210987",
      source_id: "210987",
      raw_title: "YOASOBI ASIA TOUR 2026 in KOREA",
    },
    // ONE OK ROCK
    {
      performance_id: perfMap.get("ONE OK ROCK LUXURY DISEASE ASIA TOUR in SEOUL"),
      source: "yes24",
      source_url: "https://ticket.yes24.com/Perf/49887766",
      source_id: "49887766",
      raw_title: "ONE OK ROCK LUXURY DISEASE ASIA TOUR in SEOUL",
    },
    {
      performance_id: perfMap.get("ONE OK ROCK LUXURY DISEASE ASIA TOUR in SEOUL"),
      source: "interpark",
      source_url: "https://tickets.interpark.com/goods/26007788",
      source_id: "26007788",
      raw_title: "ONE OK ROCK LUXURY DISEASE ASIA TOUR in SEOUL",
    },
    // Aimyon
    {
      performance_id: perfMap.get("Aimyon TOUR 2026 -마리골드- in KOREA"),
      source: "yes24",
      source_url: "https://ticket.yes24.com/Perf/49891234",
      source_id: "49891234",
      raw_title: "Aimyon TOUR 2026 마리골드 in KOREA",
    },
    {
      performance_id: perfMap.get("Aimyon TOUR 2026 -마리골드- in KOREA"),
      source: "melon",
      source_url: "https://ticket.melon.com/performance/index.htm?prodId=211234",
      source_id: "211234",
      raw_title: "Aimyon TOUR 2026 마리골드 in KOREA",
    },
    // Fujii Kaze
    {
      performance_id: perfMap.get("Fujii Kaze LOVE ALL ARENA TOUR in KOREA"),
      source: "interpark",
      source_url: "https://tickets.interpark.com/goods/26009911",
      source_id: "26009911",
      raw_title: "Fujii Kaze LOVE ALL ARENA TOUR in KOREA",
    },
    {
      performance_id: perfMap.get("Fujii Kaze LOVE ALL ARENA TOUR in KOREA"),
      source: "yes24",
      source_url: "https://ticket.yes24.com/Perf/49895678",
      source_id: "49895678",
      raw_title: "Fujii Kaze LOVE ALL ARENA TOUR in KOREA",
    },
    // Ado
    {
      performance_id: perfMap.get("Ado WORLD TOUR 2026 'Wish' in KOREA"),
      source: "yes24",
      source_url: "https://ticket.yes24.com/Perf/49901111",
      source_id: "49901111",
      raw_title: "Ado WORLD TOUR 2026 Wish in KOREA",
    },
    {
      performance_id: perfMap.get("Ado WORLD TOUR 2026 'Wish' in KOREA"),
      source: "interpark",
      source_url: "https://tickets.interpark.com/goods/26011222",
      source_id: "26011222",
      raw_title: "Ado WORLD TOUR 2026 Wish in KOREA",
    },
    {
      performance_id: perfMap.get("Ado WORLD TOUR 2026 'Wish' in KOREA"),
      source: "melon",
      source_url: "https://ticket.melon.com/performance/index.htm?prodId=212345",
      source_id: "212345",
      raw_title: "Ado WORLD TOUR 2026 Wish in KOREA",
    },
    // Creepy Nuts
    {
      performance_id: perfMap.get("Creepy Nuts FIRST KOREA CONCERT"),
      source: "yes24",
      source_url: "https://ticket.yes24.com/Perf/49905555",
      source_id: "49905555",
      raw_title: "Creepy Nuts FIRST KOREA CONCERT",
    },
    // YOASOBI BUSAN
    {
      performance_id: perfMap.get("YOASOBI SPECIAL FANMEETING in BUSAN"),
      source: "interpark",
      source_url: "https://tickets.interpark.com/goods/26013344",
      source_id: "26013344",
      raw_title: "YOASOBI SPECIAL FANMEETING in BUSAN",
    },
  ];

  const { data: slData, error: slError } = await supabase
    .from("source_listings")
    .insert(sourceListings)
    .select();

  if (slError) {
    console.error("Source listing insert error:", slError);
    return;
  }
  console.log(`Inserted ${slData.length} source listings`);

  console.log("Seeding complete!");
}

seed().catch(console.error);
