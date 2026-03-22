"use client";

import { useRouter } from 'next/navigation'
import { useCallback, useEffect } from 'react'
import { Anchor } from "lucide-react";
import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { useBiometrics } from '@/hooks/useBiometrics'
import { useBaseline } from '@/hooks/useBaseline'
import { useSettings } from '@/hooks/useSettings'
import { pullHeartRateSince, pullStressSince } from '@/lib/biometrics/garmin'
import { scheduleDemoEpisode } from '@/lib/biometrics/simulate'
import type { TriggerResult } from '@/lib/biometrics/simulate'

export function HomeScreen() {
  const router      = useRouter()
  const { baseline, loading: baselineLoading }   = useBaseline()
  const { settings, loading: settingsLoading }   = useSettings()

  // ── Handle trigger: email fires immediately, episode saved only on user confirmation ──
  const handleTrigger = useCallback(async (result: TriggerResult) => {
    const [hrData, stressData] = await Promise.all([
      pullHeartRateSince(120),
      pullStressSince(120),
    ])

    const windowStartMs = hrData[0]?.timestamp ?? Date.now() - 120 * 60_000
    const windowEndMs   = Date.now()
    const triggeredAt   = new Date().toISOString()

    // Email fires regardless — caregiver needs to know even if user dismisses
    if (settings?.notifications_enabled) {
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          triggeredAt,
          triggerReason:      result.reason ?? null,
          triggerHrValue:     result.hrValue ?? null,
          triggerStressValue: result.stressValue ?? null,
        }),
      })
        .then(r => r.json().then(d => console.log('[notify]', r.status, d)))
        .catch(e => console.error('[notify] fetch failed', e))
    } else {
      console.log('[notify] skipped — notifications_enabled:', settings?.notifications_enabled)
    }

    // Stash biometric data — AlertScreen writes to DB only if user taps "Yes"
    localStorage.setItem('anchor_pending_episode', JSON.stringify({
      triggered_by:         'biometric',
      trigger_reason:       result.reason ?? null,
      trigger_hr_value:     result.hrValue ?? null,
      trigger_stress_value: result.stressValue ?? null,
      hr_data:              hrData,
      stress_data:          stressData,
      window_start_ms:      windowStartMs,
      window_end_ms:        windowEndMs,
    }))

    router.push('/alert')
  }, [router, settings])

  const { currentHr, currentStress, simulationMode, isMonitoring, startMonitoring } = useBiometrics({
    baseline,
    sensitivity: settings?.sensitivity ?? 'medium',
    onTrigger: handleTrigger,
  })

  // Shift+D → trigger demo episode in 5 seconds
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'y') scheduleDemoEpisode(5_000)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Start monitoring only after BOTH baseline and settings have loaded.
  // If settings hasn't loaded yet, sensitivity would default to 'medium' and
  // lock in the wrong trigger thresholds for the session.
  useEffect(() => {
    if (!baselineLoading && !settingsLoading && !isMonitoring) {
      startMonitoring()
    }
  }, [baselineLoading, settingsLoading, isMonitoring, startMonitoring])

  // Status label from simulation mode
  const statusLabel = simulationMode === 'baseline'    ? 'Calm'
    : simulationMode === 'pre_episode' ? 'Elevated'
    : simulationMode === 'episode'     ? 'High'
    : simulationMode === 'recovery'    ? 'Recovering'
    : 'Calm'

  const statusColor = simulationMode === 'baseline'    ? 'bg-[#4CAF95]'
    : simulationMode === 'pre_episode' ? 'bg-amber-400'
    : simulationMode === 'episode'     ? 'bg-red-400'
    : 'bg-amber-300'

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F7F5]">
      <div className="pb-8 pt-12 text-center">
        <div className="mb-2 flex items-center justify-center gap-3">
          <Anchor size={32} strokeWidth={1.5} className="text-[#1F6B66]" />
          <h1 className="text-4xl text-[#2C2C2C]">Anchor</h1>
        </div>
      </div>

      <div className="flex-1 px-6 pb-32">
        <div className="mx-auto max-w-md space-y-8">
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="mb-2 text-sm text-gray-500">Heart Rate</div>
                  <div className="text-4xl text-[#2C2C2C]">
                    {currentHr ?? (baselineLoading ? '—' : baseline.avgRestingHr)}
                  </div>
                  <div className="mt-1 text-sm text-gray-400">BPM</div>
                </div>
                <div>
                  <div className="mb-2 text-sm text-gray-500">Stress</div>
                  <div className="text-4xl text-[#2C2C2C]">
                    {currentStress ?? '—'}
                  </div>
                  <div className="mt-1 text-sm text-gray-400">/ 100</div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${statusColor}`} />
                  <div className="text-lg text-[#2C2C2C]">{statusLabel}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xl text-gray-600">We&apos;re keeping watch</p>
          </div>

          <Link
            href="/chat?grounding=true"
            className="block w-full rounded-full bg-[#1F6B66] px-8 py-6 text-center text-xl text-white shadow-md transition-transform active:scale-95"
          >
            I need grounding
          </Link>

          <p className="text-center">
            <Link
              href="/alert"
              className="text-sm text-gray-500 underline decoration-gray-400 underline-offset-2 hover:text-[#1F6B66]"
            >
              Preview elevated heart rate alert
            </Link>
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
