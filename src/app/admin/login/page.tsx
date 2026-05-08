import { redirect } from "next/navigation";
import { isAdminSession } from "@/lib/admin/auth";
import { AdminLoginForm } from "./LoginForm";

export const metadata = {
  title: "관리자 로그인 | THE PULSE",
};

interface PageProps {
  searchParams: Promise<{ from?: string }>;
}

function safeFromPath(raw: string | undefined): string {
  if (!raw) return "/admin";
  if (!raw.startsWith("/admin")) return "/admin";
  if (raw.startsWith("//")) return "/admin";
  return raw;
}

export default async function AdminLoginPage({ searchParams }: PageProps) {
  const { from } = await searchParams;
  const next = safeFromPath(from);

  if (await isAdminSession()) {
    redirect(next);
  }

  return (
    <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-sm p-8 w-full max-w-sm">
        <h1 className="text-xl font-bold text-[#131b2e] mb-6 text-center">
          관리자 로그인
        </h1>
        <AdminLoginForm next={next} />
      </div>
    </div>
  );
}
