"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import type { AnnouncementAudience } from "@/lib/orgs/types";

export interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  sent_at: string | null;
  created_at: string;
}

export interface PerfOption {
  id: string;
  title: string;
}

const AUDIENCE_LABEL: Record<AnnouncementAudience, string> = {
  members: "단원",
  reservers: "예약자",
  public: "전체 공개",
};

const inputCls =
  "w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary/30";
const labelCls =
  "block text-xs font-semibold tracking-tight text-on-surface-variant mb-1.5";

export function AnnouncementsManager({
  orgId,
  initialAnnouncements,
  performances,
}: {
  orgId: string;
  initialAnnouncements: AnnouncementRow[];
  performances: PerfOption[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initialAnnouncements);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<AnnouncementAudience>("members");
  const [perfId, setPerfId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  async function createDraft(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!title.trim() || !body.trim()) {
      setError("제목과 내용을 입력해주세요.");
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/orgs/${orgId}/announcements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        body: body.trim(),
        audience,
        performance_id: perfId || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "저장에 실패했습니다.");
      return;
    }
    setRows((prev) => [
      {
        id: data.id,
        title: title.trim(),
        body: body.trim(),
        audience,
        sent_at: null,
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
    setTitle("");
    setBody("");
    setPerfId("");
    router.refresh();
  }

  async function send(id: string) {
    setError("");
    setNotice("");
    setSendingId(id);
    const res = await fetch(`/api/announcements/${id}/send`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setSendingId(null);
    if (!res.ok) {
      setError(data.error ?? "발송에 실패했습니다.");
      return;
    }
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, sent_at: r.sent_at ?? new Date().toISOString() } : r
      )
    );
    setNotice(`${data.sent}명에게 발송했어요. (대상 ${data.targeted}명)`);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {/* 작성 */}
      <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6">
        <h2 className="font-bold text-on-surface mb-4">공지 작성</h2>
        <form onSubmit={createDraft} className="space-y-4">
          <div>
            <label className={labelCls}>제목</label>
            <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
          </div>
          <div>
            <label className={labelCls}>내용</label>
            <textarea className={`${inputCls} resize-none`} rows={5} value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>대상</label>
              <select className={inputCls} value={audience} onChange={(e) => setAudience(e.target.value as AnnouncementAudience)}>
                <option value="members">단원 (이메일)</option>
                <option value="reservers">예약자 (이메일)</option>
                <option value="public">전체 공개 (페이지 게시)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>관련 공연 (선택)</label>
              <select className={inputCls} value={perfId} onChange={(e) => setPerfId(e.target.value)}>
                <option value="">없음</option>
                {performances.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 bg-primary text-on-primary font-bold py-2.5 px-6 rounded-full hover:bg-primary-container disabled:opacity-50 transition"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            공지 저장
          </button>
          <p className="text-xs text-on-surface-variant">
            저장 후 목록에서 <b>발송</b>을 눌러 이메일을 보냅니다. 예약자/단원 대상은 이메일이 있는 사람에게만 전달됩니다.
          </p>
        </form>
      </section>

      {error && <div className="text-sm text-error bg-error-container/30 rounded-xl p-3">{error}</div>}
      {notice && <div className="text-sm text-secondary bg-secondary/10 rounded-xl p-3">{notice}</div>}

      {/* 목록 */}
      <section>
        <h2 className="font-bold text-on-surface mb-4">공지 ({rows.length})</h2>
        {rows.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-12 text-center">
            <p className="text-on-surface-variant">아직 공지가 없어요.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {rows.map((a) => (
              <li key={a.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-on-surface">{a.title}</p>
                    <p className="text-sm text-on-surface-variant mt-1 whitespace-pre-line line-clamp-2">{a.body}</p>
                    <p className="text-[11px] text-on-surface-variant mt-2">
                      대상 · {AUDIENCE_LABEL[a.audience]}
                      {a.sent_at ? " · 발송됨" : " · 초안"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => send(a.id)}
                    disabled={sendingId === a.id}
                    className="shrink-0 inline-flex items-center gap-1.5 bg-secondary/15 text-secondary font-bold text-sm py-2 px-4 rounded-full hover:bg-secondary/25 disabled:opacity-50 transition"
                  >
                    {sendingId === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {a.audience === "public" ? "게시" : a.sent_at ? "재발송" : "발송"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
