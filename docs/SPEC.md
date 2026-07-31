# SPEC — 기술 명세 (데이터 모델·API·마이그레이션 SSOT)

> **문서 성격**: 기술 구현의 SSOT. 스키마·API·라우트의 **계약(contract)**을
> 여기서 확정한다. 코드는 이 문서를 따르고, 계약을 바꾸려면 **이 문서를 먼저
> 고친다**.
>
> - 최종 수정: 2026-07-31
> - 상위 문서: [`docs/PRD.md`](./PRD.md)
> - 규칙: 마이그레이션은 append-only(`020_`부터). 기존 001~019는 수정 금지.
>
> **Phase 1 구현 상태 (2026-07-31)**: F1~F4 **구현·DB적용·E2E 완료**
> (typecheck·lint·build 통과, 마이그레이션 020~024 DB 적용, 핵심 플로우 E2E 통과 — §11).
> - 쓰기 경로: 모든 org 쓰기는 서버 API(service_role)가 수행, RLS는 읽기(SELECT)만 통제.
> - 공개 리스팅(홈·캘린더·performances API)에 `visibility='public'` 필터 추가(service_role은 RLS 우회하므로 명시 필터 필수).
> - 발송: 공지·예약확인은 **이메일(Resend)** 구현. 웹푸시 대상 매핑은 후속(현 스키마상 org 멤버↔푸시 구독 연결 없음).

---

## 1. 기술 스택 (현행 유지)

| 구분       | 기술                                 | 비고                              |
| ---------- | ------------------------------------ | --------------------------------- |
| 프레임워크 | Next.js 16 (App Router, TS)          | dev :4010 / start :3007           |
| UI         | Tailwind CSS 4 + shadcn/ui (base-ui) |                                   |
| DB / Auth  | Supabase (Postgres + Auth + RLS)     |                                   |
| 이메일     | Resend                               | `src/lib/notifications/sender.ts` |
| 웹푸시     | web-push (VAPID)                     | `src/lib/notifications/push.ts`   |
| 크롤링     | Cheerio(예스24 반자동)               | 신규 기능과 무관                  |
| 배포       | 자체 Nginx + PWA/TWA                 |                                   |

**신규 의존성**: 원칙적으로 없음. 결제(Phase 2)에서만 PG SDK 추가.

---

## 2. 현행 도메인 모델 (요약)

```
artists ──< performances ──< source_listings
                    │
                    ├─< user_attendances >── profiles(=auth.users)
                    └─< (subscriptions / notifications_log / web_push_log)
subscribers ──< subscriptions
subscribers ──< web_push_subscriptions ──< web_push_log
submissions (제보 → 승인 시 performances 생성)
```

- `performances`: `type('solo'|'festival')`, `status`, `show_times(jsonb)`,
  `setlist(jsonb)` 등 보유
- `profiles`: `auth.users` 1:1, `handle` citext, `is_public`
- 관리자 인증: `src/lib/admin/auth.ts` — 단일 ADMIN 세션(신규 org 권한과 별개로
  유지)

---

## 3. 신규 도메인 모델 (Target)

```
profiles(auth.users)
   │
   └─< org_members >── organizations ──< org_invites
                            │
                            ├─< performances (org_id 추가) ──< reservations
                            │                              └─< show_times(정원)
                            ├─< announcements ──< announcement_targets
                            ├─< recruitments ──< applications        (Phase 2)
                            └─< rehearsals ──< rehearsal_attendances  (Phase 2)
```

### 3.1 핵심 설계 원칙

1. **소유 주체 = organization**. 단체 공연은 `performances.org_id`로 소유를
   표현(NULL이면 기존 크롤링/관리자 공연).
2. **권한 = org_members**. 모든 RLS는 "요청 유저가 해당 org의 staff 이상인가"를
   헬퍼 함수로 판정.
3. **관객 예약은 무인증 허용**. `reservations`는 `auth.users` 없이 이름·연락처로
   생성(기존 submissions 패턴).
