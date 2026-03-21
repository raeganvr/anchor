"use client";

import { useState } from "react";
import { Share2, Trash2, FileText, Plus } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { useEpisodeLog } from "@/hooks/useEpisodeLog";
import { useBaseline } from "@/hooks/useBaseline";
import { pullBiometricsInWindow } from "@/lib/biometrics/garmin";
import { inferEpisodeReason } from "@/lib/biometrics/simulate";
import type { EpisodeRow } from "@/types/database";

function todayValue(): string {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

function timeValue(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

const TRIGGER_REASON_LABELS: Record<string, string> = {
  hr_spike: "Heart Rate Spike",
  combined_hr_stress: "Elevated HR & Stress",
  stress_only: "High Stress",
};

const TRIGGERED_BY_LABELS: Record<string, string> = {
  biometric: "Biometric",
  manual: "Manual",
  caregiver: "Caregiver",
};

function formatTrigger(reason: string | null, triggeredBy: string): string {
  if (reason && TRIGGER_REASON_LABELS[reason])
    return TRIGGER_REASON_LABELS[reason];
  return TRIGGERED_BY_LABELS[triggeredBy] ?? triggeredBy;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function EpisodeCard({
  episode,
  onUpdateNotes,
  onDelete,
}: {
  episode: EpisodeRow;
  onUpdateNotes: (id: string, notes: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [showNotes, setShowNotes] = useState(false);
  const [notesInput, setNotesInput] = useState(episode.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSaveNotes = async () => {
    setSaving(true);
    await onUpdateNotes(episode.id, notesInput);
    setSaving(false);
    setShowNotes(false);
  };

  const handleDelete = async () => {
    if (!confirm("Delete this episode?")) return;
    setDeleting(true);
    await onDelete(episode.id);
  };

  const triggerLabel = formatTrigger(
    episode.trigger_reason,
    episode.triggered_by,
  );

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${
                episode.resolved ? "bg-[#4CAF95]" : "bg-gray-300"
              }`}
            />
            <div className="text-base text-[#2C2C2C]">
              {formatDate(episode.created_at)}
            </div>
          </div>
          <div className="mb-1 text-sm text-gray-500">
            {formatTime(episode.created_at)}
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            {episode.duration_minutes != null && (
              <>
                <span>{episode.duration_minutes} min</span>
                <span className="text-gray-300">•</span>
              </>
            )}
            <span className="capitalize">{triggerLabel}</span>
          </div>
          {episode.notes && !showNotes && (
            <p className="mt-2 text-sm text-gray-500 italic">
              &ldquo;{episode.notes}&rdquo;
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="text-sm text-gray-400">
            {episode.resolved ? "Completed" : "Dismissed"}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowNotes((v) => !v)}
              className="text-gray-400 hover:text-[#1F6B66] transition-colors"
              title="Add note"
            >
              <FileText size={16} />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
              title="Delete episode"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {showNotes && (
        <div className="mt-3 space-y-2">
          <textarea
            value={notesInput}
            onChange={(e) => setNotesInput(e.target.value)}
            placeholder="Add a note about this episode..."
            rows={3}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1F6B66] resize-none"
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setShowNotes(false);
                setNotesInput(episode.notes ?? "");
              }}
              className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveNotes}
              disabled={saving}
              className="px-4 py-1.5 rounded-full bg-[#1F6B66] text-sm text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function HistoryScreen() {
  const { episodes, loading, logEpisode, updateNotes, deleteEpisode } = useEpisodeLog();
  const { baseline } = useBaseline();
  const [addOpen, setAddOpen] = useState(false);
  const [dateInput, setDateInput] = useState(todayValue);
  const [startTime, setStartTime] = useState(() => timeValue(new Date(Date.now() - 60 * 60_000)));
  const [endTime, setEndTime] = useState(() => timeValue(new Date()));
  const [notesDraft, setNotesDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const openAddModal = () => {
    const now = new Date();
    setDateInput(todayValue());
    setStartTime(timeValue(new Date(now.getTime() - 60 * 60_000)));
    setEndTime(timeValue(now));
    setNotesDraft("");
    setAddOpen(true);
  };

  const handleSaveEpisode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!dateInput) return;
    setSubmitting(true);

    const startIso = new Date(`${dateInput}T${startTime}:00`).toISOString();
    const endIso = new Date(`${dateInput}T${endTime}:00`).toISOString();
    const durationMinutes = Math.round(
      (new Date(endIso).getTime() - new Date(startIso).getTime()) / 60_000,
    );

    const { hr, stress } = await pullBiometricsInWindow(startIso, endIso);
    const inferred = inferEpisodeReason(hr, stress, baseline);

    await logEpisode({
      triggered_by: "manual",
      trigger_reason: inferred.reason,
      trigger_hr_value: inferred.hrValue,
      trigger_stress_value: inferred.stressValue,
      hr_data: hr,
      stress_data: stress,
      duration_minutes: durationMinutes,
      notes: notesDraft.trim() || undefined,
      created_at: startIso,
      window_start_ms: new Date(startIso).getTime(),
      window_end_ms: new Date(endIso).getTime(),
    });

    setSubmitting(false);
    setAddOpen(false);
  };

  const totalEpisodes = episodes.length;
  const episodesWithDuration = episodes.filter(
    (e) => e.duration_minutes != null,
  );
  const avgDuration =
    episodesWithDuration.length > 0
      ? Math.round(
          episodesWithDuration.reduce(
            (sum, ep) => sum + (ep.duration_minutes ?? 0),
            0,
          ) / episodesWithDuration.length,
        )
      : null;

  const handleShare = () => {
    const summary = `Weekly Summary\n\nTotal episodes: ${totalEpisodes}\n${avgDuration != null ? `Average duration: ${avgDuration} min\n` : ""}\nDetails:\n${episodes
      .map(
        (ep) =>
          `${formatDate(ep.created_at)} at ${formatTime(ep.created_at)} — ${formatTrigger(ep.trigger_reason, ep.triggered_by)}${ep.duration_minutes ? `, ${ep.duration_minutes} min` : ""}${ep.resolved ? ", completed" : ", dismissed"}`,
      )
      .join("\n")}`;

    window.alert("This would share with your psychiatrist:\n\n" + summary);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F7F5] pb-24">
      <div className="px-6 pb-6 pt-12">
        <div className="mx-auto max-w-md">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl sm:text-4xl text-[#2C2C2C]">
              Your Episode History
            </h1>
            <button
              type="button"
              onClick={openAddModal}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1F6B66] text-white shadow-sm transition-transform active:scale-95"
              aria-label="Add episode"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="mb-3 text-sm text-gray-500">All episodes</div>
            <div className="flex items-baseline gap-4">
              <div>
                <div className="text-3xl text-[#2C2C2C]">
                  {loading ? "—" : totalEpisodes}
                </div>
                <div className="mt-1 text-sm text-gray-500">episodes</div>
              </div>
              {avgDuration != null && (
                <>
                  <div className="h-10 w-px bg-gray-200" />
                  <div>
                    <div className="text-3xl text-[#2C2C2C]">
                      {avgDuration} min
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      avg duration
                    </div>
                  </div>
                </>
              )}
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

      <div className="flex-1 px-6 pb-4">
        <div className="mx-auto max-w-md space-y-3">
          {loading && (
            <div className="py-12 text-center text-gray-400">
              Loading episodes…
            </div>
          )}
          {!loading && episodes.length === 0 && (
            <div className="py-12 text-center text-gray-400">
              No episodes recorded yet.
            </div>
          )}
          {episodes.map((episode) => (
            <EpisodeCard
              key={episode.id}
              episode={episode}
              onUpdateNotes={async (id, notes) => {
                await updateNotes(id, notes);
              }}
              onDelete={async (id) => {
                await deleteEpisode(id);
              }}
            />
          ))}
        </div>
      </div>

      <BottomNav />

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
            aria-label="Close"
            onClick={() => setAddOpen(false)}
          />
          <form
            onSubmit={handleSaveEpisode}
            className="relative z-10 w-full max-w-md rounded-3xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="add-episode-title" className="mb-4 text-xl text-[#2C2C2C]">
              Log an episode
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
            </label>

            <div className="mb-4 grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-sm text-gray-500">Start time</span>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#1F6B66]"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm text-gray-500">End time</span>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#1F6B66]"
                />
              </label>
            </div>
            <p className="mb-4 -mt-2 text-xs text-gray-400">
              Biometric data from this window will be analyzed to detect the trigger.
            </p>

            <label className="mb-6 block">
              <span className="mb-1.5 block text-sm text-gray-500">Notes (optional)</span>
              <textarea
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                rows={4}
                placeholder="How were you feeling?"
                className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-[#2C2C2C] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1F6B66]"
              />
            </label>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="flex-1 rounded-full border border-gray-200 py-3 text-base text-[#2C2C2C] transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-full bg-[#1F6B66] py-3 text-base text-white transition-transform active:scale-95 disabled:opacity-50"
              >
                {submitting ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
