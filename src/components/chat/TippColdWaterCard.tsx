"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const STEPS = [
  {
    title: "Get something cold",
    detail: "Ice pack, cold water, or frozen item",
    icon: "🧊",
  },
  {
    title: "Apply to face or hands",
    detail: "Hold against forehead, cheeks, or dip hands in cold water",
    icon: "🤲",
  },
  {
    title: "Hold for 30 seconds",
    detail: "Breathe normally — the cold activates your dive reflex",
    icon: "⏱",
  },
  {
    title: "Notice the shift",
    detail: "Your heart rate is already dropping. Stay with that feeling.",
    icon: "🌊",
  },
];

export function TippColdWaterCard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-3xl bg-white p-6 shadow-sm text-center"
      >
        <p className="text-lg text-[#2C2C2C]">
          Nice — the dive reflex is powerful. 🌊
        </p>
      </motion.div>
    );
  }

  const step = STEPS[currentStep];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl bg-white p-6 shadow-sm overflow-hidden"
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100">
          <span className="text-sm">❄️</span>
        </div>
        <p className="text-sm font-medium text-gray-500">TIPP — Cold Water</p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="mb-6"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-2xl">
              {step.icon}
            </div>
            <div>
              <p className="text-lg font-medium text-[#2C2C2C]">
                {step.title}
              </p>
              <p className="mt-1 text-sm text-gray-500">{step.detail}</p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Progress dots */}
      <div className="flex gap-1.5 mb-4">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              i < currentStep
                ? "bg-sky-500"
                : i === currentStep
                  ? "bg-sky-500/50"
                  : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      <button
        onClick={() => {
          if (currentStep < STEPS.length - 1) {
            setCurrentStep((s) => s + 1);
          } else {
            setDone(true);
          }
        }}
        className="w-full rounded-full bg-sky-50 py-3 text-sm font-medium text-sky-700 transition-transform active:scale-[0.98]"
      >
        {currentStep < STEPS.length - 1 ? "Next step" : "Done"}
      </button>

      <p className="mt-3 text-center text-xs text-gray-400">
        Stop if you feel any pain or discomfort from the cold.
      </p>
    </motion.div>
  );
}
