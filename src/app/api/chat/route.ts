import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "@/lib/claude/systemPrompt";
import { ChatRequest, BiometricContext, StreamEvent, ToolName, TOOL_NAMES } from "@/types/chat";

const anthropic = new Anthropic();

const EMPTY_INPUT_SCHEMA = {
  type: "object" as const,
  properties: {},
  required: [],
};

const TOOLS: Anthropic.Messages.Tool[] = [
  {
    name: "render_box_breathing",
    description:
      "Show an interactive box breathing animation. Use when you suggest a breathing exercise or the user accepts an offer to breathe together.",
    input_schema: EMPTY_INPUT_SCHEMA,
  },
  {
    name: "render_sensory_check",
    description:
      "Show an interactive 5-4-3-2-1 sensory grounding checklist. Use when guiding the user through naming things they can see, touch, hear, smell, and taste.",
    input_schema: EMPTY_INPUT_SCHEMA,
  },
  {
    name: "render_tipp_cold_water",
    description:
      "Show the TIPP cold-water technique card. Use when elevated heart rate suggests a fast physiological downshift may help, or when the user needs immediate vagal-nerve activation.",
    input_schema: EMPTY_INPUT_SCHEMA,
  },
  {
    name: "render_wall_push",
    description:
      "Show a timed wall-push / heavy-work exercise. Use when the user seems physically untethered, overwhelmed, or needs proprioceptive grounding through exertion.",
    input_schema: EMPTY_INPUT_SCHEMA,
  },
  {
    name: "render_butterfly_hug",
    description:
      "Show an animated butterfly hug bilateral stimulation guide. Use for calming rhythmic bilateral stimulation when the user needs gentle self-soothing.",
    input_schema: EMPTY_INPUT_SCHEMA,
  },
  {
    name: "render_category_anchor",
    description:
      "Show a category-naming cognitive anchor game. Use when physical movement is not ideal, or when the user needs a cognitive distraction to interrupt spiraling thoughts.",
    input_schema: EMPTY_INPUT_SCHEMA,
  },
];

function isToolName(name: string): name is ToolName {
  return TOOL_NAMES.includes(name as ToolName);
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

  biometricBlock += `\n\nYou have access to interactive grounding tools. Choose the most appropriate one based on the user's state:
- render_box_breathing: for guided breathing exercises
- render_sensory_check: for 5-4-3-2-1 sensory grounding
- render_tipp_cold_water: when a fast physiological downshift is needed (high HR)
- render_wall_push: when the user needs physical exertion to ground
- render_butterfly_hug: for gentle bilateral self-soothing
- render_category_anchor: for cognitive distraction when movement isn't ideal
Always include a brief accompanying message with the tool call. You may call multiple tools in one response if appropriate.`;

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
