"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

interface Props {
  next?: string;
}

function getRedirectUrl(next?: string) {
  if (typeof window === "undefined") return "";
  const url = new URL("/auth/callback", window.location.origin);
  if (next) url.searchParams.set("next", next);
  return url.toString();
}

export function LoginForm({ next }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleOAuth(provider: "google" | "kakao") {
    setError("");
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: getRedirectUrl(next),
      },
    });
    if (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => handleOAuth("kakao")}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-[#FEE500] text-[#191919] font-bold py-3 px-5 rounded-full hover:brightness-95 disabled:opacity-50 transition"
        >
          <span className="text-lg">💬</span>
          <span>카카오로 시작하기</span>
        </button>
        <button
          type="button"
          onClick={() => handleOAuth("google")}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white text-[#3c4043] font-semibold py-3 px-5 rounded-full border border-outline hover:bg-surface-container-low disabled:opacity-50 transition"
        >
          <GoogleIcon />
          <span>Google로 시작하기</span>
        </button>
      </div>

      {error && (
        <div className="text-sm text-error bg-error-container/30 rounded-xl p-3">
          {error}
        </div>
      )}

      <p className="text-xs text-on-surface-variant text-center pt-2">
        로그인하면 THE PULSE의{" "}
        <a href="/terms" className="underline hover:text-primary">이용약관</a>과{" "}
        <a href="/privacy" className="underline hover:text-primary">개인정보 처리방침</a>에 동의하는 것으로 간주됩니다.
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.836.86-3.048.86-2.344 0-4.328-1.583-5.036-3.71H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.708A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.708V4.96H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.04l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.96l3.007 2.332C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
