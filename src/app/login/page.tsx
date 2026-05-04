import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "로그인 | THE PULSE",
};

interface PageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const { next } = await searchParams;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(next || "/me");
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <div className="text-center mb-10">
        <h1 className="editorial-title text-4xl font-black tracking-tighter text-primary">
          LOGIN
        </h1>
        <p className="mt-3 text-on-surface-variant text-sm tracking-tight">
          소셜 계정으로 1초 만에 로그인하세요
        </p>
      </div>
      <LoginForm next={next} />
    </div>
  );
}
