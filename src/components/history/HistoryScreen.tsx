"use client";

import { useMemo, useState } from "react";
import { Share2, Trash2 } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { useEpisodeHistory } from "@/hooks/useEpisodeHistory";

function todayDateInputValue(): string {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function HistoryScreen() {
  const { episodes, addEpisode, updateEpisodeNotes, deleteEpisode } =
    useEpisodeHistory();
  const [addOpen, setAddOpen] = useState(false);
  const [dateInput, setDateInput] = useState(todayDateInputValue);
  const [notesDraft, setNotesDraft] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  /** Local text while editing notes (keyed by episode id when expanded) */
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  const openAddModal = () => {
    setDateInput(todayDateInputValue());
    setNotesDraft("");
    setAddOpen(true);
  };

  const totalEpisodes = episodes.length;
  const avgDuration = useMemo(() => {
    if (totalEpisodes === 0) return 0;
    return Math.round(
      episodes.reduce((sum, ep) => sum + ep.duration, 0) / totalEpisodes
    );
  }, [episodes, totalEpisodes]);

  const handleShare = () => {
    const summary = `Weekly Summary - Last 7 days\n\nTotal episodes: ${totalEpisodes}\nAverage duration: ${avgDuration} minutes\n\nDetails:\n${episodes
      .map(
        (ep) =>
          `${ep.date} at ${ep.time} - ${ep.duration} min (${ep.triggerType}, ${
            ep.engaged ? "engaged" : "dismissed"
          })${ep.notes ? `\n  Notes: ${ep.notes}` : ""}`
      )
      .join("\n")}`;

    window.alert("This would share with your psychiatrist:\n\n" + summary);
  };

  const handleSaveEpisode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateInput) return;
    addEpisode(dateInput, notesDraft);
    setAddOpen(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F7F5] pb-24">
      <div className="px-6 pb-6 pt-12">
        <div className="mx-auto max-w-md">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h1 className="text-4xl text-[#2C2C2C]">Episode History</h1>
            <button
              type="button"
              onClick={openAddModal}
              className="shrink-0 text-3xl font-light leading-none text-black hover:opacity-70"
              aria-label="Add episode"
            >
              +
            </button>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="mb-3 text-sm text-gray-500">Last 7 days</div>
            <div className="flex items-baseline gap-4">
              <div>
                <div className="text-3xl text-[#2C2C2C]">{totalEpisodes}</div>
                <div className="mt-1 text-sm text-gray-500">episodes</div>
              </div>
              <div className="h-10 w-px bg-gray-200" />
              <div>
                <div className="text-3xl text-[#2C2C2C]">
                  {totalEpisodes === 0 ? "—" : `${avgDuration} min`}
                </div>
                <div className="mt-1 text-sm text-gray-500">avg duration</div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleShare}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#1F6B66] bg-white px-6 py-4 text-base text-[#1F6B66] transition-transform active:scale-95"
          >
            <Share2 size={18} />
            Share with my psychiatrist
          </button>
        </div>
      </div>

      <div className="flex-1 px-6">
        <div className="mx-auto max-w-md space-y-3">
          {episodes.map((episode) => {
            const expanded = expandedId === episode.id;
            const noteValue =
              noteDrafts[episode.id] ??
              episode.notes ??
              "";

            const toggleNotes = () => {
              if (expanded) {
                setExpandedId(null);
              } else {
                setNoteDrafts((prev) => ({
                  ...prev,
                  [episode.id]:
                    prev[episode.id] !== undefined
                      ? prev[episode.id]!
                      : (episode.notes ?? ""),
                }));
                setExpandedId(episode.id);
              }
            };

            return (
              <div
                key={episode.id}
                className="relative rounded-2xl bg-white p-5 pb-14 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <div
                        className={`h-2 w-2 shrink-0 rounded-full ${
                          episode.engaged ? "bg-[#4CAF95]" : "bg-gray-300"
                        }`}
                      />
                      <div className="text-base text-[#2C2C2C]">
                        {episode.date}
                      </div>
                    </div>
                    <div className="mb-2 text-base font-medium text-[#2C2C2C]">
                      {episode.time}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                      <span>{episode.duration} minutes</span>
                      <span className="text-gray-300">•</span>
                      <span className="capitalize">{episode.triggerType}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <div className="text-sm text-gray-400">
                      {episode.engaged ? "Completed" : "Dismissed"}
                    </div>
                    <button
                      type="button"
                      onClick={toggleNotes}
                      className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-[#2C2C2C] transition-colors hover:bg-gray-100"
                    >
                      Notes
                    </button>
                  </div>
                </div>
                {expanded && (
                  <div className="mt-4 border-t border-gray-100 pt-4 pr-14">
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      Notes
                    </label>
                    <textarea
                      value={noteValue}
                      onChange={(e) =>
                        setNoteDrafts((prev) => ({
                          ...prev,
                          [episode.id]: e.target.value,
                        }))
                      }
                      onBlur={() => updateEpisodeNotes(episode.id, noteValue)}
                      rows={4}
                      placeholder="Add or edit notes for this episode…"
                      className="w-full resize-y rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-[#2C2C2C] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1F6B66]"
                    />
                    <p className="mt-1 text-xs text-gray-400">
                      Changes save when you leave this field.
                    </p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (
                      !window.confirm(
                        "Remove this episode from your history?"
                      )
                    ) {
                      return;
                    }
                    deleteEpisode(episode.id);
                    setExpandedId((id) => (id === episode.id ? null : id));
                    setNoteDrafts((prev) => {
                      const next = { ...prev };
                      delete next[episode.id];
                      return next;
                    });
                  }}
                  className="absolute bottom-4 right-4 flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                  aria-label="Delete episode"
                >
                  <Trash2 size={14} strokeWidth={2} />
                  Delete
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {addOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-episode-title"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Close dialog"
            onClick={() => setAddOpen(false)}
          />
          <form
            onSubmit={handleSaveEpisode}
            className="relative z-10 w-full max-w-md rounded-3xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="add-episode-title"
              className="mb-4 text-xl font-medium text-[#2C2C2C]"
            >
              Add episode
            </h2>
            <label className="mb-4 block">
              <span className="mb-1.5 block text-sm text-gray-500">Date</span>
              <input
                type="date"
                required
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#1F6B66]"
              />
              <span className="mt-1 block text-xs text-gray-400">
                Shown as Month Day, Year in your history
              </span>
            </label>
            <label className="mb-6 block">
              <span className="mb-1.5 block text-sm text-gray-500">
                Notes (optional)
              </span>
              <textarea
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                rows={4}
                placeholder="How were you feeling? Anything you want to remember?"
                className="w-full resize-y rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-[#2C2C2C] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1F6B66]"
              />
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="flex-1 rounded-full border border-gray-200 py-3 text-center text-base text-[#2C2C2C] transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 rounded-full bg-[#1F6B66] py-3 text-base text-white transition-transform active:scale-95"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
