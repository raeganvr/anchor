"use client";

import Link from "next/link";
import { motion } from "motion/react";

export function ResolvedScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#F8F7F5] to-[#FBF6F0] px-6">
      <motion.div
        className="w-full max-w-md space-y-8 text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="space-y-4">
          <h1 className="text-5xl text-[#2C2C2C]">You did great</h1>

          <div className="pb-4 pt-6">
            <div className="rounded-3xl bg-white p-8 shadow-sm">
              <div className="space-y-3">
                <div className="text-base text-gray-500">This episode lasted</div>
                <div className="text-3xl text-[#2C2C2C]">6 minutes</div>
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-[#4CAF95]" />
                    <div className="text-base text-gray-600">
                      Your heart rate is back to normal
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Link
            href="/"
            className="block w-full rounded-full bg-[#1F6B66] px-8 py-6 text-xl text-white shadow-md transition-transform active:scale-95"
          >
            Back to home
          </Link>

          <button
            type="button"
            onClick={() => {
              window.alert("Journaling feature would open here");
            }}
            className="py-3 text-lg text-[#1F6B66]"
          >
            Add a note
          </button>
        </div>
      </motion.div>
    </div>
  );
}
