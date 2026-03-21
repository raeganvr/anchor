"use client";

import { motion } from "motion/react";
import { Message } from "@/types/chat";

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

export default function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[80%] rounded-3xl px-6 py-4 ${
          isUser
            ? "bg-[#1F6B66] text-white"
            : "bg-white text-[#2C2C2C] shadow-sm"
        }`}
      >
        <p className="text-lg leading-relaxed whitespace-pre-wrap">
          {message.content || (isStreaming ? "…" : "")}
        </p>
      </div>
    </motion.div>
  );
}
