// types/chat.ts
// Shared message types for the Claude chat integration.
// Message is the unit stored in episodes.chat_transcript (JSONB array).
// ChatRequest is the shape POSTed to /api/chat by the frontend.
// The chat implementation must conform to these so transcripts round-trip correctly.
export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  messages: Message[];
}