"use client";

import { useState, useEffect, startTransition } from "react";
import { BottomNav } from "@/components/BottomNav";
import { useSettings } from "@/hooks/useSettings";

export default function SettingsPage() {
  const { settings, loading, updateSettings } = useSettings();

  const [userEmail, setUserEmail] = useState("");
  const [caregiverConsent, setCaregiverConsent] = useState(false);
  const [caregiverName, setCaregiverName] = useState("");
  const [caregiverEmail, setCaregiverEmail] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!settings) return;
    startTransition(() => {
      setUserEmail(settings.user_email ?? "");
      setCaregiverConsent(settings.caregiver_consent);
      setCaregiverName(settings.caregiver_name ?? "");
      setCaregiverEmail(settings.caregiver_email ?? "");
      setNotificationsEnabled(settings.notifications_enabled);
    });
  }, [settings]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await updateSettings({
      user_email: userEmail || null,
      caregiver_consent: caregiverConsent,
      caregiver_name: caregiverName || null,
      caregiver_email: caregiverEmail || null,
      notifications_enabled: notificationsEnabled,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50 pb-24 dark:bg-zinc-950">
        <div className="flex flex-1 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-24 pt-12 dark:bg-zinc-950 px-4">
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Settings
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Configure notifications and caregiver alerts.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Your email */}
          <section className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                  Your notifications
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Send a check-in email when an episode is detected.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={notificationsEnabled}
                onClick={() => setNotificationsEnabled((v) => !v)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 ${
                  notificationsEnabled
                    ? "bg-zinc-900 dark:bg-zinc-100"
                    : "bg-zinc-200 dark:bg-zinc-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                    notificationsEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {notificationsEnabled && (
              <div className="space-y-4 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <label className="block">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400 mb-1.5 block">
                    Your email
                  </span>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                  />
                </label>
                <p className="text-xs text-zinc-400">
                  When your thresholds are exceeded, Anchor sends you a gentle
                  check-in email.
                </p>
              </div>
            )}
          </section>

          {/* Caregiver alerts */}
          <section className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                  Caregiver alerts
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Notify a trusted person when an episode is detected.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={caregiverConsent}
                onClick={() => setCaregiverConsent((v) => !v)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 ${
                  caregiverConsent
                    ? "bg-zinc-900 dark:bg-zinc-100"
                    : "bg-zinc-200 dark:bg-zinc-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                    caregiverConsent ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {caregiverConsent && (
              <div className="space-y-4 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <label className="block">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400 mb-1.5 block">
                    Caregiver name
                  </span>
                  <input
                    type="text"
                    value={caregiverName}
                    onChange={(e) => setCaregiverName(e.target.value)}
                    placeholder="e.g. Mom"
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400 mb-1.5 block">
                    Caregiver email
                  </span>
                  <input
                    type="email"
                    value={caregiverEmail}
                    onChange={(e) => setCaregiverEmail(e.target.value)}
                    placeholder="caregiver@example.com"
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                  />
                </label>
                <p className="text-xs text-zinc-400">
                  When an episode is detected, they will receive an email asking
                  them to check in with you.
                </p>
              </div>
            )}
          </section>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-sm font-medium disabled:opacity-50 transition-opacity focus:outline-none focus:ring-2 focus:ring-zinc-400"
          >
            {saving ? "Saving…" : saved ? "Saved" : "Save settings"}
          </button>
        </form>
      </div>
      <p className="mt-8 text-center text-xs text-zinc-400">
        Any questions or concerns, contact us at{" "}
        <a
          href="mailto:raeganvr7@gmail.com"
          className="underline hover:text-zinc-600"
        >
          raeganvr7@gmail.com
        </a>
      </p>
      <BottomNav />
    </div>
  );
}