4. **기존 인프라 재사용**: 공지 발송은 `notifications/sender.ts`·`push.ts`, 공개
   페이지는 `opengraph-image` 패턴.

---

## 4. 마이그레이션 계획 (append-only)

> 각 마이그레이션은 독립 실행 가능해야 하며 RLS 포함.
>
> **구현 상태 (2026-07-26)**: Phase 1 마이그레이션 **작성 완료** — `020`~`024`.
> 아래 스키마는 실제 파일과 일치한다.
>
> | 파일 | 내용 | 상태 |
> |------|------|------|
> | `020_organizations.sql` | organizations, org_role, org_members, org_invites, is_org_staff/member() | ✅ 작성 |
> | `021_performances_org.sql` | performances 확장(org_id/origin/visibility/summary/poster_url) + SELECT RLS 교체 | ✅ 작성 |
> | `022_performance_shows.sql` | 회차·정원 정규 테이블 | ✅ 작성 |
> | `023_reservations.sql` | 예약 + show_availability 뷰 | ✅ 작성 |
> | `024_announcements.sql` | 공지 + announcement_deliveries | ✅ 작성 |
>
> **확정된 구현 결정** (작성 중 확정, 아래 스키마 블록에 반영됨):
> - **쓰기 경로**: 모든 org 쓰기는 서버 API(service_role)가 수행하고 RLS를 우회한다.
>   RLS는 **읽기(SELECT)만** 통제. → reservations INSERT도 anon 정책 없이 서버 API가 처리(초과예약·rate-limit 서버 검증).
> - **발행 상태**: `status`에 `'draft'`를 **추가하지 않는다**. 012 status-sync 트리거가
>   날짜 기준으로 status를 덮어쓰기 때문. 대신 `visibility='private'`가 초안, `public`/`unlisted`가 발행.

### `020_organizations.sql` — Phase 1

```sql
CREATE TABLE organizations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  handle      citext UNIQUE NOT NULL CHECK (handle ~ '^[a-z0-9_]{3,20}$'),
  name        text NOT NULL,
  description text,
  logo_url    text,
  contact     text,                       -- 공개 문의 채널(이메일/인스타 등)
  is_verified boolean NOT NULL DEFAULT false,  -- 서비스 관리자 인증 배지(A5)
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,  -- nullable: NOT NULL이면 계정삭제 시 SET NULL이 제약 위반
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TYPE org_role AS ENUM ('owner','staff','member');

CREATE TABLE org_members (
  org_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       org_role NOT NULL DEFAULT 'member',
  joined_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, user_id)
);

CREATE TABLE org_invites (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code       text NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  role       org_role NOT NULL DEFAULT 'member',
  expires_at timestamptz,
  used_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 권한 판정 헬퍼 (RLS 전반에서 사용)
CREATE OR REPLACE FUNCTION is_org_staff(p_org uuid) RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_members m
    WHERE m.org_id = p_org AND m.user_id = auth.uid()
      AND m.role IN ('owner','staff')
  );
$$;

CREATE OR REPLACE FUNCTION is_org_member(p_org uuid) RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_members m
    WHERE m.org_id = p_org AND m.user_id = auth.uid()
  );
$$;
```

**RLS**: `organizations` SELECT는 공개(true). INSERT는 로그인 유저(생성자=본인).
UPDATE/DELETE는 `is_org_staff(id)`. `org_members` SELECT는 같은 org 멤버, 변경은
owner. (owner 자동 삽입은 API에서 트랜잭션 처리)

### `021_performances_org.sql` — Phase 1

