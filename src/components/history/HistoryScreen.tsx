"use client";

import { Share2 } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { mockEpisodes } from "@/data/mockData";

export function HistoryScreen() {
  const totalEpisodes = mockEpisodes.length;
  const avgDuration = Math.round(
    mockEpisodes.reduce((sum, ep) => sum + ep.duration, 0) / totalEpisodes
  );

  const handleShare = () => {
    const summary = `Weekly Summary - Last 7 days\n\nTotal episodes: ${totalEpisodes}\nAverage duration: ${avgDuration} minutes\n\nDetails:\n${mockEpisodes
      .map(
        (ep) =>
          `${ep.date} at ${ep.time} - ${ep.duration} min (${ep.triggerType}, ${
            ep.engaged ? "engaged" : "dismissed"
          })`
      )
      .join("\n")}`;

    window.alert("This would share with your psychiatrist:\n\n" + summary);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F7F5] pb-24">
      <div className="px-6 pb-6 pt-12">
        <div className="mx-auto max-w-md">
          <h1 className="mb-6 text-4xl text-[#2C2C2C]">Episode History</h1>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="mb-3 text-sm text-gray-500">Last 7 days</div>
            <div className="flex items-baseline gap-4">
              <div>
                <div className="text-3xl text-[#2C2C2C]">{totalEpisodes}</div>
                <div className="mt-1 text-sm text-gray-500">episodes</div>
              </div>
              <div className="h-10 w-px bg-gray-200" />
              <div>
                <div className="text-3xl text-[#2C2C2C]">{avgDuration} min</div>
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
          {mockEpisodes.map((episode) => (
            <div
              key={episode.id}
              className="rounded-2xl bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        episode.engaged ? "bg-[#4CAF95]" : "bg-gray-300"
                      }`}
                    />
                    <div className="text-base text-[#2C2C2C]">
                      {episode.date}
                    </div>
                  </div>
                  <div className="mb-1 text-sm text-gray-500">
                    {episode.time}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span>{episode.duration} minutes</span>
                    <span className="text-gray-300">•</span>
                    <span className="capitalize">{episode.triggerType}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  {episode.engaged ? "Completed" : "Dismissed"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
