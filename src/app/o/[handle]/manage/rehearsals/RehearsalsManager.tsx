"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { formatShowTime } from "@/lib/utils/date";

export interface RehearsalRow {
  id: string;
  title: string;
  starts_at_local: string;
  location: string | null;
  target_parts: string | null;
  going: number;
  maybe: number;
  not: number;
}

const inputCls =
  "w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary/30";
const labelCls =
  "block text-xs font-semibold tracking-tight text-on-surface-variant mb-1.5";

export function RehearsalsManager({
  orgId,
  memberCount,
  initialRows,
}: {
  orgId: string;
  memberCount: number;
  initialRows: RehearsalRow[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [open, setOpen] = useState(initialRows.length === 0);
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [location, setLocation] = useState("");
  const [targetParts, setTargetParts] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim() || !startsAt) {
      setError("제목과 일시는 필수입니다.");
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/orgs/${orgId}/rehearsals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        starts_at: startsAt,
        location: location.trim() || undefined,
        target_parts: targetParts.trim() || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "등록 실패");
      return;
    }
    setRows((prev) =>
      [
        ...prev,
        {
          id: data.id,
          title: title.trim(),
          starts_at_local: startsAt,
          location: location.trim() || null,
          target_parts: targetParts.trim() || null,
          going: 0,
          maybe: 0,
          not: 0,
        },
      ].sort((a, b) => a.starts_at_local.localeCompare(b.starts_at_local))
    );
    setTitle("");
    setStartsAt("");
    setLocation("");
    setTargetParts("");
    setOpen(false);
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("이 연습 일정을 삭제할까요?")) return;
    const res = await fetch(`/api/rehearsals/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRows((prev) => prev.filter((r) => r.id !== id));
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-on-surface">연습 일정 ({rows.length})</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">단원 {memberCount}명</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 bg-primary text-on-primary font-bold text-sm py-2 px-4 rounded-full hover:bg-primary-container transition"
        >
          <Plus className="w-4 h-4" />일정 추가
        </button>
      </div>

      {open && (
        <form onSubmit={create} className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 space-y-4">
          <div>
            <label className={labelCls}>제목 *</label>
            <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="전체 연습" maxLength={120} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>일시 *</label>
              <input type="datetime-local" className={inputCls} value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>장소</label>
              <input className={inputCls} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="연습실 A" maxLength={120} />
            </div>
          </div>
          <div>
            <label className={labelCls}>대상 파트 (선택)</label>
            <input className={inputCls} value={targetParts} onChange={(e) => setTargetParts(e.target.value)} placeholder="전체 / 보컬" maxLength={120} />
          </div>
          <button type="submit" disabled={busy} className="inline-flex items-center gap-2 bg-primary text-on-primary font-bold py-2.5 px-6 rounded-full hover:bg-primary-container disabled:opacity-50 transition">
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}등록
          </button>
          {error && <div className="text-sm text-error bg-error-container/30 rounded-xl p-3">{error}</div>}
        </form>
      )}

      {rows.length === 0 && !open ? (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-12 text-center">
          <p className="text-on-surface-variant">등록된 연습 일정이 없어요.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-3 bg-surface-container-lowest rounded-xl border border-outline-variant p-4">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-on-surface">{r.title}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {formatShowTime(r.starts_at_local)}
                  {r.location ? ` · ${r.location}` : ""}
                  {r.target_parts ? ` · ${r.target_parts}` : ""}
                </p>
                <p className="text-xs mt-1.5 flex gap-2">
                  <span className="text-primary font-bold">참석 {r.going}</span>
                  <span className="text-on-surface-variant">미정 {r.maybe}</span>
                  <span className="text-on-surface-variant">불참 {r.not}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(r.id)}
                className="shrink-0 text-error hover:bg-error-container/30 rounded-full p-2 transition"
                aria-label="삭제"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
