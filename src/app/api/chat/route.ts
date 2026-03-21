import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "@/lib/claude/systemPrompt";
import { ChatRequest } from "@/types/chat";

const anthropic = new Anthropic();

export async function POST(request: Request) {
  const { messages } = (await request.json()) as ChatRequest;

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages,
  });

  const readableStream = new ReadableStream({
    async start(controller) {
      stream.on("text", (text) => {
        controller.enqueue(new TextEncoder().encode(text));
      });

      stream.on("error", (error) => {
        console.error("Claude stream error:", error);
        controller.error(error);
      });

      await stream.finalMessage();
      controller.close();
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
