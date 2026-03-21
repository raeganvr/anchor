"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { Message, BiometricContext, StreamEvent, ToolName } from "@/types/chat";

function parseStreamEvents(chunk: string): StreamEvent[] {
  return chunk
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as StreamEvent);
}

function applyStreamEvent(
  event: StreamEvent,
  currentContent: string,
  currentTools: ToolName[]
) {
  if (event.type === "text") {
    return {
      content: currentContent + event.delta,
      tools: currentTools,
    };
  }

  if (event.type === "tool") {
    return {
      content: currentContent,
      tools: currentTools.includes(event.name) ? currentTools : [...currentTools, event.name],
    };
  }

  return {
    content: currentContent,
    tools: currentTools,
  };
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
}

type ChatAction =
  | { type: "appendUser"; message: Message }
  | { type: "startAssistant" }
  | { type: "updateAssistant"; content: string; tools: ToolName[] }
  | { type: "appendAssistant"; message: Message }
  | { type: "finishRequest" };

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "appendUser":
      return {
        ...state,
        messages: [...state.messages, action.message],
        isLoading: true,
      };
    case "startAssistant":
      return {
        ...state,
        messages: [...state.messages, { role: "assistant", content: "" }],
      };
    case "updateAssistant":
      return {
        ...state,
        messages: [
          ...state.messages.slice(0, -1),
          {
            role: "assistant",
            content: action.content,
            tools: action.tools.length > 0 ? action.tools : undefined,
          },
        ],
      };
    case "appendAssistant":
      return {
        ...state,
        messages: [...state.messages, action.message],
      };
    case "finishRequest":
      return {
        ...state,
        isLoading: false,
      };
    default:
      return state;
  }
}

const INITIAL_STATE: ChatState = {
  messages: [],
  isLoading: false,
};

export function useClaudeChat() {
  const [state, dispatch] = useReducer(chatReducer, INITIAL_STATE);
  const messagesRef = useRef(state.messages);

  useEffect(() => {
    messagesRef.current = state.messages;
  }, [state.messages]);

  const sendMessage = useCallback(async (content: string, biometrics?: BiometricContext) => {
    const userMessage: Message = { role: "user", content };
    const updatedMessages = [...messagesRef.current, userMessage];

    dispatch({ type: "appendUser", message: userMessage });

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages, biometrics }),
      });

      if (!response.ok) {
        throw new Error(`Chat request failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let assistantContent = "";
      let assistantTools: ToolName[] = [];

      dispatch({ type: "startAssistant" });

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          if (buffer.trim()) {
            const events = parseStreamEvents(buffer);
            for (const event of events) {
              const nextState = applyStreamEvent(event, assistantContent, assistantTools);
              assistantContent = nextState.content;
              assistantTools = nextState.tools;
            }
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        const events = parseStreamEvents(lines.join("\n"));

        for (const event of events) {
          const nextState = applyStreamEvent(event, assistantContent, assistantTools);
          assistantContent = nextState.content;
          assistantTools = nextState.tools;
        }

        dispatch({
          type: "updateAssistant",
          content: assistantContent,
          tools: assistantTools,
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
      dispatch({
        type: "appendAssistant",
        message: {
          role: "assistant",
          content: "I'm having trouble connecting right now. Take a slow breath — I'll be back in a moment.",
        },
      });
    } finally {
      dispatch({ type: "finishRequest" });
    }
  }, []);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    sendMessage,
  };
}
