"use client";

import { useState } from "react";
import { Send, Check, ChevronDown, ChevronUp } from "lucide-react";
import { SongEditor } from "@/components/admin/SongEditor";
import type { Song } from "@/types";

type CommonProps = {
  /** 펼친 상태로 시작 */
  defaultOpen?: boolean;
  /** 헤더 토글을 숨기고 폼만 노출 (외부 트리거로 제어할 때) */
  hideToggle?: boolean;
};

type Props = CommonProps &
  (
    | { kind: "setlist"; performanceId: string; targetLabel: string }
    | { kind: "hit_songs"; artistId: string; targetLabel: string }
  );

export function SongSubmitForm(props: Props) {
  const { defaultOpen = false, hideToggle = false } = props;
  const [open, setOpen] = useState(defaultOpen);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [songs, setSongs] = useState<Song[]>([]);
  const [website, setWebsite] = useState(""); // honeypot

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const cleanedSongs = songs
      .map((s) => ({
        title: s.title.trim(),
        youtube_url: s.youtube_url?.trim() || null,
      }))
      .filter((s) => s.title.length > 0);
    if (cleanedSongs.length === 0) {
      setError("곡을 하나 이상 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const body =
        props.kind === "setlist"
          ? {
              kind: "setlist" as const,
              performance_id: props.performanceId,
              submitter_email: email,
              submitter_name: name || null,
              submitter_note: note || null,
              songs: cleanedSongs,
              website,
            }
          : {
              kind: "hit_songs" as const,
              artist_id: props.artistId,
              submitter_email: email,
              submitter_name: name || null,
              submitter_note: note || null,
              songs: cleanedSongs,
              website,
            };
      const res = await fetch("/api/song-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSubmitted(true);
      } else {
        setError(data?.error || "제보에 실패했습니다.");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  const title =
    props.kind === "setlist" ? "셋리스트 제보" : "대표곡 제안";
  const hint =
    props.kind === "setlist"
      ? `이 공연(${props.targetLabel})에서 들으신 곡을 알려주세요. 관리자 검토 후 셋리스트에 반영됩니다.`
      : `${props.targetLabel}의 대표곡을 제안해주세요. 관리자 검토 후 대표곡 목록에 반영됩니다.`;

  if (submitted) {
    return (
      <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
            <Check className="w-5 h-5" strokeWidth={3} />
          </div>
          <h3 className="editorial-title text-xl font-black text-on-surface">
            제보 접수 완료
          </h3>
        </div>
        <p className="text-sm text-on-surface-variant">
          관리자 검토 후 반영됩니다. 감사합니다.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest rounded-3xl overflow-hidden">
      {!hideToggle && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-3 px-6 py-5 hover:bg-surface-container-low transition-colors"
        >
          <div className="text-left">
            <div className="editorial-title text-xl font-black text-on-surface">
              🎵 {title}
            </div>
            <div className="text-xs text-on-surface-variant mt-1">{hint}</div>
          </div>
          {open ? (
            <ChevronUp className="w-5 h-5 text-on-surface-variant flex-shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 text-on-surface-variant flex-shrink-0" />
          )}
        </button>
      )}

      {open && (
        <form onSubmit={handleSubmit} className={`px-6 pb-6 space-y-4 ${hideToggle ? "pt-5" : "border-t border-outline-variant pt-5"}`}>
          <input
            type="text"
            name="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="sr-only"
            style={{ position: "absolute", left: "-9999px" }}
          />

          <div>
            <label className={fieldLabelClass}>
              이메일 <span className="text-primary">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className={inputBase}
            />
            <p className="text-xs text-on-surface-variant/70 mt-1">
              결과 안내용으로만 사용됩니다.
            </p>
          </div>

          <div>
            <label className={fieldLabelClass}>이름 (선택)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="표시하지 않습니다"
              className={inputBase}
            />
          </div>

          <div>
            <label className={fieldLabelClass}>
              곡 목록 <span className="text-primary">*</span>
            </label>
            <div className="bg-surface-container-low rounded-2xl p-4">
              <SongEditor value={songs} onChange={setSongs} />
            </div>
          </div>

          <div>
            <label className={fieldLabelClass}>비고 (선택)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="앙코르 곡 정보, 출처(트위터 후기 등) 등 자유롭게."
              rows={3}
              className={`${inputBase} min-h-[80px] resize-y`}
            />
          </div>

          {error && <p className="text-sm text-destructive font-medium">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl text-on-primary font-black text-sm bg-gradient-to-br from-primary to-primary-container hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {submitting ? "제출 중..." : "제보 보내기"}
          </button>
        </form>
      )}
    </div>
  );
}

const fieldLabelClass =
  "block text-xs font-black text-on-surface-variant uppercase tracking-widest mb-2";

const inputBase =
  "w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all";
