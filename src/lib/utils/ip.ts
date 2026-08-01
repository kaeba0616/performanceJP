import type { NextRequest } from "next/server";

/** 프록시(nginx) 뒤에서 클라이언트 IP 추출. */
export function clientIp(request: NextRequest): string | null {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return request.headers.get("x-real-ip");
}