```sql
ALTER TABLE performances
  ADD COLUMN org_id     uuid REFERENCES organizations(id) ON DELETE CASCADE,
  ADD COLUMN origin     text NOT NULL DEFAULT 'crawled'
             CHECK (origin IN ('crawled','admin','org')),
  ADD COLUMN visibility text NOT NULL DEFAULT 'public'
             CHECK (visibility IN ('public','unlisted','private')),
  ADD COLUMN summary    text,               -- 홍보용 소개(마크다운 허용)
  ADD COLUMN poster_url text;               -- image_url과 별개의 세로 포스터

CREATE INDEX idx_performances_org ON performances(org_id);
-- 기존 status CHECK에 'draft' 추가 검토(발행 전 임시저장)
```

**RLS 갱신 (구현·검증 완료)**: `performances_select_all`(007) + **`공개 읽기`**(운영 DB에
수동 생성돼 있던 마이그레이션 미기록 drift, `USING true`)를 **둘 다 드롭**하고
`performances_select_public`(`visibility<>'private' OR is_org_member(org_id)`)로 교체.
→ private 공연은 소속 멤버만, unlisted/public은 공개(목록 노출만 쿼리에서 제외).
쓰기는 service_role(서버 API)만.

**제약 갱신**: org 공연은 J-pop `artists`를 참조하지 않으므로 010의
`performances_solo_requires_artist`를 `origin='org'` 예외를 추가해 재정의. crawled/admin은 기존 규칙 유지.

> ✅ 롤백 트랜잭션으로 검증: 문법·FK·RLS(anon이 private 공연·예약 명단 접근 불가) 통과, DB 커밋 없음.

### `022_show_time_capacity.sql` — Phase 1 (예약 정원)

- 현재 `performances.show_times`는 jsonb. 예약 정원·잔여석 집계를 위해 **정규
  테이블로 승격**:

```sql
CREATE TABLE performance_shows (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  performance_id uuid NOT NULL REFERENCES performances(id) ON DELETE CASCADE,
  starts_at      timestamptz NOT NULL,      -- KST 기준 저장(기존 kst 유틸 준수)
  capacity       int,                        -- NULL = 무제한
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_performance_shows_perf ON performance_shows(performance_id);
```

> 기존 jsonb `show_times`는 유지(내한공연용). org 공연은 `performance_shows`를
> 사용. 마이그레이션 노트에 병행 사용 명시.

### `023_reservations.sql` — Phase 1

```sql
CREATE TABLE reservations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  performance_id uuid NOT NULL REFERENCES performances(id) ON DELETE CASCADE,
  show_id        uuid REFERENCES performance_shows(id) ON DELETE SET NULL,
  -- 예약자(무인증 허용)
  name           text NOT NULL,
  phone          text,
  email          text,
  party_size     int  NOT NULL DEFAULT 1 CHECK (party_size >= 1),
  note           text,
  -- 상태
  status         text NOT NULL DEFAULT 'confirmed'
                 CHECK (status IN ('pending','confirmed','cancelled','no_show')),
  cancel_token   text NOT NULL DEFAULT gen_random_uuid()::text,
  -- 결제 여지(Phase 2, 지금은 미사용)
  price          int,
  payment_status text CHECK (payment_status IN ('none','pending','paid','refunded')) DEFAULT 'none',
  -- 스팸 방지
  submitter_ip   inet,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_reservations_perf ON reservations(performance_id, status);
CREATE INDEX idx_reservations_show ON reservations(show_id);
```

**RLS (구현 확정)**: INSERT/UPDATE/DELETE는 **service_role(서버 API)만** — anon
정책 없음. 예약 생성·취소·상태변경은 전부 서버 API 경유(초과예약 방지·rate-limit·
`cancel_token` 검증을 서버에서 수행). SELECT는 소유 org의 `is_org_staff`만. **잔여석**은
`show_availability` 뷰로 집계(아래):
`capacity - COALESCE(SUM(party_size) WHERE status IN ('confirmed','pending')), 0)`.
뷰 또는 API 집계로 계산.

### `024_announcements.sql` — Phase 1

