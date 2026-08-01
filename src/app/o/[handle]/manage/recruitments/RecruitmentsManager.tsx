"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Plus, ChevronRight } from "lucide-react";

export interface RecruitmentRow {
  id: string;
  title: string;
  parts: string | null;
  status: "open" | "closed";
  is_public: boolean;
  deadline: string | null;
  applicantCount: number;
}

const inputCls =
  "w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary/30";
const labelCls =
  "block text-xs font-semibold tracking-tight text-on-surface-variant mb-1.5";

export function RecruitmentsManager({
  orgId,
  handle,
  initialRows,
}: {
  orgId: string;
  handle: string;
  initialRows: RecruitmentRow[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [open, setOpen] = useState(initialRows.length === 0);
  const [title, setTitle] = useState("");
  const [parts, setParts] = useState("");
  const [headcount, setHeadcount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim()) {
      setError("제목을 입력해주세요.");
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/orgs/${orgId}/recruitments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        parts: parts.trim() || undefined,
        headcount: headcount === "" ? undefined : Number(headcount),
        deadline: deadline || undefined,
        description: description.trim() || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "생성 실패");
      return;
    }
    setRows((prev) => [
      {
        id: data.id,
        title: title.trim(),
        parts: parts.trim() || null,
        status: "open",
        is_public: true,
        deadline: deadline || null,
        applicantCount: 0,
      },
      ...prev,
    ]);
    setTitle("");
    setParts("");
    setHeadcount("");
    setDeadline("");
    setDescription("");
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-on-surface">모집 ({rows.length})</h2>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 bg-primary text-on-primary font-bold text-sm py-2 px-4 rounded-full hover:bg-primary-container transition"
        >
          <Plus className="w-4 h-4" />새 모집
        </button>
      </div>

      {open && (
        <form
          onSubmit={create}
          className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 space-y-4"
        >
          <div>
            <label className={labelCls}>제목 *</label>
            <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="2026 신입 단원 모집" maxLength={120} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>모집 파트</label>
              <input className={inputCls} value={parts} onChange={(e) => setParts(e.target.value)} placeholder="보컬, 베이스, 스태프" maxLength={200} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>인원</label>
                <input type="number" min={0} className={inputCls} value={headcount} onChange={(e) => setHeadcount(e.target.value)} placeholder="∞" />
              </div>
              <div>
                <label className={labelCls}>마감일</label>
                <input type="date" className={inputCls} value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>
            </div>
          </div>
          <div>
            <label className={labelCls}>설명</label>
            <textarea className={`${inputCls} resize-none`} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} />
          </div>
          <button type="submit" disabled={busy} className="inline-flex items-center gap-2 bg-primary text-on-primary font-bold py-2.5 px-6 rounded-full hover:bg-primary-container disabled:opacity-50 transition">
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}공고 등록
          </button>
          {error && <div className="text-sm text-error bg-error-container/30 rounded-xl p-3">{error}</div>}
        </form>
      )}

      {rows.length === 0 && !open ? (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-12 text-center">
          <p className="text-on-surface-variant">아직 모집 공고가 없어요.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id}>
              <Link
                href={`/o/${handle}/manage/recruitments/${r.id}`}
                className="flex items-center gap-3 bg-surface-container-lowest rounded-xl border border-outline-variant p-4 hover:bg-surface-container-low transition"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-on-surface truncate">{r.title}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {r.parts ? `${r.parts} · ` : ""}지원 {r.applicantCount}명
                    {r.deadline ? ` · ~${r.deadline}` : ""}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-[11px] font-black px-2.5 py-1 rounded-full ${
                    r.status === "open"
                      ? "bg-primary/15 text-primary"
                      : "bg-surface-container-high text-on-surface-variant"
                  }`}
                >
                  {r.status === "open" ? "모집중" : "마감"}
                </span>
                <ChevronRight className="w-4 h-4 text-on-surface-variant shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
