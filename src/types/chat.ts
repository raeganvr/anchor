export type ToolName = "render_box_breathing" | "render_sensory_check";

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
