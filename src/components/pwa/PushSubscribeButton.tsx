"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import {
  getCurrentSubscription,
  getPushSupportState,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push/client";

interface Props {
  email?: string;
  className?: string;
}

type State = "unknown" | "unsupported" | "off" | "on" | "denied";

export function PushSubscribeButton({ email, className = "" }: Props) {
  const [state, setState] = useState<State>("unknown");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const support = getPushSupportState();
      if (support === "unsupported") {
        if (!cancelled) setState("unsupported");
        return;
      }
      if (support === "denied") {
        if (!cancelled) setState("denied");
        return;
      }
      try {
        const sub = await getCurrentSubscription();
        if (!cancelled) setState(sub ? "on" : "off");
      } catch {
        if (!cancelled) setState("off");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggle() {
    if (loading) return;
    setLoading(true);
    setMessage(null);

    if (state === "on") {
      await unsubscribeFromPush();
      setState("off");
      setMessage("이 기기의 푸시 알림을 해제했습니다.");
    } else {
      const res = await subscribeToPush({ email });
      if (res.ok) {
        setState("on");
        setMessage("이 기기로 푸시 알림이 옵니다.");
      } else {
        setMessage(res.error || "알림 등록에 실패했습니다.");
        if (res.error?.includes("차단")) setState("denied");
      }
    }
    setLoading(false);
  }

  if (state === "unknown") {
    return (
      <div className={`text-xs text-on-surface-variant ${className}`}>
        알림 상태 확인 중…
      </div>
    );
  }

  if (state === "unsupported") {
    return (
      <div className={`text-xs text-on-surface-variant ${className}`}>
        이 브라우저는 푸시 알림을 지원하지 않습니다.
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div className={`text-xs text-on-surface-variant ${className}`}>
        브라우저에서 알림이 차단되어 있어요. 주소창 왼쪽 자물쇠 아이콘 → 알림 →
        허용으로 바꿔주세요.
      </div>
    );
  }

  const isOn = state === "on";
  const Icon = isOn ? BellRing : Bell;

  return (
    <div className={className}>
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        className={`w-full py-3.5 rounded-xl font-black text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
          isOn
            ? "bg-surface-container-low text-on-surface hover:bg-surface-container"
            : "bg-gradient-to-br from-primary to-primary-container text-on-primary hover:brightness-110"
        }`}
      >
        {isOn ? <BellOff className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
        {loading
          ? "처리 중…"
          : isOn
            ? "이 기기 푸시 알림 끄기"
            : "이 기기로 푸시 알림 받기"}
      </button>
      {message && (
        <p className="text-xs text-on-surface-variant mt-2 text-center">
          {message}
        </p>
      )}
    </div>
  );
}
