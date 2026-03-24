"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function SubscribePage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "all" }),
      });

      if (res.ok) {
        setSubmitted(true);
      }
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-2">인증 이메일을 확인해주세요</h1>
        <p className="text-muted-foreground">
          <strong>{email}</strong>로 인증 이메일을 보냈습니다.
          <br />
          이메일의 인증 링크를 클릭하면 알림 구독이 완료됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">알림 설정</h1>
      <p className="text-muted-foreground mb-6">
        새로운 내한 공연이 등록되거나 티켓이 오픈되면 이메일로 알려드립니다.
      </p>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1"
              >
                이메일 주소
              </label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">알림 받을 내용</p>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked disabled className="rounded" />
                새 공연 등록 알림
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked disabled className="rounded" />
                티켓 오픈 1시간 전 알림
              </label>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "처리 중..." : "알림 구독하기"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
