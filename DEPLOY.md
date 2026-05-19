# jpop.ernebi.org 배포 런북

기존 외부 서버(nginx 가동 중, 다른 사이트와 공존)에 `performanceJP`를 `jpop.ernebi.org` 서브도메인으로 띄우는 가이드. DNS는 Cloudflare, Next.js는 3007 포트, nginx 리버스 프록시 + Let's Encrypt HTTPS.

`package.json`의 `start` 스크립트는 `next start -p 3007`로 박혀있어 PORT 환경변수 없이 3007에서 뜬다.

---

## 0. 사전 준비물 (로컬에서 미리)

### 0-1. Supabase 프로젝트
1. https://supabase.com → New project (region: Northeast Asia / Tokyo 추천)
2. **Settings → API**에서 3개 값 복사해 메모:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ 절대 클라이언트 노출 금지)
3. **SQL Editor**에서 마이그레이션 5개를 **순서대로** 실행:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_add_artist_sns.sql`
   - `supabase/migrations/003_add_artist_x_url.sql`
   - `supabase/migrations/004_add_songs.sql`
   - `supabase/migrations/005_add_submissions.sql`
4. Table Editor에서 테이블(artists, performances, songs, submissions, source_listings 등) 생성 확인.

### 0-2. Resend 키
1. https://resend.com 가입 → **API Keys → Create**
2. 키 메모 → `RESEND_API_KEY`
3. **Domains → Add Domain → `ernebi.org`** 추가
4. Resend가 안내하는 SPF/DKIM/MX TXT 레코드를 **Cloudflare DNS에 등록** (DNS only / 회색 구름)
5. Resend에서 `Verified` 떠야 발신 가능. 미인증이면 가입 시 본인 이메일로만 발송 가능 (테스트용으로는 OK).

### 0-3. CRON_SECRET 생성
관리자 API 인증용 토큰. 로컬 또는 서버에서:
```bash
openssl rand -hex 32
```
출력값을 메모해 둔다.

### 0-4. Cloudflare DNS A 레코드
Cloudflare 대시보드 → `ernebi.org` → DNS → **Add record**

| 항목 | 값 |
|---|---|
| Type | A |
| Name | `jpop` |
| IPv4 address | `<서버 공인 IP>` |
| Proxy status | **DNS only (회색 구름)** ← 인증서 발급 전엔 필수 |
| TTL | Auto |

전파 확인:
```bash
dig +short jpop.ernebi.org    # 서버 IP가 나와야 함
```

### 0-5. Git 원격 저장소
서버에서 `git clone` 하려면 push가 먼저:
```bash
# 로컬
git remote -v                                       # origin 없으면
git remote add origin git@github.com:<user>/performanceJP.git
git push -u origin main
```

Private repo면 서버에 SSH 키 또는 PAT 등록 필요.

---

## 1. 서버 환경 점검

```bash
ssh user@server

node -v          # 20.x 이상
npm -v
nginx -v
which certbot    # 없으면: sudo apt install certbot python3-certbot-nginx
which pm2        # 없으면: sudo npm install -g pm2
```

Node 20 미만이면 nodesource로 업그레이드:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

---

## 2. 코드 배포 + 환경변수

```bash
# 적당한 위치 (예: /var/www 또는 ~/apps)
cd /var/www
sudo git clone <repo-url> jpop
sudo chown -R $USER:$USER jpop
cd jpop

cp .env.example .env.local
nano .env.local
```

`.env.local` 채우기:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
RESEND_API_KEY=re_...
CRON_SECRET=<openssl rand -hex 32 결과>
NEXT_PUBLIC_SITE_URL=https://jpop.ernebi.org
ADMIN_EMAIL=dev.hibi@gmail.com
```

설치 + 빌드:
```bash
npm install
npm run build
```

빌드 성공하면 일회성 검증:
```bash
npm run start &        # 3007에서 뜸
curl -I http://127.0.0.1:3007
# HTTP/1.1 200 OK 확인 후
kill %1
```

---

## 3. pm2 데몬 등록

```bash
pm2 start npm --name jpop -- run start
pm2 save
pm2 startup            # 출력되는 sudo 명령을 한 번 그대로 실행
pm2 logs jpop          # 로그 확인 (Ctrl+C로 빠져나옴)
```

이후 운영 명령:
```bash
pm2 restart jpop       # 재시작
pm2 stop jpop          # 정지
pm2 list               # 상태
```

---

## 4. nginx vhost 추가

`/etc/nginx/sites-available/jpop.ernebi.org`:
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name jpop.ernebi.org;

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:3007;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 60s;
    }
}
```

활성화 + 검증:
```bash
sudo ln -s /etc/nginx/sites-available/jpop.ernebi.org /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

이 시점에 `http://jpop.ernebi.org` 접속하면 앱이 떠야 한다.

---

## 5. HTTPS 발급 (Let's Encrypt)

```bash
sudo certbot --nginx -d jpop.ernebi.org
```

