"use client";

import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";

export function CancelReservation({ token }: { token: string }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function cancel() {
    setError("");
    setBusy(true);
    const res = await fetch("/api/reservations/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "취소에 실패했습니다.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-8">
        <CheckCircle2 className="w-10 h-10 text-secondary mx-auto mb-3" />
        <p className="font-bold text-on-surface">예약이 취소되었습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={cancel}
        disabled={busy}
        className="w-full inline-flex items-center justify-center gap-2 bg-error/10 text-error font-bold py-3 px-5 rounded-full hover:bg-error/20 disabled:opacity-50 transition"
      >
        {busy && <Loader2 className="w-4 h-4 animate-spin" />}
        예약 취소하기
      </button>
      {error && (
        <div className="text-sm text-error bg-error-container/30 rounded-xl p-3">{error}</div>
      )}
    </div>
  );
}
