"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { Send, Anchor } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useClaudeChat } from "@/hooks/useClaudeChat";
import { useBiometrics } from "@/hooks/useBiometrics";
import { BiometricContext, ToolName } from "@/types/chat";
import MessageBubble from "@/components/chat/MessageBubble";
import {
  BoxBreathingWidget,
  SensoryChecklist,
} from "@/components/chat/GroundingPrompt";
import { TippColdWaterCard } from "@/components/chat/TippColdWaterCard";
import { WallPushCard } from "@/components/chat/WallPushCard";
import { ButterflyHugCard } from "@/components/chat/ButterflyHugCard";
import { CategoryAnchorCard } from "@/components/chat/CategoryAnchorCard";
import { BottomNav } from "@/components/BottomNav";

const TOOL_COMPONENTS: Record<ToolName, React.ComponentType> = {
  render_box_breathing: BoxBreathingWidget,
  render_sensory_check: SensoryChecklist,
  render_tipp_cold_water: TippColdWaterCard,
  render_wall_push: WallPushCard,
  render_butterfly_hug: ButterflyHugCard,
  render_category_anchor: CategoryAnchorCard,
};

export default function ChatPage() {
  return (
    <Suspense>
      <ChatPageInner />
    </Suspense>
  );
}

function ChatPageInner() {
  const searchParams = useSearchParams();
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
  const groundingSent = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bio.startMonitoring();
    return () => bio.stopMonitoring();
  }, []);

  useEffect(() => {
    if (searchParams.get("grounding") === "true" && !groundingSent.current) {
      groundingSent.current = true;
      void sendMessage("I need grounding", biometricContext);
    }
  }, [searchParams]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const lastMessage = messages[messages.length - 1];
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, lastMessage?.content, lastMessage?.tools?.length]);

  const resizeTextarea = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 150)}px`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    void sendMessage(trimmed, biometricContext);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  return (
    <div className="flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden bg-[#F8F7F5] pb-[88px]">
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

      {/* Messages — min-h-0 lets this flex child shrink so overflow-y-auto scrolls inside the viewport */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6">
        <div className="mx-auto max-w-md space-y-4 pb-6">
          {messages.length === 0 && (
            <div className="mt-20 text-center">
              <Anchor
                size={40}
                strokeWidth={1}
                className="mx-auto mb-4 text-gray-300"
              />
              <p className="text-lg text-gray-400">
                Say hi to start a conversation.
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className="space-y-3">
              <MessageBubble
                message={msg}
                isStreaming={
                  isLoading &&
                  i === messages.length - 1 &&
                  msg.role === "assistant"
                }
              />
              {msg.tools?.map((tool, j) => {
                const ToolComponent = TOOL_COMPONENTS[tool];
                return <ToolComponent key={`${tool}-${i}-${j}`} />;
              })}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-gray-200 bg-white px-6 py-3"
      >
        <div className="mx-auto max-w-md flex items-end gap-3 pb-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              resizeTextarea();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Type a message..."
            disabled={isLoading}
            className="flex-1 resize-none rounded-3xl bg-gray-100 px-6 py-4 text-lg leading-normal focus:outline-none focus:ring-2 focus:ring-[#1F6B66] disabled:opacity-50"
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

      <BottomNav />
    </div>
  );
}
