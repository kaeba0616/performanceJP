import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  adminCookieSetOptions,
  getAdminPassword,
} from "@/lib/admin/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const password = getAdminPassword();
  if (!password) {
    return NextResponse.json(
      { error: "admin_not_configured" },
      { status: 500 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as { password?: unknown };
  if (typeof body.password !== "string" || body.password !== password) {
    return NextResponse.json({ error: "invalid_password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, password, adminCookieSetOptions());
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, "", { ...adminCookieSetOptions(0) });
  return response;
}
