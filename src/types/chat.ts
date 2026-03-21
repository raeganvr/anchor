export type ToolName =
  | "render_box_breathing"
  | "render_sensory_check"
  | "render_tipp_cold_water"
  | "render_wall_push"
  | "render_butterfly_hug"
  | "render_category_anchor";

export const TOOL_NAMES: ToolName[] = [
  "render_box_breathing",
  "render_sensory_check",
  "render_tipp_cold_water",
  "render_wall_push",
  "render_butterfly_hug",
  "render_category_anchor",
];

export interface Message {
  role: "user" | "assistant";
  content: string;
  tools?: ToolName[];
}

export interface BiometricContext {
  currentHr: number | null;
  currentStress: number | null;
  baselineHr: number;
  baselineStress: number;
  triggered: boolean;
  triggerReason?: string;
  simulationMode: string;
}

export interface ChatRequest {
  messages: Message[];
  biometrics?: BiometricContext;
}

export type StreamEvent =
  | { type: "text"; delta: string }
  | { type: "tool"; name: ToolName }
  | { type: "done" };
