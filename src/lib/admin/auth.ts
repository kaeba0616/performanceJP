import { cookies } from "next/headers";

export const ADMIN_COOKIE = "admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8시간

export function getAdminPassword(): string | undefined {
  // ADMIN_PASSWORD가 우선, 없으면 기존 CRON_SECRET 그대로 사용 (운영 호환)
  return process.env.ADMIN_PASSWORD || process.env.CRON_SECRET;
}

// route handler / server action에서 Request를 직접 받을 때
export function verifyAdminRequest(request: Request): boolean {
  const password = getAdminPassword();
  if (!password) return false;

  // Bearer 호환 (외부 스크립트 / 기존 cron 사용처용)
  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${password}`) return true;

  // Cookie
  const cookieHeader = request.headers.get("cookie") ?? "";
  for (const part of cookieHeader.split(/;\s*/)) {
    if (part.startsWith(`${ADMIN_COOKIE}=`)) {
      return part.slice(ADMIN_COOKIE.length + 1) === password;
    }
  }
  return false;
}

// 서버 컴포넌트 / server action에서 next/headers cookies()로 확인
export async function isAdminSession(): Promise<boolean> {
  const password = getAdminPassword();
  if (!password) return false;
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value === password;
}

export function adminCookieSetOptions(maxAge: number = COOKIE_MAX_AGE) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}
