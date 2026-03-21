"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

export function SettingsScreen() {
  const [heartRateThreshold, setHeartRateThreshold] = useState(100);
  const [autoCheckins, setAutoCheckins] = useState(true);
  const [trustedContact, setTrustedContact] = useState({
    name: "Dr. Sarah Chen",
    phone: "(555) 123-4567",
  });

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F7F5] pb-24">
      <div className="px-6 pb-6 pt-12">
        <div className="mx-auto max-w-md">
          <h1 className="text-4xl text-[#2C2C2C]">Settings</h1>
        </div>
      </div>

      <div className="flex-1 px-6">
        <div className="mx-auto max-w-md space-y-6">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="mb-4 text-base text-gray-500">Garmin Connection</div>
            <div className="flex items-center justify-between">
              <div>
                <div className="mb-1 text-lg text-[#2C2C2C]">Connected</div>
                <div className="text-sm text-gray-500">Garmin Venu 3</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-[#4CAF95]" />
                <div className="text-sm text-[#4CAF95]">Active</div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="mb-4 text-base text-gray-500">Trusted Contact</div>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-gray-500">Name</label>
                <input
                  type="text"
                  value={trustedContact.name}
                  onChange={(e) =>
                    setTrustedContact({ ...trustedContact, name: e.target.value })
                  }
                  className="w-full rounded-2xl bg-gray-50 px-5 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-[#1F6B66]"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-500">Phone</label>
                <input
                  type="tel"
                  value={trustedContact.phone}
                  onChange={(e) =>
                    setTrustedContact({ ...trustedContact, phone: e.target.value })
                  }
                  className="w-full rounded-2xl bg-gray-50 px-5 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-[#1F6B66]"
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="mb-4 text-base text-gray-500">
              Heart Rate Alert Threshold
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-3xl text-[#2C2C2C]">
                  {heartRateThreshold}
                </div>
                <div className="text-base text-gray-500">BPM</div>
              </div>
              <input
                type="range"
                min={80}
                max={140}
                step={5}
                value={heartRateThreshold}
                onChange={(e) => setHeartRateThreshold(Number(e.target.value))}
                className="slider h-3 w-full cursor-pointer appearance-none rounded-full bg-gray-200"
                style={{
                  background: `linear-gradient(to right, #1F6B66 0%, #1F6B66 ${
                    ((heartRateThreshold - 80) / 60) * 100
                  }%, #E5E5E5 ${
                    ((heartRateThreshold - 80) / 60) * 100
                  }%, #E5E5E5 100%)`,
                }}
              />
              <div className="text-sm leading-relaxed text-gray-500">
                We&apos;ll check in when your heart rate stays above this for 2+
                minutes
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="mb-2 text-lg text-[#2C2C2C]">
                  Allow automatic check-ins
                </div>
                <div className="text-sm leading-relaxed text-gray-500">
                  Anchor will proactively alert you when it detects elevated vitals
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAutoCheckins(!autoCheckins)}
                className={`relative ml-4 h-10 w-16 rounded-full transition-colors ${
                  autoCheckins ? "bg-[#1F6B66]" : "bg-gray-300"
                }`}
              >
                <div
                  className={`absolute top-1 h-8 w-8 rounded-full bg-white shadow-md transition-transform ${
                    autoCheckins ? "right-1" : "left-1"
                  }`}
                >
                  {autoCheckins && (
                    <Check
                      size={16}
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[#1F6B66]"
                    />
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
