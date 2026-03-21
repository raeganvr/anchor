"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";

const PHASES = [
  { label: "Breathe in", duration: 4 },
  { label: "Hold", duration: 4 },
  { label: "Breathe out", duration: 4 },
  { label: "Hold", duration: 4 },
] as const;

export function BoxBreathingWidget() {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [count, setCount] = useState<number>(PHASES[0].duration);
  const [cycles, setCycles] = useState(0);
  const [active, setActive] = useState(true);

  const phase = PHASES[phaseIndex];

  useEffect(() => {
    if (!active) return;

    const timer = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          setPhaseIndex((pi) => {
            const next = (pi + 1) % PHASES.length;
            if (next === 0) setCycles((c) => c + 1);
            return next;
          });
          return PHASES[(phaseIndex + 1) % PHASES.length].duration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [active, phaseIndex]);

  if (cycles >= 3 && !active) {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-sm text-center">
        <p className="text-lg text-[#2C2C2C]">Nice work. Three full cycles. 🌿</p>
      </div>
    );
  }

  const isInhale = phaseIndex === 0;
  const isExhale = phaseIndex === 2;
  const scale = isInhale ? 1.3 : isExhale ? 0.8 : phaseIndex === 1 ? 1.3 : 0.8;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl bg-white p-8 shadow-sm"
    >
      <div className="flex flex-col items-center gap-6">
        <p className="text-sm text-gray-500">Box Breathing</p>

        <div className="relative flex items-center justify-center h-32 w-32">
          <motion.div
            animate={{ scale }}
            transition={{ duration: phase.duration, ease: "easeInOut" }}
            className="h-20 w-20 rounded-full bg-[#1F6B66]/20"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-light text-[#1F6B66]">{count}</span>
          </div>
        </div>

        <p className="text-xl text-[#2C2C2C]">{phase.label}</p>

        <div className="flex gap-1.5">
          {PHASES.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-6 rounded-full transition-colors duration-300 ${
                i === phaseIndex ? "bg-[#1F6B66]" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {cycles >= 3 && (
          <button
            onClick={() => setActive(false)}
            className="mt-2 rounded-full bg-gray-100 px-5 py-2 text-sm text-[#2C2C2C] transition-transform active:scale-95"
          >
            I feel better
          </button>
        )}
      </div>
    </motion.div>
  );
}

interface SensoryStep {
  count: number;
  sense: string;
  emoji: string;
}

const SENSORY_STEPS: SensoryStep[] = [
  { count: 5, sense: "see", emoji: "👁" },
  { count: 4, sense: "touch", emoji: "✋" },
  { count: 3, sense: "hear", emoji: "👂" },
  { count: 2, sense: "smell", emoji: "👃" },
  { count: 1, sense: "taste", emoji: "👅" },
];

export function SensoryChecklist() {
  const [currentStep, setCurrentStep] = useState(0);
  const [checked, setChecked] = useState<boolean[][]>(
    SENSORY_STEPS.map((step) => Array(step.count).fill(false))
  );

  const step = SENSORY_STEPS[currentStep];
  const done = currentStep >= SENSORY_STEPS.length;

  const toggle = (itemIndex: number) => {
    setChecked((prev) => {
      const next = prev.map((arr) => [...arr]);
      next[currentStep][itemIndex] = !next[currentStep][itemIndex];

      if (next[currentStep].every(Boolean) && currentStep < SENSORY_STEPS.length - 1) {
        setTimeout(() => setCurrentStep((s) => s + 1), 600);
      } else if (next[currentStep].every(Boolean) && currentStep === SENSORY_STEPS.length - 1) {
        setTimeout(() => setCurrentStep(SENSORY_STEPS.length), 600);
      }

      return next;
    });
  };

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-3xl bg-white p-6 shadow-sm text-center"
      >
        <p className="text-lg text-[#2C2C2C]">All five senses grounded. You did great. 🌿</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl bg-white p-6 shadow-sm"
    >
      <p className="text-sm text-gray-500 mb-4">5-4-3-2-1 Grounding</p>

      <p className="text-lg text-[#2C2C2C] mb-4">
        {step.emoji} Name <strong>{step.count}</strong> thing{step.count > 1 ? "s" : ""} you can{" "}
        <strong>{step.sense}</strong>
      </p>

      <div className="flex flex-wrap gap-2">
        {checked[currentStep].map((isChecked, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            className={`h-10 w-10 rounded-full text-sm font-medium transition-all duration-200 active:scale-95 ${
              isChecked
                ? "bg-[#1F6B66] text-white"
                : "bg-gray-100 text-[#2C2C2C]"
            }`}
          >
            {isChecked ? "✓" : i + 1}
          </button>
        ))}
      </div>

      <div className="flex gap-1.5 mt-4">
        {SENSORY_STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              i < currentStep
                ? "bg-[#1F6B66]"
                : i === currentStep
                  ? "bg-[#1F6B66]/50"
                  : "bg-gray-200"
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
}
