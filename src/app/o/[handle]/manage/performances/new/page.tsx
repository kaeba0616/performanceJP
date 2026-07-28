import { getOrgByHandle } from "@/lib/orgs/permissions";
import { NewPerformanceForm } from "./NewPerformanceForm";

interface PageProps {
  params: Promise<{ handle: string }>;
}

export default async function NewPerformancePage({ params }: PageProps) {
  const { handle } = await params;
  const org = await getOrgByHandle(handle);
  if (!org) return null;

  return (
    <div className="max-w-lg">
      <h2 className="font-bold text-on-surface mb-1">새 공연 개설</h2>
      <p className="text-sm text-on-surface-variant mb-6">
        기본 정보만 먼저 입력하세요. 개설 후 포스터·소개·회차·정원을 이어서 편집할 수 있어요.
      </p>
      <NewPerformanceForm orgId={org.id} handle={org.handle} />
    </div>
  );
}