```sql
CREATE TABLE announcements (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  performance_id uuid REFERENCES performances(id) ON DELETE SET NULL,  -- 특정 공연 공지(선택)
  title          text NOT NULL,
  body           text NOT NULL,
  audience       text NOT NULL CHECK (audience IN ('members','reservers','public')),
  sent_at        timestamptz,               -- 발송 완료 시각(NULL=초안)
  created_by     uuid NOT NULL REFERENCES auth.users(id),
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_announcements_org ON announcements(org_id, created_at DESC);
-- 발송 로그(중복 방지)는 기존 web_push_log / notifications_log 패턴 재사용 또는 announcement_deliveries 신설
```

**RLS**: SELECT는 `audience='public'`이면 공개, 그 외 `is_org_member`.
INSERT/UPDATE는 `is_org_staff`.

### Phase 2 (별도 마이그레이션, 스키마 초안만)

- `025_recruitments.sql` — `recruitments`, `applications`(status:
  서류/오디션/합격/불합격)
- `026_rehearsals.sql` — `rehearsals`, `rehearsal_attendances`(going/not/maybe)

---

## 5. API 계약 (Phase 1)

> 규칙: 공개 GET은 `/api/...`, 운영진 전용은 세션(Supabase) + `is_org_staff`
> 검증. 응답은 `{ data }` / `{ error }`.

### 5.1 단체

| Method       | 경로                            | 권한   | 설명                                        |
| ------------ | ------------------------------- | ------ | ------------------------------------------- |
| POST         | `/api/orgs`                     | 로그인 | 단체 생성(생성자 owner 자동 등록, 트랜잭션) |
| GET          | `/api/orgs/:handle`             | 공개   | 단체 공개 정보                              |
| PATCH        | `/api/orgs/:id`                 | staff  | 단체 수정                                   |
| POST         | `/api/orgs/:id/invites`         | owner  | 초대코드 발급                               |
| POST         | `/api/orgs/join`                | 로그인 | 초대코드로 가입 `{ code }`                  |
| GET          | `/api/orgs/:id/members`         | member | 멤버 목록                                   |
| PATCH/DELETE | `/api/orgs/:id/members/:userId` | owner  | 역할 변경/제명                              |

### 5.2 공연(org)

| Method | 경로                          | 권한                  | 설명                       |
| ------ | ----------------------------- | --------------------- | -------------------------- |
| POST   | `/api/orgs/:id/performances`  | staff                 | 공연 개설(origin='org')    |
| PATCH  | `/api/performances/:id`       | staff(소유 org)       | 수정·발행(visibility 토글) |
| POST   | `/api/performances/:id/shows` | staff                 | 회차·정원 등록             |
| GET    | `/api/performances/:id`       | 공개(visibility 준수) | 기존 라우트 확장           |

### 5.3 예약

| Method | 경로                                      | 권한             | 설명                  |
| ------ | ----------------------------------------- | ---------------- | --------------------- |
| GET    | `/api/performances/:id/availability`      | 공개             | 회차별 잔여석         |
| POST   | `/api/performances/:id/reservations`      | anon(rate-limit) | 예약 생성 → 확인 메일 |
| GET    | `/api/orgs/:id/reservations?performance=` | staff            | 명단 조회             |
| PATCH  | `/api/reservations/:id`                   | staff            | 상태 변경             |
| GET    | `/api/orgs/:id/reservations/export`       | staff            | CSV                   |
| POST   | `/api/reservations/:id/cancel`            | cancel_token     | 관객 취소             |

### 5.4 공지

| Method | 경로                          | 권한       | 설명                   |
| ------ | ----------------------------- | ---------- | ---------------------- |
| POST   | `/api/orgs/:id/announcements` | staff      | 공지 작성(초안)        |
| POST   | `/api/announcements/:id/send` | staff      | 대상 발송(이메일+푸시) |
| GET    | `/api/orgs/:id/announcements` | audience별 | 목록                   |

---

## 6. 페이지 라우트 (Phase 1)

