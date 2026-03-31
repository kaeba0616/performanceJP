# 내한공연 트래커

일본 아티스트 내한 공연 일정과 티케팅 오픈 정보를 한눈에 확인할 수 있는 웹서비스입니다.

## 주요 기능

- **캘린더 뷰** - 월별 공연 일정을 캘린더에서 확인, 날짜 클릭 시 하단 패널에 공연 목록 표시
- **아티스트 검색** - 한국어/영어/일본어로 아티스트 검색
- **공연 상세** - 공연 정보, 가격, 티켓 오픈 카운트다운
- **티켓 링크** - 예스24, 인터파크, 멜론티켓 구매 링크 + 서버시간 확인
- **아티스트 SNS** - Instagram, YouTube, X(Twitter) 링크
- **이메일 알림** - 새 공연 등록, 티켓 오픈 전 알림
- **관리자 UI** - 공연/아티스트 CRUD + 예스24 데이터 검색 & 가져오기

## 기술 스택

| 구분 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router, TypeScript) |
| UI | Tailwind CSS 4 + shadcn/ui |
| 데이터베이스 | Supabase (PostgreSQL) |
| 크롤링 | Cheerio (예스24 반자동 가져오기) |
| 이메일 | Resend |

## 라우팅 구조

### 페이지 (Pages)

```
src/app/
├── page.tsx                              # / - 캘린더 메인
├── search/page.tsx                       # /search?q=검색어 - 검색 결과
├── artists/
│   ├── page.tsx                          # /artists - 아티스트 목록
│   └── [id]/page.tsx                     # /artists/:id - 아티스트 상세 (SNS 링크)
├── performances/
│   └── [id]/page.tsx                     # /performances/:id - 공연 상세 (티켓링크, 서버시간)
├── subscribe/page.tsx                    # /subscribe - 알림 구독
├── admin/
│   ├── layout.tsx                        # 관리자 레이아웃 (사이드바, 인증)
│   ├── page.tsx                          # /admin - 대시보드
│   ├── performances/
│   │   ├── page.tsx                      # /admin/performances - 공연 관리
│   │   ├── new/page.tsx                  # /admin/performances/new - 공연 추가
│   │   └── [id]/edit/page.tsx            # /admin/performances/:id/edit - 공연 수정
│   ├── artists/page.tsx                  # /admin/artists - 아티스트 관리
│   └── import/page.tsx                   # /admin/import - 예스24 데이터 가져오기
├── error.tsx                             # 전역 에러 페이지
├── not-found.tsx                         # 404 페이지
├── loading.tsx                           # 루트 로딩
├── layout.tsx                            # 루트 레이아웃 (Header, Footer)
└── globals.css                           # 전역 스타일
```

### API 라우트 (Routes)

```
src/app/api/
├── search/route.ts                       # GET - 아티스트 검색
├── performances/
│   ├── route.ts                          # GET - 공연 목록
│   └── [id]/route.ts                     # GET - 공연 상세
├── artists/
│   ├── route.ts                          # GET - 아티스트 목록
│   └── [id]/route.ts                     # GET - 아티스트 상세
├── subscribe/route.ts                    # POST - 알림 구독
├── verify/route.ts                       # GET - 이메일 인증
├── unsubscribe/route.ts                  # GET - 구독 취소
└── admin/                                # (Authorization: Bearer CRON_SECRET)
    ├── performances/
    │   ├── route.ts                      # GET, POST - 공연 목록/추가
    │   └── [id]/
    │       ├── route.ts                  # PUT, DELETE - 공연 수정/삭제
    │       └── approve/route.ts          # POST - 공연 승인
    ├── artists/
    │   ├── route.ts                      # GET, POST - 아티스트 목록/추가
    │   └── [id]/route.ts                # PUT, DELETE - 아티스트 수정/삭제
    ├── source-listings/
    │   ├── route.ts                      # POST - 티켓 링크 추가
    │   └── [id]/route.ts                # DELETE - 티켓 링크 삭제
    ├── unmatched/route.ts                # GET - 미매칭 리스팅
    └── import/
        ├── search/route.ts               # GET - 예스24 검색
        └── route.ts                      # POST - 일괄 가져오기
```

### 컴포넌트 구조

```
src/components/
├── calendar/
│   ├── CalendarGrid.tsx                  # 캘린더 그리드 + 월 네비게이션 + 하단 패널
│   ├── CalendarCell.tsx                  # 개별 날짜 셀
│   └── PerformanceChip.tsx              # 캘린더 내 공연 칩
├── performance/
│   ├── PerformanceCard.tsx              # 공연 카드
│   ├── SourceLinks.tsx                   # 예매처 링크 + 서버시간 확인
│   └── TicketCountdown.tsx              # 티켓 오픈 카운트다운
├── layout/
│   ├── Header.tsx                        # 헤더 (네비, 검색, 모바일 메뉴)
│   └── Footer.tsx                        # 푸터
└── ui/                                   # shadcn/ui 컴포넌트
```

### 라이브러리

```
src/lib/
├── crawlers/
│   ├── base.ts                           # 크롤러 인터페이스, fetch 유틸
│   ├── yes24.ts                          # 예스24 크롤러
│   ├── interpark.ts                      # 인터파크 크롤러
│   ├── melon.ts                          # 멜론 크롤러
│   ├── matcher.ts                        # 아티스트 키워드 매칭
│   └── artists-keywords.json            # 아티스트 키워드 (20명)
├── supabase/
│   ├── server.ts                         # 서버 Supabase 클라이언트
│   ├── client.ts                         # 클라이언트 Supabase 클라이언트
│   └── types.ts                          # DB 타입 정의
└── utils/
    └── date.ts                           # 날짜 유틸 함수
```

## 데이터베이스 테이블

| 테이블 | 설명 |
|--------|------|
| `artists` | 아티스트 (이름 3개 언어 + SNS URL) |
| `performances` | 공연 정보 (일정, 장소, 티켓오픈, 가격, 상태) |
| `source_listings` | 티켓 구매 링크 (예스24/인터파크/멜론) |
| `subscribers` | 이메일 구독자 |
| `subscriptions` | 구독 설정 (전체/아티스트별/공연별) |
| `notifications_log` | 알림 발송 기록 |

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env.example`을 참고하여 `.env.local` 파일을 생성합니다.

| 변수 | 설명 | 필수 |
|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | O |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon 공개 키 | O |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role 비밀 키 | O |
| `RESEND_API_KEY` | Resend 이메일 API 키 | 알림 사용 시 |
| `CRON_SECRET` | 관리자 API 인증 시크릿 | O |
| `NEXT_PUBLIC_SITE_URL` | 사이트 URL | O |

### 3. 데이터베이스 설정

Supabase SQL Editor에서 마이그레이션 파일을 순서대로 실행:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_add_artist_sns.sql
supabase/migrations/003_add_artist_x_url.sql
```

### 4. 개발 서버 실행

```bash
npm run dev
```

`http://localhost:4010`에서 확인할 수 있습니다.

### 5. 데이터 입력

- **수동**: `/admin` → 비밀번호(CRON_SECRET) → 공연 관리 → 공연 추가
- **반자동**: `/admin/import` → 예스24에서 검색 → 선택 후 가져오기

## 라이선스

MIT
