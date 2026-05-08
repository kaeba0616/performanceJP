import { isAdminSession } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { AdminShell } from "./AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 미들웨어가 /admin/* 비인증 접근을 /admin/login으로 리다이렉트.
  // 여기 도달했다는 건 인증됐거나 /admin/login 본인.
  if (!(await isAdminSession())) {
    // /admin/login — sidebar 없이 바로 children
    return <>{children}</>;
  }

  // pending 카운트는 서버에서 한 번 가져와 sidebar 뱃지로 전달
  let pendingCount = 0;
  try {
    const supabase = createServiceClient();
    const { count } = await supabase
      .from("submissions")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");
    pendingCount = count ?? 0;
  } catch {
    // ignore — sidebar에는 0으로 표시
  }

  return <AdminShell pendingCount={pendingCount}>{children}</AdminShell>;
}
