import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, BadgeCheck } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";
import { getOrgByHandle } from "@/lib/orgs/permissions";
import { formatDate } from "@/lib/utils/date";

interface PageProps {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { handle } = await params;
  const org = await getOrgByHandle(handle);
  if (!org) return { title: "단체를 찾을 수 없어요 | THE PULSE" };
  return {
    title: `${org.name} | THE PULSE`,
    description: org.description ?? `${org.name}의 공연 소식`,
    openGraph: {
      title: org.name,
      description: org.description ?? `${org.name}의 공연 소식`,
    },
  };
}

export default async function OrgPublicPage({ params }: PageProps) {
  const { handle } = await params;
  const org = await getOrgByHandle(handle);
  if (!org) notFound();

  const svc = createServiceClient();
  const [{ data: perfs }, { data: anns }] = await Promise.all([
    svc
      .from("performances")
      .select("id, title, venue, start_date, poster_url, image_url")
      .eq("org_id", org.id)
      .eq("visibility", "public")
      .order("start_date", { ascending: true }),
    svc
      .from("announcements")
      .select("id, title, body, created_at")
      .eq("org_id", org.id)
      .eq("audience", "public")
      .not("sent_at", "is", null)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const performances = perfs ?? [];
  const announcements = anns ?? [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <nav className="flex items-center gap-1.5 text-xs mb-8 text-on-surface-variant font-medium">
        <Link href="/" className="hover:text-primary transition-colors">홈</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-on-surface font-bold">{org.name}</span>
      </nav>

      <header className="text-center mb-12">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-primary text-on-primary flex items-center justify-center text-3xl font-black overflow-hidden mb-4">
          {org.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={org.logo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            org.name.charAt(0).toUpperCase()
          )}
        </div>
        <h1 className="editorial-title text-3xl md:text-4xl font-black tracking-tighter text-on-surface inline-flex items-center gap-2">
          {org.name}
          {org.is_verified && <BadgeCheck className="w-6 h-6 text-primary" />}
        </h1>
        {org.description && (
          <p className="max-w-lg mx-auto text-sm text-on-surface-variant mt-3 whitespace-pre-line">
            {org.description}
          </p>
        )}
        {org.contact && (
          <p className="text-xs text-on-surface-variant mt-3">문의 · {org.contact}</p>
        )}
      </header>

      {announcements.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xs font-black tracking-widest text-on-surface-variant uppercase mb-4">
            공지
          </h2>
          <ul className="space-y-2">
            {announcements.map((a) => (
              <li
                key={a.id}
                className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4"
              >
                <p className="font-bold text-on-surface text-sm">{a.title}</p>
                <p className="text-sm text-on-surface-variant mt-1 whitespace-pre-line line-clamp-3">
                  {a.body}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-xs font-black tracking-widest text-on-surface-variant uppercase mb-4">
          공연
        </h2>
        {performances.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-12 text-center">
            <p className="text-on-surface-variant">아직 공개된 공연이 없어요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {performances.map((p) => (
              <Link
                key={p.id}
                href={`/performances/${p.id}`}
                className="flex gap-4 bg-surface-container-lowest rounded-2xl border border-outline-variant p-4 hover:bg-surface-container-low transition"
              >
                <div className="w-20 h-24 rounded-lg bg-surface-container overflow-hidden shrink-0">
                  {(p.poster_url || p.image_url) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.poster_url || p.image_url || ""}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-on-surface line-clamp-2">{p.title}</p>
                  <p className="text-sm text-on-surface-variant mt-1">
                    {formatDate(p.start_date)}
                  </p>
                  {p.venue && (
                    <p className="text-xs text-on-surface-variant mt-0.5">{p.venue}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
