import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { OnboardingForm } from "./OnboardingForm";
import { suggestHandle } from "@/lib/profiles/handle";

export const metadata = {
  title: "사용자명 설정 | THE PULSE",
};

interface PageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function OnboardingPage({ searchParams }: PageProps) {
  const { next } = await searchParams;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("handle")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.handle) {
    redirect(next || "/me");
  }

  const initialSuggestion = user.email ? suggestHandle(user.email) : "";

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <div className="text-center mb-10">
        <h1 className="editorial-title text-4xl font-black tracking-tighter text-primary">
          ONBOARDING
        </h1>
        <p className="mt-3 text-on-surface-variant text-sm tracking-tight">
          공유 가능한 프로필 주소(@사용자명)를 정해주세요
        </p>
      </div>
      <OnboardingForm initialHandle={initialSuggestion} next={next} />
    </div>
  );
}
