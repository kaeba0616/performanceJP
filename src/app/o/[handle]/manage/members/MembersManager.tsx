"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, Loader2 } from "lucide-react";
import { ROLE_LABEL, type OrgRole } from "@/lib/orgs/types";

export interface MemberRow {
  user_id: string;
  role: OrgRole;
  joined_at: string;
  profile: {
    handle: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface Props {
  orgId: string;
  initialMembers: MemberRow[];
  currentUserId: string;
  currentRole: OrgRole;
}

export function MembersManager({
  orgId,
  initialMembers,
  currentUserId,
  currentRole,
}: Props) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [inviteRole, setInviteRole] = useState<OrgRole>("member");
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const isOwner = currentRole === "owner";

  async function generateInvite() {
    setError("");
    setBusy(true);
    const res = await fetch(`/api/orgs/${orgId}/invites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: inviteRole }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "초대 발급 실패");
      return;
    }
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    setInviteLink(`${origin}/join/${data.code}`);
    setCopied(false);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function changeRole(userId: string, role: OrgRole) {
    setError("");
    const res = await fetch(`/api/orgs/${orgId}/members/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "변경 실패");
      return;
    }
    setMembers((prev) =>
      prev.map((m) => (m.user_id === userId ? { ...m, role } : m))
    );
    router.refresh();
  }

  async function removeMember(userId: string) {
    if (!confirm("정말 제명하시겠어요?")) return;
    setError("");
    const res = await fetch(`/api/orgs/${orgId}/members/${userId}`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "제명 실패");
      return;
    }
    setMembers((prev) => prev.filter((m) => m.user_id !== userId));
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {/* 초대 */}
      <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6">
        <h2 className="font-bold text-on-surface mb-4">멤버 초대</h2>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as OrgRole)}
            className="bg-surface-container-low rounded-full px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="member">단원으로 초대</option>
            {isOwner && <option value="staff">운영진으로 초대</option>}
          </select>
          <button
            type="button"
            onClick={generateInvite}
            disabled={busy}
            className="bg-primary text-on-primary font-bold py-2.5 px-5 rounded-full hover:bg-primary-container disabled:opacity-50 transition inline-flex items-center gap-2"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            초대 링크 생성
          </button>
        </div>
        {inviteLink && (
          <div className="mt-4 flex items-center gap-2 bg-surface-container-low rounded-full pl-4 pr-2 py-2">
            <span className="flex-1 text-sm text-on-surface-variant truncate">
              {inviteLink}
            </span>
            <button
              type="button"
              onClick={copyLink}
              className="shrink-0 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:bg-primary/10 rounded-full px-3 py-1.5 transition"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "복사됨" : "복사"}
            </button>
          </div>
        )}
        <p className="mt-3 text-xs text-on-surface-variant">
          링크를 받은 사람이 로그인 후 접속하면 단체에 가입됩니다. 링크는 1회용입니다.
        </p>
      </section>

      {/* 멤버 목록 */}
      <section>
        <h2 className="font-bold text-on-surface mb-4">
          멤버 ({members.length})
        </h2>
        <ul className="space-y-2">
          {members.map((m) => {
            const name =
              m.profile?.display_name ||
              (m.profile?.handle ? `@${m.profile.handle}` : "익명 단원");
            const isSelf = m.user_id === currentUserId;
            return (
              <li
                key={m.user_id}
                className="flex items-center gap-3 bg-surface-container-lowest rounded-xl border border-outline-variant p-3"
              >
                <div className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-black overflow-hidden shrink-0">
                  {m.profile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.profile.avatar_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-on-surface text-sm truncate">
                    {name} {isSelf && <span className="text-on-surface-variant">(나)</span>}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {ROLE_LABEL[m.role]}
                  </p>
                </div>
                {isOwner && !isSelf && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <select
                      value={m.role}
                      onChange={(e) =>
                        changeRole(m.user_id, e.target.value as OrgRole)
                      }
                      className="bg-surface-container-low rounded-full px-3 py-1.5 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="owner">소유자</option>
                      <option value="staff">운영진</option>
                      <option value="member">단원</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => removeMember(m.user_id)}
                      className="text-xs font-bold text-error hover:bg-error-container/30 rounded-full px-3 py-1.5 transition"
                    >
                      제명
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {error && (
        <div className="text-sm text-error bg-error-container/30 rounded-xl p-3">
          {error}
        </div>
      )}
    </div>
  );
}
