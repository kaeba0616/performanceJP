"use client";

import { useState, useEffect, useCallback } from "react";

interface ArtistRow {
  id: string;
  name_ko: string;
  name_en: string | null;
  name_ja: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  performances: { count: number }[];
}

interface ArtistForm {
  name_ko: string;
  name_en: string;
  name_ja: string;
  instagram_url: string;
  youtube_url: string;
}

const emptyForm: ArtistForm = { name_ko: "", name_en: "", name_ja: "", instagram_url: "", youtube_url: "" };

export default function AdminArtistsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [artists, setArtists] = useState<ArtistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [addForm, setAddForm] = useState<ArtistForm>({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ArtistForm>({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setToken(localStorage.getItem("admin_token"));
  }, []);

  const headers = useCallback(
    () => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" }),
    [token]
  );

  const fetchArtists = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/artists", { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setArtists(data.artists || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [token, headers]);

  useEffect(() => {
    fetchArtists();
  }, [fetchArtists]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addForm.name_ko.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/artists", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          name_ko: addForm.name_ko.trim(),
          name_en: addForm.name_en.trim() || null,
          name_ja: addForm.name_ja.trim() || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        // If the artist was created with SNS URLs, update them
        if (addForm.instagram_url.trim() || addForm.youtube_url.trim()) {
          await fetch(`/api/admin/artists/${data.artist.id}`, {
            method: "PUT",
            headers: headers(),
            body: JSON.stringify({
              name_ko: addForm.name_ko.trim(),
              name_en: addForm.name_en.trim() || null,
              name_ja: addForm.name_ja.trim() || null,
              instagram_url: addForm.instagram_url.trim() || null,
              youtube_url: addForm.youtube_url.trim() || null,
            }),
          });
        }
        setAddForm({ ...emptyForm });
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
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({ ...emptyForm });
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId || !editForm.name_ko.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/artists/${editingId}`, {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({
          name_ko: editForm.name_ko.trim(),
          name_en: editForm.name_en.trim() || null,
          name_ja: editForm.name_ja.trim() || null,
          instagram_url: editForm.instagram_url.trim() || null,
          youtube_url: editForm.youtube_url.trim() || null,
        }),
      });
      if (res.ok) {
        setEditingId(null);
        setEditForm({ ...emptyForm });
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
        headers: headers(),
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
          <button
            type="submit"
            disabled={submitting}
            className="bg-[#0058be] text-white rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-[#004a9e] transition-colors disabled:opacity-50"
          >
            {submitting ? "추가 중..." : "추가"}
          </button>
        </form>
      </div>

      {/* Artist table */}
      {loading ? (
        <div className="text-[#424754]">로딩 중...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-[#e5e7eb] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
                  <th className="text-left px-4 py-3 font-medium text-[#424754]">이름(한)</th>
                  <th className="text-left px-4 py-3 font-medium text-[#424754]">이름(영)</th>
                  <th className="text-left px-4 py-3 font-medium text-[#424754]">이름(일)</th>
                  <th className="text-left px-4 py-3 font-medium text-[#424754]">SNS</th>
                  <th className="text-left px-4 py-3 font-medium text-[#424754]">공연수</th>
                  <th className="text-left px-4 py-3 font-medium text-[#424754]">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {artists.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[#424754]">
                      등록된 아티스트가 없습니다.
                    </td>
                  </tr>
                ) : (
                  artists.map((artist) =>
                    editingId === artist.id ? (
                      <tr key={artist.id} className="bg-[#f0f7ff]">
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
                          </div>
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
                    ) : (
                      <tr key={artist.id} className="hover:bg-[#f9fafb]">
                        <td className="px-4 py-3 font-medium text-[#131b2e]">{artist.name_ko}</td>
                        <td className="px-4 py-3 text-[#424754]">{artist.name_en || "-"}</td>
                        <td className="px-4 py-3 text-[#424754]">{artist.name_ja || "-"}</td>
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
                        <td className="px-4 py-3 text-[#424754]">{artist.performances?.[0]?.count || 0}</td>
                        <td className="px-4 py-3">
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