```
src/app/
├─ o/[handle]/page.tsx              # 단체 공개 프로필(공연 목록·공지)
├─ o/[handle]/opengraph-image.tsx   # OG 이미지(기존 u/[handle] 패턴 재사용)
├─ o/new/page.tsx                   # 단체 생성
├─ o/[handle]/manage/               # 운영진 전용(staff 가드)
│   ├─ page.tsx                     # 대시보드(공연·예약·공지 요약)
│   ├─ performances/…               # 공연 개설·편집·발행
│   ├─ reservations/page.tsx        # 예약 명단 + CSV
│   ├─ announcements/…              # 공지 작성·발송
│   └─ members/page.tsx             # 멤버·초대 관리
├─ p/[id]/page.tsx  또는 기존 performances/[id] 확장  # 홍보 공개 페이지 + 예약 폼
└─ join/[code]/page.tsx             # 초대 수락
```

- 캘린더(`/`)·검색(`/search`): `visibility='public'` org 공연을 포함하고
  `[동아리]` 배지(유형=origin) 표시.
- 운영 화면 가드: `middleware.ts` 또는 서버 컴포넌트에서 `is_org_staff` 확인.

---

## 7. 컴포넌트 재사용/신규

| 재사용                                       | 신규                                              |
| -------------------------------------------- | ------------------------------------------------- |
| `CalendarGrid`, `PerformanceChip`(배지 확장) | `OrgHeader`, `OrgSwitcher`                        |
| `PerformanceCard`, `TicketCountdown`         | `ReservationForm`(공개), `ReservationTable`(운영) |
| `SubscribeModal`, 알림 sender/push           | `AnnouncementComposer`, `AudiencePicker`          |
| `ShareButtons`, `opengraph-image`            | `MemberInvite`, `RoleBadge`                       |

---

## 8. 권한/보안

- **RLS 우선**: 모든 신규 테이블 RLS 필수. staff 판정은 `is_org_staff()` 헬퍼로
  단일화.
- **무인증 예약**: anon INSERT 허용 + API에서 IP rate-limit(기존 submissions의
  `submitter_ip` 패턴).
- **관리자(ADMIN) 분리**: 기존 서비스 관리자 세션(`lib/admin/auth.ts`)은 플랫폼
  운영용으로 유지. org 권한과 독립.
- **취소 토큰**: 관객 예약 취소는 `cancel_token`으로만(로그인 불필요).

---

## 9. 단계별 완료 정의(DoD) & 수용 기준

### Phase 1 — MVP

- [x] 마이그레이션 020~024 적용 + RLS 테스트 통과 ✅
- [x] **F1**: 단체 생성 → owner 등록 → 초대코드로 가입 (API·페이지 구현) ✅
- [x] **F2**: 공연 개설·포스터·회차 입력 → 발행 시 `/o/:handle`·캘린더 노출,
      private면 미노출 ✅ (E2E: 공개는 노출, private는 anon 404·캘린더 미노출)
- [x] **F3**: 무인증 예약 → 잔여석 감소 → 운영진 명단·CSV·상태변경 → 확인 메일 ✅
      (E2E: 정원 초과 409, 취소 시 잔여 복구, rate-limit 429)
- [x] **F4**: 공지 작성 → 대상(단원/예약자/전체) **이메일** 발송, 초안/발송 구분 ✅
      (웹푸시는 후속 — §10.6)
- [x] 기존 내한공연 캘린더·검색·알림 회귀 없음 (build 통과, 캘린더 스모크 OK) ✅

### Phase 2

- [ ] F5 모집(공고·지원서·상태·결과 통보)
- [ ] F6 연습일정(등록·참석 체크)
- [ ] F3.5 결제(PG 연동·환불·정산) — A2 확정 후 별도 SPEC 절 추가

---

## 10. 미결 기술 결정

1. ~~show_times 정규화 범위~~ → ✅ org만 `performance_shows` 사용, 기존 jsonb는 내한공연용 병행.
2. **잔여석 동시성** — 현재 낙관적 방식(삽입 후 재확인·롤백). 대규모 동시요청 시 DB 락/원자적
   차감으로 강화 필요(현 규모엔 충분). API: `reservations/route.ts` `isOverCapacity()`.
