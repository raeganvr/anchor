"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";

type Phase = "ready" | "pushing" | "rest" | "done";

const PUSH_DURATION = 10;
const REST_DURATION = 5;
const TOTAL_SETS = 3;

export function WallPushCard() {
  const [phase, setPhase] = useState<Phase>("ready");
  const [seconds, setSeconds] = useState(PUSH_DURATION);
  const [set, setSet] = useState(0);

  const tick = useCallback(() => {
    setSeconds((prev) => {
      if (prev <= 1) {
        if (phase === "pushing") {
          const nextSet = set + 1;
          if (nextSet >= TOTAL_SETS) {
            setPhase("done");
            return 0;
          }
          setPhase("rest");
          return REST_DURATION;
        }
        if (phase === "rest") {
          setSet((s) => s + 1);
          setPhase("pushing");
          return PUSH_DURATION;
        }
      }
      return prev - 1;
    });
  }, [phase, set]);

  useEffect(() => {
    if (phase !== "pushing" && phase !== "rest") return;
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [phase, tick]);

  const totalDuration = phase === "pushing" ? PUSH_DURATION : REST_DURATION;
  const progress = phase === "pushing" || phase === "rest"
    ? (totalDuration - seconds) / totalDuration
    : 0;

  if (phase === "done") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-3xl bg-white p-6 shadow-sm text-center"
      >
        <p className="text-lg text-[#2C2C2C]">
          Three sets done. Feel that grounding energy. 💪
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
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100">
          <span className="text-sm">🧱</span>
        </div>
        <p className="text-sm font-medium text-gray-500">Wall Push</p>
      </div>

      {phase === "ready" && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-center text-lg text-[#2C2C2C]">
            Stand arm&apos;s length from a wall. Place both palms flat against it.
          </p>
          <p className="text-center text-sm text-gray-500">
            Push as hard as you can for 10 seconds, then rest. Three sets.
          </p>
          <button
            onClick={() => setPhase("pushing")}
            className="mt-2 rounded-full bg-amber-50 px-8 py-3 text-sm font-medium text-amber-800 transition-transform active:scale-95"
          >
            I&apos;m ready
          </button>
        </div>
      )}

      {(phase === "pushing" || phase === "rest") && (
        <div className="flex flex-col items-center gap-5">
          {/* Circular timer */}
          <div className="relative flex items-center justify-center h-32 w-32">
            <svg className="absolute inset-0 h-32 w-32 -rotate-90" viewBox="0 0 128 128">
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="#f3f4f6"
                strokeWidth="6"
              />
              <motion.circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke={phase === "pushing" ? "#f59e0b" : "#4CAF95"}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 56}
                initial={{ strokeDashoffset: 2 * Math.PI * 56 }}
                animate={{
                  strokeDashoffset: 2 * Math.PI * 56 * (1 - progress),
                }}
                transition={{ duration: 0.3 }}
              />
            </svg>
            <span className="text-3xl font-light text-[#2C2C2C]">
              {seconds}
            </span>
          </div>

          <motion.p
            key={phase}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl font-medium text-[#2C2C2C]"
          >
            {phase === "pushing" ? "Push!" : "Rest"}
          </motion.p>

          {/* Set indicators */}
          <div className="flex gap-2">
            {Array.from({ length: TOTAL_SETS }).map((_, i) => (
              <div
                key={i}
                className={`h-2.5 w-8 rounded-full transition-colors duration-300 ${
                  i < set
                    ? "bg-amber-500"
                    : i === set && phase === "pushing"
                      ? "bg-amber-500/50"
                      : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
