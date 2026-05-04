import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { validateHandle, handleErrorMessage } from "@/lib/profiles/handle";

export async function GET(request: NextRequest) {
  const h = request.nextUrl.searchParams.get("h")?.trim().toLowerCase() ?? "";
  const validationError = validateHandle(h);
  if (validationError) {
    return NextResponse.json({
      available: false,
      reason: handleErrorMessage(validationError),
    });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("handle", h)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ available: false, reason: "조회 실패" }, { status: 500 });
  }

  return NextResponse.json({ available: !data });
}
