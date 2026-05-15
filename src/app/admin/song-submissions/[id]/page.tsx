"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SongEditor } from "@/components/admin/SongEditor";
import { normalizeSongs, type Song } from "@/types";

interface Detail {
  id: string;
  kind: "setlist" | "hit_songs";
  status: string;
  submitter_email: string;
  submitter_name: string | null;
  submitter_note: string | null;
  songs: unknown;
  admin_note: string | null;
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
  performance: {
    id: string;
    title: string;
    start_date: string;
    venue: string | null;
    setlist: unknown;
  } | null;
  artist: {
    id: string;
    name_ko: string;
    name_en: string | null;
    hit_songs: unknown;
  } | null;
}

export default function AdminSongSubmissionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<Detail | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [rejectReason, setRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/admin/song-submissions/${id}`, {
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      const json = await res.json();
      setData(json.submission);
      setSongs(normalizeSongs(json.submission.songs));
    } else {
      setError("불러올 수 없습니다.");
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function approve() {
    setError("");
    setSubmitting(true);
    try {
      const cleaned = songs
        .map((s) => ({ title: s.title.trim(), youtube_url: s.youtube_url?.trim() || null }))
        .filter((s) => s.title.length > 0);
      const res = await fetch(`/api/admin/song-submissions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", songs: cleaned }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        router.push("/admin/song-submissions");
      } else {
        setError(json?.error || "승인 실패");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function reject() {
    if (!window.confirm("이 제보를 거절하시겠습니까?")) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/song-submissions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", rejection_reason: rejectReason || null }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        router.push("/admin/song-submissions");
      } else {
        setError(json?.error || "거절 실패");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!data) {
    return <div className="text-sm text-[#424754]">{error || "로딩 중..."}</div>;
  }

  const kindLabel = data.kind === "setlist" ? "셋리스트" : "대표곡";
  const targetTitle =
    data.kind === "setlist" && data.performance
      ? data.performance.title
      : data.artist
        ? data.artist.name_en || data.artist.name_ko
        : "대상 없음";

  const currentSongs =
    data.kind === "setlist" && data.performance
      ? normalizeSongs(data.performance.setlist)
      : data.artist
        ? normalizeSongs(data.artist.hit_songs)
        : [];

  const isPending = data.status === "pending";

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/song-submissions"
        className="inline-flex items-center gap-1 text-sm text-[#0058be] hover:text-[#004a9e] mb-4"
      >
        ← 목록으로
      </Link>

      <h1 className="text-2xl font-bold text-[#131b2e] mb-2">
        {kindLabel} 제보 · {targetTitle}
      </h1>
      <div className="flex items-center gap-3 text-xs text-[#424754] mb-6">
        <span className="px-2 py-0.5 rounded-full bg-[#eef2ff] text-[#3730a3] font-medium">
          {kindLabel}
        </span>
        <span
          className={`px-2 py-0.5 rounded-full font-medium ${
            data.status === "pending"
              ? "bg-amber-100 text-amber-700"
              : data.status === "approved"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
          }`}
        >
          {data.status === "pending" ? "대기" : data.status === "approved" ? "승인" : "거절"}
        </span>
        <span>접수: {new Date(data.created_at).toLocaleString("ko-KR")}</span>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-[#e5e7eb] p-5 mb-5 space-y-3 text-sm">
        <div>
          <div className="text-xs text-[#424754] font-medium mb-0.5">제보자</div>
          <div className="text-[#131b2e]">
            {data.submitter_email}
            {data.submitter_name ? ` (${data.submitter_name})` : ""}
          </div>
        </div>
        {data.submitter_note && (
          <div>
            <div className="text-xs text-[#424754] font-medium mb-0.5">비고</div>
            <div className="text-[#131b2e] whitespace-pre-wrap">{data.submitter_note}</div>
          </div>
        )}
        {data.kind === "setlist" && data.performance && (
          <div>
            <div className="text-xs text-[#424754] font-medium mb-0.5">대상 공연</div>
            <Link
              href={`/admin/performances/${data.performance.id}/edit`}
              className="text-[#0058be] hover:underline"
            >
              {data.performance.title} ({data.performance.start_date}
              {data.performance.venue ? ` · ${data.performance.venue}` : ""}) →
            </Link>
          </div>
        )}
        {data.kind === "hit_songs" && data.artist && (
          <div>
            <div className="text-xs text-[#424754] font-medium mb-0.5">대상 아티스트</div>
            <Link href={`/artists/${data.artist.id}`} className="text-[#0058be] hover:underline">
              {data.artist.name_ko}
              {data.artist.name_en ? ` (${data.artist.name_en})` : ""} →
            </Link>
          </div>
        )}
        {currentSongs.length > 0 && (
          <div>
            <div className="text-xs text-[#424754] font-medium mb-1">현재 등록된 곡 ({currentSongs.length})</div>
            <ul className="text-[#131b2e] list-disc list-inside text-xs space-y-0.5">
              {currentSongs.slice(0, 30).map((s, i) => (
                <li key={i}>{s.title}</li>
              ))}
              {currentSongs.length > 30 && <li>… 외 {currentSongs.length - 30}곡</li>}
            </ul>
            <p className="text-xs text-amber-700 mt-2">
              ⚠️ 승인하면 기존 {currentSongs.length}곡이 아래 목록으로 <b>전부 교체</b>됩니다.
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-[#e5e7eb] p-5 mb-5">
        <h2 className="text-sm font-semibold text-[#131b2e] mb-3">
          제보된 곡 ({songs.length}) — 승인 전 편집 가능
        </h2>
        <SongEditor value={songs} onChange={setSongs} />
      </div>

      {data.status === "rejected" && data.rejection_reason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-5 text-sm text-red-800">
          <div className="font-semibold mb-1">거절 사유</div>
          <div className="whitespace-pre-wrap">{data.rejection_reason}</div>
        </div>
      )}

      {isPending && (
        <div className="bg-white rounded-lg shadow-sm border border-[#e5e7eb] p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#424754] mb-1">
              거절 사유 (거절 시)
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={2}
              placeholder="(선택) 제보자에게 표시될 수 있음"
              className="w-full border border-[#d1d5db] rounded-lg px-3 py-2 text-sm text-[#131b2e] focus:outline-none focus:ring-2 focus:ring-[#0058be]/30"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={approve}
              disabled={submitting || songs.length === 0}
              className="flex-1 bg-[#0058be] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#004a9e] disabled:opacity-50"
            >
              {submitting ? "처리 중..." : "승인하고 적용"}
            </button>
            <button
              onClick={reject}
              disabled={submitting}
              className="flex-1 bg-white text-[#da3437] border border-[#fecaca] rounded-lg py-2.5 text-sm font-medium hover:bg-[#fef2f2] disabled:opacity-50"
            >
              거절
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
