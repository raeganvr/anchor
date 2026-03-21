"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";

const TAPS_PER_CYCLE = 12;
const TOTAL_CYCLES = 3;
const TAP_INTERVAL_MS = 900;

export function ButterflyHugCard() {
  const [active, setActive] = useState(false);
  const [tap, setTap] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [done, setDone] = useState(false);

  const side: "left" | "right" = tap % 2 === 0 ? "left" : "right";

  useEffect(() => {
    if (!active || done) return;

    const id = setInterval(() => {
      setTap((prev) => {
        const next = prev + 1;
        if (next >= TAPS_PER_CYCLE) {
          setCycle((c) => {
            const nextCycle = c + 1;
            if (nextCycle >= TOTAL_CYCLES) {
              setDone(true);
              setActive(false);
            }
            return nextCycle;
          });
          return 0;
        }
        return next;
      });
    }, TAP_INTERVAL_MS);

    return () => clearInterval(id);
  }, [active, done]);

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-3xl bg-white p-6 shadow-sm text-center"
      >
        <p className="text-lg text-[#2C2C2C]">
          Beautiful. Three full cycles of bilateral soothing. 🦋
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl bg-white p-6 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-100">
          <span className="text-sm">🦋</span>
        </div>
        <p className="text-sm font-medium text-gray-500">Butterfly Hug</p>
      </div>

      {!active ? (
        <div className="flex flex-col items-center gap-4">
          <p className="text-center text-lg text-[#2C2C2C]">
            Cross your arms over your chest, fingertips below your collarbones.
          </p>
          <p className="text-center text-sm text-gray-500">
            Alternate tapping left and right, like butterfly wings. Follow the rhythm.
          </p>
          <button
            onClick={() => setActive(true)}
            className="mt-2 rounded-full bg-purple-50 px-8 py-3 text-sm font-medium text-purple-800 transition-transform active:scale-95"
          >
            Start tapping
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6">
          {/* Animated butterfly wings */}
          <div className="relative flex items-center justify-center h-36 w-48">
            {/* Left wing */}
            <motion.div
              animate={{
                scale: side === "left" ? 1.15 : 0.9,
                opacity: side === "left" ? 1 : 0.4,
              }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="absolute left-2 h-20 w-20 rounded-[2rem_0.5rem_2rem_0.5rem] bg-gradient-to-br from-purple-300 to-purple-500"
              style={{ transformOrigin: "right center" }}
            />
            {/* Right wing */}
            <motion.div
              animate={{
                scale: side === "right" ? 1.15 : 0.9,
                opacity: side === "right" ? 1 : 0.4,
              }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="absolute right-2 h-20 w-20 rounded-[0.5rem_2rem_0.5rem_2rem] bg-gradient-to-bl from-purple-300 to-purple-500"
              style={{ transformOrigin: "left center" }}
            />
            {/* Body */}
            <div className="relative z-10 h-16 w-3 rounded-full bg-purple-800" />
          </div>

          <motion.p
            key={side}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            className="text-xl font-medium text-[#2C2C2C] capitalize"
          >
            {side} tap
          </motion.p>

          {/* Cycle progress */}
          <div className="flex gap-2">
            {Array.from({ length: TOTAL_CYCLES }).map((_, i) => (
              <div key={i} className="flex gap-0.5">
                {Array.from({ length: 6 }).map((_, j) => {
                  const dotIndex = i * 6 + j;
                  const totalTapsDone = cycle * TAPS_PER_CYCLE + tap;
                  const dotsPerCycleDisplay = 6;
                  const currentDotInCycle = Math.floor(
                    (tap / TAPS_PER_CYCLE) * dotsPerCycleDisplay
                  );
                  const filled =
                    i < cycle || (i === cycle && j <= currentDotInCycle);
                  return (
                    <motion.div
                      key={dotIndex}
                      animate={{
                        backgroundColor: filled ? "#a855f7" : "#e5e7eb",
                      }}
                      className="h-1.5 w-1.5 rounded-full"
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
