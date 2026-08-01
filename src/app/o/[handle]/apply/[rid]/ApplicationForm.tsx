"use client";

import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";

const inputCls =
  "w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary/30";
const labelCls =
  "block text-xs font-semibold tracking-tight text-on-surface-variant mb-1.5";

export function ApplicationForm({ recruitmentId }: { recruitmentId: string }) {
  const [name, setName] = useState("");
  const [part, setPart] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [intro, setIntro] = useState("");
  const [attachment, setAttachment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("이름을 입력해주세요.");
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/recruitments/${recruitmentId}/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        part: part.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        intro: intro.trim() || undefined,
        attachment_url: attachment.trim() || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "제출에 실패했습니다.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-8 text-center">
        <CheckCircle2 className="w-10 h-10 text-secondary mx-auto mb-3" />
        <p className="font-bold text-on-surface mb-1">지원이 접수되었어요</p>
        <p className="text-sm text-on-surface-variant">결과는 입력하신 연락처로 안내됩니다.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>이름 *</label>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required />
        </div>
        <div>
          <label className={labelCls}>지원 파트</label>
          <input className={inputCls} value={part} onChange={(e) => setPart(e.target.value)} placeholder="보컬" maxLength={60} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>연락처</label>
          <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-..." maxLength={30} />
        </div>
        <div>
          <label className={labelCls}>이메일 (결과 통보)</label>
          <input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} />
        </div>
      </div>
      <div>
        <label className={labelCls}>자기소개</label>
        <textarea className={`${inputCls} resize-none`} rows={5} value={intro} onChange={(e) => setIntro(e.target.value)} maxLength={2000} />
      </div>
      <div>
        <label className={labelCls}>포트폴리오·영상 링크 (선택)</label>
        <input className={inputCls} value={attachment} onChange={(e) => setAttachment(e.target.value)} placeholder="https://..." maxLength={500} />
      </div>

      {error && <div className="text-sm text-error bg-error-container/30 rounded-xl p-3">{error}</div>}

      <button type="submit" disabled={busy} className="w-full inline-flex items-center justify-center gap-2 bg-primary text-on-primary font-bold py-3 px-5 rounded-full hover:bg-primary-container disabled:opacity-50 transition">
        {busy && <Loader2 className="w-4 h-4 animate-spin" />}지원서 제출
      </button>
    </form>
  );
}
