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
