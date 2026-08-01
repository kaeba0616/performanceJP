"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function JoinAccept({ code }: { code: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function accept() {
    setError("");
    setBusy(true);
    const res = await fetch("/api/orgs/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "가입에 실패했습니다.");
      return;
    }
    if (data.handle) {
      router.push(`/o/${data.handle}`);
      router.refresh();
    } else {
      router.push("/");
    }
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={accept}
        disabled={busy}
        className="w-full bg-primary text-on-primary font-bold py-3 px-5 rounded-full hover:bg-primary-container disabled:opacity-50 transition inline-flex items-center justify-center gap-2"
      >
        {busy && <Loader2 className="w-4 h-4 animate-spin" />}
        초대 수락하기
      </button>
      {error && (
        <div className="text-sm text-error bg-error-container/30 rounded-xl p-3">
          {error}
        </div>
      )}
    </div>
  );
}
