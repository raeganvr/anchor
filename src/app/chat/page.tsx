"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Anchor } from "lucide-react";
import { useClaudeChat } from "@/hooks/useClaudeChat";
import { useBiometrics } from "@/hooks/useBiometrics";
import { BiometricContext } from "@/types/chat";
import MessageBubble from "@/components/chat/MessageBubble";
import { BoxBreathingWidget, SensoryChecklist } from "@/components/chat/GroundingPrompt";

export default function ChatPage() {
  const bio = useBiometrics();
  const biometricContext: BiometricContext = {
    currentHr: bio.currentHr,
    currentStress: bio.currentStress,
    baselineHr: bio.baseline.avgRestingHr,
    baselineStress: bio.baseline.avgStress,
    triggered: bio.triggerResult.triggered,
    triggerReason: bio.triggerResult.reason,
    simulationMode: bio.simulationMode,
  };
  const { messages, isLoading, sendMessage } = useClaudeChat();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bio.startMonitoring();
    return () => bio.stopMonitoring();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    void sendMessage(trimmed, biometricContext);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F7F5]">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Anchor size={24} strokeWidth={1.5} className="text-[#1F6B66]" />
              <div>
                <h1 className="text-lg font-medium text-[#2C2C2C]">Anchor</h1>
                <p className="text-sm text-gray-500">Grounding Companion</p>
              </div>
            </div>
            {bio.isMonitoring && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div
                  className={`h-2 w-2 rounded-full ${
                    bio.triggerResult.triggered
                      ? "bg-red-500 animate-pulse"
                      : bio.simulationMode === "pre_episode"
                        ? "bg-[#F4A261]"
                        : "bg-[#4CAF95]"
                  }`}
                />
                {bio.currentHr && <span>{bio.currentHr} bpm</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trigger banner */}
      {bio.triggerResult.triggered && (
        <div className="mx-6 mt-3 rounded-2xl bg-[#F4A261]/10 px-4 py-3 text-center text-sm text-[#C77B3B]">
          ⚠ Elevated biometrics detected — Anchor is here if you need it.
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-md space-y-4 pb-6">
          {messages.length === 0 && (
            <div className="mt-20 text-center">
              <Anchor size={40} strokeWidth={1} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg text-gray-400">Say hi to start a conversation.</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className="space-y-3">
              <MessageBubble
                message={msg}
                isStreaming={isLoading && i === messages.length - 1 && msg.role === "assistant"}
              />
              {msg.tools?.map((tool) => {
                if (tool === "render_box_breathing") return <BoxBreathingWidget key={`${i}-breathing`} />;
                if (tool === "render_sensory_check") return <SensoryChecklist key={`${i}-sensory`} />;
                return null;
              })}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-md flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={isLoading}
            className="flex-1 rounded-full bg-gray-100 px-6 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-[#1F6B66] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || input.trim().length === 0}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#1F6B66] text-white transition-transform active:scale-95 disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}
