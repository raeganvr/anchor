"use client";

import { motion } from "motion/react";
import { Message } from "@/types/chat";

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block h-2 w-2 rounded-full bg-gray-400"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </span>
  );
}

export default function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const showTyping = isStreaming && !message.content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[80%] min-w-0 rounded-3xl px-6 py-4 ${
          isUser
            ? "bg-[#1F6B66] text-white"
            : "bg-white text-[#2C2C2C] shadow-sm"
        }`}
      >
        {showTyping ? (
          <TypingDots />
        ) : (
          <p className="text-lg leading-relaxed whitespace-pre-wrap break-words" style={{ overflowWrap: "anywhere" }}>
            {message.content}
            {isStreaming && (
              <motion.span
                className="ml-0.5 inline-block h-5 w-[2px] translate-y-[3px] bg-[#1F6B66]"
                animate={{ opacity: [1, 1, 0, 0] }}
                transition={{ duration: 1, repeat: Infinity, times: [0, 0.49, 0.5, 1] }}
              />
            )}
          </p>
        )}
      </div>
    </motion.div>
  );
}
