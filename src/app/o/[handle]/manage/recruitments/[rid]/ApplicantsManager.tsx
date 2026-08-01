"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Copy, Check, ExternalLink } from "lucide-react";
import {
  APPLICATION_STATUS_LABEL,
  type ApplicationStatus,
} from "@/lib/orgs/types";

export interface ApplicantRow {
  id: string;
  name: string;
  part: string | null;
  phone: string | null;
  email: string | null;
  intro: string | null;
  attachment_url: string | null;
  status: ApplicationStatus;
  created_at: string;
}

const STATUS_STYLE: Record<ApplicationStatus, string> = {
  submitted: "bg-surface-container-high text-on-surface-variant",
  screening: "bg-secondary/15 text-secondary",
  audition: "bg-secondary/15 text-secondary",
  passed: "bg-primary/15 text-primary",
  rejected: "bg-error/15 text-error",
};

export function ApplicantsManager({
  handle,
  recruitment,
  initialApplicants,
}: {
  handle: string;
  recruitment: { id: string; title: string; status: "open" | "closed"; is_public: boolean };
  initialApplicants: ApplicantRow[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initialApplicants);
  const [status, setStatus] = useState(recruitment.status);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const applyUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/o/${handle}/apply/${recruitment.id}`
      : "";

  async function copyApplyLink() {
    await navigator.clipboard.writeText(applyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function toggleStatus() {
    const next = status === "open" ? "closed" : "open";
    const res = await fetch(`/api/recruitments/${recruitment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) {
      setStatus(next);
      router.refresh();
    }
  }

  async function changeStatus(id: string, newStatus: ApplicationStatus) {
    setError("");
    setNotice("");
    const res = await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "변경 실패");
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
    if (data.emailed) setNotice("결과 이메일을 발송했어요.");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-bold text-on-surface">{recruitment.title}</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">지원 {rows.length}명</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleStatus}
            className="text-sm font-bold text-on-surface bg-surface-container-low rounded-full px-4 py-2 hover:bg-surface-container transition"
          >
            {status === "open" ? "모집 마감하기" : "다시 모집하기"}
          </button>
          <a
            href={`/api/recruitments/${recruitment.id}/export`}
            className="inline-flex items-center gap-1.5 bg-surface-container-low text-on-surface font-bold text-sm py-2 px-4 rounded-full hover:bg-surface-container transition"
          >
            <Download className="w-4 h-4" />CSV
          </a>
        </div>
      </div>

      {/* 지원 링크 공유 */}
      <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant rounded-full pl-4 pr-2 py-2">
        <span className="flex-1 text-sm text-on-surface-variant truncate">{applyUrl}</span>
        <a href={applyUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 text-on-surface-variant hover:text-primary p-1.5">
          <ExternalLink className="w-4 h-4" />
        </a>
        <button type="button" onClick={copyApplyLink} className="shrink-0 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:bg-primary/10 rounded-full px-3 py-1.5 transition">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "복사됨" : "지원링크 복사"}
        </button>
      </div>

      {error && <div className="text-sm text-error bg-error-container/30 rounded-xl p-3">{error}</div>}
      {notice && <div className="text-sm text-secondary bg-secondary/10 rounded-xl p-3">{notice}</div>}

      {rows.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-12 text-center">
          <p className="text-on-surface-variant">아직 지원자가 없어요. 지원 링크를 공유해보세요.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((a) => (
            <li key={a.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-on-surface">
                    {a.name}
                    {a.part && <span className="text-on-surface-variant font-medium"> · {a.part}</span>}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {a.phone ?? ""}{a.phone && a.email ? " · " : ""}{a.email ?? ""}
                  </p>
                  {a.intro && (
                    <p className="text-sm text-on-surface-variant mt-2 whitespace-pre-line line-clamp-3">{a.intro}</p>
                  )}
                  {a.attachment_url && (
                    <a href={a.attachment_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-primary mt-2 hover:underline">
                      첨부 <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`text-[11px] font-black px-2.5 py-1 rounded-full ${STATUS_STYLE[a.status]}`}>
                    {APPLICATION_STATUS_LABEL[a.status]}
                  </span>
                  <select
                    value={a.status}
                    onChange={(e) => changeStatus(a.id, e.target.value as ApplicationStatus)}
                    className="bg-surface-container-low rounded-full px-3 py-1.5 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="submitted">접수</option>
                    <option value="screening">서류심사</option>
                    <option value="audition">오디션</option>
                    <option value="passed">합격 (메일)</option>
                    <option value="rejected">불합격 (메일)</option>
                  </select>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
