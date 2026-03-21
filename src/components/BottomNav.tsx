"use client";

import { useState } from "react";
import { Home, History, MessageCircle, Settings, PenLine } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useEpisodeLog } from "@/hooks/useEpisodeLog";
import { useBaseline } from "@/hooks/useBaseline";
import { pullBiometricsInWindow } from "@/lib/biometrics/garmin";
import { inferEpisodeReason } from "@/lib/biometrics/simulate";

function todayValue(): string {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

function timeValue(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

const leftNavItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: MessageCircle, label: "Chat", path: "/chat" },
] as const;

const rightNavItems = [
  { icon: History, label: "History", path: "/log" },
  { icon: Settings, label: "Settings", path: "/settings" },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { logEpisode } = useEpisodeLog();
  const { baseline } = useBaseline();

  const [addOpen, setAddOpen] = useState(false);
  const [dateInput, setDateInput] = useState(todayValue);
  const [startTime, setStartTime] = useState(() =>
    timeValue(new Date(Date.now() - 60 * 60_000)),
  );
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
    router.push("/log");
  };

  const isNavActive = (path: string) =>
    path === "/"
      ? pathname === "/"
      : pathname === path || pathname.startsWith(`${path}/`);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-md items-center justify-around">
          {leftNavItems.map((item) => {
            const active = isNavActive(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className="flex min-w-[80px] flex-col items-center gap-1 py-2"
              >
                <Icon
                  size={28}
                  strokeWidth={1.5}
                  className={active ? "text-[#1F6B66]" : "text-gray-400"}
                />
                <span
                  className={`text-xs ${active ? "text-[#1F6B66]" : "text-gray-400"}`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Center Log Episode action button */}
          <button
            type="button"
            onClick={openAddModal}
            className="-translate-y-2 flex flex-col items-center gap-1"
            aria-label="Log an episode"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1F6B66] shadow-md transition-transform active:scale-95">
              <PenLine size={22} strokeWidth={1.5} className="text-white" />
            </div>
            <span className="text-xs text-[#1F6B66]">Log</span>
          </button>

          {rightNavItems.map((item) => {
            const active = isNavActive(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className="flex min-w-[80px] flex-col items-center gap-1 py-2"
              >
                <Icon
                  size={28}
                  strokeWidth={1.5}
                  className={active ? "text-[#1F6B66]" : "text-gray-400"}
                />
                <span
                  className={`text-xs ${active ? "text-[#1F6B66]" : "text-gray-400"}`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <AnimatePresence>
        {addOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
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
            <motion.form
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onSubmit={handleSaveEpisode}
              className="relative z-10 w-full max-w-md rounded-3xl bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                id="add-episode-title"
                className="mb-4 text-xl text-[#2C2C2C]"
              >
                Log An Episode
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
                  <span className="mb-1.5 block text-sm text-gray-500">
                    Start time
                  </span>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#1F6B66]"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm text-gray-500">
                    End time
                  </span>
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
                Biometric data from this window will be analyzed to detect the
                trigger.
              </p>

              <label className="mb-6 block">
                <span className="mb-1.5 block text-sm text-gray-500">
                  Notes (optional)
                </span>
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
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
