"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface ArtistOption {
  id: string;
  name_ko: string;
  name_en: string | null;
}

interface SubmissionDetail {
  id: string;
  submitter_email: string;
  submitter_name: string | null;
  submitter_ip: string | null;
  submitter_note: string | null;
  artist_id: string | null;
  proposed_artist_name_ko: string | null;
  proposed_artist_name_ja: string | null;
  proposed_artist_name_en: string | null;
  title: string;
  venue: string | null;
  city: string | null;
  start_date: string;
  end_date: string | null;
  ticket_open_at: string | null;
  presale_open_at: string | null;
  price_info: string | null;
  image_url: string | null;
  source_url: string | null;
  status: string;
  admin_note: string | null;
  rejection_reason: string | null;
  approved_performance_id: string | null;
  created_artist_id: string | null;
  created_at: string;
  reviewed_at: string | null;
  artist: { id: string; name_ko: string; name_en: string | null } | null;
}

const inputClass =
  "w-full border border-[#d1d5db] rounded-lg px-3 py-2 text-sm text-[#131b2e] focus:outline-none focus:ring-2 focus:ring-[#0058be]/30 focus:border-[#0058be]";
const labelClass = "block text-sm font-medium text-[#424754] mb-1";

export default function AdminSubmissionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const [sub, setSub] = useState<SubmissionDetail | null>(null);
  const [artists, setArtists] = useState<ArtistOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<"approve" | "reject" | null>(
    null
  );
  const [error, setError] = useState("");

  // Form state (editable)
  const [title, setTitle] = useState("");
  const [venue, setVenue] = useState("");
  const [city, setCity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [ticketOpenAt, setTicketOpenAt] = useState("");
  const [priceInfo, setPriceInfo] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [adminNote, setAdminNote] = useState("");

  // Artist resolution
  const [artistId, setArtistId] = useState<string>("");
  const [createNewArtist, setCreateNewArtist] = useState(false);
  const [proposedKo, setProposedKo] = useState("");
  const [proposedJa, setProposedJa] = useState("");
  const [proposedEn, setProposedEn] = useState("");

  // Reject modal
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const headers = {
        "Content-Type": "application/json",
      };
      const [subRes, artistsRes] = await Promise.all([
        fetch(`/api/admin/submissions/${id}`, { headers }),
        fetch("/api/admin/artists", { headers }),
      ]);

      if (subRes.ok) {
        const data = await subRes.json();
        const s: SubmissionDetail = data.submission;
        setSub(s);
        setTitle(s.title);
        setVenue(s.venue || "");
        setCity(s.city || "");
        setStartDate(s.start_date || "");
        setEndDate(s.end_date || "");
        setTicketOpenAt(
          s.ticket_open_at
            ? new Date(s.ticket_open_at).toISOString().slice(0, 16)
            : ""
        );
        setPriceInfo(s.price_info || "");
        setSourceUrl(s.source_url || "");
        setImageUrl(s.image_url || "");
        setAdminNote(s.admin_note || "");

        setArtistId(s.artist_id || "");
        setProposedKo(s.proposed_artist_name_ko || "");
        setProposedJa(s.proposed_artist_name_ja || "");
        setProposedEn(s.proposed_artist_name_en || "");
        // Default: if submission has a proposed artist and no artist_id, suggest creating new
        setCreateNewArtist(!s.artist_id && !!s.proposed_artist_name_ko);
      }
      if (artistsRes.ok) {
        const data = await artistsRes.json();
        setArtists(data.artists || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSave() {
    if (!sub) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/submissions/${sub.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          artist_id: createNewArtist ? null : artistId || null,
          proposed_artist_name_ko: proposedKo || null,
          proposed_artist_name_ja: proposedJa || null,
          proposed_artist_name_en: proposedEn || null,
          title,
          venue: venue || null,
          city: city || null,
          start_date: startDate,
          end_date: endDate || null,
          ticket_open_at: ticketOpenAt || null,
          price_info: priceInfo || null,
          source_url: sourceUrl || null,
          image_url: imageUrl || null,
          admin_note: adminNote || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "저장에 실패했습니다.");
      } else {
        await fetchData();
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove() {
    if (!sub) return;

    // Persist edits first
    await handleSave();

    setActionLoading("approve");
    setError("");
    try {
      const res = await fetch(
        `/api/admin/submissions/${sub.id}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            artist_id: createNewArtist ? null : artistId || null,
            createNewArtist,
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "승인에 실패했습니다.");
      } else {
        router.push("/admin/submissions");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject() {
    if (!sub) return;
    if (!rejectReason.trim()) {
      setError("거절 사유를 입력해주세요.");
      return;
    }
    setActionLoading("reject");
    setError("");
    try {
      const res = await fetch(
        `/api/admin/submissions/${sub.id}/reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason: rejectReason.trim() }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "거절 처리에 실패했습니다.");
      } else {
        router.push("/admin/submissions");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setActionLoading(null);
      setRejectOpen(false);
    }
  }

  if (loading) {
    return (
      <div className="text-sm text-[#424754]">로딩 중...</div>
    );
  }
  if (!sub) {
    return (
      <div className="text-sm text-[#424754]">제보를 찾을 수 없습니다.</div>
    );
  }

  const isPending = sub.status === "pending";
  const statusLabel: Record<string, string> = {
    pending: "대기",
    approved: "승인됨",
    rejected: "거절됨",
  };
  const statusBadge: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/submissions"
        className="inline-flex items-center gap-1 text-sm text-[#424754] hover:text-[#0058be] mb-4"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        목록으로
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-[#131b2e]">제보 상세</h1>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            statusBadge[sub.status] || "bg-gray-100 text-gray-500"
          }`}
        >
          {statusLabel[sub.status] || sub.status}
        </span>
      </div>

      {/* Submitter box */}
      <div className="bg-white rounded-lg shadow-sm border border-[#e5e7eb] p-6 mb-6">
        <h2 className="text-base font-semibold text-[#131b2e] mb-3">제출자</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-[#424754] mb-0.5">이메일</dt>
            <dd className="text-[#131b2e] break-all">{sub.submitter_email}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#424754] mb-0.5">이름</dt>
            <dd className="text-[#131b2e]">{sub.submitter_name || "-"}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#424754] mb-0.5">제출 시각</dt>
            <dd className="text-[#131b2e]">
              {new Date(sub.created_at).toLocaleString("ko-KR")}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[#424754] mb-0.5">IP</dt>
            <dd className="text-[#131b2e] font-mono">{sub.submitter_ip || "-"}</dd>
          </div>
          {sub.submitter_note && (
            <div className="sm:col-span-2">
              <dt className="text-xs text-[#424754] mb-0.5">비고</dt>
              <dd className="text-[#131b2e] whitespace-pre-wrap">
                {sub.submitter_note}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Artist resolution */}
      <div className="bg-white rounded-lg shadow-sm border border-[#e5e7eb] p-6 mb-6 space-y-4">
        <h2 className="text-base font-semibold text-[#131b2e]">아티스트 매칭</h2>

        {(sub.proposed_artist_name_ko ||
          sub.proposed_artist_name_ja ||
          sub.proposed_artist_name_en) && (
          <div className="bg-[#fefce8] border border-[#fde68a] rounded-lg p-3 text-sm">
            <p className="text-xs font-semibold text-[#92400e] mb-1">
              제출자의 새 아티스트 제안
            </p>
            <p className="text-[#92400e]">
              {sub.proposed_artist_name_ko}
              {sub.proposed_artist_name_en
                ? ` · ${sub.proposed_artist_name_en}`
                : ""}
              {sub.proposed_artist_name_ja
                ? ` · ${sub.proposed_artist_name_ja}`
                : ""}
            </p>
          </div>
        )}

        {isPending && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="createNewArtist"
              checked={createNewArtist}
              onChange={(e) => setCreateNewArtist(e.target.checked)}
              className="rounded"
            />
            <label
              htmlFor="createNewArtist"
              className="text-sm text-[#131b2e]"
            >
              새 아티스트로 등록 (위 제안 이름으로 <code>artists</code> 테이블에 추가)
            </label>
          </div>
        )}

        {!createNewArtist && (
          <div>
            <label className={labelClass}>기존 아티스트 선택</label>
            <select
              value={artistId}
              onChange={(e) => setArtistId(e.target.value)}
              disabled={!isPending}
              className={inputClass}
            >
              <option value="">선택 안함</option>
              {artists.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name_ko}
                  {a.name_en ? ` (${a.name_en})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {createNewArtist && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>한글</label>
              <input
                type="text"
                value={proposedKo}
                onChange={(e) => setProposedKo(e.target.value)}
                disabled={!isPending}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>일본어</label>
              <input
                type="text"
                value={proposedJa}
                onChange={(e) => setProposedJa(e.target.value)}
                disabled={!isPending}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>영문</label>
              <input
                type="text"
                value={proposedEn}
                onChange={(e) => setProposedEn(e.target.value)}
                disabled={!isPending}
                className={inputClass}
              />
            </div>
          </div>
        )}
      </div>

      {/* Performance fields */}
      <div className="bg-white rounded-lg shadow-sm border border-[#e5e7eb] p-6 mb-6 space-y-4">
        <h2 className="text-base font-semibold text-[#131b2e]">공연 정보</h2>

        <div>
          <label className={labelClass}>제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!isPending}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>장소</label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              disabled={!isPending}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>도시</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={!isPending}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>시작일</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={!isPending}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>종료일</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={!isPending}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>티켓 오픈</label>
          <input
            type="datetime-local"
            value={ticketOpenAt}
            onChange={(e) => setTicketOpenAt(e.target.value)}
            disabled={!isPending}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>가격 정보</label>
          <input
            type="text"
            value={priceInfo}
            onChange={(e) => setPriceInfo(e.target.value)}
            disabled={!isPending}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>참고 URL (승인 시 source_listing 생성)</label>
          <input
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            disabled={!isPending}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>이미지 URL</label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            disabled={!isPending}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>관리자 메모</label>
          <textarea
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            disabled={!isPending}
            rows={2}
            className={inputClass}
          />
        </div>
      </div>

      {/* Outcome info for already-reviewed */}
      {!isPending && (
        <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-4 mb-6 text-sm">
          {sub.status === "approved" && sub.approved_performance_id && (
            <p>
              승인 완료 —{" "}
              <Link
                href={`/performances/${sub.approved_performance_id}`}
                className="text-[#0058be] hover:underline"
                target="_blank"
              >
                공연 페이지 보기 →
              </Link>
            </p>
          )}
          {sub.status === "rejected" && sub.rejection_reason && (
            <div>
              <p className="text-xs text-[#424754] mb-1">거절 사유</p>
              <p className="text-[#131b2e]">{sub.rejection_reason}</p>
            </div>
          )}
          {sub.reviewed_at && (
            <p className="text-xs text-[#424754] mt-2">
              검토 시각: {new Date(sub.reviewed_at).toLocaleString("ko-KR")}
            </p>
          )}
        </div>
      )}

      {error && <p className="text-sm text-[#da3437] mb-4">{error}</p>}

      {isPending && (
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleSave}
            disabled={saving || actionLoading !== null}
            className="bg-white text-[#424754] border border-[#d1d5db] rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#f9fafb] transition-colors disabled:opacity-50"
          >
            {saving ? "저장 중..." : "편집 저장"}
          </button>
          <button
            onClick={handleApprove}
            disabled={actionLoading !== null}
            className="bg-[#0058be] text-white rounded-lg px-6 py-2 text-sm font-medium hover:bg-[#004a9e] transition-colors disabled:opacity-50"
          >
            {actionLoading === "approve" ? "승인 중..." : "승인"}
          </button>
          <button
            onClick={() => setRejectOpen(true)}
            disabled={actionLoading !== null}
            className="bg-white text-[#da3437] border border-[#d1d5db] rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#fef2f2] transition-colors disabled:opacity-50"
          >
            거절
          </button>
        </div>
      )}

      {/* Reject modal */}
      {rejectOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setRejectOpen(false)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-[#131b2e] mb-3">제보 거절</h3>
            <p className="text-sm text-[#424754] mb-3">
              제출자에게 이메일로 사유가 전달됩니다.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="거절 사유를 입력하세요"
              className={inputClass}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setRejectOpen(false)}
                className="bg-white text-[#424754] border border-[#d1d5db] rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#f9fafb]"
              >
                취소
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading === "reject"}
                className="bg-[#da3437] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#b91c1c] disabled:opacity-50"
              >
                {actionLoading === "reject" ? "처리 중..." : "거절 확정"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
