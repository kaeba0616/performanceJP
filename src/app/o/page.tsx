import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, ChevronRight } from "lucide-react";
import { getSessionUser, getUserMemberships } from "@/lib/orgs/permissions";
import { ROLE_LABEL, isStaffRole } from "@/lib/orgs/types";

export const metadata = {
  title: "내 단체 | THE PULSE",
};

export default async function MyOrgsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/o");

  const memberships = await getUserMemberships(user.id);

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="editorial-title text-3xl font-black tracking-tighter text-on-surface">
          내 단체
        </h1>
        <Link
          href="/o/new"
          className="inline-flex items-center gap-1.5 bg-primary text-on-primary font-bold text-sm py-2 px-4 rounded-full hover:bg-primary-container transition"
        >
          <Plus className="w-4 h-4" />새 단체
        </Link>
      </div>

      {memberships.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-12 text-center">
          <p className="text-on-surface-variant mb-4">아직 소속된 단체가 없어요.</p>
          <Link
            href="/o/new"
            className="inline-flex items-center gap-1.5 bg-primary text-on-primary font-bold text-sm py-2.5 px-5 rounded-full hover:bg-primary-container transition"
          >
            <Plus className="w-4 h-4" />첫 단체 만들기
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {memberships.map(({ org, role }) => (
            <li key={org.id}>
              <Link
                href={isStaffRole(role) ? `/o/${org.handle}/manage` : `/o/${org.handle}`}
                className="flex items-center gap-3 bg-surface-container-lowest rounded-2xl border border-outline-variant p-4 hover:bg-surface-container-low transition"
              >
                <div className="w-11 h-11 rounded-xl bg-primary text-on-primary flex items-center justify-center font-black overflow-hidden shrink-0">
                  {org.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={org.logo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    org.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-on-surface truncate">{org.name}</p>
                  <p className="text-xs text-on-surface-variant">
                    {ROLE_LABEL[role]} · /o/{org.handle}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-on-surface-variant shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
