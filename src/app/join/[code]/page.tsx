import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { JoinAccept } from "./JoinAccept";

export const metadata = {
  title: "단체 초대 | THE PULSE",
};

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function JoinPage({ params }: PageProps) {
  const { code } = await params;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/join/${code}`);
  }

  return (
    <div className="mx-auto max-w-md px-6 py-20 text-center">
      <h1 className="editorial-title text-3xl font-black tracking-tighter text-primary mb-3">
        단체 초대
      </h1>
      <p className="text-on-surface-variant text-sm mb-8">
        초대를 수락하면 단체에 가입됩니다.
      </p>
      <JoinAccept code={code} />
    </div>
  );
}
