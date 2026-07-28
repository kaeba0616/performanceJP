"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, Ticket } from "lucide-react";
import { formatShowTime } from "@/lib/utils/date";

interface Show {
  id: string;
  starts_at: string;
  capacity: number | null;
  label: string | null;
  remaining: number | null;
}

const inputCls =
  "w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary/30";
const labelCls =
  "block text-xs font-semibold tracking-tight text-on-surface-variant mb-1.5";

export function ReservationSection({ performanceId }: { performanceId: string }) {
  const [shows, setShows] = useState<Show[] | null>(null);
  const [showId, setShowId] = useState<string>("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [partySize, setPartySize] = useState(1);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/performances/${performanceId}/availability`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const list: Show[] = d.shows ?? [];
        setShows(list);
        if (list.length > 0) setShowId(list[0].id);
      })
      .catch(() => {
        if (!cancelled) setShows([]);
      });
    return () => {
      cancelled = true;
    };
  }, [performanceId]);

  const selectedShow = shows?.find((s) => s.id === showId) ?? null;
  const soldOut =
    selectedShow && selectedShow.remaining != null && selectedShow.remaining <= 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("이름을 입력해주세요.");
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/performances/${performanceId}/reservations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        party_size: partySize,
        note: note.trim() || undefined,
        show_id: showId || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "예약에 실패했습니다.");
      return;
    }
    setDone(true);
  }

  if (shows === null) {
    return (
      <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-on-surface-variant" />
      </section>
    );
  }

  if (done) {
    return (
      <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-8 text-center">
        <CheckCircle2 className="w-10 h-10 text-secondary mx-auto mb-3" />
        <p className="font-bold text-on-surface mb-1">예약이 접수되었어요</p>
        <p className="text-sm text-on-surface-variant">
          입력하신 이메일로 확인 메일을 보냈어요. (입력한 경우)
        </p>
      </section>
    );
  }

  return (
    <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6">
      <h2 className="flex items-center gap-2 font-bold text-on-surface mb-5">
        <Ticket className="w-5 h-5 text-primary" />
        예약하기
      </h2>
      <form onSubmit={submit} className="space-y-4">
        {shows.length > 0 && (
          <div>
            <label className={labelCls}>회차 선택</label>
            <select
              className={inputCls}
              value={showId}
              onChange={(e) => setShowId(e.target.value)}
            >
              {shows.map((s) => (
                <option key={s.id} value={s.id}>
                  {formatShowTime(s.starts_at)}
                  {s.label ? ` · ${s.label}` : ""}
                  {s.remaining != null ? ` (잔여 ${s.remaining})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>이름 *</label>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required />
          </div>
          <div>
            <label className={labelCls}>인원 *</label>
            <input type="number" min={1} max={20} className={inputCls} value={partySize} onChange={(e) => setPartySize(Number(e.target.value))} required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>연락처 (선택)</label>
            <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-..." maxLength={30} />
          </div>
          <div>
            <label className={labelCls}>이메일 (선택)</label>
            <input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="확인 메일 수신" maxLength={120} />
          </div>
        </div>
        <div>
          <label className={labelCls}>요청사항 (선택)</label>
          <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
        </div>

        {error && (
          <div className="text-sm text-error bg-error-container/30 rounded-xl p-3">{error}</div>
        )}

        <button
          type="submit"
          disabled={busy || !!soldOut}
          className="w-full inline-flex items-center justify-center gap-2 bg-primary text-on-primary font-bold py-3 px-5 rounded-full hover:bg-primary-container disabled:opacity-50 transition"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          {soldOut ? "잔여석 마감" : "예약하기"}
        </button>
        <p className="text-xs text-on-surface-variant text-center">
          로그인 없이 예약할 수 있어요. 확인 메일의 링크로 취소 가능합니다.
        </p>
      </form>
    </section>
  );
}
