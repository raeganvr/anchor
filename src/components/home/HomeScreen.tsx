"use client";

import { Anchor } from "lucide-react";
import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { getCurrentGarminData } from "@/data/mockData";

export function HomeScreen() {
  const garminData = getCurrentGarminData();

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
                    {garminData.heartRate}
                  </div>
                  <div className="mt-1 text-sm text-gray-400">BPM</div>
                </div>
                <div>
                  <div className="mb-2 text-sm text-gray-500">HRV</div>
                  <div className="text-4xl text-[#2C2C2C]">{garminData.hrv}</div>
                  <div className="mt-1 text-sm text-gray-400">ms</div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-[#4CAF95]" />
                  <div className="text-lg text-[#2C2C2C]">Calm</div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xl text-gray-600">We&apos;re keeping watch</p>
          </div>

          <Link
            href="/grounding"
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
