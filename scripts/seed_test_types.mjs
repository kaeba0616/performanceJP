/**
 * 공연 종류별 테스트 데이터 시드
 *
 * 다음 3가지 케이스를 모두 만든다:
 *   1) solo                       — artist_id 필수
 *   2) festival + 대표 헤드라이너  — artist_id 있음, lineup 다수
 *   3) festival, 대표 없음         — artist_id NULL, lineup 다수
 *
 * 각 케이스는 status도 섞어서 (upcoming / on_sale / sold_out / completed)
 * 카드/리스트/디테일/아티스트 프로필/검색 모두 검증할 수 있게 만든다.
 *
 * 실행: node scripts/seed_test_types.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = readFileSync(".env.local", "utf-8")
  .split("\n")
  .filter((l) => l && !l.startsWith("#"))
  .reduce((acc, l) => {
    const i = l.indexOf("=");
    if (i > 0) acc[l.slice(0, i)] = l.slice(i + 1);
    return acc;
  }, {});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── 1) 아티스트 upsert (이름 기준) ────────────────────────────────
const artistSeed = [
  { name_ko: "요아소비",   name_en: "YOASOBI",     name_ja: "ヨアソビ" },
  { name_ko: "원오크록",   name_en: "ONE OK ROCK", name_ja: "ワンオクロック" },
  { name_ko: "아이묭",     name_en: "Aimyon",      name_ja: "あいみょん" },
  { name_ko: "후지이 카제", name_en: "Fujii Kaze",  name_ja: "藤井風" },
  { name_ko: "아도",       name_en: "Ado",         name_ja: "Ado" },
  { name_ko: "크리피너츠", name_en: "Creepy Nuts", name_ja: "クリーピーナッツ" },
  { name_ko: "이브",       name_en: "Eve",         name_ja: "イブ" },
  { name_ko: "밀레",       name_en: "milet",       name_ja: "milet" },
];

const { data: existingArtists } = await supabase
  .from("artists")
  .select("id, name_ko");
const haveByKo = new Map(existingArtists.map((a) => [a.name_ko, a.id]));

const toInsert = artistSeed.filter((a) => !haveByKo.has(a.name_ko));
if (toInsert.length) {
  const { data: inserted, error } = await supabase
    .from("artists")
    .insert(toInsert)
    .select("id, name_ko");
  if (error) {
    console.error("artist insert error:", error);
    process.exit(1);
  }
  inserted.forEach((a) => haveByKo.set(a.name_ko, a.id));
  console.log(`Inserted ${inserted.length} artists`);
} else {
  console.log("No new artists to insert");
}

const a = (ko) => {
  const id = haveByKo.get(ko);
  if (!id) throw new Error(`Artist not found: ${ko}`);
  return id;
};

// ─── 2) 공연 정의 ──────────────────────────────────────────────────
// 오늘=2026-05-12 기준 가까운 미래/과거 섞기
const performances = [
  // ── solo ────────────────────────────────────────────────────────
  {
    case: "solo / upcoming",
    type: "solo",
    artist_id: a("요아소비"),
    lineup: [a("요아소비")],
    title: "YOASOBI ASIA TOUR 2026 in KOREA",
    venue: "KSPO DOME",
    city: "서울",
    start_date: "2026-08-22",
    end_date: "2026-08-23",
    ticket_open_at: "2026-06-15T20:00:00+09:00",
    price_info: "VIP 198,000원 / R석 154,000원 / S석 110,000원",
    status: "upcoming",
  },
  {
    case: "solo / on_sale",
    type: "solo",
    artist_id: a("후지이 카제"),
    lineup: [a("후지이 카제")],
    title: "Fujii Kaze LOVE ALL ARENA TOUR in KOREA",
    venue: "올림픽공원 KSPO DOME",
    city: "서울",
    start_date: "2026-06-07",
    end_date: "2026-06-08",
    ticket_open_at: "2026-04-20T20:00:00+09:00",
    price_info: "전석 143,000원",
    status: "on_sale",
  },
  {
    case: "solo / sold_out",
    type: "solo",
    artist_id: a("아도"),
    lineup: [a("아도")],
    title: "Ado WORLD TOUR 2026 'Wish' in SEOUL",
    venue: "인스파이어 아레나",
    city: "인천",
    start_date: "2026-07-12",
    end_date: null,
    ticket_open_at: "2026-04-25T18:00:00+09:00",
    price_info: "VIP 176,000원 / R석 143,000원 / S석 110,000원",
    status: "sold_out",
  },
  {
    case: "solo / completed (과거)",
    type: "solo",
    artist_id: a("Myuk"),
    lineup: [a("Myuk")],
    title: "Myuk 1st Korea Showcase",
    venue: "예스24 라이브홀",
    city: "서울",
    start_date: "2026-03-09",
    end_date: null,
    ticket_open_at: "2026-01-20T20:00:00+09:00",
    price_info: "전석 88,000원",
    status: "completed",
  },

  // ── festival + 대표 헤드라이너 ─────────────────────────────────
  {
    case: "festival w/ headliner / upcoming",
    type: "festival",
    artist_id: a("원오크록"), // 헤드라이너로 표시
    lineup: [a("원오크록"), a("크리피너츠"), a("이브"), a("밀레")],
    title: "SUMMER SONIC SEOUL 2026 - Day 1",
    venue: "잠실종합운동장",
    city: "서울",
    start_date: "2026-08-15",
    end_date: null,
    ticket_open_at: "2026-06-01T12:00:00+09:00",
    price_info: "1일권 198,000원 / 2일권 330,000원",
    status: "upcoming",
  },
  {
    case: "festival w/ headliner / on_sale",
    type: "festival",
    artist_id: a("아이묭"),
    lineup: [a("아이묭"), a("이브"), a("Myuk")],
    title: "PENTAPORT ROCK FESTIVAL 2026 - SAT",
    venue: "송도 달빛축제공원",
    city: "인천",
    start_date: "2026-08-01",
    end_date: null,
    ticket_open_at: "2026-05-01T11:00:00+09:00",
    price_info: "1일권 165,000원",
    status: "on_sale",
  },

  // ── festival, 대표 없음 ─────────────────────────────────────────
  {
    case: "festival, no headliner / upcoming",
    type: "festival",
    artist_id: null,
    lineup: [a("크리피너츠"), a("후지이 카제"), a("밀레"), a("Myuk")],
    title: "GREENPLUGGED SEOUL 2026",
    venue: "난지한강공원",
    city: "서울",
    start_date: "2026-05-30",
    end_date: "2026-05-31",
    ticket_open_at: "2026-04-10T12:00:00+09:00",
    price_info: "1일권 121,000원 / 2일권 198,000원",
    status: "upcoming",
  },
  {
    case: "festival, no headliner / on_sale",
    type: "festival",
    artist_id: null,
    lineup: [a("요아소비"), a("아도"), a("아이묭"), a("이브")],
    title: "INCHEON PENTAPORT 2026 - SUN (J-LINEUP)",
    venue: "송도 달빛축제공원",
    city: "인천",
    start_date: "2026-08-02",
    end_date: null,
    ticket_open_at: "2026-05-01T11:00:00+09:00",
    price_info: "1일권 165,000원",
    status: "on_sale",
  },
];

// ─── 3) Insert ────────────────────────────────────────────────────
console.log("\nInserting performances...");
for (const p of performances) {
  const { case: caseLabel, lineup, ...row } = p;

  const { data: perf, error: perfErr } = await supabase
    .from("performances")
    .insert(row)
    .select()
    .single();

  if (perfErr) {
    console.error(`✗ ${caseLabel}:`, perfErr.message);
    continue;
  }

  const paRows = lineup.map((aid, i) => ({
    performance_id: perf.id,
    artist_id: aid,
    display_order: i + 1,
  }));
  const { error: paErr } = await supabase.from("performance_artists").insert(paRows);
  if (paErr) {
    console.error(`  ⚠ ${caseLabel} junction:`, paErr.message);
    await supabase.from("performances").delete().eq("id", perf.id);
    continue;
  }
  console.log(`✓ ${caseLabel} → ${perf.title}`);
}

console.log("\nDone.");
