import { redirect } from "next/navigation";
import Link from "next/link";
import { loadStaffContextByHandle } from "@/lib/orgs/permissions";
import { ROLE_LABEL } from "@/lib/orgs/types";
import { ManageNav } from "./ManageNav";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ handle: string }>;
}

export default async function ManageLayout({ children, params }: LayoutProps) {
  const { handle } = await params;
  const result = await loadStaffContextByHandle(handle);
  if (!result.ok) redirect(result.redirectTo);

  const { org, role } = result.ctx;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] font-black tracking-widest text-on-surface-variant uppercase mb-1">
              MANAGE · {ROLE_LABEL[role]}
            </p>
            <h1 className="editorial-title text-2xl md:text-3xl font-black tracking-tighter text-on-surface">
              {org.name}
            </h1>
          </div>
          <Link
            href={`/o/${org.handle}`}
            className="text-sm font-bold text-on-surface-variant hover:text-primary transition-colors"
          >
            공개 페이지 보기 ↗
          </Link>
        </div>
      </header>

      <ManageNav handle={org.handle} />

      <div className="mt-8">{children}</div>
    </div>
  );
}
