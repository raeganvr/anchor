"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FloatingHomeButton } from "@/components/FloatingHomeButton";
import { Send } from "lucide-react";
import { useRouter } from "next/navigation";

interface Message {
  id: string;
  text: string;
  sender: "anchor" | "user";
}

const quickResponses = [
  "I'm still anxious",
  "That helped",
  "Keep going",
  "I need something else",
];

const groundingMessages = [
  "I'm here with you. Let's take this one step at a time.",
  "Can you name 5 things you can see around you?",
  "Good. Now, 4 things you can touch.",
  "You're doing great. 3 things you can hear.",
  "Almost there. 2 things you can smell.",
  "And 1 thing you can taste.",
  "Take a deep breath with me. In for 4... hold for 4... out for 4.",
  "You're safe. Your heart rate is coming down.",
];

export function GroundingScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "I'm here with you. Let's take this one step at a time.",
      sender: "anchor",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [heartRate, setHeartRate] = useState(108);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageIndexRef = useRef(1);
  const messageIdRef = useRef(1);
  const nextMessageId = () => {
    messageIdRef.current += 1;
    return String(messageIdRef.current);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setHeartRate((prev) => {
        if (prev > 75) {
          return prev - 1;
        }
        return prev;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addAnchorMessage = useCallback(() => {
    if (messageIndexRef.current < groundingMessages.length) {
      const newMessage: Message = {
        id: nextMessageId(),
        text: groundingMessages[messageIndexRef.current],
        sender: "anchor",
      };
      setMessages((prev) => [...prev, newMessage]);
      messageIndexRef.current += 1;
    } else {
      setTimeout(() => {
        router.push("/resolved");
      }, 1000);
    }
  }, [router]);

  const handleQuickResponse = (response: string) => {
    const userMessage: Message = {
      id: nextMessageId(),
      text: response,
      sender: "user",
    };
    setMessages((prev) => [...prev, userMessage]);

    setTimeout(() => {
      addAnchorMessage();
    }, 1500);
  };

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      const userMessage: Message = {
        id: nextMessageId(),
        text: inputValue,
        sender: "user",
      };
      setMessages((prev) => [...prev, userMessage]);
      setInputValue("");

      setTimeout(() => {
        addAnchorMessage();
      }, 1500);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-[#F8F7F5]">
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-md">
          <div className="text-center">
            <div className="mb-1 text-sm text-gray-500">Anchor is with you</div>
            <div className="flex items-center justify-center gap-3">
              <div
                className={`h-2 w-2 rounded-full ${
                  heartRate > 90 ? "bg-[#F4A261]" : "bg-[#4CAF95]"
                }`}
              />
              <div className="text-2xl text-[#2C2C2C]">{heartRate} BPM</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-md space-y-4 pb-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-3xl px-6 py-4 ${
                  message.sender === "anchor"
                    ? "bg-white text-[#2C2C2C] shadow-sm"
                    : "bg-[#1F6B66] text-white"
                }`}
              >
                <p className="text-lg leading-relaxed">{message.text}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <FloatingHomeButton bottomClassName="bottom-48" />

      <div className="border-t border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-md space-y-4">
          <div className="flex flex-wrap justify-center gap-2">
            {quickResponses.map((response) => (
              <button
                key={response}
                type="button"
                onClick={() => handleQuickResponse(response)}
                className="rounded-full bg-gray-100 px-5 py-3 text-base text-[#2C2C2C] transition-transform active:scale-95"
              >
                {response}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendMessage();
              }}
              placeholder="Type a message..."
              className="flex-1 rounded-full bg-gray-100 px-6 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-[#1F6B66]"
            />
            <button
              type="button"
              onClick={handleSendMessage}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#1F6B66] text-white transition-transform active:scale-95"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