3. ~~공지 발송 대상 수집~~ → ✅ reservers=email 있는 예약, members=auth.users 이메일(admin API).
4. ~~단체 생성 승인제 여부~~ → ✅ 즉시 생성(A5).
5. **결제 PG 선택**(PRD 오픈질문 2) — Phase 2.
6. **공지 웹푸시** — 미구현. org 멤버/예약자를 웹푸시 구독(익명 subscriber 기반)과 연결하는
   매핑 테이블이 없어 Phase 1.5로 분리. 이메일만 발송 중.

---

## 11. As-Built 요약 (실제 구현)

### 11.1 라우트/파일 맵
| 영역 | 파일 |
|------|------|
| 권한 헬퍼 | `src/lib/orgs/{types,handle,permissions}.ts` (`requireOrgStaff`/`requirePerfOrgStaff`/`loadStaffContextByHandle`) |
| F1 API | `api/orgs/route.ts`(생성), `handle-check`, `[id]/invites`, `join`, `[id]/members[/[userId]]` |
| F1 페이지 | `/o`(내 단체), `/o/new`, `/o/[handle]`(공개), `/o/[handle]/manage/*`, `/join/[code]` |
| F2 API | `api/orgs/[id]/performances`(생성), `api/performances/[id]`(PATCH/DELETE·발행), `.../shows[/[showId]]` |
| F2 페이지 | `manage/performances`(목록/new/[perfId]/edit), 공개는 기존 `/performances/[id]` 확장(배지·소개·예약) |
| F3 API | `api/performances/[id]/availability`, `.../reservations`(생성), `api/reservations/[id]`(상태), `api/reservations/cancel`(토큰), `api/orgs/[id]/reservations/export`(CSV) |
| F3 UI | `components/reservation/ReservationSection.tsx`, `manage/reservations`, `/reservations/cancel/[token]` |
| F4 API | `api/orgs/[id]/announcements`(작성), `api/announcements/[id]/send`(발송) |
| F4 UI | `manage/announcements`, 공개 공지는 `/o/[handle]` 노출 |
| 공통 | `lib/utils/ip.ts`, `lib/notifications/sender.ts`(`sendReservationConfirmation`/`sendAnnouncementEmail`) |
| 발견형 | 헤더 유저메뉴 "내 단체" → `/o` |

### 11.2 E2E 검증 결과 (2026-07-31, 실 DB + `next start`)
공개 org·공연·회차(정원3)를 시드해 익명 HTTP로 검증 후 데이터 삭제:
- availability: 공개 공연 정상 / **비공개 공연 404**
- GET 공연: 공개 200 / **비공개(anon) 404**
- 단체 생성 무인증 → **401**
- 예약: 2명 OK(잔여1) → 2명 **409(정원초과)** → 1명 OK(잔여0) → 토큰취소 → **잔여2 복구**
- 잘못된 취소 토큰 → **404**
- 공개 org 페이지: 단체명·공개공연 노출, **비공개 공연 미노출**
- 캘린더: 공개공연 노출, **비공개 미노출**(visibility 필터)
- rate-limit: 6회 연속 예약 → 6번째 **429**

> 인증 필요 플로우(단체 생성·관리)는 OAuth 세션이 필요해 HTTP E2E 대신 권한 헬퍼·RLS 단위로 검증.

---

## 부록. SSOT 운영 규칙

1. 요구사항 변경 → `PRD.md` 수정 → `SPEC.md` 계약 수정 → 코드/마이그레이션 순.
2. 마이그레이션은 절대 수정하지 않고 새 파일로 추가.
3. PR 설명에 관련 PRD 기능 ID(F1.2 등)·SPEC 절 번호를 링크.
4. 가정(PRD §0)이 확정/변경되면 표의 값과 영향 범위를 즉시 갱신.
