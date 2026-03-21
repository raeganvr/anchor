"use client";

import { useState } from "react";
import { Share2, Trash2, FileText } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { useEpisodeLog } from "@/hooks/useEpisodeLog";
import type { EpisodeRow } from "@/types/database";

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
  const { episodes, loading, updateNotes, deleteEpisode } = useEpisodeLog();

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
          <div className="mb-6">
            <h1 className="text-3xl sm:text-4xl text-[#2C2C2C]">
              Your Episode History
            </h1>
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
    </div>
  );
}
