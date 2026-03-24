# 내한공연 트래커

일본 아티스트 내한 공연 일정과 티케팅 오픈 정보를 한눈에 확인할 수 있는 웹서비스입니다.

## 주요 기능

- **캘린더 뷰** - 월별 공연 일정을 캘린더에서 확인
- **아티스트 검색** - 한국어/영어/일본어로 아티스트 검색
- **공연 상세** - 공연 정보, 가격, 티켓 오픈 카운트다운
- **티켓 링크** - 예스24, 인터파크, 멜론티켓 구매 링크 제공
- **이메일 알림** - 새 공연 등록, 티켓 오픈 전 알림
- **자동 크롤링** - 예스24/인터파크/멜론티켓에서 공연 데이터 수집

## 기술 스택

| 구분 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router, TypeScript) |
| UI | Tailwind CSS 4 + shadcn/ui |
| 데이터베이스 | Supabase (PostgreSQL) |
| 크롤링 | Cheerio |
| 이메일 | Resend |

## 프로젝트 구조

```
src/
├── app/
│   ├── page.tsx                 # 캘린더 메인 페이지
│   ├── search/page.tsx          # 검색 결과 페이지
│   ├── artists/                 # 아티스트 목록/상세
│   ├── performances/[id]/       # 공연 상세
│   ├── subscribe/               # 알림 구독
│   └── api/
│       ├── search/              # 검색 API
│       ├── performances/        # 공연 API
│       ├── artists/             # 아티스트 API
│       ├── subscribe/           # 구독 API
│       ├── verify/              # 이메일 인증
│       ├── unsubscribe/         # 구독 취소
│       ├── cron/                # 크롤링/알림 크론
│       └── admin/               # 관리 API
├── components/
│   ├── calendar/                # 캘린더 컴포넌트
│   ├── performance/             # 공연 카드, 카운트다운, 티켓 링크
│   ├── subscription/            # 구독 모달/폼
│   ├── layout/                  # Header, Footer
│   └── ui/                      # shadcn/ui 컴포넌트
├── lib/
│   ├── crawlers/                # 사이트별 크롤러 (yes24, interpark, melon)
│   ├── notifications/           # 이메일 발송/템플릿
│   ├── supabase/                # DB 클라이언트/타입
│   └── utils/                   # 날짜 유틸
└── types/                       # TypeScript 타입 정의
```

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env.example`을 참고하여 `.env.local` 파일을 생성합니다.

```bash
cp .env.example .env.local
```

필요한 값:

| 변수 | 설명 | 필수 |
|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | O |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon 공개 키 | O |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role 비밀 키 | O |
| `RESEND_API_KEY` | Resend 이메일 API 키 | 알림 사용 시 |
| `CRON_SECRET` | 크론 API 보호용 시크릿 | O |
| `NEXT_PUBLIC_SITE_URL` | 사이트 URL | O |

### 3. 데이터베이스 설정

Supabase SQL Editor에서 마이그레이션 파일을 실행합니다.

```
supabase/migrations/001_initial_schema.sql
```

### 4. 샘플 데이터 (선택)

```bash
npx tsx scripts/seed.ts
```

### 5. 개발 서버 실행

```bash
npm run dev
```

`http://localhost:4010`에서 확인할 수 있습니다.

## API 엔드포인트

### Public

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/search?q=검색어` | 아티스트 검색 |
| GET | `/api/performances?month=2026-04` | 공연 목록 |
| GET | `/api/performances/[id]` | 공연 상세 |
| GET | `/api/artists` | 아티스트 목록 |
| GET | `/api/artists/[id]` | 아티스트 상세 |
| POST | `/api/subscribe` | 알림 구독 |
| GET | `/api/verify?token=xxx` | 이메일 인증 |
| GET | `/api/unsubscribe?token=xxx` | 구독 취소 |

### Cron (Authorization: Bearer CRON_SECRET)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/cron/crawl-full` | 전체 크롤링 |
| POST | `/api/cron/crawl-updates` | 임박 공연 업데이트 |
| POST | `/api/cron/send-notifications` | 알림 발송 |

### Admin (Authorization: Bearer CRON_SECRET)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/admin/artists` | 아티스트 추가 |
| POST | `/api/admin/performances/[id]/approve` | 공연 승인 |
| GET | `/api/admin/unmatched` | 미매칭 리스팅 조회 |

## 데이터베이스 테이블

| 테이블 | 설명 |
|--------|------|
| `artists` | 아티스트 (한국어/영어/일본어 이름) |
| `performances` | 공연 정보 (일정, 장소, 티켓오픈, 가격) |
| `source_listings` | 크롤링 원본 데이터 + 티켓 구매 링크 |
| `subscribers` | 이메일 구독자 |
| `subscriptions` | 구독 설정 (전체/아티스트별/공연별) |
| `notifications_log` | 알림 발송 기록 |

## 배포

### Vercel (Free) + GitHub Actions

- Vercel 무료 티어로 웹사이트 배포
- GitHub Actions `schedule` 트리거로 크롤링 크론 대체
- `vercel.json`에 크론 설정 포함 (Vercel Pro 사용 시)

## 라이선스

MIT
