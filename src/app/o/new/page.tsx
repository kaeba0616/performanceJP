import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { NewOrgForm } from "./NewOrgForm";

export const metadata = {
  title: "단체 만들기 | THE PULSE",
};

export default async function NewOrgPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/o/new");
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <div className="text-center mb-10">
        <h1 className="editorial-title text-4xl font-black tracking-tighter text-primary">
          NEW GROUP
        </h1>
        <p className="mt-3 text-on-surface-variant text-sm tracking-tight">
          공연 단체·동아리를 만들어 홍보·예약·공지를 한 곳에서 운영하세요
        </p>
      </div>
      <NewOrgForm />
    </div>
  );
}
