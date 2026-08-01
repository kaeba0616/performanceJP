"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Trash2, Plus, ExternalLink } from "lucide-react";
import type { Visibility } from "@/lib/orgs/types";
import type { GalleryItem, CastMember } from "@/lib/orgs/promo";
import { formatShowTime } from "@/lib/utils/date";

export interface ShowItem {
  id: string;
  starts_at_local: string; // "YYYY-MM-DDTHH:mm"
  capacity: number | null;
  label: string | null;
}

interface PerfData {
  id: string;
  title: string;
  summary: string | null;
  venue: string | null;
  city: string | null;
  start_date: string;
  end_date: string | null;
  price_info: string | null;
  poster_url: string | null;
  image_url: string | null;
  ticket_open_local: string;
  visibility: Visibility;
  video_url: string | null;
  gallery: GalleryItem[];
  cast_members: CastMember[];
}

const inputCls =
  "w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary/30";
const labelCls =
  "block text-xs font-semibold tracking-tight text-on-surface-variant mb-1.5";

export function PerformanceEditor({
  handle,
  perf,
  initialShows,
}: {
  handle: string;
  perf: PerfData;
  initialShows: ShowItem[];
}) {
  const router = useRouter();
  const [form, setForm] = useState(perf);
  const [shows, setShows] = useState(initialShows);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  // 새 회차 입력
  const [newStart, setNewStart] = useState("");
  const [newCap, setNewCap] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [addingShow, setAddingShow] = useState(false);

  function set<K extends keyof PerfData>(key: K, value: PerfData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function save() {
    setError("");
    if (!form.title.trim()) {
      setError("공연 제목은 필수입니다.");
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/performances/${perf.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        summary: form.summary,
        venue: form.venue,
        city: form.city,
        start_date: form.start_date,
        end_date: form.end_date,
        price_info: form.price_info,
        poster_url: form.poster_url,
        image_url: form.image_url,
        ticket_open_at: form.ticket_open_local || null,
        visibility: form.visibility,
        video_url: form.video_url,
        gallery: form.gallery,
        cast_members: form.cast_members,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "저장에 실패했습니다.");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  async function addShow() {
    setError("");
    if (!newStart) {
      setError("회차 일시를 입력해주세요.");
      return;
    }
    setAddingShow(true);
    const res = await fetch(`/api/performances/${perf.id}/shows`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        starts_at: newStart,
        capacity: newCap === "" ? null : Number(newCap),
        label: newLabel.trim() || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setAddingShow(false);
    if (!res.ok) {
      setError(data.error ?? "회차 추가에 실패했습니다.");
      return;
    }
    setShows((prev) => [
      ...prev,
      {
        id: data.show.id,
        starts_at_local: newStart,
        capacity: data.show.capacity,
        label: data.show.label,
      },
    ]);
    setNewStart("");
    setNewCap("");
    setNewLabel("");
    router.refresh();
  }

  async function removeShow(showId: string) {
    setError("");
    const res = await fetch(`/api/performances/${perf.id}/shows/${showId}`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "삭제에 실패했습니다.");
      return;
    }
    setShows((prev) => prev.filter((s) => s.id !== showId));
    router.refresh();
  }

  async function deletePerformance() {
    if (!confirm("이 공연을 삭제할까요? 되돌릴 수 없습니다.")) return;
    const res = await fetch(`/api/performances/${perf.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push(`/o/${handle}/manage/performances`);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "삭제에 실패했습니다.");
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* 발행 상태 */}
      <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className={labelCls}>공개 설정</p>
            <select
              value={form.visibility}
              onChange={(e) => set("visibility", e.target.value as Visibility)}
              className="bg-surface-container-low rounded-full px-4 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="private">초안 (비공개)</option>
              <option value="unlisted">링크공개 (목록 미노출)</option>
              <option value="public">공개 (캘린더 노출)</option>
            </select>
          </div>
          {form.visibility !== "private" && (
            <Link
              href={`/performances/${perf.id}`}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-on-surface-variant hover:text-primary transition"
            >
              공개 페이지 <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
        <p className="text-xs text-on-surface-variant mt-3">
          변경 후 아래 <b>저장</b>을 눌러야 반영됩니다.
        </p>
      </section>

      {/* 기본 정보 */}
      <section className="space-y-5">
        <h3 className="font-bold text-on-surface">공연 정보</h3>
        <div>
          <label className={labelCls}>제목 *</label>
          <input className={inputCls} value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={120} />
        </div>
        <div>
          <label className={labelCls}>소개</label>
          <textarea
            className={`${inputCls} resize-none`}
            rows={5}
            value={form.summary ?? ""}
            onChange={(e) => set("summary", e.target.value)}
            placeholder="공연 소개, 관람 안내 등"
            maxLength={2000}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>시작일 *</label>
            <input type="date" className={inputCls} value={form.start_date} onChange={(e) => set("start_date", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>종료일</label>
            <input type="date" className={inputCls} value={form.end_date ?? ""} onChange={(e) => set("end_date", e.target.value || null)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>장소</label>
            <input className={inputCls} value={form.venue ?? ""} onChange={(e) => set("venue", e.target.value || null)} maxLength={120} />
          </div>
          <div>
            <label className={labelCls}>도시</label>
            <input className={inputCls} value={form.city ?? ""} onChange={(e) => set("city", e.target.value || null)} maxLength={40} />
          </div>
        </div>
        <div>
          <label className={labelCls}>가격 안내</label>
          <input className={inputCls} value={form.price_info ?? ""} onChange={(e) => set("price_info", e.target.value || null)} placeholder="전석 무료 / 예매 15,000원" maxLength={200} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>포스터 이미지 URL</label>
            <input className={inputCls} value={form.poster_url ?? ""} onChange={(e) => set("poster_url", e.target.value || null)} placeholder="https://..." />
          </div>
          <div>
            <label className={labelCls}>썸네일 이미지 URL</label>
            <input className={inputCls} value={form.image_url ?? ""} onChange={(e) => set("image_url", e.target.value || null)} placeholder="https://..." />
          </div>
        </div>
        <div>
          <label className={labelCls}>예매 오픈 일시 (선택, KST)</label>
          <input type="datetime-local" className={inputCls} value={form.ticket_open_local} onChange={(e) => set("ticket_open_local", e.target.value)} />
        </div>
      </section>

      {/* 홍보 콘텐츠 (F7) */}
      <section className="space-y-5">
        <h3 className="font-bold text-on-surface">홍보 콘텐츠</h3>
        <div>
          <label className={labelCls}>대표 영상 (YouTube URL)</label>
          <input
            className={inputCls}
            value={form.video_url ?? ""}
            onChange={(e) => set("video_url", e.target.value || null)}
            placeholder="https://youtu.be/..."
          />
        </div>

        {/* 갤러리 */}
        <div>
          <label className={labelCls}>이미지 갤러리</label>
          <div className="space-y-2">
            {form.gallery.map((g, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className={inputCls}
                  value={g.url}
                  onChange={(e) =>
                    set(
                      "gallery",
                      form.gallery.map((x, j) => (j === i ? { ...x, url: e.target.value } : x))
                    )
                  }
                  placeholder="이미지 URL"
                />
                <input
                  className={`${inputCls} max-w-[40%]`}
                  value={g.caption}
                  onChange={(e) =>
                    set(
                      "gallery",
                      form.gallery.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x))
                    )
                  }
                  placeholder="캡션(선택)"
                />
                <button
                  type="button"
                  onClick={() => set("gallery", form.gallery.filter((_, j) => j !== i))}
                  className="shrink-0 text-error hover:bg-error-container/30 rounded-full p-2.5 transition"
                  aria-label="이미지 삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => set("gallery", [...form.gallery, { url: "", caption: "" }])}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-secondary bg-secondary/15 hover:bg-secondary/25 rounded-xl py-2 px-4 transition"
            >
              <Plus className="w-4 h-4" />이미지 추가
            </button>
          </div>
        </div>

        {/* 출연진 */}
        <div>
          <label className={labelCls}>출연진 프로필</label>
          <div className="space-y-3">
            {form.cast_members.map((c, i) => (
              <div key={i} className="bg-surface-container-low rounded-xl p-3 space-y-2">
                <div className="flex gap-2">
                  <input
                    className={inputCls}
                    value={c.name}
                    onChange={(e) =>
                      set("cast_members", form.cast_members.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))
                    }
                    placeholder="이름"
                  />
                  <input
                    className={inputCls}
                    value={c.role}
                    onChange={(e) =>
                      set("cast_members", form.cast_members.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)))
                    }
                    placeholder="역할"
                  />
                  <button
                    type="button"
                    onClick={() => set("cast_members", form.cast_members.filter((_, j) => j !== i))}
                    className="shrink-0 text-error hover:bg-error-container/30 rounded-full p-2.5 transition"
                    aria-label="출연진 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <input
                  className={inputCls}
                  value={c.photo_url}
                  onChange={(e) =>
                    set("cast_members", form.cast_members.map((x, j) => (j === i ? { ...x, photo_url: e.target.value } : x)))
                  }
                  placeholder="사진 URL(선택)"
                />
                <input
                  className={inputCls}
                  value={c.bio}
                  onChange={(e) =>
                    set("cast_members", form.cast_members.map((x, j) => (j === i ? { ...x, bio: e.target.value } : x)))
                  }
                  placeholder="한 줄 소개(선택)"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                set("cast_members", [...form.cast_members, { name: "", role: "", photo_url: "", bio: "" }])
              }
              className="inline-flex items-center gap-1.5 text-sm font-bold text-secondary bg-secondary/15 hover:bg-secondary/25 rounded-xl py-2 px-4 transition"
            >
              <Plus className="w-4 h-4" />출연진 추가
            </button>
          </div>
        </div>
      </section>

      {/* 회차·정원 */}
      <section className="space-y-4">
        <h3 className="font-bold text-on-surface">회차 · 정원</h3>
        <p className="text-xs text-on-surface-variant">
          회차를 추가하면 관객이 회차를 선택해 예약할 수 있어요. 정원을 비우면 무제한입니다.
        </p>
        {shows.length > 0 && (
          <ul className="space-y-2">
            {shows.map((s) => (
              <li key={s.id} className="flex items-center gap-3 bg-surface-container-lowest rounded-xl border border-outline-variant p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-on-surface">
                    {formatShowTime(s.starts_at_local)}
                    {s.label ? ` · ${s.label}` : ""}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    정원 {s.capacity ?? "무제한"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeShow(s.id)}
                  className="shrink-0 text-error hover:bg-error-container/30 rounded-full p-2 transition"
                  aria-label="회차 삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap items-end gap-2 bg-surface-container-lowest rounded-xl border border-outline-variant p-3">
          <div className="flex-1 min-w-[180px]">
            <label className={labelCls}>일시</label>
            <input type="datetime-local" className={inputCls} value={newStart} onChange={(e) => setNewStart(e.target.value)} />
          </div>
          <div className="w-24">
            <label className={labelCls}>정원</label>
            <input type="number" min={0} className={inputCls} value={newCap} onChange={(e) => setNewCap(e.target.value)} placeholder="∞" />
          </div>
          <div className="w-28">
            <label className={labelCls}>이름(선택)</label>
            <input className={inputCls} value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="1회차" maxLength={40} />
          </div>
          <button
            type="button"
            onClick={addShow}
            disabled={addingShow}
            className="inline-flex items-center gap-1.5 bg-secondary/15 text-secondary font-bold text-sm py-3 px-4 rounded-xl hover:bg-secondary/25 disabled:opacity-50 transition"
          >
            {addingShow ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            추가
          </button>
        </div>
      </section>

      {error && (
        <div className="text-sm text-error bg-error-container/30 rounded-xl p-3">{error}</div>
      )}

      {/* 액션 */}
      <div className="flex items-center justify-between gap-4 pt-4 border-t border-outline-variant">
        <button
          type="button"
          onClick={deletePerformance}
          className="text-sm font-bold text-error hover:bg-error-container/30 rounded-full px-4 py-2 transition"
        >
          공연 삭제
        </button>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-secondary font-semibold">저장됨</span>}
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-primary text-on-primary font-bold py-2.5 px-6 rounded-full hover:bg-primary-container disabled:opacity-50 transition"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
