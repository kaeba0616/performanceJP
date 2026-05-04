"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";

interface Initial {
  display_name: string;
  bio: string;
  avatar_url: string;
  is_public: boolean;
}

interface Props {
  initial: Initial;
  action: (formData: FormData) => Promise<{ ok?: boolean; error?: string }>;
}

export function SettingsForm({ initial, action }: Props) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(formData: FormData) {
    setSaved(false);
    setError("");
    startTransition(async () => {
      const res = await action(formData);
      if (res.error) setError(res.error);
      else setSaved(true);
    });
  }

  return (
    <form
      action={handleSubmit}
      className="space-y-6 bg-surface-container-lowest rounded-2xl border border-outline-variant p-6"
    >
      <Field label="표시 이름">
        <input
          type="text"
          name="display_name"
          defaultValue={initial.display_name}
          maxLength={40}
          placeholder="민서"
          className="w-full bg-surface-container-low rounded-full px-5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </Field>

      <Field label="아바타 URL">
        <input
          type="url"
          name="avatar_url"
          defaultValue={initial.avatar_url}
          placeholder="https://..."
          className="w-full bg-surface-container-low rounded-full px-5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </Field>

      <Field label="자기소개">
        <textarea
          name="bio"
          defaultValue={initial.bio}
          maxLength={140}
          rows={3}
          placeholder="이 아티스트에 진심인 이유를 한 줄로..."
          className="w-full bg-surface-container-low rounded-2xl px-5 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />
      </Field>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          name="is_public"
          defaultChecked={initial.is_public}
          className="mt-0.5 w-4 h-4 accent-primary"
        />
        <span>
          <span className="block text-sm font-semibold text-on-surface">
            공개 프로필
          </span>
          <span className="block text-xs text-on-surface-variant mt-0.5">
            끄면 /u/사용자명 페이지가 비공개되고 다른 사람이 내 스탬프를 볼 수 없어요.
          </span>
        </span>
      </label>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-primary text-on-primary font-bold py-2.5 px-6 rounded-full hover:bg-primary-container disabled:opacity-50 transition"
        >
          {pending ? "저장 중..." : "저장"}
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-sm text-secondary font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            저장됨
          </span>
        )}
      </div>

      {error && (
        <div className="text-sm text-error bg-error-container/30 rounded-xl p-3">
          {error}
        </div>
      )}
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold tracking-tight text-on-surface-variant mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}