- 이메일 입력 → ToS 동의
- 리다이렉트 옵션은 **2 (Redirect)** 선택 (http → https 자동 리다이렉트)
- certbot이 nginx 설정에 ssl 블록 + 443 listen + 인증서 경로를 자동 삽입
- 자동 갱신은 `certbot.timer`가 처리: `systemctl status certbot.timer`

확인:
```bash
curl -I https://jpop.ernebi.org   # 200 OK
```

---

## 6. Cloudflare Proxy 켜기 (선택, 권장)

인증서 발급 끝났으면:

1. Cloudflare → DNS → `jpop` 레코드 → Proxy status를 **Proxied (주황 구름)**으로 변경
2. **SSL/TLS → Overview → Full (strict)** 로 설정
   - ⚠️ Flexible은 무한 리다이렉트 발생, 절대 금지
3. (선택) **Speed → Brotli ON**, 캐시 룰 등

---

## 7. 배포 후 동작 확인

### 7-1. 페이지 라우트
- `https://jpop.ernebi.org/` — 캘린더 메인
- `https://jpop.ernebi.org/artists` — 아티스트 목록
- `https://jpop.ernebi.org/submit` — 공연 제보 폼
- `https://jpop.ernebi.org/admin` — 관리자 (CRON_SECRET 필요)

### 7-2. API 헬스체크
```bash
# 공개
curl https://jpop.ernebi.org/api/performances | head -c 200

# 관리자 (토큰)
curl -H "Authorization: Bearer <CRON_SECRET>" \
  https://jpop.ernebi.org/api/admin/performances | head -c 200
```

### 7-3. 메일 발송
- `/subscribe`에서 본인 이메일로 구독 신청 → verify 메일 도착 확인
- `/submit`에서 더미 제보 → 접수 확인 메일 + ADMIN_EMAIL로 알림 메일 도착 확인

### 7-4. 로그
```bash
pm2 logs jpop --lines 100         # 앱 로그
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 8. 운영 / 업데이트 워크플로우

코드 업데이트할 때:
```bash
cd /var/www/jpop
git pull
npm install            # package.json 변경 시
npm run build
pm2 restart jpop
```

`.env.local` 변경 후엔 반드시 `pm2 restart jpop` 해야 반영됨.

DB 스키마 변경(새 마이그레이션 추가) 시: Supabase Dashboard → SQL Editor에서 새 SQL 실행.

---

## 9. 트러블슈팅 체크리스트

| 증상 | 확인 |
|---|---|
| `502 Bad Gateway` | `pm2 list`로 jpop 프로세스 살아있나, `curl 127.0.0.1:3007` 응답하나 |
| `ERR_TOO_MANY_REDIRECTS` | Cloudflare SSL 모드가 Flexible인지 → Full (strict)로 |
| certbot 발급 실패 | Cloudflare Proxy가 켜져있으면 실패 → DNS only로 내리고 재시도 |
| 이메일 미수신 | Resend 도메인 Verified 상태인지, `RESEND_API_KEY` 오타 없는지, `pm2 logs`에 에러 |
| 관리자 API 401 | 서버 `.env.local`의 `CRON_SECRET`과 요청 헤더가 동일한지 |
| 빌드 시 `next` 못 찾음 | `npm install` 안 됐거나 Node 20 미만 |
| 다른 사이트 404 영향 | nginx `server_name`이 `jpop.ernebi.org`로 정확히 박혔는지, default_server 설정 안 건드렸는지 |

---

## 10. 보안 / 운영 메모

- `.env.local`은 절대 git push 금지 (`.gitignore`에 포함됨, 확인)
- `SUPABASE_SERVICE_ROLE_KEY`는 RLS 우회 키. 서버 사이드 API에서만 사용
- `CRON_SECRET`은 관리자 인증의 사실상 비밀번호 — 로테이션 시 `.env.local` 갱신 + `pm2 restart`
- 서버 방화벽: 3007은 `next start` 기본 동작상 외부에서 직접 접근 안 되도록 관리. nginx만 80/443 노출
- Cloudflare Proxy 켜두면 봇/DDoS 1차 방어 + WAF 사용 가능

---

## 신규 생성 파일 (서버에서)

- `/var/www/jpop/.env.local` — 환경변수
- `/etc/nginx/sites-available/jpop.ernebi.org` — nginx vhost
- `/etc/nginx/sites-enabled/jpop.ernebi.org` — symlink
- `/etc/letsencrypt/live/jpop.ernebi.org/` — certbot 인증서

---

## 최종 검증 시나리오

1. `https://jpop.ernebi.org` HTTPS 자물쇠 정상
2. 캘린더 메인 페이지 렌더링
3. 아티스트 목록 데이터 로드 (Supabase 연결 확인)
4. `/submit` 제보 → 본인 메일 + ADMIN_EMAIL 수신
5. `/admin` 진입 후 토큰으로 인증 → 제보 승인 → `/performances/:id` 노출
6. `pm2 list`에 jpop `online`
7. 서버 재부팅 후에도 jpop 자동 기동 (`pm2 startup` 적용 확인)

---

## 11. Android 앱(TWA) 배포 — Play Store

