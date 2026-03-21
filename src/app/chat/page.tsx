"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Home } from "lucide-react";
import { useClaudeChat } from "@/hooks/useClaudeChat";

export default function ChatPage() {
  const { messages, isLoading, sendMessage } = useClaudeChat();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    sendMessage(trimmed);
  };

  return (
    <div className="relative mx-auto flex h-screen max-w-2xl flex-col">
      <header className="p-4 border-b border-neutral-200 dark:border-neutral-800">
        <h1 className="text-lg font-semibold">⚓ Anchor</h1>
        <p className="text-sm text-neutral-500">Grounding Companion</p>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-center text-neutral-400 mt-20">
            Say hi to start a conversation.
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-neutral-100 dark:bg-neutral-800 text-foreground"
              }`}
            >
              {msg.content || (isLoading && i === messages.length - 1 ? "…" : "")}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <Link
        href="/"
        className="fixed bottom-28 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white text-[#1F6B66] shadow-md transition-transform hover:bg-[#F8F7F5] active:scale-95"
        aria-label="Back to home"
      >
        <Home size={24} strokeWidth={1.5} />
      </Link>

      <form onSubmit={handleSubmit} className="border-t border-neutral-200 p-4 dark:border-neutral-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-xl bg-blue-600 px-4 py-2 text-white font-medium disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
