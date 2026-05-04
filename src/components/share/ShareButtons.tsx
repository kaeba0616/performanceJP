"use client";

import { useState } from "react";
import { Check, Copy, Link as LinkIcon } from "lucide-react";

interface Props {
  url: string;
  text: string;
}

function getAbsoluteUrl(path: string) {
  if (typeof window === "undefined") return path;
  return new URL(path, window.location.origin).toString();
}

export function ShareButtons({ url, text }: Props) {
  const [copied, setCopied] = useState(false);

  function handleX() {
    const abs = getAbsoluteUrl(url);
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(abs)}`;
    window.open(intent, "_blank", "noopener,noreferrer");
  }

  async function handleCopy() {
    const abs = getAbsoluteUrl(url);
    try {
      await navigator.clipboard.writeText(abs);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  function handleKakao() {
    // 카카오톡 공유 SDK 미연결 상태 — 메시지 텍스트를 클립보드 복사 + 안내
    handleCopy();
  }

  return (
    <div className="inline-flex flex-wrap items-center gap-2">
      <button
        onClick={handleX}
        className="inline-flex items-center gap-2 bg-black text-white font-bold px-4 py-2 rounded-full text-sm hover:opacity-90 transition"
        aria-label="X에 공유"
      >
        <XIcon />X에 공유
      </button>
      <button
        onClick={handleKakao}
        className="inline-flex items-center gap-2 bg-[#FEE500] text-[#191919] font-bold px-4 py-2 rounded-full text-sm hover:brightness-95 transition"
        aria-label="카카오톡 공유"
      >
        <span>💬</span>
        카카오 공유
      </button>
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-2 bg-surface-container border border-outline-variant text-on-surface font-bold px-4 py-2 rounded-full text-sm hover:bg-surface-container-high transition"
        aria-label="URL 복사"
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <LinkIcon className="w-3.5 h-3.5" />}
        {copied ? "복사됨" : "URL 복사"}
      </button>
    </div>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
