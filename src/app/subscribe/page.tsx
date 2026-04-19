"use client";

import { useState } from "react";
import { BellRing, Check, Mail, Ticket, Sparkles } from "lucide-react";

export default function SubscribePage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "all" }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        setError("구독 요청에 실패했습니다. 잠시 후 다시 시도해주세요.");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-6 pt-16 pb-24">
        <div className="bg-surface-container-lowest rounded-3xl p-10 md:p-14 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8" strokeWidth={3} />
          </div>
          <h1 className="editorial-title text-3xl md:text-4xl font-black text-on-surface mb-3">
            인증 메일 발송 완료
          </h1>
          <p className="text-on-surface-variant font-medium">
            <strong className="text-on-surface">{email}</strong>로 인증 링크를
            보냈습니다.
            <br />
            메일의 인증 링크를 클릭하면 구독이 시작됩니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 pt-12 pb-24">
      <div className="mb-10">
        <p className="text-xs font-black text-primary uppercase tracking-widest mb-3">
          Stay in the loop
        </p>
        <h1 className="editorial-title text-4xl md:text-5xl font-black text-on-surface mb-3">
          🔔 알림 설정
        </h1>
        <p className="text-base md:text-lg text-on-surface-variant font-medium">
          새로운 내한 공연과 티켓 오픈 소식을 이메일로 받아보세요.
        </p>
      </div>

      <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-black text-on-surface-variant uppercase tracking-widest mb-2"
            >
              이메일 주소
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-surface-container-low rounded-xl pl-11 pr-4 py-3.5 text-base text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-black text-on-surface-variant uppercase tracking-widest">
              알림 받을 내용
            </p>
            <div className="space-y-2">
              <SubscribeOption
                icon={<Sparkles className="w-4 h-4" />}
                title="새 공연 등록"
                description="새로운 내한 공연이 등록될 때마다"
              />
              <SubscribeOption
                icon={<Ticket className="w-4 h-4" />}
                title="티켓 오픈 임박"
                description="관심 공연의 티켓 오픈 1시간 전"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl text-on-primary font-black text-sm bg-gradient-to-br from-primary to-primary-container hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <BellRing className="w-4 h-4" />
            {loading ? "처리 중..." : "알림 구독하기"}
          </button>
        </form>
      </div>
    </div>
  );
}

function SubscribeOption({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 bg-primary-fixed/50 rounded-2xl p-4">
      <div className="w-8 h-8 rounded-lg bg-on-primary text-primary flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm font-black text-on-surface">{title}</p>
        <p className="text-xs text-on-surface-variant">{description}</p>
      </div>
    </div>
  );
}
