import { createServiceClient } from "@/lib/supabase/server";
import { getOrgByHandle, getSessionUser } from "@/lib/orgs/permissions";
import { MembersManager, type MemberRow } from "./MembersManager";

interface PageProps {
  params: Promise<{ handle: string }>;
}

export default async function ManageMembersPage({ params }: PageProps) {
  const { handle } = await params;
  const org = await getOrgByHandle(handle);
  if (!org) return null;

  const user = await getSessionUser();
  const svc = createServiceClient();
  const { data } = await svc
    .from("org_members")
    .select(
      "user_id, role, joined_at, profile:profiles(handle, display_name, avatar_url)"
    )
    .eq("org_id", org.id)
    .order("joined_at", { ascending: true });

  const members = (data ?? []) as unknown as MemberRow[];
  const myRole =
    members.find((m) => m.user_id === user?.id)?.role ?? "member";

  return (
    <MembersManager
      orgId={org.id}
      initialMembers={members}
      currentUserId={user?.id ?? ""}
      currentRole={myRole}
    />
  );
}
