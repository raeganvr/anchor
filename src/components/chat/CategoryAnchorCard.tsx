"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const CATEGORIES = [
  { prompt: "Name 3 dog breeds", emoji: "🐕", target: 3 },
  { prompt: "Name 4 colors you like", emoji: "🎨", target: 4 },
  { prompt: "Name 3 foods you enjoy", emoji: "🍎", target: 3 },
  { prompt: "Name 5 cities or towns", emoji: "🏙", target: 5 },
  { prompt: "Name 3 songs you know", emoji: "🎵", target: 3 },
  { prompt: "Name 4 things in your room", emoji: "🏠", target: 4 },
];

export function CategoryAnchorCard() {
  const [round, setRound] = useState(0);
  const [tapped, setTapped] = useState(0);
  const [done, setDone] = useState(false);

  const totalRounds = 3;
  const category = CATEGORIES[round % CATEGORIES.length];

  const handleTap = () => {
    const next = tapped + 1;
    if (next >= category.target) {
      if (round + 1 >= totalRounds) {
        setDone(true);
      } else {
        setTimeout(() => {
          setRound((r) => r + 1);
          setTapped(0);
        }, 400);
        setTapped(next);
      }
    } else {
      setTapped(next);
    }
  };

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-3xl bg-white p-6 shadow-sm text-center"
      >
        <p className="text-lg text-[#2C2C2C]">
          Three rounds done. Your mind shifted gears. 🧠
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
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-100">
          <span className="text-sm">🧠</span>
        </div>
        <p className="text-sm font-medium text-gray-500">Category Anchor</p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={round}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col items-center gap-4"
        >
          <span className="text-4xl">{category.emoji}</span>
          <p className="text-lg text-center font-medium text-[#2C2C2C]">
            {category.prompt}
          </p>

          {/* Tap counters */}
          <div className="flex gap-2">
            {Array.from({ length: category.target }).map((_, i) => (
              <motion.button
                key={i}
                onClick={i === tapped ? handleTap : undefined}
                disabled={i !== tapped}
                animate={{
                  scale: i === tapped ? [1, 1.1, 1] : 1,
                }}
                transition={{
                  repeat: i === tapped ? Infinity : 0,
                  duration: 1.5,
                }}
                className={`h-12 w-12 rounded-full text-sm font-medium transition-all duration-200 ${
                  i < tapped
                    ? "bg-teal-500 text-white"
                    : i === tapped
                      ? "bg-teal-100 text-teal-800 ring-2 ring-teal-400 ring-offset-2"
                      : "bg-gray-100 text-gray-400"
                }`}
              >
                {i < tapped ? "✓" : i + 1}
              </motion.button>
            ))}
          </div>

          <p className="text-sm text-gray-400">
            Tap each circle as you name one out loud
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Round progress */}
      <div className="flex gap-1.5 mt-5">
        {Array.from({ length: totalRounds }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              i < round
                ? "bg-teal-500"
                : i === round
                  ? "bg-teal-500/50"
                  : "bg-gray-200"
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
}