이 사이트를 그대로 Google Play 앱으로 패키징하는 절차. **Trusted Web Activity** 방식이라 별도 Android 앱 코드는 없고, 도메인-앱 연결 증명서(`assetlinks.json`)만 잘 호스팅되면 앱 안에서 jpop.ernebi.org가 풀스크린으로 뜬다.

### 11-0. 사전 조건
- 사이트가 **HTTPS**로 정상 동작 (✓ 이미 jpop.ernebi.org)
- `/manifest.json`이 200으로 응답 (`curl https://jpop.ernebi.org/manifest.json` 확인)
- Lighthouse PWA 점수 90+ (Chrome DevTools → Lighthouse → Mobile → PWA)
- Google Play Console 계정 ($25 일회성, 첫 결제)

### 11-1. Bubblewrap 설치 + 초기화 (로컬에서)

```bash
# JDK / Android SDK는 bubblewrap이 자동으로 설치한다 (첫 실행 시 ~1.5GB).
cd /path/to/jpop/android
npx @bubblewrap/cli@latest init --manifest=https://jpop.ernebi.org/manifest.json
# 질문에 대부분 엔터 (이미 android/twa-manifest.json에 값 채워둠).
# Signing key 비밀번호는 새로 만들고 안전하게 보관 (1Password 등).
# → android.keystore 파일 생성됨. 이 파일은 절대 잃어버리면 안 된다.
#    잃어버리면 같은 앱으로 업데이트가 불가능하다.
```

### 11-2. 빌드

```bash
npx @bubblewrap/cli@latest build
# 끝나면 출력 디렉토리에 두 파일:
#   app-release-signed.aab  ← Play Store 업로드용
#   app-release-signed.apk  ← 직접 설치 테스트용
# 그리고 콘솔에 SHA-256 fingerprint 출력됨. 기록!
```

### 11-3. assetlinks.json 설정 (도메인-앱 연결 증명)

빌드 콘솔에서 출력된 SHA-256을 운영 `.env`에 추가:

```bash
# /var/www/jpop/.env.local
TWA_PACKAGE_NAME=org.ernebi.jpop
TWA_SHA256_FINGERPRINTS=AA:BB:CC:DD:...:FF
```

그 다음:
```bash
pm2 restart jpop
curl https://jpop.ernebi.org/.well-known/assetlinks.json
# → 위 fingerprint가 포함된 JSON 배열이 떠야 함
```

> Play Console이 "App Signing by Google Play"를 강제하면 빌드 후 stripe된 다른 fingerprint를 발급한다. 그 값도 `TWA_SHA256_FINGERPRINTS` 쉼표로 추가해야 한다 (release용 + Play Signing용 두 개).

### 11-4. 직접 설치 테스트 (Play Store 전)

USB로 Android 기기 연결, 개발자 옵션 + USB 디버깅 켜고:
```bash
adb install -r app-release-signed.apk
```
앱 실행 → jpop.ernebi.org이 풀스크린으로 떠야 함. 상단에 "by 크롬" 같은 알림 막대가 보이면 **assetlinks 미연동 상태** → 11-3 다시 확인.

### 11-5. Play Console 업로드

1. [Play Console](https://play.google.com/console) → **앱 만들기**
2. 정보: 앱 이름 `THE PULSE`, 기본 언어 한국어, 무료, 게임 아님
3. **앱 무결성 → 무결성 보호 페이지**에서 추가 SHA-256 발급되면 메모해서 `TWA_SHA256_FINGERPRINTS`에 추가
4. **프로덕션 → 새 출시 만들기** → `app-release-signed.aab` 업로드
5. 출시 노트 작성 (1.0.0 첫 출시)

### 11-6. 스토어 등록 필수 자산

| 항목 | 사양 |
|---|---|
| 앱 아이콘 | 512×512 PNG (이미 `public/icons/icon-512.png`) |
| 그래픽 이미지 | 1024×500 PNG (대표 배너, 별도 디자인 필요) |
| 폰 스크린샷 | 최소 2장, 16:9 또는 9:16, 1080×1920 권장. 5~8장 권장 |
| 짧은 설명 | 80자 이내 한국어 |
| 자세한 설명 | 4000자 이내 |
| 개인정보처리방침 URL | `https://jpop.ernebi.org/privacy` (✓ 존재) |
| 콘텐츠 등급 | 설문 — 일반적으로 "전체 이용가" |
| 데이터 보안 양식 | 수집 데이터: 이메일(선택), 푸시 토큰(서비스 운영) 신고 |
| 대상 연령 | 13+ (기본값) |

### 11-7. 심사 → 출시
- 내부 테스트 트랙 먼저 (수 시간 내 활성화)
- 비공개 테스트 / 오픈 테스트는 선택
- 프로덕션 출시: 보통 **1~3일** 심사. 거절 사유는 대부분 데이터 보안 양식 미작성 / 스크린샷 부족

### 11-8. 업데이트 시 흐름
- **웹 코드만 바뀐 경우**: 그냥 `pm2 restart jpop`. 앱은 그대로 새 페이지를 보여줌 (즉시 반영)
- **TWA 자체 변경(아이콘/이름/manifest 등)**: `appVersionCode` +1 → `bubblewrap build` → 새 .aab 업로드 → Play 심사

