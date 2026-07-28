"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { validateOrgHandle, orgHandleErrorMessage } from "@/lib/orgs/handle";

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

export function NewOrgForm() {
  const router = useRouter();
  const [handle, setHandle] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [serverState, setServerState] = useState<{
    handle: string;
    result: ServerResult;
  } | null>(null);

  const trimmedHandle = handle.trim().toLowerCase();
  const localValidation = trimmedHandle ? validateOrgHandle(trimmedHandle) : null;

  const status: Status = !trimmedHandle
    ? { kind: "idle" }
    : localValidation
      ? { kind: "invalid", message: orgHandleErrorMessage(localValidation) }
      : serverState && serverState.handle === trimmedHandle
        ? serverState.result
        : { kind: "checking" };

  useEffect(() => {
    if (!trimmedHandle || localValidation) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/orgs/handle-check?h=${encodeURIComponent(trimmedHandle)}`
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
      setError("사용 가능한 단체 주소를 입력해주세요");
      return;
    }
    if (!name.trim()) {
      setError("단체 이름을 입력해주세요");
      return;
    }
    setSubmitting(true);

    const res = await fetch("/api/orgs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        handle: trimmedHandle,
        name: name.trim(),
        description: description.trim() || undefined,
        contact: contact.trim() || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "단체 생성에 실패했습니다.");
      return;
    }

    router.push(`/o/${data.handle}/manage`);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 space-y-5"
    >
      <label className="block">
        <span className="block text-xs font-semibold tracking-tight text-on-surface-variant mb-1.5">
          단체 주소 (handle)
        </span>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-sm">
            /o/
          </span>
          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value.toLowerCase())}
            placeholder="snu_musical"
            autoComplete="off"
            spellCheck={false}
            maxLength={20}
            required
            className="w-full bg-surface-container-low rounded-full pl-11 pr-11 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary/30"
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
            <span className="text-error">이미 사용 중인 주소예요</span>
          )}
          {status.kind === "invalid" && (
            <span className="text-error">{status.message}</span>
          )}
          {status.kind === "idle" && "영문 소문자, 숫자, _ 조합 (3~20자)"}
        </p>
      </label>

      <label className="block">
        <span className="block text-xs font-semibold tracking-tight text-on-surface-variant mb-1.5">
          단체 이름
        </span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="서울대 뮤지컬 동아리"
          maxLength={60}
          required
          className="w-full bg-surface-container-low rounded-full px-5 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </label>

      <label className="block">
        <span className="block text-xs font-semibold tracking-tight text-on-surface-variant mb-1.5">
          소개 (선택)
        </span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="단체 소개, 활동 내용 등"
          maxLength={500}
          rows={3}
          className="w-full bg-surface-container-low rounded-2xl px-5 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />
      </label>

      <label className="block">
        <span className="block text-xs font-semibold tracking-tight text-on-surface-variant mb-1.5">
          공개 문의처 (선택)
        </span>
        <input
          type="text"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="인스타그램 @, 이메일 등"
          maxLength={120}
          className="w-full bg-surface-container-low rounded-full px-5 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </label>

      <button
        type="submit"
        disabled={submitting || status.kind !== "ok" || !name.trim()}
        className="w-full bg-primary text-on-primary font-bold py-3 px-5 rounded-full hover:bg-primary-container disabled:opacity-50 transition"
      >
        {submitting ? "만드는 중..." : "단체 만들기"}
      </button>

      {error && (
        <div className="text-sm text-error bg-error-container/30 rounded-xl p-3">
          {error}
        </div>
      )}
    </form>
  );
}
