"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { validateHandle, handleErrorMessage } from "@/lib/profiles/handle";

interface Props {
  initialHandle: string;
  next?: string;
}

type Status =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "ok" }
  | { kind: "taken" }
  | { kind: "invalid"; message: string };

type ServerResult =
  | { kind: "ok" }
  | { kind: "taken" }
  | { kind: "invalid"; message: string };

export function OnboardingForm({ initialHandle, next }: Props) {
  const router = useRouter();
  const [handle, setHandle] = useState(initialHandle);
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // 서버 검증 결과는 어떤 핸들에 대한 것인지 함께 보관.
  // 이래야 "현재 입력된 핸들에 대한 결과인지" 동기적으로 판단 가능.
  const [serverState, setServerState] = useState<{
    handle: string;
    result: ServerResult;
  } | null>(null);

  // 동기적으로 도출되는 검증 상태
  const trimmedHandle = handle.trim().toLowerCase();
  const localValidation = trimmedHandle ? validateHandle(trimmedHandle) : null;

  const status: Status = !trimmedHandle
    ? { kind: "idle" }
    : localValidation
      ? { kind: "invalid", message: handleErrorMessage(localValidation) }
      : serverState && serverState.handle === trimmedHandle
        ? serverState.result
        : { kind: "checking" };

  // async fetch만 effect에 — sync setState는 effect 안에 없음
  useEffect(() => {
    if (!trimmedHandle || localValidation) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/handle/check?h=${encodeURIComponent(trimmedHandle)}`
        );
        const data = await res.json();
        if (cancelled) return;
        const result: ServerResult = data.available
          ? { kind: "ok" }
          : data.reason
            ? { kind: "invalid", message: data.reason }
            : { kind: "taken" };
        setServerState({ handle: trimmedHandle, result });
      } catch {
        if (!cancelled) {
          setServerState({
            handle: trimmedHandle,
            result: { kind: "invalid", message: "확인 실패" },
          });
        }
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [trimmedHandle, localValidation]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (status.kind !== "ok") {
      setError("사용 가능한 사용자명을 입력해주세요");
      return;
    }
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSubmitting(false);
      router.push("/login");
      return;
    }

    const { error: err } = await supabase
      .from("profiles")
      .update({
        handle: handle.trim().toLowerCase(),
        display_name: displayName.trim() || null,
      })
      .eq("id", user.id);

    setSubmitting(false);
    if (err) {
      setError(err.message);
      return;
    }

    router.push(next || "/me");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 space-y-5"
    >
      <label className="block">
        <span className="block text-xs font-semibold tracking-tight text-on-surface-variant mb-1.5">
          사용자명 (handle)
        </span>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
            @
          </span>
          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value.toLowerCase())}
            placeholder="minseo_kr"
            autoComplete="off"
            spellCheck={false}
            maxLength={20}
            required
            className="w-full bg-surface-container-low rounded-full pl-9 pr-11 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {status.kind === "checking" && (
              <Loader2 className="w-4 h-4 text-on-surface-variant animate-spin" />
            )}
            {status.kind === "ok" && <CheckCircle2 className="w-4 h-4 text-secondary" />}
            {(status.kind === "taken" || status.kind === "invalid") && (
              <XCircle className="w-4 h-4 text-error" />
            )}
          </div>
        </div>
        <p className="mt-1.5 text-xs text-on-surface-variant min-h-[1rem]">
          {status.kind === "ok" && (
            <span className="text-secondary font-semibold">사용 가능해요</span>
          )}
          {status.kind === "taken" && (
            <span className="text-error">이미 사용 중인 이름이에요</span>
          )}
          {status.kind === "invalid" && (
            <span className="text-error">{status.message}</span>
          )}
          {status.kind === "idle" && "영문 소문자, 숫자, _ 조합 (3~20자)"}
        </p>
      </label>

      <label className="block">
        <span className="block text-xs font-semibold tracking-tight text-on-surface-variant mb-1.5">
          표시 이름 (선택)
        </span>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="민서"
          maxLength={40}
          className="w-full bg-surface-container-low rounded-full px-5 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <p className="mt-1.5 text-xs text-on-surface-variant">
          한글 닉네임 가능. 프로필에 노출되며 언제든 바꿀 수 있어요.
        </p>
      </label>

      <button
        type="submit"
        disabled={submitting || status.kind !== "ok"}
        className="w-full bg-primary text-on-primary font-bold py-3 px-5 rounded-full hover:bg-primary-container disabled:opacity-50 transition"
      >
        {submitting ? "저장 중..." : "시작하기"}
      </button>

      {error && (
        <div className="text-sm text-error bg-error-container/30 rounded-xl p-3">
          {error}
        </div>
      )}
    </form>
  );
}
