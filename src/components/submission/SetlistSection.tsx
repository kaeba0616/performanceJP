"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { SongList } from "@/components/SongList";
import { SongSubmitForm } from "@/components/submission/SongSubmitForm";
import type { Song } from "@/types";

interface Props {
  performanceId: string;
  performanceTitle: string;
  songs: Song[];
}

export function SetlistSection({ performanceId, performanceTitle, songs }: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const hasSongs = songs.length > 0;

  const submitButton = !hasSongs ? (
    <button
      type="button"
      onClick={() => setFormOpen((v) => !v)}
      className="inline-flex items-center gap-1.5 bg-primary text-on-primary text-xs font-black uppercase tracking-widest px-3 py-2 rounded-full hover:brightness-110 transition-all flex-shrink-0"
    >
      <Send className="w-3.5 h-3.5" />
      제보하기
    </button>
  ) : null;

  return (
    <>
      <SongList
        songs={songs}
        title="셋리스트"
        emptyLabel="공연 후 셋리스트가 등록될 예정입니다."
        emptyAction={submitButton}
      />
      {!hasSongs && formOpen && (
        <div className="-mt-6 mb-10">
          <SongSubmitForm
            kind="setlist"
            performanceId={performanceId}
            targetLabel={performanceTitle}
            defaultOpen
            hideToggle
          />
        </div>
      )}
    </>
  );
}
