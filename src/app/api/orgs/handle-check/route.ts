import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { validateOrgHandle, orgHandleErrorMessage } from "@/lib/orgs/handle";

// GET /api/orgs/handle-check?h=xxx — 단체 주소 사용 가능 여부
export async function GET(request: NextRequest) {
  const h = (request.nextUrl.searchParams.get("h") ?? "").trim().toLowerCase();

  const err = validateOrgHandle(h);
  if (err) {
    return NextResponse.json({ available: false, reason: orgHandleErrorMessage(err) });
  }

  const svc = createServiceClient();
  const { data } = await svc
    .from("organizations")
    .select("id")
    .eq("handle", h)
    .maybeSingle();

  return NextResponse.json({ available: !data });
}
