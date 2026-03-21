import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "@/lib/claude/systemPrompt";
import { ChatRequest, BiometricContext, StreamEvent, ToolName } from "@/types/chat";

const anthropic = new Anthropic();

const TOOLS: Anthropic.Messages.Tool[] = [
  {
    name: "render_box_breathing",
    description:
      "Show an interactive box breathing animation to help the user physically ground themselves. Use this when you suggest breathing together, or when the user accepts an offer to do a breathing exercise.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "render_sensory_check",
    description:
      "Show an interactive 5-4-3-2-1 sensory grounding checklist. Use this when you guide the user through naming things they can see, touch, hear, smell, and taste.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
];

function isToolName(name: string): name is ToolName {
  return name === "render_box_breathing" || name === "render_sensory_check";
}

function buildSystemPrompt(biometrics?: BiometricContext): string {
  if (!biometrics || biometrics.currentHr === null) {
    return SYSTEM_PROMPT;
  }

  const {
    currentHr,
    currentStress,
    baselineHr,
    baselineStress,
    triggered,
    triggerReason,
  } = biometrics;

  let biometricBlock = `\n\nCURRENT BIOMETRIC STATE (do not share raw numbers with the user):
- Heart rate: ${currentHr} bpm (baseline: ${baselineHr} bpm)
- Stress level: ${currentStress} (baseline: ${baselineStress})`;

  if (triggered) {
    biometricBlock += `\n- ⚠ BIOMETRIC TRIGGER ACTIVE (reason: ${triggerReason}). The user's body is showing signs of elevated distress. Gently offer grounding — do not alarm them.`;
  }

  biometricBlock += `\n\nYou have access to interactive grounding tools. When you guide a breathing exercise, call render_box_breathing. When you guide a 5-4-3-2-1 sensory exercise, call render_sensory_check. Always include a brief accompanying message with the tool call.`;

  return SYSTEM_PROMPT + biometricBlock;
}

export async function POST(request: Request) {
  const { messages, biometrics } = (await request.json()) as ChatRequest;

  const stream = anthropic.messages.stream({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: buildSystemPrompt(biometrics),
    messages,
    tools: TOOLS,
  });

  const readableStream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const sendEvent = (event: StreamEvent) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      stream.on("text", (text) => {
        sendEvent({ type: "text", delta: text });
      });

      stream.on("contentBlock", (block) => {
        if (block.type === "tool_use" && isToolName(block.name)) {
          sendEvent({ type: "tool", name: block.name });
        }
      });

      stream.on("error", (error) => {
        console.error("Claude stream error:", error);
        controller.error(error);
      });

      await stream.finalMessage();
      sendEvent({ type: "done" });
      controller.close();
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
