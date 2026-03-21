"use client";

import Link from "next/link";
import { motion } from "motion/react";

export function AlertScreen() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#1F6B66] px-6">
      <motion.div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="h-[300px] w-[300px] rounded-full border-2 border-white/20"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      <div className="relative z-10 max-w-md space-y-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="mb-6 text-4xl text-white">We noticed something</h1>
          <p className="text-xl text-white/90">
            Your heart rate has been elevated. Would you like help grounding?
          </p>
        </motion.div>

        <motion.div
          className="space-y-4 pt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Link
            href="/chat"
            className="block w-full rounded-full bg-white px-8 py-6 text-xl text-[#1F6B66] shadow-lg transition-transform active:scale-95"
          >
            Yes, help me
          </Link>
          <Link
            href="/"
            className="block w-full rounded-full border-2 border-white/40 bg-transparent px-8 py-6 text-xl text-white transition-transform active:scale-95"
          >
            I&apos;m okay
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
