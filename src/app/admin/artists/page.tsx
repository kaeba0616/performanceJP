"use client";

import { Fragment, useState, useEffect, useCallback, useMemo } from "react";
import { SongEditor } from "@/components/admin/SongEditor";
import { ArtistSearchPicker } from "@/components/admin/ArtistSearchPicker";
import { normalizeSongs, type Song } from "@/types";

interface MemberMini {
  id: string;
  name_ko: string;
  name_en: string | null;
  image_url: string | null;
}

interface Membership {
  display_order: number;
  member: MemberMini;
}

interface ArtistRow {
  id: string;
  name_ko: string;
  name_en: string | null;
  name_ja: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  image_url: string | null;
  hit_songs: unknown;
  performances: { count: number }[];
  memberships: Membership[];
}

interface ArtistForm {
  name_ko: string;
  name_en: string;
  name_ja: string;
  instagram_url: string;
  youtube_url: string;
  image_url: string;
  hit_songs: Song[];
  members: string[];
}

const emptyForm: ArtistForm = {
  name_ko: "",
  name_en: "",
  name_ja: "",
  instagram_url: "",
  youtube_url: "",
  image_url: "",
  hit_songs: [],
  members: [],
};

const headers = { "Content-Type": "application/json" };

function MemberPicker({
  selfId,
  allArtists,
  memberIds,
  onChange,
  inputClass,
}: {
  selfId: string;
  allArtists: ArtistRow[];
  memberIds: string[];
  onChange: (next: string[]) => void;
  inputClass: string;
}) {
  const byId = new Map(allArtists.map((a) => [a.id, a]));

  function add(id: string) {
    if (!id || memberIds.includes(id) || id === selfId) return;
    onChange([...memberIds, id]);
  }
  function remove(id: string) {
    onChange(memberIds.filter((m) => m !== id));
  }
  function move(idx: number, delta: number) {
    const target = idx + delta;
    if (target < 0 || target >= memberIds.length) return;
    const next = [...memberIds];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  }

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-[#424754]">멤버</div>
      {memberIds.length === 0 ? (
        <p className="text-xs text-[#727785]">멤버 없음 (개인 아티스트)</p>
      ) : (
        <ul className="space-y-1.5">
          {memberIds.map((mid, idx) => {
            const a = byId.get(mid);
            return (
              <li
                key={mid}
                className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 border border-[#e5e7eb]"
              >
                <span className="w-5 text-xs text-[#727785] tabular-nums text-right">
                  {idx + 1}
                </span>
                {a?.image_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={a.image_url}
                    alt=""
                    className="h-6 w-6 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <span className="h-6 w-6 rounded-full bg-[#e5e7eb] flex-shrink-0" />
                )}
                <span className="flex-1 text-sm text-[#131b2e]">
                  {a ? `${a.name_ko}${a.name_en ? ` (${a.name_en})` : ""}` : mid}
                </span>
                <button
                  type="button"
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0}
                  className="w-7 h-7 rounded border border-[#d1d5db] text-[#424754] text-xs hover:bg-[#f9fafb] disabled:opacity-30"
                  title="위로"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(idx, 1)}
                  disabled={idx === memberIds.length - 1}
                  className="w-7 h-7 rounded border border-[#d1d5db] text-[#424754] text-xs hover:bg-[#f9fafb] disabled:opacity-30"
                  title="아래로"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => remove(mid)}
                  className="w-7 h-7 rounded border border-[#fecaca] text-[#da3437] text-xs hover:bg-[#fef2f2]"
                  title="제거"
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <ArtistSearchPicker
        artists={allArtists}
        excludeIds={[selfId, ...memberIds]}
        onPick={(a) => add(a.id)}
        placeholder="멤버 추가 — 이름으로 검색"
        inputClass={inputClass}
      />
    </div>
  );
}

export default function AdminArtistsPage() {
  const [artists, setArtists] = useState<ArtistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [addForm, setAddForm] = useState<ArtistForm>({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ArtistForm>({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const filteredArtists = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return artists;
    return artists.filter((a) => {
      if (a.name_ko.toLowerCase().includes(q)) return true;
      if (a.name_en && a.name_en.toLowerCase().includes(q)) return true;
      if (a.name_ja && a.name_ja.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [artists, search]);

  const fetchArtists = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/artists", { headers });
      if (res.ok) {
        const data = await res.json();
        setArtists(data.artists || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArtists();
  }, [fetchArtists]);

  function sanitizeSongs(songs: Song[]): Song[] {
    return songs
      .map((s) => ({
        title: s.title.trim(),
        youtube_url: s.youtube_url?.trim() || null,
      }))
      .filter((s) => s.title.length > 0);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addForm.name_ko.trim()) return;
    setSubmitting(true);
    try {
      const cleanedSongs = sanitizeSongs(addForm.hit_songs);
      const res = await fetch("/api/admin/artists", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name_ko: addForm.name_ko.trim(),
          name_en: addForm.name_en.trim() || null,
          name_ja: addForm.name_ja.trim() || null,
          image_url: addForm.image_url.trim() || null,
          hit_songs: cleanedSongs.length ? cleanedSongs : null,
          members: addForm.members,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        // If the artist was created with SNS URLs, update them
        if (addForm.instagram_url.trim() || addForm.youtube_url.trim()) {
          await fetch(`/api/admin/artists/${data.artist.id}`, {
            method: "PUT",
            headers,
            body: JSON.stringify({
              name_ko: addForm.name_ko.trim(),
              name_en: addForm.name_en.trim() || null,
              name_ja: addForm.name_ja.trim() || null,
              instagram_url: addForm.instagram_url.trim() || null,
              youtube_url: addForm.youtube_url.trim() || null,
              image_url: addForm.image_url.trim() || null,
              hit_songs: cleanedSongs.length ? cleanedSongs : null,
            }),
          });
        }
        setAddForm({ ...emptyForm, hit_songs: [] });
        fetchArtists();
      } else {
        const err = await res.json();
        alert(err.error || "추가 실패");
      }
    } catch {
      alert("오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(artist: ArtistRow) {
    setEditingId(artist.id);
    setEditForm({
      name_ko: artist.name_ko,
      name_en: artist.name_en || "",
      name_ja: artist.name_ja || "",
      instagram_url: artist.instagram_url || "",
      youtube_url: artist.youtube_url || "",
      image_url: artist.image_url || "",
      hit_songs: normalizeSongs(artist.hit_songs),
      members: [...(artist.memberships || [])]
        .sort((a, b) => a.display_order - b.display_order)
        .map((m) => m.member.id),
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({ ...emptyForm, hit_songs: [] });
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId || !editForm.name_ko.trim()) return;
    setSubmitting(true);
    try {
      const cleanedSongs = sanitizeSongs(editForm.hit_songs);
      const res = await fetch(`/api/admin/artists/${editingId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          name_ko: editForm.name_ko.trim(),
          name_en: editForm.name_en.trim() || null,
          name_ja: editForm.name_ja.trim() || null,
          instagram_url: editForm.instagram_url.trim() || null,
          youtube_url: editForm.youtube_url.trim() || null,
          image_url: editForm.image_url.trim() || null,
          hit_songs: cleanedSongs.length ? cleanedSongs : null,
          members: editForm.members,
        }),
      });
      if (res.ok) {
        setEditingId(null);
        setEditForm({ ...emptyForm, hit_songs: [] });
        fetchArtists();
      } else {
        const err = await res.json();
        alert(err.error || "수정 실패");
      }
    } catch {
      alert("오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`"${name}" 아티스트를 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch(`/api/admin/artists/${id}`, {
        method: "DELETE",
        headers,
      });
      if (res.ok) {
        setArtists((prev) => prev.filter((a) => a.id !== id));
        if (editingId === id) cancelEdit();
      } else {
        alert("삭제 실패");
      }
    } catch {
      alert("삭제 중 오류가 발생했습니다.");
    }
  }

  const inputClass =
    "w-full border border-[#d1d5db] rounded-lg px-3 py-1.5 text-sm text-[#131b2e] focus:outline-none focus:ring-2 focus:ring-[#0058be]/30 focus:border-[#0058be]";

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#131b2e] mb-6">아티스트 관리</h1>

      {/* Add form */}
      <div className="bg-white rounded-lg shadow-sm border border-[#e5e7eb] p-5 mb-6">
        <h2 className="text-sm font-semibold text-[#131b2e] mb-3">아티스트 추가</h2>
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-[#424754] mb-0.5">
                이름(한) <span className="text-[#da3437]">*</span>
              </label>
              <input
                type="text"
                value={addForm.name_ko}
                onChange={(e) => setAddForm((f) => ({ ...f, name_ko: e.target.value }))}
                className={inputClass}
                placeholder="홍길동"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-[#424754] mb-0.5">이름(영)</label>
              <input
                type="text"
                value={addForm.name_en}
                onChange={(e) => setAddForm((f) => ({ ...f, name_en: e.target.value }))}
                className={inputClass}
                placeholder="Hong Gildong"
              />
            </div>
            <div>
              <label className="block text-xs text-[#424754] mb-0.5">이름(일)</label>
              <input
                type="text"
                value={addForm.name_ja}
                onChange={(e) => setAddForm((f) => ({ ...f, name_ja: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#424754] mb-0.5">Instagram URL</label>
              <input
                type="url"
                value={addForm.instagram_url}
                onChange={(e) => setAddForm((f) => ({ ...f, instagram_url: e.target.value }))}
                className={inputClass}
                placeholder="https://instagram.com/..."
              />
            </div>
            <div>
              <label className="block text-xs text-[#424754] mb-0.5">YouTube URL</label>
              <input
                type="url"
                value={addForm.youtube_url}
                onChange={(e) => setAddForm((f) => ({ ...f, youtube_url: e.target.value }))}
                className={inputClass}
                placeholder="https://youtube.com/..."
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-[#424754] mb-0.5">이미지 URL</label>
            <div className="flex items-start gap-3">
              <input
                type="url"
                value={addForm.image_url}
                onChange={(e) => setAddForm((f) => ({ ...f, image_url: e.target.value }))}
                className={inputClass}
                placeholder="https://..."
              />
              {addForm.image_url.trim() && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={addForm.image_url.trim()}
                  alt="미리보기"
                  className="h-12 w-12 rounded-lg object-cover border border-[#e5e7eb] flex-shrink-0"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
            </div>
          </div>
          <SongEditor
            label="대표곡"
            value={addForm.hit_songs}
            onChange={(hit_songs) => setAddForm((f) => ({ ...f, hit_songs }))}
          />
          <button
            type="submit"
            disabled={submitting}
            className="bg-[#0058be] text-white rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-[#004a9e] transition-colors disabled:opacity-50"
          >
            {submitting ? "추가 중..." : "추가"}
          </button>
        </form>
      </div>

      {/* Search */}
      <div className="mb-3 flex items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="아티스트 검색 (한/영/일 이름)"
          className={inputClass + " max-w-sm"}
        />
        {search && (
          <span className="text-xs text-[#727785]">
            {filteredArtists.length} / {artists.length}
          </span>
        )}
      </div>

      {/* Artist table */}
      {loading ? (
        <div className="text-[#424754]">로딩 중...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-[#e5e7eb] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
                  <th className="text-left px-4 py-3 font-medium text-[#424754] whitespace-nowrap">이름(한)</th>
                  <th className="text-left px-4 py-3 font-medium text-[#424754] whitespace-nowrap">이름(영)</th>
                  <th className="text-left px-4 py-3 font-medium text-[#424754] whitespace-nowrap">이름(일)</th>
                  <th className="text-left px-4 py-3 font-medium text-[#424754] whitespace-nowrap">SNS</th>
                  <th className="text-left px-4 py-3 font-medium text-[#424754] whitespace-nowrap">대표곡</th>
                  <th className="text-left px-4 py-3 font-medium text-[#424754] whitespace-nowrap">공연수</th>
                  <th className="text-left px-4 py-3 font-medium text-[#424754] whitespace-nowrap">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {filteredArtists.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-[#424754]">
                      {search.trim() ? "검색 결과가 없습니다." : "등록된 아티스트가 없습니다."}
                    </td>
                  </tr>
                ) : (
                  filteredArtists.map((artist) =>
                    editingId === artist.id ? (
                      <Fragment key={artist.id}>
                        <tr className="bg-[#f0f7ff]">
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={editForm.name_ko}
                              onChange={(e) => setEditForm((f) => ({ ...f, name_ko: e.target.value }))}
                              className={inputClass}
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={editForm.name_en}
                              onChange={(e) => setEditForm((f) => ({ ...f, name_en: e.target.value }))}
                              className={inputClass}
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={editForm.name_ja}
                              onChange={(e) => setEditForm((f) => ({ ...f, name_ja: e.target.value }))}
                              className={inputClass}
                            />
                          </td>
                          <td className="px-4 py-2">
                            <div className="space-y-1">
                              <input
                                type="url"
                                value={editForm.instagram_url}
                                onChange={(e) => setEditForm((f) => ({ ...f, instagram_url: e.target.value }))}
                                className={inputClass}
                                placeholder="Instagram"
                              />
                              <input
                                type="url"
                                value={editForm.youtube_url}
                                onChange={(e) => setEditForm((f) => ({ ...f, youtube_url: e.target.value }))}
                                className={inputClass}
                                placeholder="YouTube"
                              />
                              <div className="flex items-center gap-2">
                                <input
                                  type="url"
                                  value={editForm.image_url}
                                  onChange={(e) => setEditForm((f) => ({ ...f, image_url: e.target.value }))}
                                  className={inputClass}
                                  placeholder="Image URL"
                                />
                                {editForm.image_url.trim() && (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img
                                    src={editForm.image_url.trim()}
                                    alt="미리보기"
                                    className="h-8 w-8 rounded object-cover border border-[#e5e7eb] flex-shrink-0"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).style.display = "none";
                                    }}
                                  />
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-[#424754] tabular-nums">
                            {normalizeSongs(artist.hit_songs).length || 0}
                          </td>
                          <td className="px-4 py-2 text-[#424754]">{artist.performances?.[0]?.count || 0}</td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={handleEdit}
                                disabled={submitting}
                                className="text-[#0058be] hover:text-[#004a9e] text-sm font-medium disabled:opacity-50"
                              >
                                저장
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="text-[#424754] hover:text-[#131b2e] text-sm font-medium"
                              >
                                취소
                              </button>
                            </div>
                          </td>
                        </tr>
                        <tr className="bg-[#f0f7ff]">
                          <td colSpan={7} className="px-4 pb-4 pt-0 space-y-4">
                            <MemberPicker
                              selfId={artist.id}
                              allArtists={artists}
                              memberIds={editForm.members}
                              onChange={(members) =>
                                setEditForm((f) => ({ ...f, members }))
                              }
                              inputClass={inputClass}
                            />
                            <SongEditor
                              label="대표곡"
                              value={editForm.hit_songs}
                              onChange={(hit_songs) =>
                                setEditForm((f) => ({ ...f, hit_songs }))
                              }
                            />
                          </td>
                        </tr>
                      </Fragment>
                    ) : (
                      <tr key={artist.id} className="hover:bg-[#f9fafb]">
                        <td className="px-4 py-3 font-medium text-[#131b2e] whitespace-nowrap">{artist.name_ko}</td>
                        <td className="px-4 py-3 text-[#424754] whitespace-nowrap">{artist.name_en || "-"}</td>
                        <td className="px-4 py-3 text-[#424754] whitespace-nowrap">{artist.name_ja || "-"}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {artist.instagram_url && (
                              <a
                                href={artist.instagram_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#0058be] hover:underline text-xs"
                              >
                                IG
                              </a>
                            )}
                            {artist.youtube_url && (
                              <a
                                href={artist.youtube_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#da3437] hover:underline text-xs"
                              >
                                YT
                              </a>
                            )}
                            {!artist.instagram_url && !artist.youtube_url && (
                              <span className="text-[#424754]">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#424754] tabular-nums whitespace-nowrap">
                          {normalizeSongs(artist.hit_songs).length || 0}
                        </td>
                        <td className="px-4 py-3 text-[#424754] whitespace-nowrap">{artist.performances?.[0]?.count || 0}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startEdit(artist)}
                              className="text-[#0058be] hover:text-[#004a9e] text-sm font-medium"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDelete(artist.id, artist.name_ko)}
                              className="text-[#da3437] hover:text-[#b91c1c] text-sm font-medium"
                            >
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
