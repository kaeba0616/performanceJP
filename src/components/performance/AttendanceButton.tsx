"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Stamp } from "lucide-react";
import { toggleAttendance, type ToggleResult } from "@/app/performances/[id]/actions";

interface Props {
  performanceId: string;
  initialAttended: boolean;
  isLoggedIn: boolean;
  pathname: string;
}

export function AttendanceButton({
  performanceId,
  initialAttended,
  isLoggedIn,
  pathname,
}: Props) {
  const router = useRouter();
  const [attended, setAttended] = useState(initialAttended);
  const [pending, startTransition] = useTransition();
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [error, setError] = useState("");
  const [justStamped, setJustStamped] = useState(false);

  function loginRedirect() {
    const next = encodeURIComponent(pathname);
    router.push(`/login?next=${next}`);
  }

  function execute(targetAttended: boolean) {
    setError("");
    startTransition(async () => {
      const res: ToggleResult = await toggleAttendance(performanceId);
      if ("error" in res) {
        setAttended(!targetAttended);
        setError(errorMessage(res));
        return;
      }
      if (res.attended) {
        setJustStamped(true);
        setTimeout(() => setJustStamped(false), 1500);
      }
      router.refresh();
    });
  }

  function handleAdd() {
    if (!isLoggedIn) {
      loginRedirect();
      return;
    }
    setAttended(true);
    execute(true);
  }

  function handleRemove() {
    setConfirmingRemove(false);
    setAttended(false);
    execute(false);
  }

  return (
    <div className="bg-surface-container-lowest rounded-3xl p-6">
      <p className="text-xs font-black text-on-surface-variant uppercase tracking-widest mb-4">
        Attendance
      </p>

      {!attended ? (
        <button
          onClick={handleAdd}
          disabled={pending}
          className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary font-black py-3.5 px-5 rounded-full hover:bg-primary-container disabled:opacity-50 transition tracking-tight"
        >
          <Stamp className="w-4 h-4" />
          {pending ? "처리 중..." : "다녀왔어요"}
        </button>
      ) : confirmingRemove ? (
        <div className="space-y-2.5">
          <p className="text-sm text-on-surface text-center">
            스탬프를 취소할까요?
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setConfirmingRemove(false)}
              className="bg-surface-container text-on-surface font-bold py-2.5 px-4 rounded-full text-sm hover:bg-surface-container-high transition"
            >
              유지
            </button>
            <button
              onClick={handleRemove}
              className="bg-error text-on-error font-bold py-2.5 px-4 rounded-full text-sm hover:opacity-90 transition"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setConfirmingRemove(true)}
          disabled={pending}
          className={`w-full flex items-center justify-center gap-2 bg-primary-fixed text-on-primary-fixed font-black py-3.5 px-5 rounded-full hover:bg-primary-fixed-dim transition tracking-tight ${
            justStamped ? "ring-2 ring-primary animate-pulse" : ""
          }`}
        >
          <Check className="w-4 h-4" />
          다녀왔어요
        </button>
      )}

      {error && (
        <p className="mt-2.5 text-xs text-error text-center">{error}</p>
      )}

      {!isLoggedIn && (
        <p className="mt-3 text-xs text-on-surface-variant text-center">
          로그인하고 스탬프를 모아보세요
        </p>
      )}
    </div>
  );
}

function errorMessage(res: { error: string; message?: string }): string {
  switch (res.error) {
    case "unauthorized":
      return "로그인이 필요해요";
    case "not_found":
      return "공연을 찾을 수 없어요";
    case "too_early":
      return "공연 당일부터 찍을 수 있어요";
    default:
      return res.message || "오류가 발생했어요";
  }
}
