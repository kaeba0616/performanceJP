"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  next: string;
}

export function AdminLoginForm({ next }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) {
      setError("비밀번호를 입력하세요.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });
      if (!res.ok) {
        if (res.status === 401) setError("비밀번호가 올바르지 않습니다.");
        else setError("로그인 실패. 잠시 후 다시 시도하세요.");
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setError("네트워크 오류");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[#424754] mb-1">
          비밀번호
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-[#d1d5db] rounded-lg px-3 py-2 text-sm text-[#131b2e] focus:outline-none focus:ring-2 focus:ring-[#0058be]/30 focus:border-[#0058be]"
          placeholder="관리자 비밀번호"
          autoFocus
        />
      </div>
      {error && <p className="text-sm text-[#da3437]">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-[#0058be] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#004a9e] transition-colors disabled:opacity-60"
      >
        {submitting ? "로그인 중..." : "로그인"}
      </button>
    </form>
  );
}
